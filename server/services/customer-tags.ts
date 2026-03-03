/**
 * Customer Tagging, Segmentation, and Pipeline Management Service
 */
import { pool } from "../db.js";

const INIT_SQL = `
CREATE TABLE IF NOT EXISTS partner_customer_tags (
  id SERIAL PRIMARY KEY,
  partner_slug TEXT NOT NULL,
  tag_name TEXT NOT NULL,
  tag_color TEXT DEFAULT '#3B82F6',
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS partner_customer_tag_assignments (
  id SERIAL PRIMARY KEY,
  partner_slug TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  tag_id INT NOT NULL REFERENCES partner_customer_tags(id),
  assigned_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS partner_pipeline_stages (
  id SERIAL PRIMARY KEY,
  partner_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  color TEXT DEFAULT '#6366F1',
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS partner_pipeline_deals (
  id SERIAL PRIMARY KEY,
  partner_slug TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  stage_id INT NOT NULL REFERENCES partner_pipeline_stages(id),
  value NUMERIC DEFAULT 0,
  service_type TEXT,
  notes TEXT,
  assigned_to TEXT,
  expected_close_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
`;

let initialized = false;
async function ensureTables() {
  if (initialized) return;
  await pool.query(INIT_SQL);
  initialized = true;
}

// --- Tags ---

export async function createTag(partnerSlug: string, tagName: string, tagColor: string, description?: string) {
  await ensureTables();
  const res = await pool.query(
    `INSERT INTO partner_customer_tags (partner_slug, tag_name, tag_color, description) VALUES ($1,$2,$3,$4) RETURNING *`,
    [partnerSlug, tagName, tagColor, description || null]
  );
  return res.rows[0];
}

export async function listTags(partnerSlug: string) {
  await ensureTables();
  const res = await pool.query(
    `SELECT t.*, COUNT(a.id)::int as customer_count
     FROM partner_customer_tags t
     LEFT JOIN partner_customer_tag_assignments a ON a.tag_id = t.id
     WHERE t.partner_slug = $1
     GROUP BY t.id ORDER BY t.tag_name`,
    [partnerSlug]
  );
  return res.rows;
}

