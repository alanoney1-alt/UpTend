/**
 * Digital Forms, Checklists, and Inspection Templates Service
 */
import { pool } from "../db.js";

const INIT_SQL = `
DO $$ BEGIN
  CREATE TYPE form_type_enum AS ENUM ('inspection','safety','checklist','intake','closeout');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE form_required_enum AS ENUM ('job_start','job_end','none');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE form_status_enum AS ENUM ('draft','submitted','reviewed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS partner_form_templates (
  id SERIAL PRIMARY KEY,
  partner_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  form_type form_type_enum NOT NULL DEFAULT 'checklist',
  fields JSONB NOT NULL DEFAULT '[]',
  required_before form_required_enum DEFAULT 'none',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS partner_form_submissions (
  id SERIAL PRIMARY KEY,
  template_id INT NOT NULL REFERENCES partner_form_templates(id),
  partner_slug TEXT NOT NULL,
  job_id TEXT,
  tech_name TEXT,
  customer_name TEXT,
  responses JSONB NOT NULL DEFAULT '{}',
  photos JSONB DEFAULT '[]',
  signature_id TEXT,
  status form_status_enum DEFAULT 'draft',
  submitted_at TIMESTAMP,
  reviewed_by TEXT,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
`;

let initialized = false;
async function ensureTables() {
  if (initialized) return;
  await pool.query(INIT_SQL);
  initialized = true;
}

export interface FormField {
  label: string;
  type: "text" | "number" | "checkbox" | "select" | "photo" | "signature" | "textarea";
  options?: string[];
  required?: boolean;
}

export async function createFormTemplate(
  partnerSlug: string,
  name: string,
  description: string,
  formType: string,
  fields: FormField[],
  requiredBefore?: string
) {
  await ensureTables();
  const res = await pool.query(
    `INSERT INTO partner_form_templates (partner_slug, name, description, form_type, fields, required_before)
     VALUES ($1,$2,$3,$4,$5::jsonb,$6) RETURNING *`,
    [partnerSlug, name, description, formType, JSON.stringify(fields), requiredBefore || "none"]
  );
  return res.rows[0];
}

export async function listFormTemplates(partnerSlug: string, formType?: string) {
  await ensureTables();
  if (formType) {
    const res = await pool.query(
      `SELECT * FROM partner_form_templates WHERE partner_slug = $1 AND form_type = $2 AND active = true ORDER BY created_at DESC`,
      [partnerSlug, formType]
    );
    return res.rows;
  }
  const res = await pool.query(
    `SELECT * FROM partner_form_templates WHERE partner_slug = $1 AND active = true ORDER BY created_at DESC`,
    [partnerSlug]
  );
  return res.rows;
}

export async function updateFormTemplate(templateId: number, updates: Partial<{ name: string; description: string; formType: string; fields: FormField[]; requiredBefore: string }>) {
  await ensureTables();
  const sets: string[] = [];
  const params: any[] = [];
  let i = 1;
  if (updates.name) { sets.push(`name = $${i++}`); params.push(updates.name); }
  if (updates.description !== undefined) { sets.push(`description = $${i++}`); params.push(updates.description); }
  if (updates.formType) { sets.push(`form_type = $${i++}`); params.push(updates.formType); }
  if (updates.fields) { sets.push(`fields = $${i++}::jsonb`); params.push(JSON.stringify(updates.fields)); }
  if (updates.requiredBefore) { sets.push(`required_before = $${i++}`); params.push(updates.requiredBefore); }
  if (sets.length === 0) return null;
  sets.push(`updated_at = NOW()`);
  params.push(templateId);
  const res = await pool.query(
    `UPDATE partner_form_templates SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
    params
  );
  return res.rows[0];
}

export async function deactivateFormTemplate(templateId: number) {
  await ensureTables();
  const res = await pool.query(
    `UPDATE partner_form_templates SET active = false, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [templateId]
  );
  return res.rows[0];
}

export async function submitForm(
  templateId: number,
  partnerSlug: string,
  data: { jobId?: string; techName?: string; customerName?: string; responses: any; photos?: any[] }
) {
  await ensureTables();
  const res = await pool.query(
    `INSERT INTO partner_form_submissions (template_id, partner_slug, job_id, tech_name, customer_name, responses, photos, status, submitted_at)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,'submitted',NOW()) RETURNING *`,
    [templateId, partnerSlug, data.jobId || null, data.techName || null, data.customerName || null,
     JSON.stringify(data.responses), JSON.stringify(data.photos || [])]
  );
  return res.rows[0];
}

export async function getFormSubmission(submissionId: number) {
  await ensureTables();
  const res = await pool.query(
    `SELECT s.*, t.name as template_name, t.form_type, t.fields as template_fields
     FROM partner_form_submissions s
     JOIN partner_form_templates t ON t.id = s.template_id
     WHERE s.id = $1`,
    [submissionId]
  );
  return res.rows[0] || null;
}

export async function getFormSubmissionsForJob(jobId: string) {
  await ensureTables();
  const res = await pool.query(
    `SELECT s.*, t.name as template_name, t.form_type
     FROM partner_form_submissions s
     JOIN partner_form_templates t ON t.id = s.template_id
     WHERE s.job_id = $1 ORDER BY s.created_at DESC`,
    [jobId]
  );
  return res.rows;
}

export async function reviewFormSubmission(submissionId: number, reviewedBy: string) {
  await ensureTables();
  const res = await pool.query(
    `UPDATE partner_form_submissions SET status = 'reviewed', reviewed_by = $1, reviewed_at = NOW() WHERE id = $2 RETURNING *`,
    [reviewedBy, submissionId]
  );
  return res.rows[0];
}

