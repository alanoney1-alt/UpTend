/**
 * AI Assistant Service
 *
 * Shared knowledge base and conversation logic for both web chat bot and SMS bot.
 * Contains complete UpTend product knowledge, pricing, and customer service responses.
 */

import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * UpTend Knowledge Base
 * Complete product information for AI assistant
 */
export const UPTEND_KNOWLEDGE = {
  company: {
    name: "UpTend",
    tagline: "You Pick. We Haul.",
    description: "On-demand junk removal, moving labor, and home services in Orlando Metro Area",
    phone: "(407) 338-3342",
    serviceArea: "Orange, Seminole, and Osceola counties in Florida",
    differentiators: [
      "AI-powered instant quotes from photos (upload a pic, get price in seconds)",
      "Real-time GPS tracking and sustainability reporting",
      "100% verified, background-checked Pros with $1M liability insurance",
      "Eco-friendly disposal: 70%+ landfill diversion rate",
      "Carbon offset tracking for every job (trees planted equivalent)",
      "Same-day or next-day service availability",
      "7% Protection Fee covers all insurance, no hidden fees",
      "Buy Now Pay Later options (Afterpay/Klarna) for jobs $199+",
    ],
  },

  services: {
    junk_removal: {
      name: "Material Recovery (Junk Removal)",
      description: "Professional removal of unwanted items, furniture, appliances, yard waste, and debris. We recycle and donate whenever possible.",
      pricing: "Volume-based pricing by truck load",
      tiers: [
        { size: "Minimum (1-2 items)", price: "$99", capacity: "~25 cubic ft", example: "Sofa, mattress, or appliance" },
        { size: "Quarter Load", price: "$149", capacity: "~50 cubic ft", example: "3-4 furniture pieces" },
        { size: "Half Load", price: "$229", capacity: "~100 cubic ft", example: "10-12 furniture pieces, garage corner" },
        { size: "Three-Quarter Load", price: "$329", capacity: "~150 cubic ft", example: "Full bedroom set, 15-20 items" },
        { size: "Full Load", price: "$429", capacity: "~200 cubic ft", example: "Full garage, multiple rooms" },
      ],
      features: [
        "Before/after photos with GPS verification",
        "Item-by-item disposal tracking (recycle/donate/landfill)",
        "Sustainability report with carbon offset calculation",
        "Same-day service available",
        "No hidden fees - price includes labor, disposal, and cleanup",
      ],
      included: "Labor, loading, transportation, eco-friendly disposal, post-job cleanup",
      notIncluded: "Hazardous materials ($75 surcharge), refrigerant removal, locked items, second-floor pickup without elevator",
    },

    moving_labor: {
      name: "Moving Labor / Loading Help",
      description: "Professional movers to help load/unload trucks, rearrange furniture, or provide labor-only moving assistance.",
      pricing: "$40/hour per Pro (2-hour minimum)",
      features: [
        "Multi-Pro crews available (2-3 workers)",
        "Truck unloading specialists",
        "Furniture assembly/disassembly",
        "Heavy lifting and positioning",
        "Real-time crew coordination",
      ],
      crewPricing: [
        { crew: "1 Pro", rate: "$40/hour", best: "Light tasks, rearranging" },
        { crew: "2 Pros", rate: "$80/hour", best: "Standard moves, truck loading" },
        { crew: "3 Pros", rate: "$120/hour", best: "Large moves, heavy items" },
      ],
    },

    pressure_washing: {
      name: "Pressure Washing",
      description: "Professional pressure washing for driveways, siding, decks, patios, and more.",
      pricing: "$0.25 per square foot (minimum $150)",
      aiQuote: "Upload photos and our AI calculates exact square footage",
      features: [
        "AI-powered square footage calculation from photos",
        "Commercial-grade 3000 PSI equipment",
        "Eco-friendly cleaning solutions",
        "Before/after photo verification",
      ],
      surfaces: ["Driveway", "Siding", "Deck", "Patio", "Sidewalk", "Fence"],
    },

    gutter_cleaning: {
      name: "Gutter Cleaning",
      description: "Professional gutter cleaning and debris removal to prevent water damage.",
      pricing: "Fixed pricing by home size",
      rates: [
        { type: "1-Story Home", price: "$120", includes: "Full perimeter cleaning + flow test" },
        { type: "2-Story Home", price: "$199", includes: "Full perimeter cleaning + flow test" },
      ],
      features: [
        "Debris removal from gutters and downspouts",
        "Flow test to verify drainage",
        "Photo documentation",
        "Minor repairs identified",
      ],
    },

    light_demolition: {
      name: "Light Demolition",
      description: "Tear out old structures, fencing, sheds, decking, and non-structural interior demolition.",
      pricing: "Custom quote based on scope",
      features: [
        "Fence removal",
        "Deck teardown",
        "Shed demolition",
        "Interior demo (non-loadbearing walls)",
        "Debris removal included",
        "AI verification with before/after photos",
      ],
    },

    garage_cleanout: {
      name: "Garage Cleanout",
      description: "Complete garage clearing with sorting, donation coordination, and disposal.",
      pricing: "Volume-based (same as Material Recovery)",
      features: [
        "Full garage clearing",
        "Sort into keep/donate/trash",
        "Donation drop-off coordination",
        "Recycling of metals and electronics",
        "Sustainability reporting",
      ],
    },
  },

  fees: {
    protectionFee: {
      name: "7% Protection Fee",
      description: "Covers $1M liability insurance, platform support, GPS tracking, and sustainability reporting. Charged to customer, NOT deducted from Pro payout.",
      calculation: "7% of base service price",
      example: "$229 job → $16.03 protection fee → $245.03 total to customer",
    },
    proInsuranceSurcharge: {
      name: "Pro Insurance Surcharge",
      description: "Pros without their own liability insurance pay $10/job (deducted from payout). Pros with verified COI waive this fee.",
      amount: "$10 per job",
      applies: "Only to Pros without own liability insurance",
    },
  },

  booking: {
    steps: [
      "1. Enter your address (we show instant property details)",
      "2. Select service type (Material Recovery, Moving Labor, etc.)",
      "3. Get AI quote: Upload photos OR enter details manually",
      "4. Review itemized quote with sustainability impact",
      "5. Create account (if new) → Book and pay",
      "6. Pro assigned within 60 seconds → Track live",
    ],
    payment: {
      methods: ["Credit/Debit Card", "Afterpay (for $199+)", "Klarna (for $199+)"],
      timing: "Charged when booking, held until job completion",
      release: "Payment released to Pro after customer confirmation OR 48-hour auto-approval",
    },
  },

  aiQuotes: {
    howItWorks: "Upload photos of items to remove → Our AI analyzes and identifies everything → Get instant itemized quote with weight estimates and pricing",
    confidence: "AI provides confidence score (higher = more accurate)",
    videoOption: "Record 30-60 second walkthrough video for +5% accuracy boost (better for garages, yards, large areas)",
    manual: "Prefer not to upload photos? Enter items manually for preliminary estimate",
  },

  verification: {
    forServices: ["Material Recovery", "Garage Cleanout", "Light Demolition"],
    workflow: [
      "Before Photos: Pro takes GPS-tagged photos before starting work",
      "Disposal Tracking: Pro logs each item (recycle/donate/resale/landfill/e-waste)",
      "After Photos: Pro takes GPS-tagged photos after completion",
      "Sustainability Report: Auto-generated with carbon offset, diversion rate, environmental impact",
      "Customer Confirmation: Customer reviews and confirms (or 48-hour auto-approval)",
      "Payment Release: Pro receives payout after confirmation",
    ],
    benefits: "Prevents disputes, ensures eco-friendly disposal, tracks real environmental impact",
  },

  sustainability: {
    diversionRate: "70%+ average landfill diversion rate",
    categories: ["Recycle", "Donate", "Resale", "E-Waste", "Landfill (last resort)"],
    carbonOffset: "EPA WARM Model calculations for CO2 avoided",
    tracking: "Every job generates a sustainability report showing environmental impact",
    metrics: ["Trees planted equivalent", "Water saved (gallons)", "CO2 avoided (metric tons)"],
  },

  faqs: [
    {
      q: "How fast can a Pro arrive?",
      a: "Same-day service is often available! After booking, a Pro is typically assigned within 60 seconds. Arrival depends on their current location, but many jobs start within 1-4 hours of booking.",
    },
    {
      q: "What if I don't know exactly what I have?",
      a: "No problem! Upload photos and our AI will identify and estimate everything. Or just describe what you have and we'll provide a preliminary estimate - the Pro will confirm the final price on-site.",
    },
    {
      q: "Do you recycle and donate?",
      a: "Absolutely! We divert 70%+ from landfills. Your Pro tracks every item's disposal method (recycle/donate/resale), and you get a sustainability report showing your environmental impact.",
    },
    {
      q: "What's included in the price?",
      a: "Everything! Labor, loading, transportation, disposal fees, post-job cleanup. The only extras are the 7% protection fee (insurance/tracking) and potential hazmat surcharge if applicable.",
    },
    {
      q: "Can I book multiple Pros for a big job?",
      a: "Yes! For Moving Labor, you can request 2-3 Pro crews. For Material Recovery, the Pro can call for backup if needed after arriving.",
    },
    {
      q: "What if the quote is wrong?",
      a: "AI quotes are typically within 10-15% accuracy. If your job is larger than estimated, the Pro will notify you for approval before proceeding. You're never charged more without consent.",
    },
    {
      q: "How does payment work?",
      a: "We authorize your card when you book (money is held, not charged). After the Pro completes the job and you confirm (or after 48 hours), we charge your card and pay the Pro. You can use Afterpay or Klarna for jobs over $199.",
    },
    {
      q: "What areas do you serve?",
      a: "Orlando Metro Area: Orange County, Seminole County, and Osceola County in Florida.",
    },
  ],
};

