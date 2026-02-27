/**
 * YouTube Tutorial Service - finds how-to videos from top DIY creators,
 * generates DIY project plans, and suggests seasonal projects.
 * George knows the best creators and searches intelligently.
 */

import { pool } from "../db";

// ─── TOP DIY CREATORS DATABASE ──────────────
// George knows every major DIY/home repair creator and their specialties.
// When searching, we boost results from trusted creators for accuracy.

interface CreatorProfile {
 channel: string;
 channelId?: string;
 specialties: string[];
 style: string; // beginner-friendly, technical, entertaining, etc.
 trustScore: number; // 1-10 - how reliable their advice is
}

const TOP_DIY_CREATORS: CreatorProfile[] = [
 // PLUMBING
 { channel: "Roger Wakefield", specialties: ["plumbing", "drain", "toilet", "water heater", "pipe", "faucet", "sewer", "garbage disposal"], style: "professional plumber, detailed explanations", trustScore: 10 },
 { channel: "Got2Learn", specialties: ["plumbing", "pipe", "solder", "faucet", "valve", "drain", "toilet"], style: "concise pro tips, visual demonstrations", trustScore: 9 },
 { channel: "Apple Drains", specialties: ["drain", "sewer", "french drain", "plumbing", "pipe"], style: "real job footage, drainage expert", trustScore: 9 },
 
 // ELECTRICAL
 { channel: "Electrician U", specialties: ["electrical", "wiring", "outlet", "switch", "circuit", "panel", "GFCI", "breaker", "lighting"], style: "licensed electrician, safety-focused, educational", trustScore: 10 },
 { channel: "How To Home", specialties: ["electrical", "outlet", "switch", "fan", "lighting", "dimmer", "doorbell"], style: "beginner-friendly electrical", trustScore: 8 },
 { channel: "Sparky Channel", specialties: ["electrical", "wiring", "panel", "circuit", "smart home"], style: "professional electrician tutorials", trustScore: 9 },

 // GENERAL HOME REPAIR & DIY
 { channel: "Home Mender", specialties: ["drywall", "paint", "tile", "plumbing", "door", "window", "general repair"], style: "friendly handyman, step-by-step, beginner-focused", trustScore: 9 },
 { channel: "Vancouver Carpenter", specialties: ["carpentry", "door", "trim", "baseboard", "framing", "cabinet", "wood"], style: "master carpenter, precision work", trustScore: 10 },
 { channel: "Home RenoVision DIY", specialties: ["bathroom", "tile", "shower", "flooring", "drywall", "general renovation"], style: "renovation contractor, thorough explanations", trustScore: 9 },
 { channel: "See Jane Drill", specialties: ["general repair", "paint", "caulk", "drywall", "hardware", "hanging", "beginner"], style: "beginner-friendly, simple explanations", trustScore: 8 },
 { channel: "This Old House", specialties: ["general repair", "plumbing", "electrical", "HVAC", "paint", "flooring", "renovation", "exterior"], style: "classic PBS, expert contractors, comprehensive", trustScore: 10 },
 { channel: "The Honest Carpenter", specialties: ["carpentry", "trim", "door", "window", "framing", "baseboard", "crown molding"], style: "professional carpenter, detailed technique", trustScore: 9 },

 // HVAC
 { channel: "HVAC School", specialties: ["HVAC", "AC", "air conditioner", "furnace", "thermostat", "filter", "ductwork", "refrigerant"], style: "HVAC technician training, very technical", trustScore: 10 },
 { channel: "AC Service Tech", specialties: ["AC", "HVAC", "refrigerant", "compressor", "condenser", "thermostat"], style: "professional HVAC tech, diagnostic focused", trustScore: 9 },
 { channel: "Word of Advice TV", specialties: ["HVAC", "AC", "thermostat", "smart thermostat", "filter", "efficiency"], style: "homeowner-friendly HVAC tips", trustScore: 8 },

 // APPLIANCE REPAIR
 { channel: "Bens Appliances and Junk", specialties: ["appliance", "washer", "dryer", "dishwasher", "refrigerator", "oven", "microwave", "ice maker"], style: "appliance repair tech, diagnostic walkthroughs", trustScore: 9 },
 { channel: "AppliancePartsPros", specialties: ["appliance", "washer", "dryer", "dishwasher", "fridge", "oven", "parts replacement"], style: "parts-focused, step-by-step replacements", trustScore: 8 },
 { channel: "PartSelect", specialties: ["appliance", "washer", "dryer", "dishwasher", "refrigerator", "range"], style: "clear part replacement guides", trustScore: 8 },

 // EXTERIOR & LANDSCAPING
 { channel: "LawnCareNut", specialties: ["lawn", "grass", "fertilizer", "weed", "landscaping", "sprinkler", "mowing"], style: "lawn care obsessive, detailed programs", trustScore: 9 },
 { channel: "Ryan Knorr", specialties: ["lawn", "landscaping", "grass", "overseeding", "fertilizer"], style: "lawn transformation specialist", trustScore: 8 },
 { channel: "Everyday Home Repairs", specialties: ["exterior", "siding", "gutter", "deck", "fence", "concrete", "caulk", "weatherproof"], style: "practical homeowner repairs, no-nonsense", trustScore: 9 },

 // FLOORING
 { channel: "Home RenoVision DIY", specialties: ["tile", "flooring", "laminate", "vinyl plank", "hardwood", "grout"], style: "flooring installation expert", trustScore: 9 },
 { channel: "Fix This Build That", specialties: ["woodworking", "furniture", "flooring", "shelving", "cabinet", "build"], style: "maker/builder, polished production", trustScore: 8 },

 // PAINTING
 { channel: "The Idaho Painter", specialties: ["paint", "painting", "interior paint", "exterior paint", "trim", "cabinet painting", "spray"], style: "professional painter, technique-focused", trustScore: 10 },
 { channel: "Home Mender", specialties: ["paint", "drywall repair", "texture matching", "primer", "caulk"], style: "practical painting and patching", trustScore: 9 },

 // SMART HOME
 { channel: "Smart Home Solver", specialties: ["smart home", "smart lock", "Ring", "Nest", "WiFi", "automation", "security camera", "smart thermostat"], style: "smart home integration expert", trustScore: 9 },
 { channel: "Shane Whatley", specialties: ["smart home", "Home Assistant", "automation", "smart lock", "security"], style: "home automation deep dives", trustScore: 8 },

 // AUTO / VEHICLE
 { channel: "ChrisFix", specialties: ["car", "auto", "oil change", "brake", "engine", "tire", "car repair", "diagnostics", "OBD"], style: "most popular auto DIY, excellent visuals, beginner-friendly", trustScore: 10 },
 { channel: "Scotty Kilmer", specialties: ["car", "auto", "engine", "transmission", "diagnostics", "maintenance", "buying"], style: "veteran mechanic, opinion-heavy, entertaining", trustScore: 8 },
 { channel: "South Main Auto", specialties: ["auto", "diagnostics", "engine", "electrical", "OBD", "car repair"], style: "real shop diagnostics, very technical", trustScore: 9 },
 { channel: "Engineering Explained", specialties: ["car", "engine", "transmission", "brake", "suspension", "automotive engineering"], style: "engineering-focused explanations", trustScore: 9 },
 { channel: "1A Auto", specialties: ["car", "auto parts", "brake", "suspension", "engine", "replacement"], style: "step-by-step parts replacement, all makes/models", trustScore: 8 },

 // POOL
 { channel: "Swim University", specialties: ["pool", "pool cleaning", "pool chemistry", "hot tub", "pool pump", "pool filter"], style: "pool care expert, clear explanations", trustScore: 10 },
 { channel: "Pool School Videos", specialties: ["pool", "pool pump", "pool filter", "pool chemistry", "pool equipment"], style: "pool equipment troubleshooting", trustScore: 8 },

 // PRESSURE WASHING
 { channel: "SESW Softwash", specialties: ["pressure washing", "soft wash", "exterior cleaning", "roof cleaning", "concrete cleaning"], style: "professional pressure washer, technique + business", trustScore: 9 },
 { channel: "Obsessed Garage", specialties: ["pressure washing", "detailing", "cleaning", "exterior cleaning"], style: "detail-oriented cleaning and restoration", trustScore: 8 },

 // PAINTING
 { channel: "Painting and Decorating", specialties: ["paint", "painting", "interior paint", "exterior paint", "trim paint", "spray painting"], style: "UK painter, excellent technique demos", trustScore: 8 },
 { channel: "The Funny Carpenter", specialties: ["paint", "cabinet painting", "trim", "carpentry", "finish work"], style: "entertaining painter/carpenter", trustScore: 7 },
 { channel: "Paint Life TV", specialties: ["paint", "painting business", "exterior paint", "interior paint", "spray"], style: "painting contractor business + technique", trustScore: 8 },

 // FLOORING
 { channel: "That Kilted Guy DIY Home Improvement", specialties: ["flooring", "laminate", "vinyl plank", "tile", "hardwood"], style: "flooring specialist, beginner-friendly", trustScore: 8 },
 { channel: "Floor Hacks", specialties: ["flooring", "vinyl plank", "laminate", "tile", "installation"], style: "quick flooring tips and tricks", trustScore: 7 },
 { channel: "Sal DiBlasi", specialties: ["tile", "flooring", "shower", "bathroom tile", "backsplash"], style: "tile installer, detailed technique", trustScore: 9 },

 // ROOFING
 { channel: "Roofing Insights", specialties: ["roof", "roofing", "shingle", "roof repair", "roof leak", "flashing"], style: "roofing contractor education", trustScore: 9 },
 { channel: "Dmitry Lipinskiy", specialties: ["roof", "roofing", "shingle", "metal roof", "roof inspection"], style: "roofing contractor, inspection expert", trustScore: 9 },
 { channel: "West Side Roofing", specialties: ["roof", "roofing", "shingle replacement", "roof repair"], style: "hands-on roofing tutorials", trustScore: 8 },

 // PEST CONTROL
 { channel: "Solutions Pest & Lawn", specialties: ["pest", "pest control", "termite", "ant", "roach", "mosquito", "rodent", "spider"], style: "pest control product tutorials", trustScore: 9 },
 { channel: "DoMyOwn", specialties: ["pest", "pest control", "termite", "ant", "weed", "lawn"], style: "DIY pest and lawn care", trustScore: 8 },
 { channel: "Twin Home Experts", specialties: ["pest", "termite", "rodent", "home inspection", "mold"], style: "home inspection + pest identification", trustScore: 8 },

 // LANDSCAPING
 { channel: "This Old House - Landscaping", specialties: ["landscaping", "garden", "patio", "retaining wall", "drainage"], style: "professional landscaping projects", trustScore: 9 },
 { channel: "Bricks and Stones", specialties: ["landscaping", "paver", "retaining wall", "patio", "hardscape"], style: "hardscape installation expert", trustScore: 8 },
 { channel: "Lawn Tips", specialties: ["lawn", "grass", "fertilizer", "sprinkler", "weed control"], style: "quick lawn care tips", trustScore: 7 },
 { channel: "How To with Doc", specialties: ["landscaping", "lawn", "irrigation", "sprinkler", "drainage"], style: "irrigation and drainage specialist", trustScore: 8 },

 // SMART HOME & SECURITY
 { channel: "The Hook Up", specialties: ["smart home", "home assistant", "automation", "zigbee", "matter", "smart switch"], style: "smart home deep dives, technical", trustScore: 9 },
 { channel: "Paul Hibbert", specialties: ["smart home", "automation", "google home", "alexa", "smart speaker"], style: "accessible smart home tutorials", trustScore: 8 },
 { channel: "Ring", specialties: ["security", "doorbell", "camera", "ring", "home security"], style: "official Ring tutorials", trustScore: 7 },
 { channel: "The DIY Security Guy", specialties: ["security", "camera", "alarm", "smart lock", "home security"], style: "DIY security system installation", trustScore: 8 },

 // CLEANING & ORGANIZATION
 { channel: "Clean My Space", specialties: ["cleaning", "home cleaning", "organization", "deep clean", "kitchen clean", "bathroom clean"], style: "cleaning expert, technique-focused", trustScore: 9 },
 { channel: "GoCleanCo", specialties: ["cleaning", "deep clean", "home cleaning", "stain removal", "disinfecting"], style: "professional cleaning techniques", trustScore: 8 },
 { channel: "The Organized Home", specialties: ["organization", "closet", "garage organization", "pantry", "declutter"], style: "home organization expert", trustScore: 8 },
 { channel: "Clutterbug", specialties: ["organization", "declutter", "storage", "closet", "garage", "pantry"], style: "fun organizing personality", trustScore: 7 },
 { channel: "Alejandra.tv", specialties: ["organization", "home organization", "closet", "kitchen organization", "bathroom organization"], style: "detailed organizing systems", trustScore: 8 },

 // CONCRETE & MASONRY
 { channel: "Mike Day Concrete", specialties: ["concrete", "driveway", "slab", "patio", "foundation"], style: "concrete contractor, professional techniques", trustScore: 9 },
 { channel: "Kirk Giordano Plastering", specialties: ["stucco", "plaster", "masonry", "concrete repair"], style: "veteran plasterer/mason", trustScore: 8 },

 // GARAGE & STORAGE
 { channel: "Garage Transformation", specialties: ["garage", "garage door", "garage organization", "epoxy floor", "storage"], style: "garage makeover specialist", trustScore: 8 },

 // INSULATION & ENERGY
 { channel: "Build Show Network", specialties: ["insulation", "energy efficiency", "building science", "moisture", "ventilation"], style: "building science education", trustScore: 9 },
 { channel: "Matt Risinger", specialties: ["building science", "insulation", "moisture", "construction", "energy efficiency", "windows"], style: "builder, building science advocate", trustScore: 10 },
];

