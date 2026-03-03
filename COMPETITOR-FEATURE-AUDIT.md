# UpTend vs Competitors: Full Feature Audit

## Goal: Match and exceed ServiceTitan, Housecall Pro, Jobber, GoHighLevel, and Scorpion

Legend:
- HAVE = Built and live
- PARTIAL = Built but needs work
- GEORGE = George handles this conversationally (no separate UI needed)
- NEED = Must build
- BETTER = We do this better than they do
- N/A = Not applicable to our model

---

## 1. CUSTOMER INTAKE AND BOOKING

| Feature | ServiceTitan | Housecall Pro | Jobber | UpTend Status |
|---|---|---|---|---|
| Online booking | Yes | Yes | Yes | HAVE (George + /book page) |
| Phone call tracking | Yes | Yes (Voice) | No | NEED |
| 24/7 AI call answering | No (manual CSRs) | Yes (CSR AI) | No | BETTER (George 24/7, no per-call fee) |
| Chat booking | No | No | No | BETTER (George chat on every page) |
| Photo-based scoping | No | No | No | BETTER (George photo diagnosis) |
| Customer portal | Yes | Partial | Yes | PARTIAL (dashboard exists, needs polish) |
| Web form leads | Yes | Yes | Yes | HAVE (George inline prompt) |
| Two-way SMS | Yes | Yes | Yes | PARTIAL (Twilio wired, not verified) |
| Automated booking confirmations | Yes | Yes | Yes | HAVE (email confirmations) |
| "On My Way" texts to customer | Yes | Yes | Yes | NEED |
| Tech bio / photo before arrival | Yes | No | No | NEED |

## 2. SCHEDULING AND DISPATCH

| Feature | ServiceTitan | Housecall Pro | Jobber | UpTend Status |
|---|---|---|---|---|
| Drag-and-drop dispatch board | Yes | Yes | Yes | NEED (critical) |
| GPS fleet tracking | Yes | Yes (GPS) | Yes | NEED |
| Route optimization | Yes | Yes | Yes | NEED |
| Recurring job scheduling | Yes | Yes | Yes | PARTIAL (maintenance reminders built) |
| Crew scheduling | Yes | Yes | Yes | HAVE (partner-crew-scheduling.ts) |
| Capacity planning | Yes (Adaptive Capacity) | No | No | NEED |
| Availability calendar | Yes | Yes | Yes | HAVE (crew availability API) |
| Automated tech assignment | Yes (Dispatch Pro) | Yes | Yes | PARTIAL (job routing cascade) |
| Job duration estimates | Yes | Yes | Yes | GEORGE (estimates based on service type) |
| Multi-day jobs | Yes | Yes | Yes | NEED |

## 3. FIELD OPERATIONS (MOBILE)

| Feature | ServiceTitan | Housecall Pro | Jobber | UpTend Status |
|---|---|---|---|---|
| Mobile app for techs | Yes | Yes | Yes | NEED (George App spec written) |
| Digital forms/checklists | Yes | Yes | Yes | NEED |
| Photo capture on job | Yes | Yes | Yes | HAVE (photo upload) |
| Equipment scanning (nameplate) | Yes | No | No | NEED |
| Field notes | Yes | Yes | Yes | NEED |
| Upsell opportunities in field | Yes (Field Findings) | Yes | No | GEORGE (post-job upsell prompts) |
| Time tracking | Yes | Yes | Yes | NEED |
| Offline mode | Yes | Yes | Yes | NEED |
| In-field estimates | Yes | Yes | Yes | GEORGE (real-time quoting) |
| Material tracking | Yes | Yes | No | NEED |

## 4. ESTIMATES AND PRICING

| Feature | ServiceTitan | Housecall Pro | Jobber | UpTend Status |
|---|---|---|---|---|
| Digital estimates | Yes | Yes | Yes | HAVE (George quotes + snap-quote) |
| Good/Better/Best options | Yes | Yes (Sales Proposal) | No | BETTER (AI tiered quoting) |
| Pricebook management | Yes | Yes | Yes | HAVE (canonical pricing engine) |
| Custom pricing per customer | Yes | No | No | GEORGE (conversation-based) |
| Estimate to invoice conversion | Yes | Yes | Yes | NEED |
| Estimate follow-up automation | Yes | Yes | Yes | NEED |
| Financing options | Yes | Yes (Wisetack) | Yes | NEED |
| Photo-based estimates | No | No | No | BETTER (George photo scoping) |

