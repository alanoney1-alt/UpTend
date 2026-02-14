/**
 * George AI Agent — Function Calling Brain
 *
 * Takes user messages, sends to Claude with tool definitions,
 * handles tool calls via george-tools.ts, returns final response + buttons.
 */

import { anthropic } from "./ai/anthropic-client";
import * as tools from "./george-tools";

// ─────────────────────────────────────────────
// System Prompt (NO hardcoded prices)
// ─────────────────────────────────────────────
const GEORGE_SYSTEM_PROMPT = `You are George, UpTend's AI assistant. You help customers book home services in the Orlando metro area.

CRITICAL RULES:
1. NEVER state a price from memory. You MUST call get_service_pricing or calculate_quote tools EVERY TIME a customer asks about pricing. Even if you think you know the price, CALL THE TOOL. This is non-negotiable.
2. Keep responses SHORT — 1-3 sentences max. Use quick reply buttons for common next steps.
3. Ask ONE question at a time. Don't overwhelm with options.
4. When a customer mentions ANY service by name, IMMEDIATELY call get_service_pricing to get the full pricing details before responding.
4. When you can calculate an exact quote, show the number prominently with a booking button.
5. If unsure about anything, say "Let me get you connected with our team" — never guess.
6. Be warm, direct, and helpful. Not corporate. Not robotic.
7. For pros visiting the site, help them learn about joining UpTend.
8. You can detect what page the user is on from context — tailor your greeting.

CAPABILITIES:
- Look up pricing for any service
- Calculate exact quotes based on customer selections
- Find bundle discounts
- Help start a booking
- Check service availability
- Look up customer's existing jobs (if logged in)

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
// Claude Tool Definitions
// ─────────────────────────────────────────────
const TOOL_DEFINITIONS: any[] = [
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
    description: "Find bundle packages that include the requested services, showing savings.",
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
];

// ─────────────────────────────────────────────
// Execute tool call
// ─────────────────────────────────────────────
async function executeTool(name: string, input: any, storage?: any): Promise<any> {
  switch (name) {
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
  // Build system prompt with context
  let systemPrompt = GEORGE_SYSTEM_PROMPT;
  if (context) {
    systemPrompt += "\n\nCURRENT CONTEXT:";
    if (context.userName) systemPrompt += `\n- Customer name: ${context.userName}`;
    if (context.currentPage) systemPrompt += `\n- Currently viewing page: ${context.currentPage}`;
    if (context.isAuthenticated) systemPrompt += `\n- Customer is logged in`;
    else systemPrompt += `\n- Customer is NOT logged in`;
    if (context.userId) systemPrompt += `\n- User ID: ${context.userId}`;
  }

  // Build messages array for Claude
  const messages: Array<{ role: "user" | "assistant"; content: any }> = [
    ...conversationHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: userMessage },
  ];

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    // Mock response when no API key
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
