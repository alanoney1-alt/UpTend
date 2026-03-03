/**
 * Timesheet Tracking Service
 * 
 * Clock in/out, breaks, time entries, weekly hours, approvals.
 */

import { db } from "../db";
import { sql } from "drizzle-orm";

// ============================================================
// Types
// ============================================================

export interface Timesheet {
  id: number;
  partnerSlug: string;
  techName: string;
  date: string;
  clockIn: Date;
  clockOut: Date | null;
  breakMinutes: number;
  totalHours: number | null;
  status: "active" | "completed" | "approved";
  notes: string | null;
  createdAt: Date;
}

export interface TimeEntry {
  id: number;
  timesheetId: number;
  partnerSlug: string;
  jobId: string;
  activity: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  notes: string | null;
  createdAt: Date;
}

// ============================================================
// Table Initialization
// ============================================================

const initSQL = sql`
  CREATE TABLE IF NOT EXISTS partner_timesheets (
    id SERIAL PRIMARY KEY,
    partner_slug TEXT NOT NULL,
    tech_name TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    clock_in TIMESTAMPTZ,
    clock_out TIMESTAMPTZ,
    break_minutes INT DEFAULT 0,
    total_hours NUMERIC,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','approved')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS partner_time_entries (
    id SERIAL PRIMARY KEY,
    timesheet_id INT,
    partner_slug TEXT NOT NULL,
    job_id TEXT,
    activity TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    duration_minutes INT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
`;

let initialized = false;
async function ensureTables() {
  if (initialized) return;
  await db.execute(initSQL);
  initialized = true;
}

// ============================================================
// Clock In / Out
// ============================================================

export async function clockIn(partnerSlug: string, techName: string, notes?: string): Promise<Timesheet> {
  await ensureTables();

  // Check if already clocked in
  const active = await db.execute(sql`
    SELECT * FROM partner_timesheets WHERE partner_slug = ${partnerSlug} AND tech_name = ${techName} AND status = 'active' AND clock_out IS NULL ORDER BY id DESC LIMIT 1
  `);
  if (active.rows?.length) throw new Error(`${techName} is already clocked in`);

  const result = await db.execute(sql`
    INSERT INTO partner_timesheets (partner_slug, tech_name, date, clock_in, notes, status)
    VALUES (${partnerSlug}, ${techName}, CURRENT_DATE, NOW(), ${notes || null}, 'active')
    RETURNING *
  `);
  return result.rows[0] as any;
}

export async function clockOut(partnerSlug: string, techName: string, notes?: string): Promise<Timesheet> {
  await ensureTables();

  const active = await db.execute(sql`
    SELECT * FROM partner_timesheets WHERE partner_slug = ${partnerSlug} AND tech_name = ${techName} AND status = 'active' AND clock_out IS NULL ORDER BY id DESC LIMIT 1
  `);
  if (!active.rows?.length) throw new Error(`${techName} is not currently clocked in`);

  const timesheet = active.rows[0] as any;

  // Calculate total hours: (now - clock_in) in hours, minus break_minutes
  const result = await db.execute(sql`
    UPDATE partner_timesheets
    SET clock_out = NOW(),
        total_hours = ROUND(EXTRACT(EPOCH FROM (NOW() - clock_in)) / 3600.0 - (break_minutes / 60.0), 2),
        status = 'completed',
        notes = COALESCE(${notes || null}, notes)
    WHERE id = ${timesheet.id}
    RETURNING *
  `);
  return result.rows[0] as any;
}

// ============================================================
// Break Management
// ============================================================

export async function startBreak(partnerSlug: string, techName: string): Promise<{ success: boolean; message: string }> {
  await ensureTables();

  const active = await db.execute(sql`
    SELECT * FROM partner_timesheets WHERE partner_slug = ${partnerSlug} AND tech_name = ${techName} AND status = 'active' AND clock_out IS NULL ORDER BY id DESC LIMIT 1
  `);
  if (!active.rows?.length) throw new Error(`${techName} is not currently clocked in`);

  // Store break start as a time entry with activity='break'
  const timesheet = active.rows[0] as any;
  await db.execute(sql`
    INSERT INTO partner_time_entries (timesheet_id, partner_slug, activity, start_time)
    VALUES (${timesheet.id}, ${partnerSlug}, 'break', NOW())
  `);

  return { success: true, message: `Break started for ${techName}` };
}

export async function endBreak(partnerSlug: string, techName: string): Promise<{ success: boolean; breakMinutes: number }> {
  await ensureTables();

  const active = await db.execute(sql`
    SELECT * FROM partner_timesheets WHERE partner_slug = ${partnerSlug} AND tech_name = ${techName} AND status = 'active' AND clock_out IS NULL ORDER BY id DESC LIMIT 1
  `);
  if (!active.rows?.length) throw new Error(`${techName} is not currently clocked in`);

  const timesheet = active.rows[0] as any;

  // Find open break entry
  const breakEntry = await db.execute(sql`
    SELECT * FROM partner_time_entries WHERE timesheet_id = ${timesheet.id} AND activity = 'break' AND end_time IS NULL ORDER BY id DESC LIMIT 1
  `);
  if (!breakEntry.rows?.length) throw new Error("No active break found");

  const entry = breakEntry.rows[0] as any;

  // End break and calculate duration
  await db.execute(sql`
    UPDATE partner_time_entries
    SET end_time = NOW(), duration_minutes = EXTRACT(EPOCH FROM (NOW() - start_time)) / 60
    WHERE id = ${entry.id}
  `);

  // Update total break_minutes on timesheet
  const breakDuration = await db.execute(sql`
    SELECT COALESCE(SUM(duration_minutes), 0) as total_break FROM partner_time_entries
    WHERE timesheet_id = ${timesheet.id} AND activity = 'break' AND end_time IS NOT NULL
  `);
  const totalBreak = Math.round((breakDuration.rows[0] as any).total_break || 0);

  await db.execute(sql`
    UPDATE partner_timesheets SET break_minutes = ${totalBreak} WHERE id = ${timesheet.id}
  `);

  return { success: true, breakMinutes: totalBreak };
}

