/**
 * Tax Reporting Service
 * Generates monthly, quarterly, annual, and 1099-K reports for pros and businesses.
 */

import { db } from "../db";
import { serviceRequests } from "../../shared/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { PRO_PLATFORM_FEE_PERCENT, CUSTOMER_SERVICE_FEE_PERCENT } from "./fee-calculator-v2";

export interface TaxLineItem {
  date: string;
  jobId: string;
  serviceType: string;
  grossAmount: number;
  platformFee: number;
  netPayout: number;
}

export interface MonthlyReport {
  year: number;
  month: number;
  grossRevenue: number;
  platformFees: number;
  serviceFees: number;
  netPayouts: number;
  jobCount: number;
  items: TaxLineItem[];
}

export interface QuarterlySummary {
  year: number;
  quarter: number;
  months: { month: number; grossRevenue: number; platformFees: number; netPayouts: number; jobCount: number }[];
  totalGross: number;
  totalFees: number;
  totalNet: number;
  totalJobs: number;
}

export interface AnnualSummary {
  year: number;
  grossRevenue: number;
  platformFees: number;
  serviceFees: number;
  netPayouts: number;
  totalJobs: number;
  quarters: QuarterlySummary[];
}

export interface Data1099K {
  year: number;
  grossAmount: number;
  transactionCount: number;
  monthlyBreakdown: { month: number; gross: number; count: number }[];
  threshold1099: boolean; // true if > $600
  recipientName?: string;
  recipientTin?: string;
}

async function getCompletedJobs(proOrBusinessId: string, startDate: string, endDate: string) {
  // Try as assigned hauler first, then as business partner
  const jobs = await db
    .select({
      id: serviceRequests.id,
      serviceType: serviceRequests.serviceType,
      finalPrice: serviceRequests.finalPrice,
      completedAt: serviceRequests.completedAt,
      createdAt: serviceRequests.createdAt,
      businessPartnerId: serviceRequests.businessPartnerId,
    })
    .from(serviceRequests)
    .where(
      and(
        sql`(${serviceRequests.assignedHaulerId} = ${proOrBusinessId} OR ${serviceRequests.businessPartnerId} = ${proOrBusinessId})`,
        eq(serviceRequests.status, "completed"),
        sql`${serviceRequests.completedAt} >= ${startDate}`,
        sql`${serviceRequests.completedAt} < ${endDate}`
      )
    );

  return jobs;
}

function buildLineItems(jobs: any[]): TaxLineItem[] {
  return jobs.map((job) => {
    const gross = job.finalPrice || 0;
    const platformFee = Math.round(gross * (PRO_PLATFORM_FEE_PERCENT / 100) * 100) / 100;
    const net = Math.round((gross - platformFee) * 100) / 100;
    return {
      date: job.completedAt || job.createdAt,
      jobId: job.id,
      serviceType: job.serviceType,
      grossAmount: gross,
      platformFee,
      netPayout: Math.max(net, 0),
    };
  });
}

export async function generateMonthlyReport(
  proOrBusinessId: string,
  month: number,
  year: number
): Promise<MonthlyReport> {
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 1).toISOString();

  const jobs = await getCompletedJobs(proOrBusinessId, startDate, endDate);
  const items = buildLineItems(jobs);

  const grossRevenue = items.reduce((sum, i) => sum + i.grossAmount, 0);
  const platformFees = items.reduce((sum, i) => sum + i.platformFee, 0);
  const serviceFees = Math.round(grossRevenue * (CUSTOMER_SERVICE_FEE_PERCENT / 100) * 100) / 100;
  const netPayouts = items.reduce((sum, i) => sum + i.netPayout, 0);

  return {
    year,
    month,
    grossRevenue: Math.round(grossRevenue * 100) / 100,
    platformFees: Math.round(platformFees * 100) / 100,
    serviceFees,
    netPayouts: Math.round(netPayouts * 100) / 100,
    jobCount: items.length,
    items,
  };
}

