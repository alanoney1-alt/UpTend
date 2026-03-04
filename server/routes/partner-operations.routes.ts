/**
 * Partner Operations API Routes
 * 
 * Endpoints for invoicing, estimate follow-up, and membership management.
 */

import { Router, type Express } from "express";
import {
  createInvoice, sendInvoice, getInvoice, listInvoices,
  recordPayment, voidInvoice, getOverdueInvoices,
  sendPaymentReminder, getInvoiceStats
} from "../services/invoicing-system";
import { generateInvoicePdf } from "./accounting/invoicing.routes";
import {
  createEstimate, getEstimatesDueForFollowUp, markFollowUpSent,
  acceptEstimate, declineEstimate, getEstimateConversionRate, listEstimates
} from "../services/estimate-followup";
import {
  createPlan, listPlans, enrollCustomer, cancelMembership,
  pauseMembership, resumeMembership, recordVisit,
  getMembershipsNeedingRenewal, getMembershipStats, listMemberships
} from "../services/membership-management";

export function registerPartnerOperationsRoutes(app: Express) {
  const router = Router();

  // ============================================================
  // Invoicing
  // ============================================================

  router.post("/:slug/invoices", async (req, res) => {
    try {
      const { customerData, items, notes, dueDate, taxRate } = req.body;
      if (!customerData || !items) return res.status(400).json({ error: "customerData and items required" });
      const invoice = await createInvoice(req.params.slug, customerData, items, notes, dueDate, taxRate);
      res.json(invoice);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/:slug/invoices/:id/send", async (req, res) => {
    try {
      const result = await sendInvoice(parseInt(req.params.id));
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/:slug/invoices/stats", async (req, res) => {
    try {
      const stats = await getInvoiceStats(req.params.slug);
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/:slug/invoices/overdue", async (req, res) => {
    try {
      const invoices = await getOverdueInvoices(req.params.slug);
      res.json(invoices);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/:slug/invoices/:id", async (req, res) => {
    try {
      const invoice = await getInvoice(parseInt(req.params.id));
      if (!invoice) return res.status(404).json({ error: "Invoice not found" });
      res.json(invoice);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/:slug/invoices", async (req, res) => {
    try {
      const { status, startDate, endDate, limit, offset } = req.query;
      const invoices = await listInvoices(req.params.slug, {
        status: status as string, startDate: startDate as string, endDate: endDate as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      res.json(invoices);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/:slug/invoices/:id/payment", async (req, res) => {
    try {
      const { amount, method, stripePaymentId } = req.body;
      if (!amount || !method) return res.status(400).json({ error: "amount and method required" });
      const record = await recordPayment(parseInt(req.params.id), amount, method, stripePaymentId);
      res.json(record);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/:slug/invoices/:id/void", async (req, res) => {
    try {
      await voidInvoice(parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/:slug/invoices/:id/reminder", async (req, res) => {
    try {
      const result = await sendPaymentReminder(parseInt(req.params.id));
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/:slug/invoices/:id/pdf", async (req, res) => {
    try {
      const invoice = await getInvoice(parseInt(req.params.id));
      if (!invoice) return res.status(404).json({ error: "Invoice not found" });
      // Verify invoice belongs to this partner
      if (invoice.partnerSlug !== req.params.slug) return res.status(403).json({ error: "Forbidden" });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="invoice-${invoice.id}.pdf"`);

      generateInvoicePdf({
        id: String(invoice.id),
        invoiceNumber: invoice.id,
        customerName: invoice.customerName,
        customerEmail: invoice.customerEmail,
        lineItems: invoice.items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          amount: i.quantity * i.unitPrice,
        })),
        subtotal: invoice.subtotal,
        taxAmount: invoice.taxAmount,
        total: invoice.total,
        status: invoice.status,
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-US") : null,
        createdAt: new Date(invoice.createdAt).toLocaleDateString("en-US"),
        notes: invoice.notes,
      }, res);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ============================================================
  // Estimates
  // ============================================================

  router.post("/:slug/estimates", async (req, res) => {
    try {
      const { customer, serviceType, description, amount, expiresInDays } = req.body;
      if (!customer || !serviceType) return res.status(400).json({ error: "customer and serviceType required" });
      const estimate = await createEstimate(req.params.slug, customer, serviceType, description, amount, expiresInDays);
      res.json(estimate);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/:slug/estimates/follow-ups", async (req, res) => {
    try {
      const estimates = await getEstimatesDueForFollowUp(req.params.slug);
      res.json(estimates);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/:slug/estimates/conversion-rate", async (req, res) => {
    try {
      const rate = await getEstimateConversionRate(req.params.slug);
      res.json(rate);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/:slug/estimates", async (req, res) => {
    try {
      const { status, limit, offset } = req.query;
      const estimates = await listEstimates(req.params.slug, {
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      res.json(estimates);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/:slug/estimates/:id/follow-up", async (req, res) => {
    try {
      await markFollowUpSent(parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/:slug/estimates/:id/accept", async (req, res) => {
    try {
      const result = await acceptEstimate(parseInt(req.params.id));
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/:slug/estimates/:id/decline", async (req, res) => {
    try {
      const { reason } = req.body;
      await declineEstimate(parseInt(req.params.id), reason);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ============================================================
  // Memberships
  // ============================================================

  router.post("/:slug/memberships/plans", async (req, res) => {
    try {
      const { name, description, priceMonthly, priceAnnual, servicesIncluded, visitsPerYear, priorityScheduling, discountPercent } = req.body;
      if (!name) return res.status(400).json({ error: "name required" });
      const plan = await createPlan(req.params.slug, name, description || "", priceMonthly || 0, priceAnnual || 0, servicesIncluded || [], visitsPerYear || 0, priorityScheduling || false, discountPercent || 0);
      res.json(plan);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/:slug/memberships/plans", async (req, res) => {
    try {
      const plans = await listPlans(req.params.slug);
      res.json(plans);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/:slug/memberships/enroll", async (req, res) => {
    try {
      const { planId, customer, billingCycle } = req.body;
      if (!planId || !customer) return res.status(400).json({ error: "planId and customer required" });
      const membership = await enrollCustomer(planId, customer, billingCycle || "monthly");
      res.json(membership);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/:slug/memberships/stats", async (req, res) => {
    try {
      const stats = await getMembershipStats(req.params.slug);
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/:slug/memberships/renewals", async (req, res) => {
    try {
      const memberships = await getMembershipsNeedingRenewal(req.params.slug);
      res.json(memberships);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/:slug/memberships", async (req, res) => {
    try {
      const { status, limit, offset } = req.query;
      const memberships = await listMemberships(req.params.slug, {
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      res.json(memberships);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/:slug/memberships/:id/cancel", async (req, res) => {
    try {
      const { reason } = req.body;
      await cancelMembership(parseInt(req.params.id), reason);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/:slug/memberships/:id/pause", async (req, res) => {
    try {
      await pauseMembership(parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/:slug/memberships/:id/resume", async (req, res) => {
    try {
      await resumeMembership(parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/:slug/memberships/:id/visit", async (req, res) => {
    try {
      const { serviceType, notes } = req.body;
      if (!serviceType) return res.status(400).json({ error: "serviceType required" });
      await recordVisit(parseInt(req.params.id), serviceType, notes || "");
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.use("/api/partners", router);
}
