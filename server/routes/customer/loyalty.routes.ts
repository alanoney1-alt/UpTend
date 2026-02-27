import type { Express } from "express";
import { storage } from "../../storage";
import { isAuthenticated } from "../../replit_integrations/auth";
import { calculateTenureBonus } from "../../services/loyalty-engine.js";
import { LOYALTY_TIER_CONFIG } from "@shared/schema";

export function registerLoyaltyRoutes(app: Express) {
  // GET /api/loyalty/status - loyalty program info (must be before /:userId)
  app.get("/api/loyalty/status", (_req, res) => {
    res.json({
      programName: "OpenClaw Rewards",
      tiers: ["bronze", "silver", "gold", "platinum"],
      pointsPerDollar: 1,
      active: true,
    });
  });

  // Get user's loyalty account status
  app.get("/api/loyalty/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      if (!userId || userId === "undefined") {
        return res.status(400).json({ error: "Valid user ID is required" });
      }

      // Get user to check if they exist
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Calculate tenure bonus
      const tenure = await calculateTenureBonus(userId);

      // Base points (from loyalty account if exists, otherwise 0)
      const basePoints = 0; // TODO: pull from real loyalty account
      const baseLifetimePoints = 0;

      const totalLifetimePoints = baseLifetimePoints + tenure.bonusPoints;

      // Determine tier based on combined total
      let tier = "bronze";
      for (const [t, config] of Object.entries(LOYALTY_TIER_CONFIG).reverse()) {
        if (totalLifetimePoints >= config.minPoints) {
          tier = t;
          break;
        }
      }

      const loyaltyAccount = {
        userId,
        points: basePoints + tenure.bonusPoints,
        tier,
        lifetimePoints: totalLifetimePoints,
        tenureMonths: tenure.months,
        tenureBonusPoints: tenure.bonusPoints,
        memberSince: tenure.memberSince,
        availableRewards: [],
        history: [],
      };

      res.json(loyaltyAccount);
    } catch (error: any) {
      console.error("Get loyalty account error:", error);
      // Return default loyalty data on error
      res.json({
        userId: req.params.userId,
        points: 0,
        tier: "bronze",
        lifetimePoints: 0,
        tenureMonths: 0,
        tenureBonusPoints: 0,
        memberSince: null,
        availableRewards: [],
        history: [],
      });
    }
  });

  // Redeem a loyalty reward
  app.post("/api/loyalty/:userId/redeem", isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { rewardId } = req.body;

      // Verify authenticated user matches the userId
      const authUserId = (req.user as any).userId || (req.user as any).id;
      if (authUserId !== userId) {
        return res.status(403).json({ error: "Not authorized to redeem rewards for this user" });
      }

      if (!rewardId) {
        return res.status(400).json({ error: "Reward ID is required" });
      }

      // TODO: Implement reward redemption logic
      // For now, return a placeholder response
      res.json({
        success: true,
        message: "Loyalty rewards system is being implemented",
        rewardId,
      });
    } catch (error) {
      console.error("Redeem reward error:", error);
      res.status(500).json({ error: "Failed to redeem reward" });
    }
  });

  // Get available rewards for user
  app.get("/api/loyalty/:userId/rewards", async (req, res) => {
    try {
      const { userId } = req.params;

      if (!userId || userId === "undefined") {
        return res.status(400).json({ error: "Valid user ID is required" });
      }

      // Get user to check if they exist
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // TODO: Implement rewards catalog
      // For now, return empty array
      res.json({
        rewards: [],
        userPoints: 0,
      });
    } catch (error) {
      console.error("Get rewards error:", error);
      res.status(500).json({ error: "Failed to get rewards" });
    }
  });
}
