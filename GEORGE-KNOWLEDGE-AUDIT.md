# George Knowledge Audit — March 4, 2026

## Knowledge Checklist

| Feature | Status | Notes |
|---------|--------|-------|
| 13 service verticals (incl. Painting) | ✅ | Listed explicitly in UPTEND SERVICE VERTICALS |
| Founding 100 (10% off first 10 jobs) | ✅ | Dedicated FOUNDING 100 PROGRAM section |
| Home DNA Scan (free) | ✅ | Extensive coverage, multiple pitch rotations |
| Instant Home Intelligence (/home-report, scan_property_address) | ✅ | Dedicated section + tool wired |
| 144 SEO pages (12x12) | ✅ | Mentioned in SEO & CONTENT COVERAGE section |
| 30 blog posts | ✅ | Mentioned in same section |
| HOA violation detection system | ✅ | Full section + 5 tools wired |
| HOA pages (/hoa/inspections, /hoa/dashboard, /my-home/violations) | ✅ | Referenced in violation section |
| Partner model (white-label, Comfort Solutions) | ✅ | Partner tools + BUSINESS PARTNER PROGRAM section |
| Partner invoicing system (/partners/invoices) | ✅ | Dedicated section |
| B2B conversational dashboard | ✅ | 16 B2B tools wired |
| Job routing cascade (4 tiers) | ✅ | Dedicated JOB ROUTING CASCADE section |
| Discovery page (/discovery) | ✅ | Separate GEORGE_DISCOVERY_SYSTEM_PROMPT |
| Sales leads dashboard (/sales/leads) | ✅ | Mentioned in SALES LEADS DASHBOARD section |
| 5% customer fee + 15% pro fee = 20% | ✅ | Consumer sees 5%; pro told "keeps 85%" |
| Price protection / guaranteed ceiling | ✅ | Mentioned throughout, smart_match_pro |
| Founding member discount | ✅ | Dedicated section |
| Emergency dispatch | ✅ | Extensive coverage + multiple tools |
| Spanish language support | ✅ | Sr. Jorge, auto-detect |
| B2B pricing (tiers, consultation) | ✅ | Full HOA/PM/Construction tier pricing |
| Pro signup and onboarding | ✅ | Detailed 6-step walkthrough |
| Background checks, insurance verification | ✅ | Mentioned in pro onboarding |
| Stripe payments | ✅ | generate_payment_link tool |
| ElevenLabs TTS (Josh voice) | ✅ | Voice mode mentioned (speaker icon) |
| $25 credit REMOVED | ✅ | No $25 signup credit anywhere |
| Two quote paths only | ✅ | smart_match_pro (single) + get_multi_pro_quotes (3 options) |
| George personality rules | ✅ | Extensive personality/guardrails sections |

## Knowledge Gaps

**None found.** George's consumer prompt covers every feature listed in MEMORY.md and decision files.

## Tool Wiring Issues

### All 230 tools have matching definitions AND handlers — no orphans in either direction.

### Phantom Tool References in Prompt (tools mentioned in instructions but don't exist):

1. **`update_home_profile`** (line 897) — Prompt says "Store every detail via update_home_profile tool." This tool does NOT exist. George should use `save_home_memory` instead.

2. **`get_pro_observations`** (line 777) — Prompt says "call get_pro_observations" for post-job upsell. This tool does NOT exist in TOOL_DEFINITIONS.

3. **`get_price_match_eligibility`** (line 705) — Prompt says "Check via get_price_match_eligibility before offering." This tool does NOT exist in TOOL_DEFINITIONS.

### Impact:
- When Claude tries to call these phantom tools, the `default` case returns `{ error: "Unknown tool: ..." }`, which the `safeExecuteTool` wrapper catches gracefully. So no crash, but George will get confused and may tell the user something went wrong.

## Stale Information

1. **Tool count discrepancy** — Prompt says "197 tools" in multiple places. Actual count in TOOL_DEFINITIONS: **230 tools**. Should be updated.

2. **"GPT-5.2" reference** (line 213) — Prompt says "diagnose it with AI vision (GPT-5.2)". This is wrong/aspirational — the system uses GPT-4o for vision. Minor cosmetic issue.

## Recommendations

### Must Fix (prompt changes):
1. **Line 897**: Change `update_home_profile` → `save_home_memory`
2. **Line 777**: Remove reference to `get_pro_observations` or add the tool
3. **Line 705**: Remove reference to `get_price_match_eligibility` or add the tool
4. **Multiple locations**: Update "197 tools" → "230 tools" (or just say "200+")

### Nice to Have:
- Update GPT-5.2 reference to match actual model used
- The 3 phantom tool references won't crash but will waste tokens on failed tool calls
