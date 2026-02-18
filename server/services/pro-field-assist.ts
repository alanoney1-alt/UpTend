/**
 * Pro Field Assistant Service
 *
 * On-site assistance for 1099 independent contractor pros:
 * part identification from photos, replacement part search,
 * technical reference, troubleshooting, supply store finder,
 * tutorials, and crowd-sourced knowledge base.
 */

import { pool } from "../db";
import { analyzeImages } from "./ai/openai-vision-client.js";
import { searchProduct } from "./product-search.js";

// ─── Part Identification from Photo ──────────────────────────────────────────

export async function identifyPartFromPhoto(
  proId: string,
  photo: string,
  description?: string
): Promise<object> {
  const prompt = `You are an expert field technician. Identify the part/component in this photo.
${description ? `The pro describes it as: "${description}"` : ""}

Return JSON:
{
  "identified": true/false,
  "brand": "manufacturer",
  "model": "model number",
  "partNumber": "exact part number if visible",
  "partName": "common name (e.g., faucet cartridge, capacitor, fill valve)",
  "category": "plumbing|electrical|hvac|appliance|roofing|general",
  "compatibleReplacements": [{"partNumber": "...", "brand": "...", "notes": "..."}],
  "whereToBuy": [{"retailer": "Home Depot", "estimatedPrice": "$XX", "notes": "..."}],
  "installationTips": "brief install notes",
  "confidence": 0.0-1.0
}`;

  const aiResult = await analyzeImages({
    imageUrls: [photo],
    prompt,
    systemPrompt: "You are a master tradesperson with 30+ years across plumbing, electrical, HVAC, and general contracting. Identify parts precisely — pros need exact part numbers, not generic descriptions.",
    jsonMode: true,
  });

  // Search retailers for pricing
  let productsFound: any[] = [];
  if (aiResult.partNumber || aiResult.partName) {
    const searchQuery = aiResult.partNumber
      ? `${aiResult.brand || ""} ${aiResult.partNumber}`.trim()
      : `${aiResult.brand || ""} ${aiResult.partName}`.trim();
    try {
      const searchResults = await searchProduct(searchQuery);
      productsFound = searchResults.results || [];
    } catch {}
  }

  // Log the assist
  await logFieldAssist(proId, null, {
    assistType: "part_lookup",
    query: description || "Photo identification",
    photos: [photo],
    aiResponse: aiResult,
    productsFound,
  });

  return { ...aiResult, productsFound };
}

// ─── Find Replacement Part ───────────────────────────────────────────────────

export async function findReplacementPart(
  partDescription: string,
  brand?: string,
  model?: string
): Promise<object> {
  const query = [brand, model, partDescription].filter(Boolean).join(" ");
  const searchResults = await searchProduct(query);

  return {
    query,
    results: searchResults.results,
    dangerWarning: searchResults.dangerWarning,
    message: searchResults.results.length > 0
      ? `Found ${searchResults.results.length} options for "${partDescription}".`
      : `No exact matches for "${partDescription}". Try a different description or part number.`,
  };
}

// ─── Technical Reference ─────────────────────────────────────────────────────

export async function getTechnicalReference(
  category: string,
  issue: string
): Promise<object> {
  // Search knowledge base first
  try {
    const result = await pool.query(
      `SELECT * FROM pro_knowledge_base
       WHERE category = $1
         AND (LOWER(title) LIKE $2 OR LOWER(content) LIKE $2 OR LOWER(subcategory) LIKE $2)
       ORDER BY verified DESC, created_at DESC
       LIMIT 5`,
      [category, `%${issue.toLowerCase()}%`]
    );

    if (result.rows.length > 0) {
      return {
        source: "knowledge_base",
        entries: result.rows.map((r: any) => ({
          title: r.title,
          content: r.content,
          specs: r.specs,
          commonIssues: r.common_issues,
          toolsNeeded: r.tools_needed,
          tips: r.tips,
          verified: r.verified,
        })),
      };
    }
  } catch {}

  // Fallback: search all categories
  try {
    const result = await pool.query(
      `SELECT * FROM pro_knowledge_base
       WHERE LOWER(title) LIKE $1 OR LOWER(content) LIKE $1
       ORDER BY verified DESC, created_at DESC
       LIMIT 5`,
      [`%${issue.toLowerCase()}%`]
    );

    if (result.rows.length > 0) {
      return {
        source: "knowledge_base",
        entries: result.rows.map((r: any) => ({
          title: r.title,
          content: r.content,
          category: r.category,
          specs: r.specs,
          commonIssues: r.common_issues,
          toolsNeeded: r.tools_needed,
          tips: r.tips,
          verified: r.verified,
        })),
      };
    }
  } catch {}

  return {
    source: "none",
    message: `No reference found for "${issue}" in ${category}. Try a different search term or contribute your knowledge!`,
  };
}

