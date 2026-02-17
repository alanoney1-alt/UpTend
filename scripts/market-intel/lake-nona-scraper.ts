/**
 * Lake Nona / Orlando Market Intelligence Scraper
 * 
 * Monitors competitor activity, customer demand signals, and pro availability
 * across Craigslist, Reddit, Google, and news sources.
 * 
 * Run: npx tsx scripts/market-intel/lake-nona-scraper.ts
 * Schedule: daily via cron for ongoing intelligence
 */

import fs from "fs";
import path from "path";

const OUTPUT_DIR = path.join(import.meta.dirname, "reports");
const SERVICES = [
  "junk removal", "pressure washing", "landscaping", "gutter cleaning",
  "handyman", "pool cleaning", "house cleaning", "moving", "demolition",
  "carpet cleaning", "garage cleanout"
];
const GEO_TERMS = ["lake nona", "orlando", "kissimmee", "st cloud", "winter park", "oviedo", "sanford"];

// ─── Craigslist Scraper ──────────────────────────────────────────────────────

interface CraigslistListing {
  title: string;
  price: string;
  location: string;
  url: string;
  category: string;
  date: string;
}

const CL_CATEGORIES = [
  { slug: "handyman", label: "Handyman" },
  { slug: "house-cleaner", label: "House Cleaning" },
  { slug: "gutters", label: "Gutters" },
  { slug: "painter", label: "Painting" },
  { slug: "carpet-cleaning", label: "Carpet Cleaning" },
  { slug: "hss", label: "Household Services" },
  { slug: "lbs", label: "Labor/Hauling" },
  { slug: "sks", label: "Skilled Trade" },
];

async function scrapeCraigslist(): Promise<CraigslistListing[]> {
  const results: CraigslistListing[] = [];

  for (const cat of CL_CATEGORIES) {
    try {
      const url = `https://orlando.craigslist.org/search/${cat.slug}?sort=date&format=rss`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" }
      });
      if (!res.ok) continue;

      const text = await res.text();
      // Parse RSS items
      const items = text.match(/<item>([\s\S]*?)<\/item>/g) || [];

      for (const item of items.slice(0, 25)) {
        const title = item.match(/<title><!\[CDATA\[(.*?)\]\]>/)?.[1] || item.match(/<title>(.*?)<\/title>/)?.[1] || "";
        const link = item.match(/<link>(.*?)<\/link>/)?.[1] || "";
        const desc = item.match(/<description><!\[CDATA\[(.*?)\]\]>/)?.[1] || "";
        const pubDate = item.match(/<dc:date>(.*?)<\/dc:date>/)?.[1] || "";

        // Check if related to our services or Lake Nona area
        const lowerTitle = title.toLowerCase();
        const lowerDesc = desc.toLowerCase();
        const combined = lowerTitle + " " + lowerDesc;

        const isRelevant = SERVICES.some(s => combined.includes(s)) ||
                          GEO_TERMS.some(g => combined.includes(g));

        if (isRelevant) {
          results.push({
            title: title.trim(),
            price: desc.match(/\$[\d,]+/)?.[0] || "unlisted",
            location: desc.match(/(?:in|near|at)\s+([^<.]+)/i)?.[1]?.trim() || "Orlando area",
            url: link,
            category: cat.label,
            date: pubDate,
          });
        }
      }

      // Be nice to CL
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.error(`CL scrape error (${cat.label}):`, err);
    }
  }

  return results;
}

// ─── Reddit Scraper ──────────────────────────────────────────────────────────

interface RedditPost {
  title: string;
  subreddit: string;
  url: string;
  score: number;
  comments: number;
  created: string;
  selftext: string;
}

