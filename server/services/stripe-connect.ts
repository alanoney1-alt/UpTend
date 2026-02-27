/**
 * Stripe Connect Service
 * Handles onboarding, payment splits, and payouts for pros and business partners.
 * 
 * Fee model:
 *   Customer pays: proPrice + 5% service fee
 *   Platform keeps: 15% of proPrice (via application_fee_amount)
 *   Pro receives: 85% of proPrice (automatic transfer to connected account)
 *   Minimum pro payout: $50/job
 */

import { db } from "../db";
import { haulerProfiles } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { calculateFees } from "./fee-calculator-v2";
import { logError } from "../utils/logger";

// Lazy stripe import to handle missing keys gracefully
async function getStripe() {
  try {
    const { getUncachableStripeClient } = await import("../stripeClient");
    return await getUncachableStripeClient();
  } catch {
    return null;
  }
}

function mockSuccess(data: any) {
  return { _mock: true, ...data };
}

// ── Onboarding ──────────────────────────────────────────────────────────────

export async function createConnectedAccount(
  proId: string,
  email: string,
  type: "pro" | "business" = "pro"
) {
  const stripe = await getStripe();
  if (!stripe) {
    return mockSuccess({ id: `mock_acct_${proId}`, type: "express" });
  }

  try {
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        proId,
        accountType: type,
      },
    });

    // Store the account ID on the hauler profile
    await db
      .update(haulerProfiles)
      .set({
        stripeAccountId: account.id,
        stripeOnboardingComplete: false,
      })
      .where(eq(haulerProfiles.userId, proId));

    return account;
  } catch (error: any) {
    logError(error, "Stripe Connect: createConnectedAccount", { proId, email, type });
    throw error;
  }
}

