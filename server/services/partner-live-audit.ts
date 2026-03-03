/**
 * Partner Live Audit Service
 * 
 * Runs a real-time competitive audit using Brave Search API
 * while George is on a discovery call with a business owner.
 * 
 * All searches run in parallel via Promise.allSettled — one failure never crashes the audit.
 */

export interface AuditRequest {
  companyName: string;
  serviceType: string;
  city: string;
  state?: string;
}

export interface AuditResult {
  company: {
    found: boolean;
    reviewCount: number | null;
    rating: number | null;
    website: string | null;
    phone: string | null;
    address: string | null;
    confidence: number;
  };
  searchRanking: {
    query: string;
    position: number | null;
    topResults: Array<{
      position: number;
      name: string;
      reviewCount: number | null;
      rating: number | null;
      url: string | null;
    }>;
    confidence: number;
  };
  competitors: Array<{
    name: string;
    position: number;
    reviewCount: number | null;
    rating: number | null;
    website: string | null;
    confidence: number;
  }>;
  website: {
    exists: boolean;
    url: string | null;
    hasSSL: boolean;
    loadedSuccessfully: boolean;
    confidence: number;
  };
  socialMedia: {
    facebook: { found: boolean; url: string | null; confidence: number };
    instagram: { found: boolean; url: string | null; confidence: number };
  };
  summary: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    georgeInsights: string[];
  };
  auditedAt: string;
  totalConfidence: number;
}

interface BraveWebResult {
  title: string;
  url: string;
  description: string;
  extra_snippets?: string[];
}

interface BraveSearchResponse {
  web?: { results: BraveWebResult[] };
}

// ─── Brave Search Helper ────────────────────────────────────────────────

