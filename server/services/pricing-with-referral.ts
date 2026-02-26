/**
 * Pricing logic that handles referral credits correctly
 *
 * Key Rule: When a customer uses a referral credit, the Pro still gets paid their full normal rate.
 * The discount comes out of UpTend's platform fee, NOT the Pro's payout.
 *
 * Example:
 * - Job price: $300
 * - Pro payout rate: 85% = $255 (flat 15% platform fee)
 * - Customer pays: $300 + 5% service fee = $315
 *
 * With $25 referral credit:
 * - Customer pays: $290 ($315 - $25)
 * - Pro gets: $255 (UNCHANGED - always 85% of job price)
 * - Platform gets: $35 ($290 - $255)
 */

export interface PricingCalculation {
  jobPrice: number; // Original job price
  customerPays: number; // What customer actually pays (after credit)
  proPayout: number; // What Pro receives (85% of original price)
  platformFee: number; // What UpTend keeps (reduced by referral)
  referralCreditApplied: number; // Amount of credit used
  proPayoutPercentage: number; // Pro's payout rate (typically 0.85)
}

/**
 * Calculate pricing with referral credit properly
 */
export function calculatePricingWithReferral(
  jobPrice: number,
  referralCredit: number,
  proPayoutPercentage: number = 0.85 // Default: Pro gets 85%
): PricingCalculation {
  // Pro payout is ALWAYS based on the original job price, not discounted price
  const proPayout = Math.round(jobPrice * proPayoutPercentage);

  // Customer pays the discounted amount
  const customerPays = Math.max(0, jobPrice - referralCredit);

  // Platform fee is whatever's left after Pro gets paid
  // This means the referral credit comes out of our fee
  const platformFee = Math.max(0, customerPays - proPayout);

  return {
    jobPrice,
    customerPays,
    proPayout,
    platformFee,
    referralCreditApplied: referralCredit,
    proPayoutPercentage,
  };
}

/**
 * Verify pricing calculation is correct
 */
export function verifyPricingCalculation(calc: PricingCalculation): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Customer pays + platform fee should equal job price (before credit)
  const expectedTotal = calc.proPayout + calc.platformFee + calc.referralCreditApplied;
  if (Math.abs(expectedTotal - calc.jobPrice) > 0.01) {
    errors.push(
      `Math doesn't add up: Pro ($${calc.proPayout}) + Platform ($${calc.platformFee}) + Credit ($${calc.referralCreditApplied}) ` +
      `= $${expectedTotal}, but job price is $${calc.jobPrice}`
    );
  }

  // Customer pays should equal job price minus credit
  if (Math.abs((calc.jobPrice - calc.referralCreditApplied) - calc.customerPays) > 0.01) {
    errors.push(
      `Customer pays $${calc.customerPays} but should pay $${calc.jobPrice - calc.referralCreditApplied}`
    );
  }

  // Pro payout should be exactly X% of original job price
  const expectedProPayout = Math.round(calc.jobPrice * calc.proPayoutPercentage);
  if (calc.proPayout !== expectedProPayout) {
    errors.push(
      `Pro payout is $${calc.proPayout} but should be $${expectedProPayout} ` +
      `(${calc.proPayoutPercentage * 100}% of $${calc.jobPrice})`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Example usage and tests
export const EXAMPLE_CALCULATIONS = {
  // Example 1: $300 job with $25 credit
  example1: calculatePricingWithReferral(300, 25, 0.85),
  // Expected: Customer pays $275, Pro gets $240, Platform gets $35

  // Example 2: $100 job with $25 credit
  example2: calculatePricingWithReferral(100, 25, 0.85),
  // Expected: Customer pays $75, Pro gets $80, Platform gets -$5 (we eat the loss)

  // Example 3: $50 job with $25 credit
  example3: calculatePricingWithReferral(50, 25, 0.85),
  // Expected: Customer pays $25, Pro gets $40, Platform gets -$15 (we eat the loss)
};

// Log examples for verification
if (process.env.NODE_ENV === "development") {
  console.log("Referral Pricing Examples:");
  Object.entries(EXAMPLE_CALCULATIONS).forEach(([name, calc]) => {
    console.log(`\n${name}:`);
    console.log(`  Job Price: $${calc.jobPrice}`);
    console.log(`  Customer Pays: $${calc.customerPays}`);
    console.log(`  Pro Gets: $${calc.proPayout} (${calc.proPayoutPercentage * 100}%)`);
    console.log(`  Platform Gets: $${calc.platformFee}`);
    console.log(`  Credit Used: $${calc.referralCreditApplied}`);

    const verification = verifyPricingCalculation(calc);
    if (!verification.valid) {
      console.error("  ❌ ERRORS:", verification.errors);
    } else {
      console.log("  ✓ Math checks out");
    }
  });
}
