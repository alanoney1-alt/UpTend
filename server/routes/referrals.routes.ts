import type { Express } from "express";
import { requireAuth } from "../auth-middleware";
import {
  generateReferralCode, trackReferral, getReferralStatus,
  createGroupDeal, joinGroupDeal, getNeighborhoodDeals,
} from "../services/referral-engine.js";

export function registerReferralEngineRoutes(app: Express) {
  app.post("/api/referrals/generate-code", requireAuth, async (req, res) => {
    try {
      const customerId = req.body.customerId || (req as any).user?.userId || (req as any).user?.id;
      if (!customerId) return res.status(400).json({ error: "customerId required" });
      const result = await generateReferralCode(customerId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/referrals/track", requireAuth, async (req, res) => {
    try {
      const { code, email } = req.body;
      const result = await trackReferral(code, email);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/referrals/:customerId", requireAuth, async (req, res) => {
    try {
      const result = await getReferralStatus(req.params.customerId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/referrals/group-deal", requireAuth, async (req, res) => {
    try {
      const { customerId, neighborhood, serviceType } = req.body;
      const result = await createGroupDeal(customerId, neighborhood, serviceType);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/referrals/group-deal/join", requireAuth, async (req, res) => {
    try {
      const { dealId, customerId } = req.body;
      const result = await joinGroupDeal(dealId, customerId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/referrals/deals/:zip", requireAuth, async (req, res) => {
    try {
      const deals = await getNeighborhoodDeals(req.params.zip);
      res.json({ deals });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