## 5. INVOICING AND PAYMENTS

| Feature | ServiceTitan | Housecall Pro | Jobber | UpTend Status |
|---|---|---|---|---|
| Digital invoicing | Yes | Yes | Yes | PARTIAL (checkout receipt exists) |
| Credit card payments | Yes | Yes | Yes | HAVE (Stripe) |
| Mobile card reader | Yes | Yes | Yes | NEED (Stripe Terminal) |
| ACH/bank payments | Yes | Yes | Yes | NEED |
| Deposit/upfront payments | Yes | Yes | Yes | NEED |
| Payment reminders | Yes | Yes | Yes | NEED |
| Consumer financing | Yes | Yes (Wisetack) | Yes | NEED |
| Multi-party billing | Yes | No | No | NEED (for B2B) |
| QuickBooks integration | Yes | Yes | Yes | NEED |
| Batch invoicing | Yes | No | Yes | NEED |

## 6. CRM AND CUSTOMER MANAGEMENT

| Feature | ServiceTitan | Housecall Pro | Jobber | UpTend Status |
|---|---|---|---|---|
| Customer database | Yes | Yes | Yes | HAVE (Supabase) |
| Service history per customer | Yes | Yes | Yes | HAVE (Home Memory) |
| Equipment/asset tracking | Yes | Yes | No | PARTIAL (Home Memory stores equipment) |
| Communication log | Yes | Yes | Yes | PARTIAL (conversation history) |
| Customer tags/segments | Yes | Yes | Yes | NEED |
| Property management | Yes | No | Yes | HAVE (B2B properties) |
| Contact import/export | Yes | Yes | Yes | NEED |
| Duplicate detection | Yes | No | No | NEED |
| Customer notes | Yes | Yes | Yes | HAVE (Home Memory facts) |

## 7. MARKETING

| Feature | ServiceTitan | Housecall Pro | Jobber | UpTend Status |
|---|---|---|---|---|
| Email marketing campaigns | Yes (Marketing Pro) | Yes (Mailchimp) | Yes | PARTIAL (SendGrid wired) |
| Review management/requests | Yes | Yes | Yes | BETTER (auto review requests post-job) |
| Google Local Services Ads | Yes | Yes | No | NEED |
| Call tracking with attribution | Yes | Yes | No | NEED |
| Marketing ROI dashboard | Yes | No | No | BETTER (revenue attribution) |
| SEO page generation | No | No | No | BETTER (12 pages per partner, auto) |
| Social media management | No | No | No | BETTER ($500/mo add-on, daily AI posts) |
| Blog content generation | No | No | No | BETTER (weekly AI blog posts) |
| Competitor monitoring | No | No | No | BETTER (competitor watchdog) |
| Referral programs | Yes | Yes | Yes | HAVE (partner referral network) |
| Reputation management | Yes | Yes | No | HAVE (review tracking + alerts) |

## 8. REPORTING AND ANALYTICS

| Feature | ServiceTitan | Housecall Pro | Jobber | UpTend Status |
|---|---|---|---|---|
| Custom dashboards | Yes | Yes | Yes | PARTIAL (partner dashboard, needs work) |
| Revenue reports | Yes | Yes | Yes | HAVE (revenue attribution) |
| Job costing | Yes | Yes | Yes | NEED |
| Technician performance | Yes | Yes | No | NEED |
| Lead source tracking | Yes | Yes | No | BETTER (full attribution by source) |
| Conversion funnels | Yes | Yes | No | PARTIAL |
| KPI tracking | Yes | Yes | Yes | NEED |
| Exportable reports | Yes | Yes | Yes | NEED |

## 9. ACCOUNTING

| Feature | ServiceTitan | Housecall Pro | Jobber | UpTend Status |
|---|---|---|---|---|
| QuickBooks sync | Yes | Yes | Yes | NEED |
| Payroll integration | Yes | No | No | NEED |
| Purchase orders | Yes | No | No | NEED |
| Inventory management | Yes | No | No | NEED |
| Job costing (labor + materials) | Yes | Yes | Yes | NEED |
| Tax calculations | Yes | Yes | Yes | NEED |
| AP/AR management | Yes | No | No | N/A (partners handle their own) |

