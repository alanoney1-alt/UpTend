/**
 * Business Routes Registration
 * Registers all business-related endpoints including team management
 */

import type { Express } from "express";
import { requireAuth } from "../../middleware/auth";
import teamManagementRoutes from "./team-management.routes";

export function registerBusinessTeamRoutes(app: Express) {
  // Team management routes
  app.use("/api/business", requireAuth, teamManagementRoutes);
}