// Map task keywords to optimal search queries for precision
const SEARCH_REFINEMENTS: Record<string, string[]> = {
 "running toilet": ["how to fix a running toilet", "toilet flapper replacement", "toilet fill valve repair"],
 "leaky faucet": ["how to fix a leaky faucet", "faucet cartridge replacement", "kitchen faucet dripping"],
 "clogged drain": ["how to unclog a drain without chemicals", "snake a drain DIY", "slow drain fix"],
 "garbage disposal": ["garbage disposal not working reset", "garbage disposal jammed fix", "replace garbage disposal"],
 "drywall hole": ["how to patch drywall hole", "drywall repair for beginners", "fix hole in wall"],
 "squeaky door": ["fix squeaky door hinge", "door hinge lubrication", "squeaky hinge WD40 alternative"],
 "ceiling fan": ["install ceiling fan", "ceiling fan wobble fix", "ceiling fan direction switch"],
 "thermostat": ["replace thermostat DIY", "smart thermostat installation", "thermostat wiring guide"],
 "water heater": ["water heater not heating", "flush water heater DIY", "water heater pilot light"],
 "gutter": ["clean gutters safely", "gutter guard installation", "downspout clogged fix"],
 "pressure wash": ["pressure washing driveway technique", "pressure washer PSI settings", "how to pressure wash house"],
 "paint": ["how to paint a room like a pro", "interior painting tips", "cutting in paint technique"],
 "tile grout": ["regrout tile shower", "grout repair bathroom", "how to regrout tile"],
 "ac filter": ["change AC filter", "HVAC filter replacement", "air filter size guide"],
 "oil change": ["how to change oil yourself", "oil change for beginners", "what oil does my car need"],
 "brake pads": ["how to change brake pads", "brake pad replacement DIY", "front brake job"],
};

