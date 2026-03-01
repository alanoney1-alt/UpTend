/**
 * Buildium Integration - REST API with API Key auth
 */
import type { Express, Request, Response } from "express";
import { db } from "../../db";
import { integrationConnections, integrationSyncLogs, pmProperties, pmUnits, workOrders } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { encryptCredentials, decryptCredentials } from "../../services/encryption";
import { z } from "zod";

const connectSchema = z.object({
  apiKey: z.string().min(1),
  apiSecret: z.string().min(1),
  businessAccountId: z.string().min(1),
});

async function getConnection(businessAccountId: string) {
  const [conn] = await db.select().from(integrationConnections)
    .where(and(eq(integrationConnections.businessAccountId, businessAccountId), eq(integrationConnections.platform, "buildium")))
    .limit(1);
  return conn;
}

async function buildiumFetch(conn: any, endpoint: string) {
  const creds = decryptCredentials(conn.credentials!);
  const auth = Buffer.from(`${creds.apiKey}:${creds.apiSecret}`).toString("base64");
  const res = await fetch(`https://apm.buildium.com/api/v1${endpoint}`, {
    headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Buildium API ${res.status}: ${await res.text()}`);
  return res.json();
}

export function registerBuildiumRoutes(app: Express) {
  app.post("/api/integrations/buildium/connect", async (req: Request, res: Response) => {
    try {
      const { apiKey, apiSecret, businessAccountId } = connectSchema.parse(req.body);
      const existing = await getConnection(businessAccountId);
      const encrypted = encryptCredentials({ apiKey, apiSecret });

      if (existing) {
        await db.update(integrationConnections).set({ credentials: encrypted, status: "active" }).where(eq(integrationConnections.id, existing.id));
      } else {
        await db.insert(integrationConnections).values({ businessAccountId, platform: "buildium", credentials: encrypted, status: "active" });
      }

      // Test connection
      try {
        const testConn = existing || (await getConnection(businessAccountId))!;
        await buildiumFetch({ ...testConn, credentials: encrypted }, "/properties?limit=1");
        res.json({ success: true, message: "Buildium connected and verified" });
      } catch {
        await db.update(integrationConnections).set({ status: "error" })
          .where(and(eq(integrationConnections.businessAccountId, businessAccountId), eq(integrationConnections.platform, "buildium")));
        res.json({ success: true, message: "Credentials saved but API test failed. Please verify your API key." });
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: error.errors });
      res.status(500).json({ error: "Failed to configure Buildium integration" });
    }
  });

  app.post("/api/integrations/buildium/sync", async (req: Request, res: Response) => {
    try {
      const { businessAccountId } = req.body;
      if (!businessAccountId) return res.status(400).json({ error: "Missing businessAccountId" });
      const conn = await getConnection(businessAccountId);
      if (!conn || conn.status === "disconnected") return res.status(400).json({ error: "Buildium not connected" });

      let totalRecords = 0;
      const syncResults: Record<string, any> = {};

      // Sync properties
      const props = await buildiumFetch(conn, "/properties?limit=200");
      if (Array.isArray(props)) {
        for (const p of props) {
          await db.insert(pmProperties).values({
            portfolioId: businessAccountId,
            address: p.Address?.AddressLine1 || p.Name || "",
            city: p.Address?.City,
            state: p.Address?.State,
            zip: p.Address?.PostalCode,
            units: p.NumberOfUnits || 1,
            type: p.Type === "MultiFamilyBuilding" ? "multi_family" : "single_family",
          }).onConflictDoNothing();
          totalRecords++;
        }
        syncResults.properties = props.length;
      }

      // Sync work orders (tasks in Buildium)
      const tasks = await buildiumFetch(conn, "/tasks?limit=200&status=New,InProgress");
      if (Array.isArray(tasks)) {
        for (const t of tasks) {
          await db.insert(workOrders).values({
            unitId: t.UnitId?.toString() || "unknown",
            tenantId: t.TenantId?.toString() || null,
            description: `[Buildium #${t.Id}] ${t.Title || ""}: ${t.Description || ""}`,
            priority: t.Priority === "High" ? "urgent" : t.Priority === "Low" ? "low" : "normal",
            status: "open",
            photos: [],
          }).onConflictDoNothing();
          totalRecords++;
        }
        syncResults.workOrders = tasks.length;
      }

      await db.insert(integrationSyncLogs).values({ connectionId: conn.id, platform: "buildium", action: "sync", status: "success", recordsProcessed: totalRecords, details: syncResults });
      await db.update(integrationConnections).set({ lastSyncAt: new Date(), lastSyncResult: { status: "success", ...syncResults } }).where(eq(integrationConnections.id, conn.id));

      res.json({ success: true, recordsProcessed: totalRecords, details: syncResults });
    } catch (error: any) {
      console.error("Buildium sync error:", error);
      res.status(500).json({ error: "Sync failed", details: error.message });
    }
  });

  app.post("/api/integrations/buildium/webhook", async (req: Request, res: Response) => {
    try {
      const { EventType, WorkOrder } = req.body;
      if (EventType && WorkOrder) {
        await db.insert(workOrders).values({
          unitId: WorkOrder.UnitId?.toString() || "unknown",
          tenantId: WorkOrder.TenantId?.toString() || null,
          description: `[Buildium WH #${WorkOrder.Id}] ${WorkOrder.Description || ""}`,
          priority: WorkOrder.Priority === "High" ? "urgent" : "normal",
          status: "open",
          photos: WorkOrder.Attachments || [],
        }).onConflictDoNothing();
      }
      res.json({ received: true });
    } catch (error) {
      console.error("Buildium webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  app.get("/api/integrations/buildium/status", async (req: Request, res: Response) => {
    const businessAccountId = req.query.businessAccountId as string;
    if (!businessAccountId) return res.status(400).json({ error: "Missing businessAccountId" });
    const conn = await getConnection(businessAccountId);
    if (!conn) return res.json({ connected: false });
    res.json({ connected: conn.status === "active", status: conn.status, lastSyncAt: conn.lastSyncAt, lastSyncResult: conn.lastSyncResult });
  });

  // POST /api/integrations/buildium/sync-work-orders
  app.post("/api/integrations/buildium/sync-work-orders", async (req: Request, res: Response) => {
    try {
      const { businessAccountId, workOrders: incoming } = req.body;
      if (!businessAccountId) return res.status(400).json({ error: "Missing businessAccountId" });
      const mapped = (incoming || []).map((wo: any) => ({
        externalId: wo.Id || wo.id, description: wo.Title || wo.description,
        priority: wo.Priority?.toLowerCase() || "normal", status: wo.Status || "open",
        unitAddress: wo.PropertyAddress || wo.address, createdAt: wo.CreatedDateTime || new Date().toISOString(),
      }));
      res.json({ success: true, platform: "buildium", workOrdersProcessed: mapped.length, workOrders: mapped });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  // POST /api/integrations/buildium/sync-properties
  app.post("/api/integrations/buildium/sync-properties", async (req: Request, res: Response) => {
    try {
      const { businessAccountId, properties: incoming } = req.body;
      if (!businessAccountId) return res.status(400).json({ error: "Missing businessAccountId" });
      const mapped = (incoming || []).map((p: any) => ({
        externalId: p.Id || p.id, address: p.Address?.AddressLine1 || p.address,
        city: p.Address?.City || p.city, state: p.Address?.State || p.state,
        zip: p.Address?.PostalCode || p.zip, units: p.NumberOfUnits || 1,
        type: p.Type || "residential", mappedTo: "b2b_contract_properties",
      }));
      res.json({ success: true, platform: "buildium", propertiesProcessed: mapped.length, properties: mapped });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });
}
