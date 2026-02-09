/**
 * On-Site Price Verification Service
 *
 * Implements 10% auto-approval threshold for price adjustments.
 * When Pro arrives and verifies actual job scope, the system:
 * - Auto-approves if price difference ≤ 10%
 * - Requires customer approval if price difference > 10%
 * - Auto-approves all price reductions (no threshold)
 *
 * Customer approval flow:
 * - SMS sent with [Approve] [Decline] buttons
 * - 30-minute timeout: If no response, Pro is released and customer gets reschedule option
 * - Pro cannot start work until approval received
 */

import type { PricingQuote } from "../../client/src/lib/pricing-quote";
import { calculatePolishUpPrice, type PolishUpPricingInput } from "../../client/src/lib/polishup-pricing";

export interface VerificationPhoto {
  url: string;
  timestamp: Date;
  description?: string;
  gpsCoordinates?: { lat: number; lng: number };
}

export interface VerificationInput {
  jobId: string;
  proId: string;
  originalQuote: PricingQuote;
  verifiedServiceInputs: Record<string, any>; // Actual inputs after Pro inspection
  verificationPhotos: VerificationPhoto[];
  proNotes?: string;
}

export interface VerificationResult {
  jobId: string;
  originalPrice: number;
  verifiedPrice: number;
  priceDifference: number;
  percentageDifference: number;
  requiresApproval: boolean;
  autoApproved: boolean;
  reason: string;
  verificationId: string;
  verifiedAt: Date;
  expiresAt: Date; // 30 minutes from verification
  customerNotificationSent: boolean;
}

export interface CustomerApprovalRequest {
  verificationId: string;
  jobId: string;
  customerId: string;
  customerPhone: string;
  originalPrice: number;
  verifiedPrice: number;
  priceDifference: number;
  percentageDifference: number;
  reason: string;
  approvalDeadline: Date;
  status: "pending" | "approved" | "declined" | "expired";
  respondedAt?: Date;
}

const AUTO_APPROVAL_THRESHOLD = 0.10; // 10%
const APPROVAL_TIMEOUT_MINUTES = 30;

/**
 * Calculate verified price from Pro's on-site inputs
 */
function calculateVerifiedPrice(
  serviceType: string,
  originalQuote: PricingQuote,
  verifiedInputs: Record<string, any>
): number {
  // For PolishUp (home cleaning), use dynamic pricing engine
  if (serviceType === "home_cleaning" || serviceType === "polishup") {
    const polishUpInputs: PolishUpPricingInput = {
      cleanType: verifiedInputs.cleanType || originalQuote.inputs.cleanType || "standard",
      bedrooms: verifiedInputs.bedrooms || originalQuote.inputs.bedrooms || 2,
      bathrooms: verifiedInputs.bathrooms || originalQuote.inputs.bathrooms || 2,
      stories: verifiedInputs.stories || originalQuote.inputs.stories || 1,
      sqft: verifiedInputs.sqft || originalQuote.inputs.sqft,
      hasPets: verifiedInputs.hasPets || originalQuote.inputs.hasPets || false,
      lastCleaned: verifiedInputs.lastCleaned || originalQuote.inputs.lastCleaned || "30_days",
      sameDayBooking: verifiedInputs.sameDayBooking || originalQuote.inputs.sameDayBooking || false,
    };

    const quote = calculatePolishUpPrice(polishUpInputs);
    return quote.finalPrice;
  }

  // For pressure washing, calculate based on verified square footage
  if (serviceType === "pressure_washing" || serviceType === "freshwash") {
    const verifiedSqft = verifiedInputs.totalSqft || originalQuote.inputs.totalSqft || 0;
    const pricePerSqft = 0.25;
    const minimumPrice = 150;
    return Math.max(verifiedSqft * pricePerSqft, minimumPrice);
  }

  // For junk removal, recalculate based on verified load size
  if (serviceType === "junk_removal" || serviceType === "bulksnap") {
    const loadSizePricing: Record<string, number> = {
      minimum: 99,
      small: 149,
      medium: 199,
      large: 299,
      extra_large: 399,
      full: 449,
    };

    const verifiedLoadSize = verifiedInputs.loadSize || originalQuote.inputs.loadSize || "medium";
    return loadSizePricing[verifiedLoadSize] || originalQuote.finalPrice;
  }

  // For other services, use original price (no dynamic verification)
  return originalQuote.finalPrice;
}

