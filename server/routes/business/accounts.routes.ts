/**
 * Business Account & Recurring Job Routes
 *
 * Endpoints consumed by client/src/pages/business-dashboard.tsx:
 *   GET    /api/business-accounts/:userId  - get account + recurring jobs by userId
 *   POST   /api/business-accounts          - create business account
 *   POST   /api/recurring-jobs             - create recurring job
 *   PATCH  /api/recurring-jobs/:id         - update recurring job (toggle active, etc.)
 */

import { Router } from "express";
import { BusinessAccountsStorage } from "../../storage/domains/business-accounts/storage";
import { requireAuth } from "../../middleware/auth";
import { pool } from "../../db";

const router = Router();
const store = new BusinessAccountsStorage();

// Ensure B2B tables exist
pool.query(`
  CREATE TABLE IF NOT EXISTS b2b_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL,
    period TEXT NOT NULL DEFAULT 'monthly',
    budget_amount REAL NOT NULL,
    category TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS w2_crews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL,
    crew_name TEXT NOT NULL,
    crew_lead_user_id TEXT,
    members JSONB DEFAULT '[]',
    service_specialties TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS w2_time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crew_id TEXT NOT NULL,
    member_user_id TEXT,
    job_id TEXT,
    clock_in TIMESTAMP DEFAULT NOW(),
    clock_out TIMESTAMP,
    hours_worked REAL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS crew_property_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crew_id TEXT NOT NULL,
    property_id TEXT NOT NULL,
    assignment_type TEXT DEFAULT 'primary',
    assigned_date TIMESTAMP DEFAULT NOW(),
    notes TEXT,
    is_active BOOLEAN DEFAULT true
  );
`).catch((e: any) => console.log("[B2B Tables] Init:", e.message));

