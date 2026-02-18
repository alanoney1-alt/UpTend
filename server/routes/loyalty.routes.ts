import type { Express } from "express";
import { getCustomerLoyalty, getAvailableRewards, redeemReward, calculateDiscount } from "../services/loyalty-engine.js";

export function registerLoyaltyEngineRoutes(app: Express) {
  app.get("/api/loyalty/:customerId", async (req, res) => {
    try {
      const data = await getCustomerLoyalty(req.params.customerId);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/loyalty/rewards/:customerId", async (req, res) => {
    try {
      const rewards = await getAvailableRewards(req.params.customerId);
      res.json({ rewards });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/loyalty/redeem", async (req, res) => {
    try {
      const { rewardId } = req.body;
      const result = await redeemReward(rewardId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/loyalty/calculate-discount", async (req, res) => {
    try {
      const { customerId, serviceType, basePrice } = req.body;
      const result = await calculateDiscount(customerId, serviceType, basePrice);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
