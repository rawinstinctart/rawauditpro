import {
  users,
  websites,
  audits,
  issues,
  changes,
  agentLogs,
  agentMemory,
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
} from "@shared/schema";
import { db } from "./db";
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
    return db.select().from(websites).where(eq(websites.userId, userId)).orderBy(desc(websites.createdAt));
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
    await db.delete(websites).where(eq(websites.id, id));
  }

  // Audit operations
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
}

export const storage = new DatabaseStorage();
