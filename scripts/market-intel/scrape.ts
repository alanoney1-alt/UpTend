/**
 * UpTend Market Intelligence Scraper
 * 
 * Automatically gathers leads, competitor activity, and demand signals from:
 * - Craigslist Orlando (services offered + wanted)
 * - Reddit r/orlando (recommendation requests)
 * - Google (competitor rankings for our keywords)
 * 
 * Run: npx tsx scripts/market-intel/scrape.ts
 * Output: scripts/market-intel/reports/YYYY-MM-DD.md
 */

import fs from "fs";
import path from "path";

const OUTPUT_DIR = path.join(import.meta.dirname, "reports");
const today = new Date().toISOString().split("T")[0];

interface Finding {
  source: string;
  type: "customer_lead" | "pro_recruit" | "competitor" | "demand_signal" | "pricing_intel";
  title: string;
  detail: string;
  url: string;
  date: string;
}

const findings: Finding[] = [];

// ─── Craigslist HTML Scraper ─────────────────────────────────────────────────

async function scrapeCraigslistCategory(slug: string, label: string) {
  const url = `https://orlando.craigslist.org/search/${slug}?sort=date`;
  try {
    const res = await fetch(url, {
      headers: { 
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html",
      }
    });
    if (!res.ok) { console.error(`  CL ${label}: HTTP ${res.status}`); return; }
    
    const html = await res.text();
    
    // Parse listing titles and links from search results
    // CL uses <a class="posting-title"> or <li class="cl-static-search-result">
    const listingPattern = /<a[^>]*href="(https:\/\/orlando\.craigslist\.org\/[^"]+)"[^>]*>[\s\S]*?<span class="label">([\s\S]*?)<\/span>/g;
    let match;
    let count = 0;
    
    while ((match = listingPattern.exec(html)) !== null && count < 30) {
      const listingUrl = match[1];
      const title = match[2].replace(/<[^>]+>/g, "").trim();
      if (!title) continue;
      
      const lowerTitle = title.toLowerCase();
      
      // Categorize: is this a pro we can recruit or a customer looking for help?
      const isCustomerSeeking = /need|looking for|wanted|help|recommend|anyone know/i.test(title);
      const isProAdvertising = /available|service|call|free estimate|licensed|insured|\$\d/i.test(title);
      
      // Check if Lake Nona specific
      const isLakeNona = /lake nona|laureate|nona/i.test(title);
      
      // Check for pricing info
      const priceMatch = title.match(/\$[\d,.]+(?:\/hr)?/);
      
      // Filter for relevant services
      const serviceTerms = /junk|haul|pressure|wash|landscape|lawn|mow|gutter|handyman|plumb|electric|paint|clean|pool|carpet|demol|moving|mover|repair|maintenance|roof/i;
      if (!serviceTerms.test(lowerTitle)) continue;
      
      if (isCustomerSeeking) {
        findings.push({
          source: `Craigslist — ${label}`,
          type: "customer_lead",
          title,
          detail: isLakeNona ? "🎯 LAKE NONA customer looking for service" : "Orlando area customer",
          url: listingUrl,
          date: today,
        });
      } else {
        findings.push({
          source: `Craigslist — ${label}`,
          type: "pro_recruit",
          title,
          detail: priceMatch ? `Pricing: ${priceMatch[0]}` : "Independent pro — potential recruit",
          url: listingUrl,
          date: today,
        });
      }
      count++;
    }
    
    // Fallback: try simpler pattern if structured one didn't match
    if (count === 0) {
      const simplePattern = /<a[^>]*href="(https:\/\/orlando\.craigslist\.org\/\w+\/d\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
      while ((match = simplePattern.exec(html)) !== null && count < 30) {
        const listingUrl = match[1];
        const title = match[2].replace(/<[^>]+>/g, "").trim();
        if (!title || title.length < 10 || title.length > 200) continue;
        
        const serviceTerms = /junk|haul|pressure|wash|landscape|lawn|gutter|handyman|plumb|electric|paint|clean|pool|carpet|demol|moving|mover|repair|roof/i;
        if (!serviceTerms.test(title.toLowerCase())) continue;
        
        findings.push({
          source: `Craigslist — ${label}`,
          type: "pro_recruit",
          title,
          detail: "Independent pro — potential recruit",
          url: listingUrl,
          date: today,
        });
        count++;
      }
    }
    
    console.log(`  ✅ CL ${label}: ${count} listings found`);
  } catch (err: any) {
    console.error(`  ❌ CL ${label}: ${err.message}`);
  }
}

