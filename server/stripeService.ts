import { getUncachableStripeClient, getStripePublishableKey } from './stripeClient';
import { storage } from './storage';

const LLC_PLATFORM_FEE_PERCENT = 20;
const NON_LLC_PLATFORM_FEE_PERCENT = 25;
const NON_LLC_INSURANCE_FEE = 25;

export interface PayoutBreakdown {
  totalAmount: number;
  platformFeePercent: number;
  platformFee: number;
  insuranceFee: number;
  haulerPayout: number;
  isVerifiedLlc: boolean;
}

export class StripeService {
  getPlatformFeePercent(_pyckerTier: string = 'independent', isVerifiedLlc: boolean = false): number {
    return isVerifiedLlc ? LLC_PLATFORM_FEE_PERCENT : NON_LLC_PLATFORM_FEE_PERCENT;
  }

  getHaulerPayoutPercent(_pyckerTier: string = 'independent', isVerifiedLlc: boolean = false): number {
    return isVerifiedLlc ? 80 : 75;
  }

  calculatePayoutBreakdown(totalAmount: number, pyckerTier: string = 'independent', isVerifiedLlc: boolean = false): PayoutBreakdown {
    const platformFeePercent = this.getPlatformFeePercent(pyckerTier, isVerifiedLlc);
    const platformFee = Math.round(totalAmount * (platformFeePercent / 100) * 100) / 100;
    const insuranceFee = isVerifiedLlc ? 0 : NON_LLC_INSURANCE_FEE;
    const haulerPayout = Math.round((totalAmount - platformFee - insuranceFee) * 100) / 100;

    return {
      totalAmount,
      platformFeePercent,
      platformFee,
      insuranceFee,
      haulerPayout: Math.max(0, haulerPayout),
      isVerifiedLlc,
    };
  }
  async createCustomer(email: string, name: string, userId: string) {
    const stripe = await getUncachableStripeClient();
    try {
      return await stripe.customers.create({
        email,
        name,
        metadata: { userId },
      });
    } catch (error: any) {
      console.error('Stripe API error in createCustomer:', error);
      if (error.type === 'StripeCardError') {
        // Card was declined
      } else if (error.type === 'StripeInvalidRequestError') {
        // Invalid parameters
      } else if (error.type === 'StripeAPIError') {
        // Stripe's API issue
      } else if (error.type === 'StripeConnectionError') {
        // Network issue
      }
      throw error; // Re-throw to be handled by route
    }
  }

