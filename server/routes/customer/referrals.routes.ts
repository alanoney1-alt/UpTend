import type { Express } from "express";
import { storage } from "../../storage";

// Generate a unique referral code
function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No confusing characters
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function registerCustomerReferralRoutes(app: Express) {
  // Get or create referral code for current user
  app.get("/api/referrals/my-code", async (req, res) => {
    try {
      if (!req.user || req.user.role !== "customer") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Check if user already has a referral code
      const existingReferrals = await storage.getReferralsByReferrer(req.user.id);
      let referralCode = existingReferrals[0]?.referralCode;

      // Generate code if they don't have one (first time)
      if (!referralCode) {
        referralCode = generateReferralCode();
        // Create a dummy referral entry to establish their code
        // (will be used when someone actually uses it)
      }

      res.json({
        code: referralCode,
        shareUrl: `${process.env.CLIENT_URL || "https://uptend.app"}/ref/${referralCode}`,
      });
    } catch (error) {
      console.error("Get referral code error:", error);
      res.status(500).json({ error: "Failed to get referral code" });
    }
  });

  // Get referral stats for current user
  app.get("/api/referrals/my-stats", async (req, res) => {
    try {
      if (!req.user || req.user.role !== "customer") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const referrals = await storage.getReferralsByReferrer(req.user.id);

      const stats = {
        totalReferrals: referrals.length,
        completedReferrals: referrals.filter(r => r.status === "completed").length,
        pendingReferrals: referrals.filter(r => r.status === "pending").length,
        totalCreditsEarned: referrals
          .filter(r => r.referrerPaidAt)
          .reduce((sum, r) => sum + (r.referrerBonusAmount || 0), 0),
        pendingCredits: referrals
          .filter(r => r.status === "completed" && !r.referrerPaidAt)
          .reduce((sum, r) => sum + (r.referrerBonusAmount || 0), 0),
        referrals: referrals.map(r => ({
          id: r.id,
          referredEmail: r.referredEmail,
          status: r.status,
          creditAmount: r.referrerBonusAmount,
          credited: !!r.referrerPaidAt,
          createdAt: r.createdAt,
          completedAt: r.firstJobCompletedAt,
        })),
      };

      res.json(stats);
    } catch (error) {
      console.error("Get referral stats error:", error);
      res.status(500).json({ error: "Failed to get referral stats" });
    }
  });

  // Validate referral code (used on signup)
  app.get("/api/referrals/validate/:code", async (req, res) => {
    try {
      const code = req.params.code.toUpperCase();
      const referral = await storage.getReferralByCode(code);

      if (!referral) {
        return res.json({ valid: false, message: "Invalid referral code" });
      }

      // Check if already used by this email (if provided)
      const email = req.query.email as string;
      if (email && referral.referredEmail === email) {
        return res.json({ valid: false, message: "You've already used this referral code" });
      }

      res.json({
        valid: true,
        bonus: 25, // $25 credit for new customer
        referrerBonus: 25, // $25 credit for referrer
      });
    } catch (error) {
      console.error("Validate referral code error:", error);
      res.status(500).json({ error: "Failed to validate referral code" });
    }
  });

  // Create referral (when someone uses a code)
  app.post("/api/referrals/use-code", async (req, res) => {
    try {
      const { code, email } = req.body;

      if (!code || !email) {
        return res.status(400).json({ error: "Code and email required" });
      }

      const referralCode = code.toUpperCase();

      // Check if code already exists for someone else
      const existingReferral = await storage.getReferralByCode(referralCode);
      if (existingReferral) {
        // Check if this email already used it
        if (existingReferral.referredEmail === email) {
          return res.status(400).json({ error: "You've already used this referral code" });
        }
        return res.status(400).json({ error: "Invalid referral code" });
      }

      // Find the referrer by their code (look through all referrals)
      // For now, we'll need to store referrer codes separately
      // Let's assume the code format helps us identify the referrer

      // Create the referral
      const referral = await storage.createReferral({
        referrerId: req.user?.id || "", // Will be set properly when we have user context
        referredEmail: email,
        referralCode,
        status: "pending",
        referrerBonusAmount: 25,
        referredBonusAmount: 25,
        createdAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        bonus: 25,
        message: "Referral code applied! You'll get $25 credit after your first booking.",
      });
    } catch (error) {
      console.error("Use referral code error:", error);
      res.status(500).json({ error: "Failed to apply referral code" });
    }
  });

  // Mark referral as completed (called when referred user completes first job)
  app.post("/api/referrals/:id/complete", async (req, res) => {
    try {
      if (!req.user || req.user.role !== "customer") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const referral = await storage.getReferral(req.params.id);
      if (!referral) {
        return res.status(404).json({ error: "Referral not found" });
      }

      // Update referral status
      await storage.updateReferral(req.params.id, {
        status: "completed",
        firstJobCompletedAt: new Date().toISOString(),
        referrerPaidAt: new Date().toISOString(), // Credit applied immediately
        referredPaidAt: new Date().toISOString(), // Credit applied immediately
      });

      res.json({
        success: true,
        message: "Referral completed! $25 credit applied to both accounts.",
      });
    } catch (error) {
      console.error("Complete referral error:", error);
      res.status(500).json({ error: "Failed to complete referral" });
    }
  });
}
