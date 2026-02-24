/**
 * george-events.ts — Mr. George proactive outreach system
 *
 * Event handlers that fire automatically on lifecycle events to make George
 * proactive. All SMS sends respect quiet hours (9 PM – 8 AM EST) and a
 * per-customer daily rate limit (max 1 proactive message per day, except emergencies).
 */

import { sendSms } from './notifications';
import { storage } from '../storage';
import { pool } from '../db';
import { LOYALTY_TIER_CONFIG, POINTS_PER_DOLLAR } from '@shared/schema';

// ─── Rate limiting ────────────────────────────────────────────────────────────
// In-memory map: customerId → last proactive SMS timestamp (ms)
const lastProactiveSms = new Map<string, number>();

function canSendProactiveSms(customerId: string): boolean {
  const last = lastProactiveSms.get(customerId);
  if (!last) return true;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Date.now() - last > msPerDay;
}

function markProactiveSent(customerId: string): void {
  lastProactiveSms.set(customerId, Date.now());
}

// ─── Quiet hours (9 PM – 8 AM Eastern) ───────────────────────────────────────
function isQuietHoursEst(): boolean {
  const nowEst = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
  );
  const hour = nowEst.getHours();
  return hour >= 21 || hour < 9;
}

// ─── Safe SMS helper ──────────────────────────────────────────────────────────
async function sendGeorgeSms(
  to: string,
  message: string,
  customerId: string,
  emergency = false
): Promise<void> {
  if (!emergency && isQuietHoursEst()) {
    console.log(`[George] Quiet hours — skipping SMS to ${to} (customerId: ${customerId})`);
    return;
  }
  if (!emergency && !canSendProactiveSms(customerId)) {
    console.log(`[George] Rate limit hit for customerId ${customerId} — skipping SMS`);
    return;
  }

  const result = await sendSms({ to, message });
  if (result.success) {
    if (!emergency) markProactiveSent(customerId);
    console.log(`[George] SMS sent to ${to} (SID: ${result.sid})`);
  } else {
    console.warn(`[George] SMS failed to ${to}: ${result.error}`);
  }
}

// ─── Service name map ─────────────────────────────────────────────────────────
const SERVICE_NAMES: Record<string, string> = {
  junk_removal: 'junk removal',
  moving: 'move',
  truck_unloading: 'truck unloading',
  garage_cleanout: 'garage cleanout',
  pressure_washing: 'pressure washing',
  gutter_cleaning: 'gutter cleaning',
  moving_labor: 'moving labor',
  light_demolition: 'demo work',
  home_consultation: 'Home DNA Scan',
  home_cleaning: 'home cleaning',
  handyman: 'handyman service',
  pool_cleaning: 'pool cleaning',
  landscaping: 'landscaping',
  carpet_cleaning: 'carpet cleaning',
};

// Intel questions keyed by service type — Mr. George asks exactly one per booking
const INTEL_QUESTIONS: Record<string, string> = {
  junk_removal: "Quick question — is your stuff inside the house or already outside? Helps us bring the right crew.",
  garage_cleanout: "Quick question — is there any large furniture or appliances in the garage? Helps us plan the right truck size.",
  gutter_cleaning: "Quick question — is your place one story or two? Helps us bring the right gear.",
  pressure_washing: "Quick question — is it just the driveway, or also the house exterior? Helps us bring the right equipment.",
  moving: "Quick question — how many flights of stairs, if any? Helps us send the right crew size.",
  truck_unloading: "Quick question — is there elevator access at the destination, or stairs only?",
  home_cleaning: "Quick question — do you have any pets? Helps us bring pet-safe products.",
  handyman: "Quick question — do you have the parts/materials already, or should we bring them?",
  default: "Quick question — any special access notes we should know before we arrive?",
};

// ─── 1. POST-BOOKING FOLLOW-UP ────────────────────────────────────────────────
/**
 * Triggered after a booking is confirmed.
 * George asks ONE intel question relevant to the service type.
 */
export async function onBookingConfirmed(
  bookingId: string,
  userId: string,
  serviceType: string
): Promise<void> {
  console.log(`[George] onBookingConfirmed: bookingId=${bookingId} userId=${userId} service=${serviceType}`);

  try {
    const user = await storage.getUser(userId);
    if (!user?.phone) {
      console.log(`[George] No phone for user ${userId} — skipping booking follow-up`);
      return;
    }

    const serviceName = SERVICE_NAMES[serviceType] || serviceType;
    const intelQ = INTEL_QUESTIONS[serviceType] || INTEL_QUESTIONS.default;
    const message = `Hey, you're all set for your ${serviceName}! ${intelQ} Just reply here. — Mr. George, UpTend AI`;

    await sendGeorgeSms(user.phone, message, userId);
  } catch (err: any) {
    console.error(`[George] onBookingConfirmed error: ${err.message}`);
  }
}

// ─── 2. PRE-ARRIVAL NOTIFICATION ─────────────────────────────────────────────
/**
 * Triggered when a pro marks a job as in_progress (en route to customer).
 * Texts the customer with pro details and an ETA.
 */
