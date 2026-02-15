import type { Express, Request, Response } from "express";
import { requireAuth, requireHauler } from "../../auth-middleware";
import { calculatePlatformFee } from "../../services/fee-calculator";

export function registerFeeStatusRoutes(app: Express) {
  /**
   * GET /api/pro/fee-status
   * Returns the pro's current fee tier, rate, savings, and tier ladder.
   */
  app.get("/api/pro/fee-status", requireAuth, requireHauler, async (req: Request, res: Response) => {
    try {
      const proId = ((req.user as any).userId || (req.user as any).id);
      const feeStatus = await calculatePlatformFee(proId);
      res.json(feeStatus);
    } catch (error) {
      console.error("[Fee Status] Error:", error);
      res.status(500).json({ error: "Failed to get fee status" });
    }
  });
}
