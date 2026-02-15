import type { Express, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../../auth-middleware";
import { db } from "../../db";
import {
  certificationPrograms,
  certificationModules,
  certificationQuestions,
  proCertifications,
} from "@shared/schema";
import { eq } from "drizzle-orm";

export function registerAcademyAdminRoutes(app: Express) {
  // Create certification program
  app.post("/api/admin/academy/certifications", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const [program] = await db
        .insert(certificationPrograms)
        .values(req.body)
        .returning();
      res.json(program);
    } catch (error) {
      console.error("[Academy Admin] Create cert failed:", error);
      res.status(500).json({ error: "Failed to create certification" });
    }
  });

  // Update certification program
  app.put("/api/admin/academy/certifications/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const [program] = await db
        .update(certificationPrograms)
        .set({ ...req.body, updatedAt: new Date().toISOString() })
        .where(eq(certificationPrograms.id, req.params.id))
        .returning();
      res.json(program);
    } catch (error) {
      console.error("[Academy Admin] Update cert failed:", error);
      res.status(500).json({ error: "Failed to update certification" });
    }
  });

  // Add module
  app.post("/api/admin/academy/certifications/:id/modules", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const [mod] = await db
        .insert(certificationModules)
        .values({ ...req.body, certificationId: req.params.id })
        .returning();
      res.json(mod);
    } catch (error) {
      console.error("[Academy Admin] Add module failed:", error);
      res.status(500).json({ error: "Failed to add module" });
    }
  });

  // Add question
  app.post("/api/admin/academy/certifications/:id/questions", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const [question] = await db
        .insert(certificationQuestions)
        .values({ ...req.body, certificationId: req.params.id })
        .returning();
      res.json(question);
    } catch (error) {
      console.error("[Academy Admin] Add question failed:", error);
      res.status(500).json({ error: "Failed to add question" });
    }
  });

  // Revoke certification
  app.put("/api/admin/academy/revoke/:proCertId", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const [cert] = await db
        .update(proCertifications)
        .set({ status: "revoked" })
        .where(eq(proCertifications.id, req.params.proCertId))
        .returning();
      res.json(cert);
    } catch (error) {
      console.error("[Academy Admin] Revoke failed:", error);
      res.status(500).json({ error: "Failed to revoke certification" });
    }
  });
}
