/**
 * AI Load Analysis Route
 * 
 * POST /api/ai/analyze-load
 * Accepts uploaded photos, analyzes them for junk removal / moving load estimation.
 * Falls back to Claude vision when OpenAI is unavailable.
 */

import { Router, Request, Response } from "express";
import multer from "multer";
import Anthropic from "@anthropic-ai/sdk";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req: any, file: any, cb: any) => {
    cb(null, file.mimetype.startsWith("image/"));
  },
});

const router = Router();

router.post("/analyze-load", upload.any(), async (req: Request, res: Response) => {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) {
      return res.status(400).json({ error: "No images provided" });
    }

    const serviceType = req.body.serviceType || "junk_removal";

    // Convert images to base64 for Claude vision
    const imageContents: any[] = files.slice(0, 5).map((file) => ({
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: file.mimetype as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
        data: file.buffer.toString("base64"),
      },
    }));

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      // No API key - return smart fallback
      return res.json({
        identifiedItems: ["Items detected from photos"],
        suggestedPrice: 149,
        confidence: "low",
        note: "AI analysis unavailable. Using standard estimate.",
      });
    }

    const client = new Anthropic({ apiKey: anthropicKey });

    const prompt = serviceType === "junk_removal"
      ? `You are analyzing photos for a junk removal / hauling quote. Look at each photo carefully.

1. List every item you can identify (furniture, appliances, debris, etc.)
2. Estimate the total load size (fraction of a truck: 1/4, 1/2, 3/4, full)
3. Suggest a fair price based on Orlando FL market rates:
   - 1/4 truck: $99-149
   - 1/2 truck: $149-249
   - 3/4 truck: $249-349
   - Full truck: $349-499
   - Multiple loads: $499+

If the photos do NOT show items for hauling/removal (e.g. random objects, selfies, non-home items), respond with:
{"identifiedItems": [], "notHomeRelated": true, "whatYouSee": "description of what's actually in the photo"}

Otherwise respond with JSON:
{"identifiedItems": ["item1", "item2"], "loadSize": "1/2 truck", "suggestedPrice": 199, "confidence": "high"}`
      : `You are analyzing photos for a ${serviceType.replace(/_/g, " ")} service quote in Orlando FL.

Identify what you see. If it's relevant to the service, estimate a fair price.
If the photos are NOT related to home services, respond with:
{"identifiedItems": [], "notHomeRelated": true, "whatYouSee": "description of what's actually in the photo"}

Otherwise respond with JSON:
{"identifiedItems": ["item1", "item2"], "suggestedPrice": 149, "confidence": "medium"}`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            ...imageContents,
            { type: "text" as const, text: prompt },
          ],
        },
      ],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);

      // If not home-related, return a special response the frontend can use
      if (result.notHomeRelated) {
        return res.status(422).json({
          error: "not_home_related",
          whatYouSee: result.whatYouSee || "something unrelated to home services",
          message: `I see ${result.whatYouSee || "something"}, but I need photos of items you want hauled or the area that needs work.`,
        });
      }

      return res.json({
        identifiedItems: result.identifiedItems || [],
        loadSize: result.loadSize,
        suggestedPrice: result.suggestedPrice || 149,
        confidence: result.confidence || "medium",
      });
    }

    // Couldn't parse - return fallback
    return res.json({
      identifiedItems: ["Items detected from photos"],
      suggestedPrice: 149,
      confidence: "low",
    });
  } catch (error: any) {
    console.error("Analyze load error:", error?.message || error);
    return res.status(500).json({ error: "Analysis failed. Please try again." });
  }
});

export default router;
