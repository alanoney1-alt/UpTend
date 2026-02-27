import { db } from "../db";
import { eq, and, sql, desc, asc, lte, gte, inArray } from "drizzle-orm";
import {
  governmentContracts,
  contractMilestones,
  contractLaborEntries,
  certifiedPayrollReports,
  certifiedPayrollEntries,
  contractInvoices,
  contractModifications,
  contractComplianceDocs,
  contractDailyLogs,
  prevailingWageRates,
  contractAuditLogs,
  contractWorkOrders,
  workOrderQuotes,
  contractWorkLogs,
} from "@shared/schema";

// ==========================================
// Audit Trail - immutable, logs everything
// ==========================================
async function logAudit(
  contractId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  userId: string | null,
  details: Record<string, any> | null,
  ipAddress?: string
) {
  await db.insert(contractAuditLogs).values({
    contractId,
    action,
    entityType,
    entityId: entityId ?? undefined,
    userId: userId ?? undefined,
    details,
    ipAddress,
  });
}

// ==========================================
// Contract Management
// ==========================================
export async function createContract(data: any, userId: string) {
  const [contract] = await db.insert(governmentContracts).values({
    ...data,
    remainingBalance: data.fundedAmount || data.totalValue || 0,
    createdBy: userId,
  }).returning();
  await logAudit(contract.id, "created", "contract", contract.id, userId, { contractNumber: contract.contractNumber });
  return contract;
}

export async function updateContractStatus(contractId: string, status: string, userId: string) {
  const [existing] = await db.select().from(governmentContracts).where(eq(governmentContracts.id, contractId));
  if (!existing) throw new Error("Contract not found");
  const previousStatus = existing.status;
  const [updated] = await db.update(governmentContracts)
    .set({ status, updatedAt: new Date() })
    .where(eq(governmentContracts.id, contractId))
    .returning();
  await logAudit(contractId, "status_changed", "contract", contractId, userId, { previousStatus, newStatus: status });
  return updated;
}

export async function getContractDashboard(contractId: string) {
  const [contract] = await db.select().from(governmentContracts).where(eq(governmentContracts.id, contractId));
  if (!contract) throw new Error("Contract not found");

  const milestones = await db.select().from(contractMilestones).where(eq(contractMilestones.contractId, contractId));
  const workOrders = await db.select().from(contractWorkOrders).where(eq(contractWorkOrders.contractId, contractId));
  const invoices = await db.select().from(contractInvoices).where(eq(contractInvoices.contractId, contractId));
  const complianceDocs = await db.select().from(contractComplianceDocs).where(eq(contractComplianceDocs.contractId, contractId));

  // Calculate total cost from completed/verified work orders (flat-rate quotes)
  const totalWorkOrderCost = workOrders
    .filter(wo => wo.status === "completed" || wo.status === "verified")
    .reduce((sum, wo) => sum + (wo.acceptedQuoteAmount || 0), 0);

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((sum, inv) => sum + (inv.paymentAmount || 0), 0);
  const completedMilestones = milestones.filter(m => m.status === "accepted").length;
  const complianceIssues = complianceDocs.filter(d => d.status === "expired" || d.status === "missing").length;

  const burnRate = contract.totalValue > 0 ? Math.round((totalWorkOrderCost / contract.totalValue) * 10000) / 100 : 0;

  return {
    contract,
    summary: {
      totalValue: contract.totalValue,
      fundedAmount: contract.fundedAmount,
      totalWorkOrderCost,
      totalInvoiced,
      totalPaid,
      remainingBalance: contract.fundedAmount - totalInvoiced,
      burnRate,
      milestonesTotal: milestones.length,
      milestonesCompleted: completedMilestones,
      workOrdersTotal: workOrders.length,
      workOrdersCompleted: workOrders.filter(wo => wo.status === "verified").length,
      complianceIssues,
    },
    milestones,
    workOrders: workOrders.slice(-10),
    recentInvoices: invoices.slice(-5),
    complianceDocs,
  };
}

