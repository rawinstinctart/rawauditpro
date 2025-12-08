import type { CrawlResult, SEOIssue } from "./types";

export function analyzePageSEO(page: CrawlResult): SEOIssue[] {
  const issues: SEOIssue[] = [];
  
  // Check title
  if (!page.title) {
    issues.push({
      type: "missing_title",
      category: "Meta Tags",
      title: "Missing Page Title",
      description: "This page is missing a title tag. Page titles are crucial for SEO and user experience.",
      severity: "critical",
      riskLevel: "low",
      currentValue: "",
      suggestedValue: generateTitleSuggestion(page),
      pageUrl: page.url,
      autoFixable: true,
    });
  } else if (page.title.length < 30) {
    issues.push({
      type: "short_title",
      category: "Meta Tags",
      title: "Title Too Short",
      description: `Title is only ${page.title.length} characters. Titles should be 50-60 characters for optimal SEO.`,
      severity: "medium",
      riskLevel: "low",
      currentValue: page.title,
      suggestedValue: generateTitleSuggestion(page),
      pageUrl: page.url,
      autoFixable: true,
    });
  } else if (page.title.length > 60) {
    issues.push({
      type: "long_title",
      category: "Meta Tags",
      title: "Title Too Long",
      description: `Title is ${page.title.length} characters. Titles over 60 characters may be truncated in search results.`,
      severity: "low",
      riskLevel: "low",
      currentValue: page.title,
      suggestedValue: page.title.slice(0, 57) + "...",
      pageUrl: page.url,
      autoFixable: true,
    });
  }
  
  // Check meta description
  if (!page.metaDescription) {
    issues.push({
      type: "missing_meta_description",
      category: "Meta Tags",
      title: "Missing Meta Description",
      description: "This page is missing a meta description. Meta descriptions help improve click-through rates from search results.",
      severity: "high",
      riskLevel: "low",
      currentValue: "",
      suggestedValue: generateMetaDescriptionSuggestion(page),
      pageUrl: page.url,
      autoFixable: true,
    });
  } else if (page.metaDescription.length < 120) {
    issues.push({
      type: "short_meta_description",
      category: "Meta Tags",
      title: "Meta Description Too Short",
      description: `Meta description is only ${page.metaDescription.length} characters. Aim for 150-160 characters.`,
      severity: "medium",
      riskLevel: "low",
      currentValue: page.metaDescription,
      suggestedValue: generateMetaDescriptionSuggestion(page),
      pageUrl: page.url,
      autoFixable: true,
    });
  } else if (page.metaDescription.length > 160) {
    issues.push({
      type: "long_meta_description",
      category: "Meta Tags",
      title: "Meta Description Too Long",
      description: `Meta description is ${page.metaDescription.length} characters. Descriptions over 160 characters may be truncated.`,
      severity: "low",
      riskLevel: "low",
      currentValue: page.metaDescription,
      suggestedValue: page.metaDescription.slice(0, 157) + "...",
      pageUrl: page.url,
      autoFixable: true,
    });
  }
  
  // Check H1 tags
  if (!page.h1 || page.h1.length === 0) {
    issues.push({
      type: "missing_h1",
      category: "Headings",
      title: "Missing H1 Tag",
      description: "This page is missing an H1 heading. H1 tags are important for accessibility and SEO.",
      severity: "high",
      riskLevel: "medium",
      currentValue: "",
      suggestedValue: page.title || "Add a descriptive H1 heading",
      pageUrl: page.url,
      autoFixable: false,
    });
  } else if (page.h1.length > 1) {
    issues.push({
      type: "multiple_h1",
      category: "Headings",
      title: "Multiple H1 Tags",
      description: `Found ${page.h1.length} H1 tags. Best practice is to have exactly one H1 per page.`,
      severity: "medium",
      riskLevel: "medium",
      currentValue: page.h1.join(", "),
      suggestedValue: "Keep only the primary H1 heading",
      pageUrl: page.url,
      autoFixable: false,
    });
  }
  
  // Check images for alt text
  if (page.images) {
    const imagesWithoutAlt = page.images.filter(img => !img.alt || img.alt.trim() === "");
    if (imagesWithoutAlt.length > 0) {
      issues.push({
        type: "missing_alt_text",
        category: "Accessibility",
        title: `${imagesWithoutAlt.length} Images Missing Alt Text`,
        description: "Images without alt text hurt accessibility and SEO. Add descriptive alt text to all images.",
        severity: imagesWithoutAlt.length > 5 ? "high" : "medium",
        riskLevel: "low",
        currentValue: `${imagesWithoutAlt.length} images without alt text`,
        suggestedValue: "Add descriptive alt text to each image",
        pageUrl: page.url,
        autoFixable: false,
      });
    }
  }
  
  // Check page load time
  if (page.loadTime && page.loadTime > 3000) {
    issues.push({
      type: "slow_page",
      category: "Performance",
      title: "Slow Page Load Time",
      description: `Page took ${(page.loadTime / 1000).toFixed(1)}s to load. Aim for under 3 seconds.`,
      severity: page.loadTime > 5000 ? "high" : "medium",
      riskLevel: "high",
      currentValue: `${(page.loadTime / 1000).toFixed(1)}s`,
      suggestedValue: "Optimize images, enable caching, minify resources",
      pageUrl: page.url,
      autoFixable: false,
    });
  }
  
  // Check for thin content
  if (page.bodyText && page.bodyText.split(/\s+/).length < 300) {
    const wordCount = page.bodyText.split(/\s+/).length;
    issues.push({
      type: "thin_content",
      category: "Content",
      title: "Thin Content",
      description: `Page has only ${wordCount} words. Consider adding more valuable content.`,
      severity: wordCount < 100 ? "high" : "medium",
      riskLevel: "high",
      currentValue: `${wordCount} words`,
      suggestedValue: "Add more comprehensive, valuable content (aim for 500+ words)",
      pageUrl: page.url,
      autoFixable: false,
    });
  }
  
  // Check HTTP status
  if (page.statusCode && page.statusCode !== 200) {
    issues.push({
      type: "http_error",
      category: "Technical",
      title: `HTTP ${page.statusCode} Error`,
      description: `Page returned HTTP ${page.statusCode} status code.`,
      severity: page.statusCode >= 500 ? "critical" : "high",
      riskLevel: "high",
      currentValue: `HTTP ${page.statusCode}`,
      suggestedValue: "Fix server configuration or redirect issues",
      pageUrl: page.url,
      autoFixable: false,
    });
  }
  
  return issues;
}