export async function onProEnRoute(
  jobId: string,
  customerId: string,
  proId: string
): Promise<void> {
  console.log(`[George] onProEnRoute: jobId=${jobId} customerId=${customerId} proId=${proId}`);

  try {
    const [customer, proUser, proProfile] = await Promise.all([
      storage.getUser(customerId),
      storage.getUser(proId),
      storage.getHaulerProfile(proId),
    ]);

    if (!customer?.phone) {
      console.log(`[George] No phone for customer ${customerId} — skipping en-route SMS`);
      return;
    }

    const proName = proUser
      ? `${proUser.firstName || ''} ${proUser.lastName || ''}`.trim() || 'Your Pro'
      : 'Your Pro';

    // Try to get vehicle info from hauler profile bio (JSON stored there)
    let vehicleHint = '';
    if (proProfile?.bio) {
      try {
        const bio = JSON.parse(proProfile.bio);
        if (bio.vehicleMake && bio.vehicleModel) {
          const color = ''; // not stored in bio
          vehicleHint = ` in a ${bio.vehicleYear || ''} ${bio.vehicleMake} ${bio.vehicleModel}`.trim();
        }
      } catch {
        // bio is not JSON — skip
      }
    }

    const message = `Your UpTend Pro ${proName} is heading your way${vehicleHint}! ETA ~15 min. They'll call if they need help finding you. — Mr. George, UpTend AI`;

    // En-route is time-sensitive — send even if rate limit hit, but respect quiet hours
    const last = lastProactiveSms.get(customerId);
    const withinWindow = !last || Date.now() - last < 24 * 60 * 60 * 1000;

    if (isQuietHoursEst()) {
      console.log(`[George] Quiet hours — skipping en-route SMS for customer ${customerId}`);
      return;
    }

    const result = await sendSms({ to: customer.phone, message });
    if (result.success) {
      console.log(`[George] En-route SMS sent to customer ${customerId}`);
      if (withinWindow) markProactiveSent(customerId);
    } else {
      console.warn(`[George] En-route SMS failed: ${result.error}`);
    }
  } catch (err: any) {
    console.error(`[George] onProEnRoute error: ${err.message}`);
  }
}

// Upsell suggestions by service type
const UPSELL_SUGGESTIONS: Record<string, string> = {
  gutter_cleaning: "While we were up there, we noticed your roof shingles look worn in a few spots. Want a free inspection quote?",
  junk_removal: "We noticed the garage still has some items. Want us to do a full cleanout? We can book it in minutes.",
  pressure_washing: "We can also pressure-wash your roof and patio. Bundle it and save 10%.",
  moving: "Need help setting up furniture in the new place? Our handyman team can help same-day.",
  home_cleaning: "Want to set up a recurring clean? Bi-weekly customers save 15% every visit.",
  garage_cleanout: "Noticed some items that might need a junk removal run. Want a quick quote?",
  default: "We also do handyman, pressure washing, gutter cleaning, and more. Want a quick quote for anything else?",
};

// ─── 3. JOB COMPLETED FOLLOW-UP ──────────────────────────────────────────────
/**
 * Triggered when job status changes to "completed".
 * George sends a follow-up 2 hours later with: rate prompt, upsell, and referral prompt if rating ≥ 4.
 */
export async function onJobCompleted(
  jobId: string,
  customerId: string,
  serviceType: string
): Promise<void> {
  console.log(`[George] onJobCompleted: jobId=${jobId} customerId=${customerId} — scheduling 2hr follow-up`);

  // Schedule 2 hours later
  setTimeout(async () => {
    try {
      const customer = await storage.getUser(customerId);
      if (!customer?.phone) {
        console.log(`[George] No phone for customer ${customerId} — skipping follow-up`);
        return;
      }

      const serviceName = SERVICE_NAMES[serviceType] || serviceType;
      const upsell = UPSELL_SUGGESTIONS[serviceType] || UPSELL_SUGGESTIONS.default;

      // Check loyalty account for referral prompt eligibility
      const loyalty = await storage.getLoyaltyAccount(customerId).catch(() => null);
      const jobsCompleted = loyalty?.lifetimePoints
        ? Math.floor((loyalty.lifetimePoints / POINTS_PER_DOLLAR) / 100) // rough estimate
        : 0;

      const baseMsg = `Hey! How did your ${serviceName} go? Rate your experience in the UpTend app — it helps a lot. Also, ${upsell}`;
      const referralMsg = jobsCompleted >= 1
        ? ` Know anyone else who could use UpTend? Send them your code and you BOTH get $25 credit!`
        : '';
      const message = `${baseMsg}${referralMsg} — Mr. George, UpTend AI`;

      await sendGeorgeSms(customer.phone, message, customerId);
    } catch (err: any) {
      console.error(`[George] onJobCompleted follow-up error: ${err.message}`);
    }
  }, 2 * 60 * 60 * 1000); // 2 hours
}

// ─── 4. PRO LOGIN GREETING ────────────────────────────────────────────────────
/**
 * Triggered when pro hits login successfully.
 * Returns goal progress data to include in the login response.
 */
export async function getProLoginGreeting(proId: string): Promise<object> {
  console.log(`[George] getProLoginGreeting: proId=${proId}`);

  try {
    const [proUser, proProfile] = await Promise.all([
      storage.getUser(proId),
      storage.getHaulerProfile(proId),
    ]);

    const proName = proUser?.firstName || 'there';

    // Monthly earnings: query jobs completed this calendar month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const earningsResult = await pool.query<{ total_payout: string; job_count: string }>(
      `SELECT COALESCE(SUM(hauler_payout), 0) as total_payout, COUNT(*) as job_count
       FROM service_requests
       WHERE assigned_hauler_id = $1
         AND status = 'completed'
         AND paid_at >= $2`,
      [proId, monthStart]
    );

    const monthlyEarnings = parseFloat(earningsResult.rows[0]?.total_payout || '0');
    const monthJobCount = parseInt(earningsResult.rows[0]?.job_count || '0', 10);

    // Today's scheduled jobs
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM service_requests
       WHERE assigned_hauler_id = $1
         AND status IN ('assigned', 'accepted', 'in_progress')
         AND scheduled_date >= $2
         AND scheduled_date <= $3`,
      [proId, todayStart.toISOString(), todayEnd.toISOString()]
    );
    const todayJobCount = parseInt(todayResult.rows[0]?.count || '0', 10);

    // Monthly goal from hauler profile
    const monthlyGoal = (proProfile as any)?.annualIncomeGoal
      ? Math.round((proProfile as any).annualIncomeGoal / 12)
      : 5000;

    const pct = monthlyGoal > 0 ? Math.round((monthlyEarnings / monthlyGoal) * 100) : 0;
    const remaining = Math.max(0, monthlyGoal - monthlyEarnings);
    // Average job payout ~$90 — estimate jobs needed
    const avgJobPayout = 90;
    const jobsNeeded = remaining > 0 ? Math.ceil(remaining / avgJobPayout) : 0;

    let greetingMsg: string;
    if (pct >= 100) {
      greetingMsg = `Welcome back ${proName}! You hit your $${monthlyGoal.toLocaleString()} goal this month — amazing work!`;
    } else if (pct >= 75) {
      greetingMsg = `Welcome back ${proName}! You're at $${monthlyEarnings.toLocaleString()} / $${monthlyGoal.toLocaleString()} this month (${pct}%). Almost there!`;
    } else {
      greetingMsg = `Welcome back ${proName}! You're at $${monthlyEarnings.toLocaleString()} / $${monthlyGoal.toLocaleString()} this month (${pct}%). Need about ${jobsNeeded} more job${jobsNeeded === 1 ? '' : 's'} to hit your goal.`;
    }

    if (todayJobCount > 0) {
      greetingMsg += ` You have ${todayJobCount} job${todayJobCount === 1 ? '' : 's'} scheduled today.`;
    }

    return {
      greeting: greetingMsg,
      monthlyEarnings,
      monthlyGoal,
      progressPercent: pct,
      monthJobCount,
      todayJobCount,
    };
  } catch (err: any) {
    console.error(`[George] getProLoginGreeting error: ${err.message}`);
    // Non-blocking — return a safe fallback
    return { greeting: 'Welcome back!', monthlyEarnings: 0, monthlyGoal: 0, progressPercent: 0 };
  }
}

