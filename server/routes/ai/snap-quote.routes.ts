/**
 * Snap & Book — Photo to Booked Pro in 60 seconds
 * AI vision quotes with Price Protection Guarantee
 */

import { Router, type Express } from "express";
import { nanoid } from "nanoid";
import { analyzeImages } from "../../services/ai/openai-vision-client";
import { calculateServicePrice, getServiceLabel } from "../../services/pricing";
import { pool } from "../../db";

const router = Router();

// ─── DB Table Init ───────────────────────────────────────────────────────────

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS snap_quotes (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
        customer_id VARCHAR,
        image_url TEXT,
        service_type TEXT,
        confidence TEXT,
        analysis TEXT,
        quoted_price REAL,
        adjustments TEXT,
        status TEXT DEFAULT 'quoted',
        booked_service_request_id VARCHAR,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    tableReady = true;
  } catch (err) {
    console.error("[SnapQuote] Table init error:", err);
  }
}

// ─── Pricing Logic ───────────────────────────────────────────────────────────

interface VisionAnalysis {
  serviceType: string;
  scopeDescription: string;
  estimatedHours: number;
  confidence: "high" | "medium" | "low";
  details: Record<string, any>;
}

const BASE_PRICES: Record<string, number> = {
  junk_removal: 99,
  home_cleaning: 99,
  carpet_cleaning: 100,
  pressure_washing: 120,
  landscaping: 59,
  pool_cleaning: 99,
  handyman: 75,
  gutter_cleaning: 129,
  moving_labor: 260,
  garage_cleanout: 129,
  light_demolition: 199,
  home_consultation: 99,
};

function buildQuote(analysis: VisionAnalysis) {
  const base = BASE_PRICES[analysis.serviceType] || 99;
  const adjustments: Array<{ label: string; amount: number }> = [];
  let total = base;
  const d = analysis.details || {};

  switch (analysis.serviceType) {
    case "gutter_cleaning": {
      const stories = d.storyCount || 1;
      if (stories >= 3) { total = 350; }
      else if (stories === 2) {
        total = d.linearFeet > 150 ? 259 : 199;
        adjustments.push({ label: "2-story surcharge", amount: total - 129 });
      } else {
        total = d.linearFeet > 150 ? 179 : 129;
      }
      break;
    }
    case "junk_removal": {
      const vol = (d.volume || "").toLowerCase();
      if (vol.includes("full")) { total = 299; adjustments.push({ label: "Full truck load", amount: 200 }); }
      else if (vol.includes("half") || vol.includes("medium")) { total = 99; }
      if (d.heavyItems) { adjustments.push({ label: "Heavy items surcharge", amount: 50 }); total += 50; }
      break;
    }
    case "home_cleaning": {
      const beds = d.bedrooms || 2;
      if (beds >= 4) { total = 199; adjustments.push({ label: "4+ bedroom home", amount: 100 }); }
      else if (beds === 3) { total = 149; adjustments.push({ label: "3 bedroom home", amount: 50 }); }
      break;
    }
    case "carpet_cleaning": {
      const rooms = d.rooms || 2;
      const tier = d.tier || "standard";
      const perRoom = tier === "pet" ? 89 : tier === "deep" ? 75 : 50;
      total = Math.max(rooms * perRoom, 100);
      if (rooms > 1) adjustments.push({ label: `${rooms} rooms at $${perRoom}/room`, amount: total - perRoom });
      break;
    }
    case "pressure_washing": {
      const area = (d.area || "").toLowerCase();
      if (area.includes("house")) { total = 250; adjustments.push({ label: "Full house exterior", amount: 130 }); }
      else if (area.includes("deck")) { total = 150; adjustments.push({ label: "Deck surface", amount: 30 }); }
      break;
    }
    case "landscaping": {
      const scope = (d.scope || "").toLowerCase();
      if (scope.includes("cleanup") || scope.includes("overgrown")) { total = 149; adjustments.push({ label: "Yard cleanup", amount: 90 }); }
      else if (scope.includes("full")) { total = 149; adjustments.push({ label: "Full service", amount: 90 }); }
      break;
    }
    case "moving_labor": {
      const movers = d.movers || 2;
      const hours = Math.max(d.hours || 2, 2);
      total = movers * hours * 65;
      adjustments.push({ label: `${movers} movers x ${hours} hrs at $65/hr`, amount: total - 260 });
      break;
    }
    case "handyman": {
      const hours = Math.max(d.hours || analysis.estimatedHours || 1, 1);
      total = hours * 75;
      if (hours > 1) adjustments.push({ label: `${hours} hours estimated`, amount: (hours - 1) * 75 });
      break;
    }
    case "pool_cleaning": {
      const condition = (d.condition || "").toLowerCase();
      if (condition.includes("green") || condition.includes("neglect")) { total = 249; adjustments.push({ label: "Deep clean (neglected pool)", amount: 150 }); }
      break;
    }
    case "garage_cleanout": {
      const size = (d.size || "").toLowerCase();
      if (size.includes("3") || size.includes("large")) { total = 199; adjustments.push({ label: "Large garage", amount: 70 }); }
      break;
    }
    default:
      break;
  }

  return {
    basePrice: base,
    adjustments,
    totalPrice: total,
    priceDisplay: `$${total}`,
    guarantee: "Price Protection Guarantee -- this is your maximum price",
  };
}

