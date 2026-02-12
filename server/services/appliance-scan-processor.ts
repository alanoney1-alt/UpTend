/**
 * Appliance Scan Processor
 *
 * AI-powered pipeline for processing appliance photos:
 * 1. Extract brand/model/serial from model plate photos
 * 2. Look up warranty information from manufacturer databases
 * 3. Look up product specifications and pricing
 * 4. Check CPSC recall database
 * 5. Detect duplicates
 * 6. Auto-create appliance records or flag for review
 */

import {
  getApplianceScanById,
  updateApplianceScan,
  markScanAsProcessing,
  markScanAsCompleted,
  findDuplicateAppliance,
  createAppliance,
  getScansBySession,
  updateScanSession,
  createHealthEvent,
  createNotification,
} from "../storage/domains/properties/storage";
import type { InsertPropertyAppliance, InsertPropertyHealthEvent, InsertNotificationQueue } from "../../shared/schema";

// ==========================================
// AI INTEGRATION (Placeholder - integrate with your AI service)
// ==========================================

interface AIExtractionResult {
  brand?: string;
  model?: string;
  serialNumber?: string;
  category?: string;
  subcategory?: string;
  manufacturingDate?: string;
  confidence: {
    overall: number;
    brand: number;
    model: number;
    serial: number;
    category: number;
  };
  rawResponse: any;
}

async function extractFromPhoto(photoUrl: string): Promise<AIExtractionResult> {
  // TODO: Integrate with your AI service (OpenAI Vision, Google Cloud Vision, etc.)
  // For now, return mock data

  // Example integration:
  // const response = await openai.chat.completions.create({
  //   model: "gpt-4-vision-preview",
  //   messages: [{
  //     role: "user",
  //     content: [
  //       { type: "text", text: "Extract brand, model, and serial number from this appliance model plate:" },
  //       { type: "image_url", image_url: { url: photoUrl } }
  //     ]
  //   }]
  // });

  return {
    brand: "Samsung",
    model: "RF28R7351SR",
    serialNumber: "123456789",
    category: "refrigerator",
    subcategory: "french_door_refrigerator",
    confidence: {
      overall: 0.92,
      brand: 0.98,
      model: 0.95,
      serial: 0.88,
      category: 0.96,
    },
    rawResponse: {},
  };
}

interface WarrantyInfo {
  manufacturer: string;
  standardWarrantyMonths: number;
  extendedAvailable: boolean;
  registrationUrl?: string;
  warrantyPdfUrl?: string;
}

async function lookupWarrantyInfo(brand: string, model: string): Promise<WarrantyInfo | null> {
  // TODO: Integrate with manufacturer warranty databases
  // For now, return mock data

  return {
    manufacturer: brand,
    standardWarrantyMonths: 12,
    extendedAvailable: true,
    registrationUrl: `https://${brand.toLowerCase()}.com/warranty-registration`,
  };
}

interface ProductSpecs {
  msrp?: number;
  energyStarCertified: boolean;
  dimensions?: { width: number; height: number; depth: number };
  weight?: number;
  expectedLifespanYears?: number;
  capacity?: string;
}

async function lookupProductSpecs(brand: string, model: string): Promise<ProductSpecs | null> {
  // TODO: Integrate with product databases (Best Buy API, Amazon Product API, etc.)
  // For now, return mock data

  return {
    msrp: 2499,
    energyStarCertified: true,
    expectedLifespanYears: 12,
    capacity: "27.8 cu ft",
  };
}

interface RecallInfo {
  hasActiveRecall: boolean;
  recallId?: string;
  recallDescription?: string;
  recallDate?: string;
  remedyAvailable?: boolean;
  recallUrl?: string;
}

async function checkRecallDatabase(brand: string, model: string): Promise<RecallInfo> {
  // TODO: Integrate with CPSC recall database API
  // https://www.cpsc.gov/Recalls

  return {
    hasActiveRecall: false,
  };
}

// ==========================================
// SCAN PROCESSOR
// ==========================================

