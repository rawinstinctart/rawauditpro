import OpenAI from "openai";
import type { SEOIssue, CrawlResult, AgentThought } from "./types";
import type { OptimizationMode } from "@shared/schema";
import { getModeSettings, type ModeSettings } from "./optimizationModes";

// Check if OpenAI is available
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function generateAIImprovement(
  issue: SEOIssue,
  pageContext: CrawlResult
): Promise<{ suggestion: string; reasoning: string; confidence: number }> {
  if (!openai) {
    // Fallback without AI
    return {
      suggestion: issue.suggestedValue || "Manual review required",
      reasoning: "AI-powered suggestions require an OpenAI API key. Using rule-based suggestions.",
      confidence: 0.6,
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: `You are an expert SEO consultant. Analyze SEO issues and provide actionable improvements.
          
Be specific, concise, and provide reasoning for your suggestions.
Consider the page context when making recommendations.
Output in JSON format with fields: suggestion, reasoning, confidence (0-1).`,
        },
        {
          role: "user",
          content: `Analyze this SEO issue and provide an optimized suggestion:

Issue Type: ${issue.type}
Category: ${issue.category}
Title: ${issue.title}
Description: ${issue.description}
Current Value: ${issue.currentValue || "Not set"}
Page URL: ${issue.pageUrl}

Page Context:
- Title: ${pageContext.title || "None"}
- H1: ${pageContext.h1?.join(", ") || "None"}
- Meta Description: ${pageContext.metaDescription || "None"}
- Content Preview: ${pageContext.bodyText?.slice(0, 500) || "None"}

Provide a specific, SEO-optimized suggestion for fixing this issue.`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      return {
        suggestion: parsed.suggestion || issue.suggestedValue || "",
        reasoning: parsed.reasoning || "AI analysis complete.",
        confidence: parsed.confidence || 0.8,
      };
    }
  } catch (error) {
    console.error("AI improvement generation failed:", error);
  }

  return {
    suggestion: issue.suggestedValue || "Manual review required",
    reasoning: "AI analysis encountered an error. Using rule-based suggestion.",
    confidence: 0.5,
  };
}

