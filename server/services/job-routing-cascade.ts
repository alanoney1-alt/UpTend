/**
 * Job Offer Routing Cascade
 *
 * When a customer books through George, this engine offers the job to pros
 * in priority order. If a pro declines or times out, it cascades to the next.
 * Customer price NEVER changes — only pro payout may increase at sweetener tier.
 *
 * Escalation tiers:
 *   Tier 1: Best-match pro, 85% payout, 10 min timeout
 *   Tier 2: Next pro, 85% payout, 30 min timeout
 *   Tier 3: Sweetener — 90% payout, 60 min timeout
 *   Tier 4: Expand radius + notify customer of delay
 */

import { db } from "../db";
import {
  serviceRequests,
  haulerProfiles,
  pyckerOnlineStatus,
  matchAttempts,
} from "../../shared/schema";
import { eq, and, ne, sql, notInArray, desc, asc } from "drizzle-orm";

// ─── Types ───────────────────────────────────

export interface CascadeState {
  jobId: string;
  currentTier: 1 | 2 | 3 | 4;
  offeredTo: OfferRecord[];
  status: "pending" | "accepted" | "exhausted" | "cancelled";
  acceptedByProId?: string;
  startedAt: string;
  lastEscalatedAt?: string;
}

export interface OfferRecord {
  proId: string;
  profileId: string;
  tier: number;
  offeredAt: string;
  respondedAt?: string;
  response?: "accepted" | "declined" | "expired";
  payoutPercent: number;
}

export interface ProCandidate {
  profileId: string;
  userId: string;
  companyName: string;
  distanceMiles: number;
  rating: number;
  hourlyRate: number;
  pyckerTier: string;
  serviceTypes: string[];
  payoutPercentage: number;
}

// ─── In-memory cascade store (swap for Redis/DB in prod) ─────

const cascadeStore = new Map<string, CascadeState>();

// ─── Timeouts per tier (ms) ──────────────────

const TIER_TIMEOUTS: Record<number, number> = {
  1: 10 * 60 * 1000,   // 10 minutes
  2: 30 * 60 * 1000,   // 30 minutes
  3: 60 * 60 * 1000,   // 60 minutes
  4: Infinity,          // manual resolution
};

const TIER_PAYOUT: Record<number, number> = {
  1: 0.85,
  2: 0.85,
  3: 0.90, // sweetener
  4: 0.90,
};

// ─── Core Functions ──────────────────────────

/**
 * Find online pros matching the job, sorted by priority:
 * proximity > rating > tier pricing > service specialty
 */
export async function findMatchingPros(
  jobId: string,
  excludeProIds: string[] = [],
  expandRadius: boolean = false
): Promise<ProCandidate[]> {
  const [job] = await db
    .select()
    .from(serviceRequests)
    .where(eq(serviceRequests.id, jobId))
    .limit(1);

  if (!job) throw new Error(`Job ${jobId} not found`);

  const pickupLat = job.pickupLat;
  const pickupLng = job.pickupLng;

  if (!pickupLat || !pickupLng) {
    throw new Error(`Job ${jobId} has no pickup coordinates`);
  }

  // Get online pros
  const onlinePros = await db
    .select({
      profileId: haulerProfiles.id,
      userId: haulerProfiles.userId,
      companyName: haulerProfiles.companyName,
      rating: haulerProfiles.rating,
      hourlyRate: haulerProfiles.hourlyRate,
      pyckerTier: haulerProfiles.pyckerTier,
      serviceTypes: haulerProfiles.serviceTypes,
      payoutPercentage: haulerProfiles.payoutPercentage,
      serviceRadius: haulerProfiles.serviceRadius,
      currentLat: haulerProfiles.currentLat,
      currentLng: haulerProfiles.currentLng,
      onlineLat: pyckerOnlineStatus.latitude,
      onlineLng: pyckerOnlineStatus.longitude,
    })
    .from(haulerProfiles)
    .innerJoin(
      pyckerOnlineStatus,
      and(
        eq(pyckerOnlineStatus.pyckerId, haulerProfiles.id),
        eq(pyckerOnlineStatus.status, "available")
      )
    )
    .where(
      and(
        eq(haulerProfiles.canAcceptJobs, true),
        excludeProIds.length > 0
          ? notInArray(haulerProfiles.userId, excludeProIds)
          : undefined
      )
    );

  // Calculate distance and filter by radius
  const maxRadius = expandRadius ? 50 : 25; // miles

  const candidates: ProCandidate[] = onlinePros
    .map((p) => {
      const lat = p.onlineLat || p.currentLat || 0;
      const lng = p.onlineLng || p.currentLng || 0;
      const distance = haversineDistance(pickupLat, pickupLng, lat, lng);
      return {
        profileId: p.profileId,
        userId: p.userId,
        companyName: p.companyName,
        distanceMiles: distance,
        rating: p.rating ?? 5.0,
        hourlyRate: p.hourlyRate ?? 75,
        pyckerTier: p.pyckerTier ?? "independent",
        serviceTypes: (p.serviceTypes ?? []) as string[],
        payoutPercentage: p.payoutPercentage ?? 0.75,
      };
    })
    .filter((p) => {
      // Filter by radius and service type
      if (p.distanceMiles > maxRadius) return false;
      if (job.serviceType && p.serviceTypes.length > 0) {
        return p.serviceTypes.includes(job.serviceType);
      }
      return true;
    })
    // Sort: proximity > rating > lower hourly rate > verified tier first
    .sort((a, b) => {
      // Proximity (closer is better)
      const distDiff = a.distanceMiles - b.distanceMiles;
      if (Math.abs(distDiff) > 2) return distDiff;

      // Rating (higher is better)
      const ratingDiff = b.rating - a.rating;
      if (Math.abs(ratingDiff) > 0.2) return ratingDiff;

      // Tier pricing (lower hourly rate preferred — better margin)
      const rateDiff = a.hourlyRate - b.hourlyRate;
      if (Math.abs(rateDiff) > 5) return rateDiff;

      // Service specialty: verified_pro > independent
      if (a.pyckerTier === "verified_pro" && b.pyckerTier !== "verified_pro") return -1;
      if (b.pyckerTier === "verified_pro" && a.pyckerTier !== "verified_pro") return 1;

      return 0;
    });

  return candidates;
}

