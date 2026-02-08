/**
 * FreshSpace Storage Domain
 *
 * Database operations for FreshSpace home cleaning service:
 * - Cleaning checklists (room-by-room task tracking)
 * - Recurring subscriptions (weekly/biweekly/monthly plans)
 */

import { eq, and } from "drizzle-orm";
import { db } from "../../../db";
import {
  cleaningChecklists,
  recurringSubscriptions,
  type CleaningChecklist,
  type InsertCleaningChecklist,
  type RecurringSubscription,
  type InsertRecurringSubscription,
} from "@shared/schema";

export interface IFreshSpaceStorage {
  createCleaningChecklist(checklist: InsertCleaningChecklist): Promise<CleaningChecklist>;
  getCleaningChecklistsByRequest(serviceRequestId: string): Promise<CleaningChecklist[]>;
  updateCleaningChecklistTask(id: string, updates: Partial<CleaningChecklist>): Promise<CleaningChecklist | undefined>;
  bulkCreateCleaningChecklists(checklists: InsertCleaningChecklist[]): Promise<CleaningChecklist[]>;
  createRecurringSubscription(subscription: InsertRecurringSubscription): Promise<RecurringSubscription>;
  getRecurringSubscription(id: string): Promise<RecurringSubscription | undefined>;
  getCustomerSubscriptions(customerId: string): Promise<RecurringSubscription[]>;
  updateRecurringSubscription(id: string, updates: Partial<RecurringSubscription>): Promise<RecurringSubscription | undefined>;
  getActiveSubscriptionsDueForBooking(date: string): Promise<RecurringSubscription[]>;
}

export class FreshSpaceStorage implements IFreshSpaceStorage {
  // Cleaning Checklists

  async createCleaningChecklist(checklist: InsertCleaningChecklist): Promise<CleaningChecklist> {
    const [newChecklist] = await db
      .insert(cleaningChecklists)
      .values({
        ...checklist,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return newChecklist;
  }

  async getCleaningChecklistsByRequest(serviceRequestId: string): Promise<CleaningChecklist[]> {
    const checklists = await db
      .select()
      .from(cleaningChecklists)
      .where(eq(cleaningChecklists.serviceRequestId, serviceRequestId));

    return checklists;
  }

  async updateCleaningChecklistTask(
    id: string,
    updates: Partial<CleaningChecklist>
  ): Promise<CleaningChecklist | undefined> {
    const [updated] = await db
      .update(cleaningChecklists)
      .set(updates)
      .where(eq(cleaningChecklists.id, id))
      .returning();

    return updated || undefined;
  }

  async bulkCreateCleaningChecklists(checklists: InsertCleaningChecklist[]): Promise<CleaningChecklist[]> {
    if (checklists.length === 0) {
      return [];
    }

    const created = await db
      .insert(cleaningChecklists)
      .values(
        checklists.map(checklist => ({
          ...checklist,
          createdAt: new Date().toISOString(),
        }))
      )
      .returning();

    return created;
  }

  // Recurring Subscriptions

  async createRecurringSubscription(
    subscription: InsertRecurringSubscription
  ): Promise<RecurringSubscription> {
    const [newSubscription] = await db
      .insert(recurringSubscriptions)
      .values({
        ...subscription,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return newSubscription;
  }

  async getRecurringSubscription(id: string): Promise<RecurringSubscription | undefined> {
    const [subscription] = await db
      .select()
      .from(recurringSubscriptions)
      .where(eq(recurringSubscriptions.id, id));

    return subscription || undefined;
  }

  async getCustomerSubscriptions(customerId: string): Promise<RecurringSubscription[]> {
    const subscriptions = await db
      .select()
      .from(recurringSubscriptions)
      .where(eq(recurringSubscriptions.customerId, customerId));

    return subscriptions;
  }

  async updateRecurringSubscription(
    id: string,
    updates: Partial<RecurringSubscription>
  ): Promise<RecurringSubscription | undefined> {
    const [updated] = await db
      .update(recurringSubscriptions)
      .set({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(recurringSubscriptions.id, id))
      .returning();

    return updated || undefined;
  }

  async getActiveSubscriptionsDueForBooking(date: string): Promise<RecurringSubscription[]> {
    const subscriptions = await db
      .select()
      .from(recurringSubscriptions)
      .where(
        and(
          eq(recurringSubscriptions.status, "active"),
          eq(recurringSubscriptions.nextBookingDate, date)
        )
      );

    return subscriptions;
  }
}
