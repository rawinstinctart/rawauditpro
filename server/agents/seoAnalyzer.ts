import type { CrawlResult, SEOIssue, ImageAsset, ImageReport } from "./types";

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

export function analyzeImageSEO(images: ImageAsset[], pageUrl: string): SEOIssue[] {
  const issues: SEOIssue[] = [];
  
  const oversizedFiles = images.filter(img => img.issues.includes("oversized_file"));
  if (oversizedFiles.length > 0) {
    const totalSize = oversizedFiles.reduce((sum, img) => sum + (img.fileSize || 0), 0);
    issues.push({
      type: "oversized_images",
      category: "Performance",
      title: `${oversizedFiles.length} Oversized Image${oversizedFiles.length > 1 ? "s" : ""}`,
      description: `Found ${oversizedFiles.length} image(s) over 150KB. Large images slow down page loading.`,
      severity: oversizedFiles.length > 3 ? "critical" : "high",
      riskLevel: "low",
      currentValue: `${Math.round(totalSize / 1024)}KB total`,
      suggestedValue: "Compress images to under 150KB each",
      pageUrl,
      autoFixable: true,
    });
  }
  
  const pngCandidates = images.filter(img => img.issues.includes("png_should_be_webp"));
  if (pngCandidates.length > 0) {
    issues.push({
      type: "png_to_webp",
      category: "Performance",
      title: `${pngCandidates.length} PNG Image${pngCandidates.length > 1 ? "s" : ""} Should Be WebP`,
      description: "Non-transparent PNG images can be converted to WebP for 25-50% smaller file sizes.",
      severity: "medium",
      riskLevel: "low",
      currentValue: `${pngCandidates.length} PNG images without transparency`,
      suggestedValue: "Convert to WebP format",
      pageUrl,
      autoFixable: true,
    });
  }
  
  const oversizedDimensions = images.filter(img => img.issues.includes("oversized_dimensions"));
  if (oversizedDimensions.length > 0) {
    issues.push({
      type: "oversized_dimensions",
      category: "Performance",
      title: `${oversizedDimensions.length} Image${oversizedDimensions.length > 1 ? "s" : ""} Too Large`,
      description: "Images wider than 1200px are likely larger than needed for most displays.",
      severity: "medium",
      riskLevel: "low",
      currentValue: `${oversizedDimensions.length} images over 1200px wide`,
      suggestedValue: "Resize to maximum 1200px width",
      pageUrl,
      autoFixable: true,
    });
  }
  
  const missingAlt = images.filter(img => img.issues.includes("missing_alt"));
  if (missingAlt.length > 0) {
    issues.push({
      type: "images_missing_alt",
      category: "Accessibility",
      title: `${missingAlt.length} Image${missingAlt.length > 1 ? "s" : ""} Missing Alt Text`,
      description: "Images without alt text hurt accessibility and SEO. Screen readers cannot describe these images.",
      severity: missingAlt.length > 5 ? "high" : "medium",
      riskLevel: "low",
      currentValue: `${missingAlt.length} images without alt text`,
      suggestedValue: "Add descriptive alt text to each image",
      pageUrl,
      autoFixable: false,
    });
  }
  
  const noLazyLoading = images.filter(img => img.issues.includes("no_lazy_loading"));
  if (noLazyLoading.length > 3) {
    issues.push({
      type: "missing_lazy_loading",
      category: "Performance",
      title: `${noLazyLoading.length} Images Without Lazy Loading`,
      description: "Images below the fold should use lazy loading to improve initial page load time.",
      severity: noLazyLoading.length > 8 ? "high" : "medium",
      riskLevel: "low",
      currentValue: `${noLazyLoading.length} images without loading='lazy'`,
      suggestedValue: "Add loading='lazy' attribute",
      pageUrl,
      autoFixable: true,
    });
  }
  
  const duplicates = images.filter(img => img.issues.includes("duplicate_image"));
  if (duplicates.length > 0) {
    issues.push({
      type: "duplicate_images",
      category: "Performance",
      title: `${duplicates.length} Duplicate Image${duplicates.length > 1 ? "s" : ""} Found`,
      description: "The same image is loaded multiple times. Consider using a single instance.",
      severity: "low",
      riskLevel: "low",
      currentValue: `${duplicates.length} duplicate images`,
      suggestedValue: "Remove duplicate image references",
      pageUrl,
      autoFixable: false,
    });
  }
  
  const poorCompression = images.filter(img => img.issues.includes("poor_compression"));
  if (poorCompression.length > 0) {
    issues.push({
      type: "poor_compression",
      category: "Performance",
      title: `${poorCompression.length} Image${poorCompression.length > 1 ? "s" : ""} Poorly Compressed`,
      description: "These images have higher than expected bytes per pixel, suggesting poor compression.",
      severity: "medium",
      riskLevel: "low",
      currentValue: `${poorCompression.length} images with poor compression`,
      suggestedValue: "Re-compress with optimal quality settings",
      pageUrl,
      autoFixable: true,
    });
  }
  
  return issues;
}

export function generateImageReport(crawlResults: CrawlResult[]): ImageReport {
  const allImages: ImageAsset[] = [];
  
  for (const result of crawlResults) {
    if (result.imagesDetailed) {
      allImages.push(...result.imagesDetailed);
    }
  }
  
  const issueBreakdown: Record<string, number> = {
    oversized_file: 0,
    png_should_be_webp: 0,
    oversized_dimensions: 0,
    missing_alt: 0,
    duplicate_image: 0,
    no_lazy_loading: 0,
    poor_compression: 0,
  };
  
  let imagesWithIssues = 0;
  let totalOriginalSize = 0;
  
  for (const img of allImages) {
    if (img.fileSize) {
      totalOriginalSize += img.fileSize;
    }
    
    if (img.issues.length > 0) {
      imagesWithIssues++;
      for (const issue of img.issues) {
        issueBreakdown[issue] = (issueBreakdown[issue] || 0) + 1;
      }
    }
  }
  
  const potentialSavingsPercent = imagesWithIssues > 0 
    ? Math.min(50, (imagesWithIssues / allImages.length) * 40)
    : 0;
  
  const estimatedOptimizedSize = Math.round(totalOriginalSize * (1 - potentialSavingsPercent / 100));
  const totalSavedBytes = totalOriginalSize - estimatedOptimizedSize;
  
  return {
    totalImages: allImages.length,
    imagesWithIssues,
    totalOriginalSize,
    totalOptimizedSize: estimatedOptimizedSize,
    totalSavedBytes,
    averageSavingsPercent: Math.round(potentialSavingsPercent),
    issueBreakdown: issueBreakdown as any,
    optimizedImages: [],
  };
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
