/**
 * PolishUp Dynamic Pricing Engine
 *
 * Calculates pricing for home cleaning services based on property details.
 * Replaces flat $99 pricing with dynamic pricing based on:
 * - Property size (bedrooms/bathrooms)
 * - Clean type (standard/deep/move-out)
 * - Story count
 * - Square footage
 * - Property condition
 * - Special needs (pets, same-day)
 */

export interface PolishUpPricingInput {
  cleanType: 'standard' | 'deep' | 'move_out';
  bedrooms: 0 | 1 | 2 | 3 | 4 | 5; // 0 = studio
  bathrooms: 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4;
  stories: 1 | 2 | 3;
  sqft?: number;
  hasPets: boolean;
  lastCleaned: '30_days' | '1_6_months' | '6_plus_months' | 'never';
  sameDayBooking: boolean;
}

export interface PolishUpQuote {
  basePrice: number;
  modifiersApplied: Array<{
    name: string;
    type: 'multiplicative' | 'additive';
    value: number;
  }>;
  finalPrice: number;
  estimatedDurationHours: number;
  estimatedProsNeeded: number;
  breakdown: string;
}

/**
 * Base Price Matrix
 * Rows: Property configuration (BR/BA)
 * Columns: Clean type (standard/deep/move-out)
 */
const BASE_PRICE_MATRIX: Record<string, { standard: number; deep: number; move_out: number }> = {
  // Studio/1BR
  '0-1': { standard: 99, deep: 179, move_out: 229 },
  '1-1': { standard: 99, deep: 179, move_out: 229 },

  // 2BR
  '2-1': { standard: 129, deep: 229, move_out: 299 },
  '2-2': { standard: 149, deep: 259, move_out: 329 },

  // 3BR
  '3-2': { standard: 179, deep: 299, move_out: 399 },
  '3-3': { standard: 199, deep: 349, move_out: 449 },

  // 4BR
  '4-2': { standard: 219, deep: 379, move_out: 479 },
  '4-3': { standard: 249, deep: 429, move_out: 529 },

  // 5BR
  '5-3': { standard: 299, deep: 499, move_out: 599 },
};

/**
 * Get base price from matrix
 * Handles interpolation for bathroom counts between rows
 */
function getBasePrice(bedrooms: number, bathrooms: number, cleanType: 'standard' | 'deep' | 'move_out'): number {
  // Normalize bathrooms to nearest supported value
  const normalizedBathrooms = Math.round(bathrooms);

  // Try exact match first
  const exactKey = `${bedrooms}-${normalizedBathrooms}`;
  if (BASE_PRICE_MATRIX[exactKey]) {
    return BASE_PRICE_MATRIX[exactKey][cleanType];
  }

  // For bathrooms between table rows, round up to next row
  const roundedUpBathrooms = Math.ceil(bathrooms);
  const roundedKey = `${bedrooms}-${roundedUpBathrooms}`;
  if (BASE_PRICE_MATRIX[roundedKey]) {
    return BASE_PRICE_MATRIX[roundedKey][cleanType];
  }

  // Find closest match by bedroom count
  const bedroomKeys = Object.keys(BASE_PRICE_MATRIX)
    .filter(key => key.startsWith(`${bedrooms}-`))
    .sort((a, b) => {
      const bA = parseFloat(a.split('-')[1]);
      const bB = parseFloat(b.split('-')[1]);
      return Math.abs(bA - bathrooms) - Math.abs(bB - bathrooms);
    });

  if (bedroomKeys.length > 0) {
    return BASE_PRICE_MATRIX[bedroomKeys[0]][cleanType];
  }

  // Fallback to base price
  return BASE_PRICE_MATRIX['0-1'][cleanType];
}

/**
 * Calculate PolishUp price
 */
