/**
 * George Voice v3 — Fast, warm, human phone conversations
 * 
 * Architecture:
 * 1. Pre-cached acknowledgment audio plays INSTANTLY (no AI/TTS wait)
 * 2. AI generates real response in parallel (gpt-4o-mini, ~800ms)
 * 3. TTS converts to audio (~500ms)
 * 4. Next Gather plays the real response
 * 
 * This means the caller hears "Yeah, got it..." within 200ms
 * instead of 3 seconds of silence.
 */

import { nanoid } from 'nanoid';

// ═══════════════════════════════════════════════════
// VOICE PERSONALITY
// ═══════════════════════════════════════════════════

const VOICE_SYSTEM_PROMPT = `You are George from UpTend. You answer phones for a home services company that handles ALL types of home jobs. This is a LIVE phone call happening right now.

PERSONALITY — you sound like a 30-year-old guy who genuinely gives a damn:
- Warm, not corporate. Like talking to a friend who happens to help with home stuff.
- You react to what they say: "Oh man, that's no fun" / "Yeah that'll drive you crazy"
- Quick and confident: you know home services, don't hedge or hesitate
- Use their name once you have it

VOICE RULES:
- ONE to TWO sentences max. This is a phone call.
- End EVERY response with a question. Keep the conversation moving.
- Use contractions always: "I'll", "we'll", "that's", "what's"
- Filler words are OK: "yeah", "alright", "so", "okay cool"
- NO markdown, NO lists, NO asterisks. Spoken English only.
- NEVER say: "I'd be happy to", "Thank you for reaching out", "I apologize", "How may I assist you"
- INSTEAD say: "Yeah for sure", "No worries", "I got you", "We'll take care of it"

YOUR JOB:
1. Figure out what service they need (1-2 questions max)
2. Get their name
3. Get their address — REPEAT IT BACK to confirm ("So that's 123 Oak Street in Orlando, right?")
4. When you have all info, ask: "Should I book that for you?"
5. If they say YES, confirm the booking with: [BOOK:service_type:address:name]

CRITICAL — PHONE NUMBER:
- You ALREADY HAVE their phone number from caller ID. It's in your context.
- NEVER ask for their phone number. You already have it.
- When wrapping up, say "We'll call you back at this number" — don't ask them to repeat it.

CRITICAL — ADDRESS CONFIRMATION:
- When they give you an address, ALWAYS repeat it back: "So that's [address], right?"
- If it sounds garbled or unclear, ask them to repeat just the street number
- If you can't understand the address, say: "Sorry the connection's a little fuzzy — can you give me just the street number and street name one more time?"

SERVICES WE OFFER (with typical price ranges):
- Junk Removal ($150-400) - old furniture, appliances, cleanouts
- HVAC ($200-500) - AC repair, heating issues, maintenance
- Pressure Washing ($150-350) - driveways, houses, decks
- Gutter Cleaning ($150-250) - cleaning, minor repairs
- Pool Cleaning ($100-200) - maintenance, chemical balancing
- Home Cleaning ($120-300) - regular cleaning, deep cleans
- Handyman ($150-400) - repairs, installations, odd jobs
- Moving Labor ($200-500) - loading, unloading, furniture moving
- Carpet Cleaning ($150-300) - deep cleaning, stain removal
- Light Demolition ($200-600) - demo walls, flooring, cleanup
- Landscaping ($200-500) - lawn care, tree trimming, yard work
- Painting ($300-800) - interior, exterior, touch-ups
- Garage Cleanout ($200-400) - organize, haul away junk

BOOKING CONFIRMATION:
When customer confirms they want to book, include this EXACT tag in your response:
[BOOK:service_type:address:name]
Use database keys: junk_removal, hvac, pressure_washing, gutter_cleaning, pool_cleaning, home_cleaning, handyman, moving_labor, carpet_cleaning, light_demolition, landscaping, painting, garage_cleanout

EXAMPLE FLOW:
Caller: "My AC isn't working"
George: "Oh no, that's usually the compressor or a thermostat issue. How long's it been out?"
Caller: "Since this morning"
George: "Alright, we can get someone out there today. What's your name?"
Caller: "Mike"
George: "Cool Mike, what's the address?"
Caller: "123 Oak Street Orlando"
George: "Got it — 123 Oak Street in Orlando, right?"
Caller: "Yeah"
George: "Perfect. Should I book that HVAC repair for you?"
Caller: "Yes"
George: "Done! [BOOK:hvac:123 Oak Street Orlando:Mike] I've got you scheduled and a Pro will call you back at this number within the hour to confirm the time."`;

