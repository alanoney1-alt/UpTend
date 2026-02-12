import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  timeout: 60000,
});

export interface HomeHealthAuditResult {
  // Items UpTend can handle
  uptendServices: Array<{
    service: string; // material_recovery, pressure_washing, gutter_cleaning
    description: string;
    estimatedPrice: number;
    priority: "urgent" | "recommended" | "optional";
    reasoning: string;
  }>;

  // Items requiring referral partners
  referralNeeds: Array<{
    category: string; // landscaping, roofing, hvac, plumbing, electrical, tree_service, pest_control
    issues: string[];
    priority: "urgent" | "recommended" | "optional";
    estimatedCost: number;
    reasoning: string;
  }>;

  // Overall property assessment
  propertyCondition: {
    overall: "excellent" | "good" | "fair" | "poor";
    urgentIssues: string[];
    maintenanceScore: number; // 0-100
    safetyScore: number; // 0-100
  };

  // Detailed findings
  detailedFindings: {
    landscaping?: {
      condition: string;
      issues: string[];
      recommendations: string[];
    };
    roofing?: {
      condition: string;
      issues: string[];
      recommendations: string[];
    };
    hvac?: {
      condition: string;
      issues: string[];
      recommendations: string[];
    };
    plumbing?: {
      condition: string;
      issues: string[];
      recommendations: string[];
    };
    electrical?: {
      condition: string;
      issues: string[];
      recommendations: string[];
    };
    structural?: {
      condition: string;
      issues: string[];
      recommendations: string[];
    };
    pest?: {
      evidence: boolean;
      type?: string[];
      recommendations: string[];
    };
  };

  confidence: number;
  rawResponse: string;
}

/**
 * Analyze video walkthrough for comprehensive home health audit
 */
export async function analyzeHomeHealthAudit(
  videoUrl: string
): Promise<HomeHealthAuditResult> {
  const systemPrompt = `You are an expert home inspector conducting a comprehensive Home Health Audit.
Analyze the provided video walkthrough to identify ALL service needs across multiple categories.

Your analysis should cover:

**UpTend Services (we can handle these):**
1. Junk Removal - Debris, old items, clutter that needs removal
2. Pressure Washing - Driveways, siding, decks, patios that need cleaning
3. Gutter Cleaning - Clogged or overflowing gutters

**Referral Partner Services (outside our scope):**
1. Landscaping - Overgrown plants, dead vegetation, drainage issues, yard maintenance
2. Roofing - Missing shingles, moss growth, visible damage, age concerns
3. HVAC - Old units, inefficiency signs, maintenance needed, air quality
4. Plumbing - Visible leaks, rust, water damage signs, fixtures needing replacement
5. Electrical - Exposed wiring, outdated panels, safety hazards
6. Tree Service - Overgrown branches, dead limbs, clearance from structure
7. Pest Control - Evidence of termites, rodents, insects
8. Structural - Foundation cracks, settling, wood rot

For each identified issue:
- Assess priority: urgent (safety/damage risk), recommended (maintenance), optional (cosmetic)
- Estimate costs (be conservative)
- Provide clear reasoning

Respond in JSON format with comprehensive findings.`;

  const userPrompt = `Analyze this home walkthrough video and provide a complete Home Health Audit report.

Return JSON with this structure:
{
  "uptendServices": [
    {
      "service": "material_recovery" | "pressure_washing" | "gutter_cleaning",
      "description": "what needs to be done",
      "estimatedPrice": number,
      "priority": "urgent" | "recommended" | "optional",
      "reasoning": "why this is needed"
    }
  ],
  "referralNeeds": [
    {
      "category": "landscaping" | "roofing" | "hvac" | "plumbing" | "electrical" | "tree_service" | "pest_control" | "structural",
      "issues": ["specific issue 1", "specific issue 2"],
      "priority": "urgent" | "recommended" | "optional",
      "estimatedCost": number,
      "reasoning": "explanation of issues and why priority"
    }
  ],
  "propertyCondition": {
    "overall": "excellent" | "good" | "fair" | "poor",
    "urgentIssues": ["list urgent safety or damage issues"],
    "maintenanceScore": number (0-100),
    "safetyScore": number (0-100)
  },
  "detailedFindings": {
    "landscaping": { "condition": "string", "issues": [], "recommendations": [] },
    "roofing": { "condition": "string", "issues": [], "recommendations": [] },
    // ... etc for each category
  },
  "confidence": number (0-1)
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            {
              type: "image_url",
              image_url: { url: videoUrl },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 4000,
    });

    const rawResponse = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(rawResponse);

    return {
      uptendServices: parsed.uptendServices || [],
      referralNeeds: parsed.referralNeeds || [],
      propertyCondition: parsed.propertyCondition || {
        overall: "good",
        urgentIssues: [],
        maintenanceScore: 70,
        safetyScore: 80,
      },
      detailedFindings: parsed.detailedFindings || {},
      confidence: parsed.confidence || 0.7,
      rawResponse,
    };
  } catch (error) {
    console.error("Home Health Audit AI error:", error);
    throw new Error("Failed to analyze home health audit");
  }
}
