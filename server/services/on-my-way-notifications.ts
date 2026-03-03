/**
 * On My Way Notifications Service
 *
 * Dispatches "on my way" notifications to customers when a technician
 * is en route, and tracks arrival/completion status.
 */

import { db } from "../db";
import { sql } from "drizzle-orm";

// ============================================================
// Database Setup
// ============================================================

async function ensureDispatchTables(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS partner_dispatch_notifications (
        id SERIAL PRIMARY KEY,
        partner_slug TEXT NOT NULL,
        job_id TEXT NOT NULL,
        tech_name TEXT NOT NULL,
        tech_phone TEXT DEFAULT '',
        customer_name TEXT NOT NULL,
        customer_phone TEXT DEFAULT '',
        customer_email TEXT DEFAULT '',
        eta_minutes INTEGER NOT NULL DEFAULT 30,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'arrived', 'completed')),
        sent_at TIMESTAMPTZ,
        arrived_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  } catch (err) {
    console.error("[OnMyWay] Table creation error:", err);
  }
}

// ============================================================
// Functions
// ============================================================

/**
 * Create an "on my way" dispatch notification and return the message text.
 * @param partnerSlug - Partner identifier
 * @param jobId - Job identifier
 * @param techName - Technician name
 * @param techPhone - Technician phone number
 * @param customerName - Customer name
 * @param customerPhone - Customer phone number
 * @param customerEmail - Customer email address
 * @param etaMinutes - Estimated arrival time in minutes
 * @returns Object with notification id and message text
 */
export async function sendOnMyWay(
  partnerSlug: string,
  jobId: string,
  techName: string,
  techPhone: string,
  customerName: string,
  customerPhone: string,
  customerEmail: string,
  etaMinutes: number
): Promise<{ id: number; messageText: string }> {
  try {
    await ensureDispatchTables();
    const result = await db.execute(sql`
      INSERT INTO partner_dispatch_notifications
        (partner_slug, job_id, tech_name, tech_phone, customer_name, customer_phone, customer_email, eta_minutes, status, sent_at)
      VALUES (${partnerSlug}, ${jobId}, ${techName}, ${techPhone}, ${customerName}, ${customerPhone}, ${customerEmail}, ${etaMinutes}, 'sent', NOW())
      RETURNING id
    `);
    const id = (result.rows[0] as any)?.id || 0;
    const messageText = `Your technician ${techName} is on the way! Estimated arrival: ${etaMinutes} minutes.`;
    return { id, messageText };
  } catch (err) {
    console.error("[OnMyWay] sendOnMyWay error:", err);
    throw err;
  }
}

/**
 * Mark a dispatch notification as arrived.
 * @param notificationId - The notification id
 */
export async function markArrived(notificationId: number): Promise<void> {
  try {
    await ensureDispatchTables();
    await db.execute(sql`
      UPDATE partner_dispatch_notifications
      SET status = 'arrived', arrived_at = NOW()
      WHERE id = ${notificationId}
    `);
  } catch (err) {
    console.error("[OnMyWay] markArrived error:", err);
    throw err;
  }
}

/**
 * Mark a dispatch notification as completed.
 * @param notificationId - The notification id
 */
export async function markCompleted(notificationId: number): Promise<void> {
  try {
    await ensureDispatchTables();
    await db.execute(sql`
      UPDATE partner_dispatch_notifications
      SET status = 'completed'
      WHERE id = ${notificationId}
    `);
  } catch (err) {
    console.error("[OnMyWay] markCompleted error:", err);
    throw err;
  }
}

/**
 * Get all active (pending/sent) dispatch notifications for a partner.
 * @param partnerSlug - Partner identifier
 */
export async function getActiveDispatches(partnerSlug: string): Promise<any[]> {
  try {
    await ensureDispatchTables();
    const result = await db.execute(sql`
      SELECT * FROM partner_dispatch_notifications
      WHERE partner_slug = ${partnerSlug} AND status IN ('pending', 'sent')
      ORDER BY created_at DESC
    `);
    return result.rows as any[];
  } catch (err) {
    console.error("[OnMyWay] getActiveDispatches error:", err);
    return [];
  }
}

/**
 * Get dispatch history for a partner, optionally filtered by date range.
 * @param partnerSlug - Partner identifier
 * @param dateRange - Optional { start, end } ISO date strings
 */
export async function getDispatchHistory(
  partnerSlug: string,
  dateRange?: { start: string; end: string }
): Promise<any[]> {
  try {
    await ensureDispatchTables();
    if (dateRange) {
      const result = await db.execute(sql`
        SELECT * FROM partner_dispatch_notifications
        WHERE partner_slug = ${partnerSlug}
          AND created_at >= ${dateRange.start}::timestamptz
          AND created_at <= ${dateRange.end}::timestamptz
        ORDER BY created_at DESC
      `);
      return result.rows as any[];
    }
    const result = await db.execute(sql`
      SELECT * FROM partner_dispatch_notifications
      WHERE partner_slug = ${partnerSlug}
      ORDER BY created_at DESC
      LIMIT 100
    `);
    return result.rows as any[];
  } catch (err) {
    console.error("[OnMyWay] getDispatchHistory error:", err);
    return [];
  }
}