async function braveSearch(query: string): Promise<BraveWebResult[]> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) throw new Error("BRAVE_API_KEY not set");

  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=20`;
  const res = await fetch(url, {
    headers: { "Accept": "application/json", "X-Subscription-Token": apiKey },
  });
  if (!res.ok) throw new Error(`Brave API ${res.status}`);
  const data = (await res.json()) as BraveSearchResponse;
  return data.web?.results ?? [];
}

// ─── Parsing Helpers ────────────────────────────────────────────────────

function extractRating(text: string): number | null {
  // Patterns: "4.6 stars", "★ 4.6", "4.6/5", "Rating: 4.6"
  const m = text.match(/(?:★\s*|rating[:\s]*|rated\s*)(\d\.\d)/i)
    || text.match(/(\d\.\d)\s*(?:stars?|\/\s*5|out of 5)/i)
    || text.match(/(\d\.\d)\s*\(\d+/);
  if (m) {
    const v = parseFloat(m[1]);
    if (v >= 1 && v <= 5) return v;
  }
  return null;
}

function extractReviewCount(text: string): number | null {
  // Patterns: "(45)", "45 reviews", "45 ratings"
  const m = text.match(/\((\d[\d,]*)\)/)
    || text.match(/(\d[\d,]*)\s*(?:reviews?|ratings?|testimonials?)/i);
  if (m) {
    const v = parseInt(m[1].replace(/,/g, ""), 10);
    if (v > 0 && v < 100000) return v;
  }
  return null;
}

function extractPhone(text: string): string | null {
  const m = text.match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
  return m ? m[0] : null;
}

function nameMatch(haystack: string, companyName: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const h = norm(haystack);
  const words = companyName.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  // Match if ≥60% of significant words appear
  const matched = words.filter(w => h.includes(w.replace(/[^a-z0-9]/g, "")));
  return words.length > 0 && matched.length / words.length >= 0.6;
}

// ─── Individual Audit Sections ──────────────────────────────────────────

async function auditCompany(companyName: string, city: string, state: string): Promise<AuditResult["company"]> {
  const results = await braveSearch(`"${companyName}" ${city} ${state} reviews`);
  const allText = results.map(r => `${r.title} ${r.description} ${(r.extra_snippets || []).join(" ")}`).join(" ");
  const found = results.some(r => nameMatch(r.title + " " + r.description, companyName));

  let website: string | null = null;
  for (const r of results) {
    if (nameMatch(r.title, companyName) && !r.url.includes("yelp.com") && !r.url.includes("google.com") && !r.url.includes("facebook.com") && !r.url.includes("bbb.org")) {
      website = r.url;
      break;
    }
  }

  return {
    found,
    reviewCount: extractReviewCount(allText),
    rating: extractRating(allText),
    website,
    phone: extractPhone(allText),
    address: null, // Would need Places API
    confidence: found ? 85 : 30,
  };
}

async function auditSearchRanking(companyName: string, serviceType: string, city: string, state: string): Promise<{ ranking: AuditResult["searchRanking"]; competitors: AuditResult["competitors"] }> {
  const query = `${serviceType} ${city} ${state}`;
  const results = await braveSearch(query);

  let position: number | null = null;
  const topResults: AuditResult["searchRanking"]["topResults"] = [];
  const competitors: AuditResult["competitors"] = [];

  for (let i = 0; i < Math.min(results.length, 20); i++) {
    const r = results[i];
    const text = `${r.title} ${r.description} ${(r.extra_snippets || []).join(" ")}`;
    const entry = {
      position: i + 1,
      name: r.title.split("|")[0].split("-")[0].trim(),
      reviewCount: extractReviewCount(text),
      rating: extractRating(text),
      url: r.url,
    };
    topResults.push(entry);

    if (nameMatch(r.title + " " + r.description, companyName)) {
      position = i + 1;
    } else if (competitors.length < 5) {
      // Skip aggregator sites
      const skip = ["yelp.com", "angi.com", "homeadvisor.com", "thumbtack.com", "google.com", "bbb.org", "nextdoor.com", "facebook.com", "wikipedia"];
      if (!skip.some(s => r.url.includes(s))) {
        competitors.push({
          name: entry.name,
          position: i + 1,
          reviewCount: entry.reviewCount,
          rating: entry.rating,
          website: r.url,
          confidence: 70,
        });
      }
    }
  }

  return {
    ranking: {
      query,
      position,
      topResults: topResults.slice(0, 10),
      confidence: results.length > 0 ? 85 : 20,
    },
    competitors,
  };
}

async function auditWebsite(url: string | null): Promise<AuditResult["website"]> {
  if (!url) {
    return { exists: false, url: null, hasSSL: false, loadedSuccessfully: false, confidence: 90 };
  }
  const hasSSL = url.startsWith("https");
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal, redirect: "follow" });
    clearTimeout(timeout);
    return { exists: true, url, hasSSL, loadedSuccessfully: res.ok, confidence: 95 };
  } catch {
    return { exists: true, url, hasSSL, loadedSuccessfully: false, confidence: 60 };
  }
}

async function auditSocialMedia(companyName: string, city: string): Promise<AuditResult["socialMedia"]> {
  const [fbResults, igResults] = await Promise.all([
    braveSearch(`${companyName} ${city} facebook`).catch(() => [] as BraveWebResult[]),
    braveSearch(`${companyName} instagram`).catch(() => [] as BraveWebResult[]),
  ]);

  const fbMatch = fbResults.find(r => r.url.includes("facebook.com") && nameMatch(r.title + " " + r.description, companyName));
  const igMatch = igResults.find(r => r.url.includes("instagram.com") && nameMatch(r.title + " " + r.description, companyName));

  return {
    facebook: { found: !!fbMatch, url: fbMatch?.url ?? null, confidence: fbResults.length > 0 ? 80 : 30 },
    instagram: { found: !!igMatch, url: igMatch?.url ?? null, confidence: igResults.length > 0 ? 80 : 30 },
  };
}

// ─── Insight Generation ─────────────────────────────────────────────────

function generateInsights(result: Omit<AuditResult, "summary" | "auditedAt" | "totalConfidence">): AuditResult["summary"] {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];
  const georgeInsights: string[] = [];

  // Company reviews
  if (result.company.confidence > 80) {
    if (result.company.rating && result.company.rating >= 4.5 && result.company.reviewCount && result.company.reviewCount >= 20) {
      strengths.push(`${result.company.rating} star rating with ${result.company.reviewCount} reviews`);
    } else if (result.company.reviewCount !== null && result.company.reviewCount < 15) {
      weaknesses.push("Low review count compared to competitors");
    }
    if (!result.company.rating && !result.company.reviewCount) {
      weaknesses.push("No visible reviews found online");
    }
  }

  // Search ranking insights
  if (result.searchRanking.confidence > 80) {
    const q = result.searchRanking.query;
    const pos = result.searchRanking.position;
    if (pos && pos <= 5) {
      strengths.push(`Ranking #${pos} for "${q}"`);
    } else if (pos && pos > 5) {
      opportunities.push(`Currently at position #${pos} for "${q}" with room to move up`);
    } else {
      weaknesses.push(`Not appearing in top 20 results for "${q}"`);
    }

    const topComp = result.competitors[0];
    if (topComp && topComp.confidence > 60) {
      const posText = pos ? `at position ${pos}` : "not showing up in the top 20";
      georgeInsights.push(
        `I checked your search visibility. When someone Googles "${q}", you're ${posText}. ${topComp.name} is sitting at #${topComp.position}.`
      );
    }
  }

  // Competitor comparison insight
  if (result.company.confidence > 80 && result.competitors.length > 0) {
    const comp = result.competitors[0];
    if (result.company.reviewCount && result.company.rating && comp.reviewCount) {
      const compReviewText = comp.reviewCount ? `${comp.reviewCount} reviews` : "more reviews";
      georgeInsights.push(
        `You've got ${result.company.reviewCount} reviews at ${result.company.rating} stars, which is solid. But ${comp.name} has ${compReviewText} and they're ranking #${comp.position} for "${result.searchRanking.query}". You should be outranking them.`
      );
    } else if (!result.company.reviewCount) {
      georgeInsights.push(
        `I couldn't find many reviews for you online, but ${comp.name} is sitting at #${comp.position} with ${comp.reviewCount ?? "a bunch of"} reviews. That's exactly the kind of gap we close.`
      );
    }
  }

  // Website
  if (result.website.confidence > 80) {
    if (result.website.exists && result.website.loadedSuccessfully) {
      if (!result.website.hasSSL) {
        weaknesses.push("Website lacks SSL certificate (no HTTPS)");
        opportunities.push("Adding SSL improves Google ranking and customer trust");
      } else {
        strengths.push("Website is live and secure");
      }
    } else if (!result.website.exists) {
      weaknesses.push("No company website found");
      opportunities.push("A professional website would capture leads 24/7");
      georgeInsights.push(
        "I looked for your website and couldn't find one. That means every potential customer searching for your service online is going straight to your competitors. That's low hanging fruit we can fix fast."
      );
    }
  }

  // Social media
  if (result.socialMedia.facebook.confidence > 80) {
    if (!result.socialMedia.facebook.found) {
      weaknesses.push("No Facebook page found");
      georgeInsights.push(
        "Your Facebook page doesn't exist. That's free visibility you're missing. Most homeowners check Facebook before calling a service company."
      );
    } else {
      strengths.push("Facebook presence established");
    }
  }

  if (result.socialMedia.instagram.confidence > 80) {
    if (!result.socialMedia.instagram.found) {
      opportunities.push("Instagram could showcase before/after work photos");
    } else {
      strengths.push("Instagram presence established");
    }
  }

  // General opportunities
  if (result.competitors.length > 0) {
    opportunities.push("Competitive market with room to differentiate through online presence");
  }

  return { strengths, weaknesses, opportunities, georgeInsights };
}

