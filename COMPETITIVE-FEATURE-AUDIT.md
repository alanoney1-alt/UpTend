# Competitive Feature Audit: UpTend vs ServiceTitan vs Housecall Pro vs Jobber

## Goal: Match and exceed every feature they offer

### Legend
- ✅ = We have it, built and live
- 🔨 = Built but needs wiring/testing
- 📋 = Spec'd, not built yet
- ❌ = Don't have it, NEED TO BUILD

---

## 1. SCHEDULING & DISPATCH

| Feature | ServiceTitan | Housecall Pro | Jobber | UpTend Status |
|---|---|---|---|---|
| Drag-and-drop dispatch board | ✅ | ✅ | ✅ | 📋 Need visual dispatch board |
| Automated scheduling | ✅ | ✅ | ✅ | ✅ George handles scheduling |
| Route optimization | ✅ | ✅ | ✅ | ❌ NEED TO BUILD |
| GPS tech tracking | ✅ | ✅ | ✅ | ❌ NEED TO BUILD (mobile app) |
| Real-time tech location | ✅ | ✅ | ✅ | ❌ NEED TO BUILD (mobile app) |
| Recurring job scheduling | ✅ | ✅ | ✅ | 🔨 Maintenance reminders built |
| Calendar sync | ✅ | ✅ | ✅ | ❌ NEED TO BUILD |
| Crew scheduling | ✅ | ✅ | ✅ | ✅ partner-crew-scheduling.ts |
| Availability queries | ✅ | ✅ | ✅ | ✅ "Who's free tomorrow?" |
| After-hours booking | ✅ | ✅ | ✅ | ✅ George 24/7 |

**Gap: Visual dispatch board, route optimization, GPS tracking (all mobile app features)**

---

## 2. CUSTOMER COMMUNICATION

| Feature | ServiceTitan | Housecall Pro | Jobber | UpTend Status |
|---|---|---|---|---|
| Two-way SMS | ✅ | ✅ | ✅ | 🔨 Twilio wired, pending verification |
| Automated appointment reminders | ✅ | ✅ | ✅ | ✅ Maintenance reminders |
| "On my way" notifications | ✅ | ✅ | ✅ | ❌ NEED TO BUILD |
| Email campaigns | ✅ | ✅ | ✅ | ✅ SendGrid wired |
| Chat widget | ❌ | ❌ | ❌ | ✅ George (MAJOR ADVANTAGE) |
| AI customer intake | ❌ | ❌ | ❌ | ✅ George (MAJOR ADVANTAGE) |
| Photo diagnostics | ❌ | ❌ | ❌ | ✅ George (MAJOR ADVANTAGE) |
| 24/7 customer response | ❌ | ❌ | ❌ | ✅ George (MAJOR ADVANTAGE) |
| Call tracking | ✅ | ✅ | ❌ | ❌ NEED TO BUILD |
| Voicemail transcription | ✅ | ❌ | ❌ | ❌ NEED TO BUILD |
| Customer portal | ✅ | ✅ | ✅ | 📋 Spec'd in app |

**Gap: Call tracking, "on my way" notifications, voicemail transcription. BUT we have 4 MAJOR advantages they don't have at all.**

---

## 3. ESTIMATES & QUOTING

| Feature | ServiceTitan | Housecall Pro | Jobber | UpTend Status |
|---|---|---|---|---|
| Digital estimates | ✅ | ✅ | ✅ | ✅ George generates quotes |
| Good/Better/Best options | ✅ | ✅ | ❌ | ✅ partner-tiered-quoting.ts |
| Flat-rate pricebook | ✅ | ✅ | ✅ | ✅ pricing-engine.ts |
| Photo-based scoping | ❌ | ❌ | ❌ | ✅ George (ADVANTAGE) |
| Online estimate approval | ✅ | ✅ | ✅ | 📋 NEED TO BUILD |
| Estimate follow-up automation | ✅ | ✅ | ✅ | 📋 NEED TO BUILD |
| Financing options | ✅ | ✅ | ❌ | ❌ NEED TO BUILD (Wisetack/GreenSky) |
| Proposal templates | ✅ | ✅ | ✅ | ✅ partner-proposal-engine |
| AI-powered quoting | ❌ | ❌ | ❌ | ✅ George (ADVANTAGE) |