async function scrapeCraigslist() {
  console.log("📋 Scraping Craigslist Orlando...");
  
  const categories = [
    { slug: "hss", label: "Household Services" },
    { slug: "handyman", label: "Handyman" },
    { slug: "gutters", label: "Gutters" },
    { slug: "carpet-cleaning", label: "Carpet Cleaning" },
    { slug: "house-cleaner", label: "House Cleaning" },
    { slug: "sks", label: "Skilled Trade" },
    { slug: "lbs", label: "Labor/Hauling" },
  ];
  
  for (const cat of categories) {
    await scrapeCraigslistCategory(cat.slug, cat.label);
    await sleep(2000); // Be nice
  }
}

// ─── Reddit Scraper ──────────────────────────────────────────────────────────

async function scrapeReddit() {
  console.log("📋 Scraping Reddit...");
  
  const searches = [
    { sub: "orlando", query: "handyman OR pressure washing OR landscaping", label: "services" },
    { sub: "orlando", query: "recommendation home OR house OR lawn OR pool", label: "recs" },
    { sub: "orlando", query: "lake nona", label: "lake nona" },
    { sub: "orlando", query: "junk removal OR gutter OR cleaning service", label: "more services" },
  ];
  
  for (const search of searches) {
    try {
      const url = `https://www.reddit.com/r/${search.sub}/search.json?q=${encodeURIComponent(search.query)}&sort=new&t=month&limit=15&restrict_sr=on`;
      const res = await fetch(url, {
        headers: { "User-Agent": "UpTend-Intel/1.0 (market research)" }
      });
      
      if (!res.ok) { console.error(`  Reddit ${search.label}: HTTP ${res.status}`); continue; }
      
      const data = await res.json();
      const posts = data?.data?.children || [];
      let count = 0;
      
      for (const post of posts) {
        const d = post.data;
        if (!d || !d.title) continue;
        if (d.subreddit !== search.sub) continue; // restrict_sr backup
        
        const title = d.title;
        const selftext = (d.selftext || "").slice(0, 300);
        const permalink = `https://reddit.com${d.permalink}`;
        
        // Skip if already captured
        if (findings.some(f => f.url === permalink)) continue;
        
        const isServiceRelated = /handyman|pressure wash|landscap|junk|gutter|pool|clean|mow|lawn|plumb|electric|paint|home service|repair|maintenance|contractor/i.test(title + " " + selftext);
        const isRecommendation = /recommend|suggestion|anyone know|looking for|need a|who do you use|best .* in orlando/i.test(title + " " + selftext);
        const isLakeNona = /lake nona|nona/i.test(title + " " + selftext);
        
        if (isServiceRelated || isRecommendation || isLakeNona) {
          findings.push({
            source: `Reddit r/${search.sub}`,
            type: isRecommendation ? "customer_lead" : "demand_signal",
            title,
            detail: `⬆️${d.score} 💬${d.num_comments}${isLakeNona ? " 🎯 LAKE NONA" : ""}${selftext ? ` — "${selftext.slice(0, 100)}..."` : ""}`,
            url: permalink,
            date: new Date((d.created_utc || 0) * 1000).toISOString().split("T")[0],
          });
          count++;
        }
      }
      
      console.log(`  ✅ Reddit "${search.label}": ${count} relevant posts`);
      await sleep(2500); // Reddit rate limit
    } catch (err: any) {
      console.error(`  ❌ Reddit ${search.label}: ${err.message}`);
    }
  }
}

// ─── Google SERP Check ───────────────────────────────────────────────────────

