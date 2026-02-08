import type { Express } from "express";
import { storage } from "../../storage";
import { requireAuth, requireAdmin, requireHauler } from "../../auth-middleware";
import { validateReceiptWithAI, type ReceiptValidationInput } from "../../services/rebate-ai-validation";

// AI validation helper function
async function triggerAIValidation(claimId: string, input: ReceiptValidationInput): Promise<void> {
  try {
    console.log(`Starting AI validation for rebate claim ${claimId}...`);
    const result = await validateReceiptWithAI(input);

    await storage.updateRebateClaimAIValidation(claimId, {
      aiValidationStatus: result.status,
      aiValidationResult: JSON.stringify(result.details),
      aiValidationNotes: result.notes,
      aiValidatedAt: new Date().toISOString(),
      aiConfidenceScore: result.confidenceScore,
    });

    console.log(`AI validation completed for claim ${claimId}: ${result.status} (${result.confidenceScore}% confidence)`);
  } catch (error) {
    console.error(`AI validation failed for claim ${claimId}:`, error);
    await storage.updateRebateClaimAIValidation(claimId, {
      aiValidationStatus: "needs_review",
      aiValidationNotes: "AI validation failed - manual review required",
      aiValidatedAt: new Date().toISOString(),
      aiConfidenceScore: 0,
    });
  }
}

