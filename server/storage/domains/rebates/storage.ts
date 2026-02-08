import { eq, desc, and } from "drizzle-orm";
import { db } from "../../../db";
import { rebateClaims, approvedFacilities, haulerProfiles } from "@shared/schema";
import type {
  RebateClaim,
  InsertRebateClaim,
  ApprovedFacility,
  InsertApprovedFacility,
  HaulerProfile,
} from "@shared/schema";

export class RebatesStorage {
  // ========================================================================
  // GREEN GUARANTEE REBATE CLAIMS
  // ========================================================================

  async createRebateClaim(claim: InsertRebateClaim): Promise<RebateClaim> {
    const [result] = await db.insert(rebateClaims).values(claim).returning();
    return result;
  }

  async getRebateClaimsByHauler(haulerId: string): Promise<RebateClaim[]> {
    return db.select().from(rebateClaims)
      .where(eq(rebateClaims.haulerId, haulerId))
      .orderBy(desc(rebateClaims.submittedAt));
  }

  async getRebateClaimsByStatus(status: string): Promise<RebateClaim[]> {
    return db.select().from(rebateClaims)
      .where(eq(rebateClaims.status, status))
      .orderBy(desc(rebateClaims.submittedAt));
  }

  async getRebateClaim(id: string): Promise<RebateClaim | undefined> {
    const [result] = await db.select().from(rebateClaims)
      .where(eq(rebateClaims.id, id));
    return result;
  }

  async updateRebateClaim(id: string, updates: Partial<RebateClaim>): Promise<RebateClaim | undefined> {
    const [result] = await db.update(rebateClaims)
      .set(updates)
      .where(eq(rebateClaims.id, id))
      .returning();
    return result;
  }

  async updateRebateClaimAIValidation(id: string, updates: {
    aiValidationStatus: string;
    aiValidationResult?: string;
    aiValidationNotes?: string;
    aiValidatedAt: string;
    aiConfidenceScore?: number;
  }): Promise<RebateClaim | undefined> {
    const [result] = await db.update(rebateClaims)
      .set({
        aiValidationStatus: updates.aiValidationStatus,
        aiValidationResult: updates.aiValidationResult,
        aiValidationNotes: updates.aiValidationNotes,
        aiValidatedAt: updates.aiValidatedAt,
        aiConfidenceScore: updates.aiConfidenceScore,
      })
      .where(eq(rebateClaims.id, id))
      .returning();
    return result;
  }

  async approveRebateClaim(id: string, reviewerId: string): Promise<RebateClaim | undefined> {
    const claim = await this.getRebateClaim(id);
    if (!claim) return undefined;

    const [result] = await db.update(rebateClaims)
      .set({
        status: "approved",
        reviewedBy: reviewerId,
        reviewedAt: new Date().toISOString(),
      })
      .where(eq(rebateClaims.id, id))
      .returning();

    // Add rebate to hauler's balance
    if (result && result.rebateAmount) {
      await this.addRebateToBalance(result.haulerId, result.rebateAmount);
    }

    return result;
  }

  async denyRebateClaim(id: string, reviewerId: string, reason: string): Promise<RebateClaim | undefined> {
    const [result] = await db.update(rebateClaims)
      .set({
        status: "denied",
        reviewedBy: reviewerId,
        reviewedAt: new Date().toISOString(),
        denialReason: reason,
      })
      .where(eq(rebateClaims.id, id))
      .returning();
    return result;
  }

  // TODO: CROSS-DOMAIN DEPENDENCY
  // This method updates hauler profile balance - should potentially be in hauler-profiles domain
  async addRebateToBalance(haulerId: string, amount: number): Promise<HaulerProfile | undefined> {
    // TEMPORARY: Direct DB access - might need hauler-profiles storage injection
    const [profile] = await db.select().from(haulerProfiles)
      .where(eq(haulerProfiles.id, haulerId));

    if (!profile) return undefined;

    const currentBalance = profile.rebateBalance || 0;
    const [result] = await db.update(haulerProfiles)
      .set({ rebateBalance: currentBalance + amount })
      .where(eq(haulerProfiles.id, haulerId))
      .returning();
    return result;
  }

