/**
 * Price Verification API Routes
 *
 * Handles on-site price verification with AI analysis and 10% wiggle room rule
 *
 * Flow:
 * 1. Pro arrives on-site, takes verification photos/video
 * 2. AI analyzes actual conditions vs original quote
 * 3. If difference ≤10%, auto-approve
 * 4. If difference >10%, request customer approval
 *
 * Endpoints:
 * - POST /api/jobs/verify-price - Analyze verification media and calculate price difference
 * - PATCH /api/jobs/:jobId/price-verification - Update job with price verification data
 * - POST /api/jobs/request-price-approval - Notify customer of price adjustment
 * - POST /api/jobs/:jobId/approve-price-change - Customer approves new price
 */

import type { Express, Request, Response } from "express";
import { storage } from "../../storage";
import { requireAuth, requireHauler } from "../../auth-middleware";
import { analyzePhotosForQuote } from "../../services/photoAnalysisService";
import { sendSMS } from "../../services/twilio";
import { z } from "zod";

export function registerPriceVerificationRoutes(app: Express) {

  /**
   * Verify price by analyzing on-site photos/video
   */
  app.post("/api/jobs/verify-price", requireAuth, requireHauler, async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        jobId: z.string(),
        serviceType: z.string(),
        verificationMethod: z.enum(['photo', 'video']),
        fileUrls: z.array(z.string().url()),
        originalQuote: z.object({
          finalPrice: z.number(),
          breakdown: z.string(),
          inputs: z.record(z.any()),
          quotePath: z.enum(['ai_scan', 'manual_form', 'chat_sms_phone']),
        }),
      });

      const data = schema.parse(req.body);

      // Verify job exists and is assigned to this hauler
      const job = await storage.getServiceRequest(data.jobId);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      if (job.assignedToId !== req.user?.id) {
        return res.status(403).json({ error: 'Not assigned to this job' });
      }

      // Call AI analysis on verification photos/video
      const aiAnalysisResult = await analyzePhotosForQuote(
        data.fileUrls,
        data.serviceType
      );

      // Add confidence boost for video
      if (data.verificationMethod === 'video') {
        aiAnalysisResult.confidence = Math.min(aiAnalysisResult.confidence + 0.05, 1.0);
      }

      // Recalculate price based on verified measurements
      let verifiedPrice: number;
      let detectedParams: Record<string, any> = {};

      if (data.serviceType === 'polishup' || data.serviceType === 'home_cleaning') {
        detectedParams = {
          bedrooms: aiAnalysisResult.bedrooms || data.originalQuote.inputs.bedrooms,
          bathrooms: aiAnalysisResult.bathrooms || data.originalQuote.inputs.bathrooms,
          stories: aiAnalysisResult.stories || data.originalQuote.inputs.stories || 1,
          sqft: aiAnalysisResult.sqft,
          cleanType: data.originalQuote.inputs.cleanType,
          hasPets: data.originalQuote.inputs.hasPets || false,
          lastCleaned: data.originalQuote.inputs.lastCleaned || '1_6_months',
          sameDayBooking: data.originalQuote.inputs.sameDayBooking || false,
        };

        verifiedPrice = calculatePolishUpVerifiedPrice(detectedParams);

      } else if (data.serviceType === 'bulksnap' || data.serviceType === 'junk_removal') {
        detectedParams = {
          identifiedItems: aiAnalysisResult.identifiedItems,
          estimatedVolume: aiAnalysisResult.estimatedVolumeCubicFt,
          loadSize: aiAnalysisResult.recommendedLoadSize,
        };

        verifiedPrice = aiAnalysisResult.suggestedPrice || data.originalQuote.finalPrice;

      } else if (data.serviceType === 'freshwash' || data.serviceType === 'pressure_washing') {
        detectedParams = {
          totalSqft: aiAnalysisResult.totalSqft || 0,
          surfaces: aiAnalysisResult.surfaces,
        };

        // $0.25 per sqft, min $120
        verifiedPrice = Math.max(
          Math.round((aiAnalysisResult.totalSqft || 0) * 0.25),
          120
        );

      } else if (data.serviceType === 'gutterflush' || data.serviceType === 'gutter_cleaning') {
        detectedParams = {
          stories: aiAnalysisResult.stories || data.originalQuote.inputs.stories || 1,
        };

        verifiedPrice = detectedParams.stories === 1 ? 149 : 249;

      } else {
        // For other services, use AI-suggested price or keep original
        verifiedPrice = aiAnalysisResult.suggestedPrice || data.originalQuote.finalPrice;
        detectedParams = { aiSuggestion: aiAnalysisResult };
      }

      // Calculate price difference
      const priceDifference = verifiedPrice - data.originalQuote.finalPrice;
      const percentageDifference = Math.abs((priceDifference / data.originalQuote.finalPrice) * 100);

      // Apply 10% wiggle room rule
      const autoApproved = percentageDifference <= 10;
      const requiresCustomerApproval = !autoApproved;

      const verificationResult = {
        verifiedPrice,
        priceDifference,
        percentageDifference,
        requiresCustomerApproval,
        verificationPhotos: data.fileUrls,
        verificationMethod: data.verificationMethod,
        aiAnalysis: {
          detectedParams,
          confidence: aiAnalysisResult.confidence,
          reasoning: aiAnalysisResult.reasoning || 'AI analyzed verification media and recalculated measurements',
        },
        autoApproved,
      };

      res.json(verificationResult);

    } catch (error) {
      console.error('Price verification error:', error);
      res.status(400).json({ error: 'Failed to verify price' });
    }
  });

  /**
   * Update job with price verification data
   */
  app.patch("/api/jobs/:jobId/price-verification", requireAuth, requireHauler, async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const schema = z.object({
        verified: z.boolean(),
        verificationData: z.object({
          verifiedPrice: z.number(),
          priceDifference: z.number(),
          percentageDifference: z.number(),
          requiresCustomerApproval: z.boolean(),
          verificationPhotos: z.array(z.string().url()),
          verificationMethod: z.enum(['photo', 'video']),
          aiAnalysis: z.object({
            detectedParams: z.record(z.any()),
            confidence: z.number(),
            reasoning: z.string(),
          }),
          proNotes: z.string().optional(),
          autoApproved: z.boolean(),
        }),
      });

      const data = schema.parse(req.body);

      // Verify job exists and is assigned to this hauler
      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      if (job.assignedToId !== req.user?.id) {
        return res.status(403).json({ error: 'Not assigned to this job' });
      }

      // Update service request
      await storage.updateServiceRequest(jobId, {
        priceVerified: data.verified,
        verifiedPrice: data.verificationData.verifiedPrice,
        verificationPhotos: data.verificationData.verificationPhotos,
        priceVerificationData: data.verificationData,
        priceAdjustment: data.verificationData.priceDifference,
        customerApprovedPriceAdjustment: data.verificationData.autoApproved ? true : null,
      });

      res.json({ success: true });

    } catch (error) {
      console.error('Failed to update price verification:', error);
      res.status(400).json({ error: 'Failed to update price verification' });
    }
  });

  /**
   * Request customer approval for price adjustment (>10%)
   */
  app.post("/api/jobs/request-price-approval", requireAuth, requireHauler, async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        jobId: z.string(),
        originalPrice: z.number(),
        verifiedPrice: z.number(),
        priceDifference: z.number(),
        percentageDifference: z.number(),
        verificationPhotos: z.array(z.string().url()),
        proNotes: z.string(),
      });

      const data = schema.parse(req.body);

      // Get job details
      const job = await storage.getServiceRequest(data.jobId);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      // Verify hauler is assigned to this job
      if (job.assignedToId !== req.user?.id) {
        return res.status(403).json({ error: 'Not assigned to this job' });
      }

      // Update job to indicate price approval pending
      await storage.updateServiceRequest(data.jobId, {
        priceApprovalPending: true,
        priceApprovalRequestedAt: new Date().toISOString(),
      });

      // Notify customer via SMS
      const increaseDecrease = data.priceDifference > 0 ? 'larger' : 'smaller';
      const smsMessage = `UpTend: Your Pro arrived and found the scope is ${increaseDecrease} than estimated.\n\nOriginal: $${data.originalPrice}\nNew: $${data.verifiedPrice} (${data.percentageDifference.toFixed(1)}% difference)\n\nPro's note: "${data.proNotes}"\n\nView photos and approve: https://uptend.com/jobs/${data.jobId}/approve-price`;

      if (job.customerPhone) {
        await sendSMS(job.customerPhone, smsMessage);
      }

      // TODO: Send push notification if user has app installed
      // if (job.userId) {
      //   await sendPushNotification(job.userId, { ... });
      // }

      res.json({ success: true, notificationSent: true });

    } catch (error) {
      console.error('Failed to request price approval:', error);
      res.status(400).json({ error: 'Failed to request price approval' });
    }
  });

  /**
   * Customer approves or rejects price change
   */
  app.post("/api/jobs/:jobId/approve-price-change", requireAuth, async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      const schema = z.object({
        approved: z.boolean(),
        customerNotes: z.string().optional(),
      });

      const data = schema.parse(req.body);

      // Get job details
      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      // Verify this is the customer's job
      if (job.userId !== req.user?.id) {
        return res.status(403).json({ error: 'Not your job' });
      }

      if (data.approved) {
        // Customer approved the new price
        await storage.updateServiceRequest(jobId, {
          customerApprovedPriceAdjustment: true,
          priceApprovalPending: false,
          priceApprovalRespondedAt: new Date().toISOString(),
          customerNotes: data.customerNotes,
        });

        // Notify Pro that customer approved
        if (job.assignedToId) {
          // TODO: Send push notification to Pro
          // await sendPushNotification(job.assignedToId, { ... });
        }

        res.json({ success: true, message: 'Price approved. Your Pro can now begin work.' });

      } else {
        // Customer rejected the new price
        await storage.updateServiceRequest(jobId, {
          customerApprovedPriceAdjustment: false,
          priceApprovalPending: false,
          priceApprovalRespondedAt: new Date().toISOString(),
          customerNotes: data.customerNotes,
          status: 'cancelled', // Job cancelled due to price disagreement
        });

        // Notify Pro that customer rejected
        if (job.assignedToId && job.assignedToPhone) {
          await sendSMS(
            job.assignedToPhone,
            `UpTend: Customer did not approve the price adjustment for job #${jobId}. The job has been cancelled.`
          );
        }

        res.json({ success: true, message: 'Job cancelled due to price disagreement.' });
      }

    } catch (error) {
      console.error('Failed to process price approval:', error);
      res.status(400).json({ error: 'Failed to process price approval' });
    }
  });
}

