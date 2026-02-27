import { db } from "../db";
import { serviceRequests, haulerProfiles, users } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { sendSms, sendEmail } from "./notifications";
import { broadcastToJob } from "../websocket";

// ─── Types ───────────────────────────────────────────────────────────────────

interface NoShowTimer {
 jobId: string;
 proId: string;
 scheduledFor: string;
 warningTimers: NodeJS.Timeout[];
 finalTimer: NodeJS.Timeout;
 checkedIn: boolean;
 delayReasonSent: boolean;
 delayReason?: string;
}

// ─── In-memory timer store ───────────────────────────────────────────────────

const activeTimers = new Map<string, NoShowTimer>();

const NO_SHOW_WINDOW_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_10_MS = 10 * 60 * 1000;
const WARNING_20_MS = 20 * 60 * 1000;

// ─── Core functions ──────────────────────────────────────────────────────────

export function startNoShowTimer(jobId: string, proId: string, scheduledFor: string): void {
 // Clean up any existing timer for this job
 clearNoShowTimer(jobId);

 console.log(`[NoShowProtection] Starting 30-min timer for job ${jobId}, pro ${proId}`);

 const warningTimers: NodeJS.Timeout[] = [];

 // 10-minute warning
 const warn10 = setTimeout(async () => {
 const timer = activeTimers.get(jobId);
 if (!timer || timer.checkedIn) return;
 console.log(`[NoShowProtection] 10-min warning for job ${jobId}`);
 await sendProWarning(jobId, proId, 20); // 20 minutes remaining
 }, WARNING_10_MS);
 warningTimers.push(warn10);

 // 20-minute warning
 const warn20 = setTimeout(async () => {
 const timer = activeTimers.get(jobId);
 if (!timer || timer.checkedIn) return;
 console.log(`[NoShowProtection] 20-min warning for job ${jobId}`);
 await sendProWarning(jobId, proId, 10); // 10 minutes remaining
 }, WARNING_20_MS);
 warningTimers.push(warn20);

 // 30-minute final - handle no-show
 const finalTimer = setTimeout(async () => {
 const timer = activeTimers.get(jobId);
 if (!timer || timer.checkedIn) return;

 // If pro sent a delay reason, flag for admin review instead of auto-cancelling
 if (timer.delayReasonSent) {
 console.log(`[NoShowProtection] Job ${jobId} - pro sent delay reason, flagging for admin review`);
 await flagForAdminReview(jobId, proId, timer.delayReason || "No reason provided");
 activeTimers.delete(jobId);
 return;
 }

 console.log(`[NoShowProtection] Job ${jobId} - NO SHOW! Triggering reassignment`);
 await handleNoShow(jobId, proId);
 activeTimers.delete(jobId);
 }, NO_SHOW_WINDOW_MS);

 activeTimers.set(jobId, {
 jobId,
 proId,
 scheduledFor,
 warningTimers,
 finalTimer,
 checkedIn: false,
 delayReasonSent: false,
 });
}

export function proCheckedIn(jobId: string, proId: string): boolean {
 const timer = activeTimers.get(jobId);
 if (!timer) {
 console.log(`[NoShowProtection] No active timer for job ${jobId}`);
 return false;
 }
 if (timer.proId !== proId) {
 console.log(`[NoShowProtection] Pro ${proId} is not assigned to job ${jobId}`);
 return false;
 }

 console.log(`[NoShowProtection] Pro ${proId} checked in for job ${jobId}`);
 timer.checkedIn = true;
 clearNoShowTimer(jobId);
 return true;
}

export function proSentDelayMessage(jobId: string, proId: string, reason: string): boolean {
 const timer = activeTimers.get(jobId);
 if (!timer) {
 console.log(`[NoShowProtection] No active timer for job ${jobId}`);
 return false;
 }
 if (timer.proId !== proId) {
 console.log(`[NoShowProtection] Pro ${proId} is not assigned to job ${jobId}`);
 return false;
 }

 console.log(`[NoShowProtection] Pro ${proId} sent delay reason for job ${jobId}: ${reason}`);
 timer.delayReasonSent = true;
 timer.delayReason = reason;
 return true;
}

export function getNoShowStatus(jobId: string): {
 active: boolean;
 checkedIn: boolean;
 delayReasonSent: boolean;
 delayReason?: string;
 proId?: string;
} {
 const timer = activeTimers.get(jobId);
 if (!timer) {
 return { active: false, checkedIn: false, delayReasonSent: false };
 }
 return {
 active: true,
 checkedIn: timer.checkedIn,
 delayReasonSent: timer.delayReasonSent,
 delayReason: timer.delayReason,
 proId: timer.proId,
 };
}

export function clearNoShowTimer(jobId: string): void {
 const timer = activeTimers.get(jobId);
 if (!timer) return;

 timer.warningTimers.forEach(t => clearTimeout(t));
 clearTimeout(timer.finalTimer);
 activeTimers.delete(jobId);
}

// ─── Internal helpers ────────────────────────────────────────────────────────

async function sendProWarning(jobId: string, proId: string, minutesRemaining: number): Promise<void> {
 try {
 const profile = await db
 .select({ phone: haulerProfiles.phone, userId: haulerProfiles.userId })
 .from(haulerProfiles)
 .where(eq(haulerProfiles.userId, proId))
 .limit(1);

 if (profile[0]?.phone) {
 await sendSms({
 to: profile[0].phone,
 message: ` UpTend: You have ${minutesRemaining} minutes to check in for job #${jobId.slice(-6)}. Open the app and tap "I'm Here" or you may be reassigned.`,
 });
 }

 // Also broadcast via WebSocket
 broadcastToJob(jobId, {
 type: "no_show_warning",
 jobId,
 minutesRemaining,
 message: `${minutesRemaining} minutes remaining to check in`,
 });
 } catch (error) {
 console.error(`[NoShowProtection] Error sending warning for job ${jobId}:`, error);
 }
}

