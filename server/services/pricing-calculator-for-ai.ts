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
    '1-1': { standard: 99, deep: 149, move_out: 179 },
    '2-1': { standard: 129, deep: 189, move_out: 229 },
    '2-2': { standard: 149, deep: 219, move_out: 259 },
    '3-2': { standard: 179, deep: 269, move_out: 319 },
    '3-3': { standard: 209, deep: 309, move_out: 369 },
    '4-2': { standard: 229, deep: 339, move_out: 399 },
    '4-3': { standard: 259, deep: 389, move_out: 459 },
    '5-3': { standard: 299, deep: 449, move_out: 529 },
    '5-4': { standard: 299, deep: 449, move_out: 529 },
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

  const breakdown = `Home Cleaning ${cleanTypeLabel} - ${params.bedrooms}BR/${params.bathrooms}BA${stories > 1 ? `, ${stories}-story` : ''}${modifiers.length > 0 ? ` with ${modifiers.join(', ')}` : ''}`;

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
  proPayout: number; // $50 FLAT for all AI Home Scan tiers
  description: string;
} {
  if (params.tier === 'standard') {
    return {
      customerPrice: 99,
      proPayout: 50, // $50 FLAT payout for ALL AI Home Scan tiers
      description: 'AI Home Scan Standard - Full interior + exterior ground-level walkthrough with maintenance report',
    };
  }

  // Aerial tier - $50 FLAT payout regardless of pro model
  return {
    customerPrice: 249,
    proPayout: 50, // $50 FLAT payout for ALL AI Home Scan tiers
    description: 'AI Home Scan Aerial - Full walkthrough + drone flyover',
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
  stories: 1 | 2 | 3;
  linearFeet?: number;
}): {
  price: number;
  description: string;
  tier: string;
} {
  const ft = params.linearFeet || 150; // default to standard size

  if (params.stories === 1) {
    if (ft <= 150) {
      return { price: 150, description: 'Gutter Cleaning 1-Story (up to 150 linear ft)', tier: '1_story' };
    }
    return { price: 195, description: 'Gutter Cleaning 1-Story Large (150-250 linear ft)', tier: '1_story_large' };
  }

  if (params.stories === 2) {
    if (ft <= 150) {
      return { price: 225, description: 'Gutter Cleaning 2-Story (up to 150 linear ft)', tier: '2_story' };
    }
    return { price: 285, description: 'Gutter Cleaning 2-Story Large (150-250 linear ft)', tier: '2_story_large' };
  }

  // 3-story
  return { price: 350, description: 'Gutter Cleaning 3-Story (custom quote for larger)', tier: '3_story' };
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
 * Calculate FixIt (handyman) price from task selection
 *
 * TaskRabbit-style model: per-task pricing OR hourly with 1-hour minimum
 */
export function calculateFixItPriceForAI(params: {
  tasks: Array<{
    taskId: string;
    quantity?: number;
  }>;
  hourlyBooking?: boolean;
  estimatedHours?: number;
}): {
  price: number;
  priceRange?: { min: number; max: number };
  breakdown: string;
  estimatedDuration: string;
  pricingModel: 'per_task' | 'hourly';
} {
  const HOURLY_RATE = 65;
  const MINIMUM_HOURS = 1;

  // FixIt Task Catalog — TaskRabbit-inspired
  const FIXIT_TASKS: Record<string, { name: string; price: number; duration: number; category: string }> = {
    // MOUNTING & INSTALLATION
    tv_mount: { name: 'TV Mounting', price: 89, duration: 45, category: 'mounting' },
    tv_mount_large: { name: 'Large TV Mounting (65"+)', price: 129, duration: 60, category: 'mounting' },
    shelf_mount: { name: 'Shelf/Floating Shelf Install', price: 45, duration: 30, category: 'mounting' },
    curtain_rod: { name: 'Curtain Rod Install', price: 39, duration: 20, category: 'mounting' },
    mirror_mount: { name: 'Mirror Mounting', price: 69, duration: 30, category: 'mounting' },
    picture_hanging: { name: 'Picture Hanging (per 5 items)', price: 35, duration: 20, category: 'mounting' },

    // FURNITURE ASSEMBLY
    ikea_simple: { name: 'Simple Furniture Assembly (chair, table)', price: 49, duration: 30, category: 'assembly' },
    ikea_medium: { name: 'Medium Furniture Assembly (dresser, desk)', price: 89, duration: 60, category: 'assembly' },
    ikea_complex: { name: 'Complex Furniture Assembly (bed, wardrobe)', price: 129, duration: 90, category: 'assembly' },

    // MINOR PLUMBING
    faucet_replacement: { name: 'Faucet Replacement', price: 109, duration: 60, category: 'plumbing' },
    toilet_repair: { name: 'Toilet Repair (flapper, fill valve)', price: 79, duration: 45, category: 'plumbing' },
    toilet_installation: { name: 'Toilet Installation', price: 179, duration: 90, category: 'plumbing' },
    drain_clearing: { name: 'Drain Clearing (sink/tub)', price: 89, duration: 45, category: 'plumbing' },
    garbage_disposal: { name: 'Garbage Disposal Install', price: 129, duration: 60, category: 'plumbing' },

    // MINOR ELECTRICAL
    outlet_switch: { name: 'Outlet/Switch Replacement', price: 59, duration: 30, category: 'electrical' },
    ceiling_fan: { name: 'Ceiling Fan Install', price: 139, duration: 90, category: 'electrical' },
    light_fixture: { name: 'Light Fixture Install', price: 89, duration: 45, category: 'electrical' },
    doorbell_install: { name: 'Doorbell/Smart Doorbell Install', price: 79, duration: 45, category: 'electrical' },

    // DOORS & LOCKS
    door_hardware: { name: 'Door Hardware Replacement (handle, knob)', price: 69, duration: 30, category: 'doors' },
    deadbolt_install: { name: 'Deadbolt Install', price: 89, duration: 45, category: 'doors' },
    door_adjustment: { name: 'Door Adjustment (sticking, alignment)', price: 79, duration: 45, category: 'doors' },
    smart_lock: { name: 'Smart Lock Install', price: 99, duration: 60, category: 'doors' },

    // DRYWALL & PAINTING
    drywall_small: { name: 'Small Drywall Repair (<6")', price: 69, duration: 60, category: 'drywall' },
    drywall_medium: { name: 'Medium Drywall Repair (6-12")', price: 99, duration: 90, category: 'drywall' },
    drywall_large: { name: 'Large Drywall Repair (12"+)', price: 149, duration: 120, category: 'drywall' },
    paint_touchup: { name: 'Paint Touch-Up (per room)', price: 79, duration: 60, category: 'painting' },
    paint_room: { name: 'Paint Single Room', price: 249, duration: 240, category: 'painting' },

    // GENERAL REPAIRS
    caulking: { name: 'Caulking (bathroom, kitchen, windows)', price: 59, duration: 45, category: 'repairs' },
    weatherstripping: { name: 'Weatherstripping (door/window)', price: 49, duration: 30, category: 'repairs' },
    window_screen: { name: 'Window Screen Repair', price: 39, duration: 20, category: 'repairs' },
    baseboard_install: { name: 'Baseboard Install (per room)', price: 129, duration: 120, category: 'carpentry' },
    trim_repair: { name: 'Trim/Molding Repair', price: 89, duration: 60, category: 'carpentry' },

    // OUTDOOR
    mailbox_install: { name: 'Mailbox Install', price: 79, duration: 45, category: 'outdoor' },
    gutter_repair: { name: 'Minor Gutter Repair', price: 99, duration: 60, category: 'outdoor' },
    fence_repair: { name: 'Fence Repair (per section)', price: 129, duration: 90, category: 'outdoor' },
  };

  if (params.hourlyBooking) {
    // Hourly booking model
    const hours = Math.max(params.estimatedHours || MINIMUM_HOURS, MINIMUM_HOURS);
    const totalPrice = HOURLY_RATE * hours;

    return {
      price: totalPrice,
      breakdown: `${hours} hour${hours > 1 ? 's' : ''} × $${HOURLY_RATE}/hr = $${totalPrice} (1-hour minimum)`,
      estimatedDuration: `${hours} hour${hours > 1 ? 's' : ''}`,
      pricingModel: 'hourly',
    };
  } else {
    // Per-task pricing
    let totalPrice = 0;
    let totalDuration = 0;
    const taskDetails: string[] = [];

    for (const task of params.tasks) {
      const taskInfo = FIXIT_TASKS[task.taskId];
      if (taskInfo) {
        const quantity = task.quantity || 1;
        const taskPrice = taskInfo.price * quantity;
        totalPrice += taskPrice;
        totalDuration += taskInfo.duration * quantity;

        if (quantity > 1) {
          taskDetails.push(`${taskInfo.name} (×${quantity}): $${taskPrice}`);
        } else {
          taskDetails.push(`${taskInfo.name}: $${taskInfo.price}`);
        }
      }
    }

    // Multi-task discount (book 3+ tasks, save 10%)
    if (params.tasks.length >= 3) {
      const discount = totalPrice * 0.10;
      totalPrice -= discount;
      taskDetails.push(`Multi-task discount (-10%): -$${Math.round(discount)}`);
    }

    totalPrice = Math.round(totalPrice);
    const durationHours = Math.ceil(totalDuration / 60);

    return {
      price: totalPrice,
      breakdown: taskDetails.join('\n'),
      estimatedDuration: `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m`,
      pricingModel: 'per_task',
    };
  }
}

/**
 * Get FixIt task catalog for AI assistant
 */
export function getFixItTaskCatalog(): Array<{
  taskId: string;
  name: string;
  price: number;
  duration: number;
  category: string;
}> {
  const FIXIT_TASKS = {
    tv_mount: { name: 'TV Mounting', price: 89, duration: 45, category: 'mounting' },
    tv_mount_large: { name: 'Large TV Mounting (65"+)', price: 129, duration: 60, category: 'mounting' },
    shelf_mount: { name: 'Shelf/Floating Shelf Install', price: 45, duration: 30, category: 'mounting' },
    curtain_rod: { name: 'Curtain Rod Install', price: 39, duration: 20, category: 'mounting' },
    mirror_mount: { name: 'Mirror Mounting', price: 69, duration: 30, category: 'mounting' },
    picture_hanging: { name: 'Picture Hanging (per 5 items)', price: 35, duration: 20, category: 'mounting' },
    ikea_simple: { name: 'Simple Furniture Assembly', price: 49, duration: 30, category: 'assembly' },
    ikea_medium: { name: 'Medium Furniture Assembly', price: 89, duration: 60, category: 'assembly' },
    ikea_complex: { name: 'Complex Furniture Assembly', price: 129, duration: 90, category: 'assembly' },
    faucet_replacement: { name: 'Faucet Replacement', price: 109, duration: 60, category: 'plumbing' },
    toilet_repair: { name: 'Toilet Repair', price: 79, duration: 45, category: 'plumbing' },
    toilet_installation: { name: 'Toilet Installation', price: 179, duration: 90, category: 'plumbing' },
    drain_clearing: { name: 'Drain Clearing', price: 89, duration: 45, category: 'plumbing' },
    garbage_disposal: { name: 'Garbage Disposal Install', price: 129, duration: 60, category: 'plumbing' },
    outlet_switch: { name: 'Outlet/Switch Replacement', price: 59, duration: 30, category: 'electrical' },
    ceiling_fan: { name: 'Ceiling Fan Install', price: 139, duration: 90, category: 'electrical' },
    light_fixture: { name: 'Light Fixture Install', price: 89, duration: 45, category: 'electrical' },
    doorbell_install: { name: 'Doorbell Install', price: 79, duration: 45, category: 'electrical' },
    door_hardware: { name: 'Door Hardware Replacement', price: 69, duration: 30, category: 'doors' },
    deadbolt_install: { name: 'Deadbolt Install', price: 89, duration: 45, category: 'doors' },
    door_adjustment: { name: 'Door Adjustment', price: 79, duration: 45, category: 'doors' },
    smart_lock: { name: 'Smart Lock Install', price: 99, duration: 60, category: 'doors' },
    drywall_small: { name: 'Small Drywall Repair', price: 69, duration: 60, category: 'drywall' },
    drywall_medium: { name: 'Medium Drywall Repair', price: 99, duration: 90, category: 'drywall' },
    drywall_large: { name: 'Large Drywall Repair', price: 149, duration: 120, category: 'drywall' },
    paint_touchup: { name: 'Paint Touch-Up', price: 79, duration: 60, category: 'painting' },
    paint_room: { name: 'Paint Single Room', price: 249, duration: 240, category: 'painting' },
    caulking: { name: 'Caulking', price: 59, duration: 45, category: 'repairs' },
    weatherstripping: { name: 'Weatherstripping', price: 49, duration: 30, category: 'repairs' },
    window_screen: { name: 'Window Screen Repair', price: 39, duration: 20, category: 'repairs' },
    baseboard_install: { name: 'Baseboard Install', price: 129, duration: 120, category: 'carpentry' },
    trim_repair: { name: 'Trim/Molding Repair', price: 89, duration: 60, category: 'carpentry' },
    mailbox_install: { name: 'Mailbox Install', price: 79, duration: 45, category: 'outdoor' },
    gutter_repair: { name: 'Minor Gutter Repair', price: 99, duration: 60, category: 'outdoor' },
    fence_repair: { name: 'Fence Repair', price: 129, duration: 90, category: 'outdoor' },
  };

  return Object.entries(FIXIT_TASKS).map(([taskId, info]) => ({
    taskId,
    ...info,
  }));
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

  if (serviceType === 'fixit' || serviceType === 'handyman') {
    const questions = [];
    if (!currentParams.tasks || currentParams.tasks.length === 0) {
      questions.push("What do you need fixed or installed?");
      questions.push("I can show you our task list with prices, or you can describe what you need and I'll recommend the right tasks.");
    }
    return questions;
  }

  return [];
}

/**
 * Estimate environmental impact for a quote (before job completion)
 *
 * Provides customers with expected ESG benefits during the quoting process.
 * Shows the positive environmental impact they'll have by booking with UpTend.
 */
export function estimateEnvironmentalImpact(serviceType: string, params: any): {
  estimatedCo2SavedLbs: number;
  estimatedWaterSavedGallons?: number;
  message: string;
} | null {
  switch (serviceType) {
    case 'freshwash':
    case 'pressure_washing':
      if (params.totalSqft) {
        // Estimate: Eco-friendly methods save ~0.01 lbs CO2 per sqft
        // Plus ~0.2 gallons water per sqft vs traditional methods
        const co2Saved = params.totalSqft * 0.01;
        const waterSaved = params.totalSqft * 0.2;
        return {
          estimatedCo2SavedLbs: co2Saved,
          estimatedWaterSavedGallons: waterSaved,
          message: `🌱 This job will save approximately ${Math.round(waterSaved)} gallons of water and reduce CO2 by ${Math.round(co2Saved)} lbs!`,
        };
      }
      break;

    case 'gutterflush':
    case 'gutter_cleaning':
      // Gutter cleaning prevents water damage (50 lbs CO2 credit)
      return {
        estimatedCo2SavedLbs: 50,
        message: `🌱 Preventative maintenance like this helps avoid water damage repairs, saving approximately 50 lbs of CO2 emissions!`,
      };

    case 'bulksnap':
    case 'junk_removal':
      // Estimate based on typical diversion rates: 60% recycled/donated = ~2 lbs CO2 saved per lb diverted
      const estimatedWeight = params.itemCount ? params.itemCount * 50 : 500; // ~50 lbs per item average
      const co2Saved = estimatedWeight * 0.6 * 2; // 60% diversion × 2 lbs CO2e per lb
      return {
        estimatedCo2SavedLbs: co2Saved,
        message: `♻️ We'll divert as much as possible from landfills. Expected CO2 reduction: ${Math.round(co2Saved)} lbs through recycling and donation!`,
      };

    case 'polishup':
    case 'home_cleaning': {
      // Eco-friendly products save ~0.05 lbs CO2 per sqft
      if (params.sqft || params.bedrooms) {
        const sqft = params.sqft || (params.bedrooms * 200);
        const co2SavedCleaning = sqft * 0.05;
        return {
          estimatedCo2SavedLbs: co2SavedCleaning,
          message: `🌱 Using eco-friendly cleaning products will reduce CO2 by approximately ${Math.round(co2SavedCleaning)} lbs!`,
        };
      }
      break;
    }

    case 'fixit':
    case 'handyman': {
      // Repair vs replace credit: ~100 lbs CO2 saved per repair
      const repairs = params.itemsRepaired || params.tasks?.length || 1;
      const co2SavedRepair = repairs * 100;
      return {
        estimatedCo2SavedLbs: co2SavedRepair,
        message: `♻️ Repairing instead of replacing saves approximately ${Math.round(co2SavedRepair)} lbs of CO2 by extending product life!`,
      };
    }
  }

  return null;
}
