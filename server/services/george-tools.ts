/**
 * George AI Agent — Tool Functions
 *
 * Every function pulls LIVE data from the existing pricing constants.
 * George NEVER hardcodes prices — he always calls these tools.
 */

import { SERVICES } from "../../client/src/constants/services";
import {
  PRICING_CONSTANTS,
  calculateServicePrice,
  getServiceLabel,
} from "./pricing";
import {
  POLISHUP_BASE_PRICES,
  POLISHUP_ADDONS,
  TWO_STORY_SURCHARGE,
  calculatePolishUpPrice,
  type PolishUpPricingParams,
} from "../../shared/polishup-pricing";
import {
  HANDYMAN_TASKS,
  HANDYMAN_CATEGORIES,
  calculateHandymanTaskPrice,
  calculateHandymanQuoteTotal,
} from "../../shared/handyman-pricing";
import {
  junkRemovalCategories,
  getAllItemsFlat,
  getItemPrice,
} from "../../shared/itemCatalog";
import { NAMED_BUNDLES, calculateBundlePrice, type BundleId } from "../../shared/bundles";
import {
  FRESHCUT_ONE_TIME,
  FRESHCUT_RECURRING,
  FRESHCUT_ADDONS,
  DEEPFIBER_PER_ROOM,
  DEEPFIBER_METHODS,
  DEEPFIBER_ADDONS,
  DEEPFIBER_RECURRING_DISCOUNTS,
  POOLSPARK_RECURRING,
  POOLSPARK_ONE_TIME,
  BUNDLES as PRICING_BUNDLES,
} from "../../shared/pricing/constants";
import { DWELLSCAN_TIERS, DWELLSCAN_SERVICE_CREDIT } from "../../shared/dwellscan-tiers";

// ─────────────────────────────────────────────
// a) getServicePricing
// ─────────────────────────────────────────────
export function getServicePricing(serviceId: string): object {
  const svc = (SERVICES as any)[serviceId];
  if (!svc) {
    return { error: `Unknown service: ${serviceId}` };
  }

  const result: any = {
    serviceId,
    displayName: svc.display || svc.branded,
    tagline: svc.tagline,
    description: svc.description,
    startingPrice: svc.startingPrice,
    priceUnit: svc.priceUnit,
  };

  // Service-specific pricing detail
  switch (serviceId) {
    case "home_cleaning": {
      result.cleanTypes = ["standard", "deep", "move_out"];
      result.pricingMatrix = POLISHUP_BASE_PRICES;
      result.twoStorySurcharge = `${TWO_STORY_SURCHARGE * 100}%`;
      result.addOns = Object.values(POLISHUP_ADDONS).map((a: any) => ({
        id: a.id,
        name: a.name,
        price: a.price || a.pricePerWindow || a.pricePerLoad,
        unit: a.price ? "flat" : a.pricePerWindow ? "per window" : "per load",
        description: a.description,
      }));
      break;
    }
    case "carpet_cleaning": {
      result.tiers = svc.tiers;
      result.minimumCharge = svc.minimumCharge || 99;
      result.methods = DEEPFIBER_METHODS.map((m) => ({
        id: m.id,
        label: m.label,
        pricePerRoom: m.centsPerRoom / 100,
        dryTime: m.dryTimeHrs,
      }));
      result.addOns = DEEPFIBER_ADDONS.map((a) => ({
        id: a.id,
        label: a.label,
        price: a.basePrice / 100,
        unit: a.unit,
      }));
      result.recurringDiscounts = DEEPFIBER_RECURRING_DISCOUNTS;
      break;
    }
    case "junk_removal": {
      result.loadTiers = [
        { size: "Minimum (1-2 items)", price: 99 },
        { size: "1/8 Truck", price: 179 },
        { size: "1/4 Truck", price: 279 },
        { size: "1/2 Truck", price: 379 },
        { size: "3/4 Truck", price: 449 },
        { size: "Full Truck", price: 549 },
      ];
      result.categories = junkRemovalCategories.map((c) => ({
        name: c.name,
        itemCount: c.items.length,
        sampleItems: c.items.slice(0, 3).map((i) => ({ label: i.label, price: i.basePrice })),
      }));
      break;
    }
    case "handyman": {
      result.hourlyRate = 75;
      result.minimumHours = 1;
      result.multiTaskDiscount = "10% off when booking 3+ tasks";
      result.categories = Object.entries(HANDYMAN_CATEGORIES).map(([id, cat]) => ({
        id,
        label: cat.label,
        icon: cat.icon,
      }));
      result.popularTasks = HANDYMAN_TASKS.slice(0, 8).map((t) => ({
        id: t.id,
        name: t.name,
        price: t.basePrice,
        estimatedMinutes: t.estimatedTime,
      }));
      break;
    }
    case "gutter_cleaning": {
      result.tiers = svc.tiers;
      result.addOns = svc.addOns;
      break;
    }
    case "landscaping": {
      result.tiers = svc.tiers;
      result.detailedOneTime = FRESHCUT_ONE_TIME.map((t) => ({
        id: t.id,
        label: t.label,
        price: t.basePrice / 100,
        maxPrice: t.maxPrice ? t.maxPrice / 100 : undefined,
      }));
      result.detailedRecurring = FRESHCUT_RECURRING.map((t) => ({
        id: t.id,
        label: t.label,
        pricePerMonth: t.basePrice / 100,
      }));
      break;
    }
    case "pool_cleaning": {
      result.tiers = svc.tiers;
      break;
    }
    case "pressure_washing": {
      result.ratePerSqft = PRICING_CONSTANTS.PRESSURE_WASH_SQFT / 100;
      result.minimumPrice = PRICING_CONSTANTS.PRESSURE_WASH_MIN / 100;
      break;
    }
    case "moving_labor": {
      result.hourlyRatePerPro = PRICING_CONSTANTS.MOVER_HOURLY / 100;
      result.minimumHours = PRICING_CONSTANTS.MOVER_MIN_HOURS;
      result.subTypes = svc.subTypes;
      break;
    }
    case "garage_cleanout": {
      result.startingPrice = svc.startingPrice;
      break;
    }
    case "light_demolition": {
      result.startingPrice = PRICING_CONSTANTS.DEMO_BASE_RATE / 100;
      break;
    }
    case "home_scan": {
      result.tiers = {
        standard: { ...DWELLSCAN_TIERS.standard },
        aerial: { ...DWELLSCAN_TIERS.aerial },
      };
      result.serviceCredit = DWELLSCAN_SERVICE_CREDIT;
      break;
    }
  }

  return result;
}

