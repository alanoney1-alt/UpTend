import type { Server } from "http";
import type { Express } from "express";
import { setupAuth, registerAuthRoutes } from "../replit_integrations/auth";
import { registerObjectStorageRoutes } from "../replit_integrations/object_storage";
import { auditMiddleware } from "../middleware/audit";
import { storage } from "../storage";

// Auth routes
import { registerProAuthRoutes, registerHaulerAuthRoutes } from "./auth/hauler.routes";
import { registerCustomerAuthRoutes } from "./auth/customer.routes";
import { registerAdminAuthRoutes } from "./auth/admin.routes";
import { registerBusinessAuthRoutes } from "./auth/business.routes";
import { registerGoogleAuthRoutes } from "./auth/google.routes";

// Pro routes (formerly Hauler routes)
import { registerProProfileRoutes, registerHaulerProfileRoutes } from "./hauler/profile.routes";
import { registerProStatusRoutes, registerHaulerStatusRoutes } from "./hauler/status.routes";
import { registerProAcademyRoutes, registerAcademyRoutes } from "./hauler/academy.routes";

// Customer routes
import { registerCustomerAccountRoutes } from "./customer/account.routes";
import { registerCustomerReferralRoutes } from "./customer/referrals.routes";
import { registerCustomerImpactRoutes } from "./customer/impact.routes";
import { registerDashboardWidgetRoutes } from "./customer/dashboard-widgets.routes";
import { registerLoyaltyRoutes } from "./customer/loyalty.routes";

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

// Subscription Plans (multi-service recurring)
import { registerSubscriptionPlansRoutes } from "./subscriptions-plans.routes";

// Same-Day Service
import { registerSameDayRoutes } from "./same-day.routes";

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
import { registerAiCapabilityRoutes } from "./ai/index";

// Review routes
import { registerReviewRoutes } from "./reviews/reviews.routes";

// Guarantee routes
import { registerGuaranteeRoutes } from "./guarantee.routes";

// Contract routes
import { registerContractRoutes } from "./contracts.routes";

// Contact routes
import { registerContactRoutes } from "./contact.routes";

// Google API routes
import { registerGoogleApiRoutes } from "./google-api.routes";

// Property routes
import { registerPropertyValuationRoutes } from "./property/valuation.routes";

// Property Intelligence routes
import { registerPropertyIntelligenceRoutes } from "./properties/index";

// Emergency routes
import { registerEmergencyRoutes } from "./emergency.routes";

// Neighborhood routes
import { registerNeighborhoodRoutes } from "./neighborhoods.routes";

// Insurance routes
import { registerInsuranceRoutes } from "./insurance.routes";

// Voice AI routes
import { registerVoiceRoutes } from "./voice.routes";

// Partner Portal routes
import { registerPartnerRoutes } from "./partners.routes";

// Home CRM routes
import { registerHomeProfileRoutes } from "./home-profile.routes";

// Scope Change / Guaranteed Price Ceiling routes
import { registerScopeChangeRoutes } from "./scope-change.routes";

// Pro map routes
import { registerActiveNearbyRoutes } from "./hauler/active-nearby.routes";
import { registerAdminProMapRoutes } from "./admin/pro-map.routes";

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
  await registerProAuthRoutes(app);
  await registerCustomerAuthRoutes(app);
  await registerAdminAuthRoutes(app);
  await registerBusinessAuthRoutes(app);
  await registerGoogleAuthRoutes(app);

  // Register Pro routes
  registerProProfileRoutes(app);
  registerProStatusRoutes(app);
  registerProAcademyRoutes(app);

  // Register customer routes
  registerCustomerAccountRoutes(app);
  registerCustomerReferralRoutes(app);
  registerCustomerImpactRoutes(app);
  registerDashboardWidgetRoutes(app);
  registerLoyaltyRoutes(app);

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

  // Register Subscription Plans (multi-service recurring)
  registerSubscriptionPlansRoutes(app);

  // Register Same-Day Service routes
  registerSameDayRoutes(app);

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
  registerAiCapabilityRoutes(app); // New AI capabilities

  // Register Review routes
  registerReviewRoutes(app);

  // Register Guarantee routes
  registerGuaranteeRoutes(app);

  // Register Contract routes
  registerContractRoutes(app);

  // Register Contact routes
  registerContactRoutes(app);

  // Register Google API routes
  registerGoogleApiRoutes(app);

  // Register Property valuation routes
  registerPropertyValuationRoutes(app);

  // Register Property Intelligence routes
  registerPropertyIntelligenceRoutes(app);

  // Register Emergency routes
  registerEmergencyRoutes(app);

  // Register Neighborhood routes
  registerNeighborhoodRoutes(app);

  // Register Insurance routes
  registerInsuranceRoutes(app);

  // Register Voice AI routes
  registerVoiceRoutes(app);

  // Register Partner Portal routes
  registerPartnerRoutes(app);

  // Register Home CRM routes
  registerHomeProfileRoutes(app);

  // Register Scope Change / Guaranteed Price Ceiling routes
  registerScopeChangeRoutes(app);

  // Pro map routes (public + admin)
  registerActiveNearbyRoutes(app);
  registerAdminProMapRoutes(app);

  // Register WebSocket handlers
  return registerWebSocketHandlers(httpServer, app);
}
