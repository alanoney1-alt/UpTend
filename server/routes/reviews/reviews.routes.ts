import type { Express } from "express";
import { requireAuth } from "../../auth-middleware";
import { db } from "../../db";
import { haulerReviews, haulerProfiles } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export function registerReviewRoutes(app: Express) {
  // POST /api/service-requests/:id/review - submit a review
  app.post("/api/service-requests/:id/review", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.userId || req.user?.id;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });

      const serviceRequestId = req.params.id;
      const body = reviewSchema.parse(req.body);

      // Check if already reviewed
      const existing = await db.select().from(haulerReviews)
        .where(and(
          eq(haulerReviews.serviceRequestId, serviceRequestId),
          eq(haulerReviews.customerId, userId)
        )).limit(1);

      if (existing.length > 0) {
        return res.status(409).json({ error: "Already reviewed this job" });
      }

      // Get the service request to find the pro
      const { storage } = await import("../../storage");
      const job = await storage.getServiceRequest(serviceRequestId);
      if (!job) return res.status(404).json({ error: "Job not found" });
      if (job.status !== "completed") return res.status(400).json({ error: "Job not completed yet" });

      const proId = job.assignedHaulerId;
      if (!proId) return res.status(400).json({ error: "No pro assigned to this job" });

      const [review] = await db.insert(haulerReviews).values({
        haulerId: proId,
        customerId: userId,
        serviceRequestId,
        rating: body.rating,
        comment: body.comment || null,
        createdAt: new Date().toISOString(),
      }).returning();

      // Update pro's average rating
      const [stats] = await db.select({
        avg: sql<number>`AVG(${haulerReviews.rating})`,
        count: sql<number>`COUNT(*)`,
      }).from(haulerReviews).where(eq(haulerReviews.haulerId, proId));

      if (stats) {
        await db.update(haulerProfiles).set({
          rating: Number(stats.avg) || 5.0,
          reviewCount: Number(stats.count) || 0,
        }).where(eq(haulerProfiles.id, proId));
      }

      // Fire-and-forget: notify pro of new review
      try {
        const { sendReviewReceived } = await import("../../services/email-service");
        const proProfile = await db.select().from(haulerProfiles).where(eq(haulerProfiles.id, proId)).limit(1);
        if (proProfile[0]?.userId) {
          const { storage: st } = await import("../../storage");
          const proUser = await st.getUser(proProfile[0].userId).catch(() => null);
          if (proUser?.email) {
            sendReviewReceived(proUser.email, { rating: body.rating, comment: body.comment }, job).catch(err => console.error('[EMAIL] Failed review-received:', err.message));
          }
        }
      } catch (notifErr) { console.error('[EMAIL] Review notification error:', notifErr); }

      res.json(review);
    } catch (error: any) {
      if (error.name === "ZodError") return res.status(400).json({ error: error.errors });
      console.error("Review submit error:", error);
      res.status(500).json({ error: "Failed to submit review" });
    }
  });

  // GET /api/service-requests/:id/review - get review for a job
  app.get("/api/service-requests/:id/review", requireAuth, async (req: any, res) => {
    try {
      const [review] = await db.select().from(haulerReviews)
        .where(eq(haulerReviews.serviceRequestId, req.params.id))
        .limit(1);

      if (!review) return res.status(404).json({ error: "No review found" });
      res.json(review);
    } catch (error) {
      console.error("Get review error:", error);
      res.status(500).json({ error: "Failed to get review" });
    }
  });

  // NOTE: GET /api/pros/:proId/reviews is in hauler/profile.routes.ts

  // POST /api/jobs/:id/photos - upload job photos
  app.post("/api/jobs/:id/photos", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.userId || req.user?.id;
      const jobId = req.params.id;
      const { type, photos } = req.body; // type: 'before' | 'after', photos: base64[]

      if (!type || !["before", "after"].includes(type)) {
        return res.status(400).json({ error: "type must be 'before' or 'after'" });
      }

      const timestamp = Date.now();
      const urls = (photos || []).map((_: string, i: number) =>
        `/api/photos/${jobId}/${timestamp}_${type}_${i}.jpg`
      );

      // In production, store to object storage. For now, acknowledge.
      // Update service request with photo URLs
      const { storage } = await import("../../storage");
      const job = await storage.getServiceRequest(jobId);
      if (!job) return res.status(404).json({ error: "Job not found" });

      const existingPhotos = (job as any).photos || {};
      const updatedPhotos = {
        ...existingPhotos,
        [type]: [...(existingPhotos[type] || []), ...urls],
      };

      await storage.updateServiceRequest(jobId, { photos: JSON.stringify(updatedPhotos) } as any);

      res.json({ urls, message: `${type} photos uploaded successfully` });
    } catch (error) {
      console.error("Photo upload error:", error);
      res.status(500).json({ error: "Failed to upload photos" });
    }
  });
}
