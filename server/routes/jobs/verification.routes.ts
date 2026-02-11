import type { Express, Request, Response } from "express";
import { storage } from "../../storage";
import { requireAuth, requireHauler } from "../../auth-middleware";
import { scoreCleanliness } from "../../photoAnalysisService";
import { z } from "zod";

/**
 * Job Verification Routes
 *
 * Handles the 6-step verification workflow for job completion:
 * 1. Before photos with GPS + timestamp
 * 2. Item tracking and categorization
 * 3. After photos with GPS + timestamp
 * 4. Disposal verification with receipts
 * 5. Sustainability report generation
 * 6. Customer confirmation
 *
 * BLOCKING RULES:
 * - Jobs CANNOT be marked complete without steps 1-4
 * - Payment CANNOT be released without step 6 (or 48-hour auto-approval)
 * - Applies to: BulkSnap™ (Junk Removal), GarageReset™ (Garage Cleanout), TearDown™ (Light Demolition)
 */

export function registerJobVerificationRoutes(app: Express) {

  // ============================================================================
  // STEP 1: Upload Before Photos
  // ============================================================================

  app.post("/api/jobs/:jobId/verification/before-photos", requireAuth, requireHauler, async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const { photos, gpsCoordinates, aiAnalysis } = req.body;

      // Validate input
      const schema = z.object({
        photos: z.array(z.string().url()).min(2, "At least 2 photos required"),
        gpsCoordinates: z.string(),
        aiAnalysis: z.object({
          identifiedItems: z.array(z.string()),
          estimatedVolumeCubicFt: z.number(),
          confidence: z.number(),
        }).optional(),
      });

      const validated = schema.parse({ photos, gpsCoordinates, aiAnalysis });

      // Check if job exists and is assigned to this Pro
      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      const userId = (req.user as any).id;
      if (job.assignedHaulerId !== userId) {
        return res.status(403).json({ error: "Not assigned to this job" });
      }

      // Check if verification record exists
      let verification = await storage.getJobVerification(jobId);

      if (!verification) {
        // Create new verification record
        verification = await storage.createJobVerification({
          serviceRequestId: jobId,
          beforePhotos: validated.photos,
          beforePhotosTimestamp: new Date().toISOString(),
          beforePhotosGps: validated.gpsCoordinates,
          beforePhotosAiAnalysis: validated.aiAnalysis || null,
          verificationStatus: "step_1_before_photos",
          stepsCompleted: { step1: true },
          createdAt: new Date().toISOString(),
        });
      } else {
        // Update existing verification
        verification = await storage.updateJobVerification(verification.id, {
          beforePhotos: validated.photos,
          beforePhotosTimestamp: new Date().toISOString(),
          beforePhotosGps: validated.gpsCoordinates,
          beforePhotosAiAnalysis: validated.aiAnalysis || null,
          verificationStatus: "step_1_before_photos",
          stepsCompleted: { ...(verification.stepsCompleted as any || {}), step1: true },
        });
      }

      res.json({
        success: true,
        verification,
        nextStep: "item_tracking",
      });
    } catch (error) {
      console.error("Error uploading before photos:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: "Failed to upload before photos" });
    }
  });

  // ============================================================================
  // STEP 2: Track Items and Categorize
  // ============================================================================

  app.post("/api/jobs/:jobId/verification/disposal-record", requireAuth, requireHauler, async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const {
        itemDescription,
        itemPhotoUrl,
        estimatedWeightLbs,
        category,
        destinationName,
        receiptPhotoUrl,
        gpsCoordinates,
        // Category-specific fields
        donationOrganization,
        resalePlatform,
        landfillReason,
        specialtyDisposalType,
      } = req.body;

      // Validate input
      const schema = z.object({
        itemDescription: z.string().min(1),
        itemPhotoUrl: z.string().url().optional(),
        estimatedWeightLbs: z.number().positive(),
        category: z.enum(["recycle", "donate", "resale", "landfill", "specialty"]),
        destinationName: z.string().min(1),
        receiptPhotoUrl: z.string().url().optional(),
        gpsCoordinates: z.string().optional(),
        donationOrganization: z.string().optional(),
        resalePlatform: z.string().optional(),
        landfillReason: z.string().optional(),
        specialtyDisposalType: z.string().optional(),
      });

      const validated = schema.parse(req.body);

      // Check if job exists and is assigned to this Pro
      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      const userId = (req.user as any).id;
      if (job.assignedHaulerId !== userId) {
        return res.status(403).json({ error: "Not assigned to this job" });
      }

      // Get verification record
      const verification = await storage.getJobVerification(jobId);
      if (!verification) {
        return res.status(400).json({ error: "Must upload before photos first" });
      }

      // Calculate carbon offset based on category and material
      const carbonOffsetTons = calculateCarbonOffset(validated.category, validated.estimatedWeightLbs);

      // Create disposal record
      const record = await storage.createDisposalRecord({
        jobVerificationId: verification.id,
        serviceRequestId: jobId,
        itemDescription: validated.itemDescription,
        itemPhotoUrl: validated.itemPhotoUrl || null,
        estimatedWeightLbs: validated.estimatedWeightLbs,
        category: validated.category,
        destinationName: validated.destinationName,
        receiptPhotoUrl: validated.receiptPhotoUrl || null,
        gpsCoordinates: validated.gpsCoordinates || null,
        carbonOffsetTons,
        donationOrganization: validated.donationOrganization || null,
        resalePlatform: validated.resalePlatform || null,
        landfillReason: validated.landfillReason || null,
        specialtyDisposalType: validated.specialtyDisposalType || null,
        createdAt: new Date().toISOString(),
      });

      // Update verification status
      await storage.updateJobVerification(verification.id, {
        verificationStatus: "step_2_item_tracking",
        stepsCompleted: { ...(verification.stepsCompleted as any || {}), step2: true },
      });

      res.json({
        success: true,
        record,
        nextStep: "after_photos",
      });
    } catch (error) {
      console.error("Error creating disposal record:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: "Failed to create disposal record" });
    }
  });

  // ============================================================================
  // STEP 3: Upload After Photos
  // ============================================================================

  app.post("/api/jobs/:jobId/verification/after-photos", requireAuth, requireHauler, async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const { photos, gpsCoordinates } = req.body;

      // Validate input
      const schema = z.object({
        photos: z.array(z.string().url()).min(2, "At least 2 photos required"),
        gpsCoordinates: z.string(),
      });

      const validated = schema.parse({ photos, gpsCoordinates });

      // Check if job exists and is assigned to this Pro
      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      const userId = (req.user as any).id;
      if (job.assignedHaulerId !== userId) {
        return res.status(403).json({ error: "Not assigned to this job" });
      }

      // Get verification record
      const verification = await storage.getJobVerification(jobId);
      if (!verification) {
        return res.status(400).json({ error: "Must upload before photos first" });
      }

      // Update verification with after photos
      const updated = await storage.updateJobVerification(verification.id, {
        afterPhotos: validated.photos,
        afterPhotosTimestamp: new Date().toISOString(),
        afterPhotosGps: validated.gpsCoordinates,
        verificationStatus: "step_3_after_photos",
        stepsCompleted: { ...(verification.stepsCompleted as any || {}), step3: true },
      });

      res.json({
        success: true,
        verification: updated,
        nextStep: "disposal_verification",
      });
    } catch (error) {
      console.error("Error uploading after photos:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: "Failed to upload after photos" });
    }
  });

  // ============================================================================
  // STEP 4: Get Disposal Verification Status
  // ============================================================================

  app.get("/api/jobs/:jobId/verification/disposal-status", requireAuth, requireHauler, async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;

      // Check if job exists and is assigned to this Pro
      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      const userId = (req.user as any).id;
      if (job.assignedHaulerId !== userId) {
        return res.status(403).json({ error: "Not assigned to this job" });
      }

      // Get verification and disposal records
      const verification = await storage.getJobVerification(jobId);
      if (!verification) {
        return res.status(400).json({ error: "No verification started" });
      }

      const disposalRecords = await storage.getDisposalRecordsByServiceRequest(jobId);

      // Check if all disposal categories have receipts
      const categoriesUsed = new Set(disposalRecords.map(r => r.category));
      const missingReceipts = disposalRecords.filter(r => !r.receiptPhotoUrl);

      const isComplete = disposalRecords.length > 0 && missingReceipts.length === 0;

      res.json({
        success: true,
        verification,
        disposalRecords,
        categoriesUsed: Array.from(categoriesUsed),
        missingReceipts: missingReceipts.length,
        isComplete,
        nextStep: isComplete ? "sustainability_report" : "upload_receipts",
      });
    } catch (error) {
      console.error("Error getting disposal status:", error);
      res.status(500).json({ error: "Failed to get disposal status" });
    }
  });

  // ============================================================================
  // STEP 5: Generate Sustainability Report
  // ============================================================================

  app.post("/api/jobs/:jobId/verification/generate-report", requireAuth, requireHauler, async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;

      // Check if job exists and is assigned to this Pro
      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      const userId = (req.user as any).id;
      if (job.assignedHaulerId !== userId) {
        return res.status(403).json({ error: "Not assigned to this job" });
      }

      // Get verification and disposal records
      const verification = await storage.getJobVerification(jobId);
      if (!verification) {
        return res.status(400).json({ error: "No verification started" });
      }

      const disposalRecords = await storage.getDisposalRecordsByServiceRequest(jobId);

      if (disposalRecords.length === 0) {
        return res.status(400).json({ error: "No disposal records found" });
      }

      // Calculate totals by category
      const totals = {
        recycled: 0,
        donated: 0,
        resold: 0,
        landfilled: 0,
        specialty: 0,
      };

      let totalCarbonOffset = 0;

      for (const record of disposalRecords) {
        totalCarbonOffset += record.carbonOffsetTons || 0;

        switch (record.category) {
          case "recycle":
            totals.recycled += record.estimatedWeightLbs;
            break;
          case "donate":
            totals.donated += record.estimatedWeightLbs;
            break;
          case "resale":
            totals.resold += record.estimatedWeightLbs;
            break;
          case "landfill":
            totals.landfilled += record.estimatedWeightLbs;
            break;
          case "specialty":
            totals.specialty += record.estimatedWeightLbs;
            break;
        }
      }

      const totalWeight = totals.recycled + totals.donated + totals.resold + totals.landfilled + totals.specialty;
      const divertedWeight = totals.recycled + totals.donated + totals.resold;
      const diversionRate = totalWeight > 0 ? (divertedWeight / totalWeight) : 0;

      // Update verification with totals
      const updated = await storage.updateJobVerification(verification.id, {
        totalWeightLbs: totalWeight,
        totalRecycledLbs: totals.recycled,
        diversionRate,
        carbonOffsetTons: totalCarbonOffset,
        verificationStatus: "step_5_report_generated",
        stepsCompleted: { ...(verification.stepsCompleted as any || {}), step4: true, step5: true },
      });

      // Generate report data
      const report = {
        jobId,
        generatedAt: new Date().toISOString(),
        summary: {
          totalWeightLbs: totalWeight,
          divertedWeightLbs: divertedWeight,
          diversionRate: (diversionRate * 100).toFixed(1) + "%",
          carbonOffsetTons: totalCarbonOffset.toFixed(2),
        },
        breakdown: {
          recycled: totals.recycled,
          donated: totals.donated,
          resold: totals.resold,
          landfilled: totals.landfilled,
          specialty: totals.specialty,
        },
        environmentalImpact: {
          co2AvoidedLbs: (totalCarbonOffset * 2204.62).toFixed(0), // Convert metric tons to lbs
          treesEquivalent: (totalCarbonOffset * 16.5).toFixed(1), // 1 tree absorbs ~0.06 metric tons/year
          waterSavedGallons: (divertedWeight * 0.5).toFixed(0), // Conservative estimate
        },
        disposalRecords: disposalRecords.map(r => ({
          item: r.itemDescription,
          weight: r.estimatedWeightLbs,
          category: r.category,
          destination: r.destinationName,
        })),
      };

      res.json({
        success: true,
        report,
        verification: updated,
        nextStep: "customer_confirmation",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  // ============================================================================
  // STEP 6: Get Verification Status (for blocking rules)
  // ============================================================================

  app.get("/api/jobs/:jobId/verification/status", requireAuth, async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;

      // Check if job exists
      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Get verification
      const verification = await storage.getJobVerification(jobId);

      if (!verification) {
        return res.json({
          canComplete: false,
          canReleasePayment: false,
          missingSteps: ["before_photos", "item_tracking", "after_photos", "disposal_verification", "sustainability_report"],
          message: "Verification not started",
        });
      }

      const steps = verification.stepsCompleted as any || {};
      const disposalRecords = await storage.getDisposalRecordsByServiceRequest(jobId);

      // Check blocking conditions
      const hasBeforePhotos = steps.step1 === true;
      const hasDisposalRecords = disposalRecords.length > 0;
      const hasAfterPhotos = steps.step3 === true;
      const hasReport = steps.step5 === true;
      const hasCustomerConfirmation = !!verification.customerConfirmedAt;

      // Calculate 48-hour auto-approval
      let autoApprovalEligible = false;
      if (hasReport && verification.verificationStatus === "step_5_report_generated") {
        const reportTime = new Date(verification.updatedAt || verification.createdAt);
        const hoursSinceReport = (Date.now() - reportTime.getTime()) / (1000 * 60 * 60);
        autoApprovalEligible = hoursSinceReport >= 48;
      }

      const canComplete = hasBeforePhotos && hasDisposalRecords && hasAfterPhotos && hasReport;
      const canReleasePayment = canComplete && (hasCustomerConfirmation || autoApprovalEligible);

      const missingSteps: string[] = [];
      if (!hasBeforePhotos) missingSteps.push("before_photos");
      if (!hasDisposalRecords) missingSteps.push("item_tracking");
      if (!hasAfterPhotos) missingSteps.push("after_photos");
      if (!hasReport) missingSteps.push("sustainability_report");
      if (!hasCustomerConfirmation && !autoApprovalEligible) missingSteps.push("customer_confirmation");

      res.json({
        canComplete,
        canReleasePayment,
        missingSteps,
        verification,
        autoApprovalEligible,
        message: canReleasePayment ? "Job can be completed" : `Missing steps: ${missingSteps.join(", ")}`,
      });
    } catch (error) {
      console.error("Error getting verification status:", error);
      res.status(500).json({ error: "Failed to get verification status" });
    }
  });

  // ============================================================================
  // Customer Confirmation
  // ============================================================================

  app.post("/api/jobs/:jobId/verification/customer-confirm", requireAuth, async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;

      // Check if job exists
      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      const userId = (req.user as any).id;
      if (job.customerId !== userId) {
        return res.status(403).json({ error: "Not authorized - customer only" });
      }

      // Get verification
      const verification = await storage.getJobVerification(jobId);
      if (!verification) {
        return res.status(400).json({ error: "No verification found" });
      }

      // Update verification with customer confirmation
      const updated = await storage.updateJobVerification(verification.id, {
        customerConfirmedAt: new Date().toISOString(),
        verificationStatus: "step_6_customer_confirmed",
        stepsCompleted: { ...(verification.stepsCompleted as any || {}), step6: true },
      });

      res.json({
        success: true,
        verification: updated,
        message: "Job verified and confirmed. Pro can now complete the job.",
      });
    } catch (error) {
      console.error("Error confirming job:", error);
      res.status(500).json({ error: "Failed to confirm job" });
    }
  });

  // ============================================================================
  // FRESHSPACE: Score Cleanliness from Photos
  // ============================================================================

  app.post("/api/jobs/:jobId/verification/score-cleanliness", requireAuth, requireHauler, async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const { photos, phase } = req.body; // phase: "before" or "after"

      // Validate input
      const schema = z.object({
        photos: z.array(z.string().url()).min(1, "At least 1 photo required"),
        phase: z.enum(["before", "after"]),
      });

      const validated = schema.parse({ photos, phase });

      // Check if job exists and is assigned to this Pro
      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      const userId = (req.user as any).id;
      if (job.assignedHaulerId !== userId) {
        return res.status(403).json({ error: "Not assigned to this job" });
      }

      // Score cleanliness using GPT-4o Vision
      const cleanlinessScore = await scoreCleanliness(validated.photos);

      // Get existing verification record
      let verification = await storage.getJobVerification(jobId);

      if (!verification) {
        return res.status(404).json({ error: "Verification not started. Upload before photos first." });
      }

      // Update verification with cleanliness scores
      const updates: any = {};
      if (validated.phase === "before") {
        updates.cleanlinessScoreBefore = cleanlinessScore.score;
      } else {
        updates.cleanlinessScoreAfter = cleanlinessScore.score;
      }

      verification = await storage.updateJobVerification(verification.id, updates);

      res.json({
        score: cleanlinessScore.score,
        confidence: cleanlinessScore.confidence,
        reasoning: cleanlinessScore.reasoning,
        areasOfConcern: cleanlinessScore.areasOfConcern,
        highlights: cleanlinessScore.highlights,
        improvement: validated.phase === "after" && verification?.cleanlinessScoreBefore
          ? cleanlinessScore.score - verification.cleanlinessScoreBefore
          : null,
      });
    } catch (error) {
      console.error("Error scoring cleanliness:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid input", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to score cleanliness" });
      }
    }
  });
}

/**
 * Calculate carbon offset based on category and weight
 * Using EPA WARM Model factors
 */
function calculateCarbonOffset(category: string, weightLbs: number): number {
  const weightTons = weightLbs / 2204.62; // Convert lbs to metric tons

  // Carbon offset factors (metric tons CO2e per metric ton of material)
  const factors: Record<string, number> = {
    recycle: 2.0,     // Mixed recyclables average
    donate: 1.5,      // Avoided manufacturing
    resale: 1.5,      // Similar to donation
    specialty: 0.5,   // E-waste and hazmat
    landfill: -0.5,   // Negative impact (methane emissions)
  };

  const factor = factors[category] || 0;
  return weightTons * factor;
}
