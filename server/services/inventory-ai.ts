import OpenAI from "openai";
import { db } from "../db";
import { homeInventory } from "@shared/schema";

let openaiInstance: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      timeout: 60000, // 60 seconds
    });
  }
  return openaiInstance;
}

interface InventoryItem {
  name: string;
  category: string;
  estimated_value: number;
  condition: string;
  description: string;
  brand?: string;
}

export async function parseInventoryFromPhotos(
  photoUrls: string[],
  userId: string,
  consultationId?: string
): Promise<any[]> {
  if (!photoUrls || photoUrls.length === 0) {
    return [];
  }

  const prompt = `Analyze this home walkthrough photo(s). Identify every distinct household item 
(furniture, electronics, appliances, gym equipment, decor) visible.

For each item, provide:
1. name: Specific name (e.g., "Samsung 65-inch TV" or "Leather Sectional Sofa")
2. category: One of "electronics", "furniture", "appliance", "gym", "decor", "tools", "outdoor"
3. estimated_value: Conservative US Dollar resale value as integer
4. condition: One of "new", "like_new", "good", "fair", "poor"
5. description: Brief visual description of the item's state
6. brand: Detected brand name if visible, otherwise null

Return as JSON: { "items": [...] }
Ignore small clutter (books, clothes, small decorative items under $20).`;

  try {
    const imageContent = photoUrls.slice(0, 8).map((url) => ({
      type: "image_url" as const,
      image_url: { url },
    }));

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-5.2",
      messages: [
        {
          role: "system",
          content:
            "You are a professional home insurance adjuster and asset cataloger. Be thorough but conservative with valuations.",
        },
        {
          role: "user",
          content: [{ type: "text", text: prompt }, ...imageContent],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    const inventoryList: InventoryItem[] = parsed.items || [];

    const savedItems = [];
    for (const item of inventoryList) {
      const [saved] = await db
        .insert(homeInventory)
        .values({
          customerId: userId,
          consultationId: consultationId || null,
          itemName: item.name,
          category: item.category,
          estimatedValue: Math.round(item.estimated_value * 100),
          confidenceScore: 85,
          brandDetected: item.brand || null,
          condition: item.condition,
          conditionNotes: item.description,
          resaleStatus: "active",
          generatedAt: new Date().toISOString(),
          verifiedAt: new Date().toISOString(),
        })
        .returning();
      savedItems.push(saved);
    }

    console.log(
      `[INVENTORY-AI] Cataloged ${savedItems.length} items for user ${userId}`
    );
    return savedItems;
  } catch (error) {
    console.error("[INVENTORY-AI] Failed to parse inventory:", error);
    return [];
  }
}
