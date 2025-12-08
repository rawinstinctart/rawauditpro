import { OptimizationMode } from "@shared/schema";

export interface ModeSettings {
  mode: OptimizationMode;
  title: {
    maxLengthChange: number;
    keywordDensity: "low" | "medium" | "high";
    restructureAllowed: boolean;
  };
  metaDescription: {
    maxLengthChange: number;
    callToActionStrength: "subtle" | "moderate" | "strong";
    keywordInclusion: "minimal" | "moderate" | "comprehensive";
  };
  headings: {
    restructuringLevel: "minor" | "moderate" | "complete";
    keywordOptimization: "conservative" | "balanced" | "aggressive";
    hierarchyFixes: boolean;
  };
  keywords: {
    densityTarget: number;
    placementStrategy: "natural" | "optimized" | "comprehensive";
    synonymUsage: "minimal" | "moderate" | "extensive";
  };
  internalLinks: {
    maxNewLinks: number;
    contextRelevance: "strict" | "moderate" | "broad";
    anchorTextOptimization: "minimal" | "balanced" | "aggressive";
  };
  content: {
    rewriteLevel: "corrections" | "improvements" | "comprehensive";
    lengthAdjustment: "none" | "moderate" | "significant";
    readabilityTarget: "unchanged" | "improved" | "optimized";
  };
  images: {
    compressionLevel: "light" | "moderate" | "aggressive";
    formatConversion: boolean;
    altTextGeneration: "minimal" | "descriptive" | "keyword-rich";
  };
  riskTolerance: "low" | "medium" | "high";
  autoApplyThreshold: number;
}

export const SAFE_MODE: ModeSettings = {
  mode: "safe",
  title: {
    maxLengthChange: 10,
    keywordDensity: "low",
    restructureAllowed: false,
  },
  metaDescription: {
    maxLengthChange: 20,
    callToActionStrength: "subtle",
    keywordInclusion: "minimal",
  },
  headings: {
    restructuringLevel: "minor",
    keywordOptimization: "conservative",
    hierarchyFixes: true,
  },
  keywords: {
    densityTarget: 1.0,
    placementStrategy: "natural",
    synonymUsage: "minimal",
  },
  internalLinks: {
    maxNewLinks: 2,
    contextRelevance: "strict",
    anchorTextOptimization: "minimal",
  },
  content: {
    rewriteLevel: "corrections",
    lengthAdjustment: "none",
    readabilityTarget: "unchanged",
  },
  images: {
    compressionLevel: "light",
    formatConversion: false,
    altTextGeneration: "minimal",
  },
  riskTolerance: "low",
  autoApplyThreshold: 0.9,
};

export const BALANCED_MODE: ModeSettings = {
  mode: "balanced",
  title: {
    maxLengthChange: 20,
    keywordDensity: "medium",
    restructureAllowed: true,
  },
  metaDescription: {
    maxLengthChange: 40,
    callToActionStrength: "moderate",
    keywordInclusion: "moderate",
  },
  headings: {
    restructuringLevel: "moderate",
    keywordOptimization: "balanced",
    hierarchyFixes: true,
  },
  keywords: {
    densityTarget: 1.5,
    placementStrategy: "optimized",
    synonymUsage: "moderate",
  },
  internalLinks: {
    maxNewLinks: 5,
    contextRelevance: "moderate",
    anchorTextOptimization: "balanced",
  },
  content: {
    rewriteLevel: "improvements",
    lengthAdjustment: "moderate",
    readabilityTarget: "improved",
  },
  images: {
    compressionLevel: "moderate",
    formatConversion: true,
    altTextGeneration: "descriptive",
  },
  riskTolerance: "medium",
  autoApplyThreshold: 0.8,
};

