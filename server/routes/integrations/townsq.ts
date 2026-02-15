/**
 * TownSq Integration - HOA/Community Management
 */
import type { Express, Request, Response } from "express";
import { db } from "../../db";
import { integrationConnections, integrationSyncLogs, communities } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { encryptCredentials, decryptCredentials } from "../../services/encryption";
import { z } from "zod";

const connectSchema = z.object({
  apiKey: z.string().min(1),
  organizationId: z.string().min(1),
  businessAccountId: z.string().min(1),
});

async function getConnection(bid: string) {
  const [c] = await db.select().from(integrationConnections)
    .where(and(eq(integrationConnections.businessAccountId, bid), eq(integrationConnections.platform, "townsq"))).limit(1);
  return c;
}

async function townsqFetch(conn: any, endpoint: string) {
  const creds = decryptCredentials(conn.credentials!);
  const res = await fetch(`https://api.townsq.io/v2${endpoint}`, {
    headers: { "Authorization": `Bearer ${creds.apiKey}`, "X-Organization-ID": creds.organizationId, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`TownSq API ${res.status}: ${await res.text()}`);
  return res.json();
}

export function registerTownSqRoutes(app: Express) {
  app.post("/api/integrations/townsq/connect", async (req: Request, res: Response) => {
    try {
      const data = connectSchema.parse(req.body);
      const { businessAccountId, ...creds } = data;
      const existing = await getConnection(businessAccountId);
      const encrypted = encryptCredentials(creds);
      if (existing) {
        await db.update(integrationConnections).set({ credentials: encrypted, status: "active" }).where(eq(integrationConnections.id, existing.id));
      } else {
        await db.insert(integrationConnections).values({ businessAccountId, platform: "townsq", credentials: encrypted, status: "active" });
      }
      res.json({ success: true, message: "TownSq connected" });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: error.errors });
      res.status(500).json({ error: "Failed to configure TownSq" });
    }
  });

  app.post("/api/integrations/townsq/sync", async (req: Request, res: Response) => {
    try {
      const { businessAccountId } = req.body;
      if (!businessAccountId) return res.status(400).json({ error: "Missing businessAccountId" });
      const conn = await getConnection(businessAccountId);
      if (!conn || conn.status === "disconnected") return res.status(400).json({ error: "TownSq not connected" });

      let total = 0;
      const results: Record<string, any> = {};

      const comms = await townsqFetch(conn, "/communities");
      if (Array.isArray(comms?.data)) {
        for (const c of comms.data) {
          await db.insert(communities).values({
            name: c.name || "",
            managementCompanyId: businessAccountId,
            address: c.address,
            city: c.city,
            state: c.state,
            zip: c.zipCode,
            unitsCount: c.unitCount || 0,
          }).onConflictDoNothing();
          total++;
        }
        results.communities = comms.data.length;
      }

      const serviceReqs = await townsqFetch(conn, "/service-requests?status=open");
      if (Array.isArray(serviceReqs?.data)) {
        results.serviceRequests = serviceReqs.data.length;
        total += serviceReqs.data.length;
      }

      await db.insert(integrationSyncLogs).values({ connectionId: conn.id, platform: "townsq", action: "sync", status: "success", recordsProcessed: total, details: results });
      await db.update(integrationConnections).set({ lastSyncAt: new Date(), lastSyncResult: { status: "success", ...results } }).where(eq(integrationConnections.id, conn.id));
      res.json({ success: true, recordsProcessed: total, details: results });
    } catch (error: any) {
      res.status(500).json({ error: "Sync failed", details: error.message });
    }
  });

  app.get("/api/integrations/townsq/status", async (req: Request, res: Response) => {
    const bid = req.query.businessAccountId as string;
    if (!bid) return res.status(400).json({ error: "Missing businessAccountId" });
    const conn = await getConnection(bid);
    if (!conn) return res.json({ connected: false });
    res.json({ connected: conn.status === "active", status: conn.status, lastSyncAt: conn.lastSyncAt, lastSyncResult: conn.lastSyncResult });
  });
}
