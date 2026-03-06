# UpTend LLM Visibility Plan
## How to Get ChatGPT, Perplexity, Claude, and Google AI to Recommend UpTend

**Created:** March 5, 2026
**Status:** Active

---

## Current State Audit

### What's Working
- Google Business Profile exists and is VERIFIED (29 views)
- Site IS indexed on Google for branded searches ("UpTend")
- 193 URLs in sitemap (includes 144+ neighborhood pages)
- Solid JSON-LD structured data (Organization, Service, FAQPage, WebSite) — all server-side injected
- robots.txt properly configured with sitemap reference
- Alignable profile exists
- Instagram active (@uptendgeorge)
- lakenonaai.com and uptendapp.business both indexed

### Critical Problems Found

**1. INVISIBLE TO CRAWLERS (BIGGEST ISSUE)**
The site is a client-side SPA. When ChatGPT, Perplexity, or any crawler fetches a page, the `<body>` contains only `<div id="root"></div>`. No visible text content. The JSON-LD structured data IS there (great), but the actual page copy — pricing, services, neighborhood info — is invisible to anything that doesn't execute JavaScript.

This means: 144 SEO pages exist but crawlers see ZERO content on them.

**2. llms.txt NOT SERVING (FIXED)**
The llms.txt file was in `public/` but never made it into the Vite build output (`dist/public/`). Requests to /llms.txt fell through to the SPA catch-all and returned HTML instead of the text file.
- ✅ FIXED: Copied llms.txt to `client/public/` and `client/public/.well-known/`
- ✅ FIXED: Rewrote llms.txt with answer-oriented content (pricing, services, API)
- ⏳ NEEDS DEPLOY to take effect

**3. Bing Webmaster NOT VERIFIED**
Added uptendapp.com on March 5, 2026 but verification is pending. Meta tag verification method chosen.
- ✅ FIXED: Added `<meta name="msvalidate.01" content="1D49C5C51A08B16FCA20722C77666784" />` to `client/index.html`
- ⏳ NEEDS DEPLOY, then click Verify in Bing Webmaster Tools

**4. Google Business Profile Issues**
- WRONG PHONE: Shows (407) 338-3342, should be (855) 901-2072
- WRONG PRIMARY CATEGORY: "Property maintenance" — should be "HVAC contractor" or "Air conditioning contractor"
- MISSING CATEGORIES: No HVAC, AC, or heating categories listed
- DESCRIPTION OUTDATED: Says "11 service categories" (now 13), mentions "Founding 100" (changed)
- DUPLICATE LISTING: Unverified "Uptend" (lowercase) should be removed
- ZERO REVIEWS: LLMs skip businesses with no reviews

**5. Zero Directory Presence**
UpTend is NOT listed on:
- Yelp
- BBB (Better Business Bureau)
- Angi / HomeAdvisor
- Thumbtack
- Apple Business Connect
- Bing Places
- Nextdoor Business

**6. Zero Bing Visibility**
ChatGPT primarily uses Bing for web search. UpTend has no Bing presence at all. Without Bing Webmaster verification and indexing, UpTend literally doesn't exist to ChatGPT.

---

## Action Plan (Priority Order)

### TIER 1: Do This Week (Highest Impact)

#### 1. Deploy Code Changes
The following files are ready to deploy:
- `client/index.html` — Bing verification meta tag added
- `client/public/llms.txt` — New answer-optimized content
- `client/public/.well-known/llms.txt` — Same content, alternate path
**WHO:** Alan (git push + Railway deploy)

