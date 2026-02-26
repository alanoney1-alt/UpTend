/**
 * HOA Pricing Schedule API
 *
 * POST /api/business/hoa-pricing-schedule
 * Generates a complete pricing schedule for HOA/property management companies.
 */

import { Router, Request, Response } from "express";
import { generateHoaPricingSchedule } from "../../services/george-tools";

const router = Router();

router.post("/hoa-pricing-schedule", async (req: Request, res: Response) => {
  try {
    const { services, location } = req.body;

    if (!services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({
        success: false,
        error: "services array is required and must not be empty",
      });
    }

    if (!location || typeof location !== "string") {
      return res.status(400).json({
        success: false,
        error: "location is required",
      });
    }

    // Validate each service entry
    for (const svc of services) {
      if (!svc.service_type || typeof svc.service_type !== "string") {
        return res.status(400).json({
          success: false,
          error: "Each service must have a service_type string",
        });
      }
      if (!svc.frequency || typeof svc.frequency !== "string") {
        return res.status(400).json({
          success: false,
          error: "Each service must have a frequency string",
        });
      }
      if (!svc.unit_count || typeof svc.unit_count !== "number" || svc.unit_count < 1) {
        return res.status(400).json({
          success: false,
          error: "Each service must have a unit_count >= 1",
        });
      }
    }

    const result = await generateHoaPricingSchedule({ services, location });
    return res.json(result);
  } catch (err: any) {
    console.error("[HOA Pricing] Error:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error generating HOA pricing schedule",
    });
  }
});

export default router;
