/**
 * Business Account & Recurring Job Routes
 *
 * Endpoints consumed by client/src/pages/business-dashboard.tsx:
 *   GET    /api/business-accounts/:userId  — get account + recurring jobs by userId
 *   POST   /api/business-accounts          — create business account
 *   POST   /api/recurring-jobs             — create recurring job
 *   PATCH  /api/recurring-jobs/:id         — update recurring job (toggle active, etc.)
 */

import { Router } from "express";
import { BusinessAccountsStorage } from "../../storage/domains/business-accounts/storage";
import { requireAuth } from "../../middleware/auth";

const router = Router();
const store = new BusinessAccountsStorage();

// GET /api/business-accounts/:userId — dashboard initial load
router.get("/:userId", requireAuth, async (req, res) => {
  try {
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

// POST /api/business-accounts — create new business account
router.post("/", requireAuth, async (req, res) => {
  try {
    const account = await store.createBusinessAccount(req.body);
    res.status(201).json(account);
  } catch (error) {
    console.error("Error creating business account:", error);
    res.status(500).json({ error: "Failed to create business account" });
  }
});

export default router;
