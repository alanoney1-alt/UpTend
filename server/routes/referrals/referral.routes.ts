import type { Express } from "express";
import { storage } from "../../storage";
import { analyzeHomeHealthAudit } from "../../services/home-health-audit";
import { pool } from "../../db";

let tablesEnsured = false;

async function ensureTables() {
  if (tablesEnsured) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS referral_partners (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      business_name TEXT NOT NULL,
      category TEXT NOT NULL,
      contact_name TEXT,
      phone TEXT,
      email TEXT,
      website TEXT,
      rating NUMERIC DEFAULT 0,
      description TEXT,
      service_area TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS partner_referrals (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      home_health_audit_id TEXT,
      partner_id TEXT,
      customer_id TEXT NOT NULL,
      pro_id TEXT,
      category TEXT NOT NULL,
      description TEXT,
      estimated_value NUMERIC,
      referral_amount NUMERIC,
      commission_amount NUMERIC,
      status TEXT DEFAULT 'pending',
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  tablesEnsured = true;
}

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
      await ensureTables();

      let result;
      if (category) {
        result = await pool.query(
          `SELECT * FROM referral_partners WHERE is_active = true AND category = $1 ORDER BY rating DESC`,
          [String(category)]
        );
      } else {
        result = await pool.query(
          `SELECT * FROM referral_partners WHERE is_active = true ORDER BY rating DESC`
        );
      }

      res.json(result.rows);
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

      await ensureTables();

      const result = await pool.query(
        `INSERT INTO partner_referrals (home_health_audit_id, partner_id, customer_id, pro_id, category, description, estimated_value)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [homeHealthAuditId, partnerId, ((req.user as any).userId || (req.user as any).id), (audit as any).proId || null, category, description, estimatedValue]
      );

      res.json({
        success: true,
        referral: result.rows[0],
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

      await ensureTables();

      const result = await pool.query(
        `SELECT * FROM partner_referrals WHERE pro_id = $1 ORDER BY created_at DESC`,
        [req.params.proId]
      );

      const referrals = result.rows;
      const totalEarnings = referrals
        .filter((r: any) => r.status === "completed")
        .reduce((sum: number, r: any) => sum + (Number(r.commission_amount) || 0), 0);
      const pendingCommissions = referrals
        .filter((r: any) => r.status === "pending")
        .reduce((sum: number, r: any) => sum + (Number(r.commission_amount) || 0), 0);

      res.json({
        totalEarnings,
        pendingCommissions,
        paidCommissions: totalEarnings,
        referrals,
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

      await ensureTables();

      const commissionAmount = Math.round(referralAmount * 0.1);

      const result = await pool.query(
        `UPDATE partner_referrals
         SET status = 'completed', referral_amount = $1, commission_amount = $2, completed_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [referralAmount, commissionAmount, req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Referral not found" });
      }

      res.json({
        success: true,
        referral: result.rows[0],
        commissionAmount,
        message: "Referral marked as completed. Pro will receive 10% commission.",
      });
    } catch (error) {
      console.error("Complete partner referral error:", error);
      res.status(500).json({ error: "Failed to complete referral" });
    }
  });
}