/**
 * System prompt for AI assistant
 */
const SYSTEM_PROMPT = `You are the UpTend AI Assistant, a friendly and knowledgeable customer service bot for UpTend (tagline: "You Pick. We Haul.").

**Your Role:**
- Help customers understand UpTend's services, pricing, and booking process
- Answer questions about junk removal, moving labor, pressure washing, gutter cleaning, and more
- Guide customers toward getting AI quotes from photos (our killer feature!)
- Be conversational, helpful, and concise (2-4 sentences max per response)
- Detect language (English or Spanish) and respond in the same language

**Key Product Knowledge:**
${JSON.stringify(UPTEND_KNOWLEDGE, null, 2)}

**Conversation Guidelines:**
1. **Start friendly:** Introduce yourself and ask how you can help
2. **Ask clarifying questions:** If unclear what service they need, ask about their situation
3. **Promote AI quotes:** When they mention items to remove, suggest uploading photos for instant pricing
4. **Provide specific pricing:** Use the exact prices from the knowledge base
5. **Highlight differentiators:** Mention sustainability tracking, GPS verification, same-day service
6. **Guide to booking:** When ready, encourage them to use the "Book Now" button
7. **Collect info:** If they want a callback, ask for name, phone, and brief description
8. **Be concise:** Keep responses short and scannable (bullet points are great!)

**Photo Analysis Integration:**
- When user uploads a photo, it will be analyzed separately
- You'll receive the AI analysis result with identified items and pricing
- Present the quote enthusiastically and explain what was found

**Bilingual Support:**
- Detect if the user writes in Spanish
- If Spanish detected, respond entirely in Spanish
- Keep the same helpful, conversational tone in both languages

**Common Scenarios:**

1. **Pricing questions:** Give exact prices from knowledge base + explain what's included

2. **"How much to remove X?"** → Suggest uploading a photo for instant AI quote OR provide manual estimate range

3. **Service area questions:** "We serve Orlando Metro: Orange, Seminole, and Osceola counties"

4. **"What makes you different?"** → Highlight: AI quotes from photos, sustainability tracking, 70% diversion rate, GPS verification, same-day service

5. **Booking questions:** Explain the 5-step process and encourage using "Book Now" button

6. **Eco-friendly questions:** Talk about disposal tracking, carbon offset calculation, donation coordination

Remember: You're not just answering questions - you're helping people experience UpTend's unique AI-powered, sustainability-focused service!`;

