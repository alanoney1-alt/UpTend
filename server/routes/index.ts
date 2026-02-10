import type { Server } from "http";
import type { Express } from "express";
import { setupAuth, registerAuthRoutes } from "../replit_integrations/auth";
import { registerObjectStorageRoutes } from "../replit_integrations/object_storage";
import { auditMiddleware } from "../middleware/audit";
import { storage } from "../storage";

// Auth routes
import { registerHaulerAuthRoutes } from "./auth/hauler.routes";
import { registerCustomerAuthRoutes } from "./auth/customer.routes";
import { registerAdminAuthRoutes } from "./auth/admin.routes";
import { registerBusinessAuthRoutes } from "./auth/business.routes";

// Hauler routes
import { registerHaulerProfileRoutes } from "./hauler/profile.routes";
import { registerHaulerStatusRoutes } from "./hauler/status.routes";
import { registerAcademyRoutes } from "./hauler/academy.routes";

// Customer routes
import { registerCustomerAccountRoutes } from "./customer/account.routes";
import { registerCustomerReferralRoutes } from "./customer/referrals.routes";
import { registerCustomerImpactRoutes } from "./customer/impact.routes";

// Job routes
import { registerServiceRequestRoutes } from "./jobs/service-requests.routes";
import { registerJobManagementRoutes } from "./jobs/job-management.routes";
import { registerJobVerificationRoutes } from "./jobs/verification.routes";
import { registerPriceVerificationRoutes } from "./jobs/price-verification.routes";

// PolishUp routes
import { registerSubscriptionRoutes } from "./subscriptions.routes";
import { registerCleaningChecklistRoutes } from "./cleaning-checklists.routes";
import { registerSubscriptionCronRoutes } from "./admin/subscription-cron.routes";
import { registerCarbonTrackingRoutes } from "./admin/carbon-tracking.routes";

// Commerce routes
import { registerPricingRoutes } from "./commerce/pricing-quotes.routes";
import { registerPaymentRoutes } from "./commerce/payments.routes";

// Marketplace routes
import { registerFacilitiesRebatesRoutes } from "./marketplace/facilities-rebates.routes";
import { registerAnalyticsPromotionsRoutes } from "./marketplace/analytics-promotions.routes";
import { registerMarketplaceRoutes } from "./marketplace/marketplace.routes";

// HOA routes
import { registerHoaViolationRoutes } from "./hoa/violations.routes";
import { registerHoaPropertyRoutes } from "./hoa/properties.routes";
import { registerHoaEsgMetricsRoutes } from "./hoa/esg-metrics.routes";
import { registerHoaReferralPaymentRoutes } from "./hoa/referral-payments.routes";
import { registerHoaCommunicationRoutes } from "./hoa/communications.routes";

// ESG routes
import { registerEsgRoutes } from "./esg/index";

// Business routes
import { registerBusinessTeamRoutes } from "./business/index";

// Referral routes
import { registerReferralRoutes } from "./referrals/referral.routes";

// AI routes
import { registerAiAnalysisRoutes } from "./ai/analysis.routes";
import { registerAgenticRoutes } from "./ai/agentic.routes";
import { registerChatbotRoutes } from "./ai/chatbot.routes";
import { registerSmsBotRoutes } from "./ai/sms-bot.routes";

// Google API routes
import { registerGoogleApiRoutes } from "./google-api.routes";

// Property routes
import { registerPropertyValuationRoutes } from "./property/valuation.routes";

// Property Intelligence routes
import { registerPropertyIntelligenceRoutes } from "./properties/index";

// WebSocket handlers
import { registerWebSocketHandlers } from "./websocket/handlers";

/**
 * Main routes registration function
 * Sets up authentication, middleware, and all feature routes
 */
export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication BEFORE registering routes
  await setupAuth(app);
  registerAuthRoutes(app);

  // Register object storage routes
  registerObjectStorageRoutes(app);

  // Register audit middleware
  app.use(auditMiddleware);

  // Seed initial data
  await storage.seedOrlando25PromoCode();

  // Register authentication routes
  await registerHaulerAuthRoutes(app);
  await registerCustomerAuthRoutes(app);
  await registerAdminAuthRoutes(app);
  await registerBusinessAuthRoutes(app);

  // Register hauler routes
  registerHaulerProfileRoutes(app);
  registerHaulerStatusRoutes(app);
  registerAcademyRoutes(app);

  // Register customer routes
  registerCustomerAccountRoutes(app);
  registerCustomerReferralRoutes(app);
  registerCustomerImpactRoutes(app);

  // Register job routes
  registerServiceRequestRoutes(app);
  registerJobManagementRoutes(app);
  registerJobVerificationRoutes(app);
  registerPriceVerificationRoutes(app);

  // Register PolishUp routes
  registerSubscriptionRoutes(app);
  registerCleaningChecklistRoutes(app);
  registerSubscriptionCronRoutes(app);
  registerCarbonTrackingRoutes(app);

  // Register commerce routes
  registerPricingRoutes(app);
  registerPaymentRoutes(app);

  // Register marketplace routes
  registerFacilitiesRebatesRoutes(app);
  registerAnalyticsPromotionsRoutes(app);
  registerMarketplaceRoutes(app);

  // Register HOA routes
  registerHoaViolationRoutes(app);
  registerHoaPropertyRoutes(app);
  registerHoaEsgMetricsRoutes(app);
  registerHoaReferralPaymentRoutes(app);
  registerHoaCommunicationRoutes(app);

  // Register ESG routes
  registerEsgRoutes(app);

  // Register Business team routes
  registerBusinessTeamRoutes(app);

  // Register referral routes
  registerReferralRoutes(app);

  // Register AI routes
  registerAiAnalysisRoutes(app);
  registerAgenticRoutes(app);
  registerChatbotRoutes(app);
  registerSmsBotRoutes(app);

  // Register Google API routes
  registerGoogleApiRoutes(app);

  // Register Property valuation routes
  registerPropertyValuationRoutes(app);

  // Register Property Intelligence routes
  registerPropertyIntelligenceRoutes(app);

  // Register WebSocket handlers
  return registerWebSocketHandlers(httpServer, app);
}
