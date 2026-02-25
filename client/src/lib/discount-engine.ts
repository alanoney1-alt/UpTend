/**
 * Multi-Service Discount Engine
 *
 * Handles all discount calculations with proper stacking rules:
 * 1. Home DNA Scan $25 credit (applied BEFORE percentage discounts)
 * 2. Multi-service cart discounts (3+ services: 10%, 5+ services: 15%)
 * 3. Property Manager volume pricing tiers
 * 4. First-time customer discount
 * 5. Promotional codes
 *
 * DISCOUNT STACKING RULES:
 * - Home DNA Scan credit: Applied to subtotal BEFORE percentages
 * - Multi-service discount: Applies to post-credit subtotal
 * - PM tier discount: Replaces multi-service if higher
 * - First-time discount: Cannot stack with multi-service/PM
 * - Promo codes: Stack with all except when explicitly excluded
 */

export interface CartService {
  serviceType: string;
  serviceBranded: string;
  price: number;
  isDwellScan?: boolean;
}

export interface DiscountContext {
  services: CartService[];
  customerId: string;
  isFirstTimeCustomer: boolean;
  isPropertyManager: boolean;
  pmTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  hasDwellScanCredit: boolean;
  dwellScanCreditAmount: number;
  promoCode?: string;
  rollingBookingHistory?: {
    last30Days: number; // Number of bookings in last 30 days
    lifetimeTotal: number; // Total bookings ever
  };
}

export interface DiscountBreakdown {
  subtotal: number;
  discountsApplied: Array<{
    name: string;
    type: 'credit' | 'percentage' | 'fixed';
    amount: number;
    description: string;
  }>;
  totalDiscount: number;
  finalTotal: number;
  savingsMessage: string;
}

/**
 * Calculate all applicable discounts
 */
export function calculateDiscounts(context: DiscountContext): DiscountBreakdown {
  const subtotal = context.services.reduce((sum, service) => sum + service.price, 0);
  const discountsApplied: DiscountBreakdown['discountsApplied'] = [];

  let runningTotal = subtotal;

  // STEP 1: Apply Home DNA Scan $25 credit (if available)
  // This is applied BEFORE percentage discounts
  if (context.hasDwellScanCredit && context.dwellScanCreditAmount > 0) {
    const creditAmount = Math.min(context.dwellScanCreditAmount, runningTotal);

    discountsApplied.push({
      name: 'Home DNA Scan Credit',
      type: 'credit',
      amount: creditAmount,
      description: `$${creditAmount} credit from your Home DNA Scan`,
    });

    runningTotal -= creditAmount;
  }

  // STEP 2: Determine which percentage discount applies
  // Priority: PM tier > Multi-service > First-time
  let percentageDiscount = 0;
  let percentageDiscountName = '';
  let percentageDiscountDescription = '';

  // Option A: Property Manager Tier Discount
  if (context.isPropertyManager && context.pmTier) {
    const pmDiscounts = {
      bronze: 0.025,  // 2.5% - 10-24 properties
      silver: 0.05,   // 5% - 25-49 properties
      gold: 0.075,    // 7.5% - 50+ properties
      platinum: 0.10, // 10% - reserved for annual contracts
    };

    percentageDiscount = pmDiscounts[context.pmTier];
    percentageDiscountName = `Property Manager ${context.pmTier.charAt(0).toUpperCase() + context.pmTier.slice(1)}`;
    percentageDiscountDescription = `${Math.round(percentageDiscount * 100)}% off for ${context.pmTier} tier`;
  }

  // Option B: Multi-Service Cart Discount
  else if (context.services.length >= 3) {
    if (context.services.length >= 5) {
      percentageDiscount = 0.15;
      percentageDiscountName = 'Multi-Service Bundle';
      percentageDiscountDescription = '15% off for booking 5+ services';
    } else {
      percentageDiscount = 0.10;
      percentageDiscountName = 'Multi-Service Bundle';
      percentageDiscountDescription = '10% off for booking 3+ services';
    }
  }

  // Option C: First-Time Customer Discount (only if no other percentage discount)
  else if (context.isFirstTimeCustomer && percentageDiscount === 0) {
    percentageDiscount = 0.10;
    percentageDiscountName = 'First-Time Customer';
    percentageDiscountDescription = '10% off your first booking';
  }

  // Apply the chosen percentage discount
  if (percentageDiscount > 0) {
    const discountAmount = Math.round(runningTotal * percentageDiscount);

    discountsApplied.push({
      name: percentageDiscountName,
      type: 'percentage',
      amount: discountAmount,
      description: percentageDiscountDescription,
    });

    runningTotal -= discountAmount;
  }

  // STEP 3: Apply promotional code (if valid)
  if (context.promoCode) {
    const promoDiscount = validateAndApplyPromoCode(
      context.promoCode,
      runningTotal,
      context.services,
      context.customerId
    );

    if (promoDiscount) {
      discountsApplied.push({
        name: `Promo: ${context.promoCode}`,
        type: promoDiscount.type,
        amount: promoDiscount.amount,
        description: promoDiscount.description,
      });

      runningTotal -= promoDiscount.amount;
    }
  }

  // Calculate total savings
  const totalDiscount = subtotal - runningTotal;

  // Generate savings message
  const savingsMessage = generateSavingsMessage(discountsApplied, totalDiscount);

  return {
    subtotal,
    discountsApplied,
    totalDiscount,
    finalTotal: Math.max(runningTotal, 0), // Never negative
    savingsMessage,
  };
}

