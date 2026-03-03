/**
 * Partner Onboarding Service
 * 
 * Stores everything George collects during partner intake:
 * - Business info (name, address, phone, email, services)
 * - Social media accounts (Facebook, Instagram, Google, Yelp, Nextdoor, etc.)
 * - Current website and SEO status
 * - Existing tools/platforms (CRM, scheduling, invoicing, etc.)
 * - Lead sources (where their leads currently come from)
 * - Social media package preferences
 * - Branding assets (logo, colors, tagline)
 * 
 * This data powers:
 * - Partner dashboard setup
 * - Social media automation configuration
 * - SEO page generation
 * - Competitive audit targeting
 * - George's partner context in conversations
 */

import { pool } from "../db";

async function ensureTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS partner_onboarding (
      id SERIAL PRIMARY KEY,
      partner_slug TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'in_progress',
      
      -- Business basics
      company_name TEXT,
      owner_name TEXT,
      owner_email TEXT,
      owner_phone TEXT,
      business_address TEXT,
      business_city TEXT,
      business_state TEXT,
      business_zip TEXT,
      service_area_miles INT DEFAULT 25,
      years_in_business INT,
      num_technicians INT,
      num_office_staff INT,
      annual_revenue TEXT,
      license_number TEXT,
      insurance_provider TEXT,
      
      -- Services offered
      services_offered JSONB DEFAULT '[]',
      primary_service TEXT,
      commercial_or_residential TEXT DEFAULT 'residential',
      
      -- Current digital presence
      website_url TEXT,
      website_provider TEXT,
      has_online_booking BOOLEAN DEFAULT FALSE,
      domain_owner TEXT,
      
      -- Social media accounts
      facebook_url TEXT,
      facebook_page_id TEXT,
      instagram_handle TEXT,
      instagram_connected BOOLEAN DEFAULT FALSE,
      google_business_profile_url TEXT,
      google_business_claimed BOOLEAN DEFAULT FALSE,
      yelp_url TEXT,
      nextdoor_url TEXT,
      tiktok_handle TEXT,
      youtube_url TEXT,
      linkedin_url TEXT,
      twitter_handle TEXT,
      other_social JSONB DEFAULT '{}',
      
      -- Current tools and platforms
      current_crm TEXT,
      current_scheduling_tool TEXT,
      current_invoicing_tool TEXT,
      current_accounting_tool TEXT,
      current_marketing_tool TEXT,
      current_phone_system TEXT,
      current_review_platform TEXT,
      other_tools JSONB DEFAULT '[]',
      monthly_software_spend NUMERIC,
      
      -- Lead sources
      lead_sources JSONB DEFAULT '[]',
      avg_monthly_leads INT,
      avg_ticket_size NUMERIC,
      current_close_rate NUMERIC,
      biggest_lead_source TEXT,
      
      -- Pain points
      pain_points JSONB DEFAULT '[]',
      
      -- Social media package
      wants_social_package BOOLEAN DEFAULT FALSE,
      social_content_preferences JSONB DEFAULT '{}',
      brand_voice_notes TEXT,
      
      -- Branding
      logo_url TEXT,
      brand_colors JSONB DEFAULT '[]',
      tagline TEXT,
      
      -- SEO info
      target_keywords JSONB DEFAULT '[]',
      target_neighborhoods JSONB DEFAULT '[]',
      competitors JSONB DEFAULT '[]',
      
      -- Onboarding progress
      steps_completed JSONB DEFAULT '[]',
      onboarded_by TEXT DEFAULT 'george',
      notes TEXT,
      
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

ensureTables().catch(console.error);

/** Save or update partner onboarding data */
export async function saveOnboardingData(partnerSlug: string, data: Record<string, any>) {
  try {
    // Build dynamic SET clause from provided fields
    const allowedFields = [
      'company_name', 'owner_name', 'owner_email', 'owner_phone',
      'business_address', 'business_city', 'business_state', 'business_zip',
      'service_area_miles', 'years_in_business', 'num_technicians', 'num_office_staff',
      'annual_revenue', 'license_number', 'insurance_provider',
      'services_offered', 'primary_service', 'commercial_or_residential',
      'website_url', 'website_provider', 'has_online_booking', 'domain_owner',
      'facebook_url', 'facebook_page_id', 'instagram_handle', 'instagram_connected',
      'google_business_profile_url', 'google_business_claimed',
      'yelp_url', 'nextdoor_url', 'tiktok_handle', 'youtube_url', 'linkedin_url', 'twitter_handle',
      'other_social',
      'current_crm', 'current_scheduling_tool', 'current_invoicing_tool',
      'current_accounting_tool', 'current_marketing_tool', 'current_phone_system',
      'current_review_platform', 'other_tools', 'monthly_software_spend',
      'lead_sources', 'avg_monthly_leads', 'avg_ticket_size', 'current_close_rate',
      'biggest_lead_source',
      'pain_points',
      'wants_social_package', 'social_content_preferences', 'brand_voice_notes',
      'logo_url', 'brand_colors', 'tagline',
      'target_keywords', 'target_neighborhoods', 'competitors',
      'steps_completed', 'notes', 'status'
    ];

    const updates: string[] = [];
    const values: any[] = [partnerSlug];
    let paramIdx = 2;

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key) && value !== undefined) {
        const dbValue = typeof value === 'object' && value !== null ? JSON.stringify(value) : value;
        updates.push(`${key} = $${paramIdx}`);
        values.push(dbValue);
        paramIdx++;
      }
    }

    if (updates.length === 0) return { success: false, message: "No valid fields to update" };

    updates.push(`updated_at = NOW()`);

    // Upsert
    const insertFields = updates.map(u => u.split(' = ')[0]);
    const result = await pool.query(
      `INSERT INTO partner_onboarding (partner_slug, ${insertFields.join(', ')})
       VALUES ($1, ${values.slice(1).map((_: any, i: number) => `$${i + 2}`).join(', ')}, NOW())
       ON CONFLICT (partner_slug) DO UPDATE SET ${updates.join(', ')}
       RETURNING *`,
      values
    );

    return { success: true, data: result.rows[0] };
  } catch (err: any) {
    console.error("saveOnboardingData error:", err);
    throw err;
  }
}

