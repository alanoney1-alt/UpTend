import express from "express";
import crypto from "crypto";
import { requireAuth as auth } from "../../middleware/auth";
import {
  createProperty,
  getPropertyById,
  getPropertiesByUserId,
  updateProperty,
  getHealthEventsByProperty,
  getMaintenanceTasksByProperty,
} from "../../storage/domains/properties/storage";
import { calculatePropertyHealthScore, updatePropertyHealth } from "../../services/property-health-calculator";
import type { InsertProperty } from "../../../shared/schema";

const router = express.Router();

/**
 * GET /api/properties/my-properties
 * Get all properties for authenticated user with transfer info
 */
router.get("/my-properties", auth, async (req, res) => {
  try {
    const userId = (req.user as any).userId || (req.user as any).id;
    const properties = await getPropertiesByUserId(userId);
    // Return properties with empty transfers array for compatibility
    const result = properties.map((p: any) => ({
      ...p,
      transfers: [],
    }));
    res.json(result);
  } catch (error) {
    console.error("Error fetching my-properties:", error);
    // Return empty array instead of 500 if feature isn't ready
    res.json([]);
  }
});

/**
 * GET /api/properties
 * Get all properties for authenticated user
 */
router.get("/", auth, async (req, res) => {
  try {
    const userId = (req.user as any).userId || (req.user as any).id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const properties = await getPropertiesByUserId(userId);
    res.json(properties || []);
  } catch (error: any) {
    console.error("Error fetching properties:", error?.message || error);
    // Return empty array instead of 500 if table doesn't exist yet
    if (error?.message?.includes("does not exist") || error?.code === "42P01") {
      return res.json([]);
    }
    res.status(500).json({ error: "Failed to fetch properties" });
  }
});

/**
 * POST /api/properties
 * Create a new property
 */
router.post("/", auth, async (req, res) => {
  try {
    const propertyData: InsertProperty = {
      id: crypto.randomUUID(),
      ownerId: (req.user as any).userId || (req.user as any).id,
      ...req.body,
      createdAt: new Date().toISOString(),
    };

    const property = await createProperty(propertyData);
    res.status(201).json(property);
  } catch (error) {
    console.error("Error creating property:", error);
    res.status(500).json({ error: "Failed to create property" });
  }
});

/**
 * GET /api/properties/:id
 * Get a specific property by ID
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const property = await getPropertyById(req.params.id);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Verify ownership
    if (property.ownerId !== ((req.user as any).userId || (req.user as any).id)) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(property);
  } catch (error) {
    console.error("Error fetching property:", error);
    res.status(500).json({ error: "Failed to fetch property" });
  }
});

/**
 * PATCH /api/properties/:id
 * Update a property
 */
router.patch("/:id", auth, async (req, res) => {
  try {
    const property = await getPropertyById(req.params.id);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Verify ownership
    if (property.ownerId !== ((req.user as any).userId || (req.user as any).id)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updated = await updateProperty(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    console.error("Error updating property:", error);
    res.status(500).json({ error: "Failed to update property" });
  }
});

/**
 * GET /api/properties/:id/health-score
 * Calculate and return property health score
 */
router.get("/:id/health-score", auth, async (req, res) => {
  try {
    const property = await getPropertyById(req.params.id);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Verify ownership
    if (property.ownerId !== ((req.user as any).userId || (req.user as any).id)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const healthScore = await calculatePropertyHealthScore(req.params.id);
    res.json(healthScore);
  } catch (error) {
    console.error("Error calculating health score:", error);
    res.status(500).json({ error: "Failed to calculate health score" });
  }
});

/**
 * POST /api/properties/:id/health-score/update
 * Recalculate and update property health score
 */
router.post("/:id/health-score/update", auth, async (req, res) => {
  try {
    const property = await getPropertyById(req.params.id);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Verify ownership
    if (property.ownerId !== ((req.user as any).userId || (req.user as any).id)) {
      return res.status(403).json({ error: "Access denied" });
    }

    await updatePropertyHealth(req.params.id);
    const updated = await getPropertyById(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error("Error updating health score:", error);
    res.status(500).json({ error: "Failed to update health score" });
  }
});

/**
 * GET /api/properties/:id/timeline
 * Get property timeline (Carfax-style)
 */
router.get("/:id/timeline", auth, async (req, res) => {
  try {
    const property = await getPropertyById(req.params.id);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Verify ownership
    if (property.ownerId !== ((req.user as any).userId || (req.user as any).id)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const events = await getHealthEventsByProperty(req.params.id);
    res.json(events);
  } catch (error) {
    console.error("Error fetching timeline:", error);
    res.status(500).json({ error: "Failed to fetch timeline" });
  }
});

/**
 * GET /api/properties/:id/maintenance-schedule
 * Get property maintenance schedule
 */
router.get("/:id/maintenance-schedule", auth, async (req, res) => {
  try {
    const property = await getPropertyById(req.params.id);

    if (!property) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Verify ownership
    if (property.ownerId !== ((req.user as any).userId || (req.user as any).id)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const tasks = await getMaintenanceTasksByProperty(req.params.id);
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching maintenance schedule:", error);
    res.status(500).json({ error: "Failed to fetch maintenance schedule" });
  }
});

export default router;