/**
 * Validate and apply promotional code
 */
function validateAndApplyPromoCode(
  code: string,
  currentTotal: number,
  services: CartService[],
  customerId: string
): { type: 'percentage' | 'fixed'; amount: number; description: string } | null {
  // This would typically check against a database of promo codes
  // For now, hardcoded examples:

  const promoCodes: Record<string, any> = {
    'SPRING25': {
      type: 'percentage',
      value: 0.25,
      description: '25% off Spring cleaning special',
      minPurchase: 150,
      validUntil: '2026-04-30',
    },
    'WELCOME50': {
      type: 'fixed',
      value: 50,
      description: '$50 off first-time customers',
      firstTimeOnly: true,
    },
    'BUNDLE20': {
      type: 'percentage',
      value: 0.20,
      description: '20% off when booking 2+ services',
      minServices: 2,
    },
  };

  const promo = promoCodes[code.toUpperCase()];
  if (!promo) return null;

  // Validate conditions
  if (promo.minPurchase && currentTotal < promo.minPurchase) {
    return null; // Doesn't meet minimum
  }

  if (promo.minServices && services.length < promo.minServices) {
    return null; // Doesn't have enough services
  }

  // Calculate discount amount
  let amount = 0;
  if (promo.type === 'percentage') {
    amount = Math.round(currentTotal * promo.value);
  } else {
    amount = Math.min(promo.value, currentTotal); // Don't exceed total
  }

  return {
    type: promo.type,
    amount,
    description: promo.description,
  };
}

/**
 * Generate user-friendly savings message
 */
function generateSavingsMessage(
  discounts: DiscountBreakdown['discountsApplied'],
  totalSavings: number
): string {
  if (discounts.length === 0) {
    return '';
  }

  if (discounts.length === 1) {
    return `You saved $${totalSavings} with ${discounts[0].name}!`;
  }

  const discountNames = discounts.map(d => d.name).join(', ');
  return `You saved $${totalSavings} with ${discountNames}!`;
}

/**
 * Calculate Property Manager tier based on property count
 */
export function calculatePMTier(propertyCount: number): 'bronze' | 'silver' | 'gold' | 'platinum' | null {
  if (propertyCount >= 50) return 'platinum'; // 25% off
  if (propertyCount >= 50) return 'gold';     // 7.5% off
  if (propertyCount >= 25) return 'silver';   // 5% off
  if (propertyCount >= 10) return 'bronze';   // 2.5% off
  return null;
}

/**
 * Check if customer has active Home DNA Scan credit
 */
