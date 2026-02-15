/**
 * Vantaca Integration - HOA Management
 */
import type { Express, Request, Response } from "express";
import { db } from "../../db";
import { integrationConnections, integrationSyncLogs, communities, workOrders } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { encryptCredentials, decryptCredentials } from "../../services/encryption";
import { z } from "zod";

const connectSchema = z.object({
  apiKey: z.string().min(1),
  companyCode: z.string().min(1),
  businessAccountId: z.string().min(1),
});

async function getConnection(bid: string) {
  const [c] = await db.select().from(integrationConnections)
    .where(and(eq(integrationConnections.businessAccountId, bid), eq(integrationConnections.platform, "vantaca"))).limit(1);
  return c;
}

async function vantacaFetch(conn: any, endpoint: string) {
  const creds = decryptCredentials(conn.credentials!);
  const res = await fetch(`https://api.vantaca.com/v1${endpoint}`, {
    headers: { "Authorization": `Bearer ${creds.apiKey}`, "X-Company-Code": creds.companyCode, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Vantaca API ${res.status}: ${await res.text()}`);
  return res.json();
}

export function registerVantacaRoutes(app: Express) {
  app.post("/api/integrations/vantaca/connect", async (req: Request, res: Response) => {
    try {
      const data = connectSchema.parse(req.body);
      const { businessAccountId, ...creds } = data;
      const existing = await getConnection(businessAccountId);
      const encrypted = encryptCredentials(creds);
      if (existing) {
        await db.update(integrationConnections).set({ credentials: encrypted, status: "active" }).where(eq(integrationConnections.id, existing.id));
      } else {
        await db.insert(integrationConnections).values({ businessAccountId, platform: "vantaca", credentials: encrypted, status: "active" });
      }
      res.json({ success: true, message: "Vantaca connected" });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: error.errors });
      res.status(500).json({ error: "Failed to configure Vantaca" });
    }
  });

  app.post("/api/integrations/vantaca/sync", async (req: Request, res: Response) => {
    try {
      const { businessAccountId } = req.body;
      if (!businessAccountId) return res.status(400).json({ error: "Missing businessAccountId" });
      const conn = await getConnection(businessAccountId);
      if (!conn || conn.status === "disconnected") return res.status(400).json({ error: "Vantaca not connected" });

      let total = 0;
      const results: Record<string, any> = {};

      const assocs = await vantacaFetch(conn, "/associations");
      if (Array.isArray(assocs?.data)) {
        for (const a of assocs.data) {
          await db.insert(communities).values({
            name: a.name || a.associationName || "",
            managementCompanyId: businessAccountId,
            address: a.address, city: a.city, state: a.state, zip: a.zip,
            unitsCount: a.lotCount || 0,
          }).onConflictDoNothing();
          total++;
        }
        results.associations = assocs.data.length;
      }

      const wos = await vantacaFetch(conn, "/work-orders?status=open");
      if (Array.isArray(wos?.data)) {
        for (const wo of wos.data) {
          await db.insert(workOrders).values({
            unitId: wo.lotId?.toString() || "unknown",
            description: `[Vantaca #${wo.id}] ${wo.description || wo.subject || ""}`,
            priority: wo.priority === "High" ? "urgent" : "normal",
            status: "open", photos: [],
          }).onConflictDoNothing();
          total++;
        }
        results.workOrders = wos.data.length;
      }

      const violations = await vantacaFetch(conn, "/violations?status=open");
      if (Array.isArray(violations?.data)) {
        results.violations = violations.data.length;
        total += violations.data.length;
      }

      await db.insert(integrationSyncLogs).values({ connectionId: conn.id, platform: "vantaca", action: "sync", status: "success", recordsProcessed: total, details: results });
      await db.update(integrationConnections).set({ lastSyncAt: new Date(), lastSyncResult: { status: "success", ...results } }).where(eq(integrationConnections.id, conn.id));
      res.json({ success: true, recordsProcessed: total, details: results });
    } catch (error: any) {
      res.status(500).json({ error: "Sync failed", details: error.message });
    }
  });

  app.get("/api/integrations/vantaca/status", async (req: Request, res: Response) => {
    const bid = req.query.businessAccountId as string;
    if (!bid) return res.status(400).json({ error: "Missing businessAccountId" });
    const conn = await getConnection(bid);
    if (!conn) return res.json({ connected: false });
    res.json({ connected: conn.status === "active", status: conn.status, lastSyncAt: conn.lastSyncAt, lastSyncResult: conn.lastSyncResult });
  });
}
