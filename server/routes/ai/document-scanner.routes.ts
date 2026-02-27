/**
 * AI Document Scanner API Routes (#14)
 *
 * Scan warranty, insurance, receipts → AI extracts data → auto-files to property record.
 *
 * Endpoints:
 * - POST /api/ai/documents/scan    - Upload document for AI extraction (FormData or JSON)
 * - POST /api/ai/documents/analyze - Alias for /scan (accepts FormData or JSON)
 * - GET /api/ai/documents/scans - List user's scanned documents
 * - GET /api/ai/documents/scans/:id - Get scan details
 * - POST /api/ai/documents/scans/:id/confirm - Confirm extracted data
 * - POST /api/ai/documents/scans/:id/correct - Submit corrections
 */

import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import { requireAuth } from "../../auth-middleware";
import type { DatabaseStorage } from "../../storage/impl/database-storage";
import { nanoid } from "nanoid";
import { analyzeImageOpenAI as analyzeImage } from "../../services/ai/openai-vision-client";

// Accept document files via FormData (memory storage → base64 data URL for AI)
const docUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req: any, file: any, cb: any) => {
    const isImage = file.mimetype.startsWith("image/");
    const isPdf = file.mimetype === "application/pdf";
    cb(null, isImage || isPdf);
  },
});

export function createDocumentScannerRoutes(storage: DatabaseStorage) {
  const router = Router();

  const jsonBodySchema = z.object({
    documentUrl: z.string().url().optional(),
    documentContentType: z.string().optional(),
    originalFilename: z.string().optional(),
    propertyId: z.string().optional(),
  });

  // Shared handler - resolves documentUrl from uploaded file OR JSON body
  const handleDocumentScan = async (req: any, res: any) => {
    try {
      let documentUrl: string;
      let documentContentType: string | undefined;
      let originalFilename: string | undefined;
      let propertyId: string | undefined;

      if (req.file) {
        // File uploaded via FormData - convert buffer to base64 data URL
        const base64 = req.file.buffer.toString("base64");
        documentUrl = `data:${req.file.mimetype};base64,${base64}`;
        documentContentType = req.file.mimetype;
        originalFilename = req.file.originalname;
        propertyId = req.body?.propertyId;
      } else {
        // JSON body with documentUrl
        const parsed = jsonBodySchema.safeParse(req.body);
        const body = parsed.success ? parsed.data : {};
        if (!body.documentUrl) {
          return res.status(400).json({ error: "No document provided. Upload a file or pass documentUrl." });
        }
        documentUrl = body.documentUrl;
        documentContentType = body.documentContentType;
        originalFilename = body.originalFilename;
        propertyId = body.propertyId;
      }

      const userId = ((req.user as any).userId || (req.user as any).id);

      // Create scan record
      const scan = await storage.createDocumentScan({
        id: nanoid(),
        userId,
        propertyId: propertyId || null,
        documentUrl,
        documentContentType: documentContentType || null,
        originalFilename: originalFilename || null,
        documentType: null,
        aiConfidence: null,
        extractedData: null,
        linkedWarrantyId: null,
        linkedInsuranceId: null,
        linkedHealthEventId: null,
        linkedApplianceId: null,
        processingStatus: "processing",
        aiModelUsed: "gpt-4o",
        processingTimeMs: null,
        errorMessage: null,
        userVerified: false,
        userCorrectedData: null,
        createdAt: new Date().toISOString(),
        processedAt: null,
      });

      // Call AI vision to analyze document
      const startTime = Date.now();
      try {
        const aiResult = await analyzeImage({
          imageUrl: documentUrl,
          prompt: `Analyze this document image. Classify it and extract structured data.

Return ONLY valid JSON:
{
  "documentType": "warranty" | "insurance_declaration" | "repair_invoice" | "hoa_letter" | "inspection_report" | "receipt" | "manual" | "other",
  "confidence": 0.0-1.0,
  "extractedData": {
    "provider": "string (if applicable)",
    "policyNumber": "string (if applicable)",
    "date": "string (if applicable)",
    "amount": "number (if applicable)",
    "description": "string"
  },
  "summary": "One sentence summary of the document"
}`,
          maxTokens: 2048,
        });

        const processingTime = Date.now() - startTime;
        const extracted = typeof aiResult === "string" ? JSON.parse(aiResult) : aiResult;

        await storage.updateDocumentScan(scan.id, {
          documentType: extracted.documentType || "other",
          aiConfidence: extracted.confidence || 0.5,
          extractedData: JSON.stringify(extracted.extractedData || {}),
          processingStatus: "extracted",
          processingTimeMs: processingTime,
          processedAt: new Date().toISOString(),
        });

        res.json({
          success: true,
          scan: {
            id: scan.id,
            documentType: extracted.documentType,
            confidence: extracted.confidence,
            extractedData: extracted.extractedData,
            summary: extracted.summary,
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
          scan: { id: scan.id, status: "failed", error: "AI processing failed - please try again or enter details manually" },
        });
      }
    } catch (error: any) {
      console.error("Error scanning document:", error);
      res.status(400).json({ error: error.message || "Failed to scan document" });
    }
  };

  // Both routes accept FormData (field: "document") or JSON body (documentUrl)
  router.post("/documents/scan", requireAuth, docUpload.single("document"), handleDocumentScan);
  router.post("/documents/analyze", requireAuth, docUpload.single("document"), handleDocumentScan);

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
