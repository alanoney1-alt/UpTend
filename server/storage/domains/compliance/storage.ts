import { db } from "../../../db";
import {
  complianceReceipts,
  mileageLogs,
  type ComplianceReceipt,
  type InsertComplianceReceipt,
  type MileageLog,
  type InsertMileageLog
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { desc } from "drizzle-orm";

export interface IComplianceStorage {
  createComplianceReceipt(receipt: InsertComplianceReceipt): Promise<ComplianceReceipt>;
  getComplianceReceiptsByHauler(haulerId: string): Promise<ComplianceReceipt[]>;
  getComplianceReceiptSummary(haulerId: string, year: number): Promise<{ totalExpenses: number; totalDeductible: number; byCategory: Record<string, number> }>;
  createMileageLog(log: InsertMileageLog): Promise<MileageLog>;
  getMileageLogsByHauler(haulerId: string): Promise<MileageLog[]>;
  getMileageSummary(haulerId: string, year: number): Promise<{ totalMiles: number; businessMiles: number; totalDeduction: number }>;
}

export class ComplianceStorage implements IComplianceStorage {
  async createComplianceReceipt(receipt: InsertComplianceReceipt): Promise<ComplianceReceipt> {
    const [result] = await db.insert(complianceReceipts).values(receipt).returning();
    return result;
  }

  async getComplianceReceiptsByHauler(haulerId: string): Promise<ComplianceReceipt[]> {
    return db.select().from(complianceReceipts).where(eq(complianceReceipts.haulerId, haulerId)).orderBy(desc(complianceReceipts.createdAt));
  }

  async getComplianceReceiptSummary(haulerId: string, year: number): Promise<{ totalExpenses: number; totalDeductible: number; byCategory: Record<string, number> }> {
    const receipts = await db.select().from(complianceReceipts)
      .where(and(eq(complianceReceipts.haulerId, haulerId)));
    const yearReceipts = receipts.filter(r => r.receiptDate.startsWith(String(year)));
    const totalExpenses = yearReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);
    const totalDeductible = yearReceipts.filter(r => r.taxDeductible).reduce((sum, r) => sum + (r.amount || 0), 0);
    const byCategory: Record<string, number> = {};
    yearReceipts.forEach(r => {
      const cat = r.category || r.receiptType || "other";
      byCategory[cat] = (byCategory[cat] || 0) + (r.amount || 0);
    });
    return { totalExpenses, totalDeductible, byCategory };
  }

  async createMileageLog(log: InsertMileageLog): Promise<MileageLog> {
    const deduction = (log.distanceMiles * (log.irsRateCentsPerMile || 67)) / 100;
    const [result] = await db.insert(mileageLogs).values({ ...log, deductionAmount: deduction }).returning();
    return result;
  }

  async getMileageLogsByHauler(haulerId: string): Promise<MileageLog[]> {
    return db.select().from(mileageLogs).where(eq(mileageLogs.haulerId, haulerId)).orderBy(desc(mileageLogs.createdAt));
  }

  async getMileageSummary(haulerId: string, year: number): Promise<{ totalMiles: number; businessMiles: number; totalDeduction: number }> {
    const logs = await db.select().from(mileageLogs).where(eq(mileageLogs.haulerId, haulerId));
    const yearLogs = logs.filter(l => l.tripDate.startsWith(String(year)));
    const totalMiles = yearLogs.reduce((sum, l) => sum + (l.distanceMiles || 0), 0);
    const businessMiles = yearLogs.filter(l => l.purpose === "business").reduce((sum, l) => sum + (l.distanceMiles || 0), 0);
    const totalDeduction = yearLogs.filter(l => l.purpose === "business").reduce((sum, l) => sum + (l.deductionAmount || 0), 0);
    return { totalMiles, businessMiles, totalDeduction };
  }
}
