/**
 * Seasonal Campaign & Customer Win-Back Routes
 * 
 * Seasonal Campaign Endpoints:
 * - GET /api/partners/:slug/campaigns — list campaigns
 * - POST /api/partners/:slug/campaigns — create campaign
 * - PUT /api/partners/:slug/campaigns/:id — update
 * - POST /api/partners/:slug/campaigns/:id/launch — send campaign
 * - GET /api/partners/:slug/campaigns/:id/stats — open rate, click rate, conversions
 * - GET /api/partners/:slug/campaigns/templates — pre-built seasonal templates
 * 
 * Win-Back Endpoints:
 * - GET /api/partners/:slug/winback — winback sequences
 * - POST /api/partners/:slug/winback — create sequence
 * - PUT /api/partners/:slug/winback/:id — update
 * - GET /api/partners/:slug/winback/dormant-customers — list of customers who haven't booked in X days
 * - POST /api/partners/:slug/winback/:id/trigger — manually trigger for specific customers
 */

import { Router, type Express } from "express";
import { z } from "zod";
import { pool } from "../db";

export function registerCampaignsRoutes(app: Express) {
  const router = Router();

  // ==========================================
  // SEASONAL CAMPAIGNS
  // ==========================================

  // GET /api/partners/:slug/campaigns
  router.get("/:slug/campaigns", async (req, res) => {
    const { slug } = req.params;
    const { status, type, limit = "20", offset = "0" } = req.query;
    
    try {
      let whereClause = `WHERE partner_slug = $1`;
      const params = [slug];
      
      if (status && typeof status === 'string') {
        whereClause += ` AND status = $${params.length + 1}`;
        params.push(status);
      }
      
      if (type && typeof type === 'string') {
        whereClause += ` AND type = $${params.length + 1}`;
        params.push(type);
      }
      
      const result = await pool.query(
        `SELECT 
           sc.*,
           (SELECT COUNT(*) FROM campaign_sends cs WHERE cs.campaign_id = sc.id) as total_sends,
           (SELECT COUNT(*) FROM campaign_sends cs WHERE cs.campaign_id = sc.id AND cs.opened = true) as opens,
           (SELECT COUNT(*) FROM campaign_sends cs WHERE cs.campaign_id = sc.id AND cs.clicked = true) as clicks,
           (SELECT COUNT(*) FROM campaign_sends cs WHERE cs.campaign_id = sc.id AND cs.converted = true) as conversions
         FROM seasonal_campaigns sc
         ${whereClause}
         ORDER BY sc.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      );
      
      res.json({
        success: true,
        campaigns: result.rows,
        count: result.rows.length
      });
    } catch (err: any) {
      console.error("Error fetching campaigns:", err);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  // POST /api/partners/:slug/campaigns
  const createCampaignSchema = z.object({
    name: z.string().min(1),
    type: z.enum(['pre_summer', 'pre_winter', 'spring_tuneup', 'fall_tuneup', 'custom']),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    target_audience: z.object({
      customer_types: z.array(z.string()).default([]),
      service_history: z.array(z.string()).default([]),
      inactive_days: z.number().optional()
    }).default({}),
    email_template: z.string().optional(),
    sms_template: z.string().optional(),
    offer_details: z.object({
      discount_type: z.enum(['percentage', 'fixed']).optional(),
      discount_value: z.number().optional(),
      expires_at: z.string().optional(),
      code: z.string().optional()
    }).default({})
  });

  router.post("/:slug/campaigns", async (req, res) => {
    const { slug } = req.params;
    
    try {
      const validated = createCampaignSchema.parse(req.body);
      
      const result = await pool.query(
        `INSERT INTO seasonal_campaigns 
         (partner_slug, name, type, start_date, end_date, target_audience, email_template, sms_template, offer_details)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          slug,
          validated.name,
          validated.type,
          validated.start_date,
          validated.end_date,
          JSON.stringify(validated.target_audience),
          validated.email_template,
          validated.sms_template,
          JSON.stringify(validated.offer_details)
        ]
      );
      
      res.json({
        success: true,
        campaign: result.rows[0]
      });
    } catch (err: any) {
      if (err.name === "ZodError") {
        return res.status(400).json({ error: "Invalid request", details: err.errors });
      }
      console.error("Error creating campaign:", err);
      res.status(500).json({ error: "Failed to create campaign" });
    }
  });

  // PUT /api/partners/:slug/campaigns/:id
  const updateCampaignSchema = z.object({
    name: z.string().min(1).optional(),
    type: z.enum(['pre_summer', 'pre_winter', 'spring_tuneup', 'fall_tuneup', 'custom']).optional(),
    status: z.enum(['draft', 'scheduled', 'active', 'completed']).optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    target_audience: z.object({
      customer_types: z.array(z.string()).optional(),
      service_history: z.array(z.string()).optional(),
      inactive_days: z.number().optional()
    }).optional(),
    email_template: z.string().optional(),
    sms_template: z.string().optional(),
    offer_details: z.object({
      discount_type: z.enum(['percentage', 'fixed']).optional(),
      discount_value: z.number().optional(),
      expires_at: z.string().optional(),
      code: z.string().optional()
    }).optional()
  });

  router.put("/:slug/campaigns/:id", async (req, res) => {
    const { slug, id } = req.params;
    
    try {
      const validated = updateCampaignSchema.parse(req.body);
      const updateFields = Object.keys(validated).filter(key => validated[key as keyof typeof validated] !== undefined);
      
      if (updateFields.length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }
      
      const setClause = updateFields.map((field, index) => {
        if (field === 'target_audience' || field === 'offer_details') {
          return `${field} = $${index + 3}`;
        }
        return `${field} = $${index + 3}`;
      }).join(", ");
      
      const values = updateFields.map(field => {
        const value = validated[field as keyof typeof validated];
        if (field === 'target_audience' || field === 'offer_details') {
          return JSON.stringify(value);
        }
        return value;
      });
      
      const result = await pool.query(
        `UPDATE seasonal_campaigns 
         SET ${setClause}, updated_at = NOW()
         WHERE id = $1 AND partner_slug = $2
         RETURNING *`,
        [id, slug, ...values]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      res.json({
        success: true,
        campaign: result.rows[0]
      });
    } catch (err: any) {
      if (err.name === "ZodError") {
        return res.status(400).json({ error: "Invalid request", details: err.errors });
      }
      console.error("Error updating campaign:", err);
      res.status(500).json({ error: "Failed to update campaign" });
    }
  });

  // POST /api/partners/:slug/campaigns/:id/launch
  router.post("/:slug/campaigns/:id/launch", async (req, res) => {
    const { slug, id } = req.params;
    const { test_mode = false, test_customer_id } = req.body;
    
    try {
      // Get campaign details
      const campaignResult = await pool.query(
        `SELECT * FROM seasonal_campaigns WHERE id = $1 AND partner_slug = $2`,
        [id, slug]
      );
      
      if (campaignResult.rows.length === 0) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      const campaign = campaignResult.rows[0];
      
      if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
        return res.status(400).json({ error: "Campaign cannot be launched in current status" });
      }
      
      let targetCustomers = [];
      
      if (test_mode && test_customer_id) {
        // Test mode - send to single customer
        targetCustomers = [{ id: test_customer_id }];
      } else {
        // Build customer query based on target audience
        const audience = campaign.target_audience || {};
        let customerQuery = `SELECT DISTINCT customer_id as id FROM partner_jobs WHERE partner_slug = $1`;
        const queryParams = [slug];
        
        if (audience.inactive_days) {
          customerQuery += ` AND customer_id NOT IN (
            SELECT customer_id FROM partner_jobs 
            WHERE partner_slug = $1 AND completed_at >= NOW() - INTERVAL '${audience.inactive_days} days'
          )`;
        }
        
        const customerResult = await pool.query(customerQuery, queryParams);
        targetCustomers = customerResult.rows;
      }
      
      // Create campaign sends
      const sends = [];
      for (const customer of targetCustomers) {
        // Email send
        if (campaign.email_template) {
          const emailResult = await pool.query(
            `INSERT INTO campaign_sends (campaign_id, customer_id, channel, sent_at)
             VALUES ($1, $2, 'email', NOW())
             RETURNING *`,
            [id, customer.id]
          );
          sends.push(emailResult.rows[0]);
        }
        
        // SMS send
        if (campaign.sms_template) {
          const smsResult = await pool.query(
            `INSERT INTO campaign_sends (campaign_id, customer_id, channel, sent_at)
             VALUES ($1, $2, 'sms', NOW())
             RETURNING *`,
            [id, customer.id]
          );
          sends.push(smsResult.rows[0]);
        }
      }
      
      // Update campaign status
      await pool.query(
        `UPDATE seasonal_campaigns SET status = 'active', updated_at = NOW() WHERE id = $1`,
        [id]
      );
      
      res.json({
        success: true,
        launched: true,
        test_mode,
        sends: sends.length,
        target_customers: targetCustomers.length
      });
    } catch (err: any) {
      console.error("Error launching campaign:", err);
      res.status(500).json({ error: "Failed to launch campaign" });
    }
  });

  // GET /api/partners/:slug/campaigns/:id/stats
  router.get("/:slug/campaigns/:id/stats", async (req, res) => {
    const { slug, id } = req.params;
    
    try {
      // Verify campaign belongs to partner
      const campaignResult = await pool.query(
        `SELECT * FROM seasonal_campaigns WHERE id = $1 AND partner_slug = $2`,
        [id, slug]
      );
      
      if (campaignResult.rows.length === 0) {
        return res.status(404).json({ error: "Campaign not found" });
      }
      
      // Get performance stats
      const statsResult = await pool.query(
        `SELECT 
           channel,
           COUNT(*) as total_sends,
           COUNT(CASE WHEN opened = true THEN 1 END) as opens,
           COUNT(CASE WHEN clicked = true THEN 1 END) as clicks,
           COUNT(CASE WHEN converted = true THEN 1 END) as conversions,
           ROUND(COUNT(CASE WHEN opened = true THEN 1 END) * 100.0 / COUNT(*), 2) as open_rate,
           ROUND(COUNT(CASE WHEN clicked = true THEN 1 END) * 100.0 / COUNT(*), 2) as click_rate,
           ROUND(COUNT(CASE WHEN converted = true THEN 1 END) * 100.0 / COUNT(*), 2) as conversion_rate
         FROM campaign_sends 
         WHERE campaign_id = $1
         GROUP BY channel`,
        [id]
      );
      
      // Daily performance
      const dailyStatsResult = await pool.query(
        `SELECT 
           DATE(sent_at) as send_date,
           COUNT(*) as sends,
           COUNT(CASE WHEN opened = true THEN 1 END) as opens,
           COUNT(CASE WHEN clicked = true THEN 1 END) as clicks
         FROM campaign_sends 
         WHERE campaign_id = $1
         GROUP BY DATE(sent_at)
         ORDER BY send_date`,
        [id]
      );
      
      res.json({
        success: true,
        campaign: campaignResult.rows[0],
        stats: {
          byChannel: statsResult.rows,
          dailyPerformance: dailyStatsResult.rows,
          totalSends: statsResult.rows.reduce((sum, row) => sum + parseInt(row.total_sends), 0),
          totalOpens: statsResult.rows.reduce((sum, row) => sum + parseInt(row.opens), 0),
          totalClicks: statsResult.rows.reduce((sum, row) => sum + parseInt(row.clicks), 0),
          totalConversions: statsResult.rows.reduce((sum, row) => sum + parseInt(row.conversions), 0)
        }
      });
    } catch (err: any) {
      console.error("Error fetching campaign stats:", err);
      res.status(500).json({ error: "Failed to fetch campaign stats" });
    }
  });

  // GET /api/partners/:slug/campaigns/templates
  router.get("/:slug/campaigns/templates", async (req, res) => {
    try {
      // Pre-built seasonal campaign templates
      const templates = {
        pre_summer: {
          name: "Pre-Summer Tune-Up",
          email_template: `Subject: Beat the Heat - Schedule Your Pre-Summer HVAC Tune-Up!

Hi {customer_name},

Summer's approaching fast! Don't wait until the first 90-degree day to discover your AC isn't working properly.

Our Pre-Summer Tune-Up Special includes:
• Complete system inspection
• Filter replacement
• Coil cleaning
• Refrigerant check
• Performance optimization

Book now and save {discount}% on your tune-up!

Schedule online or call us at {phone}

Stay cool,
{company_name}`,
          sms_template: "🌞 Summer's coming! Get your AC ready with our Pre-Summer Tune-Up. Save {discount}% when you book this week. Book now: {link}",
          offer_details: {
            discount_type: "percentage",
            discount_value: 15,
            code: "SUMMER2024"
          }
        },
        pre_winter: {
          name: "Pre-Winter Heating Check",
          email_template: `Subject: Winter's Coming - Is Your Heating System Ready?

Hi {customer_name},

Cold weather will be here before you know it. Make sure your family stays warm and comfortable all winter long.

Our Pre-Winter Heating Check includes:
• Furnace safety inspection
• Filter replacement
• Thermostat calibration
• Ductwork inspection
• Carbon monoxide testing

Special offer: {discount}% off when you schedule this month!

Don't wait - book your heating check today!

Stay warm,
{company_name}`,
          sms_template: "❄️ Winter prep time! Get your heating system checked before the cold hits. Save {discount}% this month. Book: {link}",
          offer_details: {
            discount_type: "percentage",
            discount_value: 20,
            code: "WINTER2024"
          }
        },
        spring_tuneup: {
          name: "Spring Refresh",
          email_template: `Subject: Spring into Action - HVAC Tune-Up Time!

Hi {customer_name},

Spring cleaning isn't just for closets! Your HVAC system needs attention after working hard all winter.

Our Spring Refresh service includes:
• Complete system cleaning
• Fresh filter installation
• Efficiency optimization
• Seasonal transitions
• Performance report

Early bird special: Book this week and save {discount}%!

Ready for fresh, clean air? Let's get started!

{company_name}`,
          sms_template: "🌸 Spring tune-up time! Fresh filters, clean system, better air quality. Save {discount}% this week! Book: {link}",
          offer_details: {
            discount_type: "percentage",
            discount_value: 10,
            code: "SPRING2024"
          }
        },
        fall_tuneup: {
          name: "Fall Maintenance",
          email_template: `Subject: Fall Into Savings - Maintenance Special Inside!

Hi {customer_name},

As the leaves change, so should your HVAC maintenance routine. Our Fall Maintenance Special ensures your system is ready for the season ahead.

What's included:
• Comprehensive system check
• Filter replacement
• Cleaning and adjustments
• Safety inspection
• Winter preparation

Limited time: {discount}% off Fall Maintenance!

Book before November 1st for best availability.

{company_name}`,
          sms_template: "🍂 Fall maintenance special! Get ready for cooler weather. Save {discount}% when you book before Nov 1st. Schedule: {link}",
          offer_details: {
            discount_type: "percentage",
            discount_value: 15,
            code: "FALL2024"
          }
        }
      };
      
      res.json({
        success: true,
        templates
      });
    } catch (err: any) {
      console.error("Error fetching templates:", err);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  // ==========================================
  // CUSTOMER WIN-BACK
  // ==========================================

  // GET /api/partners/:slug/winback
  router.get("/:slug/winback", async (req, res) => {
    const { slug } = req.params;
    
    try {
      const result = await pool.query(
        `SELECT 
           ws.*,
           (SELECT COUNT(*) FROM winback_sends wbs WHERE wbs.sequence_id = ws.id) as total_sends,
           (SELECT COUNT(*) FROM winback_sends wbs WHERE wbs.sequence_id = ws.id AND wbs.converted = true) as conversions
         FROM winback_sequences ws
         WHERE ws.partner_slug = $1
         ORDER BY ws.created_at DESC`,
        [slug]
      );
      
      res.json({
        success: true,
        sequences: result.rows,
        count: result.rows.length
      });
    } catch (err: any) {
      console.error("Error fetching winback sequences:", err);
      res.status(500).json({ error: "Failed to fetch winback sequences" });
    }
  });

  // POST /api/partners/:slug/winback
  const createWinbackSchema = z.object({
    name: z.string().min(1),
    days_inactive_trigger: z.number().min(30).max(365),
    email_template: z.string().optional(),
    sms_template: z.string().optional(),
    offer: z.object({
      discount_type: z.enum(['percentage', 'fixed']).optional(),
      discount_value: z.number().optional(),
      expires_days: z.number().optional(),
      code: z.string().optional()
    }).default({})
  });

  router.post("/:slug/winback", async (req, res) => {
    const { slug } = req.params;
    
    try {
      const validated = createWinbackSchema.parse(req.body);
      
      const result = await pool.query(
        `INSERT INTO winback_sequences 
         (partner_slug, name, days_inactive_trigger, email_template, sms_template, offer)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          slug,
          validated.name,
          validated.days_inactive_trigger,
          validated.email_template,
          validated.sms_template,
          JSON.stringify(validated.offer)
        ]
      );
      
      res.json({
        success: true,
        sequence: result.rows[0]
      });
    } catch (err: any) {
      if (err.name === "ZodError") {
        return res.status(400).json({ error: "Invalid request", details: err.errors });
      }
      console.error("Error creating winback sequence:", err);
      res.status(500).json({ error: "Failed to create winback sequence" });
    }
  });

  // PUT /api/partners/:slug/winback/:id
  router.put("/:slug/winback/:id", async (req, res) => {
    const { slug, id } = req.params;
    
    try {
      const validated = createWinbackSchema.partial().parse(req.body);
      const updateFields = Object.keys(validated).filter(key => validated[key as keyof typeof validated] !== undefined);
      
      if (updateFields.length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }
      
      const setClause = updateFields.map((field, index) => {
        if (field === 'offer') {
          return `offer = $${index + 3}`;
        }
        return `${field} = $${index + 3}`;
      }).join(", ");
      
      const values = updateFields.map(field => {
        const value = validated[field as keyof typeof validated];
        if (field === 'offer') {
          return JSON.stringify(value);
        }
        return value;
      });
      
      const result = await pool.query(
        `UPDATE winback_sequences 
         SET ${setClause}, updated_at = NOW()
         WHERE id = $1 AND partner_slug = $2
         RETURNING *`,
        [id, slug, ...values]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Winback sequence not found" });
      }
      
      res.json({
        success: true,
        sequence: result.rows[0]
      });
    } catch (err: any) {
      if (err.name === "ZodError") {
        return res.status(400).json({ error: "Invalid request", details: err.errors });
      }
      console.error("Error updating winback sequence:", err);
      res.status(500).json({ error: "Failed to update winback sequence" });
    }
  });

  // GET /api/partners/:slug/winback/dormant-customers
  router.get("/:slug/winback/dormant-customers", async (req, res) => {
    const { slug } = req.params;
    const { days = "180", limit = "50" } = req.query;
    
    try {
      const result = await pool.query(
        `SELECT 
           customer_name,
           customer_id,
           MAX(completed_at) as last_service,
           COUNT(*) as total_jobs,
           EXTRACT(DAYS FROM NOW() - MAX(completed_at)) as days_since_last_service
         FROM partner_jobs
         WHERE partner_slug = $1
         AND status = 'completed'
         AND completed_at IS NOT NULL
         GROUP BY customer_id, customer_name
         HAVING MAX(completed_at) < NOW() - INTERVAL '${parseInt(days.toString())} days'
         ORDER BY days_since_last_service DESC
         LIMIT $2`,
        [slug, limit]
      );
      
      res.json({
        success: true,
        dormantCustomers: result.rows,
        count: result.rows.length,
        criteria: {
          inactiveDays: parseInt(days.toString())
        }
      });
    } catch (err: any) {
      console.error("Error fetching dormant customers:", err);
      res.status(500).json({ error: "Failed to fetch dormant customers" });
    }
  });

  // POST /api/partners/:slug/winback/:id/trigger
  router.post("/:slug/winback/:id/trigger", async (req, res) => {
    const { slug, id } = req.params;
    const { customer_ids, test_mode = false } = req.body;
    
    try {
      // Get winback sequence
      const sequenceResult = await pool.query(
        `SELECT * FROM winback_sequences WHERE id = $1 AND partner_slug = $2`,
        [id, slug]
      );
      
      if (sequenceResult.rows.length === 0) {
        return res.status(404).json({ error: "Winback sequence not found" });
      }
      
      const sequence = sequenceResult.rows[0];
      
      if (sequence.status !== 'active') {
        return res.status(400).json({ error: "Sequence is not active" });
      }
      
      let targetCustomers = customer_ids || [];
      
      // If no specific customers provided, find dormant customers
      if (!customer_ids || customer_ids.length === 0) {
        const dormantResult = await pool.query(
          `SELECT DISTINCT customer_id
           FROM partner_jobs
           WHERE partner_slug = $1
           AND status = 'completed'
           AND completed_at IS NOT NULL
           GROUP BY customer_id
           HAVING MAX(completed_at) < NOW() - INTERVAL '${sequence.days_inactive_trigger} days'`,
          [slug]
        );
        targetCustomers = dormantResult.rows.map(row => row.customer_id);
      }
      
      // Create winback sends
      const sends = [];
      for (const customerId of targetCustomers) {
        // Email send
        if (sequence.email_template) {
          const emailResult = await pool.query(
            `INSERT INTO winback_sends (sequence_id, customer_id, channel, sent_at)
             VALUES ($1, $2, 'email', NOW())
             RETURNING *`,
            [id, customerId]
          );
          sends.push(emailResult.rows[0]);
        }
        
        // SMS send
        if (sequence.sms_template) {
          const smsResult = await pool.query(
            `INSERT INTO winback_sends (sequence_id, customer_id, channel, sent_at)
             VALUES ($1, $2, 'sms', NOW())
             RETURNING *`,
            [id, customerId]
          );
          sends.push(smsResult.rows[0]);
        }
      }
      
      res.json({
        success: true,
        triggered: true,
        test_mode,
        sends: sends.length,
        target_customers: targetCustomers.length
      });
    } catch (err: any) {
      console.error("Error triggering winback sequence:", err);
      res.status(500).json({ error: "Failed to trigger winback sequence" });
    }
  });

  app.use("/api/partners", router);
}