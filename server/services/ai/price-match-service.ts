/**
 * Price Match Service
 * Handles price matching logic with receipt verification
 */

export interface StandardRate {
  service: string;
  rate: number;
  frequency: "monthly" | "quarterly" | "annual";
}

export const STANDARD_RATES: Record<string, StandardRate> = {
  pool_cleaning: { service: "Pool Cleaning", rate: 120, frequency: "monthly" }, // Basic tier $120, Standard $165, Full $210
  lawn_landscaping: { service: "Lawn/Landscaping", rate: 120, frequency: "monthly" },
  house_cleaning: { service: "House Cleaning", rate: 160, frequency: "monthly" },
  gutter_cleaning: { service: "Gutter Cleaning", rate: 80, frequency: "quarterly" },
  pressure_washing: { service: "Pressure Washing", rate: 200, frequency: "annual" },
};

export interface PriceMatchResult {
  serviceKey: string;
  serviceName: string;
  standardRate: number;
  frequency: string;
  claimedPrice: number;
  matchedPrice: number;
  discountPercent: number;
  matched: boolean;
  explanation: string;
}

/**
 * Calculate price match offer
 * - If claimed price is within 15% below standard → MATCH IT
 * - If more than 15% below → floor at 15% discount
 */
export function calculatePriceMatch(serviceKey: string, claimedPrice: number): PriceMatchResult | null {
  const rate = STANDARD_RATES[serviceKey];
  if (!rate) return null;

  const floor = rate.rate * 0.85; // 15% discount floor
  const isWithin15 = claimedPrice >= floor;

  let matchedPrice: number;
  let explanation: string;

  if (claimedPrice >= rate.rate) {
    // They're already paying more - easy match
    matchedPrice = rate.rate;
    explanation = `Great news! Our standard rate of $${rate.rate}/${rate.frequency} is already lower than what you're paying.`;
  } else if (isWithin15) {
    // Within 15% - match their price
    matchedPrice = claimedPrice;
    explanation = `We can match your current price of $${claimedPrice}/${rate.frequency}! That's a great deal.`;
  } else {
    // More than 15% below - floor at 15% discount
    matchedPrice = Math.round(floor);
    explanation = `Our best offer is $${Math.round(floor)}/${rate.frequency} - that's 15% below our standard rate of $${rate.rate}. We can't go lower, but you're still getting a great deal!`;
  }

  const discountPercent = Math.round(((rate.rate - matchedPrice) / rate.rate) * 100);

  return {
    serviceKey,
    serviceName: rate.service,
    standardRate: rate.rate,
    frequency: rate.frequency,
    claimedPrice,
    matchedPrice,
    discountPercent,
    matched: isWithin15 || claimedPrice >= rate.rate,
    explanation,
  };
}
