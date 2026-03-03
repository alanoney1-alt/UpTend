/**
 * Partner Revenue Attribution (#7)
 * 
 * George tracks every lead source per partner:
 * - SEO pages → which page, which keyword
 * - Google Business Profile → calls, directions, website clicks
 * - Cross-referrals → which partner sent them
 * - Direct → typed URL, bookmarks
 * - Social → which platform, which post
 * 
 * Calculates cost per lead, conversion rate, ROI per channel.
 */

import { db } from "../db";
import { sql } from "drizzle-orm";

// ============================================================
// Types
// ============================================================

export type LeadSource = "seo" | "gbp" | "referral" | "social" | "direct" | "paid_ads" | "email" | "unknown";

export interface LeadAttribution {
  id?: number;
  partnerSlug: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  source: LeadSource;
  sourceDetail: string; // e.g., "seo:/ac-repair-lake-nona" or "referral:comfort-solutions-tech"
  landingPage: string;
  serviceRequested: string;
  estimatedValue: number;
  status: "new" | "contacted" | "quoted" | "won" | "lost";
  convertedToJobId: string | null;
  jobRevenue: number;
  createdAt: string;
}

export interface AttributionReport {
  partnerSlug: string;
  period: string;
  totalLeads: number;
  leadsBySource: Record<LeadSource, number>;
  conversionRate: number;
  totalRevenue: number;
  revenueBySource: Record<LeadSource, number>;
  costPerLead: number;
  costPerLeadBySource: Record<LeadSource, number>;
  industryBenchmarks: {
    avgCPL: number;
    avgConversionRate: number;
  };
  topPerformingPages: Array<{ page: string; leads: number; revenue: number }>;
  topKeywords: Array<{ keyword: string; leads: number }>;
}

// ============================================================
// Database Setup
// ============================================================