// ─── 5. MAINTENANCE REMINDER CHECK (CRON) ────────────────────────────────────
/**
 * Runs daily (triggered via cron endpoint).
 * Checks property_health_events for maintenance items due within 7 days
 * and sends SMS to the property owner.
 */
export async function checkMaintenanceReminders(): Promise<{ sent: number; skipped: number }> {
  console.log('[George] checkMaintenanceReminders: scanning for upcoming maintenance...');

  let sent = 0;
  let skipped = 0;

  try {
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    // Query property_health_events for upcoming maintenance reminders
    const result = await pool.query<{
      customer_id: string;
      event_type: string;
      description: string;
      scheduled_date: string;
      days_until: number;
    }>(
      `SELECT
         p.customer_id,
         phe.event_type,
         phe.description,
         phe.scheduled_date,
         EXTRACT(DAY FROM (phe.scheduled_date::timestamp - NOW()))::int as days_until
       FROM property_health_events phe
       JOIN properties p ON phe.property_id = p.id
       WHERE phe.status = 'scheduled'
         AND phe.scheduled_date >= $1
         AND phe.scheduled_date <= $2
         AND phe.event_type = 'maintenance_reminder'
       ORDER BY phe.scheduled_date ASC`,
      [now, sevenDaysFromNow]
    ).catch(() => ({ rows: [] as any[] }));

    for (const row of result.rows) {
      try {
        const customer = await storage.getUser(row.customer_id);
        if (!customer?.phone) {
          skipped++;
          continue;
        }

        const daysUntil = row.days_until ?? 7;
        const dayText = daysUntil <= 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`;
        const message = `Hey! Your ${row.description || 'home maintenance'} is due ${dayText}. Want me to book a Pro to handle it? Just reply YES and I'll set it up. — Mr. George, UpTend AI`;

        await sendGeorgeSms(customer.phone, message, customer.id);
        sent++;
      } catch (rowErr: any) {
        console.error(`[George] Maintenance reminder row error: ${rowErr.message}`);
        skipped++;
      }
    }

    console.log(`[George] Maintenance reminders: ${sent} sent, ${skipped} skipped`);
  } catch (err: any) {
    console.error(`[George] checkMaintenanceReminders error: ${err.message}`);
  }

  return { sent, skipped };
}

// ─── 6. EMERGENCY DETECTION ───────────────────────────────────────────────────
const EMERGENCY_KEYWORDS = [
  'pipe burst', 'bursting pipe', 'flooding', 'flood',
  'water everywhere', 'water all over',
  'tree fell', 'tree down', 'fallen tree',
  'no power', 'power out', 'power outage',
  'gas smell', 'smell gas', 'gas leak',
  'fire damage', 'my house is on fire',
];

export function isEmergencyMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return EMERGENCY_KEYWORDS.some(kw => lower.includes(kw));
}

/**
 * Triggered when George detects emergency keywords in chat.
 * Bypasses normal flow — immediately searches for available emergency pros
 * and texts both the nearest pro and the customer.
 */
export async function handleEmergency(
  userId: string,
  message: string,
  location: { zip: string }
): Promise<{ dispatched: boolean; proName?: string; eta?: number }> {
  console.log(`[George] EMERGENCY detected for userId=${userId} zip=${location.zip}: "${message.slice(0, 60)}..."`);

  try {
    const customer = await storage.getUser(userId);

    // Find available pros who can accept jobs
    const availableResult = await pool.query<{
      user_id: string;
      phone: string;
      first_name: string;
      last_name: string;
    }>(
      `SELECT u.id as user_id, hp.phone, u.first_name, u.last_name
       FROM hauler_profiles hp
       JOIN users u ON hp.user_id = u.id
       WHERE hp.is_available = true
         AND hp.can_accept_jobs = true
         AND hp.background_check_status = 'clear'
       ORDER BY RANDOM()
       LIMIT 3`
    ).catch(() => ({ rows: [] as any[] }));

    if (availableResult.rows.length === 0) {
      // No pros available — text customer that we're on it
      if (customer?.phone) {
        await sendSms({
          to: customer.phone,
          message: `URGENT UpTend Alert: We received your emergency request and are manually dispatching a Pro right now. Someone will call you within 5 minutes. Stay safe! — Mr. George, UpTend`,
        });
      }
      console.log('[George] Emergency: no available pros — alerted customer, needs manual dispatch');
      return { dispatched: false };
    }

    const pro = availableResult.rows[0];
    const proName = `${pro.first_name || ''} ${pro.last_name || ''}`.trim() || 'Pro';
    const etaMinutes = 20; // Default ETA estimate

    // Alert the pro
    if (pro.phone) {
      await sendSms({
        to: pro.phone,
        message: `EMERGENCY JOB — UpTend: Customer near ${location.zip} needs urgent help: "${message.slice(0, 120)}". Estimated ETA 20 min. Open the app to accept immediately.`,
      });
    }

    // Alert the customer (emergency = bypass rate limit and quiet hours)
    if (customer?.phone) {
      await sendSms({
        to: customer.phone,
        message: `UpTend Emergency Response: We're dispatching ${proName} to you now! ETA ~${etaMinutes} minutes. They'll call you shortly. If life-threatening, call 911 first. — George`,
      });
    }

    console.log(`[George] Emergency dispatched: pro ${pro.user_id} (${proName}) → customer ${userId}`);
    return { dispatched: true, proName, eta: etaMinutes };
  } catch (err: any) {
    console.error(`[George] handleEmergency error: ${err.message}`);
    return { dispatched: false };
  }
}

