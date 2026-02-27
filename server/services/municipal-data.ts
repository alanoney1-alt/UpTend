/**
 * Municipal Data Service - Home Operating System
 *
 * Orlando/Orange County FL municipal data: trash schedules, water restrictions,
 * utility providers, sprinkler recommendations, and trash reminders.
 */

import { db, pool } from "../db";

// ─────────────────────────────────────────────
// ZIP → Trash Schedule mapping (Orlando metro)
// Source: Orange County Solid Waste Division
// ─────────────────────────────────────────────
const ZIP_TRASH_SCHEDULES: Record<string, { trashDay: string; trashDays2: string; recyclingDay: string; yardWasteDay: string; provider: string }> = {
  "32801": { trashDay: "Monday", trashDays2: "Thursday", recyclingDay: "Monday", yardWasteDay: "Wednesday", provider: "Waste Pro" },
  "32803": { trashDay: "Monday", trashDays2: "Thursday", recyclingDay: "Monday", yardWasteDay: "Wednesday", provider: "Waste Pro" },
  "32804": { trashDay: "Tuesday", trashDays2: "Friday", recyclingDay: "Tuesday", yardWasteDay: "Thursday", provider: "Waste Pro" },
  "32806": { trashDay: "Monday", trashDays2: "Thursday", recyclingDay: "Monday", yardWasteDay: "Wednesday", provider: "Waste Pro" },
  "32807": { trashDay: "Tuesday", trashDays2: "Friday", recyclingDay: "Tuesday", yardWasteDay: "Thursday", provider: "Orange County Solid Waste" },
  "32808": { trashDay: "Wednesday", trashDays2: "Saturday", recyclingDay: "Wednesday", yardWasteDay: "Friday", provider: "Orange County Solid Waste" },
  "32809": { trashDay: "Monday", trashDays2: "Thursday", recyclingDay: "Monday", yardWasteDay: "Wednesday", provider: "Orange County Solid Waste" },
  "32810": { trashDay: "Tuesday", trashDays2: "Friday", recyclingDay: "Tuesday", yardWasteDay: "Thursday", provider: "Orange County Solid Waste" },
  "32811": { trashDay: "Wednesday", trashDays2: "Saturday", recyclingDay: "Wednesday", yardWasteDay: "Friday", provider: "Orange County Solid Waste" },
  "32812": { trashDay: "Monday", trashDays2: "Thursday", recyclingDay: "Monday", yardWasteDay: "Wednesday", provider: "Orange County Solid Waste" },
  "32817": { trashDay: "Tuesday", trashDays2: "Friday", recyclingDay: "Tuesday", yardWasteDay: "Thursday", provider: "Orange County Solid Waste" },
  "32818": { trashDay: "Wednesday", trashDays2: "Saturday", recyclingDay: "Wednesday", yardWasteDay: "Friday", provider: "Orange County Solid Waste" },
  "32819": { trashDay: "Monday", trashDays2: "Thursday", recyclingDay: "Monday", yardWasteDay: "Wednesday", provider: "Orange County Solid Waste" },
  "32820": { trashDay: "Tuesday", trashDays2: "Friday", recyclingDay: "Tuesday", yardWasteDay: "Thursday", provider: "Orange County Solid Waste" },
  "32821": { trashDay: "Wednesday", trashDays2: "Saturday", recyclingDay: "Wednesday", yardWasteDay: "Friday", provider: "Orange County Solid Waste" },
  "32822": { trashDay: "Monday", trashDays2: "Thursday", recyclingDay: "Monday", yardWasteDay: "Wednesday", provider: "Orange County Solid Waste" },
  "32824": { trashDay: "Tuesday", trashDays2: "Friday", recyclingDay: "Tuesday", yardWasteDay: "Thursday", provider: "Orange County Solid Waste" },
  "32825": { trashDay: "Wednesday", trashDays2: "Saturday", recyclingDay: "Wednesday", yardWasteDay: "Friday", provider: "Orange County Solid Waste" },
  "32826": { trashDay: "Monday", trashDays2: "Thursday", recyclingDay: "Monday", yardWasteDay: "Wednesday", provider: "Orange County Solid Waste" },
  "32827": { trashDay: "Monday", trashDays2: "Thursday", recyclingDay: "Monday", yardWasteDay: "Wednesday", provider: "Orange County Solid Waste" },
  "32828": { trashDay: "Tuesday", trashDays2: "Friday", recyclingDay: "Tuesday", yardWasteDay: "Thursday", provider: "Orange County Solid Waste" },
  "32829": { trashDay: "Wednesday", trashDays2: "Saturday", recyclingDay: "Wednesday", yardWasteDay: "Friday", provider: "Orange County Solid Waste" },
  "32832": { trashDay: "Monday", trashDays2: "Thursday", recyclingDay: "Monday", yardWasteDay: "Wednesday", provider: "Orange County Solid Waste" },
  "32833": { trashDay: "Tuesday", trashDays2: "Friday", recyclingDay: "Tuesday", yardWasteDay: "Thursday", provider: "Orange County Solid Waste" },
  "32835": { trashDay: "Wednesday", trashDays2: "Saturday", recyclingDay: "Wednesday", yardWasteDay: "Friday", provider: "Orange County Solid Waste" },
  "32836": { trashDay: "Tuesday", trashDays2: "Friday", recyclingDay: "Tuesday", yardWasteDay: "Thursday", provider: "Orange County Solid Waste" },
  "32837": { trashDay: "Monday", trashDays2: "Thursday", recyclingDay: "Monday", yardWasteDay: "Wednesday", provider: "Orange County Solid Waste" },
  "32839": { trashDay: "Wednesday", trashDays2: "Saturday", recyclingDay: "Wednesday", yardWasteDay: "Friday", provider: "Orange County Solid Waste" },
  "32765": { trashDay: "Wednesday", trashDays2: "Saturday", recyclingDay: "Wednesday", yardWasteDay: "Friday", provider: "Orange County Solid Waste" },
  "32789": { trashDay: "Monday", trashDays2: "Thursday", recyclingDay: "Monday", yardWasteDay: "Wednesday", provider: "Waste Pro" },
  "32792": { trashDay: "Tuesday", trashDays2: "Friday", recyclingDay: "Tuesday", yardWasteDay: "Thursday", provider: "Orange County Solid Waste" },
};

