/**
 * George Daily Briefing Engine
 *
 * Generates personalized morning summaries for customers.
 * Weather from wttr.in (free, no API key).
 */

export interface WeatherSummary {
 temp: number;
 feelsLike: number;
 conditions: string;
 humidity: number;
 windSpeed: number;
 uvIndex: number;
 precipChance: number;
 alerts: string[];
 forecast3day: Array<{ day: string; high: number; low: number; conditions: string }>;
}

export interface ScheduleItem {
 jobId: string;
 serviceType: string;
 scheduledFor: string;
 proName: string;
 timeWindow: string;
 address: string;
}

export interface HomeAlert {
 id: string;
 type: "maintenance" | "device" | "reminder";
 message: string;
 urgency: "low" | "medium" | "high";
 bookable?: boolean;
 serviceId?: string;
}

export interface EnergyReport {
 note: string;
 tip: string;
}

export interface MorningBriefing {
 greeting: string;
 weather: WeatherSummary;
 todaySchedule: ScheduleItem[];
 homeAlerts: HomeAlert[];
 energyReport: EnergyReport;
 tips: string;
 loyaltyUpdate: string;
 neighborhoodBuzz: string;
 trashDay: { isTrashDay: boolean; isRecyclingDay: boolean; nextTrashDay: string; nextRecyclingDay: string };
 seasonalCountdown: { event: string; daysUntil: number; readinessScore: number; readinessNote: string };
}

// ─────────────────────────────────────────────
// Weather via wttr.in
// ─────────────────────────────────────────────

export async function getWeatherBrief(zip: string): Promise<WeatherSummary> {
 const location = zip || "Orlando";

 try {
 const res = await fetch(`https://wttr.in/${location}?format=j1`, {
 headers: { "User-Agent": "UpTend-George/1.0" },
 signal: AbortSignal.timeout(5000),
 });

 if (!res.ok) throw new Error(`wttr.in returned ${res.status}`);

 const data: any = await res.json();
 const current = data.current_condition?.[0];
 const weather = data.weather;

 if (!current) throw new Error("No current condition in wttr.in response");

 const conditions = current.weatherDesc?.[0]?.value || "Partly Cloudy";
 const alerts: string[] = [];

 const month = new Date().getMonth() + 1;
 if (month >= 6 && month <= 11) {
 alerts.push("Hurricane season active - June 1 through November 30");
 }

 const forecast3day = (weather || []).slice(0, 3).map((day: any, i: number) => {
 const days = ["Today", "Tomorrow", "Day After"];
 return {
 day: days[i] || `Day ${i + 1}`,
 high: parseInt(day.maxtempF || "85"),
 low: parseInt(day.mintempF || "70"),
 conditions: day.hourly?.[4]?.weatherDesc?.[0]?.value || "Partly Cloudy",
 };
 });

 return {
 temp: parseInt(current.temp_F || "82"),
 feelsLike: parseInt(current.FeelsLikeF || "88"),
 conditions,
 humidity: parseInt(current.humidity || "70"),
 windSpeed: parseInt(current.windspeedMiles || "8"),
 uvIndex: parseInt(current.uvIndex || "5"),
 precipChance: parseInt(weather?.[0]?.hourly?.[4]?.chanceofrain || "0"),
 alerts,
 forecast3day,
 };
 } catch (err: any) {
 console.warn("[George Daily] Weather fetch failed:", err.message);
 // Sensible Orlando fallback
 const month = new Date().getMonth() + 1;
 const isHot = month >= 5 && month <= 9;
 return {
 temp: isHot ? 89 : 72,
 feelsLike: isHot ? 95 : 72,
 conditions: isHot ? "Partly Cloudy, chance of afternoon storms" : "Clear and pleasant",
 humidity: isHot ? 78 : 55,
 windSpeed: 9,
 uvIndex: isHot ? 8 : 4,
 precipChance: isHot ? 40 : 10,
 alerts: month >= 6 && month <= 11 ? ["Hurricane season active - June 1 through November 30"] : [],
 forecast3day: [
 { day: "Today", high: isHot ? 91 : 74, low: isHot ? 75 : 58, conditions: isHot ? "Partly Cloudy" : "Sunny" },
 { day: "Tomorrow", high: isHot ? 90 : 73, low: isHot ? 74 : 57, conditions: isHot ? "Chance of storms" : "Mostly Sunny" },
 { day: "Day After", high: isHot ? 88 : 75, low: isHot ? 73 : 59, conditions: "Partly Cloudy" },
 ],
 };
 }
}

