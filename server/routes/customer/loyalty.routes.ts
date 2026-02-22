import type { Express } from "express";
import { requireAuth } from "../../auth-middleware";
import { storage } from "../../storage";
import { isAuthenticated } from "../../replit_integrations/auth";

export function registerLoyaltyRoutes(app: Express) {
  // GET /api/loyalty/status — loyalty program info (must be before /:userId)
  app.get("/api/loyalty/status", requireAuth, (_req, res) => {
    res.json({
      programName: "OpenClaw Rewards",
      tiers: ["bronze", "silver", "gold", "platinum"],
      pointsPerDollar: 1,
      active: true,
    });
  });

  // Get user's loyalty account status
  app.get("/api/loyalty/:userId", requireAuth, async (req, res) => {
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

      // For now, return a basic loyalty structure
      // TODO: Implement full loyalty program with points/rewards
      const loyaltyAccount = {
        userId,
        points: 0,
        tier: "bronze",
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
        availableRewards: [],
        history: [],
      });
    }
  });

  // Redeem a loyalty reward
  app.post("/api/loyalty/:userId/redeem", requireAuth, async (req: any, res) => {
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
  app.get("/api/loyalty/:userId/rewards", requireAuth, async (req, res) => {
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
