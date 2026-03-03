/**
 * Partner Dashboard API Routes
 * 
 * Endpoints:
 * - GET  /api/partners/:slug/stats  — summary numbers
 * - GET  /api/partners/:slug/leads  — recent leads
 * - GET  /api/partners/:slug/jobs   — jobs list
 * - POST /api/partners/tiered-quote — generate Good/Better/Best quote
 * - GET  /api/partners/:slug/maintenance-reminders — upcoming reminders
 * - POST /api/partners/:slug/maintenance-reminders/trigger — manually trigger reminders
 */

import { Router, type Express } from "express";
import { z } from "zod";
import { pool } from "../db";
import { generateTieredQuote } from "../services/partner-tiered-quoting";
import { getPartnerReminders, processReminders, scheduleMaintenanceReminder } from "../services/partner-maintenance-reminders";
import { queueReviewRequest } from "../services/partner-review-requests";
import { runPartnerAuditSafe } from "../services/partner-live-audit";
import { getInvoiceStats } from "../services/invoicing-system";
import { getEstimateConversionRate } from "../services/estimate-followup";
import { getMembershipStats } from "../services/membership-management";
import { getKPIDashboard } from "../services/partner-reporting";
import {
  registerPartner,
  getPartnerNetworkStats,
  getNetworkPartners,
  findCrossSellOpportunities,
  createReferral,
  completeReferral,
} from "../services/partner-referral-network";

