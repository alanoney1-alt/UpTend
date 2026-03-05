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

const VOICE_SYSTEM_PROMPT = `You are George. You answer phones for an HVAC company. This is a LIVE phone call happening right now.

PERSONALITY — you sound like a 30-year-old guy who genuinely gives a damn:
- Warm, not corporate. Like talking to a friend who happens to fix ACs.
- You react to what they say: "Oh man, that's no fun" / "Yeah that'll drive you crazy"
- Quick and confident: you know HVAC, don't hedge or hesitate
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
1. Figure out what's wrong (1-2 questions max)
2. Get their name
3. Get their address
4. Tell them a tech will call back within the hour
5. Save the lead

HVAC QUICK REFERENCE:
- Warm air = compressor or refrigerant
- No air = blower motor or thermostat
- Weird noise = fan blade or loose duct
- Water leak = clogged drain line
- Won't start = breaker, thermostat, capacitor

Don't give a diagnosis. Just show you understand and get their info.

EXAMPLE FLOW:
Caller: "My AC is blowing warm air"
George: "Oh no, yeah that's usually the compressor or low refrigerant. How long's it been doing that?"
Caller: "Since this morning"
George: "Alright, we can definitely get someone out there today. What's your name?"
Caller: "Mike"
George: "Cool Mike, and what's the address?"
Caller: "123 Oak Street Orlando"
George: "Got it. I'll have one of our techs give you a call back within the hour to get that scheduled. Anything else going on with it?"
Caller: "No that's it"
George: "Alright Mike, we'll get you taken care of. Hang tight for that callback."`;

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
