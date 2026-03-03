/**
 * Partner Referral Network
 * 
 * Every partner feeds every other partner. When a partner's customer
 * books a service with another UpTend partner, the referring partner
 * earns a 2% referral bonus.
 * 
 * The network effect: more partners = more value per partner = more partners joining.
 */

import { db } from "../db";
import { sql } from "drizzle-orm";

// ============================================================
// Types
// ============================================================

export interface PartnerReferral {
  id: number;
  referringPartnerSlug: string;
  receivingPartnerSlug: string;
  customerId: string;
  customerName: string;
  serviceType: string;
  jobId: string;
  jobAmount: number;
  referralBonusPct: number; // default 2%
  referralBonusAmount: number;
  status: "pending" | "completed" | "paid";
  createdAt: string;
  completedAt: string | null;
  paidAt: string | null;
}

export interface PartnerNetworkStats {
  partnerSlug: string;
  totalReferralsSent: number;
  totalReferralsReceived: number;
  totalBonusEarned: number;
  totalBonusPending: number;
  topReferralPartners: Array<{ slug: string; name: string; count: number }>;
  monthlyReferralTrend: Array<{ month: string; sent: number; received: number; earned: number }>;
}

export interface CrossSellOpportunity {
  customerId: string;
  customerName: string;
  currentPartnerSlug: string;
  suggestedService: string;
  suggestedPartnerSlug: string | null; // null if no partner covers this service yet
  reason: string;
  lastServiceDate: string;
  confidence: number;
}

// ============================================================
// Database Setup
// ============================================================

