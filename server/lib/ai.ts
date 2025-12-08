import type { Issue } from "@shared/schema";

export interface PrioritizedIssue extends Issue {
  impactScore: number;
}

export interface RiskAnalysis {
  risk: "low" | "medium" | "high";
  riskExplanation: string;
}

export interface FixVariants {
  safeFix: string;
  recommendedFix: string;
  aggressiveFix: string;
  confidenceScore: number;
}

export function prioritizeIssues(issues: Issue[]): PrioritizedIssue[] {
  const prioritized = issues.map(issue => {
    let impactScore = 50;
    
    switch (issue.severity) {
      case "critical": impactScore += 40; break;
      case "high": impactScore += 25; break;
      case "medium": impactScore += 10; break;
      case "low": impactScore += 0; break;
    }
    
    switch (issue.riskLevel) {
      case "high": impactScore -= 5; break;
      case "medium": impactScore += 5; break;
      case "low": impactScore += 15; break;
    }
    
    if (issue.issueType?.includes("title")) impactScore += 10;
    if (issue.issueType?.includes("meta")) impactScore += 8;
    if (issue.issueType?.includes("h1")) impactScore += 6;
    if (issue.issueType?.includes("image")) impactScore += 4;
    
    impactScore = Math.min(100, Math.max(0, impactScore));
    
    return { ...issue, impactScore };
  });
  
  return prioritized.sort((a, b) => b.impactScore - a.impactScore);
}

export function analyzeRisk(issue: Issue): RiskAnalysis {
  const issueType = issue.issueType?.toLowerCase() || "";
  const category = issue.category?.toLowerCase() || "";
  
  if (issueType.includes("script") || issueType.includes("css") || issueType.includes("layout")) {
    return {
      risk: "high",
      riskExplanation: "Diese Änderung könnte das Layout oder die Funktionalität der Seite beeinflussen. Globale CSS-Regeln oder JavaScript-Änderungen können unbeabsichtigte Seiteneffekte haben."
    };
  }
  
  if (issueType.includes("title") || issueType.includes("canonical") || issueType.includes("redirect")) {
    return {
      risk: "medium",
      riskExplanation: "Diese Änderung betrifft wichtige SEO-Elemente. Sie sollte sorgfältig geprüft werden, um negative Auswirkungen auf das Ranking zu vermeiden."
    };
  }
  
  if (issueType.includes("alt") || issueType.includes("meta") || issueType.includes("description")) {
    return {
      risk: "low",
      riskExplanation: "Diese Änderung ist sicher und hat keine Auswirkungen auf das visuelle Erscheinungsbild oder die Funktionalität der Seite."
    };
  }
  
  return {
    risk: "medium",
    riskExplanation: "Standardrisiko. Überprüfen Sie die vorgeschlagene Änderung vor der Anwendung."
  };
}

export function generateFixVariants(issue: Issue): FixVariants {
  const currentValue = issue.currentValue || "";
  const suggestedValue = issue.suggestedValue || "";
  const issueType = issue.issueType || "";
  
  let safeFix = suggestedValue;
  let recommendedFix = suggestedValue;
  let aggressiveFix = suggestedValue;
  let confidenceScore = 75;
  
  if (issueType.includes("title")) {
    safeFix = currentValue ? `${currentValue.slice(0, 30)}...` : "Seitentitel hinzufügen";
    recommendedFix = suggestedValue || "Optimierter Seitentitel mit Hauptkeyword";
    aggressiveFix = suggestedValue ? `${suggestedValue} | Beste Wahl 2024` : "Aggressiv optimierter Titel";
    confidenceScore = 85;
  } else if (issueType.includes("meta") || issueType.includes("description")) {
    safeFix = currentValue ? currentValue.slice(0, 100) + "..." : "Meta-Beschreibung hinzufügen";
    recommendedFix = suggestedValue || "Optimierte Meta-Beschreibung mit Call-to-Action";
    aggressiveFix = suggestedValue ? suggestedValue + " Jetzt entdecken!" : "Keyword-reiche Meta-Beschreibung";
    confidenceScore = 80;
  } else if (issueType.includes("image") || issueType.includes("alt")) {
    safeFix = "Bild-Alt-Text: Beschreibung des Bildinhalts";
    recommendedFix = suggestedValue || "Beschreibender Alt-Text mit relevantem Keyword";
    aggressiveFix = "Keyword-optimierter Alt-Text für besseres Ranking";
    confidenceScore = 90;
  } else if (issueType.includes("h1")) {
    safeFix = currentValue || "H1-Überschrift hinzufügen";
    recommendedFix = suggestedValue || "Optimierte H1-Überschrift";
    aggressiveFix = "Keyword-fokussierte H1-Überschrift";
    confidenceScore = 85;
  } else {
    safeFix = `Konservative Korrektur: ${currentValue?.slice(0, 50) || 'Standardwert'}`;
    recommendedFix = suggestedValue || "Empfohlene Optimierung basierend auf Best Practices";
    aggressiveFix = "Maximale SEO-Optimierung";
    confidenceScore = 70;
  }
  
  return { safeFix, recommendedFix, aggressiveFix, confidenceScore };
}

export function estimateSeoScoreBefore(issues: Issue[]): number {
  if (issues.length === 0) return 100;
  
  let score = 100;
  
  for (const issue of issues) {
    switch (issue.severity) {
      case "critical": score -= 15; break;
      case "high": score -= 10; break;
      case "medium": score -= 5; break;
      case "low": score -= 2; break;
    }
  }
  
  return Math.max(0, Math.min(100, score));
}

export function estimateSeoScoreAfter(issues: Issue[]): number {
  const fixedIssues = issues.filter(i => i.status === "fixed" || i.status === "auto_fixed");
  const pendingIssues = issues.filter(i => i.status === "pending");
  
  let score = 100;
  
  for (const issue of pendingIssues) {
    switch (issue.severity) {
      case "critical": score -= 15; break;
      case "high": score -= 10; break;
      case "medium": score -= 5; break;
      case "low": score -= 2; break;
    }
  }
  
  const fixBonus = fixedIssues.length * 2;
  score += fixBonus;
  
  return Math.max(0, Math.min(100, score));
}

export function updateUserPreferencesFromFix(
  userId: string,
  chosenVariant: "safe" | "recommended" | "aggressive"
): { prefersAggressiveFixes: boolean; prefersLowRisk: boolean } {
  return {
    prefersAggressiveFixes: chosenVariant === "aggressive",
    prefersLowRisk: chosenVariant === "safe"
  };
}

export function analyzeSecuritySignals(url: string, html: string): { hasSecurityIssues: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (url.startsWith("http://")) {
    issues.push("Seite verwendet HTTP statt HTTPS");
  }
  
  if (html.includes('http://') && html.includes('https://')) {
    issues.push("Mixed Content: Seite lädt unsichere Ressourcen");
  }
  
  return {
    hasSecurityIssues: issues.length > 0,
    issues
  };
}
