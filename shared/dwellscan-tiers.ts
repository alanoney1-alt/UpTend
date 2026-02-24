/**
 * Home DNA Scan Service Tiers
 * Two-tier home inspection service with optional drone aerial scan
 */

export const DWELLSCAN_TIERS = {
  standard: {
    id: "standard",
    name: "Home DNA Scan Standard",
    price: 99,
    description: "Full interior and exterior walkthrough with personalized maintenance report.",
    features: [
      "Full interior room-by-room walkthrough",
      "Exterior ground-level assessment",
      "Major systems check (AC, water heater, electrical)",
      "Cleanliness rating per room (1-10)",
      "Personalized maintenance report",
      "One-tap booking from report recommendations",
    ],
    proPayout: 50, // $50 FLAT payout for ALL Home DNA Scan tiers
    recommended: false,
  },
  aerial: {
    id: "aerial",
    name: "Home DNA Scan Aerial",
    price: 249,
    badge: "Best Value",
    description: "Everything in Standard plus drone-powered roof, gutter, and exterior scan.",
    subtext: "Comparable drone inspections cost $290-$350. Bundled here for $249.",
    features: [
      "Everything in Standard PLUS:",
      "FAA Part 107 certified drone flyover",
      "Aerial roof condition scan",
      "Gutter blockage assessment from above",
      "Chimney and vent inspection",
      "Tree overhang proximity to roof",
      "Full aerial photo set, GPS-tagged",
    ],
    // $50 FLAT payout for ALL Home DNA Scan tiers (standard AND aerial)
    proPayout: 50,
    recommended: true,
    requiresDroneCertified: true,
  },
} as const;

export type DwellScanTier = keyof typeof DWELLSCAN_TIERS;

export const DWELLSCAN_SERVICE_CREDIT = 49; // $49 back to customer on their next booking

/**
 * Get DwellScan pricing details
 */
export function getDwellScanPrice(tier: DwellScanTier): number {
  return DWELLSCAN_TIERS[tier].price;
}

/**
 * Calculate net cost after applying service credit
 */
export function getDwellScanNetCost(tier: DwellScanTier, hasBookedService: boolean): number {
  const basePrice = DWELLSCAN_TIERS[tier].price;
  return hasBookedService ? basePrice - DWELLSCAN_SERVICE_CREDIT : basePrice;
}

/**
 * Get Pro payout for DwellScan
 */
export function getDwellScanProPayout(
  tier: DwellScanTier,
  _proConfig?: {
    singlePro?: boolean;
    isDroneCertified?: boolean;
  }
): number {
  // $50 FLAT payout for ALL Home DNA Scan tiers (standard AND aerial)
  return 50;
}
