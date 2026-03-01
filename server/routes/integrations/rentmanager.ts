/**
 * Rent Manager Integration - REST API
 */
import type { Express, Request, Response } from "express";
import { db } from "../../db";
import { integrationConnections, integrationSyncLogs, pmProperties, workOrders } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { encryptCredentials, decryptCredentials } from "../../services/encryption";
import { z } from "zod";

const connectSchema = z.object({
  apiKey: z.string().min(1),
  companyCode: z.string().min(1),
  baseUrl: z.string().url().default("https://api.rentmanager.com"),
  businessAccountId: z.string().min(1),
});

async function getConnection(bid: string) {
  const [c] = await db.select().from(integrationConnections)
    .where(and(eq(integrationConnections.businessAccountId, bid), eq(integrationConnections.platform, "rentmanager"))).limit(1);
  return c;
}

async function rmFetch(conn: any, endpoint: string) {
  const creds = decryptCredentials(conn.credentials!);
  const res = await fetch(`${creds.baseUrl}/api/v1/${creds.companyCode}${endpoint}`, {
    headers: { "X-RM12Api-ApiToken": creds.apiKey, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Rent Manager API ${res.status}: ${await res.text()}`);
  return res.json();
}

export function registerRentManagerRoutes(app: Express) {
  app.post("/api/integrations/rentmanager/connect", async (req: Request, res: Response) => {
    try {
      const data = connectSchema.parse(req.body);
      const { businessAccountId, ...creds } = data;
      const existing = await getConnection(businessAccountId);
      const encrypted = encryptCredentials(creds);
      if (existing) {
        await db.update(integrationConnections).set({ credentials: encrypted, status: "active" }).where(eq(integrationConnections.id, existing.id));
      } else {
        await db.insert(integrationConnections).values({ businessAccountId, platform: "rentmanager", credentials: encrypted, status: "active" });
      }
      res.json({ success: true, message: "Rent Manager connected" });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: error.errors });
      res.status(500).json({ error: "Failed to configure Rent Manager" });
    }
  });

  app.post("/api/integrations/rentmanager/sync", async (req: Request, res: Response) => {
    try {
      const { businessAccountId } = req.body;
      if (!businessAccountId) return res.status(400).json({ error: "Missing businessAccountId" });
      const conn = await getConnection(businessAccountId);
      if (!conn || conn.status === "disconnected") return res.status(400).json({ error: "Rent Manager not connected" });

      let total = 0;
      const results: Record<string, any> = {};

      const props = await rmFetch(conn, "/Properties");
      if (Array.isArray(props)) {
        for (const p of props) {
          await db.insert(pmProperties).values({
            portfolioId: businessAccountId, address: p.Name || p.Address || "", city: p.City, state: p.State, zip: p.Zip,
            units: p.UnitCount || 1, type: "single_family",
          }).onConflictDoNothing();
          total++;
        }
        results.properties = props.length;
      }

      const serviceIssues = await rmFetch(conn, "/ServiceIssues?filters=Status,eq,Open");
      if (Array.isArray(serviceIssues)) {
        for (const si of serviceIssues) {
          await db.insert(workOrders).values({
            unitId: si.UnitID?.toString() || "unknown",
            description: `[RentManager #${si.ServiceIssueID}] ${si.Description || si.Subject || ""}`,
            priority: si.Priority === 1 ? "emergency" : si.Priority === 2 ? "urgent" : "normal",
            status: "open", photos: [],
          }).onConflictDoNothing();
          total++;
        }
        results.workOrders = serviceIssues.length;
      }

      await db.insert(integrationSyncLogs).values({ connectionId: conn.id, platform: "rentmanager", action: "sync", status: "success", recordsProcessed: total, details: results });
      await db.update(integrationConnections).set({ lastSyncAt: new Date(), lastSyncResult: { status: "success", ...results } }).where(eq(integrationConnections.id, conn.id));
      res.json({ success: true, recordsProcessed: total, details: results });
    } catch (error: any) {
      res.status(500).json({ error: "Sync failed", details: error.message });
    }
  });

  app.post("/api/integrations/rentmanager/webhook", async (req: Request, res: Response) => {
    try {
      const { EventType, Data } = req.body;
      if (EventType?.includes("ServiceIssue") && Data) {
        await db.insert(workOrders).values({
          unitId: Data.UnitID?.toString() || "unknown",
          description: `[RentManager WH #${Data.ServiceIssueID}] ${Data.Description || ""}`,
          priority: "normal", status: "open", photos: [],
        }).onConflictDoNothing();
      }
      res.json({ received: true });
    } catch (error) {
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  app.get("/api/integrations/rentmanager/status", async (req: Request, res: Response) => {
    const bid = req.query.businessAccountId as string;
    if (!bid) return res.status(400).json({ error: "Missing businessAccountId" });
    const conn = await getConnection(bid);
    if (!conn) return res.json({ connected: false });
    res.json({ connected: conn.status === "active", status: conn.status, lastSyncAt: conn.lastSyncAt, lastSyncResult: conn.lastSyncResult });
  });

  // POST /api/integrations/rentmanager/sync-work-orders
  app.post("/api/integrations/rentmanager/sync-work-orders", async (req: Request, res: Response) => {
    try {
      const { businessAccountId, workOrders: incoming } = req.body;
      if (!businessAccountId) return res.status(400).json({ error: "Missing businessAccountId" });
      const mapped = (incoming || []).map((wo: any) => ({
        externalId: wo.ServiceManagerID || wo.id, description: wo.Comment || wo.description,
        priority: wo.Priority?.toLowerCase() || "normal", status: wo.Status || "open",
        unitAddress: wo.PropertyAddress || wo.address, createdAt: wo.DateCreated || new Date().toISOString(),
      }));
      res.json({ success: true, platform: "rentmanager", workOrdersProcessed: mapped.length, workOrders: mapped });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  // POST /api/integrations/rentmanager/sync-properties
  app.post("/api/integrations/rentmanager/sync-properties", async (req: Request, res: Response) => {
    try {
      const { businessAccountId, properties: incoming } = req.body;
      if (!businessAccountId) return res.status(400).json({ error: "Missing businessAccountId" });
      const mapped = (incoming || []).map((p: any) => ({
        externalId: p.PropertyID || p.id, address: p.Address || p.address,
        city: p.City || p.city, state: p.State || p.state,
        zip: p.Zip || p.zip, units: p.UnitCount || 1,
        type: p.PropertyType || "residential", mappedTo: "b2b_contract_properties",
      }));
      res.json({ success: true, platform: "rentmanager", propertiesProcessed: mapped.length, properties: mapped });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });
}