export async function generateAgentThought(
  agentType: string,
  context: string
): Promise<AgentThought> {
  if (!openai) {
    return getDefaultThought(agentType, context);
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a specialized ${agentType} AI agent for SEO optimization.
          
Your role depends on your type:
- strategy: Plan SEO improvements and prioritize actions
- audit: Analyze pages for SEO issues and opportunities
- content: Generate and improve content for SEO
- fix: Apply fixes and verify changes
- ranking: Track rankings and measure impact

Provide your reasoning process in a natural, helpful way.
Output JSON with: reasoning, action, confidence (0-1).`,
        },
        {
          role: "user",
          content: context,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 300,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      return {
        reasoning: parsed.reasoning || "Analyzing...",
        action: parsed.action || "Continue analysis",
        confidence: parsed.confidence || 0.7,
      };
    }
  } catch (error) {
    console.error("Agent thought generation failed:", error);
  }

  return getDefaultThought(agentType, context);
}

function getDefaultThought(agentType: string, context: string): AgentThought {
  const defaults: Record<string, AgentThought> = {
    strategy: {
      reasoning: "Analyzing website structure and identifying priority areas for SEO improvement.",
      action: "Create optimization roadmap",
      confidence: 0.75,
    },
    audit: {
      reasoning: "Scanning page elements for SEO compliance and best practices.",
      action: "Identify issues and opportunities",
      confidence: 0.85,
    },
    content: {
      reasoning: "Evaluating content quality, keyword usage, and readability.",
      action: "Generate content improvements",
      confidence: 0.7,
    },
    fix: {
      reasoning: "Preparing to apply approved changes safely with rollback capability.",
      action: "Execute fixes",
      confidence: 0.9,
    },
    ranking: {
      reasoning: "Monitoring SEO metrics and tracking improvement progress.",
      action: "Update performance data",
      confidence: 0.8,
    },
  };

  return defaults[agentType] || {
    reasoning: "Processing request...",
    action: "Continue",
    confidence: 0.5,
  };
}

export async function improveTitle(
  currentTitle: string,
  pageContext: CrawlResult
): Promise<string> {
  if (!openai) {
    // Rule-based fallback
    if (!currentTitle && pageContext.h1?.[0]) {
      return pageContext.h1[0].slice(0, 55);
    }
    return currentTitle || "Optimized Page Title";
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an SEO expert. Generate an optimized page title (50-60 characters) that is compelling and includes relevant keywords. Output only the title, nothing else.",
        },
        {
          role: "user",
          content: `Current title: ${currentTitle || "None"}
Page URL: ${pageContext.url}
H1: ${pageContext.h1?.join(", ") || "None"}
Content preview: ${pageContext.bodyText?.slice(0, 300) || "None"}

Generate an SEO-optimized title:`,
        },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content?.trim() || currentTitle;
  } catch (error) {
    console.error("Title improvement failed:", error);
    return currentTitle;
  }
}

export async function improveMetaDescription(
  currentDescription: string,
  pageContext: CrawlResult
): Promise<string> {
  if (!openai) {
    // Rule-based fallback
    if (pageContext.bodyText) {
      return pageContext.bodyText.slice(0, 155) + "...";
    }
    return currentDescription || "Discover more about this page.";
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an SEO expert. Generate an optimized meta description (150-160 characters) that is compelling, includes a call-to-action, and incorporates relevant keywords. Output only the description, nothing else.",
        },
        {
          role: "user",
          content: `Current description: ${currentDescription || "None"}
Page URL: ${pageContext.url}
Title: ${pageContext.title || "None"}
H1: ${pageContext.h1?.join(", ") || "None"}
Content preview: ${pageContext.bodyText?.slice(0, 500) || "None"}

Generate an SEO-optimized meta description:`,
        },
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content?.trim() || currentDescription;
  } catch (error) {
    console.error("Meta description improvement failed:", error);
    return currentDescription;
  }
}

export interface ModeAwareProposals {
  safe: string;
  balanced: string;
  aggressive: string;
  reasoning: string;
  confidences: { safe: number; balanced: number; aggressive: number };
}

export async function generateModeAwareProposals(
  issue: SEOIssue,
  pageContext: CrawlResult
): Promise<ModeAwareProposals> {
  if (!openai) {
    return generateRuleBasedProposals(issue, pageContext);
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert SEO consultant. Generate THREE optimization proposals for the given SEO issue:

1. SAFE (Sicher): Minimal changes, conservative approach, very low risk
2. BALANCED (Ausgewogen): Moderate optimization, good balance of risk and impact
3. AGGRESSIVE (Aggressiv): Maximum SEO impact, higher risk, complete restructuring allowed

Output JSON with:
{
  "safe": "The safe proposal text",
  "balanced": "The balanced proposal text", 
  "aggressive": "The aggressive proposal text",
  "reasoning": "Brief explanation of the different approaches",
  "confidences": { "safe": 0.95, "balanced": 0.85, "aggressive": 0.70 }
}`,
        },
        {
          role: "user",
          content: `Generate three optimization proposals for this SEO issue:

Issue Type: ${issue.type}
Category: ${issue.category}
Title: ${issue.title}
Description: ${issue.description}
Current Value: ${issue.currentValue || "Not set"}
Page URL: ${issue.pageUrl}

Page Context:
- Page Title: ${pageContext.title || "None"}
- H1: ${pageContext.h1?.join(", ") || "None"}
- Meta Description: ${pageContext.metaDescription || "None"}
- Content Preview: ${pageContext.bodyText?.slice(0, 400) || "None"}

Generate specific, SEO-optimized proposals for each mode.`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      return {
        safe: parsed.safe || issue.suggestedValue || "",
        balanced: parsed.balanced || issue.suggestedValue || "",
        aggressive: parsed.aggressive || issue.suggestedValue || "",
        reasoning: parsed.reasoning || "AI-generated optimization proposals.",
        confidences: parsed.confidences || { safe: 0.9, balanced: 0.8, aggressive: 0.7 },
      };
    }
  } catch (error) {
    console.error("Mode-aware proposals generation failed:", error);
  }

  return generateRuleBasedProposals(issue, pageContext);
}