/**
 * Initiate the job offer cascade for a booked job.
 */
export async function initiateJobOffer(jobId: string): Promise<CascadeState> {
  // Check if cascade already exists
  const existing = cascadeStore.get(jobId);
  if (existing && existing.status === "pending") {
    throw new Error(`Cascade already active for job ${jobId}`);
  }

  const state: CascadeState = {
    jobId,
    currentTier: 1,
    offeredTo: [],
    status: "pending",
    startedAt: new Date().toISOString(),
  };

  cascadeStore.set(jobId, state);

  // Find best pro and send first offer
  await sendNextOffer(state);

  return state;
}

/**
 * Handle a pro's response to an offer.
 */
export async function handleProResponse(
  jobId: string,
  proId: string,
  accepted: boolean
): Promise<CascadeState> {
  const state = cascadeStore.get(jobId);
  if (!state) throw new Error(`No active cascade for job ${jobId}`);
  if (state.status !== "pending") throw new Error(`Cascade for job ${jobId} is ${state.status}`);

  // Find the offer record
  const offer = state.offeredTo.find(
    (o) => o.proId === proId && !o.respondedAt
  );
  if (!offer) throw new Error(`No pending offer for pro ${proId} on job ${jobId}`);

  offer.respondedAt = new Date().toISOString();

  if (accepted) {
    offer.response = "accepted";
    state.status = "accepted";
    state.acceptedByProId = proId;

    // Update the service request
    await db
      .update(serviceRequests)
      .set({
        assignedHaulerId: proId,
        status: "assigned",
        acceptedAt: new Date().toISOString(),
        haulerPayout: await calculatePayout(jobId, offer.payoutPercent),
      })
      .where(eq(serviceRequests.id, jobId));

    // Record in match_attempts
    await db.insert(matchAttempts).values({
      requestId: jobId,
      haulerId: proId,
      status: "accepted",
      createdAt: new Date().toISOString(),
    });

    cascadeStore.set(jobId, state);
    return state;
  }

  // Declined
  offer.response = "declined";

  // Record decline in match_attempts
  await db.insert(matchAttempts).values({
    requestId: jobId,
    haulerId: proId,
    status: "declined",
    createdAt: new Date().toISOString(),
  });

  // Try next pro or escalate
  await sendNextOffer(state);

  cascadeStore.set(jobId, state);
  return state;
}

/**
 * Escalate the cascade to a higher tier.
 */
export async function escalateOffer(
  jobId: string,
  tier: 1 | 2 | 3 | 4
): Promise<CascadeState> {
  const state = cascadeStore.get(jobId);
  if (!state) throw new Error(`No active cascade for job ${jobId}`);

  state.currentTier = tier;
  state.lastEscalatedAt = new Date().toISOString();

  if (tier === 4) {
    // Expand radius, notify customer, and BLAST all qualifying pros
    console.log(`[Cascade] Job ${jobId} escalated to tier 4 — blasting all qualifying pros`);
    // Blast: text/email/push ALL pros who match the service type + area, even offline ones.
    // Tell them to open the app/site to accept the job.
    await blastAllQualifyingPros(state);
    // TODO: Send push notification to customer about slight delay
  }

  // Try to find a pro at this new tier
  await sendNextOffer(state);

  cascadeStore.set(jobId, state);
  return state;
}

