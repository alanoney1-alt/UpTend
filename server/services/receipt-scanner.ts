/**
 * Receipt Scanner Service
 *
 * Uses GPT-5.2 vision to extract purchase data from receipt photos.
 * Auto-creates warranty registrations for big-ticket items.
 * Links purchases to existing appliance profiles when replacements detected.
 */

import { analyzeImages } from "./ai/openai-vision-client.js";
import { pool } from "../db.js";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ReceiptItem {
  name: string;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  category: "appliance" | "tool" | "supply" | "material" | "hardware" | "plumbing" | "electrical" | "hvac" | "paint" | "outdoor";
  price: number;
  quantity: number;
  warrantyYears: number | null;
  warrantyExpires: string | null;
}

export interface ReceiptScanResult {
  store: string;
  storeNormalized: string;
  date: string | null;
  items: ReceiptItem[];
  totalAmount: number | null;
  paymentMethod: string | null;
  rawText: string | null;
}

const STORE_MAP: Record<string, string> = {
  "lowe's": "lowes",
  "lowes": "lowes",
  "home depot": "home_depot",
  "the home depot": "home_depot",
  "walmart": "walmart",
  "amazon": "amazon",
  "costco": "costco",
  "ace hardware": "ace",
  "ace": "ace",
  "menards": "menards",
};

function normalizeStore(store: string): string {
  const lower = store.toLowerCase().trim();
  return STORE_MAP[lower] || "other";
}

const BIG_TICKET_CATEGORIES = new Set(["appliance", "hvac", "plumbing"]);
const BIG_TICKET_THRESHOLD = 100;

// ─── Core Functions ──────────────────────────────────────────────────────────

/**
 * Scan a receipt photo using GPT-5.2 vision
 */
export async function scanReceipt(photoUrl: string): Promise<ReceiptScanResult> {
  const result = await analyzeImages({
    imageUrls: [photoUrl],
    prompt: `Extract all items from this receipt. For each item return: name, brand, model number (if visible), category (appliance/tool/supply/material/hardware/plumbing/electrical/hvac/paint/outdoor), price, quantity. Also return: store name, date, total amount, payment method. If any items are appliances or systems, extract warranty-relevant details.

Return JSON:
{
  "store": "store name",
  "date": "YYYY-MM-DD" or null,
  "items": [
    {
      "name": "item name",
      "brand": "brand" or null,
      "model": "model number" or null,
      "serialNumber": null,
      "category": "appliance|tool|supply|material|hardware|plumbing|electrical|hvac|paint|outdoor",
      "price": 29.99,
      "quantity": 1,
      "warrantyYears": number or null,
      "warrantyExpires": null
    }
  ],
  "totalAmount": 123.45 or null,
  "paymentMethod": "visa|mastercard|cash|debit|amex|discover" or null,
  "rawText": "raw receipt text if readable"
}`,
    systemPrompt: "You are an expert receipt reader. Extract every item with maximum accuracy. Normalize prices to numbers. If brand/model aren't visible, return null. Be precise with item names — use the exact text from the receipt.",
    jsonMode: true,
  });

  return {
    store: result.store || "Unknown",
    storeNormalized: normalizeStore(result.store || ""),
    date: result.date || null,
    items: (result.items || []).map((item: any) => ({
      name: item.name || "Unknown Item",
      brand: item.brand || null,
      model: item.model || null,
      serialNumber: item.serialNumber || null,
      category: item.category || "supply",
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      warrantyYears: item.warrantyYears || null,
      warrantyExpires: item.warrantyExpires || null,
    })),
    totalAmount: result.totalAmount ? Number(result.totalAmount) : null,
    paymentMethod: result.paymentMethod || null,
    rawText: result.rawText || null,
  };
}

/**
 * Process scanned receipt items: store purchase + auto-create warranties
 */
export async function processReceiptItems(
  customerId: string,
  items: ReceiptItem[],
  store: string,
  date: string | null
): Promise<{ purchaseId: string; warrantiesCreated: number }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Insert purchase record
    const purchaseResult = await client.query(
      `INSERT INTO customer_purchases (customer_id, store, purchase_date, items, total_amount, source, processed_by_ai)
       VALUES ($1, $2, $3, $4, $5, 'receipt_photo', true)
       RETURNING id`,
      [
        customerId,
        normalizeStore(store),
        date || new Date().toISOString(),
        JSON.stringify(items),
        items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      ]
    );
    const purchaseId = purchaseResult.rows[0].id;

    // Auto-create warranty registrations for big-ticket items
    let warrantiesCreated = 0;
    for (const item of items) {
      if (BIG_TICKET_CATEGORIES.has(item.category) && item.price >= BIG_TICKET_THRESHOLD) {
        const warrantyYears = item.warrantyYears || 1;
        const purchaseDate = date ? new Date(date) : new Date();
        const warrantyExpires = new Date(purchaseDate);
        warrantyExpires.setFullYear(warrantyExpires.getFullYear() + warrantyYears);

        await client.query(
          `INSERT INTO warranty_registrations
           (customer_id, purchase_id, product_name, brand, model, serial_number, purchase_date, warranty_type, warranty_duration, warranty_expires, registration_confirmed)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'manufacturer', $8, $9, false)`,
          [
            customerId,
            purchaseId,
            item.name,
            item.brand,
            item.model,
            item.serialNumber,
            purchaseDate.toISOString(),
            warrantyYears * 12,
            warrantyExpires.toISOString(),
          ]
        );
        warrantiesCreated++;
      }
    }

    await client.query("COMMIT");
    return { purchaseId, warrantiesCreated };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Match a purchase item to an existing appliance in the home profile.
 * Detects replacements (e.g., bought new water heater → links to existing profile).
 */
export async function matchPurchaseToAppliance(
  purchaseItem: ReceiptItem,
  homeProfileId: string
): Promise<{ matched: boolean; applianceType: string | null; action: string | null }> {
  const itemName = purchaseItem.name.toLowerCase();
  const category = purchaseItem.category;

  // Check water heater match
  if (category === "plumbing" || itemName.includes("water heater") || itemName.includes("hot water")) {
    const { rows } = await pool.query(
      `SELECT id FROM water_heater_profiles WHERE customer_id = (SELECT customer_id FROM home_profiles WHERE id = $1 LIMIT 1)`,
      [homeProfileId]
    );
    if (rows.length > 0) {
      return { matched: true, applianceType: "water_heater", action: "replacement_detected" };
    }
  }

  // Check HVAC match
  if (category === "hvac" || itemName.includes("hvac") || itemName.includes("air conditioner") || itemName.includes("furnace")) {
    return { matched: true, applianceType: "hvac", action: "replacement_or_part" };
  }

  // Check garage door match
  if (itemName.includes("garage door") || itemName.includes("garage opener")) {
    const { rows } = await pool.query(
      `SELECT id FROM garage_door_profiles WHERE customer_id = (SELECT customer_id FROM home_profiles WHERE id = $1 LIMIT 1)`,
      [homeProfileId]
    );
    if (rows.length > 0) {
      return { matched: true, applianceType: "garage_door", action: "replacement_detected" };
    }
  }

  return { matched: false, applianceType: null, action: null };
}
