import type { Express, Request, Response } from "express";
import { z } from "zod";
import { requireAuth, requireHauler } from "../../auth-middleware";
import { db } from "../../db";
import {
  certificationPrograms,
  certificationModules,
  certificationQuestions,
  proCertifications,
} from "@shared/schema";
import { checkFeeReduction } from "../../services/fee-calculator";
import { sql as feeSql } from "drizzle-orm";
import { eq, and, asc } from "drizzle-orm";
import crypto from "crypto";

function generateCertificateNumber(): string {
  const prefix = "UT-CERT";
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${random}`;
}

export function registerCertificationRoutes(app: Express) {
  // POST /api/certification/programs — list certification programs (filterable)
  app.post("/api/certification/programs", async (req: Request, res: Response) => {
    try {
      const programs = await db
        .select()
        .from(certificationPrograms)
        .where(eq(certificationPrograms.isActive, true))
        .orderBy(asc(certificationPrograms.createdAt));
      res.json({ programs });
    } catch (error) {
      console.error("[Academy] Failed to list certification programs:", error);
      res.status(500).json({ error: "Failed to retrieve programs" });
    }
  });

  // List all available certifications (with pro's status if authenticated)
  app.get("/api/academy/certifications", async (req: Request, res: Response) => {
    try {
      const programs = await db
        .select()
        .from(certificationPrograms)
        .where(eq(certificationPrograms.isActive, true))
        .orderBy(asc(certificationPrograms.createdAt));

      let proStatuses: any[] = [];
      if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        const proId = ((req.user as any).userId || (req.user as any).id);
        proStatuses = await db
          .select()
          .from(proCertifications)
          .where(eq(proCertifications.proId, proId));
      }

      // Get prerequisite info
      const allPrograms = await db.select().from(certificationPrograms);
      const programMap = new Map(allPrograms.map(p => [p.id, p]));

      const result = programs.map(prog => {
        const status = proStatuses.find(s => s.certificationId === prog.id);
        const prereq = prog.prerequisiteCertId ? programMap.get(prog.prerequisiteCertId) : null;
        const prereqStatus = prog.prerequisiteCertId
          ? proStatuses.find(s => s.certificationId === prog.prerequisiteCertId)
          : null;

        return {
          ...prog,
          proStatus: status
            ? {
                status: status.status,
                score: status.score,
                modulesCompleted: status.modulesCompleted,
                completedAt: status.completedAt,
                expiresAt: status.expiresAt,
                certificateNumber: status.certificateNumber,
                quizAttempts: status.quizAttempts,
              }
            : null,
          prerequisite: prereq ? { id: prereq.id, name: prereq.name, slug: prereq.slug } : null,
          prerequisiteMet: !prog.prerequisiteCertId || (prereqStatus?.status === "completed"),
        };
      });

      res.json(result);
    } catch (error) {
      console.error("[Academy] Failed to list certifications:", error);
      res.status(500).json({ error: "Failed to retrieve certifications" });
    }
  });

  // Certification detail with modules list
  app.get("/api/academy/certifications/:slug", async (req: Request, res: Response) => {
    try {
      const [program] = await db
        .select()
        .from(certificationPrograms)
        .where(eq(certificationPrograms.slug, req.params.slug));

      if (!program) return res.status(404).json({ error: "Certification not found" });

      const modules = await db
        .select({
          id: certificationModules.id,
          moduleNumber: certificationModules.moduleNumber,
          title: certificationModules.title,
          estimatedMinutes: certificationModules.estimatedMinutes,
          videoUrl: certificationModules.videoUrl,
        })
        .from(certificationModules)
        .where(eq(certificationModules.certificationId, program.id))
        .orderBy(asc(certificationModules.moduleNumber));

      let proStatus = null;
      if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        const proId = ((req.user as any).userId || (req.user as any).id);
        const [status] = await db
          .select()
          .from(proCertifications)
          .where(
            and(
              eq(proCertifications.proId, proId),
              eq(proCertifications.certificationId, program.id)
            )
          );
        proStatus = status || null;
      }

      // Get prerequisite
      let prerequisite = null;
      if (program.prerequisiteCertId) {
        const [prereq] = await db
          .select()
          .from(certificationPrograms)
          .where(eq(certificationPrograms.id, program.prerequisiteCertId));
        prerequisite = prereq ? { id: prereq.id, name: prereq.name, slug: prereq.slug } : null;
      }

      const questionCount = await db
        .select({ id: certificationQuestions.id })
        .from(certificationQuestions)
        .where(eq(certificationQuestions.certificationId, program.id));

      res.json({
        ...program,
        modules,
        questionCount: questionCount.length,
        proStatus,
        prerequisite,
      });
    } catch (error) {
      console.error("[Academy] Failed to get certification:", error);
      res.status(500).json({ error: "Failed to retrieve certification" });
    }
  });

  // Get module content
  app.get("/api/academy/certifications/:slug/modules/:moduleNumber", requireAuth, requireHauler, async (req: Request, res: Response) => {
    try {
      const [program] = await db
        .select()
        .from(certificationPrograms)
        .where(eq(certificationPrograms.slug, req.params.slug));

      if (!program) return res.status(404).json({ error: "Certification not found" });

      const moduleNum = parseInt(req.params.moduleNumber);
      const [mod] = await db
        .select()
        .from(certificationModules)
        .where(
          and(
            eq(certificationModules.certificationId, program.id),
            eq(certificationModules.moduleNumber, moduleNum)
          )
        );

      if (!mod) return res.status(404).json({ error: "Module not found" });

      res.json(mod);
    } catch (error) {
      console.error("[Academy] Failed to get module:", error);
      res.status(500).json({ error: "Failed to retrieve module" });
    }
  });

  // Enroll in certification
  app.post("/api/academy/certifications/:slug/enroll", requireAuth, requireHauler, async (req: Request, res: Response) => {
    try {
      const proId = ((req.user as any).userId || (req.user as any).id);

      const [program] = await db
        .select()
        .from(certificationPrograms)
        .where(eq(certificationPrograms.slug, req.params.slug));

      if (!program) return res.status(404).json({ error: "Certification not found" });

      // Check prerequisite
      if (program.prerequisiteCertId) {
        const [prereqStatus] = await db
          .select()
          .from(proCertifications)
          .where(
            and(
              eq(proCertifications.proId, proId),
              eq(proCertifications.certificationId, program.prerequisiteCertId),
              eq(proCertifications.status, "completed")
            )
          );
        if (!prereqStatus) {
          const [prereq] = await db
            .select()
            .from(certificationPrograms)
            .where(eq(certificationPrograms.id, program.prerequisiteCertId));
          return res.status(400).json({
            error: `This certification requires "${prereq?.name || 'prerequisite'}" certification first.`,
          });
        }
      }

      // Check if already enrolled
      const [existing] = await db
        .select()
        .from(proCertifications)
        .where(
          and(
            eq(proCertifications.proId, proId),
            eq(proCertifications.certificationId, program.id)
          )
        );

      if (existing && existing.status === "completed") {
        return res.status(400).json({ error: "Already certified" });
      }

      if (existing && existing.status === "in_progress") {
        return res.json({ enrollment: existing, message: "Already enrolled" });
      }

      // Create enrollment (or re-enroll if expired/revoked)
      if (existing) {
        await db
          .update(proCertifications)
          .set({
            status: "in_progress",
            score: null,
            modulesCompleted: [],
            quizAttempts: 0,
            completedAt: null,
            expiresAt: null,
            certificateNumber: null,
            startedAt: new Date().toISOString(),
          })
          .where(eq(proCertifications.id, existing.id));

        const [updated] = await db
          .select()
          .from(proCertifications)
          .where(eq(proCertifications.id, existing.id));
        return res.json({ enrollment: updated, message: "Re-enrolled" });
      }

      const [enrollment] = await db
        .insert(proCertifications)
        .values({
          proId,
          certificationId: program.id,
          status: "in_progress",
          modulesCompleted: [],
          quizAttempts: 0,
        })
        .returning();

      res.json({ enrollment, message: "Enrolled successfully" });
    } catch (error) {
      console.error("[Academy] Enrollment failed:", error);
      res.status(500).json({ error: "Failed to enroll" });
    }
  });

  // Complete module
  app.post("/api/academy/certifications/:slug/complete-module", requireAuth, requireHauler, async (req: Request, res: Response) => {
    try {
      const proId = ((req.user as any).userId || (req.user as any).id);
      const { moduleNumber } = req.body;

      const [program] = await db
        .select()
        .from(certificationPrograms)
        .where(eq(certificationPrograms.slug, req.params.slug));

      if (!program) return res.status(404).json({ error: "Certification not found" });

      const [enrollment] = await db
        .select()
        .from(proCertifications)
        .where(
          and(
            eq(proCertifications.proId, proId),
            eq(proCertifications.certificationId, program.id)
          )
        );

      if (!enrollment || enrollment.status !== "in_progress") {
        return res.status(400).json({ error: "Not enrolled in this certification" });
      }

      const completed = (enrollment.modulesCompleted as number[]) || [];
      if (!completed.includes(moduleNumber)) {
        completed.push(moduleNumber);
      }

      await db
        .update(proCertifications)
        .set({ modulesCompleted: completed })
        .where(eq(proCertifications.id, enrollment.id));

      res.json({
        modulesCompleted: completed,
        totalModules: program.modulesCount,
        allComplete: completed.length >= program.modulesCount,
      });
    } catch (error) {
      console.error("[Academy] Module completion failed:", error);
      res.status(500).json({ error: "Failed to complete module" });
    }
  });

  // Get quiz questions (without answers)
  app.get("/api/academy/certifications/:slug/quiz-questions", requireAuth, requireHauler, async (req: Request, res: Response) => {
    try {
      const [program] = await db
        .select()
        .from(certificationPrograms)
        .where(eq(certificationPrograms.slug, req.params.slug));

      if (!program) return res.status(404).json({ error: "Certification not found" });

      const questions = await db
        .select({
          id: certificationQuestions.id,
          moduleNumber: certificationQuestions.moduleNumber,
          question: certificationQuestions.question,
          optionA: certificationQuestions.optionA,
          optionB: certificationQuestions.optionB,
          optionC: certificationQuestions.optionC,
          optionD: certificationQuestions.optionD,
        })
        .from(certificationQuestions)
        .where(eq(certificationQuestions.certificationId, program.id));

      res.json(questions);
    } catch (error) {
      console.error("[Academy] Failed to get quiz questions:", error);
      res.status(500).json({ error: "Failed to retrieve questions" });
    }
  });

  // Submit quiz
  app.post("/api/academy/certifications/:slug/quiz", requireAuth, requireHauler, async (req: Request, res: Response) => {
    try {
      const proId = ((req.user as any).userId || (req.user as any).id);
      const { answers } = req.body; // { questionId: 'a'|'b'|'c'|'d' }

      const [program] = await db
        .select()
        .from(certificationPrograms)
        .where(eq(certificationPrograms.slug, req.params.slug));

      if (!program) return res.status(404).json({ error: "Certification not found" });

      const [enrollment] = await db
        .select()
        .from(proCertifications)
        .where(
          and(
            eq(proCertifications.proId, proId),
            eq(proCertifications.certificationId, program.id),
            eq(proCertifications.status, "in_progress")
          )
        );

      if (!enrollment) {
        return res.status(400).json({ error: "Not enrolled in this certification" });
      }

      // Check all modules completed
      const completed = (enrollment.modulesCompleted as number[]) || [];
      if (completed.length < program.modulesCount) {
        return res.status(400).json({
          error: `Complete all ${program.modulesCount} modules before taking the quiz. You've completed ${completed.length}.`,
        });
      }

      // Grade quiz
      const questions = await db
        .select()
        .from(certificationQuestions)
        .where(eq(certificationQuestions.certificationId, program.id));

      if (questions.length === 0) {
        return res.status(400).json({ error: "No quiz questions available" });
      }

      let correct = 0;
      const results = questions.map(q => {
        const userAnswer = answers[q.id];
        const isCorrect = userAnswer === q.correctOption;
        if (isCorrect) correct++;
        return {
          questionId: q.id,
          correct: isCorrect,
          correctAnswer: q.correctOption,
          explanation: q.explanation,
        };
      });

      const score = Math.round((correct / questions.length) * 100);
      const passed = score >= program.requiredScore;

      const now = new Date();
      const updateData: any = {
        score,
        quizAttempts: enrollment.quizAttempts + 1,
      };

      if (passed) {
        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + program.expirationDays);

        updateData.status = "completed";
        updateData.completedAt = now.toISOString();
        updateData.expiresAt = expiresAt.toISOString();
        updateData.certificateNumber = generateCertificateNumber();
      }

      await db
        .update(proCertifications)
        .set(updateData)
        .where(eq(proCertifications.id, enrollment.id));

      // Check if this certification unlocked a new fee tier
      let feeReduction: any = null;
      if (passed) {
        try {
          const quizProId = ((req.user as any).userId || (req.user as any).id);
          const now = new Date().toISOString();
          const certCountResult = await db.execute(feeSql`
            SELECT COUNT(*) as count FROM pro_certifications
            WHERE pro_id = ${quizProId} AND status = 'completed'
              AND (expires_at IS NULL OR expires_at > ${now})
          `);
          const newCertCount = Number((certCountResult.rows[0] as any)?.count || 0);
          feeReduction = await checkFeeReduction(quizProId, newCertCount);
          if (feeReduction) {
            console.log(`[Fee Tier] Pro ${quizProId} unlocked ${feeReduction.newTier} tier: ${Math.round(feeReduction.oldRate * 100)}% → ${Math.round(feeReduction.newRate * 100)}% (saves ~$${feeReduction.monthlySavings}/mo)`);
          }
        } catch (feeError) {
          console.error("[Fee Tier] Error checking fee reduction:", feeError);
        }
      }

      res.json({
        passed,
        score,
        requiredScore: program.requiredScore,
        correct,
        total: questions.length,
        results,
        certificateNumber: passed ? updateData.certificateNumber : null,
        feeReduction,
      });
    } catch (error) {
      console.error("[Academy] Quiz submission failed:", error);
      res.status(500).json({ error: "Failed to submit quiz" });
    }
  });

  // My certifications
  app.get("/api/academy/my-certifications", requireAuth, requireHauler, async (req: Request, res: Response) => {
    try {
      const proId = ((req.user as any).userId || (req.user as any).id);

      const enrollments = await db
        .select()
        .from(proCertifications)
        .where(eq(proCertifications.proId, proId));

      const programs = await db.select().from(certificationPrograms);
      const programMap = new Map(programs.map(p => [p.id, p]));

      const result = enrollments.map(e => ({
        ...e,
        certification: programMap.get(e.certificationId) || null,
      }));

      res.json(result);
    } catch (error) {
      console.error("[Academy] Failed to get my certifications:", error);
      res.status(500).json({ error: "Failed to retrieve certifications" });
    }
  });

  // Public certificate verification
  app.get("/api/academy/certificate/:certificateNumber", async (req: Request, res: Response) => {
    try {
      const [cert] = await db
        .select()
        .from(proCertifications)
        .where(eq(proCertifications.certificateNumber, req.params.certificateNumber));

      if (!cert) return res.status(404).json({ error: "Certificate not found" });

      const [program] = await db
        .select()
        .from(certificationPrograms)
        .where(eq(certificationPrograms.id, cert.certificationId));

      const isExpired = cert.expiresAt ? new Date(cert.expiresAt) < new Date() : false;

      res.json({
        valid: cert.status === "completed" && !isExpired,
        certificateNumber: cert.certificateNumber,
        certificationName: program?.name || "Unknown",
        score: cert.score,
        completedAt: cert.completedAt,
        expiresAt: cert.expiresAt,
        status: isExpired ? "expired" : cert.status,
      });
    } catch (error) {
      console.error("[Academy] Certificate verification failed:", error);
      res.status(500).json({ error: "Failed to verify certificate" });
    }
  });
}
