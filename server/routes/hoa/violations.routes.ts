import type { Express } from "express";
import { storage } from "../../storage";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";

const createViolationSchema = z.object({
  propertyId: z.string().uuid(),
  violationType: z.string(),
  description: z.string().min(10),
  severity: z.enum(["low", "medium", "high"]),
  photos: z.array(z.string()).optional(),
  deadline: z.string().optional(),
  notifyHomeowner: z.boolean().default(true),
});

export function registerHoaViolationRoutes(app: Express) {
  // ==========================================
  // HOA VIOLATION MANAGEMENT
  // ==========================================

  // Create new violation
  app.post("/api/hoa/violations", requireAuth, async (req, res) => {
    try {
      const data = createViolationSchema.parse(req.body);

      // Verify property exists and belongs to user's business account
      const property = await storage.getHoaProperty(data.propertyId);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }

      // Verify user owns this business account
      const businessAccount = await storage.getBusinessAccount(property.businessAccountId);
      if (!businessAccount || businessAccount.userId !== req.user!.id) {
        return res.status(403).json({ error: "Unauthorized - not your property" });
      }

      // Create violation
      const violation = await storage.createHoaViolation({
        propertyId: data.propertyId,
        businessAccountId: property.businessAccountId,
        violationType: data.violationType,
        description: data.description,
        severity: data.severity,
        photos: data.photos || [],
        status: "open",
        submittedAt: new Date().toISOString(),
        deadline: data.deadline,
      });

      // TODO: Send notification to homeowner if notifyHomeowner is true
      // This would use the notifications service to send email + SMS

      res.json(violation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Create violation error:", error);
      res.status(500).json({ error: "Failed to create violation" });
    }
  });

  // Get violations for a business account
  app.get("/api/business/:businessAccountId/violations", requireAuth, async (req, res) => {
    try {
      const { businessAccountId } = req.params;

      // Verify user owns this business account
      const businessAccount = await storage.getBusinessAccount(businessAccountId);
      if (!businessAccount || businessAccount.userId !== req.user!.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const violations = await storage.getHoaViolationsByBusinessAccount(businessAccountId);
      res.json(violations);
    } catch (error) {
      console.error("Get violations error:", error);
      res.status(500).json({ error: "Failed to fetch violations" });
    }
  });

  // Get violations for a specific property
  app.get("/api/hoa/properties/:propertyId/violations", requireAuth, async (req, res) => {
    try {
      const { propertyId } = req.params;

      // Verify property exists and user owns it
      const property = await storage.getHoaProperty(propertyId);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }

      const businessAccount = await storage.getBusinessAccount(property.businessAccountId);
      if (!businessAccount || businessAccount.userId !== req.user!.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const violations = await storage.getHoaViolationsByProperty(propertyId);
      res.json(violations);
    } catch (error) {
      console.error("Get property violations error:", error);
      res.status(500).json({ error: "Failed to fetch violations" });
    }
  });

  // Get single violation
  app.get("/api/hoa/violations/:id", requireAuth, async (req, res) => {
    try {
      const violation = await storage.getHoaViolation(req.params.id);
      if (!violation) {
        return res.status(404).json({ error: "Violation not found" });
      }

      // Verify user owns this violation's business account
      const businessAccount = await storage.getBusinessAccount(violation.businessAccountId);
      if (!businessAccount || businessAccount.userId !== req.user!.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      res.json(violation);
    } catch (error) {
      console.error("Get violation error:", error);
      res.status(500).json({ error: "Failed to fetch violation" });
    }
  });

  // Update violation status
  app.patch("/api/hoa/violations/:id", requireAuth, async (req, res) => {
    try {
      const violation = await storage.getHoaViolation(req.params.id);
      if (!violation) {
        return res.status(404).json({ error: "Violation not found" });
      }

      // Verify user owns this violation's business account
      const businessAccount = await storage.getBusinessAccount(violation.businessAccountId);
      if (!businessAccount || businessAccount.userId !== req.user!.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const updates: any = {};
      if (req.body.status) updates.status = req.body.status;
      if (req.body.notes) updates.notes = req.body.notes;
      if (req.body.resolvedAt) updates.resolvedAt = req.body.resolvedAt;

      const updated = await storage.updateHoaViolation(req.params.id, updates);
      res.json(updated);
    } catch (error) {
      console.error("Update violation error:", error);
      res.status(500).json({ error: "Failed to update violation" });
    }
  });

  // Get violations by property (public - for homeowner view)
  app.get("/api/properties/:propertyId/violations/public", async (req, res) => {
    try {
      const { propertyId } = req.params;
      const { token } = req.query;

      // TODO: Verify token if required for public access
      // For now, allow public access to property violations

      const violations = await storage.getHoaViolationsByProperty(propertyId);
      res.json(violations);
    } catch (error) {
      console.error("Get public violations error:", error);
      res.status(500).json({ error: "Failed to fetch violations" });
    }
  });
}
