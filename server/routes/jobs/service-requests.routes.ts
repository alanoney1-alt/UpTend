import type { Express } from "express";
import { storage } from "../../storage";
import { requireAuth, requireCustomer, requireHauler, requireOwnership } from "../../auth-middleware";
import { insertServiceRequestSchema } from "@shared/schema";
import { z } from "zod";
import { stripeService } from "../../stripeService";
import { updateDwellScan } from "../../services/scoringService";
import { processEsgForCompletedJob } from "../../services/job-completion-esg-integration";
import { sendBookingConfirmation, sendJobAccepted, sendJobStarted, sendJobCompleted, sendProNewJob } from "../../services/email-service";

import { broadcastToJob } from "../../websocket";

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
      const userId = req.user.localAuth ? req.user.userId : req.user.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const user = await storage.getUser(userId);
      const isDevMode = process.env.NODE_ENV !== 'production' || !process.env.REPL_SLUG;
      
      if (!isDevMode) {
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

      const validatedData = insertServiceRequestSchema.parse(req.body);

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

      // Set up 60-second matching timer
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

      // Fire-and-forget: booking confirmation email
      const customerEmail = user?.email || validatedData.customerEmail;
      if (customerEmail) {
        sendBookingConfirmation(customerEmail, request).catch(err => console.error('[EMAIL] Failed booking confirmation:', err.message));
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

      // Fire-and-forget: email on status change
      if (req.body.status === "assigned" && request) {
        // Notify customer that a pro accepted
        if (request.customerEmail) {
          const pro = request.assignedHaulerId ? await storage.getHaulerProfile(request.assignedHaulerId).catch(() => null) : null;
          sendJobAccepted(request.customerEmail, request, pro || {}).catch(err => console.error('[EMAIL] Failed job-accepted:', err.message));
        }
        // Notify pro of new job
        if (request.assignedHaulerId) {
          const hauler = await storage.getHaulerProfile(request.assignedHaulerId).catch(() => null);
          const haulerUser = hauler?.userId ? await storage.getUser(hauler.userId).catch(() => null) : null;
          if (haulerUser?.email) {
            sendProNewJob(haulerUser.email, request).catch(err => console.error('[EMAIL] Failed pro-new-job:', err.message));
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

      // Fire-and-forget: job started email
      if (request?.customerEmail) {
        sendJobStarted(request.customerEmail, request).catch(err => console.error('[EMAIL] Failed job-started:', err.message));
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

          paymentResult = await stripeService.capturePaymentAndPayHauler(
            existingRequest.stripePaymentIntentId,
            haulerStripeAccountId,
            totalAmount,
            pyckerTier,
            isVerifiedLlc
          );
          paymentStatus = "captured";
          capturedPayment = true;
        } catch (paymentError) {
          console.error("Payment capture failed (job will still complete):", paymentError);
          paymentStatus = "capture_failed";
        }
      }

      // Always calculate platform fee breakdown (even without Stripe)
      const breakdown = paymentResult || stripeService.calculatePayoutBreakdown(totalAmount);

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
        const esgResult = await processEsgForCompletedJob(request, req.body);
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

      // Fire-and-forget: job completed receipt email
      if (request?.customerEmail) {
        sendJobCompleted(request.customerEmail, request, {
          finalPrice: request.finalPrice || req.body.finalPrice,
          livePrice: request.livePrice,
          platformFee: request.platformFee,
        }).catch(err => console.error('[EMAIL] Failed job-completed:', err.message));
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
  app.post("/api/jobs/upload-photos", requireAuth, async (req, res) => {
    try {
      const { jobId } = req.body;

      // In production, photos would be uploaded to object storage
      // For now, we'll simulate with placeholder URLs
      const uploadedUrls: string[] = [];

      // If files were uploaded via multipart form data, they'd be processed here
      // For demo purposes, return success with placeholder
      const timestamp = Date.now();
      uploadedUrls.push(
        `/api/photos/${jobId}/${timestamp}_before.jpg`,
        `/api/photos/${jobId}/${timestamp}_after.jpg`
      );

      res.json({
        success: true,
        urls: uploadedUrls,
        message: "Photos uploaded successfully"
      });
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