// ─── 7. PROACTIVE OUTREACH: POST-SERVICE FOLLOW-UP ───────────────────────────
/**
 * Query jobs completed ~48 hours ago, send follow-up SMS.
 * Checks consent, quiet hours, and 7-day message cap per customer.
 */
export async function sendPostServiceFollowUp(): Promise<{ sent: number; skipped: number }> {
  console.log('[George] sendPostServiceFollowUp: scanning for 48hr follow-ups...');
  let sent = 0;
  let skipped = 0;

  try {
    if (isQuietHoursEst()) {
      console.log('[George] Quiet hours — skipping post-service follow-up batch');
      return { sent, skipped };
    }

    // Jobs completed between 44-52 hours ago (window around 48hr mark)
    const result = await pool.query<{
      customer_id: string;
      service_type: string;
      first_name: string;
      phone: string;
    }>(
      `SELECT DISTINCT ON (sr.customer_id)
         sr.customer_id,
         sr.service_type,
         u.first_name,
         u.phone
       FROM service_requests sr
       JOIN users u ON sr.customer_id = u.id
       WHERE sr.status = 'completed'
         AND sr.completed_at >= NOW() - INTERVAL '52 hours'
         AND sr.completed_at <= NOW() - INTERVAL '44 hours'
         AND u.phone IS NOT NULL AND u.phone != ''
         AND NOT EXISTS (
           SELECT 1 FROM reengagement_messages rm
           WHERE rm.customer_id = sr.customer_id
             AND rm.sent_at >= NOW() - INTERVAL '7 days'
         )
       ORDER BY sr.customer_id, sr.completed_at DESC
       LIMIT 200`
    ).catch(() => ({ rows: [] as any[] }));

    for (const row of result.rows) {
      try {
        // Check SMS consent
        const consent = await pool.query(
          `SELECT 1 FROM customer_action_tracking
           WHERE user_id = $1 AND action_type = 'consent_sms' AND action_data->>'enabled' = 'true'
           LIMIT 1`,
          [row.customer_id]
        ).catch(() => ({ rows: [] as any[] }));
        if (consent.rows.length === 0) { skipped++; continue; }

        const name = row.first_name || 'there';
        const service = SERVICE_NAMES[row.service_type] || row.service_type.replace(/_/g, ' ');
        const message = `Hey ${name}! Mr. George here 👋 How's everything looking after your ${service}? If anything needs attention, just reply and I'll take care of it.`;

        await sendGeorgeSms(row.phone, message, row.customer_id);

        // Log to reengagement_messages
        await pool.query(
          `INSERT INTO reengagement_messages (customer_id, message_type, message_text, sent_at)
           VALUES ($1, 'post_service_followup', $2, NOW())`,
          [row.customer_id, message]
        ).catch(() => {});

        sent++;
      } catch (rowErr: any) {
        console.error(`[George] Post-service follow-up row error: ${rowErr.message}`);
        skipped++;
      }
    }
  } catch (err: any) {
    console.error(`[George] sendPostServiceFollowUp error: ${err.message}`);
  }

  console.log(`[George] Post-service follow-up: ${sent} sent, ${skipped} skipped`);
  return { sent, skipped };
}

// ─── 8. PROACTIVE OUTREACH: WEATHER HEADS-UP ─────────────────────────────────
/**
 * Check NWS for severe weather alerts, SMS customers with relevant tips.
 */
