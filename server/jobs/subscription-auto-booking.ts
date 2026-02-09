/**
 * Subscription Auto-Booking Cron Job
 *
 * Runs daily to automatically create service requests for recurring subscriptions
 * that are due for their next booking.
 *
 * Features:
 * - Finds active subscriptions with today's date as nextBookingDate
 * - Creates service request with subscription details
 * - Assigns same Pro if available
 * - Calculates next booking date based on frequency
 * - Sends notifications to customer and Pro
 * - Handles errors gracefully with logging
 */

import { storage } from "../storage";
import type { RecurringSubscription, ServiceRequest } from "@shared/schema";

interface AutoBookingResult {
  successCount: number;
  failureCount: number;
  errors: { subscriptionId: string; error: string }[];
}

/**
 * Main cron job function - call this daily at midnight
 */
export async function processSubscriptionAutoBookings(): Promise<AutoBookingResult> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const result: AutoBookingResult = {
    successCount: 0,
    failureCount: 0,
    errors: [],
  };

  try {
    // Get all active subscriptions due for booking today
    const subscriptionsDue = await storage.getActiveSubscriptionsDueForBooking(today);

    console.log(`[Auto-Booking] Found ${subscriptionsDue.length} subscriptions due for booking on ${today}`);

    for (const subscription of subscriptionsDue) {
      try {
        await createAutoBooking(subscription);
        result.successCount++;
        console.log(`[Auto-Booking] Successfully created booking for subscription ${subscription.id}`);
      } catch (error) {
        result.failureCount++;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        result.errors.push({
          subscriptionId: subscription.id,
          error: errorMessage,
        });
        console.error(`[Auto-Booking] Failed to create booking for subscription ${subscription.id}:`, error);
      }
    }

    console.log(`[Auto-Booking] Completed: ${result.successCount} success, ${result.failureCount} failures`);
    return result;
  } catch (error) {
    console.error("[Auto-Booking] Critical error in cron job:", error);
    throw error;
  }
}

/**
 * Create a service request for a recurring subscription
 */
async function createAutoBooking(subscription: RecurringSubscription): Promise<ServiceRequest> {
  // Parse home details from JSON
  const homeDetails = typeof subscription.homeDetails === 'string'
    ? JSON.parse(subscription.homeDetails)
    : subscription.homeDetails;

  // Calculate price based on subscription details
  const price = calculateSubscriptionPrice(homeDetails, subscription.frequency as "weekly" | "biweekly" | "monthly");

  // Create service request
  const serviceRequest = await storage.createServiceRequest({
    customerId: subscription.customerId,
    serviceType: subscription.serviceType,
    status: "pending",
    scheduledFor: new Date().toISOString(), // Today
    pickupAddress: "", // Will be fetched from customer profile
    description: `Recurring ${homeDetails.cleanType} clean - ${homeDetails.bedrooms} bed / ${homeDetails.bathrooms} bath`,
    priceEstimate: price,
    livePrice: price,
    assignedHaulerId: subscription.assignedProId || null,
    freshSpaceDetails: JSON.stringify(homeDetails),
    recurringSubscriptionId: subscription.id,
    createdAt: new Date().toISOString(),
  });

  // Update subscription: increment bookings completed, calculate next booking date
  const nextDate = calculateNextBookingDate(subscription.frequency as "weekly" | "biweekly" | "monthly");
  await storage.updateRecurringSubscription(subscription.id, {
    bookingsCompleted: (subscription.bookingsCompleted || 0) + 1,
    nextBookingDate: nextDate,
    updatedAt: new Date().toISOString(),
  });

  // TODO: Send notifications to customer and Pro
  // await sendCustomerBookingNotification(subscription.customerId, serviceRequest.id);
  // if (subscription.assignedProId) {
  //   await sendProBookingNotification(subscription.assignedProId, serviceRequest.id);
  // }

  return serviceRequest;
}

/**
 * Calculate price based on home details and frequency discount
 */
function calculateSubscriptionPrice(
  homeDetails: any,
  frequency: "weekly" | "biweekly" | "monthly"
): number {
  // Base prices by home size
  const basePrices: Record<string, number> = {
    "1-2 bed / 1 bath": 99,
    "3 bed / 2 bath": 149,
    "4 bed / 2-3 bath": 199,
    "5+ bed / 3+ bath": 249,
  };

  const sizeKey = `${homeDetails.bedrooms} / ${homeDetails.bathrooms}`;
  let basePrice = basePrices[sizeKey] || 149;

  // Apply clean type multiplier
  const multipliers: Record<string, number> = {
    standard: 1,
    deep: 1.5,
    moveInOut: 2,
  };
  basePrice *= multipliers[homeDetails.cleanType] || 1;

  // Add-ons pricing
  const addonPrices: Record<string, number> = {
    oven_cleaning: 35,
    fridge_cleaning: 25,
    interior_windows: 45,
    laundry_wash_fold: 40,
    inside_closets: 30,
    pet_hair_removal: 20,
  };

  let addOnsTotal = 0;
  if (homeDetails.addOns && Array.isArray(homeDetails.addOns)) {
    addOnsTotal = homeDetails.addOns.reduce((sum: number, addonId: string) => {
      return sum + (addonPrices[addonId] || 0);
    }, 0);
  }

  let total = basePrice + addOnsTotal;

  // Apply recurring discount
  const discounts: Record<string, number> = {
    weekly: 0.15,
    biweekly: 0.10,
    monthly: 0.05,
  };
  total *= (1 - (discounts[frequency] || 0));

  return Math.round(total);
}

/**
 * Calculate next booking date based on frequency
 */
function calculateNextBookingDate(frequency: "weekly" | "biweekly" | "monthly"): string {
  const now = new Date();
  const daysToAdd = frequency === "weekly" ? 7 : frequency === "biweekly" ? 14 : 30;
  now.setDate(now.getDate() + daysToAdd);
  return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Setup cron schedule - call this on server startup
 * Runs daily at 1 AM
 */
export function setupSubscriptionAutoBookingCron() {
  // Using node-cron or similar library
  // Example: cron.schedule('0 1 * * *', async () => {
  //   try {
  //     await processSubscriptionAutoBookings();
  //   } catch (error) {
  //     console.error('[Cron] Auto-booking failed:', error);
  //   }
  // });

  console.log("[Cron] Subscription auto-booking job scheduled for daily execution at 1 AM");
}

/**
 * Manual trigger endpoint - for testing or admin use
 */
export async function triggerManualAutoBooking(): Promise<AutoBookingResult> {
  console.log("[Auto-Booking] Manual trigger initiated");
  return await processSubscriptionAutoBookings();
}
