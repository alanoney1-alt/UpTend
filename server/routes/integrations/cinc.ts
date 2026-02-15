/**
 * CINC Systems Integration - HOA Management
 */
import type { Express, Request, Response } from "express";
import { db } from "../../db";
import { integrationConnections, integrationSyncLogs, communities } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { encryptCredentials, decryptCredentials } from "../../services/encryption";
import { z } from "zod";

const connectSchema = z.object({
  apiKey: z.string().min(1),
  companyId: z.string().min(1),
  baseUrl: z.string().url().default("https://api.cincapi.com"),
  businessAccountId: z.string().min(1),
});

async function getConnection(bid: string) {
  const [c] = await db.select().from(integrationConnections)
    .where(and(eq(integrationConnections.businessAccountId, bid), eq(integrationConnections.platform, "cinc"))).limit(1);
  return c;
}

async function cincFetch(conn: any, endpoint: string) {
  const creds = decryptCredentials(conn.credentials!);
  const res = await fetch(`${creds.baseUrl}/v1${endpoint}`, {
    headers: { "Authorization": `Bearer ${creds.apiKey}`, "X-Company-ID": creds.companyId, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`CINC API ${res.status}: ${await res.text()}`);
  return res.json();
}

export function registerCincRoutes(app: Express) {
  app.post("/api/integrations/cinc/connect", async (req: Request, res: Response) => {
    try {
      const data = connectSchema.parse(req.body);
      const { businessAccountId, ...creds } = data;
      const existing = await getConnection(businessAccountId);
      const encrypted = encryptCredentials(creds);
      if (existing) {
        await db.update(integrationConnections).set({ credentials: encrypted, status: "active" }).where(eq(integrationConnections.id, existing.id));
      } else {
        await db.insert(integrationConnections).values({ businessAccountId, platform: "cinc", credentials: encrypted, status: "active" });
      }
      res.json({ success: true, message: "CINC Systems connected" });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: error.errors });
      res.status(500).json({ error: "Failed to configure CINC" });
    }
  });

  app.post("/api/integrations/cinc/sync", async (req: Request, res: Response) => {
    try {
      const { businessAccountId } = req.body;
      if (!businessAccountId) return res.status(400).json({ error: "Missing businessAccountId" });
      const conn = await getConnection(businessAccountId);
      if (!conn || conn.status === "disconnected") return res.status(400).json({ error: "CINC not connected" });

      let total = 0;
      const results: Record<string, any> = {};

      // Sync communities/associations
      const assocs = await cincFetch(conn, "/associations");
      if (Array.isArray(assocs?.data)) {
        for (const a of assocs.data) {
          await db.insert(communities).values({
            name: a.name || a.associationName || "",
            managementCompanyId: businessAccountId,
            address: a.address,
            city: a.city,
            state: a.state,
            zip: a.zip,
            unitsCount: a.totalUnits || a.lotCount || 0,
          }).onConflictDoNothing();
          total++;
        }
        results.communities = assocs.data.length;
      }

      // Sync violations
      const violations = await cincFetch(conn, "/violations?status=open");
      if (Array.isArray(violations?.data)) {
        results.violations = violations.data.length;
        total += violations.data.length;
      }

      // Sync architectural requests
      const archRequests = await cincFetch(conn, "/architectural-requests?status=pending");
      if (Array.isArray(archRequests?.data)) {
        results.architecturalRequests = archRequests.data.length;
        total += archRequests.data.length;
      }

      await db.insert(integrationSyncLogs).values({ connectionId: conn.id, platform: "cinc", action: "sync", status: "success", recordsProcessed: total, details: results });
      await db.update(integrationConnections).set({ lastSyncAt: new Date(), lastSyncResult: { status: "success", ...results } }).where(eq(integrationConnections.id, conn.id));
      res.json({ success: true, recordsProcessed: total, details: results });
    } catch (error: any) {
      res.status(500).json({ error: "Sync failed", details: error.message });
    }
  });

  app.get("/api/integrations/cinc/status", async (req: Request, res: Response) => {
    const bid = req.query.businessAccountId as string;
    if (!bid) return res.status(400).json({ error: "Missing businessAccountId" });
    const conn = await getConnection(bid);
    if (!conn) return res.json({ connected: false });
    res.json({ connected: conn.status === "active", status: conn.status, lastSyncAt: conn.lastSyncAt, lastSyncResult: conn.lastSyncResult });
  });
}