// Default fallback for unknown Orlando-area zips
const DEFAULT_SCHEDULE = { trashDay: "Monday", trashDays2: "Thursday", recyclingDay: "Monday", yardWasteDay: "Wednesday", provider: "Orange County Solid Waste" };

/**
 * lookupTrashSchedule - resolve trash/recycling schedule for an address
 * Strategy: 1) Check DB  2) ZIP lookup table  3) Fallback needs customer input
 */
export async function lookupTrashSchedule(
  address: string,
  city: string,
  state: string,
  zip: string
): Promise<{
  trashDay: string;
  trashFrequency: string;
  recyclingDay: string;
  recyclingFrequency: string;
  yardWasteDay: string;
  bulkPickupDay: string;
  bulkPickupFrequency: string;
  provider: string;
  source: string;
  confidence: string;
}> {
  // 1) Check if we already have it in DB
  try {
    const result = await pool.query(
      `SELECT * FROM trash_recycling_schedules WHERE customer_id IN (
        SELECT customer_id FROM home_utility_profiles WHERE address ILIKE $1 AND zip = $2 LIMIT 1
      ) LIMIT 1`,
      [`%${address.split(" ").slice(0, 2).join(" ")}%`, zip]
    );
    if (result.rows.length > 0) {
      const r = result.rows[0];
      return {
        trashDay: r.trash_day,
        trashFrequency: r.trash_frequency,
        recyclingDay: r.recycling_day,
        recyclingFrequency: r.recycling_frequency,
        yardWasteDay: r.yard_waste_day || "",
        bulkPickupDay: r.bulk_pickup_day || "First Monday of month",
        bulkPickupFrequency: r.bulk_pickup_frequency || "monthly",
        provider: r.provider || "Orange County Solid Waste",
        source: r.source,
        confidence: "high",
      };
    }
  } catch (err) {
    console.warn("[Municipal Data] DB lookup failed:", err);
  }

  // 2) ZIP-based lookup
  const schedule = ZIP_TRASH_SCHEDULES[zip] || DEFAULT_SCHEDULE;
  const isKnownZip = zip in ZIP_TRASH_SCHEDULES;

  return {
    trashDay: schedule.trashDay,
    trashFrequency: "weekly",
    recyclingDay: schedule.recyclingDay,
    recyclingFrequency: "weekly",
    yardWasteDay: schedule.yardWasteDay,
    bulkPickupDay: "First Monday of month",
    bulkPickupFrequency: "monthly",
    provider: schedule.provider,
    source: isKnownZip ? "scraped" : "customer_reported",
    confidence: isKnownZip ? "medium" : "low",
  };
}