// ─── YouTube search (enhanced) ───────────────
interface TutorialResult {
 videoId: string;
 title: string;
 channel: string;
 duration: string;
 thumbnail: string;
 viewCount: number | null;
 url: string;
 isTrustedCreator: boolean;
 creatorTrustScore: number;
}

function findRelevantCreators(taskDescription: string): CreatorProfile[] {
 const lower = taskDescription.toLowerCase();
 return TOP_DIY_CREATORS.filter((c) =>
 c.specialties.some((s) => lower.includes(s) || s.includes(lower.split(" ")[0]))
 ).sort((a, b) => b.trustScore - a.trustScore);
}

function buildSmartQueries(taskDescription: string): string[] {
 const lower = taskDescription.toLowerCase();
 
 // Check for refined search terms
 for (const [key, queries] of Object.entries(SEARCH_REFINEMENTS)) {
 if (lower.includes(key)) return queries;
 }

 // Find top creators for this topic
 const creators = findRelevantCreators(taskDescription);
 const topCreator = creators[0];

 const queries: string[] = [];
 
 // Creator-specific search (most accurate)
 if (topCreator) {
 queries.push(`${topCreator.channel} ${taskDescription}`);
 }
 
 // General searches with different angles
 queries.push(`how to ${taskDescription} step by step`);
 queries.push(`${taskDescription} DIY fix for beginners`);
 
 // Brand/model specific if mentioned
 if (lower.match(/\b(ge|samsung|lg|whirlpool|maytag|frigidaire|kenmore|bosch|kitchenaid|kohler|moen|delta)\b/)) {
 queries.push(`${taskDescription} repair`);
 }

 return queries.slice(0, 3);
}

