/**
 * Drone Scan (Free) Booking Routes
 *
 * POST /api/drone-scan/book                    - create booking
 * GET  /api/drone-scan/:id                     - get booking details
 * GET  /api/drone-scan/customer/:customerId    - list customer's scans
 * POST /api/drone-scan/:id/complete            - operator marks complete
 * GET  /api/drone-scan/:id/report              - get scan report
 */

import { Router, type Express } from "express";
import { z } from "zod";
import { pool } from "../db";

const router = Router();

// ─── Weather check via wttr.in ───────────────────────────────────────────────

async function checkWeather(city: string, state: string, date: string): Promise<{
  suitable: boolean;
  summary: string;
  details: Record<string, unknown>;
}> {
  try {
    const location = encodeURIComponent(`${city}, ${state}`);
    const res = await fetch(`https://wttr.in/${location}?format=j1`);
    if (!res.ok) return { suitable: true, summary: "Weather check unavailable - proceed with caution", details: {} };
    const data = await res.json() as any;

    const forecast = data.weather?.[0]; // today's forecast
    if (!forecast) return { suitable: true, summary: "No forecast data available", details: {} };

    const maxWind = Math.max(...(forecast.hourly || []).map((h: any) => parseInt(h.windspeedMiles || "0")));
    const chanceOfRain = Math.max(...(forecast.hourly || []).map((h: any) => parseInt(h.chanceofrain || "0")));
    const description = forecast.hourly?.[4]?.weatherDesc?.[0]?.value || "Clear";

    const suitable = maxWind < 20 && chanceOfRain < 50;
    const summary = suitable
      ? `Clear skies expected - perfect for your aerial scan! (Wind: ${maxWind}mph, Rain chance: ${chanceOfRain}%)`
      : `⚠️ Weather concerns: Wind ${maxWind}mph, ${chanceOfRain}% rain chance. We may need to reschedule.`;

    return { suitable, summary, details: { maxWind, chanceOfRain, description } };
  } catch {
    return { suitable: true, summary: "Weather check unavailable", details: {} };
  }
}

// ─── Book a Drone Scan ───────────────────────────────────────────────────────

const bookSchema = z.object({
  customerId: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
  scheduledDate: z.string(),
  scheduledTime: z.string().optional(),
  faaComplianceAck: z.boolean(),
  paymentIntentId: z.string().optional(),
  propertySize: z.number().optional(),
  roofType: z.string().optional(),
  stories: z.number().optional(),
  interiorIncluded: z.boolean().optional(),
  flightPlanNotes: z.string().optional(),
});

router.post("/book", async (req, res) => {
  try {
    const body = bookSchema.parse(req.body);
    if (!body.faaComplianceAck) {
      return res.status(400).json({ error: "FAA compliance acknowledgement required" });
    }

    const weather = await checkWeather(body.city, body.state, body.scheduledDate);

    const { rows } = await pool.query(
      `INSERT INTO drone_scan_bookings
        (customer_id, address, city, state, zip, scheduled_date, scheduled_time,
         faa_compliance_ack, payment_intent_id, property_size, roof_type, stories,
         interior_included, flight_plan_notes, weather_check, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        body.customerId, body.address, body.city, body.state, body.zip,
        body.scheduledDate, body.scheduledTime || null,
        true, body.paymentIntentId || null,
        body.propertySize || null, body.roofType || null, body.stories || 1,
        body.interiorIncluded !== false, body.flightPlanNotes || null,
        JSON.stringify(weather),
        weather.suitable ? "confirmed" : "pending",
      ]
    );

    res.json({ booking: rows[0], weather });
  } catch (err: any) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    console.error("Drone scan booking error:", err);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// ─── Get booking details ─────────────────────────────────────────────────────

router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM drone_scan_bookings WHERE id = $1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Booking not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch booking" });
  }
});

// ─── List customer's scans ───────────────────────────────────────────────────

router.get("/customer/:customerId", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM drone_scan_bookings WHERE customer_id = $1 ORDER BY created_at DESC",
      [req.params.customerId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// ─── Operator marks complete ─────────────────────────────────────────────────

router.post("/:id/complete", async (req, res) => {
  try {
    const { reportUrl } = req.body;
    const { rows } = await pool.query(
      `UPDATE drone_scan_bookings
       SET status = 'completed', completed_at = NOW(), report_url = $2
       WHERE id = $1 RETURNING *`,
      [req.params.id, reportUrl || null]
    );
    if (!rows.length) return res.status(404).json({ error: "Booking not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to complete booking" });
  }
});

// ─── Get scan report ─────────────────────────────────────────────────────────

router.get("/:id/report", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, customer_id, address, deliverables, report_url, completed_at, weather_check FROM drone_scan_bookings WHERE id = $1",
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Booking not found" });
    if (rows[0].status !== "completed" && !rows[0].report_url) {
      return res.status(400).json({ error: "Scan not yet completed" });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch report" });
  }
});

export function registerDroneScanRoutes(app: Express) {
  app.use("/api/drone-scan", router);
}
