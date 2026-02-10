import type { Express } from "express";
import { storage } from "../../storage";
import { requireAuth, requireCustomer, requireHauler, requireOwnership } from "../../auth-middleware";
import { insertServiceRequestSchema } from "@shared/schema";
import { z } from "zod";
import { stripeService } from "../../stripeService";
import { updateDwellScan } from "../../services/scoringService";
import { processEsgForCompletedJob } from "../../services/job-completion-esg-integration";

// WebSocket broadcast helper (imported from main routes)
declare function broadcastToJob(jobId: string, message: object): void;

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
        // Block booking if payment method verification fails
        return res.status(502).json({
          error: "Payment verification failed",
          code: "PAYMENT_VERIFICATION_FAILED",
          message: "Unable to verify your payment method. Please try again or contact support."
        });
      }

      const validatedData = insertServiceRequestSchema.parse(req.body);

      // Require at least one photo for AI pricing validation
      const photoUrls = validatedData.photoUrls as string[] | undefined;
      if (!photoUrls || photoUrls.length === 0) {
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
      const request = await storage.updateServiceRequest(req.params.id, req.body);
      if (!request) {
        return res.status(404).json({ error: "Service request not found" });
      }

      broadcastToJob(req.params.id, {
        type: "request_updated",
        request,
      });

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

      let paymentResult = null;
      if (existingRequest.stripePaymentIntentId && existingRequest.paymentStatus !== "captured") {
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

          const totalAmount = existingRequest.livePrice || req.body.finalPrice || 0;
          paymentResult = await stripeService.capturePaymentAndPayHauler(
            existingRequest.stripePaymentIntentId,
            haulerStripeAccountId,
            totalAmount,
            pyckerTier,
            isVerifiedLlc
          );
        } catch (paymentError) {
          console.error("Payment capture failed:", paymentError);
        }
      }

      const request = await storage.updateServiceRequest(req.params.id, {
        status: "completed",
        completedAt: new Date().toISOString(),
        finalPrice: req.body.finalPrice,
        ...(paymentResult && {
          paymentStatus: "captured",
          platformFee: paymentResult.platformFee,
          haulerPayout: paymentResult.haulerPayout,
          paidAt: new Date().toISOString(),
        }),
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
        paymentCaptured: !!paymentResult,
      });

      res.json({ ...request, paymentCaptured: !!paymentResult });
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

  // Get hauler's pending matches
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
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const requests = await storage.getServiceRequestsByCustomer(userId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });
}