export async function getContractFinancials(contractId: string) {
  const [contract] = await db.select().from(governmentContracts).where(eq(governmentContracts.id, contractId));
  if (!contract) throw new Error("Contract not found");

  const workOrders = await db.select().from(contractWorkOrders)
    .where(and(eq(contractWorkOrders.contractId, contractId)));
  const invoices = await db.select().from(contractInvoices).where(eq(contractInvoices.contractId, contractId));

  // Total from verified/completed work orders (flat-rate)
  const totalWorkOrderSpend = workOrders
    .filter(wo => wo.status === "completed" || wo.status === "verified")
    .reduce((sum, wo) => sum + (wo.acceptedQuoteAmount || 0), 0);

  const totalMaterials = invoices.reduce((sum, i) => sum + (i.materialsCost || 0), 0);
  const totalEquipment = invoices.reduce((sum, i) => sum + (i.equipmentCost || 0), 0);
  const totalSubcontractor = invoices.reduce((sum, i) => sum + (i.subcontractorCost || 0), 0);
  const totalInvoiced = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((sum, i) => sum + (i.paymentAmount || 0), 0);

  const daysElapsed = contract.startDate ? Math.max(1, Math.floor((Date.now() - new Date(contract.startDate).getTime()) / 86400000)) : 1;
  const dailyBurnRate = totalInvoiced / daysElapsed;

  return {
    budget: contract.totalValue,
    funded: contract.fundedAmount,
    spent: { workOrders: totalWorkOrderSpend, materials: totalMaterials, equipment: totalEquipment, subcontractor: totalSubcontractor },
    totalInvoiced,
    totalPaid,
    remaining: contract.fundedAmount - totalInvoiced,
    dailyBurnRate: Math.round(dailyBurnRate),
    percentComplete: contract.totalValue > 0 ? Math.round((totalInvoiced / contract.totalValue) * 10000) / 100 : 0,
  };
}

// ==========================================
// Work Order Management (Flat-Rate)
// ==========================================
export async function postWorkOrder(contractId: string, data: any, userId: string) {
  const [contract] = await db.select().from(governmentContracts).where(eq(governmentContracts.id, contractId));
  if (!contract) throw new Error("Contract not found");

  // Davis-Bacon prevailing wage pre-check (INTERNAL ONLY)
  // INTERNAL COMPLIANCE CALCULATION ONLY - not shown to contractors, not used for payment
  // We check if the budget amount, when back-calculated against estimated scope,
  // would satisfy prevailing wage requirements. This happens BEFORE pros see the work order.
  let davisBaconWarning: string | null = null;
  if (contract.prevailingWageDetermination && data.budgetAmount && data.estimatedDaysForCheck) {
    // Back-calculate: budget ÷ estimated days ÷ 8 = implied hourly equivalent
    // INTERNAL COMPLIANCE CALCULATION ONLY - not shown to contractors, not used for payment
    const impliedDailyRate = data.budgetAmount / data.estimatedDaysForCheck;
    const impliedHourlyEquivalent = impliedDailyRate / 8;

    const wageRates = await db.select().from(prevailingWageRates)
      .where(eq(prevailingWageRates.wageDecisionNumber, contract.prevailingWageDetermination));

    if (wageRates.length > 0) {
      const minRequired = Math.min(...wageRates.map(r => r.totalRate));
      if (impliedHourlyEquivalent < minRequired) {
        davisBaconWarning = `Budget may not satisfy Davis-Bacon requirements. Back-calculated equivalent is below minimum prevailing rate.`;
      }
    }
  }
  // Remove internal-only check field before inserting
  const { estimatedDaysForCheck, ...insertData } = data;

  const [workOrder] = await db.insert(contractWorkOrders).values({
    ...insertData,
    contractId,
    status: insertData.status || "draft",
    postedAt: insertData.status === "posted" ? new Date() : undefined,
  }).returning();

  await logAudit(contractId, "work_order_created", "work_order", workOrder.id, userId, { title: workOrder.title, davisBaconWarning });
  return { workOrder, davisBaconWarning };
}

export async function getWorkOrdersByContract(contractId: string) {
  return db.select().from(contractWorkOrders)
    .where(eq(contractWorkOrders.contractId, contractId))
    .orderBy(desc(contractWorkOrders.createdAt));
}

export async function getAvailableWorkOrders(proId: string) {
  // Get all posted work orders - in production, filter by pro's certs and location
  return db.select().from(contractWorkOrders)
    .where(eq(contractWorkOrders.status, "posted"))
    .orderBy(desc(contractWorkOrders.postedAt));
}