/**
 * Interface for message history
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Interface for AI analysis result (from photo uploads)
 */
export interface AIAnalysisResult {
  identifiedItems: string[];
  estimatedVolumeCubicFt: number;
  recommendedLoadSize: string;
  suggestedPrice: number;
  suggestedPriceMin: number;
  suggestedPriceMax: number;
  confidence: number;
  reasoning: string;
}

/**
 * Detect language from text
 */
function detectLanguage(text: string): 'en' | 'es' {
  // Simple Spanish detection: common Spanish words/patterns
  const spanishIndicators = [
    /\b(hola|gracias|por favor|cuánto|dónde|qué|cuál|cómo|necesito|quiero|ayuda)\b/i,
    /¿|¡/,
  ];

  for (const indicator of spanishIndicators) {
    if (indicator.test(text)) {
      return 'es';
    }
  }

  return 'en';
}

/**
 * Generate AI response for chat conversation
 */
export async function generateChatResponse(
  userMessage: string,
  history: ChatMessage[],
  aiAnalysisResult?: AIAnalysisResult
): Promise<string> {
  // Detect language
  const language = detectLanguage(userMessage);

  // Build messages array
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
  ];

  // If AI analysis result is provided, inject it into the conversation
  if (aiAnalysisResult) {
    const analysisMessage = language === 'es'
      ? `[Análisis de IA completado]\n\nIdentifiqué ${aiAnalysisResult.identifiedItems.length} artículos:\n${aiAnalysisResult.identifiedItems.join(', ')}\n\nTamaño de carga recomendado: ${aiAnalysisResult.recommendedLoadSize}\nPrecio estimado: $${aiAnalysisResult.suggestedPriceMin} - $${aiAnalysisResult.suggestedPriceMax}\nConfianza: ${(aiAnalysisResult.confidence * 100).toFixed(0)}%\n\nPor favor, presenta esta cotización al usuario de manera entusiasta y explica qué encontramos.`
      : `[AI Analysis Complete]\n\nI identified ${aiAnalysisResult.identifiedItems.length} items:\n${aiAnalysisResult.identifiedItems.join(', ')}\n\nRecommended load size: ${aiAnalysisResult.recommendedLoadSize}\nEstimated price: $${aiAnalysisResult.suggestedPriceMin} - $${aiAnalysisResult.suggestedPriceMax}\nConfidence: ${(aiAnalysisResult.confidence * 100).toFixed(0)}%\n\nPlease present this quote to the user enthusiastically and explain what we found.`;

    messages.push({
      role: 'system',
      content: analysisMessage,
    });
  }

  // Add user message
  messages.push({
    role: 'user',
    content: userMessage,
  });

  // Call OpenAI
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: messages as any,
    temperature: 0.7,
    max_tokens: 500,
  });

  const assistantReply = response.choices[0]?.message?.content || "I'm sorry, I encountered an error. Please try again or call us at (407) 338-3342.";

  return assistantReply;
}