function generateRuleBasedProposals(
  issue: SEOIssue,
  pageContext: CrawlResult
): ModeAwareProposals {
  const currentValue = issue.currentValue || "";
  const suggested = issue.suggestedValue || "";
  
  let safe = suggested;
  let balanced = suggested;
  let aggressive = suggested;
  let reasoning = "Rule-based optimization proposals generated.";

  switch (issue.type) {
    case "missing_title":
    case "short_title":
    case "long_title":
      const baseTitle = pageContext.h1?.[0] || pageContext.title || "Qualitäts-Service";
      safe = baseTitle.slice(0, 55);
      balanced = `${baseTitle.slice(0, 45)} | Ihr Experte`;
      aggressive = `${baseTitle.slice(0, 35)} | #1 Anbieter | Jetzt entdecken`;
      reasoning = "Titel-Optimierung für verschiedene SEO-Strategien.";
      break;

    case "missing_meta_description":
    case "short_meta_description":
    case "long_meta_description":
      const baseDesc = pageContext.bodyText?.slice(0, 100) || "Entdecken Sie unsere Leistungen";
      safe = `${baseDesc}. Mehr erfahren.`;
      balanced = `${baseDesc}. Kontaktieren Sie uns für eine Beratung.`;
      aggressive = `${baseDesc}. Jetzt 20% Rabatt sichern! Schnelle Lieferung.`;
      reasoning = "Meta-Description-Optimierung für bessere Klickraten.";
      break;

    case "missing_h1":
    case "multiple_h1":
      safe = pageContext.title || "Unsere Leistungen";
      balanced = `${pageContext.title || "Professionelle Lösungen"} - Qualität garantiert`;
      aggressive = `${pageContext.title || "Beste Lösungen"} | Marktführer seit 2010`;
      reasoning = "H1-Optimierung für klare Seitenstruktur.";
      break;

    case "few_internal_links":
      safe = "1-2 relevante interne Links hinzufügen";
      balanced = "3-5 kontextbezogene interne Links mit optimierten Ankertexten";
      aggressive = "8-10 interne Links mit keyword-reichen Ankertexten über den Content verteilt";
      reasoning = "Interne Verlinkung für bessere Seitenarchitektur.";
      break;

    default:
      safe = suggested || currentValue;
      balanced = suggested || currentValue;
      aggressive = suggested || currentValue;
      reasoning = "Standard-Optimierungsvorschläge.";
  }

  return {
    safe,
    balanced,
    aggressive,
    reasoning,
    confidences: { safe: 0.9, balanced: 0.8, aggressive: 0.65 },
  };
}

export async function generateAIImprovementWithModes(
  issue: SEOIssue,
  pageContext: CrawlResult,
  mode: OptimizationMode
): Promise<{ suggestion: string; reasoning: string; confidence: number; allProposals: ModeAwareProposals }> {
  const proposals = await generateModeAwareProposals(issue, pageContext);
  
  const suggestion = proposals[mode];
  const confidence = proposals.confidences[mode];
  
  return {
    suggestion,
    reasoning: proposals.reasoning,
    confidence,
    allProposals: proposals,
  };
}

export async function optimizeHeadings(
  headings: string[],
  pageContext: CrawlResult,
  mode: OptimizationMode
): Promise<{ optimized: string[]; changes: { original: string; new: string; level: string }[] }> {
  const settings = getModeSettings(mode);
  const changes: { original: string; new: string; level: string }[] = [];
  const optimized: string[] = [];

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    let newHeading = heading;

    if (settings.headings.restructuringLevel !== "minor" || !heading) {
      switch (mode) {
        case "safe":
          newHeading = heading || pageContext.title || "Unsere Leistungen";
          break;
        case "balanced":
          newHeading = heading 
            ? `${heading} - Qualität & Service`
            : `${pageContext.title || "Professionelle Lösungen"}`;
          break;
        case "aggressive":
          newHeading = heading
            ? `${heading} | Beste Wahl für Anspruchsvolle`
            : `${pageContext.title || "Marktführende Lösungen"} | Jetzt entdecken`;
          break;
      }
    }

    if (newHeading !== heading) {
      changes.push({ original: heading, new: newHeading, level: `H${i + 1}` });
    }
    optimized.push(newHeading);
  }

  return { optimized, changes };
}

