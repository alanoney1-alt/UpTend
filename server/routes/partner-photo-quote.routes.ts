/**
 * Partner Photo Quote Routes (PUBLIC — no auth required)
 *
 * A standalone scoping tool that Alex texts to customers.
 * Customer uploads photos of their HVAC unit → George AI analyzes →
 * Summary sent to partner dashboard.
 *
 * POST /api/partners/:slug/photo-quote/submit
 * GET  /api/partners/:slug/photo-quote/list   (protected — for partner dashboard)
 */

import { Router, type Express } from "express";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { pool } from "../db";
import { analyzeImages } from "../services/ai/openai-vision-client";
import { getMulterStorage, isCloudStorage, uploadFile } from "../services/file-storage";
import { sendProNewJob } from "../services/email-service";
import { notifyPhotoQuote, notifyNewServiceRequest } from "../services/n8n-notify";
import { nanoid } from "nanoid";

const photoUpload = multer({
  storage: getMulterStorage("partner-photo-quotes"),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB per photo
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowed = /jpeg|jpg|png|gif|webp|heic|heif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = file.mimetype.startsWith("image/");
    cb(null, ext || mime);
  },
});

const submitSchema = z.object({
  customerName: z.string().min(1, "Name required"),
  customerEmail: z.string().email("Valid email required"),
  customerPhone: z.string().min(7, "Phone required"),
  customerAddress: z.string().min(5, "Address required"),
  notes: z.string().optional(),
});

async function resolvePhotoUrls(files: Express.Multer.File[]): Promise<string[]> {
  if (isCloudStorage) {
    return Promise.all(
      files.map((f) => uploadFile(f.buffer, f.originalname, f.mimetype, "partner-photo-quotes"))
    );
  }
  return files.map(
    (f) => `/uploads/partner-photo-quotes/${(f as any).filename || f.originalname}`
  );
}

