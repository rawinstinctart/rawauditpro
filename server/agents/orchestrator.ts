import { storage } from "../storage";
import { crawlWebsite } from "./crawler";
import { analyzePageSEO, calculateHealthScore } from "./seoAnalyzer";
import { generateAIImprovement, generateAgentThought } from "./aiEngine";
import type { AgentType, CrawlResult, SEOIssue } from "./types";
import type { Audit } from "@shared/schema";

export class AgentOrchestrator {
  private auditId: string;
  private websiteId: string;

  constructor(auditId: string, websiteId: string) {
    this.auditId = auditId;
    this.websiteId = websiteId;
  }

  private async log(
    agentType: AgentType,
    message: string,
    reasoning?: string,
    action?: string,
    metadata?: Record<string, any>
  ) {
    await storage.createAgentLog({
      websiteId: this.websiteId,
      auditId: this.auditId,
      agentType,
      message,
      reasoning,
      action,
      metadata,
    });
  }

  async runAudit(url: string): Promise<Audit> {
    try {
      // Update audit status to running
      await storage.updateAudit(this.auditId, {
        status: "running",
        startedAt: new Date(),
      });

      // Phase 1: Strategy Agent plans the audit
      await this.log(
        "strategy",
        `Starting SEO audit for ${url}`,
        "I will coordinate the audit process, starting with a comprehensive crawl of the website.",
        "Initialize audit"
      );

      const thought = await generateAgentThought(
        "strategy",
        `Planning SEO audit for: ${url}. Determine crawl strategy and priority areas.`
      );
      
      await this.log(
        "strategy",
        "Planning audit strategy...",
        thought.reasoning,
        thought.action
      );

      // Phase 2: Audit Agent crawls the website
      await this.log(
        "audit",
        `Crawling website: ${url}`,
        "Beginning comprehensive crawl to discover all pages and gather SEO data.",
        "Start crawl"
      );

      const crawlResults = await crawlWebsite(url, 5);

      await this.log(
        "audit",
        `Crawl complete. Found ${crawlResults.length} pages.`,
        `Successfully crawled ${crawlResults.length} pages. Now analyzing each page for SEO issues.`,
        "Analyze pages"
      );

      // Phase 3: Analyze each page for issues
      const allIssues: SEOIssue[] = [];

      for (const page of crawlResults) {
        const pageIssues = analyzePageSEO(page);
        allIssues.push(...pageIssues);

        if (pageIssues.length > 0) {
          await this.log(
            "audit",
            `Found ${pageIssues.length} issues on ${page.url}`,
            `Identified ${pageIssues.filter(i => i.severity === 'critical').length} critical, ${pageIssues.filter(i => i.severity === 'high').length} high severity issues.`,
            "Continue analysis"
          );
        }
      }

      // Phase 4: Content Agent generates AI improvements
      await this.log(
        "content",
        `Generating AI improvements for ${allIssues.length} issues...`,
        "Using AI to create optimized suggestions for each identified issue.",
        "Generate improvements"
      );

      // Create issues in database with AI improvements
      let criticalCount = 0;
      let highCount = 0;
      let mediumCount = 0;
      let lowCount = 0;

      for (const issue of allIssues) {
        // Get page context for AI improvement
        const pageContext = crawlResults.find(p => p.url === issue.pageUrl) || { url: issue.pageUrl };
        
        // Generate AI improvement
        const aiResult = await generateAIImprovement(issue, pageContext);

        await storage.createIssue({
          auditId: this.auditId,
          websiteId: this.websiteId,
          pageUrl: issue.pageUrl,
          issueType: issue.type,
          category: issue.category,
          title: issue.title,
          description: issue.description,
          severity: issue.severity,
          status: "pending",
          riskLevel: issue.riskLevel,
          currentValue: issue.currentValue,
          suggestedValue: aiResult.suggestion,
          aiReasoning: aiResult.reasoning,
          confidence: aiResult.confidence,
          autoFixable: issue.autoFixable,
        });

        switch (issue.severity) {
          case "critical": criticalCount++; break;
          case "high": highCount++; break;
          case "medium": mediumCount++; break;
          case "low": lowCount++; break;
        }
      }

      await this.log(
        "content",
        `Generated AI improvements for all ${allIssues.length} issues`,
        "AI analysis complete. Each issue now has optimized suggestions based on page context.",
        "Improvements ready"
      );

      // Phase 5: Ranking Agent calculates scores
      const healthScore = calculateHealthScore(allIssues);

      await this.log(
        "ranking",
        `Calculated health score: ${healthScore}/100`,
        `Based on ${allIssues.length} issues found. Score reflects overall SEO health of the website.`,
        "Score calculated"
      );

      // Phase 6: Fix Agent identifies auto-fixable issues
      const autoFixable = allIssues.filter(i => i.autoFixable && i.riskLevel === "low");
      
      await this.log(
        "fix",
        `Identified ${autoFixable.length} auto-fixable issues`,
        "Low-risk issues can be automatically fixed. High-risk issues require manual approval.",
        "Ready for fixes"
      );

      // Update audit with results
      const updatedAudit = await storage.updateAudit(this.auditId, {
        status: "completed",
        completedAt: new Date(),
        totalIssues: allIssues.length,
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
        score: healthScore,
        pagesScanned: crawlResults.length,
        crawlData: crawlResults as any,
      });

      // Update website health score
      await storage.updateWebsite(this.websiteId, {
        healthScore,
        lastAuditAt: new Date(),
      });

      // Final log
      await this.log(
        "strategy",
        `Audit complete! Found ${allIssues.length} issues. Health score: ${healthScore}/100`,
        "Audit completed successfully. Issues have been categorized by severity and risk level.",
        "Audit finished"
      );

      return updatedAudit!;
    } catch (error) {
      console.error("Audit failed:", error);
      
      await this.log(
        "strategy",
        "Audit failed due to an error",
        error instanceof Error ? error.message : "Unknown error occurred",
        "Error"
      );

      await storage.updateAudit(this.auditId, {
        status: "failed",
        completedAt: new Date(),
      });

      throw error;
    }
  }

