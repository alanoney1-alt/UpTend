/**
 * Partner Membership / Service Agreement Management
 * 
 * Manage membership plans, customer enrollments, visits, and billing.
 */

import { db } from "../db";
import { sql } from "drizzle-orm";

// ============================================================
// Types
// ============================================================

export interface MembershipPlan {
  id: number;
  partnerSlug: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceAnnual: number;
  servicesIncluded: string[];
  visitsPerYear: number;
  priorityScheduling: boolean;
  discountPercent: number;
  active: boolean;
  createdAt: string;
}

export interface Membership {
  id: number;
  planId: number;
  partnerSlug: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  status: "active" | "paused" | "cancelled" | "expired";
  billingCycle: "monthly" | "annual";
  nextBillingDate: string | null;
  visitsUsed: number;
  visitsRemaining: number;
  startedAt: string;
  cancelledAt: string | null;
  createdAt: string;
}

// ============================================================
// Database Setup
// ============================================================

export async function ensureMembershipTables(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS partner_membership_plans (
        id SERIAL PRIMARY KEY,
        partner_slug TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        price_monthly NUMERIC(10,2) DEFAULT 0,
        price_annual NUMERIC(10,2) DEFAULT 0,
        services_included JSONB DEFAULT '[]',
        visits_per_year INTEGER DEFAULT 0,
        priority_scheduling BOOLEAN DEFAULT false,
        discount_percent NUMERIC(5,2) DEFAULT 0,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS partner_memberships (
        id SERIAL PRIMARY KEY,
        plan_id INTEGER REFERENCES partner_membership_plans(id),
        partner_slug TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT DEFAULT '',
        customer_phone TEXT DEFAULT '',
        customer_address TEXT DEFAULT '',
        status TEXT DEFAULT 'active' CHECK (status IN ('active','paused','cancelled','expired')),
        billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','annual')),
        next_billing_date TIMESTAMPTZ,
        visits_used INTEGER DEFAULT 0,
        visits_remaining INTEGER DEFAULT 0,
        started_at TIMESTAMPTZ DEFAULT NOW(),
        cancelled_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS partner_membership_visits (
        id SERIAL PRIMARY KEY,
        membership_id INTEGER REFERENCES partner_memberships(id),
        service_type TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        visited_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  } catch (err) {
    console.error("[Membership] Table creation error:", err);
  }
}

function mapPlanRow(r: any): MembershipPlan {
  return {
    id: r.id,
    partnerSlug: r.partner_slug,
    name: r.name,
    description: r.description || "",
    priceMonthly: parseFloat(r.price_monthly) || 0,
    priceAnnual: parseFloat(r.price_annual) || 0,
    servicesIncluded: r.services_included || [],
    visitsPerYear: r.visits_per_year || 0,
    priorityScheduling: r.priority_scheduling || false,
    discountPercent: parseFloat(r.discount_percent) || 0,
    active: r.active,
    createdAt: r.created_at,
  };
}

function mapMembershipRow(r: any): Membership {
  return {
    id: r.id,
    planId: r.plan_id,
    partnerSlug: r.partner_slug,
    customerName: r.customer_name,
    customerEmail: r.customer_email,
    customerPhone: r.customer_phone,
    customerAddress: r.customer_address || "",
    status: r.status,
    billingCycle: r.billing_cycle,
    nextBillingDate: r.next_billing_date || null,
    visitsUsed: r.visits_used || 0,
    visitsRemaining: r.visits_remaining || 0,
    startedAt: r.started_at,
    cancelledAt: r.cancelled_at || null,
    createdAt: r.created_at,
  };
}

// ============================================================
// Plan Management
// ============================================================

/**
 * Create a new membership plan for a partner.
 */
export async function createPlan(
  partnerSlug: string,
  name: string,
  description: string,
  priceMonthly: number,
  priceAnnual: number,
  servicesIncluded: string[],
  visitsPerYear: number,
  priorityScheduling: boolean,
  discountPercent: number
): Promise<MembershipPlan> {
  await ensureMembershipTables();
  try {
    const result = await db.execute(sql`
      INSERT INTO partner_membership_plans (partner_slug, name, description, price_monthly, price_annual, services_included, visits_per_year, priority_scheduling, discount_percent)
      VALUES (${partnerSlug}, ${name}, ${description}, ${priceMonthly}, ${priceAnnual}, ${JSON.stringify(servicesIncluded)}::jsonb, ${visitsPerYear}, ${priorityScheduling}, ${discountPercent})
      RETURNING *
    `);
    return mapPlanRow((result.rows as any[])[0]);
  } catch (err: any) {
    console.error("[Membership] createPlan error:", err);
    throw new Error("Failed to create plan: " + err.message);
  }
}

/**
 * List all active membership plans for a partner.
 */
export async function listPlans(partnerSlug: string): Promise<MembershipPlan[]> {
  await ensureMembershipTables();
  try {
    const result = await db.execute(sql`
      SELECT * FROM partner_membership_plans WHERE partner_slug = ${partnerSlug} AND active = true ORDER BY price_monthly ASC
    `);
    return (result.rows as any[]).map(mapPlanRow);
  } catch (err: any) {
    console.error("[Membership] listPlans error:", err);
    throw new Error("Failed to list plans: " + err.message);
  }
}

// ============================================================
// Membership Management
// ============================================================

/**
 * Enroll a customer in a membership plan.
 */
export async function enrollCustomer(
  planId: number,
  customer: { name: string; email: string; phone: string; address: string },
  billingCycle: "monthly" | "annual"
): Promise<Membership> {
  await ensureMembershipTables();
  try {
    // Get plan for visits_per_year
    const planResult = await db.execute(sql`
      SELECT * FROM partner_membership_plans WHERE id = ${planId}
    `);
    const plan = planResult.rows[0] as any;
    if (!plan) throw new Error("Plan not found");

    const nextBilling = billingCycle === "monthly"
      ? "NOW() + INTERVAL '1 month'"
      : "NOW() + INTERVAL '1 year'";

    const result = await db.execute(sql`
      INSERT INTO partner_memberships (plan_id, partner_slug, customer_name, customer_email, customer_phone, customer_address, billing_cycle, next_billing_date, visits_remaining)
      VALUES (${planId}, ${plan.partner_slug}, ${customer.name}, ${customer.email}, ${customer.phone}, ${customer.address}, ${billingCycle}, ${billingCycle === 'monthly' ? sql`NOW() + INTERVAL '1 month'` : sql`NOW() + INTERVAL '1 year'`}, ${plan.visits_per_year})
      RETURNING *
    `);
    return mapMembershipRow((result.rows as any[])[0]);
  } catch (err: any) {
    console.error("[Membership] enrollCustomer error:", err);
    throw new Error("Failed to enroll customer: " + err.message);
  }
}

/**
 * Cancel a membership.
 */
export async function cancelMembership(membershipId: number, reason?: string): Promise<void> {
  await ensureMembershipTables();
  try {
    await db.execute(sql`
      UPDATE partner_memberships SET status = 'cancelled', cancelled_at = NOW() WHERE id = ${membershipId}
    `);
  } catch (err: any) {
    console.error("[Membership] cancelMembership error:", err);
    throw new Error("Failed to cancel membership: " + err.message);
  }
}

/**
 * Pause a membership.
 */
export async function pauseMembership(membershipId: number): Promise<void> {
  await ensureMembershipTables();
  try {
    await db.execute(sql`
      UPDATE partner_memberships SET status = 'paused' WHERE id = ${membershipId} AND status = 'active'
    `);
  } catch (err: any) {
    console.error("[Membership] pauseMembership error:", err);
    throw new Error("Failed to pause membership: " + err.message);
  }
}

/**
 * Resume a paused membership.
 */
export async function resumeMembership(membershipId: number): Promise<void> {
  await ensureMembershipTables();
  try {
    await db.execute(sql`
      UPDATE partner_memberships SET status = 'active' WHERE id = ${membershipId} AND status = 'paused'
    `);
  } catch (err: any) {
    console.error("[Membership] resumeMembership error:", err);
    throw new Error("Failed to resume membership: " + err.message);
  }
}

/**
 * Record a service visit for a membership.
 */
export async function recordVisit(membershipId: number, serviceType: string, notes: string = ""): Promise<void> {
  await ensureMembershipTables();
  try {
    await db.execute(sql`
      INSERT INTO partner_membership_visits (membership_id, service_type, notes) VALUES (${membershipId}, ${serviceType}, ${notes})
    `);
    await db.execute(sql`
      UPDATE partner_memberships SET visits_used = visits_used + 1, visits_remaining = GREATEST(visits_remaining - 1, 0) WHERE id = ${membershipId}
    `);
  } catch (err: any) {
    console.error("[Membership] recordVisit error:", err);
    throw new Error("Failed to record visit: " + err.message);
  }
}

/**
 * Get memberships needing renewal (next_billing_date within 7 days).
 */
export async function getMembershipsNeedingRenewal(partnerSlug: string): Promise<Membership[]> {
  await ensureMembershipTables();
  try {
    const result = await db.execute(sql`
      SELECT * FROM partner_memberships
      WHERE partner_slug = ${partnerSlug}
        AND status = 'active'
        AND next_billing_date <= NOW() + INTERVAL '7 days'
        AND next_billing_date >= NOW()
      ORDER BY next_billing_date ASC
    `);
    return (result.rows as any[]).map(mapMembershipRow);
  } catch (err: any) {
    console.error("[Membership] getMembershipsNeedingRenewal error:", err);
    throw new Error("Failed to get renewals: " + err.message);
  }
}

/**
 * Get membership statistics: active count, MRR, churn rate.
 */
export async function getMembershipStats(partnerSlug: string): Promise<{
  activeCount: number;
  monthlyRecurringRevenue: number;
  churnRate: number;
}> {
  await ensureMembershipTables();
  try {
    const activeResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM partner_memberships WHERE partner_slug = ${partnerSlug} AND status = 'active'
    `);
    const activeCount = parseInt((activeResult.rows[0] as any).count) || 0;

    // MRR: sum monthly prices for monthly members + annual/12 for annual members
    const mrrResult = await db.execute(sql`
      SELECT COALESCE(SUM(
        CASE WHEN m.billing_cycle = 'monthly' THEN p.price_monthly
             WHEN m.billing_cycle = 'annual' THEN p.price_annual / 12
             ELSE 0 END
      ), 0) as mrr
      FROM partner_memberships m
      JOIN partner_membership_plans p ON m.plan_id = p.id
      WHERE m.partner_slug = ${partnerSlug} AND m.status = 'active'
    `);
    const mrr = parseFloat((mrrResult.rows[0] as any).mrr) || 0;

    // Churn: cancelled in last 30 days / (active + cancelled in last 30 days)
    const churnResult = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'cancelled' AND cancelled_at >= NOW() - INTERVAL '30 days') as churned,
        COUNT(*) FILTER (WHERE status = 'active' OR (status = 'cancelled' AND cancelled_at >= NOW() - INTERVAL '30 days')) as base
      FROM partner_memberships WHERE partner_slug = ${partnerSlug}
    `);
    const churned = parseInt((churnResult.rows[0] as any).churned) || 0;
    const base = parseInt((churnResult.rows[0] as any).base) || 0;

    return {
      activeCount,
      monthlyRecurringRevenue: Math.round(mrr * 100) / 100,
      churnRate: base > 0 ? Math.round((churned / base) * 10000) / 100 : 0,
    };
  } catch (err: any) {
    console.error("[Membership] getMembershipStats error:", err);
    throw new Error("Failed to get stats: " + err.message);
  }
}

/**
 * List memberships for a partner with optional filters.
 */
export async function listMemberships(
  partnerSlug: string,
  filters: { status?: string; limit?: number; offset?: number } = {}
): Promise<Membership[]> {
  await ensureMembershipTables();
  try {
    const result = await db.execute(sql`
      SELECT * FROM partner_memberships
      WHERE partner_slug = ${partnerSlug}
        AND (${filters.status || null}::text IS NULL OR status = ${filters.status || ''})
      ORDER BY created_at DESC
      LIMIT ${filters.limit || 50} OFFSET ${filters.offset || 0}
    `);
    return (result.rows as any[]).map(mapMembershipRow);
  } catch (err: any) {
    console.error("[Membership] listMemberships error:", err);
    throw new Error("Failed to list memberships: " + err.message);
  }
}