async function scrapeReddit(): Promise<RedditPost[]> {
  const results: RedditPost[] = [];
  const subreddits = ["orlando", "lakemary", "centralflorida"];
  const queries = [
    "pressure washing", "junk removal", "landscaping", "handyman",
    "home services", "gutter cleaning", "pool cleaning", "recommendations",
    "lake nona"
  ];

  for (const sub of subreddits) {
    for (const query of queries) {
      try {
        const url = `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(query)}&sort=new&t=month&limit=10`;
        const res = await fetch(url, {
          headers: { "User-Agent": "UpTend-MarketIntel/1.0" }
        });
        if (!res.ok) continue;

        const data = await res.json();
        const posts = data?.data?.children || [];

        for (const post of posts) {
          const d = post.data;
          if (!d) continue;

          // Skip if we already have this post
          if (results.some(r => r.url === `https://reddit.com${d.permalink}`)) continue;

          results.push({
            title: d.title,
            subreddit: d.subreddit,
            url: `https://reddit.com${d.permalink}`,
            score: d.score,
            comments: d.num_comments,
            created: new Date(d.created_utc * 1000).toISOString(),
            selftext: (d.selftext || "").slice(0, 300),
          });
        }

        await new Promise(r => setTimeout(r, 2000)); // Reddit rate limit
      } catch (err) {
        // Silent — rate limits expected
      }
    }
  }

  return results;
}

// ─── Competitor Analysis ─────────────────────────────────────────────────────

interface Competitor {
  name: string;
  services: string[];
  priceRange: string;
  reviewCount: number;
  rating: number;
  location: string;
  source: string;
  url: string;
  weakness: string;
}

function getKnownCompetitors(): Competitor[] {
  // Known competitors in the Lake Nona / Orlando area based on research
  return [
    {
      name: "College Hunks Hauling Junk",
      services: ["junk removal", "moving"],
      priceRange: "$300-800",
      reviewCount: 500,
      rating: 4.5,
      location: "Orlando (franchise)",
      source: "Google/Yelp",
      url: "https://www.collegehunkshaulingjunk.com/orlando/",
      weakness: "Expensive, franchise model, no AI, no tech differentiation",
    },
    {
      name: "1-800-GOT-JUNK",
      services: ["junk removal"],
      priceRange: "$250-700",
      reviewCount: 300,
      rating: 4.3,
      location: "Orlando metro",
      source: "Google",
      url: "https://www.1800gotjunk.com/orlando",
      weakness: "Single service, phone-based quoting, no photo quotes",
    },
    {
      name: "Craigslist Independents",
      services: ["handyman", "pressure washing", "landscaping", "junk removal"],
      priceRange: "$30-150/hr",
      reviewCount: 0,
      rating: 0,
      location: "Orlando area",
      source: "Craigslist",
      url: "https://orlando.craigslist.org",
      weakness: "No vetting, no insurance verification, no tracking, trust issues",
    },
    {
      name: "Angi (formerly Angie's List)",
      services: ["all home services"],
      priceRange: "varies",
      reviewCount: 1000,
      rating: 3.8,
      location: "National",
      source: "App Store",
      url: "https://www.angi.com",
      weakness: "Lead gen model — pros pay for leads, customers get spammed. Can't choose your pro.",
    },
    {
      name: "TaskRabbit",
      services: ["handyman", "moving", "cleaning", "yard work"],
      priceRange: "$40-100/hr",
      reviewCount: 200,
      rating: 4.0,
      location: "Orlando",
      source: "App Store",
      url: "https://www.taskrabbit.com",
      weakness: "Gig workers not trade pros, limited service depth, no B2B",
    },
    {
      name: "Thumbtack",
      services: ["all home services"],
      priceRange: "varies",
      reviewCount: 400,
      rating: 3.5,
      location: "National",
      source: "Web",
      url: "https://www.thumbtack.com",
      weakness: "Lead gen, pros pay per lead, high cost of acquisition for pros",
    },
  ];
}

// ─── SEO Keyword Targets ────────────────────────────────────────────────────

interface KeywordTarget {
  keyword: string;
  monthlySearches: string;
  difficulty: string;
  intent: "customer" | "pro" | "both";
  priority: "high" | "medium" | "low";
  contentIdea: string;
}