// ─────────────────────────────────────────────
// Daily Tip Engine
// ─────────────────────────────────────────────

const DAILY_TIPS: Record<string, string[]> = {
 energy: [
 "Set your ceiling fans to counterclockwise in summer - saves ~10% on AC bills",
 "Close blinds and curtains during peak sun hours (10 AM–4 PM) to cut cooling costs",
 "Clean AC air filters every 30 days in summer - a dirty filter makes your AC work 15% harder",
 "Set your thermostat to 78°F when home, 82°F when away - ideal for Orlando summers",
 "LED bulbs use 75% less energy than incandescent - a quick swap pays off in months",
 ],
 pest: [
 "Pest control tip: Seal gaps around doors and windows with weatherstripping - keeps bugs AND humidity out",
 "Florida needs quarterly pest control. Skipping a treatment lets colonies rebuild fast.",
 "Standing water anywhere on your property is a mosquito breeding site - check after every rain",
 "Dryer vents and AC drain lines are common entry points for roaches - seal and inspect annually",
 "Ants follow water trails. Fix any leaking pipes or faucets to eliminate one of their top attractants",
 ],
 storm: [
 "Hurricane season runs June 1–November 30. Clean gutters now - clogged gutters flood foundations",
 "Take photos of every room before storm season for insurance documentation. Free and could save thousands.",
 "Keep 3 days of water (1 gallon/person/day) stored before any tropical storm warning",
 "Trim overhanging branches now - they become projectiles in 50+ mph winds",
 "Test your generator before hurricane season, not during. Fuel stabilizer extends storage life.",
 ],
 diy: [
 "A running toilet can waste 200 gallons/day. Check for a flapper leak: put food coloring in the tank - if it appears in the bowl, it's leaking",
 "Drain 1–2 gallons from your water heater every 6 months to flush sediment - extends life 3–5 years",
 "Caulk around tubs, showers, and sinks annually. Mold starts in gaps - prevention is minutes, repair is hundreds",
 "Reset your GFCI outlets (the ones with test/reset buttons near water) monthly to make sure they're working",
 "Clean your refrigerator coils once a year - dirty coils make it work 30% harder",
 ],
 seasonal: [
 "Spring cleaning tip: Pressure wash before the rainy season starts - algae sets in fast once humidity rises",
 "Pre-hurricane season checklist: gutters, tree trimming, roof inspection, and exterior photos",
 "Post-storm: walk your roof line visually (never climb without pro equipment) before filing any claim",
 "Fall is the best time to seal your driveway - cooler temps help the sealer cure properly",
 "Pool season ends? Lower water level slightly, balance chemicals, and run the pump less - saves on electricity",
 ],
 florida: [
 "Florida tip: Set your ceiling fans to counterclockwise in summer - saves ~10% on AC",
 "Florida homes need exterior paint touched up every 5–7 years - UV and humidity degrade it fast",
 "Your water heater works harder in Florida's hard water. Flush it annually to extend its life 3–5 years",
 "Mold can grow on exterior surfaces within 48 hours of moisture. Annual pressure washing prevents it",
 "Florida's sandy soil causes settling - inspect your home's foundation perimeter yearly for cracks",
 ],
 pool: [
 "Pool tip: Run your pump 8–10 hours/day in summer. Over-running wastes electricity; under-running causes algae",
 "Shock your pool after every heavy rain - rainfall dilutes chemicals and introduces contaminants",
 "Brush pool walls weekly to prevent algae from taking hold - takes 5 minutes and saves a full algae treatment",
 "Test pool water weekly in summer, bi-weekly in cooler months. pH should stay 7.2–7.6",
 "A pool cover can reduce evaporation by 95% and cut chemical usage by 35–60%",
 ],
 lawn: [
 "Water your lawn early morning (5–8 AM) - afternoon watering evaporates before soaking in; evening causes fungus",
 "Mow at 3–4 inches height in Florida - taller grass shades roots and needs less water",
 "Fertilize St. Augustine grass March, June, and October - the three key feeding windows for Orlando lawns",
 "Over-watering is the #1 lawn killer in Florida. Check soil moisture 2 inches deep before watering",
 "Edge your lawn every 2 weeks - overgrown edges let grass invade flower beds and walkways",
 ],
 appliance: [
 "Clean your dryer lint trap after every load - lint buildup causes 15,000 house fires annually",
 "Run your dishwasher on 'eco' mode when not in a hurry - uses 20% less water and energy",
 "Deep clean your oven once a year - built-up grease causes uneven heating and can smoke heavily",
 "Refrigerator door seals (gaskets) should be replaced if you feel cold air leaking - costs $20 and cuts energy use significantly",
 "Run washing machine on cold water when possible - 90% of washer energy goes to heating water",
 ],
};