export function registerFacilitiesRebatesRoutes(app: Express) {
  // ==========================================
  // APPROVED FACILITIES (Green Guarantee)
  // ==========================================

  // Get all approved facilities
  app.get("/api/facilities", async (req, res) => {
    try {
      const facilities = await storage.getApprovedFacilities();
      res.json(facilities);
    } catch (error) {
      console.error("Error fetching facilities:", error);
      res.status(500).json({ error: "Failed to fetch facilities" });
    }
  });

  // Get specific facility by ID
  app.get("/api/facilities/:id", async (req, res) => {
    try {
      const facility = await storage.getApprovedFacility(req.params.id);
      if (!facility) {
        return res.status(404).json({ error: "Facility not found" });
      }
      res.json(facility);
    } catch (error) {
      console.error("Error fetching facility:", error);
      res.status(500).json({ error: "Failed to fetch facility" });
    }
  });

  // Create new approved facility (admin only)
  app.post("/api/facilities", requireAuth, requireAdmin, async (req, res) => {
    try {
      const facility = await storage.createApprovedFacility({
        ...req.body,
        createdAt: new Date().toISOString(),
      });
      res.status(201).json(facility);
    } catch (error) {
      console.error("Error creating facility:", error);
      res.status(500).json({ error: "Failed to create facility" });
    }
  });

  // ==========================================
  // REBATE CLAIMS (Green Guarantee)
  // ==========================================

  // Submit rebate claim (hauler only)
  app.post("/api/rebates/claim", requireAuth, requireHauler, async (req, res) => {
    try {
      const {
        serviceRequestId,
        haulerId,
        receiptUrl,
        facilityName,
        facilityAddress,
        facilityType,
        receiptNumber,
        receiptDate,
        receiptWeight,
        feeCharged
      } = req.body;

      // Validate required fields
      if (!serviceRequestId || !haulerId || !receiptUrl) {
        return res.status(400).json({ error: "Service request ID, hauler ID, and receipt URL are required" });
      }

      if (!facilityName || !receiptDate || !receiptWeight) {
        return res.status(400).json({ error: "Facility name, receipt date, and weight are required" });
      }

      // Get the service request to validate and get job price
      const serviceRequest = await storage.getServiceRequest(serviceRequestId);
      if (!serviceRequest) {
        return res.status(404).json({ error: "Service request not found" });
      }

      if (serviceRequest.status !== "completed") {
        return res.status(400).json({ error: "Can only submit rebate claims for completed jobs" });
      }

      // Check if claim already exists for this job
      const existingClaims = await storage.getRebateClaimsByHauler(haulerId);
      const duplicateClaim = existingClaims.find(c => c.serviceRequestId === serviceRequestId);
      if (duplicateClaim) {
        return res.status(400).json({ error: "A rebate claim already exists for this job" });
      }

      // Calculate estimated weight from load size
      const loadWeights: Record<string, number> = {
        small: 200, // lbs
        medium: 500,
        large: 1000,
        extra_large: 2000,
      };
      const estimatedWeight = loadWeights[serviceRequest.loadEstimate || "medium"] || 500;

      // Get job completion time
      const jobCompletedAt = serviceRequest.completedAt || new Date().toISOString();

      // Validate claim against business rules
      const validation = await storage.validateRebateClaim(
        { facilityName, facilityAddress, receiptNumber, receiptDate, receiptWeight, feeCharged },
        jobCompletedAt,
        estimatedWeight
      );

      // Reject duplicate receipts outright
      if (validation.isDuplicate) {
        return res.status(400).json({ error: "This receipt number has already been used for another claim" });
      }

      // Calculate variance
      const variancePercent = Math.abs(((receiptWeight - estimatedWeight) / estimatedWeight) * 100);

      // Calculate rebate: 10% of job price, max $25
      const jobTotalPrice = serviceRequest.livePrice || 0;
      const calculatedRebate = Math.min(jobTotalPrice * 0.10, 25);

      // Determine status based on validation
      // If no flags = APPROVED, otherwise NEEDS_REVIEW (flagged)
      const status = validation.flags.length > 0 ? "flagged" : "pending";

      // Try to find matching approved facility
      const matchedFacility = await storage.findFacilityByName(facilityName);

      const claim = await storage.createRebateClaim({
        serviceRequestId,
        haulerId,
        receiptUrl,
        status,
        facilityId: matchedFacility?.id || null,
        facilityName,
        facilityAddress: facilityAddress || null,
        facilityType: matchedFacility?.facilityType || facilityType || null,
        facilityApproved: validation.facilityApproved,
        receiptNumber: receiptNumber || null,
        receiptDate,
        receiptWeight,
        feeCharged: feeCharged || null,
        jobCompletedAt,
        estimatedWeight,
        variancePercent,
        withinVariance: validation.withinVariance,
        within48Hours: validation.within48Hours,
        validationFlags: validation.flags.length > 0 ? validation.flags : null,
        jobTotalPrice,
        rebateAmount: calculatedRebate,
        submittedAt: new Date().toISOString(),
        aiValidationStatus: "pending",
      });

      // Trigger AI validation asynchronously (don't wait for it)
      triggerAIValidation(claim.id, {
        receiptImageUrl: receiptUrl,
        facilityName,
        facilityAddress,
        claimedWeight: receiptWeight,
        estimatedWeight,
        receiptDate,
        jobCompletedAt,
        serviceRequestId,
        haulerId,
      }).catch(err => console.error("AI validation error:", err));

      res.status(201).json({
        ...claim,
        validation: {
          flags: validation.flags,
          withinVariance: validation.withinVariance,
          within48Hours: validation.within48Hours,
          facilityApproved: validation.facilityApproved,
        }
      });
    } catch (error) {
      console.error("Error creating rebate claim:", error);
      res.status(500).json({ error: "Failed to create rebate claim" });
    }
  });

  // Get hauler's rebate claims
  app.get("/api/rebates/hauler/:haulerId", requireAuth, requireHauler, async (req, res) => {
    try {
      const { haulerId } = req.params;
      const claims = await storage.getRebateClaimsByHauler(haulerId);
      res.json(claims);
    } catch (error) {
      console.error("Error fetching hauler rebate claims:", error);
      res.status(500).json({ error: "Failed to fetch rebate claims" });
    }
  });

  // Get pending/flagged rebate claims (admin only)
  app.get("/api/rebates/pending", requireAuth, requireAdmin, async (req, res) => {
    try {
      // Get both pending and flagged claims for admin review
      const pendingClaims = await storage.getRebateClaimsByStatus("pending");
      const flaggedClaims = await storage.getRebateClaimsByStatus("flagged");
      const allClaims = [...pendingClaims, ...flaggedClaims]
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      res.json(allClaims);
    } catch (error) {
      console.error("Error fetching pending rebate claims:", error);
      res.status(500).json({ error: "Failed to fetch pending claims" });
    }
  });

  // Approve rebate claim (admin only)
  app.post("/api/rebates/:id/approve", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { reviewerId } = req.body;

      if (!reviewerId) {
        return res.status(400).json({ error: "Reviewer ID is required" });
      }

      const claim = await storage.approveRebateClaim(id, reviewerId);
      if (!claim) {
        return res.status(404).json({ error: "Rebate claim not found" });
      }

      res.json(claim);
    } catch (error) {
      console.error("Error approving rebate claim:", error);
      res.status(500).json({ error: "Failed to approve rebate claim" });
    }
  });

  // Deny rebate claim (admin only)
  app.post("/api/rebates/:id/deny", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { reviewerId, reason } = req.body;

      if (!reviewerId) {
        return res.status(400).json({ error: "Reviewer ID is required" });
      }

      const claim = await storage.denyRebateClaim(id, reviewerId, reason);
      if (!claim) {
        return res.status(404).json({ error: "Rebate claim not found" });
      }

      res.json(claim);
    } catch (error) {
      console.error("Error denying rebate claim:", error);
      res.status(500).json({ error: "Failed to deny rebate claim" });
    }
  });
}
