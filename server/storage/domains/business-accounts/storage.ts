import { db } from "../../../db";
import { eq } from "drizzle-orm";
import {
  businessAccounts,
  recurringJobs,
  type BusinessAccount,
  type InsertBusinessAccount,
  type RecurringJob,
  type InsertRecurringJob,
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

  async updateRecurringJob(id: string, updates: Partial<RecurringJob>): Promise<RecurringJob | undefined> {
    const [result] = await db.update(recurringJobs).set(updates).where(eq(recurringJobs.id, id)).returning();
    return result || undefined;
  }

  async getActiveRecurringJobs(): Promise<RecurringJob[]> {
    return db.select().from(recurringJobs).where(eq(recurringJobs.isActive, true));
  }
}