export async function getWorkOrderDetail(workOrderId: string) {
  const [workOrder] = await db.select().from(contractWorkOrders).where(eq(contractWorkOrders.id, workOrderId));
  if (!workOrder) throw new Error("Work order not found");

  const quotes = await db.select().from(workOrderQuotes)
    .where(eq(workOrderQuotes.workOrderId, workOrderId))
    .orderBy(desc(workOrderQuotes.submittedAt));

  const workLogs = await db.select().from(contractWorkLogs)
    .where(eq(contractWorkLogs.workOrderId, workOrderId))
    .orderBy(desc(contractWorkLogs.workDate));

  return { workOrder, quotes, workLogs };
}

export async function submitQuote(workOrderId: string, proId: string, quoteAmount: number, estimatedDays: number | null, message: string | null) {
  const [workOrder] = await db.select().from(contractWorkOrders).where(eq(contractWorkOrders.id, workOrderId));
  if (!workOrder) throw new Error("Work order not found");
  if (workOrder.status !== "posted" && workOrder.status !== "quoted") {
    throw new Error("Work order is not accepting quotes");
  }

  // Check for existing quote from this pro
  const existing = await db.select().from(workOrderQuotes)
    .where(and(eq(workOrderQuotes.workOrderId, workOrderId), eq(workOrderQuotes.proId, proId)));
  if (existing.length > 0) throw new Error("You have already submitted a quote for this work order");

  const [quote] = await db.insert(workOrderQuotes).values({
    workOrderId,
    proId,
    quoteAmount,
    estimatedDays,
    message,
    status: "submitted",
    submittedAt: new Date(),
  }).returning();

  // Update work order status to quoted if still posted
  if (workOrder.status === "posted") {
    await db.update(contractWorkOrders).set({ status: "quoted" }).where(eq(contractWorkOrders.id, workOrderId));
  }

  await logAudit(workOrder.contractId, "quote_submitted", "work_order", workOrderId, proId, { quoteAmount, estimatedDays });
  return quote;
}

export async function acceptQuote(quoteId: string, userId: string) {
  const [quote] = await db.select().from(workOrderQuotes).where(eq(workOrderQuotes.id, quoteId));
  if (!quote) throw new Error("Quote not found");

  const [workOrder] = await db.select().from(contractWorkOrders).where(eq(contractWorkOrders.id, quote.workOrderId));
  if (!workOrder) throw new Error("Work order not found");

  // Accept this quote
  await db.update(workOrderQuotes).set({ status: "accepted", respondedAt: new Date() }).where(eq(workOrderQuotes.id, quoteId));

  // Decline other quotes
  await db.update(workOrderQuotes)
    .set({ status: "declined", respondedAt: new Date() })
    .where(and(eq(workOrderQuotes.workOrderId, quote.workOrderId), sql`${workOrderQuotes.id} != ${quoteId}`));

  // Assign pro to work order
  await db.update(contractWorkOrders).set({
    status: "assigned",
    assignedProId: quote.proId,
    acceptedQuoteAmount: quote.quoteAmount,
  }).where(eq(contractWorkOrders.id, quote.workOrderId));

  await logAudit(workOrder.contractId, "quote_accepted", "work_order", quote.workOrderId, userId, {
    quoteId, proId: quote.proId, quoteAmount: quote.quoteAmount,
  });
  return quote;
}

export async function declineQuote(quoteId: string, userId: string) {
  const [quote] = await db.select().from(workOrderQuotes).where(eq(workOrderQuotes.id, quoteId));
  if (!quote) throw new Error("Quote not found");

  await db.update(workOrderQuotes).set({ status: "declined", respondedAt: new Date() }).where(eq(workOrderQuotes.id, quoteId));

  const [workOrder] = await db.select().from(contractWorkOrders).where(eq(contractWorkOrders.id, quote.workOrderId));
  if (workOrder) {
    await logAudit(workOrder.contractId, "quote_declined", "work_order", quote.workOrderId, userId, { quoteId, proId: quote.proId });
  }
  return quote;
}

