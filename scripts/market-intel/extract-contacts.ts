/**
 * Contact Extractor — Fetches Craigslist listing pages and extracts contact info.
 * Run: npx tsx scripts/market-intel/extract-contacts.ts [--date YYYY-MM-DD] [--output-dir PATH]
 */

import fs from "fs";
import path from "path";
import os from "os";

const REPORTS_DIR = path.join(import.meta.dirname, "reports");
const DEFAULT_OUTPUT = path.join(os.homedir(), "Desktop", "Pro_Recruitment_Pipeline", "contacts");
const dateArg = process.argv.find((_, i, a) => a[i - 1] === "--date") || new Date().toISOString().split("T")[0];
const outputDir = process.argv.find((_, i, a) => a[i - 1] === "--output-dir") || DEFAULT_OUTPUT;

interface Finding {
  source: string;
  type: string;
  title: string;
  detail: string;
  url: string;
  date: string;
}

interface Contact {
  url: string;
  title: string;
  serviceType: string;
  phones: string[];
  emails: string[];
  name: string | null;
  location: string | null;
  rawTitle: string;
}

const SERVICE_PATTERNS: [RegExp, string][] = [
  [/junk|haul|trash|debris|dump/i, "junk_removal"],
  [/pressure|power wash|soft wash/i, "pressure_washing"],
  [/handyman|handy man|tv mount|repair|fix/i, "handyman"],
  [/landscap|lawn|mow|yard|tree|trim|sod/i, "landscaping"],
  [/gutter/i, "gutter_cleaning"],
  [/pool/i, "pool_care"],
  [/clean|maid|janitorial|housekeep/i, "cleaning"],
  [/mov(e|ing)|labor|load|unload/i, "moving_labor"],
  [/carpet|upholstery|steam/i, "carpet_cleaning"],
  [/demol|tear.*down|tear.*out/i, "demolition"],
  [/paint/i, "painting"],
  [/plumb/i, "plumbing"],
  [/electric|wiring/i, "electrical"],
  [/roof/i, "roofing"],
  [/garage door/i, "garage_door"],
  [/tile|floor/i, "flooring"],
  [/fence/i, "fencing"],
];

function classifyService(text: string): string {
  for (const [pattern, label] of SERVICE_PATTERNS) {
    if (pattern.test(text)) return label;
  }
  return "general";
}

function extractPhones(text: string): string[] {
  const patterns = [
    /\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/g,
    /\d{3}[\s.\-]\d{3}[\s.\-]\d{4}/g,
  ];
  const phones = new Set<string>();
  for (const p of patterns) {
    const matches = text.match(p) || [];
    for (const m of matches) {
      const digits = m.replace(/\D/g, "");
      if (digits.length === 10) phones.add(digits);
    }
  }
  return [...phones];
}

function extractEmails(text: string): string[] {
  const matches = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || [];
  return [...new Set(matches.map(e => e.toLowerCase()))].filter(
    e => !e.includes("craigslist") && !e.includes("@sale") && !e.endsWith(".png") && !e.endsWith(".jpg")
  );
}