export async function sendWeatherHeadsUp(): Promise<{ sent: number; skipped: number; alertCount: number }> {
  console.log('[George] sendWeatherHeadsUp: checking for severe weather...');
  let sent = 0;
  let skipped = 0;

  try {
    if (isQuietHoursEst()) {
      console.log('[George] Quiet hours — skipping weather heads-up');
      return { sent, skipped, alertCount: 0 };
    }

    const alertRes = await fetch("https://api.weather.gov/alerts/active?area=FL&severity=Extreme,Severe", {
      headers: { "User-Agent": "UpTend-George/1.0 (contact@uptendapp.com)" },
      signal: AbortSignal.timeout(8000),
    }).then(r => r.json()).catch(() => null);

    if (!alertRes?.features?.length) {
      console.log('[George] No severe weather alerts — nothing to send');
      return { sent, skipped, alertCount: 0 };
    }

    // Filter for Orlando/Central FL
    const orlandoKeywords = ["orange", "orlando", "seminole", "osceola", "lake", "central florida"];
    const relevant = alertRes.features.filter((f: any) => {
      const desc = ((f.properties?.areaDesc || "") + " " + (f.properties?.headline || "")).toLowerCase();
      return orlandoKeywords.some((kw: string) => desc.includes(kw));
    });

    if (relevant.length === 0) {
      console.log('[George] No Orlando-area severe alerts');
      return { sent, skipped, alertCount: 0 };
    }

    const topAlert = relevant[0].properties;
    const eventName = topAlert.event || "Severe weather";

    // Weather-specific tips
    const tipMap: Record<string, string> = {
      "Hurricane Warning": "Secure outdoor furniture, fill bathtubs for water, charge all devices.",
      "Hurricane Watch": "Stock up on water, batteries, and non-perishables. Review your evacuation route.",
      "Tornado Warning": "Get to an interior room on the lowest floor immediately. Stay away from windows.",
      "Tornado Watch": "Stay alert and keep an eye on conditions. Have a safe room plan ready.",
      "Severe Thunderstorm Warning": "Stay indoors, unplug sensitive electronics, and stay away from windows.",
      "Tropical Storm Warning": "Secure loose outdoor items and keep your phone charged.",
      "Flood Warning": "Avoid driving through standing water. Move valuables to higher ground.",
    };
    const tip = tipMap[eventName] || "Stay safe, stay informed, and keep emergency supplies ready.";

    // Get customers in Orlando area with consent
    const customers = await pool.query<{
      id: string;
      first_name: string;
      phone: string;
    }>(
      `SELECT DISTINCT u.id, u.first_name, u.phone
       FROM users u
       WHERE u.role = 'customer'
         AND u.phone IS NOT NULL AND u.phone != ''
         AND EXISTS (
           SELECT 1 FROM customer_action_tracking cat
           WHERE cat.user_id = u.id AND cat.action_type = 'consent_sms' AND cat.action_data->>'enabled' = 'true'
         )
         AND NOT EXISTS (
           SELECT 1 FROM reengagement_messages rm
           WHERE rm.customer_id = u.id
             AND rm.sent_at >= NOW() - INTERVAL '7 days'
         )
       LIMIT 500`
    ).catch(() => ({ rows: [] as any[] }));

    for (const customer of customers.rows) {
      try {
        const name = customer.first_name || 'there';
        const message = `Hey ${name}, Mr. George here. ${eventName} headed our way. ${tip} Need help prepping? Just reply.`;

        await sendGeorgeSms(customer.phone, message, customer.id);

        await pool.query(
          `INSERT INTO reengagement_messages (customer_id, message_type, message_text, sent_at)
           VALUES ($1, 'weather_headsup', $2, NOW())`,
          [customer.id, message]
        ).catch(() => {});

        sent++;
      } catch (rowErr: any) {
        console.error(`[George] Weather heads-up row error: ${rowErr.message}`);
        skipped++;
      }
    }

    console.log(`[George] Weather heads-up: ${sent} sent, ${skipped} skipped, ${relevant.length} alerts`);
    return { sent, skipped, alertCount: relevant.length };
  } catch (err: any) {
    console.error(`[George] sendWeatherHeadsUp error: ${err.message}`);
    return { sent, skipped, alertCount: 0 };
  }
}

// ─── 9. PROACTIVE OUTREACH: MAINTENANCE NUDGE ────────────────────────────────
/**
 * Query maintenance_reminders due within 7 days, send gentle nudge SMS.
 */
export async function sendMaintenanceNudge(): Promise<{ sent: number; skipped: number }> {
  console.log('[George] sendMaintenanceNudge: scanning for upcoming maintenance...');
  let sent = 0;
  let skipped = 0;

  try {
    if (isQuietHoursEst()) {
      console.log('[George] Quiet hours — skipping maintenance nudge');
      return { sent, skipped };
    }

    const result = await pool.query<{
      customer_id: string;
      reminder_type: string;
      first_name: string;
      phone: string;
    }>(
      `SELECT DISTINCT ON (mr.customer_id)
         mr.customer_id,
         mr.reminder_type,
         u.first_name,
         u.phone
       FROM maintenance_reminders mr
       JOIN users u ON mr.customer_id = u.id
       WHERE mr.next_due <= NOW() + INTERVAL '7 days'
         AND mr.next_due >= NOW()
         AND u.phone IS NOT NULL AND u.phone != ''
         AND EXISTS (
           SELECT 1 FROM customer_action_tracking cat
           WHERE cat.user_id = mr.customer_id AND cat.action_type = 'consent_sms' AND cat.action_data->>'enabled' = 'true'
         )
         AND NOT EXISTS (
           SELECT 1 FROM reengagement_messages rm
           WHERE rm.customer_id = mr.customer_id
             AND rm.sent_at >= NOW() - INTERVAL '7 days'
         )
       ORDER BY mr.customer_id, mr.next_due ASC
       LIMIT 200`
    ).catch(() => ({ rows: [] as any[] }));

    for (const row of result.rows) {
      try {
        const name = row.first_name || 'there';
        const reminderType = (row.reminder_type || 'maintenance').replace(/_/g, ' ');
        const message = `Hey ${name}! Quick heads up from Mr. George — your ${reminderType} is due this week. Want me to book a pro, or I can walk you through doing it yourself?`;

        await sendGeorgeSms(row.phone, message, row.customer_id);

        await pool.query(
          `INSERT INTO reengagement_messages (customer_id, message_type, message_text, sent_at)
           VALUES ($1, 'maintenance_nudge', $2, NOW())`,
          [row.customer_id, message]
        ).catch(() => {});

        sent++;
      } catch (rowErr: any) {
        console.error(`[George] Maintenance nudge row error: ${rowErr.message}`);
        skipped++;
      }
    }
  } catch (err: any) {
    console.error(`[George] sendMaintenanceNudge error: ${err.message}`);
  }

  console.log(`[George] Maintenance nudge: ${sent} sent, ${skipped} skipped`);
  return { sent, skipped };
}

// ─── 10. PROACTIVE OUTREACH: HOME SCAN PROMO ─────────────────────────────────
/**
 * For customers with 0 home scans and inactive 7+ days, send Home DNA Scan promo.
 */