// ─── POST /api/snap-quote ────────────────────────────────────────────────────

router.post("/snap-quote", async (req, res) => {
  try {
    await ensureTable();
    const { imageBase64, description, address } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, error: "imageBase64 is required" });
    }

    const imageUrl = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;

    // Vision analysis
    let analysis: VisionAnalysis;
    try {
      const visionPrompt = `Analyze this photo of a home service issue. Determine:
1. What service is needed (must be one of: junk_removal, home_cleaning, carpet_cleaning, pressure_washing, landscaping, pool_cleaning, handyman, gutter_cleaning, moving_labor, garage_cleanout, light_demolition, home_consultation)
2. Scope/severity description
3. Estimated labor hours
4. Confidence level (high/medium/low) in your assessment
5. Any visible details that affect pricing (square footage, story count, debris level, room count, etc.)
${description ? `Customer description: "${description}"` : ""}
${address ? `Property address: ${address}` : ""}

Return JSON:
{
  "serviceType": "one_of_the_12_types",
  "scopeDescription": "what you see",
  "estimatedHours": number,
  "confidence": "high" | "medium" | "low",
  "details": { any relevant pricing details like storyCount, volume, bedrooms, rooms, area, scope, condition, size, heavyItems, movers, hours, linearFeet, tier }
}`;

      const result = await analyzeImages({
        imageUrls: [imageUrl],
        prompt: visionPrompt,
        jsonMode: true,
        maxTokens: 1024,
      });

      if (result._mock) {
        analysis = {
          serviceType: "handyman",
          scopeDescription: "Unable to analyze image without API key configured",
          estimatedHours: 1,
          confidence: "low",
          details: {},
        };
      } else {
        analysis = {
          serviceType: result.serviceType || "handyman",
          scopeDescription: result.scopeDescription || result.analysis || "Service issue detected",
          estimatedHours: result.estimatedHours || 1,
          confidence: result.confidence || "medium",
          details: result.details || {},
        };
      }
    } catch (err: any) {
      console.error("[SnapQuote] Vision error:", err.message);
      analysis = {
        serviceType: "handyman",
        scopeDescription: "Could not analyze image. Please describe the issue.",
        estimatedHours: 1,
        confidence: "low",
        details: {},
      };
    }

    const quote = buildQuote(analysis);
    const snapQuoteId = nanoid(12);
    const user = req.user as any;
    const customerId = user?.userId || user?.id || null;

    // Store in DB
    try {
      await pool.query(
        `INSERT INTO snap_quotes (id, customer_id, image_url, service_type, confidence, analysis, quoted_price, adjustments, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          snapQuoteId,
          customerId,
          "stored", // Don't store full base64 in DB
          analysis.serviceType,
          analysis.confidence,
          JSON.stringify(analysis),
          quote.totalPrice,
          JSON.stringify(quote.adjustments),
          "quoted",
        ]
      );
    } catch (err) {
      console.error("[SnapQuote] DB save error:", err);
    }

    const bookingUrl = `/book?service=${analysis.serviceType}&price=${quote.totalPrice}&snapQuoteId=${snapQuoteId}`;

    const response: any = {
      success: true,
      confidence: analysis.confidence,
      analysis: {
        serviceType: analysis.serviceType,
        serviceLabel: getServiceLabel(analysis.serviceType),
        problemDescription: analysis.scopeDescription,
        scopeEstimate: analysis.scopeDescription,
        estimatedHours: analysis.estimatedHours,
      },
      quote,
      bookingUrl,
      snapQuoteId,
    };

    if (analysis.confidence === "low") {
      response.fallbackMessage = "Tell George more about the issue so we can give you an accurate quote.";
    }

    return res.json(response);
  } catch (error: any) {
    console.error("[SnapQuote] Error:", error);
    return res.status(500).json({ success: false, error: "Failed to analyze photo" });
  }
});

// ─── POST /api/snap-quote/:id/book ──────────────────────────────────────────

router.post("/snap-quote/:id/book", async (req, res) => {
  try {
    await ensureTable();
    const { id } = req.params;
    const { scheduledDate, scheduledTime, paymentMethodId } = req.body;
    const user = req.user as any;

    if (!user) {
      return res.status(401).json({ success: false, error: "Login required to book" });
    }

    // Load snap quote
    const result = await pool.query("SELECT * FROM snap_quotes WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Quote not found" });
    }

    const snapQuote = result.rows[0];
    if (snapQuote.status === "booked") {
      return res.status(400).json({ success: false, error: "This quote has already been booked" });
    }

    const userId = user.userId || user.id;
    const analysis = JSON.parse(snapQuote.analysis || "{}");
    const serviceRequestId = nanoid(12);

    // Create service request with guaranteed ceiling
    try {
      await pool.query(
        `INSERT INTO service_requests (id, customer_id, service_type, status, price_estimate, guaranteed_ceiling, scheduled_for, description, created_at)
         VALUES ($1, $2, $3, 'requested', $4, $4, $5, $6, NOW())`,
        [
          serviceRequestId,
          userId,
          snapQuote.service_type,
          snapQuote.quoted_price,
          scheduledDate ? new Date(`${scheduledDate}T${scheduledTime || "09:00"}:00`) : new Date(Date.now() + 86400000),
          `Snap Quote: ${analysis.scopeDescription || analysis.serviceType}`,
        ]
      );
    } catch (err: any) {
      console.error("[SnapQuote] Service request creation error:", err);
      return res.status(500).json({ success: false, error: "Failed to create booking" });
    }

    // Update snap quote status
    await pool.query(
      "UPDATE snap_quotes SET status = 'booked', booked_service_request_id = $1 WHERE id = $2",
      [serviceRequestId, id]
    );

    return res.json({
      success: true,
      booking: {
        serviceRequestId,
        serviceType: snapQuote.service_type,
        serviceLabel: getServiceLabel(snapQuote.service_type),
        guaranteedCeiling: snapQuote.quoted_price,
        scheduledDate: scheduledDate || "Next available",
        scheduledTime: scheduledTime || "Morning",
        status: "requested",
      },
    });
  } catch (error: any) {
    console.error("[SnapQuote] Book error:", error);
    return res.status(500).json({ success: false, error: "Failed to book service" });
  }
});

export function registerSnapQuoteRoutes(app: Express) {
  app.use("/api", router);
}