/**
 * Get the current cascade status for a job.
 */
export function getCascadeStatus(jobId: string): CascadeState | null {
  return cascadeStore.get(jobId) ?? null;
}

/**
 * Get available pro rates for a given service type and area.
 * Used by George to quote within a viable range BEFORE quoting the customer.
 */
export async function getAvailableProRates(
  serviceType: string,
  lat: number,
  lng: number,
  radiusMiles: number = 25
): Promise<{
  prosOnline: number;
  rateRange: { min: number; max: number; median: number } | null;
  pros: Array<{
    tier: string;
    rating: number;
    hourlyRate: number;
    distanceMiles: number;
    payoutPercentage: number;
  }>;
}> {
  const onlinePros = await db
    .select({
      profileId: haulerProfiles.id,
      rating: haulerProfiles.rating,
      hourlyRate: haulerProfiles.hourlyRate,
      pyckerTier: haulerProfiles.pyckerTier,
      serviceTypes: haulerProfiles.serviceTypes,
      payoutPercentage: haulerProfiles.payoutPercentage,
      currentLat: haulerProfiles.currentLat,
      currentLng: haulerProfiles.currentLng,
      onlineLat: pyckerOnlineStatus.latitude,
      onlineLng: pyckerOnlineStatus.longitude,
    })
    .from(haulerProfiles)
    .innerJoin(
      pyckerOnlineStatus,
      and(
        eq(pyckerOnlineStatus.pyckerId, haulerProfiles.id),
        eq(pyckerOnlineStatus.status, "available")
      )
    )
    .where(eq(haulerProfiles.canAcceptJobs, true));

  const matched = onlinePros
    .map((p) => {
      const pLat = p.onlineLat || p.currentLat || 0;
      const pLng = p.onlineLng || p.currentLng || 0;
      return {
        tier: p.pyckerTier ?? "independent",
        rating: p.rating ?? 5.0,
        hourlyRate: p.hourlyRate ?? 75,
        distanceMiles: haversineDistance(lat, lng, pLat, pLng),
        payoutPercentage: p.payoutPercentage ?? 0.75,
        serviceTypes: (p.serviceTypes ?? []) as string[],
      };
    })
    .filter((p) => {
      if (p.distanceMiles > radiusMiles) return false;
      return p.serviceTypes.includes(serviceType);
    })
    .sort((a, b) => a.hourlyRate - b.hourlyRate);

  if (matched.length === 0) {
    return { prosOnline: 0, rateRange: null, pros: [] };
  }

  const rates = matched.map((p) => p.hourlyRate);
  const sorted = [...rates].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  return {
    prosOnline: matched.length,
    rateRange: {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median,
    },
    pros: matched.map(({ serviceTypes, ...rest }) => rest),
  };
}

// ─── Internal Helpers ────────────────────────

async function sendNextOffer(state: CascadeState): Promise<void> {
  const excludeProIds = state.offeredTo.map((o) => o.proId);
  const expandRadius = state.currentTier >= 4;
  const candidates = await findMatchingPros(state.jobId, excludeProIds, expandRadius);

  if (candidates.length === 0) {
    // No more pros available at this tier
    const nextTier = (state.currentTier + 1) as 1 | 2 | 3 | 4;
    if (nextTier <= 4) {
      console.log(`[Cascade] No pros at tier ${state.currentTier} for job ${state.jobId}, escalating to tier ${nextTier}`);
      state.currentTier = nextTier;
      state.lastEscalatedAt = new Date().toISOString();

      if (nextTier === 4) {
        // Try with expanded radius
        const expandedCandidates = await findMatchingPros(state.jobId, excludeProIds, true);
        if (expandedCandidates.length > 0) {
          await offerToPro(state, expandedCandidates[0]);
          return;
        }
      }

      // Retry at new tier (sweetener may attract previously-excluded pros who see higher payout)
      state.status = "pending";
      cascadeStore.set(state.jobId, state);
      return;
    }

    // All tiers exhausted
    state.status = "exhausted";
    console.log(`[Cascade] All tiers exhausted for job ${state.jobId}`);
    cascadeStore.set(state.jobId, state);
    return;
  }

  // Offer to the best candidate
  await offerToPro(state, candidates[0]);

  // Schedule timeout
  scheduleTimeout(state.jobId, candidates[0].userId, state.currentTier);
}

