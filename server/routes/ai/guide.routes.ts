/**
 * UpTend Guide API Routes
 * Context-aware, fully personalized AI assistant endpoint
 * 
 * Enhanced with: property scan, price match, photo analysis,
 * booking, conversation persistence, quotes, bundles
 */

import { Router } from "express";
import rateLimit from "express-rate-limit";
import { createChatCompletion, analyzeImage } from "../../services/ai/anthropic-client";

const guideChatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});
import { storage } from "../../storage";
import { pool } from "../../db";
import { getPropertyData, getPropertyDataAsync, formatPropertySummary, type PropertyData } from "../../services/ai/property-scan-service";
import { calculatePriceMatch, STANDARD_RATES, type PriceMatchResult } from "../../services/ai/price-match-service";
import { nanoid } from "nanoid";

// ─── Types ───────────────────────────────────────────────────────────────────

interface GuideSession {
  history: Array<{ role: "user" | "assistant"; content: string }>;
  propertyData?: PropertyData;
  onboardingState?: "address" | "property_confirmed" | "pool_check" | "services_questionnaire" | "complete";
  recurringServices?: Record<string, { hasService: boolean; provider?: string; price?: number }>;
  photoEstimates?: Array<{ photoUrl: string; items: string[]; estimate: { min: number; max: number }; description: string }>;
  currentServiceType?: string;
  lockedQuotes?: Array<{ id: string; service: string; price: number; validUntil: string; address: string }>;
  priceMatches?: PriceMatchResult[];
  pendingBooking?: any;
}

// ─── Session Store ───────────────────────────────────────────────────────────

const sessions = new Map<string, GuideSession & { _lastAccess?: number }>();
setInterval(() => {
  if (sessions.size > 1000) {
    // Evict oldest half instead of clearing everything
    const entries = [...sessions.entries()].sort((a, b) => (a[1]._lastAccess || 0) - (b[1]._lastAccess || 0));
    const toRemove = entries.slice(0, Math.floor(entries.length / 2));
    for (const [key] of toRemove) sessions.delete(key);
  }
  // Also evict sessions older than 2 hours
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  for (const [key, val] of sessions) {
    if ((val._lastAccess || 0) < twoHoursAgo) sessions.delete(key);
  }
}, 30 * 60 * 1000);

function getSession(sid: string): GuideSession {
  if (!sessions.has(sid)) {
    sessions.set(sid, { history: [], _lastAccess: Date.now() } as any);
  }
  const session = sessions.get(sid)!;
  (session as any)._lastAccess = Date.now();
  return session;
}

// ─── DB Table Init ───────────────────────────────────────────────────────────

