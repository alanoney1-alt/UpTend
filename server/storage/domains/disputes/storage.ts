import { db } from "../../../db";
import { disputes, type Dispute, type InsertDispute } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IDisputesStorage {
  createDispute(dispute: InsertDispute): Promise<Dispute>;
  getDispute(id: string): Promise<Dispute | undefined>;
  getDisputesByCustomer(customerId: string): Promise<Dispute[]>;
  getDisputesByStatus(status: string): Promise<Dispute[]>;
  updateDispute(id: string, updates: Partial<Dispute>): Promise<Dispute | undefined>;
}

export class DisputesStorage implements IDisputesStorage {
  async createDispute(dispute: InsertDispute): Promise<Dispute> {
    const [result] = await db.insert(disputes).values(dispute).returning();
    return result;
  }

  async getDispute(id: string): Promise<Dispute | undefined> {
    const [result] = await db.select().from(disputes).where(eq(disputes.id, id));
    return result || undefined;
  }

  async getDisputesByCustomer(customerId: string): Promise<Dispute[]> {
    return db.select().from(disputes).where(eq(disputes.customerId, customerId)).orderBy(desc(disputes.createdAt));
  }

  async getDisputesByStatus(status: string): Promise<Dispute[]> {
    return db.select().from(disputes).where(eq(disputes.status, status)).orderBy(desc(disputes.createdAt));
  }

  async updateDispute(id: string, updates: Partial<Dispute>): Promise<Dispute | undefined> {
    const [result] = await db.update(disputes).set(updates).where(eq(disputes.id, id)).returning();
    return result || undefined;
  }
}
