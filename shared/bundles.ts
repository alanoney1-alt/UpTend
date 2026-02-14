/**
 * Named Bundle Packages
 * Pre-configured service combinations with automatic discounts
 */

export interface BundlePackage {
  id: string;
  name: string;
  description: string;
  services: string[]; // Service type IDs
  bundlePrice: number;
  alacartePrice: number;
  savings: number;
  badge?: string;
  notes?: string[];
  requiresMultiplePros?: boolean;
}

export const NAMED_BUNDLES: Record<string, BundlePackage> = {
  refresh: {
    id: "refresh",
    name: "The Refresh",
    description: "Quick cleanup + deep clean combo",
    services: ["junk_removal", "home_cleaning"],
    bundlePrice: 179,
    alacartePrice: 198, // $99 (minimum junk) + $99 (standard clean)
    savings: 19,
  },
  curb_appeal: {
    id: "curb_appeal",
    name: "Curb Appeal",
    description: "Exterior refresh package",
    services: ["pressure_washing", "gutter_cleaning"],
    bundlePrice: 239,
    alacartePrice: 269, // $120 (Pressure Washing small) + $129 (Gutter Cleaning single story)
    savings: 30,
  },
  curb_appeal_plus: {
    id: "curb_appeal_plus",
    name: "Curb Appeal+",
    description: "Full exterior with lawn maintenance",
    services: ["pressure_washing", "gutter_cleaning", "landscaping"],
    bundlePrice: 298,
    alacartePrice: 348, // $120 (Pressure Washing) + $129 (Gutter Cleaning) + $49 (Landscaping one-time mow) + bundle discount
    savings: 50,
  },
  move_out: {
    id: "move_out",
    name: "The Move-Out",
    description: "Complete home inspection, cleanout, deep clean, and exterior wash",
    services: ["home_consultation", "junk_removal", "home_cleaning", "pressure_washing"],
    bundlePrice: 449,
    alacartePrice: 517, // $249 (AI Home Scan Aerial) + $99 (Junk Removal min) + $149 (Home Cleaning deep 1BR/1BA) + $120 (Pressure Washing small)
    savings: 68,
    badge: "PM Anchor Offer",
    notes: [
      "Includes AI Home Scan Aerial ($249 value)",
      "Multiple Pros may work on this project",
      "$49 Home Scan credit applies automatically",
    ],
    requiresMultiplePros: true,
  },
  move_out_plus: {
    id: "move_out_plus",
    name: "Move-Out+",
    description: "Tenant turnover with carpet cleaning",
    services: ["home_cleaning", "junk_removal", "carpet_cleaning"],
    bundlePrice: 499,
    alacartePrice: 597, // $149 (Home Cleaning deep) + $99 (Junk Removal 1/4) + $149 (Carpet Cleaning 3BR/2BA package) × 84% = $499
    savings: 98,
    badge: "PM Favorite",
  },
  full_reset: {
    id: "full_reset",
    name: "The Full Reset",
    description: "Complete home transformation - inspection, cleanout, deep clean, pressure wash, and gutters",
    services: ["home_consultation", "junk_removal", "home_cleaning", "pressure_washing", "gutter_cleaning"],
    bundlePrice: 569,
    alacartePrice: 666, // $249 (AI Home Scan Aerial) + $99 (Junk Removal min) + $149 (Home Cleaning deep 1BR/1BA) + $120 (Pressure Washing small) + $129 (Gutter Cleaning single story)
    savings: 97,
    badge: "Best Value",
    notes: [
      "Includes AI Home Scan Aerial ($249 value)",
      "Multiple Pros may work on this project",
      "$49 Home Scan credit applies automatically",
    ],
    requiresMultiplePros: true,
  },
  full_reset_plus: {
    id: "full_reset_plus",
    name: "Full Reset+",
    description: "Complete PM turnover with all services",
    services: ["home_cleaning", "junk_removal", "pressure_washing", "landscaping", "carpet_cleaning"],
    bundlePrice: 829,
    alacartePrice: 1016, // $149 (Home Cleaning deep) + $149 (Junk Removal 1/2) + $120 (Pressure Washing) + $49 (Landscaping one-time) + $149 (Carpet 3BR package) × 82% = $829
    savings: 187,
    badge: "Complete Package",
    requiresMultiplePros: true,
  },
  splash_ready: {
    id: "splash_ready",
    name: "Splash Ready",
    description: "Pool cleaning and patio pressure wash",
    services: ["pool_cleaning", "pressure_washing"],
    bundlePrice: 224,
    alacartePrice: 249, // $89 (Pool Cleaning Basic) + $120 (Pressure Washing patio) + bundled
    savings: 25,
  },
  fresh_start: {
    id: "fresh_start",
    name: "Fresh Start",
    description: "New move-in cleaning package",
    services: ["home_cleaning", "carpet_cleaning"],
    bundlePrice: 223,
    alacartePrice: 248, // $99 (Home Cleaning standard) + $149 (Carpet Cleaning 3BR/2BA package) × 90% = $223
    savings: 25,
  },
  hoa_blitz: {
    id: "hoa_blitz",
    name: "HOA Blitz",
    description: "HOA compliance package",
    services: ["landscaping", "pressure_washing", "gutter_cleaning", "home_consultation"],
    bundlePrice: 319,
    alacartePrice: 397, // $49 (Landscaping one-time) + $120 (Pressure Washing) + $129 (Gutter Cleaning) + $99 (AI Home Scan) × 80% = $319
    savings: 78,
    badge: "HOA Approved",
  },
  seasonal_reset: {
    id: "seasonal_reset",
    name: "Seasonal Reset",
    description: "Seasonal prep for pool and exterior",
    services: ["landscaping", "pool_cleaning", "pressure_washing"],
    bundlePrice: 549,
    alacartePrice: 638, // $99 (Landscaping Mow & Go monthly) + $169 (Pool Cleaning Full Service) + $250 (Pressure Washing house) + bundle = $549
    savings: 89,
  },
  home_ready: {
    id: "home_ready",
    name: "HomeReady",
    description: "Move-in package with setup and cleaning",
    services: ["handyman", "home_cleaning"],
    bundlePrice: 138,
    alacartePrice: 148, // $75 (Handyman 1hr) + $99 (Home Cleaning standard) × 93% = $138
    savings: 10,
    notes: [
      "Perfect for new move-ins",
      "Pro handles furniture assembly, TV mounting, and setup",
      "Then deep cleans the entire home",
    ],
  },
  quick_fix: {
    id: "quick_fix",
    name: "QuickFix",
    description: "Handyman + junk removal combo",
    services: ["handyman", "junk_removal"],
    bundlePrice: 138,
    alacartePrice: 148, // $75 (Handyman 1hr) + $99 (Junk Removal min) × 93% = $138
    savings: 10,
    notes: [
      "Fix what you can, haul what you can't",
      "Great for rental turnovers",
      "Minor repairs + debris removal in one visit",
    ],
  },
  setup_crew: {
    id: "setup_crew",
    name: "SetUp Crew",
    description: "Moving labor + handyman for full setup",
    services: ["moving_labor", "handyman"],
    bundlePrice: 249,
    alacartePrice: 280, // $160 (Moving Labor 2hrs × 2 workers) + $98 (Handyman 2hrs) × 89% = $249
    savings: 31,
    badge: "Move-In Special",
    notes: [
      "Crew unloads your truck (2 workers × 2 hours)",
      "Then handyman assembles furniture and mounts TVs (2 hours)",
      "Move in ready, same day",
    ],
    requiresMultiplePros: true,
  },
  fix_and_shine: {
    id: "fix_and_shine",
    name: "Fix & Shine",
    description: "Repairs, cleaning, and exterior refresh",
    services: ["handyman", "home_cleaning", "pressure_washing"],
    bundlePrice: 248,
    alacartePrice: 268, // $75 (Handyman 1hr) + $99 (Home Cleaning) + $120 (Pressure Washing) × 93% = $248
    savings: 20,
    badge: "Property Manager Favorite",
    notes: [
      "Fix minor issues",
      "Deep clean interior",
      "Pressure wash exterior",
      "Rental turnover in one day",
    ],
  },
} as const;