// GET /api/business-accounts/:userId - dashboard initial load
router.get("/:userId", requireAuth, async (req, res) => {
  try {
    // Verify the authenticated user matches the requested userId
    const authUserId = (req.user as any)?.userId || (req.user as any)?.id;
    if (authUserId && req.params.userId !== authUserId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const account = await store.getBusinessAccountByUser(req.params.userId);
    if (!account) {
      return res.status(404).json({ error: "Business account not found" });
    }
    const recurringJobs = await store.getRecurringJobsByBusinessAccount(account.id);
    res.json({ account, recurringJobs });
  } catch (error) {
    console.error("Error fetching business account:", error);
    res.status(500).json({ error: "Failed to fetch business account" });
  }
});

// POST /api/business-accounts - create new business account
router.post("/", requireAuth, async (req, res) => {
  try {
    const account = await store.createBusinessAccount(req.body);

    // Fire-and-forget: B2B welcome email
    if (req.body.email || req.body.contactEmail) {
      import("../../services/email-service").then(({ sendB2BWelcome }) => {
        sendB2BWelcome(req.body.email || req.body.contactEmail, account).catch(err => console.error('[EMAIL] Failed b2b-welcome:', err.message));
      }).catch(() => {});
    }

    res.status(201).json(account);
  } catch (error) {
    console.error("Error creating business account:", error);
    res.status(500).json({ error: "Failed to create business account" });
  }
});

// ─── Budget Endpoints ──────────────────────────────────────────────────────

// POST /api/business-accounts/../budgets → mounted at /api/business/budgets
router.post("/budgets", requireAuth, async (req, res) => {
  try {
    const { businessId, budgetAmount, period, category } = req.body;
    if (!businessId || !budgetAmount) return res.status(400).json({ error: "businessId and budgetAmount required" });
    const result = await pool.query(
      `INSERT INTO b2b_budgets (business_id, budget_amount, period, category) VALUES ($1, $2, $3, $4) RETURNING *`,
      [businessId, budgetAmount, period || "monthly", category || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Note: budget-report is registered via the business index as /api/business/budget-report/:businessId
router.get("/budget-report/:businessId", requireAuth, async (req, res) => {
  try {
    const { businessId } = req.params;
    const budgets = await pool.query(`SELECT * FROM b2b_budgets WHERE business_id = $1 ORDER BY created_at DESC`, [businessId]);
    const totalBudget = budgets.rows.reduce((s: number, b: any) => s + (b.budget_amount || 0), 0);

    // Get actual spend from completed service requests
    let totalSpent = 0;
    try {
      const spend = await pool.query(
        `SELECT COALESCE(SUM(COALESCE(final_price, price_estimate, 0)), 0) as total
         FROM service_requests sr
         JOIN business_accounts ba ON ba.user_id = sr.customer_id::text
         WHERE ba.id = $1 AND sr.status = 'completed'`, [businessId]
      );
      totalSpent = Number(spend.rows[0]?.total || 0);
    } catch { totalSpent = 0; }

    res.json({ budgets: budgets.rows, totalBudget, totalSpent });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// [Feature 7] Budget forecast with FL seasonal multipliers
router.get("/budget-forecast/:businessId", requireAuth, async (req, res) => {
  try {
    const { businessId } = req.params;
    // Florida seasonal multipliers
    const seasonalMultipliers: Record<number, { mult: number; note: string }> = {
      0: { mult: 0.7, note: "Winter - lowest" }, 1: { mult: 0.75, note: "Winter" },
      2: { mult: 1.1, note: "Spring - landscaping + pool" }, 3: { mult: 1.2, note: "Spring" },
      4: { mult: 1.3, note: "Summer - AC + hurricane prep" }, 5: { mult: 1.4, note: "Peak summer" },
      6: { mult: 1.35, note: "Hurricane season" }, 7: { mult: 1.3, note: "Hurricane season" },
      8: { mult: 1.15, note: "Fall - gutter + pressure washing" }, 9: { mult: 1.0, note: "Fall" },
      10: { mult: 0.85, note: "Late fall" }, 11: { mult: 0.7, note: "Winter" },
    };

    // Get historical monthly average
    let monthlyAvg = 0;
    try {
      const hist = await pool.query(
        `SELECT COALESCE(AVG(monthly_total), 0) as avg FROM (
           SELECT DATE_TRUNC('month', completed_at) as m, SUM(COALESCE(final_price, price_estimate, 0)) as monthly_total
           FROM service_requests sr
           JOIN business_accounts ba ON ba.user_id = sr.customer_id::text
           WHERE ba.id = $1 AND sr.status = 'completed' AND sr.completed_at > NOW() - INTERVAL '12 months'
           GROUP BY m
         ) sub`, [businessId]
      );
      monthlyAvg = Number(hist.rows[0]?.avg || 0);
    } catch { monthlyAvg = 5000; }

    if (monthlyAvg === 0) monthlyAvg = 5000; // fallback

    // Factor in recurring job schedules
    let recurringMonthly = 0;
    try {
      const recurring = await pool.query(
        `SELECT COUNT(*) as cnt FROM recurring_job_schedules WHERE business_id = $1 AND is_active = true`, [businessId]
      );
      recurringMonthly = Number(recurring.rows[0]?.cnt || 0) * 150; // estimate $150 per recurring job
    } catch {}

    const baseMonthly = monthlyAvg + recurringMonthly;
    const now = new Date();
    const forecast = [];
    let maxProjected = 0;
    for (let i = 1; i <= 12; i++) {
      const futureMonth = (now.getMonth() + i) % 12;
      const futureYear = now.getFullYear() + Math.floor((now.getMonth() + i) / 12);
      const { mult, note } = seasonalMultipliers[futureMonth];
      const projected = Math.round(baseMonthly * mult);
      if (projected > maxProjected) maxProjected = projected;
      const monthName = new Date(futureYear, futureMonth, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
      forecast.push({ month: monthName, projected, seasonalNote: note });
    }

    res.json({
      forecast,
      maxProjected,
      baseMonthlyAvg: Math.round(baseMonthly),
      recurringJobContribution: recurringMonthly,
      seasonalNote: "Projections adjusted for Central Florida seasonal patterns",
    });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── [Feature 4] Crew Management Endpoints ─────────────────────────────────

router.post("/crews", requireAuth, async (req, res) => {
  try {
    const { businessId, crewName, crewLeadUserId, members, serviceSpecialties } = req.body;
    if (!businessId || !crewName) return res.status(400).json({ error: "businessId and crewName required" });
    const result = await pool.query(
      `INSERT INTO w2_crews (business_id, crew_name, crew_lead_user_id, members, service_specialties)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [businessId, crewName, crewLeadUserId || null, JSON.stringify(members || []), serviceSpecialties || []]
    );
    res.status(201).json(result.rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/crews/:businessId", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM w2_crews WHERE business_id = $1 ORDER BY created_at DESC`, [req.params.businessId]);
    res.json(result.rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.patch("/crews/:crewId", requireAuth, async (req, res) => {
  try {
    const { crewName, crewLeadUserId, members, serviceSpecialties, isActive } = req.body;
    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    if (crewName !== undefined) { sets.push(`crew_name = $${idx++}`); vals.push(crewName); }
    if (crewLeadUserId !== undefined) { sets.push(`crew_lead_user_id = $${idx++}`); vals.push(crewLeadUserId); }
    if (members !== undefined) { sets.push(`members = $${idx++}`); vals.push(JSON.stringify(members)); }
    if (serviceSpecialties !== undefined) { sets.push(`service_specialties = $${idx++}`); vals.push(serviceSpecialties); }
    if (isActive !== undefined) { sets.push(`is_active = $${idx++}`); vals.push(isActive); }
    if (sets.length === 0) return res.status(400).json({ error: "No fields to update" });
    vals.push(req.params.crewId);
    const result = await pool.query(`UPDATE w2_crews SET ${sets.join(", ")} WHERE id = $${idx} RETURNING *`, vals);
    res.json(result.rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// Time entries
router.post("/crews/clock-in", requireAuth, async (req, res) => {
  try {
    const { crewId, memberUserId, jobId, notes } = req.body;
    if (!crewId) return res.status(400).json({ error: "crewId required" });
    const result = await pool.query(
      `INSERT INTO w2_time_entries (crew_id, member_user_id, job_id, notes) VALUES ($1, $2, $3, $4) RETURNING *`,
      [crewId, memberUserId || null, jobId || null, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/crews/clock-out", requireAuth, async (req, res) => {
  try {
    const { timeEntryId } = req.body;
    if (!timeEntryId) return res.status(400).json({ error: "timeEntryId required" });
    const result = await pool.query(
      `UPDATE w2_time_entries SET clock_out = NOW(), hours_worked = EXTRACT(EPOCH FROM (NOW() - clock_in)) / 3600.0
       WHERE id = $1 RETURNING *`, [timeEntryId]
    );
    res.json(result.rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/crews/time-report/:businessId", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COALESCE(SUM(te.hours_worked), 0) as total_hours,
             COUNT(te.id) as total_entries,
             COUNT(te.id) FILTER (WHERE te.clock_out IS NULL) as active_clock_ins
      FROM w2_time_entries te
      JOIN w2_crews c ON te.crew_id = c.id
      WHERE c.business_id = $1
    `, [req.params.businessId]);
    const row = result.rows[0] || {};
    res.json({ totalHours: Number(row.total_hours || 0), totalEntries: Number(row.total_entries || 0), activeClockIns: Number(row.active_clock_ins || 0) });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ─── [Feature 5] Crew-Property Assignments ─────────────────────────────────

router.post("/crew-assignments", requireAuth, async (req, res) => {
  try {
    const { crewId, propertyId, assignmentType, notes } = req.body;
    if (!crewId || !propertyId) return res.status(400).json({ error: "crewId and propertyId required" });
    const result = await pool.query(
      `INSERT INTO crew_property_assignments (crew_id, property_id, assignment_type, notes) VALUES ($1, $2, $3, $4) RETURNING *`,
      [crewId, propertyId, assignmentType || "primary", notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/crew-assignments/:crewId", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT cpa.*, cp.address, cp.city FROM crew_property_assignments cpa
       LEFT JOIN b2b_contract_properties cp ON cpa.property_id = cp.id
       WHERE cpa.crew_id = $1 AND cpa.is_active = true`, [req.params.crewId]
    );
    res.json(result.rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/crew-assignments/:id", requireAuth, async (req, res) => {
  try {
    await pool.query(`UPDATE crew_property_assignments SET is_active = false WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

export default router;