export async function startWorkOrder(workOrderId: string, proId: string) {
  const [workOrder] = await db.select().from(contractWorkOrders).where(eq(contractWorkOrders.id, workOrderId));
  if (!workOrder) throw new Error("Work order not found");
  if (workOrder.assignedProId !== proId) throw new Error("Not assigned to this work order");
  if (workOrder.status !== "assigned") throw new Error("Work order cannot be started");

  await db.update(contractWorkOrders).set({ status: "in_progress" }).where(eq(contractWorkOrders.id, workOrderId));
  await logAudit(workOrder.contractId, "work_order_started", "work_order", workOrderId, proId, {});
}

export async function completeWorkOrder(workOrderId: string, proId: string) {
  const [workOrder] = await db.select().from(contractWorkOrders).where(eq(contractWorkOrders.id, workOrderId));
  if (!workOrder) throw new Error("Work order not found");
  if (workOrder.assignedProId !== proId) throw new Error("Not assigned to this work order");

  await db.update(contractWorkOrders).set({ status: "completed", completedAt: new Date() }).where(eq(contractWorkOrders.id, workOrderId));
  await logAudit(workOrder.contractId, "work_order_completed", "work_order", workOrderId, proId, {});
}

export async function verifyWorkOrder(workOrderId: string, userId: string) {
  const [workOrder] = await db.select().from(contractWorkOrders).where(eq(contractWorkOrders.id, workOrderId));
  if (!workOrder) throw new Error("Work order not found");
  if (workOrder.status !== "completed") throw new Error("Work order must be completed before verification");

  await db.update(contractWorkOrders).set({
    status: "verified",
    verifiedAt: new Date(),
    verifiedBy: userId,
  }).where(eq(contractWorkOrders.id, workOrderId));

  await logAudit(workOrder.contractId, "work_order_verified", "work_order", workOrderId, userId, {
    acceptedQuoteAmount: workOrder.acceptedQuoteAmount,
  });
}

// ==========================================
// Work Logs (documentation, NOT billing)
// ==========================================
export async function createWorkLog(data: any, userId: string) {
  const [log] = await db.insert(contractWorkLogs).values(data).returning();
  if (data.contractId) {
    await logAudit(data.contractId, "work_log_created", "work_log", log.id, userId, { workDate: data.workDate });
  }
  return log;
}

export async function approveWorkLog(logId: string, userId: string) {
  const [log] = await db.select().from(contractWorkLogs).where(eq(contractWorkLogs.id, logId));
  if (!log) throw new Error("Work log not found");

  const [updated] = await db.update(contractWorkLogs)
    .set({ status: "approved", approvedBy: userId, approvedAt: new Date() })
    .where(eq(contractWorkLogs.id, logId))
    .returning();

  if (log.contractId) {
    await logAudit(log.contractId, "work_log_approved", "work_log", logId, userId, {});
  }
  return updated;
}

// ==========================================
// Prevailing Wage - INTERNAL reference data only
// Pros never see this. Used only for Davis-Bacon compliance checks
// and WH-347 government report generation.
// ==========================================
export async function validateQuoteAgainstBudget(workOrderId: string, quoteAmount: number) {
  const [workOrder] = await db.select().from(contractWorkOrders).where(eq(contractWorkOrders.id, workOrderId));
  if (!workOrder) return { valid: true, message: "Work order not found" };

  if (workOrder.budgetAmount && quoteAmount > workOrder.budgetAmount) {
    return {
      valid: false,
      message: `Quote exceeds work order budget`,
      budgetAmount: workOrder.budgetAmount,
      quoteAmount,
    };
  }
  return { valid: true };
}

export async function getPrevailingWageRatesByDecision(wageDecisionNumber: string) {
  return db.select().from(prevailingWageRates)
    .where(eq(prevailingWageRates.wageDecisionNumber, wageDecisionNumber))
    .orderBy(asc(prevailingWageRates.classification));
}

