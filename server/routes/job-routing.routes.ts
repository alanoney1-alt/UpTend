/**
 * Job Routing Cascade — API Routes
 *
 * POST /api/jobs/:jobId/offer       — Initiate cascade
 * POST /api/jobs/:jobId/respond     — Pro accepts/declines
 * GET  /api/jobs/:jobId/offer-status — Check cascade status
 */

import type { Express, Request, Response } from "express";
import {
  initiateJobOffer,
  handleProResponse,
  getCascadeStatus,
  escalateOffer,
} from "../services/job-routing-cascade";

export function registerJobRoutingRoutes(app: Express): void {
  // Initiate job offer cascade
  app.post("/api/jobs/:jobId/offer", async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const state = await initiateJobOffer(jobId);
      res.json({ success: true, cascade: state });
    } catch (err: any) {
      console.error("[JobRouting] initiate error:", err.message);
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Pro responds to offer (accept/decline)
  app.post("/api/jobs/:jobId/respond", async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const { proId, accepted } = req.body;

      if (!proId || typeof accepted !== "boolean") {
        return res.status(400).json({
          success: false,
          error: "Missing proId or accepted (boolean) in body",
        });
      }

      const state = await handleProResponse(jobId, proId, accepted);
      res.json({ success: true, cascade: state });
    } catch (err: any) {
      console.error("[JobRouting] respond error:", err.message);
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // Check cascade status
  app.get("/api/jobs/:jobId/offer-status", async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const state = getCascadeStatus(jobId);

      if (!state) {
        return res.status(404).json({
          success: false,
          error: "No cascade found for this job",
        });
      }

      res.json({ success: true, cascade: state });
    } catch (err: any) {
      console.error("[JobRouting] status error:", err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Manual escalation (admin)
  app.post("/api/jobs/:jobId/escalate", async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const { tier } = req.body;

      if (![1, 2, 3, 4].includes(tier)) {
        return res.status(400).json({
          success: false,
          error: "tier must be 1, 2, 3, or 4",
        });
      }

      const state = await escalateOffer(jobId, tier);
      res.json({ success: true, cascade: state });
    } catch (err: any) {
      console.error("[JobRouting] escalate error:", err.message);
      res.status(400).json({ success: false, error: err.message });
    }
  });
}
