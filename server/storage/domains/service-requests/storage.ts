import { db } from "../../../db";
import {
  serviceRequests,
  matchAttempts,
  type ServiceRequest,
  type InsertServiceRequest,
  type MatchAttempt,
  type InsertMatchAttempt,
  type ServiceRequestWithDetails
} from "@shared/schema";
import { eq, and, or } from "drizzle-orm";

export interface IServiceRequestsStorage {
  getServiceRequest(id: string): Promise<ServiceRequest | undefined>;
  getServiceRequestWithDetails(id: string): Promise<ServiceRequestWithDetails | undefined>;
  getServiceRequestsByCustomer(customerId: string): Promise<ServiceRequest[]>;
  getServiceRequestsByHauler(haulerId: string): Promise<ServiceRequest[]>;
  getPendingRequests(): Promise<ServiceRequestWithDetails[]>;
  getPendingRequestsBasic(): Promise<ServiceRequest[]>;
  getActiveJobsForHauler(haulerId: string): Promise<ServiceRequest[]>;
  createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest>;
  updateServiceRequest(id: string, updates: Partial<ServiceRequest>): Promise<ServiceRequest | undefined>;
  acceptServiceRequest(id: string, haulerId: string, updates: Partial<ServiceRequest>): Promise<ServiceRequest | undefined>;

  getMatchAttempt(id: string): Promise<MatchAttempt | undefined>;
  getMatchAttemptsByRequest(requestId: string): Promise<MatchAttempt[]>;
  getMatchAttemptsByHauler(haulerId: string): Promise<MatchAttempt[]>;
  getPendingMatchesForHauler(haulerId: string): Promise<(MatchAttempt & { request: ServiceRequest })[]>;
  createMatchAttempt(match: InsertMatchAttempt): Promise<MatchAttempt>;
  updateMatchAttempt(id: string, updates: Partial<MatchAttempt>): Promise<MatchAttempt | undefined>;
}

export class ServiceRequestsStorage implements IServiceRequestsStorage {
  async getServiceRequest(id: string): Promise<ServiceRequest | undefined> {
    const [request] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, id));
    return request || undefined;
  }

  // NOTE: This method has cross-domain dependencies:
  // - getUser from users domain
  // - getHaulerProfile from hauler-profiles domain
  // - getPyckerVehicle from vehicles domain
  // - getMatchAttemptsByRequest (from this domain)
  // These should be handled at the composition layer (DatabaseStorage)
  async getServiceRequestWithDetails(id: string): Promise<ServiceRequestWithDetails | undefined> {
    // TODO: This requires cross-domain calls - should be implemented in DatabaseStorage
    throw new Error("getServiceRequestWithDetails requires composition - use DatabaseStorage class");
  }

  async getServiceRequestsByCustomer(customerId: string): Promise<ServiceRequest[]> {
    return db.select().from(serviceRequests).where(eq(serviceRequests.customerId, customerId));
  }

  async getServiceRequestsByHauler(haulerId: string): Promise<ServiceRequest[]> {
    return db.select().from(serviceRequests).where(eq(serviceRequests.assignedHaulerId, haulerId));
  }

  // Returns basic pending requests without enrichment
  async getPendingRequestsBasic(): Promise<ServiceRequest[]> {
    return db.select().from(serviceRequests)
      .where(or(
        eq(serviceRequests.status, "pending"),
        eq(serviceRequests.status, "requested")
      ));
  }

  // NOTE: This method has cross-domain dependencies:
  // - getUser from users domain
  // - getMatchAttemptsByRequest (from this domain)
  // Should be handled at the composition layer (DatabaseStorage)
  async getPendingRequests(): Promise<ServiceRequestWithDetails[]> {
    // TODO: This requires cross-domain calls - should be implemented in DatabaseStorage
    throw new Error("getPendingRequests requires composition - use DatabaseStorage class");
  }

  async getActiveJobsForHauler(haulerId: string): Promise<ServiceRequest[]> {
    return db.select().from(serviceRequests)
      .where(and(
        eq(serviceRequests.assignedHaulerId, haulerId),
        or(eq(serviceRequests.status, "assigned"), eq(serviceRequests.status, "in_progress"))
      ));
  }

  async createServiceRequest(request: InsertServiceRequest): Promise<ServiceRequest> {
    const [newRequest] = await db.insert(serviceRequests).values(request).returning();
    return newRequest;
  }

  async updateServiceRequest(id: string, updates: Partial<ServiceRequest>): Promise<ServiceRequest | undefined> {
    const [request] = await db.update(serviceRequests)
      .set(updates)
      .where(eq(serviceRequests.id, id))
      .returning();
    return request || undefined;
  }

  // Complex transaction with row-level locking to prevent race conditions
  async acceptServiceRequest(id: string, haulerId: string, updates: Partial<ServiceRequest>): Promise<ServiceRequest | undefined> {
    return await db.transaction(async (tx) => {
      // Lock the row to prevent concurrent accepts
      const [locked] = await tx
        .select()
        .from(serviceRequests)
        .where(eq(serviceRequests.id, id))
        .for("update");

      if (!locked) return undefined;
      if (locked.acceptedAt) return undefined;
      if (locked.cancelledAt) return undefined;
      if (!["pending", "requested", "matched", "matching"].includes(locked.status)) return undefined;

      const [updated] = await tx
        .update(serviceRequests)
        .set(updates)
        .where(eq(serviceRequests.id, id))
        .returning();

      return updated || undefined;
    });
  }

  async getMatchAttempt(id: string): Promise<MatchAttempt | undefined> {
    const [match] = await db.select().from(matchAttempts).where(eq(matchAttempts.id, id));
    return match || undefined;
  }

  async getMatchAttemptsByRequest(requestId: string): Promise<MatchAttempt[]> {
    return db.select().from(matchAttempts).where(eq(matchAttempts.requestId, requestId));
  }

  async getMatchAttemptsByHauler(haulerId: string): Promise<MatchAttempt[]> {
    return db.select().from(matchAttempts).where(eq(matchAttempts.haulerId, haulerId));
  }

  // Complex join-like operation that requires fetching related service requests
  async getPendingMatchesForHauler(haulerId: string): Promise<(MatchAttempt & { request: ServiceRequest })[]> {
    const matches = await db.select().from(matchAttempts)
      .where(and(eq(matchAttempts.haulerId, haulerId), eq(matchAttempts.status, "pending")));

    const results: (MatchAttempt & { request: ServiceRequest })[] = [];
    for (const m of matches) {
      const request = await this.getServiceRequest(m.requestId);
      if (request) {
        results.push({ ...m, request });
      }
    }
    return results;
  }

  async createMatchAttempt(match: InsertMatchAttempt): Promise<MatchAttempt> {
    const [newMatch] = await db.insert(matchAttempts).values(match).returning();
    return newMatch;
  }

  async updateMatchAttempt(id: string, updates: Partial<MatchAttempt>): Promise<MatchAttempt | undefined> {
    const [match] = await db.update(matchAttempts)
      .set(updates)
      .where(eq(matchAttempts.id, id))
      .returning();
    return match || undefined;
  }
}