export type BundleId = keyof typeof NAMED_BUNDLES;

/**
 * Property Manager Volume Pricing Tiers
 */
export interface VolumeDiscountTier {
  minUnits: number;
  maxUnits: number | null;
  discount: number; // Percentage (5 = 5%)
  benefits: string[];
}

export const PM_VOLUME_DISCOUNTS: VolumeDiscountTier[] = [
  {
    minUnits: 10,
    maxUnits: 19,
    discount: 5,
    benefits: ["5% off all services"],
  },
  {
    minUnits: 20,
    maxUnits: 49,
    discount: 10,
    benefits: ["10% off all services"],
  },
  {
    minUnits: 50,
    maxUnits: null,
    discount: 15,
    benefits: ["15% off all services", "Dedicated account manager"],
  },
];

/**
 * Get volume discount percentage for property manager
 */
export function getPmVolumeDiscount(monthlyUnits: number): number {
  for (const tier of PM_VOLUME_DISCOUNTS) {
    if (monthlyUnits >= tier.minUnits && (tier.maxUnits === null || monthlyUnits <= tier.maxUnits)) {
      return tier.discount;
    }
  }
  return 0;
}

/**
 * Calculate bundle price with optional PM volume discount
 */
export function calculateBundlePrice(
  bundleId: BundleId,
  options?: {
    isPm?: boolean;
    monthlyUnits?: number;
  }
): {
  basePrice: number;
  volumeDiscount?: number;
  finalPrice: number;
  totalSavings: number;
} {
  const bundle = NAMED_BUNDLES[bundleId];
  let basePrice = bundle.bundlePrice;
  let volumeDiscount = 0;

  // Apply PM volume discount if applicable
  if (options?.isPm && options?.monthlyUnits) {
    const discountPercent = getPmVolumeDiscount(options.monthlyUnits);
    volumeDiscount = Math.round(basePrice * (discountPercent / 100));
    basePrice = basePrice - volumeDiscount;
  }

  const totalSavings = bundle.savings + volumeDiscount;

  return {
    basePrice: bundle.bundlePrice,
    volumeDiscount,
    finalPrice: basePrice,
    totalSavings,
  };
}

/**
 * Get recommended bundles for a customer based on their needs
 */
export function getRecommendedBundles(context?: {
  isMoving?: boolean;
  isPm?: boolean;
  needsExteriorWork?: boolean;
}): BundleId[] {
  if (context?.isMoving) {
    return ["move_out", "full_reset"];
  }

  if (context?.isPm) {
    return ["full_reset", "move_out", "curb_appeal"];
  }

  if (context?.needsExteriorWork) {
    return ["curb_appeal", "full_reset"];
  }

  // Default recommendations
  return ["refresh", "curb_appeal", "full_reset"];
}
