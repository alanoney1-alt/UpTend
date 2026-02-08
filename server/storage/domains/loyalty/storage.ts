import { db } from "../../../db";
import {
  loyaltyAccounts,
  loyaltyTransactions,
  loyaltyRewards,
  type LoyaltyAccount,
  type InsertLoyaltyAccount,
  type LoyaltyTransaction,
  type InsertLoyaltyTransaction,
  type LoyaltyReward,
  type InsertLoyaltyReward,
  LOYALTY_TIER_CONFIG,
  POINTS_PER_DOLLAR
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface ILoyaltyStorage {
  getLoyaltyAccount(userId: string): Promise<LoyaltyAccount | undefined>;
  createLoyaltyAccount(account: InsertLoyaltyAccount): Promise<LoyaltyAccount>;
  updateLoyaltyAccount(id: string, updates: Partial<LoyaltyAccount>): Promise<LoyaltyAccount | undefined>;
  addLoyaltyPoints(userId: string, points: number, description: string, serviceRequestId?: string): Promise<LoyaltyTransaction>;
  redeemLoyaltyPoints(userId: string, points: number, description: string): Promise<LoyaltyTransaction | undefined>;
  getLoyaltyTransactions(userId: string): Promise<LoyaltyTransaction[]>;
  getLoyaltyRewards(): Promise<LoyaltyReward[]>;
  getLoyaltyReward(id: string): Promise<LoyaltyReward | undefined>;
  createLoyaltyReward(reward: InsertLoyaltyReward): Promise<LoyaltyReward>;
}

export class LoyaltyStorage implements ILoyaltyStorage {
  async getLoyaltyAccount(userId: string): Promise<LoyaltyAccount | undefined> {
    const [result] = await db.select().from(loyaltyAccounts).where(eq(loyaltyAccounts.userId, userId));
    return result || undefined;
  }

  async createLoyaltyAccount(account: InsertLoyaltyAccount): Promise<LoyaltyAccount> {
    const [result] = await db.insert(loyaltyAccounts).values(account).returning();
    return result;
  }

  async updateLoyaltyAccount(id: string, updates: Partial<LoyaltyAccount>): Promise<LoyaltyAccount | undefined> {
    const [result] = await db.update(loyaltyAccounts).set(updates).where(eq(loyaltyAccounts.id, id)).returning();
    return result || undefined;
  }

  async addLoyaltyPoints(userId: string, points: number, description: string, serviceRequestId?: string): Promise<LoyaltyTransaction> {
    let account = await this.getLoyaltyAccount(userId);
    if (!account) {
      account = await this.createLoyaltyAccount({
        userId,
        currentPoints: 0,
        lifetimePoints: 0,
        currentTier: "bronze",
        createdAt: new Date().toISOString(),
      });
    }

    const newCurrentPoints = (account.currentPoints || 0) + points;
    const newLifetimePoints = (account.lifetimePoints || 0) + points;

    // Tier upgrade logic based on lifetime points
    let newTier = account.currentTier;
    for (const [tier, config] of Object.entries(LOYALTY_TIER_CONFIG).reverse()) {
      if (newLifetimePoints >= config.minPoints) {
        newTier = tier;
        break;
      }
    }

    await this.updateLoyaltyAccount(account.id, {
      currentPoints: newCurrentPoints,
      lifetimePoints: newLifetimePoints,
      currentTier: newTier,
      lastPointsEarnedAt: new Date().toISOString(),
    });

    const [transaction] = await db.insert(loyaltyTransactions).values({
      loyaltyAccountId: account.id,
      type: "earned",
      points,
      description,
      serviceRequestId,
      createdAt: new Date().toISOString(),
    }).returning();

    return transaction;
  }

  async redeemLoyaltyPoints(userId: string, points: number, description: string): Promise<LoyaltyTransaction | undefined> {
    const account = await this.getLoyaltyAccount(userId);
    if (!account || (account.currentPoints || 0) < points) {
      return undefined;
    }

    await this.updateLoyaltyAccount(account.id, {
      currentPoints: (account.currentPoints || 0) - points,
    });

    const [transaction] = await db.insert(loyaltyTransactions).values({
      loyaltyAccountId: account.id,
      type: "redeemed",
      points: -points,
      description,
      createdAt: new Date().toISOString(),
    }).returning();

    return transaction;
  }

  async getLoyaltyTransactions(userId: string): Promise<LoyaltyTransaction[]> {
    const account = await this.getLoyaltyAccount(userId);
    if (!account) return [];
    return db.select().from(loyaltyTransactions)
      .where(eq(loyaltyTransactions.loyaltyAccountId, account.id))
      .orderBy(desc(loyaltyTransactions.createdAt));
  }

  async getLoyaltyRewards(): Promise<LoyaltyReward[]> {
    return db.select().from(loyaltyRewards).where(eq(loyaltyRewards.isActive, true));
  }

  async getLoyaltyReward(id: string): Promise<LoyaltyReward | undefined> {
    const [result] = await db.select().from(loyaltyRewards).where(eq(loyaltyRewards.id, id));
    return result || undefined;
  }

  async createLoyaltyReward(reward: InsertLoyaltyReward): Promise<LoyaltyReward> {
    const [result] = await db.insert(loyaltyRewards).values(reward).returning();
    return result;
  }
}
