/**
 * Snap & Book - Photo to Booked Pro in 60 seconds
 * AI vision quotes with Price Protection Guarantee
 */

import { Router, type Express } from "express";
import { nanoid } from "nanoid";
import { analyzeImages } from "../../services/ai/openai-vision-client";
import { calculateServicePrice, getServiceLabel, PRICING_CONSTANTS } from "../../services/pricing";
import { pool } from "../../db";
import { generateEquipmentChecklist } from "../../services/equipment-checklist";
import { requireAuth, requireHauler } from "../../auth-middleware";
import { storage } from "../../storage";

const router = Router();

// ─── Rate Limiting (in-memory) ───────────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, maxPerDay: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 86400000 });
    return true;
  }
  if (entry.count >= maxPerDay) return false;
  entry.count++;
  return true;
}

// Clean up expired entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now >= entry.resetAt) rateLimitMap.delete(key);
  }
}, 3600000);

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

/**
 * Build a quote using the CANONICAL pricing from pricing.ts (same source George uses).
 * This ensures snap-quote and George chat always produce the same prices.
 */
function buildQuote(analysis: VisionAnalysis) {
  const d = analysis.details || {};
  const adjustments: Array<{ label: string; amount: number }> = [];

  // Map vision analysis details to the format calculateServicePrice expects
  const pricingData: Record<string, any> = {
    storyCount: d.storyCount || 1,
    linearFeet: d.linearFeet || 150,
    squareFootage: d.squareFootage || d.sqft || 0,
    laborHours: d.hours || analysis.estimatedHours || 1,
    laborCrewSize: d.movers || d.crew || 1,
    rooms: d.rooms || 2,
    tier: d.tier || "standard",
    hallways: d.hallways || 0,
    stairFlights: d.stairFlights || 0,
    lotSize: d.lotSize || "quarter",
    planType: d.planType || (d.scope?.toLowerCase().includes("cleanup") ? "cleanup" : "one_time_mow"),
  };

  // Use canonical pricing engine (returns cents or null)
  let priceCents = calculateServicePrice(analysis.serviceType, pricingData);
  let total: number;

  if (priceCents !== null) {
    total = Math.round(priceCents / 100);
  } else {
    // Fallback for services not in calculateServicePrice (junk_removal, home_cleaning, handyman, garage_cleanout)
    switch (analysis.serviceType) {
      case "junk_removal": {
        const vol = (d.volume || "").toLowerCase();
        if (vol.includes("full")) { total = 299; adjustments.push({ label: "Full truck load", amount: 200 }); }
        else if (vol.includes("half") || vol.includes("medium")) { total = 179; }
        else { total = 99; }
        if (d.heavyItems) { adjustments.push({ label: "Heavy items surcharge", amount: 50 }); total += 50; }
        break;
      }
      case "home_cleaning": {
        const beds = d.bedrooms || 2;
        if (beds >= 4) { total = 199; adjustments.push({ label: "4+ bedroom home", amount: 100 }); }
        else if (beds === 3) { total = 149; adjustments.push({ label: "3 bedroom home", amount: 50 }); }
        else { total = 99; }
        break;
      }
      case "handyman": {
        const hours = Math.max(d.hours || analysis.estimatedHours || 1, 1);
        total = hours * 75;
        if (hours > 1) adjustments.push({ label: `${hours} hours estimated`, amount: (hours - 1) * 75 });
        break;
      }
      case "garage_cleanout": {
        const size = (d.size || "").toLowerCase();
        if (size.includes("3") || size.includes("large")) { total = 199; adjustments.push({ label: "Large garage", amount: 70 }); }
        else { total = 129; }
        break;
      }
      default:
        total = 99;
        break;
    }
  }

  // Build adjustment descriptions for services that used calculateServicePrice
  if (priceCents !== null && adjustments.length === 0) {
    const base = total;
    // Add descriptive adjustments based on service type
    if (analysis.serviceType === "gutter_cleaning" && d.storyCount > 1) {
      adjustments.push({ label: `${d.storyCount}-story home`, amount: 0 });
    }
    if (analysis.serviceType === "carpet_cleaning" && d.rooms > 1) {
      adjustments.push({ label: `${d.rooms} rooms`, amount: 0 });
    }
    if (analysis.serviceType === "moving_labor") {
      adjustments.push({ label: `${pricingData.laborCrewSize} movers x ${pricingData.laborHours} hrs`, amount: 0 });
    }
  }

  // 15% pricing buffer: customer sees a ceiling price that accounts for
  // slight scope underestimates. Pro gets paid based on the base estimate.
  const baseEstimate = total;
  const bufferedTotal = Math.round(total * 1.15);

  return {
    basePrice: total,
    adjustments,
    totalPrice: bufferedTotal,
    baseEstimate,
    priceDisplay: `$${bufferedTotal}`,
    guarantee: "Price Protection Guarantee -- this is your maximum price",
  };
}