async function searchYouTube(query: string, maxResults = 5): Promise<TutorialResult[]> {
 const apiKey = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;

 if (apiKey) {
 try {
 const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&key=${apiKey}&relevanceLanguage=en&videoDuration=medium`;
 const resp = await fetch(searchUrl);
 if (resp.ok) {
 const data = await resp.json();
 const videoIds = (data.items || []).map((i: any) => i.id?.videoId).filter(Boolean);

 // Get durations and view counts
 let stats: Record<string, { duration: string; viewCount: number }> = {};
 if (videoIds.length) {
 const detailUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds.join(",")}&key=${apiKey}`;
 const detailResp = await fetch(detailUrl);
 if (detailResp.ok) {
 const detailData = await detailResp.json();
 for (const item of detailData.items || []) {
 stats[item.id] = {
 duration: parseDuration(item.contentDetails?.duration || ""),
 viewCount: parseInt(item.statistics?.viewCount || "0"),
 };
 }
 }
 }

 return (data.items || []).slice(0, maxResults).map((item: any) => {
 const videoId = item.id?.videoId || "";
 const channelTitle = item.snippet?.channelTitle || "";
 const trusted = TOP_DIY_CREATORS.find(
 (c) => channelTitle.toLowerCase().includes(c.channel.toLowerCase()) ||
 c.channel.toLowerCase().includes(channelTitle.toLowerCase())
 );
 return {
 videoId,
 title: item.snippet?.title || query,
 channel: channelTitle,
 duration: stats[videoId]?.duration || "",
 thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "",
 viewCount: stats[videoId]?.viewCount || null,
 url: `https://www.youtube.com/watch?v=${videoId}`,
 isTrustedCreator: !!trusted,
 creatorTrustScore: trusted?.trustScore || 5,
 };
 });
 }
 } catch {}
 }

 // Fallback: return YouTube search URL
 const fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
 return [{
 videoId: "",
 title: query,
 channel: "YouTube Search",
 duration: "",
 thumbnail: "",
 viewCount: null,
 url: fallbackUrl,
 isTrustedCreator: false,
 creatorTrustScore: 0,
 }];
}

// Rank results: trusted creators first, then by views
function rankResults(results: TutorialResult[]): TutorialResult[] {
 return [...results].sort((a, b) => {
 // Trusted creators always rank higher
 if (a.isTrustedCreator && !b.isTrustedCreator) return -1;
 if (!a.isTrustedCreator && b.isTrustedCreator) return 1;
 // Among trusted, sort by trust score
 if (a.isTrustedCreator && b.isTrustedCreator) return b.creatorTrustScore - a.creatorTrustScore;
 // Among untrusted, sort by views
 return (b.viewCount || 0) - (a.viewCount || 0);
 });
}

