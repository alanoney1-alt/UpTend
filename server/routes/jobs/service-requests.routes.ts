import type { Express } from "express";
import { storage } from "../../storage";
import { requireAuth, requireCustomer, requireHauler, requireOwnership } from "../../auth-middleware";
import { insertServiceRequestSchema } from "@shared/schema";
import { z } from "zod";
import { stripeService } from "../../stripeService";
import { updateDwellScan } from "../../services/scoringService";
import { processEsgForCompletedJob } from "../../services/job-completion-esg-integration";
import { sendBookingConfirmation, sendJobAccepted, sendJobStarted, sendJobCompleted, sendProNewJob, sendProEnRoute, sendReviewReminder, sendProPaymentProcessed, sendAdminHighValueBooking } from "../../services/email-service";
import { sendSms } from "../../services/notifications";
import { db as feeDb } from "../../db";
import { sql as feeSql } from "drizzle-orm";

async function getActiveCertCountForPro(proId: string): Promise<number> {
  const now = new Date().toISOString();
  const result = await feeDb.execute(feeSql`
    SELECT COUNT(*) as count FROM pro_certifications
    WHERE pro_id = ${proId} AND status = 'completed'
      AND (expires_at IS NULL OR expires_at > ${now})
  `);
  return Number((result.rows[0] as any)?.count || 0);
}

import { broadcastToJob } from "../../websocket";
import { logJobPayment } from "../../services/accounting-service";
import multer from "multer";
import { uploadFile, getMulterStorage, isCloudStorage } from "../../services/file-storage";

const photoUpload = multer({
  storage: getMulterStorage("job-photos"),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed"));
  },
});

