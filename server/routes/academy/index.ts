import type { Express } from "express";
import { registerCertificationRoutes } from "./certifications.routes";
import { registerAcademyAdminRoutes } from "./admin.routes";
import { registerEarningsPotentialRoutes } from "./earnings-potential.routes";
import { seedCertificationPrograms } from "./seed";

export function registerAcademyCertificationRoutes(app: Express) {
  registerCertificationRoutes(app);
  registerAcademyAdminRoutes(app);
  registerEarningsPotentialRoutes(app);
}

export { seedCertificationPrograms };
