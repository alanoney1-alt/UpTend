/**
 * Partner Operations 4 API Routes
 *
 * Job Costing, Digital Forms/Checklists, Customer Tags & Pipeline
 */
import { Router, type Express } from "express";
import {
  recordJobCost, addMaterialCost, getJobProfitability,
  getProfitabilityReport, getServiceTypeProfitability, getTechProfitability,
  getMaterialSpendReport, getDashboardSummary,
} from "../services/job-costing";
import {
  createFormTemplate, listFormTemplates, updateFormTemplate, deactivateFormTemplate,
  submitForm, getFormSubmission, getFormSubmissionsForJob, reviewFormSubmission,
  getFormComplianceReport, getDefaultTemplates,
} from "../services/digital-forms";
import {
  createTag, listTags, tagCustomer, removeTagFromCustomer,
  getCustomersByTag, getCustomerTags,
  createPipelineStage, listPipelineStages, createDeal, moveDeal, updateDeal,
  getPipelineView, getDealsByStage, getPipelineStats,
} from "../services/customer-tags";

const router = Router();

// === Job Costs ===

router.post("/api/partners/:slug/job-costs", async (req, res) => {
  try { res.json(await recordJobCost(req.params.slug, req.body)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/api/partners/:slug/job-costs/:jobCostId/materials", async (req, res) => {
  try {
    const { itemName, quantity, unitCost, supplier } = req.body;
    res.json(await addMaterialCost(parseInt(req.params.jobCostId), itemName, quantity, unitCost, supplier));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/api/partners/:slug/job-costs/dashboard", async (req, res) => {
  try { res.json(await getDashboardSummary(req.params.slug)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/api/partners/:slug/job-costs/profitability", async (req, res) => {
  try {
    const dateRange = req.query.start && req.query.end
      ? { start: req.query.start as string, end: req.query.end as string } : undefined;
    res.json(await getProfitabilityReport(req.params.slug, dateRange));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/api/partners/:slug/job-costs/by-service-type", async (req, res) => {
  try { res.json(await getServiceTypeProfitability(req.params.slug)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/api/partners/:slug/job-costs/by-tech", async (req, res) => {
  try { res.json(await getTechProfitability(req.params.slug)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/api/partners/:slug/job-costs/materials", async (req, res) => {
  try {
    const dateRange = req.query.start && req.query.end
      ? { start: req.query.start as string, end: req.query.end as string } : undefined;
    res.json(await getMaterialSpendReport(req.params.slug, dateRange));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/api/partners/:slug/job-costs/:jobId", async (req, res) => {
  try {
    const result = await getJobProfitability(req.params.slug, req.params.jobId);
    if (!result) return res.status(404).json({ error: "Job not found" });
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// === Forms ===

router.post("/api/partners/:slug/forms/templates", async (req, res) => {
  try {
    const { name, description, formType, fields, requiredBefore } = req.body;
    res.json(await createFormTemplate(req.params.slug, name, description, formType, fields, requiredBefore));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/api/partners/:slug/forms/templates", async (req, res) => {
  try { res.json(await listFormTemplates(req.params.slug, req.query.formType as string)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/api/partners/:slug/forms/templates/:id", async (req, res) => {
  try { res.json(await updateFormTemplate(parseInt(req.params.id), req.body)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/api/partners/:slug/forms/templates/:id", async (req, res) => {
  try { res.json(await deactivateFormTemplate(parseInt(req.params.id))); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/api/partners/:slug/forms/templates/:id/submit", async (req, res) => {
  try { res.json(await submitForm(parseInt(req.params.id), req.params.slug, req.body)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/api/partners/:slug/forms/submissions/:id", async (req, res) => {
  try {
    const result = await getFormSubmission(parseInt(req.params.id));
    if (!result) return res.status(404).json({ error: "Submission not found" });
    res.json(result);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/api/partners/:slug/forms/jobs/:jobId", async (req, res) => {
  try { res.json(await getFormSubmissionsForJob(req.params.jobId)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/api/partners/:slug/forms/submissions/:id/review", async (req, res) => {
  try { res.json(await reviewFormSubmission(parseInt(req.params.id), req.body.reviewedBy)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/api/partners/:slug/forms/compliance", async (req, res) => {
  try { res.json(await getFormComplianceReport(req.params.slug)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/api/partners/:slug/forms/defaults", async (req, res) => {
  try { res.json(getDefaultTemplates(req.query.serviceType as string)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

// === Customer Tags ===

router.post("/api/partners/:slug/pipeline/tags", async (req, res) => {
  try {
    const { tagName, tagColor, description } = req.body;
    res.json(await createTag(req.params.slug, tagName, tagColor, description));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/api/partners/:slug/pipeline/tags", async (req, res) => {
  try { res.json(await listTags(req.params.slug)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/api/partners/:slug/pipeline/tags/:tagId/customers", async (req, res) => {
  try {
    const { customerId, customerName, customerEmail } = req.body;
    res.json(await tagCustomer(req.params.slug, customerId, customerName, customerEmail, parseInt(req.params.tagId)));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete("/api/partners/:slug/pipeline/tags/:tagId/customers/:customerId", async (req, res) => {
  try { res.json(await removeTagFromCustomer(req.params.customerId, parseInt(req.params.tagId))); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/api/partners/:slug/pipeline/tags/:tagId/customers", async (req, res) => {
  try { res.json(await getCustomersByTag(req.params.slug, parseInt(req.params.tagId))); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/api/partners/:slug/pipeline/customers/:customerId/tags", async (req, res) => {
  try { res.json(await getCustomerTags(req.params.customerId)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

// === Pipeline Stages & Deals ===

router.post("/api/partners/:slug/pipeline/stages", async (req, res) => {
  try {
    const { name, position, color } = req.body;
    res.json(await createPipelineStage(req.params.slug, name, position, color));
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/api/partners/:slug/pipeline/stages", async (req, res) => {
  try { res.json(await listPipelineStages(req.params.slug)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post("/api/partners/:slug/pipeline/deals", async (req, res) => {
  try { res.json(await createDeal(req.params.slug, req.body)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/api/partners/:slug/pipeline/deals/:id/move", async (req, res) => {
  try { res.json(await moveDeal(parseInt(req.params.id), req.body.stageId)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put("/api/partners/:slug/pipeline/deals/:id", async (req, res) => {
  try { res.json(await updateDeal(parseInt(req.params.id), req.body)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/api/partners/:slug/pipeline/view", async (req, res) => {
  try { res.json(await getPipelineView(req.params.slug)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/api/partners/:slug/pipeline/stages/:stageId/deals", async (req, res) => {
  try { res.json(await getDealsByStage(req.params.slug, parseInt(req.params.stageId))); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.get("/api/partners/:slug/pipeline/stats", async (req, res) => {
  try { res.json(await getPipelineStats(req.params.slug)); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

export function registerPartnerOperations4Routes(app: Express) {
  app.use(router);
}
