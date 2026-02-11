import { db } from "../../../db";
import { eq, and, desc, asc, gte, lte, isNull, sql, inArray } from "drizzle-orm";
import {
  properties,
  propertyAppliances,
  applianceScans,
  applianceScanSessions,
  propertyWarranties,
  propertyInsurance,
  propertyHealthEvents,
  propertyMaintenanceSchedule,
  builderPartnerships,
  insurancePartners,
  propertyDocuments,
  notificationQueue,
  type InsertProperty,
  type Property,
  type InsertPropertyAppliance,
  type PropertyAppliance,
  type InsertApplianceScan,
  type ApplianceScan,
  type InsertApplianceScanSession,
  type ApplianceScanSession,
  type InsertPropertyWarranty,
  type PropertyWarranty,
  type InsertPropertyInsurance,
  type PropertyInsurance,
  type InsertPropertyHealthEvent,
  type PropertyHealthEvent,
  type InsertPropertyMaintenanceSchedule,
  type PropertyMaintenanceSchedule,
  type InsertBuilderPartnership,
  type BuilderPartnership,
  type InsertInsurancePartner,
  type InsurancePartner,
  type InsertPropertyDocument,
  type PropertyDocument,
  type InsertNotificationQueue,
  type NotificationQueue,
} from "../../../../shared/schema";

// ==========================================
// PROPERTIES
// ==========================================

export async function createProperty(property: InsertProperty): Promise<Property> {
  const [created] = await db.insert(properties).values(property).returning();
  return created;
}

export async function getPropertyById(id: string): Promise<Property | undefined> {
  const [property] = await db.select().from(properties).where(eq(properties.id, id));
  return property;
}

export async function getPropertiesByUserId(userId: string): Promise<Property[]> {
  return db.select().from(properties).where(eq(properties.ownerId, userId)).orderBy(desc(properties.createdAt));
}

export async function getPropertyByAddress(userId: string, address: string): Promise<Property | undefined> {
  const [property] = await db
    .select()
    .from(properties)
    .where(and(eq(properties.ownerId, userId), eq(properties.fullAddress, address)));
  return property;
}

export async function updateProperty(id: string, updates: Partial<Property>): Promise<Property | undefined> {
  const [updated] = await db
    .update(properties)
    .set({ ...updates, updatedAt: sql`now()` })
    .where(eq(properties.id, id))
    .returning();
  return updated;
}

export async function updatePropertyHealthScore(
  id: string,
  score: number,
  breakdown: {
    roof?: number;
    hvac?: number;
    exterior?: number;
    interior?: number;
    landscape?: number;
    pool?: number;
    appliances?: number;
    maintenance?: number;
  }
): Promise<Property | undefined> {
  const property = await getPropertyById(id);
  if (!property) return undefined;

  // Update history
  const history = (property.healthScoreHistory as any[]) || [];
  history.push({
    date: new Date().toISOString(),
    score,
    ...breakdown,
  });

  const [updated] = await db
    .update(properties)
    .set({
      propertyHealthScore: score,
      healthScoreUpdatedAt: sql`now()`,
      healthScoreHistory: history,
      healthScoreRoof: breakdown.roof,
      healthScoreHvac: breakdown.hvac,
      healthScoreExterior: breakdown.exterior,
      healthScoreInterior: breakdown.interior,
      healthScoreLandscape: breakdown.landscape,
      healthScorePool: breakdown.pool,
      healthScoreAppliances: breakdown.appliances,
      healthScoreMaintenance: breakdown.maintenance,
      updatedAt: sql`now()`,
    })
    .where(eq(properties.id, id))
    .returning();
  return updated;
}

