import type { Express } from "express";
import { requireAuth } from "../auth-middleware";
import { calculateProScore, updateAllProScores, getProScore, getLeaderboard } from "../services/pro-performance-scoring";

export function registerProPerformanceRoutes(app: Express) {
  // Get pro's performance score
  app.get("/api/pro/:proId/performance", requireAuth, async (req, res) => {
    try {
      const score = await getProScore(req.params.proId);
      if (!score) {
        // Try calculating on the fly
        const calculated = await calculateProScore(req.params.proId);
        if (!calculated) return res.status(404).json({ error: "No data found for this pro" });
        return res.json(calculated);
      }
      res.json(score);
    } catch (e: any) {
      console.error("[ProPerformance] Error:", e.message);
      res.status(500).json({ error: "Failed to fetch performance data" });
    }
  });

  // Admin: batch recalculate all scores
  app.post("/api/admin/recalculate-scores", requireAuth, async (_req, res) => {
    try {
      const results = await updateAllProScores();
      res.json({ success: true, updated: results.length });
    } catch (e: any) {
      console.error("[ProPerformance] Recalculate error:", e.message);
      res.status(500).json({ error: "Failed to recalculate scores" });
    }
  });

  // Admin: leaderboard
  app.get("/api/admin/pro-leaderboard", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const leaderboard = await getLeaderboard(limit);
      res.json(leaderboard);
    } catch (e: any) {
      console.error("[ProPerformance] Leaderboard error:", e.message);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });
}
