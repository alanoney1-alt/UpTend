/**
 * Partner Competitor Watchdog (#5)
 * 
 * George monitors each partner's competitors weekly:
 * - Google ranking changes for key terms
 * - New competitor Google Ads detected
 * - Competitor review count/rating changes
 * - New competitors appearing in local search
 * 
 * Uses Brave Search API for data collection.
 * Stores snapshots for trend tracking.
 * Alerts partners via proactive outreach when changes detected.
 */

import { db } from "../db";
import { sql } from "drizzle-orm";

// ============================================================
// Types
// ============================================================

export interface CompetitorSnapshot {
  partnerSlug: string;
  competitorName: string;
  keyword: string;
  googleRank: number | null;
  reviewCount: number | null;
  avgRating: number | null;
  hasGoogleAds: boolean;
  websiteUrl: string | null;
  snapshotDate: string;
}

export interface RankingAlert {
  partnerSlug: string;
  alertType: "ranking_drop" | "ranking_gain" | "new_competitor" | "competitor_ads" | "review_surge";
  keyword: string;
  details: string;
  severity: "info" | "warning" | "urgent";
  createdAt: string;
}

// ============================================================
// Database Setup
// ============================================================

export async function ensureWatchdogTables(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS competitor_snapshots (
        id SERIAL PRIMARY KEY,
        partner_slug TEXT NOT NULL,
        competitor_name TEXT NOT NULL,
        keyword TEXT NOT NULL,
        google_rank INTEGER,
        review_count INTEGER,
        avg_rating NUMERIC(3,2),
        has_google_ads BOOLEAN DEFAULT false,
        website_url TEXT,
        snapshot_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS partner_tracked_keywords (
        id SERIAL PRIMARY KEY,
        partner_slug TEXT NOT NULL,
        keyword TEXT NOT NULL,
        city TEXT DEFAULT 'Orlando',
        is_primary BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(partner_slug, keyword)
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS competitor_alerts (
        id SERIAL PRIMARY KEY,
        partner_slug TEXT NOT NULL,
        alert_type TEXT NOT NULL,
        keyword TEXT,
        details TEXT NOT NULL,
        severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'urgent')),
        acknowledged BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  } catch (err) {
    console.error("[CompetitorWatchdog] Table creation error:", err);
  }
}

// ============================================================
// Keyword Management
// ============================================================

export async function addTrackedKeyword(partnerSlug: string, keyword: string, city: string = "Orlando", isPrimary: boolean = false): Promise<void> {
  await ensureWatchdogTables();
  await db.execute(sql`
    INSERT INTO partner_tracked_keywords (partner_slug, keyword, city, is_primary)
    VALUES (${partnerSlug}, ${keyword}, ${city}, ${isPrimary})
    ON CONFLICT (partner_slug, keyword) DO UPDATE SET is_primary = EXCLUDED.is_primary
  `);
}

export async function getTrackedKeywords(partnerSlug: string): Promise<Array<{ keyword: string; city: string; isPrimary: boolean }>> {
  await ensureWatchdogTables();
  const result = await db.execute(sql`
    SELECT keyword, city, is_primary FROM partner_tracked_keywords
    WHERE partner_slug = ${partnerSlug}
    ORDER BY is_primary DESC, keyword
  `);
  return (result.rows as any[]).map(r => ({
    keyword: r.keyword,
    city: r.city,
    isPrimary: r.is_primary,
  }));
}

/**
 * Auto-generate keywords for a partner based on their service type and area
 */
export async function autoGenerateKeywords(partnerSlug: string, serviceType: string, city: string = "Orlando"): Promise<string[]> {
  const svcLower = serviceType.toLowerCase();
  const keywords: string[] = [
    `${svcLower} ${city}`,
    `${svcLower} near me`,
    `best ${svcLower} ${city}`,
    `${svcLower} ${city} FL`,
    `emergency ${svcLower} ${city}`,
    `${svcLower} repair ${city}`,
    `${svcLower} service ${city}`,
    `affordable ${svcLower} ${city}`,
  ];

  // Add service-specific keywords
  const serviceKeywords: Record<string, string[]> = {
    hvac: ["ac repair", "ac installation", "furnace repair", "duct cleaning", "hvac maintenance", "ac tune up"],
    plumbing: ["plumber", "drain cleaning", "water heater", "pipe repair", "toilet repair", "sewer line"],
    electrical: ["electrician", "electrical repair", "outlet installation", "panel upgrade", "wiring"],
    roofing: ["roof repair", "roof replacement", "roof inspection", "shingle repair", "roof leak"],
    painting: ["house painting", "interior painting", "exterior painting", "cabinet painting"],
    landscaping: ["lawn care", "lawn mowing", "tree trimming", "landscape design", "sod installation"],
  };

  const extras = serviceKeywords[svcLower] || [];
  for (const extra of extras) {
    keywords.push(`${extra} ${city}`);
  }

  // Save all to DB
  for (const kw of keywords) {
    await addTrackedKeyword(partnerSlug, kw, city, keywords.indexOf(kw) < 3);
  }

  return keywords;
}

