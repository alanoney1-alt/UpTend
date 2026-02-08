import { db } from "../../../db";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  esgImpactLogs,
  esgReports,
  platformSustainabilityStats,
  type EsgImpactLog,
  type InsertEsgImpactLog,
  type EsgReport,
  type InsertEsgReport,
  type PlatformSustainabilityStats,
} from "@shared/schema";

export class EsgStorage {
  // ESG Impact Logs
  async createEsgImpactLog(log: InsertEsgImpactLog): Promise<EsgImpactLog> {
    const [result] = await db.insert(esgImpactLogs).values(log).returning();
    return result;
  }

  async getEsgImpactLogByRequest(serviceRequestId: string): Promise<EsgImpactLog | undefined> {
    const [result] = await db.select().from(esgImpactLogs).where(eq(esgImpactLogs.serviceRequestId, serviceRequestId));
    return result || undefined;
  }

  async getEsgImpactLogsByCustomer(customerId: string): Promise<EsgImpactLog[]> {
    return db.select().from(esgImpactLogs).where(eq(esgImpactLogs.customerId, customerId)).orderBy(desc(esgImpactLogs.createdAt));
  }

  async getEsgImpactLogsByHauler(haulerId: string): Promise<EsgImpactLog[]> {
    return db.select().from(esgImpactLogs).where(eq(esgImpactLogs.haulerId, haulerId)).orderBy(desc(esgImpactLogs.createdAt));
  }

  async getEsgSummary(): Promise<{ totalJobs: number; totalCarbonLbs: number; totalDivertedLbs: number; avgDiversionRate: number }> {
    const results = await db.select({
      totalJobs: sql<number>`count(*)::int`,
      totalCarbonLbs: sql<number>`coalesce(sum(${esgImpactLogs.carbonFootprintLbs}), 0)`,
      totalDivertedLbs: sql<number>`coalesce(sum(${esgImpactLogs.recycledWeightLbs} + ${esgImpactLogs.donatedWeightLbs}), 0)`,
      avgDiversionRate: sql<number>`coalesce(avg(${esgImpactLogs.diversionRate}), 0)`,
    }).from(esgImpactLogs);
    return results[0] || { totalJobs: 0, totalCarbonLbs: 0, totalDivertedLbs: 0, avgDiversionRate: 0 };
  }

  // B2B ESG Reports
  async createEsgReport(report: InsertEsgReport): Promise<EsgReport> {
    const [result] = await db.insert(esgReports).values(report).returning();
    return result;
  }

  async getEsgReportsByBusiness(businessAccountId: string): Promise<EsgReport[]> {
    return db.select().from(esgReports).where(eq(esgReports.businessAccountId, businessAccountId)).orderBy(desc(esgReports.createdAt));
  }

  async getEsgReport(id: string): Promise<EsgReport | undefined> {
    const [result] = await db.select().from(esgReports).where(eq(esgReports.id, id));
    return result || undefined;
  }

  // Platform Sustainability Stats
  async getPlatformSustainabilityStats(): Promise<PlatformSustainabilityStats | undefined> {
    const [result] = await db.select().from(platformSustainabilityStats).limit(1);
    return result || undefined;
  }

  async upsertPlatformSustainabilityStats(stats: Partial<PlatformSustainabilityStats>): Promise<PlatformSustainabilityStats> {
    const existing = await this.getPlatformSustainabilityStats();
    if (existing) {
      const [result] = await db.update(platformSustainabilityStats)
        .set({ ...stats, updatedAt: new Date().toISOString() })
        .where(eq(platformSustainabilityStats.id, existing.id))
        .returning();
      return result;
    }
    const [result] = await db.insert(platformSustainabilityStats)
      .values({ ...stats, updatedAt: new Date().toISOString() } as any)
      .returning();
    return result;
  }
}
