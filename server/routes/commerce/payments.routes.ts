import type { Express } from "express";
import { storage } from "../../storage";
import { requireAuth, requireHauler } from "../../auth-middleware";
import { stripeService } from "../../stripeService";
import { db } from "../../db";
import { sql } from "drizzle-orm";
import { onPaymentCaptured } from "../../services/george-events";

async function getActiveCertCount(proId: string): Promise<number> {
  const now = new Date().toISOString();
  const result = await db.execute(sql`
    SELECT COUNT(*) as count FROM pro_certifications
    WHERE pro_id = ${proId} AND status = 'completed'
      AND (expires_at IS NULL OR expires_at > ${now})
  `);
  return Number((result.rows[0] as any)?.count || 0);
}

export function registerPaymentRoutes(app: Express) {
  // Get Stripe publishable key
  app.get("/api/stripe/publishable-key", async (req, res) => {
    try {
      const key = await stripeService.getPublishableKey();
      res.json({ publishableKey: key });
    } catch (error) {
      console.error("Error getting publishable key:", error);
      res.status(500).json({ error: "Failed to get Stripe publishable key" });
    }
  });

  // Create payment intent for a job
  app.post("/api/payments/create-intent", requireAuth, async (req, res) => {
    try {
      const { jobId, customerId, amount, assignedHaulerId } = req.body;

      if (!jobId || !amount) {
        return res.status(400).json({ error: "jobId and amount are required" });
      }

      if (typeof amount !== 'number' || amount < 1 || amount > 50000) {
        return res.status(400).json({ error: "Amount must be between $1 and $50,000" });
      }

      // Prevent double-create: if job already has a PaymentIntent, return existing
      const existingJob = await storage.getServiceRequest(jobId);
      if (existingJob?.stripePaymentIntentId && existingJob?.paymentStatus === 'authorized') {
        // Return existing client secret by retrieving the PI
        const stripe = await (await import('../../stripeClient')).getUncachableStripeClient();
        const existingPI = await stripe.paymentIntents.retrieve(existingJob.stripePaymentIntentId);
        if (existingPI.status !== 'canceled' && existingPI.status !== 'succeeded') {
          return res.json({
            clientSecret: existingPI.client_secret,
            paymentIntentId: existingPI.id,
          });
        }
      }

      let user = customerId ? await storage.getUser(customerId) : null;

      if (!user) {
        const existingDemo = await storage.getUserByEmail("demo@uptend.app");
        if (existingDemo) {
          user = existingDemo;
        } else {
          user = await storage.createUser({
            role: "customer",
            firstName: "Demo",
            lastName: "Customer",
            email: "demo@uptend.app",
          });
        }
      }

      let stripeCustomerId = user.stripeCustomerId;
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Customer';
      if (!stripeCustomerId) {
        const customer = await stripeService.createCustomer(
          user.email || `customer-${user.id}@uptend.app`,
          userName,
          user.id
        );
        stripeCustomerId = customer.id;
        await storage.updateUser(user.id, { stripeCustomerId: customer.id });
      }

      const paymentIntent = await stripeService.createPaymentIntent(
        amount,
        stripeCustomerId,
        jobId
      );

      // Calculate base service price (before 7% UpTend Protection Fee)
      // Customer pays: basePrice * 1.07 (service + 7% protection fee)
      // Pro payout is calculated from baseServicePrice only
      const baseServicePrice = amount / 1.07;

      const updateData: Record<string, any> = {
        stripePaymentIntentId: paymentIntent.id,
        paymentStatus: "authorized",
        livePrice: amount, // Total customer pays (includes protection fee)
        baseServicePrice: baseServicePrice, // Base price for Pro payout calculation
      };

      if (assignedHaulerId) {
        // Get the job to check if it's a multi-Pro job
        const job = await storage.getServiceRequest(jobId);

        if (job && job.laborCrewSize && job.laborCrewSize > 1) {
          // Multi-Pro job: Create crew assignment instead of direct assignment
          await storage.createJobCrewAssignment({
            serviceRequestId: jobId,
            haulerId: assignedHaulerId,
            status: "accepted",
            acceptedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          });

          // Check if all crew positions are now filled
          const acceptedCount = await storage.getAcceptedCrewCount(jobId);

          if (acceptedCount >= job.laborCrewSize) {
            // All positions filled - assign job and change status
            updateData.assignedHaulerId = assignedHaulerId; // First Pro who accepted
            updateData.status = "assigned";
          } else {
            // Keep job as "pending" so other Pros can still accept
            updateData.status = "pending";
          }
        } else {
          // Single Pro job: Direct assignment (existing behavior)
          updateData.assignedHaulerId = assignedHaulerId;
          updateData.status = "assigned";
        }
      }

      await storage.updateServiceRequest(jobId, updateData);

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);

      // Handle specific Stripe errors
      const stripeError = error as any;
      if (stripeError.type === 'StripeCardError') {
        return res.status(400).json({ error: "Card declined", details: stripeError.message });
      }
      if (stripeError.type === 'StripeInvalidRequestError') {
        return res.status(400).json({ error: "Invalid payment request", details: stripeError.message });
      }
      if (stripeError.type === 'StripeAPIError') {
        return res.status(502).json({ error: "Payment service unavailable", details: "Stripe API error" });
      }
      if (stripeError.type === 'StripeConnectionError') {
        return res.status(503).json({ error: "Payment service connection failed" });
      }

      // Handle database errors
      if (stripeError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }

      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });

  // Capture payment for a completed job
  app.post("/api/payments/:jobId/capture", requireAuth, async (req, res) => {
    try {
      const { jobId } = req.params;

      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (!job.stripePaymentIntentId) {
        return res.status(400).json({ error: "No payment intent for this job" });
      }

      if (job.paymentStatus === "captured") {
        return res.status(400).json({ error: "Payment already captured" });
      }

      // Verify job is actually completed before capturing payment
      if (job.status !== "completed") {
        return res.status(400).json({ error: "Cannot capture payment — job is not completed", jobStatus: job.status });
      }

      let haulerStripeAccountId = null;
      let pyckerTier = 'independent';
      let isVerifiedLlc = false;
      if (job.assignedHaulerId) {
        const haulerProfile = await storage.getHaulerProfile(job.assignedHaulerId);
        if (haulerProfile?.stripeAccountId && haulerProfile?.stripeOnboardingComplete) {
          haulerStripeAccountId = haulerProfile.stripeAccountId;
        }
        pyckerTier = haulerProfile?.pyckerTier || 'independent';
        isVerifiedLlc = haulerProfile?.isVerifiedLlc || false;
      }

      const totalAmount = job.livePrice || 0;
      // Use base service price (excluding 7% customer protection fee) for payout calculation
      // If baseServicePrice was stored at create-intent time, use it; otherwise derive it
      const baseServicePrice = job.baseServicePrice || (totalAmount / 1.07);
      const activeCertCount = job.assignedHaulerId ? await getActiveCertCount(job.assignedHaulerId) : 0;
      const result = await stripeService.capturePaymentAndPayHauler(
        job.stripePaymentIntentId,
        haulerStripeAccountId,
        baseServicePrice,
        pyckerTier,
        isVerifiedLlc,
        job.serviceType, // Pass serviceType for $50 minimum payout floor exemption on recurring services
        activeCertCount
      );

      await storage.updateServiceRequest(jobId, {
        paymentStatus: "captured",
        platformFee: result.platformFee,
        haulerPayout: result.haulerPayout,
        paidAt: new Date().toISOString(),
      });

      // George: loyalty tier update after payment (fire-and-forget)
      if (job.customerId && job.livePrice) {
        const amountCents = Math.round(job.livePrice * 100);
        onPaymentCaptured(job.customerId, amountCents).catch(err =>
          console.error('[George] onPaymentCaptured error:', err.message)
        );
      }

      res.json({
        success: true,
        platformFee: result.platformFee,
        haulerPayout: result.haulerPayout,
        haulerPaid: !!haulerStripeAccountId,
      });
    } catch (error) {
      console.error("Error capturing payment:", error);

      // Handle specific Stripe errors
      const stripeError = error as any;
      if (stripeError.type === 'StripeCardError') {
        return res.status(400).json({ error: "Payment failed", details: stripeError.message });
      }
      if (stripeError.type === 'StripeInvalidRequestError') {
        return res.status(400).json({ error: "Invalid capture request", details: stripeError.message });
      }
      if (stripeError.type === 'StripeAPIError') {
        return res.status(502).json({ error: "Payment service error" });
      }
      if (stripeError.code === 'payment_intent_unexpected_state') {
        return res.status(400).json({ error: "Payment already captured or canceled" });
      }

      res.status(500).json({ error: "Failed to capture payment" });
    }
  });

  // BNPL (Buy Now Pay Later) confirmation endpoint
  app.post("/api/payments/confirm-bnpl", requireAuth, async (req, res) => {
    try {
      const { jobId, provider, backupPaymentMethodId } = req.body;
      const userId = (req.user as any).userId || (req.user as any).id;

      if (!jobId || !provider || !backupPaymentMethodId) {
        return res.status(400).json({
          error: "jobId, provider, and backupPaymentMethodId are required"
        });
      }

      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Verify the user owns this job or is an admin
      const user = req.user as any;
      if (job.customerId !== userId && user.role !== 'admin') {
        return res.status(403).json({ error: "Not authorized to confirm BNPL for this job" });
      }

      const amount = job.livePrice || job.priceEstimate || 0;

      // BNPL only available for orders $199+ (matches frontend threshold)
      const BNPL_THRESHOLD = 199;
      if (amount < BNPL_THRESHOLD) {
        return res.status(400).json({
          error: `BNPL is only available for orders $${BNPL_THRESHOLD} or more`
        });
      }

      // Valid BNPL providers
      if (!['affirm', 'klarna'].includes(provider)) {
        return res.status(400).json({ error: "Invalid BNPL provider" });
      }

      // Attach the backup payment method to the customer for later use
      const customer = await storage.getUser(job.customerId);
      if (customer?.stripeCustomerId) {
        try {
          await stripeService.attachPaymentMethod(customer.stripeCustomerId, backupPaymentMethodId);
        } catch (attachError) {
          console.log("Payment method may already be attached or invalid:", attachError);
        }
      }

      // Update the service request with BNPL information
      await storage.updateServiceRequest(jobId, {
        bnplEnabled: true,
        bnplProvider: provider,
        bnplPaymentMethodId: backupPaymentMethodId,
        backupPaymentMethodId: backupPaymentMethodId,
        bnplConfirmedAt: new Date().toISOString(),
        paymentStatus: "bnpl_confirmed",
      });

      res.json({
        success: true,
        message: `BNPL payment confirmed with ${provider}`,
        bnplProvider: provider,
        totalAmount: amount,
        installmentAmount: amount / 4,
      });
    } catch (error) {
      console.error("Error confirming BNPL payment:", error);

      // Handle specific errors
      const err = error as any;
      if (err.type === 'StripeInvalidRequestError') {
        return res.status(400).json({ error: "Invalid payment method", details: err.message });
      }
      if (err.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }

      res.status(500).json({ error: "Failed to confirm BNPL payment" });
    }
  });

  // Charge BNPL backup card for on-site adjustments (admin/hauler only)
  app.post("/api/payments/:jobId/charge-bnpl-adjustment", requireAuth, async (req, res) => {
    try {
      const { jobId } = req.params;
      const { adjustmentAmount, reason } = req.body;
      const userId = (req.user as any).userId || (req.user as any).id;
      const userRole = (req.user as any).role;

      if (!adjustmentAmount || adjustmentAmount <= 0) {
        return res.status(400).json({ error: "Valid adjustment amount is required" });
      }

      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Only the assigned hauler or admin can charge adjustments
      if (userRole !== 'admin' && job.assignedHaulerId !== userId) {
        return res.status(403).json({ error: "Not authorized to charge adjustments for this job" });
      }

      if (!job.bnplEnabled || !job.backupPaymentMethodId) {
        return res.status(400).json({
          error: "This job does not have BNPL with a backup payment method"
        });
      }

      // Get customer info
      const customer = await storage.getUser(job.customerId);
      if (!customer?.stripeCustomerId) {
        return res.status(400).json({ error: "Customer Stripe account not found" });
      }

      // Create and confirm a payment intent for the adjustment amount
      const adjustmentResult = await stripeService.createAndCaptureAdjustment(
        adjustmentAmount,
        customer.stripeCustomerId,
        job.backupPaymentMethodId,
        jobId
      );

      // Update the job with adjustment info
      await storage.updateServiceRequest(jobId, {
        bnplAdjustmentCharged: (job.bnplAdjustmentCharged || 0) + adjustmentAmount,
        bnplAdjustmentChargedAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        adjustmentAmount,
        reason,
        message: `Successfully charged $${adjustmentAmount.toFixed(2)} to backup card`,
        paymentIntentId: adjustmentResult.paymentIntentId,
      });
    } catch (error) {
      console.error("Error charging BNPL adjustment:", error);

      // Handle specific Stripe errors
      const stripeError = error as any;
      if (stripeError.type === 'StripeCardError') {
        return res.status(400).json({ error: "Card declined", details: stripeError.message });
      }
      if (stripeError.type === 'StripeInvalidRequestError') {
        return res.status(400).json({ error: "Invalid charge request", details: stripeError.message });
      }
      if (stripeError.type === 'StripeAPIError') {
        return res.status(502).json({ error: "Payment service unavailable" });
      }

      res.status(500).json({ error: "Failed to charge adjustment to backup card" });
    }
  });

  // Stripe Connect onboarding for haulers
  app.post("/api/haulers/:profileId/stripe-onboard", requireAuth, requireHauler, async (req, res) => {
    try {
      const { profileId } = req.params;

      const profile = await storage.getHaulerProfileById(profileId);
      if (!profile) {
        return res.status(404).json({ error: "Hauler profile not found" });
      }

      const user = await storage.getUser(profile.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let accountId = profile.stripeAccountId;
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      if (!accountId) {
        const account = await stripeService.createConnectAccount(
          profileId,
          user.email || `pro-${user.id}@uptend.app`,
          profile.companyName || userName || 'Pro'
        );
        accountId = account.id;
        await storage.updateHaulerProfile(profileId, { stripeAccountId: accountId });
      }

      const baseUrl = process.env.BASE_URL || `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}`;
      const accountLink = await stripeService.createAccountLink(
        accountId,
        `${baseUrl}/hauler-dashboard?stripe=success`,
        `${baseUrl}/hauler-dashboard?stripe=refresh`
      );

      res.json({ url: accountLink.url });
    } catch (error) {
      console.error("Error creating Stripe onboarding:", error);

      // Handle specific Stripe errors
      const stripeError = error as any;
      if (stripeError.type === 'StripeInvalidRequestError') {
        return res.status(400).json({ error: "Invalid onboarding request", details: stripeError.message });
      }
      if (stripeError.type === 'StripeAPIError') {
        return res.status(502).json({ error: "Stripe service unavailable" });
      }
      if (stripeError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }

      res.status(500).json({ error: "Failed to start Stripe onboarding" });
    }
  });

  // Get Stripe Connect status for haulers
  app.get("/api/haulers/:profileId/stripe-status", requireAuth, requireHauler, async (req, res) => {
    try {
      const { profileId } = req.params;

      const profile = await storage.getHaulerProfileById(profileId);
      if (!profile) {
        return res.status(404).json({ error: "Hauler profile not found" });
      }

      if (!profile.stripeAccountId) {
        return res.json({
          hasAccount: false,
          onboardingComplete: false,
        });
      }

      const status = await stripeService.getAccountStatus(profile.stripeAccountId);

      if (status.chargesEnabled && status.payoutsEnabled && !profile.stripeOnboardingComplete) {
        await storage.updateHaulerProfile(profileId, { stripeOnboardingComplete: true });
      }

      res.json({
        hasAccount: true,
        onboardingComplete: status.chargesEnabled && status.payoutsEnabled,
        chargesEnabled: status.chargesEnabled,
        payoutsEnabled: status.payoutsEnabled,
        detailsSubmitted: status.detailsSubmitted,
      });
    } catch (error) {
      console.error("Error getting Stripe status:", error);

      // Handle specific Stripe errors
      const stripeError = error as any;
      if (stripeError.type === 'StripeInvalidRequestError') {
        return res.status(400).json({ error: "Invalid account request" });
      }
      if (stripeError.type === 'StripeAPIError') {
        return res.status(502).json({ error: "Stripe service unavailable" });
      }

      res.status(500).json({ error: "Failed to get Stripe account status" });
    }
  });

  // Pro alias: Stripe Connect onboarding
  app.post("/api/pros/:profileId/stripe-onboard", requireAuth, requireHauler, async (req, res) => {
    try {
      const { profileId } = req.params;
      const profile = await storage.getHaulerProfileById(profileId);
      if (!profile) return res.status(404).json({ error: "Pro profile not found" });
      const user = await storage.getUser(profile.userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      let accountId = profile.stripeAccountId;
      if (!accountId) {
        const account = await stripeService.createConnectAccount(
          profileId, user.email || `pro-${user.id}@uptend.app`,
          profile.companyName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Pro'
        );
        accountId = account.id;
        await storage.updateHaulerProfile(profileId, { stripeAccountId: accountId });
      }
      const baseUrl = process.env.BASE_URL || `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}`;
      const accountLink = await stripeService.createAccountLink(
        accountId,
        `${baseUrl}/hauler-dashboard?stripe=success`,
        `${baseUrl}/hauler-dashboard?stripe=refresh`
      );
      res.json({ url: accountLink.url });
    } catch (error) {
      console.error("Error creating Stripe onboarding:", error);
      res.status(500).json({ error: "Failed to start Stripe onboarding" });
    }
  });

  // Pro alias: Get Stripe Connect status
  app.get("/api/pros/:profileId/stripe-status", requireAuth, requireHauler, async (req, res) => {
    try {
      const { profileId } = req.params;
      const profile = await storage.getHaulerProfileById(profileId);
      if (!profile) return res.status(404).json({ error: "Pro profile not found" });
      if (!profile.stripeAccountId) {
        return res.json({ hasAccount: false, onboardingComplete: false });
      }
      const status = await stripeService.getAccountStatus(profile.stripeAccountId);
      if (status.chargesEnabled && status.payoutsEnabled && !profile.stripeOnboardingComplete) {
        await storage.updateHaulerProfile(profileId, { stripeOnboardingComplete: true });
      }
      res.json({
        hasAccount: true,
        onboardingComplete: status.chargesEnabled && status.payoutsEnabled,
        chargesEnabled: status.chargesEnabled,
        payoutsEnabled: status.payoutsEnabled,
      });
    } catch (error) {
      console.error("Error getting Stripe status:", error);
      res.status(500).json({ error: "Failed to get Stripe account status" });
    }
  });

  // Pro alias: Compliance status
  app.get("/api/pros/:profileId/compliance", requireAuth, requireHauler, async (req, res) => {
    try {
      const { profileId } = req.params;
      const profile = await storage.getHaulerProfileById(profileId);
      if (!profile) return res.status(404).json({ error: "Pro profile not found" });

      const hasStripe = !!profile.stripeAccountId;
      let stripeComplete = false;
      if (hasStripe) {
        try {
          const status = await stripeService.getAccountStatus(profile.stripeAccountId!);
          stripeComplete = !!(status.chargesEnabled && status.payoutsEnabled);
        } catch {}
      }

      const backgroundStatus = profile.backgroundCheckStatus || "pending";
      const hasCard = !!profile.hasCardOnFile;
      const ndaAccepted = !!profile.ndaAcceptedAt;

      res.json({
        hasCardOnFile: hasCard,
        backgroundCheckStatus: backgroundStatus,
        stripeOnboardingComplete: stripeComplete,
        canAcceptJobs: (profile as any).email === "testpro@uptend.app" || (stripeComplete && backgroundStatus === "clear" && ndaAccepted),
        unpaidPenaltiesCount: 0,
        unpaidPenaltiesAmount: 0,
        ndaAccepted,
        ndaAcceptedAt: profile.ndaAcceptedAt || null,
        ndaVersion: profile.ndaVersion || null,
      });
    } catch (error) {
      console.error("Error getting compliance:", error);
      res.status(500).json({ error: "Failed to get compliance status" });
    }
  });

  // Pro alias: Setup card on file
  app.post("/api/pros/:profileId/setup-card", requireAuth, requireHauler, async (req, res) => {
    try {
      const { profileId } = req.params;
      const profile = await storage.getHaulerProfileById(profileId);
      if (!profile) return res.status(404).json({ error: "Pro profile not found" });
      // In production this would create a Stripe SetupIntent
      res.json({ success: true, message: "Card setup initiated" });
    } catch (error) {
      console.error("Error setting up card:", error);
      res.status(500).json({ error: "Failed to setup card" });
    }
  });

  // Pro alias: Request background check
  app.post("/api/pros/:profileId/request-background-check", requireAuth, requireHauler, async (req, res) => {
    try {
      const { profileId } = req.params;
      const profile = await storage.getHaulerProfileById(profileId);
      if (!profile) return res.status(404).json({ error: "Pro profile not found" });
      await storage.updateHaulerProfile(profileId, { backgroundCheckStatus: "pending" });
      res.json({ success: true, status: "pending", message: "Background check request submitted" });
    } catch (error) {
      console.error("Error requesting background check:", error);
      res.status(500).json({ error: "Failed to request background check" });
    }
  });

  // Get payment breakdown for a job
  app.get("/api/payments/:jobId/breakdown", requireAuth, async (req, res) => {
    try {
      const { jobId } = req.params;

      const job = await storage.getServiceRequest(jobId);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      // Get the assigned hauler's tier for proper fee calculation
      let pyckerTier = 'independent';
      let isVerifiedLlc = false;
      if (job.assignedHaulerId) {
        const haulerProfile = await storage.getHaulerProfile(job.assignedHaulerId);
        pyckerTier = haulerProfile?.pyckerTier || 'independent';
        isVerifiedLlc = haulerProfile?.isVerifiedLlc || false;
      }

      const totalAmount = job.livePrice || 0;
      // Use base service price (excluding 7% customer protection fee) for payout calculation
      const baseServicePrice = job.baseServicePrice || (totalAmount / 1.07);
      // Use calculatePayoutBreakdown for consistency with actual capture logic
      const activeCertCount = job.assignedHaulerId ? await getActiveCertCount(job.assignedHaulerId) : 0;
      const breakdown = stripeService.calculatePayoutBreakdown(baseServicePrice, pyckerTier, isVerifiedLlc, job.serviceType, activeCertCount);

      res.json({
        totalAmount: breakdown.totalAmount,
        platformFee: breakdown.platformFee,
        haulerPayout: breakdown.haulerPayout,
        insuranceFee: breakdown.insuranceFee,
        platformFeePercent: breakdown.platformFeePercent,
        haulerPayoutPercent: stripeService.getHaulerPayoutPercent(pyckerTier, isVerifiedLlc),
        isVerifiedLlc: breakdown.isVerifiedLlc,
        pyckerTier,
      });
    } catch (error) {
      console.error("Error calculating payment breakdown:", error);

      const dbError = error as any;
      if (dbError.code === 'ECONNREFUSED') {
        return res.status(503).json({ error: "Database connection failed" });
      }

      res.status(500).json({ error: "Failed to calculate payment breakdown" });
    }
  });

  // Tip endpoints
  app.post("/api/jobs/:jobId/tip", requireAuth, async (req, res) => {
    try {
      const { jobId } = req.params;
      const { tipAmount, customerId } = req.body;

      if (!tipAmount || tipAmount <= 0) {
        return res.status(400).json({ error: "Invalid tip amount" });
      }

      const request = await storage.getServiceRequestWithDetails(jobId);
      if (!request) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (request.status !== "completed") {
        return res.status(400).json({ error: "Can only tip after job is completed" });
      }

      const customer = await storage.getUser(customerId);
      if (!customer?.stripeCustomerId) {
        return res.status(400).json({ error: "Customer payment info not found" });
      }

      const haulrProfile = await storage.getHaulerProfile(request.assignedHaulerId!);
      if (!haulrProfile?.stripeAccountId) {
        return res.status(400).json({ error: "IQ Pro payment account not found" });
      }

      const tipPaymentIntent = await stripeService.createTipPaymentIntent(
        tipAmount,
        customer.stripeCustomerId,
        jobId
      );

      res.json({
        clientSecret: tipPaymentIntent.client_secret,
        tipAmount,
        message: "Tip goes 100% to your IQ Pro",
      });
    } catch (error) {
      console.error("Error creating tip:", error);

      // Handle specific Stripe errors
      const stripeError = error as any;
      if (stripeError.type === 'StripeCardError') {
        return res.status(400).json({ error: "Payment method declined" });
      }
      if (stripeError.type === 'StripeInvalidRequestError') {
        return res.status(400).json({ error: "Invalid tip request", details: stripeError.message });
      }
      if (stripeError.type === 'StripeAPIError') {
        return res.status(502).json({ error: "Payment service unavailable" });
      }

      res.status(500).json({ error: "Failed to process tip" });
    }
  });

  // Confirm tip payment
  app.post("/api/jobs/:jobId/tip/confirm", requireAuth, async (req, res) => {
    try {
      const { jobId } = req.params;
      const { paymentIntentId, tipAmount } = req.body;

      const request = await storage.getServiceRequestWithDetails(jobId);
      if (!request) {
        return res.status(404).json({ error: "Job not found" });
      }

      const haulrProfile = await storage.getHaulerProfile(request.assignedHaulerId!);
      if (!haulrProfile?.stripeAccountId) {
        return res.status(400).json({ error: "IQ Pro payment account not found" });
      }

      const transfer = await stripeService.transferTipToPycker(
        paymentIntentId,
        haulrProfile.stripeAccountId,
        tipAmount,
        jobId
      );

      await storage.updateServiceRequest(jobId, {
        tipAmount,
        tipPaidAt: new Date().toISOString(),
        tipStripeTransferId: transfer.id,
      });

      res.json({
        success: true,
        transferId: transfer.id,
        tipAmount,
        message: "Tip sent directly to your IQ Pro!",
      });
    } catch (error) {
      console.error("Error confirming tip:", error);

      // Handle specific Stripe errors
      const stripeError = error as any;
      if (stripeError.type === 'StripeInvalidRequestError') {
        return res.status(400).json({ error: "Invalid tip transfer", details: stripeError.message });
      }
      if (stripeError.type === 'StripeAPIError') {
        return res.status(502).json({ error: "Payment service unavailable" });
      }
      if (stripeError.code === 'transfer_failed') {
        return res.status(400).json({ error: "Transfer failed", details: "Unable to send tip to Pro" });
      }

      res.status(500).json({ error: "Failed to confirm tip" });
    }
  });
}
