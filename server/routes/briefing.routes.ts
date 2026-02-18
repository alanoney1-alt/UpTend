/**
 * Morning Briefing Routes
 */

import type { Express } from "express";
import { requireAuth } from "../auth-middleware";
import { generateMorningBriefing, getWeatherForZip } from "../services/morning-briefing";

export function registerBriefingRoutes(app: Express) {
  // Morning briefing
  app.get("/api/briefing/:customerId", requireAuth, async (req, res) => {
    try {
      const briefing = await generateMorningBriefing(req.params.customerId);
      res.json(briefing);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Weather data
  app.get("/api/weather/:zip", async (req, res) => {
    try {
      const weather = await getWeatherForZip(req.params.zip);
      res.json(weather);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
