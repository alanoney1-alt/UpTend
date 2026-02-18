/**
 * Purchase & Receipt Tracking Routes + Home Appliance Profile Routes
 */

import { Router, type Express } from "express";
import { pool } from "../db.js";
import { scanReceipt, processReceiptItems } from "../services/receipt-scanner.js";
import { getEmailAuthUrl, handleEmailCallback, scanForReceipts } from "../services/email-receipt-scanner.js";
import { getConnectedRetailers } from "../services/retailer-connect.js";
import {
  getGarageDoorProfile,
  getWaterHeaterProfile,
  getMaintenanceLog,
  addMaintenanceEntry,
  getMaintenanceDue,
} from "../services/appliance-profiles.js";

const router = Router();

// ─── Receipt Scanning ────────────────────────────────────────────────────────

router.post("/purchases/scan-receipt", async (req, res) => {
  try {
    const { customerId, photoUrl } = req.body;
    if (!customerId || !photoUrl) {
      return res.status(400).json({ error: "customerId and photoUrl required" });
    }

    const scanResult = await scanReceipt(photoUrl);
    const { purchaseId, warrantiesCreated } = await processReceiptItems(
      customerId,
      scanResult.items,
      scanResult.storeNormalized,
      scanResult.date
    );

    // Update receipt URL on the purchase
    await pool.query(
      `UPDATE customer_purchases SET receipt_url = $1, raw_ocr_text = $2 WHERE id = $3`,
      [photoUrl, scanResult.rawText, purchaseId]
    );

    res.json({
      success: true,
      purchaseId,
      store: scanResult.store,
      itemCount: scanResult.items.length,
      totalAmount: scanResult.totalAmount,
      warrantiesCreated,
      items: scanResult.items,
    });
  } catch (error: any) {
    console.error("[Purchases] Scan receipt error:", error.message);
    res.status(500).json({ error: "Failed to scan receipt" });
  }
});

// ─── Purchase History ────────────────────────────────────────────────────────

router.get("/purchases/:customerId", async (req, res) => {
  try {
    const { customerId } = req.params;
    const { store, limit = "50" } = req.query;

    let query = `SELECT * FROM customer_purchases WHERE customer_id = $1`;
    const params: any[] = [customerId];

    if (store) {
      query += ` AND store = $${params.length + 1}`;
      params.push(store);
    }

    query += ` ORDER BY purchase_date DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit as string));

    const { rows } = await pool.query(query, params);
    res.json({ purchases: rows });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to get purchases" });
  }
});

// ─── Warranties ──────────────────────────────────────────────────────────────

router.get("/purchases/warranties/:customerId", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM warranty_registrations WHERE customer_id = $1 ORDER BY warranty_expires ASC`,
      [req.params.customerId]
    );
    res.json({ warranties: rows });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to get warranties" });
  }
});

router.post("/purchases/warranty-register", async (req, res) => {
  try {
    const { customerId, productName, brand, model, serialNumber, purchaseDate, warrantyType, warrantyDuration, warrantyExpires, receiptUrl, notes } = req.body;
    if (!customerId || !productName) {
      return res.status(400).json({ error: "customerId and productName required" });
    }

    const { rows } = await pool.query(
      `INSERT INTO warranty_registrations
       (customer_id, product_name, brand, model, serial_number, purchase_date, warranty_type, warranty_duration, warranty_expires, receipt_url, registration_confirmed, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11)
       RETURNING *`,
      [customerId, productName, brand, model, serialNumber, purchaseDate, warrantyType || "manufacturer", warrantyDuration, warrantyExpires, receiptUrl, notes]
    );
    res.json({ warranty: rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to register warranty" });
  }
});

// ─── Retailer Connections ────────────────────────────────────────────────────

router.get("/purchases/retailers/:customerId", async (req, res) => {
  try {
    const retailers = await getConnectedRetailers(req.params.customerId);
    res.json({ retailers });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to get retailers" });
  }
});

router.post("/purchases/connect-email", async (req, res) => {
  try {
    const { customerId, provider } = req.body;
    const authUrl = getEmailAuthUrl(customerId, provider);
    res.json({ authUrl });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to get auth URL" });
  }
});

router.get("/purchases/email-callback", async (req, res) => {
  try {
    const { code, state: customerId } = req.query;
    const result = await handleEmailCallback(code as string, customerId as string);
    if (result.success) {
      res.redirect("/dashboard?emailConnected=true");
    } else {
      res.redirect(`/dashboard?emailError=${encodeURIComponent(result.error || "unknown")}`);
    }
  } catch (error: any) {
    res.redirect("/dashboard?emailError=callback_failed");
  }
});

// ─── Home Appliance Profiles ─────────────────────────────────────────────────

router.get("/home/garage-door/:customerId", async (req, res) => {
  try {
    const profile = await getGarageDoorProfile(req.params.customerId);
    res.json({ profile });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to get garage door profile" });
  }
});

router.get("/home/water-heater/:customerId", async (req, res) => {
  try {
    const profile = await getWaterHeaterProfile(req.params.customerId);
    res.json({ profile });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to get water heater profile" });
  }
});

router.get("/home/maintenance-log/:customerId", async (req, res) => {
  try {
    const { applianceType } = req.query;
    const log = await getMaintenanceLog(req.params.customerId, applianceType as string);
    res.json({ log });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to get maintenance log" });
  }
});

router.post("/home/maintenance-log", async (req, res) => {
  try {
    const { customerId, ...entry } = req.body;
    if (!customerId || !entry.maintenanceType || !entry.applianceOrSystem || !entry.performedAt) {
      return res.status(400).json({ error: "customerId, maintenanceType, applianceOrSystem, and performedAt required" });
    }
    const result = await addMaintenanceEntry(customerId, entry);
    res.json({ entry: result });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to add maintenance entry" });
  }
});

router.get("/home/maintenance-due/:customerId", async (req, res) => {
  try {
    const due = await getMaintenanceDue(req.params.customerId);
    res.json(due);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to get maintenance due" });
  }
});

// ─── Register ────────────────────────────────────────────────────────────────

export function registerPurchaseRoutes(app: Express) {
  app.use("/api", router);
}