export async function ensureAttributionTables(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS partner_lead_attribution (
        id SERIAL PRIMARY KEY,
        partner_slug TEXT NOT NULL,
        customer_id TEXT DEFAULT '',
        customer_name TEXT DEFAULT '',
        customer_phone TEXT DEFAULT '',
        source TEXT NOT NULL DEFAULT 'unknown',
        source_detail TEXT DEFAULT '',
        landing_page TEXT DEFAULT '',
        service_requested TEXT DEFAULT '',
        estimated_value NUMERIC(10,2) DEFAULT 0,
        status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'quoted', 'won', 'lost')),
        converted_to_job_id TEXT,
        job_revenue NUMERIC(10,2) DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS partner_monthly_spend (
        id SERIAL PRIMARY KEY,
        partner_slug TEXT NOT NULL,
        month TEXT NOT NULL,
        channel TEXT NOT NULL,
        spend NUMERIC(10,2) DEFAULT 0,
        notes TEXT DEFAULT '',
        UNIQUE(partner_slug, month, channel)
      )
    `);
  } catch (err) {
    console.error("[RevenueAttribution] Table creation error:", err);
  }
}

// ============================================================
// Lead Tracking
// ============================================================

export async function trackLead(lead: Omit<LeadAttribution, "id" | "createdAt">): Promise<number> {
  await ensureAttributionTables();
  const result = await db.execute(sql`
    INSERT INTO partner_lead_attribution (
      partner_slug, customer_id, customer_name, customer_phone,
      source, source_detail, landing_page, service_requested,
      estimated_value, status
    ) VALUES (
      ${lead.partnerSlug}, ${lead.customerId}, ${lead.customerName}, ${lead.customerPhone},
      ${lead.source}, ${lead.sourceDetail}, ${lead.landingPage}, ${lead.serviceRequested},
      ${lead.estimatedValue}, ${lead.status}
    ) RETURNING id
  `);
  return (result.rows[0] as any)?.id || 0;
}

export async function updateLeadStatus(leadId: number, status: LeadAttribution["status"], jobId?: string, jobRevenue?: number): Promise<void> {
  await ensureAttributionTables();
  await db.execute(sql`
    UPDATE partner_lead_attribution SET
      status = ${status},
      converted_to_job_id = COALESCE(${jobId || null}, converted_to_job_id),
      job_revenue = COALESCE(${jobRevenue || null}, job_revenue),
      updated_at = NOW()
    WHERE id = ${leadId}
  `);
}

// ============================================================
// Spend Tracking
// ============================================================

export async function recordMonthlySpend(partnerSlug: string, month: string, channel: string, spend: number): Promise<void> {
  await ensureAttributionTables();
  await db.execute(sql`
    INSERT INTO partner_monthly_spend (partner_slug, month, channel, spend)
    VALUES (${partnerSlug}, ${month}, ${channel}, ${spend})
    ON CONFLICT (partner_slug, month, channel) DO UPDATE SET spend = EXCLUDED.spend
  `);
}

// ============================================================
// Reporting
// ============================================================

export async function generateAttributionReport(partnerSlug: string, monthsBack: number = 1): Promise<AttributionReport> {
  await ensureAttributionTables();

  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - monthsBack);

  // Leads by source
  const leadsResult = await db.execute(sql`
    SELECT source, COUNT(*) as count, COALESCE(SUM(job_revenue), 0) as revenue
    FROM partner_lead_attribution
    WHERE partner_slug = ${partnerSlug} AND created_at >= ${cutoffDate.toISOString()}
    GROUP BY source
  `);

  const leadsBySource: Record<string, number> = {};
  const revenueBySource: Record<string, number> = {};
  let totalLeads = 0;
  let totalRevenue = 0;

  for (const row of leadsResult.rows as any[]) {
    leadsBySource[row.source] = parseInt(row.count) || 0;
    revenueBySource[row.source] = parseFloat(row.revenue) || 0;
    totalLeads += parseInt(row.count) || 0;
    totalRevenue += parseFloat(row.revenue) || 0;
  }

  // Conversion rate
  const wonResult = await db.execute(sql`
    SELECT COUNT(*) as count FROM partner_lead_attribution
    WHERE partner_slug = ${partnerSlug} AND status = 'won' AND created_at >= ${cutoffDate.toISOString()}
  `);
  const wonCount = parseInt((wonResult.rows[0] as any)?.count) || 0;
  const conversionRate = totalLeads > 0 ? (wonCount / totalLeads) * 100 : 0;

  // Total spend
  const currentMonth = new Date().toISOString().slice(0, 7);
  const spendResult = await db.execute(sql`
    SELECT channel, spend FROM partner_monthly_spend
    WHERE partner_slug = ${partnerSlug} AND month = ${currentMonth}
  `);
  let totalSpend = 0;
  const costPerLeadBySource: Record<string, number> = {};
  for (const row of spendResult.rows as any[]) {
    const spend = parseFloat(row.spend) || 0;
    totalSpend += spend;
    const sourceLeads = leadsBySource[row.channel] || 1;
    costPerLeadBySource[row.channel] = spend / sourceLeads;
  }

  // Top performing pages
  const pagesResult = await db.execute(sql`
    SELECT landing_page, COUNT(*) as leads, COALESCE(SUM(job_revenue), 0) as revenue
    FROM partner_lead_attribution
    WHERE partner_slug = ${partnerSlug} AND created_at >= ${cutoffDate.toISOString()}
      AND landing_page != ''
    GROUP BY landing_page
    ORDER BY leads DESC
    LIMIT 10
  `);

  const topPerformingPages = (pagesResult.rows as any[]).map(r => ({
    page: r.landing_page,
    leads: parseInt(r.leads),
    revenue: parseFloat(r.revenue),
  }));

  return {
    partnerSlug,
    period: `Last ${monthsBack} month(s)`,
    totalLeads,
    leadsBySource: leadsBySource as any,
    conversionRate: Math.round(conversionRate * 10) / 10,
    totalRevenue,
    revenueBySource: revenueBySource as any,
    costPerLead: totalLeads > 0 ? Math.round((totalSpend / totalLeads) * 100) / 100 : 0,
    costPerLeadBySource: costPerLeadBySource as any,
    industryBenchmarks: {
      avgCPL: 65, // Industry average cost per lead for home services
      avgConversionRate: 15, // Industry average conversion rate
    },
    topPerformingPages,
    topKeywords: [], // Will populate when search console data is available
  };
}

/**
 * Get a quick summary string for George to text the partner
 */
export async function getQuickSummary(partnerSlug: string): Promise<string> {
  const report = await generateAttributionReport(partnerSlug, 1);
  
  const sources: string[] = [];
  for (const [source, count] of Object.entries(report.leadsBySource)) {
    if (count > 0) sources.push(`${count} from ${source}`);
  }

  let summary = `This month: ${report.totalLeads} leads`;
  if (sources.length > 0) summary += ` (${sources.join(", ")})`;
  summary += `. Conversion: ${report.conversionRate}%.`;
  
  if (report.costPerLead > 0) {
    summary += ` Cost per lead: $${report.costPerLead}`;
    if (report.costPerLead < report.industryBenchmarks.avgCPL) {
      summary += ` (industry avg: $${report.industryBenchmarks.avgCPL}). You're beating the market.`;
    } else {
      summary += `. Industry avg is $${report.industryBenchmarks.avgCPL}. Working on getting yours down.`;
    }
  }

  if (report.totalRevenue > 0) {
    summary += ` Revenue tracked: $${report.totalRevenue.toLocaleString()}.`;
  }

  return summary;
}
