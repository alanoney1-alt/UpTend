/**
 * PM Software Integration Webhook Receivers
 * 
 * These endpoints receive webhook pushes from property management software.
 * Each maps the incoming payload to UpTend's work_orders format.
 * 
 * Webhook URLs (give these to the PM software):
 *   POST https://your-domain.com/api/integrations/appfolio/sync
 *   POST https://your-domain.com/api/integrations/buildium/sync
 *   POST https://your-domain.com/api/integrations/yardi/sync
 *   GET  https://your-domain.com/api/integrations/status
 * 
 * Authentication: Include X-Integration-Key header with the configured secret.
 */

import type { Express } from "express";
import { db } from "../../db";
import { workOrders } from "@shared/schema";
import { z } from "zod";

// Shared work order mapping schema
const workOrderPayloadSchema = z.object({
  externalId: z.string().optional(),
  unitId: z.string().min(1),
  tenantId: z.string().optional(),
  description: z.string().min(1),
  priority: z.enum(["emergency", "urgent", "normal", "low"]).default("normal"),
  photos: z.array(z.string()).optional(),
});

// AppFolio webhook payload
const appfolioPayloadSchema = z.object({
  event_type: z.string(),
  work_order: z.object({
    id: z.string().or(z.number()).transform(String),
    unit_id: z.string(),
    tenant_id: z.string().optional(),
    description: z.string(),
    priority: z.string().optional(),
    images: z.array(z.string()).optional(),
  }),
});

// Buildium webhook payload
const buildiumPayloadSchema = z.object({
  EventType: z.string(),
  WorkOrder: z.object({
    Id: z.string().or(z.number()).transform(String),
    UnitId: z.string(),
    TenantId: z.string().optional(),
    Description: z.string(),
    Priority: z.string().optional(),
    Attachments: z.array(z.string()).optional(),
  }),
});

// Yardi webhook payload
const yardiPayloadSchema = z.object({
  type: z.string(),
  data: z.object({
    work_order_id: z.string().or(z.number()).transform(String),
    unit_code: z.string(),
    tenant_code: z.string().optional(),
    description: z.string(),
    priority_level: z.string().optional(),
    photo_urls: z.array(z.string()).optional(),
  }),
});

function mapPriority(raw?: string): "emergency" | "urgent" | "normal" | "low" {
  if (!raw) return "normal";
  const lower = raw.toLowerCase();
  if (lower.includes("emergency") || lower.includes("critical")) return "emergency";
  if (lower.includes("urgent") || lower.includes("high")) return "urgent";
  if (lower.includes("low")) return "low";
  return "normal";
}

function validateIntegrationKey(req: any, res: any, envKey: string): boolean {
  const secret = process.env[envKey];
  if (!secret) return true; // No key configured = allow (dev mode)
  const provided = req.headers["x-integration-key"];
  if (provided !== secret) {
    res.status(401).json({ error: "Invalid integration key" });
    return false;
  }
  return true;
}

export function registerIntegrationRoutes(app: Express) {
  // POST /api/integrations/appfolio/sync
  app.post("/api/integrations/appfolio/sync", async (req, res) => {
    if (!validateIntegrationKey(req, res, "APPFOLIO_WEBHOOK_SECRET")) return;
    try {
      const payload = appfolioPayloadSchema.parse(req.body);
      const wo = payload.work_order;

      const [record] = await db.insert(workOrders).values({
        unitId: wo.unit_id,
        tenantId: wo.tenant_id || null,
        description: `[AppFolio #${wo.id}] ${wo.description}`,
        priority: mapPriority(wo.priority),
        photos: wo.images || [],
        status: "open",
      }).returning();

      console.log(`[Integration] AppFolio work order synced: ${record.id}`);
      res.status(201).json({ success: true, workOrderId: record.id, source: "appfolio" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid AppFolio payload", details: error.errors });
      }
      console.error("AppFolio sync error:", error);
      res.status(500).json({ error: "Failed to process AppFolio webhook" });
    }
  });

  // POST /api/integrations/buildium/sync
  app.post("/api/integrations/buildium/sync", async (req, res) => {
    if (!validateIntegrationKey(req, res, "BUILDIUM_WEBHOOK_SECRET")) return;
    try {
      const payload = buildiumPayloadSchema.parse(req.body);
      const wo = payload.WorkOrder;

      const [record] = await db.insert(workOrders).values({
        unitId: wo.UnitId,
        tenantId: wo.TenantId || null,
        description: `[Buildium #${wo.Id}] ${wo.Description}`,
        priority: mapPriority(wo.Priority),
        photos: wo.Attachments || [],
        status: "open",
      }).returning();

      console.log(`[Integration] Buildium work order synced: ${record.id}`);
      res.status(201).json({ success: true, workOrderId: record.id, source: "buildium" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid Buildium payload", details: error.errors });
      }
      console.error("Buildium sync error:", error);
      res.status(500).json({ error: "Failed to process Buildium webhook" });
    }
  });

  // POST /api/integrations/yardi/sync
  app.post("/api/integrations/yardi/sync", async (req, res) => {
    if (!validateIntegrationKey(req, res, "YARDI_WEBHOOK_SECRET")) return;
    try {
      const payload = yardiPayloadSchema.parse(req.body);
      const wo = payload.data;

      const [record] = await db.insert(workOrders).values({
        unitId: wo.unit_code,
        tenantId: wo.tenant_code || null,
        description: `[Yardi #${wo.work_order_id}] ${wo.description}`,
        priority: mapPriority(wo.priority_level),
        photos: wo.photo_urls || [],
        status: "open",
      }).returning();

      console.log(`[Integration] Yardi work order synced: ${record.id}`);
      res.status(201).json({ success: true, workOrderId: record.id, source: "yardi" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid Yardi payload", details: error.errors });
      }
      console.error("Yardi sync error:", error);
      res.status(500).json({ error: "Failed to process Yardi webhook" });
    }
  });

  // GET /api/integrations/status
  app.get("/api/integrations/status", async (_req, res) => {
    res.json({
      integrations: {
        appfolio: {
          configured: !!process.env.APPFOLIO_WEBHOOK_SECRET,
          webhookUrl: "/api/integrations/appfolio/sync",
        },
        buildium: {
          configured: !!process.env.BUILDIUM_WEBHOOK_SECRET,
          webhookUrl: "/api/integrations/buildium/sync",
        },
        yardi: {
          configured: !!process.env.YARDI_WEBHOOK_SECRET,
          webhookUrl: "/api/integrations/yardi/sync",
        },
      },
    });
  });
}
