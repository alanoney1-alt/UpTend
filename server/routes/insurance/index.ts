import type { Express } from "express";
import { registerInsurancePolicyRoutes } from "./policies.routes";
import { registerClaimsRoutes } from "./claims.routes";

export function registerInsuranceRoutes(app: Express) {
  registerInsurancePolicyRoutes(app);
  registerClaimsRoutes(app);
}