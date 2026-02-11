import type { Express } from "express";
import { storage } from "../../storage";
import { requireAuth } from "../../auth-middleware";
import { quoteRequestSchema } from "@shared/schema";
import { calculateDistance, geocodeZip, isZipCodeSupported, calculateMovePricing, findNearestDump, SUPPORTED_ZIP_CODES } from "../../distanceUtils";
import { z } from "zod";

export function registerPricingRoutes(app: Express) {
  // Map frontend load size IDs to backend-compatible IDs
  const normalizeLoadSize = (frontendLoadSize: string): string => {
    const mapping: Record<string, string> = {
      "minimum": "small",
      "eighth": "small",
      "1/8": "small",
      "quarter": "medium",
      "1/4": "medium",
      "half": "large",
      "1/2": "large",
      "three_quarter": "large",
      "3/4": "large",
      "full": "extra_large",
      "xl": "extra_large",
      "items": "small",
    };

    // Return mapped value if it exists, otherwise pass through (already normalized)
    return mapping[frontendLoadSize.toLowerCase()] || frontendLoadSize;
  };

  // Calculate service quote
  app.post("/api/pricing/quote", async (req, res) => {
    try {
      const quoteRequest = quoteRequestSchema.parse(req.body);
      const { userId, bookingSource } = req.body;

      // Normalize load size to backend-compatible format
      const normalizedRequest = {
        ...quoteRequest,
        loadSize: normalizeLoadSize(quoteRequest.loadSize),
      };

      try {
        // Try database-backed quote first
        if (userId && bookingSource === "app") {
          const quoteWithPromos = await storage.calculateQuoteWithPromotions({
            ...normalizedRequest,
            userId,
            bookingSource,
          });
          return res.json(quoteWithPromos);
        }
        const quote = await storage.calculateQuote(normalizedRequest);
        return res.json(quote);
      } catch (dbError) {
        // Fallback: calculate price from load size tiers when DB is unavailable
        console.warn("Database quote failed, using fallback pricing:", dbError);

        const loadSizePrices: Record<string, number> = {
          minimum: 99,
          "1/8": 179,
          "1/4": 279,
          "1/2": 379,
          "3/4": 449,
          full: 549,
          small: 299,
          medium: 499,
          large: 749,
          xl: 999,
        };

        const basePrice = loadSizePrices[quoteRequest.loadSize] || 199;

        return res.json({
          totalPrice: basePrice,
          priceMin: Math.round(basePrice * 0.85),
          priceMax: Math.round(basePrice * 1.15),
          surgeMultiplier: 1,
          breakdown: [
            { label: "Base service price", amount: basePrice },
          ],
          promoDiscount: 0,
          promoCodeApplied: null,
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid quote request", details: error.errors });
      }
      res.status(500).json({ error: "Failed to calculate quote" });
    }
  });

  const moveQuoteSchema = z.object({
    pickupZip: z.string().length(5, "Pickup zip code must be 5 digits"),
    destinationZip: z.string().length(5, "Destination zip code must be 5 digits"),
    pickupStairs: z.number().int().min(0).max(20).default(0),
    destinationStairs: z.number().int().min(0).max(20).default(0),
    moveServiceMode: z.enum(["truck_and_mover", "labor_only"]).default("truck_and_mover"),
    basePrice: z.number().min(0).default(99),
  });

  // Calculate move quote with distance and stairs
  app.post("/api/pricing/move-quote", async (req, res) => {
    try {
      const parseResult = moveQuoteSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request", details: parseResult.error.errors });
      }
      const { pickupZip, destinationZip, pickupStairs, destinationStairs, moveServiceMode, basePrice } = parseResult.data;

      const pickupSupported = isZipCodeSupported(pickupZip);
      const destSupported = isZipCodeSupported(destinationZip);

      if (!pickupSupported || !destSupported) {
        const unsupported = [];
        if (!pickupSupported) unsupported.push(`pickup: ${pickupZip}`);
        if (!destSupported) unsupported.push(`destination: ${destinationZip}`);
        return res.status(400).json({
          error: "Zip code not in service area",
          unsupportedZips: unsupported,
          message: "UpTend is currently only available in the Orlando metro area. We're expanding soon!"
        });
      }

      const pickupCoords = geocodeZip(pickupZip);
      const destCoords = geocodeZip(destinationZip);

      if (!pickupCoords || !destCoords) {
        return res.status(400).json({ error: "Could not locate addresses" });
      }

      const distanceMiles = calculateDistance(
        pickupCoords.lat, pickupCoords.lng,
        destCoords.lat, destCoords.lng
      );

      const pricing = calculateMovePricing(
        distanceMiles,
        pickupStairs || 0,
        destinationStairs || 0,
        moveServiceMode || 'truck_and_mover',
        basePrice || 99
      );

      res.json({
        distanceMiles,
        pickupCoords,
        destinationCoords: destCoords,
        ...pricing
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate move quote" });
    }
  });

  // Get supported zip codes
  app.get("/api/pricing/supported-zips", async (req, res) => {
    res.json({
      supportedZips: Object.keys(SUPPORTED_ZIP_CODES),
      serviceArea: "Orlando Metro Area"
    });
  });

  // Get distance to nearest dump/transfer station
  app.get("/api/pricing/dump-distance/:zip", async (req, res) => {
    try {
      const { zip } = req.params;
      const coords = geocodeZip(zip);

      if (!coords) {
        return res.status(400).json({
          error: "Unsupported zip code",
          message: "We currently only service the Orlando metro area."
        });
      }

      const dumpInfo = findNearestDump(coords.lat, coords.lng);

      res.json({
        zip,
        nearestDump: dumpInfo.name,
        distanceMiles: dumpInfo.distanceMiles,
        estimatedDriveMinutes: dumpInfo.estimatedDriveMinutes,
        distanceFee: dumpInfo.distanceFee,
      });
    } catch (error) {
      console.error("Error calculating dump distance:", error);
      res.status(500).json({ error: "Failed to calculate distance" });
    }
  });

  // Check priority slot availability
  app.get("/api/slots/priority/:date", requireAuth, async (req, res) => {
    try {
      const { date } = req.params;
      const slots = await storage.getAvailablePrioritySlots(date);

      const slotDateObj = new Date(date);
      const dayOfWeek = slotDateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const today = new Date();
      const isSameDay = slotDateObj.toDateString() === today.toDateString();

      res.json({
        date,
        isSameDay,
        isWeekend,
        isPriorityDate: isSameDay || isWeekend,
        message: isSameDay || isWeekend
          ? "Same-day and weekend slots are reserved for app bookings first!"
          : "Regular booking - available on all channels",
        bookedSlots: slots,
      });
    } catch (error) {
      console.error("Error checking priority slots:", error);
      res.status(500).json({ error: "Failed to check priority slots" });
    }
  });

  // Check upsell opportunities based on job and hauler capabilities
  app.post("/api/service-requests/:id/upsell-check", requireAuth, async (req: any, res) => {
    try {
      const job = await storage.getServiceRequest(req.params.id);
      if (!job) return res.status(404).json({ error: "Job not found" });

      const haulerId = job.assignedHaulerId;
      if (!haulerId) return res.json({ opportunities: [] });

      const haulerProfile = await storage.getHaulerProfile(haulerId);
      if (!haulerProfile) return res.json({ opportunities: [] });

      const { getUpsellOpportunities } = await import("../../services/pricing");
      const opportunities = getUpsellOpportunities(job.serviceType, {
        hasPressureWasher: haulerProfile.hasPressureWasher || false,
        hasTallLadder: haulerProfile.hasTallLadder || false,
        hasDemoTools: haulerProfile.hasDemoTools || false,
        supportedServices: (haulerProfile.supportedServices as string[]) || ["junk_removal"],
      });

      res.json({ opportunities });
    } catch (error) {
      console.error("Upsell check error:", error);
      res.status(500).json({ error: "Failed to check upsell opportunities" });
    }
  });
}
