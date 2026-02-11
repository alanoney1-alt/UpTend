import express from "express";
import crypto from "crypto";
import { requireAuth as auth } from "../../middleware/auth";
import {
  createWarranty,
  getWarrantyById,
  getWarrantiesByProperty,
  getActiveWarranties,
  updateWarranty,
  recordWarrantyClaim,
  getPropertyById,
} from "../../storage/domains/properties/storage";
import type { InsertPropertyWarranty } from "../../../shared/schema";

const router = express.Router();

router.get("/:propertyId/warranties", auth, async (req, res) => {
  try {
    const property = await getPropertyById(req.params.propertyId);
    if (!property || property.userId !== req.user!.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    const warranties = await getWarrantiesByProperty(req.params.propertyId);
    res.json(warranties);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch warranties" });
  }
});

router.get("/:propertyId/warranties/active", auth, async (req, res) => {
  try {
    const property = await getPropertyById(req.params.propertyId);
    if (!property || property.userId !== req.user!.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    const warranties = await getActiveWarranties(req.params.propertyId);
    res.json(warranties);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch warranties" });
  }
});

router.post("/:propertyId/warranties", auth, async (req, res) => {
  try {
    const property = await getPropertyById(req.params.propertyId);
    if (!property || property.userId !== req.user!.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    const warrantyData: InsertPropertyWarranty = {
      id: crypto.randomUUID(),
      propertyId: req.params.propertyId,
      ...req.body,
      createdAt: new Date().toISOString(),
    };
    const warranty = await createWarranty(warrantyData);
    res.status(201).json(warranty);
  } catch (error) {
    res.status(500).json({ error: "Failed to create warranty" });
  }
});

router.get("/warranties/:id", auth, async (req, res) => {
  try {
    const warranty = await getWarrantyById(req.params.id);
    if (!warranty) return res.status(404).json({ error: "Warranty not found" });
    const property = await getPropertyById(warranty.propertyId);
    if (!property || property.userId !== req.user!.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    res.json(warranty);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch warranty" });
  }
});

router.patch("/warranties/:id", auth, async (req, res) => {
  try {
    const warranty = await getWarrantyById(req.params.id);
    if (!warranty) return res.status(404).json({ error: "Warranty not found" });
    const property = await getPropertyById(warranty.propertyId);
    if (!property || property.userId !== req.user!.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    const updated = await updateWarranty(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update warranty" });
  }
});

router.post("/warranties/:id/claim", auth, async (req, res) => {
  try {
    const warranty = await getWarrantyById(req.params.id);
    if (!warranty) return res.status(404).json({ error: "Warranty not found" });
    const property = await getPropertyById(warranty.propertyId);
    if (!property || property.userId !== req.user!.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    const updated = await recordWarrantyClaim(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to record claim" });
  }
});

export default router;
