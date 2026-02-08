import { db } from "../../../db";
import { eq } from "drizzle-orm";
import {
  jobAdjustments,
  jobCompletions,
  type JobAdjustment,
  type InsertJobAdjustment,
  type JobCompletion,
  type InsertJobCompletion,
} from "@shared/schema";

export class JobManagementStorage {
  // Job Adjustments
  async createJobAdjustment(adjustment: InsertJobAdjustment): Promise<JobAdjustment> {
    const [newAdjustment] = await db.insert(jobAdjustments).values(adjustment).returning();
    return newAdjustment;
  }

  async getJobAdjustmentsByRequest(serviceRequestId: string): Promise<JobAdjustment[]> {
    return db.select().from(jobAdjustments).where(eq(jobAdjustments.serviceRequestId, serviceRequestId));
  }

  async updateJobAdjustment(id: string, updates: Partial<JobAdjustment>): Promise<JobAdjustment | undefined> {
    const [updated] = await db.update(jobAdjustments)
      .set(updates)
      .where(eq(jobAdjustments.id, id))
      .returning();
    return updated || undefined;
  }

  async approveJobAdjustment(id: string): Promise<JobAdjustment | undefined> {
    const [updated] = await db.update(jobAdjustments)
      .set({ status: "approved", customerApprovedAt: new Date().toISOString() })
      .where(eq(jobAdjustments.id, id))
      .returning();
    return updated || undefined;
  }

  async declineJobAdjustment(id: string): Promise<JobAdjustment | undefined> {
    const [updated] = await db.update(jobAdjustments)
      .set({ status: "declined", customerDeclinedAt: new Date().toISOString() })
      .where(eq(jobAdjustments.id, id))
      .returning();
    return updated || undefined;
  }

  // Job Completions
  async createJobCompletion(completion: InsertJobCompletion): Promise<JobCompletion> {
    const [newCompletion] = await db.insert(jobCompletions).values(completion).returning();
    return newCompletion;
  }

  async getJobCompletion(serviceRequestId: string): Promise<JobCompletion | undefined> {
    const [completion] = await db.select().from(jobCompletions)
      .where(eq(jobCompletions.serviceRequestId, serviceRequestId));
    return completion || undefined;
  }

  async updateJobCompletion(id: string, updates: Partial<JobCompletion>): Promise<JobCompletion | undefined> {
    const [updated] = await db.update(jobCompletions)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(jobCompletions.id, id))
      .returning();
    return updated || undefined;
  }

  async getAllJobsWithDetails(): Promise<any[]> {
    // This method would need to be implemented with proper joins
    // For now, returning empty array as placeholder
    return [];
  }
}
