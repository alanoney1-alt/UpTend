import express from "express";
import crypto from "crypto";
import { requireAuth as auth } from "../../middleware/auth";
import {
  createInsurance,
  getInsuranceById,
  getInsuranceByProperty,
  getActiveInsurance,
  updateInsurance,
  recordInsuranceClaim,
  getPropertyById,
} from "../../storage/domains/properties/storage";
import type { InsertPropertyInsurance } from "../../../shared/schema";

const router = express.Router();

router.get("/:propertyId/insurance", auth, async (req, res) => {
  try {
    const property = await getPropertyById(req.params.propertyId);
    if (!property || property.ownerId !== ((req.user as any).userId || (req.user as any).id)) {
      return res.status(403).json({ error: "Access denied" });
    }
    const policies = await getInsuranceByProperty(req.params.propertyId);
    res.json(policies);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch insurance" });
  }
});

router.post("/:propertyId/insurance", auth, async (req, res) => {
  try {
    const property = await getPropertyById(req.params.propertyId);
    if (!property || property.ownerId !== ((req.user as any).userId || (req.user as any).id)) {
      return res.status(403).json({ error: "Access denied" });
    }
    const insuranceData: InsertPropertyInsurance = {
      id: crypto.randomUUID(),
      propertyId: req.params.propertyId,
      ...req.body,
      createdAt: new Date().toISOString(),
    };
    const insurance = await createInsurance(insuranceData);
    res.status(201).json(insurance);
  } catch (error) {
    res.status(500).json({ error: "Failed to create insurance" });
  }
});

router.patch("/insurance/:id", auth, async (req, res) => {
  try {
    const insurance = await getInsuranceById(req.params.id);
    if (!insurance) return res.status(404).json({ error: "Insurance not found" });
    const property = await getPropertyById(insurance.propertyId);
    if (!property || property.ownerId !== ((req.user as any).userId || (req.user as any).id)) {
      return res.status(403).json({ error: "Access denied" });
    }
    const updated = await updateInsurance(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update insurance" });
  }
});

router.post("/insurance/:id/claim", auth, async (req, res) => {
  try {
    const insurance = await getInsuranceById(req.params.id);
    if (!insurance) return res.status(404).json({ error: "Insurance not found" });
    const property = await getPropertyById(insurance.propertyId);
    if (!property || property.ownerId !== ((req.user as any).userId || (req.user as any).id)) {
      return res.status(403).json({ error: "Access denied" });
    }
    const updated = await recordInsuranceClaim(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to record claim" });
  }
});

export default router;