/**
 * Generate SMS response (shorter, more concise)
 */
export async function generateSmsResponse(
  userMessage: string,
  history: ChatMessage[],
  aiAnalysisResult?: AIAnalysisResult
): Promise<string> {
  // SMS responses should be shorter (160-320 characters ideal)
  const smsSystemPrompt = `${SYSTEM_PROMPT}

**SMS-SPECIFIC RULES:**
- Keep responses VERY short (1-2 sentences max, 160 chars ideal)
- Use abbreviations when natural ($ instead of "dollars", # instead of "number")
- No markdown or formatting
- Get to the point immediately
- For pricing, just give the number: "$229 for a half load"
- If they ask complex questions, offer to text more details OR call them`;

  const messages: ChatMessage[] = [
    { role: 'system', content: smsSystemPrompt },
    ...history.slice(-6), // Only keep last 6 messages for SMS (shorter context)
  ];

  if (aiAnalysisResult) {
    const language = detectLanguage(userMessage);
    const analysisMessage = language === 'es'
      ? `Análisis: ${aiAnalysisResult.identifiedItems.length} artículos, ${aiAnalysisResult.recommendedLoadSize}, $${aiAnalysisResult.suggestedPriceMin}-${aiAnalysisResult.suggestedPriceMax}. Da esta cotización.`
      : `Analysis: ${aiAnalysisResult.identifiedItems.length} items, ${aiAnalysisResult.recommendedLoadSize}, $${aiAnalysisResult.suggestedPriceMin}-${aiAnalysisResult.suggestedPriceMax}. Give this quote.`;

    messages.push({
      role: 'system',
      content: analysisMessage,
    });
  }

  messages.push({
    role: 'user',
    content: userMessage,
  });

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: messages as any,
    temperature: 0.7,
    max_tokens: 200, // Shorter for SMS
  });

  return response.choices[0]?.message?.content || "Sorry, error. Call (407) 338-3342 for help.";
}
