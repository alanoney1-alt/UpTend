/**
 * Twilio-ElevenLabs Integration Service
 * 
 * Handles Option A: Twilio <Play> with ElevenLabs audio
 * - George generates text response
 * - Convert to ElevenLabs audio (Josh voice)
 * - Serve audio URL for Twilio <Play>
 */

import * as fs from 'fs';
import * as path from 'path';
import { nanoid } from 'nanoid';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const JOSH_VOICE_ID = 'TxGEqnHWrfWFTfGW9XjX';

// In-memory audio buffer store (Railway has ephemeral filesystem)
const audioBufferStore = new Map<string, Buffer>();
const audioCache = new Map<string, string>();

// Also keep filesystem as fallback for local dev
const AUDIO_DIR = path.join(process.cwd(), 'public', 'audio', 'voice');
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

/**
 * Get audio buffer by filename — used by the audio serving route
 */
export function getAudioBuffer(filename: string): Buffer | null {
  return audioBufferStore.get(filename) || null;
}

export interface TTSOptions {
  voice?: string;
  model?: string;
  speed?: number;
  stability?: number;
}

/**
 * Generate audio from text using ElevenLabs
 */
export async function generateVoiceAudio(
  text: string,
  options: TTSOptions = {}
): Promise<{ audioUrl: string; filename: string } | null> {
  if (!ELEVENLABS_API_KEY) {
    console.error('[ElevenLabs] API key not configured');
    return null;
  }

  // Clean text for voice
  const cleanText = cleanTextForVoice(text);
  if (cleanText.length === 0) {
    console.warn('[ElevenLabs] Empty text after cleaning');
    return null;
  }

  // Check cache first
  const cacheKey = `${cleanText}-${options.voice || JOSH_VOICE_ID}-${options.speed || 1.15}`;
  if (audioCache.has(cacheKey)) {
    const filename = audioCache.get(cacheKey)!;
    // Only use cache if buffer still exists in memory
    if (audioBufferStore.has(filename)) {
      return {
        audioUrl: `${process.env.BASE_URL || 'http://localhost:5000'}/api/voice/audio/${filename}`,
        filename
      };
    }
    // Buffer evicted, regenerate
    audioCache.delete(cacheKey);
  }

  try {
    // output_format as query parameter — mp3 is most compatible with Twilio <Play>
    const voiceId = options.voice || JOSH_VOICE_ID;
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: cleanText,
        model_id: options.model || 'eleven_turbo_v2_5',
        voice_settings: {
          stability: options.stability || 0.5,
          similarity_boost: 0.8,
          style: 0.15,
          use_speaker_boost: true,
          speaking_rate: options.speed || 1.0
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ElevenLabs] API error:', response.status, errorText);
      return null;
    }

    // Save audio to in-memory store AND filesystem
    const filename = `${nanoid(12)}.mp3`;
    const filePath = path.join(AUDIO_DIR, filename);
    const audioBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(audioBuffer);
    
    // In-memory store (works on Railway's ephemeral filesystem)
    audioBufferStore.set(filename, buffer);
    
    // Also write to disk (works for local dev, may not persist on Railway)
    try { fs.writeFileSync(filePath, buffer); } catch (e) { /* ok */ }

    // Cache the result
    audioCache.set(cacheKey, filename);

    // Use API route instead of static file serving (guaranteed to work)
    const audioUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/api/voice/audio/${filename}`;
    
    console.log(`[ElevenLabs] Generated audio: ${filename} (${audioBuffer.byteLength} bytes)`);
    
    return { audioUrl, filename };
  } catch (error: any) {
    console.error('[ElevenLabs] Error generating audio:', error.message);
    return null;
  }
}

/**
 * Pre-cache common phrases for faster response
 */
export async function preloadCommonPhrases() {
  const commonPhrases = [
    "Hello, this is George. How can I help you today?",
    "Thanks for calling. Let me help you with that.",
    "Could you repeat that please?",
    "I understand. Let me get that scheduled for you.",
    "Thank you for calling. Have a great day!",
    "I'm sorry, I didn't catch that. Could you say it again?",
    "Let me look that up for you.",
    "Perfect! I'll get that taken care of."
  ];

  console.log('[ElevenLabs] Pre-loading common phrases...');
  const promises = commonPhrases.map(phrase => generateVoiceAudio(phrase));
  await Promise.allSettled(promises);
  console.log(`[ElevenLabs] Cached ${audioCache.size} common phrases`);
}

/**
 * Clean text for voice synthesis
 */
function cleanTextForVoice(text: string): string {
  return text
    // Remove markdown formatting
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    
    // Remove special characters that don't speak well
    .replace(/[{}[\]]/g, '')
    .replace(/\|/g, '')
    .replace(/~/g, '')
    .replace(/@/g, 'at')
    .replace(/&/g, 'and')
    .replace(/%/g, 'percent')
    .replace(/\$/g, 'dollar ')
    .replace(/#/g, 'number ')
    
    // Clean up spacing and punctuation
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\.{2,}/g, '.')
    .replace(/\?{2,}/g, '?')
    .replace(/!{2,}/g, '!')
    
    // Ensure proper sentence endings
    .replace(/([a-z])([.!?])([A-Z])/g, '$1$2 $3')
    
    .trim()
    .slice(0, 5000); // ElevenLabs limit
}

/**
 * Generate TwiML response with audio
 */
export function generateTwiMLWithAudio(audioUrl: string, nextAction?: string): string {
  const actionUrl = nextAction || '';
  
  // Play audio INSIDE Gather so Twilio listens while/after audio plays
  // Without this, Redirect fires immediately after Play → no speech captured → "didn't catch that" loop
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${actionUrl}" timeout="8" speechTimeout="3" language="en-US">
    <Play>${audioUrl}</Play>
  </Gather>
  ${actionUrl ? `<Redirect>${actionUrl}</Redirect>` : '<Say voice="alice">Are you still there? Just let me know how I can help.</Say><Hangup/>'}
</Response>`;
}

/**
 * Generate TwiML for speech gathering
 */
export function generateTwiMLGather(
  prompt: string,
  actionUrl: string,
  timeout = 8,
  speechTimeout = 3
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="${actionUrl}" timeout="${timeout}" speechTimeout="${speechTimeout}" language="en-US">
    <Say voice="alice">${cleanTextForVoice(prompt)}</Say>
  </Gather>
  <Redirect>${actionUrl}</Redirect>
</Response>`;
}

/**
 * Generate TwiML to end call
 */
export function generateTwiMLHangup(message?: string): string {
  const sayXml = message ? `<Say voice="alice">${cleanTextForVoice(message)}</Say>` : '';
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${sayXml}
  <Hangup/>
</Response>`;
}

/**
 * Check if voice service is properly configured
 */
export function isVoiceConfigured(): boolean {
  return !!(ELEVENLABS_API_KEY && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
}

/**
 * Clean up old audio files (run periodically)
 */
export function cleanupOldAudioFiles(maxAgeHours = 24) {
  try {
    const files = fs.readdirSync(AUDIO_DIR);
    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    
    let deletedCount = 0;
    for (const file of files) {
      const filePath = path.join(AUDIO_DIR, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime.getTime() < cutoffTime) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }
    
    console.log(`[ElevenLabs] Cleaned up ${deletedCount} old audio files`);
  } catch (error: any) {
    console.error('[ElevenLabs] Error cleaning up audio files:', error.message);
  }
}

// Clean up old files every hour
setInterval(() => cleanupOldAudioFiles(), 60 * 60 * 1000);

// Pre-load common phrases on startup
setTimeout(() => preloadCommonPhrases(), 5000);