/** Fetch video metadata via YouTube oEmbed (no API key needed) */
export async function getVideoMetadata(videoUrl: string): Promise<{
 title: string;
 videoId: string;
 thumbnailUrl: string;
 duration: string;
} | null> {
 // Extract video ID
 const idMatch = videoUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
 const videoId = idMatch?.[1];
 if (!videoId) return null;

 try {
 const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`;
 const resp = await fetch(oembedUrl);
 if (!resp.ok) return null;
 const data = await resp.json();
 return {
 title: data.title || "",
 videoId,
 thumbnailUrl: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
 duration: "", // oEmbed doesn't provide duration; would need Data API for that
 };
 } catch {
 return {
 title: "",
 videoId,
 thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
 duration: "",
 };
 }
}

function parseDuration(iso: string): string {
 const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
 if (!match) return "";
 const h = match[1] ? `${match[1]}:` : "";
 const m = match[2] || "0";
 const s = (match[3] || "0").padStart(2, "0");
 return `${h}${m}:${s}`;
}

// ─── Difficulty estimation ───────────────────
const DIFFICULTY_MAP: Record<string, string> = {
 filter_change: "easy",
 smoke_detector: "easy",
 caulking: "easy",
 weather_strip: "easy",
 drain_unclog: "easy",
 paint_touch_up: "easy",
 sprinkler_adjust: "medium",
 garbage_disposal: "medium",
 toilet_repair: "medium",
 gutter_clean: "medium",
 pressure_wash: "medium",
 water_heater_flush: "medium",
};

// ─── Dangerous DIY flags ─────────────────────
const DANGEROUS_TASKS = [
 "electrical", "wiring", "circuit", "gas line", "gas pipe",
 "roof repair", "roofing", "garage door spring", "torsion spring",
 "tree removal", "structural", "load bearing", "asbestos", "lead paint",
];

function getDangerWarning(task: string): string | null {
 const lower = task.toLowerCase();
 for (const d of DANGEROUS_TASKS) {
 if (lower.includes(d)) {
 return ` I found a tutorial, but honestly? This one's dangerous to DIY. Let me get you a pro quote - it's worth the safety.`;
 }
 }
 return null;
}

// ─── Exported functions ──────────────────────

export async function findTutorial(
 taskDescription: string,
 difficulty?: string,
 skipVideoIds?: string[] // For "next video" - skip previously shown
): Promise<object> {
 const dangerWarning = getDangerWarning(taskDescription);

 // Smart query building - uses creator knowledge + refined searches
 const queries = buildSmartQueries(taskDescription);
 const relevantCreators = findRelevantCreators(taskDescription);

 // Search with multiple queries for better coverage, get more results for "next" functionality
 const allResults: TutorialResult[] = [];
 const seenIds = new Set<string>(skipVideoIds || []);

 for (const query of queries) {
 const results = await searchYouTube(query, 5);
 for (const r of results) {
 if (r.videoId && !seenIds.has(r.videoId)) {
 seenIds.add(r.videoId);
 allResults.push(r);
 }
 }
 }

 // Rank: trusted creators first, then by views
 const ranked = rankResults(allResults);

 // Top pick + alternatives for "next video" navigation
 const topPick = ranked[0];
 const alternatives = ranked.slice(1);

 // Save to DB
 for (const v of ranked.slice(0, 5)) {
 if (v.videoId) {
 try {
 await pool.query(
 `INSERT INTO tutorial_recommendations (customer_id, task_type, youtube_video_id, youtube_title, youtube_channel, youtube_duration, youtube_thumbnail, difficulty)
 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
 [null, taskDescription, v.videoId, v.title, v.channel, v.duration, v.thumbnail, difficulty || "medium"]
 );
 } catch {}
 }
 }

 // Build structured video data for in-app player
 const structuredVideos = ranked.filter(v => v.videoId).map(v => ({
 title: v.title,
 videoId: v.videoId,
 thumbnailUrl: v.thumbnail || `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`,
 duration: v.duration,
 channel: v.channel,
 url: v.url,
 isTrustedCreator: v.isTrustedCreator,
 trustScore: v.creatorTrustScore,
 }));

 // Creator context for George to explain WHY this video
 const creatorContext = topPick?.isTrustedCreator
 ? `This video is from ${topPick.channel}, one of the most trusted ${relevantCreators[0]?.specialties[0] || "DIY"} channels on YouTube.`
 : topPick?.channel
 ? `This video is from ${topPick.channel}${topPick.viewCount ? ` (${(topPick.viewCount / 1000).toFixed(0)}K views)` : ""}.`
 : "";

 // George's walkthrough digest - key info George can use to coach the customer
 const georgeDigest = {
 task: taskDescription,
 topVideo: topPick ? { title: topPick.title, channel: topPick.channel, trusted: topPick.isTrustedCreator } : null,
 totalAlternatives: alternatives.length,
 relevantCreators: relevantCreators.slice(0, 3).map(c => ({ channel: c.channel, style: c.style, trust: c.trustScore })),
 canShowNext: alternatives.length > 0,
 skipVideoIds: ranked.map(r => r.videoId).filter(Boolean), // pass to next call for pagination
 };

 return {
 task: taskDescription,
 difficulty: difficulty || "medium",
 videos: ranked.slice(0, 5),
 structuredVideos,
 topPick: structuredVideos[0] || null,
 alternatives: structuredVideos.slice(1),
 georgeDigest,
 dangerWarning,
 creatorContext,
 message: dangerWarning
 ? `${dangerWarning}\n\nBut here are tutorials if you want to learn more:\n${ranked.slice(0, 3).map((v, i) => `${i + 1}. ${v.title} (${v.channel}) - ${v.url}`).join("\n")}`
 : topPick?.videoId
 ? ` **Best match:** "${topPick.title}" by **${topPick.channel}**${topPick.isTrustedCreator ? " " : ""}${topPick.duration ? ` (${topPick.duration})` : ""}\n${creatorContext}\n\n${alternatives.length > 0 ? `Don't like this one? I have ${alternatives.length} more options - just say "next video" ` : ""}`
 : ` Top tutorials for "${taskDescription}":\n${ranked.slice(0, 3).map((v, i) => `${i + 1}. **${v.title}** by ${v.channel}${v.duration ? ` (${v.duration})` : ""}\n ${v.url}`).join("\n")}`,
 };
}