  /**
   * COMPLEX VALIDATION LOGIC - validateRebateClaim
   *
   * This method implements the Green Guarantee program's business rules for
   * validating disposal rebate claims submitted by haulers.
   *
   * BUSINESS RULES VALIDATED:
   *
   * 1. 48-HOUR WINDOW RULE:
   *    - Receipt date must be within 48 hours of job completion
   *    - Ensures hauler disposed of materials promptly
   *    - Flag: 'LATE_RECEIPT' if outside window
   *    - Rationale: Prevents haulers from submitting old receipts
   *
   * 2. WEIGHT VARIANCE (20% TOLERANCE):
   *    - Receipt weight must be within ±20% of estimated job weight
   *    - Formula: |receiptWeight - estimatedWeight| / estimatedWeight × 100
   *    - Flag: 'WEIGHT_MISMATCH' if variance > 20%
   *    - Rationale: Detects potential fraud or data entry errors
   *    - Example: 1000 lbs estimated, acceptable range: 800-1200 lbs
   *
   * 3. FACILITY APPROVAL:
   *    - Disposal facility must be on approved facilities list
   *    - Uses case-insensitive partial name matching
   *    - Flag: 'UNAPPROVED_FACILITY' if not found or not provided
   *    - Rationale: Ensures proper environmental disposal practices
   *
   * 4. DUPLICATE DETECTION:
   *    - Receipt number must be unique across all claims
   *    - Prevents same receipt being claimed multiple times
   *    - Flag: 'DUPLICATE_RECEIPT' if receipt number exists
   *    - Rationale: Anti-fraud measure
   *
   * VALIDATION FLOW:
   * 1. Parse job completion and receipt dates
   * 2. Calculate time difference in hours
   * 3. Calculate weight variance percentage
   * 4. Query approved facilities for name match
   * 5. Query existing claims for duplicate receipt number
   * 6. Compile all flags and boolean results
   *
   * RETURN VALUES:
   * {
   *   flags: string[] - Array of validation flags (empty if all pass)
   *   withinVariance: boolean - Weight is within 20% tolerance
   *   within48Hours: boolean - Receipt is within 48-hour window
   *   facilityApproved: boolean - Facility is on approved list
   *   isDuplicate: boolean - Receipt number already used
   * }
   *
   * USAGE:
   * AI systems use this validation to auto-approve or flag claims for human review.
   * Claims with no flags can be auto-approved. Claims with flags require manual review.
   *
   * EXAMPLE SCENARIOS:
   *
   * Scenario A - Clean Claim (Auto-approve):
   * - Job completed: 2024-01-10 10:00 AM
   * - Receipt date: 2024-01-10 2:00 PM (6 hours later)
   * - Estimated: 1000 lbs, Receipt: 950 lbs (5% variance)
   * - Facility: "Orange County Landfill" (approved)
   * - Receipt #: OCL-12345 (unique)
   * Result: flags = [], all booleans true except isDuplicate
   *
   * Scenario B - Flagged Claim (Manual review):
   * - Job completed: 2024-01-10 10:00 AM
   * - Receipt date: 2024-01-13 10:00 AM (72 hours later)
   * - Estimated: 1000 lbs, Receipt: 600 lbs (40% variance)
   * - Facility: "Bob's Dump" (not approved)
   * - Receipt #: XYZ-999 (unique)
   * Result: flags = ['LATE_RECEIPT', 'WEIGHT_MISMATCH', 'UNAPPROVED_FACILITY']
   */
  async validateRebateClaim(
    claim: Partial<InsertRebateClaim>,
    jobCompletedAt: string,
    estimatedWeight: number
  ): Promise<{
    flags: string[];
    withinVariance: boolean;
    within48Hours: boolean;
    facilityApproved: boolean;
    isDuplicate: boolean;
  }> {
    const flags: string[] = [];

    // ========================================================================
    // RULE 1: CHECK 48-HOUR WINDOW
    // Receipt date must be within 48 hours of job completion
    // ========================================================================
    const jobDate = new Date(jobCompletedAt);
    const receiptDate = claim.receiptDate ? new Date(claim.receiptDate) : new Date();
    const hoursDiff = (receiptDate.getTime() - jobDate.getTime()) / (1000 * 60 * 60);
    const within48Hours = hoursDiff >= 0 && hoursDiff <= 48;

    if (!within48Hours) {
      flags.push('LATE_RECEIPT');
    }

    // ========================================================================
    // RULE 2: CHECK WEIGHT VARIANCE (20% TOLERANCE)
    // Receipt weight must be within ±20% of estimated weight
    // ========================================================================
    const receiptWeight = claim.receiptWeight || 0;
    const variance = estimatedWeight > 0
      ? Math.abs(receiptWeight - estimatedWeight) / estimatedWeight * 100
      : 100;
    const withinVariance = variance <= 20;

    if (!withinVariance) {
      flags.push('WEIGHT_MISMATCH');
    }

    // ========================================================================
    // RULE 3: CHECK FACILITY APPROVAL
    // Facility must be on the approved facilities list
    // ========================================================================
    let facilityApproved = false;
    if (claim.facilityName) {
      const matchedFacility = await this.findFacilityByName(claim.facilityName);
      if (matchedFacility) {
        facilityApproved = true;
      } else {
        flags.push('UNAPPROVED_FACILITY');
      }
    } else {
      flags.push('UNAPPROVED_FACILITY');
    }

    // ========================================================================
    // RULE 4: CHECK FOR DUPLICATE RECEIPT NUMBER
    // Each receipt number can only be claimed once
    // ========================================================================
    let isDuplicate = false;
    if (claim.receiptNumber) {
      const existingClaims = await db.select().from(rebateClaims)
        .where(eq(rebateClaims.receiptNumber, claim.receiptNumber));
      if (existingClaims.length > 0) {
        isDuplicate = true;
        flags.push('DUPLICATE_RECEIPT');
      }
    }

    return {
      flags,
      withinVariance,
      within48Hours,
      facilityApproved,
      isDuplicate,
    };
  }

