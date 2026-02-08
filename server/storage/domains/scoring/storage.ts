import { db } from "../../../db";
import {
  propertyScores,
  scoreHistory,
  consultations,
  type PropertyScore,
  type ScoreHistory,
  type Consultation,
  type InsertConsultation
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface IScoringStorage {
  getPropertyScore(userId: string): Promise<PropertyScore | undefined>;
  getScoreHistory(scoreId: string, limit?: number): Promise<ScoreHistory[]>;
  createConsultation(consultation: InsertConsultation): Promise<Consultation>;
  getConsultation(id: string): Promise<Consultation | undefined>;
  getConsultationsByCustomer(customerId: string): Promise<Consultation[]>;
  updateConsultation(id: string, updates: Partial<Consultation>): Promise<Consultation | undefined>;
  getUnusedConsultationCredit(customerId: string): Promise<Consultation | undefined>;
}

export class ScoringStorage implements IScoringStorage {
  async getPropertyScore(userId: string): Promise<PropertyScore | undefined> {
    const [score] = await db.select().from(propertyScores).where(eq(propertyScores.userId, userId));
    return score || undefined;
  }

  async getScoreHistory(scoreId: string, limit: number = 10): Promise<ScoreHistory[]> {
    return db.select().from(scoreHistory)
      .where(eq(scoreHistory.scoreId, scoreId))
      .orderBy(desc(scoreHistory.createdAt))
      .limit(limit);
  }

  async createConsultation(consultation: InsertConsultation): Promise<Consultation> {
    const [result] = await db.insert(consultations).values(consultation).returning();
    return result;
  }

  async getConsultation(id: string): Promise<Consultation | undefined> {
    const [result] = await db.select().from(consultations).where(eq(consultations.id, id));
    return result || undefined;
  }

  async getConsultationsByCustomer(customerId: string): Promise<Consultation[]> {
    return db.select().from(consultations)
      .where(eq(consultations.customerId, customerId))
      .orderBy(desc(consultations.createdAt));
  }

  async updateConsultation(id: string, updates: Partial<Consultation>): Promise<Consultation | undefined> {
    const [result] = await db.update(consultations).set(updates).where(eq(consultations.id, id)).returning();
    return result || undefined;
  }

  async getUnusedConsultationCredit(customerId: string): Promise<Consultation | undefined> {
    const [result] = await db.select().from(consultations)
      .where(and(
        eq(consultations.customerId, customerId),
        eq(consultations.status, "completed"),
        eq(consultations.isCreditUsed, false)
      ))
      .limit(1);
    return result || undefined;
  }
}
