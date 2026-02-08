import { db } from "../../../db";
import {
  analyticsEvents,
  users,
  type AnalyticsEvent,
  type InsertAnalyticsEvent
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

export interface IAnalyticsStorage {
  trackEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent>;
  getEventsByUser(userId: string): Promise<AnalyticsEvent[]>;
  getEventsBySession(sessionId: string): Promise<AnalyticsEvent[]>;
  getFunnelStats(startDate?: string, endDate?: string): Promise<{ eventType: string; count: number }[]>;
  incrementCustomerJobCount(userId: string): Promise<void>;
}

export class AnalyticsStorage implements IAnalyticsStorage {
  async trackEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent> {
    const [tracked] = await db.insert(analyticsEvents).values({
      ...event,
      createdAt: new Date().toISOString(),
    }).returning();
    return tracked;
  }

  async getEventsByUser(userId: string): Promise<AnalyticsEvent[]> {
    return db.select().from(analyticsEvents)
      .where(eq(analyticsEvents.userId, userId))
      .orderBy(desc(analyticsEvents.createdAt));
  }

  async getEventsBySession(sessionId: string): Promise<AnalyticsEvent[]> {
    return db.select().from(analyticsEvents)
      .where(eq(analyticsEvents.sessionId, sessionId))
      .orderBy(analyticsEvents.createdAt);
  }

  async getFunnelStats(startDate?: string, endDate?: string): Promise<{ eventType: string; count: number }[]> {
    // Get counts of each event type for funnel analysis
    const allEvents = await db.select().from(analyticsEvents);
    const counts: { [key: string]: number } = {};
    for (const event of allEvents) {
      counts[event.eventType] = (counts[event.eventType] || 0) + 1;
    }
    return Object.entries(counts).map(([eventType, count]) => ({ eventType, count }));
  }

  async incrementCustomerJobCount(userId: string): Promise<void> {
    await db.update(users)
      .set({ totalJobsCompleted: sql`COALESCE(total_jobs_completed, 0) + 1` })
      .where(eq(users.id, userId));
  }
}
