import Stripe from 'stripe';

let connectionSettings: any;

/**
 * Detect if we're running in Replit environment
 */
function isReplitEnvironment(): boolean {
  return !!(process.env.REPLIT_CONNECTORS_HOSTNAME &&
           (process.env.REPL_IDENTITY || process.env.WEB_REPL_RENEWAL));
}

/**
 * Get Stripe credentials from environment
 * Works for both Replit Connectors and direct API keys
 */
async function getCredentials() {
  // Local development: Use direct API keys from .env
  if (!isReplitEnvironment()) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

    if (!secretKey || !publishableKey) {
      throw new Error('STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY must be set in .env for local development');
    }

    console.log('Using direct Stripe API keys from .env (local development mode)');

    return {
      publishableKey,
      secretKey,
    };
  }

  // Replit environment: Use Replit Connectors
  console.log('Using Replit Connectors for Stripe (Replit environment)');

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? 'depl ' + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  const connectorName = 'stripe';
  const targetEnvironment = 'development';

  const url = new URL(`https://${hostname}/api/v2/connection`);
  url.searchParams.set('include_secrets', 'true');
  url.searchParams.set('connector_names', connectorName);
  url.searchParams.set('environment', targetEnvironment);

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'X_REPLIT_TOKEN': xReplitToken
    }
  });

  const data = await response.json();

  connectionSettings = data.items?.[0];

  if (!connectionSettings || (!connectionSettings.settings.publishable || !connectionSettings.settings.secret)) {
    throw new Error(`Stripe ${targetEnvironment} connection not found`);
  }

  return {
    publishableKey: connectionSettings.settings.publishable,
    secretKey: connectionSettings.settings.secret,
  };
}

export async function getUncachableStripeClient() {
  const { secretKey } = await getCredentials();

  return new Stripe(secretKey, {
    apiVersion: '2026-01-28.clover',
  });
}

export async function getStripePublishableKey() {
  const { publishableKey } = await getCredentials();
  return publishableKey;
}

export async function getStripeSecretKey() {
  const { secretKey } = await getCredentials();
  return secretKey;
}

// stripe-replit-sync removed - using direct Stripe API only