/**
 * Core verification function
 * Returns verification result with auto-approval decision
 */
export function verifyJobPrice(input: VerificationInput): VerificationResult {
  const { originalQuote, verifiedServiceInputs, jobId } = input;

  // Calculate verified price based on Pro's actual on-site inputs
  const verifiedPrice = calculateVerifiedPrice(
    originalQuote.serviceType,
    originalQuote,
    verifiedServiceInputs
  );

  const originalPrice = originalQuote.finalPrice;
  const priceDifference = verifiedPrice - originalPrice;
  const percentageDifference = Math.abs(priceDifference / originalPrice);

  // Determine if approval required
  let requiresApproval = false;
  let autoApproved = false;
  let reason = "";

  if (priceDifference < 0) {
    // Price went DOWN - always auto-approve, customer pays less
    autoApproved = true;
    reason = `Price reduced by $${Math.abs(priceDifference).toFixed(2)}. Auto-approved.`;
  } else if (percentageDifference <= AUTO_APPROVAL_THRESHOLD) {
    // Price increase within 10% threshold - auto-approve
    autoApproved = true;
    const percentDisplay = (percentageDifference * 100).toFixed(1);
    reason = `Price increased by ${percentDisplay}% (within 10% threshold). Auto-approved.`;
  } else {
    // Price increase exceeds 10% - requires customer approval
    requiresApproval = true;
    const percentDisplay = (percentageDifference * 100).toFixed(1);
    reason = `Price increased by ${percentDisplay}% (exceeds 10% threshold). Customer approval required.`;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + APPROVAL_TIMEOUT_MINUTES * 60 * 1000);

  return {
    jobId,
    originalPrice,
    verifiedPrice,
    priceDifference,
    percentageDifference,
    requiresApproval,
    autoApproved,
    reason,
    verificationId: `ver_${Date.now()}_${jobId}`,
    verifiedAt: now,
    expiresAt,
    customerNotificationSent: false,
  };
}

/**
 * Generate SMS message for customer approval request
 */
export function generateApprovalSmsMessage(
  verification: VerificationResult,
  customerName: string,
  proName: string
): string {
  const priceDiffDisplay = verification.priceDifference > 0
    ? `+$${verification.priceDifference.toFixed(2)}`
    : `-$${Math.abs(verification.priceDifference).toFixed(2)}`;

  const percentDisplay = (verification.percentageDifference * 100).toFixed(1);

  if (verification.autoApproved && verification.priceDifference < 0) {
    // Price reduction notification (good news)
    return `Hi ${customerName}! Good news: ${proName} verified the actual scope is smaller than estimated. Your price is now $${verification.verifiedPrice.toFixed(2)} (was $${verification.originalPrice.toFixed(2)}). Savings of $${Math.abs(verification.priceDifference).toFixed(2)} passed to you! Work will begin shortly.`;
  }

  if (verification.autoApproved) {
    // Small increase auto-approved (within 10%)
    return `Hi ${customerName}, ${proName} verified the job scope. Price adjusted to $${verification.verifiedPrice.toFixed(2)} (was $${verification.originalPrice.toFixed(2)}, ${priceDiffDisplay}, ${percentDisplay}% difference - within our 10% accuracy guarantee). Work will begin shortly.`;
  }

  // Requires approval (>10% increase)
  return `Hi ${customerName}, ${proName} verified the job scope. The actual work required is larger than estimated. Updated price: $${verification.verifiedPrice.toFixed(2)} (was $${verification.originalPrice.toFixed(2)}, ${priceDiffDisplay}, ${percentDisplay}% increase). Reply APPROVE to proceed or DECLINE to reschedule. Must respond within 30 minutes.`;
}

/**
 * Check if approval request has expired
 */
export function isApprovalExpired(approvalRequest: CustomerApprovalRequest): boolean {
  return new Date() > new Date(approvalRequest.approvalDeadline);
}

/**
 * Handle customer approval response
 */