  async createPaymentIntent(amount: number, customerId: string, jobId: string, pyckerTier: string = 'independent') {
    const stripe = await getUncachableStripeClient();
    const amountCents = Math.round(amount * 100);
    const platformFeePercent = this.getPlatformFeePercent(pyckerTier);

    // Enable BNPL (Buy Now Pay Later) for jobs $199 or more
    const paymentMethodTypes = ['card'];
    if (amount >= 199) {
      paymentMethodTypes.push('afterpay_clearpay', 'klarna');
    }

    try {
      return await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'usd',
        customer: customerId,
        capture_method: 'manual',
        payment_method_types: paymentMethodTypes,
        metadata: {
          jobId,
          pyckerTier,
          platformFeePercent: platformFeePercent.toString(),
        },
      });
    } catch (error: any) {
      console.error('Stripe API error in createPaymentIntent:', error);
      if (error.type === 'StripeCardError') {
        // Card was declined
      } else if (error.type === 'StripeInvalidRequestError') {
        // Invalid parameters
      } else if (error.type === 'StripeAPIError') {
        // Stripe's API issue
      } else if (error.type === 'StripeConnectionError') {
        // Network issue
      }
      throw error; // Re-throw to be handled by route
    }
  }

  async capturePaymentAndPayHauler(
    paymentIntentId: string,
    haulerStripeAccountId: string | null,
    totalAmount: number,
    pyckerTier: string = 'independent',
    isVerifiedLlc: boolean = false
  ) {
    const stripe = await getUncachableStripeClient();

    const breakdown = this.calculatePayoutBreakdown(totalAmount, pyckerTier, isVerifiedLlc);

    try {
      await stripe.paymentIntents.capture(paymentIntentId);
    } catch (error: any) {
      console.error('Stripe API error in capturePaymentAndPayHauler (capture):', error);
      if (error.type === 'StripeCardError') {
        // Card was declined
      } else if (error.type === 'StripeInvalidRequestError') {
        // Invalid parameters
      } else if (error.type === 'StripeAPIError') {
        // Stripe's API issue
      } else if (error.type === 'StripeConnectionError') {
        // Network issue
      }
      throw error; // Re-throw to be handled by route
    }

    let transferId = null;
    let instantPayoutId = null;
    let payoutStatus = 'pending';

    if (haulerStripeAccountId) {
      try {
        const transfer = await stripe.transfers.create({
          amount: Math.round(breakdown.haulerPayout * 100),
          currency: 'usd',
          destination: haulerStripeAccountId,
          metadata: {
            paymentIntentId,
            insuranceFee: breakdown.insuranceFee.toString(),
            isVerifiedLlc: isVerifiedLlc.toString(),
          },
        });
        transferId = transfer.id;
      } catch (error: any) {
        console.error('Stripe API error in capturePaymentAndPayHauler (transfer):', error);
        if (error.type === 'StripeCardError') {
          // Card was declined
        } else if (error.type === 'StripeInvalidRequestError') {
          // Invalid parameters
        } else if (error.type === 'StripeAPIError') {
          // Stripe's API issue
        } else if (error.type === 'StripeConnectionError') {
          // Network issue
        }
        throw error; // Re-throw to be handled by route
      }

      try {
        const payout = await stripe.payouts.create(
          {
            amount: Math.round(breakdown.haulerPayout * 100),
            currency: 'usd',
            method: 'instant',
          },
          {
            stripeAccount: haulerStripeAccountId,
          }
        );
        instantPayoutId = payout.id;
        payoutStatus = 'instant';
      } catch (err: any) {
        console.log(`Instant payout not available for ${haulerStripeAccountId}: ${err.message}`);
        payoutStatus = 'standard';
      }
    }

    return {
      platformFee: breakdown.platformFee,
      insuranceFee: breakdown.insuranceFee,
      haulerPayout: breakdown.haulerPayout,
      isVerifiedLlc: breakdown.isVerifiedLlc,
      transferId,
      instantPayoutId,
      payoutStatus,
    };
  }

  async createConnectAccount(haulerId: string, email: string, companyName: string) {
    const stripe = await getUncachableStripeClient();

    try {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email,
        business_type: 'individual',
        capabilities: {
          transfers: { requested: true },
        },
        metadata: { haulerId },
      });

      return account;
    } catch (error: any) {
      console.error('Stripe API error in createConnectAccount:', error);
      if (error.type === 'StripeCardError') {
        // Card was declined
      } else if (error.type === 'StripeInvalidRequestError') {
        // Invalid parameters
      } else if (error.type === 'StripeAPIError') {
        // Stripe's API issue
      } else if (error.type === 'StripeConnectionError') {
        // Network issue
      }
      throw error; // Re-throw to be handled by route
    }
  }

  async createAccountLink(accountId: string, returnUrl: string, refreshUrl: string) {
    const stripe = await getUncachableStripeClient();

    try {
      return await stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });
    } catch (error: any) {
      console.error('Stripe API error in createAccountLink:', error);
      if (error.type === 'StripeCardError') {
        // Card was declined
      } else if (error.type === 'StripeInvalidRequestError') {
        // Invalid parameters
      } else if (error.type === 'StripeAPIError') {
        // Stripe's API issue
      } else if (error.type === 'StripeConnectionError') {
        // Network issue
      }
      throw error; // Re-throw to be handled by route
    }
  }

  async getAccountStatus(accountId: string) {
    const stripe = await getUncachableStripeClient();

    try {
      const account = await stripe.accounts.retrieve(accountId);

      return {
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
      };
    } catch (error: any) {
      console.error('Stripe API error in getAccountStatus:', error);
      if (error.type === 'StripeCardError') {
        // Card was declined
      } else if (error.type === 'StripeInvalidRequestError') {
        // Invalid parameters
      } else if (error.type === 'StripeAPIError') {
        // Stripe's API issue
      } else if (error.type === 'StripeConnectionError') {
        // Network issue
      }
      throw error; // Re-throw to be handled by route
    }
  }

  async createInstantPayout(accountId: string, amount: number) {
    const stripe = await getUncachableStripeClient();
    const amountCents = Math.round(amount * 100);

    try {
      return await stripe.payouts.create(
        {
          amount: amountCents,
          currency: 'usd',
          method: 'instant',
        },
        {
          stripeAccount: accountId,
        }
      );
    } catch (error: any) {
      console.error('Stripe API error in createInstantPayout:', error);
      if (error.type === 'StripeCardError') {
        // Card was declined
      } else if (error.type === 'StripeInvalidRequestError') {
        // Invalid parameters
      } else if (error.type === 'StripeAPIError') {
        // Stripe's API issue
      } else if (error.type === 'StripeConnectionError') {
        // Network issue
      }
      throw error; // Re-throw to be handled by route
    }
  }

  async getPublishableKey() {
    return await getStripePublishableKey();
  }

  calculatePlatformFee(amount: number, pyckerTier: string = 'independent') {
    const platformFeePercent = this.getPlatformFeePercent(pyckerTier);
    return Math.round(amount * (platformFeePercent / 100) * 100) / 100;
  }

  calculateHaulerPayout(amount: number, pyckerTier: string = 'independent') {
    const platformFee = this.calculatePlatformFee(amount, pyckerTier);
    return Math.round((amount - platformFee) * 100) / 100;
  }

  async createIncidentCustomer(haulerId: string, email: string, name: string) {
    const stripe = await getUncachableStripeClient();
    try {
      return await stripe.customers.create({
        email,
        name,
        metadata: { haulerId, type: 'incident_billing' },
      });
    } catch (error: any) {
      console.error('Stripe API error in createIncidentCustomer:', error);
      if (error.type === 'StripeCardError') {
        // Card was declined
      } else if (error.type === 'StripeInvalidRequestError') {
        // Invalid parameters
      } else if (error.type === 'StripeAPIError') {
        // Stripe's API issue
      } else if (error.type === 'StripeConnectionError') {
        // Network issue
      }
      throw error; // Re-throw to be handled by route
    }
  }

  async createSetupIntent(customerId: string) {
    const stripe = await getUncachableStripeClient();
    try {
      return await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
      });
    } catch (error: any) {
      console.error('Stripe API error in createSetupIntent:', error);
      if (error.type === 'StripeCardError') {
        // Card was declined
      } else if (error.type === 'StripeInvalidRequestError') {
        // Invalid parameters
      } else if (error.type === 'StripeAPIError') {
        // Stripe's API issue
      } else if (error.type === 'StripeConnectionError') {
        // Network issue
      }
      throw error; // Re-throw to be handled by route
    }
  }

  async attachPaymentMethod(customerId: string, paymentMethodId: string) {
    const stripe = await getUncachableStripeClient();
    try {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });
    } catch (error: any) {
      console.error('Stripe API error in attachPaymentMethod:', error);
      if (error.type === 'StripeCardError') {
        // Card was declined
      } else if (error.type === 'StripeInvalidRequestError') {
        // Invalid parameters
      } else if (error.type === 'StripeAPIError') {
        // Stripe's API issue
      } else if (error.type === 'StripeConnectionError') {
        // Network issue
      }
      throw error; // Re-throw to be handled by route
    }
  }

  async chargeIncidentPenalty(
    customerId: string,
    paymentMethodId: string,
    amount: number,
    description: string,
    metadata: Record<string, string>
  ) {
    const stripe = await getUncachableStripeClient();
    const amountCents = Math.round(amount * 100);

    try {
      return await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'usd',
        customer: customerId,
        payment_method: paymentMethodId,
        confirm: true,
        off_session: true,
        description,
        metadata,
      });
    } catch (error: any) {
      console.error('Stripe API error in chargeIncidentPenalty:', error);
      if (error.type === 'StripeCardError') {
        // Card was declined
      } else if (error.type === 'StripeInvalidRequestError') {
        // Invalid parameters
      } else if (error.type === 'StripeAPIError') {
        // Stripe's API issue
      } else if (error.type === 'StripeConnectionError') {
        // Network issue
      }
      throw error; // Re-throw to be handled by route
    }
  }

  async getPaymentMethods(customerId: string) {
    const stripe = await getUncachableStripeClient();
    try {
      const methods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });
      return methods.data;
    } catch (error: any) {
      console.error('Stripe API error in getPaymentMethods:', error);
      if (error.type === 'StripeCardError') {
        // Card was declined
      } else if (error.type === 'StripeInvalidRequestError') {
        // Invalid parameters
      } else if (error.type === 'StripeAPIError') {
        // Stripe's API issue
      } else if (error.type === 'StripeConnectionError') {
        // Network issue
      }
      throw error; // Re-throw to be handled by route
    }
  }

  async listPaymentMethods(customerId: string) {
    const stripe = await getUncachableStripeClient();
    try {
      return await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });
    } catch (error: any) {
      console.error('Stripe API error in listPaymentMethods:', error);
      if (error.type === 'StripeCardError') {
        // Card was declined
      } else if (error.type === 'StripeInvalidRequestError') {
        // Invalid parameters
      } else if (error.type === 'StripeAPIError') {
        // Stripe's API issue
      } else if (error.type === 'StripeConnectionError') {
        // Network issue
      }
      throw error; // Re-throw to be handled by route
    }
  }

  async createTipPaymentIntent(amount: number, customerId: string, jobId: string) {
    const stripe = await getUncachableStripeClient();
    const amountCents = Math.round(amount * 100);

    try {
      return await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'usd',
        customer: customerId,
        metadata: {
          jobId,
          type: 'tip',
        },
      });
    } catch (error: any) {
      console.error('Stripe API error in createTipPaymentIntent:', error);
      if (error.type === 'StripeCardError') {
        // Card was declined
      } else if (error.type === 'StripeInvalidRequestError') {
        // Invalid parameters
      } else if (error.type === 'StripeAPIError') {
        // Stripe's API issue
      } else if (error.type === 'StripeConnectionError') {
        // Network issue
      }
      throw error; // Re-throw to be handled by route
    }
  }

  async transferTipToPycker(
    paymentIntentId: string,
    haulerStripeAccountId: string,
    tipAmount: number,
    jobId: string
  ) {
    const stripe = await getUncachableStripeClient();
    const amountCents = Math.round(tipAmount * 100);

    let transfer;
    try {
      transfer = await stripe.transfers.create({
        amount: amountCents,
        currency: 'usd',
        destination: haulerStripeAccountId,
        metadata: {
          paymentIntentId,
          jobId,
          type: 'tip',
        },
      });
    } catch (error: any) {
      console.error('Stripe API error in transferTipToPycker (transfer):', error);
      if (error.type === 'StripeCardError') {
        // Card was declined
      } else if (error.type === 'StripeInvalidRequestError') {
        // Invalid parameters
      } else if (error.type === 'StripeAPIError') {
        // Stripe's API issue
      } else if (error.type === 'StripeConnectionError') {
        // Network issue
      }
      throw error; // Re-throw to be handled by route
    }

    // Attempt instant payout for tip as well
    let instantPayoutId = null;
    try {
      const payout = await stripe.payouts.create(
        {
          amount: amountCents,
          currency: 'usd',
          method: 'instant',
        },
        {
          stripeAccount: haulerStripeAccountId,
        }
      );
      instantPayoutId = payout.id;
    } catch (err: any) {
      console.log(`Instant payout for tip not available: ${err.message}`);
    }

    return { ...transfer, instantPayoutId };
  }

  // Create and immediately capture a payment for BNPL price adjustments
  async createAndCaptureAdjustment(
    amount: number,
    customerId: string,
    paymentMethodId: string,
    jobId: string
  ) {
    const stripe = await getUncachableStripeClient();
    const amountCents = Math.round(amount * 100);

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'usd',
        customer: customerId,
        payment_method: paymentMethodId,
        confirm: true,
        off_session: true,
        description: `BNPL price adjustment for job ${jobId}`,
        metadata: {
          jobId,
          type: 'bnpl_adjustment',
        },
      });

      return {
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
      };
    } catch (error: any) {
      console.error('Stripe API error in createAndCaptureAdjustment:', error);
      if (error.type === 'StripeCardError') {
        // Card was declined
      } else if (error.type === 'StripeInvalidRequestError') {
        // Invalid parameters
      } else if (error.type === 'StripeAPIError') {
        // Stripe's API issue
      } else if (error.type === 'StripeConnectionError') {
        // Network issue
      }
      throw error; // Re-throw to be handled by route
    }
  }

  // Get customer's default payment method
  async getDefaultPaymentMethod(stripeCustomerId: string): Promise<string | null> {
    const stripe = await getUncachableStripeClient();

    try {
      const customer = await stripe.customers.retrieve(stripeCustomerId);

      if ('deleted' in customer && customer.deleted) {
        return null;
      }

      const defaultSource = customer.invoice_settings?.default_payment_method;
      if (typeof defaultSource === 'string') {
        return defaultSource;
      } else if (defaultSource && 'id' in defaultSource) {
        return defaultSource.id;
      }
      return null;
    } catch (error: any) {
      console.error('Stripe API error in getDefaultPaymentMethod:', error);
      if (error.type === 'StripeCardError') {
        // Card was declined
      } else if (error.type === 'StripeInvalidRequestError') {
        // Invalid parameters
      } else if (error.type === 'StripeAPIError') {
        // Stripe's API issue
      } else if (error.type === 'StripeConnectionError') {
        // Network issue
      }
      throw error; // Re-throw to be handled by route
    }
  }

  // Detach a payment method from customer
  async detachPaymentMethod(paymentMethodId: string): Promise<void> {
    const stripe = await getUncachableStripeClient();
    try {
      await stripe.paymentMethods.detach(paymentMethodId);
    } catch (error: any) {
      console.error('Stripe API error in detachPaymentMethod:', error);
      if (error.type === 'StripeCardError') {
        // Card was declined
      } else if (error.type === 'StripeInvalidRequestError') {
        // Invalid parameters
      } else if (error.type === 'StripeAPIError') {
        // Stripe's API issue
      } else if (error.type === 'StripeConnectionError') {
        // Network issue
      }
      throw error; // Re-throw to be handled by route
    }
  }

  // Set default payment method for customer
  async setDefaultPaymentMethod(stripeCustomerId: string, paymentMethodId: string): Promise<void> {
    const stripe = await getUncachableStripeClient();
    try {
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    } catch (error: any) {
      console.error('Stripe API error in setDefaultPaymentMethod:', error);
      if (error.type === 'StripeCardError') {
        // Card was declined
      } else if (error.type === 'StripeInvalidRequestError') {
        // Invalid parameters
      } else if (error.type === 'StripeAPIError') {
        // Stripe's API issue
      } else if (error.type === 'StripeConnectionError') {
        // Network issue
      }
      throw error; // Re-throw to be handled by route
    }
  }
}

export const stripeService = new StripeService();
