import { storage } from "../storage";
import { 
  type Draft, 
  type InsertDraft, 
  type OptimizationMode, 
  type DraftType,
  type Issue
} from "@shared/schema";
import { getModeSettings, generateModeProposals, type OptimizationProposal } from "./optimizationModes";

export interface DraftProposal {
  issueId?: string;
  pageUrl: string;
  draftType: DraftType;
  currentValue: string;
  safeProposal: string;
  balancedProposal: string;
  aggressiveProposal: string;
  reasoning: string;
  metadata?: Record<string, unknown>;
}

export class DraftManager {
  private auditId: string;
  private websiteId: string;
  private mode: OptimizationMode;

  constructor(auditId: string, websiteId: string, mode: OptimizationMode = "balanced") {
    this.auditId = auditId;
    this.websiteId = websiteId;
    this.mode = mode;
  }

  async createDraft(proposal: DraftProposal): Promise<Draft> {
    const proposals = generateModeProposals(
      proposal.draftType,
      proposal.currentValue,
      proposal.safeProposal,
      proposal.balancedProposal,
      proposal.aggressiveProposal,
      proposal.reasoning
    );

    const selectedProposal = proposals[this.mode];
    const htmlDiff = this.generateHtmlDiff(proposal.currentValue, selectedProposal.proposedValue);

    const draftData: InsertDraft = {
      auditId: this.auditId,
      websiteId: this.websiteId,
      issueId: proposal.issueId,
      pageUrl: proposal.pageUrl,
      draftType: proposal.draftType,
      optimizationMode: this.mode,
      status: "pending",
      currentValue: proposal.currentValue,
      proposedValueSafe: proposal.safeProposal,
      proposedValueBalanced: proposal.balancedProposal,
      proposedValueAggressive: proposal.aggressiveProposal,
      selectedProposal: this.mode,
      htmlDiff,
      reasoning: selectedProposal.reasoning,
      impactEstimate: selectedProposal.impactEstimate,
      confidence: selectedProposal.confidence,
      metadata: proposal.metadata,
    };

    return storage.createDraft(draftData);
  }

  async createDraftsForIssue(issue: Issue): Promise<Draft[]> {
    const drafts: Draft[] = [];
    const draftType = this.issueToDraftType(issue.issueType);
    
    if (!draftType) return drafts;

    const proposal: DraftProposal = {
      issueId: issue.id,
      pageUrl: issue.pageUrl,
      draftType,
      currentValue: issue.currentValue || "",
      safeProposal: issue.aiFixProposalSafe || issue.suggestedValue || "",
      balancedProposal: issue.aiFixProposalRecommended || issue.suggestedValue || "",
      aggressiveProposal: issue.aiFixProposalAggressive || issue.suggestedValue || "",
      reasoning: issue.aiReasoning || issue.description || "",
      metadata: {
        issueType: issue.issueType,
        severity: issue.severity,
        category: issue.category,
      },
    };

    if (proposal.safeProposal || proposal.balancedProposal || proposal.aggressiveProposal) {
      const draft = await this.createDraft(proposal);
      drafts.push(draft);
    }

    return drafts;
  }

  async getDrafts(): Promise<Draft[]> {
    return storage.getDrafts(this.auditId);
  }

  async getPendingDrafts(): Promise<Draft[]> {
    return storage.getPendingDrafts(this.websiteId);
  }

  async approveDraft(draftId: string): Promise<Draft | undefined> {
    return storage.approveDraft(draftId);
  }

  async rejectDraft(draftId: string): Promise<Draft | undefined> {
    return storage.rejectDraft(draftId);
  }

  async applyDraft(draftId: string): Promise<Draft | undefined> {
    const draft = await storage.getDraft(draftId);
    if (!draft || draft.status !== "approved") {
      return undefined;
    }

    const applied = await storage.applyDraft(draftId);
    
    if (applied && draft.issueId) {
      await storage.updateIssue(draft.issueId, {
        status: "fixed",
        fixedAt: new Date(),
        chosenFixVariant: draft.selectedProposal as "safe" | "recommended" | "aggressive" | null,
      });
    }

    return applied;
  }

  async bulkApprove(draftIds: string[]): Promise<number> {
    return storage.bulkApproveDrafts(draftIds);
  }

  async bulkApply(draftIds: string[]): Promise<number> {
    let appliedCount = 0;
    for (const draftId of draftIds) {
      const result = await this.applyDraft(draftId);
      if (result) appliedCount++;
    }
    return appliedCount;
  }

  async autoApplyLowRiskDrafts(): Promise<number> {
    const settings = getModeSettings(this.mode);
    const drafts = await this.getDrafts();
    const lowRiskDrafts = drafts.filter(
      d => d.status === "pending" && (d.confidence || 0) >= settings.autoApplyThreshold
    );

    let appliedCount = 0;
    for (const draft of lowRiskDrafts) {
      await storage.approveDraft(draft.id);
      const result = await this.applyDraft(draft.id);
      if (result) appliedCount++;
    }

    return appliedCount;
  }

  private issueToDraftType(issueType: string): DraftType | null {
    const typeMap: Record<string, DraftType> = {
      "missing_title": "title",
      "short_title": "title",
      "long_title": "title",
      "missing_meta_description": "meta_description",
      "short_meta_description": "meta_description",
      "long_meta_description": "meta_description",
      "missing_h1": "heading",
      "multiple_h1": "heading",
      "heading_hierarchy": "heading",
      "keyword_stuffing": "keyword",
      "low_keyword_density": "keyword",
      "missing_keywords": "keyword",
      "few_internal_links": "internal_link",
      "broken_internal_links": "internal_link",
      "thin_content": "content",
      "duplicate_content": "content",
      "oversized_images": "image",
      "png_to_webp": "image",
      "images_missing_alt": "image",
      "missing_lazy_loading": "image",
    };

    return typeMap[issueType] || null;
  }

