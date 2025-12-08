import type { Express } from "express";
import type { Server } from "http";
import { isAuthenticated, setupAuth } from "./replitAuth";
import { storage } from "./storage";
import { AgentOrchestrator } from "./agents/orchestrator";
import { insertWebsiteSchema } from "@shared/schema";

export async function registerRoutes(server: Server, app: Express) {
  // Set up authentication
  await setupAuth(app);
  
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
}
