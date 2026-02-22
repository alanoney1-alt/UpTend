import type { Express } from "express";
import { requireAuth } from "../auth-middleware";
import {
  getNeighborhoodActivity, getLocalEvents, submitTip, voteTip, getNeighborhoodStats,
} from "../services/community-engine.js";

export function registerCommunityEngineRoutes(app: Express) {
  // GET /api/community/feed — general community feed (no zip required)
  app.get("/api/community/feed", async (req, res) => {
    try {
      const zip = (req.query.zip as string) || "00000";
      const limit = parseInt(req.query.limit as string) || 20;
      const data = await getNeighborhoodActivity(zip, limit);
      res.json({ feed: data });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

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

  app.post("/api/community/tips", requireAuth, async (req, res) => {
    try {
      const { customerId, zip: rawZip, zipCode, category, title, content } = req.body;
      const zip = rawZip || zipCode;
      const result = await submitTip(customerId, zip, category, title, content);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/community/tips/:id/vote", requireAuth, async (req, res) => {
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
