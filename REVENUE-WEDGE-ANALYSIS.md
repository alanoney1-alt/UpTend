# UpTend Revenue Wedge Analysis

## Executive Summary

UpTend is a home services marketplace connecting customers with pros across 12 service verticals in the Orlando metro area (population 2.94M, approximately 1.05M households). The platform earns a 20% take rate on every job (15% pro fee + 5% customer fee), yielding $50 gross margin on a $250 average job.

This document models four revenue wedges (Consumer, HOA, Property Management, Construction), each with distinct unit economics, acquisition strategies, and growth trajectories. Together, these wedges create a compounding flywheel: HOA contracts feed the consumer pipeline, PM contracts generate recurring turnover revenue, and construction relationships deliver new homeowners as lifetime customers.

**Year 3 Revenue Summary (All Wedges Combined)**

| Wedge | Year 1 Revenue | Year 2 Revenue | Year 3 Revenue |
|---|---|---|---|
| Consumer | $360,000 | $1,350,000 | $3,600,000 |
| HOA | $480,000 | $1,440,000 | $3,360,000 |
| Property Management | $240,000 | $840,000 | $1,920,000 |
| Construction | $120,000 | $420,000 | $960,000 |
| **Total** | **$1,200,000** | **$4,050,000** | **$9,840,000** |

These projections assume Orlando metro only. Florida-wide expansion would multiply the SAM by 8x.

---

## Platform Economics Baseline

| Metric | Value |
|---|---|
| Average job value | $250 |
| Pro platform fee | 15% ($37.50) |
| Customer service fee | 5% ($12.50) |
| Total take rate | 20% ($50.00) |
| Home DNA Scan (standard) | $99 (100% margin, proprietary) |
| Home DNA Scan (aerial) | $249 (100% margin, proprietary) |
| Service verticals | 12 |

---

## 1. CONSUMER WEDGE (Individual Homeowners)

### Market Sizing

**Orlando MSA (Orange, Osceola, Seminole, Lake counties)**

| Metric | Value | Source |
|---|---|---|
| Metro population (2024) | 2,940,513 | Census Bureau |
| Total households | ~1,050,000 | ACS estimate (2.8 persons/household) |
| Owner-occupied households | ~620,000 | ~59% ownership rate for MSA |
| Renter-occupied households | ~430,000 | ~41% |
| Avg annual home services spend per household | $3,276 | Federal Reserve Bank of Philadelphia (post-2000 homes) |
| U.S. home services market | $543B | GlobeNewsWire 2026 |

**TAM (Total Addressable Market)**
All owner-occupied households in Orlando MSA spending on the 12 verticals UpTend covers.
620,000 households x $3,276 avg annual spend = **$2.03B TAM**

Note: UpTend's 12 verticals represent roughly 40% of total home services spend (excludes HVAC, plumbing, electrical, roofing).
Adjusted TAM: 620,000 x $1,310 = **$812M**

**SAM (Serviceable Addressable Market)**
Households likely to use an online marketplace (digitally comfortable homeowners, age 25-65).
Approximately 65% of owner-occupied households = 403,000 households.
403,000 x $1,310 = **$528M SAM**

**SOM (Serviceable Obtainable Market)**
Year 1 realistic capture at 0.5% of SAM = $2.64M in GMV
Year 3 realistic capture at 3% of SAM = $15.8M in GMV

At 20% take rate:
- Year 1 SOM revenue: $528,000
- Year 3 SOM revenue: $3.17M

### Unit Economics Per Job

| Item | Amount |
|---|---|
| Average job value (GMV) | $250.00 |
| UpTend revenue (20%) | $50.00 |
| Variable cost per job (payment processing 2.9% + $0.30, support allocation) | $8.55 |
| Contribution margin per job | $41.45 |
| Contribution margin % | 83% |

### Customer Acquisition Cost (CAC) and Channels

| Channel | Cost Per Lead | Conversion Rate | CAC | Notes |
|---|---|---|---|---|
| Google Local Services Ads | $25 | 15% | $167 | High intent, expensive |
| Facebook/Instagram Ads | $8 | 6% | $133 | Good for awareness, retargeting |
| Nextdoor Sponsored Posts | $12 | 10% | $120 | Hyperlocal, high trust |
| SEO/Content (George AI) | $0 marginal | 4% | $35 | Blog, local guides, long-tail |
| Referral Program ($25 credit) | $25 | 40% | $63 | Highest quality leads |
| HOA Spillover | $0 | N/A | $0 | Free pipeline from HOA contracts |
| Home DNA Scan upsell | $0 marginal | 25% | $15 | Scan reveals needed services |

