import { db } from "../db";
import { eq, and, sql, desc, asc, lte, gte } from "drizzle-orm";
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
} from "@shared/schema";

// ==========================================
// Audit Trail — immutable, logs everything
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
  const laborEntries = await db.select().from(contractLaborEntries).where(eq(contractLaborEntries.contractId, contractId));
  const invoices = await db.select().from(contractInvoices).where(eq(contractInvoices.contractId, contractId));
  const complianceDocs = await db.select().from(contractComplianceDocs).where(eq(contractComplianceDocs.contractId, contractId));

  const totalLaborCost = laborEntries.reduce((sum, e) => {
    const regular = Math.round(e.hoursWorked * e.hourlyRate);
    const ot = Math.round((e.overtimeHours || 0) * (e.overtimeRate || 0));
    return sum + regular + ot + (e.fringeBenefits || 0);
  }, 0);

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = invoices.filter(i => i.status === "paid").reduce((sum, inv) => sum + (inv.paymentAmount || 0), 0);
  const completedMilestones = milestones.filter(m => m.status === "accepted").length;
  const complianceIssues = complianceDocs.filter(d => d.status === "expired" || d.status === "missing").length;

  const burnRate = contract.totalValue > 0 ? Math.round((totalLaborCost / contract.totalValue) * 10000) / 100 : 0;

  return {
    contract,
    summary: {
      totalValue: contract.totalValue,
      fundedAmount: contract.fundedAmount,
      totalLaborCost,
      totalInvoiced,
      totalPaid,
      remainingBalance: contract.fundedAmount - totalInvoiced,
      burnRate,
      milestonesTotal: milestones.length,
      milestonesCompleted: completedMilestones,
      complianceIssues,
    },
    milestones,
    recentLabor: laborEntries.slice(-10),
    recentInvoices: invoices.slice(-5),
    complianceDocs,
  };
}

export async function getContractFinancials(contractId: string) {
  const [contract] = await db.select().from(governmentContracts).where(eq(governmentContracts.id, contractId));
  if (!contract) throw new Error("Contract not found");

  const laborEntries = await db.select().from(contractLaborEntries)
    .where(and(eq(contractLaborEntries.contractId, contractId), eq(contractLaborEntries.status, "approved")));
  const invoices = await db.select().from(contractInvoices).where(eq(contractInvoices.contractId, contractId));

  const totalLabor = laborEntries.reduce((sum, e) => {
    return sum + Math.round(e.hoursWorked * e.hourlyRate) + Math.round((e.overtimeHours || 0) * (e.overtimeRate || 0)) + (e.fringeBenefits || 0);
  }, 0);

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
    spent: { labor: totalLabor, materials: totalMaterials, equipment: totalEquipment, subcontractor: totalSubcontractor },
    totalInvoiced,
    totalPaid,
    remaining: contract.fundedAmount - totalInvoiced,
    dailyBurnRate: Math.round(dailyBurnRate),
    percentComplete: contract.totalValue > 0 ? Math.round((totalInvoiced / contract.totalValue) * 10000) / 100 : 0,
  };
}

// ==========================================
// Prevailing Wage Compliance
// ==========================================
export async function validateLaborRate(contractId: string, classification: string, rate: number) {
  const [contract] = await db.select().from(governmentContracts).where(eq(governmentContracts.id, contractId));
  if (!contract || !contract.prevailingWageDetermination) return { valid: true, message: "No prevailing wage determination on contract" };

  const wageRates = await db.select().from(prevailingWageRates)
    .where(and(
      eq(prevailingWageRates.wageDecisionNumber, contract.prevailingWageDetermination),
      eq(prevailingWageRates.classification, classification)
    ));

  if (wageRates.length === 0) return { valid: true, message: "No prevailing wage rate found for classification", warning: true };

  const requiredRate = wageRates[0].totalRate;
  if (rate < requiredRate) {
    return {
      valid: false,
      message: `Rate ${rate} is below prevailing wage minimum ${requiredRate} for ${classification}`,
      requiredRate,
      shortfall: requiredRate - rate,
    };
  }
  return { valid: true, requiredRate };
}

