/**
 * Home Intelligence Service
 * Generates AI-powered maintenance reports from property data
 */
import type { PropertyData } from "./ai/property-scan-service";

export interface MaintenanceItem {
  system: string;
  task: string;
  urgency: "urgent" | "soon" | "routine";
  estimatedCost: string;
  reasoning: string;
  canUpTendHelp: boolean;
  upTendService?: string;
}

export interface HomeIntelligenceReport {
  overallHealthScore: number;
  yearBuilt: number;
  homeAge: number;
  urgentItems: MaintenanceItem[];
  upcomingItems: MaintenanceItem[];
  annualItems: MaintenanceItem[];
  estimatedAnnualMaintenanceCost: number;
  estimatedCurrentOverspend: number;
  roofLifeRemaining: string;
  hvacLifeRemaining: string;
  waterHeaterLifeRemaining: string;
  georgeInsight: string;
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

export async function generateHomeIntelligenceReport(property: PropertyData): Promise<HomeIntelligenceReport> {
  const currentYear = new Date().getFullYear();
  const homeAge = currentYear - (property.yearBuilt || currentYear - 20);

  const prompt = `You are a home maintenance expert analyzing a specific property. Generate a detailed, personalized maintenance intelligence report.

PROPERTY DATA:
- Address: ${property.address}
- Year Built: ${property.yearBuilt || "Unknown"}
- Home Age: ${homeAge} years
- Square Footage: ${property.sqFootage || "Unknown"}
- Bedrooms: ${property.bedrooms} / Bathrooms: ${property.bathrooms}
- Stories: ${property.stories || 1}
- Roof Type: ${property.roofType || "Unknown"}
- Exterior: ${property.exteriorType || "Unknown"}
- Has Pool: ${property.hasPool}
- Has Garage: ${property.hasGarage} (${property.garageSize || "N/A"})
- Lot Size: ${property.lotSizeAcres || "Unknown"} acres
- Property Type: ${property.propertyType || "Single Family"}
- Home Value Estimate: $${property.homeValueEstimate || "Unknown"}
- Data Source: ${property.dataSource}

AVAILABLE UPTEND SERVICES (use these exact names for upTendService field):
Junk Removal, Pressure Washing, Gutter Cleaning, Moving Labor, Handyman, Light Demolition, Garage Cleanout, Home Cleaning, Pool Cleaning, Landscaping, Carpet Cleaning, Painting, AI Home DNA Scan

INSTRUCTIONS:
1. Generate maintenance predictions based on the SPECIFIC property data. Use real reasoning based on home age, climate (assume Florida if address suggests it), materials, and square footage.
2. For roof life remaining, factor in roof type and age. Asphalt shingles last 20-25 years in Florida, tile 40-50, metal 50+.
3. HVAC systems typically last 15-20 years. Water heaters last 8-12 years (tank) or 15-20 (tankless).
4. Be specific in reasoning -- reference the actual year built, actual sq footage, actual features.
5. Health score: 80+ means well-maintained newer home, 60-79 means aging systems need attention, below 60 means multiple urgent issues.
6. George's insight should be warm, direct, "I got you" energy. No "certainly", "absolutely", or "great question." No em dashes. No emojis. Example tone: "Look, your place is solid but that roof is living on borrowed time. The good news? Everything else checks out pretty well. Let's get ahead of the big stuff before it gets expensive."

Return ONLY valid JSON matching this exact structure (no markdown, no code fences):
{
  "overallHealthScore": <number 0-100>,
  "yearBuilt": <number>,
  "homeAge": <number>,
  "urgentItems": [{"system":"...","task":"...","urgency":"urgent","estimatedCost":"$X-Y","reasoning":"...","canUpTendHelp":true/false,"upTendService":"...or omit"}],
  "upcomingItems": [same structure with urgency "soon"],
  "annualItems": [same structure with urgency "routine"],
  "estimatedAnnualMaintenanceCost": <number>,
  "estimatedCurrentOverspend": <number>,
  "roofLifeRemaining": "~X years",
  "hvacLifeRemaining": "~X years",
  "waterHeaterLifeRemaining": "~X years",
  "georgeInsight": "..."
}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";

  // Parse JSON from response (strip any code fences if present)
  const jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  const report: HomeIntelligenceReport = JSON.parse(jsonStr);

  // Ensure required fields
  report.yearBuilt = report.yearBuilt || property.yearBuilt || currentYear - 20;
  report.homeAge = report.homeAge || homeAge;

  return report;
}
