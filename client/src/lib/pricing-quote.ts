/**
 * Unified Pricing Quote System
 *
 * All three quoting paths (AI scan, manual form, chat/SMS/phone) output
 * the same PricingQuote object. This ensures consistent pricing regardless
 * of customer entry point.
 */

export interface PricingQuote {
  serviceType: string;
  serviceBranded: string;
  inputs: Record<string, any>;
  quotePath: 'ai_scan' | 'manual_form' | 'chat_sms_phone';
  basePrice: number;
  modifiers: Array<{
    name: string;
    value: number;
    type: 'multiplicative' | 'additive';
  }>;
  finalPrice: number;
  estimatedDuration: string;
  estimatedPros: number;
  breakdown: string;
  createdAt: Date;
  expiresAt: Date; // Quote valid for 7 days
  verified: boolean; // Set to true after on-site verification
  verifiedPrice?: number; // May differ from finalPrice after on-site check
  verificationNotes?: string;
}

/**
 * Create a pricing quote with 7-day expiry
 */
export function createPricingQuote(
  serviceType: string,
  serviceBranded: string,
  inputs: Record<string, any>,
  quotePath: PricingQuote['quotePath'],
  basePrice: number,
  modifiers: PricingQuote['modifiers'],
  finalPrice: number,
  estimatedDuration: string,
  estimatedPros: number,
  breakdown: string
): PricingQuote {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  return {
    serviceType,
    serviceBranded,
    inputs,
    quotePath,
    basePrice,
    modifiers,
    finalPrice,
    estimatedDuration,
    estimatedPros,
    breakdown,
    createdAt: now,
    expiresAt,
    verified: false,
  };
}

/**
 * Check if quote is still valid
 */
export function isQuoteValid(quote: PricingQuote): boolean {
  return new Date() < new Date(quote.expiresAt);
}

/**
 * Format quote expiry for display
 */
export function getQuoteExpiryText(quote: PricingQuote): string {
  const now = new Date();
  const expiry = new Date(quote.expiresAt);
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0) {
    return 'Quote expired';
  } else if (daysLeft === 1) {
    return 'Valid for 1 more day';
  } else {
    return `Valid for ${daysLeft} more days`;
  }
}