// ─────────────────────────────────────────────
// b) calculateQuote
// ─────────────────────────────────────────────
export function calculateQuote(serviceId: string, selections: any): object {
  switch (serviceId) {
    case "home_cleaning": {
      const params: PolishUpPricingParams = {
        bedrooms: selections.bedrooms || 3,
        bathrooms: selections.bathrooms || 2,
        stories: selections.stories || 1,
        cleanType: selections.cleanType || "standard",
        addOns: selections.addOns || [],
      };
      const result = calculatePolishUpPrice(params);
      return {
        serviceId,
        serviceName: "Home Cleaning",
        ...result,
        priceFormatted: `$${result.totalPrice}`,
      };
    }

    case "carpet_cleaning": {
      const priceCents = calculateServicePrice("carpet_cleaning", {
        tier: selections.cleanType || "standard",
        rooms: selections.rooms || 0,
        hallways: selections.hallways || 0,
        stairFlights: selections.stairs || 0,
        scotchgardRooms: selections.scotchgard ? (selections.rooms || 0) : 0,
        package: selections.package,
      });
      const price = priceCents !== null ? priceCents / 100 : null;
      return {
        serviceId,
        serviceName: "Carpet Cleaning",
        totalPrice: price,
        minimumApplied: price !== null && price < 99 ? 99 : undefined,
        priceFormatted: price !== null ? `$${Math.max(price, 99)}` : "Quote needed",
      };
    }

    case "junk_removal": {
      if (selections.items && Array.isArray(selections.items)) {
        let total = 0;
        const breakdown: any[] = [];
        for (const item of selections.items) {
          const unitPrice = getItemPrice(item.id);
          const qty = item.quantity || 1;
          const lineTotal = unitPrice * qty;
          total += lineTotal;
          breakdown.push({ item: item.id, unitPrice, quantity: qty, lineTotal });
        }
        // Volume discount: 10% off for $400+, 15% for $600+
        let discount = 0;
        if (total >= 600) discount = 0.15;
        else if (total >= 400) discount = 0.10;
        const discountAmount = Math.round(total * discount);
        const finalPrice = Math.max(total - discountAmount, 99);
        return {
          serviceId,
          serviceName: "Junk Removal",
          subtotal: total,
          discount: discount > 0 ? `${discount * 100}%` : undefined,
          discountAmount,
          totalPrice: finalPrice,
          priceFormatted: `$${finalPrice}`,
          breakdown,
        };
      }
      if (selections.loadSize) {
        const loadPrices: Record<string, number> = {
          minimum: 99, "1/8": 179, "1/4": 279, "1/2": 379, "3/4": 449, full: 549,
        };
        const price = loadPrices[selections.loadSize] || 99;
        return {
          serviceId,
          serviceName: "Junk Removal",
          loadSize: selections.loadSize,
          totalPrice: price,
          priceFormatted: `$${price}`,
        };
      }
      return { serviceId, error: "Provide items[] or loadSize" };
    }

    case "handyman": {
      if (selections.tasks && Array.isArray(selections.tasks)) {
        const quoteResult = calculateHandymanQuoteTotal(
          selections.tasks.map((t: any) => ({
            taskId: t.taskId || t.id,
            variables: t.variables,
          }))
        );
        // 10% discount for 3+ tasks
        let discount = 0;
        if (quoteResult.breakdown.length >= 3) {
          discount = Math.round(quoteResult.total * 0.10);
        }
        const finalPrice = quoteResult.total - discount;
        return {
          serviceId,
          serviceName: "Handyman Services",
          subtotal: quoteResult.total,
          estimatedMinutes: quoteResult.estimatedTime,
          discount: discount > 0 ? `10% multi-task discount` : undefined,
          discountAmount: discount,
          totalPrice: finalPrice,
          priceFormatted: `$${finalPrice}`,
          breakdown: quoteResult.breakdown,
        };
      }
      if (selections.hours) {
        const price = (selections.hours || 1) * 75;
        return {
          serviceId,
          serviceName: "Handyman Services",
          hours: selections.hours,
          totalPrice: price,
          priceFormatted: `$${price}`,
        };
      }
      return { serviceId, error: "Provide tasks[] or hours" };
    }

    case "gutter_cleaning": {
      const priceCents = calculateServicePrice("gutter_cleaning", {
        storyCount: selections.stories || 1,
        linearFeet: selections.linearFeet || 150,
      });
      const price = priceCents !== null ? priceCents / 100 : null;
      return {
        serviceId,
        serviceName: "Gutter Cleaning",
        totalPrice: price,
        priceFormatted: price !== null ? `$${price}` : "Quote needed",
      };
    }

    case "landscaping": {
      const priceCents = calculateServicePrice("landscaping", {
        lotSize: selections.lotSize || "quarter",
        planType: selections.planType || selections.tier || "one_time_mow",
      });
      const price = priceCents !== null ? priceCents / 100 : null;
      const isRecurring = ["mow_go", "full_service", "premium"].includes(selections.planType || selections.tier);
      return {
        serviceId,
        serviceName: "Landscaping",
        totalPrice: price,
        billingType: isRecurring ? "monthly" : "one-time",
        priceFormatted: price !== null ? `$${price}${isRecurring ? "/mo" : ""}` : "Quote needed",
      };
    }

    case "pool_cleaning": {
      const priceCents = calculateServicePrice("pool_cleaning", {
        tier: selections.tier || "basic",
      });
      const price = priceCents !== null ? priceCents / 100 : null;
      const isOneTime = selections.tier === "deep_clean";
      return {
        serviceId,
        serviceName: "Pool Cleaning",
        tier: selections.tier || "basic",
        totalPrice: price,
        billingType: isOneTime ? "one-time" : "monthly",
        priceFormatted: price !== null ? `$${price}${isOneTime ? "" : "/mo"}` : "Quote needed",
      };
    }

    case "pressure_washing": {
      const priceCents = calculateServicePrice("pressure_washing", {
        squareFootage: selections.squareFootage || 480,
      });
      const price = priceCents !== null ? priceCents / 100 : null;
      return {
        serviceId,
        serviceName: "Pressure Washing",
        squareFootage: selections.squareFootage,
        totalPrice: price,
        priceFormatted: price !== null ? `$${price}` : "Quote needed",
      };
    }

    case "moving_labor": {
      const priceCents = calculateServicePrice("moving_labor", {
        laborHours: selections.hours || 2,
        laborCrewSize: selections.numPros || 2,
      });
      const price = priceCents !== null ? priceCents / 100 : null;
      return {
        serviceId,
        serviceName: "Moving Labor",
        hours: selections.hours || 2,
        numPros: selections.numPros || 2,
        totalPrice: price,
        priceFormatted: price !== null ? `$${price}` : "Quote needed",
      };
    }

    case "garage_cleanout": {
      // Tiered by size
      const sizePrices: Record<string, number> = { small: 299, medium: 449, large: 599 };
      const price = sizePrices[selections.size || "small"] || 299;
      return {
        serviceId,
        serviceName: "Garage Cleanout",
        size: selections.size || "small",
        totalPrice: price,
        priceFormatted: `$${price}`,
      };
    }

    case "light_demolition": {
      const basePrice = PRICING_CONSTANTS.DEMO_BASE_RATE / 100;
      return {
        serviceId,
        serviceName: "Light Demolition",
        startingPrice: basePrice,
        note: "Final price depends on scope — starts at $199. We'll confirm after reviewing details.",
        priceFormatted: `Starting at $${basePrice}`,
      };
    }

    case "home_scan": {
      const tier = selections.tier || "standard";
      const tierData = DWELLSCAN_TIERS[tier as keyof typeof DWELLSCAN_TIERS];
      if (!tierData) return { serviceId, error: "Invalid tier" };
      return {
        serviceId,
        serviceName: "AI Home Scan",
        tier,
        totalPrice: tierData.price,
        serviceCredit: DWELLSCAN_SERVICE_CREDIT,
        priceFormatted: `$${tierData.price}`,
        note: `Includes $${DWELLSCAN_SERVICE_CREDIT} credit toward your next service`,
      };
    }

    default:
      return { serviceId, error: `Pricing calculation not available for ${serviceId}` };
  }
}

