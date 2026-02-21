import type { Express, Request, Response, NextFunction } from "express";
import { requireAuth } from "../../auth-middleware";
import { db } from "../../db";
import { eq, sql } from "drizzle-orm";
import {
  pmPortfolios,
  pmProperties,
  pmUnits,
  workOrders,
  turnoverChecklists,
  slaConfigs,
  slaTracking,
  businessAccounts,
  hoaProperties,
} from "@shared/schema";

function registerCrud(
  app: Express,
  basePath: string,
  table: any,
  entityName: string,
  opts?: { ownerField?: string; beforeCreate?: (req: Request, res: Response) => Promise<boolean> }
) {
  const ownerField = opts?.ownerField;

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
      if (opts?.beforeCreate) {
        const allowed = await opts.beforeCreate(req, res);
        if (!allowed) return; // response already sent
      }
      const userId = ((req.user as any).userId || (req.user as any).id);
      const values = ownerField ? { ...req.body, [ownerField]: userId } : req.body;
      const result = await db.insert(table).values(values).returning();
      const created = (result as any[])[0];
      res.status(201).json(created);
    } catch (error) {
      console.error(`Error creating ${entityName}:`, error);
      res.status(500).json({ error: `Failed to create ${entityName}` });
    }
  });

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

async function checkPropertyLimit(req: Request, res: Response): Promise<boolean> {
  try {
    const userId = ((req.user as any).userId || (req.user as any).id);
    const [account] = await db.select().from(businessAccounts).where(eq(businessAccounts.userId, userId));
    if (account?.volumeDiscountTier === "independent") {
      const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(hoaProperties).where(eq(hoaProperties.businessAccountId, account.id));
      if (Number(count) >= 10) {
        res.status(403).json({
          error: "Property limit reached. The Independent plan supports up to 10 properties. Upgrade to add more.",
          propertyLimit: 10,
          currentCount: Number(count),
        });
        return false;
      }
    }
  } catch (_e) {
    // Non-fatal — allow through
  }
  return true;
}

export function registerPmRoutes(app: Express) {
  registerCrud(app, "/api/pm/portfolios", pmPortfolios, "portfolio", { ownerField: "ownerId" });
  registerCrud(app, "/api/pm/properties", pmProperties, "property", { ownerField: "ownerId", beforeCreate: checkPropertyLimit });
  registerCrud(app, "/api/pm/units", pmUnits, "unit");
  registerCrud(app, "/api/pm/work-orders", workOrders, "work order");
  registerCrud(app, "/api/pm/turnovers", turnoverChecklists, "turnover checklist");
  registerCrud(app, "/api/pm/sla-configs", slaConfigs, "SLA config");
  registerCrud(app, "/api/pm/sla-tracking", slaTracking, "SLA tracking");
}