/** Get partner onboarding data */
export async function getOnboardingData(partnerSlug: string) {
  try {
    const result = await pool.query(
      `SELECT * FROM partner_onboarding WHERE partner_slug = $1`,
      [partnerSlug]
    );
    return result.rows[0] || null;
  } catch (err: any) {
    console.error("getOnboardingData error:", err);
    return null;
  }
}

/** Get onboarding completion percentage */
export async function getOnboardingProgress(partnerSlug: string) {
  const data = await getOnboardingData(partnerSlug);
  if (!data) return { percent: 0, missing: ['everything'] };

  const sections = {
    basics: !!(data.company_name && data.owner_name && data.owner_phone),
    services: !!(data.services_offered && JSON.parse(data.services_offered || '[]').length > 0),
    website: !!(data.website_url !== null),
    social: !!(data.facebook_url || data.instagram_handle || data.google_business_profile_url),
    tools: !!(data.current_crm || data.current_scheduling_tool || data.current_invoicing_tool),
    leads: !!(data.avg_monthly_leads || data.biggest_lead_source),
    branding: !!(data.logo_url || data.tagline),
    seo: !!(data.target_keywords && JSON.parse(data.target_keywords || '[]').length > 0),
  };

  const completed = Object.values(sections).filter(Boolean).length;
  const missing = Object.entries(sections).filter(([_, done]) => !done).map(([name]) => name);

  return {
    percent: Math.round((completed / Object.keys(sections).length) * 100),
    sections,
    missing,
  };
}

/** Get social media audit summary */
export async function getSocialAudit(partnerSlug: string) {
  const data = await getOnboardingData(partnerSlug);
  if (!data) return { hasPresence: false, platforms: [], missing: ['all'] };

  const platforms: Array<{ name: string; url: string | null; status: string }> = [];
  const missing: string[] = [];

  const checks = [
    { name: 'Facebook', field: 'facebook_url' },
    { name: 'Instagram', field: 'instagram_handle' },
    { name: 'Google Business Profile', field: 'google_business_profile_url' },
    { name: 'Yelp', field: 'yelp_url' },
    { name: 'Nextdoor', field: 'nextdoor_url' },
    { name: 'TikTok', field: 'tiktok_handle' },
    { name: 'YouTube', field: 'youtube_url' },
    { name: 'LinkedIn', field: 'linkedin_url' },
  ];

  for (const check of checks) {
    const value = (data as any)[check.field];
    if (value) {
      platforms.push({ name: check.name, url: value, status: 'connected' });
    } else {
      missing.push(check.name);
    }
  }

  return {
    hasPresence: platforms.length > 0,
    platforms,
    missing,
    website: data.website_url,
    wantsSocialPackage: data.wants_social_package,
    recommendation: missing.length > 3
      ? `${data.company_name || 'This partner'} is missing ${missing.length} key platforms. The $500/month social package would set up and manage all of them.`
      : platforms.length > 0
        ? `Good foundation with ${platforms.length} platforms active. Social package would optimize and automate content across all of them.`
        : `No social presence at all. The social package would build everything from scratch.`,
  };
}

/** List all partners with onboarding status */
export async function listPartnerOnboarding() {
  try {
    const result = await pool.query(
      `SELECT partner_slug, company_name, owner_name, status, 
       created_at, updated_at FROM partner_onboarding ORDER BY created_at DESC`
    );
    return result.rows;
  } catch {
    return [];
  }
}
