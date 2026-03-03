/**
 * Partner Maintenance Reminders Service
 * 
 * Proactively texts customers when maintenance is due.
 */

import { db } from "../db";
import { sql } from "drizzle-orm";
import { sendSms } from "./notifications";

// Maintenance intervals by service type (in months)
const MAINTENANCE_INTERVALS: Record<string, number> = {
  hvac: 6,
  hvac_maintenance: 6,
  hvac_repair: 12,
  plumbing: 12,
  plumbing_repair: 12,
  electrical: 12,
  roofing: 12,
  gutter_cleaning: 6,
  landscaping: 3,
  pool_cleaning: 3,
  pest_control: 3,
  pressure_washing: 6,
  carpet_cleaning: 12,
  appliance_repair: 12,
  painting: 36,
  general_handyman: 12,
  default: 12,
};

const REMINDER_LEAD_DAYS = 14; // Send reminder 2 weeks before due

export interface MaintenanceRecord {
  id: string;
  partnerSlug: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  serviceType: string;
  lastServiceDate: string;
  nextReminderDate: string;
  reminderSent: boolean;
}

export interface ScheduleMaintenanceParams {
  partnerSlug: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  serviceType: string;
  serviceDate?: string; // defaults to now
}

/**
 * Ensure the maintenance schedule table exists
 */
export async function ensureMaintenanceSchema(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS partner_maintenance_schedule (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_slug VARCHAR NOT NULL,
        customer_id VARCHAR NOT NULL,
        customer_name TEXT,
        customer_phone TEXT,
        service_type TEXT NOT NULL,
        last_service_date TIMESTAMP NOT NULL,
        next_reminder_date TIMESTAMP NOT NULL,
        reminder_sent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
  } catch (err) {
    console.error("[MaintenanceReminders] Schema setup error:", err);
  }
}

/**
 * Calculate next reminder date based on service type
 */
function calculateNextReminderDate(serviceDate: Date, serviceType: string): Date {
  const key = serviceType.toLowerCase().replace(/[\s-]+/g, "_");
  const intervalMonths = MAINTENANCE_INTERVALS[key] || MAINTENANCE_INTERVALS.default;
  
  const nextDue = new Date(serviceDate);
  nextDue.setMonth(nextDue.getMonth() + intervalMonths);
  
  // Reminder goes out REMINDER_LEAD_DAYS before due date
  const reminderDate = new Date(nextDue);
  reminderDate.setDate(reminderDate.getDate() - REMINDER_LEAD_DAYS);
  
  return reminderDate;
}

/**
 * Schedule a maintenance reminder after a service is completed
 */
export async function scheduleMaintenanceReminder(params: ScheduleMaintenanceParams): Promise<MaintenanceRecord | null> {
  const serviceDate = params.serviceDate ? new Date(params.serviceDate) : new Date();
  const nextReminderDate = calculateNextReminderDate(serviceDate, params.serviceType);

  try {
    const result = await db.execute(sql`
      INSERT INTO partner_maintenance_schedule (partner_slug, customer_id, customer_name, customer_phone, service_type, last_service_date, next_reminder_date, reminder_sent)
      VALUES (${params.partnerSlug}, ${params.customerId}, ${params.customerName ?? null}, ${params.customerPhone ?? null}, ${params.serviceType}, ${serviceDate.toISOString()}, ${nextReminderDate.toISOString()}, false)
      ON CONFLICT DO NOTHING
      RETURNING *
    `);
    
    const row = (result as any).rows?.[0];
    if (!row) return null;
    
    return {
      id: row.id,
      partnerSlug: row.partner_slug,
      customerId: row.customer_id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      serviceType: row.service_type,
      lastServiceDate: row.last_service_date,
      nextReminderDate: row.next_reminder_date,
      reminderSent: row.reminder_sent,
    };
  } catch (err) {
    console.error("[MaintenanceReminders] Schedule error:", err);
    return null;
  }
}

/**
 * Get upcoming reminders that need to be sent
 */
export async function getUpcomingReminders(partnerSlug?: string): Promise<MaintenanceRecord[]> {
  try {
    const whereClause = partnerSlug 
      ? sql`WHERE reminder_sent = false AND next_reminder_date <= NOW() AND partner_slug = ${partnerSlug}`
      : sql`WHERE reminder_sent = false AND next_reminder_date <= NOW()`;
    
    const result = await db.execute(sql`
      SELECT * FROM partner_maintenance_schedule ${whereClause} ORDER BY next_reminder_date ASC LIMIT 100
    `);
    
    return ((result as any).rows || []).map((row: any) => ({
      id: row.id,
      partnerSlug: row.partner_slug,
      customerId: row.customer_id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      serviceType: row.service_type,
      lastServiceDate: row.last_service_date,
      nextReminderDate: row.next_reminder_date,
      reminderSent: row.reminder_sent,
    }));
  } catch {
    return [];
  }
}

/**
 * Get all scheduled reminders for a partner
 */
export async function getPartnerReminders(partnerSlug: string): Promise<MaintenanceRecord[]> {
  try {
    const result = await db.execute(sql`
      SELECT * FROM partner_maintenance_schedule 
      WHERE partner_slug = ${partnerSlug} 
      ORDER BY next_reminder_date ASC 
      LIMIT 50
    `);
    
    return ((result as any).rows || []).map((row: any) => ({
      id: row.id,
      partnerSlug: row.partner_slug,
      customerId: row.customer_id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      serviceType: row.service_type,
      lastServiceDate: row.last_service_date,
      nextReminderDate: row.next_reminder_date,
      reminderSent: row.reminder_sent,
    }));
  } catch {
    return [];
  }
}

/**
 * Send a maintenance reminder
 */
export async function sendMaintenanceReminder(
  record: MaintenanceRecord,
  partnerCompanyName: string,
  partnerPhone: string
): Promise<boolean> {
  if (!record.customerPhone) return false;

  const monthsSince = Math.round(
    (Date.now() - new Date(record.lastServiceDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  const message = `Hey ${record.customerName || "there"}, it's been ${monthsSince} months since ${partnerCompanyName} serviced your ${record.serviceType.replace(/_/g, " ")}. Want me to schedule a tune-up? Just reply here or call ${partnerPhone}.`;

  try {
    await sendSms({ to: record.customerPhone, message });
    
    // Mark as sent
    await db.execute(sql`
      UPDATE partner_maintenance_schedule SET reminder_sent = true, updated_at = NOW() WHERE id = ${record.id}
    `);
    
    console.log(`[MaintenanceReminders] Sent reminder ${record.id} to ${record.customerPhone}`);
    return true;
  } catch (err) {
    console.error(`[MaintenanceReminders] Send failed for ${record.id}:`, err);
    return false;
  }
}

/**
 * Process all due reminders (call from cron or manual trigger)
 */
export async function processReminders(): Promise<{ sent: number; failed: number }> {
  const due = await getUpcomingReminders();
  let sent = 0;
  let failed = 0;

  for (const record of due) {
    // We'd need partner config for company name/phone - use placeholder for now
    const success = await sendMaintenanceReminder(
      record,
      "Your service provider", // Would look up from partners table
      "your provider"
    );
    if (success) sent++;
    else failed++;
  }

  return { sent, failed };
}