## 10. AI AND INTELLIGENCE (OUR ADVANTAGE)

| Feature | ServiceTitan | Housecall Pro | Jobber | UpTend Status |
|---|---|---|---|---|
| AI customer intake | Partial (Atlas) | Yes (CSR AI) | No | BETTER (George, conversational, 24/7) |
| AI photo diagnosis | No | No | No | BETTER (George vision) |
| AI equipment identification | Partial (scanning) | No | No | BETTER (George photo analysis) |
| AI competitive audit | No | No | No | BETTER (live Brave search) |
| AI proposal generation | No | No | No | BETTER (audio to proposal) |
| AI content generation | No | No | No | BETTER (social, blog, SEO) |
| AI dispatching suggestions | Yes (Dispatch Pro) | No | No | PARTIAL (job routing cascade) |
| AI coach/analyst | Partial (Titan Intel) | Yes (Analyst AI) | No | GEORGE (proactive outreach) |
| AI sales discovery | No | No | No | BETTER (discovery page) |
| Home Memory (cross-service) | No | No | No | BETTER (no competitor has this) |
| Cross-partner referrals | No | No | No | BETTER (referral network) |

---

## PRIORITY BUILD LIST (to match competitors)

### CRITICAL (must have to sell against ServiceTitan)
1. **QuickBooks integration** - every contractor uses it, non-negotiable
2. **Dispatch board UI** - visual drag-and-drop scheduling
3. **"On My Way" texts** - customer expects this now
4. **Digital invoicing flow** - estimate to invoice to payment
5. **Mobile app for techs** - field operations (spec written as GEORGE-APP-SPEC.md)
6. **Payment processing expansion** - deposits, ACH, payment reminders
7. **Job costing** - labor + materials tracking per job

### HIGH (differentiation enhancers)
8. **Tech bio/photo before arrival** - builds trust, easy win
9. **GPS fleet tracking** - partner can see where crews are
10. **Consumer financing** - Wisetack or similar integration
11. **Call tracking with attribution** - know which marketing drives calls
12. **Digital forms/checklists** - standardize field work
13. **Time tracking for crews** - labor cost visibility
14. **Estimate to invoice conversion** - one click flow
15. **Google Local Services Ads integration**

### MEDIUM (nice to have, build over time)
16. Equipment nameplate scanning
17. Route optimization
18. Inventory management
19. Payroll integration
20. Batch invoicing
21. Offline mobile mode
22. Customer tags/segments
23. Multi-day job support
24. Contact import/export

---

## WHERE WE ALREADY WIN (features NO competitor has)

1. **George AI** - conversational AI that replaces CSRs, dispatchers, and customer service reps
2. **Photo-based scoping** - snap a photo, get a diagnosis before truck rolls
3. **Home Memory** - remembers every detail about every customer's home across services
4. **Live competitive audit** - researches competitor in real time during sales meeting
5. **Auto SEO pages** - 12 landing pages per partner, auto-generated and ranked
6. **AI blog content** - weekly posts targeting long-tail keywords
7. **Social media automation** - daily AI posts across platforms
8. **Cross-partner referral network** - 2% bonus, network effect moat
9. **AI proposal generation** - record meeting, get branded PDF
10. **Sales discovery engine** - George runs entire sales meeting solo
11. **Proactive business intelligence** - George texts partner about ranking changes, reviews, competitor moves
12. **Crew scheduling via conversational AI** - "who's free tomorrow?" gets an instant answer
13. **Revenue attribution** - cost per lead by source with industry benchmarks

---

## THE PITCH

ServiceTitan: $245-500 per tech per month. 5 techs = $1,500/month. Complex, 6-week onboarding. No AI intake. No SEO. No social media.

Housecall Pro: $65-229/month. Good for small shops. No SEO. No competitive intelligence. AI answering costs extra per call.

Jobber: $49-249/month. Solid basics. No AI. No marketing. No competitive intel.

**UpTend: $297-997/month total. George replaces 3-4 of their tools. SEO included. Social media available. Competitive intelligence built in. And the partner never learns software because George IS the software.**