export async function checkDwellScanCredit(customerId: string): Promise<{
  hasCredit: boolean;
  creditAmount: number;
  expiresAt: Date | null;
}> {
  // This would query the database for Home DNA Scan credits
  // For now, return a mock response

  // Query: SELECT * FROM dwellscan_credits WHERE customer_id = ? AND used = false AND expires_at > NOW()

  return {
    hasCredit: false,
    creditAmount: 0,
    expiresAt: null,
  };
}

/**
 * Apply Home DNA Scan credit to a booking
 */
export async function applyDwellScanCredit(
  customerId: string,
  bookingId: string,
  amountUsed: number
): Promise<void> {
  // This would mark the credit as used in the database
  // UPDATE dwellscan_credits SET used = true, used_on_booking_id = ?, used_at = NOW() WHERE customer_id = ?
}

/**
 * Show available discounts to customer (preview)
 */
export function getAvailableDiscounts(context: {
  serviceCount: number;
  isFirstTime: boolean;
  isPropertyManager: boolean;
  pmTier?: string;
  hasDwellScanCredit: boolean;
}): Array<{
  name: string;
  discount: string;
  description: string;
  isActive: boolean;
}> {
  const discounts = [];

  // Home DNA Scan Credit
  if (context.hasDwellScanCredit) {
    discounts.push({
      name: 'Home DNA Scan Credit',
      discount: '$49',
      description: 'Credit from your home scan',
      isActive: true,
    });
  }

  // Multi-Service Discounts
  if (context.serviceCount >= 5) {
    discounts.push({
      name: 'Multi-Service Bundle',
      discount: '15% OFF',
      description: 'For booking 5+ services',
      isActive: true,
    });
  } else if (context.serviceCount >= 3) {
    discounts.push({
      name: 'Multi-Service Bundle',
      discount: '10% OFF',
      description: 'For booking 3+ services',
      isActive: true,
    });
  } else if (context.serviceCount === 2) {
    discounts.push({
      name: 'Multi-Service Bundle',
      discount: '10% OFF',
      description: 'Add 1 more service to unlock',
      isActive: false,
    });
  }

  // Property Manager Tier
  if (context.isPropertyManager && context.pmTier) {
    const tierDiscounts: Record<string, string> = {
      bronze: '10%',
      silver: '15%',
      gold: '20%',
      platinum: '25%',
    };

    discounts.push({
      name: `Property Manager ${context.pmTier.charAt(0).toUpperCase() + context.pmTier.slice(1)}`,
      discount: `${tierDiscounts[context.pmTier]} OFF`,
      description: 'Volume pricing for PMs',
      isActive: true,
    });
  }

  // First-Time Customer
  if (context.isFirstTime && !context.isPropertyManager && context.serviceCount < 3) {
    discounts.push({
      name: 'First-Time Customer',
      discount: '10% OFF',
      description: 'Welcome to UpTend!',
      isActive: true,
    });
  }

  return discounts;
}

/**
 * Upsell suggestions based on current cart
 */
export function getUpsellSuggestions(context: {
  services: CartService[];
  currentTotal: number;
}): Array<{
  suggestion: string;
  savings: number;
  description: string;
}> {
  const suggestions = [];

  // Upsell to unlock multi-service discount
  if (context.services.length === 2) {
    const potentialSavings = Math.round(context.currentTotal * 0.10);
    suggestions.push({
      suggestion: 'Add 1 more service',
      savings: potentialSavings,
      description: `Unlock 10% off and save $${potentialSavings}!`,
    });
  }

  if (context.services.length === 4) {
    const currentDiscount = Math.round(context.currentTotal * 0.10);
    const betterDiscount = Math.round(context.currentTotal * 0.15);
    const additionalSavings = betterDiscount - currentDiscount;

    suggestions.push({
      suggestion: 'Add 1 more service',
      savings: additionalSavings,
      description: `Upgrade to 15% off and save an extra $${additionalSavings}!`,
    });
  }

  // Suggest Home DNA Scan if not in cart
  const hasDwellScan = context.services.some(s => s.isDwellScan);
  if (!hasDwellScan && context.services.length >= 1) {
    suggestions.push({
      suggestion: 'Add Home DNA Scan',
      savings: 25,
      description: 'Free scan with $25 credit toward your next booking',
    });
  }

  return suggestions;
}
