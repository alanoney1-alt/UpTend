/**
 * Job Lifecycle Routes
 * Full booking-to-completion pipeline for Smart Match and Snap & Book jobs.
 * Includes timeline events, photo updates, GPS location tracking, and customer ratings.
 */

import type { Express, Request, Response } from "express";
import { db } from "../db";
import { serviceRequests } from "../../shared/schema";
import { users } from "../../shared/models/auth";
import { haulerProfiles } from "../../shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { calculateFees } from "../services/fee-calculator-v2";
import { pool } from "../db";
import { nanoid } from "nanoid";

function getUserId(req: Request): string | null {
  if (!req.isAuthenticated?.() || !req.user) return null;
  return (req.user as any).userId || (req.user as any).id;
}

async function getJob(jobId: string) {
  const [job] = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.id, jobId))
    .limit(1);
  return job || null;
}

async function createNotification(userId: string | null, type: string, title: string, message: string, data?: any) {
  if (!userId) return;
  try {
    await pool.query(
      `INSERT INTO notifications (id, user_id, type, title, message, data, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) ON CONFLICT DO NOTHING`,
      [nanoid(12), userId, type, title, message, data ? JSON.stringify(data) : null]
    );
  } catch (err) {
    console.error("[JobLifecycle] Notification error:", err);
  }
}

