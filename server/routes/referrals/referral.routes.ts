import type { Express } from "express";
import { storage } from "../../storage";
import { analyzeHomeHealthAudit } from "../../services/home-health-audit";

export function registerReferralRoutes(app: Express) {
  // ==========================================
  // HOME HEALTH AUDIT
  // ==========================================

  // Analyze video for home health audit
  app.post("/api/home-health-audit/analyze", async (req, res) => {
    try {
      const { videoUrl, propertyAddress } = req.body;

      if (!videoUrl) {
        return res.status(400).json({ error: "videoUrl is required" });
      }

      const analysis = await analyzeHomeHealthAudit(videoUrl);

      // Store as AI estimate with home_health_audit method
      const estimate = await storage.createAiEstimate({
        requestId: null, // Will be linked if customer books
        quoteMethod: "home_health_audit",
        serviceType: "home_consultation",
        videoUrl,
        homeHealthReport: JSON.stringify({
          propertyAddress,
          ...analysis,
        }),
        uptendServices: JSON.stringify(analysis.uptendServices),
        referralRecommendations: JSON.stringify(analysis.referralNeeds),
        priorityLevel: analysis.propertyCondition.urgentIssues.length > 0 ? "urgent" : "recommended",
        confidence: analysis.confidence,
        suggestedPrice: 99, // $99 for home health audit
        createdAt: new Date().toISOString(),
      });

      res.json({
        id: estimate.id,
        ...analysis,
      });
    } catch (error) {
      console.error("Home health audit error:", error);
      res.status(500).json({ error: "Failed to analyze home health audit" });
    }
  });

  // Get home health audit report
  app.get("/api/home-health-audit/:id", async (req, res) => {
    try {
      const estimate = await storage.getAiEstimate(req.params.id);

      if (!estimate || estimate.quoteMethod !== "home_health_audit") {
        return res.status(404).json({ error: "Home health audit not found" });
      }

      const report = JSON.parse(estimate.homeHealthReport || "{}");

      res.json({
        id: estimate.id,
        ...report,
      });
    } catch (error) {
      console.error("Get home health audit error:", error);
      res.status(500).json({ error: "Failed to fetch home health audit" });
    }
  });

  // ==========================================
  // REFERRAL PARTNERS
  // ==========================================

  // List referral partners by category
  app.get("/api/referral-partners", async (req, res) => {
    try {
      const { category } = req.query;

      // TODO: Implement getPartnerPartners in storage
      // For now, return mock data
      const partners = [
        {
          id: "1",
          businessName: "Green Thumb Landscaping",
          category: "landscaping",
          rating: 4.8,
          phone: "(407) 555-0123",
        },
        {
          id: "2",
          businessName: "Apex Roofing Solutions",
          category: "roofing",
          rating: 4.9,
          phone: "(407) 555-0456",
        },
      ];

      const filtered = category
        ? partners.filter((p) => p.category === category)
        : partners;

      res.json(filtered);
    } catch (error) {
      console.error("Get referral partners error:", error);
      res.status(500).json({ error: "Failed to fetch referral partners" });
    }
  });

  // ==========================================
  // PARTNER REFERRALS (Home Health Audit → Specialized Services)
  // ==========================================

  // Create partner referral from home health audit
  app.post("/api/partner-referrals", async (req, res) => {
    try {
      const { homeHealthAuditId, partnerId, category, description, estimatedValue } = req.body;

      if (!req.user || req.user.role !== "customer") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Get the home health audit to find the Pro who did it
      const audit = await storage.getAiEstimate(homeHealthAuditId);
      if (!audit) {
        return res.status(404).json({ error: "Home health audit not found" });
      }

      // TODO: Implement createPartnerReferral in storage
      // For now, return mock success
      res.json({
        success: true,
        message: "Referral created. Partner will contact you within 24 hours.",
      });
    } catch (error) {
      console.error("Create partner referral error:", error);
      res.status(500).json({ error: "Failed to create referral" });
    }
  });

  // Get Pro's partner referrals and commissions
  app.get("/api/partner-referrals/pro/:proId", async (req, res) => {
    try {
      if (!req.user || req.user.role !== "hauler") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // TODO: Implement getPartnerReferralsByPro in storage
      // For now, return mock data
      res.json({
        totalEarnings: 150,
        pendingCommissions: 75,
        paidCommissions: 75,
        referrals: [
          {
            id: "1",
            category: "landscaping",
            status: "completed",
            referralAmount: 750,
            commissionAmount: 75,
            completedAt: "2024-01-15",
          },
        ],
      });
    } catch (error) {
      console.error("Get Pro partner referrals error:", error);
      res.status(500).json({ error: "Failed to fetch referrals" });
    }
  });

  // Mark partner referral as completed (partner notifies us)
  app.post("/api/partner-referrals/:id/complete", async (req, res) => {
    try {
      const { referralAmount } = req.body;

      // TODO: Implement updatePartnerReferral in storage
      // Calculate 10% commission to Pro
      const commissionAmount = Math.round(referralAmount * 0.1);

      res.json({
        success: true,
        commissionAmount,
        message: "Referral marked as completed. Pro will receive 10% commission.",
      });
    } catch (error) {
      console.error("Complete partner referral error:", error);
      res.status(500).json({ error: "Failed to complete referral" });
    }
  });
}