export function processCustomerApproval(
  verificationId: string,
  approved: boolean
): { success: boolean; message: string; nextAction: string } {
  if (approved) {
    return {
      success: true,
      message: "Customer approved price adjustment. Pro can begin work.",
      nextAction: "notify_pro_start_work",
    };
  } else {
    return {
      success: true,
      message: "Customer declined price adjustment. Job cancelled.",
      nextAction: "release_pro_offer_reschedule",
    };
  }
}

/**
 * Handle approval timeout (no response after 30 minutes)
 */
export function handleApprovalTimeout(verificationId: string): {
  success: boolean;
  message: string;
  nextAction: string;
} {
  return {
    success: true,
    message: "Customer did not respond within 30 minutes. Pro released, job marked for reschedule.",
    nextAction: "release_pro_send_reschedule_options",
  };
}

/**
 * Calculate pro payout after verification
 * NOTE: Pro payouts are NOT reduced by customer discounts.
 * Pro gets paid based on work actually performed.
 */
export function calculateProPayout(
  verifiedPrice: number,
  serviceType: string,
  proRole: "lead" | "crew",
  estimatedDurationHours: number
): number {
  // For multi-Pro jobs, Lead Pro gets $15 bonus
  const leadBonus = proRole === "lead" ? 15 : 0;

  // Pro payout: 80% of base price (customer rate is $80/hr, Pro gets $64/hr = 80%)
  const hourlyRate = 64; // $80/hr customer rate × 80% = $64/hr Pro payout
  const basePayout = hourlyRate * estimatedDurationHours;

  return basePayout + leadBonus;
}

/**
 * Log verification for audit trail
 */
export interface VerificationLog {
  verificationId: string;
  jobId: string;
  proId: string;
  originalQuoteId: string;
  verifiedInputs: Record<string, any>;
  verificationPhotos: VerificationPhoto[];
  originalPrice: number;
  verifiedPrice: number;
  priceDifference: number;
  percentageDifference: number;
  autoApproved: boolean;
  requiresApproval: boolean;
  customerApproved?: boolean;
  customerDeclined?: boolean;
  approvalExpired?: boolean;
  verifiedAt: Date;
  customerRespondedAt?: Date;
  proNotes?: string;
  systemNotes: string;
}

export function createVerificationLog(
  verification: VerificationResult,
  input: VerificationInput,
  customerResponse?: { approved: boolean; respondedAt: Date }
): VerificationLog {
  return {
    verificationId: verification.verificationId,
    jobId: verification.jobId,
    proId: input.proId,
    originalQuoteId: input.originalQuote.createdAt.toISOString(), // Using createdAt as quote ID
    verifiedInputs: input.verifiedServiceInputs,
    verificationPhotos: input.verificationPhotos,
    originalPrice: verification.originalPrice,
    verifiedPrice: verification.verifiedPrice,
    priceDifference: verification.priceDifference,
    percentageDifference: verification.percentageDifference,
    autoApproved: verification.autoApproved,
    requiresApproval: verification.requiresApproval,
    customerApproved: customerResponse?.approved === true,
    customerDeclined: customerResponse?.approved === false,
    approvalExpired: undefined,
    verifiedAt: verification.verifiedAt,
    customerRespondedAt: customerResponse?.respondedAt,
    proNotes: input.proNotes,
    systemNotes: verification.reason,
  };
}

/**
 * Example usage:
 *
 * // Pro arrives on-site, takes verification photos, adjusts inputs
 * const verification = verifyJobPrice({
 *   jobId: "job_123",
 *   proId: "pro_456",
 *   originalQuote: { finalPrice: 299, serviceType: "home_cleaning", inputs: { bedrooms: 3, bathrooms: 2 } },
 *   verifiedServiceInputs: { bedrooms: 4, bathrooms: 2.5 },  // Pro finds 4BR not 3BR
 *   verificationPhotos: [{ url: "https://...", timestamp: new Date() }],
 *   proNotes: "Customer said 3BR but there's a 4th bedroom being used as office"
 * });
 *
 * if (verification.requiresApproval) {
 *   // Send SMS to customer
 *   const smsMessage = generateApprovalSmsMessage(verification, "John", "Sarah");
 *   await sendSms(customer.phone, smsMessage);
 * } else {
 *   // Auto-approved, Pro can start work
 *   await notifyPro(verification.proId, "Work approved, you can start!");
 * }
 */