const ALL_TIP_KEYS = Object.keys(DAILY_TIPS);
// Simple daily rotation using day-of-year
function getTipIndex(dayOfYear: number, total: number): number {
 return dayOfYear % total;
}

export function getDailyTip(month: number, homeType: string, location: string): string {
 const now = new Date();
 const start = new Date(now.getFullYear(), 0, 0);
 const diff = now.getTime() - start.getTime();
 const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

 // Category selection weighted by month / home type
 let categories = [...ALL_TIP_KEYS];

 // Boost relevant categories
 if (month >= 6 && month <= 11) {
 categories = [...categories, "storm", "storm"]; // hurricane season weight
 }
 if (month >= 3 && month <= 5) {
 categories = [...categories, "seasonal", "lawn"]; // spring weight
 }
 if ((homeType || "").toLowerCase().includes("pool") || homeType === "residential") {
 categories = [...categories, "pool"];
 }
 if (location.toLowerCase().includes("florida") || location.toLowerCase().includes("orlando")) {
 categories = [...categories, "florida"];
 }

 const categoryKey = categories[getTipIndex(dayOfYear, categories.length)];
 const tips = DAILY_TIPS[categoryKey] || DAILY_TIPS.florida;
 return tips[getTipIndex(Math.floor(dayOfYear / ALL_TIP_KEYS.length), tips.length)];
}

// ─────────────────────────────────────────────
// Trash Schedule (Orange County / Lake Nona)
// ─────────────────────────────────────────────

function getTrashSchedule(zip: string): {
 isTrashDay: boolean;
 isRecyclingDay: boolean;
 nextTrashDay: string;
 nextRecyclingDay: string;
 note: string;
} {
 const now = new Date();
 const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ... 6=Sat

 // Most of Lake Nona / Orange County: trash Mon & Thu, recycling Mon
 // Adjust based on zip if known
 const trashDays: Record<string, number[]> = {
 "32827": [1, 4], // Mon, Thu - Lake Nona
 "32832": [1, 4], // Mon, Thu - Lake Nona area
 "32824": [2, 5], // Tue, Fri - some areas
 "32836": [2, 5], // Dr. Phillips
 "32819": [1, 4], // Sand Lake
 "32789": [1, 4], // Winter Park
 "32765": [3, 6], // Oviedo - Wed, Sat
 };
 const recyclingWeekdays: Record<string, number> = {
 "32827": 1, "32832": 1, "32824": 2, "32836": 2,
 "32819": 1, "32789": 1, "32765": 3,
 };

 const schedule = trashDays[zip] || [1, 4];
 const recyclingDay = recyclingWeekdays[zip] || 1;

 const isTrashDay = schedule.includes(dayOfWeek);
 const isRecyclingDay = dayOfWeek === recyclingDay && isWeekEven(now);

 // Calculate next days
 function nextOccurrence(targetDay: number): string {
 const d = new Date(now);
 let daysUntil = (targetDay - dayOfWeek + 7) % 7;
 if (daysUntil === 0) daysUntil = 7;
 d.setDate(d.getDate() + daysUntil);
 return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
 }

 return {
 isTrashDay,
 isRecyclingDay,
 nextTrashDay: isTrashDay ? "Today!" : nextOccurrence(schedule[0]),
 nextRecyclingDay: isRecyclingDay ? "Today!" : nextOccurrence(recyclingDay),
 note: "Based on Orange County schedule. Check ocfl.net for holiday changes.",
 };
}