// ─── On-Site Troubleshooting ─────────────────────────────────────────────────

export async function troubleshootOnSite(
  proId: string,
  jobId: string | null,
  issueDescription: string,
  photo?: string
): Promise<object> {
  const prompt = `You are a senior field technician helping a pro troubleshoot on-site.

Issue: "${issueDescription}"

Return JSON:
{
  "possibleCauses": [{"cause": "...", "likelihood": "high|medium|low", "explanation": "..."}],
  "diagnosticSteps": [{"step": 1, "action": "...", "whatToLookFor": "...", "tools": ["..."]}],
  "recommendedFix": {"description": "...", "difficulty": "easy|moderate|advanced", "estimatedTime": "X minutes", "partsNeeded": [{"part": "...", "approxCost": "$XX"}]},
  "safetyWarnings": ["..."],
  "whenToEscalate": "conditions when this needs a specialist"
}`;

  let aiResult: any;
  if (photo) {
    aiResult = await analyzeImages({
      imageUrls: [photo],
      prompt,
      systemPrompt: "You are a master troubleshooter. Give practical, actionable diagnostic steps. Safety first — always warn about electrical, gas, or structural hazards.",
      jsonMode: true,
    });
  } else {
    // Text-only troubleshooting via knowledge base + general response
    const kbResults = await getTechnicalReference("general", issueDescription);
    aiResult = {
      possibleCauses: [{ cause: "See knowledge base results", likelihood: "medium", explanation: "Check reference material" }],
      diagnosticSteps: [{ step: 1, action: "Review technical reference", whatToLookFor: "Matching symptoms", tools: [] }],
      knowledgeBase: kbResults,
    };
  }

  await logFieldAssist(proId, jobId, {
    assistType: "troubleshoot",
    query: issueDescription,
    photos: photo ? [photo] : [],
    aiResponse: aiResult,
  });

  return aiResult;
}

// ─── Find Nearest Supply Store ───────────────────────────────────────────────

export async function findNearestSupplyStore(
  zip: string,
  partNeeded?: string
): Promise<object> {
  const stores = [
    { name: "Home Depot", searchUrl: `https://www.homedepot.com/l/search/${zip}` },
    { name: "Lowe's", searchUrl: `https://www.lowes.com/store/${zip}` },
    { name: "Ace Hardware", searchUrl: `https://www.acehardware.com/store-locator?zip=${zip}` },
    { name: "Ferguson Supply", searchUrl: `https://www.ferguson.com/branch-locator?zip=${zip}`, specialty: "plumbing" },
    { name: "Johnstone Supply", searchUrl: `https://www.johnstonesupply.com/storefront/store-locator`, specialty: "hvac" },
    { name: "Graybar", searchUrl: `https://www.graybar.com/locations?zip=${zip}`, specialty: "electrical" },
    { name: "Grainger", searchUrl: `https://www.grainger.com/branch/${zip}`, specialty: "industrial/commercial" },
  ];

  return {
    zip,
    partNeeded: partNeeded || null,
    stores,
    tip: partNeeded
      ? `Call ahead to check stock for "${partNeeded}" before driving over.`
      : "Check retailer apps for real-time stock availability.",
  };
}

// ─── Quick Tutorial ──────────────────────────────────────────────────────────

