import type { Express } from "express";
import type { Server } from "http";
import express from "express";
import Stripe from "stripe";

import { isAuthenticated, setupAuth } from "./replitAuth";
import { setupGoogleAuth } from "./googleAuth";
import { setupLocalAuth } from "./localAuth";
import { storage } from "./storage";
import { AgentOrchestrator } from "./agents/orchestrator";
import { insertWebsiteSchema } from "@shared/schema";
import { stripeService } from "./stripeService";
import { getStripePublishableKey } from "./stripeClient";
import { generateFixVariants, analyzeRisk } from "./lib/ai";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const FREE_AUDIT_LIMIT = 5;
const PRO_AUDIT_LIMIT = 100;
const FREE_AUDIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const DEV_MODE = process.env.DEV_MODE === "true";
const OWNER_EMAIL = process.env.OWNER_EMAIL;

export async function registerRoutes(server: Server, app: Express) {
  // ------------------------------------------
  // RAW BODY FÜR STRIPE WEBHOOK
  // (muss vor dem Handler registriert werden)
  // ------------------------------------------
  app.use("/api/stripe/webhook", express.raw({ type: "application/json" }));

  // ------------------------------------------
  // PRO-MIDDLEWARE
  // ------------------------------------------
  function requirePro(req, res, next) {
    const tier = (req.user as any)?.subscriptionTier;
    if (tier !== "pro") {
      return res.status(403).json({ message: "Pro subscription required" });
    }
    next();
  }

  // ------------------------------------------
  // AUTH
  // ------------------------------------------
  await setupAuth(app);
  setupLocalAuth(app);
  setupGoogleAuth(app);

  // ------------------------------------------
  // USER INFO
  // ------------------------------------------
  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const user = await storage.getUser(userId);

      if (!user) return res.status(404).json({ message: "Not found" });

      res.json(user);
    } catch (err) {
      console.error("GET /api/auth/user error:", err);
      res.status(500).json({ message: "Internal error" });
    }
  });

  // ------------------------------------------
  // WEBSITES
  // ------------------------------------------
  app.get("/api/websites", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const websites = await storage.getWebsites(userId);
      res.json(websites);
    } catch (err) {
      console.error("GET /api/websites error:", err);
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post("/api/websites", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const parsed = insertWebsiteSchema.safeParse({ ...req.body, userId });

      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data" });
      }

      let url = parsed.data.url;
      if (!url.startsWith("http")) url = "https://" + url;

      const website = await storage.createWebsite({ ...parsed.data, url });
      res.json(website);
    } catch (err) {
      console.error("POST /api/websites error:", err);
      res.status(500).json({ message: "Create error" });
    }
  });

  app.delete("/api/websites/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const website = await storage.getWebsite(req.params.id);
      
      if (!website) {
        return res.status(404).json({ message: "Website nicht gefunden" });
      }
      
      if (website.userId !== userId) {
        return res.status(403).json({ message: "Keine Berechtigung" });
      }
      
      await storage.deleteWebsite(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error("DELETE /api/websites/:id error:", err);
      res.status(500).json({ message: "Löschfehler" });
    }
  });

  // ------------------------------------------
  // AUDITS
  // ------------------------------------------
  app.get("/api/audits", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const audits = await storage.getAudits(userId);
      res.json(audits);
    } catch (err) {
      console.error("GET /api/audits error:", err);
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.get("/api/audits/recent", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const audits = await storage.getRecentAudits(userId, 10);
      res.json(audits);
    } catch (err) {
      console.error("GET /api/audits/recent error:", err);
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post("/api/audits", isAuthenticated, async (req, res) => {
    try {
      const { websiteId } = req.body;
      if (!websiteId) {
        return res.status(400).json({ message: "Website ID required" });
      }

      const userId = (req.user as any)?.claims?.sub;
      const user = await storage.getUser(userId);

      const isOwnerUser = user?.isOwner || (OWNER_EMAIL && user?.email === OWNER_EMAIL);
      const bypassLimits = DEV_MODE || isOwnerUser;

      if (!bypassLimits) {
        const isPro = user?.subscriptionTier === "pro";
        
        if (isPro) {
          const allAudits = await storage.getAllUserAudits(userId);
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const auditsThisMonth = allAudits.filter((a) => {
            if (!a.createdAt) return false;
            return new Date(a.createdAt) >= startOfMonth;
          }).length;

          if (auditsThisMonth >= PRO_AUDIT_LIMIT) {
            return res.status(403).json({ message: "PRO-Audit-Limit für diesen Monat erreicht." });
          }
        } else {
          const lastFree = user?.lastFreeAuditAt;
          if (lastFree) {
            const elapsed = Date.now() - new Date(lastFree).getTime();
            if (elapsed < FREE_AUDIT_WINDOW_MS) {
              const hoursLeft = Math.ceil((FREE_AUDIT_WINDOW_MS - elapsed) / (60 * 60 * 1000));
              return res.status(403).json({ 
                message: `Dein nächster kostenloser Audit ist in ${hoursLeft} Stunde(n) verfügbar. Upgrade auf PRO für unbegrenzte Audits.` 
              });
            }
          }
        }
      }

      const website = await storage.getWebsite(websiteId);
      if (!website || !website.isActive) return res.status(404).json({ message: "Website nicht gefunden" });

      const audit = await storage.createAudit({
        websiteId,
        status: "pending",
      });

      if (!bypassLimits && user?.subscriptionTier !== "pro") {
        await (storage as any).updateLastFreeAuditAt(userId);
      }

      const orchestrator = new AgentOrchestrator(audit.id, websiteId);
      orchestrator.runAudit(website.url).catch(console.error);

      res.json({ auditId: audit.id, status: "running" });
    } catch (err) {
      console.error("POST /api/audits error:", err);
      res.status(500).json({ message: "Audit error" });
    }
  });

  app.get("/api/audits/:id", isAuthenticated, async (req, res) => {
    try {
      const audit = await storage.getAudit(req.params.id);
      if (!audit) {
        return res.status(404).json({ message: "Audit nicht gefunden" });
      }
      res.json(audit);
    } catch (err) {
      console.error("GET /api/audits/:id error:", err);
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.get("/api/audits/:id/report", isAuthenticated, async (req, res) => {
    try {
      const audit = await storage.getAudit(req.params.id);
      if (!audit) {
        return res.status(404).json({ message: "Audit nicht gefunden" });
      }
      
      const website = await storage.getWebsite(audit.websiteId);
      const issues = await storage.getIssues(audit.id);
      
      const fixedCount = issues.filter(i => i.status === 'fixed' || i.status === 'auto_fixed').length;
      const pendingCount = issues.filter(i => i.status === 'pending' || i.status === 'approved').length;
      const topIssues = issues
        .filter(i => i.severity === 'critical' || i.severity === 'high')
        .slice(0, 5);
      
      const report = {
        audit: { ...audit, website },
        scoreBefore: audit.scoreBefore || 0,
        scoreAfter: audit.scoreAfter || audit.score || 0,
        totalIssues: issues.length,
        fixedCount,
        pendingCount,
        topIssues,
        allIssues: issues,
        imageStats: null,
      };
      
      res.json(report);
    } catch (err) {
      console.error("GET /api/audits/:id/report error:", err);
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post(
    "/api/audits/:id/auto-fix",
    isAuthenticated,
    requirePro,
    async (req, res) => {
      try {
        const audit = await storage.getAudit(req.params.id);
        if (!audit) return res.status(404).json({ message: "Not found" });

        const orchestrator = new AgentOrchestrator(audit.id, audit.websiteId);
        const fixed = await orchestrator.autoFixIssues();

        res.json({ fixed });
      } catch (err) {
        console.error("POST /api/audits/:id/auto-fix error:", err);
        res.status(500).json({ message: "Fix error" });
      }
    }
  );

  // ------------------------------------------
  // ISSUES / PENDING
  // ------------------------------------------
  app.get("/api/issues/pending", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const issues = await storage.getPendingIssues(userId);
      res.json(issues);
    } catch (err) {
      console.error("GET /api/issues/pending error:", err);
      res.status(500).json({ message: "Internal error" });
    }
  });

  // ------------------------------------------
  // AI FIX PROPOSALS
  // ------------------------------------------
  app.post("/api/issues/:id/fix", isAuthenticated, async (req, res) => {
    try {
      const issue = await storage.getIssue(req.params.id);
      if (!issue) return res.status(404).json({ message: "Not found" });

      const risk = analyzeRisk(issue);
      const fixes = generateFixVariants(issue);

      await storage.updateIssue(req.params.id, {
        aiFixProposalSafe: fixes.safeFix,
        aiFixProposalRecommended: fixes.recommendedFix,
        aiFixProposalAggressive: fixes.aggressiveFix,
        riskLevel: risk.level,
      });

      res.json({
        success: true,
        safeFix: fixes.safeFix,
        recommendedFix: fixes.recommendedFix,
        aggressiveFix: fixes.aggressiveFix,
        riskLevel: risk.level,
      });
    } catch (err) {
      console.error("POST /api/issues/:id/fix error:", err);
      res.status(500).json({ message: "Fix error" });
    }
  });

  // ------------------------------------------
  // AGENT LOGS (für Dashboard)
  // ------------------------------------------
  app.get("/api/agent-logs/recent", isAuthenticated, async (req, res) => {
    try {
      const logs = await storage.getRecentAgentLogs(20);
      res.json(logs);
    } catch (err) {
      console.error("GET /api/agent-logs/recent error:", err);
      res.status(500).json({ message: "Internal error" });
    }
  });

  // ------------------------------------------
  // BILLING
  // ------------------------------------------
  app.get("/api/stripe/key", (req, res) => {
    res.json({ publishableKey: getStripePublishableKey() });
  });

  app.post(
    "/api/stripe/create-checkout-session",
    isAuthenticated,
    async (req, res) => {
      try {
        const userId = (req.user as any)?.claims?.sub;

        const customer = await stripeService.createCustomer(
          (req.user as any).email,
          userId
        );

        const session = await stripeService.createCheckoutSession(
          customer.id,
          req.body.priceId,
          req.body.successUrl,
          req.body.cancelUrl
        );

        res.json({ url: session.url });
      } catch (err) {
        console.error("POST /api/stripe/create-checkout-session error:", err);
        res.status(500).json({ message: "Checkout error" });
      }
    }
  );

  // ------------------------------------------
  // STRIPE WEBHOOK
  // ------------------------------------------
  app.post("/api/stripe/webhook", async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig!,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error("Webhook signature failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription: any = event.data.object;
      await storage.updateUserByStripeCustomer(subscription.customer, {
        subscriptionTier: "free",
        subscriptionStatus: "expired",
      });
      console.log("❌ Subscription ended:", subscription.customer);
    }

    if (event.type === "customer.subscription.updated") {
      const subscription: any = event.data.object;
      const isActive = subscription.status === "active";

      await storage.updateUserByStripeCustomer(subscription.customer, {
        subscriptionTier: isActive ? "pro" : "free",
        subscriptionStatus: isActive ? "active" : "expired",
      });
      console.log("🔄 Subscription updated:", subscription.customer, isActive);
    }

    res.json({ received: true });
  });
} // END registerRoutes