export const AGGRESSIVE_MODE: ModeSettings = {
  mode: "aggressive",
  title: {
    maxLengthChange: 40,
    keywordDensity: "high",
    restructureAllowed: true,
  },
  metaDescription: {
    maxLengthChange: 60,
    callToActionStrength: "strong",
    keywordInclusion: "comprehensive",
  },
  headings: {
    restructuringLevel: "complete",
    keywordOptimization: "aggressive",
    hierarchyFixes: true,
  },
  keywords: {
    densityTarget: 2.5,
    placementStrategy: "comprehensive",
    synonymUsage: "extensive",
  },
  internalLinks: {
    maxNewLinks: 10,
    contextRelevance: "broad",
    anchorTextOptimization: "aggressive",
  },
  content: {
    rewriteLevel: "comprehensive",
    lengthAdjustment: "significant",
    readabilityTarget: "optimized",
  },
  images: {
    compressionLevel: "aggressive",
    formatConversion: true,
    altTextGeneration: "keyword-rich",
  },
  riskTolerance: "high",
  autoApplyThreshold: 0.7,
};

export function getModeSettings(mode: OptimizationMode): ModeSettings {
  switch (mode) {
    case "safe":
      return SAFE_MODE;
    case "balanced":
      return BALANCED_MODE;
    case "aggressive":
      return AGGRESSIVE_MODE;
    default:
      return BALANCED_MODE;
  }
}

export function getModeLabel(mode: OptimizationMode): string {
  switch (mode) {
    case "safe":
      return "Sicher";
    case "balanced":
      return "Ausgewogen";
    case "aggressive":
      return "Aggressiv";
    default:
      return "Ausgewogen";
  }
}

export function getModeDescription(mode: OptimizationMode): string {
  switch (mode) {
    case "safe":
      return "Minimale Änderungen, konservative Optimierungen. Ideal für etablierte Seiten.";
    case "balanced":
      return "Normale SEO-Optimierung mit gutem Gleichgewicht zwischen Risiko und Wirkung.";
    case "aggressive":
      return "Starke Optimierungen für maximale SEO-Wirkung. Ideal für neue oder schwache Seiten.";
    default:
      return "Normale SEO-Optimierung.";
  }
}

export function getModeColor(mode: OptimizationMode): string {
  switch (mode) {
    case "safe":
      return "blue";
    case "balanced":
      return "green";
    case "aggressive":
      return "red";
    default:
      return "gray";
  }
}

export function applyModeSettings<T extends object>(
  baseOptimization: T,
  mode: OptimizationMode,
  modifier: (settings: ModeSettings, base: T) => T
): T {
  const settings = getModeSettings(mode);
  return modifier(settings, baseOptimization);
}

export interface OptimizationProposal {
  mode: OptimizationMode;
  currentValue: string;
  proposedValue: string;
  reasoning: string;
  confidence: number;
  impactEstimate: string;
  riskLevel: "low" | "medium" | "high";
}

export function generateModeProposals(
  issueType: string,
  currentValue: string,
  safeProposal: string,
  balancedProposal: string,
  aggressiveProposal: string,
  reasoning: string
): { safe: OptimizationProposal; balanced: OptimizationProposal; aggressive: OptimizationProposal } {
  return {
    safe: {
      mode: "safe",
      currentValue,
      proposedValue: safeProposal,
      reasoning: `[Sicher] ${reasoning} Minimale Änderungen für geringes Risiko.`,
      confidence: 0.95,
      impactEstimate: "+5-10%",
      riskLevel: "low",
    },
    balanced: {
      mode: "balanced",
      currentValue,
      proposedValue: balancedProposal,
      reasoning: `[Ausgewogen] ${reasoning} Optimale Balance zwischen Wirkung und Risiko.`,
      confidence: 0.85,
      impactEstimate: "+15-25%",
      riskLevel: "medium",
    },
    aggressive: {
      mode: "aggressive",
      currentValue,
      proposedValue: aggressiveProposal,
      reasoning: `[Aggressiv] ${reasoning} Maximale SEO-Wirkung, höheres Risiko.`,
      confidence: 0.75,
      impactEstimate: "+25-40%",
      riskLevel: "high",
    },
  };
}

export function calculateSeoImpactEstimate(
  mode: OptimizationMode,
  issueCount: number,
  criticalCount: number,
  highCount: number
): string {
  const baseImpact = {
    safe: 0.05,
    balanced: 0.15,
    aggressive: 0.30,
  };

  const modeMultiplier = baseImpact[mode];
  const criticalImpact = criticalCount * 5;
  const highImpact = highCount * 2;
  const totalImpact = Math.min(50, Math.round((criticalImpact + highImpact + issueCount) * modeMultiplier * 100) / 100);
  
  return `+${Math.round(totalImpact)}%`;
}
