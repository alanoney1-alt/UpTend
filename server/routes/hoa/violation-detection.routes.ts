/**
 * HOA Auto-Violation Detection Routes
 * 
 * Photo-to-violation detection pipeline using OpenAI Vision + reverse geocoding.
 * Includes full violation lifecycle: detect → approve → notify → cure/dispute/extend.
 * 
 * AUTO-ESCALATION: A cron job should periodically call GET /api/violations/auto-escalate
 * to check for overdue violations and escalate them. See the endpoint below.
 */

import type { Express } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import { pool } from "../../db";
import { analyzeImages } from "../../services/ai/openai-vision-client";
import { sendEmail, sendSms } from "../../services/notifications";

// ─── Constants ──────────────────────────────────────────────────────────────

const VIOLATION_TYPES = [
  "overgrown_lawn", "unapproved_paint", "trash_cans", "broken_fence",
  "parking_violation", "unapproved_structure", "dead_landscaping",
  "holiday_decorations", "noise_complaint", "pet_violation", "signage_violation",
  "roof_damage", "window_modification", "driveway_stain", "recreational_vehicle",
  "commercial_vehicle", "exterior_modification", "pool_safety",
  "lighting_violation", "other",
] as const;

const SEVERITY_LEVELS = ["warning", "minor", "moderate", "major", "critical"] as const;

const CURE_DAYS: Record<string, number> = {
  warning: 14,
  minor: 14,
  moderate: 21,
  major: 30,
  critical: 30,
};

const STATUS_VALUES = [
  "draft", "pending", "notified", "cured", "escalated", "closed", "disputed",
] as const;

// ─── Schemas ────────────────────────────────────────────────────────────────

const photoDetectSchema = z.object({
  photo: z.string().min(1), // base64 or URL
  lat: z.number(),
  lng: z.number(),
  communityId: z.string().optional(),
  createdBy: z.string().optional(),
});

const cureSchema = z.object({
  curePhotoUrl: z.string().url(),
});

const disputeSchema = z.object({
  reason: z.string().min(10),
});

const extendSchema = z.object({
  requestedDays: z.number().min(1).max(30),
  reason: z.string().optional(),
});

// ─── Database Init ──────────────────────────────────────────────────────────