export async function getPrevailingWageRatesByDecision(wageDecisionNumber: string) {
  return db.select().from(prevailingWageRates)
    .where(eq(prevailingWageRates.wageDecisionNumber, wageDecisionNumber))
    .orderBy(asc(prevailingWageRates.classification));
}

export async function flagUnderpayment(contractId: string, entryId: string, userId: string) {
  const [entry] = await db.select().from(contractLaborEntries).where(eq(contractLaborEntries.id, entryId));
  if (!entry) throw new Error("Labor entry not found");

  await db.update(contractLaborEntries).set({ status: "disputed" }).where(eq(contractLaborEntries.id, entryId));
  await logAudit(contractId, "underpayment_flagged", "labor", entryId, userId, {
    classification: entry.jobClassification,
    rate: entry.hourlyRate,
    prevailingRate: entry.prevailingWageRate,
  });
}

// ==========================================
// WH-347 Compliance Report Generation
// ==========================================
// IMPORTANT: "Certified Payroll" is the government's term for DOL form WH-347.
// We are NOT running payroll. We compile contractor-submitted invoices/labor logs
// into the government-mandated compliance report format. All workers are
// independent contractors per ICA. This is a reporting obligation, not payroll processing.
export async function generateWeeklyPayroll(contractId: string, weekEndingDate: string, userId: string) {
  // Get contractor-submitted labor invoices for the week
  const weekEnd = new Date(weekEndingDate);
  const weekStart = new Date(weekEnd);
  weekStart.setDate(weekStart.getDate() - 6);
  const weekStartStr = weekStart.toISOString().split("T")[0];

  const laborEntries = await db.select().from(contractLaborEntries)
    .where(and(
      eq(contractLaborEntries.contractId, contractId),
      gte(contractLaborEntries.workDate, weekStartStr),
      lte(contractLaborEntries.workDate, weekEndingDate),
      eq(contractLaborEntries.status, "approved")
    ));

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

  // Group labor entries by pro
  const byPro = new Map<string, typeof laborEntries>();
  for (const entry of laborEntries) {
    const existing = byPro.get(entry.proId) || [];
    existing.push(entry);
    byPro.set(entry.proId, existing);
  }

  let totalGross = 0;
  let totalFringe = 0;
  let totalDeductions = 0;
  let totalNet = 0;

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  for (const [proId, entries] of byPro) {
    const hoursByDay = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
    let totalHours = 0;
    let otHours = 0;
    const classification = entries[0].jobClassification;
    const rate = entries[0].hourlyRate;
    const otRate = entries[0].overtimeRate || Math.round(rate * 1.5);
    const fringe = entries.reduce((s, e) => s + (e.fringeBenefits || 0), 0);

    for (const entry of entries) {
      const dayOfWeek = new Date(entry.workDate).getDay();
      hoursByDay[dayOfWeek] += entry.hoursWorked;
      totalHours += entry.hoursWorked;
      otHours += entry.overtimeHours || 0;
    }

    const grossPay = Math.round(totalHours * rate) + Math.round(otHours * otRate);
    // Estimate deductions (simplified — real system would pull from payroll provider)
    const fedTax = Math.round(grossPay * 0.22);
    const stateTax = Math.round(grossPay * 0.05);
    const ss = Math.round(grossPay * 0.062);
    const med = Math.round(grossPay * 0.0145);
    const deductions = fedTax + stateTax + ss + med;
    const netPay = grossPay + fringe - deductions;

    await db.insert(certifiedPayrollEntries).values({
      payrollReportId: report.id,
      proId,
      proName: proId, // In production, lookup actual name
      jobClassification: classification,
      hoursSunday: hoursByDay[0],
      hoursMonday: hoursByDay[1],
      hoursTuesday: hoursByDay[2],
      hoursWednesday: hoursByDay[3],
      hoursThursday: hoursByDay[4],
      hoursFriday: hoursByDay[5],
      hoursSaturday: hoursByDay[6],
      totalHours,
      hourlyRate: rate,
      grossPay,
      fringeBenefits: fringe,
      federalTax: fedTax,
      stateTax,
      socialSecurity: ss,
      medicare: med,
      otherDeductions: 0,
      netPay,
      overtimeHours: otHours,
      overtimeRate: otRate,
    });

    totalGross += grossPay;
    totalFringe += fringe;
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

export async function formatWH347(payrollReportId: string) {
  const [report] = await db.select().from(certifiedPayrollReports).where(eq(certifiedPayrollReports.id, payrollReportId));
  if (!report) throw new Error("Payroll report not found");

  const entries = await db.select().from(certifiedPayrollEntries)
    .where(eq(certifiedPayrollEntries.payrollReportId, payrollReportId));

  const [contract] = await db.select().from(governmentContracts).where(eq(governmentContracts.id, report.contractId));

  return {
    form: "WH-347",
    header: {
      contractorOrSubcontractor: "UpTend LLC",
      address: "",
      payrollNo: report.reportNumber,
      forWeekEnding: report.weekEndingDate,
      projectAndLocation: contract?.performanceLocation || "",
      projectOrContractNo: contract?.contractNumber || "",
    },
    // Note: "employees" is the DOL WH-347 form's field name — does NOT reflect employment relationship.
    // All workers are independent contractors per ICA. This field name matches the government form spec.
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
// Invoicing
// ==========================================
export async function generateContractInvoice(contractId: string, periodStart: string, periodEnd: string, userId: string) {
  const laborEntries = await db.select().from(contractLaborEntries)
    .where(and(
      eq(contractLaborEntries.contractId, contractId),
      eq(contractLaborEntries.status, "approved"),
      gte(contractLaborEntries.workDate, periodStart),
      lte(contractLaborEntries.workDate, periodEnd)
    ));

  const laborCost = laborEntries.reduce((sum, e) => {
    return sum + Math.round(e.hoursWorked * e.hourlyRate) + Math.round((e.overtimeHours || 0) * (e.overtimeRate || 0)) + (e.fringeBenefits || 0);
  }, 0);

  const [contract] = await db.select().from(governmentContracts).where(eq(governmentContracts.id, contractId));
  if (!contract) throw new Error("Contract not found");

  const { overheadAmount, profitAmount } = calculateOverheadAndProfit(laborCost, contract.contractType);
  const totalAmount = laborCost + overheadAmount + profitAmount;

  // Invoice numbering
  const existingInvoices = await db.select().from(contractInvoices)
    .where(eq(contractInvoices.contractId, contractId));
  const invoiceNumber = `${contract.contractNumber}-INV-${String(existingInvoices.length + 1).padStart(4, "0")}`;

  // Prompt Payment Act: due in 30 days
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const [invoice] = await db.insert(contractInvoices).values({
    contractId,
    invoiceNumber,
    invoicePeriodStart: periodStart,
    invoicePeriodEnd: periodEnd,
    laborCost,
    overhead: overheadAmount,
    profit: profitAmount,
    totalAmount,
    dueDate: dueDate.toISOString().split("T")[0],
    status: "draft",
  }).returning();

  await logAudit(contractId, "invoice_generated", "invoice", invoice.id, userId, { invoiceNumber, totalAmount, periodStart, periodEnd });
  return invoice;
}

export function calculateOverheadAndProfit(laborCost: number, contractType: string) {
  // Standard overhead rates for government contracts
  let overheadRate = 0;
  let profitRate = 0;

  switch (contractType) {
    case "cost_plus":
      overheadRate = 0.15; // 15% overhead
      profitRate = 0.10;   // 10% profit (fee)
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
    overheadAmount: Math.round(laborCost * overheadRate),
    profitAmount: Math.round(laborCost * profitRate),
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

  // Prompt Payment Act interest rate (simplified — real rate from Treasury)
  const annualRate = 0.035; // 3.5% per annum placeholder
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
  const disputedLabor = await db.select().from(contractLaborEntries)
    .where(and(eq(contractLaborEntries.contractId, contractId), eq(contractLaborEntries.status, "disputed")));

  return {
    contract,
    compliance,
    modifications,
    payrollReportsCount: payrollReports.length,
    payrollReportsSubmitted: payrollReports.filter(r => r.status === "submitted" || r.status === "accepted").length,
    disputedLaborEntries: disputedLabor.length,
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