function generateTitleSuggestion(page: CrawlResult): string {
  if (page.h1 && page.h1[0]) {
    return page.h1[0].slice(0, 55) + (page.h1[0].length > 55 ? "..." : "");
  }
  
  if (page.bodyText) {
    const words = page.bodyText.split(/\s+/).slice(0, 10).join(" ");
    return words.slice(0, 55) + "...";
  }
  
  try {
    const hostname = new URL(page.url).hostname.replace(/^www\./, "");
    return `Welcome to ${hostname}`;
  } catch {
    return "Your Page Title Here - Describe Your Content";
  }
}

function generateMetaDescriptionSuggestion(page: CrawlResult): string {
  if (page.bodyText) {
    const sentences = page.bodyText.split(/[.!?]+/);
    let description = "";
    for (const sentence of sentences) {
      if (description.length + sentence.length < 155) {
        description += sentence.trim() + ". ";
      } else {
        break;
      }
    }
    return description.trim() || page.bodyText.slice(0, 155) + "...";
  }
  
  if (page.title) {
    return `Learn more about ${page.title}. Discover valuable information and insights.`;
  }
  
  return "Discover valuable content and insights on this page. Learn more about our offerings.";
}

export function calculateHealthScore(issues: SEOIssue[]): number {
  let score = 100;
  
  for (const issue of issues) {
    switch (issue.severity) {
      case "critical":
        score -= 15;
        break;
      case "high":
        score -= 10;
        break;
      case "medium":
        score -= 5;
        break;
      case "low":
        score -= 2;
        break;
    }
  }
  
  return Math.max(0, Math.min(100, score));
}
