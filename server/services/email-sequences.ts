/**
 * Email Sequences — in-memory scheduled email triggers
 *
 * Customer post-job: review request (24h), home score (3d), seasonal (14d), referral (30d)
 * Pro onboarding: welcome (immediate), profile nudge (3d), tips (7d)
 */

import { storage } from "../storage";
import {
  sendReviewRequest,
  sendHomeScoreUpdate,
  sendSeasonalRecommendation,
  sendReferralPrompt,
  sendProWelcomeVerified,
  sendProProfileNudge,
  sendProTips,
} from "./email-service";

// ─── Helpers ───────────────────────────────────────────────────────

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// Track active timers so they can be cancelled if needed
const activeTimers = new Map<string, NodeJS.Timeout[]>();

function scheduleTimer(key: string, delayMs: number, fn: () => Promise<void>) {
  const timer = setTimeout(async () => {
    try {
      await fn();
    } catch (err: any) {
      console.error(`[EmailSeq] Error in ${key}:`, err.message);
    }
  }, delayMs);

  // unref so timers don't keep the process alive
  if (timer.unref) timer.unref();

  const existing = activeTimers.get(key) || [];
  existing.push(timer);
  activeTimers.set(key, existing);
}

function cancelTimers(key: string) {
  const timers = activeTimers.get(key);
  if (timers) {
    timers.forEach(t => clearTimeout(t));
    activeTimers.delete(key);
  }
}

function getSeason(): string {
  const month = new Date().getMonth(); // 0-indexed
  if (month >= 2 && month <= 4) return "spring";
  if (month >= 5 && month <= 7) return "summer";
  if (month >= 8 && month <= 10) return "fall";
  return "winter";
}

function getSeasonalServices(season: string): { name: string; description: string }[] {
  switch (season) {
    case "spring":
    case "summer":
      return [
        { name: "Pool Cleaning", description: "Keep your pool crystal clear all season" },
        { name: "Landscaping", description: "Lawn care, trimming, and garden maintenance" },
        { name: "Pressure Washing", description: "Refresh your driveway, patio, and siding" },
      ];
    case "fall":
      return [
        { name: "Gutter Cleaning", description: "Clear leaves and debris before the rain" },
        { name: "Home Cleaning", description: "Deep clean before the holidays" },
        { name: "Handyman", description: "Tackle those fall fix-up projects" },
      ];
    case "winter":
    default:
      return [
        { name: "Handyman", description: "Indoor repairs and improvements" },
        { name: "Home Cleaning", description: "Start the new year fresh" },
        { name: "Gutter Cleaning", description: "Prevent water damage this season" },
      ];
  }
}

// ─── Customer Post-Job Sequence ────────────────────────────────────

export function schedulePostJobSequence(
  customerId: number,
  jobId: number,
  proName: string,
  proFirstName: string,
  serviceType: string,
) {
  const key = `customer-postjob-${jobId}`;
  cancelTimers(key); // prevent duplicates

  // Email 1: Review Request (+24 hours)
  scheduleTimer(key, 24 * HOUR, async () => {
    const customer = await storage.getUser(customerId);
    if (!customer?.email) return;

    // Check if already reviewed
    const reviews = await (storage as any).getReviewsByJob?.(jobId);
    if (reviews && reviews.length > 0) return;

    await sendReviewRequest(customer.email, {
      customerName: customer.firstName || "there",
      proFirstName,
      proName,
      serviceType,
      jobId: String(jobId),
    });
    console.log(`[EmailSeq] Review request sent for job ${jobId}`);
  });

  // Email 2: Home Score Update (+3 days)
  scheduleTimer(key, 3 * DAY, async () => {
    const customer = await storage.getUser(customerId);
    if (!customer?.email) return;

    // Try to get actual score; fallback to estimate
    let totalScore = 0;
    let pointsAdded = 15; // default points per service
    try {
      const profile = await (storage as any).getCustomerProfile?.(customerId);
      totalScore = profile?.maintenanceScore || profile?.homeScore || 350;
    } catch {
      totalScore = 350;
    }

    await sendHomeScoreUpdate(customer.email, {
      customerName: customer.firstName || "there",
      serviceType,
      pointsAdded,
      totalScore,
    });
    console.log(`[EmailSeq] Home score update sent for job ${jobId}`);
  });

  // Email 3: Seasonal Recommendation (+14 days)
  scheduleTimer(key, 14 * DAY, async () => {
    const customer = await storage.getUser(customerId);
    if (!customer?.email) return;

    const season = getSeason();
    const zip = (customer as any).zip || (customer as any).zipCode || "Orlando";

    await sendSeasonalRecommendation(customer.email, {
      customerName: customer.firstName || "there",
      season,
      zip,
      services: getSeasonalServices(season),
    });
    console.log(`[EmailSeq] Seasonal recommendation sent for job ${jobId}`);
  });

  // Email 4: Referral Prompt (+30 days)
  scheduleTimer(key, 30 * DAY, async () => {
    const customer = await storage.getUser(customerId);
    if (!customer?.email) return;

    const referralCode = (customer as any).referralCode || `UPTEND-${customerId}`;

    await sendReferralPrompt(customer.email, {
      customerName: customer.firstName || "there",
      referralCode,
    });
    console.log(`[EmailSeq] Referral prompt sent for job ${jobId}`);
  });

  console.log(`[EmailSeq] Scheduled 4-email post-job sequence for job ${jobId}, customer ${customerId}`);
}

// ─── Pro Onboarding Sequence ───────────────────────────────────────

export function scheduleProWelcomeSequence(profileId: number, userId: number) {
  const key = `pro-welcome-${profileId}`;
  cancelTimers(key);

  // Email 1: Welcome (immediate)
  scheduleTimer(key, 0, async () => {
    const user = await storage.getUser(userId);
    if (!user?.email) return;

    await sendProWelcomeVerified(user.email, {
      proName: user.firstName || "there",
    });
    console.log(`[EmailSeq] Pro welcome sent for profile ${profileId}`);
  });

  // Email 2: Profile Completion Nudge (+3 days if incomplete)
  scheduleTimer(key, 3 * DAY, async () => {
    const user = await storage.getUser(userId);
    if (!user?.email) return;

    const profile = await storage.getHaulerProfile(profileId);
    if (!profile) return;

    const missingItems: string[] = [];
    if (!profile.profilePhoto) missingItems.push("Profile photo");
    if (!profile.serviceAreas || (Array.isArray(profile.serviceAreas) && profile.serviceAreas.length === 0)) missingItems.push("Service areas");
    if (!profile.availability) missingItems.push("Availability");
    if (!profile.certifications || (Array.isArray(profile.certifications) && profile.certifications.length === 0)) missingItems.push("Certifications");

    // Only send if profile is actually incomplete
    if (missingItems.length === 0) return;

    await sendProProfileNudge(user.email, {
      proName: user.firstName || "there",
      missingItems,
    });
    console.log(`[EmailSeq] Pro profile nudge sent for profile ${profileId}`);
  });

  // Email 3: Pro Tips (+7 days)
  scheduleTimer(key, 7 * DAY, async () => {
    const user = await storage.getUser(userId);
    if (!user?.email) return;

    await sendProTips(user.email, {
      proName: user.firstName || "there",
    });
    console.log(`[EmailSeq] Pro tips sent for profile ${profileId}`);
  });

  console.log(`[EmailSeq] Scheduled 3-email pro onboarding sequence for profile ${profileId}, user ${userId}`);
}

// ─── Cleanup ───────────────────────────────────────────────────────

export function cancelSequence(key: string) {
  cancelTimers(key);
}