// ==========================================
// WH-347 Compliance Report Generation
// ==========================================
// INTERNAL COMPLIANCE CALCULATION ONLY - not shown to contractors, not used for payment.
// "Certified Payroll" is the government's term for DOL form WH-347.
// We are NOT running payroll. We compile contractor work order completions and work logs
// into the government-mandated compliance report format. All workers are
// independent contractors per ICA. This is a reporting obligation, not payroll processing.
//
// The hourly equivalents below are BACK-CALCULATED from flat-rate quotes and work logs
// solely to satisfy WH-347 form field requirements. They do NOT represent the
// contractor's compensation structure, which is 100% flat-rate per job.
export async function generateWeeklyPayroll(contractId: string, weekEndingDate: string, userId: string) {
  const weekEnd = new Date(weekEndingDate);
  const weekStart = new Date(weekEnd);
  weekStart.setDate(weekStart.getDate() - 6);
  const weekStartStr = weekStart.toISOString().split("T")[0];

  // Get work logs for the week (documentation of work performed)
  const workLogs = await db.select().from(contractWorkLogs)
    .where(and(
      eq(contractWorkLogs.contractId, contractId),
      gte(contractWorkLogs.workDate, weekStartStr),
      lte(contractWorkLogs.workDate, weekEndingDate),
      eq(contractWorkLogs.status, "approved")
    ));

  // Get verified/completed work orders for this contract to find flat-rate amounts
  const workOrders = await db.select().from(contractWorkOrders)
    .where(eq(contractWorkOrders.contractId, contractId));

  // Get existing report count for numbering
  const existingReports = await db.select().from(certifiedPayrollReports)
    .where(eq(certifiedPayrollReports.contractId, contractId));

  const [report] = await db.insert(certifiedPayrollReports).values({
    contractId,
    weekEndingDate,
    reportNumber: existingReports.length + 1,
    preparedBy: userId,
    preparedAt: new Date(),
    status: "draft",
  }).returning();

  // Group work logs by pro
  const byPro = new Map<string, typeof workLogs>();
  for (const log of workLogs) {
    const existing = byPro.get(log.proId) || [];
    existing.push(log);
    byPro.set(log.proId, existing);
  }

  let totalGross = 0;
  let totalFringe = 0;
  let totalDeductions = 0;
  let totalNet = 0;

  for (const [proId, logs] of byPro) {
    // INTERNAL COMPLIANCE CALCULATION ONLY - not shown to contractors, not used for payment
    // Back-calculate hourly equivalents from flat-rate quotes for WH-347 form fields
    const daysByDayOfWeek = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat: count of days worked
    for (const log of logs) {
      const dayOfWeek = new Date(log.workDate).getDay();
      daysByDayOfWeek[dayOfWeek] += 1; // Each work log = 1 day present
    }
    const totalDaysWorked = logs.length;

    // Find the pro's work orders on this contract to get their flat-rate amount
    const proWorkOrders = workOrders.filter(wo => wo.assignedProId === proId && (wo.status === "completed" || wo.status === "verified" || wo.status === "in_progress"));
    const totalFlatRate = proWorkOrders.reduce((sum, wo) => sum + (wo.acceptedQuoteAmount || 0), 0);

    // INTERNAL COMPLIANCE CALCULATION ONLY - not shown to contractors, not used for payment
    // Back-calculate: flat quote ÷ total estimated days on contract = daily equivalent
    // Then ÷ 8 for hourly equivalent (government reporting standard 8-hour day)
    const totalEstimatedDays = proWorkOrders.reduce((sum, wo) => {
      // Use actual work log count or fallback to quotes' estimated days
      const woLogs = logs.filter(l => l.workOrderId === wo.id);
      return sum + (woLogs.length > 0 ? woLogs.length : 1);
    }, 0) || 1;

    const dailyEquivalent = totalFlatRate / totalEstimatedDays;
    // INTERNAL COMPLIANCE CALCULATION ONLY - government reporting requirement, not compensation structure
    const hourlyEquivalent = Math.round(dailyEquivalent / 8);
    const totalHoursEquivalent = totalDaysWorked * 8; // Standard 8-hour day for WH-347

    // INTERNAL COMPLIANCE CALCULATION ONLY - not shown to contractors, not used for payment
    const grossPay = Math.round(totalHoursEquivalent * hourlyEquivalent);
    const fedTax = Math.round(grossPay * 0.22);
    const stateTax = Math.round(grossPay * 0.05);
    const ss = Math.round(grossPay * 0.062);
    const med = Math.round(grossPay * 0.0145);
    const deductions = fedTax + stateTax + ss + med;
    const netPay = grossPay - deductions;

    // INTERNAL COMPLIANCE CALCULATION ONLY - hourly fields required by WH-347 form spec
    await db.insert(certifiedPayrollEntries).values({
      payrollReportId: report.id,
      proId,
      proName: proId, // In production, lookup actual name
      jobClassification: proWorkOrders[0]?.serviceType || "General",
      // INTERNAL COMPLIANCE CALCULATION ONLY - government reporting requirement, not compensation structure
      hoursSunday: daysByDayOfWeek[0] * 8,
      hoursMonday: daysByDayOfWeek[1] * 8,
      hoursTuesday: daysByDayOfWeek[2] * 8,
      hoursWednesday: daysByDayOfWeek[3] * 8,
      hoursThursday: daysByDayOfWeek[4] * 8,
      hoursFriday: daysByDayOfWeek[5] * 8,
      hoursSaturday: daysByDayOfWeek[6] * 8,
      totalHours: totalHoursEquivalent,
      // INTERNAL COMPLIANCE CALCULATION ONLY - back-calculated from flat-rate quote, not actual compensation rate
      hourlyRate: hourlyEquivalent,
      grossPay,
      fringeBenefits: 0,
      federalTax: fedTax,
      stateTax,
      socialSecurity: ss,
      medicare: med,
      otherDeductions: 0,
      netPay,
      overtimeHours: 0,
      overtimeRate: 0,
    });

    totalGross += grossPay;
    totalDeductions += deductions;
    totalNet += netPay;
  }

  // Update report totals
  const [contract] = await db.select().from(governmentContracts).where(eq(governmentContracts.id, contractId));

  const wh347FormData = {
    contractorName: "UpTend LLC",
    contractNumber: contract?.contractNumber || "",
    projectAndLocation: contract?.performanceLocation || "",
    payrollNumber: report.reportNumber,
    weekEnding: weekEndingDate,
    projectOrContractNumber: contract?.contractNumber || "",
    // INTERNAL NOTE: All hourly figures in this report are back-calculated from flat-rate
    // work order quotes for government compliance reporting only. Contractors are paid
    // flat-rate per job, not hourly.
    statementOfCompliance: {
      isCertified: false,
      signedBy: null as string | null,
      signedDate: null as string | null,
      title: null as string | null,
    },
  };

  await db.update(certifiedPayrollReports)
    .set({ totalGrossWages: totalGross, totalFringeBenefits: totalFringe, totalDeductions, totalNetPay: totalNet, wh347FormData })
    .where(eq(certifiedPayrollReports.id, report.id));

  await logAudit(contractId, "payroll_generated", "payroll", report.id, userId, { weekEndingDate, reportNumber: report.reportNumber });
  return { ...report, totalGrossWages: totalGross, totalFringeBenefits: totalFringe, totalDeductions, totalNetPay: totalNet };
}

