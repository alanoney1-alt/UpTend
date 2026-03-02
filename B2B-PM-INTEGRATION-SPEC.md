# B2B Property Management Integration Spec

George becomes the operating system for PM portfolios. The CRM stores data. George does the work.

---

## 1. PMS Integration Layer (AppFolio, Buildium, Yardi, RentManager)

### Architecture
```
PM's CRM (AppFolio/Buildium/Yardi)
    ↕ webhook + REST API
George Integration Layer (server/services/pms-integration.ts)
    ↕
George Agent + Job Routing Cascade
    ↕
Pro Network
    ↕ status updates, photos, reports
George writes back to CRM automatically
```

### Supported PMS Platforms (Priority Order)
1. **AppFolio** — Most popular with mid-size PMs in Florida. REST API available.
2. **Buildium** — Popular with smaller PMs. Open API.
3. **Yardi Voyager** — Enterprise. API access varies by contract.
4. **RentManager** — Mid-market. API available.

### Sync Capabilities

#### Inbound (CRM → George)
- **Work order created** → George picks it up, runs diagnostics, dispatches pro
- **Tenant maintenance request** → George intercepts, asks questions via SMS/email, gets photos, creates optimized work order
- **Unit marked "lease ending"** → George triggers turnover autopilot sequence
- **New property added** → George runs free Home DNA Scan, builds memory profile
- **Budget updated** → George adjusts spend watchdog thresholds

#### Outbound (George → CRM)
- **Job completed** → Structured report with photos, condition notes, cost, pro info written back as work order update
- **Inspection report** → Auto-populated in CRM's document/compliance section
- **Invoice** → Line-item invoice synced to CRM billing
- **Tenant satisfaction score** → Written to tenant/unit record
- **Maintenance forecast** → Exported as CSV or PDF to CRM documents

### Data Model
```typescript
interface PMSConnection {
  id: string;
  businessAccountId: string;
  platform: 'appfolio' | 'buildium' | 'yardi' | 'rentmanager' | 'custom_webhook';
  apiKey?: string;
  apiSecret?: string;
  webhookUrl?: string;        // their inbound webhook (we call)
  callbackUrl?: string;       // our webhook (they call)
  syncEnabled: boolean;
  syncDirection: 'inbound' | 'outbound' | 'bidirectional';
  lastSyncAt?: string;
  mappings: {                 // field mapping between their schema and ours
    propertyId?: string;
    unitId?: string;
    tenantId?: string;
    workOrderId?: string;
  };
  createdAt: string;
}
```

---

## 2. Morning Briefing (Daily PM Text)

### Flow
1. Cron fires at 7:00 AM EST every weekday
2. George queries the PM's portfolio:
   - Open work orders count + urgency
   - Turnovers this week
   - Overdue maintenance
   - Budget status (% spent vs allocation)
   - Any tenant satisfaction alerts (score < 3/5)
3. Sends SMS/email to PM with summary
4. PM can reply inline: "Handle the gutters" → George dispatches

### Message Format
```
Morning, [Name]. Here's your portfolio:

3 open work orders (1 urgent: pipe leak at 420 Oak)
2 turnovers due this week (units 4B, 7A)
1 property overdue for gutter cleaning
Budget: 61% of Q1 spent, 8 weeks remaining

Reply "handle gutters" or "dispatch 420 Oak" and I'm on it.
```

### Implementation
- New tool: `send_morning_briefing_to_pm`
- Cron job per business account (or batched daily)
- Reply handling via existing SMS/email inbound routes
- George parses natural language replies and executes

---

## 3. Turnover Autopilot

### Trigger
PM marks unit as "lease ending" (via CRM sync or George chat: "Unit 4B lease ends March 15")

### Sequence George Auto-Schedules
1. **Move-out inspection** (Day of move-out or day after)
2. **Deep clean** — full home cleaning
3. **Carpet cleaning** — if carpeted
4. **Paint touch-up** — handyman service
5. **Landscaping refresh** — curb appeal
6. **Final walkthrough** — George sends photos to PM for approval
7. **Move-in ready notification** — PM gets "Unit 4B is ready" with photo proof

### Customizable
- PM can set default turnover package per property type
- Skip steps, add steps, reorder
- Budget cap per turnover
- Preferred pros locked in

### Data Model
```typescript
interface TurnoverSequence {
  id: string;
  businessAccountId: string;
  propertyId: string;
  unitNumber?: string;
  moveOutDate: string;
  targetReadyDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'paused';
  steps: TurnoverStep[];
  totalBudget?: number;
  actualSpend: number;
  createdAt: string;
}

interface TurnoverStep {
  order: number;
  serviceType: string;       // home_cleaning, carpet_cleaning, handyman, landscaping, etc.
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'skipped';
  scheduledDate?: string;
  jobId?: string;             // linked service_request
  cost?: number;
  notes?: string;
}
```

---

## 4. Budget Watchdog

### How It Works
- PM sets quarterly/monthly budget per portfolio or per property
- George tracks all completed job spend against budget
- Proactive alerts at 50%, 75%, 90% thresholds
- At 90%: "You're at 90% of your Q1 budget with 3 weeks left. Want me to hold non-urgent jobs until Q2?"
- PM can reply "hold" or "proceed" or "raise budget to $X"