export function calculatePolishUpPrice(input: PolishUpPricingInput): PolishUpQuote {
  // Step 1: Get base price from matrix
  const basePrice = getBasePrice(input.bedrooms, input.bathrooms, input.cleanType);

  const modifiersApplied: PolishUpQuote['modifiersApplied'] = [];
  let currentPrice = basePrice;

  // Step 2: Apply multiplicative modifiers (stack)

  // Story multiplier
  if (input.stories === 2) {
    const multiplier = 1.15;
    modifiersApplied.push({
      name: 'Two-story',
      type: 'multiplicative',
      value: multiplier,
    });
    currentPrice *= multiplier;
  } else if (input.stories === 3) {
    const multiplier = 1.25;
    modifiersApplied.push({
      name: 'Three-story',
      type: 'multiplicative',
      value: multiplier,
    });
    currentPrice *= multiplier;
  }

  // Square footage multiplier
  if (input.sqft && input.sqft >= 3000) {
    const multiplier = 1.10;
    modifiersApplied.push({
      name: '3,000+ sqft',
      type: 'multiplicative',
      value: multiplier,
    });
    currentPrice *= multiplier;
  }

  // Last cleaned multiplier
  if (input.lastCleaned === '6_plus_months' || input.lastCleaned === 'never') {
    const multiplier = 1.20;
    modifiersApplied.push({
      name: 'Not cleaned in 6+ months',
      type: 'multiplicative',
      value: multiplier,
    });
    currentPrice *= multiplier;
  }

  // Step 3: Apply additive modifiers

  // Pets
  if (input.hasPets) {
    const addon = 25;
    modifiersApplied.push({
      name: 'Pets',
      type: 'additive',
      value: addon,
    });
    currentPrice += addon;
  }

  // Same-day booking
  if (input.sameDayBooking) {
    const addon = 30;
    modifiersApplied.push({
      name: 'Same-day booking',
      type: 'additive',
      value: addon,
    });
    currentPrice += addon;
  }

  // Step 4: Round to nearest dollar
  const finalPrice = Math.round(currentPrice);

  // Step 5: Estimate pros needed
  const estimatedProsNeeded = estimateProsNeeded(input);

  // Step 6: Estimate duration
  const estimatedDurationHours = estimateDuration(input, estimatedProsNeeded);

  // Step 7: Build breakdown string
  const breakdown = buildBreakdown(input, basePrice, modifiersApplied, finalPrice);

  return {
    basePrice,
    modifiersApplied,
    finalPrice,
    estimatedDurationHours,
    estimatedProsNeeded,
    breakdown,
  };
}

/**
 * Estimate number of Pros needed
 */
function estimateProsNeeded(input: PolishUpPricingInput): number {
  // Standard clean: always 1 Pro
  if (input.cleanType === 'standard') {
    return 1;
  }

  // Deep clean
  if (input.cleanType === 'deep') {
    if (input.bedrooms <= 2) {
      return 1;
    }
    return 2; // 3+ bedrooms
  }

  // Move-out clean
  if (input.cleanType === 'move_out') {
    if (input.bedrooms <= 2) {
      return 2; // 1-2 BR: 2 Pros
    }
    return 3; // 3+ BR: 3 Pros
  }

  return 1;
}

/**
 * Estimate duration in hours
 */
function estimateDuration(input: PolishUpPricingInput, prosNeeded: number): number {
  let baseHours = 2;

  // Base hours by clean type
  if (input.cleanType === 'standard') {
    baseHours = 2 + (input.bedrooms * 0.5);
  } else if (input.cleanType === 'deep') {
    baseHours = 3 + (input.bedrooms * 0.75);
  } else if (input.cleanType === 'move_out') {
    baseHours = 4 + (input.bedrooms * 1);
  }

  // Adjust for multiple Pros (parallel work)
  if (prosNeeded > 1) {
    baseHours = baseHours / (prosNeeded * 0.75); // 75% efficiency with multiple Pros
  }

  // Story multiplier
  if (input.stories === 2) {
    baseHours *= 1.1;
  } else if (input.stories === 3) {
    baseHours *= 1.2;
  }

  // Round to nearest 0.5 hour
  return Math.round(baseHours * 2) / 2;
}

/**
 * Build human-readable breakdown
 */
function buildBreakdown(
  input: PolishUpPricingInput,
  basePrice: number,
  modifiers: PolishUpQuote['modifiersApplied'],
  finalPrice: number
): string {
  const cleanTypeLabel = {
    standard: 'Standard Clean',
    deep: 'Deep Clean',
    move_out: 'Move-Out Clean',
  }[input.cleanType];

  const bedroomLabel = input.bedrooms === 0 ? 'Studio' : `${input.bedrooms}BR`;
  const bathroomLabel = `${input.bathrooms}BA`;

  let breakdown = `PolishUp™ ${cleanTypeLabel} - ${bedroomLabel}/${bathroomLabel}`;

  if (input.stories > 1) {
    breakdown += `, ${input.stories}-story`;
  }

  if (modifiers.length > 0) {
    const modifiersList = modifiers.map(m => {
      if (m.type === 'multiplicative') {
        return `${m.name} (×${m.value.toFixed(2)})`;
      } else {
        return `${m.name} (+$${m.value})`;
      }
    }).join(', ');
    breakdown += ` with ${modifiersList}`;
  }

  return breakdown;
}

/**
 * Helper to get display label for clean type
 */
export function getCleanTypeLabel(cleanType: 'standard' | 'deep' | 'move_out'): string {
  return {
    standard: 'Standard Clean',
    deep: 'Deep Clean',
    move_out: 'Move-Out Clean',
  }[cleanType];
}

/**
 * Helper to get clean type description
 */
export function getCleanTypeDescription(cleanType: 'standard' | 'deep' | 'move_out'): string {
  return {
    standard: 'Regular maintenance cleaning - dusting, vacuuming, bathrooms, kitchen',
    deep: 'Thorough top-to-bottom cleaning including baseboards, inside appliances, detailed scrubbing',
    move_out: 'Complete deep clean for move-in/move-out - everything spotless for next tenant',
  }[cleanType];
}
