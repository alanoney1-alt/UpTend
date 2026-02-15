import type { Express } from "express";
import { storage } from "../storage";
import { getUncachableStripeClient } from "../stripeClient";
import { requireAuth } from "../auth-middleware";
import { sendDisputeAlert } from "../services/email-service";
import { assessCustomerRisk } from "../services/risk-assessment";
import { db } from "../db";
import { chargebackDisputes } from "@shared/schema";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

export function registerStripeDisputeRoutes(app: Express) {
  // ───────────────────────────────────────────────────────
  // POST /api/service-requests/:id/customer-signoff
  // Customer confirms job completion
  // ───────────────────────────────────────────────────────
  app.post("/api/service-requests/:id/customer-signoff", requireAuth, async (req, res) => {
    try {
      const jobId = req.params.id;
      const userId = (req as any).userId || (req as any).user?.id;
      const { rating, feedback } = req.body;

      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Validate customer owns this job
      if (job.customerId !== userId) {
        return res.status(403).json({ error: "Not authorized to sign off on this job" });
      }

      // Check if already signed off
      if (job.customerSignoffAt) {
        return res.status(400).json({ error: "Job already signed off" });
      }

      const now = new Date().toISOString();
      await storage.updateServiceRequest(jobId, {
        customerSignoffAt: now,
        customerSignoffMethod: "manual",
      });

      // If there's a rating, create a review
      if (rating && job.assignedHaulerId) {
        try {
          await storage.createReview({
            customerId: userId,
            haulerId: job.assignedHaulerId,
            serviceRequestId: jobId,
            rating,
            comment: feedback || null,
            createdAt: now,
          });
        } catch (reviewErr: any) {
          console.error(`[SIGNOFF] Failed to create review for job ${jobId}:`, reviewErr.message);
        }
      }

      // Trigger payment capture if not already captured
      if (job.stripePaymentIntentId && job.paymentStatus === "authorized") {
        try {
          const stripe = await getUncachableStripeClient();
          await stripe.paymentIntents.capture(job.stripePaymentIntentId);
          await storage.updateServiceRequest(jobId, {
            paymentStatus: "captured",
            paidAt: now,
          });
          console.log(`[SIGNOFF] Captured payment for job ${jobId}`);
        } catch (captureErr: any) {
          console.error(`[SIGNOFF] Failed to capture payment for job ${jobId}:`, captureErr.message);
        }
      }

      res.json({ success: true, signoffAt: now, signoffMethod: "manual" });
    } catch (error: any) {
      console.error("[SIGNOFF] Error:", error.message);
      res.status(500).json({ error: "Failed to sign off on job" });
    }
  });

  // ───────────────────────────────────────────────────────
  // GET /api/service-requests/:id/signoff-status
  // Check signoff status for a job
  // ───────────────────────────────────────────────────────
  app.get("/api/service-requests/:id/signoff-status", requireAuth, async (req, res) => {
    try {
      const job = await storage.getServiceRequest(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      res.json({
        signoffAt: job.customerSignoffAt || null,
        signoffMethod: job.customerSignoffMethod || null,
        needsSignoff: job.status === "completed" && !job.customerSignoffAt,
      });
    } catch (error: any) {
      res.status(500).json({ error: "Failed to get signoff status" });
    }
  });

  // ───────────────────────────────────────────────────────
  // GET /api/customer/risk-assessment
  // Check customer risk level for booking flow
  // ───────────────────────────────────────────────────────
  app.get("/api/customer/risk-assessment", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId || (req as any).user?.id;
      const jobValue = parseFloat(req.query.jobValue as string) || 0;
      const assessment = await assessCustomerRisk(userId, jobValue);
      res.json(assessment);
    } catch (error: any) {
      console.error("[RISK] Error:", error.message);
      res.status(500).json({ error: "Failed to assess risk" });
    }
  });
}

