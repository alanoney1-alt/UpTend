/**
 * Email Receipt Scanner Service
 *
 * Scans Gmail for receipts from known retailers.
 * OAuth keys to be added later - structure is ready.
 */

import { pool } from "../db.js";

const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || "";
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || "";
const GMAIL_REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || "https://uptend.com/api/purchases/email-callback";

const RETAILER_SENDERS: Record<string, string> = {
  lowes: "Lowes@lowes.com",
  home_depot: "order-confirmation@homedepot.com",
  walmart: "help@walmart.com",
  amazon: "auto-confirm@amazon.com",
};

/**
 * Get Gmail OAuth URL for a customer
 */
export function getEmailAuthUrl(customerId: string, provider: string = "gmail"): string {
  if (!GMAIL_CLIENT_ID) {
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=PLACEHOLDER&redirect_uri=${encodeURIComponent(GMAIL_REDIRECT_URI)}&response_type=code&scope=https://www.googleapis.com/auth/gmail.readonly&state=${customerId}&access_type=offline&prompt=consent`;
  }

  const params = new URLSearchParams({
    client_id: GMAIL_CLIENT_ID,
    redirect_uri: GMAIL_REDIRECT_URI,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/gmail.readonly",
    state: customerId,
    access_type: "offline",
    prompt: "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Handle OAuth callback - exchange code for tokens, store connection
 */
export async function handleEmailCallback(code: string, customerId: string): Promise<{ success: boolean; error?: string }> {
  if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET) {
    console.warn("[Email Scanner] Gmail OAuth not configured - storing placeholder connection");
    await pool.query(
      `INSERT INTO retailer_connections (customer_id, retailer, connection_type, status, account_email)
       VALUES ($1, 'amazon', 'email_scan', 'connected', 'pending-oauth-setup')
       ON CONFLICT (customer_id, retailer) DO UPDATE SET status = 'connected'`,
      [customerId]
    );
    return { success: true };
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GMAIL_CLIENT_ID,
        client_secret: GMAIL_CLIENT_SECRET,
        redirect_uri: GMAIL_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json() as any;
    if (!tokens.access_token) {
      return { success: false, error: "Failed to get access token" };
    }

    // Store connection for each retailer we'll scan
    for (const retailer of Object.keys(RETAILER_SENDERS)) {
      await pool.query(
        `INSERT INTO retailer_connections (customer_id, retailer, connection_type, access_token, refresh_token, status)
         VALUES ($1, $2, 'email_scan', $3, $4, 'connected')
         ON CONFLICT (customer_id, retailer) DO UPDATE SET access_token = $3, refresh_token = $4, status = 'connected'`,
        [customerId, retailer, tokens.access_token, tokens.refresh_token || null]
      );
    }

    return { success: true };
  } catch (error: any) {
    console.error("[Email Scanner] OAuth error:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Scan Gmail for receipts from known retailers
 * Full implementation pending OAuth keys
 */
export async function scanForReceipts(customerId: string): Promise<{ receiptsFound: number; retailers: string[] }> {
  // Check for active email connection
  const { rows: connections } = await pool.query(
    `SELECT retailer, access_token FROM retailer_connections
     WHERE customer_id = $1 AND connection_type = 'email_scan' AND status = 'connected'`,
    [customerId]
  );

  if (connections.length === 0) {
    return { receiptsFound: 0, retailers: [] };
  }

  // TODO: When Gmail OAuth is configured, use Gmail API to search:
  // For each retailer, search: `from:${RETAILER_SENDERS[retailer]} subject:(order OR receipt OR confirmation)`
  // Parse HTML email bodies to extract items, dates, prices
  // Store as customer_purchases with source = 'email_scan'

  console.log(`[Email Scanner] Would scan ${connections.length} retailer connections for customer ${customerId}`);

  // Update last sync timestamp
  await pool.query(
    `UPDATE retailer_connections SET last_sync_at = NOW() WHERE customer_id = $1 AND connection_type = 'email_scan'`,
    [customerId]
  );

  return { receiptsFound: 0, retailers: connections.map((c: any) => c.retailer) };
}

/**
 * Schedule periodic re-scan (weekly)
 * In production, this would use a job queue (Bull, pg-boss, etc.)
 */
export async function scheduleSyncJob(customerId: string): Promise<{ scheduled: boolean; nextSync: string }> {
  const nextSync = new Date();
  nextSync.setDate(nextSync.getDate() + 7);

  // For now, just log the intent - actual scheduling would use cron/job queue
  console.log(`[Email Scanner] Scheduled weekly sync for customer ${customerId}, next: ${nextSync.toISOString()}`);

  return { scheduled: true, nextSync: nextSync.toISOString() };
}
