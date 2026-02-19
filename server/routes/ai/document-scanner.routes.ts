/**
 * AI Document Scanner API Routes (#14)
 *
 * Scan warranty, insurance, receipts → AI extracts data → auto-files to property record.
 *
 * Endpoints:
 * - POST /api/ai/documents/scan - Upload document for AI extraction
 * - GET /api/ai/documents/scans - List user's scanned documents
 * - GET /api/ai/documents/scans/:id - Get scan details
 * - POST /api/ai/documents/scans/:id/confirm - Confirm extracted data
 * - POST /api/ai/documents/scans/:id/correct - Submit corrections
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../auth-middleware";
import type { DatabaseStorage } from "../../storage/impl/database-storage";
import { nanoid } from "nanoid";
import { analyzeImageOpenAI as analyzeImage } from "../../services/ai/openai-vision-client";

export function createDocumentScannerRoutes(storage: DatabaseStorage) {
  const router = Router();

  // POST /api/ai/documents/scan
  const scanSchema = z.object({
    documentUrl: z.string().url(),
    documentContentType: z.string().optional(),
    originalFilename: z.string().optional(),
    propertyId: z.string().optional(),
  });

  // Handler for document scanning/analysis
  const handleDocumentScan = async (req: any, res: any) => {
    try {
      const validated = scanSchema.parse(req.body);
      const userId = ((req.user as any).userId || (req.user as any).id);

      // Create scan record
      const scan = await storage.createDocumentScan({
        id: nanoid(),
        userId,
        propertyId: validated.propertyId || null,
        documentUrl: validated.documentUrl,
        documentContentType: validated.documentContentType || null,
        originalFilename: validated.originalFilename || null,
        documentType: null,
        aiConfidence: null,
        extractedData: null,
        linkedWarrantyId: null,
        linkedInsuranceId: null,
        linkedHealthEventId: null,
        linkedApplianceId: null,
        processingStatus: "processing",
        aiModelUsed: "claude-sonnet-4-20250514",
        processingTimeMs: null,
        errorMessage: null,
        userVerified: false,
        userCorrectedData: null,
        createdAt: new Date().toISOString(),
        processedAt: null,
      });

      // Call AI to analyze document
      const startTime = Date.now();
      try {
        const aiResult = await analyzeImage({
          imageUrl: validated.documentUrl,
          prompt: `Analyze this document image. Classify it and extract structured data.

Return ONLY valid JSON:
{
  "documentType": "warranty" | "insurance_declaration" | "repair_invoice" | "hoa_letter" | "inspection_report" | "receipt" | "manual" | "other",
  "confidence": 0.0-1.0,
  "extractedData": {
    // For warranty: { provider, coverageType, startDate, endDate, policyNumber, coveredItems }
    // For insurance: { carrier, policyNumber, premium, deductible, renewalDate, coverageTypes }
    // For invoice/receipt: { vendor, date, description, amount, lineItems: [{item, cost}] }
    // For HOA letter: { violationType, deadline, description, fineAmount }
    // For inspection: { inspector, date, findings, recommendations }
    // For manual: { brand, model, productType, keyMaintenanceNotes }
  },
  "summary": "One sentence summary of the document"
}`,
          maxTokens: 2048,
        });

        const processingTime = Date.now() - startTime;
        const parsed = typeof aiResult === 'string' ? JSON.parse(aiResult) : aiResult;

        await storage.updateDocumentScan(scan.id, {
          documentType: parsed.documentType || "other",
          aiConfidence: parsed.confidence || 0.5,
          extractedData: JSON.stringify(parsed.extractedData || {}),
          processingStatus: "extracted",
          processingTimeMs: processingTime,
          processedAt: new Date().toISOString(),
        });

        res.json({
          success: true,
          scan: {
            id: scan.id,
            documentType: parsed.documentType,
            confidence: parsed.confidence,
            extractedData: parsed.extractedData,
            summary: parsed.summary,
            processingTimeMs: processingTime,
            status: "extracted",
          },
        });
      } catch (aiErr: any) {
        console.warn("AI document analysis failed:", aiErr.message);
        await storage.updateDocumentScan(scan.id, {
          processingStatus: "failed",
          errorMessage: aiErr.message,
          processingTimeMs: Date.now() - startTime,
        });

        res.json({
          success: true,
          scan: { id: scan.id, status: "failed", error: "AI processing failed — please try again or enter details manually" },
        });
      }
    } catch (error: any) {
      console.error("Error scanning document:", error);
      res.status(400).json({ error: error.message || "Failed to scan document" });
    }
  };

  router.post("/documents/scan", requireAuth, handleDocumentScan);
  router.post("/documents/analyze", requireAuth, handleDocumentScan);

  // GET /api/ai/documents/scans
  router.get("/documents/scans", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const scans = await storage.getDocumentScansByUser(userId);
      res.json({
        success: true,
        scans: scans.map((s: any) => ({
          ...s,
          extractedData: s.extractedData ? JSON.parse(s.extractedData) : null,
          userCorrectedData: s.userCorrectedData ? JSON.parse(s.userCorrectedData) : null,
        })),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/ai/documents/scans/:id
  router.get("/documents/scans/:id", requireAuth, async (req, res) => {
    try {
      const scan = await storage.getDocumentScan(req.params.id);
      if (!scan || scan.userId !== ((req.user as any).userId || (req.user as any).id)) {
        return res.status(404).json({ error: "Scan not found" });
      }
      res.json({
        success: true,
        scan: {
          ...scan,
          extractedData: scan.extractedData || null,
          userCorrectedData: scan.userCorrectedData || null,
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/ai/documents/scans/:id/confirm
  router.post("/documents/scans/:id/confirm", requireAuth, async (req, res) => {
    try {
      const scan = await storage.getDocumentScan(req.params.id);
      if (!scan || scan.userId !== ((req.user as any).userId || (req.user as any).id)) {
        return res.status(404).json({ error: "Scan not found" });
      }
      await storage.updateDocumentScan(scan.id, {
        userVerified: true,
        processingStatus: "filed",
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // POST /api/ai/documents/scans/:id/correct
  router.post("/documents/scans/:id/correct", requireAuth, async (req, res) => {
    try {
      const scan = await storage.getDocumentScan(req.params.id);
      if (!scan || scan.userId !== ((req.user as any).userId || (req.user as any).id)) {
        return res.status(404).json({ error: "Scan not found" });
      }
      await storage.updateDocumentScan(scan.id, {
        userVerified: true,
        userCorrectedData: JSON.stringify(req.body.correctedData),
        processingStatus: "filed",
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}

export default createDocumentScannerRoutes;
