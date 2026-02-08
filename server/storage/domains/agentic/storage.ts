import { db } from "../../../db";
import {
  aiTriageReports,
  dispatchRecommendations,
  sentimentFlags,
  conflictShieldReports,
  disposalReceipts,
  type AiTriageReport,
  type InsertAiTriageReport,
  type DispatchRecommendation,
  type InsertDispatchRecommendation,
  type SentimentFlag,
  type InsertSentimentFlag,
  type ConflictShieldReport,
  type InsertConflictShieldReport,
  type DisposalReceipt,
  type InsertDisposalReceipt
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IAgenticStorage {
  // AI Triage Reports
  createAiTriageReport(report: InsertAiTriageReport): Promise<AiTriageReport>;
  getAiTriageReport(id: string): Promise<AiTriageReport | undefined>;
  getAiTriageReportByRequest(serviceRequestId: string): Promise<AiTriageReport | undefined>;
  getRecentAiTriageReports(limit?: number): Promise<AiTriageReport[]>;

  // Dispatch Recommendations
  createDispatchRecommendation(rec: InsertDispatchRecommendation): Promise<DispatchRecommendation>;
  getDispatchRecommendation(id: string): Promise<DispatchRecommendation | undefined>;
  getDispatchRecommendationByRequest(serviceRequestId: string): Promise<DispatchRecommendation | undefined>;

  // Sentiment Flags (Revenue Protector)
  createSentimentFlag(flag: InsertSentimentFlag): Promise<SentimentFlag>;
  getSentimentFlag(id: string): Promise<SentimentFlag | undefined>;
  getRecentSentimentFlags(limit?: number): Promise<SentimentFlag[]>;
  getSentimentFlagsByRisk(riskLevel: string): Promise<SentimentFlag[]>;
  updateSentimentFlag(id: string, updates: Partial<SentimentFlag>): Promise<SentimentFlag | undefined>;

  // Conflict Shield Reports
  createConflictShieldReport(report: InsertConflictShieldReport): Promise<ConflictShieldReport>;
  getConflictShieldReport(id: string): Promise<ConflictShieldReport | undefined>;
  getConflictShieldReportByRequest(serviceRequestId: string): Promise<ConflictShieldReport | undefined>;
  getRecentConflictShieldReports(limit?: number): Promise<ConflictShieldReport[]>;

  // Disposal Receipts (Daily Bonus System)
  createDisposalReceipt(receipt: InsertDisposalReceipt): Promise<DisposalReceipt>;
  getDisposalReceiptsByHauler(haulerId: string): Promise<DisposalReceipt[]>;
  canClaimDailyBonus(haulerId: string): Promise<{ canClaim: boolean; approvedToday: number; reason?: string }>;
  checkDuplicateReceipt(receiptHash: string): Promise<boolean>;
  approveDisposalReceipt(receiptId: string): Promise<DisposalReceipt | undefined>;
  rejectDisposalReceipt(receiptId: string, reason: string): Promise<DisposalReceipt | undefined>;
  getDisposalReceiptStats(haulerId: string): Promise<{ totalBonusEarned: number; totalReceipts: number; approvedReceipts: number; pendingReceipts: number }>;
}

export class AgenticStorage implements IAgenticStorage {
  // AI Triage Reports
  async createAiTriageReport(report: InsertAiTriageReport): Promise<AiTriageReport> {
    const [result] = await db.insert(aiTriageReports).values(report).returning();
    return result;
  }

  async getAiTriageReport(id: string): Promise<AiTriageReport | undefined> {
    const [result] = await db.select().from(aiTriageReports).where(eq(aiTriageReports.id, id));
    return result || undefined;
  }

  async getAiTriageReportByRequest(serviceRequestId: string): Promise<AiTriageReport | undefined> {
    const [result] = await db.select().from(aiTriageReports)
      .where(eq(aiTriageReports.serviceRequestId, serviceRequestId))
      .orderBy(desc(aiTriageReports.createdAt));
    return result || undefined;
  }

  async getRecentAiTriageReports(limit: number = 20): Promise<AiTriageReport[]> {
    return db.select().from(aiTriageReports).orderBy(desc(aiTriageReports.createdAt)).limit(limit);
  }

  // Dispatch Recommendations
  async createDispatchRecommendation(rec: InsertDispatchRecommendation): Promise<DispatchRecommendation> {
    const [result] = await db.insert(dispatchRecommendations).values(rec).returning();
    return result;
  }

  async getDispatchRecommendation(id: string): Promise<DispatchRecommendation | undefined> {
    const [result] = await db.select().from(dispatchRecommendations).where(eq(dispatchRecommendations.id, id));
    return result || undefined;
  }

  async getDispatchRecommendationByRequest(serviceRequestId: string): Promise<DispatchRecommendation | undefined> {
    const [result] = await db.select().from(dispatchRecommendations)
      .where(eq(dispatchRecommendations.serviceRequestId, serviceRequestId))
      .orderBy(desc(dispatchRecommendations.createdAt));
    return result || undefined;
  }

  // Sentiment Flags (Revenue Protector)
  async createSentimentFlag(flag: InsertSentimentFlag): Promise<SentimentFlag> {
    const [result] = await db.insert(sentimentFlags).values(flag).returning();
    return result;
  }

  async getSentimentFlag(id: string): Promise<SentimentFlag | undefined> {
    const [result] = await db.select().from(sentimentFlags).where(eq(sentimentFlags.id, id));
    return result || undefined;
  }

  async getRecentSentimentFlags(limit: number = 20): Promise<SentimentFlag[]> {
    return db.select().from(sentimentFlags).orderBy(desc(sentimentFlags.createdAt)).limit(limit);
  }

  async getSentimentFlagsByRisk(riskLevel: string): Promise<SentimentFlag[]> {
    return db.select().from(sentimentFlags)
      .where(eq(sentimentFlags.riskLevel, riskLevel))
      .orderBy(desc(sentimentFlags.createdAt));
  }

  async updateSentimentFlag(id: string, updates: Partial<SentimentFlag>): Promise<SentimentFlag | undefined> {
    const [result] = await db.update(sentimentFlags).set(updates).where(eq(sentimentFlags.id, id)).returning();
    return result || undefined;
  }

  // Conflict Shield Reports
  async createConflictShieldReport(report: InsertConflictShieldReport): Promise<ConflictShieldReport> {
    const [result] = await db.insert(conflictShieldReports).values(report).returning();
    return result;
  }

  async getConflictShieldReport(id: string): Promise<ConflictShieldReport | undefined> {
    const [result] = await db.select().from(conflictShieldReports).where(eq(conflictShieldReports.id, id));
    return result || undefined;
  }

  async getConflictShieldReportByRequest(serviceRequestId: string): Promise<ConflictShieldReport | undefined> {
    const [result] = await db.select().from(conflictShieldReports)
      .where(eq(conflictShieldReports.serviceRequestId, serviceRequestId))
      .orderBy(desc(conflictShieldReports.createdAt));
    return result || undefined;
  }

  async getRecentConflictShieldReports(limit: number = 20): Promise<ConflictShieldReport[]> {
    return db.select().from(conflictShieldReports).orderBy(desc(conflictShieldReports.createdAt)).limit(limit);
  }

  // Disposal Receipts (Daily Bonus System)
  async createDisposalReceipt(receipt: InsertDisposalReceipt): Promise<DisposalReceipt> {
    const [result] = await db.insert(disposalReceipts).values(receipt).returning();
    return result;
  }

  async getDisposalReceiptsByHauler(haulerId: string): Promise<DisposalReceipt[]> {
    return db.select().from(disposalReceipts)
      .where(eq(disposalReceipts.haulerId, haulerId))
      .orderBy(desc(disposalReceipts.createdAt));
  }

  async canClaimDailyBonus(haulerId: string): Promise<{ canClaim: boolean; approvedToday: number; reason?: string }> {
    const today = new Date().toISOString().slice(0, 10);
    const todaysReceipts = await db.select().from(disposalReceipts)
      .where(and(
        eq(disposalReceipts.haulerId, haulerId),
        eq(disposalReceipts.bonusStatus, "approved"),
        sql`${disposalReceipts.createdAt}::date = ${today}::date`
      ));
    const approvedToday = todaysReceipts.length;
    if (approvedToday >= 1) {
      return { canClaim: false, approvedToday, reason: "Daily $20 bonus already claimed today" };
    }
    return { canClaim: true, approvedToday };
  }

  async checkDuplicateReceipt(receiptHash: string): Promise<boolean> {
    if (!receiptHash) return false;
    const existing = await db.select().from(disposalReceipts)
      .where(eq(disposalReceipts.receiptHash, receiptHash))
      .limit(1);
    return existing.length > 0;
  }

  async approveDisposalReceipt(receiptId: string): Promise<DisposalReceipt | undefined> {
    const [result] = await db.update(disposalReceipts)
      .set({ bonusStatus: "approved", aiVerified: true })
      .where(eq(disposalReceipts.id, receiptId))
      .returning();
    return result || undefined;
  }

  async rejectDisposalReceipt(receiptId: string, reason: string): Promise<DisposalReceipt | undefined> {
    const [result] = await db.update(disposalReceipts)
      .set({ bonusStatus: "rejected", rejectionReason: reason })
      .where(eq(disposalReceipts.id, receiptId))
      .returning();
    return result || undefined;
  }

  async getDisposalReceiptStats(haulerId: string): Promise<{ totalBonusEarned: number; totalReceipts: number; approvedReceipts: number; pendingReceipts: number }> {
    const all = await db.select().from(disposalReceipts)
      .where(eq(disposalReceipts.haulerId, haulerId));
    const approved = all.filter(r => r.bonusStatus === "approved");
    const pending = all.filter(r => r.bonusStatus === "pending");
    return {
      totalBonusEarned: approved.reduce((sum, r) => sum + (r.bonusAmount || 20), 0),
      totalReceipts: all.length,
      approvedReceipts: approved.length,
      pendingReceipts: pending.length,
    };
  }
}