/**
 * Helper: Calculate verified price for PolishUp based on detected parameters
 */
function calculatePolishUpVerifiedPrice(params: Record<string, any>): number {
  // Base price matrix
  const basePrices: Record<string, Record<string, number>> = {
    '1-1': { standard: 99, deep: 179, move_out: 229 },
    '2-1': { standard: 129, deep: 229, move_out: 299 },
    '2-2': { standard: 149, deep: 259, move_out: 329 },
    '3-2': { standard: 179, deep: 299, move_out: 399 },
    '3-3': { standard: 199, deep: 349, move_out: 449 },
    '4-2': { standard: 219, deep: 379, move_out: 479 },
    '4-3': { standard: 249, deep: 429, move_out: 529 },
    '5-3': { standard: 299, deep: 499, move_out: 599 },
  };

  const bathrooms = Math.round(params.bathrooms);
  const key = `${params.bedrooms}-${bathrooms}`;
  let price = basePrices[key]?.[params.cleanType] || 149;

  // Apply multiplicative modifiers
  if (params.stories === 2) price *= 1.15;
  if (params.stories === 3) price *= 1.25;
  if (params.sqft && params.sqft >= 3000) price *= 1.10;
  if (params.lastCleaned === '6_plus_months' || params.lastCleaned === 'never') price *= 1.20;

  // Apply additive modifiers
  if (params.hasPets) price += 25;
  if (params.sameDayBooking) price += 30;

  return Math.round(price);
}