async function analyzeHvacPhotos(photoUrls: string[], customerNotes?: string): Promise<any> {
  const notesContext = customerNotes
    ? `\n\nThe customer described their problem as: "${customerNotes}"\nFactor this into your assessment — it may reveal issues not visible in the photos.\n`
    : '';

  const prompt = `You are an expert HVAC technician reviewing customer-submitted photos of their HVAC system.${notesContext}

Analyze ALL photos carefully and return a detailed JSON assessment:
{
  "unit_type": "central_air|heat_pump|mini_split|package_unit|window_unit|unknown",
  "manufacturer": "brand name or 'Unknown'",
  "model": "model number if visible or 'Not visible'",
  "estimated_age_years": number or null,
  "condition": "excellent|good|fair|poor|critical",
  "visible_issues": ["list each visible problem, e.g. 'rust on coil housing', 'bent fins', 'refrigerant staining'"],
  "recommended_services": ["list specific services based on what you see"],
  "urgency": "routine|soon|urgent|emergency",
  "technician_notes": "2-3 sentences summarizing what Alex should know before calling the customer",
  "confidence": 0.0-1.0
}

Be specific and technical. If photos are unclear, note it in technician_notes.`;

  try {
    const result = await analyzeImages({
      imageUrls: photoUrls.slice(0, 3),
      prompt,
      systemPrompt: "You are an expert HVAC technician. Provide technical, accurate assessments.",
      maxTokens: 1000,
      jsonMode: true,
    });

    return result;
  } catch (err: any) {
    console.error("[Partner Photo Quote] AI analysis failed:", err.message);
    return {
      unit_type: "unknown",
      manufacturer: "Could not determine",
      model: "Not visible",
      estimated_age_years: null,
      condition: "unknown",
      visible_issues: ["Photo analysis unavailable — technician should assess on-site"],
      recommended_services: ["On-site inspection"],
      urgency: "routine",
      technician_notes: "AI photo analysis was unavailable. Customer submitted photos — review manually before calling.",
      confidence: 0,
    };
  }
}

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS partner_photo_quotes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      partner_slug TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_address TEXT NOT NULL,
      photo_urls TEXT[] DEFAULT '{}',
      ai_analysis JSONB,
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `).catch(() => {}); // Ignore if already exists
}
ensureTable();

export function registerPartnerPhotoQuoteRoutes(app: Express) {
  const router = Router();

  // ═══════════════════════════════════════════════════════════════════
  // POST /api/partners/:slug/photo-quote/submit  (PUBLIC — no auth)
  // ═══════════════════════════════════════════════════════════════════
  router.post(
    "/:slug/photo-quote/submit",
    photoUpload.array("photos", 3),
    async (req, res) => {
      try {
        const { slug } = req.params;

        // Parse text fields
        let parsed: z.infer<typeof submitSchema>;
        try {
          parsed = submitSchema.parse({
            customerName: req.body.customerName,
            customerEmail: req.body.customerEmail,
            customerPhone: req.body.customerPhone,
            customerAddress: req.body.customerAddress,
            notes: req.body.notes,
          });
        } catch (validationErr: any) {
          return res.status(400).json({
            error: "Validation failed",
            details: validationErr.errors ?? validationErr.message,
          });
        }

        // Handle uploaded photos
        const files = (req.files as Express.Multer.File[]) || [];
        if (files.length === 0) {
          return res.status(400).json({ error: "At least one photo is required" });
        }

        const photoUrls = await resolvePhotoUrls(files);

        // Run AI analysis — include customer's problem description for better diagnosis
        const aiAnalysis = await analyzeHvacPhotos(photoUrls, parsed.notes);

        // Extract UTM parameters for tracking
        const utmSource = req.body.utmSource || null;
        const utmMedium = req.body.utmMedium || null;
        const utmCampaign = req.body.utmCampaign || null;
        const referrer = req.body.referrer || null;

        // Persist to DB
        const result = await pool.query(
          `INSERT INTO partner_photo_quotes
             (partner_slug, customer_name, customer_email, customer_phone, customer_address,
              photo_urls, ai_analysis, status, notes, utm_source, utm_medium, utm_campaign, referrer)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, $10, $11, $12)
           RETURNING id, created_at`,
          [
            slug,
            parsed.customerName,
            parsed.customerEmail,
            parsed.customerPhone,
            parsed.customerAddress,
            photoUrls,
            JSON.stringify(aiAnalysis),
            parsed.notes || null,
            utmSource,
            utmMedium,
            utmCampaign,
            referrer,
          ]
        );

        const record = result.rows[0];

        // Create a REAL service request so this flows through UpTend's system
        const serviceRequestResult = await pool.query(
          `INSERT INTO service_requests
             (id, service_type, status, customer_name, customer_email, customer_phone,
              address, description, photo_urls, partner_slug, created_at)
           VALUES (gen_random_uuid(), $1, 'pending_estimate', $2, $3, $4, $5, $6, $7, $8, NOW())
           RETURNING id`,
          [
            'hvac', // Default for Comfort Solutions — future: read from partner config
            parsed.customerName,
            parsed.customerEmail,
            parsed.customerPhone,
            parsed.customerAddress,
            `AI Photo Analysis: ${aiAnalysis.technician_notes || 'Customer submitted photos for review.'}\n\nCondition: ${aiAnalysis.condition || 'unknown'}\nUrgency: ${aiAnalysis.urgency || 'routine'}\nRecommended: ${(aiAnalysis.recommended_services || []).join(', ')}${parsed.notes ? '\n\nCustomer notes: ' + parsed.notes : ''}`,
            photoUrls,
            slug,
          ]
        ).catch((err: any) => {
          console.error("[Partner Photo Quote] Failed to create service request:", err.message);
          return null;
        });

        // Link the photo quote record to the service request
        if (serviceRequestResult?.rows[0]?.id) {
          await pool.query(
            `UPDATE partner_photo_quotes SET service_request_id = $1 WHERE id = $2`,
            [serviceRequestResult.rows[0].id, record.id]
          ).catch(() => {}); // Best effort — column may not exist yet
        }

        // Notify the partner via email using existing email service
        const partnerEmail = slug === 'comfort-solutions-tech' ? 'alan@uptendapp.com' : process.env.ADMIN_EMAIL;
        if (partnerEmail && serviceRequestResult?.rows[0]?.id) {
          sendProNewJob(partnerEmail, {
            id: serviceRequestResult.rows[0].id,
            serviceType: 'hvac',
            address: parsed.customerAddress.split(',').slice(-2).join(',').trim() || 'Orlando area',
            customerName: parsed.customerName,
            description: `Photo Quote — ${aiAnalysis.condition || 'unknown'} condition, ${aiAnalysis.urgency || 'routine'} urgency. ${(aiAnalysis.recommended_services || []).join(', ')}. ${photoUrls.length} photo(s) uploaded. Review in dashboard and submit your quote.`,
          }).catch((err: any) => console.error('[EMAIL] Failed partner photo-quote notification:', err.message));
        }

        // Fire n8n webhooks (non-blocking)
        notifyPhotoQuote({
          partnerSlug: slug,
          partnerEmail: partnerEmail || 'alan@uptendapp.com',
          customerFirstName: parsed.customerName.split(' ')[0],
          area: parsed.customerAddress.split(',').slice(-2).join(',').trim() || 'Orlando area',
          serviceType: 'hvac',
          urgency: aiAnalysis.urgency || 'routine',
          customerNotes: parsed.notes || '',
          quoteId: record.id,
          serviceRequestId: serviceRequestResult?.rows[0]?.id || undefined,
        });

        if (serviceRequestResult?.rows[0]?.id) {
          notifyNewServiceRequest({
            partnerSlug: slug,
            partnerEmail: partnerEmail || 'alan@uptendapp.com',
            customerName: parsed.customerName,
            serviceType: 'hvac',
            area: parsed.customerAddress.split(',').slice(-2).join(',').trim() || 'Orlando area',
            notes: parsed.notes || '',
            source: 'photo_quote',
            serviceRequestId: serviceRequestResult.rows[0].id,
          });
        }

        res.json({
          success: true,
          id: record.id,
          serviceRequestId: serviceRequestResult?.rows[0]?.id || null,
          message: "Your photos have been submitted! You'll receive a quote by email within a few hours.",
          ai_summary: {
            condition: aiAnalysis.condition,
            urgency: aiAnalysis.urgency,
            recommended_services: aiAnalysis.recommended_services,
          },
        });
      } catch (err: any) {
        console.error("[Partner Photo Quote] Submit error:", err.message);
        res.status(500).json({ error: "Failed to submit photo quote" });
      }
    }
  );

  // ═══════════════════════════════════════════════════════════════════
  // GET /api/partners/:slug/photo-quote/list  (for partner dashboard)
  // ═══════════════════════════════════════════════════════════════════
  router.get("/:slug/photo-quote/list", async (req, res) => {
    const { slug } = req.params;
    const { status, limit = "50" } = req.query;

    try {
      let query = `SELECT * FROM partner_photo_quotes WHERE partner_slug = $1`;
      const params: any[] = [slug];

      if (status && typeof status === "string") {
        params.push(status);
        query += ` AND status = $${params.length}`;
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
      params.push(parseInt(limit as string));

      const result = await pool.query(query, params);

      res.json({
        success: true,
        quotes: result.rows,
        count: result.rows.length,
        partner_slug: slug,
      });
    } catch (err: any) {
      console.error("[Partner Photo Quote] List error:", err.message);
      res.json({ success: true, quotes: [], count: 0, partner_slug: slug });
    }
  });

  // PATCH /api/partners/:slug/photo-quote/:id/status
  router.patch("/:slug/photo-quote/:id/status", async (req, res) => {
    const { slug, id } = req.params;
    const { status } = req.body;
    const allowed = ["pending", "analyzed", "contacted", "closed"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    try {
      await pool.query(
        `UPDATE partner_photo_quotes SET status = $1, updated_at = NOW() WHERE id = $2 AND partner_slug = $3`,
        [status, id, slug]
      );
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // PATCH /api/partners/:slug/photo-quote/:id/quote  (quote submission)
  // ═══════════════════════════════════════════════════════════════════
  router.patch("/:slug/photo-quote/:id/quote", async (req, res) => {
    try {
      const { slug, id } = req.params;
      const { quotedPrice, quoteNotes, estimatedDuration, scheduledDate } = req.body;

      // Validate required fields
      if (!quotedPrice || !quoteNotes) {
        return res.status(400).json({ error: "quotedPrice and quoteNotes are required" });
      }

      // Get the photo quote record
      const photoQuoteResult = await pool.query(
        `SELECT * FROM partner_photo_quotes WHERE id = $1 AND partner_slug = $2`,
        [id, slug]
      );

      if (photoQuoteResult.rows.length === 0) {
        return res.status(404).json({ error: "Photo quote not found" });
      }

      const photoQuote = photoQuoteResult.rows[0];

      // Check if service request already exists
      let serviceRequestId = photoQuote.service_request_id;

      if (!serviceRequestId) {
        // Create new service request
        const serviceRequestResult = await pool.query(
          `INSERT INTO service_requests
             (id, service_type, status, customer_name, customer_email, customer_phone,
              address, description, photo_urls, partner_slug, created_at)
           VALUES (gen_random_uuid(), $1, 'pending_estimate', $2, $3, $4, $5, $6, $7, $8, NOW())
           RETURNING id`,
          [
            'hvac', // Default service type
            photoQuote.customer_name,
            photoQuote.customer_email,
            photoQuote.customer_phone,
            photoQuote.customer_address,
            `Photo Quote Request: ${photoQuote.ai_analysis?.technician_notes || 'Customer submitted photos for review.'}${photoQuote.notes ? '\n\nCustomer notes: ' + photoQuote.notes : ''}`,
            photoQuote.photo_urls,
            slug,
          ]
        );

        serviceRequestId = serviceRequestResult.rows[0].id;

        // Link the photo quote to the service request
        await pool.query(
          `UPDATE partner_photo_quotes SET service_request_id = $1 WHERE id = $2`,
          [serviceRequestId, id]
        );
      }

      // Generate confirmation token
      const confirmToken = nanoid(32);

      // Update service request with quote details using existing API pattern
      await pool.query(
        `UPDATE service_requests SET
           quoted_price = $1,
           quote_notes = $2,
           estimated_duration = $3,
           scheduled_for = $4,
           confirm_token = $5,
           status = 'quoted',
           updated_at = NOW()
         WHERE id = $6`,
        [quotedPrice, quoteNotes, estimatedDuration, scheduledDate, confirmToken, serviceRequestId]
      );

      // Update photo quote status
      await pool.query(
        `UPDATE partner_photo_quotes SET status = 'quoted', updated_at = NOW() WHERE id = $1 AND partner_slug = $2`,
        [id, slug]
      );

      // Send customer email with quote
      try {
        const { sendQuoteReady } = await import("../services/email-service");
        await sendQuoteReady(
          photoQuote.customer_email,
          {
            id: serviceRequestId,
            serviceType: 'HVAC Service',
            confirmToken,
            customerName: photoQuote.customer_name,
          },
          {
            quotedPrice,
            estimatedDuration,
            notes: quoteNotes,
          }
        );
      } catch (emailErr: any) {
        console.error("[Partner Photo Quote] Email send failed:", emailErr.message);
        // Don't fail the quote submission if email fails
      }

      res.json({
        success: true,
        serviceRequestId,
        message: "Quote submitted successfully. Customer will receive email with quote details.",
      });

    } catch (err: any) {
      console.error("[Partner Photo Quote] Quote submission error:", err.message);
      res.status(500).json({ error: "Failed to submit quote" });
    }
  });

  app.use("/api/partners", router);
}
