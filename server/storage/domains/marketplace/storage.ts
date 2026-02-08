import { db } from "../../../db";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import {
  marketplaceItems,
  type MarketplaceItem,
  type InsertMarketplaceItem,
} from "@shared/schema";

export interface IMarketplaceStorage {
  createMarketplaceItem(item: InsertMarketplaceItem): Promise<MarketplaceItem>;
  getMarketplaceItem(id: string): Promise<MarketplaceItem | undefined>;
  getMarketplaceItems(filters?: {
    category?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    status?: string;
  }): Promise<MarketplaceItem[]>;
  getMarketplaceItemsByPro(proId: string): Promise<MarketplaceItem[]>;
  updateMarketplaceItem(id: string, updates: Partial<MarketplaceItem>): Promise<MarketplaceItem | undefined>;
  deleteMarketplaceItem(id: string): Promise<boolean>;
  incrementViews(id: string): Promise<void>;
  getProMarketplaceStats(proId: string): Promise<{
    totalListings: number;
    activeListings: number;
    soldListings: number;
    totalEarnings: number;
  }>;
}

export class MarketplaceStorage implements IMarketplaceStorage {
  async createMarketplaceItem(item: InsertMarketplaceItem): Promise<MarketplaceItem> {
    const [newItem] = await db.insert(marketplaceItems).values({
      ...item,
      postedAt: new Date().toISOString(),
      status: "available",
      views: 0,
    }).returning();
    return newItem;
  }

  async getMarketplaceItem(id: string): Promise<MarketplaceItem | undefined> {
    const [item] = await db.select().from(marketplaceItems).where(eq(marketplaceItems.id, id));
    return item;
  }

  async getMarketplaceItems(filters?: {
    category?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    status?: string;
  }): Promise<MarketplaceItem[]> {
    const conditions = [eq(marketplaceItems.status, filters?.status || "available")];

    if (filters?.category) {
      conditions.push(eq(marketplaceItems.category, filters.category));
    }
    if (filters?.condition) {
      conditions.push(eq(marketplaceItems.condition, filters.condition));
    }
    if (filters?.minPrice) {
      conditions.push(gte(marketplaceItems.price, filters.minPrice));
    }
    if (filters?.maxPrice) {
      conditions.push(lte(marketplaceItems.price, filters.maxPrice));
    }
    if (filters?.location) {
      conditions.push(eq(marketplaceItems.location, filters.location));
    }

    return await db
      .select()
      .from(marketplaceItems)
      .where(and(...conditions))
      .orderBy(desc(marketplaceItems.postedAt));
  }

  async getMarketplaceItemsByPro(proId: string): Promise<MarketplaceItem[]> {
    return await db
      .select()
      .from(marketplaceItems)
      .where(eq(marketplaceItems.proId, proId))
      .orderBy(desc(marketplaceItems.postedAt));
  }

  async updateMarketplaceItem(id: string, updates: Partial<MarketplaceItem>): Promise<MarketplaceItem | undefined> {
    const [updated] = await db
      .update(marketplaceItems)
      .set(updates)
      .where(eq(marketplaceItems.id, id))
      .returning();
    return updated;
  }

  async deleteMarketplaceItem(id: string): Promise<boolean> {
    const result = await db.delete(marketplaceItems).where(eq(marketplaceItems.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async incrementViews(id: string): Promise<void> {
    await db
      .update(marketplaceItems)
      .set({ views: sql`${marketplaceItems.views} + 1` })
      .where(eq(marketplaceItems.id, id));
  }

  async getProMarketplaceStats(proId: string): Promise<{
    totalListings: number;
    activeListings: number;
    soldListings: number;
    totalEarnings: number;
  }> {
    const items = await this.getMarketplaceItemsByPro(proId);

    const stats = {
      totalListings: items.length,
      activeListings: items.filter(i => i.status === "available").length,
      soldListings: items.filter(i => i.status === "sold").length,
      totalEarnings: items
        .filter(i => i.status === "sold")
        .reduce((sum, i) => sum + (i.price || 0), 0),
    };

    return stats;
  }
}
