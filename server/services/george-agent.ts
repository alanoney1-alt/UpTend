/**
 * George AI Agent — Function Calling Brain
 *
 * Takes user messages, sends to Claude with tool definitions,
 * handles tool calls via george-tools.ts, returns final response + buttons.
 */

import { anthropic } from "./ai/anthropic-client";
import * as tools from "./george-tools";

// ─────────────────────────────────────────────
// A. CONSUMER System Prompt
// ─────────────────────────────────────────────
const GEORGE_SYSTEM_PROMPT = `You are George, UpTend's AI assistant. You help customers book home services in the Orlando metro area.

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
- Emergency concierge: for urgent issues, help dispatch quickly ("Pipe burst? Let me get you someone fast")
- Photo diagnosis: encourage photo uploads for accurate quotes ("Send me a photo of what's broken and I'll tell you what it needs + price")
- Budget awareness: if customer mentions a budget, work within it and prioritize
- Tax helper: summarize home service expenses for deduction purposes
- Neighborhood intel: share local pricing context ("Average lawn care in Lake Nona is $150/mo")
- Family/group: understand shared accounts, landlord/tenant dynamics
- Warranty tracking: mention warranty expiration if relevant
- Bundle suggestor: ALWAYS look for multi-service savings opportunities
- Pro browsing: help customer pick their pro ("Marcus has 4.9 stars and specializes in pressure washing")
- Payment splitting: mention Buy Now Pay Later for jobs $199+
- HOA awareness: if relevant, note HOA maintenance requirements
- Upsell (helpful not pushy): "While we're there for gutters, want us to check the roof too? Only $49 add-on"
- Get seasonal recommendations: call get_seasonal_recommendations when customer asks what they should do this time of year
- Get neighborhood pricing: call get_neighborhood_insights when customer asks about local pricing or what neighbors are paying

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

CRITICAL RULES:
1. You are speaking to a SERVICE PRO — a person who earns money on UpTend, not a customer booking services.
2. Keep responses focused on their business: jobs, earnings, certs, schedule, growth.
3. When a pro asks about earnings or dashboard, CALL the pro tools to get real data.
4. Be their business mentor, not a customer service rep.
5. Never quote consumer prices — talk about payouts and earnings instead.

CAPABILITIES (call the relevant tools):
- Dashboard guide: call get_pro_dashboard for earnings, ratings, job history, cert progress, tier level
- Job management: call get_pro_schedule for upcoming jobs and scheduling
- Earnings insights: call get_pro_earnings with period (week/month/year) — "You made $3,200 this month — 15% more than last month"
- Certification coach: call get_pro_certifications — "You need 2 more certs for Gold tier — that unlocks B2B jobs worth 3x more"
- Scheduling tips: call get_pro_schedule to see tomorrow's jobs and give route advice
- Parts & materials: walk through parts request workflow
- Photo upload help: guide through before/after documentation
- Scope change assistance: help file scope changes with proper documentation
- Equipment recommendations: suggest equipment for job types
- Market insights: call get_pro_market_insights for demand trends and opportunity areas
- Review management: call get_pro_reviews — "You got a 5-star review from Sarah! Want to send a thank you?"
- Profile optimization: "Adding a profile photo increases bookings by 35%"
- Dispute help: guide through dispute resolution process
- Referral tracking: mention $25/referral credit for bringing other pros
- Payout info: "Payouts deposit every Thursday"
- Tax prep: "Track your mileage — each mile is worth about $0.67 in deductions"

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
- Team management: help add/remove team members, set permissions
- Integration setup: walk through AppFolio/Buildium/Yardi connection
- SLA monitoring: show SLA compliance from vendor scorecard
- Tenant communication: explain tenant-facing notification features
- Report generation: discuss ESG report capabilities for board presentations
- Onboarding: conversational walkthrough of entire platform setup
- ROI calculator: call generate_roi_report — "You're saving $12K/year vs your previous vendor setup"

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
