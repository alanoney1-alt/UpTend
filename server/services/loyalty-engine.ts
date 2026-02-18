/**
 * Loyalty Engine — Tier management, rewards, milestones, discounts
 */
import { pool } from "../db.js";

const TIER_THRESHOLDS = {
  bronze:   { min: 0,    discount: 0,  next: 500 },
  silver:   { min: 500,  discount: 2,  next: 2000 },
  gold:     { min: 2000, discount: 5,  next: 5000 },
  platinum: { min: 5000, discount: 10, next: null },
} as const;

const TIER_BENEFITS: Record<string, string[]> = {
  bronze:   ["base_tier"],
  silver:   ["priority_scheduling", "2_percent_discount"],
  gold:     ["5_percent_discount", "dedicated_pro_team", "free_annual_home_scan"],
  platinum: ["10_percent_discount", "free_annual_home_scan", "priority_emergency_dispatch", "dedicated_account_manager", "early_access_new_services"],
};

const MILESTONE_REWARDS: Record<string, { type: string; value: number; description: string }> = {
  first_booking:  { type: "discount", value: 5, description: "5% off your next booking — welcome!" },
  fifth_booking:  { type: "discount", value: 10, description: "10% off for being a loyal customer" },
  tenth_booking:  { type: "free_scan", value: 0, description: "Free home scan — on us!" },
  first_referral: { type: "discount", value: 10, description: "10% off for your first referral" },
  full_scan:      { type: "discount", value: 15, description: "15% off next service after full home scan" },
  one_year_member:{ type: "free_service", value: 50, description: "$50 credit for 1 year of membership" },
  spent_500:      { type: "discount", value: 5, description: "5% off — Silver tier unlocked!" },
  spent_2000:     { type: "free_scan", value: 0, description: "Free annual home scan — Gold tier!" },
  spent_5000:     { type: "discount", value: 15, description: "15% off next service — Platinum tier!" },
};

function determineTier(lifetimeSpend: number): string {
  if (lifetimeSpend >= 5000) return "platinum";
  if (lifetimeSpend >= 2000) return "gold";
  if (lifetimeSpend >= 500) return "silver";
  return "bronze";
}

export async function getCustomerLoyalty(customerId: string) {
  // Ensure loyalty tier record exists
  await pool.query(
    `INSERT INTO loyalty_tiers (customer_id) VALUES ($1) ON CONFLICT (customer_id) DO NOTHING`,
    [customerId]
  );

  const { rows } = await pool.query(
    `SELECT * FROM loyalty_tiers WHERE customer_id = $1`,
    [customerId]
  );
  const tier = rows[0];
  const currentTier = tier.current_tier as keyof typeof TIER_THRESHOLDS;
  const config = TIER_THRESHOLDS[currentTier];

  return {
    customerId,
    currentTier: tier.current_tier,
    lifetimeSpend: parseFloat(tier.lifetime_spend),
    totalBookings: tier.total_bookings,
    benefits: TIER_BENEFITS[tier.current_tier] || [],
    discountPercent: config.discount,
    nextTierThreshold: config.next,
    progressToNextTier: config.next
      ? Math.min(100, Math.round((parseFloat(tier.lifetime_spend) / config.next) * 100))
      : 100,
    tierUpdatedAt: tier.tier_updated_at,
  };
}

export async function checkAndUpgradeTier(customerId: string) {
  const { rows } = await pool.query(
    `SELECT * FROM loyalty_tiers WHERE customer_id = $1`,
    [customerId]
  );
  if (!rows.length) return null;

  const tier = rows[0];
  const newTier = determineTier(parseFloat(tier.lifetime_spend));

  if (newTier !== tier.current_tier) {
    const config = TIER_THRESHOLDS[newTier as keyof typeof TIER_THRESHOLDS];
    await pool.query(
      `UPDATE loyalty_tiers SET current_tier = $1, benefits = $2, next_tier_threshold = $3, tier_updated_at = NOW() WHERE customer_id = $4`,
      [newTier, JSON.stringify(TIER_BENEFITS[newTier]), config.next, customerId]
    );
    return { upgraded: true, oldTier: tier.current_tier, newTier, benefits: TIER_BENEFITS[newTier] };
  }
  return { upgraded: false, currentTier: tier.current_tier };
}

export async function grantMilestoneReward(customerId: string, milestoneType: string) {
  // Check if already achieved
  const { rows: existing } = await pool.query(
    `SELECT id FROM loyalty_milestones WHERE customer_id = $1 AND milestone_type = $2`,
    [customerId, milestoneType]
  );
  if (existing.length) return { alreadyAchieved: true };

  const rewardDef = MILESTONE_REWARDS[milestoneType];
  if (!rewardDef) return { error: "Unknown milestone type" };

  // Create reward
  const { rows: reward } = await pool.query(
    `INSERT INTO customer_earned_rewards (customer_id, reward_type, reward_value, description, expires_at)
     VALUES ($1, $2, $3, $4, NOW() + INTERVAL '90 days') RETURNING id`,
    [customerId, rewardDef.type, rewardDef.value, rewardDef.description]
  );

  // Record milestone
  await pool.query(
    `INSERT INTO loyalty_milestones (customer_id, milestone_type, reward_granted, reward_id)
     VALUES ($1, $2, true, $3)`,
    [customerId, milestoneType, reward[0].id]
  );

  return { granted: true, milestoneType, reward: rewardDef };
}

export async function getAvailableRewards(customerId: string) {
  const { rows } = await pool.query(
    `SELECT * FROM customer_earned_rewards WHERE customer_id = $1 AND redeemed = false AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY earned_at DESC`,
    [customerId]
  );
  return rows;
}

export async function redeemReward(rewardId: string) {
  const { rows } = await pool.query(
    `UPDATE customer_earned_rewards SET redeemed = true, redeemed_at = NOW() WHERE id = $1 AND redeemed = false RETURNING *`,
    [rewardId]
  );
  if (!rows.length) return { error: "Reward not found or already redeemed" };
  return { redeemed: true, reward: rows[0] };
}

export async function calculateDiscount(customerId: string, _serviceType: string, basePrice: number) {
  const loyalty = await getCustomerLoyalty(customerId);
  const discountPercent = loyalty.discountPercent;
  const discountAmount = (basePrice * discountPercent) / 100;
  return {
    basePrice,
    discountPercent,
    discountAmount,
    finalPrice: basePrice - discountAmount,
    tier: loyalty.currentTier,
  };
}
