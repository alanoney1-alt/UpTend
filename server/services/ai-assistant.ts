/**
 * AI Assistant Service
 *
 * Shared knowledge base and conversation logic for both web chat bot and SMS bot.
 * Contains complete UpTend product knowledge, pricing, and customer service responses.
 */

import { openai } from "../openaiClient";

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
      name: "Junk Removal",
      description: "Professional removal of unwanted items, furniture, appliances, yard waste, and debris. We recycle and donate whenever possible.",
      pricing: "Volume-based pricing by truck load",
      tiers: [
        { size: "Minimum (1-2 items)", price: "$99", capacity: "~25 cubic ft", example: "Sofa, mattress, or appliance" },
        { size: "1/8 Truck", price: "$179", capacity: "~27 cubic ft", example: "Mattress + small table OR 2 chairs + boxes" },
        { size: "1/4 Truck", price: "$279", capacity: "~54 cubic ft", example: "Couch + small desk OR Dresser + chairs" },
        { size: "1/2 Truck", price: "$379", capacity: "~108 cubic ft", example: "Bedroom set OR Living room furniture" },
        { size: "3/4 Truck", price: "$449", capacity: "~162 cubic ft", example: "Full apartment OR Large garage cleanout" },
        { size: "Full Truck", price: "$549", capacity: "~216 cubic ft", example: "Multiple rooms, estate cleanout" },
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
      name: "Moving Labor",
      description: "Professional movers to help load/unload trucks, rearrange furniture, or provide labor-only moving assistance.",
      pricing: "$80/hour per Pro (1-hour minimum)",
      features: [
        "Multi-Pro crews available (1-3 workers)",
        "Truck unloading specialists",
        "Furniture assembly/disassembly",
        "Heavy lifting and positioning",
        "Real-time crew coordination",
      ],
      crewPricing: [
        { crew: "1 Pro", rate: "$80/hour", best: "Light tasks, rearranging" },
        { crew: "2 Pros", rate: "$160/hour", best: "Standard moves, truck loading" },
        { crew: "3 Pros", rate: "$240/hour", best: "Large moves, heavy items" },
      ],
    },

    pressure_washing: {
      name: "Pressure Washing",
      description: "Professional pressure washing for driveways, siding, decks, patios, and more.",
      pricing: "$0.25 per square foot (minimum $120 for 480 sqft)",
      aiQuote: "Upload photos and get instant square footage calculation",
      features: [
        "Instant square footage calculation from photos",
        "Commercial-grade 3000 PSI equipment",
        "Eco-friendly cleaning solutions",
        "Before/after photo verification",
      ],
      surfaces: ["Driveway", "Siding", "Deck", "Patio", "Sidewalk", "Fence"],
    },

    gutter_cleaning: {
      name: "Gutter Cleaning",
      description: "Professional gutter cleaning and debris removal to prevent water damage.",
      pricing: "Tiered pricing by home size and linear footage",
      rates: [
        { type: "1-Story (up to 150 linear ft)", price: "$150", includes: "Full perimeter cleaning + flow test" },
        { type: "1-Story Large (150-250 linear ft)", price: "$195", includes: "Full perimeter cleaning + flow test" },
        { type: "2-Story (up to 150 linear ft)", price: "$225", includes: "Full perimeter cleaning + flow test" },
        { type: "2-Story Large (150-250 linear ft)", price: "$249", includes: "Full perimeter cleaning + flow test" },
        { type: "3-Story", price: "$299+", includes: "Full perimeter cleaning + flow test" },
      ],
      addOns: [
        { type: "Gutter guard install", price: "$4-6/linear ft" },
        { type: "Downspout flush", price: "$15/each" },
        { type: "Gutter repair (minor)", price: "$75" },
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
      pricing: "Starting at $199, custom quotes for larger projects",
      features: [
        "Fence removal",
        "Deck teardown",
        "Shed demolition",
        "Interior demo (non-loadbearing walls)",
        "Debris removal included",
        "Before/after photo verification",
      ],
    },

    garage_cleanout: {
      name: "Garage Cleanout",
      description: "Complete garage clearing with sorting, donation coordination, and disposal.",
      pricing: "Small: $299 | Medium: $499 | Large: $749 | XL: $999",
      features: [
        "Full garage clearing",
        "Sort into keep/donate/trash",
        "Donation drop-off coordination",
        "Recycling of metals and electronics",
        "Sustainability reporting",
      ],
    },

    home_cleaning: {
      name: "Home Cleaning",
      description: "Professional home cleaning service with room-by-room checklists and before/after photo verification.",
      pricing: "Standard: $99/$149/$199/$249 by size | Deep: 1.5x | Move-In/Out: 2x",
      tiers: [
        { size: "1-2 bed / 1 bath", standard: "$99", deep: "$149", moveInOut: "$198" },
        { size: "3 bed / 2 bath", standard: "$149", deep: "$224", moveInOut: "$298" },
        { size: "4 bed / 2-3 bath", standard: "$199", deep: "$299", moveInOut: "$398" },
        { size: "5+ bed / 3+ bath", standard: "$249", deep: "$374", moveInOut: "$498" },
      ],
      recurring: {
        weekly: "15% discount off standard pricing",
        biweekly: "10% discount off standard pricing",
        monthly: "5% discount off standard pricing",
      },
      addOns: [
        { name: "Inside oven", price: "$35" },
        { name: "Inside refrigerator", price: "$35" },
        { name: "Interior windows", price: "$5 per window" },
        { name: "Laundry (2 loads)", price: "$30" },
        { name: "Organize closet", price: "$40" },
        { name: "Pet hair treatment", price: "$25" },
      ],
      features: [
        "Room-by-room checklist completion",
        "Before/after photos required",
        "Cleaning supplies included",
        "Same Pro for recurring bookings",
        "3-booking minimum for recurring plans",
      ],
    },

    home_scan: {
      name: "AI Home Scan",
      description: "Complete home health assessment with personalized maintenance report. Available in two tiers: Standard and Aerial.",
      tiers: [
        {
          name: "AI Home Scan Standard",
          price: "$99",
          description: "Full interior and exterior ground-level walkthrough with maintenance report",
          features: [
            "Full interior walkthrough (room-by-room photos and notes)",
            "Exterior ground-level assessment (foundation, driveway, walkways, landscaping)",
            "Major systems check (AC age, water heater, electrical, plumbing)",
            "Cleanliness rating per room (1-10)",
            "Personalized maintenance report with one-tap booking for recommended services",
          ],
          dronRequired: false,
        },
        {
          name: "AI Home Scan Aerial",
          price: "$249",
          description: "Everything in Standard plus drone-powered roof, gutter, and exterior aerial scan",
          features: [
            "Everything in Standard PLUS:",
            "FAA Part 107 certified drone pilot flyover",
            "Aerial roof condition scan (missing shingles, sagging, moss, flashing damage)",
            "Gutter blockage assessment from above (percentage estimate)",
            "Chimney and vent inspection",
            "Tree overhang proximity to roof and power lines",
            "Siding and paint condition from aerial angle",
            "Pool enclosure / screen assessment (Florida-specific)",
            "Property drainage overview from aerial perspective",
            "Full before/after aerial photo set, timestamped and GPS-tagged",
          ],
          droneRequired: true,
          valueComparison: "Comparable drone roof inspections cost $290-$350 elsewhere. You're getting it bundled for $249.",
          recommended: true,
        },
      ],
      creditPolicy: "$49 credit toward any job you book through UpTend on either the $99 or $249 scan. It's risk-free.",
      when: "When customer asks about home inspection or audit, present both tier options and explain that Aerial includes drone scan that normally costs $290+ elsewhere.",
    },
  },

  fees: {
    protectionFee: {
      name: "7% Protection Fee",
      description: "Covers $1M liability insurance, UpTend support, GPS tracking, and sustainability reporting. Charged to customer, NOT deducted from Pro payout.",
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
      "2. Select service type (Junk Removal, Moving Labor, Pressure Washing, Gutter Cleaning, etc.)",
      "3. Get instant quote: Upload photos OR enter details manually",
      "4. Review itemized quote with sustainability impact",
      "5. Create account (if new) → Book and pay",
      "6. Pro assigned via Real-Time Matching → Track live",
    ],
    payment: {
      methods: ["Credit/Debit Card", "Afterpay (for $199+)", "Klarna (for $199+)"],
      timing: "Charged when booking, held until job completion",
      release: "Payment released to Pro after customer confirmation OR 48-hour auto-approval",
    },
  },

  smartQuotes: {
    howItWorks: "Upload photos of items to remove → We analyze and identify everything instantly → Get instant itemized quote with weight estimates and pricing",
    confidence: "Confidence score provided (higher = more accurate)",
    videoOption: "Record 30-60 second walkthrough video for +5% accuracy boost (better for garages, yards, large areas)",
    manual: "Prefer not to upload photos? Enter items manually for preliminary estimate",
  },

  verification: {
    forServices: ["Junk Removal", "Garage Cleanout", "Light Demolition", "Home Cleaning"],
    workflow: [
      "Before Photos: Pro takes GPS-tagged photos before starting work",
      "Disposal Tracking (Junk Removal/Garage Cleanout/Light Demolition): Pro logs each item (recycle/donate/resale/landfill/e-waste)",
      "Cleaning Checklist (Home Cleaning): Room-by-room task completion with photo verification",
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
      a: "Same-day service is often available! After booking, a Pro is typically assigned via Real-Time Matching. Arrival depends on their current location, but many jobs start within 1-4 hours of booking.",
    },
    {
      q: "What if I don't know exactly what I have?",
      a: "No problem! Upload photos and we'll identify and estimate everything instantly. Or just describe what you have and we'll provide a preliminary estimate - the Pro will confirm the final price on-site.",
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
      a: "Yes! For Moving Labor, you can request 2-3 Pro crews. For Junk Removal, the Pro can call for backup if needed after arriving.",
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
    model: 'gpt-4o-mini',
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
    model: 'gpt-4o-mini',
    messages: messages as any,
    temperature: 0.7,
    max_tokens: 200, // Shorter for SMS
  });

  return response.choices[0]?.message?.content || "Sorry, error. Call (407) 338-3342 for help.";
}