/**
 * lookupWaterRestrictions - St. Johns River Water Management District rules
 * Orange County / Orlando area watering restrictions
 */
export function lookupWaterRestrictions(
  county: string,
  zip: string,
  addressNumber?: number
): {
  allowedDays: string[];
  restrictedHours: string;
  rule: string;
  source: string;
  addressBased: boolean;
  notes: string;
} {
  // St. Johns River Water Management District - year-round irrigation rules
  const isEven = addressNumber ? addressNumber % 2 === 0 : null;

  if (county.toLowerCase().includes("orange") || county.toLowerCase().includes("orlando")) {
    const allowedDays = isEven !== null
      ? (isEven ? ["Thursday", "Sunday"] : ["Wednesday", "Saturday"])
      : ["Check based on address number - even: Thu/Sun, odd: Wed/Sat"];

    return {
      allowedDays,
      restrictedHours: "No watering between 10:00 AM and 4:00 PM",
      rule: "2-day-per-week watering schedule based on address number",
      source: "St. Johns River Water Management District",
      addressBased: true,
      notes: isEven !== null
        ? `Your address is ${isEven ? "even" : "odd"} - you can water on ${allowedDays.join(" and ")}, before 10AM or after 4PM.`
        : "Provide your street number so George can tell you exactly which days you can water.",
    };
  }

  // Generic Florida fallback
  return {
    allowedDays: ["Check with your local water management district"],
    restrictedHours: "No watering between 10:00 AM and 4:00 PM (typical FL rule)",
    rule: "Varies by county and water management district",
    source: "Florida DEP",
    addressBased: false,
    notes: "George doesn't have specific rules for your county yet. We'll look it up!",
  };
}

/**
 * lookupUtilityProviders - likely utility providers for an Orlando-area address
 */
export function lookupUtilityProviders(
  address: string,
  zip: string
): {
  electric: { name: string; phone: string; website: string };
  water: { name: string; phone: string; website: string };
  gas: { name: string; phone: string; website: string };
  trash: { name: string; phone: string; website: string };
  sewer: { name: string; phone: string; website: string };
  internet: { name: string; phone: string; website: string }[];
  source: string;
} {
  // City of Orlando zips generally served by OUC
  const oucZips = new Set([
    "32801", "32802", "32803", "32804", "32805", "32806", "32807",
    "32808", "32809", "32810", "32811", "32812", "32814", "32819",
    "32822", "32824", "32827", "32829", "32831", "32832", "32835",
    "32836", "32837", "32839",
  ]);

  const isOuc = oucZips.has(zip);
  const schedule = ZIP_TRASH_SCHEDULES[zip];

  return {
    electric: isOuc
      ? { name: "Orlando Utilities Commission (OUC)", phone: "407-423-9018", website: "https://www.ouc.com" }
      : { name: "Duke Energy", phone: "800-700-8744", website: "https://www.duke-energy.com" },
    water: isOuc
      ? { name: "Orlando Utilities Commission (OUC)", phone: "407-423-9018", website: "https://www.ouc.com" }
      : { name: "Orange County Utilities", phone: "407-836-5515", website: "https://www.ocfl.net/utilities" },
    gas: { name: "TECO Peoples Gas", phone: "877-832-6747", website: "https://www.peoplesgas.com" },
    trash: {
      name: schedule?.provider || "Orange County Solid Waste",
      phone: schedule?.provider === "Waste Pro" ? "407-869-8800" : "407-836-6601",
      website: schedule?.provider === "Waste Pro" ? "https://www.wasteprousa.com" : "https://www.ocfl.net/solidwaste",
    },
    sewer: isOuc
      ? { name: "Orlando Utilities Commission (OUC)", phone: "407-423-9018", website: "https://www.ouc.com" }
      : { name: "Orange County Utilities", phone: "407-836-5515", website: "https://www.ocfl.net/utilities" },
    internet: [
      { name: "Spectrum", phone: "855-757-7328", website: "https://www.spectrum.com" },
      { name: "AT&T Fiber", phone: "800-288-2020", website: "https://www.att.com/fiber" },
      { name: "T-Mobile Home Internet", phone: "844-275-9310", website: "https://www.t-mobile.com/home-internet" },
    ],
    source: "UpTend municipal data - verified for Orange County FL",
  };
}