export async function sendHomeScanPromo(): Promise<{ sent: number; skipped: number }> {
  console.log('[George] sendHomeScanPromo: finding eligible customers...');
  let sent = 0;
  let skipped = 0;

  try {
    if (isQuietHoursEst()) {
      console.log('[George] Quiet hours — skipping home scan promo');
      return { sent, skipped };
    }

    const result = await pool.query<{
      id: string;
      first_name: string;
      phone: string;
    }>(
      `SELECT u.id, u.first_name, u.phone
       FROM users u
       WHERE u.role = 'customer'
         AND u.phone IS NOT NULL AND u.phone != ''
         AND u.last_active_at <= NOW() - INTERVAL '7 days'
         AND NOT EXISTS (
           SELECT 1 FROM home_scan_sessions hss
           WHERE hss.customer_id = u.id
         )
         AND EXISTS (
           SELECT 1 FROM customer_action_tracking cat
           WHERE cat.user_id = u.id AND cat.action_type = 'consent_sms' AND cat.action_data->>'enabled' = 'true'
         )
         AND NOT EXISTS (
           SELECT 1 FROM reengagement_messages rm
           WHERE rm.customer_id = u.id
             AND rm.sent_at >= NOW() - INTERVAL '7 days'
         )
       LIMIT 200`
    ).catch(() => ({ rows: [] as any[] }));

    for (const row of result.rows) {
      try {
        const name = row.first_name || 'there';
        const message = `Hey ${name}! Did you know you can get a free Home DNA Scan? It checks your home's health and catches small problems before they get expensive. Takes 15 minutes. Want me to set one up?`;

        await sendGeorgeSms(row.phone, message, row.id);

        await pool.query(
          `INSERT INTO reengagement_messages (customer_id, message_type, message_text, sent_at)
           VALUES ($1, 'home_scan_promo', $2, NOW())`,
          [row.id, message]
        ).catch(() => {});

        sent++;
      } catch (rowErr: any) {
        console.error(`[George] Home scan promo row error: ${rowErr.message}`);
        skipped++;
      }
    }
  } catch (err: any) {
    console.error(`[George] sendHomeScanPromo error: ${err.message}`);
  }

  console.log(`[George] Home scan promo: ${sent} sent, ${skipped} skipped`);
  return { sent, skipped };
}

// ─── 11. SEASONAL CAMPAIGN (CRON) ────────────────────────────────────────────
// Florida-specific seasonal maintenance tips by month
const SEASONAL_TIPS: Record<number, { service: string; msg: string }> = {
  1:  { service: 'pressure_washing', msg: "New year, fresh home! January is perfect for pressure washing — clean off the holiday grime. Book now →" },
  2:  { service: 'pool_cleaning',    msg: "Pool season is coming! February is the best time to get your pool prepped and sparkling before the heat hits. Book a pool opening →" },
  3:  { service: 'home_cleaning',    msg: "Spring cleaning time! Get a deep clean before the hot months arrive. Book a Pro →" },
  4:  { service: 'pressure_washing', msg: "April showers bring — dirty driveways! A pressure wash now keeps your home looking sharp. Book now →" },
  5:  { service: 'gutter_cleaning',  msg: "Hurricane season starts June 1st. Clean gutters now = safer home in a storm. Book gutter cleaning →" },
  6:  { service: 'handyman',         msg: "Hurricane prep check: loose shutters, roof shingles, A/C filters? Our handymen handle it all. Book a Pro →" },
  7:  { service: 'home_cleaning',    msg: "Summer's in full swing! Beat the heat with a fresh, clean home. Book a deep clean →" },
  8:  { service: 'pressure_washing', msg: "August storms leave a mess. Give your driveway and exterior a post-storm pressure wash. Book now →" },
  9:  { service: 'home_cleaning',    msg: "Back-to-school season = back-to-clean season. Get your home guest-ready for fall. Book now →" },
  10: { service: 'gutter_cleaning',  msg: "October leaves are falling — clean those gutters before the rainy season. Book gutter cleaning →" },
  11: { service: 'home_cleaning',    msg: "Company coming for the holidays? Get a deep clean before Thanksgiving. Book now →" },
  12: { service: 'junk_removal',     msg: "Year-end cleanout time! Clear the clutter before the new year. Book a junk removal →" },
};

/**
 * Runs on the 1st of each month (triggered via cron endpoint).
 * Sends seasonal maintenance tips to customers who haven't booked in 30+ days.
 */
export async function sendSeasonalCampaign(): Promise<{ sent: number; skipped: number }> {
  const month = new Date().getMonth() + 1; // 1–12
  const tip = SEASONAL_TIPS[month];
  console.log(`[George] sendSeasonalCampaign: month=${month}`);

  let sent = 0;
  let skipped = 0;

  if (!tip) {
    console.log('[George] No seasonal tip configured for this month');
    return { sent, skipped };
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Find customers who haven't booked in 30+ days and have a phone number
    const result = await pool.query<{ id: string; phone: string; first_name: string }>(
      `SELECT DISTINCT u.id, u.phone, u.first_name
       FROM users u
       WHERE u.role = 'customer'
         AND u.phone IS NOT NULL
         AND u.phone != ''
         AND NOT EXISTS (
           SELECT 1 FROM service_requests sr
           WHERE sr.customer_id = u.id
             AND sr.created_at >= $1
         )
       LIMIT 500`,
      [thirtyDaysAgo]
    ).catch(() => ({ rows: [] as any[] }));

    for (const customer of result.rows) {
      try {
        const name = customer.first_name ? ` ${customer.first_name}` : '';
        const message = `Hey${name}! ${tip.msg} Reply STOP to opt out. — Mr. George, UpTend AI`;
        await sendGeorgeSms(customer.phone, message, customer.id);
        sent++;
      } catch (rowErr: any) {
        console.error(`[George] Seasonal campaign row error: ${rowErr.message}`);
        skipped++;
      }
    }

    console.log(`[George] Seasonal campaign: ${sent} sent, ${skipped} skipped`);
  } catch (err: any) {
    console.error(`[George] sendSeasonalCampaign error: ${err.message}`);
  }

  return { sent, skipped };
}

