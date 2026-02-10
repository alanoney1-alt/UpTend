import type { Express } from "express";
import { storage } from "../../storage";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { requireBusinessTeamAccess, verifyTeamAccess } from "../../auth-middleware";

const createPropertySchema = z.object({
  businessAccountId: z.string().uuid(),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().length(2),
  zipCode: z.string().min(5).max(10),
  ownerName: z.string().optional(),
  ownerEmail: z.string().email().optional().or(z.literal("")),
  ownerPhone: z.string().optional(),
  notes: z.string().optional(),
});

const updatePropertySchema = z.object({
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  state: z.string().length(2).optional(),
  zipCode: z.string().min(5).max(10).optional(),
  ownerName: z.string().optional(),
  ownerEmail: z.string().email().optional().or(z.literal("")),
  ownerPhone: z.string().optional(),
  notes: z.string().optional(),
});

export function registerHoaPropertyRoutes(app: Express) {
  // ==========================================
  // HOA PROPERTY MANAGEMENT
  // ==========================================

  // Create new property
  app.post("/api/hoa/properties", requireAuth, requireBusinessTeamAccess("canManageProperties"), async (req, res) => {
    try {
      const data = createPropertySchema.parse(req.body);

      // Create property (team access already verified by middleware)
      const property = await storage.createHoaProperty({
        businessAccountId: data.businessAccountId,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        ownerName: data.ownerName || null,
        ownerEmail: data.ownerEmail || null,
        ownerPhone: data.ownerPhone || null,
        notes: data.notes || null,
      });

      res.json(property);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Create property error:", error);
      res.status(500).json({ error: "Failed to create property" });
    }
  });

  // Get properties for a business account
  app.get("/api/business/:businessAccountId/properties", requireAuth, requireBusinessTeamAccess(), async (req, res) => {
    try {
      const { businessAccountId } = req.params;

      // Team access already verified by middleware
      const properties = await storage.getHoaPropertiesByBusinessAccount(businessAccountId);
      res.json(properties);
    } catch (error) {
      console.error("Get properties error:", error);
      res.status(500).json({ error: "Failed to fetch properties" });
    }
  });

  // Get single property
  app.get("/api/hoa/properties/:id", requireAuth, async (req, res) => {
    try {
      const property = await storage.getHoaProperty(req.params.id);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }

      // Verify team access - admin bypass
      if (req.user!.role !== "admin") {
        const access = await verifyTeamAccess(req.user!.id, property.businessAccountId);
        if (!access.authorized) {
          return res.status(403).json({ error: access.message || "Unauthorized" });
        }
      }

      res.json(property);
    } catch (error) {
      console.error("Get property error:", error);
      res.status(500).json({ error: "Failed to fetch property" });
    }
  });

  // Update property
  app.patch("/api/hoa/properties/:id", requireAuth, async (req, res) => {
    try {
      const property = await storage.getHoaProperty(req.params.id);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }

      // Verify team access with canManageProperties permission - admin bypass
      if (req.user!.role !== "admin") {
        const access = await verifyTeamAccess(req.user!.id, property.businessAccountId, "canManageProperties");
        if (!access.authorized) {
          return res.status(403).json({ error: access.message || "Unauthorized - requires canManageProperties permission" });
        }
      }

      const updates = updatePropertySchema.parse(req.body);

      const updated = await storage.updateHoaProperty(req.params.id, updates);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      console.error("Update property error:", error);
      res.status(500).json({ error: "Failed to update property" });
    }
  });

  // Delete property
  app.delete("/api/hoa/properties/:id", requireAuth, async (req, res) => {
    try {
      const property = await storage.getHoaProperty(req.params.id);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }

      // Verify team access with canManageProperties permission - admin bypass
      if (req.user!.role !== "admin") {
        const access = await verifyTeamAccess(req.user!.id, property.businessAccountId, "canManageProperties");
        if (!access.authorized) {
          return res.status(403).json({ error: access.message || "Unauthorized - requires canManageProperties permission" });
        }
      }

      // TODO: Check if property has active violations before deleting
      // For now, allow deletion

      await storage.updateHoaProperty(req.params.id, { isActive: false });
      res.json({ success: true, message: "Property marked as inactive" });
    } catch (error) {
      console.error("Delete property error:", error);
      res.status(500).json({ error: "Failed to delete property" });
    }
  });
}