  private generateHtmlDiff(before: string, after: string): string {
    if (!before && !after) return "";
    
    const escapeHtml = (str: string) => 
      str.replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;");

    const beforeEscaped = escapeHtml(before || "(leer)");
    const afterEscaped = escapeHtml(after || "(leer)");

    return `<div class="diff">
  <div class="diff-before">
    <span class="label">Vorher:</span>
    <span class="removed">${beforeEscaped}</span>
  </div>
  <div class="diff-after">
    <span class="label">Nachher:</span>
    <span class="added">${afterEscaped}</span>
  </div>
</div>`;
  }

  getDraftStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    applied: number;
    rejected: number;
  }> {
    return this.getDrafts().then(drafts => ({
      total: drafts.length,
      pending: drafts.filter(d => d.status === "pending").length,
      approved: drafts.filter(d => d.status === "approved").length,
      applied: drafts.filter(d => d.status === "applied").length,
      rejected: drafts.filter(d => d.status === "rejected").length,
    }));
  }
}

export async function createTitleDraft(
  manager: DraftManager,
  pageUrl: string,
  currentTitle: string,
  issueId?: string
): Promise<Draft> {
  const safeProposal = currentTitle
    ? currentTitle.length > 60 
      ? currentTitle.slice(0, 57) + "..." 
      : currentTitle + " - Mehr erfahren"
    : "Professionelle Lösung - Entdecken Sie mehr";
  
  const balancedProposal = currentTitle
    ? `${currentTitle.slice(0, 40)} | Ihr Experte für Qualität`
    : "Erstklassige Lösungen | Qualität & Service";
  
  const aggressiveProposal = currentTitle
    ? `${currentTitle.slice(0, 30)} | #1 Anbieter | Jetzt entdecken`
    : "Beste Lösung 2024 | Top-Bewertungen | Jetzt starten";

  return manager.createDraft({
    issueId,
    pageUrl,
    draftType: "title",
    currentValue: currentTitle,
    safeProposal,
    balancedProposal,
    aggressiveProposal,
    reasoning: "Optimierung des Seitentitels für bessere Sichtbarkeit in Suchmaschinen.",
  });
}

export async function createMetaDescriptionDraft(
  manager: DraftManager,
  pageUrl: string,
  currentDescription: string,
  issueId?: string
): Promise<Draft> {
  const safeProposal = currentDescription
    ? currentDescription.length > 160 
      ? currentDescription.slice(0, 155) + "..." 
      : currentDescription + " Mehr erfahren."
    : "Entdecken Sie unsere Lösungen. Qualität und Service stehen bei uns an erster Stelle.";
  
  const balancedProposal = currentDescription
    ? `${currentDescription.slice(0, 100)} Erfahren Sie mehr über unsere Leistungen und kontaktieren Sie uns.`
    : "Professionelle Lösungen für Ihre Anforderungen. Kontaktieren Sie uns für eine kostenlose Beratung.";
  
  const aggressiveProposal = currentDescription
    ? `${currentDescription.slice(0, 80)} Top-Bewertungen | Schnelle Lieferung | Jetzt 20% Rabatt sichern!`
    : "Beste Qualität zum besten Preis. 1000+ zufriedene Kunden. Jetzt bestellen und profitieren!";

  return manager.createDraft({
    issueId,
    pageUrl,
    draftType: "meta_description",
    currentValue: currentDescription,
    safeProposal,
    balancedProposal,
    aggressiveProposal,
    reasoning: "Optimierung der Meta-Description für bessere Klickraten in Suchergebnissen.",
  });
}

export async function createHeadingDraft(
  manager: DraftManager,
  pageUrl: string,
  currentHeading: string,
  headingLevel: string,
  issueId?: string
): Promise<Draft> {
  const safeProposal = currentHeading || "Unsere Leistungen";
  const balancedProposal = currentHeading 
    ? `${currentHeading} - Qualität & Expertise`
    : "Professionelle Lösungen für Ihren Erfolg";
  const aggressiveProposal = currentHeading
    ? `${currentHeading} | Beste Wahl für Anspruchsvolle`
    : "Ihre #1 Lösung für maximalen Erfolg";

  return manager.createDraft({
    issueId,
    pageUrl,
    draftType: "heading",
    currentValue: currentHeading,
    safeProposal,
    balancedProposal,
    aggressiveProposal,
    reasoning: `Optimierung der ${headingLevel}-Überschrift für bessere SEO-Struktur.`,
    metadata: { headingLevel },
  });
}

export async function createInternalLinkDraft(
  manager: DraftManager,
  pageUrl: string,
  targetUrl: string,
  anchorText: string,
  context: string,
  issueId?: string
): Promise<Draft> {
  const safeProposal = `<a href="${targetUrl}">${anchorText}</a>`;
  const balancedProposal = `<a href="${targetUrl}" title="${anchorText}">${anchorText} - Mehr erfahren</a>`;
  const aggressiveProposal = `<a href="${targetUrl}" title="Entdecken Sie ${anchorText}"><strong>${anchorText}</strong> - Jetzt ansehen</a>`;

  return manager.createDraft({
    issueId,
    pageUrl,
    draftType: "internal_link",
    currentValue: context,
    safeProposal,
    balancedProposal,
    aggressiveProposal,
    reasoning: `Neuer interner Link zu "${targetUrl}" für bessere Seitenvernetzung.`,
    metadata: { targetUrl, anchorText },
  });
}
