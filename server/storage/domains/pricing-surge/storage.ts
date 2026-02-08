import { eq, and, inArray } from "drizzle-orm";
import { db } from "../../../db";
import { pricingRates, surgeModifiers, serviceRequests } from "@shared/schema";
import type {
  PricingRate,
  InsertPricingRate,
  SurgeModifier,
  InsertSurgeModifier,
  ServiceRequest,
  PriceQuote,
  QuoteRequest,
} from "@shared/schema";

export class PricingSurgeStorage {
  async getPricingRate(serviceType: string, loadSize: string, vehicleType?: string): Promise<PricingRate | undefined> {
    let query = db.select().from(pricingRates)
      .where(and(
        eq(pricingRates.serviceType, serviceType),
        eq(pricingRates.loadSize, loadSize),
        eq(pricingRates.isActive, true)
      ));

    const [rate] = await query;
    return rate || undefined;
  }

  async getAllPricingRates(): Promise<PricingRate[]> {
    return db.select().from(pricingRates).where(eq(pricingRates.isActive, true));
  }

  async createPricingRate(rate: InsertPricingRate): Promise<PricingRate> {
    const [newRate] = await db.insert(pricingRates).values(rate).returning();
    return newRate;
  }

  async getCurrentSurgeMultiplier(): Promise<number> {
    // Surge pricing is disabled - always return 1.0 for consistent, transparent pricing
    return 1.0;
  }

  async getSurgeModifiers(): Promise<SurgeModifier[]> {
    return db.select().from(surgeModifiers).where(eq(surgeModifiers.isActive, true));
  }

  async createSurgeModifier(modifier: InsertSurgeModifier): Promise<SurgeModifier> {
    const [newModifier] = await db.insert(surgeModifiers).values(modifier).returning();
    return newModifier;
  }

  async updateSurgeModifier(id: string, updates: Partial<SurgeModifier>): Promise<SurgeModifier | undefined> {
    const [updated] = await db.update(surgeModifiers).set(updates).where(eq(surgeModifiers.id, id)).returning();
    return updated;
  }

  async deleteSurgeModifier(id: string): Promise<void> {
    await db.delete(surgeModifiers).where(eq(surgeModifiers.id, id));
  }

