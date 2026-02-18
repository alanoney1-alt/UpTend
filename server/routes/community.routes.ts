import type { Express } from "express";
import {
  getNeighborhoodActivity, getLocalEvents, submitTip, voteTip, getNeighborhoodStats,
} from "../services/community-engine.js";

export function registerCommunityEngineRoutes(app: Express) {
  app.get("/api/community/activity/:zip", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const data = await getNeighborhoodActivity(req.params.zip, limit);
      res.json({ activity: data });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/community/events/:zip", async (req, res) => {
    try {
      const { startDate, endDate } = req.query as any;
      const events = await getLocalEvents(req.params.zip, startDate, endDate);
      res.json({ events });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/community/tips", async (req, res) => {
    try {
      const { customerId, zip, category, title, content } = req.body;
      const result = await submitTip(customerId, zip, category, title, content);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/community/tips/:id/vote", async (req, res) => {
    try {
      const { userId, direction } = req.body;
      const result = await voteTip(req.params.id, userId, direction);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/community/stats/:zip", async (req, res) => {
    try {
      const stats = await getNeighborhoodStats(req.params.zip);
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