#### 2. Complete Bing Webmaster Verification
After deploy, go to https://www.bing.com/webmasters/ → log in with Google (uptendgeorge@gmail.com) → click Verify.
Then: Submit sitemap (https://uptendapp.com/sitemap.xml)
**WHO:** Alan or Cap'n (after deploy)
**WHY:** ChatGPT = Bing. No Bing = no ChatGPT.

#### 3. Fix Google Business Profile
- Change primary category to "HVAC contractor" or "Air conditioning repair service"
- Add secondary categories: "Home services", "Plumbing service", "Electrical contractor"
- Update phone to (855) 901-2072
- Update description to mention HVAC prominently, 13 service categories, remove "Founding 100"
- Remove duplicate "Uptend" (lowercase) listing
- Add social profiles (Instagram, Facebook, Twitter)
**WHO:** Alan (from Google search → "Edit profile")

#### 4. Set Up Bing Places
Go to https://bingplaces.com/ → Create listing for UpTend
- Import from Google Business Profile (fastest method)
- This puts UpTend on Bing Maps, which ChatGPT uses
**WHO:** Alan or Cap'n

### TIER 2: This Month (Build Authority)

#### 5. Add Server-Side Content for Crawlers
This is the #1 technical priority. Options (in order of effort):

**Option A: Inject `<noscript>` content blocks (easiest)**
In `server/static.ts`, for each key page route, inject a `<noscript>` section with the core content (headings, service descriptions, pricing). Crawlers without JS get real text. ~2-4 hours of work.

**Option B: Prerender middleware**
Use a package like `prerender-node` that serves pre-rendered HTML to known bot user-agents (Googlebot, Bingbot, ChatGPT-User, PerplexityBot, ClaudeBot). More robust but needs a prerender service.

**Option C: Full SSR migration**
Move to Vite SSR or Next.js. Best long-term but major effort. Not recommended right now.

**RECOMMENDATION:** Option A first (quick win), then Option B when time allows.
**WHO:** Cap'n can build Option A

#### 6. Directory Blitz
Create listings on these platforms (in priority order):

| Platform | Why | Time |
|----------|-----|------|
| Yelp | #1 cited by LLMs for local services | 20 min |
| BBB | Trust signal, frequently cited | 30 min |
| Angi | Top home services directory | 15 min |
| Thumbtack | Home services marketplace | 15 min |
| Apple Business Connect | Siri integration | 15 min |
| Nextdoor Business | Hyperlocal, trusted | 15 min |
| Houzz | Home services specific | 15 min |

Consistent NAP (Name, Address, Phone) across ALL:
- Name: UpTend
- Address: 10125 Peebles St, Orlando, FL 32827
- Phone: (855) 901-2072
- Website: https://uptendapp.com

**WHO:** Alan (some require business owner verification)

#### 7. Get First 5 Google Reviews
Even 5 reviews with actual text dramatically changes how LLMs treat a business. Sources:
- Ask your 4 founding members
- Ask Alex (Comfort Solutions)
- Ask Chelsea
**WHO:** Alan

### TIER 3: Ongoing (Compound Over Time)

#### 8. Write Answer-Engine Content
Create long-form pages that directly answer questions people (and LLMs) ask:
- "How Much Does AC Repair Cost in Orlando in 2026?" (with real price breakdowns)
- "Best Time to Replace Your AC in Florida" (seasonal advice)
- "How to Choose an HVAC Contractor in Orlando" (criteria, red flags)
- "Emergency AC Repair Orlando: What to Do When Your AC Dies"
- "Orlando HVAC Maintenance Schedule: Month-by-Month Guide"

These should be 1,500-2,500 words, conversational, with real data. NOT marketing copy. Think Wikipedia-style answers with local specifics.
**WHO:** Cap'n can draft, Alan reviews

#### 9. Get External Mentions
Every mention of UpTend on another site is a "consensus signal" for LLMs:
- Ask Comfort Solutions to add UpTend to their website
- Ask Ohana Brands to link to UpTend
- Write a guest post for an Orlando local blog
- Submit to Orlando Chamber of Commerce
- Get listed on Orlando Sentinel's business directory
**WHO:** Alan + Chelsea (CMO)

#### 10. Monitor AI Visibility
Periodically test what LLMs say about HVAC in Orlando:
- Ask ChatGPT: "Who should I call for AC repair in Orlando?"
- Ask Perplexity: "Best HVAC companies in Orlando"
- Ask Claude: "HVAC repair near Lake Nona FL"
- Check Google AI Overviews for these queries
Track whether UpTend appears and what it says.
**WHO:** Cap'n (can automate periodic checks)

---

## What I Already Did Today

1. ✅ Added Bing Webmaster verification meta tag to `client/index.html`
2. ✅ Copied and rewrote `llms.txt` with answer-optimized content
3. ✅ Added llms.txt to `client/public/` (fixes build output)
4. ✅ Added llms.txt to `client/public/.well-known/` (alternate path)
5. ✅ Audited Google Business Profile (found wrong phone, wrong categories)
6. ✅ Audited Bing Webmaster status (pending verification)
7. ✅ Audited all directory presence (zero on Yelp, BBB, Angi, etc.)
8. ✅ Audited search visibility (branded search works, non-branded invisible)
9. ✅ Identified SPA rendering as root cause of crawler invisibility

## What Needs You (Alan)

1. **Deploy the code changes** (git push) — unlocks Bing verification
2. **Fix GBP phone/categories** — Google search "UpTend" → Edit profile → Contact → change phone; About → change categories
3. **Get reviews** — ask founding members + Alex
4. **Directory signups** — some require owner verification (BBB, Yelp)
5. **Tell Comfort Solutions/Ohana to link to UpTend on their sites**

---

## The Bottom Line

Right now, when someone asks ChatGPT "Who can fix my AC in Orlando?", UpTend doesn't exist. Not because the site is bad — because:

1. **Bing can't see it** (not verified, not indexed)
2. **Crawlers see empty pages** (SPA with no server-rendered content)
3. **No third-party signals** (zero reviews, zero directory listings)
4. **Wrong business category** (Google thinks we're "property maintenance")

Fix these 4 things and UpTend starts showing up in AI answers within 2-4 weeks. The SEO pages, structured data, and content are already solid — they're just invisible right now.
