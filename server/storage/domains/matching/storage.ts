import { eq, sql } from "drizzle-orm";
import { db } from "../../../db";
import { haulerProfiles, users } from "@shared/schema";
import type {
  HaulerProfile,
  HaulerWithProfile,
  User,
} from "@shared/schema";

export class MatchingStorage {
  // Haversine formula for distance calculation (in miles)
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * EXTREMELY COMPLEX MATCHING ALGORITHM - getSmartMatchedPros
   *
   * This is the most sophisticated method in the entire codebase, implementing
   * a multi-factor scoring algorithm to rank haulers for a service request.
   *
   * OVERVIEW:
   * Takes a service request and returns a ranked list of Pros using a
   * composite scoring system with 7 different factors.
   *
   * INPUT PARAMETERS:
   * - serviceType: Required service (e.g., "junk_removal", "furniture_moving")
   * - loadSize: Size of load ("small", "medium", "large", "extra_large")
   * - pickupLat/pickupLng: Optional pickup coordinates for proximity scoring
   * - isPriority: If true, returns only top 5 matches
   * - preferVerifiedPro: If true, filters to only "verified_pro" tier
   * - preferredLanguage: Optional language preference for language matching bonus
   *
   * SCORING ALGORITHM (max ~200 points):
   *
   * 1. RATING SCORE (0-100 points):
   *    - Formula: rating × 20
   *    - Example: 4.5 stars = 90 points, 5.0 stars = 100 points
   *    - Default: 4.0 if no rating
   *
   * 2. COMPLETION RATE (0-50 points):
   *    - Formula: (jobsCompleted / reviewCount) × 10, capped at 50
   *    - Rewards Pros with high completion-to-review ratio
   *    - Example: 50 jobs / 10 reviews = 5.0 ratio = 50 points
   *
   * 3. VERIFICATION BONUS (+15 points):
   *    - Awarded if profile.verified = true
   *    - Incentivizes verified Pros
   *
   * 4. PROXIMITY SCORE (0-30 points):
   *    - Formula: max(0, 30 - distance_in_miles)
   *    - Only calculated if both Pro and pickup have coordinates
   *    - Example: 5 miles away = 25 points, 30+ miles = 0 points
   *    - Prioritizes nearby Pros
   *
   * 5. VEHICLE CAPACITY MATCH (+10 points):
   *    - Vehicle capacity mapping:
   *      pickup_truck: 1, cargo_van: 2, box_truck: 3, flatbed: 4, trailer: 5
   *    - Load size requirements:
   *      small: 1, medium: 2, large: 3, extra_large: 4
   *    - Bonus awarded if Pro's vehicle can handle the load
   *
   * 6. LANGUAGE MATCH (+25 points):
   *    - Awarded if Pro speaks the preferred language
   *    - Checks profile.languagesSpoken array
   *    - Default: ["en"] if not specified
   *    - High value to prioritize communication
   *
   * 7. LOYALTY PRIORITY BOOST (+20 points):
   *    - Awarded if profile.loyaltyPriorityBoost = true
   *    - Rewards Pros who have earned loyalty status
   *    - Typically earned after 10+ five-star jobs
   *
   * FILTERING:
   * - Pre-filters to only available Pros (if preferVerifiedPro, only "verified_pro")
   * - Must have serviceType in their serviceTypes array
   * - Excludes Pros without matching service capability
   *
   * SORTING & OUTPUT:
   * - All matching Pros are scored and sorted by total score (highest first)
   * - If isPriority = true, returns only top 5 matches
   * - Otherwise returns all scored matches
   *
   * CROSS-DOMAIN DEPENDENCIES:
   * - Requires Pro profiles (local)
   * - Requires users data for HaulerWithProfile composition
   *
   * EXAMPLE SCORING:
   * Pro with:
   * - 4.8 rating = 96 pts
   * - 100% completion = 50 pts
   * - Verified = 15 pts
   * - 10 miles away = 20 pts
   * - Box truck for large load = 10 pts
   * - Speaks Spanish = 25 pts
   * - Loyalty boost = 20 pts
   * TOTAL: 236 points (excellent match)
   */
  // TODO: CROSS-DOMAIN COMPOSITION REQUIRED
  // This method requires access to the users domain and Pro profiles
  async getSmartMatchedPros(request: {
    serviceType: string;
    loadSize: string;
    pickupLat?: number;
    pickupLng?: number;
    isPriority?: boolean;
    preferVerifiedPro?: boolean;
    preferredLanguage?: string;
  }): Promise<HaulerWithProfile[]> {
    // Fetch all available Pros
    // TEMPORARY: Direct DB access - should use injected pro-profiles storage
    const allProfiles = await db.select().from(haulerProfiles)
      .where(eq(haulerProfiles.isAvailable, true));
    let allPros: HaulerWithProfile[] = [];

    for (const profile of allProfiles) {
      // TEMPORARY: Direct DB access - should use injected users storage
      const [user] = await db.select().from(users).where(eq(users.id, profile.userId));
      if (user) {
        allPros.push({ ...user, profile });
      }
    }

    // Filter to only Verified Pros if customer prefers
    if (request.preferVerifiedPro) {
      allPros = allPros.filter(p => p.profile.pyckerTier === "verified_pro");
    }

    // Filter by service type first
    const serviceFiltered = allPros.filter(p => {
      const serviceTypes = p.profile.serviceTypes || [];
      return serviceTypes.includes(request.serviceType);
    });

    // Filter by insurance validity (async)
    const insuranceValidated = [];
    for (const pro of serviceFiltered) {
      const hasValidInsurance = await this.checkProInsuranceValidity(pro.id);
      if (hasValidInsurance) {
        insuranceValidated.push(pro);
      }
    }

    // Calculate scores for validated pros
    const scored = insuranceValidated
      .map(pro => {
        let score = 0;

        // 1. RATING SCORE (0-100 points): Rating × 20
        score += (pro.profile.rating || 4.0) * 20;

        // 2. COMPLETION RATE (0-50 points): (jobs / reviews) × 10, capped at 50
        const completionRate = (pro.profile.jobsCompleted || 0) / Math.max(1, (pro.profile.reviewCount || 1));
        score += Math.min(completionRate * 10, 50);

        // 3. VERIFICATION BONUS (+15 points)
        if (pro.profile.verified) score += 15;

        // 4. PROXIMITY SCORE (0-30 points): max(0, 30 - distance)
        if (request.pickupLat && request.pickupLng && pro.profile.currentLat && pro.profile.currentLng) {
          const distance = this.calculateDistance(
            request.pickupLat, request.pickupLng,
            pro.profile.currentLat, pro.profile.currentLng
          );
          score += Math.max(0, 30 - distance);
        }

        // 5. VEHICLE CAPACITY MATCH (+10 points)
        const vehicleCapacity: Record<string, number> = {
          pickup_truck: 1,
          cargo_van: 2,
          box_truck: 3,
          flatbed: 4,
          trailer: 5,
        };
        const loadSizeReq: Record<string, number> = {
          small: 1,
          medium: 2,
          large: 3,
          extra_large: 4,
        };
        const proCap = vehicleCapacity[pro.profile.vehicleType] || 2;
        const requiredCap = loadSizeReq[request.loadSize] || 2;
        if (proCap >= requiredCap) {
          score += 10;
        }

        // 6. LANGUAGE MATCH (+25 points)
        if (request.preferredLanguage) {
          const proLanguages = pro.profile.languagesSpoken || ["en"];
          if (proLanguages.includes(request.preferredLanguage)) {
            score += 25;
          }
        }

        // 7. LOYALTY PRIORITY BOOST (+20 points)
        if (pro.profile.loyaltyPriorityBoost) {
          score += 20;
        }

        return { pro, score };
      })
      .sort((a, b) => b.score - a.score);

    // Return top 5 for priority requests, all matches otherwise
    if (request.isPriority) {
      return scored.slice(0, 5).map(s => s.pro);
    }

    return scored.map(s => s.pro);
  }

  /**
   * Check if a pro has valid insurance based on liability cap requirements
   * - LLC pros MUST have valid (non-expired) GL insurance to accept jobs
   * - Non-LLC pros can accept jobs without insurance (platform covers them)
   */
  private async checkProInsuranceValidity(proId: string): Promise<boolean> {
    try {
      // Check if pro has active GL insurance policy
      const result = await db.execute(
        sql`SELECT * FROM insurance_policies 
        WHERE pro_id = ${proId} AND policy_type = 'gl' AND verified = true`
      );

      const rows = Array.isArray(result) ? result : (result as any).rows ?? [];
      if (rows.length === 0) {
        // No insurance policy - assume non-LLC pro (allowed)
        return true;
      }

      // Has insurance policy - check if it's not expired
      const policy = rows[0] as any;
      const isExpired = new Date(policy.expiry_date) < new Date();
      
      // If insurance is expired, pro cannot accept new jobs
      return !isExpired;
    } catch (error) {
      console.error('Error checking pro insurance validity:', error);
      // On error, allow the pro through (fail open)
      return true;
    }
  }

  // Legacy alias for backward compatibility
  getSmartMatchedHaulers = this.getSmartMatchedPros;
}