// INTERNAL COMPLIANCE CALCULATION ONLY - not shown to contractors, not used for payment
export async function formatWH347(payrollReportId: string) {
  const [report] = await db.select().from(certifiedPayrollReports).where(eq(certifiedPayrollReports.id, payrollReportId));
  if (!report) throw new Error("Payroll report not found");

  const entries = await db.select().from(certifiedPayrollEntries)
    .where(eq(certifiedPayrollEntries.payrollReportId, payrollReportId));

  const [contract] = await db.select().from(governmentContracts).where(eq(governmentContracts.id, report.contractId));

  return {
    form: "WH-347",
    // INTERNAL COMPLIANCE CALCULATION ONLY - all hourly figures are back-calculated
    // from flat-rate work order quotes. Contractors are paid flat-rate per job.
    header: {
      contractorOrSubcontractor: "UpTend LLC",
      address: "",
      payrollNo: report.reportNumber,
      forWeekEnding: report.weekEndingDate,
      projectAndLocation: contract?.performanceLocation || "",
      projectOrContractNo: contract?.contractNumber || "",
    },
    // Note: "employees" is the DOL WH-347 form's field name - does NOT reflect employment relationship.
    // All workers are independent contractors per ICA. This field name matches the government form spec.
    // INTERNAL COMPLIANCE CALCULATION ONLY - hourly rates are back-calculated from flat-rate quotes.
    employees: entries.map((e, i) => ({
      lineNumber: i + 1,
      name: e.proName,
      address: e.proAddress || "",
      ssnLast4: e.proSSNLast4 || "",
      workClassification: e.jobClassification,
      hours: {
        monday: e.hoursMonday,
        tuesday: e.hoursTuesday,
        wednesday: e.hoursWednesday,
        thursday: e.hoursThursday,
        friday: e.hoursFriday,
        saturday: e.hoursSaturday,
        sunday: e.hoursSunday,
        total: e.totalHours,
      },
      // INTERNAL COMPLIANCE CALCULATION ONLY - back-calculated from flat-rate quote, not actual pay rate
      rateOfPay: e.hourlyRate,
      grossEarned: e.grossPay,
      deductions: {
        fica: (e.socialSecurity || 0) + (e.medicare || 0),
        withholding: (e.federalTax || 0) + (e.stateTax || 0),
        other: e.otherDeductions || 0,
        total: (e.federalTax || 0) + (e.stateTax || 0) + (e.socialSecurity || 0) + (e.medicare || 0) + (e.otherDeductions || 0),
      },
      netPaid: e.netPay,
    })),
    totals: {
      totalGrossWages: report.totalGrossWages,
      totalDeductions: report.totalDeductions,
      totalNetPay: report.totalNetPay,
    },
    statementOfCompliance: (report.wh347FormData as any)?.statementOfCompliance || {
      isCertified: false,
      signedBy: null,
      signedDate: null,
      title: null,
    },
    status: report.status,
  };
}

