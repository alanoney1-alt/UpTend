/**
 * AI Concierge Service
 *
 * Handles intelligent conversational AI for customer support,
 * booking assistance, and general queries.
 */

import { createChatCompletion } from "./anthropic-client";

const CONCIERGE_SYSTEM_PROMPT = `You are UpTend AI, a helpful and friendly AI assistant for the UpTend home services platform.

UpTend provides 11+ services:
- Junk Removal (QuickHaul™)
- Pressure Washing
- Gutter Cleaning
- Pool Cleaning
- Home Cleaning (PolishUp™)
- Landscaping (FreshCut™)
- Handyman Services (FixIt™)
- Moving Labor
- Furniture Moving
- Carpet Cleaning (DeepFiber™)
- Light Demolition (TearDown™)

Your role:
1. Answer questions about services, pricing, and availability
2. Help users book services by collecting necessary information
3. Provide support for existing bookings
4. Guide new users through onboarding
5. Suggest relevant services based on user needs

Be concise, friendly, and helpful. If you need to collect information, ask one question at a time.
If the user wants to book a service, collect: service type, address, preferred date/time, and any special requirements.

IMPORTANT: You cannot actually book services or access real-time data. Your role is to assist and guide. Always end booking requests with "I'll connect you with available pros in your area."`;

export interface ConversationContext {
  conversationType: string;
  userId: string;
  userName?: string;
  userLocation?: string;
  recentBookings?: any[];
  onboardingStep?: string;
}

export async function generateConciergeResponse(options: {
  userMessage: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
  context?: ConversationContext;
}): Promise<{
  response: string;
  intent?: string;
  suggestedActions?: string[];
}> {
  const { userMessage, conversationHistory, context } = options;

  // Add context to system prompt if provided
  let systemPrompt = CONCIERGE_SYSTEM_PROMPT;
  if (context) {
    systemPrompt += `\n\nCurrent context:
- User ID: ${context.userId}
${context.userName ? `- User Name: ${context.userName}` : ""}
${context.userLocation ? `- Location: ${context.userLocation}` : ""}
- Conversation Type: ${context.conversationType}`;
  }

  // Build full conversation history
  const messages = [
    ...conversationHistory,
    { role: "user" as const, content: userMessage },
  ];

  try {
    const response = await createChatCompletion({
      messages,
      systemPrompt,
      model: "claude-sonnet-4-20250514",
      maxTokens: 1024,
      temperature: 0.7,
    });

    // Detect intent (simple keyword matching for now)
    const intent = detectIntent(userMessage);

    // Suggest actions based on intent
    const suggestedActions = getSuggestedActions(intent, userMessage);

    return {
      response: response.content,
      intent,
      suggestedActions,
    };
  } catch (error: any) {
    console.error("Error generating concierge response:", error);
    throw error;
  }
}

function detectIntent(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("book") || lowerMessage.includes("schedule")) {
    return "booking";
  }
  if (lowerMessage.includes("price") || lowerMessage.includes("cost") || lowerMessage.includes("how much")) {
    return "pricing";
  }
  if (lowerMessage.includes("cancel") || lowerMessage.includes("refund")) {
    return "cancellation";
  }
  if (lowerMessage.includes("status") || lowerMessage.includes("where is")) {
    return "tracking";
  }
  if (lowerMessage.includes("help") || lowerMessage.includes("support")) {
    return "support";
  }

  return "general";
}

function getSuggestedActions(intent: string, message: string): string[] {
  switch (intent) {
    case "booking":
      return [
        "View Available Services",
        "Get Instant Quote",
        "Talk to Human Support",
      ];
    case "pricing":
      return ["Get Custom Quote", "View Service Pricing", "See Special Offers"];
    case "cancellation":
      return ["View Refund Policy", "Contact Support", "Reschedule Instead"];
    case "tracking":
      return ["View Job Status", "Contact Pro", "View GPS Tracking"];
    case "support":
      return ["View Help Center", "Talk to Human", "View FAQs"];
    default:
      return ["Browse Services", "Get Quote", "View Account"];
  }
}

export default {
  generateConciergeResponse,
};
