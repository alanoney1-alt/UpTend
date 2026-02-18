/**
 * George AI Agent — Function Calling Brain
 *
 * Takes user messages, sends to Claude with tool definitions,
 * handles tool calls via george-tools.ts, returns final response + buttons.
 */

import { anthropic } from "./ai/anthropic-client";
import * as tools from "./george-tools";
import { getHomeScanInfo } from "./george-scan-pitch";
import {
  getDIYDisclaimerConsent,
  recordDIYDisclaimerAcknowledgment,
} from "./diy-coach";
import {
  identifyPartFromPhoto,
  findReplacementPart,
  getTechnicalReference,
  troubleshootOnSite,
  findNearestSupplyStore,
  getQuickTutorial,
} from "./pro-field-assist";

// ─────────────────────────────────────────────
// A. CONSUMER System Prompt
// ─────────────────────────────────────────────
const GEORGE_SYSTEM_PROMPT = `You are George, UpTend's AI assistant. You help customers book home services in the Orlando metro area.

DIY COACHING SAFETY RULES (MANDATORY — NEVER SKIP):
1. ALWAYS show the DIY disclaimer (call getDIYDisclaimerConsent) BEFORE any repair coaching, step-by-step guidance, or diagnostic assessment. Do NOT provide ANY repair instructions until the customer explicitly acknowledges.
2. NEVER skip safety warnings. Every coaching response involving tools, electricity, water, heights, or chemicals MUST include relevant safety precautions.
3. If a customer attempts to override a safety escalation (e.g., "I'll be fine" on electrical panel work, gas lines, structural mods), firmly but kindly INSIST on professional service: "I hear you, but I really can't walk you through this one — it's a safety thing, not a skill thing. Let me get you a pro who can knock this out safely. 🔧"
4. Log all disclaimers shown and customer acknowledgments via the consent system (recordDIYDisclaimerAcknowledgment).
5. If customer says "get me a pro" at ANY point during coaching, immediately pivot to booking a professional — no questions asked.

CRITICAL RULES:
1. NEVER state a price from memory. You MUST call get_service_pricing or calculate_quote tools EVERY TIME a customer asks about pricing. Even if you think you know the price, CALL THE TOOL. This is non-negotiable.
2. Keep responses SHORT — 1-3 sentences max. Use quick reply buttons for common next steps.
3. Ask ONE question at a time. Don't overwhelm with options.
4. When a customer mentions ANY service by name, IMMEDIATELY call get_service_pricing to get the full pricing details before responding.
5. When you can calculate an exact quote, show the number prominently with a booking button.
6. If unsure about anything, say "Let me get you connected with our team" — never guess.
7. Be warm, direct, and helpful. Not corporate. Not robotic.
8. You can detect what page the user is on from context — tailor your greeting.

CAPABILITIES:
- Look up pricing for any service
- Calculate exact quotes based on customer selections
- Find bundle discounts (always look for multi-service savings!)
- Help start a booking
- Check service availability by zip code
- Look up customer's existing jobs (if logged in)
- Home memory: remember home details (beds/baths, pool, pets) and reference them naturally
- Service history: know when services were last done and suggest re-booking ("Your gutter cleaning was 8 months ago — due for another")
- Seasonal advisor: proactively suggest services based on Orlando season ("Hurricane season starts June 1 — recommend gutter + tree trimming bundle")
- Emergency concierge: for urgent issues, dispatch fast — skip small talk, ask ONLY address + what happened, then dispatch
- Photo diagnosis: encourage photo uploads for accurate quotes ("Send me a photo of what's broken and I'll tell you what it needs + price")
- Budget awareness: if customer mentions a budget, work within it and prioritize
- Tax helper: summarize home service expenses for deduction purposes
- Neighborhood intel: share local pricing context ("Average lawn care in Lake Nona is $150/mo")
- Family/group: understand shared accounts, landlord/tenant dynamics
- Warranty tracking: mention warranty expiration if relevant
- Bundle suggestor: ALWAYS look for multi-service savings opportunities
- Pro browsing: help customer pick their pro ("Marcus has 4.9 stars and specializes in pressure washing")
- BNPL: mention Buy Now Pay Later for jobs $199+ (already built into UpTend — do NOT invent new payment plans)
- HOA awareness: if relevant, note HOA maintenance requirements
- Upsell (helpful not pushy): "While we're there for gutters, want us to check the roof too? Only $49 add-on"
- Seasonal recommendations: call get_seasonal_recommendations when customer asks what they should do this time of year
- Neighborhood pricing: call get_neighborhood_insights when customer asks about local pricing or what neighbors pay
- Trust & safety: call get_pro_arrival_info to give real-time "Your pro Marcus is 8 min away in a white Ford F-150" updates
- Insurance claims: call get_storm_prep_checklist before storms, call generate_claim_documentation to compile job records into claim-ready format
- Referrals: after positive experiences, proactively mention referral program — call get_referral_status to show credits earned
- Group deals: call get_neighborhood_group_deals to check if neighbors are pooling for a discount
- Loyalty tiers: call get_customer_loyalty_status to show tier (Bronze/Silver/Gold/Platinum) and what's unlocked; mention tier progress naturally ("This booking puts you at Gold — unlocks 5% off everything")
- Milestones: call get_customer_milestones for birthday/anniversary/spending milestone celebrations
- Community: call get_neighborhood_activity and get_local_events for neighborhood context
- Post-booking: after each booking, call get_post_booking_question and ask exactly ONE relevant follow-up question
- Maintenance reminders: call get_home_maintenance_reminders to surface upcoming maintenance items; call get_home_tips for seasonal tips
- Custom reminders: call add_custom_reminder when customer wants to set a recurring reminder
- Education (build trust): occasionally share quick DIY tips for truly minor issues — "That sounds like a running toilet flapper — $3 fix at Home Depot. Want a video? But if it's still running, I can send a plumber." Frame it as: "I'll always be honest about what needs a pro vs. what you can handle"
- Shopping assistant: call search_products to find products at Home Depot, Lowe's, Walmart, Amazon, Harbor Freight, Ace Hardware with buy links
- Product recommendations: call get_product_recommendation to suggest exact products based on their home profile (e.g., "Your HVAC uses 20x25x1 filters")
- Price comparison: call compare_prices for side-by-side pricing across retailers
- YouTube tutorials: call find_diy_tutorial to find how-to videos for any home task — always share top 3 videos with links
- Shopping list: call get_shopping_list to compile everything they should buy (overdue maintenance, seasonal, project supplies)
- DIY projects: call start_diy_project when customer wants to do a project — creates full plan with steps, tools, products, tutorials
- Seasonal DIY: call get_seasonal_diy_suggestions for what to work on this month
- SAFETY: For dangerous DIY (electrical beyond light fixtures, gas lines, roofing 2+ stories, garage door springs, tree removal near power lines, structural mods, asbestos/lead paint) — ALWAYS say: "I found a tutorial, but honestly? This one's dangerous to DIY. Let me get you a pro quote — it's worth the safety." Then offer to book a pro.
- Emergency disaster mode: call get_disaster_mode_status to check active weather alerts; call get_emergency_pros for immediate dispatch
- Smart home awareness: when relevant, mention that in the future UpTend will integrate with Ring, smart locks, thermostats, and water sensors for automated dispatch — say "In the future, I'll be able to connect with your smart home devices"
- Accessibility: if customer mentions calling, voice, or accessibility needs, let them know voice mode is coming soon. For elderly or less tech-savvy users, use simpler language and shorter sentences.

AUTO REPAIR ASSISTANT:
- Help customers diagnose car issues, find parts, look up OBD-II codes, and find repair tutorials
- Add vehicles to their profile and track maintenance schedules
- Call diagnose_car_issue when they describe car symptoms, get_obd_code for dashboard codes, search_auto_parts for parts shopping

SHOPPING ASSISTANT:
- Search products across Home Depot, Lowe's, Walmart, Amazon — with buy links
- Compare prices across retailers, recommend exact products based on their home profile
- Build shopping lists for maintenance and DIY projects

DIY COACHING:
- Guide customers through safe DIY repairs with step-by-step coaching
- ALWAYS show DIY disclaimer first (get_diy_disclaimer_consent) before any repair coaching
- Escalate dangerous tasks to a pro immediately — safety first

HOME UTILITIES TRACKING:
- Know their trash/recycling schedule, sprinkler settings, water restrictions, utility providers
- Tonight checklist, custom home reminders, full home operating system dashboard

WARRANTY & PURCHASE TRACKING:
- Track warranties across all scanned/registered items, alert before expiration
- Scan receipts to auto-log purchases and register warranties
- Connect retailer accounts for automatic purchase history import

INSURANCE CLAIMS:
- Help start insurance claims with start_insurance_claim
- Storm prep checklists, claim documentation compilation from past jobs

MORNING BRIEFINGS:
- Personalized daily briefing: weather, schedule, home alerts, trash day, seasonal tips, loyalty status
- Call get_morning_briefing when customer opens chat in the morning

HOME SCAN SELLING (be natural, not pushy):
- When a customer first signs up, mentions home maintenance, asks about documenting their home, or seems like a good fit — mention the free Home Scan.
- Lead with value: "Like a medical record for your home" — insurance protection, warranty tracking, preventive savings, resale value.
- Key hook: it's FREE and they EARN $25 + $1 per appliance ($40-50 typical). Takes 15-20 minutes.
- Call get_home_scan_info to get the full pitch and FAQ when discussing the scan in depth.
- Don't force it. If they're here for a specific service, help them first. Mention the scan naturally when relevant: "By the way, have you done a Home Scan yet? It's free and you'd earn credits toward this service."
- Tiers: Self-serve (free), Pro Scan ($99, in-person), Drone Scan ($249, aerial).

DAILY ENGAGEMENT:
- When a customer opens the chat before 11 AM, offer a morning briefing: call get_morning_briefing and share: "Good morning! Here's your home update..." (weather, today's schedule, any alerts). Keep it short — 3-4 bullets max.
- Always know the weather and tie it to services: "Storms coming Thursday — want me to check your gutters first?"
- Track their home spending: call get_spending_tracker when relevant — "You've spent $340 of your $500 monthly budget. $160 left."
- Know their calendar: call get_calendar_suggestion when scheduling — "I see you're free Tuesday afternoon — perfect for that pressure washing."
- Share one daily tip related to their home when it feels natural (not every message) — call get_morning_briefing which includes the tip.
- Seasonal countdowns: call get_seasonal_countdown — "Hurricane season in 47 days. Your home readiness: 7/10."
- Home value awareness: call get_home_value_estimate occasionally for context — "Fun fact — homes with clean gutters sell for 3-5% more. Yours are due."
- When customer asks "what's happening today" or "home update" or "morning briefing": call get_morning_briefing immediately.
- When customer asks about trash/recycling day: call get_trash_schedule.
- When customer asks about their spending: call get_spending_tracker.
- When customer asks to see their full home dashboard: call get_home_dashboard.

DAILY HOOKS (use naturally, never all at once):
- Morning: weather + schedule + alerts — call get_morning_briefing
- Midday: pro updates if jobs are happening — check get_customer_jobs
- Evening: daily summary if something happened
- Weekly: spending recap via get_spending_tracker + upcoming maintenance via get_home_maintenance_reminders

EMERGENCY RULES (highest priority):
- When customer mentions EMERGENCY words ("pipe burst", "flooding", "tree fell", "fire", "water leak", "gas smell", "break-in", "unsafe", "hurt"), IMMEDIATELY enter emergency mode
- In emergency mode: skip small talk, ask ONLY two things — (1) address and (2) what happened — then dispatch
- NEVER upsell during an emergency
- If customer says they feel unsafe or threatened, immediately provide emergency support: "Call 911 if you're in immediate danger. For home emergencies call UpTend at (407) 338-3342 — available 24/7."
- Call get_emergency_pros after collecting address + situation

LANGUAGE:
- If the user writes in Spanish, respond ENTIRELY in Spanish for the rest of the conversation.
- If they switch back to English, switch back.
- Auto-detect — don't ask "do you speak Spanish?" Just match their language naturally.
- You are fully fluent in both English and Spanish.

PERSONALITY:
- Friendly, conversational, like a helpful neighbor
- Use emoji sparingly (1-2 per message max)
- When showing prices, use bold formatting
- Always offer a clear next action (button or question)

RESPONSE FORMAT:
After your message, you may optionally include a JSON block for quick-reply buttons.
Put it on its own line starting with BUTTONS: followed by a JSON array.
Example: BUTTONS: [{"text":"Book Now","action":"navigate:/book?service=home_cleaning"},{"text":"See Other Services","action":"reply:What other services do you offer?"}]
Action types: "navigate:/path", "reply:message text", "action:startBooking"
Only include buttons when they add value. Max 4 buttons.`;

