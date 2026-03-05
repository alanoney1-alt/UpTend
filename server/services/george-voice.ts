/**
 * George Voice - Lightweight voice-specific AI handler
 * 
 * Uses gpt-4o-mini with a tiny system prompt (~500 tokens)
 * instead of the full George agent (78K tokens).
 * Goal: < 1 second AI response time on phone calls.
 */

const VOICE_SYSTEM_PROMPT = `You are George, a phone receptionist for an HVAC company. You're on a live phone call RIGHT NOW.

RULES:
- MAX 2 sentences. This is a phone call. Be brief.
- Sound human: use "yeah", "got it", "sure thing", contractions.
- ALWAYS end with a question to keep the conversation going.
- NO markdown, NO bullet points, NO technical jargon. Just talk.
- Collect: name, phone (you already have it), address, what's wrong.
- Once you have their info: "Perfect, I'll have a tech call you back within the hour."
- If you can't understand: "Sorry, bad connection — what was that again?"
- Be warm. You're the friendly voice that makes people feel like they called the right place.
- Say "we" and "our team" — you ARE the company.
- NEVER say "I'd be happy to help" or "Thank you for reaching out" — too robotic.

HVAC BASICS (only if needed):
- Warm air: compressor, refrigerant, or dirty filter
- No air: blower motor or thermostat
- Weird noise: fan blade, motor bearing, or loose ductwork
- Water leak: clogged drain line
- Won't turn on: breaker, thermostat, or capacitor

Don't diagnose in depth. Just acknowledge the problem and get their info.`;

interface VoiceResponse {
  response: string;
  provider: string;
}

export async function georgeVoiceChat(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  partnerContext: string
): Promise<VoiceResponse> {
  const messages = [
    { role: "system" as const, content: VOICE_SYSTEM_PROMPT + "\n\n" + partnerContext },
    ...conversationHistory,
    { role: "user" as const, content: userMessage }
  ];

  // Try gpt-4o-mini first (fastest)
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
        max_tokens: 100,  // 2 sentences = ~40-60 tokens. Cap at 100.
        temperature: 0.7
      })
    });

    if (response.ok) {
      const result = await response.json();
      const text = result.choices?.[0]?.message?.content || "";
      if (text) return { response: text, provider: "openai-mini" };
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
        max_tokens: 100,
        temperature: 0.7
      })
    });

    if (response.ok) {
      const result = await response.json();
      const text = result.choices?.[0]?.message?.content || "";
      if (text) return { response: text, provider: "openai" };
    }
  } catch (e: any) {
    console.error("[George Voice] gpt-4o failed:", e.message);
  }

  return { response: "Hey, sorry about that — we're having a system hiccup. Can you try calling back in a minute?", provider: "fallback" };
}
