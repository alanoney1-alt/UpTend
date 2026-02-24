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
import { registerUnifiedAuthRoutes } from "./auth/unified.routes";

// Pro routes (formerly Hauler routes)
import { registerProProfileRoutes, registerHaulerProfileRoutes } from "./hauler/profile.routes";
import { registerProStatusRoutes, registerHaulerStatusRoutes } from "./hauler/status.routes";
import { registerProAcademyRoutes, registerAcademyRoutes } from "./hauler/academy.routes";
import { registerAcademyCertificationRoutes, seedCertificationPrograms } from "./academy/index";
import { registerCertificationGatingRoutes } from "./hauler/certification-gating.routes";
import { registerFeeStatusRoutes } from "./hauler/fee-status.routes";
import { registerPayoutRoutes } from "./hauler/payouts.routes";
import { registerProDashboardRoutes } from "./hauler/dashboard.routes";
import { registerEarningsGoalRoutes } from "./hauler/earnings-goal.routes";

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
import { registerNoShowRoutes } from "./jobs/no-show.routes";

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
import { registerHoaScraperRoutes } from "./hoa/scraper.routes";

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

// Insurance routes (existing partnerships)
import { registerInsuranceRoutes as registerInsurancePartnerRoutes } from "./insurance.routes";
// Liability cap insurance routes (new system)
import { registerInsuranceRoutes as registerLiabilityInsuranceRoutes } from "./insurance/index";

// Launch notifications
import { registerLaunchNotificationRoutes } from "./launch-notifications.routes";

// Partner Portal routes
import { registerPartnerRoutes } from "./partners.routes";

// Home CRM routes
import { registerHomeProfileRoutes } from "./home-profile.routes";

// Scope Change / Guaranteed Price Ceiling routes
import { registerScopeChangeRoutes } from "./scope-change.routes";
import { registerPartsRequestRoutes } from "./parts-requests.routes";

// Pro map routes
import { registerActiveNearbyRoutes } from "./hauler/active-nearby.routes";
import { registerAdminProMapRoutes } from "./admin/pro-map.routes";
import { registerAdminManagementRoutes } from "./admin/admin-management.routes";
import { registerAdminBillingRoutes } from "./admin/billing.routes";

// B2B routes
import { registerComplianceRoutes } from "./compliance/index";
import { registerGovernmentRoutes } from "./government/index";
import { registerCommunityRoutes } from "./communities/index";
import { registerPmRoutes } from "./pm/index";
import { registerConstructionRoutes } from "./construction/index";
import { registerVeteranRoutes } from "./veterans/index";
import { registerEnterpriseRoutes } from "./enterprise/index";

// Fleet tracking routes
import { registerFleetRoutes } from "./fleet/index";

// PM Software Integration routes
import { registerIntegrationRoutes } from "./integrations/index";

// B2B Pricing routes
import { registerB2bPricingRoutes } from "./b2b-pricing/index";

// White-label routes
import { registerWhiteLabelRoutes, whiteLabelMiddleware } from "./white-label/index";
import { registerUploadRoutes } from "./upload.routes";

// Stripe Dispute / Chargeback Protection routes
import { registerStripeDisputeRoutes } from "./stripe-disputes";

// Accounting / Ledger routes
import { registerAccountingRoutes } from "./accounting/index";

// Public routes
import { registerPublicRoutes } from "./public.routes";

// George cron routes
import { registerGeorgeCronRoutes } from "./george-cron.routes";

// George Daily Engagement routes (Phase 3)
import { registerGeorgeDailyRoutes } from "./george-daily.routes";

// Consent + Re-engagement routes
import { registerConsentRoutes } from "./consent.routes";

// Self-Serve Home DNA Scan routes
import { registerHomeScanRoutes } from "./home-scan.routes";
import roomScannerRoutes from "./ai/room-scanner.routes";
import { registerHomeReportRoutes } from "./home-report.routes";
import { registerVoiceRoutes } from "./voice.routes";
import { registerPushRoutes } from "./push.routes";

// Drone Scan routes
import { registerDroneScanRoutes } from "./drone-scan.routes";

// Smart Home OAuth routes
import { registerSmartHomeRoutes } from "./smart-home.routes";

// Insurance Claims + Emergency Dispatch + Briefing routes
import { registerInsuranceClaimsRoutes } from "./insurance-claims.routes";
import { registerEmergencyDispatchRoutes } from "./emergency-dispatch.routes";
import { registerBriefingRoutes } from "./briefing.routes";

// Home Utilities & Municipal Data routes
import { registerHomeUtilitiesRoutes } from "./home-utilities.routes";

// Centralized Pricing Engine routes
import { registerCentralizedPricingRoutes } from "./pricing.routes";

// DIY Tips + B2B Contracts + Post-Booking Intelligence + Neighborhood Insights
import { registerDiyB2bPostBookingRoutes } from "./diy-b2b-postbooking.routes";
import { registerDiyCoachRoutes } from "./diy-coach.routes";

// Pro Intelligence routes (demand forecast, retention, goals, route optimization)
import { registerProIntelligenceRoutes } from "./pro-intelligence.routes";

// Loyalty Engine + Referral Engine + Community Engine routes
import { registerLoyaltyEngineRoutes } from "./loyalty.routes";
import { registerReferralEngineRoutes } from "./referrals.routes";
import { registerCommunityEngineRoutes } from "./community.routes";

// Purchase & Receipt Tracking + Appliance Profile routes
import { registerPurchaseRoutes } from "./purchases.routes";

// Shopping Assistant + Tutorial routes
import { registerShoppingRoutes } from "./shopping.routes";

