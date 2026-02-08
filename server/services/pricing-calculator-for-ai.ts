/**
 * Pricing Calculator for AI Assistant
 *
 * This module provides pricing calculation functions that the AI assistant
 * (chat/SMS bot) can use to generate accurate quotes in conversation.
 *
 * Ensures Path C (chat/SMS/phone) uses the same pricing engines as
 * Path A (AI scan) and Path B (manual form).
 */

/**
 * Calculate PolishUp (home cleaning) price from conversational inputs
 */
export function calculatePolishUpPriceForAI(params: {
  bedrooms: number;
  bathrooms: number;
  cleanType: 'standard' | 'deep' | 'move_out';
  stories?: number;
  sqft?: number;
  hasPets?: boolean;
  lastCleaned?: '30_days' | '1_6_months' | '6_plus_months' | 'never';
  sameDayBooking?: boolean;
}): {
  price: number;
  breakdown: string;
  estimatedDuration: string;
  prosNeeded: number;
} {
  // Import the actual pricing engine
  // NOTE: This would need to be transpiled or we need to share types
  // For now, this is a TypeScript reference. Actual implementation
  // would import from the shared pricing library.

  /**
   * Base price matrix (simplified for AI context)
   * Rows: Bedrooms/Bathrooms
   * Columns: Clean type
   */
  const basePrices: Record<string, { standard: number; deep: number; move_out: number }> = {
    '1-1': { standard: 99, deep: 179, move_out: 229 },
    '2-1': { standard: 129, deep: 229, move_out: 299 },
    '2-2': { standard: 149, deep: 259, move_out: 329 },
    '3-2': { standard: 179, deep: 299, move_out: 399 },
    '3-3': { standard: 199, deep: 349, move_out: 449 },
    '4-2': { standard: 219, deep: 379, move_out: 479 },
    '4-3': { standard: 249, deep: 429, move_out: 529 },
    '5-3': { standard: 299, deep: 499, move_out: 599 },
  };

  // Find closest base price
  const bathrooms = Math.round(params.bathrooms);
  const key = `${params.bedrooms}-${bathrooms}`;
  let basePrice = basePrices[key]?.[params.cleanType];

  if (!basePrice) {
    // Fallback to closest match
    basePrice = basePrices['2-2'][params.cleanType];
  }

  let finalPrice = basePrice;
  const modifiers: string[] = [];

  // Story multiplier
  const stories = params.stories || 1;
  if (stories === 2) {
    finalPrice *= 1.15;
    modifiers.push('Two-story (+15%)');
  } else if (stories === 3) {
    finalPrice *= 1.25;
    modifiers.push('Three-story (+25%)');
  }

  // Square footage multiplier
  if (params.sqft && params.sqft >= 3000) {
    finalPrice *= 1.10;
    modifiers.push('3,000+ sqft (+10%)');
  }

  // Last cleaned multiplier
  const lastCleaned = params.lastCleaned || '1_6_months';
  if (lastCleaned === '6_plus_months' || lastCleaned === 'never') {
    finalPrice *= 1.20;
    modifiers.push('Not cleaned in 6+ months (+20%)');
  }

  // Pets addon
  if (params.hasPets) {
    finalPrice += 25;
    modifiers.push('Pet hair removal (+$25)');
  }

  // Same-day booking addon
  if (params.sameDayBooking) {
    finalPrice += 30;
    modifiers.push('Same-day service (+$30)');
  }

  finalPrice = Math.round(finalPrice);

  // Estimate duration and pros
  let estimatedHours = 2;
  let prosNeeded = 1;

  if (params.cleanType === 'standard') {
    estimatedHours = 2 + (params.bedrooms * 0.5);
    prosNeeded = 1;
  } else if (params.cleanType === 'deep') {
    estimatedHours = 3 + (params.bedrooms * 0.75);
    prosNeeded = params.bedrooms <= 2 ? 1 : 2;
  } else if (params.cleanType === 'move_out') {
    estimatedHours = 4 + (params.bedrooms * 1);
    prosNeeded = params.bedrooms <= 2 ? 2 : 3;
  }

  // Adjust for multiple pros
  if (prosNeeded > 1) {
    estimatedHours = estimatedHours / (prosNeeded * 0.75);
  }

  // Adjust for stories
  if (stories === 2) {
    estimatedHours *= 1.1;
  } else if (stories === 3) {
    estimatedHours *= 1.2;
  }

  estimatedHours = Math.round(estimatedHours * 2) / 2; // Round to nearest 0.5

  const cleanTypeLabel = {
    standard: 'Standard Clean',
    deep: 'Deep Clean',
    move_out: 'Move-Out Clean',
  }[params.cleanType];

  const breakdown = `PolishUp™ ${cleanTypeLabel} - ${params.bedrooms}BR/${params.bathrooms}BA${stories > 1 ? `, ${stories}-story` : ''}${modifiers.length > 0 ? ` with ${modifiers.join(', ')}` : ''}`;

  return {
    price: finalPrice,
    breakdown,
    estimatedDuration: `${estimatedHours} hours`,
    prosNeeded,
  };
}

