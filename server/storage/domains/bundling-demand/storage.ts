import { db } from "../../../db";
import {
  bundlingSuggestions,
  demandHeatmapData,
  type BundlingSuggestion,
  type InsertBundlingSuggestion,
  type DemandHeatmapData,
  type InsertDemandHeatmapData
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface IBundlingDemandStorage {
  createBundlingSuggestion(suggestion: InsertBundlingSuggestion): Promise<BundlingSuggestion>;
  getBundlingSuggestionsByRequest(serviceRequestId: string): Promise<BundlingSuggestion[]>;
  updateBundlingSuggestion(id: string, updates: Partial<BundlingSuggestion>): Promise<BundlingSuggestion | undefined>;
  getDemandHeatmapData(dayOfWeek: number, hourOfDay: number): Promise<DemandHeatmapData[]>;
  upsertDemandHeatmapData(data: InsertDemandHeatmapData): Promise<DemandHeatmapData>;
}

export class BundlingDemandStorage implements IBundlingDemandStorage {
  async createBundlingSuggestion(suggestion: InsertBundlingSuggestion): Promise<BundlingSuggestion> {
    const [result] = await db.insert(bundlingSuggestions).values(suggestion).returning();
    return result;
  }

  async getBundlingSuggestionsByRequest(serviceRequestId: string): Promise<BundlingSuggestion[]> {
    return db.select().from(bundlingSuggestions).where(eq(bundlingSuggestions.serviceRequestId, serviceRequestId));
  }

  async updateBundlingSuggestion(id: string, updates: Partial<BundlingSuggestion>): Promise<BundlingSuggestion | undefined> {
    const [result] = await db.update(bundlingSuggestions).set(updates).where(eq(bundlingSuggestions.id, id)).returning();
    return result || undefined;
  }

  async getDemandHeatmapData(dayOfWeek: number, hourOfDay: number): Promise<DemandHeatmapData[]> {
    return db.select().from(demandHeatmapData)
      .where(and(eq(demandHeatmapData.dayOfWeek, dayOfWeek), eq(demandHeatmapData.hourOfDay, hourOfDay)))
      .orderBy(desc(demandHeatmapData.demandScore));
  }

  async upsertDemandHeatmapData(data: InsertDemandHeatmapData): Promise<DemandHeatmapData> {
    const [result] = await db.insert(demandHeatmapData).values(data).returning();
    return result;
  }
}
