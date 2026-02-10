import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { WebhookHandlers } from './webhookHandlers';
import { startMatchingTimer } from './services/matching-timer';
import { startLocationCleanupService } from './services/location-cleanup';
import { startEsgAuditor } from './services/esg-auditor';
import './services/property-cron-jobs'; // Auto-starts Property Intelligence background jobs
import { getUncachableStripeClient } from './stripeClient';

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

async function initStripe() {
  try {
    // Test Stripe connection with direct API key
    const stripe = await getUncachableStripeClient();

    // Verify Stripe credentials by fetching account info
    const account = await stripe.accounts.retrieve();
    console.log(`✅ Stripe initialized successfully (Account: ${account.id})`);

    if (account.charges_enabled) {
      console.log('✅ Stripe charges enabled');
    } else {
      console.warn('⚠️  Stripe charges NOT enabled - complete account setup');
    }

  } catch (error: any) {
    console.error('❌ Failed to initialize Stripe:', error.message);
    console.error('Check your STRIPE_SECRET_KEY in .env');
  }
}

app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;
      if (!Buffer.isBuffer(req.body)) {
        console.error('STRIPE WEBHOOK ERROR: req.body is not a Buffer');
        return res.status(500).json({ error: 'Webhook processing error' });
      }

      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

app.use(
  express.json({
    limit: "50mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

// Global error handlers for unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to log this to a monitoring service
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // In production, you might want to log this and gracefully shut down
  process.exit(1);
});

function validateEnvironment() {
  const required = ['DATABASE_URL', 'SESSION_SECRET'];
  const missing = required.filter(v => !process.env[v]);

  if (missing.length > 0) {
    console.error('FATAL: Missing required environment variables:', missing);
    process.exit(1);
  }

  // Check critical variables (warn if missing)
  const hasReplitConnectors = !!process.env.REPLIT_CONNECTORS_HOSTNAME;
  const hasStripeKeys = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY);

  if (!hasReplitConnectors && !hasStripeKeys) {
    console.warn('WARNING: Missing REPLIT_CONNECTORS_HOSTNAME or both STRIPE keys (STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY)');
  }

  if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
    console.warn('WARNING: Missing AI_INTEGRATIONS_OPENAI_API_KEY - AI features may not work');
  }

  if (!process.env.REPL_ID) {
    console.warn('WARNING: Missing REPL_ID - some features may not work correctly');
  }

  // Check optional variables (info message if missing)
  const optional = [
    'SENDGRID_API_KEY',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_PHONE_NUMBER',
    'FROM_EMAIL'
  ];

  const missingOptional = optional.filter(v => !process.env[v]);

  if (missingOptional.length > 0) {
    console.info('INFO: Optional environment variables not set:', missingOptional.join(', '));
  }

  console.log('Environment validation complete');
}

(async () => {
  try {
    validateEnvironment();
    await initStripe();
    await registerRoutes(httpServer, app);

    // Start the 60-second matching timer background service
    startMatchingTimer();

    // Start hourly cleanup of expired PYCKER location data (privacy compliance)
    startLocationCleanupService();

    // Start nightly ESG Auditor for platform sustainability dashboard
    startEsgAuditor();

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || "5000", 10);

    // reusePort is only supported on Linux (Replit), not macOS
    const listenOptions: any = {
      port,
      host: "0.0.0.0",
    };

    // Only use reusePort in Replit environment (Linux)
    if (process.platform === 'linux' && process.env.REPL_ID) {
      listenOptions.reusePort = true;
    }

    httpServer.listen(listenOptions, () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
})();
