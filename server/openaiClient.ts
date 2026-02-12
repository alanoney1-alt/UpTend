import OpenAI from "openai";

// Lazy-initialized OpenAI client that won't crash on startup if key is missing
let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OpenAI API key not configured. Set OPENAI_API_KEY environment variable.");
    }
    const opts: any = { apiKey, timeout: 60000 };
    if (process.env.AI_INTEGRATIONS_OPENAI_BASE_URL) {
      opts.baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
    }
    _client = new OpenAI(opts);
  }
  return _client;
}

// Proxy that defers OpenAI initialization until first use
// This prevents crashes at module load time when API key isn't set
export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    const client = getOpenAIClient();
    return (client as any)[prop];
  }
});