// ─── POST /api/snap-quote ────────────────────────────────────────────────────

router.post("/snap-quote", async (req, res) => {
  try {
    await ensureTable();

    // ─── Rate Limiting ─────────────────────────────────────────────
    const user = req.user as any;
    const userId = user?.userId || user?.id;
    const rateLimitKey = userId ? `user:${userId}` : `ip:${req.ip}`;
    const maxPerDay = userId ? 10 : 5;

    if (!checkRateLimit(rateLimitKey, maxPerDay)) {
      return res.status(429).json({
        success: false,
        error: "You've reached the daily photo quote limit. Try again tomorrow, or describe your issue to George for help.",
      });
    }

    const { imageBase64, description, address } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, error: "imageBase64 is required" });
    }

    const imageUrl = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;

    // Vision analysis with validation
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

IMPORTANT VALIDATION RULES:
- If the image is NOT related to a home, property, yard, or building (e.g., selfie, pet, food, meme, screenshot, document, car), respond with: { "valid": false, "reason": "brief explanation of what you see instead" }
- If the image shows a home-related issue but you cannot determine which service is needed, respond with: { "valid": true, "confidence": "low", "serviceType": "home_consultation", "scopeDescription": "what you see", "estimatedHours": 1, "details": {} }
- If the image shows a vehicle or car issue, respond with: { "valid": false, "reason": "vehicle_service" }
- Only return a full analysis if the image clearly shows a home/property service need

