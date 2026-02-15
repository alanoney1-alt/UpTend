import type { Express } from "express";
import { requireAuth } from "../../auth-middleware";
import { db } from "../../db";
import { eq } from "drizzle-orm";
import {
  punchLists,
  punchListItems,
  lienWaivers,
  permits,
} from "@shared/schema";

function registerCrud(
  app: Express,
  basePath: string,
  table: any,
  entityName: string,
  opts?: { ownerField?: string }
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
      const userId = ((req.user as any).userId || (req.user as any).id);
      const values = ownerField ? { ...req.body, [ownerField]: userId } : { ...req.body, createdBy: userId };
      const [created] = await db.insert(table).values(values).returning();
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

export function registerConstructionRoutes(app: Express) {
  registerCrud(app, "/api/construction/punch-lists", punchLists, "punch list", { ownerField: "createdBy" });
  registerCrud(app, "/api/construction/punch-list-items", punchListItems, "punch list item");
  registerCrud(app, "/api/construction/lien-waivers", lienWaivers, "lien waiver");
  registerCrud(app, "/api/construction/permits", permits, "permit");
}
