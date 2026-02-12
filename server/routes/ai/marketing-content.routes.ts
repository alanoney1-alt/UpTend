/**
 * AI Marketing Content Generator API Routes (#23)
 *
 * Auto-generate before/after social content, testimonials, case studies.
 *
 * Endpoints:
 * - POST /api/ai/marketing/generate - Generate marketing content from a job
 * - GET /api/ai/marketing/content - List generated content
 * - POST /api/ai/marketing/content/:id/approve - Approve for publishing
 * - POST /api/ai/marketing/content/:id/reject - Reject content
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../auth-middleware";
import type { DatabaseStorage } from "../../storage/impl/database-storage";
import { nanoid } from "nanoid";
import { generateContent } from "../../services/ai/anthropic-client";

export function createMarketingContentRoutes(storage: DatabaseStorage) {
  const router = Router();

  // POST /api/ai/marketing/generate
  const generateSchema = z.object({
    serviceRequestId: z.string(),
    contentType: z.enum(["before_after_post", "testimonial", "case_study", "seasonal_tip", "pro_spotlight"]),
    platform: z.enum(["instagram", "tiktok", "facebook", "nextdoor", "google_business", "email"]).optional(),
  });

  router.post("/marketing/generate", requireAuth, async (req, res) => {
    try {
      const validated = generateSchema.parse(req.body);
      const job = await storage.getServiceRequest(validated.serviceRequestId);
      if (!job) return res.status(404).json({ error: "Job not found" });

      const serviceLabel = job.serviceType.replace(/_/g, " ");
      const platform = validated.platform || "instagram";

      let generated;
      try {
        generated = await generateContent({
          contentType: validated.contentType,
          targetAudience: "Orlando homeowners",
          keywords: [serviceLabel, "UpTend", "home services", "Orlando"],
          tone: platform === "tiktok" ? "casual and energetic" : "professional and warm",
          context: {
            serviceType: job.serviceType,
            price: job.finalPrice || job.priceEstimate,
            city: job.pickupCity || "Orlando",
            platform,
          },
        });
      } catch (aiErr: any) {
        console.warn("AI content generation failed:", aiErr.message);
        generated = {
          generatedContent: `✨ Another ${serviceLabel} job done right! Our UpTend Pro transformed this ${job.pickupCity || "Orlando"} home. Book yours at uptend.app 🏠`,
        };
      }

      const content = await storage.createAiMarketingContent({
        id: nanoid(),
        serviceRequestId: validated.serviceRequestId,
        propertyId: null,
        beforePhotoUrl: null,
        afterPhotoUrl: null,
        contentType: validated.contentType,
        platform,
        headline: generated.generatedContent.split("\n")[0]?.slice(0, 100) || "Check this out!",
        body: generated.generatedContent,
        hashtags: ["#UpTend", "#HomeServices", `#${serviceLabel.replace(/\s/g, "")}`, "#Orlando"],
        callToAction: "Book now at uptend.app",
        generatedImageUrl: null,
        generatedVideoUrl: null,
        status: "draft",
        reviewedByUserId: null,
        reviewedAt: null,
        publishedAt: null,
        publishedUrl: null,
        customerConsentObtained: false,
        customerConsentDate: null,
        impressions: null,
        engagements: null,
        clickThroughs: null,
        bookingsAttributed: 0,
        revenueAttributed: 0,
        createdAt: new Date().toISOString(),
      });

      res.json({ success: true, content });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // GET /api/ai/marketing/content
  router.get("/marketing/content", requireAuth, async (req, res) => {
    try {
      const { status, limit } = req.query;
      const contentType = (req.query.contentType as string) || "before_after_post";
      const content = await storage.getAiMarketingContentByType(contentType, status as string || undefined);
      res.json({ success: true, content });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/ai/marketing/content/:id/approve
  router.post("/marketing/content/:id/approve", requireAuth, async (req, res) => {
    try {
      await storage.updateAiMarketingContent(req.params.id, {
        status: "approved",
        reviewedByUserId: ((req.user as any).userId || (req.user as any).id),
        reviewedAt: new Date().toISOString(),
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // POST /api/ai/marketing/content/:id/reject
  router.post("/marketing/content/:id/reject", requireAuth, async (req, res) => {
    try {
      await storage.updateAiMarketingContent(req.params.id, {
        status: "rejected",
        reviewedByUserId: ((req.user as any).userId || (req.user as any).id),
        reviewedAt: new Date().toISOString(),
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}

export default createMarketingContentRoutes;