For valid home service images, return JSON:
{
  "valid": true,
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
      } else if (result.valid === false) {
        // Photo validation failed
        if (result.reason === "vehicle_service") {
          return res.json({
            success: false,
            rejected: true,
            error: "George spotted a vehicle issue. Vehicle maintenance is coming soon - for now, try describing your home service need and George can help.",
          });
        }
        return res.json({
          success: false,
          rejected: true,
          error: "George couldn't identify a home service need in this photo. Try taking a closer photo of the area that needs work, or describe your issue instead.",
        });
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
    const reqUser = req.user as any;
    const customerId = reqUser?.userId || reqUser?.id || null;

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

    // Create service request with guaranteed ceiling and snap quote reference
    try {
      await pool.query(
        `INSERT INTO service_requests (id, customer_id, service_type, status, price_estimate, guaranteed_ceiling, scheduled_for, description, snap_quote_id, created_at)
         VALUES ($1, $2, $3, 'requested', $4, $4, $5, $6, $7, NOW())`,
        [
          serviceRequestId,
          userId,
          snapQuote.service_type,
          snapQuote.quoted_price,
          scheduledDate ? new Date(`${scheduledDate}T${scheduledTime || "09:00"}:00`) : new Date(Date.now() + 86400000),
          `Snap Quote: ${analysis.scopeDescription || analysis.serviceType}`,
          id, // snap_quote_id reference back to the original quote
        ]
      );
    } catch (err: any) {
      console.error("[SnapQuote] Service request creation error:", err);
      return res.status(500).json({ success: false, error: "Failed to create booking" });
    }

    // Pro notification with snap quote context
    try {
      const notificationText = `New ${getServiceLabel(snapQuote.service_type)} job - photo quote attached. View details for scope and equipment list.`;
      await pool.query(
        `INSERT INTO notifications (id, user_id, type, title, message, data, created_at)
         VALUES ($1, $2, 'snap_book_job', $3, $4, $5, NOW())
         ON CONFLICT DO NOTHING`,
        [
          nanoid(12),
          null, // will be filled when pro is matched/assigned
          `New ${getServiceLabel(snapQuote.service_type)} Job`,
          notificationText,
          JSON.stringify({ snapQuoteId: id, serviceRequestId, serviceType: snapQuote.service_type }),
        ]
      );
    } catch (err) {
      // Notification failure is non-blocking
      console.error("[SnapQuote] Notification save error:", err);
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

// ─── GET /api/haulers/jobs/:jobId/snap-details ──────────────────────────────
// Pro endpoint: full snap quote context for a job

router.get("/haulers/jobs/:jobId/snap-details", requireAuth, requireHauler, async (req, res) => {
  try {
    await ensureTable();
    const { jobId } = req.params;

    // Load the service request
    const jobResult = await pool.query(
      "SELECT * FROM service_requests WHERE id = $1",
      [jobId]
    );
    if (jobResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }
    const job = jobResult.rows[0];

    if (!job.snap_quote_id) {
      return res.status(404).json({ success: false, error: "This job was not created from a Snap Quote" });
    }

    // Load the snap quote
    const quoteResult = await pool.query(
      "SELECT * FROM snap_quotes WHERE id = $1",
      [job.snap_quote_id]
    );
    if (quoteResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Snap quote record not found" });
    }
    const snapQuote = quoteResult.rows[0];
    const analysis: VisionAnalysis = JSON.parse(snapQuote.analysis || "{}");
    const adjustments = JSON.parse(snapQuote.adjustments || "[]");

    const customerPrice = snapQuote.quoted_price;
    // Pro payout is 85% of the base estimate (before the 15% buffer)
    const baseEstimate = Math.round(customerPrice / 1.15);
    const proPayout = Math.round(baseEstimate * 0.85 * 100) / 100;

    const equipmentChecklist = generateEquipmentChecklist(
      analysis.serviceType || snapQuote.service_type,
      analysis.scopeDescription || ""
    );

    // Generate "What to expect" notes from the analysis
    const whatToExpect: string[] = [];
    whatToExpect.push(`Service type: ${getServiceLabel(analysis.serviceType || snapQuote.service_type)}`);
    if (analysis.scopeDescription) {
      whatToExpect.push(`Scope: ${analysis.scopeDescription}`);
    }
    if (analysis.estimatedHours) {
      whatToExpect.push(`Estimated duration: ${analysis.estimatedHours} hour${analysis.estimatedHours !== 1 ? "s" : ""}`);
    }
    if (analysis.confidence) {
      whatToExpect.push(`AI confidence: ${analysis.confidence}`);
    }
    if (analysis.details) {
      const d = analysis.details;
      if (d.storyCount && d.storyCount > 1) whatToExpect.push(`Property is ${d.storyCount}-story`);
      if (d.volume) whatToExpect.push(`Volume estimate: ${d.volume}`);
      if (d.heavyItems) whatToExpect.push("Heavy items present - bring appropriate equipment");
      if (d.condition) whatToExpect.push(`Condition: ${d.condition}`);
      if (d.area) whatToExpect.push(`Area: ${d.area}`);
    }

    return res.json({
      success: true,
      snapDetails: {
        customerPhotoUrl: snapQuote.image_url,
        proArrivalPhotoUrl: job.pro_arrival_photo_url || null,
        analysis: {
          serviceType: analysis.serviceType,
          serviceLabel: getServiceLabel(analysis.serviceType || snapQuote.service_type),
          scopeDescription: analysis.scopeDescription,
          estimatedHours: analysis.estimatedHours,
          confidence: analysis.confidence,
          details: analysis.details,
        },
        pricing: {
          customerPrice,
          proPayout,
          adjustments,
        },
        equipmentChecklist,
        whatToExpect,
        scopeVerified: job.scope_verified || false,
      },
    });
  } catch (error: any) {
    console.error("[SnapQuote] Snap details error:", error);
    return res.status(500).json({ success: false, error: "Failed to load snap details" });
  }
});

// ─── POST /api/jobs/:jobId/arrival-photo ─────────────────────────────────────
// Pro uploads arrival photo for scope verification

router.post("/jobs/:jobId/arrival-photo", requireAuth, requireHauler, async (req, res) => {
  try {
    await ensureTable();
    const { jobId } = req.params;
    const { photoUrl } = req.body;
    const userId = (req.user as any)?.userId || (req.user as any)?.id;

    if (!photoUrl) {
      return res.status(400).json({ success: false, error: "photoUrl is required" });
    }

    // Load the job
    const jobResult = await pool.query(
      "SELECT * FROM service_requests WHERE id = $1",
      [jobId]
    );
    if (jobResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }
    const job = jobResult.rows[0];

    if (job.assigned_hauler_id !== userId) {
      return res.status(403).json({ success: false, error: "Not assigned to this job" });
    }

    // Store the arrival photo
    await pool.query(
      "UPDATE service_requests SET pro_arrival_photo_url = $1 WHERE id = $2",
      [photoUrl, jobId]
    );

    // Auto-approve scope if the snap quote had high confidence
    let autoApproved = false;
    if (job.snap_quote_id) {
      const quoteResult = await pool.query(
        "SELECT confidence FROM snap_quotes WHERE id = $1",
        [job.snap_quote_id]
      );
      if (quoteResult.rows.length > 0 && quoteResult.rows[0].confidence === "high") {
        await pool.query(
          "UPDATE service_requests SET scope_verified = true WHERE id = $1",
          [jobId]
        );
        autoApproved = true;
      }
    }

    return res.json({
      success: true,
      arrivalPhotoUrl: photoUrl,
      scopeVerified: autoApproved,
      message: autoApproved
        ? "Arrival photo saved. High-confidence quote - scope auto-verified. Ready to start."
        : "Arrival photo saved. Awaiting scope verification before starting.",
    });
  } catch (error: any) {
    console.error("[SnapQuote] Arrival photo error:", error);
    return res.status(500).json({ success: false, error: "Failed to save arrival photo" });
  }
});

// ─── GET /api/pro/training/snap-book ─────────────────────────────────────────

import { SNAP_BOOK_PRO_TRAINING } from "../../data/snap-book-training";

router.get("/pro/training/snap-book", (_req, res) => {
  return res.json({ success: true, training: SNAP_BOOK_PRO_TRAINING });
});

export function registerSnapQuoteRoutes(app: Express) {
  app.use("/api", router);
}