// ─── 8. LOYALTY TIER UPDATE ───────────────────────────────────────────────────
// Tier thresholds in lifetime spend dollars (mapped from points: 10 pts/$)
const TIER_SPEND_THRESHOLDS: Record<string, number> = {
  bronze:   0,
  silver:   LOYALTY_TIER_CONFIG.silver.minPoints / POINTS_PER_DOLLAR,   // $50
  gold:     LOYALTY_TIER_CONFIG.gold.minPoints / POINTS_PER_DOLLAR,     // $200
  platinum: LOYALTY_TIER_CONFIG.platinum.minPoints / POINTS_PER_DOLLAR, // $500
};

const TIER_MESSAGES: Record<string, string> = {
  silver:   "You just hit Silver tier! That means 5% off every service + priority scheduling. Thanks for being an UpTend regular!",
  gold:     "You just hit Gold tier! That means 10% off every service + priority scheduling. You're a true UpTend VIP!",
  platinum: "You just hit Platinum tier — the highest level! 15% off everything + priority matching + our best Pros first. You're legendary!",
};

/**
 * Triggered after payment is captured for a completed job.
 * Recalculates customer lifetime spend, updates tier if threshold crossed,
 * and sends congratulatory SMS if tier upgraded.
 */
export async function onPaymentCaptured(
  customerId: string,
  amountCents: number
): Promise<void> {
  console.log(`[George] onPaymentCaptured: customerId=${customerId} amount=${amountCents}¢`);

  try {
    const amountDollars = amountCents / 100;
    const pointsEarned = Math.floor(amountDollars * POINTS_PER_DOLLAR);

    // Get current loyalty account before update
    const priorAccount = await storage.getLoyaltyAccount(customerId).catch(() => null);
    const priorTier = priorAccount?.currentTier || 'bronze';

    // Add points (this also recalculates and upgrades tier internally)
    await storage.addLoyaltyPoints(customerId, pointsEarned, `Earned from job payment ($${amountDollars.toFixed(2)})`);

    // Check if tier changed
    const updatedAccount = await storage.getLoyaltyAccount(customerId).catch(() => null);
    const newTier = updatedAccount?.currentTier || 'bronze';

    if (newTier !== priorTier && TIER_MESSAGES[newTier]) {
      const customer = await storage.getUser(customerId);
      if (customer?.phone) {
        const message = `${TIER_MESSAGES[newTier]} — Mr. George, UpTend AI`;
        await sendGeorgeSms(customer.phone, message, customerId);
      }
      console.log(`[George] Tier upgrade: customer ${customerId} ${priorTier} → ${newTier}`);
    }
  } catch (err: any) {
    console.error(`[George] onPaymentCaptured error: ${err.message}`);
  }
}

// ─── 9. REFERRAL COMPLETION ───────────────────────────────────────────────────
/**
 * Triggered when a referred user completes their first booking.
 * Credits both referrer and referee and notifies the referrer.
 */
export async function onReferralCompleted(referralId: string): Promise<void> {
  console.log(`[George] onReferralCompleted: referralId=${referralId}`);

  try {
    const result = await pool.query<{
      referrer_id: string;
      referred_user_id: string;
      referral_code: string;
    }>(
      `SELECT referrer_id, referred_user_id, referral_code
       FROM referrals
       WHERE id = $1`,
      [referralId]
    ).catch(() => ({ rows: [] as any[] }));

    if (result.rows.length === 0) {
      console.log(`[George] Referral ${referralId} not found`);
      return;
    }

    const { referrer_id, referred_user_id } = result.rows[0];

    // Credit both parties — $25 = 2500 cents = 250 points at 10pts/$
    const creditPoints = 250;
    await Promise.all([
      storage.addLoyaltyPoints(referrer_id, creditPoints, `Referral bonus — friend completed first booking`),
      storage.addLoyaltyPoints(referred_user_id, creditPoints, `Welcome bonus — first booking complete`),
    ]).catch(err => console.error(`[George] Referral credit error: ${err.message}`));

    // Mark referral as completed in DB
    await pool.query(
      `UPDATE referrals SET status = 'completed', completed_at = NOW() WHERE id = $1`,
      [referralId]
    ).catch(() => {});

    // Notify the referrer
    const referrer = await storage.getUser(referrer_id);
    const referred = await storage.getUser(referred_user_id);
    if (referrer?.phone) {
      const referredName = referred?.firstName || 'Your friend';
      const message = `${referredName} just completed their first UpTend booking! You both earned $25 in credit. Keep the referrals coming! — Mr. George, UpTend AI`;
      await sendGeorgeSms(referrer.phone, message, referrer_id);
    }
  } catch (err: any) {
    console.error(`[George] onReferralCompleted error: ${err.message}`);
  }
}

// ─── 10. SMART HOME ALERT ─────────────────────────────────────────────────────
type SmartHomeAlertData = Record<string, any>;

const SMART_HOME_RESPONSES: Record<string, (data: SmartHomeAlertData) => string> = {
  water_leak: () =>
    `Water leak detected at your home! I'm searching for an available plumber right now. Reply YES to dispatch immediately, or call 911 if flooding is severe. — Mr. George, UpTend AI`,
  doorbell: () =>
    `Your doorbell rang! If you have a job scheduled today, that's likely your UpTend Pro arriving. Reply CONFIRM to let them in. — Mr. George, UpTend AI`,
  ac_overrun: (data) =>
    `Your A/C has been running ${data.hours || 'many'} hours straight — that's unusual for Florida! This could mean it needs servicing. Want me to book an HVAC check? — Mr. George, UpTend AI`,
  smoke: () =>
    `Smoke detected at your home! If this is an emergency, call 911 immediately. If it's a false alarm, reply DISMISS. Otherwise reply HELP to dispatch a Pro. — Mr. George, UpTend AI`,
  default: (data) =>
    `Smart home alert from your ${data.deviceType || 'device'}: ${data.message || 'check your home'}. Need UpTend assistance? Reply YES. — Mr. George, UpTend AI`,
};

/**
 * Triggered by a webhook from a connected smart home device.
 * Mr. George auto-responds based on alert type.
 */