function getSEOKeywords(): KeywordTarget[] {
  return [
    // High-intent customer keywords
    { keyword: "junk removal lake nona", monthlySearches: "50-100", difficulty: "low", intent: "customer", priority: "high", contentIdea: "Landing page: Junk Removal in Lake Nona — Instant AI Photo Quotes" },
    { keyword: "pressure washing orlando", monthlySearches: "1K-5K", difficulty: "medium", intent: "customer", priority: "high", contentIdea: "Service page + blog: Orlando Pressure Washing Guide & Pricing" },
    { keyword: "handyman near me orlando", monthlySearches: "500-1K", difficulty: "medium", intent: "customer", priority: "high", contentIdea: "Service page with pro profiles and instant booking" },
    { keyword: "landscaping lake nona", monthlySearches: "100-200", difficulty: "low", intent: "customer", priority: "high", contentIdea: "Local page: Lake Nona Landscaping — Florida-Native Plants & Maintenance" },
    { keyword: "gutter cleaning orlando", monthlySearches: "200-500", difficulty: "low", intent: "customer", priority: "high", contentIdea: "Service page: Gutter Cleaning Orlando — Before Hurricane Season" },
    { keyword: "pool cleaning lake nona", monthlySearches: "50-100", difficulty: "low", intent: "customer", priority: "high", contentIdea: "Monthly pool service page targeting Lake Nona HOAs" },
    { keyword: "home services orlando", monthlySearches: "500-1K", difficulty: "high", intent: "customer", priority: "medium", contentIdea: "Hub page listing all 13 services with local pricing" },
    { keyword: "garage cleanout orlando", monthlySearches: "50-100", difficulty: "low", intent: "customer", priority: "medium", contentIdea: "Niche page: Garage Cleanout — Before/After Gallery + AI Quotes" },
    { keyword: "carpet cleaning lake nona", monthlySearches: "50-100", difficulty: "low", intent: "customer", priority: "medium", contentIdea: "Service page with pet treatment upsell" },
    
    // Pro recruitment keywords
    { keyword: "handyman jobs orlando", monthlySearches: "200-500", difficulty: "low", intent: "pro", priority: "high", contentIdea: "Become a Pro page: Earn $50-75/hr, choose your jobs, keep more" },
    { keyword: "junk removal jobs orlando", monthlySearches: "100-200", difficulty: "low", intent: "pro", priority: "high", contentIdea: "Pro recruitment: Own a truck? Earn $200-500/day" },
    { keyword: "pressure washing business orlando", monthlySearches: "100-200", difficulty: "low", intent: "pro", priority: "high", contentIdea: "Blog: How to Start Pressure Washing in Orlando (and get jobs on Day 1)" },
    { keyword: "independent contractor home services florida", monthlySearches: "100-200", difficulty: "low", intent: "pro", priority: "medium", contentIdea: "Guide: Going Independent vs. Joining UpTend — Why Not Both?" },
    
    // B2B keywords
    { keyword: "property management vendor orlando", monthlySearches: "50-100", difficulty: "low", intent: "both", priority: "high", contentIdea: "B2B page: One Vendor for All Your Properties" },
    { keyword: "HOA maintenance company orlando", monthlySearches: "50-100", difficulty: "low", intent: "both", priority: "high", contentIdea: "B2B page: HOA Maintenance — Automated Dispatch + Compliance" },
    
    // Long-tail / content marketing
    { keyword: "how much does pressure washing cost orlando", monthlySearches: "100-200", difficulty: "low", intent: "customer", priority: "medium", contentIdea: "Blog with real pricing data from our platform" },
    { keyword: "hurricane prep home maintenance florida", monthlySearches: "500-1K (seasonal)", difficulty: "medium", intent: "customer", priority: "medium", contentIdea: "Seasonal guide: Pre-Hurricane Home Checklist (gutters, trees, roof)" },
    { keyword: "best home service app orlando", monthlySearches: "50-100", difficulty: "low", intent: "customer", priority: "medium", contentIdea: "Comparison page: UpTend vs Angi vs TaskRabbit vs Thumbtack" },
  ];
}

