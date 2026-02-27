/**
 * Re-engagement Sequence Service
 *
 * Finds dormant customers and sends graduated re-engagement messages:
 * Day 7: weather/tip (pure value)
 * Day 21: seasonal recommendation + soft CTA
 * Day 45: social proof + small offer
 * Day 90: $25 credit win-back
 * Day 180: final attempt → mark dormant
 *
 * Respects quiet hours (9PM-9AM EST), consent, and 1 msg / 7 days max.
 */

import { pool } from "../db";
import { checkConsent } from "./consent-manager";

interface ReengagementCandidate {
  customerId: string;
  dormantDays: number;
  reengagementStage: number;
  totalBookings: number;
  lifetimeSpend: number;
}

const SEQUENCE_MAP: Record<number, { day: number; messageType: string }> = {
  0: { day: 7, messageType: "weather_tip" },
  1: { day: 21, messageType: "seasonal_cta" },
  2: { day: 45, messageType: "social_proof" },
  3: { day: 90, messageType: "credit_winback" },
  4: { day: 180, messageType: "final_attempt" },
};

// ─── Check and Trigger Re-engagement ───────────────────────

export async function checkAndTriggerReengagement(): Promise<{
  scheduled: number;
  skipped: number;
}> {
  // Respect quiet hours: 9PM-9AM EST
  const now = new Date();
  const estHour = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" })).getHours();
  if (estHour >= 21 || estHour < 9) {
    return { scheduled: 0, skipped: 0 };
  }

  // Find customers who are dormant and need re-engagement
  const { rows: candidates } = await pool.query<ReengagementCandidate>(`
    SELECT
      cat.customer_id AS "customerId",
      EXTRACT(DAY FROM now() - COALESCE(cat.dormant_since, cat.last_booking_at, cat.created_at))::int AS "dormantDays",
      COALESCE(cat.reengagement_stage, 0) AS "reengagementStage",
      cat.total_bookings AS "totalBookings",
      cat.lifetime_spend::numeric AS "lifetimeSpend"
    FROM customer_activity_tracking cat
    WHERE cat.dormant_since IS NOT NULL
      AND COALESCE(cat.reengagement_stage, 0) < 5
    ORDER BY cat.dormant_since ASC
    LIMIT 100
  `);

  let scheduled = 0;
  let skipped = 0;

  for (const c of candidates) {
    const seq = SEQUENCE_MAP[c.reengagementStage];
    if (!seq || c.dormantDays < seq.day) {
      skipped++;
      continue;
    }

    // Check: max 1 message per 7 days
    const { rows: recent } = await pool.query(
      `SELECT id FROM reengagement_sequences
       WHERE customer_id = $1 AND sent_at > now() - interval '7 days'
       LIMIT 1`,
      [c.customerId]
    );
    if (recent.length > 0) {
      skipped++;
      continue;
    }

    // Check consent for marketing SMS
    const hasConsent = await checkConsent(c.customerId, "marketing_sms");
    if (!hasConsent) {
      skipped++;
      continue;
    }

    // Schedule the message
    await sendReengagementMessage(c.customerId, seq.day);
    scheduled++;
  }

  return { scheduled, skipped };
}

// ─── Send Re-engagement Message ────────────────────────────

export async function sendReengagementMessage(
  customerId: string,
  sequenceDay: number
): Promise<void> {
  const messageType = Object.values(SEQUENCE_MAP).find(s => s.day === sequenceDay)?.messageType ?? "weather_tip";
  const content = generateMessage(messageType, sequenceDay);
  const channel = "sms"; // Default channel; could be email/push based on consent

  await pool.query(
    `INSERT INTO reengagement_sequences
     (customer_id, sequence_day, status, message_type, scheduled_for, sent_at, channel, message_content)
     VALUES ($1, $2, 'sent', $3, now(), now(), $4, $5)`,
    [customerId, sequenceDay, messageType, channel, content]
  );

  // Advance the stage
  const nextStage = Object.entries(SEQUENCE_MAP).find(([_, v]) => v.day === sequenceDay);
  const stageNum = nextStage ? parseInt(nextStage[0]) + 1 : 5;

  await pool.query(
    `UPDATE customer_activity_tracking
     SET reengagement_stage = $2, updated_at = now()
     WHERE customer_id = $1`,
    [customerId, stageNum]
  );

  // If final attempt with no response, mark fully dormant
  if (sequenceDay === 180) {
    await pool.query(
      `UPDATE customer_activity_tracking
       SET reengagement_stage = 5, updated_at = now()
       WHERE customer_id = $1`,
      [customerId]
    );
  }

  // TODO: Actually send via SMS/email/push service
  // await notificationEngine.send(customerId, channel, content);
}

// ─── Mark Customer Active ──────────────────────────────────

export async function markCustomerActive(customerId: string): Promise<void> {
  await pool.query(
    `INSERT INTO customer_activity_tracking (customer_id, last_booking_at, dormant_since, reengagement_stage)
     VALUES ($1, now(), NULL, 0)
     ON CONFLICT (customer_id) DO UPDATE SET
       last_booking_at = now(),
       dormant_since = NULL,
       reengagement_stage = 0,
       updated_at = now()`,
    [customerId]
  );
}

// ─── Update Activity Timestamps ────────────────────────────

export async function updateActivity(
  customerId: string,
  field: "last_booking_at" | "last_login_at" | "last_george_chat"
): Promise<void> {
  await pool.query(
    `INSERT INTO customer_activity_tracking (customer_id, ${field})
     VALUES ($1, now())
     ON CONFLICT (customer_id) DO UPDATE SET
       ${field} = now(),
       updated_at = now()`,
    [customerId]
  );
}

// ─── Message Templates ─────────────────────────────────────

function generateMessage(messageType: string, _sequenceDay: number): string {
  const templates: Record<string, string> = {
    weather_tip:
      "Hey! 🌤️ Orlando's been hot lately - your AC filter might be overdue for a swap. Quick tip: changing it every 60 days can cut energy costs 5-15%. No strings attached, just looking out!",
    seasonal_cta:
      "Fall's coming up and it's the perfect time for gutter cleaning before the rain hits. Want me to check availability in your area? We've got some great timing slots open.",
    social_proof:
      "Your neighbor on your street just saved $200 by bundling pressure washing + gutter cleaning. I can put together a similar deal for you - want to see what it'd cost?",
    credit_winback:
      "We miss you! 🎁 Here's a $25 credit toward any service - no minimum, no catch. It expires in 30 days. Want me to find something that'd be perfect for your home?",
    final_attempt:
      "It's been a while! If you're still interested in home services, I'm here whenever you need me. If not, no worries - I'll stop reaching out. Just reply if you ever want to chat!",
  };
  return templates[messageType] ?? templates.weather_tip;
}