**Blended CAC target: $75 per customer**

### LTV Modeling

| Assumption | Value |
|---|---|
| First job revenue to UpTend | $50 |
| Repeat booking rate (within 12 months) | 35% |
| Average jobs per year (active customer) | 2.8 |
| Cross-sell rate (uses 2+ verticals) | 25% in Year 1, 45% by Year 2 |
| Annual revenue per active customer | $140 |
| Average customer lifespan | 3.5 years |
| Home DNA Scan attachment rate | 15% |
| Home DNA Scan avg revenue | $135 (weighted avg of $99/$249) |
| **Lifetime Value (LTV)** | **$510** |
| **LTV:CAC Ratio** | **6.8:1** |

The cross-sell across 12 verticals is the key LTV driver. A customer who books junk removal discovers they can also book pressure washing, gutter cleaning, and home cleaning through the same platform. George AI proactively recommends services based on seasonal needs and Home DNA Scan results.

### Growth Flywheel

1. Customer books first job (likely junk removal or cleaning, lowest friction)
2. George AI follows up post-job with satisfaction check and related service suggestions
3. Home DNA Scan offered at discount ($79 promotional) to generate maintenance roadmap
4. Scan reveals 3-5 actionable services, creating pre-qualified demand
5. Customer books 2nd, 3rd service through platform
6. Happy customer refers neighbors (referral program)
7. HOA contracts deliver 20+ free customers per community (see HOA wedge)
8. Network effects: more pros = faster matching = better experience = more customers

### Revenue Projections: Consumer Wedge

| Metric | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| New customers acquired | 2,400 | 6,000 | 12,000 |
| Retained from prior year | 0 | 840 | 2,394 |
| Total active customers | 2,400 | 6,840 | 14,394 |
| Avg jobs per customer/year | 1.5 | 2.2 | 2.8 |
| Total jobs | 3,600 | 15,048 | 40,303 |
| GMV | $900,000 | $3,762,000 | $10,075,750 |
| UpTend revenue (20%) | $180,000 | $752,400 | $2,015,150 |
| Home DNA Scan revenue | $180,000 | $597,600 | $1,584,850 |
| **Total Consumer Revenue** | **$360,000** | **$1,350,000** | **$3,600,000** |

Home DNA Scan revenue assumes 50% of new customers purchase a scan by Year 3 as the product becomes a core onboarding tool.

---

## 2. HOA WEDGE (Homeowner Associations)

### Orlando Metro HOA Landscape

Florida has over 51,000 HOAs statewide, the highest concentration of any U.S. state. The Orlando MSA contains approximately 5,500 HOA communities across Orange, Osceola, Seminole, and Lake counties.

| Metric | Value |
|---|---|
| Estimated HOAs in Orlando MSA | 5,500 |
| Average units per HOA | 185 |
| Total HOA-governed units | ~1,017,500 |
| HOAs with 100+ units (target segment) | ~2,200 |
| Average HOA annual maintenance budget | $180,000 |
| Budget allocated to UpTend-relevant services | ~$72,000 (40%) |

### Contract Structure and Pricing

HOA contracts are custom-negotiated but follow a standard framework:

**Standard HOA Service Package**

| Service | Frequency | Annual Cost (200-unit community) |
|---|---|---|
| Landscaping (common areas) | Weekly/Biweekly | $36,000 |
| Pressure washing (buildings, sidewalks) | Quarterly | $12,000 |
| Gutter cleaning | Semi-annual | $6,000 |
| Pool cleaning (community pool) | Weekly | $8,400 |
| Home cleaning (clubhouse) | Weekly | $5,200 |
| Junk removal (bulk pickup days) | Monthly | $4,800 |
| **Total Annual Contract** | | **$72,400** |

UpTend takes 20% of all jobs routed through the platform: **$14,480 annual revenue per HOA contract.**

**Premium HOA Package (adds handyman, carpet cleaning for common areas)**
Total annual contract: $96,000
UpTend revenue: **$19,200 per HOA**

### Revenue Per HOA Contract

| Contract Tier | Annual GMV | UpTend Revenue (20%) | Home DNA Scan Opportunity |
|---|---|---|---|
| Basic (3 verticals) | $54,000 | $10,800 | $9,900 (100 units x 50% x $99 x 40% conversion) |
| Standard (6 verticals) | $72,400 | $14,480 | $9,900 |
| Premium (8+ verticals) | $96,000 | $19,200 | $9,900 |

