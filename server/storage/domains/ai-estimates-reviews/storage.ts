import { eq, desc, and } from "drizzle-orm";
import { db } from "../../../db";
import { aiEstimates, haulerReviews, haulerProfiles, users } from "@shared/schema";
import type {
  AiEstimate,
  InsertAiEstimate,
  HaulerReview,
  InsertHaulerReview,
  HaulerReviewWithCustomer,
  HaulerProfile,
  HaulerWithProfile,
  User,
} from "@shared/schema";

export class AiEstimatesReviewsStorage {
  async createAiEstimate(estimate: InsertAiEstimate): Promise<AiEstimate> {
    const [newEstimate] = await db.insert(aiEstimates).values(estimate).returning();
    return newEstimate;
  }

  async getAiEstimateByRequest(requestId: string): Promise<AiEstimate | undefined> {
    const [estimate] = await db.select().from(aiEstimates)
      .where(eq(aiEstimates.requestId, requestId))
      .orderBy(desc(aiEstimates.createdAt))
      .limit(1);
    return estimate || undefined;
  }

  async getAiEstimate(id: string): Promise<AiEstimate | undefined> {
    const [estimate] = await db.select().from(aiEstimates)
      .where(eq(aiEstimates.id, id))
      .limit(1);
    return estimate || undefined;
  }

  async createReview(review: InsertHaulerReview): Promise<HaulerReview> {
    const [newReview] = await db.insert(haulerReviews).values(review).returning();
    await this.updateHaulerRating(review.haulerId);
    return newReview;
  }

  // TODO: CROSS-DOMAIN COMPOSITION REQUIRED
  // This method requires access to the users domain to fetch customer data
  async getReviewsByHauler(haulerId: string): Promise<HaulerReviewWithCustomer[]> {
    const reviews = await db.select().from(haulerReviews)
      .where(eq(haulerReviews.haulerId, haulerId))
      .orderBy(desc(haulerReviews.createdAt));

    const results: HaulerReviewWithCustomer[] = [];
    for (const review of reviews) {
      // TEMPORARY: Direct DB access - should use injected users storage
      const [customer] = await db.select().from(users).where(eq(users.id, review.customerId));
      results.push({ ...review, customer });
    }
    return results;
  }

  async getReviewByServiceRequest(serviceRequestId: string): Promise<HaulerReview | undefined> {
    const [review] = await db.select().from(haulerReviews)
      .where(eq(haulerReviews.serviceRequestId, serviceRequestId));
    return review || undefined;
  }

  /**
   * COMPLEX AGGREGATION - updateHaulerRating
   *
   * This method recalculates a hauler's average rating and updates their profile:
   * 1. Fetches all reviews for the hauler
   * 2. Calculates the average rating
   * 3. Updates the hauler profile with the new average (rounded to 1 decimal) and review count
   * 4. Maintains data integrity between reviews and profile ratings
   */
  async updateHaulerRating(haulerId: string): Promise<void> {
    const reviews = await db.select().from(haulerReviews)
      .where(eq(haulerReviews.haulerId, haulerId));

    if (reviews.length === 0) return;

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await db.update(haulerProfiles)
      .set({ rating: Math.round(avgRating * 10) / 10, reviewCount: reviews.length })
      .where(eq(haulerProfiles.id, haulerId));
  }

  // TODO: CROSS-DOMAIN COMPOSITION REQUIRED
  // This method requires access to the users domain
  async getAvailableHaulersByServiceType(serviceType: string): Promise<HaulerWithProfile[]> {
    const profiles = await db.select().from(haulerProfiles)
      .where(eq(haulerProfiles.isAvailable, true));

    const results: HaulerWithProfile[] = [];
    for (const profile of profiles) {
      const serviceTypes = profile.serviceTypes || [];
      if (serviceTypes.includes(serviceType)) {
        // TEMPORARY: Direct DB access - should use injected users storage
        const [user] = await db.select().from(users).where(eq(users.id, profile.userId));
        if (user) {
          results.push({ ...user, profile });
        }
      }
    }
    return results;
  }

  /**
   * COMPLEX SEARCH ALGORITHM - searchHaulers
   *
   * This method performs a sophisticated search with scoring:
   *
   * 1. Filtering Logic:
   *    - availableOnly: Only include haulers with isAvailable = true
   *    - serviceType: Must be in hauler's serviceTypes array
   *    - capability: Must be in hauler's capabilities array
   *    - laborOnly: Requires offersLaborOnly = true
   *
   * 2. Match vs Suggestion:
   *    - Matches: Haulers that pass ALL filters
   *    - Suggestions: Available haulers that don't match all filters (fallback options)
   *
   * 3. Scoring & Sorting:
   *    - Both matches and suggestions are sorted by rating (highest first)
   *    - Suggestions are limited to top 5 results
   *
   * 4. Return Structure:
   *    {
   *      matches: HaulerWithProfile[], // All haulers matching filters
   *      suggestions: HaulerWithProfile[] // Top 5 available haulers not matching
   *    }
   */
  // TODO: CROSS-DOMAIN COMPOSITION REQUIRED
  // This method requires access to the users domain
  async searchHaulers(filters: {
    serviceType?: string;
    capability?: string;
    laborOnly?: boolean;
    availableOnly?: boolean;
  }): Promise<{ matches: HaulerWithProfile[]; suggestions: HaulerWithProfile[] }> {
    const allProfiles = await db.select().from(haulerProfiles);
    const matches: HaulerWithProfile[] = [];
    const suggestions: HaulerWithProfile[] = [];

    for (const profile of allProfiles) {
      // TEMPORARY: Direct DB access - should use injected users storage
      const [user] = await db.select().from(users).where(eq(users.id, profile.userId));
      if (!user) continue;

      const haulerWithProfile = { ...user, profile };
      const serviceTypes = profile.serviceTypes || [];
      const capabilities = profile.capabilities || [];

      // Apply filters
      let matchesFilter = true;

      if (filters.availableOnly && !profile.isAvailable) {
        matchesFilter = false;
      }
      if (filters.serviceType && !serviceTypes.includes(filters.serviceType)) {
        matchesFilter = false;
      }
      if (filters.capability && !capabilities.includes(filters.capability)) {
        matchesFilter = false;
      }
      if (filters.laborOnly && !profile.offersLaborOnly) {
        matchesFilter = false;
      }

      // Categorize as match or suggestion
      if (matchesFilter) {
        matches.push(haulerWithProfile);
      } else if (profile.isAvailable) {
        suggestions.push(haulerWithProfile);
      }
    }

    // Sort by rating (highest first)
    matches.sort((a, b) => (b.profile.rating || 0) - (a.profile.rating || 0));
    suggestions.sort((a, b) => (b.profile.rating || 0) - (a.profile.rating || 0));

    return { matches, suggestions: suggestions.slice(0, 5) };
  }
}
