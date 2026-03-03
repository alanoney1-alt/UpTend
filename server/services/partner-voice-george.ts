/**
 * George Voice Service (#4)
 * 
 * ElevenLabs TTS for George's voice in discovery and partner interactions.
 * Voice: Adam (deep, smooth, American)
 * 
 * Flow:
 * 1. George generates text response
 * 2. Text → ElevenLabs API → audio stream
 * 3. Audio sent to client as base64 or streamed
 * 
 * Used on:
 * - Discovery page voice mode
 * - Partner dashboard voice updates
 * - Proactive voice messages (premium)
 */

// ============================================================
// Config
// ============================================================

// ElevenLabs voice IDs
const VOICES = {
  adam: "pNInz6obpgDQGcFmaJgB", // Deep, smooth, American male
  marcus: "CYw49ThSYFQiqnBGMMfB", // Warm baritone (backup)
  clyde: "2EiwWnXFnvU5JabPnv8n", // Deep, gravelly (backup)
};

const DEFAULT_VOICE = "adam";
const DEFAULT_MODEL = "eleven_monolingual_v1"; // Fast, English-only
const STABILITY = 0.5;
const SIMILARITY_BOOST = 0.75;
const STYLE = 0.3;

// ============================================================
// Types
// ============================================================

export interface VoiceOptions {
  voice?: keyof typeof VOICES;
  model?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  outputFormat?: "mp3_44100_128" | "mp3_22050_32" | "pcm_16000" | "pcm_24000";
}

export interface VoiceResult {
  audio: Buffer;
  contentType: string;
  durationEstimate: number; // rough estimate in seconds
}

// ============================================================
// Core TTS
// ============================================================

/**
 * Convert text to speech using ElevenLabs API
 */
export async function textToSpeech(text: string, options: VoiceOptions = {}): Promise<VoiceResult | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.log("[VoiceGeorge] ELEVENLABS_API_KEY not set. Voice disabled.");
    return null;
  }

  const voiceId = VOICES[options.voice || DEFAULT_VOICE];
  const model = options.model || DEFAULT_MODEL;
  const outputFormat = options.outputFormat || "mp3_44100_128";

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: `audio/mpeg`,
      },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: {
          stability: options.stability ?? STABILITY,
          similarity_boost: options.similarityBoost ?? SIMILARITY_BOOST,
          style: options.style ?? STYLE,
          use_speaker_boost: true,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`[VoiceGeorge] ElevenLabs error ${res.status}:`, err);
      return null;
    }

    const arrayBuffer = await res.arrayBuffer();
    const audio = Buffer.from(arrayBuffer);
    
    // Rough duration estimate: ~150 words per minute, 5 chars per word average
    const wordCount = text.split(/\s+/).length;
    const durationEstimate = (wordCount / 150) * 60;

    return {
      audio,
      contentType: "audio/mpeg",
      durationEstimate: Math.round(durationEstimate),
    };
  } catch (err) {
    console.error("[VoiceGeorge] TTS error:", err);
    return null;
  }
}

/**
 * Generate voice response and return as base64 for client-side playback
 */
export async function textToSpeechBase64(text: string, options: VoiceOptions = {}): Promise<string | null> {
  const result = await textToSpeech(text, options);
  if (!result) return null;
  return result.audio.toString("base64");
}

// ============================================================
// Streaming TTS (for real-time conversation)
// ============================================================

/**
 * Stream TTS using ElevenLabs streaming endpoint
 * Returns a ReadableStream for chunked audio delivery
 */
export async function textToSpeechStream(
  text: string,
  options: VoiceOptions = {}
): Promise<ReadableStream | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return null;

  const voiceId = VOICES[options.voice || DEFAULT_VOICE];
  const model = options.model || DEFAULT_MODEL;

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: {
          stability: options.stability ?? STABILITY,
          similarity_boost: options.similarityBoost ?? SIMILARITY_BOOST,
          style: options.style ?? STYLE,
          use_speaker_boost: true,
        },
      }),
    });

    if (!res.ok || !res.body) {
      console.error(`[VoiceGeorge] Stream error ${res.status}`);
      return null;
    }

    return res.body as any;
  } catch (err) {
    console.error("[VoiceGeorge] Stream error:", err);
    return null;
  }
}

// ============================================================
// Voice-enabled George response
// ============================================================

/**
 * Get George's text response + audio in one call
 * Used by the discovery page in voice mode
 */
export async function georgeVoiceResponse(
  textResponse: string,
  options: VoiceOptions = {}
): Promise<{
  text: string;
  audioBase64: string | null;
  audioContentType: string;
  durationEstimate: number;
}> {
  const result = await textToSpeech(textResponse, options);
  
  return {
    text: textResponse,
    audioBase64: result ? result.audio.toString("base64") : null,
    audioContentType: "audio/mpeg",
    durationEstimate: result ? result.durationEstimate : 0,
  };
}

// ============================================================
// Available Voices (for UI selection)
// ============================================================

export function getAvailableVoices(): Array<{ id: string; name: string; description: string }> {
  return [
    { id: "adam", name: "Adam", description: "Deep, smooth, authoritative American male" },
    { id: "marcus", name: "Marcus", description: "Warm baritone, smooth delivery" },
    { id: "clyde", name: "Clyde", description: "Deep, gravelly, commanding" },
  ];
}

/**
 * Check if voice is available (API key set)
 */
export function isVoiceEnabled(): boolean {
  return !!process.env.ELEVENLABS_API_KEY;
}
