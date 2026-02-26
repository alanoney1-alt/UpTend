/**
 * Business Routes Registration
 * Registers all business-related endpoints including team management
 */

import type { Express } from "express";
import { requireAuth } from "../../middleware/auth";
import teamManagementRoutes from "./team-management.routes";
import businessAccountRoutes from "./accounts.routes";
import recurringJobRoutes from "./recurring-jobs.routes";
import onboardingRoutes from "./onboarding.routes";
import bookingRoutes from "./booking.routes";
import billingRoutes from "./billing.routes";
import dashboardRoutes from "./dashboard.routes";
import communityFeaturesRoutes from "./community-features.routes";
import hoaPricingRoutes from "./hoa-pricing.routes";

export function registerBusinessTeamRoutes(app: Express) {
  // Onboarding routes (no auth required for self-serve signup)
  app.use("/api/business", onboardingRoutes);

  // Team management routes
  app.use("/api/business", requireAuth, teamManagementRoutes);

  // Business booking routes
  app.use("/api/business", bookingRoutes);

  // Business billing routes
  app.use("/api/business", billingRoutes);

  // Business dashboard routes
  app.use("/api/business", dashboardRoutes);

  // HOA community features routes
  app.use("/api/business", communityFeaturesRoutes);

  // HOA pricing schedule routes
  app.use("/api/business", hoaPricingRoutes);

  // Business account routes (dashboard)
  app.use("/api/business-accounts", businessAccountRoutes);

  // Recurring job routes (dashboard)
  app.use("/api/recurring-jobs", recurringJobRoutes);
}