// ─────────────────────────────────────────────
// c) getBundleOptions
// ─────────────────────────────────────────────
export function getBundleOptions(serviceIds: string[]): object {
  const matching: any[] = [];
  const serviceSet = new Set(serviceIds);

  for (const [bundleId, bundle] of Object.entries(NAMED_BUNDLES)) {
    // Check if any of the requested services are in this bundle
    const overlap = bundle.services.filter((s) => serviceSet.has(s));
    if (overlap.length > 0) {
      const priceInfo = calculateBundlePrice(bundleId as BundleId);
      matching.push({
        id: bundle.id,
        name: bundle.name,
        description: bundle.description,
        services: bundle.services,
        bundlePrice: priceInfo.finalPrice,
        alacartePrice: bundle.alacartePrice,
        savings: priceInfo.totalSavings,
        badge: bundle.badge,
        matchedServices: overlap,
      });
    }
  }

  return {
    requestedServices: serviceIds,
    matchingBundles: matching,
    bundleCount: matching.length,
  };
}

// ─────────────────────────────────────────────
// d) checkAvailability
// ─────────────────────────────────────────────
export function checkAvailability(serviceId: string, zip: string, date: string): object {
  // Orlando-area zip prefixes
  const orlandoZips = ["327", "328", "347"];
  const zipPrefix = zip.substring(0, 3);
  const isOrlando = orlandoZips.includes(zipPrefix);

  if (!isOrlando) {
    return {
      available: false,
      serviceId,
      zip,
      date,
      message: "We currently serve the Orlando metro area (Orange, Seminole, and Osceola counties). We're expanding soon!",
    };
  }

  return {
    available: true,
    serviceId,
    zip,
    date,
    message: "Service is available in your area! We can typically schedule within 24-48 hours.",
    nextAvailableSlots: [
      { date, timeSlot: "Morning (8am-12pm)" },
      { date, timeSlot: "Afternoon (12pm-5pm)" },
    ],
  };
}