// Pro Field Assistant routes
import { registerProFieldAssistRoutes } from "./pro-field-assist.routes";

// DIY-to-Pro Recruitment Pipeline routes
import { registerDiyToProRoutes } from "./diy-to-pro.routes";

// Auto Services routes (vehicle profiles, maintenance, diagnosis, parts, OBD)
import { registerAutoRoutes } from "./auto.routes.js";
import { registerContentRoutes } from "./content.routes.js";

// Invite Code routes
import { registerInviteCodeRoutes } from "./invite-codes/invite-codes.routes";
import { registerAppDataRoutes } from "./app-data.routes";

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
  await storage.seedInitialData();
  await seedCertificationPrograms();

  // Register authentication routes
  await registerProAuthRoutes(app);
  await registerCustomerAuthRoutes(app);
  await registerAdminAuthRoutes(app);
  await registerBusinessAuthRoutes(app);
  await registerGoogleAuthRoutes(app);
  registerUnifiedAuthRoutes(app);

  // Register Pro routes
  registerProProfileRoutes(app);
  registerProStatusRoutes(app);
  registerProAcademyRoutes(app);
  registerAcademyCertificationRoutes(app);
  registerCertificationGatingRoutes(app);
  registerFeeStatusRoutes(app);
  registerPayoutRoutes(app);
  registerProDashboardRoutes(app);
  registerEarningsGoalRoutes(app);

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
  registerNoShowRoutes(app);

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
  registerHoaScraperRoutes(app);

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

  // Register Insurance routes (partnerships)
  registerInsurancePartnerRoutes(app);
  // Register Liability Cap Insurance routes (new system)
  registerLiabilityInsuranceRoutes(app);
  registerLaunchNotificationRoutes(app);

  // Register Partner Portal routes
  registerPartnerRoutes(app);

  // Register Home CRM routes
  registerHomeProfileRoutes(app);

  // Register Scope Change / Guaranteed Price Ceiling routes
  registerScopeChangeRoutes(app);

  // Register Parts & Materials request routes
  registerPartsRequestRoutes(app);

  // Pro map routes (public + admin)
  registerActiveNearbyRoutes(app);
  registerAppDataRoutes(app);
  registerAdminProMapRoutes(app);

  // Admin management routes (pyckers, users, surge, active jobs)
  registerAdminManagementRoutes(app);
  registerAdminBillingRoutes(app);

  // B2B routes
  registerComplianceRoutes(app);
  registerGovernmentRoutes(app);
  registerCommunityRoutes(app);
  registerPmRoutes(app);
  registerConstructionRoutes(app);
  registerVeteranRoutes(app);
  registerEnterpriseRoutes(app);

  // Register Fleet tracking routes
  registerFleetRoutes(app);

  // Register PM Software Integration routes
  registerIntegrationRoutes(app);

  // Register B2B Pricing routes
  registerB2bPricingRoutes(app);

  // Register Stripe Dispute / Chargeback Protection routes
  registerStripeDisputeRoutes(app);

  // Register White-label middleware and routes
  app.use(whiteLabelMiddleware());
  registerWhiteLabelRoutes(app);
  registerUploadRoutes(app);

  // Register Accounting / Ledger routes
  registerAccountingRoutes(app);

  // Register Public routes (no auth required)
  registerPublicRoutes(app);

  // Register George cron routes
  registerGeorgeCronRoutes(app);

  // Register George Daily Engagement routes (Phase 3)
  registerGeorgeDailyRoutes(app);

  // Register Consent + Re-engagement routes
  registerConsentRoutes(app);

  // Register Self-Serve Home DNA Scan + Wallet routes
  registerHomeScanRoutes(app);

  // Room video scanner (My Digital Home inventory)
  app.use("/api/ai", roomScannerRoutes);
  registerHomeReportRoutes(app);
  registerVoiceRoutes(app);
  registerPushRoutes(app);

  // Register Drone Scan routes
  registerDroneScanRoutes(app);

  // Register Smart Home OAuth routes
  registerSmartHomeRoutes(app);

  // Register Insurance Claims + Emergency Dispatch + Briefing routes
  registerInsuranceClaimsRoutes(app);
  registerEmergencyDispatchRoutes(app);
  registerBriefingRoutes(app);

  // Register Home Utilities & Municipal Data routes
  registerHomeUtilitiesRoutes(app);

  // Register Centralized Pricing Engine routes
  registerCentralizedPricingRoutes(app);

  // Register DIY Tips + B2B Contracts + Post-Booking + Neighborhood routes
  registerDiyB2bPostBookingRoutes(app);
  registerDiyCoachRoutes(app);

  // Register Pro Intelligence routes
  registerProIntelligenceRoutes(app);

  // Register Loyalty Engine + Referral Engine + Community Engine routes
  registerLoyaltyEngineRoutes(app);
  registerReferralEngineRoutes(app);
  registerCommunityEngineRoutes(app);

  // Register Purchase & Receipt Tracking + Appliance Profile routes
  registerPurchaseRoutes(app);

  // Register Shopping Assistant + Tutorial routes
  registerShoppingRoutes(app);

  // Register Auto Services routes
  registerAutoRoutes(app);
  registerContentRoutes(app);

  // Register Pro Field Assistant routes
  registerProFieldAssistRoutes(app);

  // Register DIY-to-Pro Recruitment Pipeline routes
  registerDiyToProRoutes(app);

  // Register Invite Code routes
  registerInviteCodeRoutes(app);

  // Register WebSocket handlers
  return registerWebSocketHandlers(httpServer, app);
}