// ───────────────────────────────────────────────────────
// Dispute evidence compilation & submission
// Called from webhookHandlers when charge.dispute.created fires
// ───────────────────────────────────────────────────────
export async function handleDisputeWithEvidence(dispute: Stripe.Dispute): Promise<void> {
  const piId = typeof dispute.payment_intent === "string"
    ? dispute.payment_intent
    : dispute.payment_intent?.id;

  if (!piId) {
    console.error(`[DISPUTE] No payment_intent on dispute ${dispute.id}`);
    return;
  }

  const stripe = await getUncachableStripeClient();
  const pi = await stripe.paymentIntents.retrieve(piId);
  const jobId = pi.metadata?.jobId;

  if (!jobId) {
    console.error(`[DISPUTE] No jobId in PI metadata for dispute ${dispute.id}`);
    return;
  }

  const job = await storage.getServiceRequest(jobId);
  if (!job) {
    console.error(`[DISPUTE] Job ${jobId} not found for dispute ${dispute.id}`);
    return;
  }

  // Get customer info
  const customer = job.customerId ? await storage.getUser(job.customerId) : null;

  // Get assigned pro info
  const pro = job.assignedHaulerId ? await storage.getUser(job.assignedHaulerId) : null;

  // Get job verification data (before/after photos, GPS)
  let verification: any = null;
  try {
    verification = await storage.getJobVerification(jobId);
  } catch (_) {
    // Job verification may not exist
  }

  // Log dispute in DB
  const now = new Date().toISOString();
  try {
    await db.insert(chargebackDisputes).values({
      jobId,
      customerId: job.customerId,
      stripeDisputeId: dispute.id,
      stripePaymentIntentId: piId,
      amount: dispute.amount,
      reason: dispute.reason || "unknown",
      status: "needs_response",
      createdAt: now,
    });
  } catch (dbErr: any) {
    console.error(`[DISPUTE] Failed to log dispute in DB:`, dbErr.message);
  }

  // Increment customer dispute count & reassess risk
  if (customer) {
    try {
      const newDisputeCount = (customer.disputeCount || 0) + 1;
      const newRiskLevel = newDisputeCount >= 3 ? "high" : newDisputeCount >= 1 ? "elevated" : "normal";
      await storage.updateUser(customer.id, {
        disputeCount: newDisputeCount,
        riskLevel: newRiskLevel,
      });
    } catch (updateErr: any) {
      console.error(`[DISPUTE] Failed to update customer risk:`, updateErr.message);
    }
  }

  // Compile evidence
  const evidence: Stripe.DisputeUpdateParams.Evidence = {
    product_description: `${job.serviceType} service performed at ${job.pickupAddress}, ${job.pickupCity} ${job.pickupZip}`,
    customer_name: customer ? `${customer.firstName || ""} ${customer.lastName || ""}`.trim() : undefined,
    customer_email_address: customer?.email || job.customerEmail || undefined,
    service_date: job.scheduledFor || job.createdAt,
  };

  // Build text evidence
  const evidenceLines: string[] = [
    `SERVICE DETAILS`,
    `Type: ${job.serviceType}`,
    `Address: ${job.pickupAddress}, ${job.pickupCity} ${job.pickupZip}`,
    `Scheduled: ${job.scheduledFor}`,
    `Amount: $${(dispute.amount / 100).toFixed(2)}`,
    ``,
  ];

  if (job.tosAcceptedAt) {
    evidenceLines.push(`TOS ACCEPTANCE`);
    evidenceLines.push(`Terms of Service accepted at: ${job.tosAcceptedAt}`);
    evidenceLines.push(`Cancellation Policy accepted at: ${job.cancellationPolicyAcceptedAt || job.tosAcceptedAt}`);
    evidenceLines.push(``);
  }

  if (job.customerSignoffAt) {
    evidenceLines.push(`CUSTOMER SIGN-OFF`);
    evidenceLines.push(`Customer confirmed job complete at: ${job.customerSignoffAt}`);
    evidenceLines.push(`Method: ${job.customerSignoffMethod || "manual"}`);
    evidenceLines.push(``);
  }

  if (job.startedAt || job.completedAt || job.arrivedAt) {
    evidenceLines.push(`JOB TIMELINE`);
    if (job.arrivedAt) evidenceLines.push(`Pro arrived: ${job.arrivedAt}`);
    if (job.startedAt) evidenceLines.push(`Job started: ${job.startedAt}`);
    if (job.completedAt) evidenceLines.push(`Job completed: ${job.completedAt}`);
    evidenceLines.push(``);
  }

  if (verification) {
    if (verification.beforePhotos?.length) {
      evidenceLines.push(`BEFORE PHOTOS: ${verification.beforePhotos.length} photos captured at ${verification.beforePhotosTimestamp || "N/A"}`);
      if (verification.beforePhotosGps) evidenceLines.push(`GPS: ${verification.beforePhotosGps}`);
    }
    if (verification.afterPhotos?.length) {
      evidenceLines.push(`AFTER PHOTOS: ${verification.afterPhotos.length} photos captured at ${verification.afterPhotosTimestamp || "N/A"}`);
      if (verification.afterPhotosGps) evidenceLines.push(`GPS: ${verification.afterPhotosGps}`);
    }
    evidenceLines.push(``);
  }

  if (pro) {
    evidenceLines.push(`PRO DETAILS`);
    evidenceLines.push(`Name: ${pro.firstName || ""} ${pro.lastName || ""}`.trim());
    evidenceLines.push(``);
  }

  evidence.uncategorized_text = evidenceLines.join("\n");

  // Submit evidence to Stripe
  try {
    await stripe.disputes.update(dispute.id, { evidence });

    // Update dispute record
    await db.update(chargebackDisputes)
      .set({ evidenceSubmittedAt: new Date().toISOString(), status: "under_review" })
      .where(eq(chargebackDisputes.stripeDisputeId, dispute.id));

    console.log(`[DISPUTE] Evidence submitted for dispute ${dispute.id} (job ${jobId})`);
  } catch (submitErr: any) {
    console.error(`[DISPUTE] Failed to submit evidence:`, submitErr.message);
  }

  // Send alert email to admin
  try {
    await sendDisputeAlert(
      "alan@uptendapp.com",
      dispute,
      job,
      customer,
    );
    console.log(`[DISPUTE] Alert email sent for dispute ${dispute.id}`);
  } catch (emailErr: any) {
    console.error(`[DISPUTE] Failed to send alert email:`, emailErr.message);
  }

  // Mark job as disputed
  await storage.updateServiceRequest(jobId, { paymentStatus: "disputed" });
}
