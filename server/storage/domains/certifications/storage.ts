import { db } from "../../../db";
import { eq, desc } from "drizzle-orm";
import {
  deferredJobs,
  haulerCertifications,
  haulerProfiles,
  type DeferredJob,
  type InsertDeferredJob,
  type HaulerCertification,
  type InsertHaulerCertification,
} from "@shared/schema";

export class CertificationsStorage {
  // Deferred Jobs
  async createDeferredJob(job: InsertDeferredJob): Promise<DeferredJob> {
    const [result] = await db.insert(deferredJobs).values(job).returning();
    return result;
  }

  async getDeferredJobsByUser(userId: string): Promise<DeferredJob[]> {
    return db.select().from(deferredJobs)
      .where(eq(deferredJobs.userId, userId))
      .orderBy(desc(deferredJobs.createdAt));
  }

  async updateDeferredJob(id: string, updates: Partial<DeferredJob>): Promise<DeferredJob | undefined> {
    const [result] = await db.update(deferredJobs).set(updates).where(eq(deferredJobs.id, id)).returning();
    return result || undefined;
  }

  // Hauler Certifications
  async createHaulerCertification(cert: InsertHaulerCertification): Promise<HaulerCertification> {
    const [result] = await db.insert(haulerCertifications).values(cert).returning();
    return result;
  }

  async getHaulerCertifications(haulerId: string): Promise<HaulerCertification[]> {
    return db.select().from(haulerCertifications)
      .where(eq(haulerCertifications.haulerId, haulerId));
  }

  async getHaulerCareerStats(haulerId: string): Promise<any> {
    const profile = await db.query.haulerProfiles.findFirst({
      where: eq(haulerProfiles.id, haulerId),
    });
    const certs = await this.getHaulerCertifications(haulerId);
    return {
      level: profile?.level || 1,
      xpPoints: profile?.xpPoints || 0,
      jobsCompleted: profile?.jobsCompleted || 0,
      fiveStarRatingCount: profile?.fiveStarRatingCount || 0,
      rating: profile?.rating || 5.0,
      isConsultantEligible: profile?.isConsultantEligible || false,
      commissionRate: profile?.commissionRate || 0,
      payoutPercentage: profile?.payoutPercentage || 0.85,
      certifications: certs,
    };
  }
}
