/**
 * Job Costing / Profitability Tracking Service
 */
import { pool } from "../db.js";

const INIT_SQL = `
CREATE TABLE IF NOT EXISTS partner_job_costs (
  id SERIAL PRIMARY KEY,
  partner_slug TEXT NOT NULL,
  job_id TEXT NOT NULL,
  service_type TEXT,
  customer_name TEXT,
  revenue NUMERIC DEFAULT 0,
  labor_cost NUMERIC DEFAULT 0,
  material_cost NUMERIC DEFAULT 0,
  travel_cost NUMERIC DEFAULT 0,
  other_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  profit NUMERIC DEFAULT 0,
  profit_margin NUMERIC DEFAULT 0,
  tech_name TEXT,
  hours_worked NUMERIC DEFAULT 0,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS partner_material_costs (
  id SERIAL PRIMARY KEY,
  job_cost_id INT NOT NULL REFERENCES partner_job_costs(id),
  item_name TEXT NOT NULL,
  quantity INT DEFAULT 1,
  unit_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  supplier TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
`;

let initialized = false;
async function ensureTables() {
  if (initialized) return;
  await pool.query(INIT_SQL);
  initialized = true;
}

export async function recordJobCost(
  partnerSlug: string,
  data: {
    jobId: string;
    serviceType?: string;
    customerName?: string;
    revenue: number;
    laborCost: number;
    materialCost: number;
    travelCost?: number;
    otherCost?: number;
    techName?: string;
    hoursWorked?: number;
  }
) {
  await ensureTables();
  const totalCost = data.laborCost + data.materialCost + (data.travelCost || 0) + (data.otherCost || 0);
  const profit = data.revenue - totalCost;
  const profitMargin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;

  const res = await pool.query(
    `INSERT INTO partner_job_costs
      (partner_slug, job_id, service_type, customer_name, revenue, labor_cost, material_cost, travel_cost, other_cost, total_cost, profit, profit_margin, tech_name, hours_worked, completed_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW()) RETURNING *`,
    [partnerSlug, data.jobId, data.serviceType || null, data.customerName || null,
     data.revenue, data.laborCost, data.materialCost, data.travelCost || 0, data.otherCost || 0,
     totalCost, profit, profitMargin, data.techName || null, data.hoursWorked || 0]
  );
  return res.rows[0];
}

