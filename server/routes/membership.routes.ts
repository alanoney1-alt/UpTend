/**
 * Membership Program Routes
 * 
 * Endpoints:
 * - GET /api/partners/:slug/memberships/plans — list plans
 * - POST /api/partners/:slug/memberships/plans — create plan
 * - PUT /api/partners/:slug/memberships/plans/:planId — update plan
 * - GET /api/partners/:slug/memberships/subscribers — list subscribers with stats
 * - POST /api/partners/:slug/memberships/subscribe — enroll customer
 * - PUT /api/partners/:slug/memberships/subscribers/:subId/cancel — cancel
 * - PUT /api/partners/:slug/memberships/subscribers/:subId/pause — pause
 * - GET /api/partners/:slug/memberships/stats — active members, MRR, churn rate, upcoming tune-ups
 * - POST /api/partners/:slug/memberships/schedule-tuneups — auto-schedule upcoming tune-ups
 * - GET /api/memberships/my-plan — customer views their membership
 */

import { Router, type Express } from "express";
import { z } from "zod";
import { pool } from "../db";

export function registerMembershipRoutes(app: Express) {
  const router = Router();

  // ==========================================
  // GET /api/partners/:slug/memberships/plans
  // ==========================================
  router.get("/:slug/memberships/plans", async (req, res) => {
    const { slug } = req.params;
    
    try {
      const result = await pool.query(
        `SELECT * FROM membership_plans WHERE partner_slug = $1 ORDER BY monthly_price ASC`,
        [slug]
      );
      
      res.json({
        success: true,
        plans: result.rows,
        count: result.rows.length
      });
    } catch (err: any) {
      console.error("Error fetching membership plans:", err);
      res.status(500).json({ error: "Failed to fetch membership plans" });
    }
  });

  // ==========================================
  // POST /api/partners/:slug/memberships/plans
  // ==========================================
  const createPlanSchema = z.object({
    plan_name: z.string().min(1),
    monthly_price: z.number().min(0),
    benefits: z.array(z.string()).default([]),
    tune_ups_per_year: z.number().min(0).default(0),
    discount_percent: z.number().min(0).max(100).default(0),
    priority_scheduling: z.boolean().default(false)
  });

  router.post("/:slug/memberships/plans", async (req, res) => {
    const { slug } = req.params;
    
    try {
      const validated = createPlanSchema.parse(req.body);
      
      const result = await pool.query(
        `INSERT INTO membership_plans 
         (partner_slug, plan_name, monthly_price, benefits, tune_ups_per_year, discount_percent, priority_scheduling)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          slug,
          validated.plan_name,
          validated.monthly_price,
          JSON.stringify(validated.benefits),
          validated.tune_ups_per_year,
          validated.discount_percent,
          validated.priority_scheduling
        ]
      );
      
      res.json({
        success: true,
        plan: result.rows[0]
      });
    } catch (err: any) {
      if (err.name === "ZodError") {
        return res.status(400).json({ error: "Invalid request", details: err.errors });
      }
      console.error("Error creating membership plan:", err);
      res.status(500).json({ error: "Failed to create membership plan" });
    }
  });

  // ==========================================
  // PUT /api/partners/:slug/memberships/plans/:planId
  // ==========================================
  const updatePlanSchema = z.object({
    plan_name: z.string().min(1).optional(),
    monthly_price: z.number().min(0).optional(),
    benefits: z.array(z.string()).optional(),
    tune_ups_per_year: z.number().min(0).optional(),
    discount_percent: z.number().min(0).max(100).optional(),
    priority_scheduling: z.boolean().optional()
  });

  router.put("/:slug/memberships/plans/:planId", async (req, res) => {
    const { slug, planId } = req.params;
    
    try {
      const validated = updatePlanSchema.parse(req.body);
      const updateFields = Object.keys(validated).filter(key => validated[key as keyof typeof validated] !== undefined);
      
      if (updateFields.length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }
      
      const setClause = updateFields.map((field, index) => {
        if (field === 'benefits') {
          return `benefits = $${index + 3}`;
        }
        return `${field} = $${index + 3}`;
      }).join(", ");
      
      const values = updateFields.map(field => {
        if (field === 'benefits') {
          return JSON.stringify(validated[field as keyof typeof validated]);
        }
        return validated[field as keyof typeof validated];
      });
      
      const result = await pool.query(
        `UPDATE membership_plans SET ${setClause}, updated_at = NOW() 
         WHERE partner_slug = $1 AND id = $2 RETURNING *`,
        [slug, planId, ...values]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Plan not found" });
      }
      
      res.json({
        success: true,
        plan: result.rows[0]
      });
    } catch (err: any) {
      if (err.name === "ZodError") {
        return res.status(400).json({ error: "Invalid request", details: err.errors });
      }
      console.error("Error updating membership plan:", err);
      res.status(500).json({ error: "Failed to update membership plan" });
    }
  });

  // ==========================================
  // GET /api/partners/:slug/memberships/subscribers
  // ==========================================
  router.get("/:slug/memberships/subscribers", async (req, res) => {
    const { slug } = req.params;
    const { status, limit = "50", offset = "0" } = req.query;
    
    try {
      let whereClause = "WHERE ms.partner_slug = $1";
      const params = [slug];
      
      if (status && typeof status === 'string') {
        whereClause += " AND ms.status = $2";
        params.push(status);
      }
      
      const result = await pool.query(
        `SELECT ms.*, mp.plan_name, mp.monthly_price, mp.benefits
         FROM membership_subscribers ms
         JOIN membership_plans mp ON ms.plan_id = mp.id
         ${whereClause}
         ORDER BY ms.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      );
      
      res.json({
        success: true,
        subscribers: result.rows,
        count: result.rows.length
      });
    } catch (err: any) {
      console.error("Error fetching subscribers:", err);
      res.status(500).json({ error: "Failed to fetch subscribers" });
    }
  });

  // ==========================================
  // POST /api/partners/:slug/memberships/subscribe
  // ==========================================
  const subscribeSchema = z.object({
    plan_id: z.number(),
    customer_id: z.string(),
    stripe_subscription_id: z.string().optional()
  });

  router.post("/:slug/memberships/subscribe", async (req, res) => {
    const { slug } = req.params;
    
    try {
      const validated = subscribeSchema.parse(req.body);
      
      // Check if plan exists and belongs to partner
      const planCheck = await pool.query(
        `SELECT * FROM membership_plans WHERE id = $1 AND partner_slug = $2`,
        [validated.plan_id, slug]
      );
      
      if (planCheck.rows.length === 0) {
        return res.status(404).json({ error: "Plan not found" });
      }
      
      // Create subscription
      const result = await pool.query(
        `INSERT INTO membership_subscribers 
         (plan_id, customer_id, partner_slug, stripe_subscription_id, started_at)
         VALUES ($1, $2, $3, $4, NOW())
         RETURNING *`,
        [validated.plan_id, validated.customer_id, slug, validated.stripe_subscription_id]
      );
      
      res.json({
        success: true,
        subscription: result.rows[0]
      });
    } catch (err: any) {
      if (err.name === "ZodError") {
        return res.status(400).json({ error: "Invalid request", details: err.errors });
      }
      console.error("Error creating subscription:", err);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  // ==========================================
  // PUT /api/partners/:slug/memberships/subscribers/:subId/cancel
  // ==========================================
  router.put("/:slug/memberships/subscribers/:subId/cancel", async (req, res) => {
    const { slug, subId } = req.params;
    
    try {
      const result = await pool.query(
        `UPDATE membership_subscribers 
         SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND partner_slug = $2 AND status = 'active'
         RETURNING *`,
        [subId, slug]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Active subscription not found" });
      }
      
      res.json({
        success: true,
        subscription: result.rows[0]
      });
    } catch (err: any) {
      console.error("Error cancelling subscription:", err);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });

  // ==========================================
  // PUT /api/partners/:slug/memberships/subscribers/:subId/pause
  // ==========================================
  router.put("/:slug/memberships/subscribers/:subId/pause", async (req, res) => {
    const { slug, subId } = req.params;
    
    try {
      const result = await pool.query(
        `UPDATE membership_subscribers 
         SET status = 'paused', updated_at = NOW()
         WHERE id = $1 AND partner_slug = $2 AND status = 'active'
         RETURNING *`,
        [subId, slug]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Active subscription not found" });
      }
      
      res.json({
        success: true,
        subscription: result.rows[0]
      });
    } catch (err: any) {
      console.error("Error pausing subscription:", err);
      res.status(500).json({ error: "Failed to pause subscription" });
    }
  });

  // ==========================================
  // GET /api/partners/:slug/memberships/stats
  // ==========================================
  router.get("/:slug/memberships/stats", async (req, res) => {
    const { slug } = req.params;
    
    try {
      // Active members count
      const activeResult = await pool.query(
        `SELECT COUNT(*) as active_members FROM membership_subscribers 
         WHERE partner_slug = $1 AND status = 'active'`,
        [slug]
      );
      
      // Monthly Recurring Revenue (MRR)
      const mrrResult = await pool.query(
        `SELECT COALESCE(SUM(mp.monthly_price), 0) as mrr
         FROM membership_subscribers ms
         JOIN membership_plans mp ON ms.plan_id = mp.id
         WHERE ms.partner_slug = $1 AND ms.status = 'active'`,
        [slug]
      );
      
      // Churn rate (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const churnResult = await pool.query(
        `SELECT 
           COUNT(CASE WHEN cancelled_at >= $2 THEN 1 END) as cancelled,
           COUNT(*) as total
         FROM membership_subscribers 
         WHERE partner_slug = $1`,
        [slug, thirtyDaysAgo]
      );
      
      // Upcoming tune-ups (next 30 days)
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const tuneUpsResult = await pool.query(
        `SELECT COUNT(*) as upcoming_tuneups
         FROM membership_tune_ups mt
         JOIN membership_subscribers ms ON mt.subscriber_id = ms.id
         WHERE ms.partner_slug = $1 
         AND mt.scheduled_date BETWEEN NOW() AND $2
         AND mt.completed_date IS NULL`,
        [slug, thirtyDaysFromNow]
      );
      
      const churnRate = churnResult.rows[0].total > 0 
        ? (churnResult.rows[0].cancelled / churnResult.rows[0].total * 100).toFixed(1)
        : 0;
      
      res.json({
        success: true,
        stats: {
          activeMembers: parseInt(activeResult.rows[0].active_members),
          mrr: parseFloat(mrrResult.rows[0].mrr),
          churnRate: parseFloat(churnRate.toString()),
          upcomingTuneUps: parseInt(tuneUpsResult.rows[0].upcoming_tuneups)
        }
      });
    } catch (err: any) {
      console.error("Error fetching membership stats:", err);
      res.status(500).json({ error: "Failed to fetch membership stats" });
    }
  });

  // ==========================================
  // POST /api/partners/:slug/memberships/schedule-tuneups
  // ==========================================
  router.post("/:slug/memberships/schedule-tuneups", async (req, res) => {
    const { slug } = req.params;
    
    try {
      // Get active subscribers who need tune-ups scheduled
      const subscribers = await pool.query(
        `SELECT ms.*, mp.tune_ups_per_year
         FROM membership_subscribers ms
         JOIN membership_plans mp ON ms.plan_id = mp.id
         WHERE ms.partner_slug = $1 AND ms.status = 'active'
         AND ms.next_tune_up_date IS NULL`,
        [slug]
      );
      
      const scheduled = [];
      
      for (const subscriber of subscribers.rows) {
        if (subscriber.tune_ups_per_year > 0) {
          // Schedule based on tune-ups per year
          const monthsBetween = 12 / subscriber.tune_ups_per_year;
          const nextDate = new Date(subscriber.started_at);
          nextDate.setMonth(nextDate.getMonth() + monthsBetween);
          
          // Create tune-up record
          const tuneUpResult = await pool.query(
            `INSERT INTO membership_tune_ups (subscriber_id, scheduled_date)
             VALUES ($1, $2) RETURNING *`,
            [subscriber.id, nextDate.toISOString()]
          );
          
          // Update subscriber's next tune-up date
          await pool.query(
            `UPDATE membership_subscribers SET next_tune_up_date = $1 WHERE id = $2`,
            [nextDate.toISOString(), subscriber.id]
          );
          
          scheduled.push(tuneUpResult.rows[0]);
        }
      }
      
      res.json({
        success: true,
        scheduled: scheduled.length,
        tuneUps: scheduled
      });
    } catch (err: any) {
      console.error("Error scheduling tune-ups:", err);
      res.status(500).json({ error: "Failed to schedule tune-ups" });
    }
  });

  // ==========================================
  // GET /api/memberships/my-plan (customer view)
  // ==========================================
  router.get("/my-plan", async (req, res) => {
    const customerId = req.headers["x-customer-id"] as string;
    
    if (!customerId) {
      return res.status(401).json({ error: "Customer ID required" });
    }
    
    try {
      const result = await pool.query(
        `SELECT ms.*, mp.plan_name, mp.monthly_price, mp.benefits, mp.discount_percent,
                mp.priority_scheduling, mp.tune_ups_per_year
         FROM membership_subscribers ms
         JOIN membership_plans mp ON ms.plan_id = mp.id
         WHERE ms.customer_id = $1 AND ms.status = 'active'`,
        [customerId]
      );
      
      if (result.rows.length === 0) {
        return res.json({ success: true, membership: null });
      }
      
      // Get upcoming tune-ups
      const tuneUpsResult = await pool.query(
        `SELECT * FROM membership_tune_ups 
         WHERE subscriber_id = $1 AND completed_date IS NULL
         ORDER BY scheduled_date ASC`,
        [result.rows[0].id]
      );
      
      res.json({
        success: true,
        membership: {
          ...result.rows[0],
          upcomingTuneUps: tuneUpsResult.rows
        }
      });
    } catch (err: any) {
      console.error("Error fetching customer membership:", err);
      res.status(500).json({ error: "Failed to fetch membership" });
    }
  });

  app.use("/api/partners", router);
  app.use("/api/memberships", router);
}