/** Get next video when customer wants a different one */
export async function getNextTutorial(
 taskDescription: string,
 skipVideoIds: string[],
 difficulty?: string
): Promise<object> {
 return findTutorial(taskDescription, difficulty, skipVideoIds);
}

export async function getTutorialForMaintenance(
 maintenanceType: string,
 applianceDetails?: { brand?: string; model?: string; size?: string }
): Promise<object> {
 // Build specific query
 let query = `${maintenanceType.replace(/_/g, " ")}`;
 if (applianceDetails) {
 if (applianceDetails.brand) query += ` ${applianceDetails.brand}`;
 if (applianceDetails.model) query += ` ${applianceDetails.model}`;
 if (applianceDetails.size) query += ` ${applianceDetails.size}`;
 }

 const difficulty = DIFFICULTY_MAP[maintenanceType] || "medium";
 return findTutorial(query, difficulty);
}

export async function getDIYProjectPlan(projectDescription: string): Promise<object> {
 const dangerWarning = getDangerWarning(projectDescription);

 // Find tutorials
 const tutorials = await searchYouTube(`DIY ${projectDescription} complete guide`);

 // AI-generated plan structure (template-based for reliability)
 const plan = generateProjectTemplate(projectDescription);

 return {
 project: projectDescription,
 ...plan,
 tutorials,
 dangerWarning,
 message: dangerWarning
 ? `${dangerWarning}\n\nProject plan for "${projectDescription}":\n${plan.steps.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}`
 : ` DIY Project Plan: "${projectDescription}"\n\n**Difficulty:** ${plan.difficulty}\n**Est. Time:** ${plan.estimatedTime}\n**Est. Cost:** $${plan.estimatedCost}\n\n**Steps:**\n${plan.steps.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}\n\n**Tools Needed:** ${plan.toolsNeeded.join(", ")}\n\n**Products to Buy:**\n${plan.productsToBuy.map((p: any) => `• ${p.name} (~$${p.estimatedCost})`).join("\n")}\n\n **Tutorials:**\n${tutorials.map((v, i) => `${i + 1}. ${v.title} - ${v.url}`).join("\n")}${plan.safetyWarnings.length ? `\n\n **Safety:** ${plan.safetyWarnings.join("; ")}` : ""}`,
 };
}