export async function addMaterialCost(
  jobCostId: number,
  itemName: string,
  quantity: number,
  unitCost: number,
  supplier?: string
) {
  await ensureTables();
  const totalCost = quantity * unitCost;
  const res = await pool.query(
    `INSERT INTO partner_material_costs (job_cost_id, item_name, quantity, unit_cost, total_cost, supplier)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [jobCostId, itemName, quantity, unitCost, totalCost, supplier || null]
  );
  // Update material_cost on the parent job
  await pool.query(
    `UPDATE partner_job_costs SET
       material_cost = material_cost + $1,
       total_cost = total_cost + $1,
       profit = profit - $1,
       profit_margin = CASE WHEN revenue > 0 THEN ((profit - $1) / revenue) * 100 ELSE 0 END
     WHERE id = $2`,
    [totalCost, jobCostId]
  );
  return res.rows[0];
}

export async function getJobProfitability(partnerSlug: string, jobId: string) {
  await ensureTables();
  const jobRes = await pool.query(
    `SELECT * FROM partner_job_costs WHERE partner_slug = $1 AND job_id = $2`,
    [partnerSlug, jobId]
  );
  if (jobRes.rows.length === 0) return null;
  const job = jobRes.rows[0];
  const matsRes = await pool.query(
    `SELECT * FROM partner_material_costs WHERE job_cost_id = $1 ORDER BY created_at`,
    [job.id]
  );
  return { ...job, materials: matsRes.rows };
}

export async function getProfitabilityReport(
  partnerSlug: string,
  dateRange?: { start: string; end: string }
) {
  await ensureTables();
  let dateFilter = "";
  const params: any[] = [partnerSlug];
  if (dateRange) {
    dateFilter = " AND completed_at >= $2 AND completed_at <= $3";
    params.push(dateRange.start, dateRange.end);
  }

  const avgByType = await pool.query(
    `SELECT service_type, COUNT(*) as job_count, ROUND(AVG(profit_margin)::numeric,2) as avg_margin,
       ROUND(SUM(revenue)::numeric,2) as total_revenue, ROUND(SUM(profit)::numeric,2) as total_profit
     FROM partner_job_costs WHERE partner_slug = $1${dateFilter}
     GROUP BY service_type ORDER BY avg_margin DESC`,
    params
  );

  const best = await pool.query(
    `SELECT job_id, customer_name, service_type, revenue, profit, profit_margin
     FROM partner_job_costs WHERE partner_slug = $1${dateFilter}
     ORDER BY profit DESC LIMIT 5`,
    params
  );

  const worst = await pool.query(
    `SELECT job_id, customer_name, service_type, revenue, profit, profit_margin
     FROM partner_job_costs WHERE partner_slug = $1${dateFilter}
     ORDER BY profit ASC LIMIT 5`,
    params
  );

  return {
    byServiceType: avgByType.rows,
    bestJobs: best.rows,
    worstJobs: worst.rows,
  };
}

export async function getServiceTypeProfitability(partnerSlug: string) {
  await ensureTables();
  const res = await pool.query(
    `SELECT service_type, COUNT(*) as job_count,
       ROUND(AVG(revenue)::numeric,2) as avg_revenue,
       ROUND(AVG(total_cost)::numeric,2) as avg_cost,
       ROUND(AVG(profit)::numeric,2) as avg_profit,
       ROUND(AVG(profit_margin)::numeric,2) as avg_margin,
       ROUND(SUM(revenue)::numeric,2) as total_revenue,
       ROUND(SUM(profit)::numeric,2) as total_profit
     FROM partner_job_costs WHERE partner_slug = $1
     GROUP BY service_type ORDER BY total_profit DESC`,
    [partnerSlug]
  );
  return res.rows;
}

export async function getTechProfitability(partnerSlug: string) {
  await ensureTables();
  const res = await pool.query(
    `SELECT tech_name, COUNT(*) as job_count,
       ROUND(SUM(revenue)::numeric,2) as total_revenue,
       ROUND(SUM(profit)::numeric,2) as total_profit,
       ROUND(AVG(profit_margin)::numeric,2) as avg_margin,
       ROUND(SUM(hours_worked)::numeric,2) as total_hours,
       ROUND((SUM(revenue) / NULLIF(SUM(hours_worked),0))::numeric,2) as revenue_per_hour
     FROM partner_job_costs WHERE partner_slug = $1 AND tech_name IS NOT NULL
     GROUP BY tech_name ORDER BY total_revenue DESC`,
    [partnerSlug]
  );
  return res.rows;
}

export async function getMaterialSpendReport(
  partnerSlug: string,
  dateRange?: { start: string; end: string }
) {
  await ensureTables();
  let dateFilter = "";
  const params: any[] = [partnerSlug];
  if (dateRange) {
    dateFilter = " AND mc.created_at >= $2 AND mc.created_at <= $3";
    params.push(dateRange.start, dateRange.end);
  }

  const topMaterials = await pool.query(
    `SELECT mc.item_name, SUM(mc.quantity) as total_qty, ROUND(SUM(mc.total_cost)::numeric,2) as total_spend
     FROM partner_material_costs mc
     JOIN partner_job_costs jc ON jc.id = mc.job_cost_id
     WHERE jc.partner_slug = $1${dateFilter}
     GROUP BY mc.item_name ORDER BY total_spend DESC LIMIT 20`,
    params
  );

  const topSuppliers = await pool.query(
    `SELECT mc.supplier, COUNT(DISTINCT mc.id) as item_count, ROUND(SUM(mc.total_cost)::numeric,2) as total_spend
     FROM partner_material_costs mc
     JOIN partner_job_costs jc ON jc.id = mc.job_cost_id
     WHERE jc.partner_slug = $1 AND mc.supplier IS NOT NULL${dateFilter}
     GROUP BY mc.supplier ORDER BY total_spend DESC LIMIT 10`,
    params
  );

  return { topMaterials: topMaterials.rows, topSuppliers: topSuppliers.rows };
}

export async function getDashboardSummary(partnerSlug: string) {
  await ensureTables();
  const res = await pool.query(
    `SELECT COUNT(*) as job_count,
       ROUND(COALESCE(SUM(revenue),0)::numeric,2) as total_revenue,
       ROUND(COALESCE(SUM(total_cost),0)::numeric,2) as total_cost,
       ROUND(COALESCE(SUM(profit),0)::numeric,2) as total_profit,
       ROUND(COALESCE(AVG(profit_margin),0)::numeric,2) as avg_margin,
       ROUND(COALESCE(AVG(revenue),0)::numeric,2) as avg_job_revenue,
       ROUND(COALESCE(SUM(hours_worked),0)::numeric,2) as total_hours
     FROM partner_job_costs WHERE partner_slug = $1`,
    [partnerSlug]
  );
  return res.rows[0];
}
