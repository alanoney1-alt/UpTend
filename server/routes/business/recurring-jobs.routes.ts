/**
 * Recurring Job Routes
 *
 * Endpoints consumed by client/src/pages/business-dashboard.tsx:
 *   POST   /api/recurring-jobs      — create recurring job
 *   PATCH  /api/recurring-jobs/:id  — update recurring job (toggle active, etc.)
 */

import { Router } from "express";
import { BusinessAccountsStorage } from "../../storage/domains/business-accounts/storage";
import { requireAuth } from "../../middleware/auth";

const router = Router();
const store = new BusinessAccountsStorage();

// POST /api/recurring-jobs — create recurring job
router.post("/", requireAuth, async (req, res) => {
  try {
    const job = await store.createRecurringJob(req.body);
    res.status(201).json(job);
  } catch (error) {
    console.error("Error creating recurring job:", error);
    res.status(500).json({ error: "Failed to create recurring job" });
  }
});

// PATCH /api/recurring-jobs/:id — update recurring job
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const updated = await store.updateRecurringJob(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: "Recurring job not found" });
    }
    res.json(updated);
  } catch (error) {
    console.error("Error updating recurring job:", error);
    res.status(500).json({ error: "Failed to update recurring job" });
  }
});

export default router;
