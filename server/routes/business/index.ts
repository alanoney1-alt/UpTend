/**
 * Business Routes Registration
 * Registers all business-related endpoints including team management
 */

import type { Express } from "express";
import { requireAuth } from "../../middleware/auth";
import teamManagementRoutes from "./team-management.routes";
import businessAccountRoutes from "./accounts.routes";
import recurringJobRoutes from "./recurring-jobs.routes";

export function registerBusinessTeamRoutes(app: Express) {
  // Team management routes
  app.use("/api/business", requireAuth, teamManagementRoutes);

  // Business account routes (dashboard)
  app.use("/api/business-accounts", businessAccountRoutes);

  // Recurring job routes (dashboard)
  app.use("/api/recurring-jobs", recurringJobRoutes);
}