Home DNA Scan becomes an HOA-wide initiative: the association offers subsidized scans to residents, generating data that drives both community-level and individual maintenance bookings.

### Sales Cycle and Acquisition Cost

| Stage | Duration | Cost |
|---|---|---|
| Lead identification (board research) | 2 weeks | $50 (data/tools) |
| Initial outreach (email, phone) | 2 weeks | $100 (sales rep time) |
| Presentation to board | 2-4 weeks | $200 (prep, travel, materials) |
| Board vote and approval | 4-8 weeks | $0 (waiting) |
| Onboarding and first service | 2 weeks | $150 (setup, pro coordination) |
| **Total sales cycle** | **12-18 weeks** | |
| **Total acquisition cost per HOA** | | **$500** |

At $14,480 annual revenue, the **payback period is 13 days** after contract start.

### Recurring Revenue Model

HOA contracts are inherently recurring:
- 12-month minimum terms with auto-renewal
- 85% annual retention rate (HOAs rarely switch vendors mid-contract)
- Expansion revenue: HOAs add verticals over time (land-and-expand)
- Price escalation: 3-5% annual increase tied to CPI

| Metric | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| New HOA contracts signed | 25 | 50 | 80 |
| Retained from prior year | 0 | 21 | 60 |
| Total active HOA contracts | 25 | 71 | 140 |
| Avg revenue per HOA | $16,000 | $17,000 | $18,000 |
| HOA contract revenue | $400,000 | $1,207,000 | $2,520,000 |
| Home DNA Scan revenue (HOA-driven) | $80,000 | $233,000 | $840,000 |
| **Total HOA Revenue** | **$480,000** | **$1,440,000** | **$3,360,000** |

### Why HOA Is the Best Wedge

The HOA wedge is UpTend's most powerful growth lever for three reasons:

**1. Free Consumer Pipeline**
Every HOA contract with 200 units delivers approximately 20 free consumer customers:
- 200 units see UpTend branding on community services
- 10% of residents book personal services through the platform
- 200 x 10% = 20 customers acquired at $0 CAC
- At $510 LTV each, that is $10,200 in lifetime consumer value per HOA, on top of the contract revenue

**2. Compounding Network Effects**
- 25 HOAs in Year 1 = 500 free consumer customers
- 140 HOAs in Year 3 = 2,800 free consumer customers
- These customers refer neighbors in non-HOA neighborhoods

**3. Proof of Scale for Pros**
HOA contracts give pros guaranteed, recurring volume. This makes pro recruitment easier (they come to you) and reduces pro churn because they have steady income.

---

## 3. PM WEDGE (Property Management Companies)

### Orlando Rental/PM Market Size

| Metric | Value |
|---|---|
| Renter-occupied units in Orlando MSA | ~430,000 |
| New rental units delivered in 2024 | ~11,000 |
| Estimated professionally managed units | ~258,000 (60% of rentals) |
| Number of PM companies in Orlando metro | ~350 |
| Average portfolio per PM company | ~737 units |
| Annual turnover rate | 45% |
| Annual turnovers (professionally managed) | ~116,100 |
| Average maintenance spend per unit/year | $1,200 |
| Total PM maintenance market | $309.6M |

### Contract Structure

PM contracts are structured as preferred vendor agreements:

| Component | Details |
|---|---|
| Contract type | Preferred vendor / exclusive vendor for select verticals |
| Term | 12 months, auto-renew |
| Volume commitment | None required (usage-based) |
| Response time SLA | 24-hour for routine, 4-hour for urgent |
| Billing | Monthly invoice, net-30 |
| Integration | API connection to AppFolio, Buildium, or Yardi |

**Typical PM Service Mix**

| Service | Use Case | Annual Volume (per 500 units) | Annual GMV |
|---|---|---|---|
| Home cleaning | Turnover deep clean | 225 turnovers x $200 | $45,000 |
| Junk removal | Tenant cleanout | 50 units x $300 | $15,000 |
| Carpet cleaning | Turnover refresh | 225 turnovers x $150 | $33,750 |
| Pressure washing | Annual exterior | 100 units x $175 | $17,500 |
| Landscaping | Ongoing grounds | 12 months x $2,000 | $24,000 |
| Handyman | Repairs, punch list | 200 jobs x $200 | $40,000 |
| **Total Annual GMV** | | | **$175,250** |
| **UpTend Revenue (20%)** | | | **$35,050** |

