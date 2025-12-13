import {
  users,
  websites,
  audits,
  issues,
  changes,
  agentLogs,
  agentMemory,
  drafts,
  type User,
  type UpsertUser,
  type Website,
  type InsertWebsite,
  type Audit,
  type InsertAudit,
  type Issue,
  type InsertIssue,
  type Change,
  type InsertChange,
  type AgentLog,
  type InsertAgentLog,
  type AgentMemory,
  type InsertAgentMemory,
  type Draft,
  type InsertDraft,
  type DraftStatus,
} from "@shared/schema";
import { db, isDatabaseConfigured } from "./db";
import { eq, desc, and, inArray, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Website operations
  getWebsites(userId: string): Promise<Website[]>;
  getWebsite(id: string): Promise<Website | undefined>;
  createWebsite(website: InsertWebsite): Promise<Website>;
  updateWebsite(id: string, data: Partial<Website>): Promise<Website | undefined>;
  deleteWebsite(id: string): Promise<void>;
  
  // Audit operations
  getAllUserAudits(userId: string): Promise<Audit[]>;
  getAudits(userId: string): Promise<(Audit & { website?: Website })[]>;
  getAudit(id: string): Promise<(Audit & { website?: Website }) | undefined>;
  getRecentAudits(userId: string, limit?: number): Promise<Audit[]>;
  createAudit(audit: InsertAudit): Promise<Audit>;
  updateAudit(id: string, data: Partial<Audit>): Promise<Audit | undefined>;
  
  // Issue operations
  getIssues(auditId: string): Promise<Issue[]>;
  getIssue(id: string): Promise<Issue | undefined>;
  getPendingIssues(userId: string): Promise<Issue[]>;
  createIssue(issue: InsertIssue): Promise<Issue>;
  updateIssue(id: string, data: Partial<Issue>): Promise<Issue | undefined>;
  
  // Change operations
  getChanges(userId: string): Promise<Change[]>;
  createChange(change: InsertChange): Promise<Change>;
  updateChange(id: string, data: Partial<Change>): Promise<Change | undefined>;
  
  // Agent log operations
  getAgentLogs(limit?: number): Promise<AgentLog[]>;
  getAuditAgentLogs(auditId: string): Promise<AgentLog[]>;
  getRecentAgentLogs(limit?: number): Promise<AgentLog[]>;
  createAgentLog(log: InsertAgentLog): Promise<AgentLog>;
  
  // Agent memory operations
  getAgentMemory(userId: string): Promise<AgentMemory[]>;
  upsertAgentMemory(memory: InsertAgentMemory): Promise<AgentMemory>;
  
  // Draft operations
  getDrafts(auditId: string): Promise<Draft[]>;
  getDraftsByWebsite(websiteId: string): Promise<Draft[]>;
  getPendingDrafts(websiteId: string): Promise<Draft[]>;
  getDraft(id: string): Promise<Draft | undefined>;
  createDraft(draft: InsertDraft): Promise<Draft>;
  updateDraft(id: string, data: Partial<Draft>): Promise<Draft | undefined>;
  approveDraft(id: string): Promise<Draft | undefined>;
  rejectDraft(id: string): Promise<Draft | undefined>;
  applyDraft(id: string): Promise<Draft | undefined>;
  bulkApproveDrafts(draftIds: string[]): Promise<number>;
  bulkApplyDrafts(draftIds: string[]): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByStripeCustomerId(customerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId));
    return user;
  }

  async createUser(userData: Omit<UpsertUser, 'id'>): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUserSubscription(userId: string, data: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string | null;
    subscriptionTier?: 'free' | 'pro';
    subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'trialing';
    currentPeriodEnd?: Date | null;
  }): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async incrementAuditCount(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        auditCount: sql`COALESCE(${users.auditCount}, 0) + 1`,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async resetAuditCount(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        auditCount: 0,
        auditResetAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  // Website operations
  async getWebsites(userId: string): Promise<Website[]> {
    return db.select().from(websites).where(and(eq(websites.userId, userId), eq(websites.isActive, true))).orderBy(desc(websites.createdAt));
  }

  async getActiveWebsiteIds(userId: string): Promise<string[]> {
    const activeWebsites = await db.select({ id: websites.id }).from(websites).where(and(eq(websites.userId, userId), eq(websites.isActive, true)));
    return activeWebsites.map(w => w.id);
  }

  async getWebsite(id: string): Promise<Website | undefined> {
    const [website] = await db.select().from(websites).where(eq(websites.id, id));
    return website;
  }

  async createWebsite(website: InsertWebsite): Promise<Website> {
    const [newWebsite] = await db.insert(websites).values(website).returning();
    return newWebsite;
  }

  async updateWebsite(id: string, data: Partial<Website>): Promise<Website | undefined> {
    const [updated] = await db
      .update(websites)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(websites.id, id))
      .returning();
    return updated;
  }

  async deleteWebsite(id: string): Promise<void> {
    await db.delete(agentLogs).where(eq(agentLogs.websiteId, id));
    await db.delete(drafts).where(eq(drafts.websiteId, id));
    
    await db.update(websites).set({ isActive: false, updatedAt: new Date() }).where(eq(websites.id, id));
  }

  async updateLastFreeAuditAt(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ lastFreeAuditAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateUserByStripeCustomer(customerId: string, data: Partial<User>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.stripeCustomerId, customerId))
      .returning();
    return updated;
  }

  // Audit operations
  async getAllUserAudits(userId: string): Promise<Audit[]> {
    const allWebsites = await db.select({ id: websites.id }).from(websites).where(eq(websites.userId, userId));
    const websiteIds = allWebsites.map(w => w.id);
    
    if (websiteIds.length === 0) return [];
    
    return db.select().from(audits).where(inArray(audits.websiteId, websiteIds)).orderBy(desc(audits.createdAt));
  }

  async getAudits(userId: string): Promise<(Audit & { website?: Website })[]> {
    const userWebsites = await this.getWebsites(userId);
    const websiteIds = userWebsites.map(w => w.id);
    
    if (websiteIds.length === 0) return [];
    
    const result = await db
      .select()
      .from(audits)
      .where(inArray(audits.websiteId, websiteIds))
      .orderBy(desc(audits.createdAt));
    
    return result.map(audit => ({
      ...audit,
      website: userWebsites.find(w => w.id === audit.websiteId),
    }));
  }

  async getAudit(id: string): Promise<(Audit & { website?: Website }) | undefined> {
    const [audit] = await db.select().from(audits).where(eq(audits.id, id));
    if (!audit) return undefined;
    
    const website = await this.getWebsite(audit.websiteId);
    return { ...audit, website };
  }

  async getRecentAudits(userId: string, limit = 10): Promise<Audit[]> {
    const userWebsites = await this.getWebsites(userId);
    const websiteIds = userWebsites.map(w => w.id);
    
    if (websiteIds.length === 0) return [];
    
    return db
      .select()
      .from(audits)
      .where(inArray(audits.websiteId, websiteIds))
      .orderBy(desc(audits.createdAt))
      .limit(limit);
  }

  async createAudit(audit: InsertAudit): Promise<Audit> {
    const [newAudit] = await db.insert(audits).values(audit).returning();
    return newAudit;
  }

  async updateAudit(id: string, data: Partial<Audit>): Promise<Audit | undefined> {
    const [updated] = await db
      .update(audits)
      .set(data)
      .where(eq(audits.id, id))
      .returning();
    return updated;
  }

  // Issue operations
  async getIssues(auditId: string): Promise<Issue[]> {
    return db.select().from(issues).where(eq(issues.auditId, auditId)).orderBy(desc(issues.createdAt));
  }

  async getIssue(id: string): Promise<Issue | undefined> {
    const [issue] = await db.select().from(issues).where(eq(issues.id, id));
    return issue;
  }

  async getPendingIssues(userId: string): Promise<Issue[]> {
    const userWebsites = await this.getWebsites(userId);
    const websiteIds = userWebsites.map(w => w.id);
    
    if (websiteIds.length === 0) return [];
    
    return db
      .select()
      .from(issues)
      .where(and(
        inArray(issues.websiteId, websiteIds),
        eq(issues.status, "pending")
      ))
      .orderBy(desc(issues.createdAt));
  }

  async createIssue(issue: InsertIssue): Promise<Issue> {
    const [newIssue] = await db.insert(issues).values(issue).returning();
    return newIssue;
  }

  async updateIssue(id: string, data: Partial<Issue>): Promise<Issue | undefined> {
    const [updated] = await db
      .update(issues)
      .set(data)
      .where(eq(issues.id, id))
      .returning();
    return updated;
  }

  // Change operations
  async getChanges(userId: string): Promise<Change[]> {
    const userWebsites = await this.getWebsites(userId);
    const websiteIds = userWebsites.map(w => w.id);
    
    if (websiteIds.length === 0) return [];
    
    return db
      .select()
      .from(changes)
      .where(inArray(changes.websiteId, websiteIds))
      .orderBy(desc(changes.createdAt));
  }

  async createChange(change: InsertChange): Promise<Change> {
    const [newChange] = await db.insert(changes).values(change).returning();
    return newChange;
  }

  async updateChange(id: string, data: Partial<Change>): Promise<Change | undefined> {
    const [updated] = await db
      .update(changes)
      .set(data)
      .where(eq(changes.id, id))
      .returning();
    return updated;
  }

  // Agent log operations
  async getAgentLogs(limit = 100): Promise<AgentLog[]> {
    return db.select().from(agentLogs).orderBy(desc(agentLogs.createdAt)).limit(limit);
  }

  async getAuditAgentLogs(auditId: string): Promise<AgentLog[]> {
    return db.select().from(agentLogs).where(eq(agentLogs.auditId, auditId)).orderBy(desc(agentLogs.createdAt));
  }

  async getRecentAgentLogs(limit = 20): Promise<AgentLog[]> {
    return db.select().from(agentLogs).orderBy(desc(agentLogs.createdAt)).limit(limit);
  }

  async createAgentLog(log: InsertAgentLog): Promise<AgentLog> {
    const [newLog] = await db.insert(agentLogs).values(log).returning();
    return newLog;
  }

  // Agent memory operations
  async getAgentMemory(userId: string): Promise<AgentMemory[]> {
    return db.select().from(agentMemory).where(eq(agentMemory.userId, userId));
  }

  async upsertAgentMemory(memory: InsertAgentMemory): Promise<AgentMemory> {
    const [result] = await db
      .insert(agentMemory)
      .values(memory)
      .onConflictDoUpdate({
        target: [agentMemory.userId, agentMemory.key],
        set: {
          value: memory.value,
          confidence: memory.confidence,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  // Draft operations
  async getDrafts(auditId: string): Promise<Draft[]> {
    return db.select().from(drafts).where(eq(drafts.auditId, auditId)).orderBy(desc(drafts.createdAt));
  }

  async getDraftsByWebsite(websiteId: string): Promise<Draft[]> {
    return db.select().from(drafts).where(eq(drafts.websiteId, websiteId)).orderBy(desc(drafts.createdAt));
  }

  async getPendingDrafts(websiteId: string): Promise<Draft[]> {
    return db.select().from(drafts).where(
      and(eq(drafts.websiteId, websiteId), eq(drafts.status, "pending"))
    ).orderBy(desc(drafts.createdAt));
  }

  async getDraft(id: string): Promise<Draft | undefined> {
    const [draft] = await db.select().from(drafts).where(eq(drafts.id, id));
    return draft;
  }

  async createDraft(draft: InsertDraft): Promise<Draft> {
    const [newDraft] = await db.insert(drafts).values(draft).returning();
    return newDraft;
  }

  async updateDraft(id: string, data: Partial<Draft>): Promise<Draft | undefined> {
    const [updated] = await db
      .update(drafts)
      .set(data)
      .where(eq(drafts.id, id))
      .returning();
    return updated;
  }

  async approveDraft(id: string): Promise<Draft | undefined> {
    const [updated] = await db
      .update(drafts)
      .set({ status: "approved", approvedAt: new Date() })
      .where(eq(drafts.id, id))
      .returning();
    return updated;
  }

  async rejectDraft(id: string): Promise<Draft | undefined> {
    const [updated] = await db
      .update(drafts)
      .set({ status: "rejected", rejectedAt: new Date() })
      .where(eq(drafts.id, id))
      .returning();
    return updated;
  }

  async applyDraft(id: string): Promise<Draft | undefined> {
    const [updated] = await db
      .update(drafts)
      .set({ status: "applied", appliedAt: new Date() })
      .where(eq(drafts.id, id))
      .returning();
    return updated;
  }

  async bulkApproveDrafts(draftIds: string[]): Promise<number> {
    if (draftIds.length === 0) return 0;
    const result = await db
      .update(drafts)
      .set({ status: "approved", approvedAt: new Date() })
      .where(and(inArray(drafts.id, draftIds), eq(drafts.status, "pending")));
    return draftIds.length;
  }

  async bulkApplyDrafts(draftIds: string[]): Promise<number> {
    if (draftIds.length === 0) return 0;
    const result = await db
      .update(drafts)
      .set({ status: "applied", appliedAt: new Date() })
      .where(and(inArray(drafts.id, draftIds), eq(drafts.status, "approved")));
    return draftIds.length;
  }
}

class DisabledStorage implements IStorage {
  private fail<T>(): Promise<T> {
    return Promise.reject(new Error("Database is not configured."));
  }

  getUser(): Promise<User | undefined> {
    return this.fail();
  }

  upsertUser(): Promise<User> {
    return this.fail();
  }

  getUserByEmail(): Promise<User | undefined> {
    return this.fail();
  }

  getUserByStripeCustomerId(): Promise<User | undefined> {
    return this.fail();
  }

  createUser(): Promise<User> {
    return this.fail();
  }

  updateUserSubscription(): Promise<User | undefined> {
    return this.fail();
  }

  incrementAuditCount(): Promise<void> {
    return this.fail();
  }

  resetAuditCount(): Promise<void> {
    return this.fail();
  }

  getWebsites(): Promise<Website[]> {
    return this.fail();
  }

  getWebsite(): Promise<Website | undefined> {
    return this.fail();
  }

  createWebsite(): Promise<Website> {
    return this.fail();
  }

  updateWebsite(): Promise<Website | undefined> {
    return this.fail();
  }

  deleteWebsite(): Promise<void> {
    return this.fail();
  }

  getAllUserAudits(): Promise<Audit[]> {
    return this.fail();
  }

  getAudits(): Promise<(Audit & { website?: Website | undefined; })[]> {
    return this.fail();
  }

  getAudit(): Promise<(Audit & { website?: Website | undefined; }) | undefined> {
    return this.fail();
  }

  getRecentAudits(): Promise<Audit[]> {
    return this.fail();
  }

  createAudit(): Promise<Audit> {
    return this.fail();
  }

  updateAudit(): Promise<Audit | undefined> {
    return this.fail();
  }

  getIssues(): Promise<Issue[]> {
    return this.fail();
  }

  getIssue(): Promise<Issue | undefined> {
    return this.fail();
  }

  getPendingIssues(): Promise<Issue[]> {
    return this.fail();
  }

  createIssue(): Promise<Issue> {
    return this.fail();
  }

  updateIssue(): Promise<Issue | undefined> {
    return this.fail();
  }

  getChanges(): Promise<Change[]> {
    return this.fail();
  }

  createChange(): Promise<Change> {
    return this.fail();
  }

  updateChange(): Promise<Change | undefined> {
    return this.fail();
  }

  getAgentLogs(): Promise<AgentLog[]> {
    return this.fail();
  }

  getAuditAgentLogs(): Promise<AgentLog[]> {
    return this.fail();
  }

  getRecentAgentLogs(): Promise<AgentLog[]> {
    return this.fail();
  }

  createAgentLog(): Promise<AgentLog> {
    return this.fail();
  }

  getAgentMemory(): Promise<AgentMemory[]> {
    return this.fail();
  }

  upsertAgentMemory(): Promise<AgentMemory> {
    return this.fail();
  }

  getDrafts(): Promise<Draft[]> {
    return this.fail();
  }

  getDraftsByWebsite(): Promise<Draft[]> {
    return this.fail();
  }

  getPendingDrafts(): Promise<Draft[]> {
    return this.fail();
  }

  getDraft(): Promise<Draft | undefined> {
    return this.fail();
  }

  createDraft(): Promise<Draft> {
    return this.fail();
  }

  updateDraft(): Promise<Draft | undefined> {
    return this.fail();
  }

  approveDraft(): Promise<Draft | undefined> {
    return this.fail();
  }

  rejectDraft(): Promise<Draft | undefined> {
    return this.fail();
  }

  applyDraft(): Promise<Draft | undefined> {
    return this.fail();
  }

  bulkApproveDrafts(): Promise<number> {
    return this.fail();
  }

  bulkApplyDrafts(): Promise<number> {
    return this.fail();
  }
}

export const storage: IStorage = isDatabaseConfigured
  ? new DatabaseStorage()
  : new DisabledStorage();