**Gap: Online estimate approval workflow, follow-up automation, financing integration**

---

## 4. INVOICING & PAYMENTS

| Feature | ServiceTitan | Housecall Pro | Jobber | UpTend Status |
|---|---|---|---|---|
| Digital invoices | ✅ | ✅ | ✅ | ❌ NEED TO BUILD |
| Online payments | ✅ | ✅ | ✅ | 🔨 Stripe wired |
| Auto-payment reminders | ✅ | ✅ | ✅ | ❌ NEED TO BUILD |
| Batch invoicing | ✅ | ✅ | ✅ | ❌ NEED TO BUILD |
| Customer credit cards on file | ✅ | ✅ | ✅ | ❌ NEED TO BUILD |
| Payment processing | ✅ | ✅ | ✅ | 🔨 Stripe in code |
| Financing (Wisetack etc) | ✅ | ✅ | ❌ | ❌ NEED TO BUILD |
| QuickBooks integration | ✅ | ✅ | ✅ | ❌ NEED TO BUILD |
| Multi-party billing | ✅ | ❌ | ❌ | ❌ NEED TO BUILD |

**Gap: THIS IS OUR BIGGEST HOLE. Need invoicing, payment reminders, QuickBooks sync, financing.**

---

## 5. CRM & CUSTOMER MANAGEMENT

| Feature | ServiceTitan | Housecall Pro | Jobber | UpTend Status |
|---|---|---|---|---|
| Customer database | ✅ | ✅ | ✅ | ✅ Supabase DB |
| Service history per customer | ✅ | ✅ | ✅ | ✅ Home Memory system |
| Equipment/asset tracking | ✅ | ❌ | ❌ | 📋 Spec'd in Home Memory |
| Property details | ✅ | ✅ | ✅ | ✅ Home DNA Scan |
| Tags and segmentation | ✅ | ✅ | ✅ | ❌ NEED TO BUILD |
| Lead source tracking | ✅ | ✅ | ✅ | ✅ partner-revenue-attribution.ts |
| Pipeline management | ✅ | ❌ | ❌ | ❌ NEED TO BUILD |
| Customer notes | ✅ | ✅ | ✅ | ✅ Home Memory |
| AI-powered customer memory | ❌ | ❌ | ❌ | ✅ George (MAJOR ADVANTAGE) |

**Gap: Tags/segmentation, pipeline management. BUT Home Memory + Home DNA Scan is years ahead of anything they offer.**

---

## 6. REPORTING & ANALYTICS

| Feature | ServiceTitan | Housecall Pro | Jobber | UpTend Status |
|---|---|---|---|---|
| Revenue dashboards | ✅ | ✅ | ✅ | ✅ Partner dashboard |
| Technician performance | ✅ | ✅ | ✅ | ❌ NEED TO BUILD |
| Job costing | ✅ | ❌ | ✅ | ❌ NEED TO BUILD |
| Marketing ROI tracking | ✅ | ❌ | ❌ | ✅ Revenue attribution |
| Call tracking analytics | ✅ | ❌ | ❌ | ❌ NEED TO BUILD |
| Custom reports | ✅ | ✅ | ✅ | ❌ NEED TO BUILD |
| KPI dashboards | ✅ | ✅ | ✅ | 🔨 Partner dashboard (basic) |
| Competitor analysis | ❌ | ❌ | ❌ | ✅ Competitor watchdog (ADVANTAGE) |
| AI-powered insights | ✅ (Titan Intelligence) | ❌ | ❌ | ✅ George (ADVANTAGE) |

**Gap: Tech performance, job costing, custom reports. But competitor watchdog is unique to us.**

---

## 7. MARKETING