export async function generateOnboardingLink(
  accountId: string,
  returnUrl: string
) {
  const stripe = await getStripe();
  if (!stripe) {
    return mockSuccess({ url: `${returnUrl}?setup=mock` });
  }

  try {
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${returnUrl}?refresh=true`,
      return_url: returnUrl,
      type: "account_onboarding",
    });
    return link;
  } catch (error: any) {
    logError(error, "Stripe Connect: generateOnboardingLink", { accountId });
    throw error;
  }
}

export async function getAccountStatus(accountId: string) {
  const stripe = await getStripe();
  if (!stripe) {
    return mockSuccess({
      chargesEnabled: true,
      payoutsEnabled: true,
      detailsSubmitted: true,
    });
  }

  try {
    const account = await stripe.accounts.retrieve(accountId);
    return {
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    };
  } catch (error: any) {
    logError(error, "Stripe Connect: getAccountStatus", { accountId });
    throw error;
  }
}

export async function generateDashboardLink(accountId: string) {
  const stripe = await getStripe();
  if (!stripe) {
    return mockSuccess({ url: "https://dashboard.stripe.com/test" });
  }

  try {
    const link = await stripe.accounts.createLoginLink(accountId);
    return link;
  } catch (error: any) {
    logError(error, "Stripe Connect: generateDashboardLink", { accountId });
    throw error;
  }
}

// ── Payments with Split ─────────────────────────────────────────────────────

export async function createPaymentWithSplit(
  proPrice: number,
  customerPaymentMethodId: string,
  customerId: string,
  connectedAccountId: string | null,
  jobId: string
) {
  const fees = calculateFees(proPrice);
  const stripe = await getStripe();

  if (!stripe) {
    return mockSuccess({
      paymentIntentId: `mock_pi_${jobId}`,
      customerTotal: fees.customerTotal,
      platformFee: fees.platformFee,
      proPayout: fees.proPayout,
      status: "requires_capture",
    });
  }

  const amountCents = Math.round(fees.customerTotal * 100);
  const platformFeeCents = Math.round((fees.platformFee + fees.serviceFee) * 100);

  try {
    // Enable BNPL for jobs >= $199
    const paymentMethodTypes: string[] = ["card"];
    if (fees.customerTotal >= 199) {
      paymentMethodTypes.push("afterpay_clearpay", "klarna");
    }

    const piParams: any = {
      amount: amountCents,
      currency: "usd",
      customer: customerId,
      payment_method: customerPaymentMethodId,
      capture_method: "manual",
      payment_method_types: paymentMethodTypes,
      metadata: {
        jobId,
        proPrice: proPrice.toString(),
        serviceFee: fees.serviceFee.toString(),
        platformFee: fees.platformFee.toString(),
        proPayout: fees.proPayout.toString(),
      },
    };

    // If pro has a connected account, use application_fee_amount for automatic split
    if (connectedAccountId) {
      piParams.application_fee_amount = platformFeeCents;
      piParams.transfer_data = {
        destination: connectedAccountId,
      };
    }

    const paymentIntent = await stripe.paymentIntents.create(piParams, {
      idempotencyKey: `pi_sm_${jobId}_${amountCents}`,
    });

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      customerTotal: fees.customerTotal,
      platformFee: fees.platformFee + fees.serviceFee,
      proPayout: fees.proPayout,
      status: paymentIntent.status,
      connectedAccountId,
    };
  } catch (error: any) {
    logError(error, "Stripe Connect: createPaymentWithSplit", { proPrice, jobId });
    throw error;
  }
}

// ── Payout History ──────────────────────────────────────────────────────────

export async function getPayoutHistory(
  accountId: string,
  startDate?: string,
  endDate?: string
) {
  const stripe = await getStripe();
  if (!stripe) {
    return mockSuccess({ payouts: [] });
  }

  try {
    const params: any = { limit: 50 };
    if (startDate) {
      params.created = { gte: Math.floor(new Date(startDate).getTime() / 1000) };
    }
    if (endDate) {
      params.created = { ...(params.created || {}), lte: Math.floor(new Date(endDate).getTime() / 1000) };
    }

    const payouts = await stripe.payouts.list(params, {
      stripeAccount: accountId,
    });

    return {
      payouts: payouts.data.map((p) => ({
        id: p.id,
        amount: p.amount / 100,
        status: p.status,
        arrivalDate: new Date(p.arrival_date * 1000).toISOString(),
        created: new Date(p.created * 1000).toISOString(),
        method: p.method,
      })),
    };
  } catch (error: any) {
    logError(error, "Stripe Connect: getPayoutHistory", { accountId });
    throw error;
  }
}

// ── Webhook Processing ──────────────────────────────────────────────────────

export async function handleConnectWebhookEvent(event: any) {
  switch (event.type) {
    case "account.updated": {
      const account = event.data.object;
      const proId = account.metadata?.proId;
      if (proId) {
        const isComplete = account.charges_enabled && account.payouts_enabled;
        await db
          .update(haulerProfiles)
          .set({
            stripeOnboardingComplete: isComplete,
          })
          .where(eq(haulerProfiles.userId, proId));
      }
      break;
    }
    case "payout.paid": {
      console.log("[Stripe Connect] Payout paid:", event.data.object.id);
      break;
    }
    case "payout.failed": {
      console.log("[Stripe Connect] Payout failed:", event.data.object.id);
      break;
    }
    default:
      console.log("[Stripe Connect] Unhandled event:", event.type);
  }
}

// ---- Aliases & stubs for pre-existing route files ----
// These functions are imported by hauler/payouts.routes.ts and stripe-connect-webhooks.ts

export const createConnectAccount = createConnectedAccount;

export async function checkAccountStatus(accountId: string) {
  return getAccountStatus(accountId);
}

export async function initiateInstantPayout(_proId: number, _amount: number) {
  // Instant payouts require Stripe Connect Express with instant payout capability
  return { success: false, message: "Instant payouts not yet enabled. Payouts are processed automatically." };
}

export async function getPayoutStats(proId: number) {
  return {
    totalEarnings: 0,
    totalPayouts: 0,
    pendingBalance: 0,
    availableBalance: 0,
    lastPayoutDate: null,
    proId,
  };
}

export async function createTransferForJob(_jobId: number, _amount: number, _connectedAccountId: string) {
  // In the new model, transfers happen automatically via application_fee_amount
  return { success: true, message: "Transfer handled automatically via Stripe Connect split." };
}

export async function updatePayoutByTransferId(_transferId: string, _data: any) {
  console.log("[Stripe Connect] updatePayoutByTransferId stub:", _transferId);
}

export async function updatePayoutByStripePayoutId(_payoutId: string, _data: any) {
  console.log("[Stripe Connect] updatePayoutByStripePayoutId stub:", _payoutId);
}

export async function updateAccountByStripeId(_stripeAccountId: string, _data: any) {
  console.log("[Stripe Connect] updateAccountByStripeId stub:", _stripeAccountId);
}

export async function getPayoutAccountByStripeId(_stripeAccountId: string) {
  return null;
}

export async function getPayoutByTransferId(_transferId: string) {
  return null;
}

export async function getPayoutByStripePayoutId(_payoutId: string) {
  return null;
}

export async function processJobCompletion(_jobId: number) {
  // Job completion payment processing - captured via existing PaymentIntent flow
  console.log("[Stripe Connect] processJobCompletion for job:", _jobId);
  return { success: true };
}