function generateProjectTemplate(description: string): {
 difficulty: string;
 estimatedTime: string;
 estimatedCost: number;
 steps: string[];
 toolsNeeded: string[];
 productsToBuy: Array<{ name: string; estimatedCost: number }>;
 safetyWarnings: string[];
} {
 const lower = description.toLowerCase();

 if (lower.includes("paint") || lower.includes("repaint")) {
 return {
 difficulty: "medium",
 estimatedTime: "4-8 hours",
 estimatedCost: 80,
 steps: [
 "Remove furniture and cover floors with drop cloths",
 "Clean walls and patch any holes with spackle",
 "Sand patched areas smooth once dry",
 "Apply painter's tape to trim, ceiling edges, and fixtures",
 "Apply primer (especially over dark colors or patches)",
 "Apply first coat of paint with roller, cut in edges with brush",
 "Wait 2-4 hours, apply second coat",
 "Remove tape while paint is slightly tacky",
 "Clean up and move furniture back",
 ],
 toolsNeeded: ["paint roller + tray", "angled brush (2.5\")", "painter's tape", "drop cloths", "sandpaper (120 grit)", "putty knife"],
 productsToBuy: [
 { name: "Paint (1 gallon per 350 sq ft)", estimatedCost: 35 },
 { name: "Primer (1 gallon)", estimatedCost: 20 },
 { name: "Painter's tape (2 rolls)", estimatedCost: 10 },
 { name: "Drop cloths", estimatedCost: 8 },
 { name: "Spackle + putty knife", estimatedCost: 7 },
 ],
 safetyWarnings: ["Ensure good ventilation", "Check for lead paint if home built before 1978"],
 };
 }

 if (lower.includes("flush") && lower.includes("water heater")) {
 return {
 difficulty: "medium",
 estimatedTime: "1-2 hours",
 estimatedCost: 30,
 steps: [
 "Turn off water heater (gas: pilot, electric: breaker)",
 "Turn off cold water supply valve",
 "Attach garden hose to drain valve at bottom",
 "Run hose to floor drain or outside",
 "Open a hot water faucet upstairs to break vacuum",
 "Open drain valve and let water flow until clear",
 "Close drain valve, remove hose",
 "Turn cold water back on, let tank fill",
 "Turn water heater back on once full",
 ],
 toolsNeeded: ["garden hose", "bucket", "pliers (if valve is stiff)"],
 productsToBuy: [
 { name: "Water heater flush kit", estimatedCost: 15 },
 { name: "Replacement anode rod (check yours)", estimatedCost: 15 },
 ],
 safetyWarnings: ["Water will be very hot - use caution", "Never turn on heater with empty tank"],
 };
 }

 // Generic template
 return {
 difficulty: "medium",
 estimatedTime: "2-4 hours",
 estimatedCost: 50,
 steps: [
 "Research and gather materials",
 "Prepare the work area",
 "Follow manufacturer instructions or tutorial steps",
 "Complete the work",
 "Clean up and test",
 ],
 toolsNeeded: ["basic tool set", "measuring tape", "safety glasses"],
 productsToBuy: [
 { name: "Project-specific materials", estimatedCost: 30 },
 { name: "Safety equipment", estimatedCost: 10 },
 ],
 safetyWarnings: ["Wear appropriate PPE", "If unsure at any step, consult a professional"],
 };
}

export async function getSeasonalDIYProjects(
 month: number,
 homeProfile?: any
): Promise<object> {
 const seasonal: Record<number, Array<{ project: string; difficulty: string; estimatedCost: string; reason: string }>> = {
 1: [
 { project: "Check and replace weather stripping", difficulty: "easy", estimatedCost: "$10-20", reason: "Keep cold air out, save on heating" },
 { project: "Insulate exposed pipes", difficulty: "easy", estimatedCost: "$5-15", reason: "Prevent freeze damage" },
 { project: "Test smoke and CO detectors", difficulty: "easy", estimatedCost: "$0-30", reason: "New year safety check" },
 ],
 2: [
 { project: "Service HVAC before spring", difficulty: "easy", estimatedCost: "$15-30", reason: "Change filters, clean vents" },
 { project: "Check caulking around windows", difficulty: "easy", estimatedCost: "$5-10", reason: "Prep for spring rain" },
 { project: "Organize garage", difficulty: "easy", estimatedCost: "$0-50", reason: "Pre-spring cleaning" },
 ],
 3: [
 { project: "Pressure wash driveway and walkways", difficulty: "medium", estimatedCost: "$0-50", reason: "Spring refresh" },
 { project: "Check sprinkler system", difficulty: "medium", estimatedCost: "$5-20", reason: "Prep for growing season" },
 { project: "Clean gutters", difficulty: "medium", estimatedCost: "$0-20", reason: "Spring rain prep" },
 ],
 4: [
 { project: "Touch up exterior paint", difficulty: "medium", estimatedCost: "$20-60", reason: "Fix winter wear" },
 { project: "Fertilize lawn and garden", difficulty: "easy", estimatedCost: "$15-40", reason: "Growing season kickoff" },
 { project: "Check deck/patio for damage", difficulty: "medium", estimatedCost: "$20-100", reason: "Outdoor living prep" },
 ],
 5: [
 { project: "Service AC before summer", difficulty: "easy", estimatedCost: "$15-30", reason: "Change filter, clean coils" },
 { project: "Check pool equipment", difficulty: "medium", estimatedCost: "$20-50", reason: "Pool season prep" },
 { project: "Install ceiling fans or check blades", difficulty: "easy", estimatedCost: "$0-20", reason: "Energy savings" },
 ],
 6: [
 { project: "Hurricane prep: trim trees", difficulty: "medium", estimatedCost: "$0-50", reason: "Hurricane season started" },
 { project: "Check garage door seals", difficulty: "easy", estimatedCost: "$10-30", reason: "Rain and storm protection" },
 { project: "Clean dryer vent", difficulty: "easy", estimatedCost: "$10-20", reason: "Fire prevention" },
 ],
 7: [
 { project: "Change AC filter (monthly in summer)", difficulty: "easy", estimatedCost: "$10-20", reason: "Heavy AC usage" },
 { project: "Check irrigation system efficiency", difficulty: "medium", estimatedCost: "$5-15", reason: "Water conservation" },
 { project: "Seal grout in bathrooms", difficulty: "easy", estimatedCost: "$10-15", reason: "Humidity protection" },
 ],
 8: [
 { project: "Flush water heater", difficulty: "medium", estimatedCost: "$15-30", reason: "Annual maintenance" },
 { project: "Back-to-school home organization", difficulty: "easy", estimatedCost: "$20-50", reason: "Prep for busy season" },
 { project: "Check for attic insulation gaps", difficulty: "medium", estimatedCost: "$20-80", reason: "Energy efficiency" },
 ],
 9: [
 { project: "Clean and store pool equipment", difficulty: "medium", estimatedCost: "$10-30", reason: "End of pool season" },
 { project: "Check roof for damage", difficulty: "medium", estimatedCost: "$0-20", reason: "Post-hurricane season check" },
 { project: "Test garage door safety features", difficulty: "easy", estimatedCost: "$0", reason: "Safety check" },
 ],
 10: [
 { project: "Prepare outdoor faucets for winter", difficulty: "easy", estimatedCost: "$5-15", reason: "Freeze prep" },
 { project: "Clean chimney/fireplace", difficulty: "hard", estimatedCost: "$20-50", reason: "Fireplace season prep" },
 { project: "Seal driveway cracks", difficulty: "easy", estimatedCost: "$10-25", reason: "Before freeze/thaw" },
 ],
 11: [
 { project: "Winterize sprinkler system", difficulty: "medium", estimatedCost: "$0-30", reason: "Prevent freeze damage" },
 { project: "Check insulation in attic and crawlspace", difficulty: "medium", estimatedCost: "$20-100", reason: "Winter energy savings" },
 { project: "Replace HVAC filter", difficulty: "easy", estimatedCost: "$10-20", reason: "Heating season start" },
 ],
 12: [
 { project: "Test GFCI outlets", difficulty: "easy", estimatedCost: "$0", reason: "Year-end safety check" },
 { project: "Check all door locks and deadbolts", difficulty: "easy", estimatedCost: "$0-30", reason: "Holiday security" },
 { project: "Clean range hood filter", difficulty: "easy", estimatedCost: "$0-15", reason: "Holiday cooking prep" },
 ],
 };

 const projects = seasonal[month] || seasonal[1]!;

 return {
 month,
 monthName: new Date(2024, month - 1, 1).toLocaleString("en-US", { month: "long" }),
 projects,
 message: ` **${new Date(2024, month - 1, 1).toLocaleString("en-US", { month: "long" })} DIY Projects:**\n${projects.map((p, i) => `${i + 1}. **${p.project}** (${p.difficulty}) - ~${p.estimatedCost}\n _${p.reason}_`).join("\n")}`,
 };
}