// ─────────────────────────────────────────────
// B. PRO System Prompt
// ─────────────────────────────────────────────
const GEORGE_PRO_SYSTEM_PROMPT = `You are George, UpTend's AI assistant for service professionals. You help pros maximize their earnings, manage their business, and grow on the platform.

DIY COACHING SAFETY RULES (MANDATORY — applies when pros ask for technical guidance):
1. ALWAYS show the DIY disclaimer before providing repair coaching, even to pros.
2. NEVER skip safety warnings — pros can get hurt too.
3. If a task requires a different specialty license than what the pro holds, recommend they subcontract or refer out.
4. Log all disclaimers shown and acknowledged via the consent system.

CRITICAL RULES:
1. You are speaking to a SERVICE PRO — a person who earns money on UpTend, not a customer booking services.
2. Keep responses focused on their business: jobs, earnings, certs, schedule, growth.
3. When a pro asks about earnings or dashboard, CALL the pro tools to get real data.
4. Be their business mentor, not a customer service rep.
5. Never quote consumer prices — talk about payouts and earnings instead.

CAPABILITIES (call the relevant tools):
- Goal tracker (FIRST THING): call get_pro_goal_progress when a pro opens chat — show earnings vs. goal upfront: "You're at $3,200 / $5,000 (64%) — 12 days left. Need about 12 more jobs."
- Dashboard guide: call get_pro_dashboard for earnings, ratings, job history, cert progress, tier level
- Job management: call get_pro_schedule for upcoming jobs and scheduling
- Earnings insights: call get_pro_earnings with period (week/month/year) — "You made $3,200 this month — 15% more than last month"
- Certification coach: call get_pro_certifications — "You need 2 more certs for Gold tier — that unlocks B2B jobs worth 3x more"
- Scheduling tips: call get_pro_schedule to see tomorrow's jobs and give route advice
- Parts & materials: walk through parts request workflow
- Job documentation: call get_pro_job_prompts to show what to photograph and note during each job type
- Photo upload help: guide through before/after documentation
- Scope change assistance: help file scope changes with proper documentation
- Equipment recommendations: suggest equipment for job types
- Market intelligence: call get_pro_market_insights for demand trends; call get_pro_demand_forecast for area-specific demand by day of week — proactively surface this: "Pressure washing demand is up 40% in your area this week"
- Customer retention: call get_pro_customer_retention — "3 customers haven't booked in 3+ months — want to follow up?"
- Review management: call get_pro_reviews — "You got a 5-star review from Sarah! Want to send a thank you?"
- Profile optimization: "Adding a profile photo increases bookings by 35%"
- Dispute help: guide through dispute resolution process
- Referral bonuses: mention $25/referral payout for bringing other pros — call get_referral_status for details
- Payout info: "Payouts deposit every Thursday"
- Tax prep: "Track your mileage — each mile is worth about $0.67 in deductions"
- Goal setting: call set_pro_goal when pro wants to set a monthly earnings target
- Accessibility: if pro mentions voice or calling, let them know voice mode is coming soon

PLATFORM KNOWLEDGE:
- Tier system: Bronze (1-2 certs) → Silver (3-5 certs) → Gold (6+ certs)
- Gold tier unlocks B2B property management jobs — worth 3x more per job
- No lead fees — pros keep 100% of their quoted rate minus platform fee
- Background check and insurance verification required for all pros
- Weekly payouts every Thursday
- Dispute resolution: submit photos + description within 24 hours of job completion
- Rating system: 4.7+ maintains priority job matching
- Top earners: average $5,000-$8,000/month with 2+ service certifications

PERSONALITY: Like a supportive business mentor who actually knows the numbers.
- Direct, encouraging, data-driven
- "Here's what the top earners do differently..."
- Celebrate wins ("Great week! You're 18% above average")
- Practical tips, not fluff
- Use emoji sparingly (0-1 per message)

LANGUAGE:
- If the user writes in Spanish, respond ENTIRELY in Spanish for the rest of the conversation.
- Auto-detect — just match naturally. Fully fluent in both English and Spanish.

RESPONSE FORMAT:
After your message, you may optionally include a JSON block for quick-reply buttons.
Put it on its own line starting with BUTTONS: followed by a JSON array.
Example: BUTTONS: [{"text":"My Schedule","action":"reply:Show me my schedule"},{"text":"My Earnings","action":"reply:How much did I make this month?"}]
Action types: "navigate:/path", "reply:message text"
Only include buttons when they add value. Max 4 buttons.`;

// ─────────────────────────────────────────────
// C. B2B System Prompt
// ─────────────────────────────────────────────
const GEORGE_B2B_SYSTEM_PROMPT = `You are George, UpTend's business solutions assistant. You help property managers, HOA boards, construction companies, and government procurement officers understand how UpTend can replace their entire vendor network.

DIY COACHING SAFETY RULES (MANDATORY — applies if B2B users request technical guidance):
1. ALWAYS show the DIY disclaimer before providing any repair or maintenance coaching.
2. NEVER skip safety warnings. B2B clients have liability exposure for their tenants and properties.
3. For property managers: recommend licensed professionals for tenant-occupied units — liability is amplified.
4. Log all disclaimers shown and acknowledged via the consent system.

CRITICAL RULES:
1. You are speaking to BUSINESS DECISION MAKERS, not consumers. Be professional but not stiff.
2. Keep responses concise and value-focused. Lead with ROI and efficiency.
3. When asked about pricing, reference the tiered structure but always suggest a demo for exact quotes.
4. Never guess at custom pricing — offer to connect them with the team.
5. Emphasize: one platform, one invoice, one dashboard — replaces 15+ vendor relationships.
6. When they ask about analytics, portfolio, vendors, or billing — CALL the relevant B2B tools.

CAPABILITIES (call the relevant tools):
- Portfolio analytics: call get_portfolio_analytics — "Your 200 units cost an average of $47/unit/month for maintenance"
- Vendor scorecards: call get_vendor_scorecard — "Pro Marcus completes jobs 2 hours faster than average"
- Budget forecasting: use portfolio data to project seasonal spend
- Compliance audit: call get_compliance_status — "3 of your vendors have expired insurance"
- Auto-fill work orders: discuss how AI dispatch matches pros to open work orders automatically
- Billing walkthrough: call get_billing_history — "Your weekly invoice covers X completed jobs"
- Contracts & documents: call generate_service_agreement to draft MSA, SOW, or custom agreements; call get_document_status to track W-9s, COIs, lien waivers
- Team management: help add/remove team members, set permissions
- Integration setup: walk through AppFolio/Buildium/Yardi connection
- SLA monitoring: show SLA compliance from vendor scorecard
- Tenant communication: explain tenant-facing notification features
- Report generation: discuss ESG report capabilities for board presentations
- Onboarding: conversational walkthrough of entire platform setup
- ROI calculator: call generate_roi_report — "You're saving $12K/year vs your previous vendor setup"
- PM-to-PM referral: mention that property managers can refer other PMs for platform credits
- Accessibility: if team member mentions voice or accessibility needs, note voice mode is coming soon

PRICING TIERS (reference only — suggest demo for exact fit):
- Property Management: $4/$6/$10 per door/mo (Starter/Pro/Enterprise)
- HOA: $3/$5/$8 per unit/mo (Starter/Pro/Enterprise)
- Construction: $299/$599/$999/mo (Starter/Pro/Enterprise)
- Government: $15K/$35K/$75K/yr (Municipal/County/State)
- All plans: Net Weekly invoicing, volume discounts (2.5% at 10+ jobs, 5% at 25+, 7.5% at 50+)

KEY SELLING POINTS:
- AI-powered dispatch — right pro, right job, automatically
- Every pro is background-checked, insured, and certified
- Real-time GPS tracking and photo documentation on every job
- Guaranteed pricing ceiling — no scope creep surprises
- Weekly billing with line-item detail
- ESG/sustainability reporting for board presentations
- Veteran-owned subsidiary for government contracts (SDVOSB, MBE, SBA 8(a))
- Full compliance and audit trails
- White-label portal available on Enterprise tiers
- AppFolio, Buildium, Yardi, RentManager integrations

LANGUAGE:
- If the user writes in Spanish, respond ENTIRELY in Spanish for the rest of the conversation.
- Auto-detect — don't ask. Just match naturally. Fully fluent in both English and Spanish.

PERSONALITY:
- Professional, knowledgeable, consultative
- Like a sharp account executive who actually knows the product
- Use data and specifics, not fluff
- Emoji: minimal (0-1 per message)
- Always offer a clear next step (schedule demo, see pricing, talk to team)

RESPONSE FORMAT:
Same as consumer — optional BUTTONS: JSON array on its own line.
Prefer buttons like: "Schedule a Demo", "See PM Pricing", "See HOA Pricing", "Talk to Our Team", "Calculate My ROI"`;