async function initTimelineTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS job_timeline_events (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      photo_url TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_timeline_job ON job_timeline_events(job_id);

    CREATE TABLE IF NOT EXISTS job_location_updates (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      pro_id TEXT NOT NULL,
      lat DOUBLE PRECISION NOT NULL,
      lng DOUBLE PRECISION NOT NULL,
      heading DOUBLE PRECISION,
      speed DOUBLE PRECISION,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_location_job ON job_location_updates(job_id);

    CREATE TABLE IF NOT EXISTS job_reviews (
      id TEXT PRIMARY KEY,
      job_id TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL,
      pro_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

export function registerJobLifecycleRoutes(app: Express) {
  initTimelineTables().catch(err => console.error("[JobLifecycle] Timeline table init error:", err));
  // POST /api/jobs/:jobId/accept - pro accepts the job
  app.post("/api/jobs/:jobId/accept", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    try {
      const job = await getJob(req.params.jobId);
      if (!job) return res.status(404).json({ error: "Job not found" });
      if (job.assignedHaulerId !== userId) return res.status(403).json({ error: "Not assigned to this job" });
      if (!["requested", "pending_acceptance"].includes(job.status)) {
        return res.status(400).json({ error: `Cannot accept job in '${job.status}' status` });
      }

      await db
        .update(serviceRequests)
        .set({
          status: "accepted",
          acceptedAt: new Date().toISOString(),
        })
        .where(eq(serviceRequests.id, job.id));

      // Notify customer
      const [proUser] = await db
        .select({ firstName: users.firstName })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      await createNotification(
        job.customerId,
        "job_accepted",
        "Pro Accepted Your Job",
        `Your pro ${proUser?.firstName || "Pro"} accepted! Arriving ${job.scheduledFor || "at the scheduled time"}.`,
        { jobId: job.id }
      );

      // Return address now that pro accepted
      res.json({
        status: "accepted",
        address: job.pickupAddress,
        scheduledFor: job.scheduledFor,
      });
    } catch (error: any) {
      console.error("Job accept error:", error);
      res.status(500).json({ error: "Failed to accept job" });
    }
  });

  // POST /api/jobs/:jobId/decline - pro declines the job
  app.post("/api/jobs/:jobId/decline", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    try {
      const job = await getJob(req.params.jobId);
      if (!job) return res.status(404).json({ error: "Job not found" });
      if (job.assignedHaulerId !== userId) return res.status(403).json({ error: "Not assigned to this job" });

      await db
        .update(serviceRequests)
        .set({
          status: "declined",
          assignedHaulerId: null,
        })
        .where(eq(serviceRequests.id, job.id));

      // Notify customer
      await createNotification(
        job.customerId,
        "job_declined",
        "Looking for another pro",
        "Your original pro is unavailable. We are finding you another match.",
        { jobId: job.id }
      );

      res.json({ status: "declined", message: "Job declined. Customer will be rematched." });
    } catch (error: any) {
      console.error("Job decline error:", error);
      res.status(500).json({ error: "Failed to decline job" });
    }
  });

  // POST /api/jobs/:jobId/start - pro starts the job
  app.post("/api/jobs/:jobId/start", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    try {
      const job = await getJob(req.params.jobId);
      if (!job) return res.status(404).json({ error: "Job not found" });
      if (job.assignedHaulerId !== userId) return res.status(403).json({ error: "Not assigned to this job" });
      if (job.status !== "accepted") {
        return res.status(400).json({ error: `Cannot start job in '${job.status}' status` });
      }

      // Check if snap book job needs arrival photo
      if (job.snapQuoteId && !job.proArrivalPhotoUrl) {
        return res.status(400).json({
          error: "Arrival photo required for Snap & Book jobs. Upload via POST /api/jobs/:jobId/arrival-photo first.",
          requiresArrivalPhoto: true,
        });
      }

      await db
        .update(serviceRequests)
        .set({
          status: "in_progress",
          startedAt: new Date().toISOString(),
        })
        .where(eq(serviceRequests.id, job.id));

      await createNotification(
        job.customerId,
        "job_started",
        "Your Pro Has Started Working",
        "Your pro has started working on your job.",
        { jobId: job.id }
      );

      res.json({ status: "in_progress" });
    } catch (error: any) {
      console.error("Job start error:", error);
      res.status(500).json({ error: "Failed to start job" });
    }
  });

  // POST /api/jobs/:jobId/complete - pro marks job complete
  app.post("/api/jobs/:jobId/complete", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    try {
      const job = await getJob(req.params.jobId);
      if (!job) return res.status(404).json({ error: "Job not found" });
      if (job.assignedHaulerId !== userId) return res.status(403).json({ error: "Not assigned to this job" });
      if (job.status !== "in_progress") {
        return res.status(400).json({ error: `Cannot complete job in '${job.status}' status` });
      }

      // Enforce Price Protection: final price cannot exceed guaranteed ceiling
      let finalPrice = job.finalPrice || job.priceEstimate || 0;
      if (job.guaranteedCeiling && finalPrice > job.guaranteedCeiling) {
        finalPrice = job.guaranteedCeiling;
      }

      const fees = calculateFees(finalPrice);

      await db
        .update(serviceRequests)
        .set({
          status: "completed",
          completedAt: new Date().toISOString(),
          finalPrice,
          platformFee: fees.platformFee,
          haulerPayout: fees.proPayout,
          finalCustomerPrice: fees.customerTotal,
          ceilingOutcome: job.guaranteedCeiling
            ? finalPrice < job.guaranteedCeiling ? "under_ceiling" : "at_ceiling"
            : null,
          customerSavings: job.guaranteedCeiling
            ? Math.max(0, job.guaranteedCeiling - fees.customerTotal)
            : null,
        })
        .where(eq(serviceRequests.id, job.id));

      // Capture payment if stripe PI exists
      if (job.stripePaymentIntentId) {
        try {
          const { getUncachableStripeClient } = await import("../stripeClient");
          const stripe = await getUncachableStripeClient();
          await stripe.paymentIntents.capture(job.stripePaymentIntentId);
        } catch (err) {
          console.error("[JobLifecycle] Payment capture error:", err);
        }
      }

      await createNotification(
        job.customerId,
        "job_completed",
        "Job Complete",
        "Your job is complete! Please leave a review.",
        { jobId: job.id }
      );

      res.json({
        status: "completed",
        finalPrice,
        proPayout: fees.proPayout,
        customerTotal: fees.customerTotal,
      });
    } catch (error: any) {
      console.error("Job complete error:", error);
      res.status(500).json({ error: "Failed to complete job" });
    }
  });

  // POST /api/jobs/:jobId/scope-change - pro reports scope difference
  app.post("/api/jobs/:jobId/scope-change", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    try {
      const job = await getJob(req.params.jobId);
      if (!job) return res.status(404).json({ error: "Job not found" });
      if (job.assignedHaulerId !== userId) return res.status(403).json({ error: "Not assigned to this job" });

      const { photoUrl, description, newProposedPrice } = req.body;
      if (!description || !newProposedPrice) {
        return res.status(400).json({ error: "description and newProposedPrice are required" });
      }

      const fees = calculateFees(newProposedPrice);

      await db
        .update(serviceRequests)
        .set({
          status: "pending_scope_approval" as any,
          priceApprovalPending: true,
          priceApprovalRequestedAt: new Date().toISOString(),
          verifierNotes: description,
          verificationPhotos: photoUrl ? [photoUrl] : [],
          verifiedPrice: fees.customerTotal,
        })
        .where(eq(serviceRequests.id, job.id));

      await createNotification(
        job.customerId,
        "scope_change",
        "Scope Change Requested",
        `Your pro found a difference in scope. New proposed price: $${fees.customerTotal.toFixed(2)}. Please review and approve.`,
        { jobId: job.id, newPrice: fees.customerTotal, photoUrl }
      );

      res.json({
        status: "pending_scope_approval",
        newCustomerTotal: fees.customerTotal,
        newProPayout: fees.proPayout,
      });
    } catch (error: any) {
      console.error("Scope change error:", error);
      res.status(500).json({ error: "Failed to submit scope change" });
    }
  });

  // POST /api/jobs/:jobId/approve-scope-change - customer approves
  app.post("/api/jobs/:jobId/approve-scope-change", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    try {
      const job = await getJob(req.params.jobId);
      if (!job) return res.status(404).json({ error: "Job not found" });
      if (job.customerId !== userId) return res.status(403).json({ error: "Not your job" });

      await db
        .update(serviceRequests)
        .set({
          status: job.startedAt ? "in_progress" : "accepted",
          guaranteedCeiling: job.verifiedPrice,
          priceEstimate: job.verifiedPrice,
          customerApprovedPriceAdjustment: true,
          priceApprovalRespondedAt: new Date().toISOString(),
          priceApprovalPending: false,
          ceilingOutcome: "scope_change",
        })
        .where(eq(serviceRequests.id, job.id));

      await createNotification(
        job.assignedHaulerId,
        "scope_approved",
        "Scope Change Approved",
        "The customer approved the scope change. You may continue.",
        { jobId: job.id }
      );

      res.json({ status: "approved", newCeiling: job.verifiedPrice });
    } catch (error: any) {
      console.error("Approve scope change error:", error);
      res.status(500).json({ error: "Failed to approve scope change" });
    }
  });

  // POST /api/jobs/:jobId/reject-scope-change - customer rejects
  app.post("/api/jobs/:jobId/reject-scope-change", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    try {
      const job = await getJob(req.params.jobId);
      if (!job) return res.status(404).json({ error: "Job not found" });
      if (job.customerId !== userId) return res.status(403).json({ error: "Not your job" });

      await db
        .update(serviceRequests)
        .set({
          status: job.startedAt ? "in_progress" : "accepted",
          customerApprovedPriceAdjustment: false,
          priceApprovalRespondedAt: new Date().toISOString(),
          priceApprovalPending: false,
        })
        .where(eq(serviceRequests.id, job.id));

      await createNotification(
        job.assignedHaulerId,
        "scope_rejected",
        "Scope Change Declined",
        "The customer declined the scope change. Complete at the original scope and price.",
        { jobId: job.id }
      );

      res.json({ status: "rejected", message: "Complete at original scope/price." });
    } catch (error: any) {
      console.error("Reject scope change error:", error);
      res.status(500).json({ error: "Failed to reject scope change" });
    }
  });

  // POST /api/jobs/:jobId/cancel - customer cancels before job starts
  app.post("/api/jobs/:jobId/cancel", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    try {
      const job = await getJob(req.params.jobId);
      if (!job) return res.status(404).json({ error: "Job not found" });
      if (job.customerId !== userId) return res.status(403).json({ error: "Not your job" });
      if (job.status === "in_progress" || job.status === "completed") {
        return res.status(400).json({ error: "Cannot cancel a job that has already started" });
      }

      // Refund if payment exists
      if (job.stripePaymentIntentId) {
        try {
          const { getUncachableStripeClient } = await import("../stripeClient");
          const stripe = await getUncachableStripeClient();
          await stripe.paymentIntents.cancel(job.stripePaymentIntentId);
        } catch (err) {
          console.error("[JobLifecycle] Refund error:", err);
        }
      }

      await db
        .update(serviceRequests)
        .set({
          status: "cancelled",
          cancelledAt: new Date().toISOString(),
          cancelledBy: "customer",
          cancellationReason: req.body.reason || "Customer cancelled",
        })
        .where(eq(serviceRequests.id, job.id));

      if (job.assignedHaulerId) {
        await createNotification(
          job.assignedHaulerId,
          "job_cancelled",
          "Job Cancelled",
          "The customer cancelled this booking.",
          { jobId: job.id }
        );
      }

      res.json({ status: "cancelled" });
    } catch (error: any) {
      console.error("Job cancel error:", error);
      res.status(500).json({ error: "Failed to cancel job" });
    }
  });

  // GET /api/jobs/:jobId/status - full job status + timeline
  app.get("/api/jobs/:jobId/status", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    try {
      const job = await getJob(req.params.jobId);
      if (!job) return res.status(404).json({ error: "Job not found" });

      // Verify access: customer or assigned pro
      if (job.customerId !== userId && job.assignedHaulerId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const isCustomer = job.customerId === userId;
      const isPro = job.assignedHaulerId === userId;

      // Build timeline
      const timeline: { event: string; timestamp: string | null }[] = [
        { event: "booked", timestamp: job.createdAt },
        { event: "accepted", timestamp: job.acceptedAt },
        { event: "started", timestamp: job.startedAt },
        { event: "completed", timestamp: job.completedAt },
      ];

      if (job.cancelledAt) {
        timeline.push({ event: "cancelled", timestamp: job.cancelledAt });
      }

      // Get pro info for customer view (first name + rating only)
      let proInfo = null;
      if (isCustomer && job.assignedHaulerId) {
        const [proUser] = await db
          .select({ firstName: users.firstName })
          .from(users)
          .where(eq(users.id, job.assignedHaulerId))
          .limit(1);

        const [proProfile] = await db
          .select({ rating: haulerProfiles.rating, verified: haulerProfiles.verified })
          .from(haulerProfiles)
          .where(eq(haulerProfiles.userId, job.assignedHaulerId))
          .limit(1);

        proInfo = {
          firstName: proUser?.firstName || "Pro",
          rating: proProfile?.rating || 5.0,
          verified: proProfile?.verified || false,
        };
      }

      // Get customer info for pro view (first name only, address only after acceptance)
      let customerInfo = null;
      if (isPro) {
        const [custUser] = await db
          .select({ firstName: users.firstName })
          .from(users)
          .where(eq(users.id, job.customerId))
          .limit(1);

        const fees = calculateFees(job.priceEstimate || job.finalPrice || 0);

        customerInfo = {
          firstName: custUser?.firstName || "Customer",
          address: ["accepted", "in_progress", "completed"].includes(job.status)
            ? job.pickupAddress
            : null,
          proWillReceive: fees.proPayout,
        };
      }

      // Scope change info
      let scopeChange = null;
      if (job.priceApprovalPending || job.status === "pending_scope_approval") {
        scopeChange = {
          pending: job.priceApprovalPending,
          newPrice: job.verifiedPrice,
          description: job.verifierNotes,
          photos: job.verificationPhotos || [],
          requestedAt: job.priceApprovalRequestedAt,
          respondedAt: job.priceApprovalRespondedAt,
          approved: job.customerApprovedPriceAdjustment,
        };
      }

      res.json({
        jobId: job.id,
        status: job.status,
        serviceType: job.serviceType,
        description: job.description,
        scheduledFor: job.scheduledFor,
        priceEstimate: job.priceEstimate,
        guaranteedCeiling: job.guaranteedCeiling,
        finalPrice: job.finalPrice,
        priceProtected: !!job.guaranteedCeiling,
        timeline: timeline.filter((t) => t.timestamp),
        proInfo,
        customerInfo,
        scopeChange,
        bookingSource: job.bookingSource,
        address: isCustomer ? job.pickupAddress : customerInfo?.address,
      });
    } catch (error: any) {
      console.error("Job status error:", error);
      res.status(500).json({ error: "Failed to get job status" });
    }
  });

  // ── Timeline, Photo Updates, Location Tracking, Ratings ──

  // GET /api/jobs/:jobId/timeline - detailed timeline with custom events
  app.get("/api/jobs/:jobId/timeline", async (req: Request, res: Response) => {
    const { jobId } = req.params;
    const { rows } = await pool.query(
      `SELECT * FROM job_timeline_events WHERE job_id = $1 ORDER BY created_at ASC`, [jobId]
    );

    const { rows: jobs } = await pool.query(
      `SELECT status, created_at, scheduled_date, assigned_hauler_id FROM service_requests WHERE id = $1`, [jobId]
    );
    const job = jobs[0];
    if (!job) return res.status(404).json({ error: "Job not found" });

    const timeline = [
      { id: "sys-created", eventType: "created", title: "Service Requested", description: "Your booking was submitted", createdAt: job.created_at },
      ...rows.map((r: any) => ({ id: r.id, eventType: r.event_type, title: r.title, description: r.description, photoUrl: r.photo_url, metadata: r.metadata, createdAt: r.created_at }))
    ];

    res.json({ jobId, status: job.status, timeline });
  });

  // POST /api/jobs/:jobId/photo-update - pro shares progress photo
  app.post("/api/jobs/:jobId/photo-update", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    const { jobId } = req.params;
    const { photoUrl, caption } = req.body;
    if (!photoUrl) return res.status(400).json({ error: "photoUrl required" });

    const id = nanoid(12);
    await pool.query(
      `INSERT INTO job_timeline_events (id, job_id, event_type, title, description, photo_url, metadata)
       VALUES ($1, $2, 'photo_update', 'Progress Photo', $3, $4, $5)`,
      [id, jobId, caption || "Pro shared a progress photo", photoUrl, JSON.stringify({ proId: userId })]
    );

    res.json({ id, eventType: "photo_update", photoUrl, caption });
  });

  // POST /api/jobs/:jobId/location - pro sends GPS update
  app.post("/api/jobs/:jobId/location", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    const { jobId } = req.params;
    const { lat, lng, heading, speed } = req.body;
    if (lat == null || lng == null) return res.status(400).json({ error: "lat and lng required" });

    const id = nanoid(12);
    await pool.query(
      `INSERT INTO job_location_updates (id, job_id, pro_id, lat, lng, heading, speed)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, jobId, userId, lat, lng, heading || null, speed || null]
    );

    res.json({ id, lat, lng });
  });

  // GET /api/jobs/:jobId/location - get latest pro location
  app.get("/api/jobs/:jobId/location", async (req: Request, res: Response) => {
    const { jobId } = req.params;
    const { rows } = await pool.query(
      `SELECT lat, lng, heading, speed, created_at FROM job_location_updates 
       WHERE job_id = $1 ORDER BY created_at DESC LIMIT 1`, [jobId]
    );

    if (!rows[0]) return res.json({ lat: null, lng: null, lastUpdate: null });
    res.json({ lat: rows[0].lat, lng: rows[0].lng, heading: rows[0].heading, speed: rows[0].speed, lastUpdate: rows[0].created_at });
  });

  // POST /api/jobs/:jobId/rate - customer rates completed job
  app.post("/api/jobs/:jobId/rate", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    const { jobId } = req.params;
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: "Rating 1-5 required" });

    const { rows: jobs } = await pool.query(
      `SELECT assigned_hauler_id FROM service_requests WHERE id = $1`, [jobId]
    );
    if (!jobs[0]) return res.status(404).json({ error: "Job not found" });

    const id = nanoid(12);
    await pool.query(
      `INSERT INTO job_reviews (id, job_id, customer_id, pro_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (job_id) DO UPDATE SET rating = $5, comment = $6`,
      [id, jobId, userId, jobs[0].assigned_hauler_id || "unknown", rating, comment || null]
    );

    await pool.query(
      `INSERT INTO job_timeline_events (id, job_id, event_type, title, description, metadata)
       VALUES ($1, $2, 'rated', 'Service Rated', $3, $4)`,
      [nanoid(12), jobId, `Customer gave ${rating} star${rating > 1 ? 's' : ''}`, JSON.stringify({ rating, comment })]
    );

    res.json({ success: true, rating, comment });
  });
}