### Revenue Per PM Contract

| PM Portfolio Size | Annual GMV | UpTend Revenue (20%) |
|---|---|---|
| Small (100 units) | $35,050 | $7,010 |
| Medium (500 units) | $175,250 | $35,050 |
| Large (2,000 units) | $701,000 | $140,200 |

### Turnover Maintenance: The Key Revenue Driver

Tenant turnover is the single largest maintenance event for any rental property. Orlando's 45% turnover rate creates predictable, recurring demand.

Per-turnover service bundle:

| Service | Price | UpTend Revenue |
|---|---|---|
| Deep clean | $200 | $40 |
| Carpet cleaning | $150 | $30 |
| Touch-up handyman | $175 | $35 |
| Pressure wash (exterior) | $125 | $25 |
| Junk removal (if needed, 30% of turnovers) | $250 | $50 |
| **Total per turnover** | **$665 (avg $725 with junk)** | **$133** |

With 225 turnovers per year for a 500-unit portfolio, turnover alone generates $29,925 in UpTend revenue.

### Integration with PM Software

UpTend's API integration creates a seamless workflow:

| Platform | Market Share (Orlando) | Integration Value |
|---|---|---|
| AppFolio | 30% | Work orders auto-create UpTend jobs; invoice syncs back |
| Buildium | 20% | Maintenance request routing, vendor payment tracking |
| Yardi | 25% | Enterprise-grade integration, bulk work order management |
| Other/Manual | 25% | George AI handles via email/text parsing |

Integration reduces PM friction to zero: a maintenance request in their existing software automatically dispatches an UpTend pro. This is the moat.

### Recurring Revenue Model

| Metric | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| New PM contracts signed | 10 | 20 | 30 |
| Retained from prior year | 0 | 9 | 26 |
| Total active PM contracts | 10 | 29 | 56 |
| Avg units per PM | 400 | 450 | 500 |
| Avg UpTend revenue per PM | $24,000 | $29,000 | $34,000 |
| **Total PM Revenue** | **$240,000** | **$840,000** | **$1,920,000** |

PM retention rate: 90% (switching costs are high once integrated).

---

## 4. CONSTRUCTION WEDGE (Builders/Developers)

### Orlando New Construction and Renovation Market

| Metric | Value | Source |
|---|---|---|
| New residential permits (Orlando MSA, 2024) | ~15,000 | HBWeekly FL reports |
| Osceola County permits (Q1-Q3 2025) | 2,088 (+30% YoY) | HBWeekly |
| Top builders: Lennar, D.R. Horton, Pulte | ~1,465 permits/month (statewide) | HBWeekly Dec 2024 |
| Average new home price (Orlando) | $385,000 | Realtor.com 2024 |
| Renovation permits (estimated) | ~25,000/year | Orange County building dept |
| Post-construction cleanup market (Orlando) | ~$45M | Estimated from permit volume |

### Post-Construction Cleanup and Punch List Services

| Service | Per-Home Cost | Volume Opportunity |
|---|---|---|
| Construction debris removal | $500 | Every new build |
| Post-construction deep clean | $400 | Every new build |
| Pressure washing (driveways, exterior) | $250 | Every new build |
| Landscaping (final grade, sod, planting) | $3,500 | 60% of new builds |
| Punch list handyman work | $600 | Every new build |
| **Total per new home** | **$4,350 (avg)** | |
| **UpTend Revenue per home (20%)** | **$870** | |

### Warranty Period Maintenance Contracts

Builders typically offer a 1-year bumper-to-bumper warranty and 2-year systems warranty. UpTend services warranty maintenance requests:

| Warranty Service | Avg Cost | Frequency (per 100 homes/year) |
|---|---|---|
| Handyman callbacks | $150 | 300 jobs |
| Gutter adjustments | $100 | 50 jobs |
| Pressure washing (warranty clean) | $175 | 100 jobs |
| Landscaping corrections | $200 | 75 jobs |
| **Annual warranty GMV (per 100 homes)** | | **$83,250** |
| **UpTend Revenue (20%)** | | **$16,650** |

### Revenue Per Builder Relationship

| Builder Size | Homes/Year (Orlando) | Post-Construction Revenue | Warranty Revenue | Total UpTend Revenue |
|---|---|---|---|---|
| Small (local) | 50 | $43,500 | $8,325 | $51,825 |
| Medium (regional) | 200 | $174,000 | $33,300 | $207,300 |
| Large (national) | 1,000 | $870,000 | $166,500 | $1,036,500 |