// ============================================================
// Scanning (uses Brave Search API)
// ============================================================

export async function scanKeyword(keyword: string): Promise<{
  organicResults: Array<{ title: string; url: string; rank: number; description: string }>;
  hasAds: boolean;
}> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) {
    console.log("[CompetitorWatchdog] BRAVE_API_KEY not set, skipping scan");
    return { organicResults: [], hasAds: false };
  }

  try {
    const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(keyword)}&count=10&country=US`, {
      headers: { "X-Subscription-Token": apiKey, Accept: "application/json" },
    });
    
    if (!res.ok) {
      console.error(`[CompetitorWatchdog] Brave API error: ${res.status}`);
      return { organicResults: [], hasAds: false };
    }

    const data: any = await res.json();
    const organicResults = (data.web?.results || []).map((r: any, i: number) => ({
      title: r.title,
      url: r.url,
      rank: i + 1,
      description: r.description,
    }));

    return {
      organicResults,
      hasAds: (data.ads?.results?.length || 0) > 0,
    };
  } catch (err) {
    console.error("[CompetitorWatchdog] Scan error:", err);
    return { organicResults: [], hasAds: false };
  }
}

/**
 * Run a full competitive scan for a partner
 * Should be called weekly (via cron or heartbeat)
 */
export async function runCompetitiveScan(partnerSlug: string): Promise<RankingAlert[]> {
  await ensureWatchdogTables();
  const alerts: RankingAlert[] = [];
  
  const keywords = await getTrackedKeywords(partnerSlug);
  if (keywords.length === 0) return alerts;

  for (const kw of keywords.slice(0, 5)) { // Limit to 5 keywords per scan to manage API usage
    const results = await scanKeyword(`${kw.keyword}`);
    
    // Store competitor snapshots
    for (const result of results.organicResults) {
      await db.execute(sql`
        INSERT INTO competitor_snapshots (partner_slug, competitor_name, keyword, google_rank, website_url, has_google_ads, snapshot_date)
        VALUES (${partnerSlug}, ${result.title}, ${kw.keyword}, ${result.rank}, ${result.url}, ${results.hasAds}, CURRENT_DATE)
      `);
    }

    // Check for changes vs last scan
    const lastScan = await db.execute(sql`
      SELECT * FROM competitor_snapshots
      WHERE partner_slug = ${partnerSlug} AND keyword = ${kw.keyword}
        AND snapshot_date < CURRENT_DATE
      ORDER BY snapshot_date DESC, google_rank ASC
      LIMIT 10
    `);

    if (lastScan.rows.length > 0) {
      // Check if any new competitors appeared in top 5
      const lastTop5 = new Set((lastScan.rows as any[]).filter(r => r.google_rank <= 5).map(r => r.competitor_name));
      const newTop5 = results.organicResults.filter(r => r.rank <= 5 && !lastTop5.has(r.title));
      
      for (const newComp of newTop5) {
        const alert: RankingAlert = {
          partnerSlug,
          alertType: "new_competitor",
          keyword: kw.keyword,
          details: `New competitor in top 5 for "${kw.keyword}": ${newComp.title} at #${newComp.rank}`,
          severity: kw.isPrimary ? "warning" : "info",
          createdAt: new Date().toISOString(),
        };
        alerts.push(alert);
        
        await db.execute(sql`
          INSERT INTO competitor_alerts (partner_slug, alert_type, keyword, details, severity)
          VALUES (${partnerSlug}, ${alert.alertType}, ${alert.keyword}, ${alert.details}, ${alert.severity})
        `);
      }
    }

    // Rate limit between searches
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  return alerts;
}

/**
 * Get recent alerts for a partner
 */
export async function getAlerts(partnerSlug: string, limit: number = 20): Promise<RankingAlert[]> {
  await ensureWatchdogTables();
  const result = await db.execute(sql`
    SELECT * FROM competitor_alerts
    WHERE partner_slug = ${partnerSlug}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `);
  return result.rows as any[];
}

/**
 * Get ranking history for a keyword
 */
export async function getRankingHistory(partnerSlug: string, keyword: string, days: number = 30): Promise<Array<{
  date: string;
  competitors: Array<{ name: string; rank: number }>;
}>> {
  await ensureWatchdogTables();
  const result = await db.execute(sql`
    SELECT snapshot_date, competitor_name, google_rank
    FROM competitor_snapshots
    WHERE partner_slug = ${partnerSlug} AND keyword = ${keyword}
      AND snapshot_date >= CURRENT_DATE - ${days}
    ORDER BY snapshot_date DESC, google_rank ASC
  `);

  const byDate: Record<string, Array<{ name: string; rank: number }>> = {};
  for (const row of result.rows as any[]) {
    const date = row.snapshot_date?.toISOString?.() || String(row.snapshot_date);
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push({ name: row.competitor_name, rank: row.google_rank });
  }

  return Object.entries(byDate).map(([date, competitors]) => ({ date, competitors }));
}
