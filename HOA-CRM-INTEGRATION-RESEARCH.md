# HOA/PM Software Integration Research

## API Availability Summary

| Platform | API Available | Type | Access | Work Orders | Voting | Notes |
|----------|:---:|------|--------|:-----------:|:------:|-------|
| **AppFolio** | ✅ | REST (Stack API) | Partner program | ✅ | ❌ | Rich API: bills, charges, work orders, properties, units, violations, attachments. Sandbox available. Partner application required. |
| **Buildium** | ✅ | REST (Open API) | Developer portal | ✅ | ❌ | Full Open API at developer.buildium.com. Work orders, properties, tenants, payments, maintenance. SDK on GitHub (LeadSimple/buildium). Most accessible API. |
| **Yardi** | ✅ | REST/SOAP | Partner program | ✅ | ❌ | 450+ interface partners. Requires 2+ year company age + 3 active Voyager clients for Standard partnership. Enterprise-gated. |
| **GetQuorum** | ✅ | REST (Alpha) | Developer docs | ❌ | ✅ | Voting-specific. Can create/manage meetings, pull vote results, stats (votesSubmitted, maxVoters, attendingCount). Partner API at integrations.getquorum.com. |
| **Condo Control** | ⚠️ | Integration partners | Contact sales | ⚠️ | ⚠️ | Has integrations page but no public API docs. Likely partner-level access. 40+ modules including maintenance, violations, voting. |
| **CINC Systems** | ⚠️ | Partner integrations | Contact sales | ⚠️ | ⚠️ | Software partner program (VendorSmart, ClickPay, etc.). No public API. 75M+ Americans in HOAs using CINC. Recently acquired ONR. |
| **TownSq** | ❌ | No public API | N/A | ❌ | ❌ | Markets itself as "API platform" but GetApp confirms no public API. Would need partnership discussion. |
| **PayHOA** | ❌ | No public API | N/A | ❌ | ❌ | Simple self-managed HOA tool. No developer program found. |

## Priority Integration Plan

### Tier 1: Build Now (Open APIs)

#### 1. Buildium (EASIEST — Open API, full docs)
- **Endpoint**: developer.buildium.com
- **Auth**: API key (client_id + client_secret)
- **Key endpoints**:
  - `GET /v1/workorders` — list work orders
  - `POST /v1/workorders` — create work order
  - `PUT /v1/workorders/{id}` — update status
  - `GET /v1/properties` — list properties
  - `GET /v1/units` — list units
  - `GET /v1/tenants` — list tenants
  - `POST /v1/workorders/{id}/attachments` — upload photos/reports
- **Integration flow**: Buildium work order created → webhook to George → George dispatches → job complete → George updates Buildium work order + attaches report
- **SDK**: github.com/LeadSimple/buildium (auto-generated from OpenAPI spec)

#### 2. AppFolio (Stack API — partner application required)
- **Endpoint**: AppFolio Stack Partners
- **Auth**: OAuth2 (partner program)
- **Key endpoints**:
  - Work Orders (CRUD)
  - Properties, Units, Occupancies
  - Bills (create invoices back)
  - Violations (read/create)
  - Attachments (upload to any entity)
  - Community Associations (HOA-specific)
- **Integration flow**: Same as Buildium but richer — can also sync violations, bills, and community association data
- **Requirement**: Apply to AppFolio Stack partner program
- **Sandbox**: Available for approved partners

#### 3. GetQuorum (Voting Integration)
- **Endpoint**: docs.getquorum.com / integrations.getquorum.com
- **Auth**: API key (partner program)
- **Key endpoints**:
  - `GET /campaigns` — list meetings/votes
  - `GET /campaigns/{key}` — get vote details + stats
  - Stats include: votesSubmitted, maxVoters, attendingCount
  - Dashboard URL for each campaign
- **Integration flow**: George pulls vote results → "Board approved the landscaping contract 67-23. I'm scheduling it now."
- **Value**: George can announce vote results, auto-act on approved maintenance budgets

