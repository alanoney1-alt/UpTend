import { db } from "../../../db";
import {
  workerSkills,
  aiSafetyAlerts,
  type WorkerSkill,
  type InsertWorkerSkill,
  type AiSafetyAlert,
  type InsertAiSafetyAlert
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface ISkillsSafetyStorage {
  getWorkerSkills(haulerProfileId: string): Promise<WorkerSkill[]>;
  upsertWorkerSkill(skill: InsertWorkerSkill): Promise<WorkerSkill>;
  createSafetyAlert(alert: InsertAiSafetyAlert): Promise<AiSafetyAlert>;
  getSafetyAlertsByRequest(serviceRequestId: string): Promise<AiSafetyAlert[]>;
  acknowledgeSafetyAlert(id: string): Promise<AiSafetyAlert | undefined>;
}

export class SkillsSafetyStorage implements ISkillsSafetyStorage {
  async getWorkerSkills(haulerProfileId: string): Promise<WorkerSkill[]> {
    return db.select().from(workerSkills).where(eq(workerSkills.haulerProfileId, haulerProfileId));
  }

  async upsertWorkerSkill(skill: InsertWorkerSkill): Promise<WorkerSkill> {
    const existing = await db.select().from(workerSkills)
      .where(and(eq(workerSkills.haulerProfileId, skill.haulerProfileId), eq(workerSkills.skillType, skill.skillType)));
    if (existing.length > 0) {
      const [result] = await db.update(workerSkills)
        .set({ rating: skill.rating, jobsCompleted: (existing[0].jobsCompleted || 0) + 1, lastUsedAt: new Date().toISOString() })
        .where(eq(workerSkills.id, existing[0].id))
        .returning();
      return result;
    }
    const [result] = await db.insert(workerSkills).values(skill).returning();
    return result;
  }

  async createSafetyAlert(alert: InsertAiSafetyAlert): Promise<AiSafetyAlert> {
    const [result] = await db.insert(aiSafetyAlerts).values(alert).returning();
    return result;
  }

  async getSafetyAlertsByRequest(serviceRequestId: string): Promise<AiSafetyAlert[]> {
    return db.select().from(aiSafetyAlerts).where(eq(aiSafetyAlerts.serviceRequestId, serviceRequestId)).orderBy(desc(aiSafetyAlerts.createdAt));
  }

  async acknowledgeSafetyAlert(id: string): Promise<AiSafetyAlert | undefined> {
    const [result] = await db.update(aiSafetyAlerts)
      .set({ acknowledged: true, acknowledgedAt: new Date().toISOString() })
      .where(eq(aiSafetyAlerts.id, id))
      .returning();
    return result || undefined;
  }
}
