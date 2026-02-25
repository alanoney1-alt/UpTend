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
      // Return sensible defaults so the dashboard doesn't crash
      res.json({
        feeRate: 0.15,
        feePercent: 15,
        tier: "Standard",
        activeCertCount: 0,
        isLlc: false,
        nextTierCertsNeeded: 0,
        nextTierRate: null,
        nextTierPercent: null,
        monthlySavings: 0,
        projectedNextTierSavings: 0,
        recentEarnings: 0,
        tiers: [
          { name: "Standard", minCerts: 0, rate: 0.15, percent: 15, isCurrent: true, isUnlocked: true },
        ],
      });
    }
  });
}
