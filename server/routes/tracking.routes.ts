/**
 * Analytics Tracking Routes (PUBLIC — no auth required)
 *
 * Captures real page view data for partners to replace estimated metrics.
 *
 * POST /api/track/pageview - Record a page view
 */

import { Router, type Express } from "express";
import { z } from "zod";
import { createHash } from "crypto";
import { pool } from "../db";
import rateLimit from "express-rate-limit";

// Rate limiting: 100 requests per minute per IP
const trackingRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { error: "Too many tracking requests, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const pageviewSchema = z.object({
  partnerSlug: z.string().min(1),
  pagePath: z.string().min(1),
  pageType: z.enum(['partner_profile', 'photo_quote', 'seo_page', 'confirm', 'booking']),
  referrer: z.string().nullable().optional(),
  utmSource: z.string().nullable().optional(),
  utmMedium: z.string().nullable().optional(),
  utmCampaign: z.string().nullable().optional(),
  utmContent: z.string().nullable().optional(),
  sessionId: z.string().min(1),
});

/**
 * Hash IP address with salt for privacy-compliant unique visitor counting
 */
function hashIP(ip: string): string {
  const salt = process.env.IP_HASH_SALT || "uptend-default-salt-2024";
  return createHash('sha256').update(ip + salt).digest('hex').substring(0, 16);
}

export function registerTrackingRoutes(app: Express) {
  const router = Router();

  // Apply rate limiting to all tracking routes
  router.use(trackingRateLimit);

  /**
   * POST /api/track/pageview
   * Records a page view for analytics tracking
   */
  router.post("/pageview", async (req, res) => {
    try {
      const validated = pageviewSchema.parse(req.body);

      // Get client IP and user agent
      const clientIP = req.ip || req.socket.remoteAddress || "unknown";
      const userAgent = req.get('User-Agent') || null;
      const ipHash = hashIP(clientIP);

      // Insert page view record
      await pool.query(`
        INSERT INTO partner_page_views (
          partner_slug, page_path, page_type, referrer,
          utm_source, utm_medium, utm_campaign, utm_content,
          user_agent, ip_hash, session_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        validated.partnerSlug,
        validated.pagePath,
        validated.pageType,
        validated.referrer,
        validated.utmSource,
        validated.utmMedium,
        validated.utmCampaign,
        validated.utmContent,
        userAgent,
        ipHash,
        validated.sessionId
      ]);

      // Return 204 No Content for fire-and-forget tracking
      res.status(204).send();
    } catch (err: any) {
      if (err.name === "ZodError") {
        return res.status(400).json({ error: "Invalid tracking data", details: err.errors });
      }

      console.error("Tracking error:", err.message);
      // Always return 204 to prevent breaking client pages
      res.status(204).send();
    }
  });

  app.use("/api/track", router);
}