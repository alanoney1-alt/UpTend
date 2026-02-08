import type { Express } from "express";
import { storage } from "../../storage";
import { requireAuth, requireAdmin, requireHauler } from "../../auth-middleware";
import { stripeService } from "../../stripeService";
import { updateDwellScan } from "../../services/scoringService";

// WebSocket broadcast helper (imported from main routes)
declare function broadcastToJob(jobId: string, message: object): void;

export function registerJobManagementRoutes(app: Express) {
  // PYCKER starts a job (marks as in_progress)
  app.post("/api/jobs/:jobId/start", requireAuth, requireHauler, async (req, res) => {
    try {
      const { jobId } = req.params;
      const userId = (req.user as any).id;

      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (job.assignedHaulerId !== userId) {
        return res.status(403).json({ error: "Not assigned to this job" });
      }

      if (job.status !== "accepted" && job.status !== "assigned") {
        return res.status(400).json({ error: "Job cannot be started from current status" });
      }

      // Create job completion record to track progress
      const completion = await storage.createJobCompletion({
        serviceRequestId: jobId,
        haulerId: userId,
        arrivedAtPickup: true,
        arrivedAtPickupAt: new Date().toISOString(),
        originalQuote: job.livePrice || 0,
        finalAmount: job.livePrice || 0,
        createdAt: new Date().toISOString(),
      });

      // Update job status
      const updated = await storage.updateServiceRequest(jobId, {
        status: "in_progress",
        startedAt: new Date().toISOString(),
      });

      // Broadcast update to connected clients
      broadcastToJob(jobId, { type: "job_started", job: updated });

      res.json({ success: true, job: updated, completion });
    } catch (error) {
      console.error("Error starting job:", error);

      const dbError = error as any;
      if (dbError.code === '23505') {
        return res.status(409).json({ error: "Job already started" });
      }
      if (dbError.code === '23503') {
        return res.status(400).json({ error: "Invalid job reference" });
      }
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }

      res.status(500).json({ error: "Failed to start job" });
    }
  });

  // PYCKER adds extra items/adjustments
  app.post("/api/jobs/:jobId/adjustments", requireAuth, requireHauler, async (req, res) => {
    try {
      const { jobId } = req.params;
      const userId = (req.user as any).id;
      const { adjustmentType, itemName, priceChange, reason, photoUrls, quantity } = req.body;

      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (job.assignedHaulerId !== userId) {
        return res.status(403).json({ error: "Not assigned to this job" });
      }

      if (job.status !== "in_progress") {
        return res.status(400).json({ error: "Can only add adjustments to in-progress jobs" });
      }

      if (!adjustmentType || !itemName || priceChange === undefined) {
        return res.status(400).json({ error: "adjustmentType, itemName, and priceChange are required" });
      }

      const adjustment = await storage.createJobAdjustment({
        serviceRequestId: jobId,
        haulerId: userId,
        adjustmentType,
        itemName,
        priceChange,
        reason,
        photoUrls,
        quantity,
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      // Broadcast to customer for approval
      broadcastToJob(jobId, { type: "adjustment_added", adjustment });

      res.json({ success: true, adjustment });
    } catch (error) {
      console.error("Error adding adjustment:", error);

      const dbError = error as any;
      if (dbError.code === '23503') {
        return res.status(400).json({ error: "Invalid job reference" });
      }
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }
      if (dbError.name === 'ValidationError') {
        return res.status(400).json({ error: dbError.message });
      }

      res.status(500).json({ error: "Failed to add adjustment" });
    }
  });

  // Get all adjustments for a job
  app.get("/api/jobs/:jobId/adjustments", requireAuth, async (req, res) => {
    try {
      const { jobId } = req.params;
      const adjustments = await storage.getJobAdjustmentsByRequest(jobId);
      res.json(adjustments);
    } catch (error) {
      console.error("Error getting adjustments:", error);

      const dbError = error as any;
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }

      res.status(500).json({ error: "Failed to get adjustments" });
    }
  });

  // Customer approves/declines an adjustment
  app.patch("/api/jobs/:jobId/adjustments/:adjustmentId", requireAuth, async (req, res) => {
    try {
      const { jobId, adjustmentId } = req.params;
      const { action } = req.body;
      const userId = (req.user as any).id;

      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Customer or admin can approve/decline
      const isCustomer = job.customerId === userId;
      const user = await storage.getUser(userId);
      const isAdmin = user?.role === "admin";

      if (!isCustomer && !isAdmin) {
        return res.status(403).json({ error: "Only customer or admin can respond to adjustments" });
      }

      let adjustment;
      if (action === "approve") {
        adjustment = await storage.approveJobAdjustment(adjustmentId);
      } else if (action === "decline") {
        adjustment = await storage.declineJobAdjustment(adjustmentId);
      } else {
        return res.status(400).json({ error: "Invalid action. Use 'approve' or 'decline'" });
      }

      if (!adjustment) {
        return res.status(404).json({ error: "Adjustment not found" });
      }

      // Broadcast to PYCKER
      broadcastToJob(jobId, { type: "adjustment_updated", adjustment });

      res.json({ success: true, adjustment });
    } catch (error) {
      console.error("Error updating adjustment:", error);

      const dbError = error as any;
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }
      if (dbError.name === 'ValidationError') {
        return res.status(400).json({ error: dbError.message });
      }

      res.status(500).json({ error: "Failed to update adjustment" });
    }
  });

  // PYCKER updates job completion checklist
  app.patch("/api/jobs/:jobId/completion", requireAuth, requireHauler, async (req, res) => {
    try {
      const { jobId } = req.params;
      const userId = (req.user as any).id;
      const updates = req.body;

      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (job.assignedHaulerId !== userId) {
        return res.status(403).json({ error: "Not assigned to this job" });
      }

      let completion = await storage.getJobCompletion(jobId);
      if (!completion) {
        completion = await storage.createJobCompletion({
          serviceRequestId: jobId,
          haulerId: userId,
          originalQuote: job.livePrice || 0,
          finalAmount: job.livePrice || 0,
          createdAt: new Date().toISOString(),
        });
      }

      const updated = await storage.updateJobCompletion(completion.id, updates);

      res.json({ success: true, completion: updated });
    } catch (error) {
      console.error("Error updating completion:", error);

      const dbError = error as any;
      if (dbError.code === '23503') {
        return res.status(400).json({ error: "Invalid job reference" });
      }
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }
      if (dbError.name === 'ValidationError') {
        return res.status(400).json({ error: dbError.message });
      }

      res.status(500).json({ error: "Failed to update completion" });
    }
  });

  // Get job completion status
  app.get("/api/jobs/:jobId/completion", requireAuth, async (req, res) => {
    try {
      const { jobId } = req.params;
      const completion = await storage.getJobCompletion(jobId);
      res.json(completion || null);
    } catch (error) {
      console.error("Error getting completion:", error);

      const dbError = error as any;
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }

      res.status(500).json({ error: "Failed to get completion" });
    }
  });

  // PYCKER marks job as complete and triggers payment capture
  app.post("/api/jobs/:jobId/complete", requireAuth, requireHauler, async (req, res) => {
    try {
      const { jobId } = req.params;
      const userId = (req.user as any).id;

      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (job.assignedHaulerId !== userId) {
        return res.status(403).json({ error: "Not assigned to this job" });
      }

      if (job.status !== "in_progress") {
        return res.status(400).json({ error: "Job must be in progress to complete" });
      }

      // Check completion checklist
      const completion = await storage.getJobCompletion(jobId);
      if (!completion) {
        return res.status(400).json({ error: "Job completion record not found. Start the job first." });
      }

      if (!completion.workCompleted) {
        return res.status(400).json({ error: "Please verify work is completed before finishing" });
      }

      // BLOCKING RULE: Check verification for jobs that require it
      const requiresVerification = ["junk_removal", "garage_cleanout", "light_demolition"].includes(job.serviceType || "");
      if (requiresVerification) {
        const verification = await storage.getJobVerification(jobId);

        if (!verification) {
          return res.status(400).json({
            error: "Job verification required",
            message: "This job type requires verification. Please complete before/after photos and disposal tracking.",
            missingSteps: ["before_photos", "item_tracking", "after_photos", "disposal_verification", "sustainability_report"],
          });
        }

        const disposalRecords = await storage.getDisposalRecordsByServiceRequest(jobId);
        const steps = verification.stepsCompleted as any || {};

        // Check all required verification steps
        const hasBeforePhotos = steps.step1 === true;
        const hasDisposalRecords = disposalRecords.length > 0;
        const hasAfterPhotos = steps.step3 === true;
        const hasReport = steps.step5 === true;
        const hasCustomerConfirmation = !!verification.customerConfirmedAt;

        // Check 48-hour auto-approval
        let autoApprovalEligible = false;
        if (hasReport && verification.verificationStatus === "step_5_report_generated") {
          const reportTime = new Date(verification.updatedAt || verification.createdAt);
          const hoursSinceReport = (Date.now() - reportTime.getTime()) / (1000 * 60 * 60);
          autoApprovalEligible = hoursSinceReport >= 48;
        }

        const canComplete = hasBeforePhotos && hasDisposalRecords && hasAfterPhotos && hasReport;
        const canReleasePayment = canComplete && (hasCustomerConfirmation || autoApprovalEligible);

        if (!canComplete) {
          const missingSteps: string[] = [];
          if (!hasBeforePhotos) missingSteps.push("before_photos");
          if (!hasDisposalRecords) missingSteps.push("item_tracking");
          if (!hasAfterPhotos) missingSteps.push("after_photos");
          if (!hasReport) missingSteps.push("sustainability_report");

          return res.status(400).json({
            error: "Verification incomplete",
            message: "Please complete all verification steps before marking job as complete",
            missingSteps,
          });
        }

        if (!canReleasePayment) {
          return res.status(400).json({
            error: "Customer confirmation required",
            message: autoApprovalEligible
              ? "Waiting for 48-hour auto-approval period"
              : "Job can be marked complete but payment will not be released until customer confirms (or after 48 hours)",
            hoursRemaining: autoApprovalEligible ? 0 : Math.ceil(48 - ((Date.now() - new Date(verification.updatedAt || verification.createdAt).getTime()) / (1000 * 60 * 60))),
          });
        }
      }

      // Calculate final amount including approved adjustments
      const adjustments = await storage.getJobAdjustmentsByRequest(jobId);
      const approvedAdjustments = adjustments.filter(a => a.status === "approved");
      const pendingAdjustments = adjustments.filter(a => a.status === "pending");

      // Warn if there are pending adjustments
      if (pendingAdjustments.length > 0) {
        return res.status(400).json({
          error: "There are pending adjustments waiting for customer approval",
          pendingCount: pendingAdjustments.length
        });
      }

      const baseAmount = job.livePrice || 0;
      const adjustmentsTotal = approvedAdjustments.reduce((sum, a) => sum + (a.priceChange || 0), 0);
      const finalAmount = baseAmount + adjustmentsTotal;

      // Calculate base service price for Pro payout (excludes 7% UpTend Protection Fee)
      // Pro gets 80% of baseServicePrice, not the total customer payment
      const baseServicePrice = job.baseServicePrice || (baseAmount / 1.07);
      const baseServicePriceWithAdjustments = baseServicePrice + adjustmentsTotal;

      // Update completion record
      await storage.updateJobCompletion(completion.id, {
        workCompleted: true,
        workCompletedAt: new Date().toISOString(),
        finalAmount,
        adjustmentsTotal,
      });

      // Update service request
      const updated = await storage.updateServiceRequest(jobId, {
        status: "completed",
        livePrice: finalAmount,
      });

      try {
        await updateDwellScan(job.customerId, job.serviceType, jobId);
      } catch (scoreErr) {
        console.error("Home score update failed (non-blocking):", scoreErr);
      }

      // Attempt to capture payment
      if (job.stripePaymentIntentId) {
        try {
          let haulerStripeAccountId = null;
          let pyckerTier = 'independent';
          let isVerifiedLlc = false;
          let insuranceSurcharge = 0;
          if (job.assignedHaulerId) {
            const haulerProfile = await storage.getHaulerProfile(job.assignedHaulerId);
            if (haulerProfile?.stripeAccountId && haulerProfile?.stripeOnboardingComplete) {
              haulerStripeAccountId = haulerProfile.stripeAccountId;
            }
            pyckerTier = haulerProfile?.pyckerTier || 'independent';
            isVerifiedLlc = haulerProfile?.isVerifiedLlc || false;

            // Apply insurance surcharge for uninsured Pros
            if (!haulerProfile?.hasOwnLiabilityInsurance && !haulerProfile?.insuranceSurchargeWaived) {
              insuranceSurcharge = 10;
            }
          }

          // Deduct insurance surcharge from Pro payout (if applicable)
          const payoutAmount = baseServicePriceWithAdjustments - insuranceSurcharge;

          // Use payoutAmount for Pro payout calculation (excludes protection fee + insurance surcharge)
          const result = await stripeService.capturePaymentAndPayHauler(
            job.stripePaymentIntentId,
            haulerStripeAccountId,
            payoutAmount,
            pyckerTier,
            isVerifiedLlc
          );

          await storage.updateServiceRequest(jobId, {
            paymentStatus: "captured",
            platformFee: result.platformFee,
            haulerPayout: result.haulerPayout,
            paidAt: new Date().toISOString(),
          });

          // Broadcast completion
          broadcastToJob(jobId, {
            type: "job_completed",
            job: updated,
            paymentCaptured: true,
            finalAmount,
          });

          res.json({
            success: true,
            job: updated,
            paymentCaptured: true,
            finalAmount,
            platformFee: result.platformFee,
            haulerPayout: result.haulerPayout,
            insuranceSurcharge,
          });
        } catch (paymentError) {
          console.error("Payment capture failed:", paymentError);
          res.json({
            success: true,
            job: updated,
            paymentCaptured: false,
            paymentError: "Payment capture failed - manual follow-up required",
            finalAmount,
          });
        }
      } else {
        broadcastToJob(jobId, { type: "job_completed", job: updated, finalAmount });
        res.json({ success: true, job: updated, paymentCaptured: false, finalAmount });
      }
    } catch (error) {
      console.error("Error completing job:", error);

      // Handle specific errors
      const err = error as any;
      if (err.code === '23503') {
        return res.status(400).json({ error: "Invalid job or hauler reference" });
      }
      if (err.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }
      if (err.type === 'StripeCardError') {
        return res.status(400).json({ error: "Payment failed", details: err.message });
      }
      if (err.type === 'StripeAPIError') {
        return res.status(502).json({ error: "Payment service unavailable" });
      }
      if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
      }

      res.status(500).json({ error: "Failed to complete job" });
    }
  });

  // Admin: Get all active jobs with details
  app.get("/api/admin/jobs", requireAuth, requireAdmin, async (req, res) => {
    try {
      const jobs = await storage.getAllJobsWithDetails();
      res.json(jobs);
    } catch (error) {
      console.error("Error getting admin jobs:", error);

      const dbError = error as any;
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }

      res.status(500).json({ error: "Failed to get jobs" });
    }
  });

  // Admin: Force approve/decline an adjustment
  app.patch("/api/admin/jobs/:jobId/adjustments/:adjustmentId", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { adjustmentId } = req.params;
      const { action, notes } = req.body;

      let adjustment;
      if (action === "approve") {
        adjustment = await storage.approveJobAdjustment(adjustmentId);
        if (adjustment && notes) {
          // Store admin notes in reason field with prefix
          const currentReason = adjustment.reason || '';
          await storage.updateJobAdjustment(adjustmentId, {
            reason: currentReason ? `${currentReason} | Admin: ${notes}` : `Admin: ${notes}`
          });
        }
      } else if (action === "decline") {
        adjustment = await storage.declineJobAdjustment(adjustmentId);
        if (adjustment && notes) {
          const currentReason = adjustment.reason || '';
          await storage.updateJobAdjustment(adjustmentId, {
            reason: currentReason ? `${currentReason} | Admin: ${notes}` : `Admin: ${notes}`
          });
        }
      } else {
        return res.status(400).json({ error: "Invalid action" });
      }

      res.json({ success: true, adjustment });
    } catch (error) {
      console.error("Error updating adjustment as admin:", error);

      const dbError = error as any;
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }
      if (dbError.name === 'ValidationError') {
        return res.status(400).json({ error: dbError.message });
      }

      res.status(500).json({ error: "Failed to update adjustment" });
    }
  });

  // Get crew status for multi-Pro jobs
  app.get("/api/jobs/:jobId/crew-status", requireAuth, async (req, res) => {
    try {
      const { jobId } = req.params;

      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Check if this is a multi-Pro job
      if (!job.laborCrewSize || job.laborCrewSize <= 1) {
        return res.json({
          isMultiPro: false,
          crewSize: 1,
          acceptedCount: job.assignedHaulerId ? 1 : 0,
          remainingSlots: job.assignedHaulerId ? 0 : 1,
          crewMembers: [],
        });
      }

      // Get crew assignments
      const assignments = await storage.getJobCrewAssignments(jobId);
      const acceptedAssignments = assignments.filter(a => a.status === "accepted");

      // Get hauler details for accepted crew members
      const crewMembers = await Promise.all(
        acceptedAssignments.map(async (assignment) => {
          const hauler = await storage.getUser(assignment.haulerId);
          const profile = await storage.getHaulerProfile(assignment.haulerId);

          return {
            haulerId: assignment.haulerId,
            name: hauler ? `${hauler.firstName || ''} ${hauler.lastName || ''}`.trim() : 'Unknown',
            phone: profile?.phone || hauler?.email || '',
            acceptedAt: assignment.acceptedAt,
            isVerifiedPro: profile?.isVerifiedLlc || false,
            rating: profile?.rating || 0,
          };
        })
      );

      res.json({
        isMultiPro: true,
        crewSize: job.laborCrewSize,
        acceptedCount: acceptedAssignments.length,
        remainingSlots: Math.max(0, job.laborCrewSize - acceptedAssignments.length),
        isFull: acceptedAssignments.length >= job.laborCrewSize,
        crewMembers,
      });
    } catch (error) {
      console.error("Error getting crew status:", error);

      const dbError = error as any;
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }

      res.status(500).json({ error: "Failed to get crew status" });
    }
  });
}
