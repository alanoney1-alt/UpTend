import type { Express } from "express";
import { requireAuth } from "../../auth-middleware";
import { db } from "../../db";
import { eq } from "drizzle-orm";
import {
  whiteLabelConfigs,
  b2bAuditLogs,
  customReports,
  digitalSignatures,
  assetRegistry,
  contractPricing,
  vendorScorecards,
  b2bInvoices as invoices,
} from "@shared/schema";

function registerCrud(
  app: Express,
  basePath: string,
  table: any,
  entityName: string,
  opts?: { ownerField?: string; immutable?: boolean }
) {
  const ownerField = opts?.ownerField;
  const immutable = opts?.immutable || false;

  app.get(basePath, requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const rows = ownerField
        ? await db.select().from(table).where(eq(table[ownerField], userId))
        : await db.select().from(table);
      res.json(rows);
    } catch (error) {
      console.error(`Error fetching ${entityName}:`, error);
      res.status(500).json({ error: `Failed to fetch ${entityName}` });
    }
  });

  app.get(`${basePath}/:id`, requireAuth, async (req, res) => {
    try {
      const [row] = await db.select().from(table).where(eq(table.id, req.params.id));
      if (!row) return res.status(404).json({ error: `${entityName} not found` });
      res.json(row);
    } catch (error) {
      console.error(`Error fetching ${entityName}:`, error);
      res.status(500).json({ error: `Failed to fetch ${entityName}` });
    }
  });

  app.post(basePath, requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const values = ownerField ? { ...req.body, [ownerField]: userId } : req.body;
      const [created] = await db.insert(table).values(values).returning();
      res.status(201).json(created);
    } catch (error) {
      console.error(`Error creating ${entityName}:`, error);
      res.status(500).json({ error: `Failed to create ${entityName}` });
    }
  });

  if (!immutable) {
    app.put(`${basePath}/:id`, requireAuth, async (req, res) => {
      try {
        const [updated] = await db.update(table)
          .set({ ...req.body, updatedAt: new Date().toISOString() })
          .where(eq(table.id, req.params.id))
          .returning();
        if (!updated) return res.status(404).json({ error: `${entityName} not found` });
        res.json(updated);
      } catch (error) {
        console.error(`Error updating ${entityName}:`, error);
        res.status(500).json({ error: `Failed to update ${entityName}` });
      }
    });

    app.delete(`${basePath}/:id`, requireAuth, async (req, res) => {
      try {
        const [deleted] = await db.delete(table).where(eq(table.id, req.params.id)).returning();
        if (!deleted) return res.status(404).json({ error: `${entityName} not found` });
        res.json({ success: true });
      } catch (error) {
        console.error(`Error deleting ${entityName}:`, error);
        res.status(500).json({ error: `Failed to delete ${entityName}` });
      }
    });
  }
}

export function registerEnterpriseRoutes(app: Express) {
  registerCrud(app, "/api/enterprise/white-label", whiteLabelConfigs, "white label config", { ownerField: "clientId" });
  registerCrud(app, "/api/enterprise/audit-logs", b2bAuditLogs, "audit log", { ownerField: "actorId", immutable: true });
  registerCrud(app, "/api/enterprise/custom-reports", customReports, "custom report", { ownerField: "clientId" });
  registerCrud(app, "/api/enterprise/digital-signatures", digitalSignatures, "digital signature", { immutable: true });
  registerCrud(app, "/api/enterprise/asset-registry", assetRegistry, "asset");
  registerCrud(app, "/api/enterprise/contract-pricing", contractPricing, "contract pricing", { ownerField: "clientId" });
  registerCrud(app, "/api/enterprise/vendor-scorecards", vendorScorecards, "vendor scorecard");
  registerCrud(app, "/api/enterprise/invoices", invoices, "invoice", { ownerField: "clientId" });
}