// ─────────────────────────────────────────────
// Claude Tool Definitions
// ─────────────────────────────────────────────
const TOOL_DEFINITIONS: any[] = [
  // ── Existing consumer tools ──────────────────
  {
    name: "get_service_pricing",
    description: "Get complete pricing details for a specific service including tiers, add-ons, and minimums. Always call this before quoting any price.",
    input_schema: {
      type: "object",
      properties: {
        service_id: {
          type: "string",
          description: "Service identifier: home_cleaning, carpet_cleaning, junk_removal, handyman, gutter_cleaning, landscaping, pool_cleaning, pressure_washing, moving_labor, garage_cleanout, light_demolition, home_scan",
        },
      },
      required: ["service_id"],
    },
  },
  {
    name: "calculate_quote",
    description: "Calculate an exact price quote for a service based on customer selections. Uses the same pricing math as the booking flow.",
    input_schema: {
      type: "object",
      properties: {
        service_id: {
          type: "string",
          description: "Service identifier",
        },
        selections: {
          type: "object",
          description: "Service-specific selections. home_cleaning: {bedrooms, bathrooms, stories, cleanType, addOns[]}. carpet_cleaning: {rooms, cleanType, hallways, stairs, scotchgard, package}. junk_removal: {items[{id,quantity}] or loadSize}. handyman: {tasks[{taskId,variables}] or hours}. gutter_cleaning: {stories, linearFeet}. landscaping: {lotSize, planType/tier}. pool_cleaning: {tier}. pressure_washing: {squareFootage}. moving_labor: {hours, numPros}. garage_cleanout: {size}. light_demolition: {scope}. home_scan: {tier}.",
        },
      },
      required: ["service_id", "selections"],
    },
  },
  {
    name: "get_bundle_options",
    description: "Find bundle packages that include the requested services, showing savings. Always check for bundles when a customer asks about 2+ services.",
    input_schema: {
      type: "object",
      properties: {
        service_ids: {
          type: "array",
          items: { type: "string" },
          description: "Array of service IDs to find bundles for",
        },
      },
      required: ["service_ids"],
    },
  },
  {
    name: "check_availability",
    description: "Check if a service is available in a specific zip code and date.",
    input_schema: {
      type: "object",
      properties: {
        service_id: { type: "string" },
        zip: { type: "string", description: "5-digit zip code" },
        date: { type: "string", description: "Preferred date (YYYY-MM-DD)" },
      },
      required: ["service_id", "zip"],
    },
  },
  {
    name: "create_booking_draft",
    description: "Create a draft booking for the customer to review and confirm. Does NOT charge.",
    input_schema: {
      type: "object",
      properties: {
        service_id: { type: "string" },
        selections: { type: "object", description: "Service-specific options" },
        address: { type: "string" },
        date: { type: "string" },
        time_slot: { type: "string" },
      },
      required: ["service_id", "selections"],
    },
  },
  {
    name: "get_customer_jobs",
    description: "Get active and recent jobs for a logged-in customer.",
    input_schema: {
      type: "object",
      properties: {
        user_id: { type: "string" },
      },
      required: ["user_id"],
    },
  },
  {
    name: "get_all_services",
    description: "Get the full list of available services with names and starting prices.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },

  // ── Home intelligence tools (Consumer) ────────
  {
    name: "get_home_profile",
    description: "Get the customer's home profile: beds/baths, sqft, pool, pets, appliances, etc. Use to personalize recommendations.",
    input_schema: {
      type: "object",
      properties: {
        user_id: { type: "string", description: "Customer's user ID" },
      },
      required: ["user_id"],
    },
  },
  {
    name: "get_service_history",
    description: "Get the customer's complete service history — like a Carfax for their home. Shows all past jobs with dates, pros, prices, and ratings.",
    input_schema: {
      type: "object",
      properties: {
        user_id: { type: "string", description: "Customer's user ID" },
      },
      required: ["user_id"],
    },
  },
  {
    name: "get_seasonal_recommendations",
    description: "Get recommended services for the current season in Orlando. Call when customer asks what they should do this time of year or what's due.",
    input_schema: {
      type: "object",
      properties: {
        month: { type: "number", description: "Current month (1-12)" },
        home_type: { type: "string", description: "residential, condo, townhome, etc." },
        location: { type: "string", description: "City/area, e.g. 'Orlando, FL'" },
      },
      required: ["month"],
    },
  },
  {
    name: "get_maintenance_schedule",
    description: "Generate a full-year maintenance calendar for the customer based on their home details.",
    input_schema: {
      type: "object",
      properties: {
        home_details: {
          type: "object",
          description: "Home details object: {bedrooms, bathrooms, hasPool, sqft, yearBuilt}",
        },
      },
      required: ["home_details"],
    },
  },
  {
    name: "get_neighborhood_insights",
    description: "Get average service prices and popular services in the customer's neighborhood. Call when they ask about local pricing or what neighbors pay.",
    input_schema: {
      type: "object",
      properties: {
        zip: { type: "string", description: "5-digit zip code" },
      },
      required: ["zip"],
    },
  },

  // ── Pro tools ─────────────────────────────────
  {
    name: "get_pro_dashboard",
    description: "Get the pro's dashboard summary: earnings, rating, jobs completed, active jobs, cert progress, tier. Call when a pro asks how they're doing.",
    input_schema: {
      type: "object",
      properties: {
        pro_id: { type: "string", description: "Pro's user ID" },
      },
      required: ["pro_id"],
    },
  },
  {
    name: "get_pro_earnings",
    description: "Get detailed earnings breakdown for a pro by time period. Call when pro asks about money, payouts, income.",
    input_schema: {
      type: "object",
      properties: {
        pro_id: { type: "string", description: "Pro's user ID" },
        period: { type: "string", enum: ["week", "month", "year", "all"], description: "Time period for earnings" },
      },
      required: ["pro_id", "period"],
    },
  },
  {
    name: "get_pro_schedule",
    description: "Get the pro's upcoming job schedule with addresses, times, and service types.",
    input_schema: {
      type: "object",
      properties: {
        pro_id: { type: "string", description: "Pro's user ID" },
      },
      required: ["pro_id"],
    },
  },
  {
    name: "get_pro_certifications",
    description: "Get the pro's active certifications, available certs, progress toward next tier, and earnings unlock potential.",
    input_schema: {
      type: "object",
      properties: {
        pro_id: { type: "string", description: "Pro's user ID" },
      },
      required: ["pro_id"],
    },
  },
  {
    name: "get_pro_market_insights",
    description: "Get demand trends, average rates, and seasonal patterns for specific service types. Call when pro asks about market opportunities.",
    input_schema: {
      type: "object",
      properties: {
        service_types: {
          type: "array",
          items: { type: "string" },
          description: "Array of service types the pro offers or is considering",
        },
      },
      required: ["service_types"],
    },
  },
  {
    name: "get_pro_reviews",
    description: "Get recent reviews and rating trends for the pro.",
    input_schema: {
      type: "object",
      properties: {
        pro_id: { type: "string", description: "Pro's user ID" },
      },
      required: ["pro_id"],
    },
  },

  // ── Trust & Safety ────────────────────────────
  {
    name: "get_pro_arrival_info",
    description: "Get real-time pro arrival info: name, photo, vehicle, ETA, tracking link. Call when customer asks 'where is my pro' or pro is en_route.",
    input_schema: {
      type: "object",
      properties: {
        job_id: { type: "string", description: "The job/service request ID" },
      },
      required: ["job_id"],
    },
  },

  // ── Insurance Claims ──────────────────────────
  {
    name: "get_storm_prep_checklist",
    description: "Get pre-storm preparation checklist with bookable services and documentation tips. Call when customer mentions hurricane prep, storm prep, or insurance documentation.",
    input_schema: {
      type: "object",
      properties: {
        home_type: { type: "string", description: "Home type: residential, condo, pool, etc." },
        location:  { type: "string", description: "City/area, e.g. 'Orlando, FL'" },
      },
    },
  },
  {
    name: "generate_claim_documentation",
    description: "Compile all job photos, receipts, and service records from past jobs into insurance claim-ready format. Call when customer asks about insurance claims or post-storm documentation.",
    input_schema: {
      type: "object",
      properties: {
        job_ids: {
          type: "array",
          items: { type: "string" },
          description: "Array of job IDs to include in documentation",
        },
      },
      required: ["job_ids"],
    },
  },

  // ── Referral Engine ───────────────────────────
  {
    name: "get_referral_status",
    description: "Get referral code, referral link, credits earned, and pending referrals. Call after positive experiences or when customer asks about referrals.",
    input_schema: {
      type: "object",
      properties: {
        user_id: { type: "string", description: "Customer or pro user ID" },
      },
      required: ["user_id"],
    },
  },
  {
    name: "get_neighborhood_group_deals",
    description: "Check if neighbors are pooling for a group discount on a service. Call when customer asks about group discounts or neighborhood deals.",
    input_schema: {
      type: "object",
      properties: {
        zip: { type: "string", description: "5-digit zip code" },
      },
      required: ["zip"],
    },
  },

  // ── Pro Business Intelligence ─────────────────
  {
    name: "get_pro_demand_forecast",
    description: "Get demand forecast by service type and area: best days to work, high-demand zones, weekly demand index. Call when pro asks about market opportunities or best times to work.",
    input_schema: {
      type: "object",
      properties: {
        service_types: { type: "array", items: { type: "string" }, description: "Service types the pro offers" },
        zip: { type: "string", description: "Pro's primary zip code" },
      },
      required: ["service_types", "zip"],
    },
  },
  {
    name: "get_pro_customer_retention",
    description: "Get repeat customer stats and at-risk customers (haven't booked in 3+ months). Call when pro asks about their customer base or retention.",
    input_schema: {
      type: "object",
      properties: {
        pro_id: { type: "string", description: "Pro's user ID" },
      },
      required: ["pro_id"],
    },
  },

  // ── Emergency & Disaster Mode ─────────────────
  {
    name: "get_emergency_pros",
    description: "Get available emergency/after-hours pros for urgent situations. Call immediately when customer reports an emergency (pipe burst, flooding, storm damage, etc.).",
    input_schema: {
      type: "object",
      properties: {
        service_type: { type: "string", description: "Type of emergency service needed" },
        zip: { type: "string", description: "Customer's zip code" },
      },
      required: ["service_type", "zip"],
    },
  },
  {
    name: "get_disaster_mode_status",
    description: "Check if area is under active weather alert and get relevant emergency services. Call when customer mentions storms, hurricanes, or major weather events.",
    input_schema: {
      type: "object",
      properties: {
        zip: { type: "string", description: "5-digit zip code" },
      },
      required: ["zip"],
    },
  },

  // ── Loyalty & Gamification ────────────────────
  {
    name: "get_customer_loyalty_status",
    description: "Get customer's loyalty tier (Bronze/Silver/Gold/Platinum), lifetime spend, perks, and progress to next tier. Call when discussing pricing perks or after a booking.",
    input_schema: {
      type: "object",
      properties: {
        user_id: { type: "string", description: "Customer's user ID" },
      },
      required: ["user_id"],
    },
  },
  {
    name: "get_customer_milestones",
    description: "Get milestone achievements, upcoming unlocks, and anniversary/spending celebrations for a customer.",
    input_schema: {
      type: "object",
      properties: {
        user_id: { type: "string", description: "Customer's user ID" },
      },
      required: ["user_id"],
    },
  },

  // ── Community Features ────────────────────────
  {
    name: "get_neighborhood_activity",
    description: "Get anonymized nearby bookings, popular services, and active group deals in the customer's neighborhood.",
    input_schema: {
      type: "object",
      properties: {
        zip: { type: "string", description: "5-digit zip code" },
      },
      required: ["zip"],
    },
  },
  {
    name: "get_local_events",
    description: "Get upcoming community events and seasonal patterns relevant to home services in the customer's area.",
    input_schema: {
      type: "object",
      properties: {
        zip: { type: "string", description: "5-digit zip code" },
      },
      required: ["zip"],
    },
  },

  // ── Post-Booking Intelligence ─────────────────
  {
    name: "get_post_booking_question",
    description: "Get the ONE most valuable follow-up question to ask a customer after a specific booking. Always call after creating a booking draft.",
    input_schema: {
      type: "object",
      properties: {
        service_id:   { type: "string", description: "Service that was just booked" },
        home_profile: { type: "object", description: "Customer's home profile (optional)" },
      },
      required: ["service_id"],
    },
  },
  {
    name: "get_pro_job_prompts",
    description: "Get what the pro should photograph and note during a specific job type. Call when a pro asks about job documentation or best practices.",
    input_schema: {
      type: "object",
      properties: {
        service_id:   { type: "string", description: "Service type" },
        home_profile: { type: "object", description: "Home profile (optional)" },
      },
      required: ["service_id"],
    },
  },

  // ── Home Maintenance Reminders ────────────────
  {
    name: "get_home_maintenance_reminders",
    description: "Get upcoming maintenance items with due dates (air filters, gutters, water heater, etc.). Call when customer asks what they should do or what's coming due.",
    input_schema: {
      type: "object",
      properties: {
        user_id:      { type: "string", description: "Customer's user ID" },
        home_details: { type: "object", description: "Home details: {hasPool, bedrooms, yearBuilt, etc.}" },
      },
      required: ["user_id"],
    },
  },
  {
    name: "get_home_tips",
    description: "Get Orlando-specific seasonal home maintenance tips. Call when customer asks for seasonal advice.",
    input_schema: {
      type: "object",
      properties: {
        season:    { type: "string", enum: ["spring", "summer", "fall", "winter"], description: "Current season" },
        home_type: { type: "string", description: "Home type: residential, condo, etc." },
        location:  { type: "string", description: "City/area" },
      },
      required: ["season"],
    },
  },
  {
    name: "add_custom_reminder",
    description: "Set a custom recurring reminder for the customer (e.g., 'change water filter every 6 months').",
    input_schema: {
      type: "object",
      properties: {
        user_id:       { type: "string", description: "Customer's user ID" },
        description:   { type: "string", description: "What to remind them about" },
        interval_days: { type: "number", description: "How often in days (e.g., 90, 180, 365)" },
      },
      required: ["user_id", "description", "interval_days"],
    },
  },

  // ── Pro Goal Tracker ──────────────────────────
  {
    name: "get_pro_goal_progress",
    description: "Get a pro's earnings goal progress: current vs. goal, days left, jobs needed, streak, comparison to last month. Call at the START of every pro conversation.",
    input_schema: {
      type: "object",
      properties: {
        pro_id: { type: "string", description: "Pro's user ID" },
      },
      required: ["pro_id"],
    },
  },
  {
    name: "set_pro_goal",
    description: "Set or update a pro's monthly earnings target.",
    input_schema: {
      type: "object",
      properties: {
        pro_id:         { type: "string", description: "Pro's user ID" },
        monthly_target: { type: "number", description: "Monthly earnings target in dollars" },
      },
      required: ["pro_id", "monthly_target"],
    },
  },

  // ── Contracts & Documents (B2B) ───────────────
  {
    name: "generate_service_agreement",
    description: "Generate a draft service agreement (MSA, SOW) for a B2B client. Call when business asks about contracts or formalizing the relationship.",
    input_schema: {
      type: "object",
      properties: {
        business_id: { type: "string", description: "Business account ID" },
        terms: {
          type: "object",
          description: "Agreement terms: {agreementType, services[], endDate}",
        },
      },
      required: ["business_id"],
    },
  },
  {
    name: "get_document_status",
    description: "Track pending contracts, W-9s, COIs, lien waivers, and renewal dates for a business account.",
    input_schema: {
      type: "object",
      properties: {
        business_id: { type: "string", description: "Business account ID" },
      },
      required: ["business_id"],
    },
  },

  // ── B2B tools ─────────────────────────────────
  {
    name: "get_portfolio_analytics",
    description: "Get portfolio-level analytics for a business: properties count, avg cost/unit, open work orders, completed jobs, YTD spend.",
    input_schema: {
      type: "object",
      properties: {
        business_id: { type: "string", description: "Business account ID" },
      },
      required: ["business_id"],
    },
  },
  {
    name: "get_vendor_scorecard",
    description: "Get vendor performance metrics: top pros, completion rates, avg response time, SLA compliance, ratings.",
    input_schema: {
      type: "object",
      properties: {
        business_id: { type: "string", description: "Business account ID" },
      },
      required: ["business_id"],
    },
  },
  {
    name: "get_billing_history",
    description: "Get recent invoices, total spend, billing cycle info, and outstanding balance for a business.",
    input_schema: {
      type: "object",
      properties: {
        business_id: { type: "string", description: "Business account ID" },
      },
      required: ["business_id"],
    },
  },
  {
    name: "get_compliance_status",
    description: "Get vendor compliance status: insurance expiry, license status, audit trail, and overall compliance score.",
    input_schema: {
      type: "object",
      properties: {
        business_id: { type: "string", description: "Business account ID" },
      },
      required: ["business_id"],
    },
  },
  {
    name: "generate_roi_report",
    description: "Calculate ROI of using UpTend vs traditional vendor management. Call when a prospect asks about savings or value.",
    input_schema: {
      type: "object",
      properties: {
        current_spend: { type: "number", description: "Current annual spend on home/property services" },
        units: { type: "number", description: "Number of units/properties managed" },
      },
      required: ["current_spend", "units"],
    },
  },

  // ── Daily Engagement Tools (Phase 3) ─────────
  {
    name: "get_morning_briefing",
    description: "Get the customer's personalized morning briefing: weather, today's schedule, home alerts, trash day, seasonal countdown, daily tip, loyalty status. Call when customer opens chat before 11 AM or asks 'what's happening today'.",
    input_schema: {
      type: "object",
      properties: {
        user_id: { type: "string", description: "Customer's user ID" },
      },
      required: ["user_id"],
    },
  },
  {
    name: "get_home_dashboard",
    description: "Get the customer's full home dashboard: upcoming and recent jobs, smart devices status, spending summary, maintenance alerts. The 'one glance' view of their entire home.",
    input_schema: {
      type: "object",
      properties: {
        user_id: { type: "string", description: "Customer's user ID" },
      },
      required: ["user_id"],
    },
  },
  {
    name: "get_spending_tracker",
    description: "Get customer's home service spending for a period: total vs budget, breakdown by service category, comparison to last period. Call when customer asks about their spending or budget.",
    input_schema: {
      type: "object",
      properties: {
        user_id: { type: "string", description: "Customer's user ID" },
        period:  { type: "string", enum: ["month", "quarter", "year"], description: "Reporting period" },
      },
      required: ["user_id", "period"],
    },
  },
  {
    name: "get_trash_schedule",
    description: "Get trash and recycling pickup schedule for a zip code. Call when customer asks about trash day.",
    input_schema: {
      type: "object",
      properties: {
        zip: { type: "string", description: "5-digit zip code" },
      },
      required: ["zip"],
    },
  },
  {
    name: "get_home_value_estimate",
    description: "Get estimated home value and nearby comps for an address. Call when customer asks about their home's value or when suggesting value-add services.",
    input_schema: {
      type: "object",
      properties: {
        address: { type: "string", description: "Full address of the home" },
      },
      required: ["address"],
    },
  },
  {
    name: "get_calendar_suggestion",
    description: "Suggest the best time to book a service based on the customer's calendar availability, pro availability, and service requirements. Call when scheduling and the customer hasn't specified a time.",
    input_schema: {
      type: "object",
      properties: {
        user_id:    { type: "string", description: "Customer's user ID" },
        service_id: { type: "string", description: "Service being scheduled" },
      },
      required: ["user_id", "service_id"],
    },
  },
  {
    name: "get_seasonal_countdown",
    description: "Get countdowns to key seasonal events: hurricane season, spring cleaning, holiday season. Includes readiness score and prep recommendations.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },

  // ── Shopping Assistant + Tutorials ────────────
  {
    name: "search_products",
    description: "Search for home products across retailers (Home Depot, Lowe's, Walmart, Amazon, Harbor Freight, Ace Hardware). Use when customer asks where to buy something or needs a product.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Product search query, e.g. '20x25x1 air filter'" },
        category: { type: "string", description: "Optional category: filter, tool, appliance, supply, hardware, plumbing, electrical, paint, outdoor, cleaning" },
        specifications: { type: "object", description: "Optional specs like size, type, compatibility" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_product_recommendation",
    description: "Recommend exact products based on customer's home profile and appliances. E.g. 'What filter does my HVAC need?' Uses their registered appliance details to find exact matches.",
    input_schema: {
      type: "object",
      properties: {
        customer_id: { type: "string", description: "Customer ID" },
        appliance_type: { type: "string", description: "Type of appliance: hvac, water_heater, garage_door, sprinkler, etc." },
      },
      required: ["customer_id", "appliance_type"],
    },
  },
  {
    name: "compare_prices",
    description: "Compare prices for a product across all retailers. Use when customer asks 'what's cheapest' or wants a comparison.",
    input_schema: {
      type: "object",
      properties: {
        product_name: { type: "string", description: "Product to compare" },
        specifications: { type: "object", description: "Optional specs to narrow search" },
      },
      required: ["product_name"],
    },
  },
  {
    name: "find_diy_tutorial",
    description: "Find YouTube tutorials for a DIY task. Returns top videos with links. Flags dangerous tasks and recommends booking a pro.",
    input_schema: {
      type: "object",
      properties: {
        task: { type: "string", description: "What the customer wants to learn, e.g. 'flush water heater', 'change HVAC filter'" },
        difficulty: { type: "string", description: "Optional: easy, medium, hard" },
      },
      required: ["task"],
    },
  },
  {
    name: "get_shopping_list",
    description: "Get personalized shopping list for a customer — overdue maintenance items, seasonal needs, DIY project supplies. Sorted by urgency.",
    input_schema: {
      type: "object",
      properties: {
        customer_id: { type: "string", description: "Customer ID" },
      },
      required: ["customer_id"],
    },
  },
  {
    name: "start_diy_project",
    description: "Create a tracked DIY project with shopping list and tutorials. E.g. 'I want to repaint my bathroom' → full plan.",
    input_schema: {
      type: "object",
      properties: {
        customer_id: { type: "string", description: "Customer ID" },
        project_name: { type: "string", description: "Name of the project" },
        description: { type: "string", description: "Detailed description of what they want to do" },
      },
      required: ["customer_id", "project_name"],
    },
  },
  {
    name: "get_seasonal_diy_suggestions",
    description: "What DIY projects make sense this month? Seasonal recommendations based on time of year.",
    input_schema: {
      type: "object",
      properties: {
        month: { type: "number", description: "Month number 1-12. Defaults to current month." },
      },
    },
  },
  // ── Home Scan Pitch & FAQ ─────────────────────
  {
    name: "get_home_scan_info",
    description: "Get the Home Scan sales pitch and FAQ. Call when a customer asks about the Home Scan, wants to learn more about documenting their home, or when you want to naturally introduce the scan feature. Returns value propositions, credits breakdown, and common Q&A.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },

  // ── Home Scan Tools ───────────────────────────
  {
    name: "start_home_scan",
    description: "Start a guided room-by-room home scan session. Customer walks through rooms photographing appliances to earn credits.",
    input_schema: {
      type: "object",
      properties: { customer_id: { type: "string" } },
      required: ["customer_id"],
    },
  },
  {
    name: "process_home_scan_photo",
    description: "Process a photo uploaded during a home scan session. AI identifies the appliance, awards credit.",
    input_schema: {
      type: "object",
      properties: {
        customer_id: { type: "string" },
        scan_session_id: { type: "string" },
        room_name: { type: "string" },
        photo_url: { type: "string" },
      },
      required: ["customer_id", "scan_session_id", "room_name", "photo_url"],
    },
  },
  {
    name: "get_home_scan_progress",
    description: "Get progress of a customer's home scan: items scanned, credits earned, badges, tier.",
    input_schema: {
      type: "object",
      properties: { customer_id: { type: "string" } },
      required: ["customer_id"],
    },
  },
  {
    name: "get_wallet_balance",
    description: "Get the customer's UpTend wallet balance and recent transactions.",
    input_schema: {
      type: "object",
      properties: { customer_id: { type: "string" } },
      required: ["customer_id"],
    },
  },

  // ── Warranty Tools ────────────────────────────
  {
    name: "get_warranty_tracker",
    description: "Get all scanned items with warranty status sorted by expiring soonest. Shows alerts for expiring/expired warranties.",
    input_schema: {
      type: "object",
      properties: { customer_id: { type: "string" } },
      required: ["customer_id"],
    },
  },
  {
    name: "update_appliance_purchase_date",
    description: "Set purchase date for a scanned appliance to calculate warranty status.",
    input_schema: {
      type: "object",
      properties: {
        item_id: { type: "string" },
        purchase_date: { type: "string", description: "YYYY-MM-DD" },
      },
      required: ["item_id", "purchase_date"],
    },
  },
  {
    name: "get_warranty_dashboard",
    description: "Get all warranty registrations sorted by expiring soonest with alerts.",
    input_schema: {
      type: "object",
      properties: { customer_id: { type: "string" } },
      required: ["customer_id"],
    },
  },
  {
    name: "register_warranty",
    description: "Manually register a warranty for a product.",
    input_schema: {
      type: "object",
      properties: {
        customer_id: { type: "string" },
        product_name: { type: "string" },
        brand: { type: "string" },
        model: { type: "string" },
        serial_number: { type: "string" },
        purchase_date: { type: "string" },
        warranty_type: { type: "string" },
        warranty_duration: { type: "number", description: "Duration in months" },
        warranty_expires: { type: "string" },
        notes: { type: "string" },
      },
      required: ["customer_id", "product_name"],
    },
  },

  // ── Home Utilities ────────────────────────────
  {
    name: "get_recycling_schedule",
    description: "Get recycling pickup schedule and what's accepted/not accepted.",
    input_schema: {
      type: "object",
      properties: {
        customer_id: { type: "string" },
        zip: { type: "string" },
      },
      required: ["customer_id"],
    },
  },
  {
    name: "get_sprinkler_settings",
    description: "Get the customer's sprinkler system settings: zones, schedule, rain sensor status.",
    input_schema: {
      type: "object",
      properties: { customer_id: { type: "string" } },
      required: ["customer_id"],
    },
  },
  {
    name: "get_water_restrictions",
    description: "Get local watering ordinance and restrictions for the customer's area.",
    input_schema: {
      type: "object",
      properties: {
        customer_id: { type: "string" },
        county: { type: "string" },
        zip: { type: "string" },
        address_number: { type: "number" },
      },
      required: ["customer_id"],
    },
  },
  {
    name: "get_tonight_checklist",
    description: "Get the customer's evening checklist — things to do before bed (lock up, set alarm, etc.).",
    input_schema: {
      type: "object",
      properties: { customer_id: { type: "string" } },
      required: ["customer_id"],
    },
  },
  {
    name: "set_home_reminder",
    description: "Set a custom home reminder (e.g., 'change AC filter monthly').",
    input_schema: {
      type: "object",
      properties: {
        customer_id: { type: "string" },
        reminder_type: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        frequency: { type: "string", description: "daily, weekly, monthly, quarterly, annually" },
        next_due_date: { type: "string", description: "YYYY-MM-DD" },
        time: { type: "string", description: "e.g. 7:00 PM" },
      },
      required: ["customer_id", "title", "next_due_date"],
    },
  },
  {
    name: "get_utility_providers",
    description: "Get the customer's utility providers (electric, water, gas, trash).",
    input_schema: {
      type: "object",
      properties: {
        customer_id: { type: "string" },
        zip: { type: "string" },
      },
      required: ["customer_id"],
    },
  },

  // ── Insurance Claims ──────────────────────────
  {
    name: "start_insurance_claim",
    description: "Start an insurance claim process for the customer (storm damage, water damage, etc.).",
    input_schema: {
      type: "object",
      properties: {
        customer_id: { type: "string" },
        claim_type: { type: "string", description: "storm_damage, water_damage, fire, theft, etc." },
        description: { type: "string" },
      },
      required: ["customer_id", "claim_type", "description"],
    },
  },

  // ── Emergency Dispatch ────────────────────────
  {
    name: "create_emergency_dispatch",
    description: "Create an emergency dispatch for urgent situations (pipe burst, flooding, etc.). Use after collecting address and situation.",
    input_schema: {
      type: "object",
      properties: {
        customer_id: { type: "string" },
        emergency_type: { type: "string" },
        severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
        description: { type: "string" },
      },
      required: ["customer_id", "emergency_type", "severity", "description"],
    },
  },

  // ── Loyalty Rewards ───────────────────────────
  {
    name: "get_available_rewards",
    description: "Get available rewards the customer can redeem.",
    input_schema: {
      type: "object",
      properties: { customer_id: { type: "string" } },
      required: ["customer_id"],
    },
  },
  {
    name: "redeem_reward",
    description: "Redeem a specific reward for the customer.",
    input_schema: {
      type: "object",
      properties: { reward_id: { type: "string" } },
      required: ["reward_id"],
    },
  },

  // ── Referral Tools ────────────────────────────
  {
    name: "get_referral_code",
    description: "Get or generate the customer's referral code and share link.",
    input_schema: {
      type: "object",
      properties: { customer_id: { type: "string" } },
      required: ["customer_id"],
    },
  },
  {
    name: "create_group_deal",
    description: "Start a neighborhood group deal for a service type. 3+ neighbors = 15% off.",
    input_schema: {
      type: "object",
      properties: {
        customer_id: { type: "string" },
        neighborhood: { type: "string" },
        service_type: { type: "string" },
      },
      required: ["customer_id", "neighborhood", "service_type"],
    },
  },
  {
    name: "get_neighborhood_deals",
    description: "Get active group deals in a zip code.",
    input_schema: {
      type: "object",
      properties: { zip: { type: "string" } },
      required: ["zip"],
    },
  },

  // ── Auto / Vehicle Tools ──────────────────────
  {
    name: "add_vehicle_to_profile",
    description: "Add a vehicle to the customer's garage profile.",
    input_schema: {
      type: "object",
      properties: {
        customer_id: { type: "string" },
        year: { type: "number" }, make: { type: "string" }, model: { type: "string" },
        trim: { type: "string" }, vin: { type: "string" }, mileage: { type: "number" },
        color: { type: "string" }, nickname: { type: "string" },
      },
      required: ["customer_id"],
    },
  },
  {
    name: "get_vehicle_maintenance_schedule",
    description: "Get upcoming maintenance schedule for a customer's vehicle.",
    input_schema: {
      type: "object",
      properties: { vehicle_id: { type: "string" } },
      required: ["vehicle_id"],
    },
  },
  {
    name: "diagnose_car_issue",
    description: "AI-powered car issue diagnosis from symptoms. Describe what's happening and get likely causes + fixes.",
    input_schema: {
      type: "object",
      properties: {
        customer_id: { type: "string" },
        vehicle_id: { type: "string" },
        symptoms: { type: "string", description: "Describe what's happening with the car" },
        photos: { type: "array", items: { type: "string" } },
      },
      required: ["customer_id", "symptoms"],
    },
  },
  {
    name: "search_auto_parts",
    description: "Search for auto parts across retailers for a specific vehicle.",
    input_schema: {
      type: "object",
      properties: {
        customer_id: { type: "string" },
        part_name: { type: "string" },
        vehicle_id: { type: "string" },
        year: { type: "number" }, make: { type: "string" }, model: { type: "string" },
      },
      required: ["customer_id", "part_name"],
    },
  },
  {
    name: "find_auto_tutorial",
    description: "Find YouTube tutorials for auto repair tasks, optionally vehicle-specific.",
    input_schema: {
      type: "object",
      properties: {
        task: { type: "string" },
        year: { type: "number" }, make: { type: "string" }, model: { type: "string" },
      },
      required: ["task"],
    },
  },
  {
    name: "get_obd_code",
    description: "Look up what an OBD-II diagnostic code means and recommended actions.",
    input_schema: {
      type: "object",
      properties: { code: { type: "string", description: "OBD-II code like P0300, P0420, etc." } },
      required: ["code"],
    },
  },

  // ── Purchase Tracking ─────────────────────────
  {
    name: "scan_receipt_photo",
    description: "Scan a receipt photo to track purchases, auto-register warranties, and build purchase history.",
    input_schema: {
      type: "object",
      properties: {
        customer_id: { type: "string" },
        photo_url: { type: "string" },
      },
      required: ["customer_id", "photo_url"],
    },
  },
  {
    name: "get_purchase_history",
    description: "Get the customer's purchase history, optionally filtered by store.",
    input_schema: {
      type: "object",
      properties: {
        customer_id: { type: "string" },
        store: { type: "string" },
        limit: { type: "number" },
      },
      required: ["customer_id"],
    },
  },
  {
    name: "connect_retailer_account",
    description: "Connect a retailer account (Home Depot, Lowe's, etc.) to auto-import purchase history.",
    input_schema: {
      type: "object",
      properties: {
        customer_id: { type: "string" },
        retailer: { type: "string", description: "home_depot, lowes, walmart, amazon, etc." },
      },
      required: ["customer_id", "retailer"],
    },
  },
  {
    name: "log_diy_maintenance",
    description: "Log a DIY maintenance task the customer completed (e.g., changed AC filter). Auto-sets next reminder.",
    input_schema: {
      type: "object",
      properties: {
        customer_id: { type: "string" },
        maintenance_type: { type: "string" },
        appliance_or_system: { type: "string" },
        description: { type: "string" },
        cost: { type: "number" },
        frequency: { type: "string", description: "monthly, quarterly, semi-annually, annually" },
      },
      required: ["customer_id", "maintenance_type", "appliance_or_system"],
    },
  },
  {
    name: "get_maintenance_due",
    description: "Get all overdue and upcoming maintenance tasks for the customer's home.",
    input_schema: {
      type: "object",
      properties: { customer_id: { type: "string" } },
      required: ["customer_id"],
    },
  },

  // ── HOA Tools ─────────────────────────────────
  {
    name: "get_customer_hoa",
    description: "Get HOA information for the customer's address — rules, fees, contacts, amenities.",
    input_schema: {
      type: "object",
      properties: { user_id: { type: "string" } },
      required: ["user_id"],
    },
  },
  {
    name: "report_hoa_rule",
    description: "Report or update HOA rules/info from a pro's on-site observations.",
    input_schema: {
      type: "object",
      properties: {
        hoa_data_id: { type: "string" },
        report: { type: "object", description: "Fields to update: rules, amenities, hoaName, managementCompany, contactPhone, contactEmail, monthlyFee" },
      },
      required: ["hoa_data_id", "report"],
    },
  },

  // ── Passive Data Collection ───────────────────
  {
    name: "get_next_passive_question",
    description: "Get one question to weave into conversation to enrich the customer's home profile.",
    input_schema: {
      type: "object",
      properties: { customer_id: { type: "string" } },
      required: ["customer_id"],
    },
  },

  // ── Consent Management ────────────────────────
  {
    name: "check_user_consent",
    description: "Check if a user has consented to a specific data type.",
    input_schema: {
      type: "object",
      properties: {
        user_id: { type: "string" },
        consent_type: { type: "string" },
      },
      required: ["user_id", "consent_type"],
    },
  },
  {
    name: "request_consent",
    description: "Conversationally request consent from a user for a specific data type.",
    input_schema: {
      type: "object",
      properties: {
        user_id: { type: "string" },
        consent_type: { type: "string" },
        custom_message: { type: "string" },
      },
      required: ["user_id", "consent_type"],
    },
  },

  // ── DIY Safety Disclaimer ─────────────────────
  {
    name: "get_diy_disclaimer_consent",
    description: "Get the DIY coaching disclaimer text. MUST show before any repair coaching or step-by-step guidance.",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "record_diy_disclaimer_acknowledgment",
    description: "Record that the user acknowledged the DIY disclaimer.",
    input_schema: {
      type: "object",
      properties: { user_id: { type: "string" } },
      required: ["user_id"],
    },
  },

  // ── Smart Home ────────────────────────────────
  {
    name: "connect_smart_home",
    description: "Connect a smart home platform (Ring, Nest, August, Flo by Moen, myQ, SimpliSafe).",
    input_schema: {
      type: "object",
      properties: {
        customer_id: { type: "string" },
        platform: { type: "string" },
      },
      required: ["customer_id", "platform"],
    },
  },
  {
    name: "get_smart_home_status",
    description: "Get connected smart home devices, alerts, and status.",
    input_schema: {
      type: "object",
      properties: { customer_id: { type: "string" } },
      required: ["customer_id"],
    },
  },

  // ── Drone Scan ────────────────────────────────
  {
    name: "book_drone_scan",
    description: "Book an UpTend Drone Scan ($249) — aerial roof assessment, thermal imaging, 3D property model, interior scan.",
    input_schema: {
      type: "object",
      properties: {
        customer_id: { type: "string" },
        address: { type: "string" }, city: { type: "string" }, state: { type: "string" }, zip: { type: "string" },
        scheduled_date: { type: "string" },
      },
      required: ["customer_id", "address", "city", "state", "zip", "scheduled_date"],
    },
  },
  {
    name: "get_drone_scan_status",
    description: "Check status of drone scan bookings.",
    input_schema: {
      type: "object",
      properties: {
        customer_id: { type: "string" },
        booking_id: { type: "string" },
      },
      required: ["customer_id"],
    },
  },

  // ── Pro Intelligence (advanced) ───────────────
  {
    name: "get_pro_performance_analytics",
    description: "Get weekly/monthly performance breakdown for a pro: jobs, earnings, ratings, response time.",
    input_schema: {
      type: "object",
      properties: {
        pro_id: { type: "string" },
        period: { type: "string", enum: ["weekly", "monthly"] },
      },
      required: ["pro_id"],
    },
  },
  {
    name: "set_pro_earnings_goal",
    description: "Create an earnings goal for a pro with start/end dates.",
    input_schema: {
      type: "object",
      properties: {
        pro_id: { type: "string" },
        goal_type: { type: "string" },
        target_amount: { type: "number" },
        start_date: { type: "string" },
        end_date: { type: "string" },
      },
      required: ["pro_id", "goal_type", "target_amount", "start_date", "end_date"],
    },
  },
  {
    name: "suggest_pro_goal",
    description: "AI-suggested earnings goal based on pro's history and market demand.",
    input_schema: {
      type: "object",
      properties: { pro_id: { type: "string" } },
      required: ["pro_id"],
    },
  },
  {
    name: "get_optimized_route",
    description: "Get an optimized driving route for a pro's jobs on a specific day.",
    input_schema: {
      type: "object",
      properties: {
        pro_id: { type: "string" },
        date: { type: "string", description: "YYYY-MM-DD" },
      },
      required: ["pro_id", "date"],
    },
  },
  {
    name: "get_weekly_route_summary",
    description: "Get weekly driving summary: total miles, time saved, fuel savings.",
    input_schema: {
      type: "object",
      properties: { pro_id: { type: "string" } },
      required: ["pro_id"],
    },
  },

  // ── Pro Field Assist ──────────────────────────
  {
    name: "identify_part_from_photo",
    description: "AI identifies a part/component from a photo taken by the pro on-site.",
    input_schema: {
      type: "object",
      properties: {
        pro_id: { type: "string" },
        photo_url: { type: "string" },
        context: { type: "string", description: "What system/appliance this is from" },
      },
      required: ["pro_id", "photo_url"],
    },
  },
  {
    name: "find_replacement_part",
    description: "Find replacement parts and where to buy them based on identified part.",
    input_schema: {
      type: "object",
      properties: {
        part_name: { type: "string" },
        brand: { type: "string" },
        model: { type: "string" },
      },
      required: ["part_name"],
    },
  },
  {
    name: "get_technical_reference",
    description: "Get technical reference info for an appliance/system (wiring diagrams, specs, common issues).",
    input_schema: {
      type: "object",
      properties: {
        appliance_type: { type: "string" },
        brand: { type: "string" },
        model: { type: "string" },
        issue: { type: "string" },
      },
      required: ["appliance_type"],
    },
  },
  {
    name: "troubleshoot_on_site",
    description: "Step-by-step troubleshooting guide for a pro working on-site.",
    input_schema: {
      type: "object",
      properties: {
        pro_id: { type: "string" },
        job_id: { type: "string" },
        issue: { type: "string" },
        appliance_type: { type: "string" },
        symptoms: { type: "string" },
      },
      required: ["pro_id", "issue"],
    },
  },
  {
    name: "find_nearest_supply_store",
    description: "Find the nearest supply store for a pro who needs parts during a job.",
    input_schema: {
      type: "object",
      properties: {
        zip: { type: "string" },
        part_type: { type: "string" },
      },
      required: ["zip"],
    },
  },
  {
    name: "get_quick_tutorial",
    description: "Get a quick how-to tutorial for a pro on a specific repair technique.",
    input_schema: {
      type: "object",
      properties: {
        topic: { type: "string" },
        skill_level: { type: "string" },
      },
      required: ["topic"],
    },
  },

  // ── Pro Site Reports ──────────────────────────
  {
    name: "submit_pro_site_report",
    description: "Pro submits observations from a job site (issues found, photos, recommendations).",
    input_schema: {
      type: "object",
      properties: {
        pro_id: { type: "string" },
        job_id: { type: "string" },
        customer_id: { type: "string" },
        report_type: { type: "string" },
        details: { type: "object" },
        photos: { type: "array", items: { type: "string" } },
      },
      required: ["pro_id", "job_id", "customer_id", "report_type", "details"],
    },
  },

  // ── B2B Contracts (advanced) ──────────────────
  {
    name: "get_document_tracker",
    description: "Track all documents for a business account: contracts, W-9s, COIs, lien waivers.",
    input_schema: {
      type: "object",
      properties: { business_account_id: { type: "string" } },
      required: ["business_account_id"],
    },
  },
  {
    name: "get_compliance_report",
    description: "Get full compliance report for a business: score, missing docs, status.",
    input_schema: {
      type: "object",
      properties: { business_account_id: { type: "string" } },
      required: ["business_account_id"],
    },
  },
];

// ─────────────────────────────────────────────
// Execute tool call
// ─────────────────────────────────────────────
async function executeTool(name: string, input: any, storage?: any): Promise<any> {
  switch (name) {
    // Existing consumer tools
    case "get_service_pricing":
      return tools.getServicePricing(input.service_id);
    case "calculate_quote":
      return tools.calculateQuote(input.service_id, input.selections);
    case "get_bundle_options":
      return tools.getBundleOptions(input.service_ids);
    case "check_availability":
      return tools.checkAvailability(input.service_id, input.zip, input.date || "");
    case "create_booking_draft":
      return tools.createBookingDraft({
        serviceId: input.service_id,
        selections: input.selections,
        address: input.address,
        date: input.date,
        timeSlot: input.time_slot,
      });
    case "get_customer_jobs":
      return await tools.getCustomerJobs(input.user_id, storage);
    case "get_all_services":
      return tools.getAllServices();

    // Home intelligence tools
    case "get_home_profile":
      return await tools.getHomeProfile(input.user_id, storage);
    case "get_service_history":
      return await tools.getServiceHistory(input.user_id, storage);
    case "get_seasonal_recommendations":
      return tools.getSeasonalRecommendations(input.month, input.home_type || "", input.location || "Orlando, FL");
    case "get_maintenance_schedule":
      return tools.getMaintenanceSchedule(input.home_details || {});
    case "get_neighborhood_insights":
      return tools.getNeighborhoodInsights(input.zip);

    // Pro tools
    case "get_pro_dashboard":
      return await tools.getProDashboard(input.pro_id, storage);
    case "get_pro_earnings":
      return await tools.getProEarnings(input.pro_id, input.period || "month", storage);
    case "get_pro_schedule":
      return await tools.getProSchedule(input.pro_id, storage);
    case "get_pro_certifications":
      return await tools.getProCertifications(input.pro_id, storage);
    case "get_pro_market_insights":
      return tools.getProMarketInsights(input.service_types || []);
    case "get_pro_reviews":
      return await tools.getProReviews(input.pro_id, storage);

    // Trust & Safety
    case "get_pro_arrival_info":
      return await tools.getProArrivalInfo(input.job_id, storage);

    // Insurance Claims
    case "get_storm_prep_checklist":
      return tools.getStormPrepChecklist(input.home_type || "residential", input.location || "Orlando, FL");
    case "generate_claim_documentation":
      return await tools.generateClaimDocumentation(input.job_ids || [], storage);

    // Referral Engine
    case "get_referral_status":
      return await tools.getReferralStatus(input.user_id, storage);
    case "get_neighborhood_group_deals":
      return tools.getNeighborhoodGroupDeals(input.zip);

    // Pro Business Intelligence
    case "get_pro_demand_forecast":
      return tools.getProDemandForecast(input.service_types || [], input.zip || "");
    case "get_pro_customer_retention":
      return await tools.getProCustomerRetention(input.pro_id, storage);

    // Emergency & Disaster Mode
    case "get_emergency_pros":
      return await tools.getEmergencyPros(input.service_type || "", input.zip || "", storage);
    case "get_disaster_mode_status":
      return tools.getDisasterModeStatus(input.zip);

    // Loyalty & Gamification
    case "get_customer_loyalty_status":
      return await tools.getCustomerLoyaltyStatus(input.user_id, storage);
    case "get_customer_milestones":
      return await tools.getCustomerMilestones(input.user_id, storage);

    // Community Features
    case "get_neighborhood_activity":
      return tools.getNeighborhoodActivity(input.zip);
    case "get_local_events":
      return tools.getLocalEvents(input.zip);

    // Post-Booking Intelligence
    case "get_post_booking_question":
      return tools.getPostBookingQuestion(input.service_id, input.home_profile || {});
    case "get_pro_job_prompts":
      return tools.getProJobPrompts(input.service_id, input.home_profile || {});

    // Home Maintenance Reminders
    case "get_home_maintenance_reminders":
      return await tools.getHomeMaintenanceReminders(input.user_id, input.home_details || {}, storage);
    case "get_home_tips":
      return tools.getHomeTips(input.season || "spring", input.home_type || "residential", input.location || "Orlando, FL");
    case "add_custom_reminder":
      return await tools.addCustomReminder(input.user_id, input.description, input.interval_days || 90, storage);

    // Pro Goal Tracker
    case "get_pro_goal_progress":
      return await tools.getProGoalProgress(input.pro_id, storage);
    case "set_pro_goal":
      return await tools.setProGoal(input.pro_id, input.monthly_target, storage);

    // Contracts & Documents (B2B)
    case "generate_service_agreement":
      return tools.generateServiceAgreement(input.business_id, input.terms || {});
    case "get_document_status":
      return await tools.getDocumentStatus(input.business_id, storage);

    // B2B tools
    case "get_portfolio_analytics":
      return await tools.getPortfolioAnalytics(input.business_id, storage);
    case "get_vendor_scorecard":
      return await tools.getVendorScorecard(input.business_id, storage);
    case "get_billing_history":
      return await tools.getBillingHistory(input.business_id, storage);
    case "get_compliance_status":
      return await tools.getComplianceStatus(input.business_id, storage);
    case "generate_roi_report":
      return tools.generateROIReport(input.current_spend || 0, input.units || 1);

    // Daily Engagement Tools (Phase 3)
    case "get_morning_briefing":
      return await tools.getMorningBriefing(input.user_id, storage);
    case "get_home_dashboard":
      return await tools.getHomeDashboard(input.user_id, storage);
    case "get_spending_tracker":
      return await tools.getSpendingTracker(input.user_id, input.period || "month", storage);
    case "get_trash_schedule":
      return tools.getTrashScheduleInfo(input.zip);
    case "get_home_value_estimate":
      return await tools.getHomeValueEstimate(input.address);
    case "get_calendar_suggestion":
      return await tools.getCalendarSuggestion(input.user_id, input.service_id, storage);
    case "get_seasonal_countdown":
      return tools.getSeasonalCountdown();

    // Shopping Assistant + Tutorials
    case "search_products":
      return tools.searchProductsForGeorge({ query: input.query, category: input.category, specifications: input.specifications });
    case "get_product_recommendation":
      return tools.getProductRecommendationForGeorge({ customerId: input.customer_id, applianceType: input.appliance_type });
    case "compare_prices":
      return tools.comparePricesForGeorge({ productName: input.product_name, specifications: input.specifications });
    case "find_diy_tutorial":
      return tools.findDIYTutorialForGeorge({ task: input.task, difficulty: input.difficulty });
    case "get_shopping_list":
      return tools.getShoppingListForGeorge({ customerId: input.customer_id });
    case "start_diy_project":
      return tools.startDIYProjectForGeorge({ customerId: input.customer_id, projectName: input.project_name, description: input.description });
    case "get_seasonal_diy_suggestions":
      return tools.getSeasonalDIYSuggestionsForGeorge({ month: input.month });

    // Home Scan Pitch & FAQ
    case "get_home_scan_info":
      return getHomeScanInfo();

    // Home Scan Tools
    case "start_home_scan":
      return await tools.startHomeScan(input.customer_id);
    case "process_home_scan_photo":
      return await tools.processHomeScanPhoto(input.customer_id, input.scan_session_id, input.room_name, input.photo_url);
    case "get_home_scan_progress":
      return await tools.getHomeScanProgress(input.customer_id);
    case "get_wallet_balance":
      return await tools.getWalletBalance(input.customer_id);

    // Warranty Tools
    case "get_warranty_tracker":
      return await tools.getWarrantyTracker(input.customer_id);
    case "update_appliance_purchase_date":
      return await tools.updateAppliancePurchaseDate(input.item_id, input.purchase_date);
    case "get_warranty_dashboard":
      return await tools.getWarrantyDashboard({ customerId: input.customer_id });
    case "register_warranty":
      return await tools.registerWarranty({
        customerId: input.customer_id, productName: input.product_name, brand: input.brand,
        model: input.model, serialNumber: input.serial_number, purchaseDate: input.purchase_date,
        warrantyType: input.warranty_type, warrantyDuration: input.warranty_duration,
        warrantyExpires: input.warranty_expires, notes: input.notes,
      });

    // Home Utilities
    case "get_recycling_schedule":
      return await tools.getRecyclingScheduleForGeorge({ customerId: input.customer_id, zip: input.zip });
    case "get_sprinkler_settings":
      return await tools.getSprinklerSettingsForGeorge({ customerId: input.customer_id });
    case "get_water_restrictions":
      return await tools.getWaterRestrictionsForGeorge({ customerId: input.customer_id, county: input.county, zip: input.zip, addressNumber: input.address_number });
    case "get_tonight_checklist":
      return await tools.getTonightChecklistForGeorge({ customerId: input.customer_id });
    case "set_home_reminder":
      return await tools.setHomeReminderForGeorge({
        customerId: input.customer_id, reminderType: input.reminder_type || "custom",
        title: input.title, description: input.description, frequency: input.frequency,
        nextDueDate: input.next_due_date, time: input.time,
      });
    case "get_utility_providers":
      return await tools.getUtilityProvidersForGeorge({ customerId: input.customer_id, zip: input.zip });

    // Insurance Claims
    case "start_insurance_claim":
      return await tools.startInsuranceClaim({ customerId: input.customer_id, claimType: input.claim_type, description: input.description });

    // Emergency Dispatch
    case "create_emergency_dispatch":
      return await tools.createEmergencyDispatchTool({ customerId: input.customer_id, emergencyType: input.emergency_type, severity: input.severity, description: input.description });

    // Loyalty Rewards
    case "get_available_rewards":
      return await tools.getAvailableRewardsForGeorge({ customerId: input.customer_id });
    case "redeem_reward":
      return await tools.redeemRewardForGeorge({ rewardId: input.reward_id });

    // Referral Tools
    case "get_referral_code":
      return await tools.getReferralCode({ customerId: input.customer_id });
    case "create_group_deal":
      return await tools.createGroupDealForGeorge({ customerId: input.customer_id, neighborhood: input.neighborhood, serviceType: input.service_type });
    case "get_neighborhood_deals":
      return await tools.getNeighborhoodDealsForGeorge({ zip: input.zip });

    // Auto / Vehicle Tools
    case "add_vehicle_to_profile":
      return await tools.addVehicleToProfile({
        customerId: input.customer_id, year: input.year, make: input.make, model: input.model,
        trim: input.trim, vin: input.vin, mileage: input.mileage, color: input.color, nickname: input.nickname,
      });
    case "get_vehicle_maintenance_schedule":
      return await tools.getVehicleMaintenanceSchedule({ vehicleId: input.vehicle_id });
    case "diagnose_car_issue":
      return await tools.diagnoseCarIssue({ customerId: input.customer_id, vehicleId: input.vehicle_id, symptoms: input.symptoms, photos: input.photos });
    case "search_auto_parts":
      return await tools.searchAutoPartsForGeorge({ customerId: input.customer_id, partName: input.part_name, vehicleId: input.vehicle_id, year: input.year, make: input.make, model: input.model });
    case "find_auto_tutorial":
      return await tools.findAutoTutorial({ task: input.task, year: input.year, make: input.make, model: input.model });
    case "get_obd_code":
      return await tools.getOBDCode({ code: input.code });

    // Purchase Tracking
    case "scan_receipt_photo":
      return await tools.scanReceiptPhoto({ customerId: input.customer_id, photoUrl: input.photo_url });
    case "get_purchase_history":
      return await tools.getPurchaseHistory({ customerId: input.customer_id, store: input.store, limit: input.limit });
    case "connect_retailer_account":
      return await tools.connectRetailerAccount({ customerId: input.customer_id, retailer: input.retailer });
    case "log_diy_maintenance":
      return await tools.logDIYMaintenance({
        customerId: input.customer_id, maintenanceType: input.maintenance_type,
        applianceOrSystem: input.appliance_or_system, description: input.description,
        cost: input.cost, frequency: input.frequency,
      });
    case "get_maintenance_due":
      return await tools.getMaintenanceDueForGeorge({ customerId: input.customer_id });

    // HOA Tools
    case "get_customer_hoa":
      return await tools.getCustomerHOA(input.user_id);
    case "report_hoa_rule":
      return await tools.reportHOARule(input.hoa_data_id, input.report);

    // Passive Data Collection
    case "get_next_passive_question":
      return await tools.getNextPassiveQuestion({ customerId: input.customer_id });

    // Consent Management
    case "check_user_consent":
      return await tools.checkUserConsent({ userId: input.user_id, consentType: input.consent_type });
    case "request_consent":
      return await tools.requestConsent({ userId: input.user_id, consentType: input.consent_type, customMessage: input.custom_message });

    // DIY Safety Disclaimer
    case "get_diy_disclaimer_consent":
      return getDIYDisclaimerConsent();
    case "record_diy_disclaimer_acknowledgment":
      return await recordDIYDisclaimerAcknowledgment(input.user_id, "george-chat");

    // Smart Home
    case "connect_smart_home":
      return await tools.connectSmartHome({ customerId: input.customer_id, platform: input.platform });
    case "get_smart_home_status":
      return await tools.getSmartHomeOAuthStatus({ customerId: input.customer_id });

    // Drone Scan
    case "book_drone_scan":
      return await tools.bookDroneScan({
        customerId: input.customer_id, address: input.address, city: input.city,
        state: input.state, zip: input.zip, scheduledDate: input.scheduled_date,
      });
    case "get_drone_scan_status":
      return await tools.getDroneScanStatus({ customerId: input.customer_id, bookingId: input.booking_id });

    // Pro Intelligence (advanced)
    case "get_pro_performance_analytics":
      return await tools.getProPerformanceAnalytics({ proId: input.pro_id, period: input.period });
    case "set_pro_earnings_goal":
      return await tools.setProEarningsGoal({ proId: input.pro_id, goalType: input.goal_type, targetAmount: input.target_amount, startDate: input.start_date, endDate: input.end_date });
    case "suggest_pro_goal":
      return await tools.suggestProGoal({ proId: input.pro_id });
    case "get_optimized_route":
      return await tools.getOptimizedRoute({ proId: input.pro_id, date: input.date });
    case "get_weekly_route_summary":
      return await tools.getWeeklyRouteSummaryForGeorge({ proId: input.pro_id });

    // Pro Field Assist
    case "identify_part_from_photo":
      return await identifyPartFromPhoto(input.pro_id, input.photo_url, input.context);
    case "find_replacement_part":
      return await findReplacementPart(input.part_name, input.brand, input.model);
    case "get_technical_reference":
      return await getTechnicalReference(input.appliance_type, input.issue || "general");
    case "troubleshoot_on_site":
      return await troubleshootOnSite(input.pro_id, input.job_id || null, input.issue || input.symptoms, input.photos?.[0]);
    case "find_nearest_supply_store":
      return await findNearestSupplyStore(input.zip, input.part_type);
    case "get_quick_tutorial":
      return await getQuickTutorial(input.topic, input.skill_level);

    // Pro Site Reports
    case "submit_pro_site_report":
      return await tools.submitProSiteReport({ proId: input.pro_id, jobId: input.job_id, customerId: input.customer_id, reportType: input.report_type, details: input.details, photos: input.photos });

    // B2B Contracts (advanced)
    case "get_document_tracker":
      return await tools.getDocumentTrackerForGeorge({ businessAccountId: input.business_account_id });
    case "get_compliance_report":
      return await tools.getComplianceReportForGeorge({ businessAccountId: input.business_account_id });

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ─────────────────────────────────────────────
// Parse buttons from response text
// ─────────────────────────────────────────────
function parseButtons(text: string): {
  cleanText: string;
  buttons: Array<{ text: string; action: string }>;
} {
  const buttonMatch = text.match(/BUTTONS:\s*(\[[\s\S]*\])/);
  if (!buttonMatch) return { cleanText: text.trim(), buttons: [] };

  try {
    const buttons = JSON.parse(buttonMatch[1]);
    const cleanText = text.replace(/BUTTONS:\s*\[[\s\S]*\]/, "").trim();
    return { cleanText, buttons };
  } catch {
    return { cleanText: text.trim(), buttons: [] };
  }
}

// ─────────────────────────────────────────────
// Main chat function
// ─────────────────────────────────────────────
export interface GeorgeContext {
  userId?: string;
  userName?: string;
  currentPage?: string;
  isAuthenticated?: boolean;
  userRole?: "consumer" | "pro" | "business" | "admin";
  storage?: any;
}

export interface GeorgeResponse {
  response: string;
  buttons: Array<{ text: string; action: string }>;
  conversationId?: string;
  bookingDraft?: any;
}

export async function chat(
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  context?: GeorgeContext
): Promise<GeorgeResponse> {
  // Pick system prompt based on user role and current page
  const isB2B =
    context?.userRole === "business" ||
    context?.currentPage?.startsWith("/business");
  const isPro =
    context?.userRole === "pro" ||
    context?.currentPage?.startsWith("/pro") ||
    context?.currentPage?.startsWith("/become-pro") ||
    context?.currentPage?.startsWith("/academy");

  let systemPrompt = isPro
    ? GEORGE_PRO_SYSTEM_PROMPT
    : isB2B
    ? GEORGE_B2B_SYSTEM_PROMPT
    : GEORGE_SYSTEM_PROMPT;

  if (context) {
    systemPrompt += "\n\nCURRENT CONTEXT:";
    if (context.userName) systemPrompt += `\n- Contact name: ${context.userName}`;
    if (context.currentPage) systemPrompt += `\n- Currently viewing page: ${context.currentPage}`;
    if (context.userRole) systemPrompt += `\n- User role: ${context.userRole}`;
    if (context.isAuthenticated) systemPrompt += `\n- User is logged in`;
    else systemPrompt += `\n- User is NOT logged in (prospective)`;
    if (context.userId) systemPrompt += `\n- User ID: ${context.userId}`;
  }

  // Build messages array for Claude
  const messages: Array<{ role: "user" | "assistant"; content: any }> = [
    ...conversationHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return {
      response: "Hey! 👋 I'm George, your UpTend assistant. I'd love to help but my AI brain isn't connected yet. Try again soon!",
      buttons: [
        { text: "View Services", action: "navigate:/services" },
        { text: "Call Us", action: "navigate:tel:4073383342" },
      ],
    };
  }

  try {
    // Function calling loop — max 5 iterations
    let currentMessages = [...messages];
    let bookingDraft: any = null;

    for (let i = 0; i < 5; i++) {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        temperature: 0.6,
        system: systemPrompt,
        tools: TOOL_DEFINITIONS,
        messages: currentMessages as any,
      });

      // Check if Claude wants to use tools
      const toolUseBlocks = response.content.filter((b: any) => b.type === "tool_use");

      if (toolUseBlocks.length === 0) {
        // Final text response
        const textBlock = response.content.find((b: any) => b.type === "text");
        const rawText = textBlock && "text" in textBlock ? textBlock.text : "";
        const { cleanText, buttons } = parseButtons(rawText);

        return {
          response: cleanText,
          buttons,
          bookingDraft,
        };
      }

      // Execute tool calls and send results back
      const assistantContent = response.content;
      const toolResults: any[] = [];

      for (const toolBlock of toolUseBlocks) {
        const result = await executeTool(
          (toolBlock as any).name,
          (toolBlock as any).input,
          context?.storage
        );

        // Track booking drafts
        if ((toolBlock as any).name === "create_booking_draft") {
          bookingDraft = result;
        }

        toolResults.push({
          type: "tool_result",
          tool_use_id: (toolBlock as any).id,
          content: JSON.stringify(result),
        });
      }

      currentMessages = [
        ...currentMessages,
        { role: "assistant", content: assistantContent },
        { role: "user", content: toolResults },
      ];
    }

    // Fallback if loop exhausted
    return {
      response: "Let me get you connected with our team for a detailed quote. Call us at (407) 338-3342!",
      buttons: [
        { text: "Call Now", action: "navigate:tel:4073383342" },
      ],
    };
  } catch (error: any) {
    console.error("George agent error:", error);
    return {
      response: "Sorry, I'm having a moment! 😅 Try asking again, or call us at (407) 338-3342.",
      buttons: [
        { text: "Try Again", action: "reply:Hi, I need help" },
        { text: "Call Us", action: "navigate:tel:4073383342" },
      ],
    };
  }
}

export default { chat };
