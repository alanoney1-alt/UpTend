import { db } from "../db";
import { serviceRequests, users } from "@shared/schema";
import { eq, lt, and, isNull, isNotNull, or, sql } from "drizzle-orm";
import { sendManualMatchAlert, sendManualMatchNotification } from "./notifications";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@uptend.app";
const ADMIN_PHONE = process.env.ADMIN_PHONE || "+14073383342";
const CHECK_INTERVAL_MS = 5000;
const BOUNTY_INCREMENT = 500; // $5.00 in cents
const BOUNTY_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const BOUNTY_MAX = 5000; // $50.00 max bounty cap

let isRunning = false;

async function checkExpiredMatchingJobs(): Promise<void> {
  try {
    const now = new Date().toISOString();
    
    const expiredJobs = await db
      .select({
        id: serviceRequests.id,
        customerId: serviceRequests.customerId,
        serviceType: serviceRequests.serviceType,
        pickupAddress: serviceRequests.pickupAddress,
        priceEstimate: serviceRequests.priceEstimate,
        customerPhone: serviceRequests.customerPhone,
        customerEmail: serviceRequests.customerEmail,
        matchingExpiresAt: serviceRequests.matchingExpiresAt,
      })
      .from(serviceRequests)
      .where(
        and(
          eq(serviceRequests.status, "matching"),
          isNotNull(serviceRequests.matchingExpiresAt),
          lt(serviceRequests.matchingExpiresAt, now),
          eq(serviceRequests.needsManualMatch, false),
          isNull(serviceRequests.manualMatchAlertSentAt)
        )
      );

    for (const job of expiredJobs) {
      console.log(`[MatchingTimer] Job ${job.id} expired - sending admin alert`);

      const customer = await db
        .select({ firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(eq(users.id, job.customerId))
        .limit(1);

      const customerName = customer[0]
        ? `${customer[0].firstName || ""} ${customer[0].lastName || ""}`.trim() || "Customer"
        : "Customer";

      await db
        .update(serviceRequests)
        .set({
          needsManualMatch: true,
          manualMatchAlertSentAt: now,
        })
        .where(eq(serviceRequests.id, job.id));

      const alertResult = await sendManualMatchAlert(ADMIN_EMAIL, ADMIN_PHONE, {
        jobId: job.id,
        customerName,
        customerPhone: job.customerPhone || "Not provided",
        serviceType: job.serviceType,
        pickupAddress: job.pickupAddress,
        priceEstimate: job.priceEstimate || 0,
      });

      console.log(`[MatchingTimer] Admin alert sent for job ${job.id}:`, {
        email: alertResult.email.success,
        sms: alertResult.sms.success,
      });

      // Send customer notification via SMS and/or email
      if (job.customerPhone || job.customerEmail) {
        const customerNotification = await sendManualMatchNotification(
          job.customerPhone || "",
          job.customerEmail || null
        );
        console.log(`[MatchingTimer] Customer notification sent for job ${job.id}:`, {
          sms: job.customerPhone ? customerNotification.sms.success : "skipped (no phone)",
          email: customerNotification.email?.success ?? "skipped",
        });
      } else {
        console.log(`[MatchingTimer] No customer contact info for job ${job.id} - notification skipped`);
      }
    }
  } catch (error) {
    console.error("[MatchingTimer] Error checking expired jobs:", error);
  }
}

async function incrementBountyForStaleJobs(): Promise<void> {
  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - BOUNTY_INTERVAL_MS).toISOString();

    const staleJobs = await db
      .select({
        id: serviceRequests.id,
        bountyAmount: serviceRequests.bountyAmount,
        lastBountyUpdate: serviceRequests.lastBountyUpdate,
        createdAt: serviceRequests.createdAt,
      })
      .from(serviceRequests)
      .where(
        and(
          or(
            eq(serviceRequests.status, "matching"),
            eq(serviceRequests.status, "requested")
          ),
          isNull(serviceRequests.assignedHaulerId),
          or(
            isNull(serviceRequests.lastBountyUpdate),
            lt(serviceRequests.lastBountyUpdate, fiveMinutesAgo)
          )
        )
      );

    for (const job of staleJobs) {
      const jobAge = now.getTime() - new Date(job.createdAt).getTime();
      if (jobAge < BOUNTY_INTERVAL_MS) continue;

      const currentBounty = job.bountyAmount || 0;
      if (currentBounty >= BOUNTY_MAX) continue;

      const newBounty = Math.min(currentBounty + BOUNTY_INCREMENT, BOUNTY_MAX);

      await db
        .update(serviceRequests)
        .set({
          bountyAmount: newBounty,
          lastBountyUpdate: now.toISOString(),
        })
        .where(eq(serviceRequests.id, job.id));

      console.log(`[BountyHunter] Job ${job.id} bounty increased to $${(newBounty / 100).toFixed(2)}`);
    }
  } catch (error) {
    console.error("[BountyHunter] Error incrementing bounties:", error);
  }
}

export function startMatchingTimer(): void {
  if (isRunning) {
    console.log("[MatchingTimer] Already running");
    return;
  }

  isRunning = true;
  console.log("[MatchingTimer] Starting matching timer + bounty hunter (checking every 5 seconds)");

  setInterval(() => {
    checkExpiredMatchingJobs().catch(console.error);
    incrementBountyForStaleJobs().catch(console.error);
  }, CHECK_INTERVAL_MS);
}

export function setMatchingExpiry(jobId: string): { expiresAt: string } {
  const expiresAt = new Date(Date.now() + 60 * 1000).toISOString();
  return { expiresAt };
}
