/**
 * Home Dashboard Service — Home Operating System
 *
 * Mr. George's "home at a glance" — everything a customer needs to know about
 * their home right now: reminders, weather, maintenance, utilities, schedule.
 */

import { pool } from "../db";
import { generateTrashReminder, lookupWaterRestrictions, getSeasonalSprinklerRecommendation } from "./municipal-data";

/**
 * getHomeDashboard — full "home at a glance" for George
 */
export async function getHomeDashboard(customerId: string): Promise<object> {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const todayName = dayNames[now.getDay()];

  // Parallel queries
  const [profileRes, trashRes, sprinklerRes, remindersRes, billingRes] = await Promise.all([
    pool.query(`SELECT * FROM home_utility_profiles WHERE customer_id = $1 LIMIT 1`, [customerId]).catch(() => ({ rows: [] })),
    pool.query(`SELECT * FROM trash_recycling_schedules WHERE customer_id = $1 LIMIT 1`, [customerId]).catch(() => ({ rows: [] })),
    pool.query(`SELECT * FROM sprinkler_settings WHERE customer_id = $1 LIMIT 1`, [customerId]).catch(() => ({ rows: [] })),
    pool.query(`SELECT * FROM home_reminders WHERE customer_id = $1 AND enabled = true ORDER BY next_due_date ASC`, [customerId]).catch(() => ({ rows: [] })),
    pool.query(`SELECT * FROM utility_billing WHERE customer_id = $1 ORDER BY last_bill_date DESC`, [customerId]).catch(() => ({ rows: [] })),
  ]);

  const profile = profileRes.rows[0] || null;
  const trash = trashRes.rows[0] || null;
  const sprinkler = sprinklerRes.rows[0] || null;

  // Today's events
  const todayEvents: string[] = [];
  if (trash) {
    if (trash.trash_day === todayName) todayEvents.push("🗑️ Trash pickup today");
    if (trash.recycling_day === todayName) todayEvents.push("♻️ Recycling pickup today");
    if (trash.yard_waste_day === todayName) todayEvents.push("🌿 Yard waste pickup today");
  }

  // Check if today is a sprinkler day
  if (sprinkler?.zones) {
    const zones = typeof sprinkler.zones === "string" ? JSON.parse(sprinkler.zones) : sprinkler.zones;
    const wateringToday = zones.some((z: any) => z.waterDays?.includes(todayName));
    if (wateringToday) todayEvents.push("💧 Sprinkler day");
  }

  // Upcoming reminders (next 7 days)
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const upcomingReminders = remindersRes.rows
    .filter((r: any) => new Date(r.next_due_date) <= nextWeek)
    .map((r: any) => ({
      id: r.id,
      type: r.reminder_type,
      title: r.title,
      description: r.description,
      dueDate: r.next_due_date,
      time: r.time,
    }));

  // Bill due dates
  const upcomingBills = billingRes.rows
    .filter((b: any) => b.billing_cycle_day)
    .map((b: any) => {
      const dueDay = b.billing_cycle_day;
      const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay);
      if (dueDate < now) dueDate.setMonth(dueDate.getMonth() + 1);
      return {
        utilityType: b.utility_type,
        provider: b.provider,
        amount: b.avg_monthly_amount,
        dueDate: dueDate.toISOString().split("T")[0],
        autopay: b.autopay_enabled,
      };
    })
    .sort((a: any, b: any) => a.dueDate.localeCompare(b.dueDate));

  // Seasonal sprinkler tip
  const sprinklerTip = getSeasonalSprinklerRecommendation(now.getMonth() + 1, profile?.zip || "32827");

  // Trash reminder for tonight
  const trashReminder = await generateTrashReminder(customerId);

  return {
    customerId,
    date: today,
    dayOfWeek: todayName,
    address: profile ? `${profile.address}, ${profile.city}, ${profile.state} ${profile.zip}` : null,
    todayEvents,
    trashReminder: trashReminder?.message || null,
    upcomingReminders,
    upcomingBills,
    sprinkler: sprinkler ? {
      systemType: sprinkler.system_type,
      rainSensor: sprinkler.rain_sensor_enabled,
      connectedToGeorge: sprinkler.connected_to_george,
      seasonalTip: sprinklerTip.recommendation,
    } : null,
    utilities: profile?.utility_provider || null,
    lastUpdated: now.toISOString(),
  };
}

