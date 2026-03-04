/**
 * Tier Gates Service
 * 
 * Manages feature access based on partner subscription tiers.
 * Features are gated behind starter/growth/scale tiers.
 */

import { pool } from "../db";

export type Tier = 'starter' | 'growth' | 'scale';

export type Feature = 
  // Starter tier features
  | 'basic_scheduling' 
  | 'job_status' 
  | 'booking_notifications' 
  | 'george_intake'
  | 'seo_4_pages' 
  | 'landing_page_1'
  // Growth tier features  
  | 'live_dispatch_board' 
  | 'pro_gps_tracking' 
  | 'customer_eta_notifications' 
  | 'pro_mobile_view'
  | 'lead_scoring' 
  | 'seo_12_pages' 
  | 'landing_pages_3' 
  | 'monthly_reports'
  | 'george_voice'
  // Scale tier features
  | 'uber_tracking' 
  | 'pro_mobile_full' 
  | 'auto_dispatch' 
  | 'reviews_ratings'
  | 'analytics_dashboard' 
  | 'unlimited_seo' 
  | 'white_label' 
  | 'api_access';

const TIER_FEATURES: Record<Tier, Feature[]> = {
  starter: [
    'basic_scheduling', 
    'job_status', 
    'booking_notifications', 
    'george_intake',
    'seo_4_pages', 
    'landing_page_1'
  ],
  growth: [
    // All starter features plus:
    'basic_scheduling', 
    'job_status', 
    'booking_notifications', 
    'george_intake',
    'seo_4_pages', 
    'landing_page_1',
    // Growth features:
    'live_dispatch_board', 
    'pro_gps_tracking', 
    'customer_eta_notifications', 
    'pro_mobile_view',
    'lead_scoring', 
    'seo_12_pages', 
    'landing_pages_3', 
    'monthly_reports',
    'george_voice'
  ],
  scale: [
    // All growth features plus:
    'basic_scheduling', 
    'job_status', 
    'booking_notifications', 
    'george_intake',
    'seo_4_pages', 
    'landing_page_1',
    'live_dispatch_board', 
    'pro_gps_tracking', 
    'customer_eta_notifications', 
    'pro_mobile_view',
    'lead_scoring', 
    'seo_12_pages', 
    'landing_pages_3', 
    'monthly_reports',
    'george_voice',
    // Scale features:
    'uber_tracking', 
    'pro_mobile_full', 
    'auto_dispatch', 
    'reviews_ratings',
    'analytics_dashboard', 
    'unlimited_seo', 
    'white_label', 
    'api_access'
  ]
};

/**
 * Get a partner's current tier
 */
export async function getPartnerTier(partnerSlug: string): Promise<Tier> {
  try {
    const result = await pool.query(
      `SELECT tier FROM partner_subscription_tiers WHERE partner_slug = $1`,
      [partnerSlug]
    );

    if (result.rows.length === 0) {
      // Create default tier for new partners
      await pool.query(
        `INSERT INTO partner_subscription_tiers (partner_slug, tier) VALUES ($1, 'starter')`,
        [partnerSlug]
      );
      return 'starter';
    }

    return result.rows[0].tier as Tier;
  } catch (error) {
    console.error('Error getting partner tier:', error);
    return 'starter'; // Safe fallback
  }
}

/**
 * Check if a partner can access a specific feature
 */
export async function canAccessFeature(partnerSlug: string, feature: Feature): Promise<boolean> {
  const tier = await getPartnerTier(partnerSlug);
  return tierIncludesFeature(tier, feature);
}

/**
 * Check if a tier includes a specific feature (synchronous)
 */
export function tierIncludesFeature(tier: Tier, feature: Feature): boolean {
  return TIER_FEATURES[tier].includes(feature);
}

/**
 * Get all features available for a tier
 */
export function getTierFeatures(tier: Tier): Feature[] {
  return [...TIER_FEATURES[tier]];
}

/**
 * Upgrade a partner's tier
 */
export async function upgradePartnerTier(partnerSlug: string, newTier: Tier): Promise<void> {
  await pool.query(
    `INSERT INTO partner_subscription_tiers (partner_slug, tier, updated_at) 
     VALUES ($1, $2, NOW())
     ON CONFLICT (partner_slug) 
     DO UPDATE SET tier = $2, updated_at = NOW()`,
    [partnerSlug, newTier]
  );
}

/**
 * Get tier pricing information
 */
export function getTierPricing(tier: Tier): { monthlyPrice: number; setupFee: number } {
  switch (tier) {
    case 'starter':
      return { monthlyPrice: 499, setupFee: 1500 };
    case 'growth':
      return { monthlyPrice: 999, setupFee: 2500 };
    case 'scale':
      return { monthlyPrice: 1999, setupFee: 5000 };
  }
}

/**
 * Get all partners and their tiers (admin use)
 */
export async function getAllPartnerTiers(): Promise<{ partner_slug: string; tier: Tier; activated_at: Date }[]> {
  const result = await pool.query(
    `SELECT partner_slug, tier, activated_at FROM partner_subscription_tiers ORDER BY activated_at DESC`
  );
  return result.rows;
}

/**
 * Middleware function to check feature access in routes
 */
export function requireFeature(feature: Feature) {
  return async (req: any, res: any, next: any) => {
    const partnerSlug = req.params.slug;
    if (!partnerSlug) {
      return res.status(400).json({ error: 'Partner slug required' });
    }

    const hasAccess = await canAccessFeature(partnerSlug, feature);
    if (!hasAccess) {
      const tier = await getPartnerTier(partnerSlug);
      return res.status(403).json({ 
        error: 'Feature not available in your plan',
        currentTier: tier,
        requiredFeature: feature,
        upgradeRequired: true
      });
    }

    next();
  };
}

/**
 * Get feature comparison for upgrade prompts
 */
export function getFeatureComparison(): Record<Tier, Feature[]> {
  return TIER_FEATURES;
}