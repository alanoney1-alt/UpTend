/**
 * Partner Review Requests Service
 * 
 * After a job is marked complete, sends the customer a text/email
 * asking for a Google review with a direct link.
 */

import { db } from "../db";
import { partners } from "../../shared/schema";
import { eq, sql } from "drizzle-orm";
import { sendEmail, sendSms } from "./notifications";

// In-memory queue for delayed review requests (production would use Redis/BullMQ)
const reviewQueue: Map<string, NodeJS.Timeout> = new Map();

const REVIEW_DELAY_MS = 2 * 60 * 60 * 1000; // 2 hours

export interface ReviewRequestParams {
  jobId: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  partnerSlug: string;
}

export interface PartnerConfig {
  companyName: string;
  googleReviewLink?: string;
  phone?: string;
}

/**
 * Get partner config including google review link
 */
export async function getPartnerConfig(partnerSlug: string): Promise<PartnerConfig | null> {
  try {
    const [partner] = await db
      .select()
      .from(partners)
      .where(eq(partners.id, partnerSlug))
      .limit(1);
    
    if (!partner) return null;
    
    return {
      companyName: partner.companyName,
      googleReviewLink: (partner as any).googleReviewLink ?? undefined,
      phone: partner.phone,
    };
  } catch {
    return null;
  }
}

/**
 * Check if a review request was already sent for this job
 */
export async function wasReviewRequested(jobId: string): Promise<boolean> {
  try {
    const result = await db.execute(
      sql`SELECT review_requested_at FROM partner_jobs WHERE id = ${jobId} AND review_requested_at IS NOT NULL LIMIT 1`
    );
    return (result as any).rows?.length > 0;
  } catch {
    // Table might not exist yet
    return false;
  }
}

/**
 * Mark a job as having had a review request sent
 */
async function markReviewRequested(jobId: string): Promise<void> {
  try {
    await db.execute(
      sql`UPDATE partner_jobs SET review_requested_at = NOW() WHERE id = ${jobId}`
    );
  } catch {
    // Best effort
  }
}

/**
 * Send review request to customer
 */
async function sendReviewRequest(params: ReviewRequestParams): Promise<void> {
  // Don't double-send
  if (await wasReviewRequested(params.jobId)) {
    console.log(`[ReviewRequest] Already sent for job ${params.jobId}, skipping`);
    return;
  }

  const config = await getPartnerConfig(params.partnerSlug);
  if (!config) {
    console.log(`[ReviewRequest] Partner ${params.partnerSlug} not found`);
    return;
  }

  if (!config.googleReviewLink) {
    console.log(`[ReviewRequest] No Google review link configured for ${config.companyName}`);
    return;
  }

  const message = `Thanks for choosing ${config.companyName}! If you had a great experience, a Google review helps us help more neighbors: ${config.googleReviewLink}`;

  // Send SMS if phone available
  if (params.customerPhone) {
    try {
      await sendSms({ to: params.customerPhone, message });
      console.log(`[ReviewRequest] SMS sent for job ${params.jobId}`);
    } catch (err) {
      console.error(`[ReviewRequest] SMS failed for job ${params.jobId}:`, err);
    }
  }

  // Send email if available
  if (params.customerEmail) {
    try {
      await sendEmail({
        to: params.customerEmail,
        subject: `How was your experience with ${config.companyName}?`,
        text: message,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
            <h2>Thanks for choosing ${config.companyName}!</h2>
            <p>If you had a great experience, a Google review helps us help more neighbors.</p>
            <a href="${config.googleReviewLink}" 
               style="display: inline-block; background: #4285f4; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
              Leave a Google Review ⭐
            </a>
          </div>
        `,
      });
      console.log(`[ReviewRequest] Email sent for job ${params.jobId}`);
    } catch (err) {
      console.error(`[ReviewRequest] Email failed for job ${params.jobId}:`, err);
    }
  }

  await markReviewRequested(params.jobId);
}

/**
 * Queue a review request to be sent after a delay (2 hours by default)
 */
export function queueReviewRequest(params: ReviewRequestParams, delayMs: number = REVIEW_DELAY_MS): void {
  const key = `review-${params.jobId}`;
  
  // Cancel any existing timer for this job
  if (reviewQueue.has(key)) {
    clearTimeout(reviewQueue.get(key)!);
  }

  const timer = setTimeout(async () => {
    reviewQueue.delete(key);
    try {
      await sendReviewRequest(params);
    } catch (err) {
      console.error(`[ReviewRequest] Failed for job ${params.jobId}:`, err);
    }
  }, delayMs);

  reviewQueue.set(key, timer);
  console.log(`[ReviewRequest] Queued for job ${params.jobId} in ${delayMs / 1000}s`);
}

/**
 * Cancel a queued review request
 */
export function cancelReviewRequest(jobId: string): void {
  const key = `review-${jobId}`;
  if (reviewQueue.has(key)) {
    clearTimeout(reviewQueue.get(key)!);
    reviewQueue.delete(key);
    console.log(`[ReviewRequest] Cancelled for job ${jobId}`);
  }
}

/**
 * Wire into job lifecycle - call this when a job status changes to 'completed'
 */
export function onJobCompleted(params: ReviewRequestParams): void {
  queueReviewRequest(params);
}

/**
 * Ensure partner_jobs table and review_requested_at column exist
 */
export async function ensureReviewRequestSchema(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS partner_jobs (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_slug VARCHAR NOT NULL,
        customer_id VARCHAR,
        customer_name TEXT,
        customer_email TEXT,
        customer_phone TEXT,
        service_type TEXT,
        status TEXT DEFAULT 'pending',
        amount TEXT,
        completed_at TIMESTAMP,
        review_requested_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  } catch (err) {
    console.error("[ReviewRequest] Schema setup error:", err);
  }
}
