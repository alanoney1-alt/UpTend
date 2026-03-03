/**
 * QuickBooks Online Integration Service
 * 
 * OAuth flow, invoice/payment sync, customer sync.
 * Actual QB API calls are stubbed with TODO markers.
 */

import { db } from "../db";
import { sql } from "drizzle-orm";

// ============================================================
// Types
// ============================================================

export interface QBConnection {
  id: number;
  partnerSlug: string;
  qbRealmId: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  companyName: string;
  connectedAt: Date;
  lastSyncAt: Date | null;
  status: "active" | "expired" | "disconnected";
  createdAt: Date;
}

export interface QBSyncLog {
  id: number;
  partnerSlug: string;
  syncType: "invoice" | "payment" | "customer" | "all";
  direction: "push" | "pull";
  recordsSynced: number;
  errors: any;
  startedAt: Date;
  completedAt: Date | null;
}

// ============================================================
// Table Initialization
// ============================================================

const initSQL = sql`
  CREATE TABLE IF NOT EXISTS partner_quickbooks_connections (
    id SERIAL PRIMARY KEY,
    partner_slug TEXT NOT NULL,
    qb_realm_id TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    company_name TEXT,
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    last_sync_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','disconnected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS partner_qb_sync_log (
    id SERIAL PRIMARY KEY,
    partner_slug TEXT NOT NULL,
    sync_type TEXT NOT NULL CHECK (sync_type IN ('invoice','payment','customer','all')),
    direction TEXT NOT NULL CHECK (direction IN ('push','pull')),
    records_synced INT DEFAULT 0,
    errors JSONB,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
  );
`;

let initialized = false;
async function ensureTables() {
  if (initialized) return;
  await db.execute(initSQL);
  initialized = true;
}

// ============================================================
// QB Config (placeholder — replace with real credentials)
// ============================================================

const QB_CONFIG = {
  clientId: process.env.QB_CLIENT_ID || "PLACEHOLDER_CLIENT_ID",
  clientSecret: process.env.QB_CLIENT_SECRET || "PLACEHOLDER_CLIENT_SECRET",
  redirectUri: process.env.QB_REDIRECT_URI || "https://app.uptend.com/api/partners/quickbooks/callback",
  authEndpoint: "https://appcenter.intuit.com/connect/oauth2",
  tokenEndpoint: "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
  apiBase: "https://quickbooks.api.intuit.com/v3/company",
  scope: "com.intuit.quickbooks.accounting",
};

// ============================================================
// OAuth Functions
// ============================================================

export async function getAuthUrl(partnerSlug: string): Promise<string> {
  await ensureTables();
  const state = Buffer.from(JSON.stringify({ partnerSlug, ts: Date.now() })).toString("base64");
  return `${QB_CONFIG.authEndpoint}?client_id=${QB_CONFIG.clientId}&redirect_uri=${encodeURIComponent(QB_CONFIG.redirectUri)}&response_type=code&scope=${QB_CONFIG.scope}&state=${state}`;
}

export async function handleCallback(partnerSlug: string, authCode: string, realmId: string): Promise<QBConnection> {
  await ensureTables();

  // TODO: Replace with actual QB token exchange
  // const tokenResponse = await fetch(QB_CONFIG.tokenEndpoint, { method: 'POST', ... });
  const mockTokens = {
    access_token: `mock_access_${Date.now()}`,
    refresh_token: `mock_refresh_${Date.now()}`,
    expires_in: 3600,
    x_refresh_token_expires_in: 8726400,
  };

  // TODO: Fetch company info from QB API
  const companyName = `Company-${realmId}`;

  const expiresAt = new Date(Date.now() + mockTokens.expires_in * 1000);

  // Upsert connection
  const result = await db.execute(sql`
    INSERT INTO partner_quickbooks_connections (partner_slug, qb_realm_id, access_token, refresh_token, token_expires_at, company_name, status)
    VALUES (${partnerSlug}, ${realmId}, ${mockTokens.access_token}, ${mockTokens.refresh_token}, ${expiresAt.toISOString()}, ${companyName}, 'active')
    ON CONFLICT (partner_slug) WHERE status != 'disconnected'
    DO UPDATE SET
      qb_realm_id = EXCLUDED.qb_realm_id,
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      token_expires_at = EXCLUDED.token_expires_at,
      company_name = EXCLUDED.company_name,
      connected_at = NOW(),
      status = 'active'
    RETURNING *
  `);

  // If ON CONFLICT didn't match, just do a plain insert
  if (!result.rows?.length) {
    const r2 = await db.execute(sql`
      SELECT * FROM partner_quickbooks_connections WHERE partner_slug = ${partnerSlug} AND status != 'disconnected' ORDER BY id DESC LIMIT 1
    `);
    return r2.rows[0] as any;
  }
  return result.rows[0] as any;
}

export async function refreshToken(partnerSlug: string): Promise<{ success: boolean; message: string }> {
  await ensureTables();

  const conn = await db.execute(sql`
    SELECT * FROM partner_quickbooks_connections WHERE partner_slug = ${partnerSlug} AND status != 'disconnected' ORDER BY id DESC LIMIT 1
  `);
  if (!conn.rows?.length) return { success: false, message: "No QuickBooks connection found" };

  const connection = conn.rows[0] as any;

  // TODO: Replace with actual QB token refresh
  // const response = await fetch(QB_CONFIG.tokenEndpoint, { method: 'POST', body: `grant_type=refresh_token&refresh_token=${connection.refresh_token}` });
  const newAccessToken = `mock_refreshed_${Date.now()}`;
  const newExpiresAt = new Date(Date.now() + 3600 * 1000);

  await db.execute(sql`
    UPDATE partner_quickbooks_connections
    SET access_token = ${newAccessToken}, token_expires_at = ${newExpiresAt.toISOString()}, status = 'active'
    WHERE id = ${connection.id}
  `);

  return { success: true, message: "Token refreshed successfully" };
}