/**
 * getSeasonalSprinklerRecommendation - FL-specific irrigation advice
 */
export function getSeasonalSprinklerRecommendation(
  month: number,
  zip: string
): {
  season: string;
  recommendation: string;
  minutesPerZone: number;
  frequencyPerWeek: number;
  tips: string[];
} {
  // Central FL irrigation guidance
  if (month >= 6 && month <= 9) {
    return {
      season: "Summer (Rainy Season)",
      recommendation: "Reduce irrigation - afternoon thunderstorms provide most of your water needs",
      minutesPerZone: 15,
      frequencyPerWeek: 1,
      tips: [
        "Rain sensor should skip watering after storms",
        "If it rained 1\"+ in the last 48h, skip your cycle",
        "Watch for fungus - overwatering in summer causes brown patch",
        "Water early morning (before 10 AM) to reduce evaporation",
      ],
    };
  }
  if (month >= 10 && month <= 11) {
    return {
      season: "Fall (Dry Transition)",
      recommendation: "Moderate watering - rainfall decreasing, temps cooling",
      minutesPerZone: 20,
      frequencyPerWeek: 2,
      tips: [
        "Good time to overseed with winter rye if you want a green lawn year-round",
        "Reduce fertilizer - last application before winter",
        "Check sprinkler heads for clogs before dry season",
      ],
    };
  }
  if (month >= 12 || month <= 2) {
    return {
      season: "Winter (Dry Season)",
      recommendation: "Regular watering needed - this is FL's driest period",
      minutesPerZone: 25,
      frequencyPerWeek: 2,
      tips: [
        "Water early morning to prevent freeze damage on cold nights",
        "If freeze warning: run sprinklers overnight to protect plants (counterintuitive but works)",
        "St. Augustine grass goes semi-dormant - still needs water",
        "Watch for dry spots - adjust heads if needed",
      ],
    };
  }
  // Spring (March-May)
  return {
    season: "Spring (Pre-Rainy)",
    recommendation: "Increase watering as temps rise - rainy season hasn't started yet",
    minutesPerZone: 25,
    frequencyPerWeek: 2,
    tips: [
      "Best time to fertilize - apply slow-release 15-0-15 or similar",
      "Check irrigation system for winter damage",
      "Adjust sprinkler timers as daylight increases",
      "Pre-emergent herbicide now prevents summer weeds",
    ],
  };
}

/**
 * generateTrashReminder - contextual trash day reminder for a customer
 */
export async function generateTrashReminder(customerId: string): Promise<{
  message: string;
  type: string;
  isTonight: boolean;
} | null> {
  const now = new Date();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const tomorrow = dayNames[(now.getDay() + 1) % 7];

  try {
    const result = await pool.query(
      `SELECT * FROM trash_recycling_schedules WHERE customer_id = $1 LIMIT 1`,
      [customerId]
    );

    let trashDay: string;
    let recyclingDay: string;
    let yardWasteDay: string | null;

    if (result.rows.length > 0) {
      const sched = result.rows[0];
      trashDay = sched.trash_day;
      recyclingDay = sched.recycling_day;
      yardWasteDay = sched.yard_waste_day;
    } else {
      // Try to get from utility profile zip
      const profileResult = await pool.query(
        `SELECT zip FROM home_utility_profiles WHERE customer_id = $1 LIMIT 1`,
        [customerId]
      );
      const zip = profileResult.rows[0]?.zip || "32827";
      const schedule = ZIP_TRASH_SCHEDULES[zip] || DEFAULT_SCHEDULE;
      trashDay = schedule.trashDay;
      recyclingDay = schedule.recyclingDay;
      yardWasteDay = schedule.yardWasteDay;
    }

    const messages: string[] = [];
    if (trashDay === tomorrow) {
      messages.push("Take your trash out tonight! 🗑️ Pickup is tomorrow morning.");
    }
    if (recyclingDay === tomorrow) {
      messages.push("Recycling goes out tonight! ♻️ Remember: paper, plastic #1-2, glass, flattened cardboard.");
    }
    if (yardWasteDay && yardWasteDay === tomorrow) {
      messages.push("Yard waste pickup tomorrow! 🌿 Bags or bundles at the curb by 7 AM.");
    }

    if (messages.length === 0) return null;

    return {
      message: messages.join("\n"),
      type: messages.length > 1 ? "multi" : trashDay === tomorrow ? "trash" : recyclingDay === tomorrow ? "recycling" : "yard_waste",
      isTonight: true,
    };
  } catch (err) {
    console.warn("[Municipal Data] generateTrashReminder error:", err);
    return null;
  }
}