function isWeekEven(date: Date): boolean {
 const startOfYear = new Date(date.getFullYear(), 0, 1);
 const week = Math.ceil(((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
 return week % 2 === 0;
}

// ─────────────────────────────────────────────
// Seasonal Countdown
// ─────────────────────────────────────────────

export function getSeasonalCountdown(): {
 event: string;
 daysUntil: number;
 readinessScore: number;
 readinessNote: string;
 tip: string;
} {
 const now = new Date();
 const month = now.getMonth() + 1;
 const day = now.getDate();

 // Key Florida seasonal events
 const events = [
 { name: "Hurricane Season", month: 6, dayOfMonth: 1, prepServices: ["gutter_cleaning", "landscaping", "home_scan"] },
 { name: "End of Hurricane Season", month: 11, dayOfMonth: 30, prepServices: [] },
 { name: "Spring Cleaning Season", month: 3, dayOfMonth: 1, prepServices: ["pressure_washing", "landscaping"] },
 { name: "Holiday Season", month: 11, dayOfMonth: 1, prepServices: ["home_cleaning", "garage_cleanout"] },
 ];

 // Find next upcoming event
 let closestEvent = events[0];
 let closestDays = Infinity;

 for (const event of events) {
 const eventDate = new Date(now.getFullYear(), event.month - 1, event.dayOfMonth);
 if (eventDate < now) {
 eventDate.setFullYear(now.getFullYear() + 1);
 }
 const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
 if (daysUntil < closestDays) {
 closestDays = daysUntil;
 closestEvent = event;
 }
 }

 // Readiness score based on proximity (mock - real would check completed services)
 const readinessScore = closestDays < 30 ? 6 : closestDays < 60 ? 8 : 9;
 const readinessNote = readinessScore < 7
 ? "A few items need attention before the season"
 : readinessScore < 9
 ? "Mostly ready - a couple services would give you full coverage"
 : "Well prepared - keep up the maintenance!";

 const tip = closestEvent.name === "Hurricane Season"
 ? `${closestDays} days until hurricane season. Top prep: clean gutters, trim trees, document your home.`
 : closestEvent.name === "Spring Cleaning Season"
 ? `Spring is ${closestDays} days away - best time to book pressure washing before it fills up.`
 : `${closestEvent.name} is ${closestDays} days away.`;

 return {
 event: closestEvent.name,
 daysUntil: closestDays,
 readinessScore,
 readinessNote,
 tip,
 };
}

// ─────────────────────────────────────────────
// Build Full Morning Briefing
// ─────────────────────────────────────────────

export async function buildMorningBriefing(userId: string, storage?: any): Promise<MorningBriefing> {
 const now = new Date();
 const hour = now.getHours();

 const greeting = hour < 12
 ? "Good morning!"
 : hour < 17
 ? "Good afternoon!"
 : "Good evening!";

 // Pull home profile for personalization
 let homeProfile: any = null;
 let zip = "32827"; // Default Lake Nona
 let userName = "";
 let lifetimeSpend = 0;
 let todayJobs: ScheduleItem[] = [];
 let homeAlerts: HomeAlert[] = [];

 if (storage) {
 try {
 // Home profile
 homeProfile = await storage.getHomeProfile?.(userId).catch(() => null);
 if (homeProfile?.zip) zip = homeProfile.zip;
 if (homeProfile?.address) {
 const zipMatch = homeProfile.address.match(/\b3[23]\d{3}\b/);
 if (zipMatch) zip = zipMatch[0];
 }

 // Customer name
 const customer = await storage.getCustomer?.(userId).catch(() => null);
 if (customer?.firstName) userName = customer.firstName;
 else if (customer?.name) userName = customer.name.split(" ")[0];

 // Today's jobs
 const jobs = await storage.getServiceRequestsByCustomer?.(userId).catch(() => []);
 const todayStr = now.toISOString().split("T")[0];
 const scheduled = (jobs || []).filter((j: any) => {
 if (!["accepted", "confirmed", "pending"].includes(j.status)) return false;
 const jobDate = (j.scheduledFor || "").split("T")[0];
 return jobDate === todayStr;
 });

 todayJobs = scheduled.map((j: any) => ({
 jobId: j.id,
 serviceType: j.serviceType,
 scheduledFor: j.scheduledFor,
 proName: j.proName || j.haulerName || "Your Pro",
 timeWindow: j.timeWindow || "Morning",
 address: j.serviceAddress || j.address || "Your address on file",
 }));

 // Lifetime spend for loyalty tier
 const completed = (jobs || []).filter((j: any) => j.status === "completed");
 lifetimeSpend = completed.reduce((s: number, j: any) => s + (j.finalPrice || j.priceEstimate || 0), 0);

 // Maintenance reminders as home alerts
 const { reminders } = await storage.getMaintenanceReminders?.(userId).catch(() => ({ reminders: [] })) || { reminders: [] };
 if (Array.isArray(reminders)) {
 for (const r of reminders.filter((r: any) => r.urgentThisMonth).slice(0, 3)) {
 homeAlerts.push({
 id: r.id || r.task,
 type: "maintenance",
 message: r.task,
 urgency: "medium",
 bookable: r.bookable || false,
 serviceId: r.serviceId,
 });
 }
 }
 } catch (err: any) {
 console.warn("[George Daily] Storage error:", err.message);
 }
 }

 // Weather (async, graceful fallback)
 const weather = await getWeatherBrief(zip);

 // Daily tip
 const month = now.getMonth() + 1;
 const homeType = homeProfile?.hasPool ? "pool" : "residential";
 const tips = getDailyTip(month, homeType, "Orlando, FL");

 // Loyalty tier
 const tier = lifetimeSpend >= 5000 ? "Platinum" : lifetimeSpend >= 2000 ? "Gold" : lifetimeSpend >= 500 ? "Silver" : "Bronze";
 const tierMessages: Record<string, string> = {
 Bronze: "You're Bronze - book 3 more services to reach Silver and unlock priority scheduling",
 Silver: "You're Silver - $" + Math.max(0, 2000 - lifetimeSpend) + " more to reach Gold and get 5% off everything",
 Gold: "You're Gold - enjoy 5% off all services! $" + Math.max(0, 5000 - lifetimeSpend) + " to Platinum",
 Platinum: "You're Platinum - enjoy 10% off everything and a free annual home scan!",
 };
 const loyaltyUpdate = tierMessages[tier];

 // Neighborhood buzz (static for now - would pull from getNeighborhoodActivity)
 const buzzByMonth: Record<number, string> = {
 3: "Neighbors are booking spring pressure washing - 15+ homes in your area this week",
 4: "Pool cleaning season starting - 20+ pool service bookings nearby",
 5: "Pre-hurricane prep underway - gutter cleaning trending in your neighborhood",
 6: "Storm season is here - neighbors are getting gutters and trees done fast",
 9: "Post-storm cleanups trending - junk removal and pressure washing in high demand nearby",
 11: "Holiday prep season - home cleaning and garage cleanouts very popular right now",
 12: "Year-end cleanouts - garage and junk removal trending this week",
 };
 const neighborhoodBuzz = buzzByMonth[month] || "Home maintenance activity is steady in your neighborhood this week";

 // Trash schedule
 const trashDay = getTrashSchedule(zip);

 // Seasonal countdown
 const seasonalCountdown = getSeasonalCountdown();

 // Energy report (simple summary)
 const energyReport: EnergyReport = {
 note: weather.temp > 85
 ? `It's ${weather.temp}°F - AC is working hard today`
 : `Nice ${weather.temp}°F day - good chance to run fans instead of AC`,
 tip: weather.humidity > 70
 ? "High humidity today - your AC is working double duty. Check that your filter is clean."
 : "Lower humidity means easier cooling today - a good day to air out the house.",
 };

 return {
 greeting: userName ? `${greeting} ${userName}!` : greeting,
 weather,
 todaySchedule: todayJobs,
 homeAlerts,
 energyReport,
 tips,
 loyaltyUpdate,
 neighborhoodBuzz,
 trashDay,
 seasonalCountdown,
 };
}