export async function optimizeKeywords(
  content: string,
  targetKeywords: string[],
  mode: OptimizationMode
): Promise<{ optimized: string; keywordDensity: number; changes: string[] }> {
  const settings = getModeSettings(mode);
  const changes: string[] = [];
  let optimized = content;
  
  const targetDensity = settings.keywords.densityTarget;
  const words = content.split(/\s+/).length;
  
  for (const keyword of targetKeywords) {
    const currentCount = (content.match(new RegExp(keyword, "gi")) || []).length;
    const currentDensity = (currentCount / words) * 100;
    
    if (currentDensity < targetDensity) {
      const insertions = Math.ceil((targetDensity - currentDensity) * words / 100);
      changes.push(`Keyword "${keyword}": ${insertions} zusätzliche Verwendungen vorgeschlagen`);
    }
  }

  const keywordDensity = targetKeywords.reduce((sum, kw) => {
    return sum + ((content.match(new RegExp(kw, "gi")) || []).length / words) * 100;
  }, 0);

  return { optimized, keywordDensity, changes };
}

export async function optimizeMeta(
  title: string,
  description: string,
  pageContext: CrawlResult,
  mode: OptimizationMode
): Promise<{ title: string; description: string; changes: { field: string; before: string; after: string }[] }> {
  const settings = getModeSettings(mode);
  const changes: { field: string; before: string; after: string }[] = [];

  let newTitle = title;
  let newDescription = description;

  if (!title || title.length < 30 || title.length > 60) {
    switch (mode) {
      case "safe":
        newTitle = (pageContext.h1?.[0] || title || "Qualitäts-Service").slice(0, 55);
        break;
      case "balanced":
        newTitle = `${(pageContext.h1?.[0] || title || "Professioneller Service").slice(0, 45)} | Experte`;
        break;
      case "aggressive":
        newTitle = `${(pageContext.h1?.[0] || title || "Top-Service").slice(0, 35)} | #1 Anbieter | Jetzt`;
        break;
    }
    if (newTitle !== title) {
      changes.push({ field: "title", before: title, after: newTitle });
    }
  }

  if (!description || description.length < 120 || description.length > 160) {
    const baseDesc = pageContext.bodyText?.slice(0, 100) || description || "Entdecken Sie unsere Leistungen";
    switch (mode) {
      case "safe":
        newDescription = `${baseDesc}. Mehr erfahren.`.slice(0, 155);
        break;
      case "balanced":
        newDescription = `${baseDesc}. Kontaktieren Sie uns für eine kostenlose Beratung.`.slice(0, 155);
        break;
      case "aggressive":
        newDescription = `${baseDesc}. Jetzt Angebot sichern! Top-Bewertungen & schnelle Lieferung.`.slice(0, 155);
        break;
    }
    if (newDescription !== description) {
      changes.push({ field: "description", before: description, after: newDescription });
    }
  }

  return { title: newTitle, description: newDescription, changes };
}

export async function optimizeInternalLinks(
  existingLinks: { url: string; text: string }[],
  availablePages: { url: string; title: string }[],
  pageUrl: string,
  mode: OptimizationMode
): Promise<{ newLinks: { url: string; anchorText: string; context: string }[]; changes: string[] }> {
  const settings = getModeSettings(mode);
  const maxNewLinks = settings.internalLinks.maxNewLinks;
  const changes: string[] = [];
  const newLinks: { url: string; anchorText: string; context: string }[] = [];

  const existingUrls = new Set(existingLinks.map(l => l.url));
  const candidatePages = availablePages
    .filter(p => p.url !== pageUrl && !existingUrls.has(p.url))
    .slice(0, maxNewLinks);

  for (const page of candidatePages) {
    let anchorText = page.title;
    
    switch (settings.internalLinks.anchorTextOptimization) {
      case "minimal":
        anchorText = page.title.slice(0, 30);
        break;
      case "balanced":
        anchorText = `${page.title.slice(0, 40)} - Mehr erfahren`;
        break;
      case "aggressive":
        anchorText = `Entdecken Sie ${page.title.slice(0, 35)} - Jetzt ansehen`;
        break;
    }

    newLinks.push({
      url: page.url,
      anchorText,
      context: `Link zu verwandtem Inhalt: ${page.title}`,
    });
    changes.push(`Neuer Link: "${anchorText}" → ${page.url}`);
  }

  return { newLinks, changes };
}
