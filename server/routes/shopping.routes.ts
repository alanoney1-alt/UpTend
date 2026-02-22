/**
 * Shopping Assistant + Tutorial Routes
 */

import type { Express, Request, Response } from "express";
import { requireAuth } from "../auth-middleware";
import { searchProduct, getProductRecommendation, compareProductPrices, getSmartRecommendations } from "../services/product-search.js";
import { findTutorial, getTutorialForMaintenance, getSeasonalDIYProjects } from "../services/tutorial-finder.js";
import { getShoppingList, startDIYProject, updateDIYProject, getProjectPlan } from "../services/shopping-assistant.js";
import { pool } from "../db";

export function registerShoppingRoutes(app: Express): void {
  // ── Shopping ───────────────────────────────

  // GET /api/shopping/recommendations/:customerId
  app.get("/api/shopping/recommendations/:customerId", requireAuth, async (req: Request, res: Response) => {
    try {
      const result = await getSmartRecommendations(req.params.customerId);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/shopping/search
  app.post("/api/shopping/search", requireAuth, async (req: Request, res: Response) => {
    try {
      const { query, category, specifications } = req.body;
      if (!query) return res.status(400).json({ error: "query required" });
      const result = await searchProduct(query, category, specifications);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/shopping/compare
  app.get("/api/shopping/compare", requireAuth, async (req: Request, res: Response) => {
    try {
      const product = req.query.product as string;
      const specs = req.query.specs ? JSON.parse(req.query.specs as string) : undefined;
      if (!product) return res.status(400).json({ error: "product required" });
      const result = await compareProductPrices(product, specs);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/shopping/list/:customerId
  app.get("/api/shopping/list/:customerId", requireAuth, async (req: Request, res: Response) => {
    try {
      const result = await getShoppingList(req.params.customerId);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/shopping/project
  app.post("/api/shopping/project", requireAuth, async (req: Request, res: Response) => {
    try {
      const { customerId, projectName, items, tutorials } = req.body;
      if (!customerId || !projectName) return res.status(400).json({ error: "customerId and projectName required" });
      const result = await startDIYProject(customerId, projectName, items || [], tutorials || []);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/shopping/projects/:customerId
  app.get("/api/shopping/projects/:customerId", requireAuth, async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT * FROM diy_projects WHERE customer_id = $1 ORDER BY created_at DESC`,
        [req.params.customerId]
      );
      res.json({ projects: result.rows });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Tutorials ──────────────────────────────

  // GET /api/tutorials/search?task=
  app.get("/api/tutorials/search", requireAuth, async (req: Request, res: Response) => {
    try {
      const task = req.query.task as string;
      if (!task) return res.status(400).json({ error: "task required" });
      const result = await findTutorial(task);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/tutorials/maintenance/:type
  app.get("/api/tutorials/maintenance/:type", requireAuth, async (req: Request, res: Response) => {
    try {
      const brand = req.query.brand as string | undefined;
      const model = req.query.model as string | undefined;
      const size = req.query.size as string | undefined;
      const result = await getTutorialForMaintenance(req.params.type, { brand, model, size });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/tutorials/seasonal/:month
  app.get("/api/tutorials/seasonal/:month", requireAuth, async (req: Request, res: Response) => {
    try {
      const month = parseInt(req.params.month);
      if (isNaN(month) || month < 1 || month > 12) return res.status(400).json({ error: "month must be 1-12" });
      const result = await getSeasonalDIYProjects(month);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