export async function generateQuarterlySummary(
  proOrBusinessId: string,
  quarter: number,
  year: number
): Promise<QuarterlySummary> {
  const startMonth = (quarter - 1) * 3 + 1;
  const months = [];
  let totalGross = 0, totalFees = 0, totalNet = 0, totalJobs = 0;

  for (let m = startMonth; m < startMonth + 3; m++) {
    const report = await generateMonthlyReport(proOrBusinessId, m, year);
    months.push({
      month: m,
      grossRevenue: report.grossRevenue,
      platformFees: report.platformFees,
      netPayouts: report.netPayouts,
      jobCount: report.jobCount,
    });
    totalGross += report.grossRevenue;
    totalFees += report.platformFees;
    totalNet += report.netPayouts;
    totalJobs += report.jobCount;
  }

  return {
    year,
    quarter,
    months,
    totalGross: Math.round(totalGross * 100) / 100,
    totalFees: Math.round(totalFees * 100) / 100,
    totalNet: Math.round(totalNet * 100) / 100,
    totalJobs,
  };
}

export async function generateAnnualSummary(
  proOrBusinessId: string,
  year: number
): Promise<AnnualSummary> {
  const quarters = [];
  let grossRevenue = 0, platformFees = 0, serviceFees = 0, netPayouts = 0, totalJobs = 0;

  for (let q = 1; q <= 4; q++) {
    const qs = await generateQuarterlySummary(proOrBusinessId, q, year);
    quarters.push(qs);
    grossRevenue += qs.totalGross;
    platformFees += qs.totalFees;
    netPayouts += qs.totalNet;
    totalJobs += qs.totalJobs;
  }

  serviceFees = Math.round(grossRevenue * (CUSTOMER_SERVICE_FEE_PERCENT / 100) * 100) / 100;

  return {
    year,
    grossRevenue: Math.round(grossRevenue * 100) / 100,
    platformFees: Math.round(platformFees * 100) / 100,
    serviceFees,
    netPayouts: Math.round(netPayouts * 100) / 100,
    totalJobs,
    quarters,
  };
}

export async function generate1099Data(
  proOrBusinessId: string,
  year: number
): Promise<Data1099K> {
  const monthlyBreakdown = [];
  let grossAmount = 0;
  let transactionCount = 0;

  for (let m = 1; m <= 12; m++) {
    const report = await generateMonthlyReport(proOrBusinessId, m, year);
    monthlyBreakdown.push({
      month: m,
      gross: report.grossRevenue,
      count: report.jobCount,
    });
    grossAmount += report.grossRevenue;
    transactionCount += report.jobCount;
  }

  return {
    year,
    grossAmount: Math.round(grossAmount * 100) / 100,
    transactionCount,
    monthlyBreakdown,
    threshold1099: grossAmount > 600,
  };
}

// CSV generation helpers
export function monthlyReportToCSV(report: MonthlyReport): string {
  const lines = ["Date,Job ID,Service Type,Gross Amount,Platform Fee (15%),Net Payout"];
  for (const item of report.items) {
    lines.push(`${item.date},${item.jobId},${item.serviceType},${item.grossAmount.toFixed(2)},${item.platformFee.toFixed(2)},${item.netPayout.toFixed(2)}`);
  }
  lines.push("");
  lines.push(`,,TOTALS,${report.grossRevenue.toFixed(2)},${report.platformFees.toFixed(2)},${report.netPayouts.toFixed(2)}`);
  return lines.join("\n");
}

export function annualExportToCSV(reports: MonthlyReport[]): string {
  const lines = ["Date,Job ID,Service Type,Gross Amount,Platform Fee (15%),Net Payout,Month"];
  let totalGross = 0, totalFees = 0, totalNet = 0;

  for (const report of reports) {
    for (const item of report.items) {
      lines.push(`${item.date},${item.jobId},${item.serviceType},${item.grossAmount.toFixed(2)},${item.platformFee.toFixed(2)},${item.netPayout.toFixed(2)},${report.month}`);
      totalGross += item.grossAmount;
      totalFees += item.platformFee;
      totalNet += item.netPayout;
    }
  }

  lines.push("");
  lines.push(`,,ANNUAL TOTALS,${totalGross.toFixed(2)},${totalFees.toFixed(2)},${totalNet.toFixed(2)},`);
  return lines.join("\n");
}
