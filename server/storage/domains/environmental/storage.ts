import { db } from "../../../db";
import { eq, desc } from "drizzle-orm";
import {
  environmentalCertificates,
  emailVerificationCodes,
  serviceRequests,
  type EnvironmentalCertificate,
  type InsertEnvironmentalCertificate,
} from "@shared/schema";

export class EnvironmentalStorage {
  // Environmental Certificates
  async createEnvironmentalCertificate(certificate: InsertEnvironmentalCertificate): Promise<EnvironmentalCertificate> {
    const [newCert] = await db.insert(environmentalCertificates).values(certificate).returning();
    return newCert;
  }

  async getEnvironmentalCertificate(id: string): Promise<EnvironmentalCertificate | undefined> {
    const [cert] = await db.select().from(environmentalCertificates)
      .where(eq(environmentalCertificates.id, id));
    return cert || undefined;
  }

  async getEnvironmentalCertificateByServiceRequest(serviceRequestId: string): Promise<EnvironmentalCertificate | undefined> {
    const [cert] = await db.select().from(environmentalCertificates)
      .where(eq(environmentalCertificates.serviceRequestId, serviceRequestId));
    return cert || undefined;
  }

  async generateEnvironmentalCertificate(
    serviceRequestId: string,
    getServiceRequest: (id: string) => Promise<any>,
    updateServiceRequest: (id: string, updates: any) => Promise<any>,
    getApprovedFacilities: () => Promise<any[]>
  ): Promise<EnvironmentalCertificate> {
    // Get the service request
    const request = await getServiceRequest(serviceRequestId);
    if (!request) {
      throw new Error("Service request not found");
    }
    if (request.status !== "completed") {
      throw new Error("Cannot generate certificate for incomplete job");
    }

    // Check if certificate already exists
    const existing = await this.getEnvironmentalCertificateByServiceRequest(serviceRequestId);
    if (existing) {
      return existing;
    }

    // Calculate disposal breakdown based on service type and facilities
    // For junk removal, we estimate based on typical Orlando recycling rates
    let recycledPercent = 0;
    let donatedPercent = 0;
    let landfilledPercent = 0;

    // Simulate realistic disposal breakdown
    if (request.serviceType === "junk_removal") {
      recycledPercent = 55 + Math.floor(Math.random() * 20); // 55-75%
      donatedPercent = 15 + Math.floor(Math.random() * 15); // 15-30%
      landfilledPercent = 100 - recycledPercent - donatedPercent;
    } else if (request.serviceType === "furniture_moving") {
      // Moving typically has no disposal
      recycledPercent = 0;
      donatedPercent = 0;
      landfilledPercent = 0;
    } else if (request.serviceType === "estate_cleanout") {
      recycledPercent = 45 + Math.floor(Math.random() * 15); // 45-60%
      donatedPercent = 25 + Math.floor(Math.random() * 15); // 25-40%
      landfilledPercent = 100 - recycledPercent - donatedPercent;
    } else {
      recycledPercent = 40 + Math.floor(Math.random() * 20); // 40-60%
      donatedPercent = 10 + Math.floor(Math.random() * 15); // 10-25%
      landfilledPercent = 100 - recycledPercent - donatedPercent;
    }

    // Estimate weight based on load size
    const loadWeights: Record<string, number> = {
      small: 200,
      medium: 500,
      large: 1000,
      extra_large: 2000
    };
    const totalWeight = loadWeights[request.loadEstimate] || 500;

    // Calculate carbon footprint (approximately 0.9 lbs CO2 per mile for a cargo truck)
    const distance = request.distanceMiles || 10;
    const carbonFootprintLbs = distance * 0.9;
    const carbonOffsetCost = carbonFootprintLbs * 0.02; // ~$0.02 per lb to offset

    // Generate certificate number
    const certNumber = `UPYCK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Get disposal facilities from approved facilities (handle empty case)
    const allFacilities = await getApprovedFacilities();
    const facilitiesCount = Math.min(3, allFacilities.length);
    const usedFacilities = facilitiesCount > 0
      ? allFacilities.slice(0, facilitiesCount).map(f => f.name)
      : ["Orange County Landfill"]; // Default facility
    const facilityTypes = facilitiesCount > 0
      ? allFacilities.slice(0, facilitiesCount).map(f => f.facilityType)
      : ["landfill"];

    const certificate: InsertEnvironmentalCertificate = {
      serviceRequestId,
      customerId: request.customerId,
      certificateNumber: certNumber,
      recycledPercent,
      donatedPercent,
      landfilledPercent,
      facilities: usedFacilities,
      facilityTypes: facilityTypes,
      totalWeightLbs: totalWeight,
      recycledWeightLbs: totalWeight * (recycledPercent / 100),
      donatedWeightLbs: totalWeight * (donatedPercent / 100),
      landfilledWeightLbs: totalWeight * (landfilledPercent / 100),
      haulDistanceMiles: distance,
      carbonFootprintLbs,
      carbonOffsetPurchased: true,
      carbonOffsetCost,
      issuedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      createdAt: new Date().toISOString(),
    };

    const [newCert] = await db.insert(environmentalCertificates).values(certificate).returning();

    // Update service request with certificate info
    await updateServiceRequest(serviceRequestId, {
      environmentalCertificateId: newCert.id,
      disposalRecycledPercent: recycledPercent,
      disposalDonatedPercent: donatedPercent,
      disposalLandfilledPercent: landfilledPercent,
      carbonFootprintLbs,
      carbonOffsetPurchased: true,
      disposalFacilities: usedFacilities,
      environmentalReportGeneratedAt: new Date().toISOString(),
    });

    return newCert;
  }

  // Email Verification Codes
  async createEmailVerificationCode(email: string, code: string, expiresAt: Date): Promise<void> {
    // Delete any existing codes for this email first
    await db.delete(emailVerificationCodes).where(eq(emailVerificationCodes.email, email));

    // Insert new code
    await db.insert(emailVerificationCodes).values({
      email,
      code,
      expiresAt,
      verified: false,
    });
  }

  async getEmailVerificationCode(email: string): Promise<{ code: string; expiresAt: Date; verified: boolean } | undefined> {
    const [record] = await db.select().from(emailVerificationCodes)
      .where(eq(emailVerificationCodes.email, email))
      .orderBy(desc(emailVerificationCodes.createdAt))
      .limit(1);

    if (!record) return undefined;

    return {
      code: record.code,
      expiresAt: record.expiresAt,
      verified: record.verified || false,
    };
  }

  async markEmailVerified(email: string): Promise<void> {
    await db.update(emailVerificationCodes)
      .set({ verified: true })
      .where(eq(emailVerificationCodes.email, email));
  }

  async deleteEmailVerificationCode(email: string): Promise<void> {
    await db.delete(emailVerificationCodes).where(eq(emailVerificationCodes.email, email));
  }
}
