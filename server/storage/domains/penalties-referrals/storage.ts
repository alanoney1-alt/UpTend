import { db } from "../../../db";
import { eq, desc } from "drizzle-orm";
import {
  haulerPenalties,
  referrals,
  homeInventory,
  auditLogs,
  type HaulerPenalty,
  type InsertHaulerPenalty,
  type Referral,
  type InsertReferral,
  type HomeInventory,
  type InsertHomeInventory,
  type AuditLog,
  type InsertAuditLog,
} from "@shared/schema";

export class PenaltiesReferralsStorage {
  // Hauler Penalties
  async createHaulerPenalty(penalty: InsertHaulerPenalty): Promise<HaulerPenalty> {
    const [created] = await db.insert(haulerPenalties).values(penalty).returning();
    return created;
  }

  async getPenaltiesByHauler(haulerId: string): Promise<HaulerPenalty[]> {
    return await db.select().from(haulerPenalties)
      .where(eq(haulerPenalties.haulerId, haulerId))
      .orderBy(desc(haulerPenalties.createdAt));
  }

  async updateHaulerPenalty(id: string, updates: Partial<HaulerPenalty>): Promise<HaulerPenalty | undefined> {
    const [updated] = await db.update(haulerPenalties)
      .set(updates)
      .where(eq(haulerPenalties.id, id))
      .returning();
    return updated || undefined;
  }

  // Referrals
  async createReferral(referral: InsertReferral): Promise<Referral> {
    const [created] = await db.insert(referrals).values(referral).returning();
    return created;
  }

  async getReferralByCode(code: string): Promise<Referral | undefined> {
    const [referral] = await db.select().from(referrals).where(eq(referrals.referralCode, code));
    return referral || undefined;
  }

  async getReferralsByReferrer(referrerId: string): Promise<Referral[]> {
    return await db.select().from(referrals)
      .where(eq(referrals.referrerId, referrerId))
      .orderBy(desc(referrals.createdAt));
  }

  async getReferral(id: string): Promise<Referral | undefined> {
    const [referral] = await db.select().from(referrals).where(eq(referrals.id, id));
    return referral || undefined;
  }

  async updateReferral(id: string, updates: Partial<Referral>): Promise<Referral | undefined> {
    const [updated] = await db.update(referrals)
      .set(updates)
      .where(eq(referrals.id, id))
      .returning();
    return updated || undefined;
  }

  // Home Inventory
  async createHomeInventoryItem(item: InsertHomeInventory): Promise<HomeInventory> {
    const [newItem] = await db.insert(homeInventory).values(item).returning();
    return newItem;
  }

  async getHomeInventoryByCustomer(customerId: string): Promise<HomeInventory[]> {
    return await db.select().from(homeInventory).where(eq(homeInventory.customerId, customerId));
  }

  async getHomeInventoryByServiceRequest(serviceRequestId: string): Promise<HomeInventory[]> {
    return await db.select().from(homeInventory).where(eq(homeInventory.serviceRequestId, serviceRequestId));
  }

  async updateHomeInventoryItem(id: string, updates: Partial<HomeInventory>): Promise<HomeInventory | undefined> {
    const [updated] = await db.update(homeInventory).set(updates).where(eq(homeInventory.id, id)).returning();
    return updated || undefined;
  }

  // Audit Logs
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db.insert(auditLogs).values(log).returning();
    return newLog;
  }

  async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(limit);
  }
}
