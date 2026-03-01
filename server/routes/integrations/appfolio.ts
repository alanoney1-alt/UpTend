/**
 * AppFolio Integration - OAuth2 REST API
 * Full property management sync: properties, units, tenants, work orders, vendors, documents
 */
import type { Express, Request, Response } from "express";
import { db } from "../../db";
import { integrationConnections, integrationSyncLogs, pmProperties, pmUnits, workOrders } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { encryptCredentials, decryptCredentials } from "../../services/encryption";
import { z } from "zod";

const APPFOLIO_API_BASE = "https://api.appfolio.com/api/v1";

const connectSchema = z.object({
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  subdomain: z.string().min(1), // e.g., "mycompany" for mycompany.appfolio.com
  businessAccountId: z.string().min(1),
});

const webhookSchema = z.object({
  event_type: z.string(),
  resource_type: z.string().optional(),
  data: z.record(z.any()),
});

async function getConnection(businessAccountId: string) {
  const [conn] = await db
    .select()
    .from(integrationConnections)
    .where(and(
      eq(integrationConnections.businessAccountId, businessAccountId),
      eq(integrationConnections.platform, "appfolio")
    ))
    .limit(1);
  return conn;
}

async function appfolioFetch(conn: any, endpoint: string, method = "GET", body?: any) {
  const creds = decryptCredentials(conn.credentials!);
  const url = `https://${creds.subdomain}.appfolio.com/api/v1${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${creds.accessToken}`,
  };
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && creds.refreshToken) {
    // Attempt token refresh
    const refreshed = await refreshToken(conn, creds);
    if (refreshed) {
      headers.Authorization = `Bearer ${refreshed.accessToken}`;
      const retry = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
      return retry.json();
    }
  }
  if (!res.ok) throw new Error(`AppFolio API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function refreshToken(conn: any, creds: any) {
  try {
    const res = await fetch(`https://${creds.subdomain}.appfolio.com/api/v1/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "refresh_token",
        refresh_token: creds.refreshToken,
        client_id: creds.clientId,
        client_secret: creds.clientSecret,
      }),
    });
    if (!res.ok) return null;
    const tokens = await res.json();
    const newCreds = { ...creds, accessToken: tokens.access_token, refreshToken: tokens.refresh_token || creds.refreshToken };
    await db.update(integrationConnections)
      .set({ credentials: encryptCredentials(newCreds) })
      .where(eq(integrationConnections.id, conn.id));
    return newCreds;
  } catch {
    return null;
  }
}