  // ========================================================================
  // GREEN GUARANTEE APPROVED FACILITIES
  // ========================================================================

  async getApprovedFacilities(): Promise<ApprovedFacility[]> {
    return db.select().from(approvedFacilities)
      .where(and(
        eq(approvedFacilities.isActive, true),
        eq(approvedFacilities.isBlocked, false)
      ))
      .orderBy(approvedFacilities.name);
  }

  async getApprovedFacility(id: string): Promise<ApprovedFacility | undefined> {
    const [result] = await db.select().from(approvedFacilities)
      .where(eq(approvedFacilities.id, id));
    return result;
  }

  /**
   * SMART FACILITY MATCHING - findFacilityByName
   *
   * Performs case-insensitive partial matching to find approved facilities.
   * This allows for flexible matching when haulers submit receipt names that
   * might not exactly match the official facility name.
   *
   * MATCHING LOGIC:
   * - Normalizes both search term and facility names to lowercase
   * - Matches if either:
   *   a) Facility name contains the search term, OR
   *   b) Search term contains the facility name
   *
   * EXAMPLES:
   * - Search "orange county" matches "Orange County Landfill"
   * - Search "Orange County Landfill - North Gate" matches "Orange County Landfill"
   * - Search "mcleod" matches "McLeod Road Transfer Station"
   *
   * This bidirectional matching handles both abbreviated and expanded names.
   */
  async findFacilityByName(name: string): Promise<ApprovedFacility | undefined> {
    // Case-insensitive partial match
    const facilities = await db.select().from(approvedFacilities)
      .where(and(
        eq(approvedFacilities.isActive, true),
        eq(approvedFacilities.isBlocked, false)
      ));

    const normalizedSearch = name.toLowerCase().trim();
    return facilities.find(f =>
      f.name.toLowerCase().includes(normalizedSearch) ||
      normalizedSearch.includes(f.name.toLowerCase())
    );
  }

  async createApprovedFacility(facility: InsertApprovedFacility): Promise<ApprovedFacility> {
    const [result] = await db.insert(approvedFacilities).values(facility).returning();
    return result;
  }

  async updateApprovedFacility(id: string, updates: Partial<ApprovedFacility>): Promise<ApprovedFacility | undefined> {
    const [result] = await db.update(approvedFacilities)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(approvedFacilities.id, id))
      .returning();
    return result;
  }
}