/**
 * Calculate DwellScan price based on tier selection
 */
export function calculateDwellScanPriceForAI(params: {
  tier: 'standard' | 'aerial';
  proModel?: 'two_pro' | 'one_pro'; // Only for aerial
}): {
  customerPrice: number;
  proPayout: number | { walkthrough: number; drone: number } | { combined: number };
  description: string;
} {
  if (params.tier === 'standard') {
    return {
      customerPrice: 49,
      proPayout: 25,
      description: 'DwellScan™ Standard - Full interior + exterior ground-level walkthrough with maintenance report',
    };
  }

  // Aerial tier
  if (params.proModel === 'one_pro') {
    return {
      customerPrice: 149,
      proPayout: { combined: 80 },
      description: 'DwellScan™ Aerial - Combined walkthrough + drone (single Pro, saves $69)',
    };
  }

  // Default: two-pro model
  return {
    customerPrice: 149,
    proPayout: { walkthrough: 25, drone: 55 },
    description: 'DwellScan™ Aerial - Full walkthrough + drone flyover (two Pros)',
  };
}

/**
 * Calculate BulkSnap (junk removal) price from volume or items
 */
export function calculateBulkSnapPriceForAI(params: {
  loadSize?: 'minimum' | 'eighth' | 'quarter' | 'half' | 'three_quarter' | 'full';
  cubicFeet?: number;
  itemCount?: number;
}): {
  price: number;
  loadSize: string;
  capacity: string;
} {
  const pricingTiers = {
    minimum: { price: 99, capacity: '~25 cubic ft', label: 'Minimum (1-2 items)' },
    eighth: { price: 179, capacity: '~27 cubic ft', label: '1/8 Truck' },
    quarter: { price: 279, capacity: '~54 cubic ft', label: '1/4 Truck' },
    half: { price: 379, capacity: '~108 cubic ft', label: '1/2 Truck' },
    three_quarter: { price: 449, capacity: '~162 cubic ft', label: '3/4 Truck' },
    full: { price: 449, capacity: '~216 cubic ft', label: 'Full Truck' },
  };

  // If load size is specified, use it directly
  if (params.loadSize) {
    const tier = pricingTiers[params.loadSize];
    return {
      price: tier.price,
      loadSize: tier.label,
      capacity: tier.capacity,
    };
  }

  // Estimate load size from cubic feet
  if (params.cubicFeet) {
    if (params.cubicFeet <= 27) {
      return { ...pricingTiers.minimum, loadSize: pricingTiers.minimum.label };
    } else if (params.cubicFeet <= 54) {
      return { ...pricingTiers.quarter, loadSize: pricingTiers.quarter.label };
    } else if (params.cubicFeet <= 108) {
      return { ...pricingTiers.half, loadSize: pricingTiers.half.label };
    } else if (params.cubicFeet <= 162) {
      return { ...pricingTiers.three_quarter, loadSize: pricingTiers.three_quarter.label };
    } else {
      return { ...pricingTiers.full, loadSize: pricingTiers.full.label };
    }
  }

  // Estimate from item count
  if (params.itemCount) {
    if (params.itemCount <= 2) {
      return { ...pricingTiers.minimum, loadSize: pricingTiers.minimum.label };
    } else if (params.itemCount <= 5) {
      return { ...pricingTiers.quarter, loadSize: pricingTiers.quarter.label };
    } else if (params.itemCount <= 10) {
      return { ...pricingTiers.half, loadSize: pricingTiers.half.label };
    } else {
      return { ...pricingTiers.full, loadSize: pricingTiers.full.label };
    }
  }

  // Default to minimum
  return { ...pricingTiers.minimum, loadSize: pricingTiers.minimum.label };
}

