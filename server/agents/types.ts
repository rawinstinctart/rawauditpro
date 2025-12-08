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

export interface CrawlResult {
  url: string;
  title?: string;
  metaDescription?: string;
  h1?: string[];
  h2?: string[];
  images?: { src: string; alt?: string }[];
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