export async function incrementPropertyStats(
  id: string,
  stats: {
    jobsCompleted?: number;
    amountSpent?: number;
  }
): Promise<Property | undefined> {
  const property = await getPropertyById(id);
  if (!property) return undefined;

  const [updated] = await db
    .update(properties)
    .set({
      totalJobsCompleted: (property.totalJobsCompleted || 0) + (stats.jobsCompleted || 0),
      totalSpent: (property.totalSpent || 0) + (stats.amountSpent || 0),
      lastServiceDate: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(eq(properties.id, id))
    .returning();
  return updated;
}

export async function updatePropertyWarrantyCounts(id: string): Promise<Property | undefined> {
  // Count active and expiring warranties
  const warranties = await getWarrantiesByProperty(id);
  const now = new Date();
  const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const active = warranties.filter((w) => w.status === "active").length;
  const expiring = warranties.filter((w) => {
    if (w.status !== "active" || !w.endDate) return false;
    const endDate = new Date(w.endDate);
    return endDate <= in90Days && endDate > now;
  }).length;

  const [updated] = await db
    .update(properties)
    .set({
      activeWarrantyCount: active,
      expiringWarrantyCount: expiring,
      updatedAt: sql`now()`,
    })
    .where(eq(properties.id, id))
    .returning();
  return updated;
}

// ==========================================
// APPLIANCES
// ==========================================

export async function createAppliance(appliance: InsertPropertyAppliance): Promise<PropertyAppliance> {
  const [created] = await db.insert(propertyAppliances).values(appliance).returning();

  // Update property timestamp
  await db
    .update(properties)
    .set({
      updatedAt: sql`now()`,
    })
    .where(eq(properties.id, appliance.propertyId));

  return created;
}

export async function getApplianceById(id: string): Promise<PropertyAppliance | undefined> {
  const [appliance] = await db.select().from(propertyAppliances).where(eq(propertyAppliances.id, id));
  return appliance;
}

export async function getAppliancesByProperty(propertyId: string): Promise<PropertyAppliance[]> {
  return db
    .select()
    .from(propertyAppliances)
    .where(and(eq(propertyAppliances.propertyId, propertyId), eq(propertyAppliances.status, "active")))
    .orderBy(asc(propertyAppliances.location), asc(propertyAppliances.category));
}

export async function getAppliancesByCategory(propertyId: string, category: string): Promise<PropertyAppliance[]> {
  return db
    .select()
    .from(propertyAppliances)
    .where(
      and(
        eq(propertyAppliances.propertyId, propertyId),
        eq(propertyAppliances.category, category),
        eq(propertyAppliances.status, "active")
      )
    )
    .orderBy(asc(propertyAppliances.brand));
}

export async function getAppliancesByLocation(propertyId: string, location: string): Promise<PropertyAppliance[]> {
  return db
    .select()
    .from(propertyAppliances)
    .where(
      and(
        eq(propertyAppliances.propertyId, propertyId),
        eq(propertyAppliances.location, location),
        eq(propertyAppliances.status, "active")
      )
    )
    .orderBy(asc(propertyAppliances.category));
}

export async function findDuplicateAppliance(
  propertyId: string,
  brand: string,
  model: string,
  serialNumber?: string
): Promise<PropertyAppliance | undefined> {
  const conditions = [eq(propertyAppliances.propertyId, propertyId), eq(propertyAppliances.status, "active")];

  if (serialNumber) {
    conditions.push(eq(propertyAppliances.serialNumber, serialNumber));
  } else {
    conditions.push(eq(propertyAppliances.brand, brand), eq(propertyAppliances.modelNumber, model));
  }

  const [appliance] = await db.select().from(propertyAppliances).where(and(...conditions));
  return appliance;
}

export async function updateAppliance(id: string, updates: Partial<PropertyAppliance>): Promise<PropertyAppliance | undefined> {
  const [updated] = await db
    .update(propertyAppliances)
    .set({ ...updates, updatedAt: sql`now()` })
    .where(eq(propertyAppliances.id, id))
    .returning();
  return updated;
}

export async function replaceAppliance(
  oldApplianceId: string,
  newAppliance: InsertPropertyAppliance
): Promise<PropertyAppliance> {
  // Mark old appliance as replaced
  await db
    .update(propertyAppliances)
    .set({
      status: "replaced",
      updatedAt: sql`now()`,
    })
    .where(eq(propertyAppliances.id, oldApplianceId));

  // Create new appliance with link to old one
  const [created] = await db
    .insert(propertyAppliances)
    .values({
      ...newAppliance,
    })
    .returning();

  // Update old appliance to point to new one
  await db
    .update(propertyAppliances)
    .set({ replacedBy: created.id })
    .where(eq(propertyAppliances.id, oldApplianceId));

  return created;
}

export async function getAppliancesNeedingReview(propertyId: string): Promise<PropertyAppliance[]> {
  return db
    .select()
    .from(propertyAppliances)
    .where(
      and(
        eq(propertyAppliances.propertyId, propertyId),
        eq(propertyAppliances.status, "active")
      )
    )
    .orderBy(desc(propertyAppliances.createdAt));
}

// ==========================================
// APPLIANCE SCANS
// ==========================================

export async function createApplianceScan(scan: InsertApplianceScan): Promise<ApplianceScan> {
  const [created] = await db.insert(applianceScans).values(scan).returning();
  return created;
}

export async function getApplianceScanById(id: string): Promise<ApplianceScan | undefined> {
  const [scan] = await db.select().from(applianceScans).where(eq(applianceScans.id, id));
  return scan;
}

export async function getScansByProperty(propertyId: string): Promise<ApplianceScan[]> {
  return db
    .select()
    .from(applianceScans)
    .where(eq(applianceScans.propertyId, propertyId))
    .orderBy(desc(applianceScans.scannedAt));
}

export async function getScansBySession(sessionId: string): Promise<ApplianceScan[]> {
  return db
    .select()
    .from(applianceScans)
    .where(eq(applianceScans.scanSessionId, sessionId))
    .orderBy(asc(applianceScans.scanSessionSequence));
}

export async function getScansPendingProcessing(): Promise<ApplianceScan[]> {
  return db
    .select()
    .from(applianceScans)
    .where(inArray(applianceScans.aiProcessingStatus, ["uploaded", "queued"]))
    .orderBy(asc(applianceScans.createdAt))
    .limit(50);
}

export async function updateApplianceScan(id: string, updates: Partial<ApplianceScan>): Promise<ApplianceScan | undefined> {
  const [updated] = await db
    .update(applianceScans)
    .set({ ...updates, updatedAt: sql`now()` })
    .where(eq(applianceScans.id, id))
    .returning();
  return updated;
}

export async function markScanAsProcessing(id: string): Promise<ApplianceScan | undefined> {
  const [updated] = await db
    .update(applianceScans)
    .set({
      aiProcessingStatus: "processing",
      aiProcessingStartedAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(eq(applianceScans.id, id))
    .returning();
  return updated;
}

export async function markScanAsCompleted(
  id: string,
  results: {
    brand?: string;
    model?: string;
    serial?: string;
    category?: string;
    confidence: number;
    warrantyInfo?: any;
    specsInfo?: any;
  }
): Promise<ApplianceScan | undefined> {
  const scan = await getApplianceScanById(id);
  if (!scan) return undefined;

  const startTime = scan.aiProcessingStartedAt ? new Date(scan.aiProcessingStartedAt).getTime() : Date.now();
  const duration = Date.now() - startTime;

  const [updated] = await db
    .update(applianceScans)
    .set({
      aiProcessingStatus: "completed",
      aiProcessingCompletedAt: sql`now()`,
      aiProcessingDurationMs: duration,
      extractedBrand: results.brand,
      extractedModel: results.model,
      extractedSerialNumber: results.serial,
      extractedCategory: results.category,
      confidenceScore: results.confidence,
      needsReview: results.confidence < 0.85,
      autoConfirmed: results.confidence >= 0.85,
      updatedAt: sql`now()`,
    })
    .where(eq(applianceScans.id, id))
    .returning();
  return updated;
}

// ==========================================
// APPLIANCE SCAN SESSIONS
// ==========================================

export async function createScanSession(session: InsertApplianceScanSession): Promise<ApplianceScanSession> {
  const [created] = await db.insert(applianceScanSessions).values(session).returning();
  return created;
}

export async function getScanSessionById(id: string): Promise<ApplianceScanSession | undefined> {
  const [session] = await db.select().from(applianceScanSessions).where(eq(applianceScanSessions.id, id));
  return session;
}

export async function updateScanSession(
  id: string,
  updates: Partial<ApplianceScanSession>
): Promise<ApplianceScanSession | undefined> {
  const [updated] = await db
    .update(applianceScanSessions)
    .set({ ...updates, updatedAt: sql`now()` })
    .where(eq(applianceScanSessions.id, id))
    .returning();
  return updated;
}

export async function completeScanSession(id: string): Promise<ApplianceScanSession | undefined> {
  const session = await getScanSessionById(id);
  if (!session) return undefined;

  const startTime = new Date(session.startedAt).getTime();
  const duration = Math.floor((Date.now() - startTime) / 1000);

  const [updated] = await db
    .update(applianceScanSessions)
    .set({
      status: "processing",
      completedAt: sql`now()`,
      durationSeconds: duration,
      updatedAt: sql`now()`,
    })
    .where(eq(applianceScanSessions.id, id))
    .returning();
  return updated;
}

// ==========================================
// WARRANTIES
// ==========================================

export async function createWarranty(warranty: InsertPropertyWarranty): Promise<PropertyWarranty> {
  const [created] = await db.insert(propertyWarranties).values(warranty).returning();

  // Update property warranty counts
  await updatePropertyWarrantyCounts(warranty.propertyId);

  return created;
}

export async function getWarrantyById(id: string): Promise<PropertyWarranty | undefined> {
  const [warranty] = await db.select().from(propertyWarranties).where(eq(propertyWarranties.id, id));
  return warranty;
}

export async function getWarrantiesByProperty(propertyId: string): Promise<PropertyWarranty[]> {
  return db
    .select()
    .from(propertyWarranties)
    .where(eq(propertyWarranties.propertyId, propertyId))
    .orderBy(asc(propertyWarranties.endDate));
}

export async function getActiveWarranties(propertyId: string): Promise<PropertyWarranty[]> {
  return db
    .select()
    .from(propertyWarranties)
    .where(and(eq(propertyWarranties.propertyId, propertyId), eq(propertyWarranties.status, "active")))
    .orderBy(asc(propertyWarranties.endDate));
}

export async function getExpiringWarranties(daysThreshold: number = 90): Promise<PropertyWarranty[]> {
  const now = new Date();
  const threshold = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

  return db
    .select()
    .from(propertyWarranties)
    .where(
      and(
        eq(propertyWarranties.status, "active"),
        lte(propertyWarranties.endDate, threshold.toISOString()),
        gte(propertyWarranties.endDate, now.toISOString())
      )
    )
    .orderBy(asc(propertyWarranties.endDate));
}

export async function updateWarranty(id: string, updates: Partial<PropertyWarranty>): Promise<PropertyWarranty | undefined> {
  const [updated] = await db
    .update(propertyWarranties)
    .set({ ...updates, updatedAt: sql`now()` })
    .where(eq(propertyWarranties.id, id))
    .returning();

  if (updated) {
    await updatePropertyWarrantyCounts(updated.propertyId);
  }

  return updated;
}

export async function recordWarrantyClaim(
  warrantyId: string,
  claimDetails: {
    date: string;
    description: string;
    outcome: string;
    amount?: number;
    uptendDocsProvided?: boolean;
  }
): Promise<PropertyWarranty | undefined> {
  const warranty = await getWarrantyById(warrantyId);
  if (!warranty) return undefined;

  const [updated] = await db
    .update(propertyWarranties)
    .set({
      totalClaimsMade: (warranty.totalClaimsMade || 0) + 1,
      lastClaimDate: claimDetails.date,
      updatedAt: sql`now()`,
    })
    .where(eq(propertyWarranties.id, warrantyId))
    .returning();

  return updated;
}

// ==========================================
// INSURANCE
// ==========================================

export async function createInsurance(insurance: InsertPropertyInsurance): Promise<PropertyInsurance> {
  const [created] = await db.insert(propertyInsurance).values(insurance).returning();
  return created;
}

export async function getInsuranceById(id: string): Promise<PropertyInsurance | undefined> {
  const [insurance] = await db.select().from(propertyInsurance).where(eq(propertyInsurance.id, id));
  return insurance;
}

export async function getInsuranceByProperty(propertyId: string): Promise<PropertyInsurance[]> {
  return db
    .select()
    .from(propertyInsurance)
    .where(eq(propertyInsurance.propertyId, propertyId))
    .orderBy(desc(propertyInsurance.status), asc(propertyInsurance.insuranceType));
}

export async function getActiveInsurance(propertyId: string): Promise<PropertyInsurance[]> {
  return db
    .select()
    .from(propertyInsurance)
    .where(and(eq(propertyInsurance.propertyId, propertyId), eq(propertyInsurance.status, "active")));
}

export async function updateInsurance(
  id: string,
  updates: Partial<PropertyInsurance>
): Promise<PropertyInsurance | undefined> {
  const [updated] = await db
    .update(propertyInsurance)
    .set({ ...updates, updatedAt: sql`now()` })
    .where(eq(propertyInsurance.id, id))
    .returning();
  return updated;
}

export async function recordInsuranceClaim(
  insuranceId: string,
  claimDetails: {
    date: string;
    type: string;
    description: string;
    amount: number;
    status: string;
    claimNumber?: string;
    uptendDocsProvided?: boolean;
    adjusterId?: string;
  }
): Promise<PropertyInsurance | undefined> {
  const insurance = await getInsuranceById(insuranceId);
  if (!insurance) return undefined;

  const claims = (insurance.claimsHistory as any[]) || [];
  claims.push(claimDetails);

  const [updated] = await db
    .update(propertyInsurance)
    .set({
      claimsHistory: claims,
      totalClaimsMade: (insurance.totalClaimsMade || 0) + 1,
      updatedAt: sql`now()`,
    })
    .where(eq(propertyInsurance.id, insuranceId))
    .returning();

  return updated;
}

// ==========================================
// HEALTH EVENTS
// ==========================================

export async function createHealthEvent(event: InsertPropertyHealthEvent): Promise<PropertyHealthEvent> {
  const [created] = await db.insert(propertyHealthEvents).values(event).returning();
  return created;
}

export async function getHealthEventById(id: string): Promise<PropertyHealthEvent | undefined> {
  const [event] = await db.select().from(propertyHealthEvents).where(eq(propertyHealthEvents.id, id));
  return event;
}

export async function getHealthEventsByProperty(propertyId: string): Promise<PropertyHealthEvent[]> {
  return db
    .select()
    .from(propertyHealthEvents)
    .where(eq(propertyHealthEvents.propertyId, propertyId))
    .orderBy(desc(propertyHealthEvents.eventDate));
}

export async function getHealthEventsByType(propertyId: string, eventType: string): Promise<PropertyHealthEvent[]> {
  return db
    .select()
    .from(propertyHealthEvents)
    .where(and(eq(propertyHealthEvents.propertyId, propertyId), eq(propertyHealthEvents.eventType, eventType)))
    .orderBy(desc(propertyHealthEvents.eventDate));
}

export async function getHealthEventsByDateRange(
  propertyId: string,
  startDate: string,
  endDate: string
): Promise<PropertyHealthEvent[]> {
  return db
    .select()
    .from(propertyHealthEvents)
    .where(
      and(
        eq(propertyHealthEvents.propertyId, propertyId),
        gte(propertyHealthEvents.eventDate, startDate),
        lte(propertyHealthEvents.eventDate, endDate)
      )
    )
    .orderBy(desc(propertyHealthEvents.eventDate));
}

// ==========================================
// MAINTENANCE SCHEDULE
// ==========================================

export async function createMaintenanceTask(task: InsertPropertyMaintenanceSchedule): Promise<PropertyMaintenanceSchedule> {
  const [created] = await db.insert(propertyMaintenanceSchedule).values(task).returning();
  return created;
}

export async function getMaintenanceTaskById(id: string): Promise<PropertyMaintenanceSchedule | undefined> {
  const [task] = await db.select().from(propertyMaintenanceSchedule).where(eq(propertyMaintenanceSchedule.id, id));
  return task;
}

export async function getMaintenanceTasksByProperty(propertyId: string): Promise<PropertyMaintenanceSchedule[]> {
  return db
    .select()
    .from(propertyMaintenanceSchedule)
    .where(and(eq(propertyMaintenanceSchedule.propertyId, propertyId), eq(propertyMaintenanceSchedule.status, "active")))
    .orderBy(asc(propertyMaintenanceSchedule.nextDueDate));
}

export async function getOverdueMaintenanceTasks(): Promise<PropertyMaintenanceSchedule[]> {
  const now = new Date().toISOString();
  return db
    .select()
    .from(propertyMaintenanceSchedule)
    .where(
      and(
        eq(propertyMaintenanceSchedule.status, "active"),
        lte(propertyMaintenanceSchedule.nextDueDate, now),
        eq(propertyMaintenanceSchedule.isOverdue, false)
      )
    )
    .orderBy(asc(propertyMaintenanceSchedule.nextDueDate));
}

export async function updateMaintenanceTask(
  id: string,
  updates: Partial<PropertyMaintenanceSchedule>
): Promise<PropertyMaintenanceSchedule | undefined> {
  const [updated] = await db
    .update(propertyMaintenanceSchedule)
    .set({ ...updates, updatedAt: sql`now()` })
    .where(eq(propertyMaintenanceSchedule.id, id))
    .returning();
  return updated;
}

export async function markMaintenanceCompleted(
  id: string,
  serviceRequestId: string
): Promise<PropertyMaintenanceSchedule | undefined> {
  const task = await getMaintenanceTaskById(id);
  if (!task) return undefined;

  const now = new Date();
  const nextDue = new Date(now.getTime() + (task.frequencyDays || 180) * 24 * 60 * 60 * 1000);

  const [updated] = await db
    .update(propertyMaintenanceSchedule)
    .set({
      lastCompletedDate: now.toISOString(),
      lastServiceRequestId: serviceRequestId,
      nextDueDate: nextDue.toISOString(),
      isOverdue: false,
      overdueBy: 0,
      updatedAt: sql`now()`,
    })
    .where(eq(propertyMaintenanceSchedule.id, id))
    .returning();

  return updated;
}

// ==========================================
// BUILDER PARTNERSHIPS
// ==========================================

export async function createBuilderPartnership(partnership: InsertBuilderPartnership): Promise<BuilderPartnership> {
  const [created] = await db.insert(builderPartnerships).values(partnership).returning();
  return created;
}

export async function getBuilderPartnershipById(id: string): Promise<BuilderPartnership | undefined> {
  const [partnership] = await db.select().from(builderPartnerships).where(eq(builderPartnerships.id, id));
  return partnership;
}

export async function getActiveBuilderPartnerships(): Promise<BuilderPartnership[]> {
  return db
    .select()
    .from(builderPartnerships)
    .where(eq(builderPartnerships.status, "active"))
    .orderBy(asc(builderPartnerships.builderName));
}

export async function updateBuilderPartnership(
  id: string,
  updates: Partial<BuilderPartnership>
): Promise<BuilderPartnership | undefined> {
  const [updated] = await db
    .update(builderPartnerships)
    .set({ ...updates, updatedAt: sql`now()` })
    .where(eq(builderPartnerships.id, id))
    .returning();
  return updated;
}

// ==========================================
// INSURANCE PARTNERS
// ==========================================

export async function createInsurancePartner(partner: InsertInsurancePartner): Promise<InsurancePartner> {
  const [created] = await db.insert(insurancePartners).values(partner).returning();
  return created;
}

export async function getInsurancePartnerById(id: string): Promise<InsurancePartner | undefined> {
  const [partner] = await db.select().from(insurancePartners).where(eq(insurancePartners.id, id));
  return partner;
}

export async function getActiveInsurancePartners(): Promise<InsurancePartner[]> {
  return db
    .select()
    .from(insurancePartners)
    .where(eq(insurancePartners.status, "active"))
    .orderBy(asc(insurancePartners.carrierName));
}

// ==========================================
// DOCUMENTS
// ==========================================

export async function createDocument(document: InsertPropertyDocument): Promise<PropertyDocument> {
  const [created] = await db.insert(propertyDocuments).values(document).returning();
  return created;
}

export async function getDocumentById(id: string): Promise<PropertyDocument | undefined> {
  const [document] = await db.select().from(propertyDocuments).where(eq(propertyDocuments.id, id));
  return document;
}

export async function getDocumentsByProperty(propertyId: string): Promise<PropertyDocument[]> {
  return db
    .select()
    .from(propertyDocuments)
    .where(and(eq(propertyDocuments.propertyId, propertyId), eq(propertyDocuments.status, "active")))
    .orderBy(desc(propertyDocuments.createdAt));
}

export async function getDocumentsByType(propertyId: string, documentType: string): Promise<PropertyDocument[]> {
  return db
    .select()
    .from(propertyDocuments)
    .where(
      and(
        eq(propertyDocuments.propertyId, propertyId),
        eq(propertyDocuments.documentType, documentType),
        eq(propertyDocuments.status, "active")
      )
    )
    .orderBy(desc(propertyDocuments.createdAt));
}

export async function updateDocument(id: string, updates: Partial<PropertyDocument>): Promise<PropertyDocument | undefined> {
  const [updated] = await db
    .update(propertyDocuments)
    .set({ ...updates, updatedAt: sql`now()` })
    .where(eq(propertyDocuments.id, id))
    .returning();
  return updated;
}

// ==========================================
// NOTIFICATIONS
// ==========================================

export async function createNotification(notification: InsertNotificationQueue): Promise<NotificationQueue> {
  const [created] = await db.insert(notificationQueue).values(notification).returning();
  return created;
}

export async function getNotificationById(id: string): Promise<NotificationQueue | undefined> {
  const [notification] = await db.select().from(notificationQueue).where(eq(notificationQueue.id, id));
  return notification;
}

export async function getPendingNotifications(): Promise<NotificationQueue[]> {
  const now = new Date().toISOString();
  return db
    .select()
    .from(notificationQueue)
    .where(
      and(
        eq(notificationQueue.status, "pending"),
        lte(notificationQueue.scheduledFor, now),
        gte(notificationQueue.expiresAt, now)
      )
    )
    .orderBy(asc(notificationQueue.scheduledFor))
    .limit(100);
}

export async function updateNotification(
  id: string,
  updates: Partial<NotificationQueue>
): Promise<NotificationQueue | undefined> {
  const [updated] = await db
    .update(notificationQueue)
    .set({ ...updates, updatedAt: sql`now()` })
    .where(eq(notificationQueue.id, id))
    .returning();
  return updated;
}

export async function markNotificationSent(id: string): Promise<NotificationQueue | undefined> {
  const [updated] = await db
    .update(notificationQueue)
    .set({
      status: "sent",
      sentAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(eq(notificationQueue.id, id))
    .returning();
  return updated;
}

export async function markNotificationOpened(id: string): Promise<NotificationQueue | undefined> {
  const [updated] = await db
    .update(notificationQueue)
    .set({
      isRead: true,
      openedAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(eq(notificationQueue.id, id))
    .returning();
  return updated;
}

export async function markNotificationClicked(id: string): Promise<NotificationQueue | undefined> {
  const [updated] = await db
    .update(notificationQueue)
    .set({
      isClicked: true,
      clickedAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(eq(notificationQueue.id, id))
    .returning();
  return updated;
}