/**
 * getWeeklyHomeView — 7-day view of all home events
 */
export async function getWeeklyHomeView(customerId: string): Promise<object> {
  const now = new Date();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const [trashRes, remindersRes, sprinklerRes] = await Promise.all([
    pool.query(`SELECT * FROM trash_recycling_schedules WHERE customer_id = $1 LIMIT 1`, [customerId]).catch(() => ({ rows: [] })),
    pool.query(`SELECT * FROM home_reminders WHERE customer_id = $1 AND enabled = true ORDER BY next_due_date ASC`, [customerId]).catch(() => ({ rows: [] })),
    pool.query(`SELECT * FROM sprinkler_settings WHERE customer_id = $1 LIMIT 1`, [customerId]).catch(() => ({ rows: [] })),
  ]);

  const trash = trashRes.rows[0] || null;
  const sprinkler = sprinklerRes.rows[0] || null;
  const zones = sprinkler?.zones ? (typeof sprinkler.zones === "string" ? JSON.parse(sprinkler.zones) : sprinkler.zones) : [];

  const week: any[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dayName = dayNames[d.getDay()];
    const dateStr = d.toISOString().split("T")[0];
    const events: string[] = [];

    if (trash) {
      if (trash.trash_day === dayName) events.push("🗑️ Trash pickup");
      if (trash.recycling_day === dayName) events.push("♻️ Recycling pickup");
      if (trash.yard_waste_day === dayName) events.push("🌿 Yard waste");
    }

    const wateringToday = zones.some((z: any) => z.waterDays?.includes(dayName));
    if (wateringToday) events.push("💧 Sprinklers run");

    // Reminders due this day
    const dayReminders = remindersRes.rows.filter((r: any) => {
      const due = new Date(r.next_due_date).toISOString().split("T")[0];
      return due === dateStr;
    });
    for (const r of dayReminders) {
      events.push(`⏰ ${r.title}`);
    }

    week.push({ date: dateStr, day: dayName, events });
  }

  return { customerId, weekStarting: now.toISOString().split("T")[0], days: week };
}

/**
 * getTonightChecklist — bedtime home checklist
 */
export async function getTonightChecklist(customerId: string): Promise<object> {
  const now = new Date();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const tomorrowName = dayNames[(now.getDay() + 1) % 7];

  const checklist: { item: string; priority: string; done: boolean }[] = [];

  // Check trash
  const trashReminder = await generateTrashReminder(customerId);
  if (trashReminder) {
    checklist.push({ item: trashReminder.message, priority: "high", done: false });
  }

  // Check sprinklers for tomorrow
  const sprinklerRes = await pool.query(
    `SELECT * FROM sprinkler_settings WHERE customer_id = $1 LIMIT 1`,
    [customerId]
  ).catch(() => ({ rows: [] }));

  if (sprinklerRes.rows[0]) {
    const sprinkler = sprinklerRes.rows[0];
    const zones = typeof sprinkler.zones === "string" ? JSON.parse(sprinkler.zones) : (sprinkler.zones || []);
    const wateringTomorrow = zones.some((z: any) => z.waterDays?.includes(tomorrowName));

    if (wateringTomorrow && sprinkler.system_type !== "smart") {
      checklist.push({ item: "💧 Sprinklers scheduled for tomorrow — check rain forecast before they run", priority: "medium", done: false });
    }
  }

  // Standard evening items
  checklist.push({ item: "🔒 Check that doors are locked", priority: "medium", done: false });
  checklist.push({ item: "🚗 Garage door closed", priority: "medium", done: false });

  // Check for any reminders due tonight
  const today = now.toISOString().split("T")[0];
  const reminderRes = await pool.query(
    `SELECT * FROM home_reminders WHERE customer_id = $1 AND enabled = true AND next_due_date = $2`,
    [customerId, today]
  ).catch(() => ({ rows: [] }));

  for (const r of reminderRes.rows) {
    checklist.push({ item: `⏰ ${r.title}: ${r.description || ""}`.trim(), priority: "medium", done: false });
  }

  return {
    customerId,
    date: today,
    title: "🌙 Tonight's Checklist",
    subtitle: "Before bed — here's what George recommends:",
    checklist,
  };
}
