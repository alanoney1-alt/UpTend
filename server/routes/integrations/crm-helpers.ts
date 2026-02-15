/**
 * Shared helpers for CRM integration routes
 */
import type { Request, Response } from "express";
import { db } from "../../db";
import { integrationConnections } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { parseCredentials, logSync, type CrmPlatform } from "../../services/crm-sync";

/**
 * Middleware-style: get active connection or return 400
 */
export async function requireConnection(
  req: Request,
  res: Response,
  platform: CrmPlatform,
): Promise<{ connection: any; credentials: Record<string, any> } | null> {
  const businessAccountId = req.body.businessAccountId || req.query.businessAccountId;
  if (!businessAccountId) {
    res.status(400).json({ error: "businessAccountId is required" });
    return null;
  }

  const [conn] = await db.select().from(integrationConnections)
    .where(and(
      eq(integrationConnections.businessAccountId, businessAccountId as string),
      eq(integrationConnections.platform, platform),
      eq(integrationConnections.status, "active"),
    ))
    .limit(1);

  if (!conn) {
    res.status(400).json({
      error: `No active ${platform} connection found`,
      hint: `Connect your ${platform} account first via POST /api/integrations/${platform}/connect`,
    });
    return null;
  }

  return { connection: conn, credentials: parseCredentials(conn) };
}

/**
 * Store/update a connection after OAuth or API key setup
 */
export async function storeConnection(
  businessAccountId: string,
  platform: CrmPlatform,
  credentials: Record<string, any>,
) {
  const [existing] = await db.select().from(integrationConnections)
    .where(and(
      eq(integrationConnections.businessAccountId, businessAccountId),
      eq(integrationConnections.platform, platform),
    ))
    .limit(1);

  const credStr = JSON.stringify(credentials);

  if (existing) {
    await db.update(integrationConnections)
      .set({ credentials: credStr, status: "active", lastSyncAt: new Date() })
      .where(eq(integrationConnections.id, existing.id));
    return existing.id;
  }

  const [record] = await db.insert(integrationConnections).values({
    businessAccountId,
    platform,
    credentials: credStr,
    status: "active",
    syncFrequency: "manual",
    autoSync: false,
  }).returning();
  return record.id;
}

export { logSync, parseCredentials };
export type { CrmPlatform };
