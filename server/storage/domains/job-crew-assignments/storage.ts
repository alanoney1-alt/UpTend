import { db } from "../../../db";
import {
  jobCrewAssignments,
  type JobCrewAssignment,
  type InsertJobCrewAssignment,
} from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

export interface IJobCrewAssignmentsStorage {
  createJobCrewAssignment(assignment: InsertJobCrewAssignment): Promise<JobCrewAssignment>;
  getJobCrewAssignments(serviceRequestId: string): Promise<JobCrewAssignment[]>;
  getCrewAssignmentsByHauler(haulerId: string): Promise<JobCrewAssignment[]>;
  updateJobCrewAssignment(id: string, updates: Partial<JobCrewAssignment>): Promise<JobCrewAssignment | undefined>;
  getAcceptedCrewCount(serviceRequestId: string): Promise<number>;
}

export class JobCrewAssignmentsStorage implements IJobCrewAssignmentsStorage {
  async createJobCrewAssignment(assignment: InsertJobCrewAssignment): Promise<JobCrewAssignment> {
    const [newAssignment] = await db.insert(jobCrewAssignments).values(assignment).returning();
    return newAssignment;
  }

  async getJobCrewAssignments(serviceRequestId: string): Promise<JobCrewAssignment[]> {
    return db.select().from(jobCrewAssignments).where(eq(jobCrewAssignments.serviceRequestId, serviceRequestId));
  }

  async getCrewAssignmentsByHauler(haulerId: string): Promise<JobCrewAssignment[]> {
    return db.select().from(jobCrewAssignments).where(eq(jobCrewAssignments.haulerId, haulerId));
  }

  async updateJobCrewAssignment(id: string, updates: Partial<JobCrewAssignment>): Promise<JobCrewAssignment | undefined> {
    const [assignment] = await db.update(jobCrewAssignments)
      .set(updates)
      .where(eq(jobCrewAssignments.id, id))
      .returning();
    return assignment || undefined;
  }

  async getAcceptedCrewCount(serviceRequestId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(jobCrewAssignments)
      .where(
        and(
          eq(jobCrewAssignments.serviceRequestId, serviceRequestId),
          eq(jobCrewAssignments.status, "accepted")
        )
      );

    return Number(result[0]?.count || 0);
  }
}
