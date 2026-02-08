import { db } from "../../../db";
import {
  dispatchBatches,
  disposalRecommendations,
  type DispatchBatch,
  type InsertDispatchBatch,
  type DisposalRecommendation,
  type InsertDisposalRecommendation
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IDispatchStorage {
  createDispatchBatch(batch: InsertDispatchBatch): Promise<DispatchBatch>;
  getDispatchBatchesByDate(date: string): Promise<DispatchBatch[]>;
  getDispatchBatchesByHauler(haulerId: string): Promise<DispatchBatch[]>;
  updateDispatchBatch(id: string, updates: Partial<DispatchBatch>): Promise<DispatchBatch | undefined>;
  createDisposalRecommendation(rec: InsertDisposalRecommendation): Promise<DisposalRecommendation>;
  getDisposalRecommendationsByRequest(serviceRequestId: string): Promise<DisposalRecommendation[]>;
  updateDisposalRecommendation(id: string, updates: Partial<DisposalRecommendation>): Promise<DisposalRecommendation | undefined>;
}

export class DispatchStorage implements IDispatchStorage {
  async createDispatchBatch(batch: InsertDispatchBatch): Promise<DispatchBatch> {
    const [result] = await db.insert(dispatchBatches).values(batch).returning();
    return result;
  }

  async getDispatchBatchesByDate(date: string): Promise<DispatchBatch[]> {
    return db.select().from(dispatchBatches).where(eq(dispatchBatches.batchDate, date)).orderBy(desc(dispatchBatches.createdAt));
  }

  async getDispatchBatchesByHauler(haulerId: string): Promise<DispatchBatch[]> {
    return db.select().from(dispatchBatches).where(eq(dispatchBatches.haulerId, haulerId)).orderBy(desc(dispatchBatches.createdAt));
  }

  async updateDispatchBatch(id: string, updates: Partial<DispatchBatch>): Promise<DispatchBatch | undefined> {
    const [result] = await db.update(dispatchBatches).set(updates).where(eq(dispatchBatches.id, id)).returning();
    return result || undefined;
  }

  async createDisposalRecommendation(rec: InsertDisposalRecommendation): Promise<DisposalRecommendation> {
    const [result] = await db.insert(disposalRecommendations).values(rec).returning();
    return result;
  }

  async getDisposalRecommendationsByRequest(serviceRequestId: string): Promise<DisposalRecommendation[]> {
    return db.select().from(disposalRecommendations).where(eq(disposalRecommendations.serviceRequestId, serviceRequestId)).orderBy(desc(disposalRecommendations.createdAt));
  }

  async updateDisposalRecommendation(id: string, updates: Partial<DisposalRecommendation>): Promise<DisposalRecommendation | undefined> {
    const [result] = await db.update(disposalRecommendations).set(updates).where(eq(disposalRecommendations.id, id)).returning();
    return result || undefined;
  }
}
