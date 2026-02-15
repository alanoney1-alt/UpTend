import { db } from "../../../db";
import { eq, and } from "drizzle-orm";
import {
  businessAccounts,
  recurringJobs,
  businessTeamMembers,
  type BusinessAccount,
  type InsertBusinessAccount,
  type RecurringJob,
  type InsertRecurringJob,
  type BusinessTeamMember,
  type InsertBusinessTeamMember,
} from "@shared/schema";

export class BusinessAccountsStorage {
  // Business Accounts
  async createBusinessAccount(account: InsertBusinessAccount): Promise<BusinessAccount> {
    const [result] = await db.insert(businessAccounts).values(account).returning();
    return result;
  }

  async getBusinessAccountByUser(userId: string): Promise<BusinessAccount | undefined> {
    const [result] = await db.select().from(businessAccounts).where(eq(businessAccounts.userId, userId));
    return result || undefined;
  }

  async getBusinessAccount(id: string): Promise<BusinessAccount | undefined> {
    const [result] = await db.select().from(businessAccounts).where(eq(businessAccounts.id, id));
    return result || undefined;
  }

  async updateBusinessAccount(id: string, updates: Partial<BusinessAccount>): Promise<BusinessAccount | undefined> {
    const [result] = await db.update(businessAccounts).set(updates).where(eq(businessAccounts.id, id)).returning();
    return result || undefined;
  }

  // Recurring Jobs
  async createRecurringJob(job: InsertRecurringJob): Promise<RecurringJob> {
    const [result] = await db.insert(recurringJobs).values(job).returning();
    return result;
  }

  async getRecurringJobsByBusinessAccount(businessAccountId: string): Promise<RecurringJob[]> {
    return db.select().from(recurringJobs).where(eq(recurringJobs.businessAccountId, businessAccountId));
  }

  async getRecurringJob(id: string): Promise<RecurringJob | undefined> {
    const [result] = await db.select().from(recurringJobs).where(eq(recurringJobs.id, id));
    return result || undefined;
  }

  async updateRecurringJob(id: string, updates: Partial<RecurringJob>): Promise<RecurringJob | undefined> {
    const [result] = await db.update(recurringJobs).set(updates).where(eq(recurringJobs.id, id)).returning();
    return result || undefined;
  }

  async getActiveRecurringJobs(): Promise<RecurringJob[]> {
    return db.select().from(recurringJobs).where(eq(recurringJobs.isActive, true));
  }

  // Business Team Members (Multi-User)
  async createTeamMember(member: InsertBusinessTeamMember): Promise<BusinessTeamMember> {
    const [result] = await db.insert(businessTeamMembers).values(member).returning();
    return result;
  }

  async getTeamMembersByBusiness(businessAccountId: string): Promise<BusinessTeamMember[]> {
    return db.select().from(businessTeamMembers).where(
      and(
        eq(businessTeamMembers.businessAccountId, businessAccountId),
        eq(businessTeamMembers.isActive, true)
      )
    );
  }

  async getBusinessMembershipsForUser(userId: string): Promise<BusinessTeamMember[]> {
    return db.select().from(businessTeamMembers).where(
      and(
        eq(businessTeamMembers.userId, userId),
        eq(businessTeamMembers.isActive, true),
        eq(businessTeamMembers.invitationStatus, "accepted")
      )
    );
  }

  async getTeamMemberById(id: string): Promise<BusinessTeamMember | undefined> {
    const [result] = await db.select().from(businessTeamMembers).where(eq(businessTeamMembers.id, id));
    return result || undefined;
  }

  async getTeamMemberByToken(invitationToken: string): Promise<BusinessTeamMember | undefined> {
    const [result] = await db.select().from(businessTeamMembers).where(eq(businessTeamMembers.invitationToken, invitationToken));
    return result || undefined;
  }

  async getTeamMemberByUserAndBusiness(userId: string, businessAccountId: string): Promise<BusinessTeamMember | undefined> {
    const [result] = await db.select().from(businessTeamMembers).where(
      and(
        eq(businessTeamMembers.userId, userId),
        eq(businessTeamMembers.businessAccountId, businessAccountId)
      )
    );
    return result || undefined;
  }

  async updateTeamMember(id: string, updates: Partial<BusinessTeamMember>): Promise<BusinessTeamMember | undefined> {
    const [result] = await db.update(businessTeamMembers)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(businessTeamMembers.id, id))
      .returning();
    return result || undefined;
  }

  async deleteTeamMember(id: string): Promise<void> {
    await db.update(businessTeamMembers)
      .set({ isActive: false, updatedAt: new Date().toISOString() })
      .where(eq(businessTeamMembers.id, id));
  }
}