### How Construction Feeds Consumer Pipeline

Every new home built is a new homeowner who needs ongoing services:

- Builder includes UpTend welcome packet at closing
- New homeowner gets free Home DNA Scan ($99 value) as move-in gift
- George AI contacts homeowner at 30, 90, 180, and 365 days with seasonal service reminders
- Conversion rate: 25% of new homeowners become active UpTend customers within 12 months

**Pipeline math for a medium builder (200 homes/year):**
- 200 homes x 25% conversion = 50 new consumer customers
- 50 customers x $510 LTV = $25,500 in lifetime consumer value
- Acquired at $0 CAC

### Revenue Projections: Construction Wedge

| Metric | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Builder relationships | 3 | 8 | 15 |
| Avg homes per builder | 75 | 100 | 125 |
| Total homes serviced | 225 | 800 | 1,875 |
| Post-construction revenue | $96,000 | $336,000 | $768,000 |
| Warranty revenue | $24,000 | $84,000 | $192,000 |
| **Total Construction Revenue** | **$120,000** | **$420,000** | **$960,000** |

---

## Pro Acquisition Cost Analysis

### Method 1: Direct Recruitment (Without Business Partnership)

**Acquisition Channels and Costs**

| Channel | Monthly Spend | Leads/Month | Conversion Rate | Pros Acquired/Month | Cost Per Pro |
|---|---|---|---|---|---|
| Indeed/ZipRecruiter job posts | $800 | 60 | 12% | 7 | $114 |
| Facebook/Instagram ads | $600 | 45 | 8% | 4 | $150 |
| Craigslist/local classifieds | $100 | 20 | 15% | 3 | $33 |
| Field recruitment (job sites, supply stores) | $200 | 10 | 30% | 3 | $67 |
| Pro referral program ($50 bonus) | $250 | 8 | 50% | 4 | $63 |
| **Total** | **$1,950** | **143** | **15% avg** | **21** | **$93 avg** |

**Onboarding Costs Per Pro**

| Item | Cost |
|---|---|
| Background check | $35 |
| Insurance verification | $15 |
| Platform onboarding (staff time) | $50 |
| Welcome kit / branded materials | $25 |
| **Total onboarding** | **$125** |

**Total Cost Per Pro (Direct): $218**

**Time to First Job**

| Milestone | Timeline |
|---|---|
| Application to approval | 5 days |
| Profile setup and training | 2 days |
| First job match | 3-7 days |
| **Total: Application to first job** | **10-14 days** |

**Pro Churn and Replacement**

| Metric | Value |
|---|---|
| 90-day churn rate | 35% |
| Annual churn rate | 50% |
| Replacement cost | $218 (full acquisition cost) |
| Annual replacement cost per pro slot | $109 |
| Effective annual cost per active pro | $327 |

**Break-Even Timeline Per Pro**

| Metric | Value |
|---|---|
| Total acquisition cost | $218 |
| Revenue per job to UpTend | $50 |
| Avg jobs per pro per month | 8 |
| Monthly revenue per pro | $400 |
| Variable cost per job | $8.55 |
| Monthly contribution per pro | $331.60 |
| **Break-even: Less than 1 month** | |

### Method 2: Small Business Partnership (Business Partner Portal)

In this model, an existing home services company (e.g., a cleaning company with 15 employees) joins UpTend as a Business Partner and loads their entire workforce onto the platform.

**Acquisition Costs Per Pro (Partnership)**

| Item | Cost |
|---|---|
| Partner sales outreach | $200 (spread across avg 10 pros) |
| Per-pro allocation of sales cost | $20 |
| Background check | $0 (already done by employer) |
| Insurance verification | $0 (company policy covers all) |
| Platform onboarding (bulk) | $15 per pro |
| **Total cost per pro** | **$35** |

**Partnership Revenue Model**

| Component | Details |
|---|---|
| Partner company take | 80% of job revenue (they pay their employees) |
| UpTend platform fee | 15% from partner company (not individual pro) |
| Customer service fee | 5% from customer |
| Partner volume bonus | 2% rebate on fees above 100 jobs/month |

**Benefits of Partnership Model**

| Benefit | Impact |
|---|---|
| Pre-vetted workforce | No screening cost, lower risk |
| Pre-insured | $0 insurance verification, reduced liability |
| Already equipped | Tools, vehicles, uniforms provided |
| Lower churn | Employees stay because they have a job, not gig work |
| Faster onboarding | Bulk upload, same-day activation |
| Quality consistency | Company manages QA internally |

