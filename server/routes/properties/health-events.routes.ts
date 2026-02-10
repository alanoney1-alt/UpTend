import express from "express";
import { auth } from "../../middleware/auth";
import {
  createHealthEvent,
  getHealthEventById,
  getHealthEventsByProperty,
  getHealthEventsByType,
  getHealthEventsByDateRange,
  getPropertyById,
} from "../../storage/domains/properties/storage";
import { updatePropertyHealth } from "../../services/property-health-calculator";
import type { InsertPropertyHealthEvent } from "../../../shared/schema";

const router = express.Router();

router.get("/:propertyId/health-events", auth, async (req, res) => {
  try {
    const property = await getPropertyById(req.params.propertyId);
    if (!property || property.userId !== req.user!.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    const events = await getHealthEventsByProperty(req.params.propertyId);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

router.post("/:propertyId/health-events", auth, async (req, res) => {
  try {
    const property = await getPropertyById(req.params.propertyId);
    if (!property || property.userId !== req.user!.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    const eventData: InsertPropertyHealthEvent = {
      id: crypto.randomUUID(),
      propertyId: req.params.propertyId,
      ...req.body,
      createdAt: new Date().toISOString(),
    };
    const event = await createHealthEvent(eventData);
    
    // Trigger health score recalculation
    updatePropertyHealth(req.params.propertyId).catch(err => {
      console.error("Failed to update health score:", err);
    });
    
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: "Failed to create event" });
  }
});

export default router;