// ============================================================
// Time Entries
// ============================================================

export async function logTimeEntry(
  partnerSlug: string, techName: string, jobId: string,
  activity: string, startTime: string, endTime: string, notes?: string
): Promise<TimeEntry> {
  await ensureTables();

  // Find active timesheet for tech
  const active = await db.execute(sql`
    SELECT id FROM partner_timesheets WHERE partner_slug = ${partnerSlug} AND tech_name = ${techName} AND status IN ('active','completed') ORDER BY id DESC LIMIT 1
  `);
  const timesheetId = active.rows?.length ? (active.rows[0] as any).id : null;

  const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();
  const durationMinutes = Math.round(durationMs / 60000);

  const result = await db.execute(sql`
    INSERT INTO partner_time_entries (timesheet_id, partner_slug, job_id, activity, start_time, end_time, duration_minutes, notes)
    VALUES (${timesheetId}, ${partnerSlug}, ${jobId}, ${activity}, ${startTime}, ${endTime}, ${durationMinutes}, ${notes || null})
    RETURNING *
  `);
  return result.rows[0] as any;
}

// ============================================================
// Query Functions
// ============================================================

export async function getActiveTimesheets(partnerSlug: string): Promise<Timesheet[]> {
  await ensureTables();
  const result = await db.execute(sql`
    SELECT * FROM partner_timesheets WHERE partner_slug = ${partnerSlug} AND status = 'active' AND clock_out IS NULL ORDER BY clock_in DESC
  `);
  return result.rows as any[];
}

export async function getTimesheetHistory(
  partnerSlug: string, techName?: string, dateRange?: { start: string; end: string }
): Promise<Timesheet[]> {
  await ensureTables();

  if (techName && dateRange) {
    const result = await db.execute(sql`
      SELECT * FROM partner_timesheets
      WHERE partner_slug = ${partnerSlug} AND tech_name = ${techName} AND date >= ${dateRange.start} AND date <= ${dateRange.end}
      ORDER BY date DESC, clock_in DESC
    `);
    return result.rows as any[];
  }
  if (techName) {
    const result = await db.execute(sql`
      SELECT * FROM partner_timesheets WHERE partner_slug = ${partnerSlug} AND tech_name = ${techName} ORDER BY date DESC, clock_in DESC LIMIT 100
    `);
    return result.rows as any[];
  }
  if (dateRange) {
    const result = await db.execute(sql`
      SELECT * FROM partner_timesheets
      WHERE partner_slug = ${partnerSlug} AND date >= ${dateRange.start} AND date <= ${dateRange.end}
      ORDER BY date DESC, clock_in DESC
    `);
    return result.rows as any[];
  }

  const result = await db.execute(sql`
    SELECT * FROM partner_timesheets WHERE partner_slug = ${partnerSlug} ORDER BY date DESC, clock_in DESC LIMIT 100
  `);
  return result.rows as any[];
}

export async function getWeeklyHours(partnerSlug: string, techName?: string, weekOf?: string): Promise<any[]> {
  await ensureTables();

  const weekStart = weekOf || new Date().toISOString().split("T")[0];

  if (techName) {
    const result = await db.execute(sql`
      SELECT tech_name,
             COUNT(*) as days_worked,
             COALESCE(SUM(total_hours), 0) as total_hours,
             COALESCE(SUM(break_minutes), 0) as total_break_minutes
      FROM partner_timesheets
      WHERE partner_slug = ${partnerSlug} AND tech_name = ${techName}
        AND date >= ${weekStart}::date AND date < (${weekStart}::date + INTERVAL '7 days')
      GROUP BY tech_name
    `);
    return result.rows as any[];
  }

  const result = await db.execute(sql`
    SELECT tech_name,
           COUNT(*) as days_worked,
           COALESCE(SUM(total_hours), 0) as total_hours,
           COALESCE(SUM(break_minutes), 0) as total_break_minutes
    FROM partner_timesheets
    WHERE partner_slug = ${partnerSlug}
      AND date >= ${weekStart}::date AND date < (${weekStart}::date + INTERVAL '7 days')
    GROUP BY tech_name
    ORDER BY tech_name
  `);
  return result.rows as any[];
}

// ============================================================
// Approval
// ============================================================

export async function approveTimesheet(timesheetId: number): Promise<Timesheet> {
  await ensureTables();

  const existing = await db.execute(sql`
    SELECT * FROM partner_timesheets WHERE id = ${timesheetId}
  `);
  if (!existing.rows?.length) throw new Error("Timesheet not found");
  if ((existing.rows[0] as any).status === "active") throw new Error("Cannot approve an active timesheet — clock out first");

  const result = await db.execute(sql`
    UPDATE partner_timesheets SET status = 'approved' WHERE id = ${timesheetId} RETURNING *
  `);
  return result.rows[0] as any;
}