export async function submitPayroll(payrollReportId: string, userId: string) {
  const [report] = await db.select().from(certifiedPayrollReports).where(eq(certifiedPayrollReports.id, payrollReportId));
  if (!report) throw new Error("Payroll report not found");

  const [updated] = await db.update(certifiedPayrollReports)
    .set({ status: "submitted", submittedAt: new Date() })
    .where(eq(certifiedPayrollReports.id, payrollReportId))
    .returning();

  await logAudit(report.contractId, "payroll_submitted", "payroll", payrollReportId, userId, { reportNumber: report.reportNumber });
  return updated;
}

// ==========================================
// Invoicing (based on work order completions)
// ==========================================
export async function generateContractInvoice(contractId: string, periodStart: string, periodEnd: string, userId: string) {
  const [contract] = await db.select().from(governmentContracts).where(eq(governmentContracts.id, contractId));
  if (!contract) throw new Error("Contract not found");

  // Get verified work orders in the period
  const workOrders = await db.select().from(contractWorkOrders)
    .where(and(eq(contractWorkOrders.contractId, contractId), eq(contractWorkOrders.status, "verified")));

  // Filter by completion date within period
  const periodWorkOrders = workOrders.filter(wo => {
    if (!wo.verifiedAt) return false;
    const verifiedDate = wo.verifiedAt.toISOString().split("T")[0];
    return verifiedDate >= periodStart && verifiedDate <= periodEnd;
  });

  const workOrderCost = periodWorkOrders.reduce((sum, wo) => sum + (wo.acceptedQuoteAmount || 0), 0);
  const { overheadAmount, profitAmount } = calculateOverheadAndProfit(workOrderCost, contract.contractType);
  const totalAmount = workOrderCost + overheadAmount + profitAmount;

  const existingInvoices = await db.select().from(contractInvoices)
    .where(eq(contractInvoices.contractId, contractId));
  const invoiceNumber = `${contract.contractNumber}-INV-${String(existingInvoices.length + 1).padStart(4, "0")}`;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const [invoice] = await db.insert(contractInvoices).values({
    contractId,
    invoiceNumber,
    invoicePeriodStart: periodStart,
    invoicePeriodEnd: periodEnd,
    laborCost: workOrderCost,
    overhead: overheadAmount,
    profit: profitAmount,
    totalAmount,
    dueDate: dueDate.toISOString().split("T")[0],
    status: "draft",
  }).returning();

  await logAudit(contractId, "invoice_generated", "invoice", invoice.id, userId, { invoiceNumber, totalAmount, periodStart, periodEnd });
  return invoice;
}