### Smart Budget Features
- **Seasonal adjustment** — George knows Q3 (hurricane season) typically costs 20-30% more in Orlando
- **Category breakdown** — "62% of your budget went to landscaping. Want me to negotiate a recurring rate?"
- **Year-over-year comparison** — "Spending is down 15% vs last year. Home DNA Scans caught 3 issues early."
- **Board-ready export** — One command: "George, send me the Q1 budget report" → PDF with charts

### Data Model
```typescript
interface BudgetAlert {
  id: string;
  businessAccountId: string;
  budgetId: string;
  threshold: number;          // 0.5, 0.75, 0.9
  triggered: boolean;
  triggeredAt?: string;
  pmResponse?: 'hold' | 'proceed' | 'adjust';
  adjustedAmount?: number;
}
```

---

## 5. Tenant Satisfaction Pulse

### Flow
1. Job completed → George waits 2 hours
2. Texts tenant: "Hey, this is George from UpTend. How was the [service] at your place today? Quick 1-5, 5 being perfect."
3. Tenant replies "4" → George logs it
4. If 3 or below → George follows up: "Sorry to hear that. What could have been better?" → logs feedback, alerts PM
5. Aggregated into satisfaction score per property, per pro, per service type

### PM Dashboard Data
- Portfolio-wide satisfaction score (e.g., 4.3/5)
- Trending up or down vs last quarter
- Worst-performing properties (by tenant satisfaction)
- Best pros (by satisfaction)
- Board-ready: "Tenant satisfaction is 4.3/5, up from 4.1 last quarter"

### George Can Report Via Chat
PM: "How are tenants feeling?"
George: "Portfolio satisfaction is 4.3 out of 5 this quarter. Up from 4.1. Your Lake Nona properties are at 4.6. Kissimmee is dragging at 3.8 — mostly slow response complaints. Want me to prioritize faster dispatch there?"

---

## 6. Home Memory as Moat

### What George Remembers Per Unit
- HVAC system: brand, model, age, last service, filter size
- Water heater: type, age, condition
- Roof: material, age, last inspection
- Plumbing: known issues, pipe material, last service
- Appliances: age, brand, warranty status
- Pest history: treatments, recurring issues
- Chronic issues: "Unit 7 has moisture in the master bath — check annually"
- Tenant preferences: "Mrs. Rodriguez prefers morning appointments"

### Why This Is a Moat
Switching from UpTend means losing years of accumulated property intelligence. No other vendor has this data. The PM would have to rebuild it from scratch. That's expensive and painful.

### George Surfaces It Automatically
- Pro arrives at unit → George briefs them: "HVAC is a 2019 Trane XR15, last serviced 8 months ago. Tenant mentioned a weird noise last month."
- PM asks about a property → George includes health context without being asked
- Turnover prep → George knows exactly what needs attention based on history

---

## 7. Predictive Maintenance Calendar

### How It Works
George builds a 12-month rolling forecast per property:
- HVAC service: every 6 months (FL humidity = more frequent)
- Gutter cleaning: every 6 months (oak trees = more frequent)
- Pressure washing: annually
- Pool: monthly (if applicable)
- Pest control: quarterly
- Roof inspection: annually
- Landscaping: biweekly/monthly

Adjusted for:
- Property age (older = more maintenance)
- Orlando climate (hurricane season prep in May-June)
- Historical issues (chronic problems get more frequent checks)
- Home DNA Scan data (known system ages/conditions)

### Board Presentation
One command: "George, generate the maintenance forecast for the board"
→ PDF/HTML with:
- 12-month calendar view
- Estimated costs per month
- Properties requiring major work (roof replacement, HVAC replacement)
- Budget recommendation for next fiscal year
- Comparison to industry benchmarks

---

## 8. Vendor Performance Intelligence

### What George Tracks Per Pro
- Average completion time by service type
- Tenant satisfaction scores
- Callback rate (had to come back to fix something)
- Photo documentation quality
- On-time arrival rate
- Cost consistency (does the job come in at/under quote?)

### PM Can Ask
- "Who's my best pressure washing pro?"
- "Which pro has the most callbacks?"
- "Compare my top 3 handymen"
- George answers with real data, not opinions

### Auto-Optimization
George silently routes jobs to better-performing pros over time. PMs don't have to manage vendor performance — George does it automatically via the routing cascade. Bad pros naturally get fewer jobs.

---

## Implementation Priority

### Phase 1 (Build Now)
1. Morning briefing tool + cron
2. Budget watchdog alerts
3. Tenant satisfaction pulse (post-job text)
4. Predictive maintenance calendar generator
5. Vendor performance scoring in George tools

### Phase 2 (Post-M1)
1. AppFolio integration (webhook + API)
2. Buildium integration
3. Turnover autopilot full sequence
4. Board report PDF generator
5. Two-way CRM sync

### Phase 3 (Scale)
1. Yardi / RentManager integrations
2. Custom webhook API for any PMS
3. White-label George for enterprise PMs
4. Multi-portfolio management (PM manages multiple HOAs)

---

## The Pitch (One Sentence)
"George doesn't replace your CRM — he makes it actually work. Every maintenance request gets handled, every unit gets tracked, every dollar gets accounted for, and your board gets a report they can actually read."
