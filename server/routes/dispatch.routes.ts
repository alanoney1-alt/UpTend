/**
 * Dispatch System API Routes
 * 
 * Complete dispatch, tracking, and live GPS system for partner operations.
 * Features are tier-gated: starter, growth, scale.
 */

import { Router, type Express, type Request, type Response } from "express";
import { z } from "zod";
import { pool } from "../db";
import { canAccessFeature, requireFeature, getPartnerTier } from "../services/tier-gates";
import { autoDispatchJob } from "../services/auto-dispatch";
import { sendDispatchNotification } from "../services/dispatch-notifications";
import { calculatePartnerAnalytics } from "../services/partner-analytics";

// Validation schemas
const createJobSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerAddress: z.string().min(1),
  customerLat: z.number().optional(),
  customerLng: z.number().optional(),
  serviceType: z.string().min(1),
  description: z.string().optional(),
  scheduledDate: z.string().min(1), // ISO date string
  scheduledTimeStart: z.string().optional(), // HH:MM format
  scheduledTimeEnd: z.string().optional(),
});

const updateJobSchema = z.object({
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().optional(),
  customerAddress: z.string().optional(),
  serviceType: z.string().optional(),
  description: z.string().optional(),
  scheduledDate: z.string().optional(),
  scheduledTimeStart: z.string().optional(),
  scheduledTimeEnd: z.string().optional(),
  notes: z.string().optional(),
  invoiceAmount: z.number().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['scheduled', 'dispatched', 'en_route', 'arrived', 'in_progress', 'completed', 'cancelled']),
  note: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

const locationPingSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  heading: z.number().optional(),
  speed: z.number().optional(),
});

const assignProSchema = z.object({
  proId: z.string().min(1),
});

const reviewSchema = z.object({
  jobId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  reviewText: z.string().optional(),
  customerName: z.string().optional(),
});