// ═══════════════════════════════════════════════════
// PRE-CACHED ACKNOWLEDGMENTS
// ═══════════════════════════════════════════════════

// These are generated at startup and stored in memory.
// When a caller speaks, we IMMEDIATELY play one of these
// while generating the real AI response in the background.
const ACK_PHRASES = [
  "Yeah, got it.",
  "Okay.",
  "Alright.",
  "Sure.",
  "Mm-hmm.",
];

// Map of phrase → audio buffer (populated at startup)
const ackAudioCache = new Map<string, { buffer: Buffer; filename: string }>();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const JOSH_VOICE_ID = 'TxGEqnHWrfWFTfGW9XjX';

// Voice settings tuned for warmth and naturalness
const WARM_VOICE_SETTINGS = {
  stability: 0.3,           // Lower = more expressive variation
  similarity_boost: 0.85,   // High = stays close to Josh's natural warmth  
  style: 0.45,              // Higher = more emotional/expressive delivery
  use_speaker_boost: true,
};

/**
 * Pre-generate acknowledgment audio clips at startup.
 * Called once when the server starts.
 */
export async function preWarmAckAudio(): Promise<void> {
  if (!ELEVENLABS_API_KEY) {
    console.warn('[George Voice] No ElevenLabs API key — skipping pre-warm');
    return;
  }
  
  console.log('[George Voice] Pre-warming acknowledgment audio...');
  
  for (const phrase of ACK_PHRASES) {
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${JOSH_VOICE_ID}?output_format=mp3_22050_32&optimize_streaming_latency=4`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text: phrase,
            model_id: 'eleven_turbo_v2_5',
            voice_settings: WARM_VOICE_SETTINGS,
          }),
        }
      );

      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer());
        const filename = `ack_${nanoid(8)}.mp3`;
        ackAudioCache.set(phrase, { buffer, filename });
        console.log(`[George Voice]   ✓ "${phrase}" (${buffer.length} bytes)`);
      }
    } catch (e: any) {
      console.error(`[George Voice]   ✗ "${phrase}": ${e.message}`);
    }
  }
  
  console.log(`[George Voice] Pre-warmed ${ackAudioCache.size}/${ACK_PHRASES.length} acknowledgments`);
}

/**
 * Get a random pre-cached acknowledgment audio.
 * Returns null if none are cached.
 */
export function getRandomAck(): { buffer: Buffer; filename: string; phrase: string } | null {
  const entries = Array.from(ackAudioCache.entries());
  if (entries.length === 0) return null;
  const [phrase, audio] = entries[Math.floor(Math.random() * entries.length)];
  return { ...audio, phrase };
}

// ═══════════════════════════════════════════════════
// AI CHAT
// ═══════════════════════════════════════════════════

interface VoiceResponse {
  response: string;
  provider: string;
  latencyMs: number;
}

export async function georgeVoiceChat(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  partnerContext: string
): Promise<VoiceResponse> {
  const startTime = Date.now();
  
  const messages = [
    { role: "system" as const, content: VOICE_SYSTEM_PROMPT + "\n\n" + partnerContext },
    ...conversationHistory,
    { role: "user" as const, content: userMessage }
  ];

  // Try gpt-4o-mini first (fastest, ~500-800ms)
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 80,  // Strict: 2 sentences ≈ 30-50 tokens
        temperature: 0.8  // Slightly higher for more natural variation
      })
    });

    if (response.ok) {
      const result = await response.json();
      const text = result.choices?.[0]?.message?.content || "";
      if (text) {
        return { response: text, provider: "gpt-4o-mini", latencyMs: Date.now() - startTime };
      }
    }
  } catch (e: any) {
    console.error("[George Voice] gpt-4o-mini failed:", e.message);
  }

  // Fallback: gpt-4o
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        max_tokens: 80,
        temperature: 0.8
      })
    });

    if (response.ok) {
      const result = await response.json();
      const text = result.choices?.[0]?.message?.content || "";
      if (text) {
        return { response: text, provider: "gpt-4o", latencyMs: Date.now() - startTime };
      }
    }
  } catch (e: any) {
    console.error("[George Voice] gpt-4o fallback failed:", e.message);
  }

  return {
    response: "Hey sorry, we're having a little system issue. Can you try calling back in just a sec?",
    provider: "fallback",
    latencyMs: Date.now() - startTime
  };
}

// ═══════════════════════════════════════════════════
// TTS WITH WARM SETTINGS
// ═══════════════════════════════════════════════════

/**
 * Generate warm, expressive TTS audio for a response.
 * Returns the audio buffer and a filename.
 */
export async function generateWarmAudio(text: string): Promise<{ buffer: Buffer; filename: string } | null> {
  if (!ELEVENLABS_API_KEY) return null;
  
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${JOSH_VOICE_ID}?output_format=mp3_22050_32&optimize_streaming_latency=4`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: WARM_VOICE_SETTINGS,
        }),
      }
    );

    if (response.ok) {
      const buffer = Buffer.from(await response.arrayBuffer());
      const filename = `voice_${nanoid(12)}.mp3`;
      return { buffer, filename };
    } else {
      console.error('[George Voice] TTS error:', response.status, await response.text());
    }
  } catch (e: any) {
    console.error('[George Voice] TTS failed:', e.message);
  }
  
  return null;
}