| Feature | ServiceTitan | Housecall Pro | Jobber | UpTend Status |
|---|---|---|---|---|
| Email marketing | ✅ | ✅ | ✅ | ✅ SendGrid |
| Review generation | ✅ | ✅ | ✅ | ✅ Auto review requests |
| SEO management | ❌ | ❌ | ❌ | ✅ Full SEO engine (MAJOR ADVANTAGE) |
| Social media management | ❌ | ❌ | ❌ | ✅ Full social autoposter (MAJOR ADVANTAGE) |
| Local advertising | ✅ | ✅ | ❌ | ❌ NEED TO BUILD (Google Ads integration) |
| Referral program | ✅ | ✅ | ✅ | ✅ Partner referral network |
| Branded content generation | ❌ | ❌ | ❌ | ✅ AI image gen + HeyGen (ADVANTAGE) |
| Website builder | ❌ | ✅ | ✅ | ✅ Partner landing pages (ADVANTAGE) |
| Blog content | ❌ | ❌ | ❌ | ✅ Auto SEO blogs (ADVANTAGE) |
| Competitor monitoring | ❌ | ❌ | ❌ | ✅ Weekly scans (ADVANTAGE) |

**We DOMINATE marketing. Nobody else does SEO, social, content, competitor monitoring, AND AI image gen.**

---

## 8. FIELD OPERATIONS / MOBILE

| Feature | ServiceTitan | Housecall Pro | Jobber | UpTend Status |
|---|---|---|---|---|
| Mobile app for techs | ✅ | ✅ | ✅ | ❌ NEED TO BUILD (George App) |
| Offline mode | ✅ | ✅ | ✅ | ❌ NEED TO BUILD |
| Digital forms/checklists | ✅ | ✅ | ✅ | ❌ NEED TO BUILD |
| Before/after photos | ✅ | ✅ | ✅ | ✅ Photo upload system |
| Equipment scanning | ✅ | ❌ | ❌ | ❌ NEED TO BUILD |
| In-field estimates | ✅ | ✅ | ✅ | 📋 George App spec |
| Digital signatures | ✅ | ✅ | ✅ | ❌ NEED TO BUILD |
| Timesheet tracking | ✅ | ✅ | ✅ | ❌ NEED TO BUILD |
| Inventory tracking | ✅ | ❌ | ❌ | ❌ NEED TO BUILD |

**Gap: Mobile app is the biggest missing piece. GEORGE-APP-SPEC.md exists but needs to be built.**

---

## 9. SERVICE AGREEMENTS / MEMBERSHIPS

| Feature | ServiceTitan | Housecall Pro | Jobber | UpTend Status |
|---|---|---|---|---|
| Maintenance agreements | ✅ | ✅ | ✅ | 🔨 Maintenance reminders built |
| Membership management | ✅ | ✅ | ❌ | ❌ NEED TO BUILD |
| Auto-renewals | ✅ | ✅ | ❌ | ❌ NEED TO BUILD |
| Recurring billing | ✅ | ✅ | ✅ | ❌ NEED TO BUILD |
| Agreement templates | ✅ | ✅ | ❌ | ❌ NEED TO BUILD |

**Gap: Full membership/agreement system needed.**

---

## 10. INTEGRATIONS

| Feature | ServiceTitan | Housecall Pro | Jobber | UpTend Status |
|---|---|---|---|---|
| QuickBooks | ✅ | ✅ | ✅ | ❌ NEED TO BUILD |
| Sage Intacct | ✅ | ❌ | ❌ | ❌ (enterprise, defer) |
| Google Calendar | ✅ | ✅ | ✅ | ❌ NEED TO BUILD |
| Zapier | ✅ | ✅ | ✅ | 🔨 n8n webhooks |
| Stripe | ✅ | ✅ | ✅ | ✅ Wired |
| Google Ads | ✅ | ✅ | ❌ | ❌ NEED TO BUILD |
| Parts/supply vendors | ✅ | ❌ | ❌ | 🔨 Procurement tools built |
| Open API | ✅ | ✅ | ✅ | ✅ Full REST API |

**Gap: QuickBooks and Google Calendar are must-haves.**

---

## SCORECARD SUMMARY