// ─── Emergency Tutorial Finder ───────────────
const EMERGENCY_QUERIES: Record<string, string[]> = {
 water: ["how to shut off water main emergency", "water shutoff valve location home", "stop water leak emergency"],
 gas: ["gas leak what to do emergency", "how to turn off gas valve home", "gas shutoff valve location"],
 electrical: ["how to turn off main breaker emergency", "electrical panel shutoff guide", "electrical fire what to do"],
 hvac: ["AC emergency shutoff", "how to turn off HVAC system", "furnace emergency shutoff"],
 flood: ["house flooding what to do", "water damage emergency steps", "how to stop flooding in house"],
 pipe_burst: ["burst pipe emergency fix", "how to fix burst pipe temporary", "pipe burst what to do first"],
 roof_damage: ["emergency roof tarp how to", "temporary roof repair storm damage", "tarp a damaged roof DIY"],
 tree_fell: ["tree fell on house what to do", "storm tree damage emergency", "tree on power line what to do"],
};

export async function findEmergencyTutorial(emergencyType: string): Promise<object> {
 const queries = EMERGENCY_QUERIES[emergencyType.toLowerCase()] || [`${emergencyType} emergency what to do`, `${emergencyType} shutoff how to`];

 const allResults: TutorialResult[] = [];
 const seenIds = new Set<string>();

 for (const query of queries.slice(0, 2)) {
 const results = await searchYouTube(query, 3);
 for (const r of results) {
 if (r.videoId && !seenIds.has(r.videoId)) {
 seenIds.add(r.videoId);
 allResults.push(r);
 }
 }
 }

 const ranked = rankResults(allResults);

 return {
 emergencyType,
 videos: ranked.slice(0, 3).map(v => ({
 title: v.title,
 channel: v.channel,
 url: v.url,
 videoId: v.videoId,
 thumbnail: v.thumbnail,
 isTrustedCreator: v.isTrustedCreator,
 })),
 warning: " Watch these for reference ONLY after ensuring safety. If in immediate danger, call 911 first.",
 message: ranked.length > 0
 ? ` **Emergency tutorials for ${emergencyType}:**\n${ranked.slice(0, 3).map((v, i) => `${i + 1}. ${v.title} - ${v.url}`).join("\n")}\n\n Safety first - only watch after securing the area.`
 : `No emergency tutorials found. Call UpTend Emergency: (407) 338-3342`,
 };
}