async function checkGoogleRankings() {
  console.log("📋 Checking Google rankings for target keywords...");
  
  const keywords = [
    "junk removal lake nona",
    "pressure washing orlando",
    "handyman orlando",
    "landscaping lake nona",
    "gutter cleaning orlando",
    "pool cleaning lake nona",
    "home services lake nona",
  ];
  
  for (const kw of keywords) {
    try {
      const url = `https://www.google.com/search?q=${encodeURIComponent(kw)}&num=10&gl=us`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        }
      });
      
      if (!res.ok) { console.error(`  Google "${kw}": HTTP ${res.status}`); continue; }
      
      const html = await res.text();
      
      // Check if uptendapp.com appears
      const uptendRank = html.includes("uptendapp.com") ? "✅ FOUND on page 1!" : "❌ Not on page 1";
      
      // Extract competitor names from results
      const competitors: string[] = [];
      const domainPattern = /https?:\/\/(?:www\.)?([a-z0-9-]+\.(?:com|net|org|co))/gi;
      let domainMatch;
      const seen = new Set<string>();
      while ((domainMatch = domainPattern.exec(html)) !== null) {
        const domain = domainMatch[1].toLowerCase();
        if (seen.has(domain)) continue;
        if (/google|gstatic|youtube|schema|w3/.test(domain)) continue;
        seen.add(domain);
        competitors.push(domain);
      }
      
      findings.push({
        source: "Google SERP",
        type: "competitor",
        title: `"${kw}"`,
        detail: `${uptendRank} | Top domains: ${competitors.slice(0, 5).join(", ")}`,
        url: `https://www.google.com/search?q=${encodeURIComponent(kw)}`,
        date: today,
      });
      
      console.log(`  ✅ "${kw}": ${uptendRank}`);
      await sleep(3000); // Don't anger Google
    } catch (err: any) {
      console.error(`  ❌ Google "${kw}": ${err.message}`);
    }
  }
}

// ─── Report Generator ────────────────────────────────────────────────────────

function generateReport() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  const customerLeads = findings.filter(f => f.type === "customer_lead");
  const proRecruits = findings.filter(f => f.type === "pro_recruit");
  const competitors = findings.filter(f => f.type === "competitor");
  const demandSignals = findings.filter(f => f.type === "demand_signal");
  
  const report = `# 🔍 UpTend Daily Market Intel — ${today}

## Summary
- **${customerLeads.length}** potential customer leads found
- **${proRecruits.length}** potential pro recruits found
- **${competitors.length}** competitor/SEO checks
- **${demandSignals.length}** demand signals
- **${findings.length}** total findings

---

## 🎯 Customer Leads (people looking for services)
${customerLeads.length === 0 ? "_None found today. Check back tomorrow._\n" : ""}
${customerLeads.map((f, i) => `${i + 1}. **${f.title}**
   - Source: ${f.source}
   - ${f.detail}
   - ${f.url}
`).join("\n")}

---

## 🔨 Pro Recruitment Targets (independent pros advertising)
${proRecruits.length === 0 ? "_None found today._\n" : ""}
${proRecruits.slice(0, 40).map((f, i) => `${i + 1}. **${f.title}**
   - Source: ${f.source} | ${f.detail}
   - ${f.url}
`).join("\n")}
${proRecruits.length > 40 ? `\n_...and ${proRecruits.length - 40} more. See raw JSON for full list._\n` : ""}

---

## 📊 Google Rankings Check
${competitors.map(f => `- **${f.title}**: ${f.detail}`).join("\n")}

---

## 📡 Demand Signals (conversations about home services)
${demandSignals.length === 0 ? "_None found today._\n" : ""}
${demandSignals.map((f, i) => `${i + 1}. **${f.title}**
   - Source: ${f.source}
   - ${f.detail}
   - ${f.url}
`).join("\n")}

---

## 🎯 Action Items
${customerLeads.length > 0 ? `- **${customerLeads.length} customer leads** — respond/engage where possible` : ""}
${proRecruits.length > 0 ? `- **${proRecruits.length} pro recruits** — contact top 5 with recruitment pitch` : ""}
${competitors.some(f => f.detail.includes("Not on page 1")) ? `- **SEO gap** — create/optimize landing pages for keywords where we're not ranking` : ""}

---
_Scraped at ${new Date().toISOString()} | Run: npx tsx scripts/market-intel/scrape.ts_
`;

  const reportPath = path.join(OUTPUT_DIR, `${today}.md`);
  fs.writeFileSync(reportPath, report);
  
  // Also save raw JSON
  const jsonPath = path.join(OUTPUT_DIR, `${today}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(findings, null, 2));
  
  console.log(`\n✅ Report: ${reportPath}`);
  console.log(`✅ Raw data: ${jsonPath}`);
  console.log(`\n📊 Summary: ${customerLeads.length} leads | ${proRecruits.length} pro targets | ${demandSignals.length} signals`);
  
  return reportPath;
}

// ─── Util ────────────────────────────────────────────────────────────────────

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔍 UpTend Market Intelligence Scraper");
  console.log("=" .repeat(50));
  console.log(`Date: ${today}\n`);
  
  await scrapeCraigslist();
  await scrapeReddit();
  await checkGoogleRankings();
  
  generateReport();
}

main().catch(console.error);
