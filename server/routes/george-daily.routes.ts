/**
 * George Daily Engagement API Routes
 *
 * Endpoints for morning briefing, home dashboard, spending tracker,
 * Google Calendar integration, and more.
 *
 * All routes require authentication.
 */

import type { Express, Request, Response } from "express";
import { isAuthenticated } from "../replit_integrations/auth";
import { storage } from "../storage";
import {
  buildMorningBriefing,
  getSeasonalCountdown,
} from "../services/george-daily";
import {
  getCalendarAuthUrl,
  handleCalendarCallback,
  syncJobToCalendar,
  suggestBestTime,
} from "../services/george-calendar";
import * as tools from "../services/george-tools";

export function registerGeorgeDailyRoutes(app: Express): void {

  // ─────────────────────────────────────────────
  // GET /api/george/morning-briefing
  // Returns personalized morning briefing for the authenticated user
  // ─────────────────────────────────────────────
  app.get("/api/george/morning-briefing", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });

      const briefing = await buildMorningBriefing(userId, storage);
      return res.json({ success: true, briefing });
    } catch (err: any) {
      console.error("[George Daily] morning-briefing error:", err.message);
      return res.status(500).json({ error: "Failed to generate morning briefing" });
    }
  });

  // ─────────────────────────────────────────────
  // GET /api/george/home-dashboard
  // Returns full home dashboard: devices, jobs, spending, maintenance
  // ─────────────────────────────────────────────
  app.get("/api/george/home-dashboard", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });

      const dashboard = await tools.getHomeDashboard(userId, storage);
      return res.json({ success: true, dashboard });
    } catch (err: any) {
      console.error("[George Daily] home-dashboard error:", err.message);
      return res.status(500).json({ error: "Failed to load home dashboard" });
    }
  });

  // ─────────────────────────────────────────────
  // GET /api/george/spending/:period
  // Returns spending tracker (month/quarter/year)
  // ─────────────────────────────────────────────
  app.get("/api/george/spending/:period", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });

      const period = req.params.period;
      const validPeriods = ["month", "quarter", "year"];
      if (!validPeriods.includes(period)) {
        return res.status(400).json({ error: "Period must be month, quarter, or year" });
      }

      const spending = await tools.getSpendingTracker(userId, period, storage);
      return res.json({ success: true, spending });
    } catch (err: any) {
      console.error("[George Daily] spending error:", err.message);
      return res.status(500).json({ error: "Failed to load spending data" });
    }
  });

  // ─────────────────────────────────────────────
  // GET /api/george/seasonal-countdown
  // Returns countdown to key seasonal events (no auth required)
  // ─────────────────────────────────────────────
  app.get("/api/george/seasonal-countdown", async (_req: Request, res: Response) => {
    try {
      const countdown = getSeasonalCountdown();
      return res.json({ success: true, countdown });
    } catch (err: any) {
      console.error("[George Daily] seasonal-countdown error:", err.message);
      return res.status(500).json({ error: "Failed to get seasonal countdown" });
    }
  });

  // ─────────────────────────────────────────────
  // Google Calendar Integration
  // ─────────────────────────────────────────────

  // GET /api/calendar/auth-url — returns Google OAuth URL
  app.get("/api/calendar/auth-url", isAuthenticated, (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });

      const authUrl = getCalendarAuthUrl(userId);

      if (!authUrl) {
        return res.status(503).json({
          error: "Google Calendar integration not configured",
          message: "Set GOOGLE_CLIENT_ID in your environment variables",
        });
      }

      return res.json({ success: true, authUrl });
    } catch (err: any) {
      console.error("[Calendar] auth-url error:", err.message);
      return res.status(500).json({ error: "Failed to generate auth URL" });
    }
  });

  // GET /api/calendar/callback — handles OAuth callback
  app.get("/api/calendar/callback", async (req: Request, res: Response) => {
    try {
      const { code, state: userId, error: oauthError } = req.query as Record<string, string>;

      if (oauthError) {
        console.warn("[Calendar] OAuth error:", oauthError);
        return res.redirect("/?calendar=denied");
      }

      if (!code || !userId) {
        return res.status(400).json({ error: "Missing code or state" });
      }

      const result = await handleCalendarCallback(code, userId, storage);

      if (result.success) {
        return res.redirect("/?calendar=connected");
      } else {
        console.error("[Calendar] Callback failed:", result.error);
        return res.redirect("/?calendar=error");
      }
    } catch (err: any) {
      console.error("[Calendar] callback error:", err.message);
      return res.redirect("/?calendar=error");
    }
  });

  // POST /api/calendar/sync-job/:jobId — syncs a job to customer's calendar
  app.post("/api/calendar/sync-job/:jobId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });

      const { jobId } = req.params;
      const job = await storage.getServiceRequest?.(jobId);

      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Only allow syncing the user's own jobs
      if (job.customerId && job.customerId !== userId) {
        return res.status(403).json({ error: "Not authorized to sync this job" });
      }

      const result = await syncJobToCalendar(userId, job, storage);

      if (result.success) {
        return res.json({ success: true, eventId: result.eventId, message: "Job synced to Google Calendar" });
      } else {
        return res.status(400).json({ error: result.error || "Failed to sync to calendar" });
      }
    } catch (err: any) {
      console.error("[Calendar] sync-job error:", err.message);
      return res.status(500).json({ error: "Failed to sync job to calendar" });
    }
  });

  // GET /api/calendar/suggest/:serviceId — get best booking time suggestion
  app.get("/api/calendar/suggest/:serviceId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id || (req as any).user?.userId;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });

      const { serviceId } = req.params;
      const suggestion = await suggestBestTime(userId, serviceId, storage);
      return res.json({ success: true, suggestion });
    } catch (err: any) {
      console.error("[Calendar] suggest error:", err.message);
      return res.status(500).json({ error: "Failed to generate suggestion" });
    }
  });
}
