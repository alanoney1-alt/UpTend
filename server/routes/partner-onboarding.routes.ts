/**
 * Partner Onboarding + Customer-Facing Routes
 * 
 * Partner-side:
 * - POST /api/partners/:slug/onboarding — save onboarding data from George
 * - GET  /api/partners/:slug/onboarding — get onboarding data
 * - GET  /api/partners/:slug/onboarding/progress — completion percentage
 * - GET  /api/partners/:slug/social-audit — social media presence audit
 * 
 * Customer-side (public, no auth):
 * - POST /api/partners/:slug/customer/lead — customer submits info via George chat
 * - GET  /api/partners/:slug/customer/services — get partner's available services
 * - GET  /api/partners/:slug/customer/info — get partner public info (name, phone, services)
 * - POST /api/partners/:slug/customer/review — customer submits a review
 * - GET  /api/partners/:slug/customer/status/:jobId — customer checks job status
 */

import { Router, type Express } from "express";
import { pool } from "../db";
import { saveOnboardingData, getOnboardingData, getOnboardingProgress, getSocialAudit, listPartnerOnboarding } from "../services/partner-onboarding";

export function registerPartnerOnboardingRoutes(app: Express) {
  const router = Router();

  // ==========================================
  // PARTNER-SIDE: Onboarding data management
  // ==========================================

  /** Save/update onboarding data */
  router.post("/:slug/onboarding", async (req, res) => {
    try {
      const result = await saveOnboardingData(req.params.slug, req.body);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /** Get onboarding data */
  router.get("/:slug/onboarding", async (req, res) => {
    try {
      const data = await getOnboardingData(req.params.slug);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /** Get onboarding progress */
  router.get("/:slug/onboarding/progress", async (req, res) => {
    try {
      const progress = await getOnboardingProgress(req.params.slug);
      res.json({ success: true, ...progress });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /** Social media audit */
  router.get("/:slug/social-audit", async (req, res) => {
    try {
      const audit = await getSocialAudit(req.params.slug);
      res.json({ success: true, ...audit });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /** List all partners (admin) */
  router.get("/list/all", async (req, res) => {
    try {
      const partners = await listPartnerOnboarding();
      res.json({ success: true, partners });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // CUSTOMER-SIDE: Public endpoints
  // ==========================================

  /** Customer submits lead via George chat on partner page */
  router.post("/:slug/customer/lead", async (req, res) => {
    try {
      const { slug } = req.params;
      const { name, email, phone, serviceType, issue, address, source } = req.body;

      const result = await pool.query(
        `INSERT INTO partner_leads (partner_slug, customer_name, customer_email, customer_phone, service_type, notes, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at`,
        [slug, name, email || null, phone || null, serviceType || null, issue || null, source || 'website']
      );

      res.json({ success: true, leadId: result.rows[0].id, message: "We got your info. A tech will reach out shortly." });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /** Get partner's available services (public) */
  router.get("/:slug/customer/services", async (req, res) => {
    try {
      const data = await getOnboardingData(req.params.slug);
      if (!data) {
        return res.json({ success: true, services: [], companyName: req.params.slug });
      }

      res.json({
        success: true,
        companyName: data.company_name,
        services: data.services_offered ? JSON.parse(data.services_offered) : [],
        primaryService: data.primary_service,
        serviceArea: data.service_area_miles,
        phone: data.owner_phone,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /** Get partner public info (for customer-facing pages) */
  router.get("/:slug/customer/info", async (req, res) => {
    try {
      const data = await getOnboardingData(req.params.slug);
      if (!data) {
        return res.json({ success: true, partner: null });
      }

      // Only return public-safe fields
      res.json({
        success: true,
        partner: {
          companyName: data.company_name,
          phone: data.owner_phone,
          address: `${data.business_city || ''}, ${data.business_state || ''}`.trim(),
          services: data.services_offered ? JSON.parse(data.services_offered) : [],
          primaryService: data.primary_service,
          website: data.website_url,
          facebook: data.facebook_url,
          instagram: data.instagram_handle,
          google: data.google_business_profile_url,
          yelp: data.yelp_url,
          yearsInBusiness: data.years_in_business,
          tagline: data.tagline,
          logoUrl: data.logo_url,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /** Customer submits a review */
  router.post("/:slug/customer/review", async (req, res) => {
    try {
      const { slug } = req.params;
      const { customerName, rating, reviewText, jobId } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, error: "Rating must be 1 to 5" });
      }

      await pool.query(
        `INSERT INTO partner_reviews (partner_slug, customer_name, rating, review_text, received_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [slug, customerName || 'Anonymous', rating, reviewText || null]
      );

      res.json({ success: true, message: "Thank you for your review." });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /** Customer checks job status */
  router.get("/:slug/customer/status/:jobId", async (req, res) => {
    try {
      const { slug, jobId } = req.params;

      const result = await pool.query(
        `SELECT id, service_type, status, tech_name, scheduled_at, created_at 
         FROM partner_jobs WHERE partner_slug = $1 AND id = $2`,
        [slug, parseInt(jobId)]
      );

      if (result.rows.length === 0) {
        return res.json({ success: true, job: null, message: "Job not found" });
      }

      const job = result.rows[0];
      const statusMessages: Record<string, string> = {
        scheduled: `Your ${job.service_type || 'service'} is scheduled${job.tech_name ? ` with ${job.tech_name}` : ''}.`,
        in_progress: `Your tech${job.tech_name ? ` ${job.tech_name}` : ''} is working on your ${job.service_type || 'service'} right now.`,
        completed: `Your ${job.service_type || 'service'} has been completed. How did we do?`,
        cancelled: `This job has been cancelled.`,
      };

      res.json({
        success: true,
        job: {
          ...job,
          statusMessage: statusMessages[job.status] || `Status: ${job.status}`,
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.use("/api/partners", router);
}