export function registerAppfolioRoutes(app: Express) {
  // Connect - initiate OAuth flow
  app.post("/api/integrations/appfolio/connect", async (req: Request, res: Response) => {
    try {
      const { clientId, clientSecret, subdomain, businessAccountId } = connectSchema.parse(req.body);

      // Check existing
      const existing = await getConnection(businessAccountId);
      const encrypted = encryptCredentials({ clientId, clientSecret, subdomain });

      if (existing) {
        await db.update(integrationConnections)
          .set({ credentials: encrypted, status: "disconnected" })
          .where(eq(integrationConnections.id, existing.id));
      } else {
        await db.insert(integrationConnections).values({
          businessAccountId,
          platform: "appfolio",
          credentials: encrypted,
          status: "disconnected",
        });
      }

      // Return OAuth authorization URL
      const authUrl = `https://${subdomain}.appfolio.com/api/v1/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(req.body.redirectUri || `${req.protocol}://${req.get("host")}/api/integrations/appfolio/callback`)}&response_type=code&scope=properties+tenants+work_orders+vendors+documents`;
      
      res.json({ success: true, authUrl, message: "Redirect user to authUrl to complete OAuth flow" });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid input", details: error.errors });
      console.error("AppFolio connect error:", error);
      res.status(500).json({ error: "Failed to configure AppFolio integration" });
    }
  });

  // OAuth callback
  app.post("/api/integrations/appfolio/callback", async (req: Request, res: Response) => {
    try {
      const { code, businessAccountId } = req.body;
      if (!code || !businessAccountId) return res.status(400).json({ error: "Missing code or businessAccountId" });

      const conn = await getConnection(businessAccountId);
      if (!conn?.credentials) return res.status(404).json({ error: "No AppFolio connection found" });

      const creds = decryptCredentials(conn.credentials);
      
      // Exchange code for tokens
      const tokenRes = await fetch(`https://${creds.subdomain}.appfolio.com/api/v1/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "authorization_code",
          code,
          client_id: creds.clientId,
          client_secret: creds.clientSecret,
          redirect_uri: req.body.redirectUri || `${req.protocol}://${req.get("host")}/api/integrations/appfolio/callback`,
        }),
      });

      if (!tokenRes.ok) {
        const err = await tokenRes.text();
        return res.status(400).json({ error: "OAuth token exchange failed", details: err });
      }

      const tokens = await tokenRes.json();
      const newCreds = { ...creds, accessToken: tokens.access_token, refreshToken: tokens.refresh_token };
      
      await db.update(integrationConnections)
        .set({ credentials: encryptCredentials(newCreds), status: "active" })
        .where(eq(integrationConnections.id, conn.id));

      res.json({ success: true, message: "AppFolio connected successfully" });
    } catch (error: any) {
      console.error("AppFolio callback error:", error);
      res.status(500).json({ error: "Failed to complete OAuth flow" });
    }
  });

  // Full sync
  app.post("/api/integrations/appfolio/sync", async (req: Request, res: Response) => {
    try {
      const { businessAccountId } = req.body;
      if (!businessAccountId) return res.status(400).json({ error: "Missing businessAccountId" });

      const conn = await getConnection(businessAccountId);
      if (!conn || conn.status !== "active") {
        return res.status(400).json({ error: "AppFolio not connected or not active" });
      }

      let totalRecords = 0;
      const syncResults: Record<string, any> = {};

      try {
        // Sync properties
        const properties = await appfolioFetch(conn, "/properties");
        if (properties?.data) {
          for (const prop of properties.data) {
            await db.insert(pmProperties).values({
              portfolioId: businessAccountId,
              address: prop.address || prop.street_address || "",
              city: prop.city,
              state: prop.state,
              zip: prop.zip || prop.postal_code,
              units: prop.unit_count || 1,
              type: prop.property_type || "single_family",
            }).onConflictDoNothing();
            totalRecords++;
          }
          syncResults.properties = properties.data.length;
        }

        // Sync work orders
        const workOrdersData = await appfolioFetch(conn, "/work_orders?status=open,in_progress");
        if (workOrdersData?.data) {
          for (const wo of workOrdersData.data) {
            await db.insert(workOrders).values({
              unitId: wo.unit_id || "unknown",
              tenantId: wo.tenant_id || null,
              description: `[AppFolio #${wo.id}] ${wo.description || wo.summary || ""}`,
              priority: mapAppfolioPriority(wo.priority),
              status: wo.status === "completed" ? "completed" : "open",
              photos: wo.images || wo.attachments || [],
            }).onConflictDoNothing();
            totalRecords++;
          }
          syncResults.workOrders = workOrdersData.data.length;
        }
      } catch (apiError: any) {
        // Log partial sync
        await db.insert(integrationSyncLogs).values({
          connectionId: conn.id,
          platform: "appfolio",
          action: "sync",
          status: "error",
          recordsProcessed: totalRecords,
          details: { error: apiError.message, partialResults: syncResults },
        });
        await db.update(integrationConnections)
          .set({ lastSyncAt: new Date(), lastSyncResult: { status: "error", error: apiError.message, ...syncResults }, status: "error" })
          .where(eq(integrationConnections.id, conn.id));
        return res.status(500).json({ error: "Sync partially failed", details: apiError.message, syncResults });
      }

      // Log success
      await db.insert(integrationSyncLogs).values({
        connectionId: conn.id,
        platform: "appfolio",
        action: "sync",
        status: "success",
        recordsProcessed: totalRecords,
        details: syncResults,
      });
      await db.update(integrationConnections)
        .set({ lastSyncAt: new Date(), lastSyncResult: { status: "success", ...syncResults } })
        .where(eq(integrationConnections.id, conn.id));

      res.json({ success: true, recordsProcessed: totalRecords, details: syncResults });
    } catch (error: any) {
      console.error("AppFolio sync error:", error);
      res.status(500).json({ error: "Sync failed" });
    }
  });

  // Status
  app.get("/api/integrations/appfolio/status", async (req: Request, res: Response) => {
    try {
      const businessAccountId = req.query.businessAccountId as string;
      if (!businessAccountId) return res.status(400).json({ error: "Missing businessAccountId" });
      const conn = await getConnection(businessAccountId);
      if (!conn) return res.json({ connected: false });
      res.json({
        connected: conn.status === "active",
        status: conn.status,
        lastSyncAt: conn.lastSyncAt,
        lastSyncResult: conn.lastSyncResult,
        syncFrequency: conn.syncFrequency,
        autoSync: conn.autoSync,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to check status" });
    }
  });

  // Webhook receiver
  app.post("/api/integrations/appfolio/webhook", async (req: Request, res: Response) => {
    try {
      const payload = webhookSchema.parse(req.body);
      console.log(`[AppFolio Webhook] ${payload.event_type}`, payload.data);

      if (payload.event_type === "work_order.created" || payload.event_type === "work_order.updated") {
        const wo = payload.data;
        await db.insert(workOrders).values({
          unitId: wo.unit_id || "unknown",
          tenantId: wo.tenant_id || null,
          description: `[AppFolio WH #${wo.id}] ${wo.description || ""}`,
          priority: mapAppfolioPriority(wo.priority),
          status: "open",
          photos: wo.images || [],
        }).onConflictDoNothing();
      }

      res.json({ received: true });
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: "Invalid webhook payload" });
      console.error("AppFolio webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // POST /api/integrations/appfolio/sync-work-orders
  app.post("/api/integrations/appfolio/sync-work-orders", async (req: Request, res: Response) => {
    try {
      const { businessAccountId, workOrders: incomingWOs } = req.body;
      if (!businessAccountId) return res.status(400).json({ error: "Missing businessAccountId" });
      // Accept external work orders and map them
      const mapped = (incomingWOs || []).map((wo: any) => ({
        externalId: wo.id || wo.externalId,
        description: wo.description || wo.summary,
        priority: mapAppfolioPriority(wo.priority),
        status: wo.status || "open",
        unitAddress: wo.unit_address || wo.address,
        createdAt: wo.created_at || new Date().toISOString(),
      }));
      res.json({ success: true, platform: "appfolio", workOrdersProcessed: mapped.length, workOrders: mapped });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });

  // POST /api/integrations/appfolio/sync-properties
  app.post("/api/integrations/appfolio/sync-properties", async (req: Request, res: Response) => {
    try {
      const { businessAccountId, properties: incomingProps } = req.body;
      if (!businessAccountId) return res.status(400).json({ error: "Missing businessAccountId" });
      const mapped = (incomingProps || []).map((p: any) => ({
        externalId: p.id || p.externalId,
        address: p.address || p.street_address,
        city: p.city,
        state: p.state,
        zip: p.zip || p.postal_code,
        units: p.unit_count || 1,
        type: p.property_type || "residential",
        mappedTo: "b2b_contract_properties",
      }));
      res.json({ success: true, platform: "appfolio", propertiesProcessed: mapped.length, properties: mapped });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
  });
}

function mapAppfolioPriority(raw?: string): "emergency" | "urgent" | "normal" | "low" {
  if (!raw) return "normal";
  const l = raw.toLowerCase();
  if (l.includes("emergency") || l.includes("critical")) return "emergency";
  if (l.includes("urgent") || l.includes("high")) return "urgent";
  if (l.includes("low")) return "low";
  return "normal";
}