### Tier 2: Partnership Required

#### 4. Yardi Voyager
- **Requirement**: 2+ years in business, 3+ active Voyager clients
- **Plan**: Apply after first 3 PM clients are using UpTend + one of the Tier 1 integrations
- **Endpoints**: Full property management suite
- **Note**: Enterprise sales cycle, worth it for large PM companies

#### 5. Condo Control
- **Plan**: Contact sales for integration partnership
- **Value**: 1M+ users, 40+ modules, strong in FL market
- **Approach**: Pitch UpTend as a vendor management integration partner

#### 6. CINC Systems
- **Plan**: Apply to software partner program
- **Value**: Dominant in large HOA management companies
- **Note**: Recently acquired ONR (resident-facing app) — integration surface area expanding

### Tier 3: No API (Workarounds)

#### TownSq & PayHOA
- No public API available
- **Workaround**: CSV import/export, email-based work order forwarding
- George can parse forwarded maintenance request emails from these platforms
- Long-term: request API access as UpTend grows

## Technical Architecture

```
                    ┌─────────────────────┐
                    │   PM's CRM/Portal   │
                    │ (AppFolio/Buildium/  │
                    │  Yardi/CondoControl) │
                    └────────┬────────────┘
                             │ webhook / polling
                    ┌────────▼────────────┐
                    │  PMS Integration    │
                    │  Service            │
                    │  (pms-integration.ts)│
                    └────────┬────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼──┐  ┌───────▼───┐  ┌───────▼───┐
     │  George   │  │   Job     │  │  Report   │
     │  Agent    │  │  Routing  │  │  Writer   │
     │  (AI)     │  │  Cascade  │  │  (back    │
     │           │  │           │  │  to CRM)  │
     └───────────┘  └───────────┘  └───────────┘
```

### Data Flow: Work Order → Dispatch → Report Back

1. **Inbound**: CRM creates maintenance request
2. **George intercepts**: Runs diagnostic questions with tenant (SMS/email)
3. **George scopes**: Determines service type, gets photos if realistic
4. **George dispatches**: Routes through job cascade to best available pro
5. **Pro completes**: Photos, condition notes, observations
6. **George reports back**: Structured report written back to CRM
   - Status updated to "Completed"
   - Photos attached
   - Invoice line items synced
   - Tenant satisfaction score logged

### Database Schema Addition

```sql
CREATE TABLE IF NOT EXISTS pms_connections (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  business_account_id VARCHAR NOT NULL,
  platform VARCHAR NOT NULL,  -- appfolio | buildium | yardi | getquorum | condo_control | cinc | custom_webhook
  api_key TEXT,
  api_secret TEXT,
  webhook_url TEXT,
  callback_url TEXT,
  sync_enabled BOOLEAN DEFAULT true,
  sync_direction VARCHAR DEFAULT 'bidirectional',
  last_sync_at TIMESTAMP,
  field_mappings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pms_sync_log (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id VARCHAR NOT NULL,
  direction VARCHAR NOT NULL,  -- inbound | outbound
  entity_type VARCHAR NOT NULL,  -- work_order | property | violation | vote | invoice
  external_id VARCHAR,
  internal_id VARCHAR,
  status VARCHAR DEFAULT 'success',
  payload JSONB,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## B2B Pitch Addition

### Slide: "Plugs Into What You Already Use"

George doesn't replace your CRM. He makes it actually work.

**Direct Integrations:**
- AppFolio — Work orders flow in, reports flow back
- Buildium — Two-way sync, zero manual entry
- Yardi — Enterprise-grade for large portfolios
- GetQuorum — Vote results → auto-action

**George as the Glue:**
- Maintenance request in CRM → George dispatches → Report writes back
- Vote approved → George schedules
- Budget set → George monitors spend
- Tenant feedback → George aggregates for board

**Coming Soon:**
- Condo Control, CINC Systems, RentManager
- Custom webhook API for any platform

"Your CRM stores data. George does the work."