// ─── Community Channels to Monitor ──────────────────────────────────────────

interface CommunityChannel {
  name: string;
  platform: string;
  url: string;
  members: string;
  relevance: "high" | "medium" | "low";
  strategy: string;
  type: "customer" | "pro" | "both";
}

function getCommunityChannels(): CommunityChannel[] {
  return [
    // Facebook Groups (manual monitoring — can't scrape)
    { name: "Lake Nona Social", platform: "Facebook", url: "https://www.facebook.com/groups/lakenona", members: "30K+", relevance: "high", strategy: "Join and monitor for home service requests. Respond helpfully. Post seasonal tips (hurricane prep, pool maintenance). DO NOT spam.", type: "customer" },
    { name: "Lake Nona Neighbors", platform: "Facebook", url: "https://www.facebook.com/groups/lakenonaneighbors", members: "15K+", relevance: "high", strategy: "Same as above. Watch for 'anyone know a good [service]?' posts — that's your opening.", type: "customer" },
    { name: "Lake Nona Moms", platform: "Facebook", url: "https://www.facebook.com/groups/lakenonamoms", members: "10K+", relevance: "medium", strategy: "Home service recs come up often in mom groups. Be helpful, not salesy.", type: "customer" },
    { name: "Orlando Home Services / Contractors", platform: "Facebook", url: "search Facebook for Orlando contractor groups", members: "5-20K", relevance: "high", strategy: "Pro recruitment. Post about earning opportunities, fee structure, certifications.", type: "pro" },
    { name: "Orlando Property Managers Network", platform: "Facebook/LinkedIn", url: "search LinkedIn", members: "1-5K", relevance: "high", strategy: "B2B lead gen. Connect with PMs, offer free pilot.", type: "both" },
    
    // Nextdoor
    { name: "Nextdoor — Lake Nona", platform: "Nextdoor", url: "https://nextdoor.com", members: "varies", relevance: "high", strategy: "Create business page. Respond to service recommendation requests. Neighbors trust Nextdoor recs more than Google.", type: "customer" },
    
    // Reddit
    { name: "r/orlando", platform: "Reddit", url: "https://reddit.com/r/orlando", members: "200K+", relevance: "medium", strategy: "Monitor for home service recommendation threads. Respond genuinely with helpful advice + mention UpTend when relevant.", type: "customer" },
    { name: "r/HomeImprovement", platform: "Reddit", url: "https://reddit.com/r/HomeImprovement", members: "5M+", relevance: "low", strategy: "Content marketing — post Orlando-specific home maintenance guides linking back to uptendapp.com", type: "customer" },
    
    // Craigslist
    { name: "Orlando Craigslist — Services", platform: "Craigslist", url: "https://orlando.craigslist.org/search/hss", members: "n/a", relevance: "high", strategy: "DUAL: (1) Find pros advertising services → recruit them. (2) Post UpTend pro opportunities in gigs/labor.", type: "pro" },
    
    // Google
    { name: "Google My Business", platform: "Google", url: "https://business.google.com", members: "n/a", relevance: "high", strategy: "Claim UpTend listing. Post weekly updates. Respond to all reviews. Target 'home services lake nona' local pack.", type: "customer" },
    
    // Review platforms
    { name: "Yelp Orlando", platform: "Yelp", url: "https://yelp.com", members: "n/a", relevance: "medium", strategy: "Claim listing. Monitor competitor reviews for pain points (late, overcharged, no-show) — use in marketing.", type: "customer" },
  ];
}

// ─── Generate Report ─────────────────────────────────────────────────────────

