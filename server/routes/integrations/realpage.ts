/**
 * RealPage Integration - REST API
 */
import type { Express, Request, Response } from "express";
import { db } from "../../db";
import { integrationConnections, integrationSyncLogs, pmProperties, workOrders } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { encryptCredentials, decryptCredentials } from "../../services/encryption";
import { z } from "zod";

const connectSchema = z.object({
  apiKey: z.string().min(1),
  siteId: z.string().min(1),
  pmcId: z.string().min(1),
  baseUrl: z.string().url().default("https://api.realpage.com"),
  businessAccountId: z.string().min(1),
});

async function getConnection(bid: string) {
  const [c] = await db.select().from(integrationConnections)
    .where(and(eq(integrationConnections.businessAccountId, bid), eq(integrationConnections.platform, "realpage"))).limit(1);
  return c;
}

async function rpFetch(conn: any, endpoint: string) {
  const creds = decryptCredentials(conn.credentials!);
  const res = await fetch(`${creds.baseUrl}/v1${endpoint}`, {
    headers: { "X-API-Key": creds.apiKey, "X-Site-ID": creds.siteId, "X-PMC-ID": creds.pmcId, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`RealPage API ${res.status}: ${await res.text()}`);
  return res.json();
}

export function registerRealPageRoutes(app: Express) {
  app.post("/api/integrations/realpage/connect", async (req: Request, res: Response) => {
    try {
      const data = connectSchema.parse(req.body);
      const { businessAccountId, ...creds } = data;
      const existing = await getConnection(businessAccountId);
      const encrypted = encryptCredentials(creds);
      if (existing) {
        await db.update(integrationConnections).set({ credentials: encrypted, status: "active" }).where(eq(integrationConnections.id, existing.id));
      } else {
        await db.insert(integrationConnections).values({ businessAccountId, platform: "realpage", credentials: encrypted, status: "active" });
      }
      res.json({ success: true, message: "RealPage connected" });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: error.errors });
      res.status(500).json({ error: "Failed to configure RealPage" });
    }
  });

  app.post("/api/integrations/realpage/sync", async (req: Request, res: Response) => {
    try {
      const { businessAccountId } = req.body;
      if (!businessAccountId) return res.status(400).json({ error: "Missing businessAccountId" });
      const conn = await getConnection(businessAccountId);
      if (!conn || conn.status === "disconnected") return res.status(400).json({ error: "RealPage not connected" });

      let total = 0;
      const results: Record<string, any> = {};

      const props = await rpFetch(conn, "/properties");
      if (props?.results) {
        for (const p of props.results) {
          await db.insert(pmProperties).values({
            portfolioId: businessAccountId, address: p.address || p.name || "", city: p.city, state: p.state, zip: p.zipCode,
            units: p.unitCount || 1, type: p.propertyType || "multi_family",
          }).onConflictDoNothing();
          total++;
        }
        results.properties = props.results.length;
      }

      const wos = await rpFetch(conn, "/service-requests?status=open");
      if (wos?.results) {
        for (const wo of wos.results) {
          await db.insert(workOrders).values({
            unitId: wo.unitId?.toString() || "unknown",
            description: `[RealPage #${wo.id}] ${wo.description || wo.summary || ""}`,
            priority: wo.priority === "Emergency" ? "emergency" : wo.priority === "High" ? "urgent" : "normal",
            status: "open", photos: [],
          }).onConflictDoNothing();
          total++;
        }
        results.workOrders = wos.results.length;
      }

      await db.insert(integrationSyncLogs).values({ connectionId: conn.id, platform: "realpage", action: "sync", status: "success", recordsProcessed: total, details: results });
      await db.update(integrationConnections).set({ lastSyncAt: new Date(), lastSyncResult: { status: "success", ...results } }).where(eq(integrationConnections.id, conn.id));
      res.json({ success: true, recordsProcessed: total, details: results });
    } catch (error: any) {
      res.status(500).json({ error: "Sync failed", details: error.message });
    }
  });

  app.get("/api/integrations/realpage/status", async (req: Request, res: Response) => {
    const bid = req.query.businessAccountId as string;
    if (!bid) return res.status(400).json({ error: "Missing businessAccountId" });
    const conn = await getConnection(bid);
    if (!conn) return res.json({ connected: false });
    res.json({ connected: conn.status === "active", status: conn.status, lastSyncAt: conn.lastSyncAt, lastSyncResult: conn.lastSyncResult });
  });
}