export async function getConnectionStatus(partnerSlug: string): Promise<QBConnection | null> {
  await ensureTables();
  const result = await db.execute(sql`
    SELECT * FROM partner_quickbooks_connections WHERE partner_slug = ${partnerSlug} AND status != 'disconnected' ORDER BY id DESC LIMIT 1
  `);
  if (!result.rows?.length) return null;
  const conn = result.rows[0] as any;
  // Check if expired
  if (conn.token_expires_at && new Date(conn.token_expires_at) < new Date() && conn.status === "active") {
    await db.execute(sql`UPDATE partner_quickbooks_connections SET status = 'expired' WHERE id = ${conn.id}`);
    conn.status = "expired";
  }
  return conn;
}

export async function disconnectQuickBooks(partnerSlug: string): Promise<{ success: boolean }> {
  await ensureTables();
  await db.execute(sql`
    UPDATE partner_quickbooks_connections SET status = 'disconnected', access_token = NULL, refresh_token = NULL
    WHERE partner_slug = ${partnerSlug} AND status != 'disconnected'
  `);
  return { success: true };
}

// ============================================================
// Sync Functions (Stubbed)
// ============================================================

async function logSync(partnerSlug: string, syncType: string, direction: string): Promise<number> {
  const result = await db.execute(sql`
    INSERT INTO partner_qb_sync_log (partner_slug, sync_type, direction, started_at)
    VALUES (${partnerSlug}, ${syncType}, ${direction}, NOW())
    RETURNING id
  `);
  return (result.rows[0] as any).id;
}

async function completeSync(logId: number, recordsSynced: number, errors: any = null) {
  await db.execute(sql`
    UPDATE partner_qb_sync_log SET completed_at = NOW(), records_synced = ${recordsSynced}, errors = ${errors ? JSON.stringify(errors) : null}
    WHERE id = ${logId}
  `);
}

export async function syncInvoicesToQB(partnerSlug: string): Promise<{ synced: number; message: string }> {
  await ensureTables();
  const conn = await getConnectionStatus(partnerSlug);
  if (!conn || conn.status !== "active") return { synced: 0, message: "QuickBooks not connected or token expired" };

  const logId = await logSync(partnerSlug, "invoice", "push");

  // TODO: Fetch unsent invoices from partner_invoices table
  // TODO: For each invoice, POST to QB_CONFIG.apiBase/{realmId}/invoice
  // Stub: pretend we synced 0 invoices
  const mockSynced = 0;

  await completeSync(logId, mockSynced);
  await db.execute(sql`UPDATE partner_quickbooks_connections SET last_sync_at = NOW() WHERE id = ${conn.id}`);

  return { synced: mockSynced, message: `Pushed ${mockSynced} invoices to QuickBooks (stub)` };
}

export async function syncPaymentsFromQB(partnerSlug: string): Promise<{ synced: number; message: string }> {
  await ensureTables();
  const conn = await getConnectionStatus(partnerSlug);
  if (!conn || conn.status !== "active") return { synced: 0, message: "QuickBooks not connected or token expired" };

  const logId = await logSync(partnerSlug, "payment", "pull");

  // TODO: GET from QB_CONFIG.apiBase/{realmId}/query?query=SELECT * FROM Payment WHERE ...
  // TODO: Match payments to partner_invoices and update status
  const mockSynced = 0;

  await completeSync(logId, mockSynced);
  await db.execute(sql`UPDATE partner_quickbooks_connections SET last_sync_at = NOW() WHERE id = ${conn.id}`);

  return { synced: mockSynced, message: `Pulled ${mockSynced} payments from QuickBooks (stub)` };
}

export async function syncCustomers(partnerSlug: string): Promise<{ synced: number; message: string }> {
  await ensureTables();
  const conn = await getConnectionStatus(partnerSlug);
  if (!conn || conn.status !== "active") return { synced: 0, message: "QuickBooks not connected or token expired" };

  const logId = await logSync(partnerSlug, "customer", "push");

  // TODO: Bidirectional customer sync
  // 1. Push new local customers to QB
  // 2. Pull new QB customers to local
  const mockSynced = 0;

  await completeSync(logId, mockSynced);
  return { synced: mockSynced, message: `Synced ${mockSynced} customers (stub)` };
}

export async function getSyncHistory(partnerSlug: string): Promise<QBSyncLog[]> {
  await ensureTables();
  const result = await db.execute(sql`
    SELECT * FROM partner_qb_sync_log WHERE partner_slug = ${partnerSlug} ORDER BY started_at DESC LIMIT 50
  `);
  return result.rows as any[];
}

export async function triggerFullSync(partnerSlug: string): Promise<{ invoices: any; payments: any; customers: any }> {
  await ensureTables();

  const logId = await logSync(partnerSlug, "all", "push");

  const invoices = await syncInvoicesToQB(partnerSlug);
  const payments = await syncPaymentsFromQB(partnerSlug);
  const customers = await syncCustomers(partnerSlug);

  const totalSynced = invoices.synced + payments.synced + customers.synced;
  await completeSync(logId, totalSynced);

  return { invoices, payments, customers };
}