export function registerDispatchRoutes(app: Express) {
  const router = Router();

  // ==========================================
  // PARTNER/OFFICE ENDPOINTS
  // ==========================================

  // GET /api/dispatch/:slug/jobs - List jobs with filters (all tiers)
  router.get("/:slug/jobs", async (req, res) => {
    const { slug } = req.params;
    const { status, date, proId, limit = 50, offset = 0 } = req.query;

    try {
      let query = `
        SELECT 
          dj.*,
          u_customer.first_name as customer_first_name,
          u_customer.last_name as customer_last_name,
          u_pro.first_name as pro_first_name,
          u_pro.last_name as pro_last_name
        FROM dispatch_jobs dj
        LEFT JOIN users u_customer ON dj.customer_id = u_customer.id
        LEFT JOIN users u_pro ON dj.assigned_pro_id = u_pro.id
        WHERE dj.partner_slug = $1
      `;
      const params: any[] = [slug];
      let paramIndex = 2;

      if (status) {
        query += ` AND dj.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (date) {
        query += ` AND dj.scheduled_date = $${paramIndex}`;
        params.push(date);
        paramIndex++;
      }

      if (proId) {
        query += ` AND dj.assigned_pro_id = $${paramIndex}`;
        params.push(proId);
        paramIndex++;
      }

      query += ` ORDER BY dj.scheduled_date DESC, dj.scheduled_time_start ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(parseInt(limit as string), parseInt(offset as string));

      const result = await pool.query(query, params);
      res.json({ success: true, jobs: result.rows, partnerSlug: slug });
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({ error: 'Failed to fetch jobs' });
    }
  });

  // POST /api/dispatch/:slug/jobs - Create job (all tiers)  
  router.post("/:slug/jobs", async (req, res) => {
    const { slug } = req.params;

    try {
      const validated = createJobSchema.parse(req.body);
      
      const result = await pool.query(`
        INSERT INTO dispatch_jobs (
          partner_slug, customer_name, customer_phone, customer_email,
          customer_address, customer_lat, customer_lng, service_type,
          description, scheduled_date, scheduled_time_start, scheduled_time_end
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        slug, validated.customerName, validated.customerPhone, validated.customerEmail,
        validated.customerAddress, validated.customerLat, validated.customerLng,
        validated.serviceType, validated.description, validated.scheduledDate,
        validated.scheduledTimeStart, validated.scheduledTimeEnd
      ]);

      const job = result.rows[0];

      // Create initial status update
      await pool.query(`
        INSERT INTO job_status_updates (job_id, status, note)
        VALUES ($1, 'scheduled', 'Job created')
      `, [job.id]);

      res.json({ success: true, job, partnerSlug: slug });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid request', details: error.errors });
      }
      console.error('Error creating job:', error);
      res.status(500).json({ error: 'Failed to create job' });
    }
  });

  // PUT /api/dispatch/:slug/jobs/:jobId - Update job (all tiers)
  router.put("/:slug/jobs/:jobId", async (req, res) => {
    const { slug, jobId } = req.params;

    try {
      const validated = updateJobSchema.parse(req.body);
      
      const updates: string[] = [];
      const params: any[] = [jobId, slug];
      let paramIndex = 3;

      Object.entries(validated).forEach(([key, value]) => {
        if (value !== undefined) {
          const dbKey = key === 'scheduledDate' ? 'scheduled_date' :
                       key === 'scheduledTimeStart' ? 'scheduled_time_start' :
                       key === 'scheduledTimeEnd' ? 'scheduled_time_end' :
                       key === 'customerName' ? 'customer_name' :
                       key === 'customerPhone' ? 'customer_phone' :
                       key === 'customerEmail' ? 'customer_email' :
                       key === 'customerAddress' ? 'customer_address' :
                       key === 'serviceType' ? 'service_type' :
                       key === 'invoiceAmount' ? 'invoice_amount' :
                       key;
          updates.push(`${dbKey} = $${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
      });

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updates.push(`updated_at = NOW()`);
      
      const result = await pool.query(`
        UPDATE dispatch_jobs 
        SET ${updates.join(', ')}
        WHERE id = $1 AND partner_slug = $2
        RETURNING *
      `, params);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json({ success: true, job: result.rows[0] });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid request', details: error.errors });
      }
      console.error('Error updating job:', error);
      res.status(500).json({ error: 'Failed to update job' });
    }
  });

  // DELETE /api/dispatch/:slug/jobs/:jobId - Cancel job (all tiers)
  router.delete("/:slug/jobs/:jobId", async (req, res) => {
    const { slug, jobId } = req.params;

    try {
      const result = await pool.query(`
        UPDATE dispatch_jobs 
        SET status = 'cancelled', updated_at = NOW()
        WHERE id = $1 AND partner_slug = $2 AND status NOT IN ('completed', 'cancelled')
        RETURNING *
      `, [jobId, slug]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Job not found or cannot be cancelled' });
      }

      // Create status update
      await pool.query(`
        INSERT INTO job_status_updates (job_id, status, note)
        VALUES ($1, 'cancelled', 'Job cancelled by office')
      `, [jobId]);

      res.json({ success: true, job: result.rows[0] });
    } catch (error: any) {
      console.error('Error cancelling job:', error);
      res.status(500).json({ error: 'Failed to cancel job' });
    }
  });

  // GET /api/dispatch/:slug/board - Dispatch board data (growth+)
  router.get("/:slug/board", requireFeature('live_dispatch_board'), async (req, res) => {
    const { slug } = req.params;

    try {
      // Get today's jobs
      const jobsResult = await pool.query(`
        SELECT 
          dj.*,
          u_customer.first_name as customer_first_name,
          u_customer.last_name as customer_last_name,
          u_pro.first_name as pro_first_name,
          u_pro.last_name as pro_last_name
        FROM dispatch_jobs dj
        LEFT JOIN users u_customer ON dj.customer_id = u_customer.id
        LEFT JOIN users u_pro ON dj.assigned_pro_id = u_pro.id
        WHERE dj.partner_slug = $1 AND dj.scheduled_date = CURRENT_DATE
        ORDER BY dj.scheduled_time_start ASC
      `, [slug]);

      // Get pro locations (last 5 minutes)
      const locationsResult = await pool.query(`
        SELECT DISTINCT ON (pl.pro_id)
          pl.*,
          u.first_name,
          u.last_name
        FROM pro_locations pl
        JOIN users u ON pl.pro_id = u.id
        WHERE pl.partner_slug = $1 
        AND pl.recorded_at > NOW() - INTERVAL '5 minutes'
        ORDER BY pl.pro_id, pl.recorded_at DESC
      `, [slug]);

      res.json({ 
        success: true, 
        jobs: jobsResult.rows,
        proLocations: locationsResult.rows,
        partnerSlug: slug 
      });
    } catch (error: any) {
      console.error('Error fetching dispatch board:', error);
      res.status(500).json({ error: 'Failed to fetch dispatch board' });
    }
  });

  // POST /api/dispatch/:slug/jobs/:jobId/assign - Assign pro to job
  router.post("/:slug/jobs/:jobId/assign", async (req, res) => {
    const { slug, jobId } = req.params;

    try {
      const validated = assignProSchema.parse(req.body);

      const result = await pool.query(`
        UPDATE dispatch_jobs 
        SET assigned_pro_id = $1, status = 'dispatched', updated_at = NOW()
        WHERE id = $2 AND partner_slug = $3 AND status = 'scheduled'
        RETURNING *
      `, [validated.proId, jobId, slug]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Job not found or already assigned' });
      }

      const job = result.rows[0];

      // Create status update
      await pool.query(`
        INSERT INTO job_status_updates (job_id, status, updated_by, note)
        VALUES ($1, 'dispatched', $2, 'Pro assigned by office')
      `, [jobId, validated.proId]);

      // Send notification to customer
      await sendDispatchNotification(job, 'dispatched');

      res.json({ success: true, job });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid request', details: error.errors });
      }
      console.error('Error assigning job:', error);
      res.status(500).json({ error: 'Failed to assign job' });
    }
  });

  // POST /api/dispatch/:slug/auto-dispatch - Auto-dispatch by location/skill (scale)
  router.post("/:slug/auto-dispatch", requireFeature('auto_dispatch'), async (req, res) => {
    const { slug } = req.params;
    const { jobId } = req.body;

    try {
      if (!jobId) {
        return res.status(400).json({ error: 'jobId required' });
      }

      const result = await autoDispatchJob(slug, jobId);
      res.json(result);
    } catch (error: any) {
      console.error('Error auto-dispatching job:', error);
      res.status(500).json({ error: 'Auto-dispatch failed' });
    }
  });

  // GET /api/dispatch/:slug/analytics - Performance dashboard (scale)
  router.get("/:slug/analytics", requireFeature('analytics_dashboard'), async (req, res) => {
    const { slug } = req.params;
    const { period = '30d' } = req.query;

    try {
      const analytics = await calculatePartnerAnalytics(slug, period as string);
      res.json({ success: true, analytics, partnerSlug: slug });
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  // GET /api/dispatch/:slug/reviews - Customer reviews (scale)
  router.get("/:slug/reviews", requireFeature('reviews_ratings'), async (req, res) => {
    const { slug } = req.params;
    const { proId, limit = 50, offset = 0 } = req.query;

    try {
      let query = `
        SELECT cr.*, dj.service_type, u.first_name as pro_first_name, u.last_name as pro_last_name
        FROM customer_reviews cr
        JOIN dispatch_jobs dj ON cr.job_id = dj.id
        JOIN users u ON cr.pro_id = u.id
        WHERE cr.partner_slug = $1
      `;
      const params = [slug];

      if (proId) {
        query += ` AND cr.pro_id = $2`;
        params.push(proId as string);
      }

      query += ` ORDER BY cr.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

      const result = await pool.query(query, params);
      res.json({ success: true, reviews: result.rows, partnerSlug: slug });
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  });

  // ==========================================
  // PRO ENDPOINTS (mobile-focused)
  // ==========================================

  // GET /api/dispatch/pro/my-jobs - Pro's jobs for today
  router.get("/pro/my-jobs", async (req, res) => {
    const userId = req.user?.id; // Assuming auth middleware sets this
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const result = await pool.query(`
        SELECT 
          dj.*,
          u_customer.first_name as customer_first_name,
          u_customer.last_name as customer_last_name,
          u_customer.phone as customer_phone_direct
        FROM dispatch_jobs dj
        LEFT JOIN users u_customer ON dj.customer_id = u_customer.id
        WHERE dj.assigned_pro_id = $1 
        AND dj.scheduled_date = CURRENT_DATE
        AND dj.status NOT IN ('cancelled', 'completed')
        ORDER BY dj.scheduled_time_start ASC
      `, [userId]);

      res.json({ success: true, jobs: result.rows });
    } catch (error: any) {
      console.error('Error fetching pro jobs:', error);
      res.status(500).json({ error: 'Failed to fetch jobs' });
    }
  });

  // PUT /api/dispatch/pro/jobs/:jobId/status - Update job status
  router.put("/pro/jobs/:jobId/status", async (req, res) => {
    const { jobId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const validated = updateStatusSchema.parse(req.body);

      const result = await pool.query(`
        UPDATE dispatch_jobs 
        SET status = $1, updated_at = NOW(),
            actual_arrival = CASE WHEN $1 = 'arrived' THEN NOW() ELSE actual_arrival END,
            actual_completion = CASE WHEN $1 = 'completed' THEN NOW() ELSE actual_completion END
        WHERE id = $2 AND assigned_pro_id = $3
        RETURNING *
      `, [validated.status, jobId, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Job not found or not assigned to you' });
      }

      const job = result.rows[0];

      // Create status update
      await pool.query(`
        INSERT INTO job_status_updates (job_id, status, updated_by, note, lat, lng)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [jobId, validated.status, userId, validated.note, validated.lat, validated.lng]);

      // Send notification to customer
      await sendDispatchNotification(job, validated.status);

      res.json({ success: true, job });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid request', details: error.errors });
      }
      console.error('Error updating job status:', error);
      res.status(500).json({ error: 'Failed to update job status' });
    }
  });

  // POST /api/dispatch/pro/location - GPS ping
  router.post("/pro/location", async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const validated = locationPingSchema.parse(req.body);

      // Get partner slug from current active job
      const jobResult = await pool.query(`
        SELECT partner_slug FROM dispatch_jobs 
        WHERE assigned_pro_id = $1 
        AND status IN ('dispatched', 'en_route', 'arrived', 'in_progress')
        AND scheduled_date = CURRENT_DATE
        LIMIT 1
      `, [userId]);

      const partnerSlug = jobResult.rows[0]?.partner_slug || 'default';

      await pool.query(`
        INSERT INTO pro_locations (pro_id, partner_slug, lat, lng, heading, speed)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [userId, partnerSlug, validated.lat, validated.lng, validated.heading, validated.speed]);

      res.json({ success: true });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid request', details: error.errors });
      }
      console.error('Error recording location:', error);
      res.status(500).json({ error: 'Failed to record location' });
    }
  });

  // ==========================================
  // CUSTOMER ENDPOINTS (tracking)
  // ==========================================

  // GET /api/dispatch/track/:jobId - Job tracking info
  router.get("/track/:jobId", async (req, res) => {
    const { jobId } = req.params;

    try {
      // Get job details
      const jobResult = await pool.query(`
        SELECT 
          dj.*,
          u_pro.first_name as pro_first_name,
          u_pro.last_name as pro_last_name,
          u_pro.profile_image_url as pro_avatar
        FROM dispatch_jobs dj
        LEFT JOIN users u_pro ON dj.assigned_pro_id = u_pro.id
        WHERE dj.id = $1
      `, [jobId]);

      if (jobResult.rows.length === 0) {
        return res.status(404).json({ error: 'Job not found' });
      }

      const job = jobResult.rows[0];

      // Get status timeline
      const timelineResult = await pool.query(`
        SELECT jsu.*, u.first_name, u.last_name
        FROM job_status_updates jsu
        LEFT JOIN users u ON jsu.updated_by = u.id
        WHERE jsu.job_id = $1
        ORDER BY jsu.created_at ASC
      `, [jobId]);

      // Get pro's current location (if growth+ and pro is en route)
      let proLocation = null;
      if (job.assigned_pro_id && job.status === 'en_route') {
        const hasGpsAccess = await canAccessFeature(job.partner_slug, 'pro_gps_tracking');
        if (hasGpsAccess) {
          const locationResult = await pool.query(`
            SELECT lat, lng, heading, speed, recorded_at
            FROM pro_locations
            WHERE pro_id = $1
            ORDER BY recorded_at DESC
            LIMIT 1
          `, [job.assigned_pro_id]);
          
          if (locationResult.rows.length > 0) {
            proLocation = locationResult.rows[0];
          }
        }
      }

      res.json({
        success: true,
        job,
        timeline: timelineResult.rows,
        proLocation,
        hasLiveTracking: proLocation !== null
      });
    } catch (error: any) {
      console.error('Error fetching job tracking:', error);
      res.status(500).json({ error: 'Failed to fetch job tracking' });
    }
  });

  // ==========================================
  // REVIEW ENDPOINTS
  // ==========================================

  // POST /api/dispatch/reviews - Submit review
  router.post("/reviews", async (req, res) => {
    try {
      const validated = reviewSchema.parse(req.body);

      // Get job and pro info
      const jobResult = await pool.query(`
        SELECT partner_slug, assigned_pro_id, customer_name
        FROM dispatch_jobs
        WHERE id = $1 AND status = 'completed'
      `, [validated.jobId]);

      if (jobResult.rows.length === 0) {
        return res.status(404).json({ error: 'Completed job not found' });
      }

      const job = jobResult.rows[0];

      await pool.query(`
        INSERT INTO customer_reviews (
          job_id, pro_id, partner_slug, customer_name, rating, review_text
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        validated.jobId,
        job.assigned_pro_id,
        job.partner_slug,
        validated.customerName || job.customer_name,
        validated.rating,
        validated.reviewText
      ]);

      res.json({ success: true });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid request', details: error.errors });
      }
      console.error('Error submitting review:', error);
      res.status(500).json({ error: 'Failed to submit review' });
    }
  });

  app.use("/api/dispatch", router);
}