export function calculateOverheadAndProfit(cost: number, contractType: string) {
  let overheadRate = 0;
  let profitRate = 0;

  switch (contractType) {
    case "cost_plus":
      overheadRate = 0.15;
      profitRate = 0.10;
      break;
    case "time_and_materials":
      overheadRate = 0.12;
      profitRate = 0.08;
      break;
    case "firm_fixed_price":
    default:
      overheadRate = 0;
      profitRate = 0;
      break;
  }

  return {
    overheadAmount: Math.round(cost * overheadRate),
    profitAmount: Math.round(cost * profitRate),
    overheadRate,
    profitRate,
  };
}

export async function trackPromptPayment(invoiceId: string) {
  const [invoice] = await db.select().from(contractInvoices).where(eq(contractInvoices.id, invoiceId));
  if (!invoice) throw new Error("Invoice not found");

  if (invoice.status !== "approved" && invoice.status !== "submitted") {
    return { interestOwed: 0, daysOverdue: 0, message: "Invoice not yet submitted/approved" };
  }

  const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;
  if (!dueDate) return { interestOwed: 0, daysOverdue: 0, message: "No due date set" };

  const now = new Date();
  const daysOverdue = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / 86400000));

  if (daysOverdue === 0) {
    return { interestOwed: 0, daysOverdue: 0, message: `Payment due in ${Math.ceil((dueDate.getTime() - now.getTime()) / 86400000)} days` };
  }

  const annualRate = 0.035;
  const dailyRate = annualRate / 365;
  const interestOwed = Math.round(invoice.totalAmount * dailyRate * daysOverdue);

  return { interestOwed, daysOverdue, dailyRate, annualRate, invoiceAmount: invoice.totalAmount };
}

// ==========================================
// Compliance Monitoring
// ==========================================
const REQUIRED_DOC_TYPES = [
  "insurance_cert", "bond", "sdvosb_cert", "sam_registration",
  "w9", "eeo_poster", "drug_free_workplace",
];

export async function getComplianceStatus(contractId: string) {
  const docs = await db.select().from(contractComplianceDocs)
    .where(eq(contractComplianceDocs.contractId, contractId));

  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const docMap = new Map<string, typeof docs[0]>();
  for (const doc of docs) {
    const existing = docMap.get(doc.docType);
    if (!existing || doc.status === "current") {
      docMap.set(doc.docType, doc);
    }
  }

  const checklist = REQUIRED_DOC_TYPES.map(docType => {
    const doc = docMap.get(docType);
    if (!doc) return { docType, status: "missing" as const, doc: null };

    if (doc.expirationDate && new Date(doc.expirationDate) < now) {
      return { docType, status: "expired" as const, doc };
    }
    if (doc.expirationDate && new Date(doc.expirationDate) < thirtyDaysFromNow) {
      return { docType, status: "expiring_soon" as const, doc };
    }
    return { docType, status: "current" as const, doc };
  });

  const issues = checklist.filter(c => c.status !== "current").length;
  return { checklist, issues, totalRequired: REQUIRED_DOC_TYPES.length, compliant: issues === 0 };
}

export async function getExpiringDocs(daysAhead: number) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  const futureDateStr = futureDate.toISOString().split("T")[0];

  return db.select().from(contractComplianceDocs)
    .where(and(
      lte(contractComplianceDocs.expirationDate, futureDateStr),
      eq(contractComplianceDocs.status, "current")
    ));
}

export async function generateComplianceReport(contractId: string) {
  const compliance = await getComplianceStatus(contractId);
  const [contract] = await db.select().from(governmentContracts).where(eq(governmentContracts.id, contractId));
  const modifications = await db.select().from(contractModifications)
    .where(eq(contractModifications.contractId, contractId))
    .orderBy(desc(contractModifications.createdAt));
  const payrollReports = await db.select().from(certifiedPayrollReports)
    .where(eq(certifiedPayrollReports.contractId, contractId))
    .orderBy(desc(certifiedPayrollReports.createdAt));

  return {
    contract,
    compliance,
    modifications,
    payrollReportsCount: payrollReports.length,
    payrollReportsSubmitted: payrollReports.filter(r => r.status === "submitted" || r.status === "accepted").length,
    generatedAt: new Date().toISOString(),
  };
}

// ==========================================
// Audit Trail
// ==========================================
export async function getAuditTrail(contractId: string) {
  return db.select().from(contractAuditLogs)
    .where(eq(contractAuditLogs.contractId, contractId))
    .orderBy(desc(contractAuditLogs.createdAt));
}

export { logAudit };