// ═══════════════════════════════════════════════════
// SERVICE TYPE MAPPING & BOOKING SIGNAL PARSING
// ═══════════════════════════════════════════════════

/**
 * Maps spoken service names to database keys
 */
export const SERVICE_MAP: Record<string, string> = {
  // Junk Removal variants
  "junk removal": "junk_removal",
  "hauling": "junk_removal",
  "trash": "junk_removal",
  "junk": "junk_removal",
  "removal": "junk_removal",

  // HVAC variants
  "ac": "hvac",
  "air conditioning": "hvac",
  "hvac": "hvac",
  "heating": "hvac",
  "air conditioner": "hvac",
  "ac repair": "hvac",

  // Pressure Washing variants
  "pressure washing": "pressure_washing",
  "power washing": "pressure_washing",
  "pressure wash": "pressure_washing",
  "power wash": "pressure_washing",

  // Gutter Cleaning variants
  "gutter cleaning": "gutter_cleaning",
  "gutters": "gutter_cleaning",
  "gutter": "gutter_cleaning",

  // Pool Cleaning variants
  "pool": "pool_cleaning",
  "pool cleaning": "pool_cleaning",
  "pool service": "pool_cleaning",

  // Home Cleaning variants
  "cleaning": "home_cleaning",
  "house cleaning": "home_cleaning",
  "maid": "home_cleaning",
  "home cleaning": "home_cleaning",

  // Handyman variants
  "handyman": "handyman",
  "repairs": "handyman",
  "fix": "handyman",
  "repair": "handyman",

  // Moving Labor variants
  "moving": "moving_labor",
  "moving help": "moving_labor",
  "moving labor": "moving_labor",
  "movers": "moving_labor",

  // Carpet Cleaning variants
  "carpet cleaning": "carpet_cleaning",
  "carpet": "carpet_cleaning",

  // Light Demolition variants
  "demolition": "light_demolition",
  "demo": "light_demolition",

  // Landscaping variants
  "landscaping": "landscaping",
  "lawn": "landscaping",
  "yard": "landscaping",
  "lawn care": "landscaping",
  "yard work": "landscaping",

  // Painting variants
  "painting": "painting",
  "paint": "painting",

  // Garage Cleanout variants
  "garage cleanout": "garage_cleanout",
  "garage": "garage_cleanout",
  "garage cleaning": "garage_cleanout",
};

/**
 * Parses George's response for booking signals in the format [BOOK:service_type:address:name]
 * Returns the parsed booking information or null if no booking signal found.
 */
export function parseBookingSignal(response: string): { serviceType: string; address: string; name?: string } | null {
  const bookingRegex = /\[BOOK:([^:]+):([^:]+):([^\]]+)\]/i;
  const match = response.match(bookingRegex);

  if (!match) return null;

  const [, serviceType, address, name] = match;

  return {
    serviceType: serviceType.trim(),
    address: address.trim(),
    name: name?.trim(),
  };
}
