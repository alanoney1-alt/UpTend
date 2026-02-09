/**
 * UpTend Protection Fee
 * 7% customer-facing fee at checkout (separate from Pro's 20% platform fee)
 */

export const PROTECTION_FEE_PERCENT = 7; // 7% of base price

export interface ProtectionFeeBreakdown {
  basePrice: number;
  protectionFee: number;
  protectionFeePercent: number;
  totalWithProtection: number;
}

/**
 * Calculate protection fee
 */
export function calculateProtectionFee(basePrice: number): ProtectionFeeBreakdown {
  const protectionFee = Math.round(basePrice * (PROTECTION_FEE_PERCENT / 100) * 100) / 100;
  const totalWithProtection = basePrice + protectionFee;

  return {
    basePrice,
    protectionFee,
    protectionFeePercent: PROTECTION_FEE_PERCENT,
    totalWithProtection,
  };
}

/**
 * Calculate Pro payout (always 80% of base price, unaffected by protection fee)
 */
export function calculateProPayout(basePrice: number): {
  proPayout: number;
  platformFee: number;
  proPayoutPercent: number;
} {
  const proPayoutPercent = 80;
  const proPayout = Math.round(basePrice * (proPayoutPercent / 100) * 100) / 100;
  const platformFee = basePrice - proPayout;

  return {
    proPayout,
    platformFee,
    proPayoutPercent,
  };
}

/**
 * Get protection fee tooltip text
 */
export const PROTECTION_FEE_TOOLTIP =
  "Covers $1M liability insurance, verified Pro guarantee, background checks, sustainability tracking, and 24/7 support.";

/**
 * Calculate complete breakdown: base price, protection fee, Pro payout, platform revenue
 */
export function calculateCompleteBreakdown(basePrice: number, referralCredit: number = 0): {
  basePrice: number;
  protectionFee: number;
  subtotal: number;
  referralCredit: number;
  customerPays: number;
  proPayout: number;
  platformFee: number;
  protectionFeeRevenue: number;
  uptendTotalRevenue: number;
} {
  const protection = calculateProtectionFee(basePrice);
  const payout = calculateProPayout(basePrice);

  // Customer pays base + protection - any referral credits
  // Referral credits apply to TOTAL (service + protection fee)
  const subtotal = protection.totalWithProtection;
  const customerPays = Math.max(0, subtotal - referralCredit);

  // UpTend's total revenue: platform fee (20% of base) + protection fee (7% of base)
  const uptendTotalRevenue = payout.platformFee + protection.protectionFee;

  return {
    basePrice,
    protectionFee: protection.protectionFee,
    subtotal,
    referralCredit,
    customerPays,
    proPayout: payout.proPayout,
    platformFee: payout.platformFee,
    protectionFeeRevenue: protection.protectionFee,
    uptendTotalRevenue,
  };
}
