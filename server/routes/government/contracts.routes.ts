import type { Express } from "express";
import { requireAuth } from "../../auth-middleware";
import { db } from "../../db";
import { eq, and, desc, asc, gte, lte } from "drizzle-orm";
import {
  governmentContracts,
  contractMilestones,
  contractWorkOrders,
  workOrderQuotes,
  contractWorkLogs,
  certifiedPayrollReports,
  certifiedPayrollEntries,
  contractInvoices,
  contractModifications,
  contractComplianceDocs,
  contractDailyLogs,
  prevailingWageRates,
  contractAuditLogs,
} from "@shared/schema";
import * as govService from "../../services/government-contracts";
import { processUpfrontPayment, processCompletionPayment } from "../../services/government-payments";

export function registerGovernmentContractRoutes(app: Express) {
  // ==========================================
  // Contract CRUD
  // ==========================================
  app.post("/api/government/contracts", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const contract = await govService.createContract(req.body, userId);
      res.status(201).json(contract);
    } catch (error) {
      console.error("Error creating contract:", error);
      res.status(500).json({ error: "Failed to create contract" });
    }
  });

  app.get("/api/government/contracts", requireAuth, async (req, res) => {
    try {
      const contracts = await db.select().from(governmentContracts)
        .orderBy(desc(governmentContracts.createdAt));
      res.json(contracts);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      res.status(500).json({ error: "Failed to fetch contracts" });
    }
  });

  app.get("/api/government/contracts/:id", requireAuth, async (req, res) => {
    try {
      const dashboard = await govService.getContractDashboard(req.params.id);
      res.json(dashboard);
    } catch (error: any) {
      if (error.message === "Contract not found") return res.status(404).json({ error: "Contract not found" });
      console.error("Error fetching contract:", error);
      res.status(500).json({ error: "Failed to fetch contract" });
    }
  });

  app.get("/api/government/contracts/:id/financials", requireAuth, async (req, res) => {
    try {
      const financials = await govService.getContractFinancials(req.params.id);
      res.json(financials);
    } catch (error: any) {
      if (error.message === "Contract not found") return res.status(404).json({ error: "Contract not found" });
      console.error("Error fetching financials:", error);
      res.status(500).json({ error: "Failed to fetch financials" });
    }
  });

  app.put("/api/government/contracts/:id", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const [updated] = await db.update(governmentContracts)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(governmentContracts.id, req.params.id))
        .returning();
      if (!updated) return res.status(404).json({ error: "Contract not found" });
      await govService.logAudit(req.params.id, "updated", "contract", req.params.id, userId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating contract:", error);
      res.status(500).json({ error: "Failed to update contract" });
    }
  });

  app.put("/api/government/contracts/:id/status", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const updated = await govService.updateContractStatus(req.params.id, req.body.status, userId);
      res.json(updated);
    } catch (error: any) {
      if (error.message === "Contract not found") return res.status(404).json({ error: "Contract not found" });
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  // ==========================================
  // Contract Modifications
  // ==========================================
  app.post("/api/government/contracts/:id/modifications", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const [mod] = await db.insert(contractModifications).values({
        ...req.body,
        contractId: req.params.id,
      }).returning();
      await govService.logAudit(req.params.id, "modification_added", "modification", mod.id, userId, { modNumber: mod.modNumber, modType: mod.modType });
      res.status(201).json(mod);
    } catch (error) {
      console.error("Error creating modification:", error);
      res.status(500).json({ error: "Failed to create modification" });
    }
  });

  app.get("/api/government/contracts/:id/modifications", requireAuth, async (req, res) => {
    try {
      const mods = await db.select().from(contractModifications)
        .where(eq(contractModifications.contractId, req.params.id))
        .orderBy(desc(contractModifications.createdAt));
      res.json(mods);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch modifications" });
    }
  });

  // ==========================================
  // Milestones
  // ==========================================
  app.post("/api/government/contracts/:id/milestones", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const [milestone] = await db.insert(contractMilestones).values({
        ...req.body,
        contractId: req.params.id,
      }).returning();
      await govService.logAudit(req.params.id, "milestone_added", "milestone", milestone.id, userId, { title: milestone.title });
      res.status(201).json(milestone);
    } catch (error) {
      console.error("Error creating milestone:", error);
      res.status(500).json({ error: "Failed to create milestone" });
    }
  });

  app.get("/api/government/contracts/:id/milestones", requireAuth, async (req, res) => {
    try {
      const milestones = await db.select().from(contractMilestones)
        .where(eq(contractMilestones.contractId, req.params.id))
        .orderBy(asc(contractMilestones.milestoneNumber));
      res.json(milestones);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch milestones" });
    }
  });

  app.put("/api/government/milestones/:id", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const [updated] = await db.update(contractMilestones)
        .set(req.body)
        .where(eq(contractMilestones.id, req.params.id))
        .returning();
      if (!updated) return res.status(404).json({ error: "Milestone not found" });
      await govService.logAudit(updated.contractId, "milestone_updated", "milestone", updated.id, userId, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update milestone" });
    }
  });

  // ==========================================
  // Work Orders (Flat-Rate)
  // ==========================================
  app.post("/api/government/contracts/:id/work-orders", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const result = await govService.postWorkOrder(req.params.id, req.body, userId);
      if (result.davisBaconWarning) {
        res.status(201).json({ ...result.workOrder, _warning: result.davisBaconWarning });
      } else {
        res.status(201).json(result.workOrder);
      }
    } catch (error: any) {
      if (error.message === "Contract not found") return res.status(404).json({ error: "Contract not found" });
      console.error("Error creating work order:", error);
      res.status(500).json({ error: "Failed to create work order" });
    }
  });

  app.get("/api/government/contracts/:id/work-orders", requireAuth, async (req, res) => {
    try {
      const workOrders = await govService.getWorkOrdersByContract(req.params.id);
      res.json(workOrders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch work orders" });
    }
  });

  app.get("/api/government/work-orders/available", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const workOrders = await govService.getAvailableWorkOrders(userId);
      // Strip internal budget info before sending to pro
      const sanitized = workOrders.map(({ budgetAmount, ...rest }) => rest);
      res.json(sanitized);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch available work orders" });
    }
  });

  app.get("/api/government/work-orders/:id", requireAuth, async (req, res) => {
    try {
      const detail = await govService.getWorkOrderDetail(req.params.id);
      // Strip budget from work order for pro-facing response
      const { budgetAmount, ...workOrder } = detail.workOrder;
      res.json({ ...detail, workOrder });
    } catch (error: any) {
      if (error.message === "Work order not found") return res.status(404).json({ error: "Work order not found" });
      res.status(500).json({ error: "Failed to fetch work order" });
    }
  });

  app.get("/api/government/work-orders/:id/admin", requireAuth, async (req, res) => {
    try {
      const detail = await govService.getWorkOrderDetail(req.params.id);
      res.json(detail); // Admin gets full detail including budget
    } catch (error: any) {
      if (error.message === "Work order not found") return res.status(404).json({ error: "Work order not found" });
      res.status(500).json({ error: "Failed to fetch work order" });
    }
  });

  app.post("/api/government/work-orders/:id/quotes", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const quote = await govService.submitQuote(
        req.params.id, userId, req.body.quoteAmount, req.body.estimatedDays || null, req.body.message || null
      );
      res.status(201).json(quote);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to submit quote" });
    }
  });

  app.put("/api/government/quotes/:id/accept", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const quote = await govService.acceptQuote(req.params.id, userId);

      // Auto-trigger 50% upfront payment to pro
      let paymentResult: { success: boolean; error?: string } = { success: false, error: "skipped" };
      try {
        paymentResult = await processUpfrontPayment(quote.workOrderId);
      } catch (paymentError: any) {
        console.error("Upfront payment failed (non-blocking):", paymentError.message);
        paymentResult = { success: false, error: paymentError.message };
      }

      res.json({ ...quote, _paymentResult: paymentResult });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to accept quote" });
    }
  });

  app.put("/api/government/quotes/:id/decline", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const quote = await govService.declineQuote(req.params.id, userId);
      res.json(quote);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to decline quote" });
    }
  });

  app.put("/api/government/work-orders/:id/start", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      await govService.startWorkOrder(req.params.id, userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to start work order" });
    }
  });

  app.put("/api/government/work-orders/:id/complete", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      await govService.completeWorkOrder(req.params.id, userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to complete work order" });
    }
  });

  app.put("/api/government/work-orders/:id/verify", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      await govService.verifyWorkOrder(req.params.id, userId);

      // Auto-trigger completion payment (remaining 50%)
      let paymentResult: { success: boolean; error?: string } = { success: false, error: "skipped" };
      try {
        paymentResult = await processCompletionPayment(req.params.id);
      } catch (paymentError: any) {
        console.error("Completion payment failed (non-blocking):", paymentError.message);
        paymentResult = { success: false, error: paymentError.message };
      }

      res.json({ success: true, _paymentResult: paymentResult });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to verify work order" });
    }
  });

  // ==========================================
  // Work Logs (documentation, NOT billing)
  // ==========================================
  app.post("/api/government/contracts/:id/work-logs", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const log = await govService.createWorkLog({ ...req.body, contractId: req.params.id, proId: userId }, userId);
      res.status(201).json(log);
    } catch (error) {
      console.error("Error creating work log:", error);
      res.status(500).json({ error: "Failed to create work log" });
    }
  });

  app.get("/api/government/contracts/:id/work-logs", requireAuth, async (req, res) => {
    try {
      const logs = await db.select().from(contractWorkLogs)
        .where(eq(contractWorkLogs.contractId, req.params.id))
        .orderBy(desc(contractWorkLogs.workDate));
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch work logs" });
    }
  });

  app.put("/api/government/work-logs/:id/approve", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const updated = await govService.approveWorkLog(req.params.id, userId);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to approve work log" });
    }
  });

  // ==========================================
  // Certified Payroll (WH-347 — INTERNAL compliance only)
  // ==========================================
  app.post("/api/government/contracts/:id/payroll/generate", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const report = await govService.generateWeeklyPayroll(req.params.id, req.body.weekEndingDate, userId);
      res.status(201).json(report);
    } catch (error) {
      console.error("Error generating payroll:", error);
      res.status(500).json({ error: "Failed to generate compliance report" });
    }
  });

  app.get("/api/government/contracts/:id/payroll", requireAuth, async (req, res) => {
    try {
      const reports = await db.select().from(certifiedPayrollReports)
        .where(eq(certifiedPayrollReports.contractId, req.params.id))
        .orderBy(desc(certifiedPayrollReports.weekEndingDate));
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch compliance reports" });
    }
  });

  app.get("/api/government/payroll/:id", requireAuth, async (req, res) => {
    try {
      const [report] = await db.select().from(certifiedPayrollReports)
        .where(eq(certifiedPayrollReports.id, req.params.id));
      if (!report) return res.status(404).json({ error: "Report not found" });
      const entries = await db.select().from(certifiedPayrollEntries)
        .where(eq(certifiedPayrollEntries.payrollReportId, req.params.id));
      res.json({ report, entries });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch compliance report" });
    }
  });

  app.put("/api/government/payroll/:id/submit", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const updated = await govService.submitPayroll(req.params.id, userId);
      res.json(updated);
    } catch (error: any) {
      if (error.message === "Payroll report not found") return res.status(404).json({ error: "Report not found" });
      res.status(500).json({ error: "Failed to submit report" });
    }
  });

  app.get("/api/government/payroll/:id/wh347", requireAuth, async (req, res) => {
    try {
      // INTERNAL COMPLIANCE REPORT — admin only, not pro-facing
      const wh347 = await govService.formatWH347(req.params.id);
      res.json(wh347);
    } catch (error: any) {
      if (error.message === "Payroll report not found") return res.status(404).json({ error: "Report not found" });
      res.status(500).json({ error: "Failed to format WH-347" });
    }
  });

  // ==========================================
  // Invoicing
  // ==========================================
  app.post("/api/government/contracts/:id/invoices", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const invoice = await govService.generateContractInvoice(
        req.params.id, req.body.periodStart, req.body.periodEnd, userId
      );
      res.status(201).json(invoice);
    } catch (error: any) {
      if (error.message === "Contract not found") return res.status(404).json({ error: "Contract not found" });
      res.status(500).json({ error: "Failed to generate invoice" });
    }
  });

  app.get("/api/government/contracts/:id/invoices", requireAuth, async (req, res) => {
    try {
      const invoices = await db.select().from(contractInvoices)
        .where(eq(contractInvoices.contractId, req.params.id))
        .orderBy(desc(contractInvoices.createdAt));
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.put("/api/government/invoices/:id", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const [updated] = await db.update(contractInvoices)
        .set(req.body)
        .where(eq(contractInvoices.id, req.params.id))
        .returning();
      if (!updated) return res.status(404).json({ error: "Invoice not found" });
      await govService.logAudit(updated.contractId, "invoice_updated", "invoice", updated.id, userId, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update invoice" });
    }
  });

  app.put("/api/government/invoices/:id/payment-received", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const [updated] = await db.update(contractInvoices)
        .set({
          status: "paid",
          paymentReceivedDate: req.body.paymentReceivedDate,
          paymentAmount: req.body.paymentAmount,
          checkNumber: req.body.checkNumber,
          eftNumber: req.body.eftNumber,
        })
        .where(eq(contractInvoices.id, req.params.id))
        .returning();
      if (!updated) return res.status(404).json({ error: "Invoice not found" });

      await db.update(governmentContracts)
        .set({ remainingBalance: (await db.select().from(governmentContracts).where(eq(governmentContracts.id, updated.contractId)))[0].remainingBalance - (req.body.paymentAmount || 0) })
        .where(eq(governmentContracts.id, updated.contractId));

      await govService.logAudit(updated.contractId, "payment_received", "invoice", updated.id, userId, {
        amount: req.body.paymentAmount,
        checkNumber: req.body.checkNumber,
        eftNumber: req.body.eftNumber,
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to record payment" });
    }
  });

  app.get("/api/government/invoices/:id/prompt-payment", requireAuth, async (req, res) => {
    try {
      const result = await govService.trackPromptPayment(req.params.id);
      res.json(result);
    } catch (error: any) {
      if (error.message === "Invoice not found") return res.status(404).json({ error: "Invoice not found" });
      res.status(500).json({ error: "Failed to check prompt payment" });
    }
  });

  // ==========================================
  // Compliance
  // ==========================================
  app.get("/api/government/contracts/:id/compliance", requireAuth, async (req, res) => {
    try {
      const status = await govService.getComplianceStatus(req.params.id);
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch compliance status" });
    }
  });

  app.post("/api/government/contracts/:id/compliance/docs", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const [doc] = await db.insert(contractComplianceDocs).values({
        ...req.body,
        contractId: req.params.id,
        uploadedAt: new Date(),
        status: "current",
      }).returning();
      await govService.logAudit(req.params.id, "compliance_doc_uploaded", "compliance", doc.id, userId, { docType: doc.docType, fileName: doc.fileName });
      res.status(201).json(doc);
    } catch (error) {
      res.status(500).json({ error: "Failed to upload compliance doc" });
    }
  });

  app.get("/api/government/compliance/expiring", requireAuth, async (req, res) => {
    try {
      const daysAhead = parseInt(req.query.days as string) || 30;
      const docs = await govService.getExpiringDocs(daysAhead);
      res.json(docs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch expiring docs" });
    }
  });

  app.get("/api/government/contracts/:id/compliance/report", requireAuth, async (req, res) => {
    try {
      const report = await govService.generateComplianceReport(req.params.id);
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate compliance report" });
    }
  });

  // ==========================================
  // Audit Trail
  // ==========================================
  app.get("/api/government/contracts/:id/audit-trail", requireAuth, async (req, res) => {
    try {
      const logs = await govService.getAuditTrail(req.params.id);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch audit trail" });
    }
  });

  // ==========================================
  // Daily Logs
  // ==========================================
  app.post("/api/government/contracts/:id/daily-logs", requireAuth, async (req, res) => {
    try {
      const userId = ((req.user as any).userId || (req.user as any).id);
      const [log] = await db.insert(contractDailyLogs).values({
        ...req.body,
        contractId: req.params.id,
        preparedBy: userId,
      }).returning();
      await govService.logAudit(req.params.id, "daily_log_created", "daily_log", log.id, userId, { logDate: log.logDate });
      res.status(201).json(log);
    } catch (error) {
      res.status(500).json({ error: "Failed to create daily log" });
    }
  });

  app.get("/api/government/contracts/:id/daily-logs", requireAuth, async (req, res) => {
    try {
      const logs = await db.select().from(contractDailyLogs)
        .where(eq(contractDailyLogs.contractId, req.params.id))
        .orderBy(desc(contractDailyLogs.logDate));
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch daily logs" });
    }
  });

  app.get("/api/government/daily-logs/:id", requireAuth, async (req, res) => {
    try {
      const [log] = await db.select().from(contractDailyLogs)
        .where(eq(contractDailyLogs.id, req.params.id));
      if (!log) return res.status(404).json({ error: "Daily log not found" });
      res.json(log);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch daily log" });
    }
  });

  // ==========================================
  // Prevailing Wages (admin reference data)
  // ==========================================
  app.post("/api/government/prevailing-wages/rates", requireAuth, async (req, res) => {
    try {
      const rates = Array.isArray(req.body) ? req.body : [req.body];
      const inserted = await db.insert(prevailingWageRates).values(rates).returning();
      res.status(201).json(inserted);
    } catch (error) {
      res.status(500).json({ error: "Failed to import wage rates" });
    }
  });

  app.get("/api/government/prevailing-wages/rates/:wageDecisionNumber", requireAuth, async (req, res) => {
    try {
      const rates = await govService.getPrevailingWageRatesByDecision(req.params.wageDecisionNumber);
      res.json(rates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch wage rates" });
    }
  });
}
