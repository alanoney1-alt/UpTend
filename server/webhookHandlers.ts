import { getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';
import { sendJobCompleted } from './services/email-service';
import Stripe from 'stripe';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const stripe = await getUncachableStripeClient();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.warn('STRIPE_WEBHOOK_SECRET not set - skipping signature verification (UNSAFE for production!)');
      return;
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    console.log(`Received Stripe webhook: ${event.type}`);

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await WebhookHandlers.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await WebhookHandlers.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        case 'customer.created':
          console.log(`Customer ${(event.data.object as Stripe.Customer).id} created`);
          break;

        case 'charge.succeeded':
          console.log(`Charge ${(event.data.object as Stripe.Charge).id} succeeded`);
          break;

        case 'account.updated':
          await WebhookHandlers.handleAccountUpdated(event.data.object as Stripe.Account);
          break;

        case 'charge.dispute.created':
          await WebhookHandlers.handleDisputeCreated(event.data.object as Stripe.Dispute);
          break;

        default:
          console.log(`Unhandled webhook event type: ${event.type}`);
      }
    } catch (err: any) {
      // Webhook handlers should NEVER throw — Stripe retries on 500
      console.error(`[WEBHOOK ERROR] Failed to handle ${event.type}:`, err.message, err.stack);
    }
  }

  /**
   * payment_intent.succeeded — Update job payment status and send confirmation.
   * Covers card payments, 3DS confirmations, and BNPL completions.
   */
  private static async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const jobId = paymentIntent.metadata?.jobId;
    console.log(`PaymentIntent ${paymentIntent.id} succeeded (jobId: ${jobId || 'unknown'})`);

    if (!jobId) {
      // Could be a tip or adjustment — not all PIs have a jobId
      console.log(`PaymentIntent ${paymentIntent.id} succeeded but has no jobId metadata, skipping job update.`);
      return;
    }

    const job = await storage.getServiceRequest(jobId);
    if (!job) {
      console.error(`[WEBHOOK] Job ${jobId} not found for PaymentIntent ${paymentIntent.id}`);
      return;
    }

    // Only update if not already in a terminal payment state
    if (job.paymentStatus === 'captured' || job.paymentStatus === 'paid') {
      console.log(`[WEBHOOK] Job ${jobId} already ${job.paymentStatus}, skipping duplicate.`);
      return;
    }

    // For manual capture PIs (our default), 'succeeded' means it was captured.
    // For auto-capture PIs (tips, adjustments), it means payment is complete.
    const isManuallyCaptured = paymentIntent.capture_method === 'manual';
    const newStatus = isManuallyCaptured ? 'captured' : 'paid';

    await storage.updateServiceRequest(jobId, {
      paymentStatus: newStatus,
      stripePaymentIntentId: paymentIntent.id,
      paidAt: new Date().toISOString(),
    });

    console.log(`[WEBHOOK] Job ${jobId} payment status → ${newStatus}`);

    // Send confirmation email if customer email is available
    try {
      const customerEmail = job.customerEmail;
      let email = customerEmail;

      if (!email && job.customerId) {
        const user = await storage.getUser(job.customerId);
        email = user?.email || null;
      }

      if (email) {
        const amountDollars = paymentIntent.amount / 100;
        await sendJobCompleted(email, job, {
          finalPrice: amountDollars,
          livePrice: job.livePrice,
          platformFee: job.platformFee,
        });
        console.log(`[WEBHOOK] Sent payment confirmation email for job ${jobId}`);
      }
    } catch (emailErr: any) {
      // Never fail the webhook because of email
      console.error(`[WEBHOOK] Failed to send confirmation email for job ${jobId}:`, emailErr.message);
    }
  }

  /**
   * payment_intent.payment_failed — Mark job payment as failed, notify customer.
   * Covers 3DS failures, card declines, and BNPL rejections.
   */
  private static async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const jobId = paymentIntent.metadata?.jobId;
    const lastError = paymentIntent.last_payment_error;
    const failureMessage = lastError?.message || 'Payment failed';
    const failureCode = lastError?.code || 'unknown';

    console.error(`[WEBHOOK] PaymentIntent ${paymentIntent.id} FAILED (jobId: ${jobId || 'unknown'}, code: ${failureCode}): ${failureMessage}`);

    if (!jobId) {
      console.log(`[WEBHOOK] Failed PaymentIntent ${paymentIntent.id} has no jobId, skipping job update.`);
      return;
    }

    const job = await storage.getServiceRequest(jobId);
    if (!job) {
      console.error(`[WEBHOOK] Job ${jobId} not found for failed PaymentIntent ${paymentIntent.id}`);
      return;
    }

    await storage.updateServiceRequest(jobId, {
      paymentStatus: 'failed',
    });

    console.error(`[WEBHOOK][ADMIN] Payment failed for job ${jobId} | PI: ${paymentIntent.id} | Code: ${failureCode} | ${failureMessage}`);

    // Notify customer via email
    try {
      let email = job.customerEmail;
      if (!email && job.customerId) {
        const user = await storage.getUser(job.customerId);
        email = user?.email || null;
      }

      if (email) {
        // Use the generic send from email-service (import inline to avoid circular deps)
        const { default: nodemailer } = await import('nodemailer');
        // Re-use the same transport logic — but since sendJobCompleted doesn't fit,
        // we'll log for now. In production, add a sendPaymentFailed email template.
        console.log(`[WEBHOOK] Payment failed notification should be sent to ${email} for job ${jobId}`);
        // TODO: Create sendPaymentFailed email template and call it here
      }
    } catch (emailErr: any) {
      console.error(`[WEBHOOK] Failed to process payment failure email for job ${jobId}:`, emailErr.message);
    }
  }

  /**
   * account.updated — Sync Connect onboarding status to hauler_profiles.
   * Fires whenever a Connected account's status changes (onboarding, verification, etc.)
   */
  private static async handleAccountUpdated(account: Stripe.Account): Promise<void> {
    const haulerId = account.metadata?.haulerId;
    console.log(`[WEBHOOK] Account ${account.id} updated (haulerId: ${haulerId || 'unknown'}) — charges: ${account.charges_enabled}, payouts: ${account.payouts_enabled}`);

    if (!haulerId) {
      console.log(`[WEBHOOK] Account ${account.id} has no haulerId metadata, skipping.`);
      return;
    }

    const profile = await storage.getHaulerProfileById(haulerId);
    if (!profile) {
      console.error(`[WEBHOOK] Hauler profile ${haulerId} not found for account ${account.id}`);
      return;
    }

    const onboardingComplete = !!(account.charges_enabled && account.payouts_enabled);

    await storage.updateHaulerProfile(haulerId, {
      stripeOnboardingComplete: onboardingComplete,
    });

    console.log(`[WEBHOOK] Hauler ${haulerId} onboarding status → ${onboardingComplete ? 'COMPLETE' : 'INCOMPLETE'} (charges: ${account.charges_enabled}, payouts: ${account.payouts_enabled})`);
  }

  /**
   * charge.dispute.created — Log dispute, flag job, alert admin.
   */
  private static async handleDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
    const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;
    const amount = dispute.amount / 100;
    const reason = dispute.reason || 'unknown';
    const piId = typeof dispute.payment_intent === 'string' ? dispute.payment_intent : dispute.payment_intent?.id;

    console.error(`[WEBHOOK][ADMIN][DISPUTE] Dispute ${dispute.id} created! Amount: $${amount}, Reason: ${reason}, Charge: ${chargeId}, PI: ${piId || 'n/a'}`);

    // Try to find the associated job via the payment intent metadata
    if (piId) {
      try {
        const stripe = await getUncachableStripeClient();
        const pi = await stripe.paymentIntents.retrieve(piId);
        const jobId = pi.metadata?.jobId;

        if (jobId) {
          const job = await storage.getServiceRequest(jobId);
          if (job) {
            await storage.updateServiceRequest(jobId, {
              paymentStatus: 'disputed',
            });
            console.error(`[WEBHOOK][ADMIN][DISPUTE] Job ${jobId} marked as disputed. Customer: ${job.customerId}, Amount: $${amount}, Reason: ${reason}`);
          }
        }
      } catch (err: any) {
        console.error(`[WEBHOOK] Failed to look up job for dispute ${dispute.id}:`, err.message);
      }
    }
  }
}