export async function getQuickTutorial(
  task: string,
  experienceLevel: string = "pro"
): Promise<object> {
  // For pros, search for advanced/specific content
  const searchSuffix = experienceLevel === "pro"
    ? "professional repair fix how to"
    : "DIY tutorial beginner how to";

  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(task + " " + searchSuffix)}`;

  // Check knowledge base for related tips
  let kbTips: any[] = [];
  try {
    const result = await pool.query(
      `SELECT title, tips, tools_needed FROM pro_knowledge_base
       WHERE LOWER(title) LIKE $1 OR LOWER(content) LIKE $1
       ORDER BY verified DESC LIMIT 3`,
      [`%${task.toLowerCase().split(" ").slice(0, 3).join("%")}%`]
    );
    kbTips = result.rows;
  } catch {}

  return {
    task,
    experienceLevel,
    youtubeSearch: youtubeSearchUrl,
    knowledgeBaseTips: kbTips,
    message: experienceLevel === "pro"
      ? `Search focused on professional-level content for "${task}". Skip the beginner stuff.`
      : `Tutorial search for "${task}" at ${experienceLevel} level.`,
  };
}

// ─── Log Field Assist ────────────────────────────────────────────────────────

export async function logFieldAssist(
  proId: string,
  jobId: string | null,
  assistData: {
    assistType: string;
    query: string;
    photos?: string[];
    aiResponse?: any;
    productsFound?: any[];
    tutorialsFound?: any[];
  }
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO pro_field_assists (pro_id, job_id, assist_type, query, photos, ai_response, products_found, tutorials_found)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        proId,
        jobId,
        assistData.assistType,
        assistData.query,
        JSON.stringify(assistData.photos || []),
        JSON.stringify(assistData.aiResponse || {}),
        JSON.stringify(assistData.productsFound || []),
        JSON.stringify(assistData.tutorialsFound || []),
      ]
    );
  } catch (err: any) {
    console.error("[ProFieldAssist] Failed to log assist:", err.message);
  }
}

// ─── Knowledge Base ──────────────────────────────────────────────────────────

export async function getProKnowledgeBase(
  category: string,
  subcategory?: string,
  brand?: string
): Promise<object> {
  try {
    let query = `SELECT * FROM pro_knowledge_base WHERE category = $1`;
    const params: any[] = [category];
    let paramIdx = 2;

    if (subcategory) {
      query += ` AND LOWER(subcategory) LIKE $${paramIdx}`;
      params.push(`%${subcategory.toLowerCase()}%`);
      paramIdx++;
    }
    if (brand) {
      query += ` AND LOWER(brand) LIKE $${paramIdx}`;
      params.push(`%${brand.toLowerCase()}%`);
      paramIdx++;
    }

    query += " ORDER BY verified DESC, created_at DESC LIMIT 20";

    const result = await pool.query(query, params);
    return {
      category,
      subcategory,
      brand,
      entries: result.rows,
      count: result.rows.length,
    };
  } catch (err: any) {
    return { error: err.message, entries: [], count: 0 };
  }
}

export async function contributeToKnowledgeBase(
  proId: string,
  entry: {
    category: string;
    subcategory?: string;
    title: string;
    content: string;
    brand?: string;
    modelPattern?: string;
    specs?: any;
    commonIssues?: any;
    toolsNeeded?: any;
    tips?: string;
  }
): Promise<object> {
  try {
    const result = await pool.query(
      `INSERT INTO pro_knowledge_base (category, subcategory, title, content, brand, model_pattern, specs, common_issues, tools_needed, tips, contributed_by, verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, FALSE)
       RETURNING id`,
      [
        entry.category,
        entry.subcategory || null,
        entry.title,
        entry.content,
        entry.brand || null,
        entry.modelPattern || null,
        JSON.stringify(entry.specs || {}),
        JSON.stringify(entry.commonIssues || []),
        JSON.stringify(entry.toolsNeeded || []),
        entry.tips || null,
        proId,
      ]
    );

    return {
      success: true,
      id: result.rows[0].id,
      message: "Thanks for contributing! Your knowledge will help other pros in the field. It'll be verified over time by the community.",
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── Part Order Logging ──────────────────────────────────────────────────────

export async function logPartOrder(
  proId: string,
  jobId: string | null,
  orderData: {
    partName: string;
    brand?: string;
    model?: string;
    specifications?: string;
    retailer?: string;
    price?: number;
    orderUrl?: string;
  }
): Promise<object> {
  try {
    const result = await pool.query(
      `INSERT INTO pro_parts_orders (pro_id, job_id, part_name, brand, model, specifications, retailer, price, order_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        proId,
        jobId,
        orderData.partName,
        orderData.brand || null,
        orderData.model || null,
        orderData.specifications || null,
        orderData.retailer || null,
        orderData.price || null,
        orderData.orderUrl || null,
      ]
    );

    return {
      success: true,
      orderId: result.rows[0].id,
      message: `Part "${orderData.partName}" logged. Update status when picked up or installed — it'll flow into customer billing.`,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ─── Assist History ──────────────────────────────────────────────────────────

export async function getAssistHistory(proId: string, limit: number = 20): Promise<object> {
  try {
    const result = await pool.query(
      `SELECT * FROM pro_field_assists WHERE pro_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [proId, limit]
    );
    return { assists: result.rows, count: result.rows.length };
  } catch (err: any) {
    return { error: err.message, assists: [], count: 0 };
  }
}
