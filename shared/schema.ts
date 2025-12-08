import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  real,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const severityEnum = pgEnum("severity", ["critical", "high", "medium", "low"]);
export const issueStatusEnum = pgEnum("issue_status", ["pending", "approved", "rejected", "fixed", "auto_fixed"]);
export const riskLevelEnum = pgEnum("risk_level", ["high", "medium", "low"]);
export const agentTypeEnum = pgEnum("agent_type", ["strategy", "audit", "content", "fix", "ranking"]);
export const auditStatusEnum = pgEnum("audit_status", ["pending", "queued", "running", "completed", "failed"]);
export const subscriptionTierEnum = pgEnum("subscription_tier", ["free", "pro"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "canceled", "past_due", "trialing"]);
export const fixVariantEnum = pgEnum("fix_variant", ["safe", "recommended", "aggressive"]);

// Session storage table (IMPORTANT: Required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table (IMPORTANT: Required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  subscriptionTier: subscriptionTierEnum("subscription_tier").default("free"),
  subscriptionStatus: subscriptionStatusEnum("subscription_status").default("active"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  currentPeriodEnd: timestamp("current_period_end"),
  auditCount: integer("audit_count").default(0),
  auditResetAt: timestamp("audit_reset_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Websites table
export const websites = pgTable("websites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  url: text("url").notNull(),
  name: text("name").notNull(),
  faviconUrl: text("favicon_url"),
  lastAuditAt: timestamp("last_audit_at"),
  healthScore: integer("health_score").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audits table
export const audits = pgTable("audits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  websiteId: varchar("website_id").notNull().references(() => websites.id),
  status: auditStatusEnum("status").default("queued"),
  progress: integer("progress").default(0),
  totalIssues: integer("total_issues").default(0),
  criticalCount: integer("critical_count").default(0),
  highCount: integer("high_count").default(0),
  mediumCount: integer("medium_count").default(0),
  lowCount: integer("low_count").default(0),
  score: integer("score").default(0),
  scoreBefore: integer("score_before"),
  scoreAfter: integer("score_after"),
  pagesScanned: integer("pages_scanned").default(0),
  crawlData: jsonb("crawl_data"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Issues table
export const issues = pgTable("issues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  auditId: varchar("audit_id").notNull().references(() => audits.id),
  websiteId: varchar("website_id").notNull().references(() => websites.id),
  pageUrl: text("page_url").notNull(),
  issueType: text("issue_type").notNull(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  message: text("message"),
  codeSnippet: text("code_snippet"),
  severity: severityEnum("severity").default("medium"),
  status: issueStatusEnum("status").default("pending"),
  riskLevel: riskLevelEnum("risk_level").default("medium"),
  currentValue: text("current_value"),
  suggestedValue: text("suggested_value"),
  aiFixProposalSafe: text("ai_fix_proposal_safe"),
  aiFixProposalRecommended: text("ai_fix_proposal_recommended"),
  aiFixProposalAggressive: text("ai_fix_proposal_aggressive"),
  chosenFixVariant: fixVariantEnum("chosen_fix_variant"),
  aiReasoning: text("ai_reasoning"),
  riskExplanation: text("risk_explanation"),
  confidence: real("confidence").default(0),
  confidenceScore: integer("confidence_score"),
  impactScore: integer("impact_score"),
  autoFixable: boolean("auto_fixable").default(false),
  fixedAt: timestamp("fixed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Changes table (for tracking fixes and rollbacks)
export const changes = pgTable("changes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  issueId: varchar("issue_id").references(() => issues.id),
  websiteId: varchar("website_id").notNull().references(() => websites.id),
  changeType: text("change_type").notNull(),
  pageUrl: text("page_url").notNull(),
  beforeValue: text("before_value"),
  afterValue: text("after_value"),
  status: text("status").default("pending"),
  appliedAt: timestamp("applied_at"),
  rolledBackAt: timestamp("rolled_back_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Agent logs table
export const agentLogs = pgTable("agent_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  websiteId: varchar("website_id").references(() => websites.id),
  auditId: varchar("audit_id").references(() => audits.id),
  agentType: agentTypeEnum("agent_type").notNull(),
  message: text("message").notNull(),
  reasoning: text("reasoning"),
  action: text("action"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Agent memory table (for learning patterns)
export const agentMemory = pgTable("agent_memory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  memoryType: text("memory_type").notNull(),
  key: text("key").notNull(),
  value: jsonb("value"),
  confidence: real("confidence").default(0.5),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  websites: many(websites),
  agentMemory: many(agentMemory),
}));

export const websitesRelations = relations(websites, ({ one, many }) => ({
  user: one(users, {
    fields: [websites.userId],
    references: [users.id],
  }),
  audits: many(audits),
  issues: many(issues),
  changes: many(changes),
  agentLogs: many(agentLogs),
}));

export const auditsRelations = relations(audits, ({ one, many }) => ({
  website: one(websites, {
    fields: [audits.websiteId],
    references: [websites.id],
  }),
  issues: many(issues),
  agentLogs: many(agentLogs),
}));

export const issuesRelations = relations(issues, ({ one, many }) => ({
  audit: one(audits, {
    fields: [issues.auditId],
    references: [audits.id],
  }),
  website: one(websites, {
    fields: [issues.websiteId],
    references: [websites.id],
  }),
  changes: many(changes),
}));

export const changesRelations = relations(changes, ({ one }) => ({
  issue: one(issues, {
    fields: [changes.issueId],
    references: [issues.id],
  }),
  website: one(websites, {
    fields: [changes.websiteId],
    references: [websites.id],
  }),
}));

export const agentLogsRelations = relations(agentLogs, ({ one }) => ({
  website: one(websites, {
    fields: [agentLogs.websiteId],
    references: [websites.id],
  }),
  audit: one(audits, {
    fields: [agentLogs.auditId],
    references: [audits.id],
  }),
}));

export const agentMemoryRelations = relations(agentMemory, ({ one }) => ({
  user: one(users, {
    fields: [agentMemory.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWebsiteSchema = createInsertSchema(websites).omit({ id: true, createdAt: true, updatedAt: true, lastAuditAt: true, healthScore: true });
export const insertAuditSchema = createInsertSchema(audits).omit({ id: true, createdAt: true });
export const insertIssueSchema = createInsertSchema(issues).omit({ id: true, createdAt: true, fixedAt: true });
export const insertChangeSchema = createInsertSchema(changes).omit({ id: true, createdAt: true, appliedAt: true, rolledBackAt: true });
export const insertAgentLogSchema = createInsertSchema(agentLogs).omit({ id: true, createdAt: true });
export const insertAgentMemorySchema = createInsertSchema(agentMemory).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertWebsite = z.infer<typeof insertWebsiteSchema>;
export type Website = typeof websites.$inferSelect;
export type InsertAudit = z.infer<typeof insertAuditSchema>;
export type Audit = typeof audits.$inferSelect;
export type InsertIssue = z.infer<typeof insertIssueSchema>;
export type Issue = typeof issues.$inferSelect;
export type InsertChange = z.infer<typeof insertChangeSchema>;
export type Change = typeof changes.$inferSelect;
export type InsertAgentLog = z.infer<typeof insertAgentLogSchema>;
export type AgentLog = typeof agentLogs.$inferSelect;
export type InsertAgentMemory = z.infer<typeof insertAgentMemorySchema>;
export type AgentMemory = typeof agentMemory.$inferSelect;

// API response types
export type WebsiteWithStats = Website & {
  totalIssues?: number;
  pendingChanges?: number;
};

export type AuditWithIssues = Audit & {
  issues?: Issue[];
  website?: Website;
};

export type IssueWithSuggestion = Issue & {
  change?: Change;
};
