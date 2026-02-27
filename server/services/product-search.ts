/**
 * Product Search Service - searches retailers for home products,
 * generates affiliate links, and provides smart recommendations.
 */

import { pool } from "../db";
import { CURATED_PRODUCTS } from "../data/george-app-knowledge.js";

// ─── Curated Product Lookup ──────────────────
// For common home repair items, return exact product recommendations
export function getCuratedProduct(query: string): typeof CURATED_PRODUCTS[string] | null {
 const lower = query.toLowerCase();
 for (const [key, products] of Object.entries(CURATED_PRODUCTS)) {
 const keyWords = key.replace(/_/g, " ");
 if (lower.includes(keyWords) || keyWords.includes(lower.split(" ").slice(0, 2).join(" "))) {
 return products;
 }
 }
 // Check product names too
 for (const [_key, products] of Object.entries(CURATED_PRODUCTS)) {
 for (const p of products) {
 if (lower.includes(p.name.toLowerCase().split(" ").slice(0, 2).join(" "))) {
 return [p];
 }
 }
 }
 return null;
}

// ─── Retailer Configuration ──────────────────
const RETAILERS = [
 { name: "Home Depot", domain: "homedepot.com", affiliatePrefix: "uptend-hd-" },
 { name: "Lowe's", domain: "lowes.com", affiliatePrefix: "uptend-lowes-" },
 { name: "Walmart", domain: "walmart.com", affiliatePrefix: "uptend-wm-" },
 { name: "Amazon", domain: "amazon.com", affiliatePrefix: "uptend-amz-", affiliateTag: "uptend20-20" },
 { name: "Harbor Freight", domain: "harborfreight.com", affiliatePrefix: "uptend-hf-" },
 { name: "Ace Hardware", domain: "acehardware.com", affiliatePrefix: "uptend-ace-" },
] as const;

// ─── Dangerous DIY tasks → recommend a pro ───
const DANGEROUS_TASKS = [
 "electrical work", "electrical panel", "wiring", "circuit breaker",
 "gas line", "gas pipe", "gas leak",
 "roof work", "roof repair", "roofing",
 "garage door spring", "torsion spring",
 "tree removal near power lines", "tree near power",
 "structural modification", "load bearing wall",
 "asbestos", "lead paint",
];

function isDangerousDIY(query: string): string | null {
 const lower = query.toLowerCase();
 for (const task of DANGEROUS_TASKS) {
 if (lower.includes(task)) {
 return task;
 }
 }
 return null;
}

// ─── Google-based product search ─────────────
interface ProductResult {
 retailer: string;
 productName: string;
 price: number | null;
 url: string;
 inStock: boolean;
 affiliateUrl: string;
 rating: number | null;
 reviewCount: number | null;
}

async function searchRetailer(
 query: string,
 retailer: typeof RETAILERS[number]
): Promise<ProductResult[]> {
 try {
 const searchQuery = encodeURIComponent(`site:${retailer.domain} ${query}`);
 const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
 const cx = process.env.GOOGLE_CUSTOM_SEARCH_CX;

 if (apiKey && cx) {
 const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${searchQuery}&num=3`;
 const resp = await fetch(url);
 if (resp.ok) {
 const data = await resp.json();
 return (data.items || []).slice(0, 3).map((item: any) => ({
 retailer: retailer.name,
 productName: item.title?.replace(` - ${retailer.name}`, "").replace(/\s*\|.*$/, "") || query,
 price: extractPrice(item.snippet),
 url: item.link,
 inStock: true,
 affiliateUrl: generateAffiliateUrl(item.link, retailer.name),
 rating: extractRating(item.snippet),
 reviewCount: null,
 }));
 }
 }

 // Fallback: return placeholder search URLs
 return [{
 retailer: retailer.name,
 productName: query,
 price: null,
 url: `https://www.${retailer.domain}/s/${encodeURIComponent(query)}`,
 inStock: true,
 affiliateUrl: generateAffiliateUrl(
 `https://www.${retailer.domain}/s/${encodeURIComponent(query)}`,
 retailer.name
 ),
 rating: null,
 reviewCount: null,
 }];
 } catch {
 return [];
 }
}

function extractPrice(text: string | undefined): number | null {
 if (!text) return null;
 const match = text.match(/\$(\d+(?:\.\d{2})?)/);
 return match ? parseFloat(match[1]) : null;
}

function extractRating(text: string | undefined): number | null {
 if (!text) return null;
 const match = text.match(/(\d(?:\.\d)?)\s*(?:out of 5|stars|)/i);
 return match ? parseFloat(match[1]) : null;
}

// ─── Affiliate URL generation ────────────────
export function generateAffiliateUrl(retailerUrl: string, retailer: string): string {
 const config = RETAILERS.find(r => r.name === retailer);
 if (!config) return retailerUrl;

 try {
 const url = new URL(retailerUrl);

 if (retailer === "Amazon") {
 url.searchParams.set("tag", "uptend20-20");
 } else {
 // Generic affiliate tracking parameter
 url.searchParams.set("utm_source", "uptend");
 url.searchParams.set("utm_medium", "george_assistant");
 url.searchParams.set("utm_campaign", "product_rec");
 url.searchParams.set("affiliate_id", config.affiliatePrefix + "001");
 }

 return url.toString();
 } catch {
 return retailerUrl;
 }
}