export async function ensureReferralTables(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS partner_referrals (
        id SERIAL PRIMARY KEY,
        referring_partner_slug TEXT NOT NULL,
        receiving_partner_slug TEXT NOT NULL,
        customer_id TEXT NOT NULL,
        customer_name TEXT DEFAULT '',
        service_type TEXT NOT NULL,
        job_id TEXT DEFAULT '',
        job_amount NUMERIC(10,2) DEFAULT 0,
        referral_bonus_pct NUMERIC(5,2) DEFAULT 2.00,
        referral_bonus_amount NUMERIC(10,2) DEFAULT 0,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'paid')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        paid_at TIMESTAMPTZ
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS partner_network_members (
        id SERIAL PRIMARY KEY,
        partner_slug TEXT UNIQUE NOT NULL,
        company_name TEXT NOT NULL,
        service_types TEXT[] DEFAULT '{}',
        service_area TEXT DEFAULT 'Orlando Metro',
        owner_name TEXT DEFAULT '',
        email TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        referral_bonus_pct NUMERIC(5,2) DEFAULT 2.00,
        total_referrals_sent INTEGER DEFAULT 0,
        total_referrals_received INTEGER DEFAULT 0,
        total_bonus_earned NUMERIC(10,2) DEFAULT 0,
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        active BOOLEAN DEFAULT true
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS partner_customer_registry (
        id SERIAL PRIMARY KEY,
        partner_slug TEXT NOT NULL,
        customer_id TEXT NOT NULL,
        customer_name TEXT DEFAULT '',
        customer_phone TEXT DEFAULT '',
        customer_address TEXT DEFAULT '',
        services_used TEXT[] DEFAULT '{}',
        last_service_date TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(partner_slug, customer_id)
      )
    `);
  } catch (err) {
    console.error("[ReferralNetwork] Table creation error:", err);
  }
}

// ============================================================
// Core Functions
// ============================================================

/**
 * Register a partner in the network
 */
export async function registerPartner(
  slug: string,
  companyName: string,
  serviceTypes: string[],
  ownerName?: string,
  email?: string,
  phone?: string
): Promise<void> {
  await ensureReferralTables();
  await db.execute(sql`
    INSERT INTO partner_network_members (partner_slug, company_name, service_types, owner_name, email, phone)
    VALUES (${slug}, ${companyName}, ${`{${serviceTypes.join(",")}}`}, ${ownerName || ""}, ${email || ""}, ${phone || ""})
    ON CONFLICT (partner_slug) DO UPDATE SET
      company_name = EXCLUDED.company_name,
      service_types = EXCLUDED.service_types,
      owner_name = EXCLUDED.owner_name,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone
  `);
}

/**
 * Register a customer under a partner (for cross-referral tracking)
 */
export async function registerCustomer(
  partnerSlug: string,
  customerId: string,
  customerName: string,
  customerPhone?: string,
  customerAddress?: string,
  serviceUsed?: string
): Promise<void> {
  await ensureReferralTables();
  
  const servicesArray = serviceUsed ? [serviceUsed] : [];
  
  await db.execute(sql`
    INSERT INTO partner_customer_registry (partner_slug, customer_id, customer_name, customer_phone, customer_address, services_used, last_service_date)
    VALUES (${partnerSlug}, ${customerId}, ${customerName}, ${customerPhone || ""}, ${customerAddress || ""}, ${`{${servicesArray.join(",")}}`}, NOW())
    ON CONFLICT (partner_slug, customer_id) DO UPDATE SET
      customer_name = EXCLUDED.customer_name,
      services_used = partner_customer_registry.services_used || EXCLUDED.services_used,
      last_service_date = NOW()
  `);
}

/**
 * Create a cross-referral when a partner's customer books with another partner
 */
export async function createReferral(
  referringPartnerSlug: string,
  receivingPartnerSlug: string,
  customerId: string,
  customerName: string,
  serviceType: string,
  jobId: string,
  jobAmount: number,
  bonusPct: number = 2.0
): Promise<PartnerReferral> {
  await ensureReferralTables();
  
  const bonusAmount = (jobAmount * bonusPct) / 100;
  
  const result = await db.execute(sql`
    INSERT INTO partner_referrals (
      referring_partner_slug, receiving_partner_slug, customer_id, customer_name,
      service_type, job_id, job_amount, referral_bonus_pct, referral_bonus_amount, status
    ) VALUES (
      ${referringPartnerSlug}, ${receivingPartnerSlug}, ${customerId}, ${customerName},
      ${serviceType}, ${jobId}, ${jobAmount}, ${bonusPct}, ${bonusAmount}, 'pending'
    ) RETURNING *
  `);
  
  return result.rows[0] as any;
}

/**
 * Mark a referral as completed (job done) and update partner stats
 */
export async function completeReferral(referralId: number): Promise<void> {
  await db.execute(sql`
    UPDATE partner_referrals SET status = 'completed', completed_at = NOW()
    WHERE id = ${referralId} AND status = 'pending'
  `);
  
  // Update partner stats
  const referral = await db.execute(sql`
    SELECT * FROM partner_referrals WHERE id = ${referralId}
  `);
  
  if (referral.rows.length > 0) {
    const ref: any = referral.rows[0];
    await db.execute(sql`
      UPDATE partner_network_members 
      SET total_referrals_sent = total_referrals_sent + 1,
          total_bonus_earned = total_bonus_earned + ${ref.referral_bonus_amount}
      WHERE partner_slug = ${ref.referring_partner_slug}
    `);
    await db.execute(sql`
      UPDATE partner_network_members 
      SET total_referrals_received = total_referrals_received + 1
      WHERE partner_slug = ${ref.receiving_partner_slug}
    `);
  }
}

/**
 * Find cross-sell opportunities for a customer based on Home Memory + partner network
 */
export async function findCrossSellOpportunities(
  customerId: string,
  currentPartnerSlug: string
): Promise<CrossSellOpportunity[]> {
  await ensureReferralTables();
  
  const opportunities: CrossSellOpportunity[] = [];
  
  // Get customer info
  const customerResult = await db.execute(sql`
    SELECT * FROM partner_customer_registry 
    WHERE customer_id = ${customerId}
  `);
  
  if (customerResult.rows.length === 0) return opportunities;
  
  const customer: any = customerResult.rows[0];
  
  // Get all active partners and their service types
  const partnersResult = await db.execute(sql`
    SELECT * FROM partner_network_members WHERE active = true AND partner_slug != ${currentPartnerSlug}
  `);
  
  // Common cross-sell logic based on service type pairings
  const crossSellMap: Record<string, string[]> = {
    "HVAC": ["Duct Cleaning", "Insulation", "Electrical", "Home Cleaning"],
    "Plumbing": ["Water Heater", "Drain Cleaning", "Home Cleaning"],
    "Electrical": ["HVAC", "Solar", "Generator", "Home Security"],
    "Roofing": ["Gutter Cleaning", "Insulation", "Painting"],
    "Painting": ["Pressure Washing", "Drywall", "Home Cleaning"],
    "Pressure Washing": ["Painting", "Gutter Cleaning", "Landscaping"],
    "Gutter Cleaning": ["Roofing", "Pressure Washing"],
    "Landscaping": ["Irrigation", "Tree Service", "Pressure Washing", "Fencing"],
    "Pool Cleaning": ["Landscaping", "Pressure Washing"],
    "Home Cleaning": ["Carpet Cleaning", "Pressure Washing", "Junk Removal"],
    "Junk Removal": ["Garage Cleanout", "Moving Labor", "Home Cleaning"],
    "Carpet Cleaning": ["Home Cleaning", "Pressure Washing"],
    "Handyman": ["Painting", "Electrical", "Plumbing"],
  };
  
  // Get the current partner's service type
  const currentPartner = await db.execute(sql`
    SELECT * FROM partner_network_members WHERE partner_slug = ${currentPartnerSlug}
  `);
  
  if (currentPartner.rows.length > 0) {
    const partner: any = currentPartner.rows[0];
    const serviceTypes: string[] = partner.service_types || [];
    
    for (const svcType of serviceTypes) {
      const relatedServices = crossSellMap[svcType] || [];
      
      for (const relatedSvc of relatedServices) {
        // Check if any partner covers this service
        const matchingPartner = (partnersResult.rows as any[]).find((p: any) => 
          (p.service_types || []).some((st: string) => 
            st.toLowerCase().includes(relatedSvc.toLowerCase())
          )
        );
        
        opportunities.push({
          customerId,
          customerName: customer.customer_name,
          currentPartnerSlug,
          suggestedService: relatedSvc,
          suggestedPartnerSlug: matchingPartner?.partner_slug || null,
          reason: `Customer uses ${svcType} services. ${relatedSvc} is a common complementary service.`,
          lastServiceDate: customer.last_service_date || new Date().toISOString(),
          confidence: matchingPartner ? 85 : 60,
        });
      }
    }
  }
  
  return opportunities;
}

/**
 * Get network stats for a partner
 */
export async function getPartnerNetworkStats(partnerSlug: string): Promise<PartnerNetworkStats> {
  await ensureReferralTables();
  
  const sentResult = await db.execute(sql`
    SELECT COUNT(*) as count, COALESCE(SUM(referral_bonus_amount), 0) as earned
    FROM partner_referrals WHERE referring_partner_slug = ${partnerSlug} AND status IN ('completed', 'paid')
  `);
  
  const pendingResult = await db.execute(sql`
    SELECT COALESCE(SUM(referral_bonus_amount), 0) as pending
    FROM partner_referrals WHERE referring_partner_slug = ${partnerSlug} AND status = 'pending'
  `);
  
  const receivedResult = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM partner_referrals WHERE receiving_partner_slug = ${partnerSlug}
  `);
  
  const sent: any = sentResult.rows[0] || { count: 0, earned: 0 };
  const pending: any = pendingResult.rows[0] || { pending: 0 };
  const received: any = receivedResult.rows[0] || { count: 0 };
  
  return {
    partnerSlug,
    totalReferralsSent: parseInt(sent.count) || 0,
    totalReferralsReceived: parseInt(received.count) || 0,
    totalBonusEarned: parseFloat(sent.earned) || 0,
    totalBonusPending: parseFloat(pending.pending) || 0,
    topReferralPartners: [],
    monthlyReferralTrend: [],
  };
}

/**
 * Get all partners in the network with their service types
 * Used by George to know who can handle what
 */
export async function getNetworkPartners(): Promise<Array<{
  slug: string;
  companyName: string;
  serviceTypes: string[];
  active: boolean;
}>> {
  await ensureReferralTables();
  
  const result = await db.execute(sql`
    SELECT partner_slug, company_name, service_types, active
    FROM partner_network_members WHERE active = true
    ORDER BY company_name
  `);
  
  return (result.rows as any[]).map((r: any) => ({
    slug: r.partner_slug,
    companyName: r.company_name,
    serviceTypes: r.service_types || [],
    active: r.active,
  }));
}
