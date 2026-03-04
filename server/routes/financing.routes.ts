/**
 * Financing Integration Routes
 * 
 * Endpoints:
 * - GET /api/partners/:slug/financing/providers — configured providers
 * - POST /api/partners/:slug/financing/providers — setup provider
 * - POST /api/partners/:slug/financing/apply — create financing application for customer
 * - GET /api/partners/:slug/financing/applications — list applications
 * - GET /api/financing/my-applications — customer views their applications
 */

import { Router, type Express } from "express";
import { z } from "zod";
import { pool } from "../db";
import crypto from "crypto";

// Simple encryption for API keys (in production, use proper key management)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "your-32-char-secret-key-here!!";

function encrypt(text: string): string {
  const cipher = crypto.createCipher('aes192', ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encrypted: string): string {
  const decipher = crypto.createDecipher('aes192', ENCRYPTION_KEY);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function registerFinancingRoutes(app: Express) {
  const router = Router();

  // ==========================================
  // GET /api/partners/:slug/financing/providers
  // ==========================================
  router.get("/:slug/financing/providers", async (req, res) => {
    const { slug } = req.params;
    
    try {
      const result = await pool.query(
        `SELECT id, partner_slug, provider, enabled, min_amount, max_amount, created_at, updated_at
         FROM financing_providers 
         WHERE partner_slug = $1 
         ORDER BY provider`,
        [slug]
      );
      
      res.json({
        success: true,
        providers: result.rows,
        count: result.rows.length
      });
    } catch (err: any) {
      console.error("Error fetching financing providers:", err);
      res.status(500).json({ error: "Failed to fetch financing providers" });
    }
  });

  // ==========================================
  // POST /api/partners/:slug/financing/providers
  // ==========================================
  const setupProviderSchema = z.object({
    provider: z.enum(['greenskywisetack', 'synchrony']),
    api_key: z.string().min(1),
    enabled: z.boolean().default(true),
    min_amount: z.number().min(0).default(0),
    max_amount: z.number().min(1000).default(50000)
  });

  router.post("/:slug/financing/providers", async (req, res) => {
    const { slug } = req.params;
    
    try {
      const validated = setupProviderSchema.parse(req.body);
      
      // Encrypt the API key
      const encryptedApiKey = encrypt(validated.api_key);
      
      // Check if provider already exists for this partner
      const existingResult = await pool.query(
        `SELECT id FROM financing_providers WHERE partner_slug = $1 AND provider = $2`,
        [slug, validated.provider]
      );
      
      let result;
      if (existingResult.rows.length > 0) {
        // Update existing provider
        result = await pool.query(
          `UPDATE financing_providers 
           SET api_key_encrypted = $3, enabled = $4, min_amount = $5, max_amount = $6, updated_at = NOW()
           WHERE partner_slug = $1 AND provider = $2
           RETURNING id, partner_slug, provider, enabled, min_amount, max_amount, created_at, updated_at`,
          [slug, validated.provider, encryptedApiKey, validated.enabled, validated.min_amount, validated.max_amount]
        );
      } else {
        // Create new provider
        result = await pool.query(
          `INSERT INTO financing_providers 
           (partner_slug, provider, api_key_encrypted, enabled, min_amount, max_amount)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, partner_slug, provider, enabled, min_amount, max_amount, created_at, updated_at`,
          [slug, validated.provider, encryptedApiKey, validated.enabled, validated.min_amount, validated.max_amount]
        );
      }
      
      res.json({
        success: true,
        provider: result.rows[0]
      });
    } catch (err: any) {
      if (err.name === "ZodError") {
        return res.status(400).json({ error: "Invalid request", details: err.errors });
      }
      console.error("Error setting up financing provider:", err);
      res.status(500).json({ error: "Failed to setup financing provider" });
    }
  });

  // ==========================================
  // POST /api/partners/:slug/financing/apply
  // ==========================================
  const applyFinancingSchema = z.object({
    customer_id: z.string(),
    job_id: z.string().optional(),
    amount: z.number().min(100),
    provider: z.enum(['greenskywisetack', 'synchrony']),
    customer_info: z.object({
      name: z.string(),
      email: z.string().email(),
      phone: z.string(),
      address: z.string().optional(),
      ssn_last4: z.string().length(4).optional()
    })
  });

  router.post("/:slug/financing/apply", async (req, res) => {
    const { slug } = req.params;
    
    try {
      const validated = applyFinancingSchema.parse(req.body);
      
      // Check if provider is configured and enabled
      const providerResult = await pool.query(
        `SELECT * FROM financing_providers 
         WHERE partner_slug = $1 AND provider = $2 AND enabled = true`,
        [slug, validated.provider]
      );
      
      if (providerResult.rows.length === 0) {
        return res.status(400).json({ error: "Financing provider not configured or disabled" });
      }
      
      const provider = providerResult.rows[0];
      
      // Check amount limits
      if (validated.amount < provider.min_amount || validated.amount > provider.max_amount) {
        return res.status(400).json({ 
          error: `Amount must be between $${provider.min_amount} and $${provider.max_amount}` 
        });
      }
      
      // In a real implementation, you would integrate with the actual financing provider's API
      // For now, we'll simulate the application process
      const applicationUrl = `https://apply.${validated.provider}.com/application/${Date.now()}`;
      
      // Create financing application record
      const result = await pool.query(
        `INSERT INTO financing_applications 
         (partner_slug, customer_id, job_id, amount, provider, status, application_url)
         VALUES ($1, $2, $3, $4, $5, 'pending', $6)
         RETURNING *`,
        [slug, validated.customer_id, validated.job_id, validated.amount, validated.provider, applicationUrl]
      );
      
      res.json({
        success: true,
        application: {
          ...result.rows[0],
          application_url: applicationUrl,
          estimated_monthly_payment: Math.round(validated.amount / 24) // Rough estimate for 24-month term
        }
      });
    } catch (err: any) {
      if (err.name === "ZodError") {
        return res.status(400).json({ error: "Invalid request", details: err.errors });
      }
      console.error("Error creating financing application:", err);
      res.status(500).json({ error: "Failed to create financing application" });
    }
  });

  // ==========================================
  // GET /api/partners/:slug/financing/applications
  // ==========================================
  router.get("/:slug/financing/applications", async (req, res) => {
    const { slug } = req.params;
    const { 
      status, 
      provider, 
      limit = "50", 
      offset = "0",
      start_date,
      end_date 
    } = req.query;
    
    try {
      let whereClause = `WHERE partner_slug = $1`;
      const params = [slug];
      
      if (status && typeof status === 'string') {
        whereClause += ` AND status = $${params.length + 1}`;
        params.push(status);
      }
      
      if (provider && typeof provider === 'string') {
        whereClause += ` AND provider = $${params.length + 1}`;
        params.push(provider);
      }
      
      if (start_date && typeof start_date === 'string') {
        whereClause += ` AND created_at >= $${params.length + 1}`;
        params.push(start_date);
      }
      
      if (end_date && typeof end_date === 'string') {
        whereClause += ` AND created_at <= $${params.length + 1}`;
        params.push(end_date);
      }
      
      const result = await pool.query(
        `SELECT * FROM financing_applications 
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      );
      
      // Get summary stats
      const statsResult = await pool.query(
        `SELECT 
           status,
           COUNT(*) as count,
           COALESCE(SUM(amount), 0) as total_amount
         FROM financing_applications
         WHERE partner_slug = $1
         GROUP BY status`,
        [slug]
      );
      
      res.json({
        success: true,
        applications: result.rows,
        count: result.rows.length,
        stats: statsResult.rows
      });
    } catch (err: any) {
      console.error("Error fetching financing applications:", err);
      res.status(500).json({ error: "Failed to fetch financing applications" });
    }
  });

  // ==========================================
  // GET /api/financing/my-applications (customer view)
  // ==========================================
  router.get("/my-applications", async (req, res) => {
    const customerId = req.headers["x-customer-id"] as string;
    
    if (!customerId) {
      return res.status(401).json({ error: "Customer ID required" });
    }
    
    try {
      const result = await pool.query(
        `SELECT 
           fa.*,
           fp.provider as provider_name
         FROM financing_applications fa
         LEFT JOIN financing_providers fp ON fa.partner_slug = fp.partner_slug AND fa.provider = fp.provider
         WHERE fa.customer_id = $1
         ORDER BY fa.created_at DESC`,
        [customerId]
      );
      
      res.json({
        success: true,
        applications: result.rows,
        count: result.rows.length
      });
    } catch (err: any) {
      console.error("Error fetching customer financing applications:", err);
      res.status(500).json({ error: "Failed to fetch financing applications" });
    }
  });

  // ==========================================
  // PUT /api/partners/:slug/financing/applications/:id/status
  // ==========================================
  const updateStatusSchema = z.object({
    status: z.enum(['pending', 'approved', 'denied', 'funded']),
    notes: z.string().optional()
  });

  router.put("/:slug/financing/applications/:id/status", async (req, res) => {
    const { slug, id } = req.params;
    
    try {
      const validated = updateStatusSchema.parse(req.body);
      
      const result = await pool.query(
        `UPDATE financing_applications 
         SET status = $3, updated_at = NOW()
         WHERE id = $1 AND partner_slug = $2
         RETURNING *`,
        [id, slug, validated.status]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Application not found" });
      }
      
      res.json({
        success: true,
        application: result.rows[0]
      });
    } catch (err: any) {
      if (err.name === "ZodError") {
        return res.status(400).json({ error: "Invalid request", details: err.errors });
      }
      console.error("Error updating application status:", err);
      res.status(500).json({ error: "Failed to update application status" });
    }
  });

  // ==========================================
  // GET /api/partners/:slug/financing/stats
  // ==========================================
  router.get("/:slug/financing/stats", async (req, res) => {
    const { slug } = req.params;
    const { start_date, end_date } = req.query;
    
    try {
      let whereClause = `WHERE partner_slug = $1`;
      const params = [slug];
      
      if (start_date && typeof start_date === 'string') {
        whereClause += ` AND created_at >= $${params.length + 1}`;
        params.push(start_date);
      }
      
      if (end_date && typeof end_date === 'string') {
        whereClause += ` AND created_at <= $${params.length + 1}`;
        params.push(end_date);
      }
      
      // Overall stats
      const overallResult = await pool.query(
        `SELECT 
           COUNT(*) as total_applications,
           COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
           COUNT(CASE WHEN status = 'funded' THEN 1 END) as funded_count,
           COALESCE(SUM(amount), 0) as total_amount,
           COALESCE(SUM(CASE WHEN status = 'funded' THEN amount ELSE 0 END), 0) as funded_amount,
           COALESCE(AVG(amount), 0) as avg_application_amount
         FROM financing_applications
         ${whereClause}`,
        params
      );
      
      // By provider
      const providerResult = await pool.query(
        `SELECT 
           provider,
           COUNT(*) as applications,
           COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
           COUNT(CASE WHEN status = 'funded' THEN 1 END) as funded,
           COALESCE(SUM(amount), 0) as total_amount
         FROM financing_applications
         ${whereClause}
         GROUP BY provider`,
        params
      );
      
      // Monthly trend
      const trendResult = await pool.query(
        `SELECT 
           DATE_TRUNC('month', created_at) as month,
           COUNT(*) as applications,
           COALESCE(SUM(amount), 0) as amount
         FROM financing_applications
         ${whereClause}
         GROUP BY DATE_TRUNC('month', created_at)
         ORDER BY month DESC
         LIMIT 12`,
        params
      );
      
      const overall = overallResult.rows[0];
      const approvalRate = overall.total_applications > 0 
        ? (overall.approved_count / overall.total_applications * 100).toFixed(1)
        : 0;
      
      const fundingRate = overall.total_applications > 0 
        ? (overall.funded_count / overall.total_applications * 100).toFixed(1)
        : 0;
      
      res.json({
        success: true,
        stats: {
          overview: {
            ...overall,
            approval_rate: parseFloat(approvalRate.toString()),
            funding_rate: parseFloat(fundingRate.toString())
          },
          byProvider: providerResult.rows,
          monthlyTrend: trendResult.rows
        }
      });
    } catch (err: any) {
      console.error("Error fetching financing stats:", err);
      res.status(500).json({ error: "Failed to fetch financing stats" });
    }
  });

  // ==========================================
  // DELETE /api/partners/:slug/financing/providers/:providerId
  // ==========================================
  router.delete("/:slug/financing/providers/:providerId", async (req, res) => {
    const { slug, providerId } = req.params;
    
    try {
      const result = await pool.query(
        `DELETE FROM financing_providers 
         WHERE id = $1 AND partner_slug = $2
         RETURNING provider`,
        [providerId, slug]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Provider not found" });
      }
      
      res.json({
        success: true,
        deleted: result.rows[0].provider
      });
    } catch (err: any) {
      console.error("Error deleting financing provider:", err);
      res.status(500).json({ error: "Failed to delete financing provider" });
    }
  });

  app.use("/api/partners", router);
  app.use("/api/financing", router);
}