### Comparison: Direct Recruitment vs. Business Partnership

| Metric | Direct Recruitment | Business Partnership |
|---|---|---|
| Cost per pro acquired | $218 | $35 |
| Time to first job | 10-14 days | 1-3 days |
| Background check cost | $35 | $0 |
| Insurance cost | $15 | $0 |
| 90-day churn rate | 35% | 10% |
| Annual churn rate | 50% | 20% |
| Annual replacement cost per pro | $109 | $7 |
| Effective annual cost per pro | $327 | $42 |
| Quality consistency | Variable | High |
| Scalability | Linear (1 pro at a time) | Step function (10+ pros per partner) |
| Break-even per pro | Less than 1 month | Less than 1 week |
| **Cost savings** | **Baseline** | **84% lower** |

**How Partnership Changes Unit Economics**

| Metric | Direct Only | With 50% Partnership Mix |
|---|---|---|
| Blended pro acquisition cost | $218 | $127 |
| Blended annual pro cost | $327 | $185 |
| Contribution margin per job | $41.45 | $41.45 |
| Pro cost allocated per job (annualized) | $3.41 | $1.93 |
| **Net margin per job** | **$38.04** | **$39.52** |

The partnership model is not just cheaper; it is structurally superior. It converts fixed recruiting costs into a scalable channel that grows with demand. A single partnership with a 20-person cleaning company delivers the same pro capacity as 2 months of direct recruitment at 16% of the cost.

---

## Cross-Wedge Synergies

The four wedges do not operate in isolation. They create compounding value:

| Source Wedge | Feeds Into | Mechanism | Free Customers/Year (Year 3) |
|---|---|---|---|
| HOA | Consumer | Residents see UpTend, book personal services | 2,800 |
| Construction | Consumer | New homeowners get welcome packet + free scan | 469 |
| PM | Consumer | Tenants see quality work, book after moving to owned home | 200 |
| Consumer | Pro Supply | High volume attracts more pros, improving all wedges | N/A |
| **Total free consumer acquisition** | | | **3,469** |

At $510 LTV per customer, the cross-wedge pipeline generates **$1.77M in lifetime consumer value annually** at zero acquisition cost by Year 3.

---

## Home DNA Scan: The Data Moat

The Home DNA Scan is not just a service; it is a proprietary data asset that compounds over time.

| Metric | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Scans completed | 1,200 | 4,500 | 12,000 |
| Revenue ($99 standard / $249 aerial, 70/30 mix) | $163,800 | $614,250 | $1,638,000 |
| Avg services booked per scan | 1.8 | 2.2 | 2.5 |
| Incremental GMV generated per scan | $450 | $550 | $625 |
| Total incremental GMV from scans | $540,000 | $2,475,000 | $7,500,000 |
| UpTend revenue on incremental GMV (20%) | $108,000 | $495,000 | $1,500,000 |

Every scan creates a maintenance profile for a home. Over time, this data enables:
1. Predictive maintenance recommendations (George AI contacts homeowners before problems worsen)
2. Neighborhood-level demand forecasting (optimize pro supply positioning)
3. Insurance and real estate partnerships (home condition data is valuable to third parties)
4. HOA-wide scan programs that drive community-level contracts

---

## Summary: Path to $10M ARR

| Milestone | Timeline | Key Driver |
|---|---|---|
| $100K ARR | Month 6 | First 5 HOA contracts + early consumer traction |
| $500K ARR | Month 12 | 25 HOAs + 10 PMs + consumer flywheel spinning |
| $1M ARR | Month 15 | HOA pipeline compounding, PM integration live |
| $2.5M ARR | Month 20 | 50+ HOAs, construction partnerships, Home DNA Scan scaling |
| $5M ARR | Month 27 | Cross-wedge synergies fully active |
| $10M ARR | Month 36 | 140 HOAs, 56 PMs, 15 builders, 14K+ active consumers |

The HOA wedge is the priority. It delivers the highest revenue per contract, the lowest acquisition cost relative to value, the strongest retention, and the most powerful consumer pipeline effect. Every HOA signed is a beachhead that generates 20+ free consumer customers and proves the platform to pros.

UpTend's defensibility comes from three layers: George AI (157 tools, unmatched automation), the Home DNA Scan data moat (proprietary home condition intelligence), and network effects (more pros = better service = more customers = more pros). No competitor in Orlando has all three.