// ─── Exported functions ──────────────────────

export async function searchProduct(
 query: string,
 category?: string,
 specifications?: Record<string, any>
): Promise<{ results: ProductResult[]; dangerWarning?: string; curatedRecommendation?: any; accuracy?: string; message?: string }> {
 const dangerFlag = isDangerousDIY(query);

 // Check curated products first for accuracy
 const curated = getCuratedProduct(query);
 if (curated && curated.length > 0) {
 const curatedResults: ProductResult[] = curated.map((p) => ({
 productName: p.name,
 price: null,
 retailer: "Amazon (Recommended)",
 url: `https://www.amazon.com/s?k=${encodeURIComponent(p.amazonSearchQuery)}&tag=uptend20-20`,
 affiliateUrl: `https://www.amazon.com/s?k=${encodeURIComponent(p.amazonSearchQuery)}&tag=uptend20-20`,
 inStock: true,
 rating: null,
 reviewCount: null,
 }));
 // Still search retailers for price comparison, but curated is the primary recommendation
 const allResults: ProductResult[] = [...curatedResults];
 const searches = RETAILERS.filter(r => r.name !== "Amazon").map(r => searchRetailer(query, r));
 const results = await Promise.all(searches);
 for (const r of results) allResults.push(...r);

 return {
 results: allResults,
 curatedRecommendation: curated[0],
 dangerWarning: dangerFlag ? " This involves potentially dangerous work. Consider hiring a pro." : undefined,
 accuracy: "HIGH - matched from curated product database",
 message: ` **George's Pick:** ${curated[0].name} (~${curated[0].typicalPrice})\n${curated[0].notes}\nTop brands: ${curated[0].topBrands.join(", ")}`,
 };
 }

 // Build refined query from specs
 let refinedQuery = query;
 if (specifications) {
 const specParts = Object.entries(specifications)
 .filter(([_, v]) => v)
 .map(([_, v]) => String(v));
 if (specParts.length) refinedQuery = `${query} ${specParts.join(" ")}`;
 }

 const allResults: ProductResult[] = [];
 const searches = RETAILERS.map(r => searchRetailer(refinedQuery, r));
 const results = await Promise.all(searches);
 for (const r of results) allResults.push(...r);

 // Save to DB
 try {
 await pool.query(
 `INSERT INTO product_search_results (customer_id, search_query, results) VALUES ($1, $2, $3)`,
 [null, refinedQuery, JSON.stringify(allResults)]
 );
 } catch {}

 return {
 results: allResults,
 ...(dangerFlag ? {
 dangerWarning: ` "${dangerFlag}" is flagged as dangerous DIY. I found products, but honestly? This one's dangerous to DIY. Let me get you a pro quote - it's worth the safety.`,
 } : {}),
 };
}

