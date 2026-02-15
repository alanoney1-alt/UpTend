import express from "express";
import crypto from "crypto";
import { requireAuth as auth } from "../../middleware/auth";
import {
  createDocument,
  getDocumentById,
  getDocumentsByProperty,
  getDocumentsByType,
  updateDocument,
  getPropertyById,
} from "../../storage/domains/properties/storage";
import type { InsertPropertyDocument } from "../../../shared/schema";

const router = express.Router();

router.get("/:propertyId/documents", auth, async (req, res) => {
  try {
    const property = await getPropertyById(req.params.propertyId);
    if (!property || property.ownerId !== ((req.user as any).userId || (req.user as any).id)) {
      return res.status(403).json({ error: "Access denied" });
    }
    const documents = await getDocumentsByProperty(req.params.propertyId);
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

router.get("/:propertyId/documents/type/:type", auth, async (req, res) => {
  try {
    const property = await getPropertyById(req.params.propertyId);
    if (!property || property.ownerId !== ((req.user as any).userId || (req.user as any).id)) {
      return res.status(403).json({ error: "Access denied" });
    }
    const documents = await getDocumentsByType(req.params.propertyId, req.params.type);
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

router.post("/:propertyId/documents", auth, async (req, res) => {
  try {
    const property = await getPropertyById(req.params.propertyId);
    if (!property || property.ownerId !== ((req.user as any).userId || (req.user as any).id)) {
      return res.status(403).json({ error: "Access denied" });
    }
    const documentData: InsertPropertyDocument = {
      id: crypto.randomUUID(),
      propertyId: req.params.propertyId,
      ...req.body,
      createdAt: new Date().toISOString(),
    };
    const document = await createDocument(documentData);
    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ error: "Failed to create document" });
  }
});

router.patch("/documents/:id", auth, async (req, res) => {
  try {
    const document = await getDocumentById(req.params.id);
    if (!document) return res.status(404).json({ error: "Document not found" });
    const property = await getPropertyById(document.propertyId);
    if (!property || property.ownerId !== ((req.user as any).userId || (req.user as any).id)) {
      return res.status(403).json({ error: "Access denied" });
    }
    const updated = await updateDocument(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update document" });
  }
});

export default router;
