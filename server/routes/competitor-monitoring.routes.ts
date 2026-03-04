/**
 * Competitor Monitoring Routes
 * 
 * Endpoints:
 * - GET /api/partners/:slug/competitors — list competitors
 * - POST /api/partners/:slug/competitors — add competitor to track
 * - DELETE /api/partners/:slug/competitors/:id — remove
 * - GET /api/partners/:slug/competitors/:id/history — rating/review trends over time
 * - GET /api/partners/:slug/competitors/overview — market position summary
 */

import { Router, type Express } from "express";
import { z } from "zod";
import { pool } from "../db";

export function registerCompetitorMonitoringRoutes(app: Express) {
  const router = Router();

  // ==========================================
  // GET /api/partners/:slug/competitors
  // ==========================================
  router.get("/:slug/competitors", async (req, res) => {
    const { slug } = req.params;
    const { limit = "20", offset = "0" } = req.query;
    
    try {
      const result = await pool.query(
        `SELECT 
           cp.*,
           (
             SELECT COUNT(*) FROM competitor_snapshots cs 
             WHERE cs.competitor_id = cp.id
           ) as snapshot_count,
           (
             SELECT cs.google_rating 
             FROM competitor_snapshots cs 
             WHERE cs.competitor_id = cp.id 
             ORDER BY cs.snapshot_date DESC 
             LIMIT 1
           ) as latest_rating,
           (
             SELECT cs.review_count 
             FROM competitor_snapshots cs 
             WHERE cs.competitor_id = cp.id 
             ORDER BY cs.snapshot_date DESC 
             LIMIT 1
           ) as latest_review_count
         FROM competitor_profiles cp
         WHERE cp.partner_slug = $1
         ORDER BY cp.updated_at DESC
         LIMIT $2 OFFSET $3`,
        [slug, limit, offset]
      );
      
      res.json({
        success: true,
        competitors: result.rows,
        count: result.rows.length
      });
    } catch (err: any) {
      console.error("Error fetching competitors:", err);
      res.status(500).json({ error: "Failed to fetch competitors" });
    }
  });

  // ==========================================
  // POST /api/partners/:slug/competitors
  // ==========================================
  const createCompetitorSchema = z.object({
    competitor_name: z.string().min(1),
    website: z.string().url().optional(),
    google_rating: z.number().min(0).max(5).optional(),
    review_count: z.number().min(0).optional(),
    services: z.array(z.string()).default([]),
    price_range: z.string().optional()
  });

  router.post("/:slug/competitors", async (req, res) => {
    const { slug } = req.params;
    
    try {
      const validated = createCompetitorSchema.parse(req.body);
      
      const result = await pool.query(
        `INSERT INTO competitor_profiles 
         (partner_slug, competitor_name, website, google_rating, review_count, services, price_range, last_checked)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING *`,
        [
          slug,
          validated.competitor_name,
          validated.website,
          validated.google_rating,
          validated.review_count,
          validated.services,
          validated.price_range
        ]
      );
      
      // Create initial snapshot
      if (validated.google_rating || validated.review_count) {
        await pool.query(
          `INSERT INTO competitor_snapshots 
           (competitor_id, google_rating, review_count, snapshot_date)
           VALUES ($1, $2, $3, NOW())`,
          [result.rows[0].id, validated.google_rating, validated.review_count]
        );
      }
      
      res.json({
        success: true,
        competitor: result.rows[0]
      });
    } catch (err: any) {
      if (err.name === "ZodError") {
        return res.status(400).json({ error: "Invalid request", details: err.errors });
      }
      console.error("Error creating competitor:", err);
      res.status(500).json({ error: "Failed to create competitor" });
    }
  });

  // ==========================================
  // DELETE /api/partners/:slug/competitors/:id
  // ==========================================
  router.delete("/:slug/competitors/:id", async (req, res) => {
    const { slug, id } = req.params;
    
    try {
      const result = await pool.query(
        `DELETE FROM competitor_profiles 
         WHERE id = $1 AND partner_slug = $2
         RETURNING *`,
        [id, slug]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Competitor not found" });
      }
      
      res.json({
        success: true,
        deleted: result.rows[0]
      });
    } catch (err: any) {
      console.error("Error deleting competitor:", err);
      res.status(500).json({ error: "Failed to delete competitor" });
    }
  });

  // ==========================================
  // GET /api/partners/:slug/competitors/:id/history
  // ==========================================
  router.get("/:slug/competitors/:id/history", async (req, res) => {
    const { slug, id } = req.params;
    const { days = "90" } = req.query;
    
    try {
      // Verify competitor belongs to partner
      const competitorResult = await pool.query(
        `SELECT * FROM competitor_profiles WHERE id = $1 AND partner_slug = $2`,
        [id, slug]
      );
      
      if (competitorResult.rows.length === 0) {
        return res.status(404).json({ error: "Competitor not found" });
      }
      
      // Get historical snapshots
      const historyResult = await pool.query(
        `SELECT 
           snapshot_date,
           google_rating,
           review_count,
           ad_detected,
           ranking_position,
           notes
         FROM competitor_snapshots 
         WHERE competitor_id = $1 
         AND snapshot_date >= NOW() - INTERVAL '${parseInt(days.toString())} days'
         ORDER BY snapshot_date ASC`,
        [id]
      );
      
      // Calculate trends
      const snapshots = historyResult.rows;
      let ratingTrend = 'stable';
      let reviewTrend = 'stable';
      
      if (snapshots.length >= 2) {
        const first = snapshots[0];
        const last = snapshots[snapshots.length - 1];
        
        if (last.google_rating > first.google_rating) ratingTrend = 'improving';
        else if (last.google_rating < first.google_rating) ratingTrend = 'declining';
        
        if (last.review_count > first.review_count) reviewTrend = 'growing';
        else if (last.review_count < first.review_count) reviewTrend = 'declining';
      }
      
      res.json({
        success: true,
        competitor: competitorResult.rows[0],
        history: {
          snapshots: historyResult.rows,
          trends: {
            rating: ratingTrend,
            reviews: reviewTrend
          },
          dataPoints: historyResult.rows.length
        }
      });
    } catch (err: any) {
      console.error("Error fetching competitor history:", err);
      res.status(500).json({ error: "Failed to fetch competitor history" });
    }
  });

  // ==========================================
  // GET /api/partners/:slug/competitors/overview
  // ==========================================
  router.get("/:slug/competitors/overview", async (req, res) => {
    const { slug } = req.params;
    
    try {
      // Get partner's own rating for comparison
      const partnerRating = await pool.query(
        `SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as review_count
         FROM partner_reviews WHERE partner_slug = $1 AND received_at IS NOT NULL`,
        [slug]
      );
      
      // Get competitors with latest data
      const competitorsResult = await pool.query(
        `SELECT 
           cp.*,
           COALESCE(latest.google_rating, cp.google_rating) as current_rating,
           COALESCE(latest.review_count, cp.review_count) as current_review_count
         FROM competitor_profiles cp
         LEFT JOIN (
           SELECT DISTINCT ON (competitor_id) 
             competitor_id, google_rating, review_count, snapshot_date
           FROM competitor_snapshots
           ORDER BY competitor_id, snapshot_date DESC
         ) latest ON cp.id = latest.competitor_id
         WHERE cp.partner_slug = $1
         ORDER BY current_rating DESC NULLS LAST`,
        [slug]
      );
      
      // Calculate market position
      const competitors = competitorsResult.rows;
      const partnerAvgRating = parseFloat(partnerRating.rows[0].avg_rating);
      const partnerReviewCount = parseInt(partnerRating.rows[0].review_count);
      
      const ratingsAbove = competitors.filter(c => c.current_rating > partnerAvgRating).length;
      const ratingsBelow = competitors.filter(c => c.current_rating < partnerAvgRating).length;
      
      const reviewsAbove = competitors.filter(c => c.current_review_count > partnerReviewCount).length;
      const reviewsBelow = competitors.filter(c => c.current_review_count < partnerReviewCount).length;
      
      // Market insights
      const avgCompetitorRating = competitors.length > 0
        ? competitors.reduce((sum, c) => sum + (c.current_rating || 0), 0) / competitors.length
        : 0;
      
      const avgCompetitorReviews = competitors.length > 0
        ? competitors.reduce((sum, c) => sum + (c.current_review_count || 0), 0) / competitors.length
        : 0;
      
      // Recent activity (last 30 days)
      const recentActivityResult = await pool.query(
        `SELECT 
           cp.competitor_name,
           cs.snapshot_date,
           cs.google_rating,
           cs.review_count,
           cs.ad_detected
         FROM competitor_snapshots cs
         JOIN competitor_profiles cp ON cs.competitor_id = cp.id
         WHERE cp.partner_slug = $1
         AND cs.snapshot_date >= NOW() - INTERVAL '30 days'
         ORDER BY cs.snapshot_date DESC
         LIMIT 10`,
        [slug]
      );
      
      res.json({
        success: true,
        overview: {
          partnerStats: {
            rating: parseFloat(partnerAvgRating.toFixed(1)),
            reviewCount: partnerReviewCount
          },
          marketPosition: {
            ratingsAbove,
            ratingsBelow,
            reviewsAbove,
            reviewsBelow,
            totalCompetitors: competitors.length
          },
          marketAverages: {
            rating: parseFloat(avgCompetitorRating.toFixed(1)),
            reviewCount: Math.round(avgCompetitorReviews)
          },
          competitors: competitors,
          recentActivity: recentActivityResult.rows,
          insights: {
            ratingAdvantage: partnerAvgRating > avgCompetitorRating,
            reviewAdvantage: partnerReviewCount > avgCompetitorReviews,
            marketLeader: ratingsAbove === 0 && reviewsAbove === 0
          }
        }
      });
    } catch (err: any) {
      console.error("Error fetching competitor overview:", err);
      res.status(500).json({ error: "Failed to fetch competitor overview" });
    }
  });

  // ==========================================
  // PUT /api/partners/:slug/competitors/:id
  // ==========================================
  const updateCompetitorSchema = z.object({
    competitor_name: z.string().min(1).optional(),
    website: z.string().url().optional(),
    google_rating: z.number().min(0).max(5).optional(),
    review_count: z.number().min(0).optional(),
    services: z.array(z.string()).optional(),
    price_range: z.string().optional()
  });

  router.put("/:slug/competitors/:id", async (req, res) => {
    const { slug, id } = req.params;
    
    try {
      const validated = updateCompetitorSchema.parse(req.body);
      const updateFields = Object.keys(validated).filter(key => validated[key as keyof typeof validated] !== undefined);
      
      if (updateFields.length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }
      
      const setClause = updateFields.map((field, index) => {
        if (field === 'services') {
          return `services = $${index + 3}`;
        }
        return `${field} = $${index + 3}`;
      }).join(", ");
      
      const values = updateFields.map(field => validated[field as keyof typeof validated]);
      
      const result = await pool.query(
        `UPDATE competitor_profiles 
         SET ${setClause}, updated_at = NOW(), last_checked = NOW()
         WHERE id = $1 AND partner_slug = $2 
         RETURNING *`,
        [id, slug, ...values]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Competitor not found" });
      }
      
      // Create new snapshot if rating or review count updated
      if (validated.google_rating || validated.review_count) {
        await pool.query(
          `INSERT INTO competitor_snapshots 
           (competitor_id, google_rating, review_count, snapshot_date)
           VALUES ($1, $2, $3, NOW())`,
          [id, validated.google_rating, validated.review_count]
        );
      }
      
      res.json({
        success: true,
        competitor: result.rows[0]
      });
    } catch (err: any) {
      if (err.name === "ZodError") {
        return res.status(400).json({ error: "Invalid request", details: err.errors });
      }
      console.error("Error updating competitor:", err);
      res.status(500).json({ error: "Failed to update competitor" });
    }
  });

  // ==========================================
  // POST /api/partners/:slug/competitors/:id/snapshot
  // ==========================================
  const createSnapshotSchema = z.object({
    google_rating: z.number().min(0).max(5).optional(),
    review_count: z.number().min(0).optional(),
    ad_detected: z.boolean().default(false),
    ranking_position: z.number().min(1).optional(),
    notes: z.string().optional()
  });

  router.post("/:slug/competitors/:id/snapshot", async (req, res) => {
    const { slug, id } = req.params;
    
    try {
      // Verify competitor belongs to partner
      const competitorResult = await pool.query(
        `SELECT * FROM competitor_profiles WHERE id = $1 AND partner_slug = $2`,
        [id, slug]
      );
      
      if (competitorResult.rows.length === 0) {
        return res.status(404).json({ error: "Competitor not found" });
      }
      
      const validated = createSnapshotSchema.parse(req.body);
      
      const result = await pool.query(
        `INSERT INTO competitor_snapshots 
         (competitor_id, google_rating, review_count, ad_detected, ranking_position, notes, snapshot_date)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *`,
        [
          id,
          validated.google_rating,
          validated.review_count,
          validated.ad_detected,
          validated.ranking_position,
          validated.notes
        ]
      );
      
      // Update competitor's last_checked timestamp
      await pool.query(
        `UPDATE competitor_profiles SET last_checked = NOW() WHERE id = $1`,
        [id]
      );
      
      res.json({
        success: true,
        snapshot: result.rows[0]
      });
    } catch (err: any) {
      if (err.name === "ZodError") {
        return res.status(400).json({ error: "Invalid request", details: err.errors });
      }
      console.error("Error creating snapshot:", err);
      res.status(500).json({ error: "Failed to create snapshot" });
    }
  });

  app.use("/api/partners", router);
}