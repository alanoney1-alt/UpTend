/**
 * YouTube Tutorial Service — finds how-to videos, generates DIY project plans,
 * and suggests seasonal projects.
 */

import { pool } from "../db";

// ─── YouTube search ──────────────────────────
interface TutorialResult {
  videoId: string;
  title: string;
  channel: string;
  duration: string;
  thumbnail: string;
  viewCount: number | null;
  url: string;
}

async function searchYouTube(query: string, maxResults = 3): Promise<TutorialResult[]> {
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
          return {
            videoId,
            title: item.snippet?.title || query,
            channel: item.snippet?.channelTitle || "",
            duration: stats[videoId]?.duration || "",
            thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "",
            viewCount: stats[videoId]?.viewCount || null,
            url: `https://www.youtube.com/watch?v=${videoId}`,
          };
        });
      }
    } catch {}
  }

  // Fallback: return YouTube search URL
  return [{
    videoId: "",
    title: query,
    channel: "YouTube Search",
    duration: "",
    thumbnail: "",
    viewCount: null,
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
  }];
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
      return `⚠️ I found a tutorial, but honestly? This one's dangerous to DIY. Let me get you a pro quote — it's worth the safety.`;
    }
  }
  return null;
}

// ─── Exported functions ──────────────────────

export async function findTutorial(
  taskDescription: string,
  difficulty?: string
): Promise<object> {
  const dangerWarning = getDangerWarning(taskDescription);

  const queries = [
    `how to ${taskDescription} DIY`,
    `${taskDescription} tutorial step by step`,
    `DIY ${taskDescription} for beginners`,
  ];

  // Use first query for search
  const videos = await searchYouTube(queries[0]);

  // Save to DB
  for (const v of videos) {
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

  return {
    task: taskDescription,
    difficulty: difficulty || "medium",
    videos,
    dangerWarning,
    message: dangerWarning
      ? `${dangerWarning}\n\nBut here are tutorials if you want to learn more:\n${videos.map((v, i) => `${i + 1}. 🎥 ${v.title} (${v.channel}) — ${v.url}`).join("\n")}`
      : `🎥 Top tutorials for "${taskDescription}":\n${videos.map((v, i) => `${i + 1}. **${v.title}** by ${v.channel}${v.duration ? ` (${v.duration})` : ""}\n   ${v.url}`).join("\n")}`,
  };
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
      : `🔨 DIY Project Plan: "${projectDescription}"\n\n**Difficulty:** ${plan.difficulty}\n**Est. Time:** ${plan.estimatedTime}\n**Est. Cost:** $${plan.estimatedCost}\n\n**Steps:**\n${plan.steps.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}\n\n**Tools Needed:** ${plan.toolsNeeded.join(", ")}\n\n**Products to Buy:**\n${plan.productsToBuy.map((p: any) => `• ${p.name} (~$${p.estimatedCost})`).join("\n")}\n\n🎥 **Tutorials:**\n${tutorials.map((v, i) => `${i + 1}. ${v.title} — ${v.url}`).join("\n")}${plan.safetyWarnings.length ? `\n\n⚠️ **Safety:** ${plan.safetyWarnings.join("; ")}` : ""}`,
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
      safetyWarnings: ["Water will be very hot — use caution", "Never turn on heater with empty tank"],
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
    message: `🏠 **${new Date(2024, month - 1, 1).toLocaleString("en-US", { month: "long" })} DIY Projects:**\n${projects.map((p, i) => `${i + 1}. **${p.project}** (${p.difficulty}) — ~${p.estimatedCost}\n   _${p.reason}_`).join("\n")}`,
  };
}