export function registerServiceRequestRoutes(app: Express) {
  // Get pending service requests
  app.get("/api/service-requests/pending", async (req, res) => {
    try {
      const requests = await storage.getPendingRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      if ((error as any).code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }
      res.status(500).json({ error: "Failed to fetch pending requests" });
    }
  });

  // Get service request by ID
  app.get("/api/service-requests/:id", requireAuth, async (req: any, res) => {
    try {
      const request = await storage.getServiceRequestWithDetails(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Service request not found" });
      }

      res.json(request);
    } catch (error) {
      console.error("Error fetching service request:", error);
      if ((error as any).code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }
      res.status(500).json({ error: "Failed to fetch service request" });
    }
  });

  // Create new service request
  app.post("/api/service-requests", requireAuth, requireCustomer, async (req: any, res) => {
    try {
      // Verify customer has payment method on file
      const userId = (req.user as any).userId || (req.user as any).id;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = await storage.getUser(userId);
      const isDevMode = process.env.NODE_ENV !== 'production' || !process.env.REPL_SLUG;
      
      // Payment method check removed — service requests are created with status
      // "pending_payment" and payment is collected after booking via PaymentForm.
      // The old check blocked new users who haven't added a payment method yet.
      if (false && !isDevMode) {
        if (!user?.stripeCustomerId) {
          return res.status(400).json({
            error: "Payment method required",
            code: "PAYMENT_REQUIRED",
            message: "Please add a payment method before booking. You won't be charged until you confirm a booking."
          });
        }

        // Verify actual attached payment method via Stripe
        try {
          const paymentMethods = await stripeService.listPaymentMethods(user.stripeCustomerId);
          if (paymentMethods.data.length === 0) {
            return res.status(400).json({
              error: "Payment method required",
              code: "PAYMENT_REQUIRED",
              message: "Please add a payment method before booking. You won't be charged until you confirm a booking."
            });
          }
        } catch (error) {
          console.error("Error checking Stripe payment methods:", error);
          return res.status(502).json({
            error: "Payment verification failed",
            code: "PAYMENT_VERIFICATION_FAILED",
            message: "Unable to verify your payment method. Please try again or contact support."
          });
        }
      } else {
        console.log("[DEV] Skipping payment verification for service request");
      }

      const validatedData = insertServiceRequestSchema.parse({
        ...req.body,
        customerId: req.body.customerId || userId, // Always use authenticated user if not provided
      });

      // Override customerId with authenticated user — never trust client
      (validatedData as any).customerId = userId;

      // Require at least one photo for AI pricing validation (skip in dev mode)
      const photoUrls = validatedData.photoUrls as string[] | undefined;
      if (!isDevMode && (!photoUrls || photoUrls.length === 0)) {
        return res.status(400).json({
          error: "At least one photo is required for AI price validation"
        });
      }

      const quote = await storage.calculateQuote({
        serviceType: validatedData.serviceType as any,
        loadSize: validatedData.loadEstimate as any,
        pickupLat: validatedData.pickupLat || undefined,
        pickupLng: validatedData.pickupLng || undefined,
        destinationLat: validatedData.destinationLat || undefined,
        destinationLng: validatedData.destinationLng || undefined,
      });

      // Set up Real-Time Matching timer
      const matchingStartedAt = new Date().toISOString();
      const matchingExpiresAt = new Date(Date.now() + 60 * 1000).toISOString();

      // Create PaymentIntent for auth-and-capture-later flow
      let stripePaymentIntentId: string | null = null;
      let paymentStatus = "pending";

      if (user?.stripeCustomerId && process.env.STRIPE_SECRET_KEY) {
        try {
          const paymentIntent = await stripeService.createPaymentIntent(
            quote.totalPrice,
            user.stripeCustomerId,
            `sr-pending`, // Will update metadata after request creation
            'independent'
          );
          stripePaymentIntentId = paymentIntent.id;
          paymentStatus = "authorized";
          console.log(`[Payment] Created PaymentIntent ${paymentIntent.id} for $${quote.totalPrice}`);
        } catch (piError) {
          console.warn("[Payment] Failed to create PaymentIntent, continuing without:", (piError as any).message);
        }
      } else {
        console.log("[DEV] Skipping PaymentIntent creation (no Stripe customer or key)");
      }

      const request = await storage.createServiceRequest({
        ...validatedData,
        priceEstimate: quote.totalPrice,
        livePrice: quote.totalPrice,
        surgeFactor: quote.surgeMultiplier,
        status: "matching", // Start in matching status
        matchingStartedAt,
        matchingExpiresAt,
        needsManualMatch: false,
        // Store customer contact info for alerts
        customerPhone: user?.phone || validatedData.customerPhone,
        customerEmail: user?.email || validatedData.customerEmail,
        stripePaymentIntentId,
        paymentStatus,
        // Guaranteed Price Ceiling — lock in the max price at booking time
        guaranteedCeiling: quote.totalPrice,
        ceilingLockedAt: new Date().toISOString(),
      });

      // Use smart matching with language preference
      const matchedHaulers = await storage.getSmartMatchedHaulers({
        serviceType: validatedData.serviceType,
        loadSize: validatedData.loadEstimate,
        pickupLat: validatedData.pickupLat || undefined,
        pickupLng: validatedData.pickupLng || undefined,
        preferVerifiedPro: validatedData.preferVerifiedPro || false,
      });

      for (const hauler of matchedHaulers.slice(0, 3)) {
        const haulerQuote = await storage.calculateQuote({
          serviceType: validatedData.serviceType as any,
          loadSize: validatedData.loadEstimate as any,
          pickupLat: validatedData.pickupLat || undefined,
          pickupLng: validatedData.pickupLng || undefined,
          destinationLat: validatedData.destinationLat || undefined,
          destinationLng: validatedData.destinationLng || undefined,
          vehicleType: hauler.profile.vehicleType as any,
        });

        await storage.createMatchAttempt({
          requestId: request.id,
          haulerId: hauler.id,
          status: "pending",
          quotedPrice: haulerQuote.totalPrice,
          etaMinutes: Math.floor(Math.random() * 20) + 15,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
        });
      }

      // Fire-and-forget: booking confirmation email + SMS
      const customerEmail = user?.email || validatedData.customerEmail;
      if (customerEmail) {
        sendBookingConfirmation(customerEmail, request).catch(err => console.error('[EMAIL] Failed booking confirmation:', err.message));
      }
      if (validatedData.customerPhone) {
        sendSms({ to: validatedData.customerPhone, message: `UpTend booking confirmed! Your ${request.serviceType || "service"} request is submitted. We're matching you with a Pro now.` }).catch(err => console.error('[SMS] Failed booking-confirm:', err.message));
      }

      // Fire-and-forget: admin alert for high-value bookings (>$500)
      const price = Number(request.priceEstimate || request.livePrice || 0);
      if (price >= 500 && process.env.ADMIN_EMAIL) {
        sendAdminHighValueBooking(process.env.ADMIN_EMAIL, request).catch(err => console.error('[EMAIL] Failed high-value alert:', err.message));
      }

      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Error creating service request:", error);

      // Handle specific database errors
      const dbError = error as any;
      if (dbError.code === '23505') {
        return res.status(409).json({ error: "Duplicate service request" });
      }
      if (dbError.code === '23503') {
        return res.status(400).json({ error: "Invalid reference data provided" });
      }
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }

      res.status(500).json({ error: "Failed to create service request" });
    }
  });

  // Update service request
  app.patch("/api/service-requests/:id", requireAuth, async (req, res) => {
    try {
      // Auto-assign the pro when they accept a job
      if (req.body.status === "assigned" && !req.body.assignedHaulerId) {
        const userId = (req.user as any)?.userId || (req.user as any)?.id;
        if (userId) {
          const haulerProfile = await storage.getHaulerProfile(userId).catch(() => null);
          if (haulerProfile) {
            req.body.assignedHaulerId = haulerProfile.id;
          }
        }
      }
      const request = await storage.updateServiceRequest(req.params.id, req.body);
      if (!request) {
        return res.status(404).json({ error: "Service request not found" });
      }

      broadcastToJob(req.params.id, {
        type: "request_updated",
        request,
      });

      // Fire-and-forget: email + SMS on status change
      if (req.body.status === "en_route" && request) {
        const pro = request.assignedHaulerId ? await storage.getHaulerProfile(request.assignedHaulerId).catch(() => null) : null;
        if (request.customerEmail) {
          sendProEnRoute(request.customerEmail, request, pro || {}).catch(err => console.error('[EMAIL] Failed pro-en-route:', err.message));
        }
        if ((request as any).customerPhone) {
          sendSms({ to: (request as any).customerPhone, message: `Your UpTend Pro ${pro?.firstName || ""} is on the way! ETA: ~${(pro as any)?.etaMinutes || 30} min.` }).catch(err => console.error('[SMS] Failed en-route:', err.message));
        }
      }
      if (req.body.status === "assigned" && request) {
        // Notify customer that a pro accepted (email + SMS)
        const pro = request.assignedHaulerId ? await storage.getHaulerProfile(request.assignedHaulerId).catch(() => null) : null;
        if (request.customerEmail) {
          sendJobAccepted(request.customerEmail, request, pro || {}).catch(err => console.error('[EMAIL] Failed job-accepted:', err.message));
        }
        if ((request as any).customerPhone) {
          sendSms({ to: (request as any).customerPhone, message: `Great news! ${(pro as any)?.firstName || "A Pro"} accepted your UpTend job and will be in touch shortly.` }).catch(err => console.error('[SMS] Failed job-accepted:', err.message));
        }
        // Notify pro of new job (email + SMS)
        if (request.assignedHaulerId) {
          const hauler = pro || await storage.getHaulerProfile(request.assignedHaulerId).catch(() => null);
          const haulerUser = hauler?.userId ? await storage.getUser(hauler.userId).catch(() => null) : null;
          if (haulerUser?.email) {
            sendProNewJob(haulerUser.email, request).catch(err => console.error('[EMAIL] Failed pro-new-job:', err.message));
          }
          if (haulerUser?.phone) {
            sendSms({ to: haulerUser.phone, message: `New UpTend job! ${request.serviceType || "Service"} at ${request.pickupAddress || "see app"}. Open the app to view details.` }).catch(err => console.error('[SMS] Failed pro-new-job:', err.message));
          }
        }
      }

      res.json(request);
    } catch (error) {
      console.error("Error updating service request:", error);

      const dbError = error as any;
      if (dbError.code === '23505') {
        return res.status(409).json({ error: "Duplicate entry" });
      }
      if (dbError.code === '23503') {
        return res.status(400).json({ error: "Invalid reference data" });
      }
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }

      res.status(500).json({ error: "Failed to update service request" });
    }
  });

  // Start job
  app.post("/api/service-requests/:id/start", requireAuth, async (req, res) => {
    try {
      const request = await storage.updateServiceRequest(req.params.id, {
        status: "in_progress",
        startedAt: new Date().toISOString(),
      });
      if (!request) {
        return res.status(404).json({ error: "Service request not found" });
      }

      broadcastToJob(req.params.id, {
        type: "job_started",
        request,
      });

      // Fire-and-forget: job started email + SMS
      if (request?.customerEmail) {
        sendJobStarted(request.customerEmail, request).catch(err => console.error('[EMAIL] Failed job-started:', err.message));
      }
      if ((request as any)?.customerPhone) {
        sendSms({ to: (request as any).customerPhone, message: `Your UpTend ${request?.serviceType || "service"} job has started! Your Pro is now working.` }).catch(err => console.error('[SMS] Failed job-started:', err.message));
      }

      res.json(request);
    } catch (error) {
      console.error("Error starting job:", error);

      const dbError = error as any;
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }

      res.status(500).json({ error: "Failed to start job" });
    }
  });

  // Complete job
  app.post("/api/service-requests/:id/complete", requireAuth, async (req, res) => {
    try {
      const existingRequest = await storage.getServiceRequest(req.params.id);
      if (!existingRequest) {
        return res.status(404).json({ error: "Service request not found" });
      }

      const totalAmount = req.body.finalPrice || existingRequest.livePrice || existingRequest.priceEstimate || 0;
      // Use base service price (excluding 7% UpTend Protection Fee) for payout calculation
      const baseServicePrice = (existingRequest as any).baseServicePrice || (totalAmount / 1.07);
      let paymentResult = null;
      let paymentStatus = existingRequest.paymentStatus || "pending";
      let capturedPayment = false;

      // Attempt Stripe capture if we have a payment intent
      if (existingRequest.stripePaymentIntentId && paymentStatus !== "captured") {
        try {
          let haulerStripeAccountId = null;
          let pyckerTier = 'independent';
          let isVerifiedLlc = false;
          if (existingRequest.assignedHaulerId) {
            const haulerProfile = await storage.getHaulerProfile(existingRequest.assignedHaulerId);
            if (haulerProfile?.stripeAccountId && haulerProfile?.stripeOnboardingComplete) {
              haulerStripeAccountId = haulerProfile.stripeAccountId;
            }
            pyckerTier = haulerProfile?.pyckerTier || 'independent';
            isVerifiedLlc = haulerProfile?.isVerifiedLlc || false;
          }

          const activeCertCount = existingRequest.assignedHaulerId ? await getActiveCertCountForPro(existingRequest.assignedHaulerId) : 0;
          paymentResult = await stripeService.capturePaymentAndPayHauler(
            existingRequest.stripePaymentIntentId,
            haulerStripeAccountId,
            baseServicePrice,
            pyckerTier,
            isVerifiedLlc,
            existingRequest.serviceType, // Pass serviceType for $50 minimum payout floor exemption on recurring services
            activeCertCount
          );
          paymentStatus = "captured";
          capturedPayment = true;
        } catch (paymentError) {
          console.error("Payment capture failed (job will still complete):", paymentError);
          paymentStatus = "capture_failed";
        }
      }

      // Always calculate platform fee breakdown (even without Stripe)
      const breakdown = paymentResult || stripeService.calculatePayoutBreakdown(totalAmount, 'independent', false, existingRequest.serviceType);

      const request = await storage.updateServiceRequest(req.params.id, {
        status: "completed",
        completedAt: new Date().toISOString(),
        finalPrice: totalAmount,
        paymentStatus,
        platformFee: breakdown.platformFee,
        haulerPayout: breakdown.haulerPayout,
        ...(capturedPayment && { paidAt: new Date().toISOString() }),
      });

      if (existingRequest.customerId) {
        await storage.incrementCustomerJobCount(existingRequest.customerId);
      }

      try {
        await updateDwellScan(existingRequest.customerId, existingRequest.serviceType, req.params.id);
      } catch (scoreErr) {
        console.error("Home score update failed (non-blocking):", scoreErr);
      }

      // Calculate and store ESG metrics (non-blocking)
      try {
        const esgResult = await processEsgForCompletedJob(request!, req.body);
        if (esgResult.success) {
          console.log(`[ESG] ✅ Metrics saved for job ${req.params.id}: ${esgResult.esgMetrics?.esgScore}/100 score`);
        } else {
          console.log(`[ESG] ⚠️  No ESG metrics for job ${req.params.id}: ${esgResult.error}`);
        }
      } catch (esgErr) {
        console.error("[ESG] ESG calculation failed (non-blocking):", esgErr);
      }

      broadcastToJob(req.params.id, {
        type: "job_completed",
        request,
        paymentCaptured: capturedPayment,
      });

      // Fire-and-forget: accounting ledger entry
      if (capturedPayment && breakdown) {
        logJobPayment(
          { id: req.params.id, serviceType: existingRequest.serviceType },
          { totalAmount, platformFee: breakdown.platformFee || 0, haulerPayout: breakdown.haulerPayout || 0 }
        ).catch(err => console.error('[ACCOUNTING] Failed logJobPayment:', err.message));
      }

      // Fire-and-forget: job completed receipt email + SMS
      if (request?.customerEmail) {
        sendJobCompleted(request.customerEmail, request, {
          finalPrice: request.finalPrice || req.body.finalPrice,
          livePrice: request.livePrice,
          platformFee: request.platformFee,
        }).catch(err => console.error('[EMAIL] Failed job-completed:', err.message));
      }
      if ((request as any)?.customerPhone) {
        sendSms({ to: (request as any).customerPhone, message: `Your UpTend job is complete! Total: $${(totalAmount || 0).toFixed(2)}. Please rate your Pro in the app!` }).catch(err => console.error('[SMS] Failed job-completed:', err.message));
      }

      // Fire-and-forget: notify pro of payment processed
      if (capturedPayment && request?.assignedHaulerId) {
        const haulerProfile = await storage.getHaulerProfile(request.assignedHaulerId).catch(() => null);
        const haulerUser = haulerProfile?.userId ? await storage.getUser(haulerProfile.userId).catch(() => null) : null;
        if (haulerUser?.email) {
          sendProPaymentProcessed(haulerUser.email, { ...request, haulerPayout: breakdown.haulerPayout }).catch(err => console.error('[EMAIL] Failed pro-payment:', err.message));
        }
      }

      // Fire-and-forget: schedule review reminder (24hr)
      if (request?.customerEmail) {
        setTimeout(() => {
          sendReviewReminder(request!.customerEmail!, request!).catch(err => console.error('[EMAIL] Failed review-reminder:', err.message));
        }, 24 * 60 * 60 * 1000);
      }

      res.json({ ...request, paymentCaptured: capturedPayment });
    } catch (error) {
      console.error("Error completing job:", error);

      const dbError = error as any;
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }

      res.status(500).json({ error: "Failed to complete job" });
    }
  });

  // Photo upload for job proof of completion
  app.post("/api/jobs/upload-photos", requireAuth, photoUpload.any(), async (req, res) => {
    try {
      const { jobId, photoType } = req.body; // photoType: "before" | "after"
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No photos uploaded" });
      }

      const uploadedUrls = isCloudStorage
        ? await Promise.all(files.map(f => uploadFile(f.buffer, f.originalname, f.mimetype, "job-photos")))
        : files.map(f => `/uploads/job-photos/${f.filename}`);

      // Store photo references in database
      const column = photoType === "after" ? "after_photos" : "before_photos";
      await storage.updateServiceRequest(jobId, {
        [column]: uploadedUrls,
      });

      res.json({ success: true, urls: uploadedUrls, count: files.length });
    } catch (error) {
      console.error("Photo upload error:", error);
      res.status(500).json({ error: "Failed to upload photos" });
    }
  });

  // Report issue with a job
  app.post("/api/jobs/:jobId/report-issue", requireAuth, async (req, res) => {
    try {
      const { jobId } = req.params;
      const { type, description } = req.body;

      // In production, this would create a support ticket/issue record
      // For now, log it and return success
      console.log(`Issue reported for job ${jobId}:`, { type, description });

      // Could store in database, send notification to support team, etc.
      res.json({
        success: true,
        issueId: `ISS-${Date.now()}`,
        jobId,
        type,
        message: "Issue reported successfully. Support will contact you shortly."
      });
    } catch (error) {
      console.error("Report issue error:", error);
      res.status(500).json({ error: "Failed to report issue" });
    }
  });

  // Get customer's service requests
  app.get("/api/customers/:customerId/requests", requireAuth, requireCustomer, requireOwnership("customerId"), async (req, res) => {
    try {
      const requests = await storage.getServiceRequestsByCustomer(req.params.customerId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching customer requests:", error);

      const dbError = error as any;
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }

      res.status(500).json({ error: "Failed to fetch customer requests" });
    }
  });

  // Get Pro's pending matches
  app.get("/api/pros/:proId/matches", requireAuth, requireHauler, async (req, res) => {
    try {
      const matches = await storage.getPendingMatchesForHauler(req.params.proId);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching matches:", error);

      const dbError = error as any;
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }

      res.status(500).json({ error: "Failed to fetch matches" });
    }
  });

  // Legacy hauler endpoint (backward compatibility)
  app.get("/api/haulers/:haulerId/matches", requireAuth, requireHauler, async (req, res) => {
    try {
      const matches = await storage.getPendingMatchesForHauler(req.params.haulerId);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching matches:", error);

      const dbError = error as any;
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }

      res.status(500).json({ error: "Failed to fetch matches" });
    }
  });

  // Job tracking data — serves the /track/:jobId page
  app.get("/api/jobs/:jobId/track", async (req, res) => {
    try {
      const job = await storage.getServiceRequest(req.params.jobId);
      if (!job) return res.status(404).json({ error: "Job not found" });

      // Get latest hauler location if assigned
      let haulerLocation = null;
      if (job.haulerId) {
        try {
          const locations = await storage.getLocationHistory(job.haulerId, job.id);
          if (locations.length > 0) {
            const latest = locations[locations.length - 1];
            haulerLocation = { lat: Number(latest.lat), lng: Number(latest.lng), recordedAt: latest.recordedAt };
          }
        } catch { /* no location data yet */ }
      }

      res.json({
        job,
        haulerLocation,
        customerLocation: null,
        pickup: {
          lat: job.pickupLat ? Number(job.pickupLat) : null,
          lng: job.pickupLng ? Number(job.pickupLng) : null,
          address: job.pickupAddress || "",
        },
        destination: job.dropoffAddress ? {
          lat: job.dropoffLat ? Number(job.dropoffLat) : null,
          lng: job.dropoffLng ? Number(job.dropoffLng) : null,
          address: job.dropoffAddress,
        } : null,
      });
    } catch (error) {
      console.error("Error fetching tracking data:", error);
      res.status(500).json({ error: "Failed to fetch tracking data" });
    }
  });

  // Get completed jobs for a pro
  app.get("/api/service-requests/pro/:proId", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      const completedJobs = await storage.getCompletedJobsForHauler(userId);
      res.json(completedJobs || []);
    } catch (error) {
      console.error("Error fetching pro service requests:", error);
      res.status(500).json({ error: "Failed to fetch service requests" });
    }
  });

  // Pro accepts a job
  app.post("/api/service-requests/:id/accept", requireAuth, requireHauler, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      const { proId } = req.body;

      const request = await storage.getServiceRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Service request not found" });
      }

      // Check if already assigned
      if (request.status === "assigned" || request.status === "in_progress" || request.status === "completed") {
        return res.status(400).json({ error: "This job has already been taken" });
      }

      // Get hauler profile
      const haulerProfile = await storage.getHaulerProfile(userId);
      if (!haulerProfile) {
        return res.status(400).json({ error: "Pro profile not found" });
      }

      const updated = await storage.updateServiceRequest(req.params.id, {
        status: "assigned",
        assignedHaulerId: haulerProfile.id,
      });

      broadcastToJob(req.params.id, { type: "request_updated", request: updated });

      // Fire-and-forget: email notifications
      if (updated?.customerEmail) {
        sendJobAccepted(updated.customerEmail, updated, haulerProfile || {}).catch(err => console.error('[EMAIL] Failed job-accepted:', err.message));
      }

      res.json({ success: true, request: updated });
    } catch (error) {
      console.error("Error accepting job:", error);
      res.status(500).json({ error: "Failed to accept job" });
    }
  });

  // Pro confirms they called the customer
  app.post("/api/service-requests/:id/confirm-call", requireAuth, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;

      const request = await storage.getServiceRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Service request not found" });
      }

      const updated = await storage.updateServiceRequest(req.params.id, {
        proCalledCustomerAt: new Date().toISOString(),
      });

      broadcastToJob(req.params.id, { type: "request_updated", request: updated });

      res.json({ success: true, request: updated });
    } catch (error) {
      console.error("Error confirming call:", error);
      res.status(500).json({ error: "Failed to confirm call" });
    }
  });

  // Pro locks the price at job start (on-site verification)
  app.post("/api/service-requests/:id/lock-price", requireAuth, requireHauler, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      const { newPrice, reason, adjustments } = req.body;

      const request = await storage.getServiceRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Service request not found" });
      }

      const updated = await storage.updateServiceRequest(req.params.id, {
        livePrice: newPrice,
        priceLocked: true,
        priceLockedAt: new Date().toISOString(),
      });

      broadcastToJob(req.params.id, { type: "price_locked", request: updated, newPrice });

      res.json({ success: true, request: updated });
    } catch (error) {
      console.error("Error locking price:", error);
      res.status(500).json({ error: "Failed to lock price" });
    }
  });

  // Update service request status (used by active-job.tsx)
  app.patch("/api/service-requests/:id/status", requireAuth, async (req: any, res) => {
    try {
      const { status, ...data } = req.body;

      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      const updated = await storage.updateServiceRequest(req.params.id, { status, ...data });
      if (!updated) {
        return res.status(404).json({ error: "Service request not found" });
      }

      broadcastToJob(req.params.id, { type: "request_updated", request: updated });

      res.json(updated);
    } catch (error) {
      console.error("Error updating status:", error);
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  // Get access code for a job (gate code, lockbox, etc.)
  app.get("/api/service-requests/:id/access-code", requireAuth, async (req: any, res) => {
    try {
      const request = await storage.getServiceRequest(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Service request not found" });
      }

      // Access code is stored in the service request details
      const code = (request as any).accessCode || (request as any).gateCode || null;

      if (code) {
        res.json({ code });
      } else {
        res.json({ message: "No access code provided for this job" });
      }
    } catch (error) {
      console.error("Error getting access code:", error);
      res.status(500).json({ error: "Failed to get access code" });
    }
  });

  // PII reveal audit log (fire-and-forget from frontend)
  app.post("/api/audit/pii-reveal", requireAuth, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      const { fieldType, resourceId } = req.body;
      // Log for compliance - in production this would write to an audit table
      console.log(`[PII AUDIT] User ${userId} revealed ${fieldType} for ${resourceId} at ${new Date().toISOString()}`);
      res.json({ success: true });
    } catch (error) {
      // Don't fail - this is a non-blocking audit log
      res.json({ success: true });
    }
  });

  // Get customer's jobs
  app.get("/api/my-jobs", requireAuth, async (req: any, res) => {
    try {
      const userId = (req.user as any).userId || (req.user as any).id;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const requests = await storage.getServiceRequestsByCustomer(userId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });
}
