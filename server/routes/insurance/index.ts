import type { Express } from "express";
import { registerInsurancePolicyRoutes } from "./policies.routes.js";
import { registerClaimsRoutes } from "./claims.routes.js";

export function registerInsuranceRoutes(app: Express) {
  registerInsurancePolicyRoutes(app);
  registerClaimsRoutes(app);
}