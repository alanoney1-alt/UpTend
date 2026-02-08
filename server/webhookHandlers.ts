import { getUncachableStripeClient } from './stripeClient';
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
      // In development, we can proceed without verification
      // In production, this should throw an error
      return;
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    // Handle different event types
    console.log(`Received Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`PaymentIntent ${paymentIntent.id} succeeded`);
        // TODO: Update order status, send confirmation email, etc.
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log(`PaymentIntent ${failedPayment.id} failed`);
        // TODO: Handle failed payment
        break;

      case 'customer.created':
        const customer = event.data.object as Stripe.Customer;
        console.log(`Customer ${customer.id} created`);
        break;

      case 'charge.succeeded':
        const charge = event.data.object as Stripe.Charge;
        console.log(`Charge ${charge.id} succeeded`);
        break;

      case 'account.updated':
        const account = event.data.object as Stripe.Account;
        console.log(`Account ${account.id} updated`);
        break;

      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }
  }
}