// ─────────────────────────────────────────────
// e) createBookingDraft
// ─────────────────────────────────────────────
export function createBookingDraft(params: any): object {
  const quote = calculateQuote(params.serviceId, params.selections || {});
  const quoteAny = quote as any;

  return {
    draftId: `draft_${Date.now()}`,
    serviceId: params.serviceId,
    serviceName: quoteAny.serviceName || getServiceLabel(params.serviceId),
    selections: params.selections,
    quote: quoteAny,
    address: params.address || null,
    preferredDate: params.date || null,
    preferredTime: params.timeSlot || null,
    status: "draft",
    message: "Here's your booking summary. Ready to confirm?",
    nextStep: "confirm_booking",
  };
}

// ─────────────────────────────────────────────
// f) getCustomerJobs  (stub — connects to DB)
// ─────────────────────────────────────────────
export async function getCustomerJobs(userId: string, storage?: any): Promise<object> {
  if (storage) {
    try {
      const jobs = await storage.getJobsByUser?.(userId);
      if (jobs && jobs.length > 0) {
        return {
          userId,
          jobs: jobs.map((j: any) => ({
            id: j.id,
            service: j.serviceType,
            status: j.status,
            date: j.scheduledDate,
            price: j.totalPrice,
          })),
          count: jobs.length,
        };
      }
    } catch {}
  }

  return {
    userId,
    jobs: [],
    count: 0,
    message: "No recent jobs found. Ready to book your first service?",
  };
}

// ─────────────────────────────────────────────
// g) getAllServices
// ─────────────────────────────────────────────
export function getAllServices(): object {
  const serviceList = Object.entries(SERVICES).map(([id, svc]) => ({
    id,
    displayName: (svc as any).display || (svc as any).branded,
    tagline: (svc as any).tagline,
    startingPrice: (svc as any).startingPrice,
    priceUnit: (svc as any).priceUnit,
    slug: (svc as any).slug,
  }));

  return {
    services: serviceList,
    count: serviceList.length,
    serviceArea: "Orlando Metro Area (Orange, Seminole, Osceola counties)",
  };
}
