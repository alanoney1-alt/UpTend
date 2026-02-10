import express from "express";
import { auth } from "../../middleware/auth";
import {
  createAppliance,
  getApplianceById,
  getAppliancesByProperty,
  getAppliancesByCategory,
  getAppliancesByLocation,
  getAppliancesNeedingReview,
  updateAppliance,
  replaceAppliance,
  createApplianceScan,
  getScansByProperty,
  getScansBySession,
  updateApplianceScan,
  createScanSession,
  getScanSessionById,
  updateScanSession,
  completeScanSession,
  getPropertyById,
  createHealthEvent,
} from "../../storage/domains/properties/storage";
import { processScan } from "../../services/appliance-scan-processor";
import type { InsertPropertyAppliance, InsertApplianceScan, InsertApplianceScanSession } from "../../../shared/schema";

const router = express.Router();

/**
 * GET /api/properties/:propertyId/appliances
 * Get all appliances for a property
 */
router.get("/:propertyId/appliances", auth, async (req, res) => {
  try {
    const property = await getPropertyById(req.params.propertyId);
    if (!property || property.userId !== req.user!.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const appliances = await getAppliancesByProperty(req.params.propertyId);
    res.json(appliances);
  } catch (error) {
    console.error("Error fetching appliances:", error);
    res.status(500).json({ error: "Failed to fetch appliances" });
  }
});

/**
 * GET /api/properties/:propertyId/appliances/category/:category
 * Get appliances by category
 */
router.get("/:propertyId/appliances/category/:category", auth, async (req, res) => {
  try {
    const property = await getPropertyById(req.params.propertyId);
    if (!property || property.userId !== req.user!.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const appliances = await getAppliancesByCategory(req.params.propertyId, req.params.category);
    res.json(appliances);
  } catch (error) {
    console.error("Error fetching appliances by category:", error);
    res.status(500).json({ error: "Failed to fetch appliances" });
  }
});

/**
 * GET /api/properties/:propertyId/appliances/location/:location
 * Get appliances by location
 */
router.get("/:propertyId/appliances/location/:location", auth, async (req, res) => {
  try {
    const property = await getPropertyById(req.params.propertyId);
    if (!property || property.userId !== req.user!.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const appliances = await getAppliancesByLocation(req.params.propertyId, req.params.location);
    res.json(appliances);
  } catch (error) {
    console.error("Error fetching appliances by location:", error);
    res.status(500).json({ error: "Failed to fetch appliances" });
  }
});

/**
 * GET /api/properties/:propertyId/appliances/needs-review
 * Get appliances needing user review
 */
router.get("/:propertyId/appliances/needs-review", auth, async (req, res) => {
  try {
    const property = await getPropertyById(req.params.propertyId);
    if (!property || property.userId !== req.user!.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const appliances = await getAppliancesNeedingReview(req.params.propertyId);
    res.json(appliances);
  } catch (error) {
    console.error("Error fetching appliances needing review:", error);
    res.status(500).json({ error: "Failed to fetch appliances" });
  }
});

/**
 * POST /api/properties/:propertyId/appliances
 * Manually add an appliance
 */
router.post("/:propertyId/appliances", auth, async (req, res) => {
  try {
    const property = await getPropertyById(req.params.propertyId);
    if (!property || property.userId !== req.user!.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const applianceData: InsertPropertyAppliance = {
      id: crypto.randomUUID(),
      propertyId: req.params.propertyId,
      ...req.body,
      addedBy: "manual",
      addedByUserId: req.user!.id,
      createdAt: new Date().toISOString(),
    };

    const appliance = await createAppliance(applianceData);

    // Create health event
    await createHealthEvent({
      id: crypto.randomUUID(),
      propertyId: req.params.propertyId,
      eventType: "appliance_added",
      eventDate: new Date().toISOString(),
      title: `${appliance.brand || ""} ${appliance.category} added`,
      description: `Manually added ${appliance.brand || ""} ${appliance.model || ""} ${appliance.category}`,
      applianceId: appliance.id,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json(appliance);
  } catch (error) {
    console.error("Error creating appliance:", error);
    res.status(500).json({ error: "Failed to create appliance" });
  }
});

/**
 * GET /api/appliances/:id
 * Get a specific appliance
 */
router.get("/appliances/:id", auth, async (req, res) => {
  try {
    const appliance = await getApplianceById(req.params.id);
    if (!appliance) {
      return res.status(404).json({ error: "Appliance not found" });
    }

    const property = await getPropertyById(appliance.propertyId);
    if (!property || property.userId !== req.user!.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(appliance);
  } catch (error) {
    console.error("Error fetching appliance:", error);
    res.status(500).json({ error: "Failed to fetch appliance" });
  }
});

/**
 * PATCH /api/appliances/:id
 * Update an appliance
 */
router.patch("/appliances/:id", auth, async (req, res) => {
  try {
    const appliance = await getApplianceById(req.params.id);
    if (!appliance) {
      return res.status(404).json({ error: "Appliance not found" });
    }

    const property = await getPropertyById(appliance.propertyId);
    if (!property || property.userId !== req.user!.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updated = await updateAppliance(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    console.error("Error updating appliance:", error);
    res.status(500).json({ error: "Failed to update appliance" });
  }
});

/**
 * POST /api/appliances/:id/replace
 * Replace an appliance with a new one
 */
router.post("/appliances/:id/replace", auth, async (req, res) => {
  try {
    const oldAppliance = await getApplianceById(req.params.id);
    if (!oldAppliance) {
      return res.status(404).json({ error: "Appliance not found" });
    }

    const property = await getPropertyById(oldAppliance.propertyId);
    if (!property || property.userId !== req.user!.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const newApplianceData: InsertPropertyAppliance = {
      id: crypto.randomUUID(),
      propertyId: oldAppliance.propertyId,
      ...req.body,
      addedBy: "manual",
      addedByUserId: req.user!.id,
      createdAt: new Date().toISOString(),
    };

    const newAppliance = await replaceAppliance(req.params.id, newApplianceData);

    // Create health event
    await createHealthEvent({
      id: crypto.randomUUID(),
      propertyId: oldAppliance.propertyId,
      eventType: "appliance_replaced",
      eventDate: new Date().toISOString(),
      title: `${newAppliance.brand || ""} ${newAppliance.category} replaced`,
      description: `Replaced ${oldAppliance.brand || ""} ${oldAppliance.category} with ${newAppliance.brand || ""} ${newAppliance.model || ""}`,
      applianceId: newAppliance.id,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json(newAppliance);
  } catch (error) {
    console.error("Error replacing appliance:", error);
    res.status(500).json({ error: "Failed to replace appliance" });
  }
});

// ==========================================
// APPLIANCE SCANNING
// ==========================================

/**
 * POST /api/properties/:propertyId/appliances/scan
 * Upload photos and create a scan
 */
router.post("/:propertyId/appliances/scan", auth, async (req, res) => {
  try {
    const property = await getPropertyById(req.params.propertyId);
    if (!property || property.userId !== req.user!.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const scanData: InsertApplianceScan = {
      id: crypto.randomUUID(),
      propertyId: req.params.propertyId,
      scanMethod: "customer_self_scan",
      scannedByUserId: req.user!.id,
      scannedByRole: "customer",
      ...req.body,
      scannedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const scan = await createApplianceScan(scanData);

    // Trigger AI processing asynchronously
    processScan(scan.id).catch((error) => {
      console.error(`Failed to process scan ${scan.id}:`, error);
    });

    res.status(201).json(scan);
  } catch (error) {
    console.error("Error creating scan:", error);
    res.status(500).json({ error: "Failed to create scan" });
  }
});

/**
 * POST /api/properties/:propertyId/appliances/scan-session/start
 * Start a batch scan session
 */
router.post("/:propertyId/appliances/scan-session/start", auth, async (req, res) => {
  try {
    const property = await getPropertyById(req.params.propertyId);
    if (!property || property.userId !== req.user!.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const sessionData: InsertApplianceScanSession = {
      id: crypto.randomUUID(),
      propertyId: req.params.propertyId,
      initiatedBy: "customer",
      initiatedByUserId: req.user!.id,
      sessionType: req.body.sessionType || "full_home_scan",
      guidedFlow: req.body.guidedFlow !== false,
      status: "in_progress",
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const session = await createScanSession(sessionData);
    res.status(201).json(session);
  } catch (error) {
    console.error("Error starting scan session:", error);
    res.status(500).json({ error: "Failed to start scan session" });
  }
});

/**
 * POST /api/appliance-scan-sessions/:sessionId/photo
 * Add a photo to an in-progress scan session
 */
router.post("/appliance-scan-sessions/:sessionId/photo", auth, async (req, res) => {
  try {
    const session = await getScanSessionById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const property = await getPropertyById(session.propertyId);
    if (!property || property.userId !== req.user!.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (session.status !== "in_progress") {
      return res.status(400).json({ error: "Session is not in progress" });
    }

    // Get current scan count in session
    const sessionScans = await getScansBySession(req.params.sessionId);
    const sequence = sessionScans.length + 1;

    const scanData: InsertApplianceScan = {
      id: crypto.randomUUID(),
      propertyId: session.propertyId,
      scanSessionId: req.params.sessionId,
      scanSessionSequence: sequence,
      scanMethod: "customer_self_scan",
      scannedByUserId: req.user!.id,
      scannedByRole: "customer",
      ...req.body,
      scannedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const scan = await createApplianceScan(scanData);

    // Trigger AI processing
    processScan(scan.id).catch((error) => {
      console.error(`Failed to process scan ${scan.id}:`, error);
    });

    res.status(201).json(scan);
  } catch (error) {
    console.error("Error adding photo to session:", error);
    res.status(500).json({ error: "Failed to add photo" });
  }
});

/**
 * POST /api/appliance-scan-sessions/:sessionId/complete
 * Complete a scan session
 */
router.post("/appliance-scan-sessions/:sessionId/complete", auth, async (req, res) => {
  try {
    const session = await getScanSessionById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const property = await getPropertyById(session.propertyId);
    if (!property || property.userId !== req.user!.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const completed = await completeScanSession(req.params.sessionId);
    res.json(completed);
  } catch (error) {
    console.error("Error completing scan session:", error);
    res.status(500).json({ error: "Failed to complete session" });
  }
});

/**
 * GET /api/appliance-scan-sessions/:sessionId/results
 * Get results of a completed scan session
 */
router.get("/appliance-scan-sessions/:sessionId/results", auth, async (req, res) => {
  try {
    const session = await getScanSessionById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const property = await getPropertyById(session.propertyId);
    if (!property || property.userId !== req.user!.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const scans = await getScansBySession(req.params.sessionId);
    res.json({
      session,
      scans,
    });
  } catch (error) {
    console.error("Error fetching session results:", error);
    res.status(500).json({ error: "Failed to fetch results" });
  }
});

/**
 * POST /api/appliance-scans/:scanId/confirm
 * Confirm AI extraction results
 */
router.post("/appliance-scans/:scanId/confirm", auth, async (req, res) => {
  try {
    const scan = await getApplianceScanById(req.params.scanId);
    if (!scan) {
      return res.status(404).json({ error: "Scan not found" });
    }

    const property = await getPropertyById(scan.propertyId);
    if (!property || property.userId !== req.user!.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const updated = await updateApplianceScan(req.params.scanId, {
      userConfirmed: true,
      userReviewedAt: new Date().toISOString(),
      status: "confirmed",
    });

    // If appliance was created, mark as user-verified
    if (scan.applianceId) {
      await updateAppliance(scan.applianceId, {
        userVerified: true,
        userVerifiedAt: new Date().toISOString(),
        needsReview: false,
      });
    }

    res.json(updated);
  } catch (error) {
    console.error("Error confirming scan:", error);
    res.status(500).json({ error: "Failed to confirm scan" });
  }
});

/**
 * POST /api/appliance-scans/:scanId/edit
 * Edit AI extraction results
 */
router.post("/appliance-scans/:scanId/edit", auth, async (req, res) => {
  try {
    const scan = await getApplianceScanById(req.params.scanId);
    if (!scan) {
      return res.status(404).json({ error: "Scan not found" });
    }

    const property = await getPropertyById(scan.propertyId);
    if (!property || property.userId !== req.user!.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { brand, model, serialNumber, category } = req.body;

    // Track edits
    const edits: Record<string, any> = {};
    if (brand !== scan.aiExtractedBrand) edits.brand = { from: scan.aiExtractedBrand, to: brand };
    if (model !== scan.aiExtractedModel) edits.model = { from: scan.aiExtractedModel, to: model };
    if (serialNumber !== scan.aiExtractedSerial) edits.serialNumber = { from: scan.aiExtractedSerial, to: serialNumber };
    if (category !== scan.aiExtractedCategory) edits.category = { from: scan.aiExtractedCategory, to: category };

    const updated = await updateApplianceScan(req.params.scanId, {
      userConfirmed: true,
      userReviewedAt: new Date().toISOString(),
      userEdits: edits,
      status: "confirmed",
    });

    // Update appliance if exists
    if (scan.applianceId) {
      await updateAppliance(scan.applianceId, {
        brand,
        model,
        serialNumber,
        category,
        userVerified: true,
        userVerifiedAt: new Date().toISOString(),
        needsReview: false,
      });
    }

    res.json(updated);
  } catch (error) {
    console.error("Error editing scan:", error);
    res.status(500).json({ error: "Failed to edit scan" });
  }
});

/**
 * GET /api/properties/:propertyId/appliance-scans
 * Get scan history for a property
 */
router.get("/:propertyId/appliance-scans", auth, async (req, res) => {
  try {
    const property = await getPropertyById(req.params.propertyId);
    if (!property || property.userId !== req.user!.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const scans = await getScansByProperty(req.params.propertyId);
    res.json(scans);
  } catch (error) {
    console.error("Error fetching scans:", error);
    res.status(500).json({ error: "Failed to fetch scans" });
  }
});

export default router;