export async function processScan(scanId: string): Promise<void> {
  // Mark as processing
  const scan = await markScanAsProcessing(scanId);
  if (!scan) {
    throw new Error(`Scan ${scanId} not found`);
  }

  try {
    // 1. Extract data from photo using AI
    const photoUrl = scan.modelPlatePhotoUrl || scan.fullUnitPhotoUrl || scan.photoUrls[0];
    if (!photoUrl) {
      throw new Error("No photo URL found");
    }

    const extraction = await extractFromPhoto(photoUrl);

    // 2. Look up warranty info
    let warrantyInfo = null;
    if (extraction.brand && extraction.model) {
      warrantyInfo = await lookupWarrantyInfo(extraction.brand, extraction.model);
    }

    // 3. Look up product specs
    let specsInfo = null;
    if (extraction.brand && extraction.model) {
      specsInfo = await lookupProductSpecs(extraction.brand, extraction.model);
    }

    // 4. Check recall database
    let recallInfo = null;
    if (extraction.brand && extraction.model) {
      recallInfo = await checkRecallDatabase(extraction.brand, extraction.model);
    }

    // 5. Update scan with results
    await markScanAsCompleted(scanId, {
      brand: extraction.brand,
      model: extraction.model,
      serial: extraction.serialNumber,
      category: extraction.category,
      confidence: extraction.confidence.overall,
      warrantyInfo,
      specsInfo,
    });

    // 6. Check for duplicates
    let isDuplicate = false;
    let duplicateId: string | undefined;
    if (extraction.brand && extraction.model) {
      const duplicate = await findDuplicateAppliance(
        scan.propertyId,
        extraction.brand,
        extraction.model,
        extraction.serialNumber
      );
      if (duplicate) {
        isDuplicate = true;
        duplicateId = duplicate.id;
        await updateApplianceScan(scanId, {
          isDuplicate: true,
          duplicateOfApplianceId: duplicateId,
          status: "duplicate",
        });
      }
    }

    // 7. If high confidence and not duplicate, auto-create appliance record
    if (extraction.confidence.overall >= 0.85 && !isDuplicate && extraction.brand && extraction.model) {
      const appliance: InsertPropertyAppliance = {
        id: crypto.randomUUID(),
        propertyId: scan.propertyId,
        category: extraction.category || "other",
        subcategory: extraction.subcategory,
        brand: extraction.brand,
        model: extraction.model,
        serialNumber: extraction.serialNumber,
        location: scan.location,
        floor: scan.floor,
        photoUrl: scan.fullUnitPhotoUrl,
        modelPlatePhotoUrl: scan.modelPlatePhotoUrl,
        additionalPhotoUrls: scan.photoUrls,
        scanId: scanId,
        aiExtractedData: extraction.rawResponse,
        aiConfidence: extraction.confidence.overall,
        aiConfidenceBrand: extraction.confidence.brand,
        aiConfidenceModel: extraction.confidence.model,
        aiConfidenceSerial: extraction.confidence.serial,
        aiConfidenceCategory: extraction.confidence.category,
        aiWarrantyLookup: warrantyInfo,
        aiSpecsLookup: specsInfo,
        userVerified: false,
        needsReview: false,
        expectedLifespanYears: specsInfo?.expectedLifespanYears,
        estimatedReplacementCost: specsInfo?.msrp,
        addedBy: scan.scanMethod,
        addedByUserId: scan.scannedByUserId,
        addedByServiceRequestId: scan.serviceRequestId,
        addedByProProfileId: scan.scannedByProProfileId,
        createdAt: new Date().toISOString(),
      };

      const created = await createAppliance(appliance);

      // Link scan to appliance
      await updateApplianceScan(scanId, {
        applianceId: created.id,
      });

      // Create health event
      await createHealthEvent({
        id: crypto.randomUUID(),
        propertyId: scan.propertyId,
        eventType: "appliance_added",
        eventDate: new Date().toISOString(),
        title: `${extraction.brand} ${extraction.category} added`,
        description: `${extraction.brand} ${extraction.model} added via ${scan.scanMethod}`,
        applianceId: created.id,
        serviceRequestId: scan.serviceRequestId,
        photoUrls: scan.photoUrls,
        metadata: {
          scanMethod: scan.scanMethod,
          confidence: extraction.confidence.overall,
        },
        createdAt: new Date().toISOString(),
      });

      // If Pro scan, mark as bonus-eligible
      if (scan.scannedByRole === "pro" && scan.scannedByProProfileId) {
        await updateApplianceScan(scanId, {
          proBonusEligible: true,
          proBonusAmount: 1.0, // $1 bonus per appliance
        });
      }

      // Notify customer if Pro-added
      if (scan.scannedByRole === "pro") {
        await createNotification({
          id: crypto.randomUUID(),
          userId: scan.scannedByUserId,
          propertyId: scan.propertyId,
          notificationType: "appliance_recall", // Using existing type; could add "appliance_added"
          channel: "push",
          title: "New Appliance Added",
          body: `Your Pro added a ${extraction.brand} ${extraction.category} to your registry. Review it now.`,
          deepLink: `/property/${scan.propertyId}/appliances/${created.id}`,
          ctaText: "View Appliance",
          ctaLink: `/property/${scan.propertyId}/appliances`,
          scheduledFor: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: "pending",
          createdAt: new Date().toISOString(),
        });

        // Update scan with notification sent
        await updateApplianceScan(scanId, {
          customerNotifiedAt: new Date().toISOString(),
        });
      }
    }

    // 8. If part of a session, update session stats
    if (scan.scanSessionId) {
      const sessionScans = await getScansBySession(scan.scanSessionId);
      const stats = {
        totalPhotos: sessionScans.length,
        totalAppliancesDetected: sessionScans.filter((s) => s.applianceId).length,
        totalAutoConfirmed: sessionScans.filter((s) => s.autoConfirmed).length,
        totalNeedsReview: sessionScans.filter((s) => s.status === "needs_review").length,
        totalDuplicatesSkipped: sessionScans.filter((s) => s.isDuplicate).length,
        totalNewAppliancesAdded: sessionScans.filter((s) => s.applianceId && s.autoConfirmed).length,
      };

      await updateScanSession(scan.scanSessionId, stats);

      // If all scans in session are processed, mark session as completed
      const allProcessed = sessionScans.every((s) => s.aiProcessingStatus === "completed");
      if (allProcessed) {
        await updateScanSession(scan.scanSessionId, {
          status: "completed",
          processingCompletedAt: new Date().toISOString(),
        });
      }
    }

    console.log(`[ApplianceScan] Processed scan ${scanId}: ${extraction.brand} ${extraction.model} (${extraction.confidence.overall})`);
  } catch (error) {
    console.error(`[ApplianceScan] Error processing scan ${scanId}:`, error);

    await updateApplianceScan(scanId, {
      aiProcessingStatus: "failed",
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      retryCount: (scan.retryCount || 0) + 1,
    });

    // Retry if under max retries
    if ((scan.retryCount || 0) < (scan.maxRetries || 3)) {
      await updateApplianceScan(scanId, {
        aiProcessingStatus: "queued",
      });
    }
  }
}

// ==========================================
// BATCH PROCESSOR (Called by CRON)
// ==========================================

export async function processQueuedScans(): Promise<number> {
  const { getScansPendingProcessing } = await import("../storage/domains/properties/storage");
  let scans;
  try {
    scans = await getScansPendingProcessing();
  } catch (error: any) {
    // Gracefully handle missing table (e.g., appliance_scans not created yet)
    if (error?.code === '42P01') {
      return 0;
    }
    throw error;
  }

  console.log(`[ApplianceScan] Processing ${scans.length} queued scans...`);

  let processed = 0;
  for (const scan of scans) {
    try {
      await processScan(scan.id);
      processed++;
    } catch (error) {
      console.error(`[ApplianceScan] Failed to process scan ${scan.id}:`, error);
    }
  }

  console.log(`[ApplianceScan] Processed ${processed}/${scans.length} scans`);
  return processed;
}
