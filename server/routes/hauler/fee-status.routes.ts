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
        feeRate: 0.25,
        feePercent: 25,
        tier: "Standard",
        activeCertCount: 0,
        isLlc: false,
        nextTierCertsNeeded: 2,
        nextTierRate: 0.23,
        nextTierPercent: 23,
        monthlySavings: 0,
        projectedNextTierSavings: 0,
        recentEarnings: 0,
        tiers: [
          { name: "Standard", minCerts: 0, rate: 0.25, percent: 25, isCurrent: true, isUnlocked: true },
          { name: "Certified", minCerts: 2, rate: 0.23, percent: 23, isCurrent: false, isUnlocked: false },
          { name: "Advanced", minCerts: 4, rate: 0.21, percent: 21, isCurrent: false, isUnlocked: false },
          { name: "Elite", minCerts: 6, rate: 0.20, percent: 20, isCurrent: false, isUnlocked: false },
        ],
      });
    }
  });
}
