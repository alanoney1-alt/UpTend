import { db } from "../../../db";
import {
  jobVerification,
  disposalRecords,
  type JobVerification,
  type InsertJobVerification,
  type DisposalRecord,
  type InsertDisposalRecord,
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IJobVerificationStorage {
  // Job Verification
  createJobVerification(verification: InsertJobVerification): Promise<JobVerification>;
  getJobVerification(serviceRequestId: string): Promise<JobVerification | undefined>;
  updateJobVerification(id: string, updates: Partial<JobVerification>): Promise<JobVerification | undefined>;

  // Disposal Records
  createDisposalRecord(record: InsertDisposalRecord): Promise<DisposalRecord>;
  getDisposalRecordsByVerification(verificationId: string): Promise<DisposalRecord[]>;
  getDisposalRecordsByServiceRequest(serviceRequestId: string): Promise<DisposalRecord[]>;
  updateDisposalRecord(id: string, updates: Partial<DisposalRecord>): Promise<DisposalRecord | undefined>;
}

export class JobVerificationStorage implements IJobVerificationStorage {
  // Job Verification
  async createJobVerification(verification: InsertJobVerification): Promise<JobVerification> {
    const [newVerification] = await db.insert(jobVerification).values(verification).returning();
    return newVerification;
  }

  async getJobVerification(serviceRequestId: string): Promise<JobVerification | undefined> {
    const [verification] = await db
      .select()
      .from(jobVerification)
      .where(eq(jobVerification.serviceRequestId, serviceRequestId));
    return verification || undefined;
  }

  async updateJobVerification(id: string, updates: Partial<JobVerification>): Promise<JobVerification | undefined> {
    const [verification] = await db
      .update(jobVerification)
      .set(updates)
      .where(eq(jobVerification.id, id))
      .returning();
    return verification || undefined;
  }

  // Disposal Records
  async createDisposalRecord(record: InsertDisposalRecord): Promise<DisposalRecord> {
    const [newRecord] = await db.insert(disposalRecords).values(record).returning();
    return newRecord;
  }

  async getDisposalRecordsByVerification(verificationId: string): Promise<DisposalRecord[]> {
    return db
      .select()
      .from(disposalRecords)
      .where(eq(disposalRecords.verificationId, verificationId));
  }

  async getDisposalRecordsByServiceRequest(serviceRequestId: string): Promise<DisposalRecord[]> {
    return db
      .select()
      .from(disposalRecords)
      .where(eq(disposalRecords.serviceRequestId, serviceRequestId));
  }

  async updateDisposalRecord(id: string, updates: Partial<DisposalRecord>): Promise<DisposalRecord | undefined> {
    const [record] = await db
      .update(disposalRecords)
      .set(updates)
      .where(eq(disposalRecords.id, id))
      .returning();
    return record || undefined;
  }
}