// ─── Main Audit Function ────────────────────────────────────────────────

export async function runPartnerAudit(req: AuditRequest): Promise<AuditResult> {
  const { companyName, serviceType, city, state = "FL" } = req;

  // Run all searches in parallel
  const [companyResult, rankingResult, socialResult] = await Promise.allSettled([
    auditCompany(companyName, city, state),
    auditSearchRanking(companyName, serviceType, city, state),
    auditSocialMedia(companyName, city),
  ]);

  const company: AuditResult["company"] = companyResult.status === "fulfilled"
    ? companyResult.value
    : { found: false, reviewCount: null, rating: null, website: null, phone: null, address: null, confidence: 0 };

  const { ranking: searchRanking, competitors } = rankingResult.status === "fulfilled"
    ? rankingResult.value
    : { ranking: { query: `${serviceType} ${city} ${state}`, position: null, topResults: [], confidence: 0 }, competitors: [] };

  const socialMedia: AuditResult["socialMedia"] = socialResult.status === "fulfilled"
    ? socialResult.value
    : { facebook: { found: false, url: null, confidence: 0 }, instagram: { found: false, url: null, confidence: 0 } };

  // Website check depends on company result
  const websiteResult = await auditWebsite(company.website).catch((): AuditResult["website"] => ({
    exists: false, url: null, hasSSL: false, loadedSuccessfully: false, confidence: 0,
  }));

  const partial = { company, searchRanking, competitors, website: websiteResult, socialMedia };
  const summary = generateInsights(partial);

  const confidences = [
    company.confidence,
    searchRanking.confidence,
    websiteResult.confidence,
    socialMedia.facebook.confidence,
    socialMedia.instagram.confidence,
  ];
  const totalConfidence = Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length);

  return {
    ...partial,
    summary,
    auditedAt: new Date().toISOString(),
    totalConfidence,
  };
}

export async function runPartnerAuditSafe(req: AuditRequest): Promise<AuditResult | null> {
  try {
    return await runPartnerAudit(req);
  } catch (err) {
    console.error("[PartnerAudit] Audit failed entirely:", err);
    return null;
  }
}