| Category | ServiceTitan | Housecall Pro | Jobber | UpTend |
|---|---|---|---|---|
| Scheduling & Dispatch | 10/10 | 8/10 | 8/10 | 6/10 |
| Customer Communication | 7/10 | 7/10 | 6/10 | 9/10 ★ |
| Estimates & Quoting | 9/10 | 8/10 | 7/10 | 7/10 |
| Invoicing & Payments | 10/10 | 9/10 | 9/10 | 3/10 ⚠️ |
| CRM & Customer Mgmt | 9/10 | 7/10 | 7/10 | 8/10 |
| Reporting & Analytics | 10/10 | 6/10 | 7/10 | 5/10 |
| Marketing | 7/10 | 4/10 | 3/10 | 10/10 ★★ |
| Field Operations/Mobile | 10/10 | 8/10 | 8/10 | 2/10 ⚠️ |
| Service Agreements | 9/10 | 7/10 | 5/10 | 2/10 ⚠️ |
| Integrations | 9/10 | 7/10 | 7/10 | 4/10 |

**Overall: ServiceTitan 90/100 | Housecall Pro 71/100 | Jobber 67/100 | UpTend 56/100**

---

## TOP PRIORITY GAPS TO CLOSE (in order)

### CRITICAL (must have to sell to partners)
1. **Invoicing system** — generate, send, track invoices. Auto-reminders. Online payment link.
2. **QuickBooks integration** — partners live in QuickBooks. No sync = no deal.
3. **Mobile app for techs** — view schedule, update job status, collect payment, take photos. (GEORGE-APP-SPEC.md ready)
4. **Digital signatures** — customer signs off on estimate/invoice on a tablet or phone.
5. **"On my way" notifications** — text customer when tech is en route with ETA.

### HIGH (differentiators that close deals)
6. **Visual dispatch board** — drag-and-drop schedule view for the office.
7. **Route optimization** — auto-optimize tech routes to reduce drive time.
8. **Estimate follow-up automation** — auto-email/text unsold estimates after 24h, 72h, 7d.
9. **Membership/agreement management** — recurring service contracts with auto-billing.
10. **Google Calendar sync** — partners and techs see jobs on their personal calendar.

### MEDIUM (nice to have, builds moat)
11. **Call tracking** — track which marketing source generated each call.
12. **Technician performance reporting** — jobs/day, revenue/tech, avg rating per tech.
13. **Job costing** — materials + labor cost vs revenue per job.
14. **Digital forms/checklists** — safety checklists, inspection forms, compliance docs.
15. **Timesheet tracking** — clock in/out, drive time, job time per tech.

---

## WHERE WE ALREADY WIN (features NOBODY else has)

1. **George AI** — 24/7 customer intake, photo diagnostics, intelligent scoping
2. **Home Memory** — remembers every detail about every customer's home forever
3. **Full SEO engine** — 12+ pages per partner, auto-blogs, keyword tracking
4. **Social media automation** — daily AI-generated content across all platforms
5. **Competitor watchdog** — weekly competitive scanning with alerts
6. **Revenue attribution** — lead source tracking with cost-per-lead analysis
7. **Partner referral network** — 2% cross-referral bonuses, network effect
8. **Live competitive audit** — real-time business intelligence during sales calls
9. **AI photo estimates** — scope a job from a photo before truck rolls
10. **Partner proposal engine** — audio recording to branded PDF proposal in minutes

**These 10 features are worth more than everything ServiceTitan has for most small/mid contractors. They just need the basics (invoicing, scheduling, mobile) to feel complete.**

---

## PRICING COMPARISON (10-tech HVAC company)

| Platform | Year 1 Cost | What They Get |
|---|---|---|
| ServiceTitan | $63,000+ | Everything but SEO/social/AI |
| Housecall Pro | $20,400 | Basics, no marketing |
| Jobber | $14,400 | Basics, no marketing |
| **UpTend Growth** | **$9,664** ($597/mo + $2,500 setup) | George AI + SEO + social + all partner features |
| **UpTend Growth + Social** | **$15,664** ($1,097/mo + $2,500 setup) | Everything above + daily social content |

**We are 75% cheaper than ServiceTitan and include marketing features they charge extra for.**