async function offerToPro(state: CascadeState, pro: ProCandidate): Promise<void> {
  const payoutPercent = TIER_PAYOUT[state.currentTier] ?? 0.85;

  const record: OfferRecord = {
    proId: pro.userId,
    profileId: pro.profileId,
    tier: state.currentTier,
    offeredAt: new Date().toISOString(),
    payoutPercent,
  };

  state.offeredTo.push(record);
  cascadeStore.set(state.jobId, state);

  // Record the offer in match_attempts
  await db.insert(matchAttempts).values({
    requestId: state.jobId,
    haulerId: pro.userId,
    status: "pending",
    expiresAt: new Date(Date.now() + (TIER_TIMEOUTS[state.currentTier] ?? 600000)).toISOString(),
    createdAt: new Date().toISOString(),
  });

  console.log(`[Cascade] Offered job ${state.jobId} to ${pro.companyName} (${pro.userId}) at tier ${state.currentTier}, ${payoutPercent * 100}% payout`);

  // TODO: Send push notification / WebSocket event to pro
}

function scheduleTimeout(jobId: string, proId: string, tier: number): void {
  const timeoutMs = TIER_TIMEOUTS[tier];
  if (!timeoutMs || timeoutMs === Infinity) return;

  setTimeout(async () => {
    const state = cascadeStore.get(jobId);
    if (!state || state.status !== "pending") return;

    const offer = state.offeredTo.find(
      (o) => o.proId === proId && !o.respondedAt
    );
    if (!offer) return;

    // Expire the offer
    offer.respondedAt = new Date().toISOString();
    offer.response = "expired";

    // Update match_attempts
    await db
      .update(matchAttempts)
      .set({ status: "expired" })
      .where(
        and(
          eq(matchAttempts.requestId, jobId),
          eq(matchAttempts.haulerId, proId),
          eq(matchAttempts.status, "pending")
        )
      );

    console.log(`[Cascade] Offer expired for pro ${proId} on job ${jobId} (tier ${tier})`);

    // Send next offer
    await sendNextOffer(state);
    cascadeStore.set(jobId, state);
  }, timeoutMs);
}

async function calculatePayout(jobId: string, payoutPercent: number): Promise<number> {
  const [job] = await db
    .select({ baseServicePrice: serviceRequests.baseServicePrice, finalPrice: serviceRequests.finalPrice, priceEstimate: serviceRequests.priceEstimate })
    .from(serviceRequests)
    .where(eq(serviceRequests.id, jobId))
    .limit(1);

  if (!job) return 0;

  // Use baseServicePrice (before platform fee) for payout calc
  const base = job.baseServicePrice ?? job.finalPrice ?? job.priceEstimate ?? 0;
  return Math.round(base * payoutPercent * 100) / 100;
}

/**
 * Haversine distance in miles between two lat/lng points.
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// ─── Blast All Qualifying Pros (Tier 4 Failsafe) ────────────

/**
 * When no online pro accepts, blast ALL qualifying pros (even offline ones)
 * via SMS, email, and push notification. Tell them to open the app/site to accept.
 * Uses their weeklyAvailability to prioritize pros who should be working now.
 */
async function blastAllQualifyingPros(state: CascadeState): Promise<void> {
  const job = await db.select().from(serviceRequests).where(eq(serviceRequests.id, parseInt(state.jobId))).limit(1);
  if (!job.length) return;

  const serviceType = job[0].serviceType;
  const alreadyOffered = state.offeredTo.map((o) => o.profileId);

  // Get ALL pros who handle this service type, regardless of online status
  const allPros = await db
    .select()
    .from(haulerProfiles)
    .where(
      and(
        eq(haulerProfiles.isAvailable, true),
        sql`${haulerProfiles.serviceTypes}::text LIKE ${"%" + serviceType + "%"}`
      )
    );

  const eligiblePros = allPros.filter(
    (p) => !alreadyOffered.includes(String(p.id))
  );

  console.log(
    `[Cascade Blast] Job ${state.jobId}: Sending blast to ${eligiblePros.length} qualifying pros (including offline)`
  );

  // TODO: Wire into actual SMS (Twilio), email (SendGrid), and push notification services
  // For each pro: send SMS + email + push with job details and a deep link to accept
  // Message: "New [serviceType] job available now! Open UpTend to accept: [link]"
  // Prioritize pros whose weeklyAvailability includes the current day/time

  for (const pro of eligiblePros) {
    console.log(
      `[Cascade Blast] Notifying pro ${pro.companyName || pro.id} — phone: ${pro.phone}, email: ${pro.email}`
    );
    // Each notification includes:
    // - Service type + location (zip, not full address for privacy)
    // - Estimated payout (90% sweetener tier)
    // - Deep link to accept in app or site
    // - "Respond within 60 minutes"
  }
}