  async autoFixIssues(): Promise<number> {
    await this.log(
      "fix",
      "Starting auto-fix process for low-risk issues",
      "Will automatically apply fixes for issues marked as low-risk and auto-fixable.",
      "Begin auto-fix"
    );

    // Get all pending auto-fixable issues
    const issues = await storage.getIssues(this.auditId);
    const autoFixable = issues.filter(
      i => i.status === "pending" && i.autoFixable && i.riskLevel === "low"
    );

    let fixedCount = 0;

    for (const issue of autoFixable) {
      try {
        // Mark as auto-fixed
        await storage.updateIssue(issue.id, {
          status: "auto_fixed",
          fixedAt: new Date(),
        });

        // Create change record
        await storage.createChange({
          issueId: issue.id,
          websiteId: this.websiteId,
          changeType: issue.issueType,
          pageUrl: issue.pageUrl,
          beforeValue: issue.currentValue || undefined,
          afterValue: issue.suggestedValue || undefined,
          status: "applied",
        });

        fixedCount++;

        await this.log(
          "fix",
          `Auto-fixed: ${issue.title}`,
          `Applied fix for ${issue.issueType} on ${issue.pageUrl}`,
          "Fix applied"
        );
      } catch (error) {
        await this.log(
          "fix",
          `Failed to auto-fix: ${issue.title}`,
          error instanceof Error ? error.message : "Unknown error",
          "Fix failed"
        );
      }
    }

    await this.log(
      "fix",
      `Auto-fix complete. Fixed ${fixedCount} issues.`,
      `Successfully applied ${fixedCount} out of ${autoFixable.length} auto-fixable issues.`,
      "Auto-fix complete"
    );

    return fixedCount;
  }
}
