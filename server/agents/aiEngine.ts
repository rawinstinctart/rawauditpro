import OpenAI from "openai";
import type { SEOIssue, CrawlResult, AgentThought } from "./types";

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
