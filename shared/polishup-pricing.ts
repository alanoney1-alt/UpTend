/**
 * Home Cleaning Dynamic Pricing Engine
 *
 * Based on Orlando market rates:
 * - Deep clean: $150-$500
 * - Private cleaners: $22-35/hr
 */

export interface PolishUpPricingParams {
  bedrooms: number;
  bathrooms: number;
  stories: 1 | 2;
  cleanType: "standard" | "deep" | "move_out";
  squareFootage?: number; // Optional override
  addOns?: string[];
}

/**
 * Base pricing matrix by bedrooms/bathrooms/clean type
 * Two-story homes add 15% surcharge on top of base price
 */
export const POLISHUP_BASE_PRICES: Record<string, { standard: number; deep: number; move_out: number }> = {
  "1-1": { standard: 99, deep: 149, move_out: 179 },
  "2-1": { standard: 129, deep: 189, move_out: 229 },
  "2-2": { standard: 149, deep: 219, move_out: 259 },
  "3-2": { standard: 179, deep: 269, move_out: 319 },
  "3-3": { standard: 209, deep: 309, move_out: 369 },
  "4-2": { standard: 229, deep: 339, move_out: 399 },
  "4-3": { standard: 259, deep: 389, move_out: 459 },
  "5-3": { standard: 299, deep: 449, move_out: 529 },
  "5-4": { standard: 299, deep: 449, move_out: 529 }, // 5+ bed, 4+ bath
} as const;

/**
 * Add-on services pricing
 */
export const POLISHUP_ADDONS = {
  oven_cleaning: {
    id: "oven_cleaning",
    name: "Inside Oven",
    price: 35,
    description: "Deep clean inside oven, including racks and glass door",
  },
  fridge_cleaning: {
    id: "fridge_cleaning",
    name: "Inside Refrigerator",
    price: 35,
    description: "Interior fridge cleaning, shelves, and drawers",
  },
  interior_windows: {
    id: "interior_windows",
    name: "Interior Windows",
    pricePerWindow: 5,
    description: "Clean interior side of windows",
    estimatedWindows: 10, // Default estimate
  },
  laundry_wash_fold: {
    id: "laundry_wash_fold",
    name: "Laundry (Wash/Dry/Fold)",
    pricePerLoad: 25,
    description: "Full laundry service - wash, dry, and fold",
    estimatedLoads: 1, // Default
  },
  inside_cabinets: {
    id: "inside_cabinets",
    name: "Inside Cabinets",
    price: 45,
    description: "Clean interior of kitchen and bathroom cabinets",
  },
  baseboards: {
    id: "baseboards",
    name: "Baseboards",
    price: 25,
    description: "Detailed baseboard cleaning throughout home",
  },
  garage_sweep: {
    id: "garage_sweep",
    name: "Garage Sweep",
    price: 30,
    description: "Sweep and tidy garage space",
  },
} as const;

export const TWO_STORY_SURCHARGE = 0.15; // 15% surcharge

/**
 * Calculate PolishUp price based on home details
 */
export function calculatePolishUpPrice(params: PolishUpPricingParams): {
  basePrice: number;
  storyMultiplier: number;
  addOnsTotal: number;
  totalPrice: number;
  breakdown: { label: string; amount: number }[];
} {
  const { bedrooms, bathrooms, stories, cleanType, addOns = [] } = params;

  // Normalize to pricing key
  const bedKey = bedrooms >= 5 ? 5 : bedrooms;
  const bathKey = bathrooms >= 4 ? 4 : bathrooms >= 3 ? 3 : bathrooms;
  const pricingKey = `${bedKey}-${bathKey}`;

  // Get base price
  const priceRow = POLISHUP_BASE_PRICES[pricingKey] || POLISHUP_BASE_PRICES["3-2"];
  const basePrice = priceRow[cleanType];

  // Apply two-story surcharge
  const storyMultiplier = stories === 2 ? 1 + TWO_STORY_SURCHARGE : 1;
  const priceWithStories = Math.round(basePrice * storyMultiplier);

  // Calculate add-ons
  let addOnsTotal = 0;
  const breakdown: { label: string; amount: number }[] = [
    {
      label: `${cleanType === "standard" ? "Standard" : cleanType === "deep" ? "Deep" : "Move-Out"} Clean`,
      amount: priceWithStories,
    },
  ];

  for (const addonId of addOns) {
    const addon = POLISHUP_ADDONS[addonId as keyof typeof POLISHUP_ADDONS];
    if (!addon) continue;

    let addonPrice = 0;
    if ("price" in addon) {
      addonPrice = addon.price;
    } else if ("pricePerWindow" in addon) {
      addonPrice = addon.pricePerWindow * (addon.estimatedWindows || 10);
    } else if ("pricePerLoad" in addon) {
      addonPrice = addon.pricePerLoad * (addon.estimatedLoads || 1);
    }

    addOnsTotal += addonPrice;
    breakdown.push({
      label: addon.name,
      amount: addonPrice,
    });
  }

  const totalPrice = priceWithStories + addOnsTotal;

  return {
    basePrice,
    storyMultiplier,
    addOnsTotal,
    totalPrice,
    breakdown,
  };
}

/**
 * Get suggested price range based on home size (for AI estimation)
 */
export function getSuggestedPriceRange(
  bedrooms: number,
  bathrooms: number,
  cleanType: "standard" | "deep" | "move_out" = "deep"
): { min: number; max: number; typical: number } {
  const price = calculatePolishUpPrice({
    bedrooms,
    bathrooms,
    stories: 1,
    cleanType,
  });

  const twoStoryPrice = calculatePolishUpPrice({
    bedrooms,
    bathrooms,
    stories: 2,
    cleanType,
  });

  return {
    min: price.totalPrice,
    max: twoStoryPrice.totalPrice,
    typical: Math.round((price.totalPrice + twoStoryPrice.totalPrice) / 2),
  };
}

/**
 * Estimate bedrooms/bathrooms from square footage (for AI fallback)
 */
export function estimateRoomsFromSqft(sqft: number): { bedrooms: number; bathrooms: number } {
  if (sqft < 800) return { bedrooms: 1, bathrooms: 1 };
  if (sqft < 1200) return { bedrooms: 2, bathrooms: 1 };
  if (sqft < 1600) return { bedrooms: 2, bathrooms: 2 };
  if (sqft < 2000) return { bedrooms: 3, bathrooms: 2 };
  if (sqft < 2500) return { bedrooms: 3, bathrooms: 3 };
  if (sqft < 3000) return { bedrooms: 4, bathrooms: 2 };
  if (sqft < 3500) return { bedrooms: 4, bathrooms: 3 };
  return { bedrooms: 5, bathrooms: 3 };
}
