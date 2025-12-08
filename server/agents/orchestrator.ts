import { storage } from "../storage";
import { crawlWebsite } from "./crawler";
import { analyzePageSEO, analyzeImageSEO, generateImageReport, calculateHealthScore } from "./seoAnalyzer";
import { generateAIImprovement, generateAgentThought, generateModeAwareProposals } from "./aiEngine";
import type { AgentType, CrawlResult, SEOIssue, ImageReport } from "./types";
import type { Audit, OptimizationMode } from "@shared/schema";
import { DraftManager } from "./draftManager";
import { getModeLabel, getModeSettings, calculateSeoImpactEstimate } from "./optimizationModes";

export class AgentOrchestrator {
  private auditId: string;
  private websiteId: string;
  private currentProgress: number = 0;
  private optimizationMode: OptimizationMode;
  private draftManager: DraftManager;

  constructor(auditId: string, websiteId: string, optimizationMode: OptimizationMode = "balanced") {
    this.auditId = auditId;
    this.websiteId = websiteId;
    this.optimizationMode = optimizationMode;
    this.draftManager = new DraftManager(auditId, websiteId, optimizationMode);
  }

  private async updateProgress(progress: number, currentStep?: string) {
    this.currentProgress = progress;
    await storage.updateAudit(this.auditId, { 
      progress,
      currentStep: currentStep || null 
    });
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
      
      await this.updateProgress(5, "Initialisierung");

      // Phase 1: Strategy Agent plans the audit
      const modeLabel = getModeLabel(this.optimizationMode);
      await this.log(
        "strategy",
        `Starting SEO audit for ${url} (Mode: ${modeLabel})`,
        `I will coordinate the audit process with ${modeLabel} optimization mode. Starting with a comprehensive crawl of the website.`,
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
      
      await this.updateProgress(10, "Strategie geplant");

      // Phase 2: Audit Agent crawls the website
      await this.log(
        "audit",
        `Crawling website: ${url}`,
        "Beginning comprehensive crawl to discover all pages and gather SEO data.",
        "Start crawl"
      );
      
      await this.updateProgress(15, "Website wird gecrawlt");

      const crawlResults = await crawlWebsite(url, 5);

      await this.log(
        "audit",
        `Crawl complete. Found ${crawlResults.length} pages.`,
        `Successfully crawled ${crawlResults.length} pages. Now analyzing each page for SEO issues.`,
        "Analyze pages"
      );
      
      await this.updateProgress(30, `${crawlResults.length} Seiten gefunden`);

      // Phase 3: Analyze each page for issues
      const allIssues: SEOIssue[] = [];
      let analyzedPages = 0;

      for (const page of crawlResults) {
        const pageIssues = analyzePageSEO(page);
        allIssues.push(...pageIssues);
        analyzedPages++;
        
        const totalPages = crawlResults.length || 1;
        const analysisProgress = 30 + Math.floor((analyzedPages / totalPages) * 15);
        await this.updateProgress(analysisProgress, `Seite ${analyzedPages}/${crawlResults.length} analysiert`);

        if (pageIssues.length > 0) {
          await this.log(
            "audit",
            `Found ${pageIssues.length} issues on ${page.url}`,
            `Identified ${pageIssues.filter(i => i.severity === 'critical').length} critical, ${pageIssues.filter(i => i.severity === 'high').length} high severity issues.`,
            "Continue analysis"
          );
        }
      }

      // Phase 3.5: Image optimization analysis
      await this.updateProgress(46, "Bilder werden analysiert");
      
      await this.log(
        "audit",
        "Analyzing images for optimization opportunities...",
        "Checking image sizes, formats, dimensions, alt text, and lazy loading.",
        "Analyze images"
      );
      
      let imageReport: ImageReport | null = null;
      for (const page of crawlResults) {
        if (page.imagesDetailed && page.imagesDetailed.length > 0) {
          const imageIssues = analyzeImageSEO(page.imagesDetailed, page.url);
          allIssues.push(...imageIssues);
          
          if (imageIssues.length > 0) {
            await this.log(
              "audit",
              `Found ${imageIssues.length} image issues on ${page.url}`,
              `Identified ${page.imagesDetailed.filter(i => i.issues.length > 0).length} images with optimization opportunities.`,
              "Image analysis"
            );
          }
        }
      }
      
      imageReport = generateImageReport(crawlResults);
      
      if (imageReport && imageReport.totalImages > 0) {
        await this.log(
          "audit",
          `Image analysis complete: ${imageReport.totalImages} images found, ${imageReport.imagesWithIssues} need optimization`,
          `Potential savings: ${Math.round(imageReport.totalSavedBytes / 1024)}KB (${imageReport.averageSavingsPercent}% reduction possible).`,
          "Image report ready"
        );
      }
      
      await this.updateProgress(50, "Bildanalyse abgeschlossen");

      // Phase 4: Content Agent generates AI improvements
      await this.log(
        "content",
        `Generating AI improvements for ${allIssues.length} issues...`,
        "Using AI to create optimized suggestions for each identified issue.",
        "Generate improvements"
      );
      
      await this.updateProgress(55, `${allIssues.length} Issues gefunden, generiere Vorschläge`);

      // Create issues in database with AI improvements
      let criticalCount = 0;
      let highCount = 0;
      let mediumCount = 0;
      let lowCount = 0;
      let processedIssues = 0;

      let draftsCreated = 0;
      
      for (const issue of allIssues) {
        const pageContext = crawlResults.find(p => p.url === issue.pageUrl) || { url: issue.pageUrl };
        
        const modeProposals = await generateModeAwareProposals(issue, pageContext);

        const createdIssue = await storage.createIssue({
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
          suggestedValue: modeProposals[this.optimizationMode],
          aiReasoning: modeProposals.reasoning,
          confidence: modeProposals.confidences[this.optimizationMode],
          autoFixable: issue.autoFixable,
          aiFixProposalSafe: modeProposals.safe,
          aiFixProposalRecommended: modeProposals.balanced,
          aiFixProposalAggressive: modeProposals.aggressive,
        });

        const drafts = await this.draftManager.createDraftsForIssue(createdIssue);
        draftsCreated += drafts.length;

        switch (issue.severity) {
          case "critical": criticalCount++; break;
          case "high": highCount++; break;
          case "medium": mediumCount++; break;
          case "low": lowCount++; break;
        }
        
        processedIssues++;
        const totalIssuesCount = allIssues.length || 1;
        const aiProgress = 55 + Math.floor((processedIssues / totalIssuesCount) * 30);
        await this.updateProgress(aiProgress, `Issue ${processedIssues}/${allIssues.length} verarbeitet`);
      }

      await this.log(
        "content",
        allIssues.length > 0 
          ? `Generated ${modeLabel} mode proposals for all ${allIssues.length} issues (${draftsCreated} drafts created)`
          : "No issues found - website is well optimized!",
        `AI analysis complete with ${modeLabel} optimization mode. Each issue has Safe/Balanced/Aggressive proposals. Created ${draftsCreated} drafts for approval.`,
        "Improvements ready"
      );
      
      await this.updateProgress(90, allIssues.length > 0 ? "KI-Analyse abgeschlossen" : "Keine Issues gefunden");

      // Phase 5: Ranking Agent calculates scores
      const healthScore = calculateHealthScore(allIssues);

      await this.log(
        "ranking",
        `Calculated health score: ${healthScore}/100`,
        `Based on ${allIssues.length} issues found. Score reflects overall SEO health of the website.`,
        "Score calculated"
      );

      await this.updateProgress(95, "Score berechnet");

      // Phase 6: Fix Agent identifies auto-fixable issues
      const autoFixable = allIssues.filter(i => i.autoFixable && i.riskLevel === "low");
      
      await this.log(
        "fix",
        `Identified ${autoFixable.length} auto-fixable issues`,
        "Low-risk issues can be automatically fixed. High-risk issues require manual approval.",
        "Ready for fixes"
      );

      const impactEstimate = calculateSeoImpactEstimate(
        this.optimizationMode, 
        allIssues.length, 
        criticalCount, 
        highCount
      );

      const updatedAudit = await storage.updateAudit(this.auditId, {
        status: "completed",
        completedAt: new Date(),
        progress: 100,
        currentStep: "Audit abgeschlossen",
        totalIssues: allIssues.length,
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
        score: healthScore,
        pagesScanned: crawlResults.length,
        crawlData: crawlResults as any,
        optimizationMode: this.optimizationMode,
      });

      // Update website health score
      await storage.updateWebsite(this.websiteId, {
        healthScore,
        lastAuditAt: new Date(),
      });

      await this.log(
        "strategy",
        `Audit complete! Found ${allIssues.length} issues. Health score: ${healthScore}/100. Mode: ${modeLabel}`,
        `Audit completed successfully with ${modeLabel} mode. Created ${draftsCreated} optimization drafts. Estimated SEO impact: ${impactEstimate}`,
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

  async autoApplyDrafts(): Promise<number> {
    const modeLabel = getModeLabel(this.optimizationMode);
    
    await this.log(
      "fix",
      `Starting auto-apply for low-risk drafts (${modeLabel} mode)`,
      "Will automatically apply drafts that meet the confidence threshold for the current optimization mode.",
      "Begin auto-apply"
    );

    const appliedCount = await this.draftManager.autoApplyLowRiskDrafts();

    await this.log(
      "fix",
      `Auto-apply complete. Applied ${appliedCount} drafts.`,
      `Successfully applied ${appliedCount} drafts that met the ${modeLabel} mode confidence threshold.`,
      "Auto-apply complete"
    );

    return appliedCount;
  }

  async getDraftStats() {
    return this.draftManager.getDraftStats();
  }

  getOptimizationMode(): OptimizationMode {
    return this.optimizationMode;
  }
}
