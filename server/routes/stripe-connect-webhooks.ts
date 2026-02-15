/**
 * Stripe Connect Webhook Handlers
 * 
 * Separate webhook endpoint for Connect-related events.
 * Uses STRIPE_CONNECT_WEBHOOK_SECRET for signature verification.
 */

import { Router, type Request, type Response } from "express";
import { getUncachableStripeClient } from "../stripeClient";
import {
  updatePayoutByTransferId,
  updatePayoutByStripePayoutId,
  updateAccountByStripeId,
  getPayoutAccountByStripeId,
  getPayoutByTransferId,
  getPayoutByStripePayoutId,
} from "../services/stripe-connect";
import { sendEmail } from "../services/notifications";
import { logError } from "../utils/logger";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[CONNECT-WEBHOOK] STRIPE_CONNECT_WEBHOOK_SECRET not configured");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  let event: any;
  try {
    const stripe = await getUncachableStripeClient();
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error("[CONNECT-WEBHOOK] Signature verification failed:", err.message);
    return res.status(400).json({ error: "Invalid signature" });
  }

  try {
    switch (event.type) {
      case "account.updated": {
        const account = event.data.object;
        const chargesEnabled = account.charges_enabled ?? false;
        const payoutsEnabled = account.payouts_enabled ?? false;
        const requirements = account.requirements?.currently_due ?? [];
        const onboardingComplete = chargesEnabled && payoutsEnabled && requirements.length === 0;

        let status = "pending";
        if (onboardingComplete) status = "active";
        else if (account.requirements?.disabled_reason) status = "disabled";
        else if (requirements.length > 0) status = "restricted";

        await updateAccountByStripeId(account.id, {
          stripeAccountStatus: status,
          onboardingComplete,
        });

        console.log(`[CONNECT-WEBHOOK] account.updated ${account.id}: status=${status}, onboarding=${onboardingComplete}`);
        break;
      }

      case "transfer.created": {
        const transfer = event.data.object;
        await updatePayoutByTransferId(transfer.id, { status: "processing" });
        console.log(`[CONNECT-WEBHOOK] transfer.created ${transfer.id}`);
        break;
      }

      case "transfer.paid": {
        const transfer = event.data.object;
        await updatePayoutByTransferId(transfer.id, {
          status: "paid",
          paidAt: new Date().toISOString(),
        });
        console.log(`[CONNECT-WEBHOOK] transfer.paid ${transfer.id}`);
        break;
      }

      case "transfer.failed": {
        const transfer = event.data.object;
        const reason = (transfer as any).failure_message || "Unknown failure";
        await updatePayoutByTransferId(transfer.id, {
          status: "failed",
          failureReason: reason,
        });

        // Notify admin
        sendEmail({
          to: process.env.ADMIN_EMAIL || "admin@uptendapp.com",
          subject: `[UpTend] Transfer Failed: ${transfer.id}`,
          text: `Transfer ${transfer.id} failed. Reason: ${reason}. Pro: ${(transfer as any).metadata?.proId}. Job: ${(transfer as any).metadata?.serviceRequestId}`,
        }).catch((e) => console.error("[CONNECT-WEBHOOK] Admin email failed:", e.message));

        console.log(`[CONNECT-WEBHOOK] transfer.failed ${transfer.id}: ${reason}`);
        break;
      }

      case "transfer.reversed": {
        const transfer = event.data.object;
        await updatePayoutByTransferId(transfer.id, { status: "reversed" });

        sendEmail({
          to: process.env.ADMIN_EMAIL || "admin@uptendapp.com",
          subject: `[UpTend] Transfer Reversed: ${transfer.id}`,
          text: `Transfer ${transfer.id} was reversed. Pro: ${(transfer as any).metadata?.proId}. Job: ${(transfer as any).metadata?.serviceRequestId}`,
        }).catch((e) => console.error("[CONNECT-WEBHOOK] Admin email failed:", e.message));

        console.log(`[CONNECT-WEBHOOK] transfer.reversed ${transfer.id}`);
        break;
      }

      case "payout.paid": {
        const payout = event.data.object;
        if (payout.method === "instant") {
          await updatePayoutByStripePayoutId(payout.id, {
            status: "paid",
            paidAt: new Date().toISOString(),
          });
          console.log(`[CONNECT-WEBHOOK] payout.paid (instant) ${payout.id}`);
        }
        break;
      }

      case "payout.failed": {
        const payout = event.data.object;
        const reason = (payout as any).failure_message || "Unknown failure";
        await updatePayoutByStripePayoutId(payout.id, {
          status: "failed",
          failureReason: reason,
        });

        console.log(`[CONNECT-WEBHOOK] payout.failed ${payout.id}: ${reason}`);
        break;
      }

      default:
        console.log(`[CONNECT-WEBHOOK] Unhandled event: ${event.type}`);
    }
  } catch (error: any) {
    logError(error, "Connect webhook handler error", { eventType: event.type });
    console.error(`[CONNECT-WEBHOOK] Handler error for ${event.type}:`, error.message);
  }

  res.json({ received: true });
});

export default router;