async function flagForAdminReview(jobId: string, proId: string, reason: string): Promise<void> {
 try {
 // Update the job with delay info
 await db.execute(sql`
 UPDATE service_requests 
 SET verifier_notes = COALESCE(verifier_notes, '') || ${`\n[NO-SHOW DELAY] Pro sent reason: ${reason}`}
 WHERE id = ${jobId}
 `);

 // Notify admin
 const ADMIN_PHONE = process.env.ADMIN_PHONE || "+14073383342";
 const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@uptend.app";

 await Promise.all([
 sendSms({
 to: ADMIN_PHONE,
 message: ` ADMIN: Job #${jobId.slice(-6)} - Pro delayed but communicated. Reason: "${reason}". Needs review.`,
 }),
 sendEmail({
 to: ADMIN_EMAIL,
 subject: `Pro Delay Review Needed - Job #${jobId.slice(-6)}`,
 text: `Pro ${proId} is delayed for job ${jobId}.\nReason: ${reason}\nThe job remains assigned but needs admin review.`,
 }),
 ]);

 broadcastToJob(jobId, {
 type: "no_show_admin_review",
 jobId,
 message: "Pro communicated a delay - under admin review",
 });
 } catch (error) {
 console.error(`[NoShowProtection] Error flagging job ${jobId} for admin review:`, error);
 }
}

async function handleNoShow(jobId: string, proId: string): Promise<void> {
 try {
 const now = new Date().toISOString();

 // 1. Get job details
 const [job] = await db
 .select()
 .from(serviceRequests)
 .where(eq(serviceRequests.id, jobId))
 .limit(1);

 if (!job) {
 console.error(`[NoShowProtection] Job ${jobId} not found`);
 return;
 }

 // 2. Unassign the pro and mark as urgent reassign
 await db.execute(sql`
 UPDATE service_requests 
 SET assigned_hauler_id = NULL,
 status = 'matching',
 is_urgent_reassign = TRUE,
 original_pro_id = ${proId},
 no_show_at = ${now},
 matching_started_at = ${now},
 needs_manual_match = FALSE
 WHERE id = ${jobId}
 `);

 // 3. Add reliability strike to the pro
 await db.execute(sql`
 UPDATE hauler_profiles 
 SET no_show_count = COALESCE(no_show_count, 0) + 1,
 last_no_show_at = ${now}
 WHERE user_id = ${proId}
 `);

 // 4. Notify the customer
 if (job.customerPhone) {
 await sendSms({
 to: job.customerPhone,
 message: `UpTend Update: Your pro was reassigned - a new pro is on the way. We apologize for the delay. Job #${jobId.slice(-6)}`,
 });
 }
 if (job.customerEmail) {
 await sendEmail({
 to: job.customerEmail,
 subject: `UpTend - Your Pro Has Been Reassigned`,
 html: `
 <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
 <div style="text-align: center; margin-bottom: 30px;">
 <h1 style="color: #3B1D5A; margin: 0;">UpTend</h1>
 <p style="color: #F47C20; font-weight: bold; margin: 5px 0;">You Pick. We Haul.</p>
 </div>
 <h2 style="color: #333;">Your Pro Has Been Reassigned</h2>
 <p style="color: #666; font-size: 16px;">
 We noticed your original pro wasn't able to make it on time. We've already sent your job out
 as an urgent pickup and a new pro will be on their way shortly.
 </p>
 <p style="color: #666; font-size: 14px;">
 We apologize for the inconvenience and appreciate your patience.
 </p>
 <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
 <p style="color: #999; font-size: 12px; text-align: center;">
 UpTend - On-demand junk removal and moving services<br>
 Orlando Metro Area | (407) 338-3342
 </p>
 </div>
 `,
 text: `Your UpTend pro was reassigned - a new pro is on the way. We apologize for the delay. Job #${jobId.slice(-6)}`,
 });
 }

 // 5. Broadcast urgent job to all connected pros via WebSocket
 broadcastToJob(jobId, {
 type: "pro_no_show",
 jobId,
 message: "Pro did not show up - job is being reassigned",
 });

 // 6. Broadcast as urgent available job (global broadcast to all WS connections)
 // This uses a special "urgent_job_available" event that the frontend listens for
 broadcastToJob("__global__", {
 type: "urgent_job_available",
 jobId,
 serviceType: job.serviceType,
 pickupAddress: job.pickupAddress,
 pickupLat: job.pickupLat,
 pickupLng: job.pickupLng,
 priceEstimate: job.priceEstimate,
 isUrgentReassign: true,
 });

 // 7. Notify admin
 const ADMIN_PHONE = process.env.ADMIN_PHONE || "+14073383342";
 await sendSms({
 to: ADMIN_PHONE,
 message: ` NO-SHOW: Job #${jobId.slice(-6)} pro didn't check in. Auto-reassigned. Pro ${proId} got a strike.`,
 });

 console.log(`[NoShowProtection] No-show handled for job ${jobId}. Pro ${proId} received strike.`);
 } catch (error) {
 console.error(`[NoShowProtection] Error handling no-show for job ${jobId}:`, error);
 }
}
