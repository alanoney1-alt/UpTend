/**
 * Admin Routes for Subscription Auto-Booking Cron
 *
 * Endpoints for managing and testing the auto-booking cron job
 */

import type { Express, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import { processSubscriptionAutoBookings, triggerManualAutoBooking } from "../../jobs/subscription-auto-booking";

export function registerSubscriptionCronRoutes(app: Express) {
  /**
   * Manual trigger for auto-booking cron job
   * POST /api/admin/subscriptions/trigger-auto-booking
   *
   * Requires admin authentication
   * Use for testing or manual execution
   */
  app.post("/api/admin/subscriptions/trigger-auto-booking", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {

      console.log("[Admin] Manual auto-booking triggered");
      const result = await triggerManualAutoBooking();

      res.json({
        success: true,
        message: "Auto-booking job executed",
        result: {
          successCount: result.successCount,
          failureCount: result.failureCount,
          errors: result.errors,
        },
      });
    } catch (error) {
      console.error("[Admin] Auto-booking trigger failed:", error);
      res.status(500).json({
        success: false,
        error: "Failed to execute auto-booking job",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * Get subscription auto-booking schedule info
   * GET /api/admin/subscriptions/auto-booking-status
   */
  app.get("/api/admin/subscriptions/auto-booking-status", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      res.json({
        cronSchedule: "Daily at 1:00 AM",
        nextRun: "1:00 AM tomorrow",
        manualTriggerAvailable: true,
        testDate: today,
      });
    } catch (error) {
      console.error("[Admin] Failed to get cron status:", error);
      res.status(500).json({ error: "Failed to retrieve status" });
    }
  });
}
