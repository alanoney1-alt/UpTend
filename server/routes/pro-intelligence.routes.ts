/**
 * Pro Intelligence Routes
 * Demand forecast, retention, analytics, goals, route optimization
 */

import { Router } from "express";
import type { Express } from "express";
import { requireAuth } from "../auth-middleware";
import { getDemandForecast, getCustomerRetention, getPerformanceAnalytics, getCompetitivePosition } from "../services/pro-intelligence.js";
import { setGoal, getGoalProgress, checkMilestones, getGoalHistory, suggestGoal } from "../services/pro-goals.js";
import { optimizeRoute, getRouteForDay, addJobToRoute, getWeeklyRouteSummary } from "../services/route-optimizer.js";

const router = Router();

// ─── Demand Forecast ─────────────────────────────────────────────
router.get("/api/pro/forecast/:proId", requireAuth, async (req, res) => {
  try {
    const { proId } = req.params;
    const zip = (req.query.zip as string) || "32801";
    const daysAhead = parseInt(req.query.days as string) || 7;
    const result = await getDemandForecast(proId, zip, daysAhead);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Customer Retention ──────────────────────────────────────────
router.get("/api/pro/retention/:proId", requireAuth, async (req, res) => {
  try {
    const result = await getCustomerRetention(req.params.proId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Performance Analytics (no required params) ──────────────────
router.get("/api/pro/analytics", requireAuth, async (req, res) => {
  try {
    const { proId, period = "weekly" } = req.query;
    if (!proId) {
      return res.json({ analytics: [], message: "Pass ?proId=<id>&period=weekly|monthly for detailed analytics" });
    }
    if (!["weekly", "monthly"].includes(period as string)) {
      return res.status(400).json({ error: "Period must be weekly or monthly" });
    }
    const result = await getPerformanceAnalytics(proId as string, period as "weekly" | "monthly");
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Performance Analytics ───────────────────────────────────────
router.get("/api/pro/analytics/:proId/:period", requireAuth, async (req, res) => {
  try {
    const period = req.params.period as "weekly" | "monthly";
    if (!["weekly", "monthly"].includes(period)) {
      return res.status(400).json({ error: "Period must be weekly or monthly" });
    }
    const result = await getPerformanceAnalytics(req.params.proId, period);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Competitive Position ────────────────────────────────────────
router.get("/api/pro/position/:proId", requireAuth, async (req, res) => {
  try {
    const zip = (req.query.zip as string) || "32801";
    const result = await getCompetitivePosition(req.params.proId, zip);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Goals ───────────────────────────────────────────────────────
router.post("/api/pro/goals", requireAuth, async (req, res) => {
  try {
    const { proId, goalType, targetAmount, startDate, endDate } = req.body;
    if (!proId || !goalType || !targetAmount || !startDate || !endDate) {
      return res.status(400).json({ error: "Missing required fields: proId, goalType, targetAmount, startDate, endDate" });
    }
    const result = await setGoal(proId, goalType, targetAmount, startDate, endDate);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/api/pro/goals/:proId", requireAuth, async (req, res) => {
  try {
    const result = await getGoalProgress(req.params.proId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/api/pro/goals/:proId/history", requireAuth, async (req, res) => {
  try {
    const result = await getGoalHistory(req.params.proId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/api/pro/goals/:proId/suggest", requireAuth, async (req, res) => {
  try {
    const result = await suggestGoal(req.params.proId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/pro/goals/:proId/milestones", requireAuth, async (req, res) => {
  try {
    const result = await checkMilestones(req.params.proId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Route Optimization ─────────────────────────────────────────
router.get("/api/pro/route/:proId/:date", requireAuth, async (req, res) => {
  try {
    const result = await getRouteForDay(req.params.proId, req.params.date);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/pro/route/:proId/optimize", requireAuth, async (req, res) => {
  try {
    const date = req.body.date || new Date().toISOString().split("T")[0];
    const result = await optimizeRoute(req.params.proId, date);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/api/pro/route/:proId/add-job", requireAuth, async (req, res) => {
  try {
    const { date, jobId } = req.body;
    if (!date || !jobId) return res.status(400).json({ error: "date and jobId required" });
    const result = await addJobToRoute(req.params.proId, date, jobId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/api/pro/route/:proId/weekly", requireAuth, async (req, res) => {
  try {
    const result = await getWeeklyRouteSummary(req.params.proId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export function registerProIntelligenceRoutes(app: Express) {
  app.use(router);
}