// Ensure partner_leads and partner_jobs tables exist for tracking
async function ensureDashboardTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS partner_leads (
      id SERIAL PRIMARY KEY,
      partner_slug TEXT NOT NULL,
      customer_name TEXT,
      customer_email TEXT,
      customer_phone TEXT,
      service_type TEXT,
      source TEXT DEFAULT 'george',
      status TEXT DEFAULT 'new',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS partner_jobs (
      id SERIAL PRIMARY KEY,
      partner_slug TEXT NOT NULL,
      lead_id INT,
      customer_name TEXT,
      service_type TEXT,
      status TEXT DEFAULT 'scheduled',
      tech_name TEXT,
      amount NUMERIC DEFAULT 0,
      scheduled_at TIMESTAMP,
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS partner_reviews (
      id SERIAL PRIMARY KEY,
      partner_slug TEXT NOT NULL,
      customer_name TEXT,
      rating INT,
      review_text TEXT,
      source TEXT DEFAULT 'google',
      request_sent_at TIMESTAMP,
      received_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}
ensureDashboardTables().catch(console.error);

export function registerPartnerDashboardRoutes(app: Express) {
  const router = Router();

  // ==========================================
  // GET /api/partners/:slug/stats
  // ==========================================
  router.get("/:slug/stats", async (req, res) => {
    const { slug } = req.params;
    
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Leads this month
      const leadsResult = await pool.query(
        `SELECT COUNT(*) as count FROM partner_leads WHERE partner_slug = $1 AND created_at >= $2`,
        [slug, monthStart]
      );

      // Active jobs
      const activeJobsResult = await pool.query(
        `SELECT COUNT(*) as count FROM partner_jobs WHERE partner_slug = $1 AND status IN ('scheduled', 'in_progress')`,
        [slug]
      );

      // Revenue this month (from paid invoices)
      const revenueResult = await pool.query(
        `SELECT COALESCE(SUM(total), 0) as revenue FROM partner_invoices WHERE partner_slug = $1 AND status = 'paid' AND paid_at >= $2`,
        [slug, monthStart]
      ).catch(() => ({ rows: [{ revenue: 0 }] }));

      // Completed jobs this month
      const completedResult = await pool.query(
        `SELECT COUNT(*) as count FROM partner_jobs WHERE partner_slug = $1 AND status = 'completed' AND completed_at >= $2`,
        [slug, monthStart]
      );

      // Reviews
      const reviewsResult = await pool.query(
        `SELECT 
          COALESCE(AVG(rating), 0) as avg_rating,
          COUNT(CASE WHEN request_sent_at IS NOT NULL THEN 1 END) as requests_sent,
          COUNT(CASE WHEN received_at IS NOT NULL THEN 1 END) as reviews_received
         FROM partner_reviews WHERE partner_slug = $1`,
        [slug]
      );

      res.json({
        success: true,
        stats: {
          totalLeads: parseInt(leadsResult.rows[0]?.count || "0"),
          activeJobs: parseInt(activeJobsResult.rows[0]?.count || "0"),
          revenueThisMonth: parseFloat(revenueResult.rows[0]?.revenue || "0"),
          averageRating: parseFloat(parseFloat(reviewsResult.rows[0]?.avg_rating || "0").toFixed(1)),
          completedJobsThisMonth: parseInt(completedResult.rows[0]?.count || "0"),
          reviewRequestsSent: parseInt(reviewsResult.rows[0]?.requests_sent || "0"),
          reviewsReceived: parseInt(reviewsResult.rows[0]?.reviews_received || "0"),
        },
        period: "current_month",
        partnerSlug: slug,
      });
    } catch (err: any) {
      console.error("Dashboard stats error:", err.message);
      // Graceful fallback — return zeros if tables don't exist yet
      res.json({
        success: true,
        stats: {
          totalLeads: 0, activeJobs: 0, revenueThisMonth: 0, averageRating: 0,
          completedJobsThisMonth: 0, reviewRequestsSent: 0, reviewsReceived: 0,
        },
        period: "current_month",
        partnerSlug: slug,
      });
    }
  });

  // ==========================================
  // GET /api/partners/:slug/leads
  // ==========================================
  router.get("/:slug/leads", async (req, res) => {
    const { slug } = req.params;
    
    try {
      const result = await pool.query(
        `SELECT * FROM partner_leads WHERE partner_slug = $1 ORDER BY created_at DESC LIMIT 50`,
        [slug]
      );
      res.json({ success: true, leads: result.rows, partnerSlug: slug });
    } catch {
      res.json({ success: true, leads: [], partnerSlug: slug });
    }
  });

  // ==========================================
  // GET /api/partners/:slug/jobs
  // ==========================================
  router.get("/:slug/jobs", async (req, res) => {
    const { slug } = req.params;
    
    try {
      const result = await pool.query(
        `SELECT * FROM partner_jobs WHERE partner_slug = $1 ORDER BY created_at DESC LIMIT 50`,
        [slug]
      );
      res.json({ success: true, jobs: result.rows, partnerSlug: slug });
    } catch {
      res.json({ success: true, jobs: [], partnerSlug: slug });
    }
  });

  // ==========================================
  // POST /api/partners/tiered-quote
  // ==========================================
  const tieredQuoteSchema = z.object({
    serviceType: z.string().min(1),
    conversationContext: z.string().optional(),
    basePrice: z.number().optional(),
    partnerSlug: z.string().min(1),
    customerName: z.string().optional(),
  });

  router.post("/tiered-quote", async (req, res) => {
    try {
      const validated = tieredQuoteSchema.parse(req.body);
      const result = generateTieredQuote(validated);
      res.json({ success: true, ...result });
    } catch (err: any) {
      if (err.name === "ZodError") {
        return res.status(400).json({ error: "Invalid request", details: err.errors });
      }
      res.status(500).json({ error: "Failed to generate quote" });
    }
  });

  // ==========================================
  // GET /api/partners/:slug/maintenance-reminders
  // ==========================================
  router.get("/:slug/maintenance-reminders", async (req, res) => {
    try {
      const reminders = await getPartnerReminders(req.params.slug);
      res.json({ success: true, reminders });
    } catch {
      res.json({ success: true, reminders: [] });
    }
  });

  // ==========================================
  // POST /api/partners/:slug/maintenance-reminders/trigger
  // ==========================================
  router.post("/:slug/maintenance-reminders/trigger", async (req, res) => {
    try {
      const result = await processReminders();
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ error: "Failed to process reminders" });
    }
  });

  // ==========================================
  // POST /api/partners/:slug/maintenance-reminders/schedule
  // ==========================================
  const scheduleSchema = z.object({
    customerId: z.string().min(1),
    customerName: z.string().optional(),
    customerPhone: z.string().optional(),
    serviceType: z.string().min(1),
    serviceDate: z.string().optional(),
  });

  router.post("/:slug/maintenance-reminders/schedule", async (req, res) => {
    try {
      const validated = scheduleSchema.parse(req.body);
      const record = await scheduleMaintenanceReminder({
        partnerSlug: req.params.slug,
        ...validated,
      });
      res.json({ success: true, record });
    } catch (err: any) {
      if (err.name === "ZodError") {
        return res.status(400).json({ error: "Invalid request", details: err.errors });
      }
      res.status(500).json({ error: "Failed to schedule reminder" });
    }
  });

  // ==========================================
  // POST /api/partners/audit — Live Competitive Audit
  // ==========================================
  const auditSchema = z.object({
    companyName: z.string().min(1),
    serviceType: z.string().min(1),
    city: z.string().min(1),
    state: z.string().optional(),
  });

  // Simple in-memory rate limit: 10 per hour per IP
  const auditRateLimit = new Map<string, number[]>();

  router.post("/audit", async (req, res) => {
    // Rate limit check
    const ip = req.ip || "unknown";
    const now = Date.now();
    const hourAgo = now - 3600000;
    const timestamps = (auditRateLimit.get(ip) || []).filter(t => t > hourAgo);
    if (timestamps.length >= 10) {
      return res.status(429).json({ error: "Rate limit exceeded. Max 10 audits per hour." });
    }
    timestamps.push(now);
    auditRateLimit.set(ip, timestamps);

    try {
      const validated = auditSchema.parse(req.body);
      const result = await runPartnerAuditSafe(validated);
      if (!result) {
        return res.status(503).json({ error: "Audit service temporarily unavailable" });
      }
      res.json(result);
    } catch (err: any) {
      if (err.name === "ZodError") {
        return res.status(400).json({ error: "Invalid request", details: err.errors });
      }
      res.status(500).json({ error: "Audit failed" });
    }
  });

  // ============================================================
  // Partner Referral Network Endpoints
  // ============================================================

  // Register a partner in the network
  router.post("/network/register", async (req, res) => {
    try {
      const { slug, companyName, serviceTypes, ownerName, email, phone } = req.body;
      if (!slug || !companyName) {
        return res.status(400).json({ error: "slug and companyName required" });
      }
      await registerPartner(slug, companyName, serviceTypes || [], ownerName, email, phone);
      res.json({ ok: true, message: `${companyName} registered in the partner network` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get network stats for a partner
  router.get("/:slug/network-stats", async (req, res) => {
    try {
      const stats = await getPartnerNetworkStats(req.params.slug);
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get all partners in the network
  router.get("/network/members", async (_req, res) => {
    try {
      const partners = await getNetworkPartners();
      res.json({ partners, count: partners.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Find cross-sell opportunities for a customer
  router.get("/:slug/cross-sell/:customerId", async (req, res) => {
    try {
      const opportunities = await findCrossSellOpportunities(
        req.params.customerId,
        req.params.slug
      );
      res.json({ opportunities, count: opportunities.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create a referral
  router.post("/referrals", async (req, res) => {
    try {
      const { referringPartnerSlug, receivingPartnerSlug, customerId, customerName, serviceType, jobId, jobAmount } = req.body;
      const referral = await createReferral(
        referringPartnerSlug, receivingPartnerSlug, customerId,
        customerName, serviceType, jobId, jobAmount
      );
      res.json(referral);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Complete a referral (job done)
  router.post("/referrals/:id/complete", async (req, res) => {
    try {
      await completeReferral(parseInt(req.params.id));
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.use("/api/partners", router);
}