  async getHaulerActiveJobs(haulerId: string): Promise<ServiceRequest[]> {
    return db.select().from(serviceRequests).where(
      and(
        eq(serviceRequests.assignedHaulerId, haulerId),
        inArray(serviceRequests.status, ["assigned", "in_progress"])
      )
    );
  }

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
   * COMPLEX PRICING ALGORITHM - calculateQuote
   *
   * This method calculates a comprehensive price quote with the following logic:
   *
   * 1. Base Rates by Service Type:
   *    - junk_removal: $75
   *    - furniture_moving: $95
   *    - garage_cleanout: $179
   *    - estate_cleanout: $150
   *
   * 2. Load Size Multipliers:
   *    - small: 1.0x
   *    - medium: 1.5x
   *    - large: 2.0x
   *    - extra_large: 3.0x
   *
   * 3. Vehicle Surcharges (flat fees):
   *    - pickup_truck: $0
   *    - cargo_van: $15
   *    - box_truck: $35
   *    - flatbed: $50
   *
   * 4. Service-Specific Logic:
   *    a) Disposal Services (junk_removal, garage_cleanout, estate_cleanout):
   *       - Flat $15 disposal fee (NOT multiplied by load size)
   *       - No distance charges (hauler handles dump trip)
   *
   *    b) Mileage Services (furniture_moving):
   *       - Distance charge: calculated miles × $1.00/mile
   *       - Uses Haversine formula for pickup to destination distance
   *       - No disposal fee
   *
   * 5. Final Calculation:
   *    - Load-adjusted subtotal = (base + distance + vehicle) × load_multiplier
   *    - Subtotal = load-adjusted subtotal + disposal_fee (flat)
   *    - Total = subtotal × surge_multiplier (currently always 1.0)
   *
   * 6. Confidence Range:
   *    - Returns 15% variance (±15%) for price range estimates
   *    - Confidence level: 0.85 (85%)
   *
   * 7. Price Breakdown:
   *    - Itemized breakdown showing each component
   *    - Labels include actual values (e.g., "Distance (5.2 mi @ $1/mi)")
   */
  async calculateQuote(request: QuoteRequest): Promise<PriceQuote> {
    // Load size multipliers applied to base price + distance + vehicle
    const loadSizeMultipliers: Record<string, number> = {
      small: 1.0,
      medium: 1.5,
      large: 2.0,
      extra_large: 3.0,
    };

    // Vehicle surcharges (flat fees added before load multiplier)
    const vehicleSurcharges: Record<string, number> = {
      pickup_truck: 0,
      cargo_van: 15,
      box_truck: 35,
      flatbed: 50,
    };

    // Base rates by service type
    const baseRates: Record<string, number> = {
      junk_removal: 75,
      furniture_moving: 95,
      garage_cleanout: 179,
      estate_cleanout: 150,
    };

    // Services that require disposal (junk goes to dump)
    const disposalServices = ['junk_removal', 'garage_cleanout', 'estate_cleanout'];
    const isDisposalService = disposalServices.includes(request.serviceType);
    const DISPOSAL_FEE = 15; // Flat $15 disposal fee for junk services

    // Services that charge mileage (moving from point A to point B)
    const mileageServices = ['furniture_moving'];
    const isMileageService = mileageServices.includes(request.serviceType);

    // Get rate from database or use defaults
    const rate = await this.getPricingRate(request.serviceType, request.loadSize, request.vehicleType);
    const basePrice = rate?.baseRate || baseRates[request.serviceType] || 75;
    const perMileRate = rate?.perMileRate || 1.0;

    let distanceMiles = 0;
    // Only calculate distance for moving services
    if (isMileageService && request.pickupLat && request.pickupLng && request.destinationLat && request.destinationLng) {
      distanceMiles = this.calculateDistance(
        request.pickupLat, request.pickupLng,
        request.destinationLat, request.destinationLng
      );
    }

    // Distance charge only applies to moving services
    const distanceCharge = isMileageService ? (distanceMiles * perMileRate) : 0;
    const loadMultiplier = loadSizeMultipliers[request.loadSize] || 1.0;
    const vehicleSurcharge = request.vehicleType ? (vehicleSurcharges[request.vehicleType] || 0) : 0;
    const surgeMultiplier = await this.getCurrentSurgeMultiplier();

    // Disposal fee is a flat fee (not multiplied by load size)
    const disposalFee = isDisposalService ? DISPOSAL_FEE : 0;

    // Calculate subtotal: base + distance + vehicle are multiplied by load; disposal is added flat
    const loadAdjustedSubtotal = (basePrice + distanceCharge + vehicleSurcharge) * loadMultiplier;
    const subtotal = loadAdjustedSubtotal + disposalFee;
    const totalPrice = Math.round(subtotal * surgeMultiplier * 100) / 100;

    // Build itemized breakdown
    const breakdown = [
      { label: "Base rate", amount: basePrice },
    ];

    // Show distance charge for moving services
    if (distanceCharge > 0) {
      breakdown.push({ label: `Distance (${distanceMiles.toFixed(1)} mi @ $${perMileRate}/mi)`, amount: Math.round(distanceCharge * 100) / 100 });
    }

    // Show disposal fee for junk services
    if (disposalFee > 0) {
      breakdown.push({ label: "Disposal fee", amount: disposalFee });
    }

    if (vehicleSurcharge > 0) {
      breakdown.push({ label: "Vehicle surcharge", amount: vehicleSurcharge });
    }

    if (loadMultiplier > 1) {
      breakdown.push({ label: `Load size (${request.loadSize})`, amount: Math.round((loadAdjustedSubtotal - basePrice - distanceCharge - vehicleSurcharge) * 100) / 100 });
    }

    if (surgeMultiplier > 1) {
      breakdown.push({ label: `Surge pricing (${surgeMultiplier}x)`, amount: Math.round((totalPrice - subtotal) * 100) / 100 });
    }

    // Confidence range: ±15% variance
    const confidenceVariance = 0.15;
    const priceMin = Math.round(totalPrice * (1 - confidenceVariance) * 100) / 100;
    const priceMax = Math.round(totalPrice * (1 + confidenceVariance) * 100) / 100;

    return {
      basePrice,
      distanceCharge: Math.round(distanceCharge * 100) / 100,
      loadSizeMultiplier: loadMultiplier,
      vehicleSurcharge,
      surgeMultiplier,
      totalPrice,
      priceMin,
      priceMax,
      confidence: 0.85,
      breakdown,
    };
  }
}
