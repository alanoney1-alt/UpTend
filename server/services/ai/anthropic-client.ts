/**
 * Anthropic Claude API Client
 *
 * Handles all Claude AI API interactions including:
 * - Chat completions (conversational AI)
 * - Vision analysis (photo-to-quote, inventory estimation)
 * - Document OCR (receipt scanning)
 * - Content generation (marketing, advisories)
 */

import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

if (!ANTHROPIC_API_KEY) {
  console.warn("⚠️  ANTHROPIC_API_KEY not set. AI features will use mock responses.");
}

export const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY || "",
});

/**
 * Chat completion with Claude
 */
export async function createChatCompletion(options: {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  systemPrompt?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}) {
  const {
    messages,
    systemPrompt,
    model = "claude-sonnet-4-20250514",
    maxTokens = 2048,
    temperature = 0.7,
  } = options;

  if (!ANTHROPIC_API_KEY) {
    // Return mock response when API key not configured
    return {
      role: "assistant" as const,
      content: "Mock AI response: " + messages[messages.length - 1].content,
    };
  }

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    const textContent = response.content.find((block) => block.type === "text");
    return {
      role: "assistant" as const,
      content: textContent && "text" in textContent ? textContent.text : "",
    };
  } catch (error: any) {
    console.error("Claude API error:", error);
    throw new Error(`Claude API error: ${error.message}`);
  }
}

/**
 * Vision analysis with Claude
 */
export async function analyzeImage(options: {
  imageUrl: string;
  prompt: string;
  model?: string;
  maxTokens?: number;
}) {
  const { imageUrl, prompt, model = "claude-sonnet-4-20250514", maxTokens = 2048 } = options;

  if (!ANTHROPIC_API_KEY) {
    // Return mock response
    return {
      analysis: "Mock vision analysis: Detected furniture, boxes, and appliances",
      detectedItems: ["furniture", "boxes", "appliances"],
      estimatedVolume: "2 truck loads",
      confidenceScore: 0.85,
    };
  }

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "url",
                url: imageUrl,
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    });

    const textContent = response.content.find((block) => block.type === "text");
    const analysisText = textContent && "text" in textContent ? textContent.text : "";

    // Parse structured response
    try {
      const parsed = JSON.parse(analysisText);
      return parsed;
    } catch {
      // If not JSON, return as raw text
      return { analysis: analysisText };
    }
  } catch (error: any) {
    console.error("Claude Vision API error:", error);
    throw new Error(`Claude Vision API error: ${error.message}`);
  }
}

/**
 * Document OCR with Claude
 */
export async function extractTextFromDocument(options: {
  imageUrl: string;
  documentType: string;
  model?: string;
}) {
  const { imageUrl, documentType, model = "claude-sonnet-4-20250514" } = options;

  const prompt = `Extract structured data from this ${documentType}. Return JSON with the following fields:
- vendorName: string
- totalAmount: number
- serviceDate: string (YYYY-MM-DD)
- lineItems: array of {description, weight?, amount}
- confidence: number (0-1)

Return ONLY the JSON, no other text.`;

  const result = await analyzeImage({
    imageUrl,
    prompt,
    model,
    maxTokens: 1024,
  });

  return result;
}

/**
 * Content generation with Claude
 */
export async function generateContent(options: {
  contentType: string;
  targetAudience?: string;
  keywords?: string[];
  tone?: string;
  context?: Record<string, any>;
  model?: string;
}) {
  const {
    contentType,
    targetAudience,
    keywords,
    tone = "professional",
    context,
    model = "claude-sonnet-4-20250514",
  } = options;

  const systemPrompt = `You are a professional content writer for UpTend, a home services platform. Generate high-quality ${contentType} content.`;

  const userPrompt = `Generate ${contentType} content with the following parameters:
- Target Audience: ${targetAudience || "general customers"}
- Tone: ${tone}
- Keywords: ${keywords?.join(", ") || "none"}
${context ? `- Context: ${JSON.stringify(context)}` : ""}

Generate compelling, engaging content that drives bookings and builds trust.`;

  const response = await createChatCompletion({
    messages: [{ role: "user", content: userPrompt }],
    systemPrompt,
    model,
    maxTokens: 1024,
    temperature: 0.8,
  });

  return {
    generatedContent: response.content,
    contentType,
    tone,
  };
}

export default {
  createChatCompletion,
  analyzeImage,
  extractTextFromDocument,
  generateContent,
};
