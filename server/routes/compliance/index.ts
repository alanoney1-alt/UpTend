import type { Express } from "express";
import { requireAuth } from "../../auth-middleware";
import { db } from "../../db";
import { eq, and } from "drizzle-orm";
import {
  insuranceCertificates,
  complianceDocuments,
  backgroundChecks,
} from "@shared/schema";
import { z } from "zod";

// === Validation Schemas ===

const createCertificateSchema = z.object({
  company: z.string().min(1),
  policyNumber: z.string().min(1),
  provider: z.string().min(1),
  coverageAmount: z.number().positive(),
  expiryDate: z.string(),
  documentUrl: z.string().url().optional(),
  autoNotify: z.boolean().default(true),
});

const createComplianceDocSchema = z.object({
  proId: z.string().min(1),
  docType: z.string().min(1),
  expiry: z.string().optional(),
  documentUrl: z.string().url().optional(),
});

const createBackgroundCheckSchema = z.object({
  proId: z.string().min(1),
  provider: z.string().default("checkr"),
});

export function registerComplianceRoutes(app: Express) {
  // ==========================================
  // INSURANCE CERTIFICATES (COIs)
  // ==========================================

  app.get("/api/compliance/certificates", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const certs = await db.select().from(insuranceCertificates)
        .where(eq(insuranceCertificates.userId, userId));
      res.json(certs);
    } catch (error) {
      console.error("Error fetching certificates:", error);
      res.status(500).json({ error: "Failed to fetch certificates" });
    }
  });

  app.get("/api/compliance/certificates/:id", requireAuth, async (req, res) => {
    try {
      const [cert] = await db.select().from(insuranceCertificates)
        .where(eq(insuranceCertificates.id, req.params.id));
      if (!cert) return res.status(404).json({ error: "Certificate not found" });
      res.json(cert);
    } catch (error) {
      console.error("Error fetching certificate:", error);
      res.status(500).json({ error: "Failed to fetch certificate" });
    }
  });

  app.post("/api/compliance/certificates", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const data = createCertificateSchema.parse(req.body);
      const [cert] = await db.insert(insuranceCertificates).values({
        userId,
        ...data,
        verified: false,
      }).returning();
      res.status(201).json(cert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Error creating certificate:", error);
      res.status(500).json({ error: "Failed to create certificate" });
    }
  });

  app.put("/api/compliance/certificates/:id", requireAuth, async (req, res) => {
    try {
      const [updated] = await db.update(insuranceCertificates)
        .set({ ...req.body, updatedAt: new Date().toISOString() })
        .where(eq(insuranceCertificates.id, req.params.id))
        .returning();
      if (!updated) return res.status(404).json({ error: "Certificate not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating certificate:", error);
      res.status(500).json({ error: "Failed to update certificate" });
    }
  });

  app.delete("/api/compliance/certificates/:id", requireAuth, async (req, res) => {
    try {
      const [deleted] = await db.delete(insuranceCertificates)
        .where(eq(insuranceCertificates.id, req.params.id))
        .returning();
      if (!deleted) return res.status(404).json({ error: "Certificate not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting certificate:", error);
      res.status(500).json({ error: "Failed to delete certificate" });
    }
  });

  // ==========================================
  // COMPLIANCE DOCUMENTS
  // ==========================================

  app.get("/api/compliance/documents", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const docs = await db.select().from(complianceDocuments)
        .where(eq(complianceDocuments.userId, userId));
      res.json(docs);
    } catch (error) {
      console.error("Error fetching compliance documents:", error);
      res.status(500).json({ error: "Failed to fetch compliance documents" });
    }
  });

  app.get("/api/compliance/documents/:id", requireAuth, async (req, res) => {
    try {
      const [doc] = await db.select().from(complianceDocuments)
        .where(eq(complianceDocuments.id, req.params.id));
      if (!doc) return res.status(404).json({ error: "Document not found" });
      res.json(doc);
    } catch (error) {
      console.error("Error fetching compliance document:", error);
      res.status(500).json({ error: "Failed to fetch compliance document" });
    }
  });

  app.post("/api/compliance/documents", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const data = createComplianceDocSchema.parse(req.body);
      const [doc] = await db.insert(complianceDocuments).values({
        userId,
        ...data,
        verified: false,
      }).returning();
      res.status(201).json(doc);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Error creating compliance document:", error);
      res.status(500).json({ error: "Failed to create compliance document" });
    }
  });

  app.put("/api/compliance/documents/:id", requireAuth, async (req, res) => {
    try {
      const [updated] = await db.update(complianceDocuments)
        .set({ ...req.body, updatedAt: new Date().toISOString() })
        .where(eq(complianceDocuments.id, req.params.id))
        .returning();
      if (!updated) return res.status(404).json({ error: "Document not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating compliance document:", error);
      res.status(500).json({ error: "Failed to update compliance document" });
    }
  });

  app.delete("/api/compliance/documents/:id", requireAuth, async (req, res) => {
    try {
      const [deleted] = await db.delete(complianceDocuments)
        .where(eq(complianceDocuments.id, req.params.id))
        .returning();
      if (!deleted) return res.status(404).json({ error: "Document not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting compliance document:", error);
      res.status(500).json({ error: "Failed to delete compliance document" });
    }
  });

  // ==========================================
  // BACKGROUND CHECKS
  // ==========================================

  app.get("/api/compliance/background-checks", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const checks = await db.select().from(backgroundChecks)
        .where(eq(backgroundChecks.userId, userId));
      res.json(checks);
    } catch (error) {
      console.error("Error fetching background checks:", error);
      res.status(500).json({ error: "Failed to fetch background checks" });
    }
  });

  app.get("/api/compliance/background-checks/:id", requireAuth, async (req, res) => {
    try {
      const [check] = await db.select().from(backgroundChecks)
        .where(eq(backgroundChecks.id, req.params.id));
      if (!check) return res.status(404).json({ error: "Background check not found" });
      res.json(check);
    } catch (error) {
      console.error("Error fetching background check:", error);
      res.status(500).json({ error: "Failed to fetch background check" });
    }
  });

  app.post("/api/compliance/background-checks", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const data = createBackgroundCheckSchema.parse(req.body);
      const [check] = await db.insert(backgroundChecks).values({
        userId,
        proId: data.proId,
        provider: data.provider,
        status: "pending",
      }).returning();
      res.status(201).json(check);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Error creating background check:", error);
      res.status(500).json({ error: "Failed to create background check" });
    }
  });

  app.put("/api/compliance/background-checks/:id", requireAuth, async (req, res) => {
    try {
      const [updated] = await db.update(backgroundChecks)
        .set({ ...req.body, updatedAt: new Date().toISOString() })
        .where(eq(backgroundChecks.id, req.params.id))
        .returning();
      if (!updated) return res.status(404).json({ error: "Background check not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating background check:", error);
      res.status(500).json({ error: "Failed to update background check" });
    }
  });

  app.delete("/api/compliance/background-checks/:id", requireAuth, async (req, res) => {
    try {
      const [deleted] = await db.delete(backgroundChecks)
        .where(eq(backgroundChecks.id, req.params.id))
        .returning();
      if (!deleted) return res.status(404).json({ error: "Background check not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting background check:", error);
      res.status(500).json({ error: "Failed to delete background check" });
    }
  });
}