export async function tagCustomer(partnerSlug: string, customerId: string, customerName: string, customerEmail: string, tagId: number) {
  await ensureTables();
  // Avoid duplicates
  const existing = await pool.query(
    `SELECT id FROM partner_customer_tag_assignments WHERE customer_id = $1 AND tag_id = $2`,
    [customerId, tagId]
  );
  if (existing.rows.length > 0) return existing.rows[0];
  const res = await pool.query(
    `INSERT INTO partner_customer_tag_assignments (partner_slug, customer_id, customer_name, customer_email, tag_id) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [partnerSlug, customerId, customerName, customerEmail, tagId]
  );
  return res.rows[0];
}

export async function removeTagFromCustomer(customerId: string, tagId: number) {
  await ensureTables();
  await pool.query(`DELETE FROM partner_customer_tag_assignments WHERE customer_id = $1 AND tag_id = $2`, [customerId, tagId]);
  return { success: true };
}

export async function getCustomersByTag(partnerSlug: string, tagId: number) {
  await ensureTables();
  const res = await pool.query(
    `SELECT customer_id, customer_name, customer_email, assigned_at
     FROM partner_customer_tag_assignments WHERE partner_slug = $1 AND tag_id = $2 ORDER BY assigned_at DESC`,
    [partnerSlug, tagId]
  );
  return res.rows;
}

export async function getCustomerTags(customerId: string) {
  await ensureTables();
  const res = await pool.query(
    `SELECT t.* FROM partner_customer_tags t
     JOIN partner_customer_tag_assignments a ON a.tag_id = t.id
     WHERE a.customer_id = $1 ORDER BY t.tag_name`,
    [customerId]
  );
  return res.rows;
}

// --- Pipeline ---

export async function createPipelineStage(partnerSlug: string, name: string, position: number, color: string) {
  await ensureTables();
  const res = await pool.query(
    `INSERT INTO partner_pipeline_stages (partner_slug, name, position, color) VALUES ($1,$2,$3,$4) RETURNING *`,
    [partnerSlug, name, position, color]
  );
  return res.rows[0];
}

export async function listPipelineStages(partnerSlug: string) {
  await ensureTables();
  const res = await pool.query(
    `SELECT * FROM partner_pipeline_stages WHERE partner_slug = $1 ORDER BY position`,
    [partnerSlug]
  );
  return res.rows;
}

export async function createDeal(
  partnerSlug: string,
  data: { customerName: string; customerEmail?: string; customerPhone?: string; stageId: number; value: number; serviceType?: string; notes?: string; assignedTo?: string; expectedCloseDate?: string }
) {
  await ensureTables();
  const res = await pool.query(
    `INSERT INTO partner_pipeline_deals (partner_slug, customer_name, customer_email, customer_phone, stage_id, value, service_type, notes, assigned_to, expected_close_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [partnerSlug, data.customerName, data.customerEmail || null, data.customerPhone || null,
     data.stageId, data.value, data.serviceType || null, data.notes || null, data.assignedTo || null, data.expectedCloseDate || null]
  );
  return res.rows[0];
}

export async function moveDeal(dealId: number, newStageId: number) {
  await ensureTables();
  const res = await pool.query(
    `UPDATE partner_pipeline_deals SET stage_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [newStageId, dealId]
  );
  return res.rows[0];
}

export async function updateDeal(dealId: number, updates: Partial<{ customerName: string; customerEmail: string; customerPhone: string; stageId: number; value: number; serviceType: string; notes: string; assignedTo: string; expectedCloseDate: string }>) {
  await ensureTables();
  const sets: string[] = [];
  const params: any[] = [];
  let i = 1;
  const mapping: Record<string, string> = {
    customerName: "customer_name", customerEmail: "customer_email", customerPhone: "customer_phone",
    stageId: "stage_id", value: "value", serviceType: "service_type", notes: "notes",
    assignedTo: "assigned_to", expectedCloseDate: "expected_close_date",
  };
  for (const [key, col] of Object.entries(mapping)) {
    if ((updates as any)[key] !== undefined) {
      sets.push(`${col} = $${i++}`);
      params.push((updates as any)[key]);
    }
  }
  if (sets.length === 0) return null;
  sets.push("updated_at = NOW()");
  params.push(dealId);
  const res = await pool.query(
    `UPDATE partner_pipeline_deals SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
    params
  );
  return res.rows[0];
}

export async function getPipelineView(partnerSlug: string) {
  await ensureTables();
  const stages = await pool.query(
    `SELECT * FROM partner_pipeline_stages WHERE partner_slug = $1 ORDER BY position`,
    [partnerSlug]
  );
  const deals = await pool.query(
    `SELECT * FROM partner_pipeline_deals WHERE partner_slug = $1 ORDER BY created_at DESC`,
    [partnerSlug]
  );
  return stages.rows.map((stage: any) => ({
    ...stage,
    deals: deals.rows.filter((d: any) => d.stage_id === stage.id),
    totalValue: deals.rows.filter((d: any) => d.stage_id === stage.id).reduce((sum: number, d: any) => sum + parseFloat(d.value || 0), 0),
  }));
}

export async function getDealsByStage(partnerSlug: string, stageId: number) {
  await ensureTables();
  const res = await pool.query(
    `SELECT * FROM partner_pipeline_deals WHERE partner_slug = $1 AND stage_id = $2 ORDER BY created_at DESC`,
    [partnerSlug, stageId]
  );
  return res.rows;
}

export async function getPipelineStats(partnerSlug: string) {
  await ensureTables();
  const totals = await pool.query(
    `SELECT COUNT(*)::int as total_deals, ROUND(COALESCE(SUM(value),0)::numeric,2) as total_value,
       ROUND(COALESCE(AVG(value),0)::numeric,2) as avg_deal_size
     FROM partner_pipeline_deals WHERE partner_slug = $1`,
    [partnerSlug]
  );

  const byStage = await pool.query(
    `SELECT s.name, s.position, COUNT(d.id)::int as deal_count,
       ROUND(COALESCE(SUM(d.value),0)::numeric,2) as stage_value,
       ROUND(COALESCE(AVG(EXTRACT(EPOCH FROM (NOW() - d.created_at)) / 86400),0)::numeric,1) as avg_days_in_stage
     FROM partner_pipeline_stages s
     LEFT JOIN partner_pipeline_deals d ON d.stage_id = s.id
     WHERE s.partner_slug = $1
     GROUP BY s.id, s.name, s.position ORDER BY s.position`,
    [partnerSlug]
  );

  // Conversion rate: deals in last stage / total deals
  const stages = await pool.query(
    `SELECT id FROM partner_pipeline_stages WHERE partner_slug = $1 ORDER BY position DESC LIMIT 1`,
    [partnerSlug]
  );
  let conversionRate = 0;
  if (stages.rows.length > 0) {
    const closedCount = await pool.query(
      `SELECT COUNT(*)::int as c FROM partner_pipeline_deals WHERE partner_slug = $1 AND stage_id = $2`,
      [partnerSlug, stages.rows[0].id]
    );
    const totalDeals = parseInt(totals.rows[0]?.total_deals || "0");
    if (totalDeals > 0) conversionRate = Math.round((closedCount.rows[0].c / totalDeals) * 100);
  }

  return {
    ...totals.rows[0],
    conversionRate,
    byStage: byStage.rows,
  };
}
