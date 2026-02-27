/**
 * Background Check Routes
 * 
 * Endpoints for Checkr background check integration and manual approval.
 */

import type { Express } from "express";
import { backgroundCheckService } from "../services/background-check-service";

export function registerBackgroundCheckRoutes(app: Express): void {
  /**
   * POST /api/background-check/initiate
   * Start a background check for a pro
   */
  app.post("/api/background-check/initiate", async (req, res) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { proId, firstName, lastName, email, dob, ssn_last4 } = req.body;

      if (!proId || !firstName || !lastName || !email) {
        return res.status(400).json({ error: "proId, firstName, lastName, and email are required" });
      }

      const result = await backgroundCheckService.initiateCheck({
        proId,
        firstName,
        lastName,
        email,
        dob,
        ssn_last4,
      });

      return res.json(result);
    } catch (error: any) {
      console.error("[BackgroundCheck] Initiate error:", error);
      return res.status(500).json({ error: "Failed to initiate background check" });
    }
  });

  /**
   * GET /api/background-check/status/:proId
   * Get background check status for a pro
   */
  app.get("/api/background-check/status/:proId", async (req, res) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { proId } = req.params;
      const status = await backgroundCheckService.getCheckStatus(proId);

      if (!status) {
        return res.json({ status: "not_started", proId });
      }

      return res.json(status);
    } catch (error: any) {
      console.error("[BackgroundCheck] Status error:", error);
      return res.status(500).json({ error: "Failed to get background check status" });
    }
  });

  /**
   * POST /api/background-check/webhook
   * Checkr webhook endpoint (public - no auth required)
   */
  app.post("/api/background-check/webhook", async (req, res) => {
    try {
      const result = await backgroundCheckService.handleWebhook(req.body);
      return res.json(result);
    } catch (error: any) {
      console.error("[BackgroundCheck] Webhook error:", error);
      return res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  /**
   * POST /api/background-check/manual-approve/:proId
   * Admin manual approval
   */
  app.post("/api/background-check/manual-approve/:proId", async (req, res) => {
    try {
      if (!req.isAuthenticated?.()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Check admin role
      const user = req.user as any;
      if (user?.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const { proId } = req.params;
      const { notes } = req.body || {};

      const result = await backgroundCheckService.manualApprove(proId, notes);
      return res.json(result);
    } catch (error: any) {
      console.error("[BackgroundCheck] Manual approve error:", error);
      return res.status(500).json({ error: "Failed to manually approve" });
    }
  });
}
