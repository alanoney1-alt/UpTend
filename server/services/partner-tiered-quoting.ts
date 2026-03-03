/**
 * Partner Tiered Quoting Service
 * 
 * Generates Good/Better/Best pricing tiers from conversation context.
 */

export interface TierItem {
  name: string;
  description: string;
}

export interface PricingTier {
  tier: "basic" | "standard" | "premium";
  name: string;
  label: string;
  description: string;
  priceEstimateLow: number;
  priceEstimateHigh: number;
  includedItems: TierItem[];
  recommended: boolean;
}

export interface TieredQuoteRequest {
  serviceType: string;
  conversationContext?: string;
  basePrice?: number;
  partnerSlug: string;
  customerName?: string;
}

export interface TieredQuoteResult {
  serviceType: string;
  tiers: PricingTier[];
  generatedAt: string;
  partnerSlug: string;
}

// Base prices by service type (fallback if no pricing engine data)
const BASE_PRICES: Record<string, { low: number; high: number }> = {
  hvac_repair: { low: 150, high: 350 },
  hvac_maintenance: { low: 100, high: 200 },
  plumbing_repair: { low: 120, high: 300 },
  plumbing_install: { low: 200, high: 500 },
  electrical_repair: { low: 100, high: 280 },
  electrical_install: { low: 150, high: 400 },
  general_handyman: { low: 80, high: 200 },
  appliance_repair: { low: 100, high: 300 },
  roofing_repair: { low: 200, high: 600 },
  painting: { low: 150, high: 400 },
  landscaping: { low: 80, high: 250 },
  cleaning: { low: 100, high: 250 },
  default: { low: 100, high: 300 },
};

// Tier multipliers
const TIER_MULTIPLIERS = {
  basic: 1.0,
  standard: 1.5,
  premium: 2.0,
};

// Service-specific tier details
const SERVICE_TIER_DETAILS: Record<string, { basic: TierItem[]; standard: TierItem[]; premium: TierItem[] }> = {
  hvac_repair: {
    basic: [
      { name: "Diagnostic & basic repair", description: "Fix the immediate issue" },
      { name: "Standard parts", description: "OEM-equivalent replacement parts" },
    ],
    standard: [
      { name: "Full system diagnostic", description: "Complete system inspection" },
      { name: "Quality parts + filter replacement", description: "Premium parts with new filters" },
      { name: "1-year repair warranty", description: "Parts and labor guaranteed" },
    ],
    premium: [
      { name: "Comprehensive system overhaul", description: "Full tune-up and repair" },
      { name: "Premium parts + all filters", description: "Top-tier components" },
      { name: "2-year warranty", description: "Extended parts and labor coverage" },
      { name: "Priority scheduling", description: "Same-day or next-day service" },
      { name: "Annual maintenance check included", description: "Free follow-up in 6 months" },
    ],
  },
  plumbing_repair: {
    basic: [
      { name: "Fix the leak/clog", description: "Address the immediate problem" },
      { name: "Standard parts", description: "Basic replacement components" },
    ],
    standard: [
      { name: "Full pipe inspection", description: "Camera inspection of affected area" },
      { name: "Quality fixtures", description: "Upgraded replacement parts" },
      { name: "1-year warranty", description: "Labor and parts guaranteed" },
    ],
    premium: [
      { name: "Whole-house plumbing check", description: "Inspect all connections" },
      { name: "Premium fixtures", description: "Top-brand replacements" },
      { name: "2-year warranty", description: "Extended coverage" },
      { name: "Water pressure optimization", description: "System balancing included" },
      { name: "Emergency priority", description: "24/7 callback priority" },
    ],
  },
};

// Default tier details for unlisted services
const DEFAULT_TIER_DETAILS = {
  basic: [
    { name: "Basic service", description: "Fix the immediate issue" },
    { name: "Standard materials", description: "Quality replacement parts" },
  ],
  standard: [
    { name: "Comprehensive service", description: "Thorough inspection and repair" },
    { name: "Quality materials", description: "Upgraded components" },
    { name: "1-year warranty", description: "Parts and labor covered" },
  ],
  premium: [
    { name: "Full-service package", description: "Complete system attention" },
    { name: "Premium materials", description: "Top-tier components" },
    { name: "2-year warranty", description: "Extended coverage" },
    { name: "Priority scheduling", description: "Preferred appointment times" },
    { name: "Follow-up included", description: "Complimentary check-up" },
  ],
};

/**
 * Generate 3 pricing tiers for a service
 */
export function generateTieredQuote(request: TieredQuoteRequest): TieredQuoteResult {
  const serviceKey = request.serviceType.toLowerCase().replace(/[\s-]+/g, "_");
  const basePrices = BASE_PRICES[serviceKey] || BASE_PRICES.default;
  
  // Use provided base price or service default
  const baseLow = request.basePrice ?? basePrices.low;
  const baseHigh = request.basePrice ? request.basePrice * 1.3 : basePrices.high;
  
  const tierDetails = SERVICE_TIER_DETAILS[serviceKey] || DEFAULT_TIER_DETAILS;

  const tiers: PricingTier[] = [
    {
      tier: "basic",
      name: "Good",
      label: "Basic Fix",
      description: "Get the problem solved with a straightforward, no-frills repair.",
      priceEstimateLow: Math.round(baseLow * TIER_MULTIPLIERS.basic),
      priceEstimateHigh: Math.round(baseHigh * TIER_MULTIPLIERS.basic),
      includedItems: tierDetails.basic,
      recommended: false,
    },
    {
      tier: "standard",
      name: "Better",
      label: "Recommended",
      description: "Our most popular option — thorough service with warranty protection.",
      priceEstimateLow: Math.round(baseLow * TIER_MULTIPLIERS.standard),
      priceEstimateHigh: Math.round(baseHigh * TIER_MULTIPLIERS.standard),
      includedItems: tierDetails.standard,
      recommended: true,
    },
    {
      tier: "premium",
      name: "Best",
      label: "Comprehensive",
      description: "The complete package — premium parts, extended warranty, and priority service.",
      priceEstimateLow: Math.round(baseLow * TIER_MULTIPLIERS.premium),
      priceEstimateHigh: Math.round(baseHigh * TIER_MULTIPLIERS.premium),
      includedItems: tierDetails.premium,
      recommended: false,
    },
  ];

  return {
    serviceType: request.serviceType,
    tiers,
    generatedAt: new Date().toISOString(),
    partnerSlug: request.partnerSlug,
  };
}

/**
 * System prompt addition for George partner conversations
 */
export const TIERED_QUOTING_PROMPT = `
When you've finished scoping the customer's issue, present 3 pricing options:

**Good (Basic Fix):** Minimum repair to solve the immediate problem. Most affordable.
**Better (Recommended):** Thorough service with quality parts and warranty. Best value.  
**Best (Comprehensive):** Premium parts, extended warranty, priority service, and follow-up.

Always recommend the "Better" option. Let the customer choose what works for their budget.
Format prices as ranges (e.g., "$150–$350") and list what's included in each tier.
`;