export async function onSmartHomeAlert(
  userId: string,
  deviceType: string,
  alertData: SmartHomeAlertData
): Promise<{ handled: boolean; action?: string }> {
  console.log(`[George] onSmartHomeAlert: userId=${userId} deviceType=${deviceType}`);

  try {
    const customer = await storage.getUser(userId);
    if (!customer?.phone) {
      console.log(`[George] No phone for user ${userId} — skipping smart home alert`);
      return { handled: false };
    }

    const responseFn = SMART_HOME_RESPONSES[deviceType] || SMART_HOME_RESPONSES.default;
    const message = responseFn({ ...alertData, deviceType });

    // Smart home alerts are semi-urgent — bypass rate limit but respect quiet hours
    // Water leaks and smoke are true emergencies
    const isUrgent = ['water_leak', 'smoke'].includes(deviceType);

    if (isUrgent) {
      // Emergency — bypass everything
      await sendSms({ to: customer.phone, message });
      console.log(`[George] Smart home URGENT alert sent to user ${userId}`);
    } else {
      await sendGeorgeSms(customer.phone, message, userId);
    }

    return { handled: true, action: deviceType };
  } catch (err: any) {
    console.error(`[George] onSmartHomeAlert error: ${err.message}`);
    return { handled: false };
  }
}

// ─── Government Contract Scanner (Admin Only) ─────────────────────

export async function scanGovernmentContracts(): Promise<{ found: number; emailed: boolean }> {
  const adminEmail = process.env.ADMIN_EMAIL || "alan@uptendapp.com";
  const samApiKey = process.env.SAM_GOV_API_KEY;
  
  if (!samApiKey) {
    console.log("[GOV-SCAN] SAM_GOV_API_KEY not configured, skipping");
    return { found: 0, emailed: false };
  }

  try {
    // Search for opportunities matching our service categories in Florida
    const keywords = ["debris removal", "janitorial", "landscaping", "pressure washing", "cleaning services", "building maintenance", "facility maintenance", "grounds maintenance"];
    const allOpportunities: any[] = [];

    for (const keyword of keywords) {
      try {
        const url = `https://api.sam.gov/opportunities/v2/search?api_key=${samApiKey}&postedFrom=${getDateDaysAgo(1)}&postedTo=${getTodayDate()}&ptype=o&soltype=o&state=FL&keyword=${encodeURIComponent(keyword)}&limit=10`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const opps = data?.opportunitiesData || [];
          allOpportunities.push(...opps);
        }
      } catch (e) {
        // Individual keyword search failed, continue
      }
    }

    // Deduplicate by noticeId
    const seen = new Set<string>();
    const unique = allOpportunities.filter(o => {
      const id = o.noticeId || o.solicitationNumber || JSON.stringify(o).slice(0, 50);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    if (unique.length === 0) {
      console.log("[GOV-SCAN] No new opportunities found today");
      return { found: 0, emailed: false };
    }

    // Build email
    const rows = unique.map(o => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;font-size:13px"><strong>${o.title || "Untitled"}</strong></td>
        <td style="padding:8px;border-bottom:1px solid #eee;font-size:13px">${o.department || o.fullParentPathName || "N/A"}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;font-size:13px">${o.type || "N/A"}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;font-size:13px">${o.responseDeadLine || "N/A"}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;font-size:13px">
          ${o.uiLink ? `<a href="${o.uiLink}" style="color:#F47C20">View</a>` : "N/A"}
        </td>
      </tr>
    `).join("");

    const html = `
      <div style="font-family:-apple-system,sans-serif;max-width:700px;margin:0 auto;padding:20px">
        <div style="background:#F47C20;padding:16px 24px;border-radius:8px 8px 0 0">
          <h1 style="color:white;margin:0;font-size:20px">🏛️ Government Contract Alert</h1>
          <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px">${unique.length} new opportunities found in Florida</p>
        </div>
        <div style="background:white;padding:20px 24px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 8px 8px">
          <table style="width:100%;border-collapse:collapse">
            <tr style="background:#f8f8f8">
              <th style="padding:8px;text-align:left;font-size:12px">Title</th>
              <th style="padding:8px;text-align:left;font-size:12px">Agency</th>
              <th style="padding:8px;text-align:left;font-size:12px">Type</th>
              <th style="padding:8px;text-align:left;font-size:12px">Deadline</th>
              <th style="padding:8px;text-align:left;font-size:12px">Link</th>
            </tr>
            ${rows}
          </table>
          <p style="margin-top:16px;font-size:12px;color:#666">
            These contracts match UpTend's service categories (cleaning, maintenance, landscaping, debris removal) in Florida.
            Review and decide which ones to bid on through the SDVOSB subsidiary.
          </p>
          <p style="font-size:11px;color:#999;margin-top:12px">This is an automated scan from Mr. George. Runs daily at 7 AM EST.</p>
        </div>
      </div>
    `;

    // Send email
    const nodemailer = await import("nodemailer");
    let transporter;
    if (process.env.SENDGRID_API_KEY) {
      transporter = nodemailer.createTransport({
        host: "smtp.sendgrid.net",
        port: 587,
        auth: { user: "apikey", pass: process.env.SENDGRID_API_KEY },
      });
    } else {
      console.log("[GOV-SCAN] No email configured, logging results");
      console.log(`[GOV-SCAN] Found ${unique.length} opportunities`);
      return { found: unique.length, emailed: false };
    }

    await transporter.sendMail({
      from: process.env.FROM_EMAIL || "UpTend <noreply@uptendapp.com>",
      to: adminEmail,
      subject: `🏛️ ${unique.length} Government Contract Opportunities — Florida`,
      html,
    });

    console.log(`[GOV-SCAN] Emailed ${unique.length} opportunities to ${adminEmail}`);
    return { found: unique.length, emailed: true };
  } catch (err) {
    console.error("[GOV-SCAN] Error:", err);
    return { found: 0, emailed: false };
  }
}

function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0].replace(/-/g, "/");
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0].replace(/-/g, "/");
}
