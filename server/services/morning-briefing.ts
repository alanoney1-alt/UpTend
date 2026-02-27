/**
 * Morning Briefing Engine
 * 
 * Compiles a personalized daily briefing for each customer:
 * weather, bookings, maintenance, wallet, tips, and weather-triggered suggestions.
 */

import { pool } from "../db";

// ─── Weather from wttr.in ───────────────────────────────

export async function getWeatherForZip(zip: string) {
 try {
 const res = await fetch(`https://wttr.in/${zip}?format=j1`);
 if (!res.ok) throw new Error(`wttr.in returned ${res.status}`);
 const data = await res.json() as any;

 const current = data.current_condition?.[0] || {};
 const forecast = (data.weather || []).slice(0, 3).map((d: any) => ({
 date: d.date,
 maxTempF: d.maxtempF,
 minTempF: d.mintempF,
 description: d.hourly?.[4]?.weatherDesc?.[0]?.value || "",
 chanceOfRain: d.hourly?.[4]?.chanceofrain || "0",
 chanceOfSnow: d.hourly?.[4]?.chanceofsnow || "0",
 }));

 return {
 current: {
 tempF: current.temp_F,
 feelsLikeF: current.FeelsLikeF,
 humidity: current.humidity,
 description: current.weatherDesc?.[0]?.value || "",
 windMph: current.windspeedMiles,
 uvIndex: current.uvIndex,
 },
 forecast,
 zip,
 };
 } catch (err: any) {
 return { error: true, message: `Weather unavailable: ${err.message}`, zip };
 }
}

// ─── Seasonal daily tip ─────────────────────────────────

export function getDailyTip(month: number, homeProfile: any) {
 const tips: Record<string, string[]> = {
 winter: [
 "Check your heating filters - dirty filters increase energy bills by 15%.",
 "Keep gutters clear of ice dams to prevent roof leaks.",
 "Reverse ceiling fans to clockwise to push warm air down.",
 "Test smoke and CO detectors - batteries weaken in cold weather.",
 ],
 spring: [
 "Schedule your AC tune-up before summer rush - saves 20% on cooling costs.",
 "Power-wash your driveway and siding to prevent mold buildup.",
 "Check window seals for drafts from winter contraction.",
 "Inspect your roof for winter damage before spring rains.",
 ],
 summer: [
 "Clean dryer vents - #1 cause of home fires and easy to prevent.",
 "Water your lawn early morning (6-8 AM) to reduce evaporation by 30%.",
 "Check your AC refrigerant - low levels mean higher bills and less cooling.",
 "Inspect caulking around windows to keep cool air in.",
 ],
 fall: [
 "Clean gutters before leaf fall to prevent water damage.",
 "Seal driveway cracks before freeze-thaw cycles widen them.",
 "Flush your water heater to remove sediment - extends life 2-3 years.",
 "Schedule a furnace inspection before the first cold snap.",
 ],
 };

 const season =
 month <= 2 || month === 12 ? "winter" :
 month <= 5 ? "spring" :
 month <= 8 ? "summer" : "fall";

 const seasonTips = tips[season];
 const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
 return seasonTips[dayOfYear % seasonTips.length];
}

// ─── Generate full morning briefing ─────────────────────

export async function generateMorningBriefing(customerId: string) {
 // Get customer info + home profile
 const { rows: customers } = await pool.query(
 `SELECT u.*, hp.address, hp.zip_code, hp.home_type
 FROM users u
 LEFT JOIN home_profiles hp ON hp.customer_id = u.id
 WHERE u.id = $1 LIMIT 1`,
 [customerId]
 ).catch(() => ({ rows: [] }));

 const customer = customers[0] || {};
 const zip = customer.zip_code || customer.zip || "32801"; // default Orlando

 // Parallel data fetches
 const [weather, bookings, reminders, scanProgress, wallet] = await Promise.all([
 getWeatherForZip(zip),

 // Upcoming bookings
 pool.query(
 `SELECT id, service_type, scheduled_date, status, address
 FROM service_requests
 WHERE customer_id = $1 AND status IN ('confirmed','scheduled','matched')
 AND scheduled_date >= NOW()
 ORDER BY scheduled_date ASC LIMIT 5`,
 [customerId]
 ).then(r => r.rows).catch(() => []),

 // Maintenance reminders due
 pool.query(
 `SELECT id, description, next_due_date, interval_days
 FROM maintenance_reminders
 WHERE user_id = $1 AND next_due_date <= NOW() + INTERVAL '7 days'
 ORDER BY next_due_date ASC LIMIT 5`,
 [customerId]
 ).then(r => r.rows).catch(() => []),

 // Home scan progress
 pool.query(
 `SELECT rooms_scanned, total_rooms, badges_earned, credits_earned
 FROM home_scan_sessions
 WHERE customer_id = $1
 ORDER BY created_at DESC LIMIT 1`,
 [customerId]
 ).then(r => r.rows[0] || null).catch(() => null),

 // Wallet balance
 pool.query(
 `SELECT balance FROM customer_wallets WHERE customer_id = $1 LIMIT 1`,
 [customerId]
 ).then(r => r.rows[0]?.balance || 0).catch(() => 0),
 ]);

 const month = new Date().getMonth() + 1;
 const tip = getDailyTip(month, customer);

 // Weather-triggered suggestions
 const suggestions: string[] = [];
 if (weather && !("error" in weather)) {
 const forecast = weather.forecast || [];
 for (const day of forecast) {
 if (parseInt(day.chanceOfRain) > 60) {
 suggestions.push(` Rain expected ${day.date} - consider gutter cleaning`);
 }
 if (parseInt(day.chanceOfSnow) > 40) {
 suggestions.push(` Snow expected ${day.date} - schedule driveway treatment`);
 }
 if (parseInt(day.maxTempF) > 95) {
 suggestions.push(` High heat ${day.date} - time for an AC check-up?`);
 }
 }
 }

 return {
 greeting: `Good morning${customer.first_name ? `, ${customer.first_name}` : ""}! `,
 weather,
 upcomingBookings: bookings.map((b: any) => ({
 id: b.id,
 service: b.service_type,
 date: b.scheduled_date,
 status: b.status,
 address: b.address,
 })),
 maintenanceDue: reminders.map((r: any) => ({
 id: r.id,
 description: r.description,
 dueDate: r.next_due_date,
 })),
 homeScan: scanProgress
 ? {
 progress: scanProgress.total_rooms
 ? Math.round((scanProgress.rooms_scanned / scanProgress.total_rooms) * 100)
 : 0,
 roomsScanned: scanProgress.rooms_scanned,
 totalRooms: scanProgress.total_rooms,
 credits: scanProgress.credits_earned,
 }
 : null,
 walletBalance: wallet,
 tipOfTheDay: tip,
 weatherSuggestions: suggestions,
 generatedAt: new Date().toISOString(),
 };
}