/**
 * Calculate FreshWash (pressure washing) price from square footage
 */
export function calculateFreshWashPriceForAI(params: {
  totalSqft: number;
}): {
  price: number;
  pricePerSqft: number;
  breakdown: string;
} {
  const PRICE_PER_SQFT = 0.25;
  const MINIMUM_PRICE = 120;

  const calculatedPrice = params.totalSqft * PRICE_PER_SQFT;
  const finalPrice = Math.max(calculatedPrice, MINIMUM_PRICE);

  return {
    price: Math.round(finalPrice),
    pricePerSqft: PRICE_PER_SQFT,
    breakdown: `${params.totalSqft} sqft × $${PRICE_PER_SQFT}/sqft = $${Math.round(finalPrice)}${finalPrice === MINIMUM_PRICE ? ' (minimum)' : ''}`,
  };
}

/**
 * Calculate GutterFlush (gutter cleaning) price from stories
 */
export function calculateGutterFlushPriceForAI(params: {
  stories: 1 | 2;
}): {
  price: number;
  description: string;
} {
  if (params.stories === 1) {
    return {
      price: 149,
      description: 'GutterFlush™ 1-Story - Full perimeter cleaning + flow test',
    };
  }

  return {
    price: 249,
    description: 'GutterFlush™ 2-Story - Full perimeter cleaning + flow test',
  };
}

/**
 * Calculate LiftCrew (moving labor) price from hours and crew size
 */
export function calculateLiftCrewPriceForAI(params: {
  hours: number;
  crewSize: 1 | 2 | 3;
}): {
  price: number;
  hourlyRate: number;
  breakdown: string;
} {
  const HOURLY_RATE_PER_PERSON = 80;
  const MINIMUM_HOURS = 1;

  const hours = Math.max(params.hours, MINIMUM_HOURS);
  const totalHourlyRate = HOURLY_RATE_PER_PERSON * params.crewSize;
  const totalPrice = totalHourlyRate * hours;

  return {
    price: totalPrice,
    hourlyRate: totalHourlyRate,
    breakdown: `${params.crewSize} Pro${params.crewSize > 1 ? 's' : ''} × ${hours} hour${hours > 1 ? 's' : ''} × $${HOURLY_RATE_PER_PERSON}/hr = $${totalPrice}`,
  };
}

/**
 * Format price for conversational response
 */
export function formatPriceForConversation(price: number): string {
  return `$${price}`;
}

/**
 * Get service-specific follow-up questions for quote refinement
 */
export function getFollowUpQuestions(serviceType: string, currentParams: any): string[] {
  if (serviceType === 'polishup') {
    const questions = [];
    if (!currentParams.cleanType) {
      questions.push("What type of clean do you need? (Standard, Deep, or Move-Out)");
    }
    if (!currentParams.lastCleaned) {
      questions.push("When was your home last professionally cleaned?");
    }
    if (currentParams.hasPets === undefined) {
      questions.push("Do you have any pets?");
    }
    return questions;
  }

  if (serviceType === 'bulksnap') {
    const questions = [];
    if (!currentParams.itemCount && !currentParams.loadSize) {
      questions.push("How many items do you need removed? Or can you describe what you're getting rid of?");
    }
    return questions;
  }

  if (serviceType === 'freshwash') {
    const questions = [];
    if (!currentParams.totalSqft) {
      questions.push("Do you know the approximate square footage you need cleaned?");
      questions.push("Or you can upload photos and I'll calculate it for you!");
    }
    return questions;
  }

  return [];
}