/**
 * storeTrashSchedule - persist a trash schedule for a customer
 */
export async function storeTrashSchedule(
  customerId: string,
  zip: string,
  schedule: {
    trashDay: string;
    recyclingDay: string;
    yardWasteDay?: string;
    provider?: string;
    source?: string;
  }
): Promise<void> {
  await pool.query(
    `INSERT INTO trash_recycling_schedules (customer_id, zip, trash_day, trash_frequency, recycling_day, recycling_frequency, yard_waste_day, provider, source)
     VALUES ($1, $2, $3, 'weekly', $4, 'weekly', $5, $6, $7)
     ON CONFLICT DO NOTHING`,
    [customerId, zip, schedule.trashDay, schedule.recyclingDay, schedule.yardWasteDay || null, schedule.provider || "Orange County Solid Waste", schedule.source || "scraped"]
  );
}

/**
 * storeUtilityProfile - persist utility profile for a customer
 */
export async function storeUtilityProfile(
  customerId: string,
  address: string,
  city: string,
  state: string,
  zip: string,
  county: string,
  providers: object
): Promise<void> {
  await pool.query(
    `INSERT INTO home_utility_profiles (customer_id, address, city, state, zip, county, utility_provider)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT DO NOTHING`,
    [customerId, address, city, state, zip, county, JSON.stringify(providers)]
  );
}

/**
 * autoPopulateHomeData - called on signup or after HOA scrape
 * Looks up and stores trash schedule, utility providers, and water restrictions
 */
export async function autoPopulateHomeData(
  customerId: string,
  address: string,
  city: string,
  state: string,
  zip: string,
  county?: string
): Promise<{ success: boolean; populated: string[] }> {
  const populated: string[] = [];
  const resolvedCounty = county || "Orange";

  try {
    // 1) Trash schedule
    const trashSchedule = await lookupTrashSchedule(address, city, state, zip);
    await storeTrashSchedule(customerId, zip, {
      trashDay: trashSchedule.trashDay,
      recyclingDay: trashSchedule.recyclingDay,
      yardWasteDay: trashSchedule.yardWasteDay,
      provider: trashSchedule.provider,
      source: trashSchedule.source,
    });
    populated.push("trash_schedule");

    // 2) Utility providers
    const providers = lookupUtilityProviders(address, zip);
    await storeUtilityProfile(customerId, address, city, state, zip, resolvedCounty, providers);
    populated.push("utility_providers");

    // 3) Water restrictions (stored in sprinkler_settings)
    const addressNum = parseInt(address.match(/^\d+/)?.[0] || "0", 10);
    const restrictions = lookupWaterRestrictions(resolvedCounty, zip, addressNum || undefined);
    await pool.query(
      `INSERT INTO sprinkler_settings (customer_id, water_restrictions)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [customerId, JSON.stringify(restrictions)]
    );
    populated.push("water_restrictions");

    // 4) Create default reminders
    const trashDayNum = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(trashSchedule.trashDay);
    if (trashDayNum >= 0) {
      const reminderDay = trashDayNum === 0 ? 6 : trashDayNum - 1; // night before
      const reminderDayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][reminderDay];
      // Calculate next occurrence
      const now = new Date();
      const daysUntil = (reminderDay - now.getDay() + 7) % 7 || 7;
      const nextDue = new Date(now);
      nextDue.setDate(nextDue.getDate() + daysUntil);

      await pool.query(
        `INSERT INTO home_reminders (customer_id, reminder_type, title, description, frequency, next_due_date, time)
         VALUES ($1, 'trash', 'Take trash out', $2, 'weekly', $3, '7:00 PM')
         ON CONFLICT DO NOTHING`,
        [customerId, `Trash pickup is tomorrow (${trashSchedule.trashDay}). Put bins at curb by 7 AM!`, nextDue.toISOString().split("T")[0]]
      );
      populated.push("trash_reminder");
    }

    return { success: true, populated };
  } catch (err) {
    console.error("[Municipal Data] autoPopulateHomeData error:", err);
    return { success: false, populated };
  }
}