function extractName(text: string): string | null {
  const namePatterns = [
    /(?:call|contact|ask for|text|reach)\s+([A-Z][a-z]{2,15})/i,
    /(?:my name is|i'm|i am)\s+([A-Z][a-z]{2,15})/i,
    /(?:^|\n)\s*([A-Z][a-z]{2,15}(?:\s+[A-Z][a-z]{2,15})?)\s*(?:\n|$)/,
  ];
  for (const p of namePatterns) {
    const m = text.match(p);
    if (m?.[1] && m[1].length > 2) return m[1];
  }
  return null;
}

function extractLocation(text: string, title: string): string | null {
  const combined = title + " " + text;
  const areas = [
    "Orlando", "Lake Nona", "Kissimmee", "Winter Garden", "Winter Park",
    "Altamonte Springs", "Sanford", "Apopka", "Clermont", "Ocoee",
    "St. Cloud", "Daytona", "Deltona", "Poinciana", "Windermere",
    "Celebration", "Dr. Phillips", "Maitland", "Casselberry",
    "Central Florida", "Orange County", "Osceola", "Seminole",
  ];
  const found: string[] = [];
  for (const area of areas) {
    if (combined.toLowerCase().includes(area.toLowerCase())) found.push(area);
  }
  return found.length > 0 ? found.join(", ") : null;
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function fetchListing(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function main() {
  const inputPath = path.join(REPORTS_DIR, `${dateArg}.json`);
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ No report found at ${inputPath}`);
    process.exit(1);
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const findings: Finding[] = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
  const proListings = findings.filter(f => f.type === "pro_recruit" && f.url.includes("craigslist.org"));
  console.log(`📋 Found ${proListings.length} pro listings to process from ${dateArg}`);
  console.log(`📂 Output dir: ${outputDir}`);

  const contacts: Contact[] = [];
  const seenPhones = new Set<string>();
  const seenEmails = new Set<string>();

  for (let i = 0; i < proListings.length; i++) {
    const listing = proListings[i];
    const titleClean = listing.title.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
    
    const titlePhones = extractPhones(titleClean);
    const titleEmails = extractEmails(titleClean);
    const titleName = extractName(titleClean);
    const serviceType = classifyService(titleClean);
    const location = extractLocation("", titleClean);

    process.stdout.write(`  [${i + 1}/${proListings.length}] ${serviceType} — ${titleClean.slice(0, 60)}...`);
    
    const html = await fetchListing(listing.url);
    let pagePhones: string[] = [];
    let pageEmails: string[] = [];
    let pageName: string | null = null;
    let pageLocation: string | null = null;

    if (html) {
      const bodyMatch = html.match(/<section id="postingbody">([\s\S]*?)<\/section>/);
      const body = bodyMatch ? bodyMatch[1].replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ") : "";
      
      pagePhones = extractPhones(body);
      pageEmails = extractEmails(body);
      pageName = extractName(body);
      pageLocation = extractLocation(body, titleClean);
      
      const replyMatch = html.match(/mailto:([^"?]+)/);
      if (replyMatch) {
        const replyEmail = replyMatch[1].toLowerCase();
        if (!replyEmail.includes("craigslist")) pageEmails.push(replyEmail);
      }
    }

    const allPhones = [...new Set([...titlePhones, ...pagePhones])];
    const allEmails = [...new Set([...titleEmails, ...pageEmails])];
    const name = titleName || pageName;
    const loc = pageLocation || location;

    const isNewPhone = allPhones.some(p => !seenPhones.has(p));
    const isNewEmail = allEmails.some(e => !seenEmails.has(e));
    const hasContact = allPhones.length > 0 || allEmails.length > 0;

    if (hasContact && (isNewPhone || isNewEmail || (allPhones.length === 0 && allEmails.length === 0))) {
      allPhones.forEach(p => seenPhones.add(p));
      allEmails.forEach(e => seenEmails.add(e));

      contacts.push({
        url: listing.url,
        title: titleClean,
        serviceType,
        phones: allPhones,
        emails: allEmails,
        name,
        location: loc,
        rawTitle: listing.title,
      });
      process.stdout.write(` ✅ ${allPhones.length}📞 ${allEmails.length}📧\n`);
    } else if (!hasContact) {
      process.stdout.write(` ⚪ no contact info\n`);
    } else {
      process.stdout.write(` 🔄 duplicate\n`);
    }

    await sleep(1500 + Math.random() * 1000);
  }

  // Save JSON
  const jsonOut = path.join(outputDir, `contacts-${dateArg}.json`);
  fs.writeFileSync(jsonOut, JSON.stringify(contacts, null, 2));

  // Save CSV
  const csvOut = path.join(outputDir, `contacts-${dateArg}.csv`);
  const csvHeader = "name,service_type,phone,email,location,url\n";
  const csvRows = contacts.map(c => {
    const esc = (s: string) => `"${(s || "").replace(/"/g, '""')}"`;
    return [
      esc(c.name || ""),
      esc(c.serviceType),
      esc(c.phones.join("; ")),
      esc(c.emails.join("; ")),
      esc(c.location || ""),
      esc(c.url),
    ].join(",");
  }).join("\n");
  fs.writeFileSync(csvOut, csvHeader + csvRows);

  console.log(`\n✅ Extracted ${contacts.length} unique contacts`);
  console.log(`   📞 ${contacts.filter(c => c.phones.length > 0).length} with phone numbers`);
  console.log(`   📧 ${contacts.filter(c => c.emails.length > 0).length} with emails`);
  console.log(`   📄 ${jsonOut}`);
  console.log(`   📄 ${csvOut}`);

  const byType: Record<string, number> = {};
  contacts.forEach(c => { byType[c.serviceType] = (byType[c.serviceType] || 0) + 1; });
  console.log("\n📊 By service type:");
  Object.entries(byType).sort((a, b) => b[1] - a[1]).forEach(([t, n]) => console.log(`   ${t}: ${n}`));
}

main().catch(console.error);