export async function getProductRecommendation(
 customerId: string,
 applianceType: string
): Promise<object> {
 // Fetch home profile + appliances
 let homeProfile: any = null;
 let appliances: any[] = [];

 try {
 const hpResult = await pool.query(
 `SELECT * FROM home_profiles WHERE customer_id = $1 LIMIT 1`,
 [customerId]
 );
 homeProfile = hpResult.rows[0] || null;

 const appResult = await pool.query(
 `SELECT * FROM home_appliances WHERE customer_id = $1`,
 [customerId]
 );
 appliances = appResult.rows;
 } catch {}

 // Match appliance
 const matchedAppliance = appliances.find(
 (a: any) =>
 a.appliance_type?.toLowerCase().includes(applianceType.toLowerCase()) ||
 a.name?.toLowerCase().includes(applianceType.toLowerCase())
 );

 // Safety check
 const dangerFlag = isDangerousDIY(applianceType);

 if (matchedAppliance) {
 const specs = typeof matchedAppliance.specifications === "string"
 ? JSON.parse(matchedAppliance.specifications)
 : matchedAppliance.specifications || {};

 const brand = matchedAppliance.brand || specs.brand || "";
 const model = matchedAppliance.model || specs.model || "";

 // Build specific search queries based on appliance type
 let searchQuery = "";
 const lower = applianceType.toLowerCase();

 if (lower.includes("hvac") || lower.includes("air") || lower.includes("filter")) {
 const filterSize = specs.filter_size || specs.filterSize || "20x25x1";
 searchQuery = `${filterSize} air filter HVAC`;
 } else if (lower.includes("water heater")) {
 searchQuery = `${brand} water heater flush kit anode rod`;
 } else if (lower.includes("garage door")) {
 searchQuery = `${brand} ${model} garage door replacement parts`;
 } else if (lower.includes("sprinkler")) {
 searchQuery = `${brand} sprinkler head replacement`;
 } else {
 searchQuery = `${brand} ${model} ${applianceType} replacement parts`;
 }

 const searchResults = await searchProduct(searchQuery, undefined, specs);

 // Save recommendation
 try {
 await pool.query(
 `INSERT INTO product_recommendations (customer_id, product_name, brand, model, category, reason, specifications, priority)
 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
 [
 customerId,
 searchQuery,
 brand,
 model,
 lower.includes("filter") ? "filter" : "supply",
 "maintenance_due",
 JSON.stringify(specs),
 "soon",
 ]
 );
 } catch {}

 return {
 appliance: matchedAppliance,
 searchQuery,
 products: searchResults.results,
 dangerWarning: dangerFlag
 ? ` This involves ${dangerFlag} - dangerous to DIY. Let me get you a pro quote instead.`
 : searchResults.dangerWarning,
 message: dangerFlag
 ? `I found products for your ${brand} ${applianceType}, but honestly? This one's dangerous to DIY. Let me get you a pro quote - it's worth the safety.`
 : `Based on your ${brand} ${model || applianceType}, here are the best options across retailers.`,
 };
 }

 // No matched appliance - generic search
 const searchResults = await searchProduct(applianceType);
 return {
 products: searchResults.results,
 dangerWarning: searchResults.dangerWarning,
 message: `I don't have your specific ${applianceType} details on file yet. Here are general results. Want to add your appliance details so I can find exact matches?`,
 };
}

export async function compareProductPrices(
 productName: string,
 specifications?: Record<string, any>
): Promise<object> {
 const searchResults = await searchProduct(productName, undefined, specifications);

 // Group by retailer, sort by price
 const byRetailer: Record<string, ProductResult[]> = {};
 for (const r of searchResults.results) {
 if (!byRetailer[r.retailer]) byRetailer[r.retailer] = [];
 byRetailer[r.retailer].push(r);
 }

 const cheapest = searchResults.results
 .filter(r => r.price !== null)
 .sort((a, b) => (a.price || 999) - (b.price || 999))[0];

 return {
 product: productName,
 byRetailer,
 cheapest,
 totalResults: searchResults.results.length,
 dangerWarning: searchResults.dangerWarning,
 message: cheapest
 ? ` Best price for "${productName}": $${cheapest.price} at ${cheapest.retailer}. I found ${searchResults.results.length} options across ${Object.keys(byRetailer).length} retailers.`
 : `I found ${searchResults.results.length} results for "${productName}" across ${Object.keys(byRetailer).length} retailers. Prices may vary - check the links for current pricing.`,
 };
}

export async function getSmartRecommendations(customerId: string): Promise<object> {
 // Pull home profile, appliances, maintenance history
 let appliances: any[] = [];
 let maintenanceReminders: any[] = [];

 try {
 const appResult = await pool.query(
 `SELECT * FROM home_appliances WHERE customer_id = $1`,
 [customerId]
 );
 appliances = appResult.rows;

 const remResult = await pool.query(
 `SELECT * FROM maintenance_reminders WHERE customer_id = $1 AND next_due_date <= NOW() + INTERVAL '30 days' ORDER BY next_due_date ASC`,
 [customerId]
 );
 maintenanceReminders = remResult.rows;
 } catch {}

 const recommendations: Array<{
 item: string;
 reason: string;
 priority: string;
 estimatedCost: string;
 category: string;
 }> = [];

 // Check overdue maintenance
 for (const rem of maintenanceReminders) {
 const isOverdue = new Date(rem.next_due_date) <= new Date();
 recommendations.push({
 item: rem.title || rem.reminder_type,
 reason: isOverdue ? "Overdue maintenance" : "Coming up soon",
 priority: isOverdue ? "urgent" : "soon",
 estimatedCost: "$10-50",
 category: "supply",
 });
 }

 // Seasonal recommendations
 const month = new Date().getMonth() + 1;
 if (month >= 6 && month <= 9) {
 recommendations.push(
 { item: "Extra HVAC filters (change monthly in summer)", reason: "Summer = more AC use", priority: "soon", estimatedCost: "$15-30", category: "filter" },
 { item: "Pool chemicals / test kit", reason: "Heavy pool season", priority: "soon", estimatedCost: "$20-40", category: "supply" },
 );
 } else if (month >= 11 || month <= 2) {
 recommendations.push(
 { item: "Pipe insulation foam", reason: "Freeze protection", priority: "urgent", estimatedCost: "$5-15", category: "supply" },
 { item: "Weather stripping for doors", reason: "Energy savings", priority: "soon", estimatedCost: "$10-20", category: "supply" },
 );
 }

 // Save recommendations to DB
 for (const rec of recommendations) {
 try {
 await pool.query(
 `INSERT INTO product_recommendations (customer_id, product_name, category, reason, priority)
 VALUES ($1, $2, $3, $4, $5)`,
 [customerId, rec.item, rec.category, "george_suggestion", rec.priority]
 );
 } catch {}
 }

 return {
 recommendations,
 totalItems: recommendations.length,
 message: recommendations.length > 0
 ? ` I found ${recommendations.length} items you should pick up:\n${recommendations.map((r, i) => `${i + 1}. **${r.item}** - ${r.reason} (${r.priority}, ~${r.estimatedCost})`).join("\n")}`
 : "Your home looks well-stocked! I'll let you know when something comes up.",
 };
}
