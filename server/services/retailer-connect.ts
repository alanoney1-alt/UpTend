/**
 * Retailer Connection Service
 *
 * Manages connections to retail loyalty accounts (Lowe's, Home Depot, etc.)
 * OAuth keys to be added later - structure ready.
 */

import { pool } from "../db.js";

type Retailer = "lowes" | "home_depot" | "walmart" | "amazon";

const RETAILER_INFO: Record<Retailer, { name: string; oauthAvailable: boolean; loyaltyProgram: string }> = {
  lowes: { name: "Lowe's", oauthAvailable: false, loyaltyProgram: "MyLowe's" },
  home_depot: { name: "Home Depot", oauthAvailable: false, loyaltyProgram: "Pro Xtra" },
  walmart: { name: "Walmart", oauthAvailable: false, loyaltyProgram: "Walmart+" },
  amazon: { name: "Amazon", oauthAvailable: false, loyaltyProgram: "Amazon Account" },
};

/**
 * Connect a retailer account - explains what connecting does, initiates flow
 */
export async function connectRetailer(
  customerId: string,
  retailer: Retailer
): Promise<{ success: boolean; message: string; authUrl?: string }> {
  const info = RETAILER_INFO[retailer];
  if (!info) {
    return { success: false, message: `Unknown retailer: ${retailer}` };
  }

  // For now, create a pending connection - OAuth to be implemented per retailer
  await pool.query(
    `INSERT INTO retailer_connections (customer_id, retailer, connection_type, status)
     VALUES ($1, $2, 'loyalty_account', 'connected')
     ON CONFLICT (customer_id, retailer) DO UPDATE SET status = 'connected', connected_at = NOW()`,
    [customerId, retailer]
  );

  return {
    success: true,
    message: `${info.name} connection initiated. When OAuth is configured, we'll link your ${info.loyaltyProgram} account to automatically import purchase history.`,
  };
}

/**
 * Get all connected retailers with sync status
 */
export async function getConnectedRetailers(customerId: string): Promise<any[]> {
  const { rows } = await pool.query(
    `SELECT retailer, connection_type, status, last_sync_at, purchase_count, connected_at, account_email
     FROM retailer_connections WHERE customer_id = $1 ORDER BY connected_at DESC`,
    [customerId]
  );

  return rows.map((r: any) => ({
    retailer: r.retailer,
    name: RETAILER_INFO[r.retailer as Retailer]?.name || r.retailer,
    connectionType: r.connection_type,
    status: r.status,
    lastSyncAt: r.last_sync_at,
    purchaseCount: r.purchase_count,
    connectedAt: r.connected_at,
    accountEmail: r.account_email,
  }));
}

/**
 * Disconnect a retailer and optionally delete synced data
 */
export async function disconnectRetailer(
  customerId: string,
  retailer: Retailer,
  deleteData: boolean = false
): Promise<{ success: boolean }> {
  await pool.query(
    `UPDATE retailer_connections SET status = 'disconnected', access_token = NULL, refresh_token = NULL
     WHERE customer_id = $1 AND retailer = $2`,
    [customerId, retailer]
  );

  if (deleteData) {
    await pool.query(
      `DELETE FROM customer_purchases WHERE customer_id = $1 AND store = $2 AND source = 'loyalty_link'`,
      [customerId, retailer]
    );
  }

  return { success: true };
}

/**
 * Sync purchase history from a connected retailer
 * Full implementation pending OAuth keys per retailer
 */
export async function syncPurchaseHistory(
  customerId: string,
  retailer: Retailer
): Promise<{ synced: number; message: string }> {
  const { rows } = await pool.query(
    `SELECT status, access_token FROM retailer_connections WHERE customer_id = $1 AND retailer = $2`,
    [customerId, retailer]
  );

  if (rows.length === 0 || rows[0].status !== "connected") {
    return { synced: 0, message: `${retailer} is not connected. Connect it first.` };
  }

  // TODO: When retailer OAuth is configured, use their APIs to pull purchase history
  // Each retailer has different APIs:
  // - Lowe's: MyLowe's API (purchase history)
  // - Home Depot: Pro Xtra API
  // - Walmart: Walmart+ API
  // - Amazon: Amazon Order API

  await pool.query(
    `UPDATE retailer_connections SET last_sync_at = NOW() WHERE customer_id = $1 AND retailer = $2`,
    [customerId, retailer]
  );

  return { synced: 0, message: `Sync structure ready for ${RETAILER_INFO[retailer]?.name}. OAuth keys needed for live sync.` };
}
