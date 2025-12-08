import type { Express } from "express";
import type { Server } from "http";
import { isAuthenticated, setupAuth } from "./replitAuth";
import { setupLocalAuth } from "./localAuth";
import { storage } from "./storage";
import { AgentOrchestrator } from "./agents/orchestrator";
import { insertWebsiteSchema } from "@shared/schema";
import { stripeService } from "./stripeService";
import { getStripePublishableKey } from "./stripeClient";
import { generateFixVariants, analyzeRisk, prioritizeIssues, estimateSeoScoreBefore, estimateSeoScoreAfter } from "./lib/ai";

const FREE_AUDIT_LIMIT = 5;
const PRO_AUDIT_LIMIT = 100;

export async function registerRoutes(server: Server, app: Express) {
  // Set up authentication (Replit OIDC)
  await setupAuth(app);
  
  // Set up local authentication (Email/Password)
  setupLocalAuth(app);
  
  // Get current user
  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Website routes
  app.get("/api/websites", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const websites = await storage.getWebsites(userId);
      res.json(websites);
    } catch (error) {
      console.error("Error fetching websites:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/websites/:id", isAuthenticated, async (req, res) => {
    try {
      const website = await storage.getWebsite(req.params.id);
      if (!website) {
        return res.status(404).json({ message: "Website not found" });
      }
      res.json(website);
    } catch (error) {
      console.error("Error fetching website:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/websites", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      
      const parsed = insertWebsiteSchema.safeParse({
        ...req.body,
        userId,
      });
      
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }

      // Normalize URL
      let url = parsed.data.url;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }
      
      const website = await storage.createWebsite({
        ...parsed.data,
        url,
      });
      
      res.status(201).json(website);
    } catch (error) {
      console.error("Error creating website:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/websites/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteWebsite(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting website:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Audit routes
  app.get("/api/audits", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const audits = await storage.getAudits(userId);
      res.json(audits);
    } catch (error) {
      console.error("Error fetching audits:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/audits/recent", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const audits = await storage.getRecentAudits(userId, 10);
      res.json(audits);
    } catch (error) {
      console.error("Error fetching recent audits:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/audits/:id", isAuthenticated, async (req, res) => {
    try {
      const audit = await storage.getAudit(req.params.id);
      if (!audit) {
        return res.status(404).json({ message: "Audit not found" });
      }
      res.json(audit);
    } catch (error) {
      console.error("Error fetching audit:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/audits/:id/issues", isAuthenticated, async (req, res) => {
    try {
      const issues = await storage.getIssues(req.params.id);
      res.json(issues);
    } catch (error) {
      console.error("Error fetching issues:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/audits/:id/logs", isAuthenticated, async (req, res) => {
    try {
      const logs = await storage.getAuditAgentLogs(req.params.id);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/audits", isAuthenticated, async (req, res) => {
    try {
      const { websiteId } = req.body;
      
      if (!websiteId) {
        return res.status(400).json({ message: "Website ID is required" });
      }
      
      const website = await storage.getWebsite(websiteId);
      if (!website) {
        return res.status(404).json({ message: "Website not found" });
      }
      
      // Create the audit
      const audit = await storage.createAudit({
        websiteId,
        status: "pending",
      });
      
      // Start the audit in the background
      const orchestrator = new AgentOrchestrator(audit.id, websiteId);
      orchestrator.runAudit(website.url).catch(console.error);
      
      res.status(201).json(audit);
    } catch (error) {
      console.error("Error creating audit:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/audits/:id/auto-fix", isAuthenticated, async (req, res) => {
    try {
      const audit = await storage.getAudit(req.params.id);
      if (!audit) {
        return res.status(404).json({ message: "Audit not found" });
      }
      
      const orchestrator = new AgentOrchestrator(audit.id, audit.websiteId);
      const fixedCount = await orchestrator.autoFixIssues();
      
      res.json({ fixedCount });
    } catch (error) {
      console.error("Error auto-fixing:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Issue routes
  app.get("/api/issues/pending", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const issues = await storage.getPendingIssues(userId);
      res.json(issues);
    } catch (error) {
      console.error("Error fetching pending issues:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/issues/:id/approve", isAuthenticated, async (req, res) => {
    try {
      const issue = await storage.getIssue(req.params.id);
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }
      
      // Update issue status
      await storage.updateIssue(req.params.id, {
        status: "approved",
      });
      
      // Create change record
      await storage.createChange({
        issueId: issue.id,
        websiteId: issue.websiteId,
        changeType: issue.issueType,
        pageUrl: issue.pageUrl,
        beforeValue: issue.currentValue || undefined,
        afterValue: issue.suggestedValue || undefined,
        status: "pending",
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error approving issue:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/issues/:id/reject", isAuthenticated, async (req, res) => {
    try {
      await storage.updateIssue(req.params.id, {
        status: "rejected",
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error rejecting issue:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Change routes
  app.get("/api/changes", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const changes = await storage.getChanges(userId);
      res.json(changes);
    } catch (error) {
      console.error("Error fetching changes:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Agent log routes
  app.get("/api/agent-logs", isAuthenticated, async (req, res) => {
    try {
      const logs = await storage.getAgentLogs(100);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching agent logs:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/agent-logs/recent", isAuthenticated, async (req, res) => {
    try {
      const logs = await storage.getRecentAgentLogs(20);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching recent agent logs:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Issue fix variants generation
  app.post("/api/issues/:id/fix", isAuthenticated, async (req, res) => {
    try {
      const issue = await storage.getIssue(req.params.id);
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }

      const riskAnalysis = analyzeRisk(issue);
      const fixVariants = generateFixVariants(issue);

      await storage.updateIssue(req.params.id, {
        aiFixProposalSafe: fixVariants.safeFix,
        aiFixProposalRecommended: fixVariants.recommendedFix,
        aiFixProposalAggressive: fixVariants.aggressiveFix,
        confidenceScore: fixVariants.confidenceScore,
        riskLevel: riskAnalysis.risk,
        riskExplanation: riskAnalysis.riskExplanation,
      });

      res.json({
        ...issue,
        ...fixVariants,
        ...riskAnalysis,
      });
    } catch (error) {
      console.error("Error generating fix variants:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Confirm fix with chosen variant
  app.post("/api/issues/:id/confirm-fix", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.subscriptionTier !== "pro") {
        return res.status(403).json({ message: "Pro subscription required for auto-fix" });
      }

      const { variant } = req.body;
      if (!variant || !["safe", "recommended", "aggressive"].includes(variant)) {
        return res.status(400).json({ message: "Invalid fix variant" });
      }

      const issue = await storage.getIssue(req.params.id);
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }

      let afterValue = issue.suggestedValue;
      if (variant === "safe") afterValue = issue.aiFixProposalSafe || issue.suggestedValue;
      if (variant === "recommended") afterValue = issue.aiFixProposalRecommended || issue.suggestedValue;
      if (variant === "aggressive") afterValue = issue.aiFixProposalAggressive || issue.suggestedValue;

      await storage.updateIssue(req.params.id, {
        status: "fixed",
        chosenFixVariant: variant,
        fixedAt: new Date(),
      });

      await storage.createChange({
        issueId: issue.id,
        websiteId: issue.websiteId,
        changeType: issue.issueType,
        pageUrl: issue.pageUrl,
        beforeValue: issue.currentValue || undefined,
        afterValue: afterValue || undefined,
        status: "applied",
      });

      const allIssues = await storage.getIssues(issue.auditId);
      const scoreAfter = estimateSeoScoreAfter(allIssues);
      await storage.updateAudit(issue.auditId, { scoreAfter });

      res.json({ success: true, scoreAfter });
    } catch (error) {
      console.error("Error confirming fix:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Report data endpoint
  app.get("/api/audits/:id/report", isAuthenticated, async (req, res) => {
    try {
      const audit = await storage.getAudit(req.params.id);
      if (!audit) {
        return res.status(404).json({ message: "Audit not found" });
      }

      const issues = await storage.getIssues(req.params.id);
      const prioritized = prioritizeIssues(issues);
      const fixedCount = issues.filter(i => i.status === "fixed" || i.status === "auto_fixed").length;
      const pendingCount = issues.filter(i => i.status === "pending").length;

      const imageIssueTypes = [
        "oversized_images", "png_to_webp", "oversized_dimensions", "images_missing_alt", 
        "missing_lazy_loading", "duplicate_images", "poor_compression",
        "oversized_file", "png_should_be_webp", "missing_alt", "duplicate_image", "no_lazy_loading"
      ];
      const imageIssues = issues.filter(i => imageIssueTypes.includes(i.issueType));
      
      let imageStats = null;
      if (audit.crawlData && Array.isArray(audit.crawlData)) {
        let totalImages = 0;
        let imagesWithIssues = 0;
        let totalOriginalSize = 0;
        
        for (const page of audit.crawlData as any[]) {
          if (page.imagesDetailed && Array.isArray(page.imagesDetailed)) {
            for (const img of page.imagesDetailed) {
              totalImages++;
              if (img.fileSize) {
                totalOriginalSize += img.fileSize;
              }
              if (img.issues && img.issues.length > 0) {
                imagesWithIssues++;
              }
            }
          }
        }
        
        if (totalImages > 0) {
          const potentialSavingsPercent = imagesWithIssues > 0 
            ? Math.min(50, (imagesWithIssues / totalImages) * 40)
            : 0;
          
          imageStats = {
            totalImages,
            imagesWithIssues,
            totalOriginalSizeKB: Math.round(totalOriginalSize / 1024),
            potentialSavingsPercent: Math.round(potentialSavingsPercent),
            estimatedSavingsKB: Math.round((totalOriginalSize * potentialSavingsPercent / 100) / 1024),
            imageIssuesCount: imageIssues.length,
          };
        }
      }

      res.json({
        audit,
        scoreBefore: audit.scoreBefore || estimateSeoScoreBefore(issues),
        scoreAfter: audit.scoreAfter || estimateSeoScoreAfter(issues),
        totalIssues: issues.length,
        fixedCount,
        pendingCount,
        topIssues: prioritized.slice(0, 3),
        allIssues: prioritized,
        imageStats,
      });
    } catch (error) {
      console.error("Error fetching report:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Draft routes for optimization proposals
  app.get("/api/drafts", isAuthenticated, async (req, res) => {
    try {
      const { websiteId, auditId } = req.query;
      
      if (auditId) {
        const drafts = await storage.getDrafts(auditId as string);
        return res.json(drafts);
      }
      
      if (websiteId) {
        const drafts = await storage.getDraftsByWebsite(websiteId as string);
        return res.json(drafts);
      }
      
      return res.status(400).json({ message: "websiteId or auditId required" });
    } catch (error) {
      console.error("Error fetching drafts:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/drafts/pending", isAuthenticated, async (req, res) => {
    try {
      const { websiteId } = req.query;
      
      if (!websiteId) {
        return res.status(400).json({ message: "websiteId required" });
      }
      
      const drafts = await storage.getPendingDrafts(websiteId as string);
      res.json(drafts);
    } catch (error) {
      console.error("Error fetching pending drafts:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/drafts/:id", isAuthenticated, async (req, res) => {
    try {
      const draft = await storage.getDraft(req.params.id);
      if (!draft) {
        return res.status(404).json({ message: "Draft not found" });
      }
      res.json(draft);
    } catch (error) {
      console.error("Error fetching draft:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/drafts/:id/approve", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const draft = await storage.getDraft(req.params.id);
      if (!draft) {
        return res.status(404).json({ message: "Draft not found" });
      }
      
      // Ownership validation
      const website = await storage.getWebsite(draft.websiteId);
      if (!website || website.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to approve this draft" });
      }
      
      const approved = await storage.approveDraft(req.params.id);
      res.json(approved);
    } catch (error) {
      console.error("Error approving draft:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/drafts/:id/reject", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const draft = await storage.getDraft(req.params.id);
      if (!draft) {
        return res.status(404).json({ message: "Draft not found" });
      }
      
      // Ownership validation
      const website = await storage.getWebsite(draft.websiteId);
      if (!website || website.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to reject this draft" });
      }
      
      const rejected = await storage.rejectDraft(req.params.id);
      res.json(rejected);
    } catch (error) {
      console.error("Error rejecting draft:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/drafts/:id/apply", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.subscriptionTier !== "pro") {
        return res.status(403).json({ message: "Pro subscription required to apply drafts" });
      }

      const draft = await storage.getDraft(req.params.id);
      if (!draft) {
        return res.status(404).json({ message: "Draft not found" });
      }
      
      // Ownership validation
      const website = await storage.getWebsite(draft.websiteId);
      if (!website || website.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to apply this draft" });
      }
      
      if (draft.status !== "approved") {
        return res.status(400).json({ message: "Draft must be approved before applying" });
      }

      const applied = await storage.applyDraft(req.params.id);
      
      if (draft.issueId) {
        await storage.updateIssue(draft.issueId, {
          status: "fixed",
          fixedAt: new Date(),
          chosenFixVariant: draft.selectedProposal as "safe" | "recommended" | "aggressive" | null,
        });
      }

      res.json(applied);
    } catch (error) {
      console.error("Error applying draft:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/drafts/:id/select-mode", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { mode } = req.body;
      if (!mode || !["safe", "balanced", "aggressive"].includes(mode)) {
        return res.status(400).json({ message: "Invalid mode. Must be safe, balanced, or aggressive." });
      }

      const draft = await storage.getDraft(req.params.id);
      if (!draft) {
        return res.status(404).json({ message: "Draft not found" });
      }
      
      // Ownership validation
      const website = await storage.getWebsite(draft.websiteId);
      if (!website || website.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to modify this draft" });
      }

      const updated = await storage.updateDraft(req.params.id, { selectedProposal: mode });
      res.json(updated);
    } catch (error) {
      console.error("Error updating draft mode:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/drafts/bulk-approve", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const { draftIds } = req.body;
      if (!Array.isArray(draftIds) || draftIds.length === 0) {
        return res.status(400).json({ message: "draftIds array required" });
      }

      // Ownership validation for all drafts
      for (const draftId of draftIds) {
        const draft = await storage.getDraft(draftId);
        if (!draft) continue;
        const website = await storage.getWebsite(draft.websiteId);
        if (!website || website.userId !== userId) {
          return res.status(403).json({ message: "Not authorized to approve one or more drafts" });
        }
      }

      const approvedCount = await storage.bulkApproveDrafts(draftIds);
      res.json({ approvedCount });
    } catch (error) {
      console.error("Error bulk approving drafts:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/drafts/bulk-apply", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.subscriptionTier !== "pro") {
        return res.status(403).json({ message: "Pro subscription required to apply drafts" });
      }

      const { draftIds } = req.body;
      if (!Array.isArray(draftIds) || draftIds.length === 0) {
        return res.status(400).json({ message: "draftIds array required" });
      }

      // Ownership validation for all drafts
      for (const draftId of draftIds) {
        const draft = await storage.getDraft(draftId);
        if (!draft) continue;
        const website = await storage.getWebsite(draft.websiteId);
        if (!website || website.userId !== userId) {
          return res.status(403).json({ message: "Not authorized to apply one or more drafts" });
        }
      }

      const appliedCount = await storage.bulkApplyDrafts(draftIds);
      res.json({ appliedCount });
    } catch (error) {
      console.error("Error bulk applying drafts:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Audit with optimization mode
  app.post("/api/audits/with-mode", isAuthenticated, async (req, res) => {
    try {
      const { websiteId, optimizationMode } = req.body;
      
      if (!websiteId) {
        return res.status(400).json({ message: "Website ID is required" });
      }
      
      const mode = optimizationMode || "balanced";
      if (!["safe", "balanced", "aggressive"].includes(mode)) {
        return res.status(400).json({ message: "Invalid optimization mode" });
      }
      
      const website = await storage.getWebsite(websiteId);
      if (!website) {
        return res.status(404).json({ message: "Website not found" });
      }
      
      const audit = await storage.createAudit({
        websiteId,
        status: "pending",
        optimizationMode: mode,
      });
      
      const orchestrator = new AgentOrchestrator(audit.id, websiteId, mode);
      orchestrator.runAudit(website.url).catch(console.error);
      
      res.status(201).json(audit);
    } catch (error) {
      console.error("Error creating audit with mode:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Website optimization preferences
  app.patch("/api/websites/:id/preferences", isAuthenticated, async (req, res) => {
    try {
      const { optimizationMode, autoApplyEnabled } = req.body;
      
      const updateData: Record<string, any> = {};
      
      if (optimizationMode && ["safe", "balanced", "aggressive"].includes(optimizationMode)) {
        updateData.optimizationMode = optimizationMode;
      }
      
      if (typeof autoApplyEnabled === "boolean") {
        updateData.autoApplyEnabled = autoApplyEnabled;
      }
      
      const updated = await storage.updateWebsite(req.params.id, updateData);
      if (!updated) {
        return res.status(404).json({ message: "Website not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating website preferences:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Audit draft stats
  app.get("/api/audits/:id/drafts", isAuthenticated, async (req, res) => {
    try {
      const drafts = await storage.getDrafts(req.params.id);
      
      const stats = {
        total: drafts.length,
        pending: drafts.filter(d => d.status === "pending").length,
        approved: drafts.filter(d => d.status === "approved").length,
        applied: drafts.filter(d => d.status === "applied").length,
        rejected: drafts.filter(d => d.status === "rejected").length,
      };

      res.json({ drafts, stats });
    } catch (error) {
      console.error("Error fetching audit drafts:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Auto-apply drafts endpoint
  app.post("/api/audits/:id/auto-apply-drafts", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || user.subscriptionTier !== "pro") {
        return res.status(403).json({ message: "Pro subscription required for auto-apply" });
      }

      const audit = await storage.getAudit(req.params.id);
      if (!audit) {
        return res.status(404).json({ message: "Audit not found" });
      }
      
      const mode = audit.optimizationMode || "balanced";
      const orchestrator = new AgentOrchestrator(audit.id, audit.websiteId, mode);
      const appliedCount = await orchestrator.autoApplyDrafts();
      
      res.json({ appliedCount });
    } catch (error) {
      console.error("Error auto-applying drafts:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Stripe routes
  app.get("/api/stripe/config", async (req, res) => {
    const isConfigured = !!process.env.STRIPE_PRO_PRICE_ID;
    res.json({ 
      isConfigured,
      message: isConfigured ? null : "Stripe ist noch nicht konfiguriert. Bitte STRIPE_PRO_PRICE_ID setzen."
    });
  });

  app.get("/api/stripe/publishable-key", async (req, res) => {
    try {
      const key = await getStripePublishableKey();
      res.json({ publishableKey: key });
    } catch (error) {
      console.error("Error fetching Stripe key:", error);
      res.status(500).json({ message: "Stripe not configured" });
    }
  });

  app.post("/api/stripe/create-checkout-session", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { plan } = req.body;
      if (plan !== "pro") {
        return res.status(400).json({ message: "Invalid plan" });
      }

      const proPriceId = process.env.STRIPE_PRO_PRICE_ID;
      if (!proPriceId) {
        return res.status(500).json({ 
          message: "Stripe Pro-Preis nicht konfiguriert. Bitte STRIPE_PRO_PRICE_ID in den Umgebungsvariablen setzen." 
        });
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripeService.createCustomer(user.email || "", user.id);
        await storage.updateUserSubscription(user.id, { stripeCustomerId: customer.id });
        customerId = customer.id;
      }

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const session = await stripeService.createCheckoutSession(
        customerId,
        proPriceId,
        `${baseUrl}/dashboard?success=true`,
        `${baseUrl}/pricing?canceled=true`
      );

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ message: error?.message || "Fehler beim Erstellen der Checkout-Session" });
    }
  });

  app.post("/api/stripe/customer-portal", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const user = await storage.getUser(userId);
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ message: "No subscription found" });
      }

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const session = await stripeService.createCustomerPortalSession(
        user.stripeCustomerId,
        `${baseUrl}/settings`
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/subscription", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const user = await storage.getUser(userId);
      
      res.json({
        tier: user?.subscriptionTier || "free",
        status: user?.subscriptionStatus || "active",
        currentPeriodEnd: user?.currentPeriodEnd,
        auditCount: user?.auditCount || 0,
        auditLimit: user?.subscriptionTier === "pro" ? PRO_AUDIT_LIMIT : FREE_AUDIT_LIMIT,
      });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}
