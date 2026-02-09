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
    name: "The Curb Appeal",
    description: "Complete exterior refresh package",
    services: ["pressure_washing", "gutter_cleaning"],
    bundlePrice: 239,
    alacartePrice: 269, // $150 (pressure washing) + $119 (gutter cleaning)
    savings: 30,
  },
  move_out: {
    id: "move_out",
    name: "The Move-Out",
    description: "Complete home inspection, cleanout, deep clean, and exterior wash",
    services: ["home_consultation", "junk_removal", "home_cleaning", "pressure_washing"],
    bundlePrice: 449,
    alacartePrice: 517, // $149 (DwellScan Aerial) + $99 (junk) + $149 (deep clean) + $120 (pressure washing)
    savings: 68,
    badge: "PM Anchor Offer",
    notes: [
      "Includes DwellScan™ Aerial ($149 value)",
      "Multiple Pros may work on this project",
      "$49 DwellScan credit applies automatically",
    ],
    requiresMultiplePros: true,
  },
  full_reset: {
    id: "full_reset",
    name: "The Full Reset",
    description: "Complete home transformation - inspection, cleanout, deep clean, pressure wash, and gutters",
    services: ["home_consultation", "junk_removal", "home_cleaning", "pressure_washing", "gutter_cleaning"],
    bundlePrice: 569,
    alacartePrice: 666, // $149 (DwellScan Aerial) + $99 (junk) + $149 (deep clean) + $150 (pressure washing) + $119 (gutter cleaning)
    savings: 97,
    badge: "Best Value",
    notes: [
      "Includes DwellScan™ Aerial ($149 value)",
      "Multiple Pros may work on this project",
      "$49 DwellScan credit applies automatically",
    ],
    requiresMultiplePros: true,
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
