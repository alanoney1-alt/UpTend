import type { Express } from "express";
import { storage } from "../../storage";
import { requireAuth, requireAdmin, requireOwnership } from "../../auth-middleware";

export function registerAnalyticsPromotionsRoutes(app: Express) {
  // ==========================================
  // PROMOTIONS & ELIGIBILITY
  // ==========================================

  // Check if user is eligible for first job discount
  app.get("/api/promotions/eligibility/:userId", requireAuth, requireOwnership("userId"), async (req, res) => {
    try {
      const { userId } = req.params;
      const isFirstTime = await storage.isFirstTimeCustomer(userId);
      const hasUsedDiscount = await storage.hasUsedFirstJobDiscount(userId);

      res.json({
        eligibleForFirstJobDiscount: isFirstTime && !hasUsedDiscount,
        discountAmount: isFirstTime && !hasUsedDiscount ? 25 : 0,
        isFirstTimeCustomer: isFirstTime,
      });
    } catch (error) {
      console.error("Error checking promotion eligibility:", error);
      res.status(500).json({ error: "Failed to check promotion eligibility" });
    }
  });

  // Get user's promotion history
  app.get("/api/promotions/:userId", requireAuth, requireOwnership("userId"), async (req, res) => {
    try {
      const { userId } = req.params;
      const promotions = await storage.getPromotionsByUser(userId);
      res.json(promotions);
    } catch (error) {
      console.error("Error fetching promotions:", error);
      res.status(500).json({ error: "Failed to fetch promotions" });
    }
  });

  // ==========================================
  // ANALYTICS TRACKING
  // ==========================================

  // Track analytics events
  app.post("/api/analytics/track", async (req, res) => {
    try {
      const { eventType, userId, sessionId, eventData, deviceType, platform, appVersion, referralSource } = req.body;
      if (!eventType) {
        return res.status(400).json({ error: "eventType is required" });
      }
      const event = await storage.trackEvent({
        eventType,
        userId: userId || null,
        sessionId: sessionId || null,
        eventData: eventData || null,
        deviceType: deviceType || null,
        platform: platform || null,
        appVersion: appVersion || null,
        referralSource: referralSource || null,
        createdAt: new Date().toISOString(),
      });
      res.json(event);
    } catch (error) {
      console.error("Error tracking event:", error);
      res.status(500).json({ error: "Failed to track event" });
    }
  });

  // Get analytics for a specific user
  app.get("/api/analytics/user/:userId", requireAuth, requireOwnership("userId"), async (req, res) => {
    try {
      const { userId } = req.params;
      const events = await storage.getEventsByUser(userId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching user events:", error);
      res.status(500).json({ error: "Failed to fetch user events" });
    }
  });

  // Get analytics funnel stats
  app.get("/api/analytics/funnel", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const stats = await storage.getFunnelStats(startDate as string, endDate as string);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching funnel stats:", error);
      res.status(500).json({ error: "Failed to fetch funnel stats" });
    }
  });

  // ==========================================
  // PROMO CODES
  // ==========================================

  // Validate and apply promo code
  app.post("/api/promo-codes/validate", async (req, res) => {
    try {
      const { code, userId, orderAmount, isApp } = req.body;
      if (!code || typeof code !== "string") {
        return res.status(400).json({ valid: false, discount: 0, error: "Promo code is required" });
      }
      if (!userId || typeof userId !== "string") {
        return res.status(400).json({ valid: false, discount: 0, error: "User ID is required" });
      }
      if (typeof orderAmount !== "number" || orderAmount < 0) {
        return res.status(400).json({ valid: false, discount: 0, error: "Valid order amount is required" });
      }
      const result = await storage.validateAndApplyPromoCode(code, userId, orderAmount, !!isApp);
      res.json(result);
    } catch (error) {
      console.error("Error validating promo code:", error);
      res.status(500).json({ valid: false, discount: 0, error: "Failed to validate promo code" });
    }
  });

  // Get specific promo code by code
  app.get("/api/promo-codes/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const promo = await storage.getPromoCodeByCode(code);
      if (!promo) {
        return res.status(404).json({ error: "Promo code not found" });
      }
      res.json(promo);
    } catch (error) {
      console.error("Error fetching promo code:", error);
      res.status(500).json({ error: "Failed to fetch promo code" });
    }
  });

  // Get all promo codes (admin only)
  app.get("/api/promo-codes", requireAuth, requireAdmin, async (req, res) => {
    try {
      const codes = await storage.getAllPromoCodes();
      res.json(codes);
    } catch (error) {
      console.error("Error fetching promo codes:", error);
      res.status(500).json({ error: "Failed to fetch promo codes" });
    }
  });

  // Seed ORLANDO25 promo code on startup (called internally)
  app.post("/api/promo-codes/seed-orlando25", async (req, res) => {
    try {
      const promo = await storage.seedOrlando25PromoCode();
      res.json(promo);
    } catch (error) {
      console.error("Error seeding ORLANDO25:", error);
      res.status(500).json({ error: "Failed to seed ORLANDO25 promo code" });
    }
  });
}