export async function getFormComplianceReport(partnerSlug: string) {
  await ensureTables();
  // Get required templates
  const reqTemplates = await pool.query(
    `SELECT id, name, form_type, required_before FROM partner_form_templates
     WHERE partner_slug = $1 AND active = true AND required_before != 'none'`,
    [partnerSlug]
  );

  // Get distinct jobs with submissions
  const jobsWithForms = await pool.query(
    `SELECT DISTINCT s.job_id, s.template_id
     FROM partner_form_submissions s
     WHERE s.partner_slug = $1 AND s.status IN ('submitted','reviewed') AND s.job_id IS NOT NULL`,
    [partnerSlug]
  );

  // Get total distinct jobs
  const totalJobs = await pool.query(
    `SELECT COUNT(DISTINCT job_id) as total FROM partner_form_submissions WHERE partner_slug = $1 AND job_id IS NOT NULL`,
    [partnerSlug]
  );

  const jobFormMap: Record<string, Set<number>> = {};
  for (const row of jobsWithForms.rows) {
    if (!jobFormMap[row.job_id]) jobFormMap[row.job_id] = new Set();
    jobFormMap[row.job_id].add(row.template_id);
  }

  const total = parseInt(totalJobs.rows[0]?.total || "0");
  const requiredTemplateIds = reqTemplates.rows.map((t: any) => t.id);

  let compliantJobs = 0;
  for (const [, formIds] of Object.entries(jobFormMap)) {
    if (requiredTemplateIds.every((id: number) => formIds.has(id))) compliantJobs++;
  }

  return {
    totalJobs: total,
    compliantJobs,
    complianceRate: total > 0 ? Math.round((compliantJobs / total) * 100) : 100,
    requiredTemplates: reqTemplates.rows,
  };
}

export function getDefaultTemplates(serviceType?: string) {
  const templates = [
    {
      name: "HVAC Safety Inspection",
      description: "Standard HVAC system safety and performance inspection checklist",
      formType: "safety",
      requiredBefore: "job_end",
      fields: [
        { label: "Refrigerant Levels (PSI)", type: "number", required: true },
        { label: "Refrigerant Type", type: "select", options: ["R-410A", "R-22", "R-32", "R-134a", "Other"], required: true },
        { label: "Refrigerant Leak Detected", type: "checkbox", required: true },
        { label: "Electrical Connections Secure", type: "checkbox", required: true },
        { label: "Voltage Reading (V)", type: "number", required: true },
        { label: "Amperage Reading (A)", type: "number", required: true },
        { label: "Capacitor Condition", type: "select", options: ["Good", "Weak", "Failed", "Replaced"], required: true },
        { label: "Ductwork Condition", type: "select", options: ["Good", "Minor Leaks", "Major Leaks", "Damaged", "Needs Replacement"], required: true },
        { label: "Ductwork Notes", type: "textarea" },
        { label: "Filter Status", type: "select", options: ["Clean", "Dirty - Cleaned", "Dirty - Replaced", "Missing"], required: true },
        { label: "Filter Size", type: "text" },
        { label: "Thermostat Calibration (°F variance)", type: "number", required: true },
        { label: "Thermostat Type", type: "select", options: ["Manual", "Programmable", "Smart", "Other"] },
        { label: "CO Levels (PPM)", type: "number", required: true },
        { label: "CO Levels Safe (<9 PPM)", type: "checkbox", required: true },
        { label: "Drain Line Clear", type: "checkbox", required: true },
        { label: "Condensate Pan Condition", type: "select", options: ["Good", "Cracked", "Rusted", "Replaced"], required: true },
        { label: "Overall System Rating", type: "select", options: ["Pass", "Pass with Recommendations", "Fail - Repairs Needed", "Fail - Safety Hazard"], required: true },
        { label: "Photos of Equipment", type: "photo" },
        { label: "Technician Notes", type: "textarea" },
      ],
    },
    {
      name: "Work Order Closeout",
      description: "Standard work order completion and closeout form",
      formType: "closeout",
      requiredBefore: "job_end",
      fields: [
        { label: "Work Performed Description", type: "textarea", required: true },
        { label: "Root Cause (if diagnostic)", type: "textarea" },
        { label: "Parts Used", type: "textarea", required: true },
        { label: "Parts Under Warranty", type: "checkbox" },
        { label: "Equipment Make/Model", type: "text" },
        { label: "Equipment Serial Number", type: "text" },
        { label: "Customer Informed of Findings", type: "checkbox", required: true },
        { label: "Customer Satisfaction (1-5)", type: "select", options: ["1 - Very Dissatisfied", "2 - Dissatisfied", "3 - Neutral", "4 - Satisfied", "5 - Very Satisfied"], required: true },
        { label: "Follow-Up Service Needed", type: "checkbox", required: true },
        { label: "Follow-Up Description", type: "textarea" },
        { label: "Recommended Next Service Date", type: "text" },
        { label: "Photos of Completed Work", type: "photo", required: true },
        { label: "Customer Signature", type: "signature", required: true },
        { label: "Additional Notes", type: "textarea" },
      ],
    },
  ];

  if (serviceType) {
    const lower = serviceType.toLowerCase();
    if (lower.includes("hvac") || lower.includes("heating") || lower.includes("cooling")) {
      return templates;
    }
    return [templates[1]]; // Work Order Closeout is universal
  }
  return templates;
}
