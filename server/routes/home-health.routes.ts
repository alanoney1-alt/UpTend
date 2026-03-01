/**
 * Home Health Routes
 * Health score, maintenance calendar, overdue tracking
 */
import type { Express, Request, Response } from "express";
import { pool } from "../db";
import { nanoid } from "nanoid";

function getUserId(req: Request): string | null {
  if (!req.isAuthenticated?.() || !req.user) return null;
  return (req.user as any).userId || (req.user as any).id;
}

interface MaintenanceItem {
  id: string;
  service: string;
  label: string;
  frequency: string;
  intervalDays: number;
  deduction: number;
  lastCompleted: string | null;
  nextDue: string;
  status: "on_time" | "due_soon" | "overdue";
  seasonal?: string;
}

const ORLANDO_TEMPLATE: Omit<MaintenanceItem, "id" | "lastCompleted" | "nextDue" | "status">[] = [
  { service: "gutter_cleaning", label: "Gutter Cleaning", frequency: "Quarterly", intervalDays: 90, deduction: 5 },
  { service: "pressure_washing", label: "Pressure Washing", frequency: "Every 6 Months", intervalDays: 180, deduction: 3 },
  { service: "pool_cleaning", label: "Pool Service", frequency: "Monthly", intervalDays: 30, deduction: 8 },
  { service: "landscaping", label: "Landscaping", frequency: "Biweekly (Warm) / Monthly (Cool)", intervalDays: 14, deduction: 4, seasonal: "warm_biweekly" },
  { service: "hvac_filter", label: "HVAC Filter Change", frequency: "Monthly", intervalDays: 30, deduction: 2 },
  { service: "carpet_cleaning", label: "Carpet Deep Clean", frequency: "Annual", intervalDays: 365, deduction: 2 },
];

function computeScore(items: MaintenanceItem[]): { score: number; consecutiveOnTime: number } {
  let score = 100;
  let consecutiveOnTime = 0;

  for (const item of items) {
    if (item.status === "overdue") {
      const now = new Date();
      const due = new Date(item.nextDue);
      const overdueDays = Math.floor((now.getTime() - due.getTime()) / 86400000);
      const periods = Math.max(1, Math.ceil(overdueDays / item.intervalDays));
      score -= item.deduction * periods;
    }
    if (item.status === "on_time" && item.lastCompleted) {
      consecutiveOnTime++;
    }
  }

  // Bonus for 3+ consecutive on-time
  if (consecutiveOnTime >= 3) score += 5;
  return { score: Math.max(0, Math.min(100, score)), consecutiveOnTime };
}

export function registerHomeHealthRoutes(app: Express) {
  // GET /api/home-health/score
  app.get("/api/home-health/score", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    const items = await getMaintenanceItems(userId);
    const { score, consecutiveOnTime } = computeScore(items);
    const overdueCount = items.filter(i => i.status === "overdue").length;
    const dueSoonCount = items.filter(i => i.status === "due_soon").length;

    res.json({
      score,
      grade: score >= 80 ? "Excellent" : score >= 50 ? "Needs Attention" : "Critical",
      overdueCount,
      dueSoonCount,
      consecutiveOnTime,
      bonusApplied: consecutiveOnTime >= 3,
      items
    });
  });

  // GET /api/home-health/calendar
  app.get("/api/home-health/calendar", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    const items = await getMaintenanceItems(userId);
    const calendar: any[] = [];
    const now = new Date();

    for (const item of items) {
      // Generate next 12 months of events
      let nextDate = new Date(item.nextDue);
      for (let i = 0; i < 12; i++) {
        if (nextDate > new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())) break;

        // Adjust landscaping for season
        let intervalDays = item.intervalDays;
        if (item.seasonal === "warm_biweekly") {
          const month = nextDate.getMonth();
          intervalDays = (month >= 3 && month <= 10) ? 14 : 30;
        }

        calendar.push({
          service: item.service,
          label: item.label,
          date: nextDate.toISOString().split('T')[0],
          status: nextDate < now ? "overdue" : "scheduled",
          estimatedCost: getEstCost(item.service)
        });

        nextDate = new Date(nextDate.getTime() + intervalDays * 86400000);
      }
    }

    calendar.sort((a, b) => a.date.localeCompare(b.date));
    res.json({ calendar, totalEstimatedAnnual: calendar.reduce((s, c) => s + c.estimatedCost, 0) });
  });

  // GET /api/home-health/overdue
  app.get("/api/home-health/overdue", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    const items = await getMaintenanceItems(userId);
    const overdue = items.filter(i => i.status === "overdue").map(i => ({
      ...i,
      estimatedCost: getEstCost(i.service),
      daysOverdue: Math.floor((Date.now() - new Date(i.nextDue).getTime()) / 86400000),
      healthImpact: `${i.deduction} points per period`
    }));

    res.json({ overdue, totalCostToFix: overdue.reduce((s, o) => s + o.estimatedCost, 0) });
  });

  // POST /api/home-health/dismiss/:item
  app.post("/api/home-health/dismiss/:item", async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Authentication required" });

    // Mark as dismissed (store in scheduling_preferences or a dedicated table)
    try {
      await pool.query(
        `INSERT INTO scheduling_preferences (id, customer_id, blackout_dates)
         VALUES ($1, $2, $3)
         ON CONFLICT (customer_id) DO UPDATE SET
         blackout_dates = COALESCE(scheduling_preferences.blackout_dates, '[]'::jsonb) || $3`,
        [nanoid(12), userId, JSON.stringify([{ dismissed: req.params.item, at: new Date().toISOString() }])]
      );
    } catch (err) {
      // Table might not exist yet, that's fine
    }

    res.json({ success: true, dismissed: req.params.item });
  });
}

async function getMaintenanceItems(userId: string): Promise<MaintenanceItem[]> {
  // Get last completed dates from service_requests
  let lastCompletedMap = new Map<string, string>();
  try {
    const { rows } = await pool.query(
      `SELECT service_type, MAX(completed_at) as last_done 
       FROM service_requests WHERE customer_id = $1 AND status = 'completed'
       GROUP BY service_type`, [userId]
    );
    for (const r of rows) {
      lastCompletedMap.set(r.service_type, r.last_done);
    }
  } catch {
    // Fallback - no history
  }

  const now = new Date();
  return ORLANDO_TEMPLATE.map((t, i) => {
    const lastCompleted = lastCompletedMap.get(t.service) || null;
    let nextDue: Date;
    if (lastCompleted) {
      nextDue = new Date(new Date(lastCompleted).getTime() + t.intervalDays * 86400000);
    } else {
      // Default: assume it's been a while
      nextDue = new Date(now.getTime() - (t.intervalDays * 0.5) * 86400000);
    }

    const status: MaintenanceItem["status"] = nextDue < now ? "overdue" :
      (nextDue.getTime() - now.getTime()) < 7 * 86400000 ? "due_soon" : "on_time";

    return {
      id: `maint-${i}`,
      ...t,
      lastCompleted: lastCompleted ? new Date(lastCompleted).toISOString() : null,
      nextDue: nextDue.toISOString().split('T')[0],
      status
    };
  });
}

function getEstCost(service: string): number {
  const costs: Record<string, number> = {
    gutter_cleaning: 150, pressure_washing: 200, pool_cleaning: 120,
    landscaping: 85, hvac_filter: 45, carpet_cleaning: 180
  };
  return costs[service] || 100;
}