async function generateReport() {
  console.log("🔍 UpTend Market Intelligence — Lake Nona / Orlando");
  console.log("=".repeat(60));

  console.log("\n📋 Scraping Craigslist Orlando...");
  const clListings = await scrapeCraigslist();
  console.log(`   Found ${clListings.length} relevant listings`);

  console.log("\n📋 Scraping Reddit...");
  const redditPosts = await scrapeReddit();
  console.log(`   Found ${redditPosts.length} relevant posts`);

  const competitors = getKnownCompetitors();
  const keywords = getSEOKeywords();
  const channels = getCommunityChannels();

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const date = new Date().toISOString().split("T")[0];
  const report = `# UpTend Market Intelligence Report
## Lake Nona / Orlando — ${date}

---

## 📊 Executive Summary

- **${clListings.length}** active Craigslist listings scraped (home services in Orlando)
- **${redditPosts.length}** relevant Reddit posts found
- **${competitors.length}** known competitors profiled
- **${keywords.length}** SEO keyword targets identified
- **${channels.length}** community channels mapped for engagement

---

## 🏪 Craigslist Activity (Orlando)

These are active pros and service seekers — potential recruitment targets and demand signals.

${clListings.length === 0 ? "_No relevant listings found in this scan. Try running during peak hours (Mon-Wed morning)._\n" : ""}
${clListings.slice(0, 30).map(l => `- **${l.category}**: ${l.title} (${l.price}) — ${l.location}
  ${l.url}`).join("\n")}

### 🎯 Craigslist Strategy
1. **Pro Recruitment**: Contact handyman/skilled trade posters offering UpTend partnership (better leads, guaranteed payment, career growth)
2. **Demand Signals**: "Household Services" posts = customers looking for help. Note service types and locations trending
3. **Pricing Intel**: Track price ranges competitors post — ensure UpTend pricing is competitive
4. **Post Frequency**: Run this scraper Mon/Wed/Fri to track weekly patterns

---

## 💬 Reddit Activity (Orlando / Central FL)

${redditPosts.length === 0 ? "_No relevant posts found this scan. Reddit activity is sporadic — run weekly._\n" : ""}
${redditPosts.slice(0, 20).map(p => `- **r/${p.subreddit}** (⬆️${p.score}, 💬${p.comments}): ${p.title}
  ${p.url}
  ${p.selftext ? `> ${p.selftext.slice(0, 150)}...` : ""}`).join("\n\n")}

### 🎯 Reddit Strategy
1. Monitor r/orlando for "recommendation" or "looking for" posts about home services
2. Respond helpfully (don't shill) — "I actually use X for this, here's my experience..."
3. Post seasonal content (hurricane prep, spring cleaning guides) with uptendapp.com links
4. Track which services get the most recommendation requests

---

## 🏆 Competitor Landscape

${competitors.map(c => `### ${c.name}
- **Services:** ${c.services.join(", ")}
- **Price Range:** ${c.priceRange}
- **Rating:** ${c.rating > 0 ? `${c.rating}/5 (${c.reviewCount} reviews)` : "N/A"}
- **Location:** ${c.location}
- **Weakness:** ${c.weakness}
- **URL:** ${c.url}`).join("\n\n")}

### 🎯 Competitive Positioning
| Feature | UpTend | Angi | TaskRabbit | Thumbtack | CL Independents |
|---------|--------|------|------------|-----------|-----------------|
| AI Photo Quotes | ✅ | ❌ | ❌ | ❌ | ❌ |
| Choose Your Pro | ✅ | ❌ | ✅ | ❌ | ❌ |
| Transparent Pricing | ✅ | ❌ | ✅ | ❌ | ❌ |
| Pro Career Path | ✅ | ❌ | ❌ | ❌ | ❌ |
| B2B (PM/HOA) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Government Contracts | ✅ | ❌ | ❌ | ❌ | ❌ |
| Real-time Tracking | ✅ | ❌ | ✅ | ❌ | ❌ |
| Bilingual AI | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 🔑 SEO Keyword Targets

### High Priority (attack first)
${keywords.filter(k => k.priority === "high").map(k => `- **"${k.keyword}"** — ~${k.monthlySearches}/mo, ${k.difficulty} difficulty, ${k.intent} intent
  → ${k.contentIdea}`).join("\n")}

### Medium Priority
${keywords.filter(k => k.priority === "medium").map(k => `- **"${k.keyword}"** — ~${k.monthlySearches}/mo, ${k.difficulty} difficulty
  → ${k.contentIdea}`).join("\n")}

### 🎯 SEO Action Plan
1. **Create service-specific landing pages** for each of the 13 verticals with Lake Nona / Orlando targeting
2. **Blog strategy**: 2 posts/week — pricing guides, seasonal maintenance, "vs" comparisons
3. **Google My Business**: Claim listing, post weekly, get first 10 reviews from test users
4. **Local citations**: Submit to Yelp, BBB, HomeAdvisor, Alignable, Orlando Chamber
5. **Schema markup**: Add LocalBusiness + Service structured data to uptendapp.com
6. **Target featured snippets**: "How much does [service] cost in Orlando?" format

---

## 📱 Community Channels

${channels.map(c => `### ${c.name} (${c.platform})
- **Members:** ${c.members}
- **Relevance:** ${c.relevance}
- **Target:** ${c.type}
- **Strategy:** ${c.strategy}
- **URL:** ${c.url}`).join("\n\n")}

### 🎯 Community Engagement Playbook

**Week 1-2: Setup**
- Join all Facebook groups (personal account, not business)
- Create Nextdoor business page
- Claim Google My Business listing
- Set up Yelp business page

**Week 3-4: Listen**
- Monitor all channels daily for 2 weeks
- Document: What services are people asking about? What complaints do they have? Who are the "regulars" recommending services?
- Note competitor names that keep coming up

**Week 5+: Engage**
- Respond to service recommendation requests (be helpful first, mention UpTend second)
- Post seasonal tips (hurricane prep, spring cleaning checklists)
- Share before/after photos from completed jobs
- Offer "first booking free" or discount codes in community groups
- Cross-promote: "We're a Lake Nona startup looking for beta testers"

**Monthly: Content Calendar**
- Week 1: Seasonal maintenance tip + service spotlight
- Week 2: Pro spotlight (interview a pro, share their story)
- Week 3: Pricing transparency post ("What does X really cost in Orlando?")
- Week 4: Community engagement (ask a question, run a poll)

---

## 🚀 Immediate Action Items

### This Week
1. ☐ Claim Google My Business listing for UpTend
2. ☐ Join Lake Nona Social + Lake Nona Neighbors Facebook groups
3. ☐ Create Nextdoor business page
4. ☐ Post first Craigslist ad for pro recruitment (gigs section)
5. ☐ Set up this scraper as a daily cron job

### This Month  
6. ☐ Create 5 service-specific landing pages (junk removal, pressure washing, landscaping, handyman, gutter cleaning)
7. ☐ Write 4 blog posts targeting high-priority keywords
8. ☐ Contact 10 Craigslist handyman/service posters about joining UpTend
9. ☐ Submit to 5 local business directories
10. ☐ Get first 5 Google reviews

### Ongoing
11. ☐ Run scraper Mon/Wed/Fri — track trends
12. ☐ Monitor Facebook groups daily (10 min/day)
13. ☐ Respond to Reddit recommendations weekly
14. ☐ Update competitor pricing quarterly
15. ☐ Refresh SEO content monthly

---

_Generated by UpTend Market Intelligence System — ${new Date().toISOString()}_
`;

  const reportPath = path.join(OUTPUT_DIR, `market-intel-${date}.md`);
  fs.writeFileSync(reportPath, report);
  console.log(`\n✅ Report saved: ${reportPath}`);

  // Also save raw data as JSON for future analysis
  const dataPath = path.join(OUTPUT_DIR, `raw-data-${date}.json`);
  fs.writeFileSync(dataPath, JSON.stringify({
    date,
    craigslist: clListings,
    reddit: redditPosts,
    competitors,
    keywords,
    channels,
  }, null, 2));
  console.log(`✅ Raw data saved: ${dataPath}`);

  return reportPath;
}

// Run
generateReport().catch(console.error);
