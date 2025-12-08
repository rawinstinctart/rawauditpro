export type AgentType = "strategy" | "audit" | "content" | "fix" | "ranking";

export interface AgentThought {
  reasoning: string;
  action: string;
  confidence: number;
}

export interface SEOIssue {
  type: string;
  category: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  riskLevel: "high" | "medium" | "low";
  currentValue?: string;
  suggestedValue?: string;
  pageUrl: string;
  autoFixable: boolean;
}

export interface ImageAsset {
  src: string;
  absoluteSrc: string;
  alt?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  format?: string;
  hasLazyLoading?: boolean;
  loadTime?: number;
  hash?: string;
  issues: ImageIssueType[];
  recommendedAction?: string;
}

export type ImageIssueType = 
  | "oversized_file"
  | "png_should_be_webp"
  | "oversized_dimensions"
  | "missing_alt"
  | "duplicate_image"
  | "no_lazy_loading"
  | "poor_compression";

export interface ImageOptimizationResult {
  originalUrl: string;
  originalSize: number;
  optimizedSize: number;
  savedBytes: number;
  savedPercent: number;
  newFormat: string;
  newWidth?: number;
  newHeight?: number;
  optimizedBuffer?: Buffer;
  recommendation: string;
}

export interface ImageReport {
  totalImages: number;
  imagesWithIssues: number;
  totalOriginalSize: number;
  totalOptimizedSize: number;
  totalSavedBytes: number;
  averageSavingsPercent: number;
  issueBreakdown: Record<ImageIssueType, number>;
  optimizedImages: ImageOptimizationResult[];
}

export interface CrawlResult {
  url: string;
  title?: string;
  metaDescription?: string;
  h1?: string[];
  h2?: string[];
  images?: { src: string; alt?: string }[];
  imagesDetailed?: ImageAsset[];
  links?: { href: string; text: string }[];
  bodyText?: string;
  statusCode?: number;
  loadTime?: number;
}

export interface AuditContext {
  websiteId: string;
  auditId: string;
  url: string;
  crawlData: CrawlResult[];
}

export interface AgentMessage {
  agentType: AgentType;
  message: string;
  reasoning?: string;
  action?: string;
  metadata?: Record<string, any>;
}
