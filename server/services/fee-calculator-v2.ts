/**
 * Fee Calculator V2 - New Pro-Set Pricing Model
 * 
 * Customer service fee: 5% (added on top of pro's price)
 * Pro platform fee: 15% (deducted from pro's price)
 * Minimum pro payout floor: $50/job
 * 
 * Example: Pro charges $150
 *   Customer pays $157.50 ($150 + $7.50 service fee)
 *   Pro keeps $127.50 ($150 - $22.50 platform fee)
 *   UpTend takes $30.00 ($7.50 + $22.50)
 */

export const CUSTOMER_SERVICE_FEE_PERCENT = 5;
export const PRO_PLATFORM_FEE_PERCENT = 15;
export const MIN_PRO_PAYOUT = 50;

export interface FeeBreakdown {
  proPrice: number;         // What the pro set as their rate
  serviceFee: number;       // 5% customer service fee
  customerTotal: number;    // What customer pays (proPrice + serviceFee)
  platformFee: number;      // 15% deducted from pro's price
  proPayout: number;        // What pro actually receives
  platformRevenue: number;  // Total UpTend revenue (serviceFee + platformFee)
}

export function calculateFees(proPrice: number): FeeBreakdown {
  const serviceFee = Math.round(proPrice * (CUSTOMER_SERVICE_FEE_PERCENT / 100) * 100) / 100;
  const customerTotal = Math.round((proPrice + serviceFee) * 100) / 100;
  const platformFee = Math.round(proPrice * (PRO_PLATFORM_FEE_PERCENT / 100) * 100) / 100;
  let proPayout = Math.round((proPrice - platformFee) * 100) / 100;

  // Enforce minimum payout floor
  if (proPayout < MIN_PRO_PAYOUT) {
    proPayout = MIN_PRO_PAYOUT;
  }

  const platformRevenue = Math.round((serviceFee + platformFee) * 100) / 100;

  return {
    proPrice,
    serviceFee,
    customerTotal,
    platformFee,
    proPayout,
    platformRevenue,
  };
}
