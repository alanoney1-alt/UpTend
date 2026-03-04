/**
 * Call Tracking + Attribution Routes
 * 
 * Endpoints:
 * - GET /api/partners/:slug/calls — call log with source attribution
 * - GET /api/partners/:slug/calls/stats — calls by source, conversion rates, avg duration
 * - POST /api/partners/:slug/calls/log — log a call (webhook from Twilio)
 * - GET /api/partners/:slug/calls/attribution — marketing ROI by channel
 */

import { Router, type Express } from "express";
import { z } from "zod";
import { pool } from "../db";

export function registerCallTrackingRoutes(app: Express) {
  const router = Router();

  // ==========================================
  // GET /api/partners/:slug/calls
  // ==========================================
  router.get("/:slug/calls", async (req, res) => {
    const { slug } = req.params;
    const { 
      source, 
      limit = "50", 
      offset = "0", 
      start_date, 
      end_date 
    } = req.query;
    
    try {
      let whereClause = `WHERE ctn.partner_slug = $1`;
      const params = [slug];
      
      if (source && typeof source === 'string') {
        whereClause += ` AND cl.source = $${params.length + 1}`;
        params.push(source);
      }
      
      if (start_date && typeof start_date === 'string') {
        whereClause += ` AND cl.timestamp >= $${params.length + 1}`;
        params.push(start_date);
      }
      
      if (end_date && typeof end_date === 'string') {
        whereClause += ` AND cl.timestamp <= $${params.length + 1}`;
        params.push(end_date);
      }
      
      const result = await pool.query(
        `SELECT 
           cl.*,
           ctn.phone_number,
           ctn.source as tracking_source,
           ctn.forwarding_number
         FROM call_logs cl
         JOIN call_tracking_numbers ctn ON cl.tracking_number_id = ctn.id
         ${whereClause}
         ORDER BY cl.timestamp DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      );
      
      res.json({
        success: true,
        calls: result.rows,
        count: result.rows.length
      });
    } catch (err: any) {
      console.error("Error fetching call logs:", err);
      res.status(500).json({ error: "Failed to fetch call logs" });
    }
  });

  // ==========================================
  // GET /api/partners/:slug/calls/stats
  // ==========================================
  router.get("/:slug/calls/stats", async (req, res) => {
    const { slug } = req.params;
    const { start_date, end_date } = req.query;
    
    try {
      let whereClause = `WHERE ctn.partner_slug = $1`;
      const params = [slug];
      
      if (start_date && typeof start_date === 'string') {
        whereClause += ` AND cl.timestamp >= $${params.length + 1}`;
        params.push(start_date);
      }
      
      if (end_date && typeof end_date === 'string') {
        whereClause += ` AND cl.timestamp <= $${params.length + 1}`;
        params.push(end_date);
      }
      
      // Calls by source
      const sourceStatsResult = await pool.query(
        `SELECT 
           cl.source,
           COUNT(*) as total_calls,
           COUNT(CASE WHEN cl.converted_to_lead = true THEN 1 END) as conversions,
           ROUND(AVG(cl.duration_seconds), 2) as avg_duration,
           ROUND(
             COUNT(CASE WHEN cl.converted_to_lead = true THEN 1 END) * 100.0 / COUNT(*), 
             2
           ) as conversion_rate
         FROM call_logs cl
         JOIN call_tracking_numbers ctn ON cl.tracking_number_id = ctn.id
         ${whereClause}
         GROUP BY cl.source
         ORDER BY total_calls DESC`,
        params
      );
      
      // Overall stats
      const overallStatsResult = await pool.query(
        `SELECT 
           COUNT(*) as total_calls,
           COUNT(CASE WHEN cl.converted_to_lead = true THEN 1 END) as total_conversions,
           ROUND(AVG(cl.duration_seconds), 2) as avg_duration,
           ROUND(
             COUNT(CASE WHEN cl.converted_to_lead = true THEN 1 END) * 100.0 / COUNT(*), 
             2
           ) as overall_conversion_rate
         FROM call_logs cl
         JOIN call_tracking_numbers ctn ON cl.tracking_number_id = ctn.id
         ${whereClause}`,
        params
      );
      
      // Daily call volume (last 30 days)
      const dailyVolumeResult = await pool.query(
        `SELECT 
           DATE(cl.timestamp) as call_date,
           COUNT(*) as calls,
           COUNT(CASE WHEN cl.converted_to_lead = true THEN 1 END) as conversions
         FROM call_logs cl
         JOIN call_tracking_numbers ctn ON cl.tracking_number_id = ctn.id
         ${whereClause}
         AND cl.timestamp >= NOW() - INTERVAL '30 days'
         GROUP BY DATE(cl.timestamp)
         ORDER BY call_date DESC`,
        params
      );
      
      res.json({
        success: true,
        stats: {
          bySource: sourceStatsResult.rows,
          overall: overallStatsResult.rows[0] || {
            total_calls: 0,
            total_conversions: 0,
            avg_duration: 0,
            overall_conversion_rate: 0
          },
          dailyVolume: dailyVolumeResult.rows
        }
      });
    } catch (err: any) {
      console.error("Error fetching call stats:", err);
      res.status(500).json({ error: "Failed to fetch call stats" });
    }
  });

  // ==========================================
  // POST /api/partners/:slug/calls/log
  // ==========================================
  const logCallSchema = z.object({
    tracking_number_id: z.number(),
    caller_phone: z.string(),
    duration_seconds: z.number().min(0),
    recording_url: z.string().optional(),
    source: z.string(),
    converted_to_lead: z.boolean().default(false),
    lead_id: z.number().optional()
  });

  router.post("/:slug/calls/log", async (req, res) => {
    const { slug } = req.params;
    
    try {
      const validated = logCallSchema.parse(req.body);
      
      // Verify tracking number belongs to partner
      const trackingNumberResult = await pool.query(
        `SELECT * FROM call_tracking_numbers 
         WHERE id = $1 AND partner_slug = $2`,
        [validated.tracking_number_id, slug]
      );
      
      if (trackingNumberResult.rows.length === 0) {
        return res.status(404).json({ error: "Tracking number not found" });
      }
      
      const result = await pool.query(
        `INSERT INTO call_logs 
         (tracking_number_id, caller_phone, duration_seconds, recording_url, source, converted_to_lead, lead_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          validated.tracking_number_id,
          validated.caller_phone,
          validated.duration_seconds,
          validated.recording_url,
          validated.source,
          validated.converted_to_lead,
          validated.lead_id
        ]
      );
      
      res.json({
        success: true,
        call_log: result.rows[0]
      });
    } catch (err: any) {
      if (err.name === "ZodError") {
        return res.status(400).json({ error: "Invalid request", details: err.errors });
      }
      console.error("Error logging call:", err);
      res.status(500).json({ error: "Failed to log call" });
    }
  });

  // ==========================================
  // GET /api/partners/:slug/calls/attribution
  // ==========================================
  router.get("/:slug/calls/attribution", async (req, res) => {
    const { slug } = req.params;
    const { start_date, end_date } = req.query;
    
    try {
      let whereClause = `WHERE ctn.partner_slug = $1`;
      const params = [slug];
      
      if (start_date && typeof start_date === 'string') {
        whereClause += ` AND cl.timestamp >= $${params.length + 1}`;
        params.push(start_date);
      }
      
      if (end_date && typeof end_date === 'string') {
        whereClause += ` AND cl.timestamp <= $${params.length + 1}`;
        params.push(end_date);
      }
      
      // Marketing ROI by channel
      const attributionResult = await pool.query(
        `SELECT 
           cl.source,
           COUNT(*) as total_calls,
           COUNT(CASE WHEN cl.converted_to_lead = true THEN 1 END) as leads_generated,
           ROUND(
             COUNT(CASE WHEN cl.converted_to_lead = true THEN 1 END) * 100.0 / COUNT(*), 
             2
           ) as lead_conversion_rate,
           -- Estimated revenue (assuming average job value)
           COUNT(CASE WHEN cl.converted_to_lead = true THEN 1 END) * 250 as estimated_revenue
         FROM call_logs cl
         JOIN call_tracking_numbers ctn ON cl.tracking_number_id = ctn.id
         ${whereClause}
         GROUP BY cl.source
         ORDER BY leads_generated DESC`,
        params
      );
      
      // Call quality metrics by source
      const qualityMetricsResult = await pool.query(
        `SELECT 
           cl.source,
           ROUND(AVG(cl.duration_seconds), 2) as avg_call_duration,
           COUNT(CASE WHEN cl.duration_seconds >= 60 THEN 1 END) as quality_calls,
           ROUND(
             COUNT(CASE WHEN cl.duration_seconds >= 60 THEN 1 END) * 100.0 / COUNT(*), 
             2
           ) as quality_call_rate
         FROM call_logs cl
         JOIN call_tracking_numbers ctn ON cl.tracking_number_id = ctn.id
         ${whereClause}
         GROUP BY cl.source
         ORDER BY quality_call_rate DESC`,
        params
      );
      
      // Peak calling hours
      const peakHoursResult = await pool.query(
        `SELECT 
           EXTRACT(HOUR FROM cl.timestamp) as call_hour,
           COUNT(*) as call_count,
           cl.source
         FROM call_logs cl
         JOIN call_tracking_numbers ctn ON cl.tracking_number_id = ctn.id
         ${whereClause}
         GROUP BY EXTRACT(HOUR FROM cl.timestamp), cl.source
         ORDER BY call_hour, cl.source`,
        params
      );
      
      res.json({
        success: true,
        attribution: {
          bySource: attributionResult.rows,
          qualityMetrics: qualityMetricsResult.rows,
          peakHours: peakHoursResult.rows
        }
      });
    } catch (err: any) {
      console.error("Error fetching call attribution:", err);
      res.status(500).json({ error: "Failed to fetch call attribution" });
    }
  });

  // ==========================================
  // GET /api/partners/:slug/calls/tracking-numbers
  // ==========================================
  router.get("/:slug/calls/tracking-numbers", async (req, res) => {
    const { slug } = req.params;
    
    try {
      const result = await pool.query(
        `SELECT * FROM call_tracking_numbers WHERE partner_slug = $1 ORDER BY source`,
        [slug]
      );
      
      res.json({
        success: true,
        trackingNumbers: result.rows,
        count: result.rows.length
      });
    } catch (err: any) {
      console.error("Error fetching tracking numbers:", err);
      res.status(500).json({ error: "Failed to fetch tracking numbers" });
    }
  });

  // ==========================================
  // POST /api/partners/:slug/calls/tracking-numbers
  // ==========================================
  const createTrackingNumberSchema = z.object({
    phone_number: z.string().min(1),
    source: z.enum(['google_seo', 'facebook', 'instagram', 'direct', 'referral', 'hoa']),
    forwarding_number: z.string().min(1)
  });

  router.post("/:slug/calls/tracking-numbers", async (req, res) => {
    const { slug } = req.params;
    
    try {
      const validated = createTrackingNumberSchema.parse(req.body);
      
      const result = await pool.query(
        `INSERT INTO call_tracking_numbers (partner_slug, phone_number, source, forwarding_number)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [slug, validated.phone_number, validated.source, validated.forwarding_number]
      );
      
      res.json({
        success: true,
        trackingNumber: result.rows[0]
      });
    } catch (err: any) {
      if (err.name === "ZodError") {
        return res.status(400).json({ error: "Invalid request", details: err.errors });
      }
      console.error("Error creating tracking number:", err);
      res.status(500).json({ error: "Failed to create tracking number" });
    }
  });

  // ==========================================
  // PUT /api/partners/:slug/calls/:callId/convert
  // ==========================================
  router.put("/:slug/calls/:callId/convert", async (req, res) => {
    const { slug, callId } = req.params;
    const { lead_id } = req.body;
    
    try {
      const result = await pool.query(
        `UPDATE call_logs 
         SET converted_to_lead = true, lead_id = $3
         FROM call_tracking_numbers ctn
         WHERE call_logs.tracking_number_id = ctn.id
         AND call_logs.id = $1 
         AND ctn.partner_slug = $2
         RETURNING call_logs.*`,
        [callId, slug, lead_id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Call not found" });
      }
      
      res.json({
        success: true,
        call_log: result.rows[0]
      });
    } catch (err: any) {
      console.error("Error converting call to lead:", err);
      res.status(500).json({ error: "Failed to convert call to lead" });
    }
  });

  app.use("/api/partners", router);
}