async function initViolationDetectionTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS community_properties (
      id TEXT PRIMARY KEY,
      community_id TEXT NOT NULL,
      address TEXT NOT NULL,
      owner_name TEXT,
      owner_email TEXT,
      owner_phone TEXT,
      unit_number TEXT,
      lat DOUBLE PRECISION,
      lng DOUBLE PRECISION,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS community_guidelines (
      id TEXT PRIMARY KEY,
      community_id TEXT NOT NULL,
      violation_type TEXT NOT NULL,
      ccr_section TEXT NOT NULL,
      description TEXT,
      cure_days INTEGER DEFAULT 14,
      fine_amount NUMERIC(10,2) DEFAULT 0,
      severity_default TEXT DEFAULT 'minor',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS violation_records (
      id TEXT PRIMARY KEY,
      community_id TEXT,
      property_id TEXT,
      photo_url TEXT,
      photo_analysis JSONB,
      violation_type TEXT,
      ccr_section TEXT,
      severity TEXT DEFAULT 'minor',
      description TEXT,
      status TEXT DEFAULT 'draft',
      cure_deadline TIMESTAMPTZ,
      address TEXT,
      owner_name TEXT,
      owner_email TEXT,
      created_by TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS violation_notifications (
      id TEXT PRIMARY KEY,
      violation_id TEXT NOT NULL REFERENCES violation_records(id),
      channel TEXT NOT NULL,
      sent_at TIMESTAMPTZ DEFAULT NOW(),
      status TEXT DEFAULT 'sent'
    );

    CREATE TABLE IF NOT EXISTS violation_cures (
      id TEXT PRIMARY KEY,
      violation_id TEXT NOT NULL REFERENCES violation_records(id),
      cure_photo_url TEXT,
      cure_photo_analysis JSONB,
      submitted_at TIMESTAMPTZ DEFAULT NOW(),
      reviewed_at TIMESTAMPTZ,
      approved BOOLEAN
    );

    CREATE INDEX IF NOT EXISTS idx_violation_records_community ON violation_records(community_id);
    CREATE INDEX IF NOT EXISTS idx_violation_records_property ON violation_records(property_id);
    CREATE INDEX IF NOT EXISTS idx_violation_records_status ON violation_records(status);
    CREATE INDEX IF NOT EXISTS idx_community_properties_community ON community_properties(community_id);
    CREATE INDEX IF NOT EXISTS idx_community_properties_address ON community_properties(address);
  `);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "UpTend-HOA-App/1.0" },
    });
    const data = await resp.json() as any;
    return data?.display_name || data?.address
      ? [
          data.address?.house_number,
          data.address?.road,
          data.address?.city || data.address?.town,
          data.address?.state,
          data.address?.postcode,
        ].filter(Boolean).join(" ")
      : null;
  } catch {
    return null;
  }
}

async function matchPropertyByAddress(address: string, communityId?: string) {
  // Try fuzzy match on address
  const query = communityId
    ? `SELECT * FROM community_properties WHERE community_id = $1 AND address ILIKE $2 LIMIT 1`
    : `SELECT * FROM community_properties WHERE address ILIKE $1 LIMIT 1`;
  const params = communityId
    ? [communityId, `%${address.split(",")[0].trim()}%`]
    : [`%${address.split(",")[0].trim()}%`];
  const result = await pool.query(query, params);
  return result.rows[0] || null;
}

async function matchPropertyByCoords(lat: number, lng: number, communityId?: string) {
  // Find nearest property within ~100m
  const query = communityId
    ? `SELECT *, (
        6371000 * acos(
          cos(radians($1)) * cos(radians(lat)) * cos(radians(lng) - radians($2)) +
          sin(radians($1)) * sin(radians(lat))
        )
      ) AS distance
      FROM community_properties
      WHERE community_id = $3 AND lat IS NOT NULL AND lng IS NOT NULL
      ORDER BY distance LIMIT 1`
    : `SELECT *, (
        6371000 * acos(
          cos(radians($1)) * cos(radians(lat)) * cos(radians(lng) - radians($2)) +
          sin(radians($1)) * sin(radians(lat))
        )
      ) AS distance
      FROM community_properties
      WHERE lat IS NOT NULL AND lng IS NOT NULL
      ORDER BY distance LIMIT 1`;
  const params = communityId ? [lat, lng, communityId] : [lat, lng];
  const result = await pool.query(query, params);
  const row = result.rows[0];
  if (row && row.distance < 100) return row;
  return null;
}

async function getGuideline(communityId: string, violationType: string) {
  const result = await pool.query(
    `SELECT * FROM community_guidelines WHERE community_id = $1 AND violation_type = $2 LIMIT 1`,
    [communityId, violationType],
  );
  return result.rows[0] || null;
}

async function analyzeViolationPhoto(photoUrl: string): Promise<any> {
  const violationTypesList = VIOLATION_TYPES.join(", ");
  const severityList = SEVERITY_LEVELS.join(", ");

  return analyzeImages({
    imageUrls: [photoUrl],
    prompt: `Analyze this photo for HOA/community association violations.

Return a JSON object with:
{
  "violation_detected": true/false,
  "violation_type": one of [${violationTypesList}],
  "severity": one of [${severityList}],
  "description": "detailed description of the violation",
  "confidence": 0.0-1.0,
  "details": "additional observations"
}

If no violation is detected, set violation_detected to false and violation_type to null.
Be specific about what you see. Mention colors, conditions, locations on the property.`,
    systemPrompt: "You are an HOA compliance inspector AI. Analyze property photos for community association violations with precision. Always respond in valid JSON.",
    jsonMode: true,
    maxTokens: 1024,
  });
}

// ─── Route Registration ─────────────────────────────────────────────────────

export function registerViolationDetectionRoutes(app: Express) {
  // Initialize tables on startup
  initViolationDetectionTables().catch((err) =>
    console.error("[ViolationDetection] Table init failed:", err.message),
  );

  // ── POST /api/violations/photo-detect ───────────────────────────────────
  // Main detection pipeline: photo + GPS → violation draft
  app.post("/api/violations/photo-detect", async (req, res) => {
    try {
      const input = photoDetectSchema.parse(req.body);

      // 1. Reverse geocode GPS → address
      const address = await reverseGeocode(input.lat, input.lng);
      if (!address) {
        return res.status(400).json({ error: "Could not resolve address from coordinates" });
      }

      // 2. Match address to property
      let property = await matchPropertyByCoords(input.lat, input.lng, input.communityId);
      if (!property) {
        property = await matchPropertyByAddress(address, input.communityId);
      }

      // 3. Determine photo URL (if base64, it's already a data URL for vision)
      const photoUrl = input.photo.startsWith("http")
        ? input.photo
        : `data:image/jpeg;base64,${input.photo.replace(/^data:image\/\w+;base64,/, "")}`;

      // 4. Analyze photo with OpenAI Vision
      const analysis = await analyzeViolationPhoto(photoUrl);

      if (!analysis || analysis._mock) {
        return res.status(503).json({ error: "Vision service unavailable", mock: true });
      }

      const parsed = typeof analysis === "string" ? JSON.parse(analysis) : analysis;

      if (!parsed.violation_detected) {
        return res.json({
          violation_detected: false,
          address,
          analysis: parsed,
          message: "No violation detected in the photo",
        });
      }

      // 5. Look up CC&R guideline
      const communityId = property?.community_id || input.communityId || "default";
      const guideline = await getGuideline(communityId, parsed.violation_type);
      const ccrSection = guideline?.ccr_section || "General Community Standards";
      const severity = parsed.severity || guideline?.severity_default || "minor";
      const cureDays = guideline?.cure_days || CURE_DAYS[severity] || 14;

      // 6. Create violation record (draft)
      const violationId = nanoid();
      const cureDeadline = new Date();
      cureDeadline.setDate(cureDeadline.getDate() + cureDays);

      await pool.query(
        `INSERT INTO violation_records
          (id, community_id, property_id, photo_url, photo_analysis, violation_type,
           ccr_section, severity, description, status, cure_deadline, address,
           owner_name, owner_email, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [
          violationId,
          communityId,
          property?.id || null,
          input.photo.startsWith("http") ? input.photo : null, // Don't store base64 in DB
          JSON.stringify(parsed),
          parsed.violation_type,
          ccrSection,
          severity,
          parsed.description,
          "draft",
          cureDeadline.toISOString(),
          address,
          property?.owner_name || null,
          property?.owner_email || null,
          input.createdBy || "system",
        ],
      );

      // 7. Return draft for manager approval
      res.json({
        violation_detected: true,
        violation: {
          id: violationId,
          communityId,
          propertyId: property?.id || null,
          address,
          ownerName: property?.owner_name || null,
          ownerEmail: property?.owner_email || null,
          ownerPhone: property?.owner_phone || null,
          violationType: parsed.violation_type,
          ccrSection,
          severity,
          description: parsed.description,
          confidence: parsed.confidence,
          photoAnalysis: parsed,
          status: "draft",
          cureDeadline: cureDeadline.toISOString(),
          cureDays,
          fineAmount: guideline?.fine_amount || null,
        },
        message: "Violation draft created. Approve to send notification.",
      });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: err.errors });
      }
      console.error("[ViolationDetection] photo-detect error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/violations/:id/approve ────────────────────────────────────
  app.post("/api/violations/:id/approve", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        `UPDATE violation_records SET status = 'pending', updated_at = NOW()
         WHERE id = $1 AND status = 'draft' RETURNING *`,
        [id],
      );
      if (!result.rows[0]) {
        return res.status(404).json({ error: "Violation not found or not in draft status" });
      }

      // TODO: Trigger notification to homeowner (SMS/email/push)
      // For now, create a pending notification record
      await pool.query(
        `INSERT INTO violation_notifications (id, violation_id, channel, status)
         VALUES ($1, $2, 'in_app', 'pending')`,
        [nanoid(), id],
      );

      res.json({ success: true, violation: result.rows[0] });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/violations/:id/notify ─────────────────────────────────────
  app.post("/api/violations/:id/notify", async (req, res) => {
    try {
      const { id } = req.params;
      const { channel = "email" } = req.body;

      const violation = await pool.query(`SELECT * FROM violation_records WHERE id = $1`, [id]);
      if (!violation.rows[0]) {
        return res.status(404).json({ error: "Violation not found" });
      }

      // Update status to notified
      await pool.query(
        `UPDATE violation_records SET status = 'notified', updated_at = NOW() WHERE id = $1`,
        [id],
      );

      // Record notification
      const notifId = nanoid();
      await pool.query(
        `INSERT INTO violation_notifications (id, violation_id, channel, status)
         VALUES ($1, $2, $3, 'sent')`,
        [notifId, id, channel],
      );

      const v = violation.rows[0];
      const appUrl = process.env.APP_URL || "https://uptendapp.com";
      const violationsLink = `${appUrl}/my-home/violations`;
      const friendlyType = (v.violation_type || "").replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      const communityName = v.community_id || "Your Community";
      const cureDeadline = v.cure_deadline ? new Date(v.cure_deadline).toLocaleDateString() : "N/A";

      // ── Email notification ──────────────────────────────────────────────
      if ((channel === "email" || channel === "all") && v.owner_email) {
        const photoHtml = v.photo_url ? `<img src="${v.photo_url}" alt="Property photo" style="max-width:100%;border-radius:8px;margin:12px 0;" />` : "";
        await sendEmail({
          to: v.owner_email,
          subject: `Property Notice from ${communityName}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
              <h2 style="color:#1a1a1a;">Property Notice: ${friendlyType}</h2>
              ${photoHtml}
              <p style="color:#555;">${v.description || ""}</p>
              <p style="color:#555;"><strong>Community Guidelines:</strong> ${v.ccr_section || "General Standards"}</p>
              <p style="color:#555;"><strong>Please resolve by:</strong> ${cureDeadline}</p>
              <a href="${violationsLink}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
                View Details &amp; Respond
              </a>
              <p style="color:#999;font-size:12px;margin-top:24px;">
                You're receiving this because you are a homeowner in ${communityName}.
              </p>
            </div>
          `,
          text: `Property Notice: ${friendlyType}\n\n${v.description || ""}\n\nGuidelines: ${v.ccr_section || "General Standards"}\nResolve by: ${cureDeadline}\n\nView details: ${violationsLink}`,
        }).catch((err) => console.error("[ViolationNotify] Email error:", err));

        // Record email notification
        await pool.query(
          `INSERT INTO violation_notifications (id, violation_id, channel, status) VALUES ($1, $2, 'email', 'sent')`,
          [nanoid(), id],
        );
      }

      // ── SMS notification ────────────────────────────────────────────────
      if ((channel === "sms" || channel === "all") && v.owner_phone) {
        await sendSms({
          to: v.owner_phone,
          message: `You have a new property notice for ${v.address || "your property"}: ${friendlyType}. Resolve by ${cureDeadline}. View details: ${violationsLink}`,
        }).catch((err) => console.error("[ViolationNotify] SMS error:", err));

        await pool.query(
          `INSERT INTO violation_notifications (id, violation_id, channel, status) VALUES ($1, $2, 'sms', 'sent')`,
          [nanoid(), id],
        );
      }

      // ── In-app notification (always) ────────────────────────────────────
      await pool.query(
        `INSERT INTO violation_notifications (id, violation_id, channel, status) VALUES ($1, $2, 'in_app', 'sent')`,
        [nanoid(), id],
      );

      res.json({
        success: true,
        notificationId: notifId,
        channel,
        message: `Notification sent via ${channel}`,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/violations/:id/cure ───────────────────────────────────────
  app.post("/api/violations/:id/cure", async (req, res) => {
    try {
      const { id } = req.params;
      const { curePhotoUrl } = cureSchema.parse(req.body);

      const violation = await pool.query(`SELECT * FROM violation_records WHERE id = $1`, [id]);
      if (!violation.rows[0]) {
        return res.status(404).json({ error: "Violation not found" });
      }

      // Analyze cure photo
      let cureAnalysis = null;
      try {
        cureAnalysis = await analyzeImages({
          imageUrls: [curePhotoUrl],
          prompt: `This is a cure/remediation photo for an HOA violation of type "${violation.rows[0].violation_type}".
Original violation: ${violation.rows[0].description}

Analyze whether the violation appears to be resolved. Return JSON:
{
  "appears_resolved": true/false,
  "confidence": 0.0-1.0,
  "notes": "description of current state"
}`,
          systemPrompt: "You are an HOA compliance inspector AI reviewing cure photos.",
          jsonMode: true,
          maxTokens: 512,
        });
      } catch { /* Vision analysis optional for cure */ }

      const cureId = nanoid();
      await pool.query(
        `INSERT INTO violation_cures (id, violation_id, cure_photo_url, cure_photo_analysis)
         VALUES ($1, $2, $3, $4)`,
        [cureId, id, curePhotoUrl, cureAnalysis ? JSON.stringify(cureAnalysis) : null],
      );

      // Update violation status
      await pool.query(
        `UPDATE violation_records SET status = 'cured', updated_at = NOW() WHERE id = $1`,
        [id],
      );

      res.json({ success: true, cureId, analysis: cureAnalysis });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: err.errors });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/violations/:id/dispute ────────────────────────────────────
  app.post("/api/violations/:id/dispute", async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = disputeSchema.parse(req.body);

      const result = await pool.query(
        `UPDATE violation_records SET status = 'disputed', description = description || E'\n\n[DISPUTE]: ' || $2, updated_at = NOW()
         WHERE id = $1 RETURNING *`,
        [id, reason],
      );
      if (!result.rows[0]) {
        return res.status(404).json({ error: "Violation not found" });
      }

      res.json({ success: true, violation: result.rows[0] });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: err.errors });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // ── POST /api/violations/:id/extend ─────────────────────────────────────
  app.post("/api/violations/:id/extend", async (req, res) => {
    try {
      const { id } = req.params;
      const { requestedDays, reason } = extendSchema.parse(req.body);

      const result = await pool.query(
        `UPDATE violation_records
         SET cure_deadline = cure_deadline + ($2 || ' days')::INTERVAL,
             description = description || E'\n\n[EXTENSION]: ' || $3,
             updated_at = NOW()
         WHERE id = $1 RETURNING *`,
        [id, requestedDays.toString(), reason || `Extended by ${requestedDays} days`],
      );
      if (!result.rows[0]) {
        return res.status(404).json({ error: "Violation not found" });
      }

      res.json({ success: true, violation: result.rows[0] });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid input", details: err.errors });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/violations/community/:communityId ──────────────────────────
  app.get("/api/violations/community/:communityId", async (req, res) => {
    try {
      const { communityId } = req.params;
      const { status, limit = "50", offset = "0" } = req.query;

      let query = `SELECT * FROM violation_records WHERE community_id = $1`;
      const params: any[] = [communityId];

      if (status) {
        params.push(status);
        query += ` AND status = $${params.length}`;
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(parseInt(limit as string), parseInt(offset as string));

      const result = await pool.query(query, params);
      res.json({ violations: result.rows, count: result.rows.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/violations/property/:propertyId ────────────────────────────
  app.get("/api/violations/property/:propertyId", async (req, res) => {
    try {
      const { propertyId } = req.params;
      const result = await pool.query(
        `SELECT * FROM violation_records WHERE property_id = $1 ORDER BY created_at DESC`,
        [propertyId],
      );
      res.json({ violations: result.rows, count: result.rows.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/violations/pending ─────────────────────────────────────────
  app.get("/api/violations/pending", async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM violation_records WHERE status IN ('draft', 'pending') ORDER BY created_at DESC`,
      );
      res.json({ violations: result.rows, count: result.rows.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/violations/auto-escalate ───────────────────────────────────
  // AUTO-ESCALATION: This endpoint should be called by a cron job
  // (e.g., daily at midnight) to check for overdue violations.
  // In production, wire this up to node-cron or a scheduler service:
  //   cron.schedule('0 0 * * *', () => fetch('/api/violations/auto-escalate'))
  app.get("/api/violations/auto-escalate", async (req, res) => {
    try {
      const result = await pool.query(
        `UPDATE violation_records
         SET status = 'escalated', updated_at = NOW()
         WHERE status IN ('notified', 'pending')
           AND cure_deadline < NOW()
         RETURNING id, address, violation_type, cure_deadline`,
      );

      res.json({
        escalated: result.rows.length,
        violations: result.rows,
        message: `${result.rows.length} violation(s) auto-escalated due to overdue cure deadlines`,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/violations/:id ─────────────────────────────────────────────
  app.get("/api/violations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const violation = await pool.query(`SELECT * FROM violation_records WHERE id = $1`, [id]);
      if (!violation.rows[0]) {
        return res.status(404).json({ error: "Violation not found" });
      }

      // Get notifications and cures
      const [notifications, cures] = await Promise.all([
        pool.query(`SELECT * FROM violation_notifications WHERE violation_id = $1 ORDER BY sent_at DESC`, [id]),
        pool.query(`SELECT * FROM violation_cures WHERE violation_id = $1 ORDER BY submitted_at DESC`, [id]),
      ]);

      res.json({
        ...violation.rows[0],
        notifications: notifications.rows,
        cures: cures.rows,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/violations/report/:communityId ─────────────────────────────
  // Summary stats for board meetings
  app.get("/api/violations/report/:communityId", async (req, res) => {
    try {
      const { communityId } = req.params;
      const { startDate, endDate } = req.query;

      let dateFilter = "";
      const params: any[] = [communityId];

      if (startDate) {
        params.push(startDate);
        dateFilter += ` AND created_at >= $${params.length}`;
      }
      if (endDate) {
        params.push(endDate);
        dateFilter += ` AND created_at <= $${params.length}`;
      }

      const [totalResult, byStatus, byType, bySeverity] = await Promise.all([
        pool.query(`SELECT COUNT(*) as total FROM violation_records WHERE community_id = $1${dateFilter}`, params),
        pool.query(`SELECT status, COUNT(*) as count FROM violation_records WHERE community_id = $1${dateFilter} GROUP BY status`, params),
        pool.query(`SELECT violation_type, COUNT(*) as count FROM violation_records WHERE community_id = $1${dateFilter} GROUP BY violation_type ORDER BY count DESC`, params),
        pool.query(`SELECT severity, COUNT(*) as count FROM violation_records WHERE community_id = $1${dateFilter} GROUP BY severity`, params),
      ]);

      res.json({
        communityId,
        total: parseInt(totalResult.rows[0]?.total || "0"),
        byStatus: byStatus.rows,
        byType: byType.rows,
        bySeverity: bySeverity.rows,
        dateRange: { startDate: startDate || null, endDate: endDate || null },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── GET /api/community-properties/by-user/:userId ───────────────────────
  // Look up a homeowner's property by their user ID (email match)
  app.get("/api/community-properties/by-user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      // Try matching by owner_email from the users table
      const userResult = await pool.query(
        `SELECT email, phone FROM users WHERE id = $1 LIMIT 1`,
        [userId],
      );
      const user = userResult.rows[0];
      if (!user) return res.status(404).json({ error: "User not found" });

      const propResult = await pool.query(
        `SELECT * FROM community_properties WHERE owner_email = $1 LIMIT 1`,
        [user.email],
      );
      if (!propResult.rows[0]) {
        return res.status(404).json({ error: "No property found for this user" });
      }
      res.json(propResult.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
