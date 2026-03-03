/**
 * Google Calendar Sync Service
 * 
 * OAuth flow, job-to-calendar event sync, connection management.
 * Actual Google API calls are stubbed with TODO markers.
 */

import { db } from "../db";
import { sql } from "drizzle-orm";

// ============================================================
// Types
// ============================================================

export interface CalendarConnection {
  id: number;
  partnerSlug: string;
  googleEmail: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  calendarId: string;
  status: "active" | "expired" | "disconnected";
  createdAt: Date;
}

export interface CalendarEvent {
  id: number;
  partnerSlug: string;
  jobId: string;
  googleEventId: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  location: string;
  attendees: any;
  syncedAt: Date;
  createdAt: Date;
}

export interface JobCalendarData {
  jobId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  techEmail: string;
}

// ============================================================
// Table Initialization
// ============================================================

const initSQL = sql`
  CREATE TABLE IF NOT EXISTS partner_calendar_connections (
    id SERIAL PRIMARY KEY,
    partner_slug TEXT NOT NULL,
    google_email TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    calendar_id TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','disconnected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS partner_calendar_events (
    id SERIAL PRIMARY KEY,
    partner_slug TEXT NOT NULL,
    job_id TEXT,
    google_event_id TEXT,
    title TEXT,
    description TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    location TEXT,
    attendees JSONB,
    synced_at TIMESTAMPTZ,
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
// Google Calendar Config (placeholder — replace with real credentials)
// ============================================================

const GCAL_CONFIG = {
  clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID || "PLACEHOLDER_CLIENT_ID",
  clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET || "PLACEHOLDER_CLIENT_SECRET",
  redirectUri: process.env.GOOGLE_CALENDAR_REDIRECT_URI || "https://app.uptend.com/api/partners/calendar/callback",
  authEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  apiBase: "https://www.googleapis.com/calendar/v3",
  scope: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
};

// ============================================================
// OAuth Functions
// ============================================================

export async function getAuthUrl(partnerSlug: string): Promise<string> {
  await ensureTables();
  const state = Buffer.from(JSON.stringify({ partnerSlug, ts: Date.now() })).toString("base64");
  return `${GCAL_CONFIG.authEndpoint}?client_id=${GCAL_CONFIG.clientId}&redirect_uri=${encodeURIComponent(GCAL_CONFIG.redirectUri)}&response_type=code&scope=${encodeURIComponent(GCAL_CONFIG.scope)}&access_type=offline&prompt=consent&state=${state}`;
}

export async function handleCallback(partnerSlug: string, authCode: string): Promise<CalendarConnection> {
  await ensureTables();

  // TODO: Replace with actual Google token exchange
  // const tokenResponse = await fetch(GCAL_CONFIG.tokenEndpoint, { method: 'POST', body: new URLSearchParams({ code: authCode, client_id: GCAL_CONFIG.clientId, client_secret: GCAL_CONFIG.clientSecret, redirect_uri: GCAL_CONFIG.redirectUri, grant_type: 'authorization_code' }) });
  const mockTokens = {
    access_token: `mock_gcal_access_${Date.now()}`,
    refresh_token: `mock_gcal_refresh_${Date.now()}`,
    expires_in: 3600,
  };

  // TODO: Fetch user email from Google userinfo API
  const googleEmail = `user-${partnerSlug}@gmail.com`;
  const calendarId = "primary";
  const expiresAt = new Date(Date.now() + mockTokens.expires_in * 1000);

  // Upsert connection
  const result = await db.execute(sql`
    INSERT INTO partner_calendar_connections (partner_slug, google_email, access_token, refresh_token, token_expires_at, calendar_id, status)
    VALUES (${partnerSlug}, ${googleEmail}, ${mockTokens.access_token}, ${mockTokens.refresh_token}, ${expiresAt.toISOString()}, ${calendarId}, 'active')
    ON CONFLICT (partner_slug) WHERE status != 'disconnected'
    DO UPDATE SET
      google_email = EXCLUDED.google_email,
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      token_expires_at = EXCLUDED.token_expires_at,
      calendar_id = EXCLUDED.calendar_id,
      status = 'active'
    RETURNING *
  `);

  if (!result.rows?.length) {
    const r2 = await db.execute(sql`
      SELECT * FROM partner_calendar_connections WHERE partner_slug = ${partnerSlug} AND status != 'disconnected' ORDER BY id DESC LIMIT 1
    `);
    return r2.rows[0] as any;
  }
  return result.rows[0] as any;
}

// ============================================================
// Calendar Sync Functions
// ============================================================

export async function syncJobToCalendar(partnerSlug: string, jobData: JobCalendarData): Promise<CalendarEvent> {
  await ensureTables();
  const conn = await getConnectionStatus(partnerSlug);
  if (!conn || conn.status !== "active") throw new Error("Google Calendar not connected or token expired");

  // Check if event already exists for this job
  const existing = await db.execute(sql`
    SELECT * FROM partner_calendar_events WHERE partner_slug = ${partnerSlug} AND job_id = ${jobData.jobId} ORDER BY id DESC LIMIT 1
  `);

  // TODO: Replace with actual Google Calendar API call
  // const response = await fetch(`${GCAL_CONFIG.apiBase}/calendars/${conn.calendarId}/events`, {
  //   method: 'POST', headers: { Authorization: `Bearer ${conn.accessToken}` },
  //   body: JSON.stringify({ summary: jobData.title, description: jobData.description, start: { dateTime: jobData.startTime }, end: { dateTime: jobData.endTime }, location: jobData.location, attendees: [{ email: jobData.techEmail }] })
  // });
  const mockEventId = `gcal_evt_${Date.now()}`;
  const attendees = jobData.techEmail ? [{ email: jobData.techEmail }] : [];

  if (existing.rows?.length) {
    // Update existing event
    // TODO: PATCH to Google Calendar API to update event
    await db.execute(sql`
      UPDATE partner_calendar_events
      SET title = ${jobData.title}, description = ${jobData.description || ""},
          start_time = ${jobData.startTime}, end_time = ${jobData.endTime},
          location = ${jobData.location || ""}, attendees = ${JSON.stringify(attendees)},
          synced_at = NOW()
      WHERE partner_slug = ${partnerSlug} AND job_id = ${jobData.jobId}
    `);
    const updated = await db.execute(sql`
      SELECT * FROM partner_calendar_events WHERE partner_slug = ${partnerSlug} AND job_id = ${jobData.jobId} ORDER BY id DESC LIMIT 1
    `);
    return updated.rows[0] as any;
  }

  // Create new event
  const result = await db.execute(sql`
    INSERT INTO partner_calendar_events (partner_slug, job_id, google_event_id, title, description, start_time, end_time, location, attendees, synced_at)
    VALUES (${partnerSlug}, ${jobData.jobId}, ${mockEventId}, ${jobData.title}, ${jobData.description || ""}, ${jobData.startTime}, ${jobData.endTime}, ${jobData.location || ""}, ${JSON.stringify(attendees)}, NOW())
    RETURNING *
  `);
  return result.rows[0] as any;
}

export async function removeJobFromCalendar(partnerSlug: string, jobId: string): Promise<{ success: boolean; message: string }> {
  await ensureTables();

  const existing = await db.execute(sql`
    SELECT * FROM partner_calendar_events WHERE partner_slug = ${partnerSlug} AND job_id = ${jobId} ORDER BY id DESC LIMIT 1
  `);
  if (!existing.rows?.length) return { success: false, message: "No calendar event found for this job" };

  // TODO: DELETE from Google Calendar API
  // await fetch(`${GCAL_CONFIG.apiBase}/calendars/${calendarId}/events/${googleEventId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${accessToken}` } });

  await db.execute(sql`
    DELETE FROM partner_calendar_events WHERE partner_slug = ${partnerSlug} AND job_id = ${jobId}
  `);

  return { success: true, message: "Calendar event removed" };
}

export async function getCalendarEvents(partnerSlug: string, startDate?: string, endDate?: string): Promise<CalendarEvent[]> {
  await ensureTables();

  if (startDate && endDate) {
    const result = await db.execute(sql`
      SELECT * FROM partner_calendar_events
      WHERE partner_slug = ${partnerSlug} AND start_time >= ${startDate} AND end_time <= ${endDate}
      ORDER BY start_time ASC
    `);
    return result.rows as any[];
  }
  if (startDate) {
    const result = await db.execute(sql`
      SELECT * FROM partner_calendar_events
      WHERE partner_slug = ${partnerSlug} AND start_time >= ${startDate}
      ORDER BY start_time ASC LIMIT 100
    `);
    return result.rows as any[];
  }

  const result = await db.execute(sql`
    SELECT * FROM partner_calendar_events WHERE partner_slug = ${partnerSlug} ORDER BY start_time DESC LIMIT 100
  `);
  return result.rows as any[];
}

// ============================================================
// Connection Management
// ============================================================

export async function getConnectionStatus(partnerSlug: string): Promise<CalendarConnection | null> {
  await ensureTables();
  const result = await db.execute(sql`
    SELECT * FROM partner_calendar_connections WHERE partner_slug = ${partnerSlug} AND status != 'disconnected' ORDER BY id DESC LIMIT 1
  `);
  if (!result.rows?.length) return null;
  const conn = result.rows[0] as any;
  if (conn.token_expires_at && new Date(conn.token_expires_at) < new Date() && conn.status === "active") {
    await db.execute(sql`UPDATE partner_calendar_connections SET status = 'expired' WHERE id = ${conn.id}`);
    conn.status = "expired";
  }
  return conn;
}

export async function disconnectCalendar(partnerSlug: string): Promise<{ success: boolean }> {
  await ensureTables();
  await db.execute(sql`
    UPDATE partner_calendar_connections SET status = 'disconnected', access_token = NULL, refresh_token = NULL
    WHERE partner_slug = ${partnerSlug} AND status != 'disconnected'
  `);
  return { success: true };
}
