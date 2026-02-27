/**
 * Smart Home OAuth Service
 *
 * Framework for connecting smart home platforms via OAuth.
 * Placeholder client IDs - actual API keys added later.
 */

import { pool } from "../db";

// ─── Platform Configurations ─────────────────────────────────────────────────

export type SmartHomePlatform = "nest" | "ring" | "august" | "ecobee" | "myq";

interface PlatformConfig {
  name: string;
  authUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  icon: string;
}

const PLATFORM_CONFIGS: Record<SmartHomePlatform, PlatformConfig> = {
  nest: {
    name: "Google Nest",
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    clientId: process.env.NEST_CLIENT_ID || "PLACEHOLDER_NEST_CLIENT_ID",
    clientSecret: process.env.NEST_CLIENT_SECRET || "PLACEHOLDER_NEST_SECRET",
    scopes: ["https://www.googleapis.com/auth/sdm.service"],
    icon: "🏠",
  },
  ring: {
    name: "Ring",
    authUrl: "https://oauth.ring.com/oauth/authorize",
    tokenUrl: "https://oauth.ring.com/oauth/token",
    clientId: process.env.RING_CLIENT_ID || "PLACEHOLDER_RING_CLIENT_ID",
    clientSecret: process.env.RING_CLIENT_SECRET || "PLACEHOLDER_RING_SECRET",
    scopes: ["devices:read", "alerts:read"],
    icon: "🔔",
  },
  august: {
    name: "August / Yale",
    authUrl: "https://api.august.com/oauth/authorize",
    tokenUrl: "https://api.august.com/oauth/token",
    clientId: process.env.AUGUST_CLIENT_ID || "PLACEHOLDER_AUGUST_CLIENT_ID",
    clientSecret: process.env.AUGUST_CLIENT_SECRET || "PLACEHOLDER_AUGUST_SECRET",
    scopes: ["locks:read", "locks:control"],
    icon: "🔒",
  },
  ecobee: {
    name: "Ecobee",
    authUrl: "https://api.ecobee.com/authorize",
    tokenUrl: "https://api.ecobee.com/token",
    clientId: process.env.ECOBEE_CLIENT_ID || "PLACEHOLDER_ECOBEE_CLIENT_ID",
    clientSecret: process.env.ECOBEE_CLIENT_SECRET || "PLACEHOLDER_ECOBEE_SECRET",
    scopes: ["smartRead", "smartWrite"],
    icon: "🌡️",
  },
  myq: {
    name: "myQ",
    authUrl: "https://partner-identity.myq-cloud.com/connect/authorize",
    tokenUrl: "https://partner-identity.myq-cloud.com/connect/token",
    clientId: process.env.MYQ_CLIENT_ID || "PLACEHOLDER_MYQ_CLIENT_ID",
    clientSecret: process.env.MYQ_CLIENT_SECRET || "PLACEHOLDER_MYQ_SECRET",
    scopes: ["MyQ_Residential", "offline_access"],
    icon: "🚗",
  },
};

// ─── OAuth Flow ──────────────────────────────────────────────────────────────

export function getAuthUrl(platform: SmartHomePlatform, customerId: string, redirectUri: string): string {
  const config = PLATFORM_CONFIGS[platform];
  if (!config) throw new Error(`Unsupported platform: ${platform}`);

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    state: `${customerId}:${platform}`,
    access_type: "offline",
  });

  return `${config.authUrl}?${params.toString()}`;
}

export async function handleCallback(
  platform: SmartHomePlatform,
  code: string,
  customerId: string
): Promise<{ connectionId: string; deviceCount: number }> {
  const config = PLATFORM_CONFIGS[platform];
  if (!config) throw new Error(`Unsupported platform: ${platform}`);

  // Exchange code for tokens
  const tokenRes = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: `${process.env.APP_URL || "https://uptend.com"}/api/smart-home/callback/${platform}`,
    }),
  });

  if (!tokenRes.ok) {
    throw new Error(`Token exchange failed for ${platform}: ${tokenRes.statusText}`);
  }

  const tokens = await tokenRes.json() as any;

  const tokenExpires = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000)
    : null;

  const { rows } = await pool.query(
    `INSERT INTO smart_home_connections
      (customer_id, platform, access_token, refresh_token, token_expires, status)
     VALUES ($1, $2, $3, $4, $5, 'connected')
     ON CONFLICT (customer_id, platform) DO UPDATE SET
       access_token = $3, refresh_token = COALESCE($4, smart_home_connections.refresh_token),
       token_expires = $5, status = 'connected', last_sync_at = NOW()
     RETURNING id`,
    [customerId, platform, tokens.access_token, tokens.refresh_token || null, tokenExpires]
  );

  return { connectionId: rows[0].id, deviceCount: 0 };
}

export async function refreshConnection(connectionId: string): Promise<boolean> {
  const { rows } = await pool.query(
    "SELECT * FROM smart_home_connections WHERE id = $1",
    [connectionId]
  );
  if (!rows.length) return false;

  const conn = rows[0];
  const config = PLATFORM_CONFIGS[conn.platform as SmartHomePlatform];
  if (!config || !conn.refresh_token) return false;

  try {
    const tokenRes = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: conn.refresh_token,
        client_id: config.clientId,
        client_secret: config.clientSecret,
      }),
    });

    if (!tokenRes.ok) {
      await pool.query("UPDATE smart_home_connections SET status = 'expired' WHERE id = $1", [connectionId]);
      return false;
    }

    const tokens = await tokenRes.json() as any;
    const tokenExpires = tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null;

    await pool.query(
      `UPDATE smart_home_connections SET
        access_token = $2, refresh_token = COALESCE($3, refresh_token),
        token_expires = $4, status = 'connected', last_sync_at = NOW()
       WHERE id = $1`,
      [connectionId, tokens.access_token, tokens.refresh_token || null, tokenExpires]
    );
    return true;
  } catch {
    await pool.query("UPDATE smart_home_connections SET status = 'expired' WHERE id = $1", [connectionId]);
    return false;
  }
}

export async function getConnectedDevices(customerId: string) {
  const { rows } = await pool.query(
    `SELECT id, platform, device_count, devices, status, connected_at, last_sync_at
     FROM smart_home_connections WHERE customer_id = $1 ORDER BY connected_at DESC`,
    [customerId]
  );
  return rows;
}

export async function disconnectPlatform(customerId: string, platform: SmartHomePlatform): Promise<boolean> {
  const { rowCount } = await pool.query(
    "DELETE FROM smart_home_connections WHERE customer_id = $1 AND platform = $2",
    [customerId, platform]
  );
  return (rowCount ?? 0) > 0;
}

export function getSupportedPlatforms() {
  return Object.entries(PLATFORM_CONFIGS).map(([key, config]) => ({
    id: key,
    name: config.name,
    icon: config.icon,
    scopes: config.scopes,
  }));
}