let tablesInitialized = false;
async function ensureTables() {
  if (tablesInitialized) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guide_conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        messages JSONB NOT NULL DEFAULT '[]',
        property_data JSONB,
        recurring_services JSONB,
        photo_estimates JSONB,
        locked_quotes JSONB,
        price_matches JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guide_property_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        address TEXT NOT NULL,
        property_data JSONB NOT NULL,
        pool_confirmed BOOLEAN,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guide_price_matches (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        service_key TEXT NOT NULL,
        claimed_price NUMERIC,
        matched_price NUMERIC,
        standard_rate NUMERIC,
        receipt_url TEXT,
        receipt_verified BOOLEAN DEFAULT FALSE,
        provider_name TEXT,
        provider_contact TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guide_locked_quotes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        service_type TEXT NOT NULL,
        price NUMERIC NOT NULL,
        address TEXT,
        details JSONB,
        valid_until TIMESTAMPTZ NOT NULL,
        status TEXT DEFAULT 'active',
        share_token TEXT UNIQUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guide_learnings (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        category TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        source TEXT DEFAULT 'conversation',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_guide_learnings_user ON guide_learnings(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_guide_learnings_category ON guide_learnings(category)`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_guide_learnings_unique ON guide_learnings(COALESCE(user_id, ''), category, key)`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS guide_feedback (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        session_id TEXT,
        message_id TEXT,
        feedback_type TEXT NOT NULL,
        content TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    tablesInitialized = true;
  } catch (err) {
    console.error("Guide tables init error:", err);
  }
}

// ─── Learning & Memory ───────────────────────────────────────────────────────

async function saveLearning(userId: string | null, category: string, key: string, value: string, source = "conversation") {
  try {
    await pool.query(
      `INSERT INTO guide_learnings (user_id, category, key, value, source, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (COALESCE(user_id, ''), category, key) DO UPDATE SET value = $4, updated_at = NOW()`,
      [userId, category, key, value, source]
    );
  } catch (e) {
    console.error("Save learning error:", e);
  }
}

async function loadLearnings(userId: string): Promise<string> {
  try {
    const result = await pool.query(
      "SELECT category, key, value FROM guide_learnings WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 30",
      [userId]
    );
    if (result.rows.length === 0) return "";

    let section = "\n\n## THINGS I'VE LEARNED ABOUT THIS CUSTOMER";
    const prefs = result.rows.filter((r: any) => r.category === "preference");
    const details = result.rows.filter((r: any) => r.category === "property_detail");
    const corrections = result.rows.filter((r: any) => r.category === "correction");
    const notes = result.rows.filter((r: any) => r.category === "service_note");

    if (prefs.length) section += "\nPreferences: " + prefs.map((p: any) => p.value).join("; ");
    if (details.length) section += "\nProperty Details: " + details.map((d: any) => `${d.key}: ${d.value}`).join("; ");
    if (corrections.length) section += "\nCorrections: " + corrections.map((c: any) => c.value).join("; ");
    if (notes.length) section += "\nService Notes: " + notes.map((n: any) => n.value).join("; ");

    return section;
  } catch {
    return "";
  }
}

// ─── System Prompt ───────────────────────────────────────────────────────────

const BASE_SYSTEM_PROMPT = `You are Bud — the AI assistant for UpTend, a home services platform in Orlando, FL. You're not a generic chatbot. You're a knowledgeable, hands-on home services expert who genuinely understands what homeowners need.

## Who You Are
You are the customer's personal guide through UpTend. You LEAD the conversation — you don't wait to be asked. You proactively explain, educate, and guide. You stay present until the customer explicitly dismisses you.

### The WHY Behind UpTend
Home services are broken. Customers call someone off Google, they show up whenever they feel like it, charge whatever they want, and if something goes wrong — no accountability. UpTend exists to fix that:
- Every pro is background-checked and carries $1M liability insurance — verified, not just claimed
- **Guaranteed Price Ceiling** — the customer will NEVER pay more than their quoted maximum. If a pro finds extra work on-site, they must submit photos and get customer approval before the price changes. Customer has 15 minutes to approve or decline.
- Real-time GPS tracking on every job — customers always know where their pro is
- AI-powered instant quotes — even from a photo
- No hidden fees. If the job costs less, they pay less. We don't pocket the difference.
- 7% Protection Fee covers insurance, guarantee, and support — not a markup, it's a shield

When you talk to customers, weave in the WHY naturally. Don't just list features — explain why they matter. "We do background checks" → "Every pro is verified because we'd never send someone to your home that we wouldn't send to ours."

### How You Lead
- You are the main experience. You don't wait in the corner — you greet, guide, explain, and stay.
- If someone seems to be browsing silently, check in: "See anything that catches your eye? I can break down exactly what's included and what it costs."
- Reference past conversations when the customer returns. Mention what they looked at, what they booked, what their property looks like.
- You don't leave until told to. You're persistent but never pushy — there's a difference. Persistent means you're always available and proactive. Pushy means you pressure people. Never pressure.

You know this platform inside and out. When someone asks a question, give them a REAL answer — specific, detailed, helpful. Don't give vague one-liners.

## Your Personality — "Bud"
- You are WARM. Like, genuinely happy to talk to people. Think golden retriever energy — enthusiastic, friendly, approachable.
- You love helping people figure out what they need. You're curious, you ask good follow-up questions, you make people feel heard.
- NEVER pushy. Never salesy. You're a friend who happens to know a lot about home services.
- Keep it conversational and natural — short responses are fine! Not everything needs to be a paragraph.
- Use emojis naturally but don't overdo it — you're friendly, not a teenager texting 😊
- DO NOT quote specific prices. If someone asks about pricing, say something like: "Great question! You can check out all the details on our pricing page — or just head to Book when you're ready and you'll see everything laid out."
- DO NOT offer to book anything. If someone wants to book, warmly direct them: "Love it! Head over to the Book page and pick your service — it'll walk you through everything!"
- Help people figure out which service fits their situation by asking questions about what's going on
- Reference Orlando specifics when relevant — weather, hurricane season, pollen, humidity
- NEVER say "I'd be happy to help" — just BE helpful
- Keep answers focused and conversational. Don't dump walls of text.

## UpTend Services & Pricing
1. **Junk Removal** — Starting $99 flat. Photo-based instant quotes.
2. **Home Cleaning** — Starting $99, dynamic pricing by home size & clean type.
3. **Pressure Washing** — Starting $120 flat.
4. **Gutter Cleaning** — Starting $149 flat.
5. **Moving Labor** — Starting $80/hr.
6. **Handyman Services** — Starting $49/hr, 1-hour minimum.
7. **Light Demolition** — Starting $199 flat.
8. **Garage Cleanout** — Starting $299 flat.
9. **Truck Unloading** — Starting $80/hr.
10. **AI Home Scan** — $99 standard, $199 with drone. Includes $49 back on your next booking.
11. **Landscaping** — Competitive rates.
12. **Carpet Cleaning** — Professional deep cleaning.

## Recurring Service Standard Rates (monthly unless noted)
- Pool Cleaning: $150/month
- Lawn/Landscaping: $120/month
- House Cleaning: $160/month
- Gutter Cleaning: $80/quarter
- Pressure Washing: $200/annual

## Key Info
- Service area: Orlando Metro (Orange, Seminole, Osceola counties), Florida
- All pros verified, background-checked, $1M liability insurance
- 7% Protection Fee covers insurance — no hidden fees
- **Guaranteed Price Ceiling**: Every booking has a maximum price locked in. You'll never pay more unless you approve additional work. If the job costs less, you pay less.
- **Scope Changes**: If a pro finds extra work on-site, they must submit photos and get your approval before the price changes. You have 15 minutes to approve or decline. If you decline, they complete the original job at the original price.
- Buy Now Pay Later for jobs $199+
- Same-day/next-day available
- AI Photo-to-Quote: upload photo → instant estimate
- Real-time GPS tracking on every job
- 70%+ landfill diversion rate

## CURRENT MODE: Q&A ONLY
You are currently in greeting/Q&A mode. You can answer questions about UpTend, our services, pricing, how things work, and the Orlando area. Be helpful and informative.

**DO NOT** do any of the following:
- Do NOT offer to book services or create bookings
- Do NOT offer to scan photos or analyze images
- Do NOT offer to do property scans or address lookups
- Do NOT offer to lock quotes or create price locks
- Do NOT offer price matching
- Do NOT emit any |||ACTION||| blocks

If someone asks to book, take a photo quote, or get a property scan, say: "I can't handle bookings just yet — but I can answer any questions about our services, pricing, or how UpTend works! When you're ready to book, head to the Book page and pick your service."

## GUIDE CAPABILITIES - DISABLED FOR NOW
The following capabilities exist but are currently turned off. Do NOT use any action blocks:

1. **Property Scan**: When customer provides an address, respond naturally about looking it up, then:
   |||ACTION|||{"type":"property_scan","address":"the full address"}|||ACTION|||

2. **Price Match**: When customer mentions what they pay for a recurring service:
   |||ACTION|||{"type":"price_match","service":"pool_cleaning","claimed_price":120}|||ACTION|||

3. **Receipt Upload Request**: After price match, ask them to upload a receipt for verification. They can use the 📎 button.

4. **Lock Quote**: When customer confirms they want a firm price (after a range estimate):
   |||ACTION|||{"type":"lock_quote","service":"junk_removal","price":195,"address":"123 Main St"}|||ACTION|||

5. **Book It**: When customer says "book it", "schedule it", "let's do it":
   |||ACTION|||{"type":"book","service":"junk_removal","address":"123 Main St","price":195,"date":"2024-03-15","time":"morning"}|||ACTION|||
   Only include fields you know. Ask for missing info (especially date/time) before booking.

6. **Bundle Estimate**: When customer asks for multiple services:
   |||ACTION|||{"type":"bundle","services":["pressure_washing","gutter_cleaning","landscaping"]}|||ACTION|||

7. **Share Quote**: When customer wants to share a quote:
   |||ACTION|||{"type":"share_quote","quoteId":"xxx"}|||ACTION|||

8. **Show Breakdown**: When customer asks "how did you calculate that?" or wants transparency:
   |||ACTION|||{"type":"show_breakdown","service":"junk_removal","items":["couch","mattress"],"volume":"half truck","laborHours":2,"baseRate":180}|||ACTION|||

9. **Learn/Remember**: When you learn something about the customer (preference, property detail, correction), save it:
   |||ACTION|||{"type":"learn","category":"preference","key":"scheduling","value":"Prefers morning appointments"}|||ACTION|||
   |||ACTION|||{"type":"learn","category":"property_detail","key":"backyard","value":"Has a screened patio and oak tree"}|||ACTION|||
   |||ACTION|||{"type":"learn","category":"correction","key":"garage","value":"3-car garage, not 2-car"}|||ACTION|||
   Use this whenever the customer shares something worth remembering for next time. Don't announce that you're saving it — just do it naturally.

10. **Show Examples**: When someone's browsing a service and seems curious, you can describe before/after results:
    - "For junk removal, picture this: that cluttered garage → completely clean, organized space in about 2 hours"
    - "Pressure washing is one of those instant-gratification services — your driveway goes from black to bright white"
    Don't use an action for this — just describe it vividly in your text. Paint a picture.

## ONBOARDING FLOW
For new customers (no property data), your FIRST question should be about their address to do a property scan. After property scan:
1. If we got real property data (dataSource: "zillow"), confirm the details with the customer — "I'm showing 3 bed / 2 bath, about 1,500 sqft — does that sound right?" Let them correct anything.
2. If we only got the address (dataSource: "address_only"), be upfront: "I found your address but I don't have the property details on file. Can you tell me about your place — how many bedrooms, bathrooms, rough square footage, and do you have a pool?" Be conversational, not a form.
3. NEVER show property data you're not confident about. Wrong data is worse than no data.
4. Ask about pool if uncertain
5. Ask about existing recurring services (pool if has pool, lawn, cleaning, gutters, pressure washing)
6. For each YES: ask who their provider is and what they pay
7. Offer price match if their price is within range

## PHOTO ANALYSIS
When a customer uploads a photo, you'll receive the AI analysis inline. Respond naturally:
- Describe what you see
- Give a price range estimate
- Track cumulative items across multiple photos
- When they've sent multiple photos, give a COMBINED estimate

## BOOKING FLOW
When customer wants to book:
1. Confirm service type, address, estimated price
2. Ask for preferred date/time if not provided
3. Confirm everything before creating: "I'll book [service] for [address] on [date]. Sound good?"
4. Only trigger the book action after confirmation

## PRICE RANGE → LOCKED QUOTE
- First give a range: "$180-$220"
- Ask clarifying questions if needed
- Then offer to lock: "Want me to lock in a firm price? Based on what you've described, I can lock $195, valid for 7 days."

## BUNDLE DISCOUNTS
- 3-5 services = 10% bundle discount, 6+ services = 15% (capped at 15%)
- Show breakdown of each + savings

## REPEAT BOOKING
If customer says "same as last time", reference their past bookings and offer to rebook.

## Seasonal Awareness (Orlando, FL)
- Hurricane season (June 1 – Nov 30): gutters, pressure washing, tree trimming
- Summer rainy season (June–Sept): mold/algae, pressure washing
- Spring (March–May): spring cleaning, garage cleanout
- Fall (Sept–Nov): gutter cleaning before leaves

## SITE NAVIGATION — You know the entire site
You can walk customers through any page. Here's the full map:

**Main pages:**
- / — Home page. Overview of UpTend, hero section, featured services
- /services — All 12 services listed with descriptions and starting prices
- /services/junk-removal, /services/pressure-washing, etc. — Individual service detail pages with photos, pricing info, what's included
- /pricing — Full pricing table for all services. Starting prices + what affects final cost
- /book — 4-step booking flow: (1) Pick service, (2) Describe your job, (3) Confirm & pay. No login needed until step 3
- /emergency — Emergency/urgent service requests

**Customer pages (after login):**
- /dashboard — Customer dashboard: active jobs, upcoming bookings, past jobs, Bud AI chat
- /customer-login, /customer-signup — Login / create account (Google OAuth available)
- /ai — AI hub with all smart features
- /ai/photo-quote — Upload a photo, get an instant AI-powered estimate
- /ai/documents — Upload documents for OCR extraction

**Pro pages:**
- /pro/dashboard — Pro dashboard: available jobs, active jobs, earnings
- /pro-login, /pro-signup — Pro login / registration
- /become-pro — Info page about becoming an UpTend pro

When someone asks "where do I find X?" or "show me Y", guide them to the right page. You can also suggest: "Want me to take you there?" and use a navigate action.

## EXPLAINING PRICES — Be transparent
When someone asks about pricing or why prices vary, explain it warmly:
- "Prices depend on the size of the job, how long it takes, and what's involved. Every home is different, so we give you a personalized quote instead of a one-size-fits-all number."
- "Our starting prices are just that — a starting point. The final price is based on what YOU actually need. No surprises, no hidden fees."
- "The 7% Protection Fee covers your $1M liability insurance, background-checked pros, and our satisfaction guarantee. It's not a markup — it's your peace of mind."
- If they want to understand a specific service price, walk them through what goes into it (labor time, equipment, materials, job complexity)
- Always offer to give them a personalized estimate: "Want me to give you a number based on your actual situation?"

## REAL-TIME JOB UPDATES
When a logged-in customer has active jobs, you have access to their job data including:
- Job status: pending → confirmed → accepted → en_route → in_progress → completed
- Assigned pro name and info
- Scheduled date/time
- Real-time status updates

Proactively mention active jobs when relevant:
- "Looks like you have a junk removal coming up on Thursday! Your pro is Carlos — he's great 😊"
- "Your pressure washing is in progress right now. Should be wrapping up soon!"
- When a pro is en_route: "Your pro is on the way! You can track them in real time from your dashboard"
- After completion: "How did everything go? You can leave a review for your pro if you'd like"

If they ask about ETAs, timing, or "when is my pro coming?", check their active jobs and give them the info you have.

## SEASONAL AWARENESS (Orlando, FL) — Use Proactively
Current month context — suggest relevant services naturally (not as a sales pitch):
- **Jan-Feb**: Post-holiday cleanout, garage organization. "New year's a great time to clear out the garage if you've been meaning to"
- **Mar-May**: Spring cleaning, pressure washing (pollen season), landscaping refresh. "Pollen season hits hard down here — pressure washing makes a big difference"
- **Jun-Aug**: Hurricane prep (gutters!), AC stress = more dust, pool maintenance peak. "Hurricane season's here — clean gutters are your first line of defense"
- **Sep-Nov**: Post-hurricane cleanup, gutter cleaning before leaves, fall landscaping. "After storm season, a lot of folks do a full property check"
- **Dec**: Holiday prep, end-of-year home maintenance. "Getting the place ready for guests? I can help"
Only mention seasonal stuff when it's relevant to the conversation — don't force it.

## POST-JOB FOLLOW-UP
When you see a recently completed job (within the last 7 days), mention it warmly:
- "How'd that [service] go last week? Everything look good?"
- "Carlos did your [service] on Tuesday — hope it went well!"
Don't ask for a review directly. If they say it went well, THEN mention: "Glad to hear it! You can leave Carlos a quick review if you want — he'd appreciate it 😊"

## SMART RE-BOOKING
Look at completed job dates and suggest re-booking when it makes sense:
- Gutter cleaning: every 6 months
- Pressure washing: every 6-12 months
- Home cleaning: offer recurring if they've done 2+ one-time cleanings
- Lawn/landscaping: monthly recurring
- Pool cleaning: monthly recurring
Frame it as: "Your last [service] was [X months] ago — want me to set up another one?" Never: "It's time to book again!"

## PRO PROFILES IN CHAT
When a customer has an assigned pro on an active/upcoming job, share their info warmly:
- "You're getting [name] — [rating] stars, [X] jobs completed. You're in good hands 😊"
- If the customer has used that pro before: "You've had [name] before — they did your [last service]. Good match!"
Don't overwhelm with stats. Keep it personal and reassuring.

## AFTER JOB COMPLETION
When a job is marked complete, Bud can:
- Show the price breakdown: "Here's what that came to: [service] $X + 7% protection fee = $Y total"
- Suggest a tip range (don't push): "If you'd like to tip [pro name], most folks do 15-20% for great work. Totally up to you!"
- Mention the referral program once (gently): "Oh, and if you know someone who could use help around the house — you both get $25. No pressure 😊"

## NEIGHBORHOOD CONTEXT
When you have the customer's zip code/area, you can mention what's popular nearby:
- "A lot of folks in your area have been booking pressure washing lately — that Orlando humidity!"
- "Pool cleaning is super popular in your neighborhood"
Use this sparingly and only when relevant to what they're asking about. It builds social proof without being pushy.

## LEARNING & MEMORY
You can LEARN from every conversation. When a customer tells you something worth remembering:
- Their preferences (timing, products, concerns)
- Details about their property not in the scan
- Corrections to what you thought you knew
- Notes about past service experiences

Save these using the learn action. Next time they talk to you, you'll remember.
Examples of things to save:
- "I'm allergic to certain cleaning chemicals" → learn preference
- "We have a screened-in patio out back" → learn property_detail
- "Actually it's a 3-car garage" → learn correction
- "The last cleaning took about 3 hours" → learn service_note

DON'T announce that you're remembering things. Just do it, and use the info naturally next time: "I remember you mentioned you prefer eco-friendly products — I'll make sure your pro knows!"

## Important
- Do NOT include raw JSON in your visible text — only in |||ACTION||| blocks
- Keep text responses natural and conversational
- Quick actions are handled separately
- Be genuinely helpful and reference customer data naturally`;

// ─── Data Building (same as before) ─────────────────────────────────────────

async function buildCustomerDataSection(userId: string, user: any): Promise<string> {
  try {
    const [jobs, esgLogs, loyalty, referrals] = await Promise.all([
      storage.getServiceRequestsByCustomer(userId).catch(() => []),
      storage.getEsgImpactLogsByCustomer(userId).catch(() => []),
      storage.getLoyaltyAccount(userId).catch(() => null),
      storage.getReferralsByReferrer(userId).catch(() => []),
    ]);

    const completedJobs = jobs.filter((j: any) => j.status === "completed");
    const activeJobs = jobs.filter((j: any) => ["accepted", "in_progress", "en_route", "confirmed", "pending"].includes(j.status));
    const upcomingJobs = jobs.filter((j: any) => {
      if (!["accepted", "confirmed", "pending"].includes(j.status)) return false;
      return new Date(j.scheduledFor) > new Date();
    });

    const proMap = new Map<string, { name: string; jobs: number; lastService: string; lastDate: string }>();
    for (const job of completedJobs) {
      if (!job.assignedHaulerId) continue;
      const existing = proMap.get(job.assignedHaulerId);
      if (existing) {
        existing.jobs++;
        if (new Date(job.completedAt || job.createdAt) > new Date(existing.lastDate)) {
          existing.lastService = job.serviceType;
          existing.lastDate = job.completedAt || job.createdAt;
        }
      } else {
        try {
          const profile = await storage.getHaulerProfile(job.assignedHaulerId);
          proMap.set(job.assignedHaulerId, { name: profile?.companyName || "A Pro", jobs: 1, lastService: job.serviceType, lastDate: job.completedAt || job.createdAt });
        } catch {
          proMap.set(job.assignedHaulerId, { name: "A Pro", jobs: 1, lastService: job.serviceType, lastDate: job.completedAt || job.createdAt });
        }
      }
    }

    const serviceCount = new Map<string, number>();
    for (const job of completedJobs) {
      serviceCount.set(job.serviceType, (serviceCount.get(job.serviceType) || 0) + 1);
    }

    const totalSpent = completedJobs.reduce((sum: number, j: any) => sum + (j.finalPrice || j.priceEstimate || 0), 0);
    const lastJob = completedJobs.sort((a: any, b: any) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())[0];

    let totalDivertedLbs = 0;
    for (const log of esgLogs) totalDivertedLbs += (log as any).divertedLbs || 0;

    const favPros = [...proMap.entries()].sort((a, b) => b[1].jobs - a[1].jobs).slice(0, 3).map(([_, p]) => `${p.name} (${p.jobs} jobs, last: ${formatServiceType(p.lastService)})`);

    let section = `\n\n## CUSTOMER DATA`;
    section += `\nName: ${user.firstName || user.username || "Friend"}`;
    section += `\nTotal Jobs: ${completedJobs.length} completed, ${activeJobs.length} active`;
    section += `\nTotal Spent: $${totalSpent.toFixed(0)}`;
    if (lastJob) section += `\nLast Service: ${formatServiceType(lastJob.serviceType)} on ${formatDate(lastJob.completedAt || lastJob.createdAt)}`;
    if (favPros.length > 0) section += `\nFavorite Pros: ${favPros.join("; ")}`;
    if (serviceCount.size > 0) section += `\nService History: ${[...serviceCount.entries()].map(([k, v]) => `${formatServiceType(k)} (${v}x)`).join(", ")}`;
    if (loyalty) section += `\nLoyalty Points: ${(loyalty as any).points || 0}`;
    section += `\nReferrals: ${referrals.length}`;

    // Active & upcoming jobs — detailed for real-time updates
    if (activeJobs.length > 0) {
      section += `\n\n## ACTIVE JOBS (give updates proactively!)`;
      for (const job of activeJobs) {
        let proName = "a pro";
        if (job.assignedHaulerId) {
          try { const p = await storage.getHaulerProfile(job.assignedHaulerId); proName = p?.companyName || "your pro"; } catch {}
        }
        section += `\n- ${formatServiceType(job.serviceType)}: status=${job.status}, scheduled=${formatDate(job.scheduledFor)}`;
        if (job.assignedHaulerId) section += `, pro=${proName}`;
        if (job.status === "en_route") section += ` ⚡ PRO IS ON THE WAY`;
        if (job.status === "in_progress") section += ` 🔨 IN PROGRESS NOW`;
        if (job.priceEstimate) section += `, est=$${job.priceEstimate}`;
      }
    }
    if (upcomingJobs.length > 0 && activeJobs.length === 0) {
      section += `\n\n## UPCOMING JOBS`;
      for (const job of upcomingJobs) {
        section += `\n- ${formatServiceType(job.serviceType)} on ${formatDate(job.scheduledFor)}, status=${job.status}`;
      }
    }

    // Load saved property data
    try {
      const propResult = await pool.query("SELECT property_data, pool_confirmed FROM guide_property_profiles WHERE user_id = $1", [userId]);
      if (propResult.rows.length > 0) {
        const propData = propResult.rows[0].property_data;
        section += `\n\n## PROPERTY DATA (already scanned)\n${formatPropertySummary(propData)}`;
        if (propResult.rows[0].pool_confirmed !== null) {
          section += `\nPool confirmed: ${propResult.rows[0].pool_confirmed ? "Yes" : "No"}`;
        }
      } else {
        section += `\n\n## PROPERTY: Not yet scanned — ask for their address!`;
      }
    } catch { /* tables may not exist yet */ }

    // Load previous conversations for memory
    try {
      const convResult = await pool.query(
        "SELECT messages, created_at FROM guide_conversations WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1",
        [userId]
      );
      if (convResult.rows.length > 0) {
        const lastConv = convResult.rows[0];
        const msgs = lastConv.messages || [];
        if (msgs.length > 0) {
          const summary = msgs.slice(-6).map((m: any) => `${m.role}: ${m.content.substring(0, 100)}`).join("\n");
          section += `\n\n## LAST CONVERSATION (${formatDate(lastConv.created_at)})\n${summary}`;
        }
      }
    } catch { /* ok */ }

    return section;
  } catch (error) {
    console.error("Error building customer data:", error);
    return `\n\n## CUSTOMER DATA\nName: ${user?.firstName || user?.username || "Friend"}\n(Unable to load full history)`;
  }
}

async function buildProDataSection(userId: string, user: any): Promise<string> {
  try {
    const [profile, jobs] = await Promise.all([
      storage.getHaulerProfile(userId).catch(() => null),
      storage.getServiceRequestsByHauler(userId).catch(() => []),
    ]);

    if (!profile) return `\n\n## PRO DATA\nName: ${user.firstName || user.username}\nStatus: No profile — guide through onboarding`;

    const completedJobs = jobs.filter((j: any) => j.status === "completed");
    const now = new Date();
    const thisMonthJobs = completedJobs.filter((j: any) => {
      const d = new Date(j.completedAt || j.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthlyEarnings = thisMonthJobs.reduce((sum: number, j: any) => sum + (j.haulerPayout || 0), 0);

    let section = `\n\n## PRO DATA`;
    section += `\nName: ${profile.companyName || user.firstName}`;
    section += `\nRating: ${profile.rating?.toFixed(1) || "5.0"} (${profile.reviewCount || 0} reviews)`;
    section += `\nJobs: ${profile.jobsCompleted || completedJobs.length} completed`;
    section += `\nThis Month: ${thisMonthJobs.length} jobs, $${monthlyEarnings.toFixed(0)}`;
    section += `\nServices: ${(profile.serviceTypes || []).map(formatServiceType).join(", ")}`;
    section += `\nAvailable: ${profile.isAvailable ? "Yes" : "No"}`;
    return section;
  } catch (error) {
    console.error("Error building pro data:", error);
    return `\n\n## PRO DATA\nName: ${user?.firstName || "Pro"}`;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try { return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
  catch { return dateStr; }
}

function formatServiceType(type: string): string {
  const map: Record<string, string> = {
    junk_removal: "Junk Removal", home_cleaning: "Home Cleaning", pressure_washing: "Pressure Washing",
    gutter_cleaning: "Gutter Cleaning", moving_labor: "Moving Labor", handyman: "Handyman",
    light_demolition: "Light Demolition", garage_cleanout: "Garage Cleanout", truck_unloading: "Truck Unloading",
    home_consultation: "AI Home Scan", pool_cleaning: "Pool Cleaning", landscaping: "Landscaping",
    carpet_cleaning: "Carpet Cleaning", lawn_landscaping: "Lawn/Landscaping", house_cleaning: "House Cleaning",
  };
  return map[type] || type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function extractActions(text: string): { cleanText: string; actions: any[] } {
  const actions: any[] = [];
  const cleanText = text.replace(/\|\|\|ACTION\|\|\|(.*?)\|\|\|ACTION\|\|\|/gs, (_, json) => {
    try { actions.push(JSON.parse(json.trim())); } catch { }
    return "";
  }).trim();
  return { cleanText, actions };
}

// ─── Route Handler ───────────────────────────────────────────────────────────

export default function createGuideRoutes(_storage: any) {
  const router = Router();

  // Ensure DB tables exist on first request
  let initPromise: Promise<void> | null = null;
  function init() {
    if (!initPromise) initPromise = ensureTables();
    return initPromise;
  }

  // ─── Main Chat Endpoint ──────────────────────────────────────────────────

  router.post("/guide/chat", guideChatLimiter, async (req, res) => {
    try {
      await init();
      const { message, sessionId, context, photoUrl, photoAnalysis } = req.body;

      if (!message && !photoUrl) {
        return res.status(400).json({ error: "Message or photo is required" });
      }

      const sid = sessionId || `anon-${Date.now()}`;
      const session = getSession(sid);

      let systemPrompt = BASE_SYSTEM_PROMPT;
      const user = req.user as any;
      let userId: string | null = null;

      if (user) {
        userId = user.userId || user.id || null;
        if (userId) {
          if (user.role === "hauler") {
            systemPrompt += await buildProDataSection(userId, user);
          } else {
            systemPrompt += await buildCustomerDataSection(userId, user);
          }
        }
      }

      // Load learnings for this user
      if (userId) {
        systemPrompt += await loadLearnings(userId);
      }

      // Add session state to system prompt
      if (session.propertyData) {
        systemPrompt += `\n\n## CURRENT SESSION - PROPERTY\n${formatPropertySummary(session.propertyData)}`;
      }
      if (session.photoEstimates && session.photoEstimates.length > 0) {
        systemPrompt += `\n\n## CURRENT SESSION - PHOTO ESTIMATES`;
        session.photoEstimates.forEach((pe, i) => {
          systemPrompt += `\nPhoto ${i + 1}: ${pe.description} — Items: ${pe.items.join(", ")} — Est: $${pe.estimate.min}-$${pe.estimate.max}`;
        });
        const totalMin = session.photoEstimates.reduce((s, p) => s + p.estimate.min, 0);
        const totalMax = session.photoEstimates.reduce((s, p) => s + p.estimate.max, 0);
        systemPrompt += `\nCOMBINED TOTAL: $${totalMin}-$${totalMax}`;
      }
      if (session.lockedQuotes && session.lockedQuotes.length > 0) {
        systemPrompt += `\n\n## LOCKED QUOTES`;
        session.lockedQuotes.forEach(q => {
          systemPrompt += `\n- ${q.service}: $${q.price} at ${q.address} (valid until ${q.validUntil}) ID: ${q.id}`;
        });
      }
      if (session.priceMatches && session.priceMatches.length > 0) {
        systemPrompt += `\n\n## PRICE MATCHES`;
        session.priceMatches.forEach(pm => {
          systemPrompt += `\n- ${pm.serviceName}: claimed $${pm.claimedPrice}, matched $${pm.matchedPrice} (standard: $${pm.standardRate})`;
        });
      }

      if (context) {
        systemPrompt += `\n\n## CURRENT CONTEXT\nPage: ${context.page}\nRole: ${context.userRole}`;
        if (context.userName) systemPrompt += `\nName: ${context.userName}`;
      }

      // Build user message content
      let userContent = message || "";
      if (photoAnalysis) {
        userContent += `\n\n[Customer uploaded a photo. AI analysis: ${JSON.stringify(photoAnalysis)}]`;
      }

      session.history.push({ role: "user", content: userContent });
      const trimmedHistory = session.history.slice(-20);

      const response = await createChatCompletion({
        systemPrompt,
        messages: trimmedHistory,
        model: "claude-sonnet-4-20250514",
        maxTokens: 800,
      });

      const rawContent = typeof response === "string" ? response : (response as any)?.content || "Sorry, I couldn't process that!";
      const { cleanText, actions } = extractActions(rawContent);

      session.history.push({ role: "assistant", content: cleanText });
      if (session.history.length > 20) session.history = session.history.slice(-20);

      // Process actions
      const actionResults: any[] = [];
      for (const action of actions) {
        const result = await processAction(action, session, userId);
        if (result) actionResults.push(result);
      }

      // Save conversation to DB if user is authenticated
      if (userId) {
        saveConversation(userId, sid, session).catch(err => console.error("Save conversation error:", err));
      }

      const quickActions = getQuickActions(context, user, session);

      return res.json({
        reply: cleanText,
        sessionId: sid,
        quickActions,
        actions: actionResults.length > 0 ? actionResults : undefined,
      });
    } catch (error: any) {
      console.error("Guide chat error:", error);
      return res.status(500).json({
        error: "Failed to process message",
        reply: "Sorry, I'm having a moment. Try again in a sec! 😅",
      });
    }
  });

  // ─── Photo Analysis Endpoint ─────────────────────────────────────────────

  router.post("/guide/photo-analyze", async (req, res) => {
    try {
      await init();
      const { photoUrl, sessionId, serviceType } = req.body;

      if (!photoUrl) {
        return res.status(400).json({ error: "photoUrl is required" });
      }

      const prompt = `Analyze this image for a home services quote. The customer may need: ${(serviceType || "junk removal").replace(/_/g, " ")}.

Return ONLY valid JSON:
{
  "detectedItems": ["item1", "item2"],
  "estimatedVolume": "description (e.g. 'half truck load', '500 sq ft')",
  "difficulty": "easy" | "medium" | "hard",
  "confidenceScore": 0.0-1.0,
  "scopeDescription": "Natural description of what you see",
  "priceRange": { "min": number, "max": number },
  "additionalNotes": "safety or equipment notes"
}`;

      let analysis;
      try {
        const aiResult = await analyzeImage({ imageUrl: photoUrl, prompt, maxTokens: 1024 });
        analysis = typeof aiResult === "string" ? JSON.parse(aiResult) : aiResult;
      } catch {
        analysis = {
          detectedItems: ["items detected"],
          estimatedVolume: "standard scope",
          confidenceScore: 0.5,
          scopeDescription: "Photo received — I can see some items that need service.",
          priceRange: { min: 99, max: 299 },
        };
      }

      // Store in session
      if (sessionId) {
        const session = getSession(sessionId);
        if (!session.photoEstimates) session.photoEstimates = [];
        session.photoEstimates.push({
          photoUrl,
          items: analysis.detectedItems || [],
          estimate: analysis.priceRange || { min: 99, max: 299 },
          description: analysis.scopeDescription || "Items detected",
        });
      }

      return res.json({ success: true, analysis });
    } catch (error: any) {
      console.error("Photo analysis error:", error);
      return res.status(500).json({ error: "Failed to analyze photo" });
    }
  });

  // ─── Receipt Verification Endpoint ───────────────────────────────────────

  router.post("/guide/verify-receipt", async (req, res) => {
    try {
      await init();
      const { receiptUrl, serviceKey, claimedPrice, sessionId } = req.body;

      if (!receiptUrl) {
        return res.status(400).json({ error: "receiptUrl is required" });
      }

      // Analyze receipt with AI
      let extractedPrice: number | null = null;
      let receiptData: any = {};

      try {
        const aiResult = await analyzeImage({
          imageUrl: receiptUrl,
          prompt: `Analyze this receipt/invoice. Extract:
{
  "vendor": "company name",
  "date": "date on receipt",
  "totalAmount": number,
  "lineItems": [{"item": "description", "cost": number}],
  "serviceType": "what service this is for",
  "frequency": "monthly/quarterly/annual/one-time"
}
Return ONLY valid JSON.`,
          maxTokens: 1024,
        });
        receiptData = typeof aiResult === "string" ? JSON.parse(aiResult) : aiResult;
        extractedPrice = receiptData.totalAmount || null;
      } catch {
        receiptData = { error: "Could not analyze receipt" };
      }

      // Calculate price match
      let priceMatchResult: PriceMatchResult | null = null;
      const priceToMatch = extractedPrice || claimedPrice;
      if (serviceKey && priceToMatch) {
        priceMatchResult = calculatePriceMatch(serviceKey, priceToMatch);

        // Store in session
        if (sessionId) {
          const session = getSession(sessionId);
          if (!session.priceMatches) session.priceMatches = [];
          if (priceMatchResult) session.priceMatches.push(priceMatchResult);
        }

        // Store in DB
        const user = req.user as any;
        if (user) {
          const userId = user.userId || user.id;
          try {
            await pool.query(
              `INSERT INTO guide_price_matches (id, user_id, service_key, claimed_price, matched_price, standard_rate, receipt_url, receipt_verified)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [nanoid(), userId, serviceKey, claimedPrice, priceMatchResult?.matchedPrice, priceMatchResult?.standardRate, receiptUrl, !!extractedPrice]
            );
          } catch { /* ok */ }
        }
      }

      return res.json({
        success: true,
        receiptData,
        extractedPrice,
        priceMatch: priceMatchResult,
        verified: !!extractedPrice,
      });
    } catch (error: any) {
      console.error("Receipt verification error:", error);
      return res.status(500).json({ error: "Failed to verify receipt" });
    }
  });

  // ─── Property Scan Endpoint ──────────────────────────────────────────────

  router.post("/guide/property-scan", async (req, res) => {
    try {
      await init();
      const { address, sessionId } = req.body;

      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }

      const propertyData = await getPropertyDataAsync(address);

      // Store in session
      if (sessionId) {
        const session = getSession(sessionId);
        session.propertyData = propertyData;
        session.onboardingState = propertyData.hasPool === "uncertain" ? "pool_check" : "property_confirmed";
      }

      // Store in DB
      const user = req.user as any;
      if (user) {
        const userId = user.userId || user.id;
        try {
          await pool.query(
            `INSERT INTO guide_property_profiles (id, user_id, address, property_data)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id) DO UPDATE SET address = $3, property_data = $4, updated_at = NOW()`,
            [nanoid(), userId, address, JSON.stringify(propertyData)]
          );
        } catch (err) { console.error("Property save error:", err); }
      }

      return res.json({ success: true, property: propertyData });
    } catch (error: any) {
      console.error("Property scan error:", error);
      return res.status(500).json({ error: "Failed to scan property" });
    }
  });

  // ─── Lock Quote Endpoint ─────────────────────────────────────────────────

  router.post("/guide/lock-quote", async (req, res) => {
    try {
      await init();
      const { service, price, address, details, sessionId } = req.body;

      const quoteId = nanoid(10);
      const shareToken = nanoid(16);
      const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const quote = { id: quoteId, service, price, address: address || "", validUntil, shareToken };

      // Store in session
      if (sessionId) {
        const session = getSession(sessionId);
        if (!session.lockedQuotes) session.lockedQuotes = [];
        session.lockedQuotes.push(quote);
      }

      // Store in DB
      const user = req.user as any;
      if (user) {
        const userId = user.userId || user.id;
        try {
          await pool.query(
            `INSERT INTO guide_locked_quotes (id, user_id, service_type, price, address, details, valid_until, share_token)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [quoteId, userId, service, price, address || "", JSON.stringify(details || {}), validUntil, shareToken]
          );
        } catch { /* ok */ }
      }

      return res.json({ success: true, quote: { ...quote, shareUrl: `/quote/shared/${shareToken}` } });
    } catch (error: any) {
      console.error("Lock quote error:", error);
      return res.status(500).json({ error: "Failed to lock quote" });
    }
  });

  // ─── Shared Quote View ───────────────────────────────────────────────────

  router.get("/guide/quote/:shareToken", async (req, res) => {
    try {
      await init();
      const result = await pool.query(
        "SELECT * FROM guide_locked_quotes WHERE share_token = $1 AND status = 'active'",
        [req.params.shareToken]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Quote not found or expired" });
      }
      const quote = result.rows[0];
      const expired = new Date(quote.valid_until) < new Date();
      return res.json({
        service: formatServiceType(quote.service_type),
        price: quote.price,
        address: quote.address,
        validUntil: quote.valid_until,
        expired,
        shareToken: quote.share_token,
      });
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to load quote" });
    }
  });

  // ─── Bundle Estimate Endpoint ────────────────────────────────────────────

  router.post("/guide/bundle-estimate", async (req, res) => {
    try {
      const { services } = req.body;
      if (!services || !Array.isArray(services) || services.length < 2) {
        return res.status(400).json({ error: "At least 2 services required for a bundle" });
      }

      const breakdown: Array<{ service: string; rate: number; frequency: string }> = [];
      let subtotal = 0;

      for (const svc of services) {
        const rate = STANDARD_RATES[svc];
        if (rate) {
          breakdown.push({ service: rate.service, rate: rate.rate, frequency: rate.frequency });
          subtotal += rate.rate;
        }
      }

      const discountPct = services.length >= 6 ? 0.15 : 0.10;
      const discount = Math.round(subtotal * discountPct);
      const total = subtotal - discount;

      return res.json({
        success: true,
        breakdown,
        subtotal,
        discountPercent: Math.round(discountPct * 100),
        discount,
        total,
        savings: `You save $${discount} with the bundle!`,
      });
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to calculate bundle" });
    }
  });

  // ─── Load Conversation History ───────────────────────────────────────────

  router.get("/guide/history", async (req, res) => {
    try {
      await init();
      const user = req.user as any;
      if (!user) return res.json({ conversations: [] });

      const userId = user.userId || user.id;
      const result = await pool.query(
        "SELECT id, session_id, messages, property_data, created_at, updated_at FROM guide_conversations WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 5",
        [userId]
      );

      return res.json({ conversations: result.rows });
    } catch (error: any) {
      console.error("Load history error:", error);
      return res.json({ conversations: [] });
    }
  });

  // ─── Pool Confirmation ───────────────────────────────────────────────────

  router.post("/guide/confirm-pool", async (req, res) => {
    try {
      await init();
      const { hasPool, sessionId } = req.body;
      const user = req.user as any;

      if (sessionId) {
        const session = getSession(sessionId);
        if (session.propertyData) {
          session.propertyData.hasPool = hasPool;
          session.onboardingState = "property_confirmed";
        }
      }

      if (user) {
        const userId = user.userId || user.id;
        try {
          await pool.query(
            "UPDATE guide_property_profiles SET pool_confirmed = $1, updated_at = NOW() WHERE user_id = $2",
            [hasPool, userId]
          );
        } catch { /* ok */ }
      }

      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: "Failed to confirm pool" });
    }
  });

  // ─── Feedback Endpoint ─────────────────────────────────────────────────

  router.post("/guide/feedback", async (req, res) => {
    try {
      await init();
      const { sessionId, messageId, feedbackType, content } = req.body;
      const user = req.user as any;
      const userId = user?.userId || user?.id || null;

      await pool.query(
        "INSERT INTO guide_feedback (user_id, session_id, message_id, feedback_type, content) VALUES ($1, $2, $3, $4, $5)",
        [userId, sessionId, messageId, feedbackType, content]
      );

      // If it's a correction, also save as a learning
      if (feedbackType === "correction" && userId && content) {
        await saveLearning(userId, "correction", `feedback_${messageId}`, content, "feedback");
      }

      return res.json({ success: true });
    } catch (error) {
      console.error("Feedback error:", error);
      return res.status(500).json({ error: "Failed to save feedback" });
    }
  });

  return router;
}

// ─── Action Processor ────────────────────────────────────────────────────────

async function processAction(action: any, session: GuideSession, userId: string | null): Promise<any> {
  try {
    switch (action.type) {
      case "property_scan": {
        if (!action.address || typeof action.address !== "string" || action.address.trim().length < 3) {
          return { type: "property_scan", data: null, error: "Invalid or missing address" };
        }
        const propertyData = await getPropertyDataAsync(action.address.trim());
        session.propertyData = propertyData;
        session.onboardingState = propertyData.hasPool === "uncertain" ? "pool_check" : "property_confirmed";

        if (userId) {
          try {
            await pool.query(
              `INSERT INTO guide_property_profiles (id, user_id, address, property_data)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (user_id) DO UPDATE SET address = $3, property_data = $4, updated_at = NOW()`,
              [nanoid(), userId, action.address, JSON.stringify(propertyData)]
            );
          } catch { /* ok */ }
        }

        return { type: "property_scan", data: propertyData };
      }

      case "price_match": {
        if (!action.claimed_price || typeof action.claimed_price !== "number" || action.claimed_price <= 0) {
          return { type: "price_match", data: null, error: "Invalid claimed price" };
        }
        const result = calculatePriceMatch(action.service, action.claimed_price);
        if (result) {
          if (!session.priceMatches) session.priceMatches = [];
          session.priceMatches.push(result);
        }
        return { type: "price_match", data: result };
      }

      case "lock_quote": {
        if (!action.price || typeof action.price !== "number" || action.price <= 0) {
          return { type: "lock_quote", data: null, error: "Invalid price" };
        }
        if (!action.service || typeof action.service !== "string") {
          return { type: "lock_quote", data: null, error: "Invalid service" };
        }
        const quoteId = nanoid(10);
        const shareToken = nanoid(16);
        const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const quote = { id: quoteId, service: action.service, price: action.price, address: action.address || "", validUntil, shareToken };

        if (!session.lockedQuotes) session.lockedQuotes = [];
        session.lockedQuotes.push(quote);

        if (userId) {
          try {
            await pool.query(
              `INSERT INTO guide_locked_quotes (id, user_id, service_type, price, address, details, valid_until, share_token)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [quoteId, userId, action.service, action.price, action.address || "", "{}", validUntil, shareToken]
            );
          } catch { /* ok */ }
        }

        return { type: "lock_quote", data: { ...quote, shareUrl: `/quote/shared/${shareToken}` } };
      }

      case "bundle": {
        if (!action.services || !Array.isArray(action.services) || action.services.length < 2) return null;
        const breakdown: any[] = [];
        let subtotal = 0;
        for (const svc of action.services) {
          const rate = STANDARD_RATES[svc];
          if (rate) { breakdown.push({ service: rate.service, rate: rate.rate, frequency: rate.frequency }); subtotal += rate.rate; }
        }
        const discountPct = action.services.length >= 6 ? 0.15 : 0.10;
        const discount = Math.round(subtotal * discountPct);
        return { type: "bundle", data: { breakdown, subtotal, discountPercent: Math.round(discountPct * 100), discount, total: subtotal - discount } };
      }

      case "book": {
        session.pendingBooking = action;
        return { type: "booking_pending", data: action };
      }

      case "share_quote": {
        const quote = session.lockedQuotes?.find(q => q.id === action.quoteId);
        if (quote) return { type: "share_quote", data: { shareUrl: `/quote/shared/${(quote as any).shareToken || quote.id}` } };
        return null;
      }

      case "show_breakdown": {
        return { type: "breakdown", data: action };
      }

      case "learn": {
        if (userId) {
          await saveLearning(userId, action.category, action.key, action.value);
        }
        return null; // Silent — don't return a card for this
      }

      default:
        return null;
    }
  } catch (err) {
    console.error("Action processing error:", err);
    return null;
  }
}

// ─── Conversation Persistence ────────────────────────────────────────────────

async function saveConversation(userId: string, sessionId: string, session: GuideSession) {
  try {
    const existing = await pool.query(
      "SELECT id FROM guide_conversations WHERE user_id = $1 AND session_id = $2",
      [userId, sessionId]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE guide_conversations SET messages = $1, property_data = $2, recurring_services = $3, photo_estimates = $4, locked_quotes = $5, price_matches = $6, updated_at = NOW()
         WHERE id = $7`,
        [
          JSON.stringify(session.history),
          session.propertyData ? JSON.stringify(session.propertyData) : null,
          session.recurringServices ? JSON.stringify(session.recurringServices) : null,
          session.photoEstimates ? JSON.stringify(session.photoEstimates) : null,
          session.lockedQuotes ? JSON.stringify(session.lockedQuotes) : null,
          session.priceMatches ? JSON.stringify(session.priceMatches) : null,
          existing.rows[0].id,
        ]
      );
    } else {
      await pool.query(
        `INSERT INTO guide_conversations (id, user_id, session_id, messages, property_data, recurring_services, photo_estimates, locked_quotes, price_matches)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          nanoid(),
          userId,
          sessionId,
          JSON.stringify(session.history),
          session.propertyData ? JSON.stringify(session.propertyData) : null,
          session.recurringServices ? JSON.stringify(session.recurringServices) : null,
          session.photoEstimates ? JSON.stringify(session.photoEstimates) : null,
          session.lockedQuotes ? JSON.stringify(session.lockedQuotes) : null,
          session.priceMatches ? JSON.stringify(session.priceMatches) : null,
        ]
      );
    }
  } catch (err) {
    console.error("Save conversation error:", err);
  }
}

// ─── Quick Actions ───────────────────────────────────────────────────────────

function getQuickActions(
  context: { page?: string; userRole?: string } | undefined,
  user: any,
  session?: GuideSession,
): Array<{ label: string; action: string }> {
  if (!context) return [];
  const { page = "/", userRole = "visitor" } = context;

  // If we have photo estimates, offer booking
  if (session?.photoEstimates && session.photoEstimates.length > 0) {
    return [
      { label: "📷 Add another photo", action: "message:I want to add another photo" },
      { label: "💰 Lock this price", action: "message:Lock in this quote for me" },
      { label: "📅 Book it!", action: "message:Let's book it!" },
      { label: "📊 See breakdown", action: "message:How did you calculate that?" },
    ];
  }

  // If property is scanned, offer services
  if (session?.propertyData && !session.lockedQuotes?.length) {
    const actions: Array<{ label: string; action: string }> = [
      { label: "📷 Send a photo for quote", action: "message:I want to send a photo for a quote" },
      { label: "🏠 What services do I need?", action: "message:Based on my home, what services do you recommend?" },
    ];
    if (session.propertyData.hasPool) {
      actions.push({ label: "🏊 Pool cleaning", action: "message:Tell me about pool cleaning" });
    }
    return actions;
  }

  // Pro signup pages
  if (page.startsWith("/pro/signup") || page.startsWith("/pycker/signup") || page.startsWith("/become-pro") || page.startsWith("/pycker-signup") || page.startsWith("/become-a-pycker")) {
    return [
      { label: "Why UpTend?", action: "message:What makes UpTend different?" },
      { label: "How much can I earn?", action: "message:How much do pros earn?" },
    ];
  }

  if (userRole === "pro") {
    return [
      { label: "My Dashboard", action: "navigate:/pro/dashboard" },
      { label: "View Earnings", action: "navigate:/pro/earnings" },
    ];
  }

  if (userRole === "customer") {
    return [
      { label: "Find what you need", action: "navigate:/book" },
      { label: "📷 Photo Quote", action: "message:I want to send a photo for a quote" },
      { label: "My Dashboard", action: "navigate:/dashboard" },
    ];
  }

  return [
    { label: "See what we offer", action: "navigate:/services" },
    { label: "Get a closer estimate", action: "navigate:/quote" },
    { label: "I'm a Pro", action: "navigate:/pros" },
  ];
}
