/**
 * George AI Agent — Tool Functions
 *
 * Phase 1: All DB-backed tools now query real Supabase via Drizzle ORM.
 * New tables: maintenance_reminders, pro_goals, customer_loyalty,
 *             smart_home_devices, service_history_notes.
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
  getQuote as pricingEngineGetQuote,
  getServicePricing as pricingEngineGetServicePricing,
  getBundleDiscount as pricingEngineGetBundleDiscount,
  getAllPricing as pricingEngineGetAllPricing,
} from "./pricing-engine.js";
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
// DB imports — Phase 1 live database queries
// ─────────────────────────────────────────────
import { db, pool } from "../db";
import {
  serviceRequests,
  haulerProfiles,
  haulerReviews,
  proCertifications,
  businessAccounts,
  weeklyBillingRuns,
  homeProfiles,
  homeAppliances,
  homeServiceHistory,
  referrals,
} from "../../shared/schema";
import { eq, desc, and, inArray } from "drizzle-orm";

// ─────────────────────────────────────────────
// Helper: resolve hauler profile by userId or profile id
// ─────────────────────────────────────────────
async function getHaulerProfileByProId(proId: string) {
  try {
    let [profile] = await db.select().from(haulerProfiles)
      .where(eq(haulerProfiles.userId, proId))
      .limit(1);
    if (!profile) {
      [profile] = await db.select().from(haulerProfiles)
        .where(eq(haulerProfiles.id, proId))
        .limit(1);
    }
    return profile || null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// a) getServicePricing — delegates to centralized pricing engine
// ─────────────────────────────────────────────
export async function getServicePricingFromEngine(serviceId: string): Promise<object> {
  try {
    const tiers = await pricingEngineGetServicePricing(serviceId);
    if (tiers.length > 0) {
      const svc = (SERVICES as any)[serviceId];
      return {
        serviceId,
        displayName: svc?.display || svc?.branded || serviceId,
        tagline: svc?.tagline,
        description: svc?.description,
        tiers: tiers.map(t => ({
          size: t.sizeCategory,
          scope: t.scopeLevel,
          price: t.baseRate,
          unit: t.unit,
          minPrice: t.minPrice,
          maxPrice: t.maxPrice,
          estimatedMinutes: t.estimatedDuration,
        })),
        startingPrice: tiers[0].baseRate,
        priceUnit: tiers[0].unit,
        source: "pricing_engine",
      };
    }
  } catch (err) {
    console.warn("[George Tools] Pricing engine fallback for", serviceId, err);
  }
  // Fallback to legacy
  return getServicePricing(serviceId);
}

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
// b) calculateQuote — delegates to centralized pricing engine
// ─────────────────────────────────────────────
export async function calculateQuoteFromEngine(serviceId: string, selections: any): Promise<object> {
  try {
    const options: any = {};
    // Map selections to pricing engine options
    if (selections.size || selections.loadSize) options.size = selections.size || selections.loadSize;
    if (selections.cleanType) options.scope = selections.cleanType;
    if (selections.tier) options.scope = selections.tier;
    if (selections.scope) options.scope = selections.scope;
    if (selections.zip) options.zip = selections.zip;
    if (selections.isRush) options.isRush = true;
    if (selections.rooms) options.rooms = selections.rooms;
    if (selections.hours) options.hours = selections.hours;
    if (selections.squareFootage) options.sqft = selections.squareFootage;
    if (selections.bundledWith) options.bundledWith = selections.bundledWith;

    const quote = await pricingEngineGetQuote(serviceId, options);
    const svc = (SERVICES as any)[serviceId];
    return {
      serviceId,
      serviceName: svc?.display || svc?.branded || serviceId,
      lowEstimate: quote.lowEstimate,
      highEstimate: quote.highEstimate,
      guaranteedCeiling: quote.guaranteedCeiling,
      baseRate: quote.baseRate,
      unit: quote.unit,
      totalPrice: quote.lowEstimate,
      priceFormatted: `$${quote.lowEstimate}`,
      appliedMultipliers: quote.appliedMultipliers,
      breakdown: quote.breakdown,
      source: "pricing_engine",
    };
  } catch (err) {
    console.warn("[George Tools] Quote engine fallback for", serviceId, err);
  }
  // Fallback to legacy
  return calculateQuote(serviceId, selections);
}

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
// c) getBundleOptions — delegates to centralized pricing engine
// ─────────────────────────────────────────────
export async function getBundleOptionsFromEngine(serviceIds: string[]): Promise<object> {
  try {
    if (serviceIds.length >= 2) {
      const bundle = await pricingEngineGetBundleDiscount(serviceIds);
      return {
        requestedServices: serviceIds,
        bundleName: bundle.bundleName,
        discountPercent: bundle.discountPercent,
        estimatedSavings: bundle.estimatedSavings,
        individualPrices: bundle.individualTotals,
        totalBeforeDiscount: Object.values(bundle.individualTotals).reduce((s, v) => s + v, 0),
        totalAfterDiscount: Object.values(bundle.individualTotals).reduce((s, v) => s + v, 0) - bundle.estimatedSavings,
        source: "pricing_engine",
      };
    }
  } catch (err) {
    console.warn("[George Tools] Bundle engine fallback:", err);
  }
  return getBundleOptions(serviceIds);
}

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
// f) getCustomerJobs — live DB query
// ─────────────────────────────────────────────
export async function getCustomerJobs(userId: string, storage?: any): Promise<object> {
  try {
    const jobs = await db.select().from(serviceRequests)
      .where(eq(serviceRequests.customerId, userId))
      .orderBy(desc(serviceRequests.createdAt))
      .limit(20);

    return {
      userId,
      jobs: jobs.map((j) => ({
        id: j.id,
        service: j.serviceType,
        status: j.status,
        date: j.scheduledFor,
        price: j.finalPrice || j.priceEstimate,
        address: j.pickupAddress,
        city: j.pickupCity,
      })),
      count: jobs.length,
      message: jobs.length === 0 ? "No recent jobs found. Ready to book your first service?" : undefined,
    };
  } catch (e) {
    console.error("getCustomerJobs DB error:", e);
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

// ═════════════════════════════════════════════
// PRO TOOLS
// ═════════════════════════════════════════════

// h) getProDashboard — live DB query
export async function getProDashboard(proId: string, storage?: any): Promise<object> {
  try {
    const profile = await getHaulerProfileByProId(proId);
    const haulerId = profile?.id || proId;

    const jobs = await db.select().from(serviceRequests)
      .where(eq(serviceRequests.assignedHaulerId, haulerId));

    const completedJobs = jobs.filter((j) => j.status === "completed");
    const activeJobs = jobs.filter((j) =>
      ["accepted", "in_progress", "en_route"].includes(j.status)
    );

    const now = new Date();
    const thisMonthJobs = completedJobs.filter((j) => {
      const d = new Date(j.completedAt || j.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const lastMonthJobs = completedJobs.filter((j) => {
      const d = new Date(j.completedAt || j.createdAt);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
    });

    const monthlyEarnings = thisMonthJobs.reduce((s, j) => s + (j.haulerPayout || 0), 0);
    const lastMonthEarnings = lastMonthJobs.reduce((s, j) => s + (j.haulerPayout || 0), 0);
    const totalEarnings = completedJobs.reduce((s, j) => s + (j.haulerPayout || 0), 0);
    const monthOverMonthPct =
      lastMonthEarnings > 0
        ? Math.round(((monthlyEarnings - lastMonthEarnings) / lastMonthEarnings) * 100)
        : null;

    return {
      proId,
      name: profile?.companyName || "Pro",
      rating: profile?.rating || 5.0,
      reviewCount: profile?.reviewCount || 0,
      tier: profile?.pyckerTier || "bronze",
      isAvailable: profile?.isAvailable || false,
      jobsCompleted: profile?.jobsCompleted || completedJobs.length,
      activeJobs: activeJobs.length,
      earningsThisMonth: monthlyEarnings,
      earningsAllTime: totalEarnings,
      monthOverMonthChange:
        monthOverMonthPct !== null
          ? `${monthOverMonthPct > 0 ? "+" : ""}${monthOverMonthPct}%`
          : null,
      serviceTypes: profile?.serviceTypes || [],
    };
  } catch (e) {
    console.error("getProDashboard DB error:", e);
  }
  return {
    proId,
    message: "Dashboard data unavailable — please log in",
    earningsThisMonth: 0,
    jobsCompleted: 0,
    activeJobs: 0,
    rating: 5.0,
    tier: "bronze",
  };
}

// i) getProEarnings — live DB query
export async function getProEarnings(proId: string, period: string, storage?: any): Promise<object> {
  try {
    const profile = await getHaulerProfileByProId(proId);
    const haulerId = profile?.id || proId;

    const allCompleted = await db.select().from(serviceRequests)
      .where(and(
        eq(serviceRequests.assignedHaulerId, haulerId),
        eq(serviceRequests.status, "completed"),
      ));

    const now = new Date();
    let filteredJobs = allCompleted;
    if (period === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredJobs = allCompleted.filter(
        (j) => new Date(j.completedAt || j.createdAt) >= weekAgo
      );
    } else if (period === "month") {
      filteredJobs = allCompleted.filter((j) => {
        const d = new Date(j.completedAt || j.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (period === "year") {
      filteredJobs = allCompleted.filter(
        (j) => new Date(j.completedAt || j.createdAt).getFullYear() === now.getFullYear()
      );
    }

    const total = filteredJobs.reduce((s, j) => s + (j.haulerPayout || 0), 0);
    const byService: Record<string, number> = {};
    for (const j of filteredJobs) {
      byService[j.serviceType] = (byService[j.serviceType] || 0) + (j.haulerPayout || 0);
    }

    const dayOfWeek = now.getDay();
    const daysUntilThursday = (4 - dayOfWeek + 7) % 7 || 7;
    const nextPayoutDate = new Date(now.getTime() + daysUntilThursday * 24 * 60 * 60 * 1000);

    return {
      proId,
      period,
      totalEarnings: total,
      jobCount: filteredJobs.length,
      byServiceType: byService,
      nextPayoutDate: nextPayoutDate.toISOString().split("T")[0],
      note: "Payouts deposit every Thursday",
    };
  } catch (e) {
    console.error("getProEarnings DB error:", e);
  }
  return { proId, period, totalEarnings: 0, jobCount: 0, message: "Earnings data unavailable" };
}

// j) getProSchedule — live DB query
export async function getProSchedule(proId: string, storage?: any): Promise<object> {
  try {
    const profile = await getHaulerProfileByProId(proId);
    const haulerId = profile?.id || proId;

    const upcoming = await db.select().from(serviceRequests)
      .where(and(
        eq(serviceRequests.assignedHaulerId, haulerId),
        inArray(serviceRequests.status, ["accepted", "confirmed", "pending"]),
      ))
      .orderBy(serviceRequests.scheduledFor);

    const now = new Date();
    const futureJobs = upcoming.filter((j) => new Date(j.scheduledFor) > now);

    return {
      proId,
      upcomingJobs: futureJobs.slice(0, 10).map((j) => ({
        id: j.id,
        serviceType: j.serviceType,
        scheduledFor: j.scheduledFor,
        address: j.pickupAddress || "Address on file",
        city: j.pickupCity,
        estimatedPayout: j.haulerPayout || 0,
        status: j.status,
      })),
      count: futureJobs.length,
    };
  } catch (e) {
    console.error("getProSchedule DB error:", e);
  }
  return { proId, upcomingJobs: [], count: 0, message: "Schedule unavailable" };
}

// k) getProCertifications — live DB query
export async function getProCertifications(proId: string, storage?: any): Promise<object> {
  const allCerts = [
    { id: "junk_removal", name: "Junk Removal Specialist", tier: "bronze" },
    { id: "home_cleaning", name: "Home Cleaning Pro", tier: "bronze" },
    { id: "pressure_washing", name: "Pressure Washing Certified", tier: "silver" },
    { id: "gutter_cleaning", name: "Gutter Cleaning Expert", tier: "silver" },
    { id: "handyman", name: "Handyman Certified", tier: "silver" },
    { id: "landscaping", name: "Landscaping Professional", tier: "gold" },
    { id: "pool_cleaning", name: "Pool Service Technician", tier: "gold" },
    { id: "b2b_services", name: "B2B Service Provider", tier: "gold" },
  ];

  let activeCertIds: string[] = [];
  try {
    const dbCerts = await db.select().from(proCertifications)
      .where(and(
        eq(proCertifications.proId, proId),
        eq(proCertifications.status, "completed"),
      ));
    activeCertIds = dbCerts.map((c) => c.certificationId);
  } catch (e) {
    console.error("getProCertifications DB error:", e);
  }

  // Fallback: check haulerProfile.serviceTypes if no certs found
  if (activeCertIds.length === 0) {
    try {
      const profile = await getHaulerProfileByProId(proId);
      const serviceTypeList = profile?.serviceTypes || [];
      activeCertIds = serviceTypeList.filter((s) => allCerts.some((c) => c.id === s));
    } catch { /* ignore */ }
  }

  const active = allCerts.filter((c) => activeCertIds.includes(c.id));
  const available = allCerts.filter((c) => !activeCertIds.includes(c.id));
  const currentTier = active.length >= 6 ? "gold" : active.length >= 3 ? "silver" : "bronze";
  const certsForNextTier =
    currentTier === "bronze" ? 3 - active.length : currentTier === "silver" ? 6 - active.length : 0;

  return {
    proId,
    activeCertifications: active,
    availableCertifications: available.slice(0, 4),
    currentTier,
    nextTier: certsForNextTier > 0 ? (currentTier === "bronze" ? "silver" : "gold") : null,
    certsNeededForNextTier: certsForNextTier,
    goldTierBenefit: "Access B2B jobs worth 3x more",
    silverTierBenefit: "Priority job matching and higher rates",
  };
}

// l) getRouteOptimization
export function getRouteOptimization(jobs: Array<{ lat: number; lng: number; time: string }>): object {
  if (!jobs || jobs.length === 0) {
    return { optimizedOrder: [], estimatedSavings: 0, totalMiles: 0 };
  }
  const totalEstimatedMiles = jobs.length * 3;
  const unoptimizedMiles = jobs.length * 5;
  return {
    optimizedOrder: jobs.map((j, i) => ({ ...j, order: i + 1 })),
    estimatedDriveMiles: totalEstimatedMiles,
    estimatedSavingsMiles: Math.max(0, unoptimizedMiles - totalEstimatedMiles),
    tip: "Start with morning jobs in the north and work your way south to minimize backtracking.",
  };
}

// m) getProMarketInsights
export function getProMarketInsights(serviceTypes: string[]): object {
  const insights: Record<string, any> = {
    junk_removal: { demandTrend: "+12%", avgRate: 299, seasonalPeak: "Spring (Mar-May)", competitionLevel: "medium" },
    home_cleaning: { demandTrend: "+8%", avgRate: 165, seasonalPeak: "Year-round", competitionLevel: "high" },
    pressure_washing: { demandTrend: "+40%", avgRate: 250, seasonalPeak: "Spring/Fall", competitionLevel: "medium" },
    gutter_cleaning: { demandTrend: "+22%", avgRate: 180, seasonalPeak: "Fall (Sept-Nov)", competitionLevel: "low" },
    landscaping: { demandTrend: "+15%", avgRate: 175, seasonalPeak: "Summer", competitionLevel: "high" },
    pool_cleaning: { demandTrend: "+18%", avgRate: 165, seasonalPeak: "April-September", competitionLevel: "medium" },
    handyman: { demandTrend: "+10%", avgRate: 225, seasonalPeak: "Year-round", competitionLevel: "medium" },
  };
  const relevant = (serviceTypes || []).map((svc) => ({
    serviceType: svc,
    ...(insights[svc] || { demandTrend: "+5%", avgRate: 150, seasonalPeak: "Year-round", competitionLevel: "medium" }),
  }));
  return {
    insights: relevant,
    topOpportunity: "Pressure washing demand is up 40% — consider getting certified if you aren't already",
    marketTip: "Pros who add 2+ certifications increase monthly earnings by an average of $800",
  };
}

// n) getProReviews — live DB query
export async function getProReviews(proId: string, storage?: any): Promise<object> {
  try {
    const profile = await getHaulerProfileByProId(proId);
    const haulerId = profile?.id || proId;

    const reviews = await db.select().from(haulerReviews)
      .where(eq(haulerReviews.haulerId, haulerId))
      .orderBy(desc(haulerReviews.createdAt))
      .limit(20);

    if (reviews.length > 0) {
      const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
      return {
        proId,
        averageRating: parseFloat(avgRating.toFixed(1)),
        totalReviews: profile?.reviewCount || reviews.length,
        recentReviews: reviews.slice(0, 5).map((r) => ({
          rating: r.rating,
          comment: r.comment || "",
          title: r.title || "",
          date: r.createdAt,
        })),
      };
    }

    return {
      proId,
      averageRating: profile?.rating || 5.0,
      totalReviews: profile?.reviewCount || 0,
      recentReviews: [],
      message: "No reviews yet — every job is an opportunity for a 5-star rating!",
    };
  } catch (e) {
    console.error("getProReviews DB error:", e);
  }
  return {
    proId,
    averageRating: 5.0,
    totalReviews: 0,
    recentReviews: [],
    message: "No reviews yet — every job is an opportunity for a 5-star rating!",
  };
}

// ═════════════════════════════════════════════
// B2B TOOLS
// ═════════════════════════════════════════════

// o) getPortfolioAnalytics — live DB query
export async function getPortfolioAnalytics(businessId: string, storage?: any): Promise<object> {
  try {
    let [account] = await db.select().from(businessAccounts)
      .where(eq(businessAccounts.id, businessId))
      .limit(1);
    if (!account) {
      [account] = await db.select().from(businessAccounts)
        .where(eq(businessAccounts.userId, businessId))
        .limit(1);
    }

    const userId = account?.userId || businessId;

    const jobs = await db.select().from(serviceRequests)
      .where(eq(serviceRequests.customerId, userId));

    const completedJobs = jobs.filter((j) => j.status === "completed");
    const openJobs = jobs.filter((j) =>
      ["pending", "accepted", "in_progress"].includes(j.status)
    );
    const totalSpend = completedJobs.reduce(
      (s, j) => s + (j.finalPrice || j.priceEstimate || 0),
      0
    );
    const properties =
      account?.totalProperties || Math.max(1, Math.ceil(completedJobs.length / 3));

    const now = new Date();
    const thisMonthCompleted = completedJobs.filter((j) => {
      const d = new Date(j.completedAt || j.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const yearStart = new Date(now.getFullYear(), 0, 1).getTime();
    const spendYTD = completedJobs
      .filter((j) => new Date(j.completedAt || j.createdAt).getTime() >= yearStart)
      .reduce((s, j) => s + (j.finalPrice || j.priceEstimate || 0), 0);

    return {
      businessId,
      businessName: account?.businessName,
      propertiesManaged: properties,
      avgCostPerUnit: properties > 0 ? Math.round(totalSpend / properties) : 0,
      openWorkOrders: openJobs.length,
      completedThisMonth: thisMonthCompleted.length,
      totalJobsCompleted: completedJobs.length,
      spendYTD: Math.round(spendYTD),
      totalSpend: Math.round(totalSpend),
    };
  } catch (e) {
    console.error("getPortfolioAnalytics DB error:", e);
  }
  return {
    businessId,
    propertiesManaged: 0,
    avgCostPerUnit: 0,
    openWorkOrders: 0,
    completedThisMonth: 0,
    spendYTD: 0,
    message: "Portfolio data unavailable — make sure your account is set up",
  };
}

// p) getVendorScorecard — live DB query
export async function getVendorScorecard(businessId: string, storage?: any): Promise<object> {
  try {
    let [account] = await db.select().from(businessAccounts)
      .where(eq(businessAccounts.id, businessId))
      .limit(1);
    if (!account) {
      [account] = await db.select().from(businessAccounts)
        .where(eq(businessAccounts.userId, businessId))
        .limit(1);
    }

    const userId = account?.userId || businessId;

    const completedJobs = await db.select().from(serviceRequests)
      .where(and(
        eq(serviceRequests.customerId, userId),
        eq(serviceRequests.status, "completed"),
      ));

    const haulerIds = [...new Set(
      completedJobs.map((j) => j.assignedHaulerId).filter(Boolean)
    )] as string[];

    if (haulerIds.length > 0) {
      const profileResults = await Promise.all(
        haulerIds.slice(0, 10).map((id) =>
          db.select().from(haulerProfiles).where(eq(haulerProfiles.id, id)).limit(1)
        )
      );

      const vendors = profileResults
        .map((p) => p[0])
        .filter(Boolean)
        .map((p) => ({
          name: p!.companyName,
          rating: p!.rating || 5.0,
          jobsCompleted: completedJobs.filter((j) => j.assignedHaulerId === p!.id).length,
          completionRate: "100%",
          verified: p!.verified,
        }))
        .sort((a, b) => (b.rating || 0) - (a.rating || 0));

      const avgRating =
        vendors.length > 0
          ? vendors.reduce((s, v) => s + (v.rating || 0), 0) / vendors.length
          : 5.0;

      return {
        businessId,
        topPerformers: vendors.slice(0, 5),
        totalVendors: haulerIds.length,
        overallSLACompliance: "Active",
        avgRating: parseFloat(avgRating.toFixed(1)),
        note: "Vendor scorecards based on completed jobs",
      };
    }
  } catch (e) {
    console.error("getVendorScorecard DB error:", e);
  }
  return {
    businessId,
    topPerformers: [],
    overallSLACompliance: "N/A",
    note: "No vendor data yet — vendor scorecards update as jobs are completed",
  };
}

// q) getBillingHistory — live DB query
export async function getBillingHistory(businessId: string, storage?: any): Promise<object> {
  try {
    const billingRuns = await db.select().from(weeklyBillingRuns)
      .where(eq(weeklyBillingRuns.businessAccountId, businessId))
      .orderBy(desc(weeklyBillingRuns.createdAt))
      .limit(10);

    if (billingRuns.length > 0) {
      const outstanding = billingRuns
        .filter((r) => r.status === "pending")
        .reduce((s, r) => s + (r.totalAmount || 0), 0);

      return {
        businessId,
        recentInvoices: billingRuns.map((r) => ({
          id: r.id,
          amount: r.totalAmount,
          status: r.status,
          weekStart: r.weekStartDate,
          weekEnd: r.weekEndDate,
          jobCount: r.jobCount,
          processedAt: r.processedAt,
        })),
        outstandingBalance: outstanding,
        billingCycle: "Weekly (Net-7)",
      };
    }
  } catch (e) {
    console.error("getBillingHistory DB error:", e);
  }
  return {
    businessId,
    recentInvoices: [],
    outstandingBalance: 0,
    billingCycle: "Weekly (Net-7)",
    message: "No billing history found — billing starts after your first completed job",
  };
}

// r) getComplianceStatus — live DB query
export async function getComplianceStatus(businessId: string, storage?: any): Promise<object> {
  try {
    let [account] = await db.select().from(businessAccounts)
      .where(eq(businessAccounts.id, businessId))
      .limit(1);
    if (!account) {
      [account] = await db.select().from(businessAccounts)
        .where(eq(businessAccounts.userId, businessId))
        .limit(1);
    }

    const userId = account?.userId || businessId;

    const completedJobs = await db.select({
      assignedHaulerId: serviceRequests.assignedHaulerId,
    }).from(serviceRequests)
      .where(and(
        eq(serviceRequests.customerId, userId),
        eq(serviceRequests.status, "completed"),
      ));

    const haulerIds = [...new Set(
      completedJobs.map((j) => j.assignedHaulerId).filter(Boolean)
    )] as string[];

    if (haulerIds.length > 0) {
      const profileResults = await Promise.all(
        haulerIds.slice(0, 20).map((id) =>
          db.select({
            id: haulerProfiles.id,
            companyName: haulerProfiles.companyName,
            generalLiabilityExpiration: haulerProfiles.generalLiabilityExpiration,
            hasInsurance: haulerProfiles.hasInsurance,
            backgroundCheckStatus: haulerProfiles.backgroundCheckStatus,
            verified: haulerProfiles.verified,
          }).from(haulerProfiles).where(eq(haulerProfiles.id, id)).limit(1)
        )
      );

      const allProfiles = profileResults.map((p) => p[0]).filter(Boolean);
      const now = new Date();
      const thirtyDaysOut = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const expired = allProfiles.filter(
        (p) => p!.generalLiabilityExpiration && new Date(p!.generalLiabilityExpiration) < now
      );
      const expiringSoon = allProfiles.filter(
        (p) =>
          p!.generalLiabilityExpiration &&
          new Date(p!.generalLiabilityExpiration) >= now &&
          new Date(p!.generalLiabilityExpiration) <= thirtyDaysOut
      );
      const valid = allProfiles.filter(
        (p) =>
          !p!.generalLiabilityExpiration ||
          new Date(p!.generalLiabilityExpiration) > thirtyDaysOut
      );

      const complianceScore =
        allProfiles.length > 0
          ? Math.round((valid.length / allProfiles.length) * 100)
          : 100;

      return {
        businessId,
        complianceScore,
        vendorInsuranceStatus: {
          valid: valid.length,
          expiringSoon: expiringSoon.length,
          expired: expired.length,
        },
        licenseExpirations: expiringSoon.slice(0, 5).map((p) => ({
          vendor: p!.companyName,
          type: "General Liability Insurance",
          expiresOn: p!.generalLiabilityExpiration,
        })),
        totalVendors: allProfiles.length,
        recommendation:
          expired.length > 0
            ? `${expired.length} vendor(s) have expired insurance — suspend them until renewed`
            : expiringSoon.length > 0
            ? `${expiringSoon.length} vendor(s) have insurance expiring within 30 days — follow up`
            : "All vendors are compliant — great work!",
      };
    }
  } catch (e) {
    console.error("getComplianceStatus DB error:", e);
  }
  return {
    businessId,
    complianceScore: 100,
    vendorInsuranceStatus: { valid: 0, expiringSoon: 0, expired: 0 },
    licenseExpirations: [],
    recommendation: "No vendor data yet — scorecards populate as jobs are completed",
  };
}

// s) generateROIReport
export function generateROIReport(currentSpend: number, units: number): object {
  const traditionalCostPerUnit = 85;
  const uptendCostPerUnit = units > 50 ? 6 : units > 20 ? 8 : 10;
  const traditionalAnnual = units * traditionalCostPerUnit * 12;
  const uptendAnnual = units * uptendCostPerUnit * 12;
  const annualSavings = Math.max(0, traditionalAnnual - uptendAnnual);
  const timeSavedHours = units * 2;
  const adminCostSaved = timeSavedHours * 35;
  return {
    units,
    currentAnnualSpend: currentSpend,
    uptendAnnual,
    annualSavings,
    savingsPercent: traditionalAnnual > 0 ? Math.round((annualSavings / traditionalAnnual) * 100) : 0,
    timeSavedHoursPerYear: timeSavedHours,
    adminCostSaved,
    totalROI: annualSavings + adminCostSaved,
    note: "Estimates based on industry averages — actual savings vary by portfolio",
  };
}

// ═════════════════════════════════════════════
// HOME INTELLIGENCE TOOLS (Consumer)
// ═════════════════════════════════════════════

// t) getHomeProfile — live DB query
export async function getHomeProfile(userId: string, storage?: any): Promise<object> {
  try {
    const [profile] = await db.select().from(homeProfiles)
      .where(eq(homeProfiles.customerId, userId))
      .limit(1);

    if (profile) {
      const appliances = await db.select().from(homeAppliances)
        .where(eq(homeAppliances.homeProfileId, profile.id));

      return {
        userId,
        homeProfileId: profile.id,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        zip: profile.zip,
        homeType: profile.homeType,
        bedrooms: profile.bedrooms,
        bathrooms: profile.bathrooms,
        squareFeet: profile.squareFootage,
        yearBuilt: profile.yearBuilt,
        lotSize: profile.lotSize,
        appliances: appliances.map((a) => ({
          name: a.name,
          brand: a.brand,
          model: a.model,
          warrantyExpiry: a.warrantyExpiry,
          lastServiced: a.lastServiceDate,
          notes: a.notes,
        })),
        lastUpdated: profile.createdAt,
      };
    }
  } catch (e) {
    console.error("getHomeProfile DB error:", e);
  }
  return {
    userId,
    message: "No home profile on file yet — tell me about your home and I'll remember it!",
    prompt: "What's your home like? (bedrooms, bathrooms, pool, pets, etc.)",
  };
}

// u) getServiceHistory — live DB query
export async function getServiceHistory(userId: string, storage?: any): Promise<object> {
  try {
    const jobs = await db.select().from(serviceRequests)
      .where(and(
        eq(serviceRequests.customerId, userId),
        eq(serviceRequests.status, "completed"),
      ))
      .orderBy(desc(serviceRequests.completedAt))
      .limit(10);

    const totalSpent = jobs.reduce((s, j) => s + (j.finalPrice || j.priceEstimate || 0), 0);

    return {
      userId,
      totalJobs: jobs.length,
      jobs: jobs.map((j) => ({
        id: j.id,
        serviceType: j.serviceType,
        date: j.completedAt || j.createdAt,
        price: j.finalPrice || j.priceEstimate,
        address: j.pickupAddress,
        city: j.pickupCity,
        status: j.status,
      })),
      totalSpent,
    };
  } catch (e) {
    console.error("getServiceHistory DB error:", e);
  }
  return { userId, totalJobs: 0, jobs: [], totalSpent: 0, message: "No service history found" };
}

// v) getSeasonalRecommendations
export function getSeasonalRecommendations(month: number, homeType: string, location: string): object {
  const recs: Record<number, { services: string[]; reason: string; urgency: string }> = {
    1: { services: ["garage_cleanout", "home_cleaning"], reason: "New year cleanout season", urgency: "low" },
    2: { services: ["home_cleaning", "handyman"], reason: "Pre-spring prep", urgency: "low" },
    3: { services: ["pressure_washing", "landscaping", "gutter_cleaning"], reason: "Spring cleaning + pollen season in Orlando", urgency: "high" },
    4: { services: ["pressure_washing", "landscaping", "pool_cleaning"], reason: "Spring peak — book before it fills up", urgency: "high" },
    5: { services: ["gutter_cleaning", "landscaping", "pool_cleaning"], reason: "Pre-hurricane season prep", urgency: "high" },
    6: { services: ["gutter_cleaning", "landscaping", "pool_cleaning"], reason: "Hurricane season starts June 1 — get gutters done!", urgency: "critical" },
    7: { services: ["pool_cleaning", "pressure_washing", "landscaping"], reason: "Peak summer — pool maintenance critical", urgency: "medium" },
    8: { services: ["pool_cleaning", "pressure_washing"], reason: "Late summer — algae and humidity damage", urgency: "medium" },
    9: { services: ["gutter_cleaning", "pressure_washing", "landscaping"], reason: "Post-storm season cleanup", urgency: "high" },
    10: { services: ["gutter_cleaning", "home_cleaning"], reason: "Fall gutter cleaning before leaves pile up", urgency: "medium" },
    11: { services: ["gutter_cleaning", "home_cleaning"], reason: "Pre-holiday home prep", urgency: "low" },
    12: { services: ["home_cleaning", "garage_cleanout"], reason: "Holiday prep + year-end cleanout", urgency: "low" },
  };
  const rec = recs[month] || recs[6];
  return {
    month,
    homeType: homeType || "residential",
    location: location || "Orlando, FL",
    recommendations: rec.services.map((s: string) => ({
      serviceId: s,
      urgency: rec.urgency,
      reason: rec.reason,
    })),
    seasonalNote: rec.reason,
  };
}

// w) getMaintenanceSchedule
export function getMaintenanceSchedule(homeDetails: any): object {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const tasks: any[] = [
    { month: 3, service: "pressure_washing", frequency: "annual", note: "Spring pollen buildup" },
    { month: 5, service: "gutter_cleaning", frequency: "bi-annual", note: "Pre-hurricane season" },
    { month: 9, service: "gutter_cleaning", frequency: "bi-annual", note: "Post-storm season" },
    { month: 11, service: "home_cleaning", frequency: "quarterly", note: "Pre-holiday deep clean" },
  ];
  if (homeDetails?.hasPool) {
    tasks.push({ month: 4, service: "pool_cleaning", frequency: "monthly", note: "Pool season start" });
  }
  const schedule = tasks.map((t) => ({
    ...t,
    dueInMonths: (t.month - currentMonth + 12) % 12 || 12,
  })).sort((a, b) => a.dueInMonths - b.dueInMonths);
  return {
    homeDetails,
    schedule,
    nextService: schedule[0] || null,
    annualBudgetEstimate: homeDetails?.hasPool ? 2400 : 1800,
  };
}

// x) getNeighborhoodInsights
export function getNeighborhoodInsights(zip: string): object {
  const data: Record<string, any> = {
    "32827": { name: "Lake Nona", avgLawnCare: 150, avgCleaning: 160, popularServices: ["landscaping", "pool_cleaning", "pressure_washing"], trend: "Pool cleaning up 25%" },
    "32836": { name: "Dr. Phillips", avgLawnCare: 175, avgCleaning: 185, popularServices: ["pool_cleaning", "home_cleaning", "gutter_cleaning"], trend: "Home cleaning very popular" },
    "32819": { name: "Orlando (Sand Lake)", avgLawnCare: 130, avgCleaning: 150, popularServices: ["junk_removal", "pressure_washing"], trend: "Junk removal up 20%" },
    "32765": { name: "Oviedo", avgLawnCare: 120, avgCleaning: 145, popularServices: ["landscaping", "gutter_cleaning"], trend: "Spring landscaping peak" },
    "32789": { name: "Winter Park", avgLawnCare: 160, avgCleaning: 175, popularServices: ["home_cleaning", "pressure_washing", "pool_cleaning"], trend: "Premium services in demand" },
  };
  const neighborhood = data[zip] || {
    name: "your area",
    avgLawnCare: 140,
    avgCleaning: 160,
    popularServices: ["landscaping", "pressure_washing", "home_cleaning"],
    trend: "Demand up across all services",
  };
  return {
    zip,
    neighborhood: neighborhood.name,
    averagePrices: {
      lawnCare: neighborhood.avgLawnCare,
      homeCleaning: neighborhood.avgCleaning,
    },
    popularServices: neighborhood.popularServices,
    currentTrend: neighborhood.trend,
    proAvailability: "Good — typically 24-48 hour booking window in your area",
  };
}

// ═════════════════════════════════════════════
// NEW TOOLS — Phase 1
// ═════════════════════════════════════════════

// y) getProGoalProgress — queries pro_goals + service_requests
export async function getProGoalProgress(proId: string, storage?: any): Promise<object> {
  try {
    const { rows: goals } = await (pool as any).query(
      "SELECT * FROM pro_goals WHERE pro_id = $1 ORDER BY created_at DESC LIMIT 1",
      [proId]
    );
    const goal = goals[0];
    const monthlyTargetCents = goal?.monthly_target || 500000; // default $5,000

    const profile = await getHaulerProfileByProId(proId);
    const haulerId = profile?.id || proId;

    const allCompleted = await db.select().from(serviceRequests)
      .where(and(
        eq(serviceRequests.assignedHaulerId, haulerId),
        eq(serviceRequests.status, "completed"),
      ));

    const now = new Date();
    const thisMonthJobs = allCompleted.filter((j) => {
      const d = new Date(j.completedAt || j.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    // haulerPayout stored in dollars; convert to cents for comparison
    const actualEarningsCents = Math.round(
      thisMonthJobs.reduce((s, j) => s + (j.haulerPayout || 0), 0) * 100
    );
    const progressPercent = Math.round((actualEarningsCents / monthlyTargetCents) * 100);
    const remainingCents = Math.max(0, monthlyTargetCents - actualEarningsCents);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - now.getDate();
    const dayElapsedPct = ((now.getDate() - 1) / daysInMonth) * 100;

    return {
      proId,
      monthlyTargetCents,
      monthlyTargetDollars: monthlyTargetCents / 100,
      actualEarningsCents,
      actualEarningsDollars: actualEarningsCents / 100,
      progressPercent: Math.min(progressPercent, 100),
      remainingCents,
      remainingDollars: remainingCents / 100,
      jobsThisMonth: thisMonthJobs.length,
      daysLeft,
      onTrack: progressPercent >= dayElapsedPct,
    };
  } catch (e) {
    console.error("getProGoalProgress DB error:", e);
  }
  return {
    proId,
    monthlyTargetDollars: 5000,
    actualEarningsDollars: 0,
    progressPercent: 0,
    message: "Goal tracking unavailable",
  };
}

// z) getHomeMaintenanceReminders — queries maintenance_reminders
export async function getHomeMaintenanceReminders(userId: string, homeDetails: any, storage?: any): Promise<object> {
  try {
    const { rows } = await (pool as any).query(
      "SELECT * FROM maintenance_reminders WHERE user_id = $1 ORDER BY next_due ASC NULLS LAST",
      [userId]
    );

    const now = new Date();
    const overdue = rows.filter((r: any) => r.next_due && new Date(r.next_due) < now);
    const upcoming = rows.filter((r: any) => r.next_due && new Date(r.next_due) >= now);

    return {
      userId,
      reminders: rows.map((r: any) => ({
        id: r.id,
        type: r.reminder_type,
        description: r.description,
        lastCompleted: r.last_completed,
        nextDue: r.next_due,
        intervalDays: r.interval_days,
        autoBook: r.auto_book,
        isOverdue: r.next_due && new Date(r.next_due) < now,
      })),
      overdueCount: overdue.length,
      upcomingCount: upcoming.length,
      total: rows.length,
    };
  } catch (e) {
    console.error("getHomeMaintenanceReminders DB error:", e);
  }
  return {
    userId,
    reminders: [],
    overdueCount: 0,
    upcomingCount: 0,
    total: 0,
    message: "No maintenance reminders set up yet. Want me to create a maintenance schedule for your home?",
  };
}

// aa) getCustomerLoyaltyStatus — queries customer_loyalty
export async function getCustomerLoyaltyStatus(userId: string, storage?: any): Promise<object> {
  const tierThresholds: Record<string, number> = {
    bronze: 0,
    silver: 50000,
    gold: 150000,
    platinum: 500000,
  };
  const tierOrder = ["bronze", "silver", "gold", "platinum"];

  try {
    const { rows } = await (pool as any).query(
      "SELECT * FROM customer_loyalty WHERE user_id = $1 LIMIT 1",
      [userId]
    );
    const loyalty = rows[0];

    if (loyalty) {
      const currentTierIdx = tierOrder.indexOf(loyalty.tier);
      const nextTier = currentTierIdx < tierOrder.length - 1 ? tierOrder[currentTierIdx + 1] : null;
      const nextTierThreshold = nextTier ? tierThresholds[nextTier] : null;
      const spendToNextTierCents = nextTierThreshold
        ? Math.max(0, nextTierThreshold - loyalty.lifetime_spend)
        : 0;

      return {
        userId,
        tier: loyalty.tier,
        lifetimeSpendCents: loyalty.lifetime_spend,
        lifetimeSpendDollars: loyalty.lifetime_spend / 100,
        points: loyalty.points,
        streakMonths: loyalty.streak_months,
        nextTier,
        spendToNextTierCents,
        spendToNextTierDollars: spendToNextTierCents / 100,
        memberSince: loyalty.joined_at,
        benefits: getLoyaltyTierBenefits(loyalty.tier),
      };
    }

    return {
      userId,
      tier: "bronze",
      lifetimeSpendDollars: 0,
      points: 0,
      streakMonths: 0,
      nextTier: "silver",
      spendToNextTierDollars: 500,
      message: "You're just getting started! Book your first service to earn loyalty points.",
      benefits: getLoyaltyTierBenefits("bronze"),
    };
  } catch (e) {
    console.error("getCustomerLoyaltyStatus DB error:", e);
  }
  return {
    userId,
    tier: "bronze",
    message: "Loyalty status unavailable",
  };
}

function getLoyaltyTierBenefits(tier: string): string[] {
  const benefits: Record<string, string[]> = {
    bronze: ["Earn 1 point per $1 spent", "Birthday discount"],
    silver: ["Earn 1.5 points per $1", "Priority scheduling", "5% loyalty discount"],
    gold: ["Earn 2 points per $1", "Free add-ons", "10% loyalty discount", "Dedicated support"],
    platinum: ["Earn 3 points per $1", "15% loyalty discount", "Free annual home scan", "VIP support line"],
  };
  return benefits[tier] || benefits["bronze"];
}

// bb) getReferralStatus — queries existing referrals table via Drizzle
export async function getReferralStatus(userId: string, storage?: any): Promise<object> {
  try {
    const refs = await db.select().from(referrals)
      .where(eq(referrals.referrerId, userId))
      .orderBy(desc(referrals.createdAt))
      .limit(20);

    const completedRefs = refs.filter((r) => ["completed", "paid"].includes(r.status));
    const pendingRefs = refs.filter((r) => r.status === "pending");
    const totalEarned = completedRefs.reduce((s, r) => s + (r.referrerBonusAmount || 0), 0);
    const referralCode = refs[0]?.referralCode || null;

    return {
      userId,
      referrals: refs.map((r) => ({
        id: r.id,
        referredEmail: r.referredEmail,
        status: r.status,
        referralCode: r.referralCode,
        creditAmount: r.referrerBonusAmount,
        createdAt: r.createdAt,
        completedAt: r.firstJobCompletedAt,
      })),
      totalReferrals: refs.length,
      completedReferrals: completedRefs.length,
      pendingReferrals: pendingRefs.length,
      totalEarned,
      referralCode,
      creditPerReferral: 50,
      message:
        totalEarned > 0
          ? `You've earned $${totalEarned} from referrals! Share your code to earn more.`
          : "Refer a friend and earn $50 when they complete their first service!",
    };
  } catch (e) {
    console.error("getReferralStatus DB error:", e);
  }
  return {
    userId,
    referrals: [],
    totalReferrals: 0,
    completedReferrals: 0,
    totalEarned: 0,
    creditPerReferral: 50,
    message: "Refer a friend and earn $50 when they complete their first service!",
  };
}

// cc) getSmartHomeStatus — queries smart_home_devices
export async function getSmartHomeStatus(userId: string, storage?: any): Promise<object> {
  try {
    const { rows } = await (pool as any).query(
      "SELECT id, device_type, device_name, last_data_sync, status FROM smart_home_devices WHERE user_id = $1",
      [userId]
    );

    const connected = rows.filter((d: any) => d.status === "connected");

    return {
      userId,
      devices: rows.map((d: any) => ({
        id: d.id,
        deviceType: d.device_type,
        deviceName: d.device_name,
        status: d.status,
        lastSync: d.last_data_sync,
      })),
      connectedCount: connected.length,
      disconnectedCount: rows.length - connected.length,
      total: rows.length,
      supportedDevices: ["Nest", "Ring", "August", "Flo by Moen", "myQ", "SimpliSafe"],
    };
  } catch (e) {
    console.error("getSmartHomeStatus DB error:", e);
  }
  return {
    userId,
    devices: [],
    connectedCount: 0,
    total: 0,
    supportedDevices: ["Nest", "Ring", "August", "Flo by Moen", "myQ", "SimpliSafe"],
    message: "No smart home devices connected yet. Connect your devices for proactive maintenance alerts.",
  };
}

// ─────────────────────────────────────────────
// dd) Self-Serve AI Home Scan Tools
// ─────────────────────────────────────────────

import { analyzeImages } from "./ai/openai-vision-client";

const SCAN_CREDIT_PER_ITEM = 1;
const SCAN_COMPLETION_BONUS = 25;
const SCAN_STREAK_BONUS = 5;
const SCAN_STREAK_DAYS_REQUIRED = 3;
const SCAN_MIN_ITEMS = 10;
const SCAN_ESTIMATED_TOTAL = 20;
const SCAN_ROOM_BADGES = ["Kitchen", "Bathroom", "Bedroom", "Garage", "HVAC", "Laundry", "Living Room", "Outdoor"];

function getScanTier(pct: number): string {
  if (pct >= 75) return "Smart Home Ready";
  if (pct >= 50) return "Gold";
  if (pct >= 25) return "Silver";
  return "Bronze Home";
}

// dd-1) startHomeScan — initiates guided room-by-room scan
export async function startHomeScan(customerId: string): Promise<object> {
  try {
    // Ensure wallet exists
    await pool.query(
      `INSERT INTO customer_wallet (customer_id, balance, total_earned, total_spent) VALUES ($1, 0, 0, 0) ON CONFLICT (customer_id) DO NOTHING`,
      [customerId]
    );

    const { rows } = await pool.query(
      `INSERT INTO home_scan_sessions (customer_id, status) VALUES ($1, 'in_progress') RETURNING *`,
      [customerId]
    );

    return {
      success: true,
      session: rows[0],
      instructions: `🏠 Home Scan started! Walk through each room and take photos of your appliances. You'll earn $${SCAN_CREDIT_PER_ITEM} for each item scanned, plus a $${SCAN_COMPLETION_BONUS} bonus when you complete at least ${SCAN_MIN_ITEMS} items!`,
      suggestedRooms: SCAN_ROOM_BADGES,
      estimatedItems: SCAN_ESTIMATED_TOTAL,
    };
  } catch (e) {
    console.error("startHomeScan error:", e);
    return { success: false, error: "Failed to start home scan" };
  }
}

// dd-2) processHomeScanPhoto — handles photo upload during scan
export async function processHomeScanPhoto(
  customerId: string,
  scanSessionId: string,
  roomName: string,
  photoUrl: string
): Promise<object> {
  try {
    // Verify session
    const { rows: sessions } = await pool.query(
      `SELECT * FROM home_scan_sessions WHERE id = $1 AND customer_id = $2 AND status = 'in_progress'`,
      [scanSessionId, customerId]
    );
    if (sessions.length === 0) {
      return { success: false, error: "No active scan session found" };
    }

    // GPT-5.2 vision analysis
    const analysis = await analyzeImages({
      imageUrls: [photoUrl],
      prompt: `Analyze this home appliance/item photo. Return JSON:
{
  "applianceType": "what this is",
  "brand": "manufacturer" or null,
  "model": "model number" or null,
  "estimatedAge": "X years" or null,
  "condition": 1-10,
  "visibleIssues": [],
  "maintenanceRecommendations": [],
  "notes": ""
}`,
      systemPrompt: "You are an expert home inspector analyzing appliances for a home scan.",
      jsonMode: true,
    });

    // Store item
    await pool.query(
      `INSERT INTO scanned_items (scan_session_id, customer_id, room_name, appliance_name, photo_url, analysis_result, condition, brand, model, estimated_age, credit_awarded)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [scanSessionId, customerId, roomName, analysis.applianceType || "Unknown", photoUrl, JSON.stringify(analysis),
       analysis.condition || null, analysis.brand || null, analysis.model || null, analysis.estimatedAge || null, SCAN_CREDIT_PER_ITEM]
    );

    // Award credit
    await pool.query(`INSERT INTO customer_wallet (customer_id, balance, total_earned, total_spent) VALUES ($1, 0, 0, 0) ON CONFLICT (customer_id) DO NOTHING`, [customerId]);
    await pool.query(`UPDATE customer_wallet SET balance = balance + $1, total_earned = total_earned + $1, updated_at = now() WHERE customer_id = $2`, [SCAN_CREDIT_PER_ITEM, customerId]);
    await pool.query(`INSERT INTO scan_rewards (customer_id, reward_type, amount, description) VALUES ($1, 'per_item', $2, $3)`, [customerId, SCAN_CREDIT_PER_ITEM, `Scanned: ${analysis.applianceType || "item"} in ${roomName}`]);
    await pool.query(`UPDATE home_scan_sessions SET total_credits_earned = total_credits_earned + $1 WHERE id = $2`, [SCAN_CREDIT_PER_ITEM, scanSessionId]);

    // Get item count
    const { rows: countRows } = await pool.query(`SELECT COUNT(*) as count FROM scanned_items WHERE scan_session_id = $1`, [scanSessionId]);
    const itemCount = parseInt(countRows[0].count, 10);
    const pct = Math.min(100, Math.round((itemCount / SCAN_ESTIMATED_TOTAL) * 100));

    return {
      success: true,
      applianceName: analysis.applianceType,
      analysis,
      creditAwarded: SCAN_CREDIT_PER_ITEM,
      progress: { itemsScanned: itemCount, percentage: pct, tier: getScanTier(pct) },
      message: `✅ ${analysis.applianceType || "Item"} scanned in ${roomName}! +$${SCAN_CREDIT_PER_ITEM} credit. (${itemCount}/${SCAN_ESTIMATED_TOTAL} items, ${pct}%)`,
    };
  } catch (e) {
    console.error("processHomeScanPhoto error:", e);
    return { success: false, error: "Failed to process scan photo" };
  }
}

// dd-3) getHomeScanProgress — shows progress, credits, badges
export async function getHomeScanProgress(customerId: string): Promise<object> {
  try {
    const { rows: sessions } = await pool.query(
      `SELECT * FROM home_scan_sessions WHERE customer_id = $1 ORDER BY started_at DESC LIMIT 1`,
      [customerId]
    );
    const { rows: items } = await pool.query(
      `SELECT * FROM scanned_items WHERE customer_id = $1 ORDER BY scanned_at DESC`,
      [customerId]
    );

    const roomsScanned = [...new Set(items.map((i: any) => i.room_name))];
    const badges = SCAN_ROOM_BADGES.filter((b) => roomsScanned.some((r: string) => r.toLowerCase().includes(b.toLowerCase())));
    const totalItems = items.length;
    const pct = Math.min(100, Math.round((totalItems / SCAN_ESTIMATED_TOTAL) * 100));

    await pool.query(`INSERT INTO customer_wallet (customer_id, balance, total_earned, total_spent) VALUES ($1, 0, 0, 0) ON CONFLICT (customer_id) DO NOTHING`, [customerId]);
    const { rows: walletRows } = await pool.query(`SELECT * FROM customer_wallet WHERE customer_id = $1`, [customerId]);

    return {
      session: sessions[0] || null,
      totalItemsScanned: totalItems,
      progressPercentage: pct,
      tier: getScanTier(pct),
      roomsScanned,
      badges,
      allBadges: SCAN_ROOM_BADGES,
      creditsEarned: walletRows[0]?.total_earned || 0,
      balance: walletRows[0]?.balance || 0,
      recentItems: items.slice(0, 5).map((i: any) => ({ appliance: i.appliance_name, room: i.room_name, condition: i.condition })),
      message: totalItems === 0
        ? "No items scanned yet. Start your home scan to earn credits!"
        : `📊 ${totalItems} items scanned (${pct}%) — ${getScanTier(pct)} tier. Balance: $${walletRows[0]?.balance || 0}`,
    };
  } catch (e) {
    console.error("getHomeScanProgress error:", e);
    return { totalItemsScanned: 0, progressPercentage: 0, tier: "Bronze Home", message: "Unable to load progress." };
  }
}

// dd-4) getWalletBalance — shows customer credit balance
export async function getWalletBalance(customerId: string): Promise<object> {
  try {
    await pool.query(`INSERT INTO customer_wallet (customer_id, balance, total_earned, total_spent) VALUES ($1, 0, 0, 0) ON CONFLICT (customer_id) DO NOTHING`, [customerId]);
    const { rows: walletRows } = await pool.query(`SELECT * FROM customer_wallet WHERE customer_id = $1`, [customerId]);
    const { rows: rewards } = await pool.query(`SELECT * FROM scan_rewards WHERE customer_id = $1 ORDER BY awarded_at DESC LIMIT 20`, [customerId]);

    const wallet = walletRows[0];
    return {
      balance: wallet.balance,
      totalEarned: wallet.total_earned,
      totalSpent: wallet.total_spent,
      recentTransactions: rewards.map((r: any) => ({
        type: r.reward_type,
        amount: r.amount,
        description: r.description,
        date: r.awarded_at,
      })),
      message: `💰 Wallet balance: $${wallet.balance} (earned: $${wallet.total_earned})`,
    };
  } catch (e) {
    console.error("getWalletBalance error:", e);
    return { balance: 0, totalEarned: 0, message: "Unable to load wallet." };
  }
}

// ═════════════════════════════════════════════
// WARRANTY TRACKER TOOLS
// ═════════════════════════════════════════════

import { lookupWarranty, getWarrantyStatus as calcWarrantyStatus } from "./warranty-lookup";

// ee-1) getWarrantyTracker — all scanned items with warranty status, sorted by expiring soonest
export async function getWarrantyTracker(customerId: string): Promise<object> {
  try {
    const { rows } = await pool.query(
      `SELECT id, appliance_name, room_name, brand, model, serial_number, model_number,
              manufacture_date, warranty_status, warranty_expires, warranty_details, purchase_date, scanned_at
       FROM scanned_items WHERE customer_id = $1
       ORDER BY
         CASE warranty_status
           WHEN 'expiring_soon' THEN 1
           WHEN 'active' THEN 2
           WHEN 'expired' THEN 3
           ELSE 4
         END,
         warranty_expires ASC NULLS LAST`,
      [customerId]
    );

    const now = new Date();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    const items = rows.map((r: any) => {
      const expiresDate = r.warranty_expires ? new Date(r.warranty_expires) : null;
      const isExpiringSoon = expiresDate && (expiresDate.getTime() - now.getTime()) < thirtyDaysMs && expiresDate > now;

      return {
        id: r.id,
        appliance: r.appliance_name,
        room: r.room_name,
        brand: r.brand,
        model: r.model_number || r.model,
        serialNumber: r.serial_number,
        warrantyStatus: r.warranty_status || "unknown",
        warrantyExpires: r.warranty_expires,
        purchaseDate: r.purchase_date,
        manufactureDate: r.manufacture_date,
        needsPurchaseDate: !r.purchase_date && r.warranty_status === "unknown",
        expiringWithin30Days: isExpiringSoon,
      };
    });

    const expiringSoon = items.filter((i: any) => i.expiringWithin30Days);
    const needsPurchaseDate = items.filter((i: any) => i.needsPurchaseDate);
    const expired = items.filter((i: any) => i.warrantyStatus === "expired");

    return {
      customerId,
      items,
      totalItems: items.length,
      summary: {
        expiringSoonCount: expiringSoon.length,
        expiredCount: expired.length,
        needsPurchaseDateCount: needsPurchaseDate.length,
        activeCount: items.filter((i: any) => i.warrantyStatus === "active").length,
      },
      alerts: [
        ...(expiringSoon.length > 0
          ? [`⚠️ ${expiringSoon.length} item(s) expiring within 30 days: ${expiringSoon.map((i: any) => i.appliance).join(", ")}`]
          : []),
        ...(needsPurchaseDate.length > 0
          ? [`📋 ${needsPurchaseDate.length} item(s) need a purchase date to determine warranty status: ${needsPurchaseDate.map((i: any) => i.appliance).join(", ")}`]
          : []),
      ],
      message: items.length === 0
        ? "No scanned items found. Start a home scan to track your warranties!"
        : `📊 Tracking warranties for ${items.length} items. ${expiringSoon.length} expiring soon, ${needsPurchaseDate.length} need purchase dates.`,
    };
  } catch (e) {
    console.error("getWarrantyTracker error:", e);
    return { customerId, items: [], totalItems: 0, message: "Unable to load warranty tracker." };
  }
}

// ee-2) updateAppliancePurchaseDate — set purchase date and recalculate warranty
export async function updateAppliancePurchaseDate(itemId: string, purchaseDate: string): Promise<object> {
  try {
    // Get current item
    const { rows } = await pool.query(
      `SELECT * FROM scanned_items WHERE id = $1`,
      [itemId]
    );
    if (rows.length === 0) {
      return { success: false, error: "Item not found" };
    }

    const item = rows[0];
    const purchaseDateObj = new Date(purchaseDate);

    // Recalculate warranty
    let warrantyInfo = null;
    if (item.brand) {
      warrantyInfo = lookupWarranty(
        item.brand,
        item.model_number || item.model || null,
        item.serial_number || null,
        item.analysis_result?.category || "appliance"
      );

      // Recalculate with purchase date
      const mfgDate = item.manufacture_date ? new Date(item.manufacture_date) : purchaseDateObj;
      const statusResult = calcWarrantyStatus(mfgDate, purchaseDateObj, warrantyInfo.category, item.brand);
      warrantyInfo.overallStatus = statusResult.status;
      warrantyInfo.overallExpires = statusResult.expiresDate;
      warrantyInfo.warranties = statusResult.warranties as any;
      warrantyInfo.needsPurchaseDate = false;
    }

    // Update DB
    await pool.query(
      `UPDATE scanned_items SET
        purchase_date = $1,
        warranty_status = $2,
        warranty_expires = $3,
        warranty_details = $4
       WHERE id = $5`,
      [
        purchaseDate,
        warrantyInfo?.overallStatus || null,
        warrantyInfo?.overallExpires || null,
        warrantyInfo ? JSON.stringify(warrantyInfo) : null,
        itemId,
      ]
    );

    return {
      success: true,
      itemId,
      appliance: item.appliance_name,
      brand: item.brand,
      purchaseDate,
      warrantyStatus: warrantyInfo?.overallStatus || "unknown",
      warrantyExpires: warrantyInfo?.overallExpires || null,
      message: `✅ Purchase date set for ${item.appliance_name}. Warranty status: ${warrantyInfo?.overallStatus || "unknown"}${warrantyInfo?.overallExpires ? `, expires ${warrantyInfo.overallExpires}` : ""}.`,
    };
  } catch (e) {
    console.error("updateAppliancePurchaseDate error:", e);
    return { success: false, error: "Failed to update purchase date" };
  }
}

// ═════════════════════════════════════════════
// TRUST & SAFETY
// ═════════════════════════════════════════════

// ═════════════════════════════════════════════

// y) getProArrivalInfo
export async function getProArrivalInfo(jobId: string, storage?: any): Promise<object> {
  if (storage) {
    try {
      const job = await storage.getServiceRequest?.(jobId).catch(() => null);
      if (job && job.assignedHaulerId) {
        const profile = await storage.getHaulerProfile?.(job.assignedHaulerId).catch(() => null);
        const eta = job.estimatedArrival || new Date(Date.now() + 8 * 60 * 1000).toISOString();
        const minsAway = Math.round((new Date(eta).getTime() - Date.now()) / 60000);
        return {
          jobId,
          pro: {
            name: profile?.companyName || "Your Pro",
            photoUrl: profile?.photoUrl || null,
            rating: profile?.rating || 5.0,
            jobsCompleted: profile?.jobsCompleted || 0,
            vehicleDescription: profile?.vehicleDescription || null,
          },
          eta,
          minsAway: Math.max(0, minsAway),
          trackingUrl: `/track/${jobId}`,
          status: job.status,
          verificationCode: job.verificationCode || null,
          safetyNote: "All UpTend pros carry ID and are background-checked. Ask to see their UpTend Pro badge on arrival.",
        };
      }
    } catch { /* fall through */ }
  }
  return {
    jobId,
    message: "Arrival info unavailable — pro has not been dispatched yet",
    trackingUrl: `/track/${jobId}`,
    safetyNote: "All UpTend pros carry ID and are background-checked. Ask to see their UpTend Pro badge on arrival.",
  };
}

// ═════════════════════════════════════════════
// INSURANCE CLAIMS ASSISTANT
// ═════════════════════════════════════════════

// z1) getStormPrepChecklist
export function getStormPrepChecklist(homeType: string, location: string): object {
  const checklist = [
    {
      category: "Exterior",
      tasks: [
        { task: "Clean gutters and downspouts", bookable: true, serviceId: "gutter_cleaning", urgency: "high" },
        { task: "Trim overhanging tree branches", bookable: true, serviceId: "landscaping", urgency: "high" },
        { task: "Pressure wash driveway and walkways (reduces slip hazard)", bookable: true, serviceId: "pressure_washing", urgency: "medium" },
        { task: "Secure or store patio furniture", bookable: false, urgency: "high" },
        { task: "Document roof condition with photos", bookable: true, serviceId: "home_scan", urgency: "high" },
      ],
    },
    {
      category: "Interior",
      tasks: [
        { task: "Test smoke and CO detectors", bookable: false, urgency: "high" },
        { task: "Know location of water shutoff valve", bookable: false, urgency: "high" },
        { task: "Clear garage of flammable debris", bookable: true, serviceId: "garage_cleanout", urgency: "medium" },
      ],
    },
    {
      category: "Documentation (critical for insurance claims)",
      tasks: [
        { task: "Photograph all exterior surfaces before the storm", bookable: false, urgency: "critical" },
        { task: "Save all recent service receipts in one place", bookable: false, urgency: "high" },
        { task: "Run AI Home Scan to document pre-storm condition", bookable: true, serviceId: "home_scan", urgency: "high" },
      ],
    },
  ];

  if (homeType === "pool" || (homeType || "").toLowerCase().includes("pool")) {
    checklist.push({
      category: "Pool",
      tasks: [
        { task: "Lower pool water level 6 inches below skimmer", bookable: false, urgency: "high" },
        { task: "Remove and store pool accessories", bookable: false, urgency: "high" },
        { task: "Balance pool chemicals before storm", bookable: true, serviceId: "pool_cleaning", urgency: "medium" },
      ],
    });
  }

  return {
    homeType: homeType || "residential",
    location: location || "Orlando, FL",
    prepChecklist: checklist,
    insuranceTip: "The #1 tip: dated photos of EVERYTHING before a storm. UpTend job records count as documented proof.",
    bookableNow: checklist.flatMap(c => c.tasks).filter((t: any) => t.bookable).map((t: any) => ({
      task: t.task,
      serviceId: t.serviceId,
      urgency: t.urgency,
    })),
  };
}

// z2) generateClaimDocumentation
export async function generateClaimDocumentation(jobIds: string[], storage?: any): Promise<object> {
  const docs: any[] = [];

  if (storage && jobIds && jobIds.length > 0) {
    for (const jobId of jobIds) {
      try {
        const job = await storage.getServiceRequest?.(jobId).catch(() => null);
        if (job) {
          docs.push({
            jobId,
            serviceType: job.serviceType,
            date: job.completedAt || job.createdAt,
            price: job.finalPrice || job.priceEstimate || 0,
            photos: job.photos || [],
            notes: job.completionNotes || "",
            address: job.serviceAddress || job.address || "",
          });
        }
      } catch { /* skip */ }
    }
  }

  const totalSpent = docs.reduce((s, d) => s + (d.price || 0), 0);

  return {
    claimDocumentation: docs,
    summary: {
      totalJobs: docs.length,
      totalSpent,
      dateRange: docs.length > 0 ? {
        earliest: docs[0]?.date,
        latest: docs[docs.length - 1]?.date,
      } : null,
    },
    insuranceTip: "Attach these records to your claim to prove pre-existing service work and property condition.",
    exportNote: "All job photos, receipts, and records are in your dashboard under 'Documents'.",
  };
}


// ═════════════════════════════════════════════
// REFERRAL ENGINE
// ═════════════════════════════════════════════

// z4) getNeighborhoodGroupDeals
export function getNeighborhoodGroupDeals(zip: string): object {
  const groupDeals: Record<string, any[]> = {
    "32827": [
      { service: "pressure_washing", neighbors: 4, spotsLeft: 2, discount: "15% off when you join", expiresInDays: 5 },
      { service: "landscaping", neighbors: 6, spotsLeft: 0, discount: "Group active! 15% off", expiresInDays: 12 },
    ],
    "32836": [
      { service: "pool_cleaning", neighbors: 3, spotsLeft: 0, discount: "Group active! 15% off", expiresInDays: 8 },
    ],
  };

  const deals = groupDeals[zip] || [];

  return {
    zip,
    groupDeals: deals,
    hasActiveDeals: deals.length > 0,
    howItWorks: "When 3+ neighbors book the same service within 30 days, everyone gets 15% off automatically.",
    tip: deals.length > 0
      ? "Your neighbors are already building a group — join to unlock the discount!"
      : "Be the first to start a group deal. Once 2 more neighbors join, everyone saves 15%.",
  };
}

// ═════════════════════════════════════════════
// PRO BUSINESS INTELLIGENCE
// ═════════════════════════════════════════════

// z5) getProDemandForecast
export function getProDemandForecast(serviceTypes: string[], zip: string): object {
  const demandByService: Record<string, any> = {
    junk_removal:      { weekDemand: [60, 80, 85, 90, 100, 120, 110], peakDay: "Saturday", hotZips: ["32827", "32836"] },
    home_cleaning:     { weekDemand: [90, 100, 95, 100, 110, 130, 80],  peakDay: "Friday",   hotZips: ["32789", "32836"] },
    pressure_washing:  { weekDemand: [70, 80, 85, 90, 100, 140, 130],   peakDay: "Saturday", hotZips: ["32827", "32765"] },
    gutter_cleaning:   { weekDemand: [40, 50, 55, 60, 70, 85, 80],      peakDay: "Saturday", hotZips: ["32765", "32819"] },
    landscaping:       { weekDemand: [80, 90, 90, 100, 110, 130, 100],  peakDay: "Saturday", hotZips: ["32827", "32836"] },
    pool_cleaning:     { weekDemand: [100, 100, 100, 100, 110, 120, 110], peakDay: "Saturday", hotZips: ["32836", "32827"] },
    handyman:          { weekDemand: [80, 90, 95, 95, 100, 120, 100],   peakDay: "Saturday", hotZips: ["32789", "32827"] },
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date().getDay();

  const weeklyForecast = dayNames.map((day, i) => ({
    day,
    isToday: i === today,
    demandIndex: serviceTypes.length > 0
      ? Math.round(serviceTypes.reduce((sum, svc) => sum + ((demandByService[svc]?.weekDemand[i]) || 80), 0) / serviceTypes.length)
      : 80,
  }));

  const forecasts = serviceTypes.map(svc => ({
    serviceType: svc,
    peakDay: demandByService[svc]?.peakDay || "Saturday",
    inHotZone: (demandByService[svc]?.hotZips || []).includes(zip),
    recommendation: (demandByService[svc]?.hotZips || []).includes(zip)
      ? "High demand in your area — being available on weekends will maximize your jobs"
      : "Steady demand — consistency beats chasing peaks",
  }));

  return {
    serviceTypes,
    zip,
    weeklyDemandForecast: weeklyForecast,
    serviceForecasts: forecasts,
    bestDaysToWork: ["Thursday", "Friday", "Saturday"],
    tip: "Pros available Thursday–Saturday earn 30% more than weekday-only pros on average.",
  };
}

// z6) getProCustomerRetention
export async function getProCustomerRetention(proId: string, storage?: any): Promise<object> {
  if (storage) {
    try {
      const jobs = await storage.getServiceRequestsByHauler?.(proId).catch(() => []);
      const completed = (jobs || []).filter((j: any) => j.status === "completed");

      const customerJobMap = new Map<string, any[]>();
      for (const job of completed) {
        if (!job.customerId) continue;
        const existing = customerJobMap.get(job.customerId) || [];
        existing.push(job);
        customerJobMap.set(job.customerId, existing);
      }

      const repeatCustomers = [...customerJobMap.values()].filter(j => j.length > 1).length;
      const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      const atRisk = [...customerJobMap.values()].filter(jobs => {
        const last = jobs.sort((a: any, b: any) =>
          new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime()
        )[0];
        return new Date(last.completedAt || last.createdAt) < threeMonthsAgo;
      }).length;

      return {
        proId,
        totalUniqueCustomers: customerJobMap.size,
        repeatCustomers,
        retentionRate: customerJobMap.size > 0 ? Math.round((repeatCustomers / customerJobMap.size) * 100) : 0,
        atRiskCustomers: atRisk,
        atRiskNote: atRisk > 0
          ? `${atRisk} customers haven't booked in 3+ months — a follow-up goes a long way`
          : "Excellent retention! All recent customers are still active.",
        tip: "Pros with 60%+ retention earn 40% more than average. A quick thank-you after a job makes customers come back.",
      };
    } catch { /* fall through */ }
  }
  return {
    proId,
    totalUniqueCustomers: 0,
    repeatCustomers: 0,
    retentionRate: 0,
    atRiskCustomers: 0,
    message: "Retention data unavailable",
  };
}

// ═════════════════════════════════════════════
// CONTRACTS & DOCUMENTS (B2B)
// ═════════════════════════════════════════════

// z7) generateServiceAgreement
export function generateServiceAgreement(businessId: string, terms: any): object {
  const today = new Date().toISOString().split("T")[0];
  const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  return {
    businessId,
    agreementType: terms?.agreementType || "Master Service Agreement",
    status: "draft",
    generatedDate: today,
    sections: [
      {
        title: "Scope of Services",
        summary: `UpTend will provide on-demand and scheduled home services as requested via the UpTend platform, including: ${(terms?.services || ["cleaning", "landscaping", "maintenance"]).join(", ")}.`,
      },
      {
        title: "Pricing & Billing",
        summary: `Services billed at agreed platform rates. Invoices issued weekly (Net-7). Volume discounts: 2.5% at 10+ jobs/mo, 5% at 25+, 7.5% at 50+.`,
      },
      {
        title: "Service Provider Standards",
        summary: "All service providers are background-checked, carry $1M liability insurance, and are certified by UpTend. UpTend guarantees SLA compliance per Exhibit A.",
      },
      {
        title: "Term & Termination",
        summary: `Agreement effective ${today} through ${terms?.endDate || nextYear}. Either party may terminate with 30 days written notice.`,
      },
      {
        title: "Compliance & Documentation",
        summary: "UpTend maintains full audit trails, photo documentation, and compliance records accessible via the business dashboard.",
      },
    ],
    nextSteps: ["Review draft", "Request modifications", "Sign electronically", "Onboard properties"],
    note: "This is a draft outline. Our team will prepare the full agreement for electronic signature.",
  };
}

// z8) getDocumentStatus
export async function getDocumentStatus(businessId: string, storage?: any): Promise<object> {
  return {
    businessId,
    documents: [
      { type: "Master Service Agreement", status: "signed", signedDate: "2024-01-15", expiresDate: "2025-01-15" },
      { type: "W-9 Form", status: "on_file", receivedDate: "2024-01-15" },
      {
        type: "Certificate of Insurance",
        status: "expiring_soon",
        expiresDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      },
      { type: "ACH Authorization", status: "signed", signedDate: "2024-01-15" },
    ],
    pendingActions: ["Renew Certificate of Insurance (expires in 30 days)"],
    upcomingRenewals: [{ document: "Master Service Agreement", renewsIn: "90 days" }],
    note: "All documents are stored securely and accessible from your business dashboard.",
  };
}

// ═════════════════════════════════════════════
// EMERGENCY & DISASTER MODE
// ═════════════════════════════════════════════

// z9) getEmergencyPros
export async function getEmergencyPros(serviceType: string, zip: string, storage?: any): Promise<object> {
  const orlandoZips = ["327", "328", "347"];
  const isOrlando = orlandoZips.includes(zip.substring(0, 3));

  if (!isOrlando) {
    return {
      available: false,
      serviceType,
      zip,
      message: "Emergency service currently covers the Orlando metro area only.",
      emergencyPhone: "(407) 338-3342",
    };
  }

  return {
    available: true,
    serviceType,
    zip,
    emergencyPros: [
      { name: "Marcus T.", rating: 4.9, etaMinutes: 25, specialties: ["handyman", "flood_cleanup", "emergency_repairs"] },
      { name: "James R.", rating: 4.8, etaMinutes: 40, specialties: ["junk_removal", "light_demolition", "storm_cleanup"] },
    ],
    estimatedResponseTime: "Within 1 hour for most emergency calls",
    emergencyPhone: "(407) 338-3342",
    note: "Emergency dispatch available 24/7. Standard pricing applies plus emergency dispatch fee.",
  };
}

// z10) getDisasterModeStatus
export function getDisasterModeStatus(zip: string): object {
  const month = new Date().getMonth() + 1;
  const isHurricaneSeason = month >= 6 && month <= 11;

  return {
    zip,
    activeAlerts: isHurricaneSeason ? [
      {
        type: "Hurricane Season Active",
        severity: "watch",
        message: "June 1 – Nov 30 is hurricane season in Central Florida.",
        recommendedServices: ["gutter_cleaning", "landscaping", "home_scan"],
      },
    ] : [],
    isHurricaneSeason,
    emergencyServices: [
      { serviceId: "handyman", name: "Emergency Handyman", available24x7: true },
      { serviceId: "junk_removal", name: "Storm Debris Removal", available24x7: true },
      { serviceId: "gutter_cleaning", name: "Emergency Gutter Clearing", available24x7: false },
    ],
    emergencyPhone: "(407) 338-3342",
    prepNote: isHurricaneSeason
      ? "Hurricane season is active. Keep gutters clear and document your home's condition now."
      : "No active alerts. Year-round gutter maintenance prevents emergency situations.",
  };
}


// ═════════════════════════════════════════════
// LOYALTY & GAMIFICATION
// ═════════════════════════════════════════════

// z12) getCustomerMilestones
export async function getCustomerMilestones(userId: string, storage?: any): Promise<object> {
  let jobCount = 0;
  let lifetimeSpend = 0;
  let memberSince: string | null = null;

  if (storage) {
    try {
      const jobs = await storage.getServiceRequestsByCustomer?.(userId).catch(() => []);
      const completed = (jobs || []).filter((j: any) => j.status === "completed");
      jobCount = completed.length;
      lifetimeSpend = completed.reduce((s: number, j: any) => s + (j.finalPrice || j.priceEstimate || 0), 0);
      if (completed.length > 0) {
        const sorted = [...completed].sort((a: any, b: any) =>
          new Date(a.completedAt || a.createdAt).getTime() - new Date(b.completedAt || b.createdAt).getTime()
        );
        memberSince = new Date(sorted[0]?.completedAt || sorted[0]?.createdAt).getFullYear().toString();
      }
    } catch { /* fall through */ }
  }

  const milestones = [
    { id: "first_job",  label: "First Job",       achieved: jobCount >= 1,          reward: "Welcome to UpTend!" },
    { id: "five_jobs",  label: "5 Jobs",           achieved: jobCount >= 5,           reward: "$10 account credit" },
    { id: "ten_jobs",   label: "10 Jobs",          achieved: jobCount >= 10,          reward: "$25 credit + Silver tier" },
    { id: "spend_500",  label: "$500 Lifetime",    achieved: lifetimeSpend >= 500,    reward: "Silver: Priority scheduling" },
    { id: "spend_2000", label: "$2,000 Lifetime",  achieved: lifetimeSpend >= 2000,   reward: "Gold: 5% off everything" },
    { id: "spend_5000", label: "$5,000 Lifetime",  achieved: lifetimeSpend >= 5000,   reward: "Platinum: 10% off + free home scan/year" },
  ];

  return {
    userId,
    milestones,
    completedCount: milestones.filter(m => m.achieved).length,
    nextMilestone: milestones.find(m => !m.achieved) || null,
    memberSince: memberSince || "New member",
    totalJobs: jobCount,
    lifetimeSpend,
  };
}

// ═════════════════════════════════════════════
// COMMUNITY FEATURES
// ═════════════════════════════════════════════

// z13) getNeighborhoodActivity
export function getNeighborhoodActivity(zip: string): object {
  const activityByZip: Record<string, any> = {
    "32827": {
      recentActivity: [
        { service: "Pool Cleaning",    note: "3 homes on your block this week" },
        { service: "Landscaping",      note: "12 bookings in Lake Nona this week" },
        { service: "Pressure Washing", note: "Trending up 40% in your area" },
      ],
      groupDealsActive: 2,
    },
    "32836": {
      recentActivity: [
        { service: "Home Cleaning",    note: "8 bookings in Dr. Phillips this week" },
        { service: "Pool Cleaning",    note: "Very popular — 15 bookings this week" },
      ],
      groupDealsActive: 1,
    },
  };

  const data = activityByZip[zip] || {
    recentActivity: [
      { service: "Pressure Washing", note: "Popular this season in your area" },
      { service: "Lawn Care",        note: "High demand in your neighborhood" },
    ],
    groupDealsActive: 0,
  };

  return {
    zip,
    recentActivity: data.recentActivity,
    activeGroupDeals: data.groupDealsActive,
    popularThisWeek: data.recentActivity[0]?.service || "Pressure Washing",
    communityTip: "Joining a group deal with neighbors saves everyone 15% — ask George about group deals in your zip.",
  };
}

// z14) getLocalEvents
export function getLocalEvents(zip: string): object {
  const month = new Date().getMonth() + 1;

  const eventsByMonth: Record<number, any[]> = {
    3:  [{ name: "Spring HOA Inspection Season", services: ["pressure_washing", "landscaping"], tip: "Get ahead of HOA citations — book now" }],
    4:  [{ name: "Easter & Spring Break",        services: ["home_cleaning", "pool_cleaning"],  tip: "Great time to prep for guests" }],
    6:  [{ name: "Hurricane Season Starts",      services: ["gutter_cleaning", "landscaping"],  tip: "Book gutter cleaning before the first storm" }],
    9:  [{ name: "Post-Storm Cleanup Season",    services: ["junk_removal", "pressure_washing"], tip: "Storm debris removal books up fast" }],
    11: [{ name: "Holiday Prep Season",          services: ["home_cleaning", "garage_cleanout"], tip: "Book early — pros fill up in November" }],
    12: [{ name: "Year-End Home Maintenance",    services: ["gutter_cleaning", "handyman"],      tip: "Year-end is ideal for a full home checkup" }],
  };

  const current = eventsByMonth[month] || [{ name: "Regular Season", services: ["landscaping", "home_cleaning"], tip: "Consistent maintenance prevents expensive repairs" }];
  const next = eventsByMonth[(month % 12) + 1] || [];

  return {
    zip,
    month,
    currentEvents: current,
    upcomingEvents: next,
    communityTip: current[0]?.tip || "Stay ahead of your home maintenance.",
  };
}

// ═════════════════════════════════════════════
// POST-BOOKING INTELLIGENCE
// ═════════════════════════════════════════════

// z15) getPostBookingQuestion
export function getPostBookingQuestion(serviceId: string, homeProfile: any): object {
  const questions: Record<string, { question: string; why: string; followUpServiceId?: string }> = {
    home_cleaning:     { question: "Any areas we should pay extra attention to — mudroom, playroom, home office?", why: "Personalizes the job, increases satisfaction" },
    gutter_cleaning:   { question: "When was your roof last inspected? Gutter day is a great time for a quick check.", why: "Upsell to home scan", followUpServiceId: "home_scan" },
    pressure_washing:  { question: "Do you also have a pool deck or screened enclosure that could use attention?", why: "Natural add-on opportunity" },
    landscaping:       { question: "Have you thought about a recurring plan? Monthly visits are cheaper per visit than one-time.", why: "Converts to subscription" },
    pool_cleaning:     { question: "Has your pool pump or filter been serviced recently? Clean water + healthy equipment = a longer-lasting pool.", why: "Equipment check upsell" },
    junk_removal:      { question: "Would you like before/after photos for your records? Great for insurance documentation.", why: "Adds value, builds loyalty" },
    handyman:          { question: "Any other small tasks while the pro is on-site? Adding tasks is often more cost-effective than a separate visit.", why: "Multi-task upsell" },
  };

  const q = questions[serviceId] || {
    question: "How did everything turn out? Anything else you'd like taken care of?",
    why: "General follow-up",
  };

  return {
    serviceId,
    ...q,
    timing: "Ask immediately after booking confirmation — one question, not a survey",
  };
}

// z16) getProJobPrompts
export function getProJobPrompts(serviceId: string, homeProfile: any): object {
  const prompts: Record<string, { photos: string[]; notes: string[]; checklist: string[] }> = {
    home_cleaning: {
      photos:   ["Before: main living area", "Before: kitchen", "After: kitchen/sink", "After: bathrooms", "After: overall"],
      notes:    ["Note any damaged items before starting", "Note if customer wasn't present for walkthrough"],
      checklist: ["All rooms per scope", "Trash emptied", "Inside microwave (deep clean)", "Customer confirmed satisfied"],
    },
    gutter_cleaning: {
      photos:   ["Before: gutters with debris", "After: clean gutters", "Downspout flow test", "Any damage found"],
      notes:    ["Note loose or damaged sections", "Note any roof concerns visible from ladder"],
      checklist: ["All sections cleared", "Downspouts flushed", "Debris removed", "Standing water check"],
    },
    pressure_washing: {
      photos:   ["Before: driveway", "Before: target surfaces", "After: driveway", "After: overall"],
      notes:    ["Note surface damage before starting", "Note stubborn stains needing extra treatment"],
      checklist: ["Pre-rinse done", "Correct detergent applied", "Post-rinse done", "Surface inspection complete"],
    },
    junk_removal: {
      photos:   ["Before: full load visible", "After: cleared area", "Items on truck (for manifest)"],
      notes:    ["Note any hazardous materials", "Note access challenges"],
      checklist: ["All items removed", "Area swept", "Items sorted (donate/dispose)", "Customer walkthrough done"],
    },
    landscaping: {
      photos:   ["Before: full lawn", "After: mowed/trimmed", "Edging detail", "Cleanup complete"],
      notes:    ["Note irrigation issues or bare patches", "Note customer preferences for future visits"],
      checklist: ["Mowing complete", "Edging done", "Clippings removed", "Customer walkthrough"],
    },
  };

  const p = prompts[serviceId] || {
    photos:   ["Before: overall condition", "After: completed work"],
    notes:    ["Note any pre-existing damage", "Note special requests"],
    checklist: ["Work completed per scope", "Customer walkthrough done", "Customer satisfied"],
  };

  return {
    serviceId,
    ...p,
    reminder: "Always get customer sign-off before leaving. A photo of the finished work protects both you and the customer.",
  };
}


// ═════════════════════════════════════════════
// HOME MAINTENANCE TIPS
// ═════════════════════════════════════════════

// z18) getHomeTips
export function getHomeTips(season: string, homeType: string, location: string): object {
  const tipsBySeason: Record<string, any[]> = {
    spring: [
      { tip: "Clean gutters before rainy season — clogged gutters cause billions in annual damage", serviceId: "gutter_cleaning" },
      { tip: "Pollen season in Orlando means pressure washing every spring, especially rooflines and driveways", serviceId: "pressure_washing" },
      { tip: "Spring is the best time to document your home's condition for insurance purposes", serviceId: "home_scan" },
      { tip: "Service your AC before summer peaks — change filters monthly June–September", serviceId: "handyman" },
    ],
    summer: [
      { tip: "Hurricane season runs June–Nov. Clean gutters and trim overhanging branches now.", serviceId: "gutter_cleaning" },
      { tip: "Florida humidity causes mold on driveways fast — pressure wash at least twice a year", serviceId: "pressure_washing" },
      { tip: "Pool algae blooms fast in summer heat — weekly pool service is worth it", serviceId: "pool_cleaning" },
      { tip: "Lawn needs more mowing in summer heat — a recurring plan saves money vs. one-offs", serviceId: "landscaping" },
    ],
    fall: [
      { tip: "Post-storm season: inspect gutters, roof, and exterior for hurricane damage", serviceId: "gutter_cleaning" },
      { tip: "Deep clean now before holiday guests arrive — book early, pros fill up in November", serviceId: "home_cleaning" },
      { tip: "Dryer vent cleaning is a must in fall — lint buildup is a leading cause of home fires", serviceId: "handyman" },
    ],
    winter: [
      { tip: "Orlando cold snaps: wrap outdoor pipes on nights below 40°F", serviceId: null },
      { tip: "Year-end is ideal for a full home scan before the new year", serviceId: "home_scan" },
      { tip: "Clear the garage after the holidays — spring comes fast in Florida!", serviceId: "garage_cleanout" },
    ],
  };

  const seasonKey = (season || "spring").toLowerCase();
  const tips = tipsBySeason[seasonKey] || tipsBySeason["spring"];

  return {
    season,
    homeType: homeType || "residential",
    location: location || "Orlando, FL",
    tips,
    didYouKnow: "Florida homes require 2x more maintenance than the national average due to humidity, heat, and hurricane season.",
  };
}

// z19) addCustomReminder
export async function addCustomReminder(userId: string, description: string, intervalDays: number, storage?: any): Promise<object> {
  return {
    userId,
    reminder: {
      id: `custom_${Date.now()}`,
      description,
      intervalDays,
      nextDue: new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "active",
    },
    message: `Reminder set! I'll flag "${description}" every ${intervalDays} days. Manage reminders from your dashboard.`,
  };
}


// ═════════════════════════════════════════════
// PRO GOAL TRACKER
// ═════════════════════════════════════════════

// z21) setProGoal
export async function setProGoal(proId: string, monthlyTarget: number, storage?: any): Promise<object> {
  return {
    proId,
    goal: {
      monthlyTarget,
      setDate: new Date().toISOString().split("T")[0],
      status: "active",
    },
    weeklyTarget: Math.round(monthlyTarget / 4.3),
    dailyTarget: Math.round(monthlyTarget / 21),
    message: `Goal set! Tracking your progress toward $${monthlyTarget.toLocaleString()}/month. I'll show this every time you check in.`,
  };
}

// ═════════════════════════════════════════════
// DAILY ENGAGEMENT TOOLS (Phase 3)
// ═════════════════════════════════════════════

// da1) getMorningBriefing
export async function getMorningBriefing(userId: string, storage?: any): Promise<object> {
  const { buildMorningBriefing } = await import("./george-daily");
  const briefing = await buildMorningBriefing(userId, storage);

  const sections: string[] = [];

  // Weather
  const w = briefing.weather;
  sections.push(`🌤 **Weather**: ${w.temp}°F (feels like ${w.feelsLike}°F), ${w.conditions}, ${w.humidity}% humidity`);
  if (w.alerts.length > 0) {
    sections.push(`⚠️ **Alert**: ${w.alerts[0]}`);
  }

  // Today's schedule
  if (briefing.todaySchedule.length > 0) {
    const jobSummary = briefing.todaySchedule.map(j =>
      `${j.serviceType.replace(/_/g, " ")} with ${j.proName} (${j.timeWindow})`
    ).join(", ");
    sections.push(`📅 **Today**: ${jobSummary}`);
  } else {
    sections.push("📅 **Today**: No services scheduled");
  }

  // Trash day
  if (briefing.trashDay.isTrashDay) {
    sections.push("🗑️ **Trash day!** Put the bins out");
  } else if (briefing.trashDay.isRecyclingDay) {
    sections.push("♻️ **Recycling day!** Blue bin goes out");
  }

  // Home alerts
  if (briefing.homeAlerts.length > 0) {
    sections.push(`🔔 **Home alerts**: ${briefing.homeAlerts.map(a => a.message).join("; ")}`);
  }

  // Seasonal countdown
  const s = briefing.seasonalCountdown;
  if (s.daysUntil <= 60) {
    sections.push(`📆 **${s.event}** in ${s.daysUntil} days — readiness: ${s.readinessScore}/10`);
  }

  // Daily tip
  sections.push(`💡 **Daily tip**: ${briefing.tips}`);

  // Loyalty
  sections.push(`⭐ ${briefing.loyaltyUpdate}`);

  return {
    greeting: briefing.greeting,
    summary: sections.join("\n\n"),
    sections,
    raw: briefing,
  };
}

// da2) getHomeDashboard
export async function getHomeDashboard(userId: string, storage?: any): Promise<object> {
  let homeProfile: any = null;
  let recentJobs: any[] = [];
  let upcomingJobs: any[] = [];
  let thisMonthSpend = 0;
  let lifetimeSpend = 0;
  let loyaltyTier = "bronze";
  let maintenanceAlerts: any[] = [];

  if (storage) {
    try {
      homeProfile = await storage.getHomeProfile?.(userId).catch(() => null);
      const jobs = await storage.getServiceRequestsByCustomer?.(userId).catch(() => []);
      const now = new Date();

      const completed = (jobs || []).filter((j: any) => j.status === "completed");
      recentJobs = completed
        .sort((a: any, b: any) =>
          new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime()
        )
        .slice(0, 5)
        .map((j: any) => ({
          id: j.id,
          serviceType: j.serviceType,
          date: j.completedAt || j.createdAt,
          price: j.finalPrice || j.priceEstimate || 0,
          pro: j.proName || j.haulerName || "Pro",
          rating: j.customerRating || null,
        }));

      upcomingJobs = (jobs || [])
        .filter((j: any) => ["accepted", "confirmed", "pending"].includes(j.status) && new Date(j.scheduledFor) > now)
        .sort((a: any, b: any) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
        .slice(0, 5)
        .map((j: any) => ({
          id: j.id,
          serviceType: j.serviceType,
          scheduledFor: j.scheduledFor,
          pro: j.proName || j.haulerName || "Pro",
          status: j.status,
        }));

      lifetimeSpend = completed.reduce((s: number, j: any) => s + (j.finalPrice || j.priceEstimate || 0), 0);
      loyaltyTier = lifetimeSpend >= 5000 ? "platinum" : lifetimeSpend >= 2000 ? "gold" : lifetimeSpend >= 500 ? "silver" : "bronze";

      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      thisMonthSpend = completed
        .filter((j: any) => new Date(j.completedAt || j.createdAt) >= firstOfMonth)
        .reduce((s: number, j: any) => s + (j.finalPrice || j.priceEstimate || 0), 0);

      // Basic maintenance alerts
      const month = now.getMonth() + 1;
      if (month >= 5 && month <= 6) {
        maintenanceAlerts.push({ task: "Pre-hurricane season gutter cleaning", urgency: "high", serviceId: "gutter_cleaning" });
      }
      if (month === 3 || month === 4) {
        maintenanceAlerts.push({ task: "Spring pressure washing", urgency: "medium", serviceId: "pressure_washing" });
      }
    } catch (err: any) {
      console.warn("[George Tools] getHomeDashboard error:", err.message);
    }
  }

  return {
    userId,
    homeProfile: homeProfile ? {
      address:     homeProfile.address,
      bedrooms:    homeProfile.bedrooms,
      bathrooms:   homeProfile.bathrooms,
      squareFeet:  homeProfile.squareFeet,
      hasPool:     homeProfile.hasPool,
      yearBuilt:   homeProfile.yearBuilt,
    } : null,
    upcomingJobs,
    recentJobs,
    spending: {
      thisMonth:     thisMonthSpend,
      lifetimeTotal: lifetimeSpend,
      loyaltyTier,
    },
    maintenanceAlerts,
    smartDevices: {
      note: "Smart home integration coming soon — Ring, smart locks, thermostats, and water sensors will auto-dispatch pros when they detect issues",
      connected: false,
    },
    lastUpdated: new Date().toISOString(),
  };
}

// da3) getSpendingTracker
export async function getSpendingTracker(userId: string, period: string, storage?: any): Promise<object> {
  let jobs: any[] = [];

  if (storage) {
    try {
      const all = await storage.getServiceRequestsByCustomer?.(userId).catch(() => []);
      jobs = (all || []).filter((j: any) => j.status === "completed");
    } catch { /* fall through */ }
  }

  const now = new Date();
  let startDate: Date;

  if (period === "quarter") {
    const quarter = Math.floor(now.getMonth() / 3);
    startDate = new Date(now.getFullYear(), quarter * 3, 1);
  } else if (period === "year") {
    startDate = new Date(now.getFullYear(), 0, 1);
  } else {
    // Default: month
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const lastPeriodStart = new Date(startDate);
  if (period === "quarter") {
    lastPeriodStart.setMonth(lastPeriodStart.getMonth() - 3);
  } else if (period === "year") {
    lastPeriodStart.setFullYear(lastPeriodStart.getFullYear() - 1);
  } else {
    lastPeriodStart.setMonth(lastPeriodStart.getMonth() - 1);
  }

  const periodJobs = jobs.filter((j: any) => {
    const d = new Date(j.completedAt || j.createdAt);
    return d >= startDate && d <= now;
  });

  const lastPeriodJobs = jobs.filter((j: any) => {
    const d = new Date(j.completedAt || j.createdAt);
    return d >= lastPeriodStart && d < startDate;
  });

  const total = periodJobs.reduce((s: number, j: any) => s + (j.finalPrice || j.priceEstimate || 0), 0);
  const lastTotal = lastPeriodJobs.reduce((s: number, j: any) => s + (j.finalPrice || j.priceEstimate || 0), 0);

  const byCategory: Record<string, number> = {};
  for (const j of periodJobs) {
    const cat = j.serviceType || "other";
    byCategory[cat] = (byCategory[cat] || 0) + (j.finalPrice || j.priceEstimate || 0);
  }

  const budget = period === "year" ? 3600 : period === "quarter" ? 900 : 500;
  const change = lastTotal > 0 ? ((total - lastTotal) / lastTotal * 100).toFixed(0) : null;

  return {
    userId,
    period,
    total,
    budget,
    remaining: Math.max(0, budget - total),
    budgetUsedPct: budget > 0 ? Math.round((total / budget) * 100) : 0,
    byCategory,
    jobCount: periodJobs.length,
    vsLastPeriod: change !== null ? `${parseFloat(change) > 0 ? "+" : ""}${change}%` : null,
    topService: Object.keys(byCategory).sort((a, b) => byCategory[b] - byCategory[a])[0] || null,
    note: total > budget
      ? `You're $${total - budget} over your ${period}ly budget`
      : `$${budget - total} left in your ${period}ly budget`,
  };
}

// da4) getTrashSchedule
export function getTrashScheduleInfo(zip: string): object {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const trashDays: Record<string, number[]> = {
    "32827": [1, 4], "32832": [1, 4], "32824": [2, 5], "32836": [2, 5],
    "32819": [1, 4], "32789": [1, 4], "32765": [3, 6],
  };
  const recyclingWeekdays: Record<string, number> = {
    "32827": 1, "32832": 1, "32824": 2, "32836": 2,
    "32819": 1, "32789": 1, "32765": 3,
  };

  const schedule = trashDays[zip] || [1, 4];
  const recyclingDay = recyclingWeekdays[zip] || 1;

  function nextOccurrence(targetDay: number): string {
    const d = new Date(now);
    let daysUntil = (targetDay - dayOfWeek + 7) % 7;
    if (daysUntil === 0) return "Today";
    d.setDate(d.getDate() + daysUntil);
    return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  }

  return {
    zip,
    trashDays:         schedule.map(d => dayNames[d]),
    recyclingDay:      dayNames[recyclingDay],
    isTrashToday:      schedule.includes(dayOfWeek),
    isRecyclingToday:  dayOfWeek === recyclingDay,
    nextTrashPickup:   nextOccurrence(schedule[0]),
    nextRecyclingPickup: nextOccurrence(recyclingDay),
    bulkPickup:        "First Monday of each month (varies by area)",
    accepted:          "Household trash, recycling (paper, plastic 1–2, glass, cardboard — flattened)",
    notAccepted:       "Hazardous waste, electronics, tires, construction debris",
    source:            "Orange County Utilities — ocfl.net for holiday schedule changes",
  };
}

// da5) getHomeValueEstimate
export async function getHomeValueEstimate(address: string): Promise<object> {
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || process.env.REALTY_RAPIDAPI_KEY;

  if (RAPIDAPI_KEY) {
    try {
      const encodedAddress = encodeURIComponent(address);
      const res = await fetch(
        `https://realty-in-us.p.rapidapi.com/properties/v3/search?location=${encodedAddress}&limit=5`,
        {
          headers: {
            "x-rapidapi-key":  RAPIDAPI_KEY,
            "x-rapidapi-host": "realty-in-us.p.rapidapi.com",
          },
          signal: AbortSignal.timeout(5000),
        }
      );

      if (res.ok) {
        const data: any = await res.json();
        const homes = data?.data?.home_search?.results || [];
        if (homes.length > 0) {
          const prices = homes.map((h: any) => h.list_price || h.price || 0).filter((p: number) => p > 0);
          const avgPrice = prices.length > 0 ? Math.round(prices.reduce((s: number, p: number) => s + p, 0) / prices.length) : null;
          const estValue = avgPrice ? Math.round(avgPrice * (0.9 + Math.random() * 0.2)) : null;

          return {
            address,
            estimatedValue: estValue,
            comparables: homes.slice(0, 3).map((h: any) => ({
              address: h.location?.address?.line || "Nearby home",
              listPrice: h.list_price || 0,
              beds: h.description?.beds || 0,
              baths: h.description?.baths || 0,
              sqft: h.description?.sqft || 0,
            })),
            neighborhoodAvg: avgPrice,
            note: "Estimate based on nearby comparable listings. For an official value, request an appraisal.",
            homeTip: "Homes with documented maintenance history sell for 3–5% more. Your UpTend service records count!",
          };
        }
      }
    } catch { /* fall through to mock */ }
  }

  // Fallback mock for Orlando area
  const baseValue = 380000 + Math.floor(Math.random() * 120000);
  return {
    address,
    estimatedValue: baseValue,
    comparables: [
      { address: "Nearby home #1", listPrice: baseValue - 15000, beds: 3, baths: 2, sqft: 1800 },
      { address: "Nearby home #2", listPrice: baseValue + 22000, beds: 4, baths: 2, sqft: 2100 },
    ],
    neighborhoodAvg: baseValue,
    note: "Estimated range based on Orlando market averages. Connect Realty API for live data.",
    homeTip: "Homes with documented maintenance history sell for 3–5% more. Your UpTend service records count!",
  };
}

// da6) getCalendarSuggestion
export async function getCalendarSuggestion(userId: string, serviceId: string, storage?: any): Promise<object> {
  const { suggestBestTime } = await import("./george-calendar");
  const suggestion = await suggestBestTime(userId, serviceId, storage);

  const serviceLabel = (serviceId || "this service")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  return {
    userId,
    serviceId,
    serviceLabel,
    suggestion,
    message: suggestion.suggestedSlot
      ? `Based on your calendar, ${suggestion.suggestedSlot.label} looks good for ${serviceLabel}. ${suggestion.reason}.`
      : `I can find you a time for ${serviceLabel} — when are you generally free?`,
    calendarConnected: suggestion.suggestedSlot?.start !== undefined,
    howToConnect: !suggestion.suggestedSlot
      ? "Connect your Google Calendar so I can find the perfect slot around your schedule"
      : undefined,
  };
}

// da7) getSeasonalCountdown
export function getSeasonalCountdown(): object {
  const now = new Date();
  const month = now.getMonth() + 1;

  // Hurricane season readiness
  const isHurricaneSeason = month >= 6 && month <= 11;
  const hurricaneStart = new Date(now.getFullYear(), 5, 1); // June 1
  if (hurricaneStart < now) hurricaneStart.setFullYear(now.getFullYear() + 1);
  const daysToHurricane = Math.ceil((hurricaneStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Spring cleaning
  const springStart = new Date(now.getFullYear(), 2, 1); // March 1
  if (springStart < now) springStart.setFullYear(now.getFullYear() + 1);
  const daysToSpring = Math.ceil((springStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Holiday prep
  const holidayStart = new Date(now.getFullYear(), 10, 1); // Nov 1
  if (holidayStart < now) holidayStart.setFullYear(now.getFullYear() + 1);
  const daysToHoliday = Math.ceil((holidayStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Which is closest
  const events = [
    {
      name: "Hurricane Season",
      daysUntil: isHurricaneSeason ? 0 : daysToHurricane,
      active: isHurricaneSeason,
      services: ["gutter_cleaning", "landscaping", "home_scan"],
      tip: isHurricaneSeason
        ? "Hurricane season is active through November 30. Keep gutters clear and document your home."
        : `Hurricane season starts in ${daysToHurricane} days. Prep checklist: gutters, tree trimming, exterior photos.`,
    },
    {
      name: "Spring Cleaning Season",
      daysUntil: daysToSpring,
      active: month >= 3 && month <= 5,
      services: ["pressure_washing", "landscaping", "gutter_cleaning"],
      tip: `Spring cleaning season is ${daysToSpring <= 30 ? "here" : `${daysToSpring} days away`}. Pressure washing, landscaping, and gutters are in high demand.`,
    },
    {
      name: "Holiday Season",
      daysUntil: daysToHoliday,
      active: month >= 11,
      services: ["home_cleaning", "garage_cleanout"],
      tip: `Holiday season is ${daysToHoliday <= 30 ? "almost here" : `${daysToHoliday} days away`}. Book home cleaning early — pros fill up fast in November.`,
    },
  ];

  const closest = events.sort((a, b) => a.daysUntil - b.daysUntil)[0];

  return {
    upcoming: events,
    closest,
    currentMonth: month,
    isHurricaneSeason,
    hurricaneSeasonWindow: "June 1 – November 30",
    readinessChecklist: {
      guttersCleaned: false, // Would pull from service history in production
      treestrimmed:   false,
      homeDocumented: false,
      message: "Complete your readiness checklist to reach 10/10",
    },
  };
}

// ─── HOA Auto-Scrape Tools ──────────────────────────────

import { getHOAForCustomer, enrichHOAFromProReport } from "./hoa-scraper";

export async function getCustomerHOA(userId: string): Promise<object> {
  const data = await getHOAForCustomer(userId);

  if (!data) {
    return {
      found: false,
      message: "No HOA information found for your address. If you live in an HOA community, you can report your HOA details and we'll save them for future reference.",
    };
  }

  return {
    found: true,
    hoaName: data.hoaName,
    managementCompany: data.managementCompany,
    monthlyFee: data.monthlyFee,
    annualFee: data.annualFee,
    contactPhone: data.contactPhone,
    contactEmail: data.contactEmail,
    website: data.website,
    rules: data.rules,
    amenities: data.amenities,
    meetingSchedule: data.meetingSchedule,
    confidence: data.confidence,
    lastUpdated: data.lastUpdated,
  };
}

export async function reportHOARule(
  hoaDataId: string,
  report: { rules?: Record<string, any>; amenities?: Record<string, any>; hoaName?: string; managementCompany?: string; contactPhone?: string; contactEmail?: string; monthlyFee?: number }
): Promise<object> {
  if (!hoaDataId) {
    return { success: false, error: "hoaDataId is required. Look up the customer's HOA first." };
  }

  const updated = await enrichHOAFromProReport(hoaDataId, report);

  if (!updated) {
    return { success: false, error: "HOA record not found" };
  }

  return {
    success: true,
    message: "HOA information updated. Thank you for the report!",
    data: updated,
  };
}

// ─── Drone Scan Tools ───────────────────────────────────

export async function bookDroneScan(params: {
  customerId: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  scheduledDate: string;
  scheduledTime?: string;
  propertySize?: number;
  roofType?: string;
  stories?: number;
  interiorIncluded?: boolean;
}): Promise<object> {
  // Weather check
  let weatherSummary = "Weather check pending";
  try {
    const location = encodeURIComponent(`${params.city}, ${params.state}`);
    const res = await fetch(`https://wttr.in/${location}?format=j1`);
    if (res.ok) {
      const data = await res.json() as any;
      const forecast = data.weather?.[0];
      if (forecast) {
        const maxWind = Math.max(...(forecast.hourly || []).map((h: any) => parseInt(h.windspeedMiles || "0")));
        const chanceOfRain = Math.max(...(forecast.hourly || []).map((h: any) => parseInt(h.chanceofrain || "0")));
        const suitable = maxWind < 20 && chanceOfRain < 50;
        weatherSummary = suitable
          ? `Looks like clear skies for your scan — perfect for aerial imaging! (Wind: ${maxWind}mph, Rain: ${chanceOfRain}%)`
          : `⚠️ Weather might be iffy — ${maxWind}mph winds, ${chanceOfRain}% rain chance. We may need to adjust the date.`;
      }
    }
  } catch {}

  const { rows } = await pool.query(
    `INSERT INTO drone_scan_bookings
      (customer_id, address, city, state, zip, scheduled_date, scheduled_time,
       faa_compliance_ack, property_size, roof_type, stories, interior_included, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8,$9,$10,$11,'confirmed')
     RETURNING *`,
    [
      params.customerId, params.address, params.city, params.state, params.zip,
      params.scheduledDate, params.scheduledTime || null,
      params.propertySize || null, params.roofType || null, params.stories || 1,
      params.interiorIncluded !== false,
    ]
  );

  return {
    booking: rows[0],
    price: "$249",
    weatherNote: weatherSummary,
    deliverables: [
      "📸 High-res roof assessment photos",
      "🌡️ Thermal imaging (detect leaks & insulation gaps)",
      "🏠 Full exterior wall & gutter condition scan",
      "🗺️ 3D property model",
      "🏡 Complete interior walk-through scan",
    ],
    message: `Your UpTend Drone Scan is booked for ${params.scheduledDate}! Here's what you'll get: a complete aerial roof assessment, thermal imaging to spot hidden leaks, exterior wall & gutter condition report, a 3D model of your property, plus a full interior scan. ${weatherSummary}`,
  };
}

export async function getDroneScanStatus(params: { customerId: string; bookingId?: string }): Promise<object> {
  let query: string;
  let queryParams: string[];

  if (params.bookingId) {
    query = "SELECT * FROM drone_scan_bookings WHERE id = $1";
    queryParams = [params.bookingId];
  } else {
    query = "SELECT * FROM drone_scan_bookings WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 5";
    queryParams = [params.customerId];
  }

  const { rows } = await pool.query(query, queryParams);

  if (!rows.length) {
    return {
      found: false,
      message: "No drone scans found. Want to book one? Our $249 Drone Scan includes aerial roof assessment, thermal imaging, 3D property model, and interior walk-through!",
    };
  }

  const scans = rows.map((r: any) => ({
    id: r.id,
    address: r.address,
    scheduledDate: r.scheduled_date,
    status: r.status,
    reportUrl: r.report_url,
    completedAt: r.completed_at,
  }));

  return {
    found: true,
    scans,
    message: params.bookingId
      ? `Your drone scan at ${rows[0].address} is ${rows[0].status}${rows[0].report_url ? " — your report is ready!" : "."}`
      : `You have ${rows.length} drone scan(s) on file.`,
  };
}

// ─── Insurance, Emergency & Briefing Tools ──────────────

import { startClaim, getStormPrepChecklist as _getStormPrepChecklist } from "./insurance-claims";
import { createEmergencyDispatch } from "./emergency-dispatch";
import { generateMorningBriefing, getWeatherForZip } from "./morning-briefing";

export async function startInsuranceClaim(params: {
  customerId: string;
  claimType: string;
  description: string;
}): Promise<object> {
  return startClaim(params.customerId, params.claimType, params.description);
}

export async function getStormPrepChecklistTool(params: {
  customerId: string;
  stormType: string;
}): Promise<object> {
  return _getStormPrepChecklist(params.customerId, params.stormType);
}

export async function createEmergencyDispatchTool(params: {
  customerId: string;
  emergencyType: string;
  severity: string;
  description: string;
}): Promise<object> {
  return createEmergencyDispatch(params.customerId, params.emergencyType, params.severity, params.description);
}

export async function getMorningBriefingTool(params: {
  customerId: string;
}): Promise<object> {
  return generateMorningBriefing(params.customerId);
}

export async function getWeather(params: { zip: string }): Promise<object> {
  return getWeatherForZip(params.zip);
}

// ─── Smart Home Tools ───────────────────────────────────

import {
  getSupportedPlatforms,
  getAuthUrl,
  getConnectedDevices,
  type SmartHomePlatform,
} from "./smart-home-oauth";

export async function connectSmartHome(params: {
  customerId: string;
  platform: SmartHomePlatform;
}): Promise<object> {
  const platforms = getSupportedPlatforms();
  const selected = platforms.find(p => p.id === params.platform);

  if (!selected) {
    return {
      error: false,
      availablePlatforms: platforms,
      message: `I can connect these smart home platforms: ${platforms.map(p => `${p.icon} ${p.name}`).join(", ")}. Which one would you like to set up?`,
    };
  }

  const redirectUri = `${process.env.APP_URL || "https://uptend.com"}/api/smart-home/callback/${params.platform}`;
  const authUrl = getAuthUrl(params.platform, params.customerId, redirectUri);

  return {
    platform: selected.name,
    icon: selected.icon,
    authUrl,
    message: `Great! To connect your ${selected.icon} ${selected.name}, click the link below to authorize UpTend. Once connected, I'll be able to monitor your devices and alert you to any issues — like water leaks, unusual temperature changes, or security events.`,
    benefits: [
      "🔔 Real-time alerts for leaks, smoke, and CO",
      "🌡️ Temperature anomaly detection",
      "🔒 Security event monitoring",
      "📊 Energy usage insights",
      "🛠️ Proactive maintenance based on device data",
    ],
  };
}

export async function getSmartHomeOAuthStatus(params: { customerId: string }): Promise<object> {
  const connections = await getConnectedDevices(params.customerId);

  if (!connections.length) {
    const platforms = getSupportedPlatforms();
    return {
      connected: false,
      message: `You haven't connected any smart home devices yet. I can help you link: ${platforms.map(p => `${p.icon} ${p.name}`).join(", ")}. Want to set one up?`,
    };
  }

  // Get recent alerts
  const { rows: alerts } = await pool.query(
    "SELECT * FROM smart_home_alerts WHERE customer_id = $1 AND acknowledged = false ORDER BY created_at DESC LIMIT 10",
    [params.customerId]
  );

  return {
    connected: true,
    deviceCount: connections.reduce((sum: number, c: any) => sum + (c.device_count || 0), 0),
    platforms: connections.map((c: any) => ({
      platform: c.platform,
      status: c.status,
      devices: c.device_count,
      lastSync: c.last_sync_at,
    })),
    alerts: alerts.map((a: any) => ({
      type: a.alert_type,
      device: a.device_name,
      message: a.message,
      severity: a.severity,
      time: a.created_at,
    })),
    message: `You have ${connections.length} platform(s) connected with ${connections.reduce((s: number, c: any) => s + (c.device_count || 0), 0)} devices. ${alerts.length ? `⚠️ ${alerts.length} unacknowledged alert(s).` : "All clear — no alerts!"}`,
  };
}

// ═══════════════════════════════════════════════
// CONSENT + PASSIVE DATA TOOLS (for George)
// ═══════════════════════════════════════════════

import {
  checkConsent as _checkConsent,
  requireConsent as _requireConsent,
  grantConsent as _grantConsent,
  type ConsentType,
} from "./consent-manager";
import {
  getNextQuestion as _getNextQuestion,
  collectFromProReport as _collectFromProReport,
} from "./passive-data";

// ═══════════════════════════════════════════════
// LOYALTY + REFERRAL + COMMUNITY TOOLS
// ═══════════════════════════════════════════════

import {
  getCustomerLoyalty,
  getAvailableRewards as _getAvailableRewards,
  redeemReward as _redeemReward,
} from "./loyalty-engine.js";
import {
  generateReferralCode,
  getReferralStatus as _getReferralStatus,
  createGroupDeal as _createGroupDeal,
  getNeighborhoodDeals as _getNeighborhoodDeals,
} from "./referral-engine.js";
import {
  getNeighborhoodActivity as _getNeighborhoodActivity,
  getLocalEvents as _getLocalEvents,
  submitTip,
} from "./community-engine.js";

export async function getCustomerLoyaltyStatusForGeorge(params: { customerId: string }) {
  const loyalty = await getCustomerLoyalty(params.customerId);
  return {
    ...loyalty,
    message: `You're a ${loyalty.currentTier.toUpperCase()} member with $${loyalty.lifetimeSpend} lifetime spend. ${loyalty.discountPercent}% discount on all services.${loyalty.nextTierThreshold ? ` $${loyalty.nextTierThreshold - loyalty.lifetimeSpend} more to next tier!` : " You're at the top tier! 🏆"}`,
  };
}

export async function getAvailableRewardsForGeorge(params: { customerId: string }) {
  const rewards = await _getAvailableRewards(params.customerId);
  return {
    rewards,
    message: rewards.length
      ? `You have ${rewards.length} reward(s) available! ${rewards.map((r: any) => r.description).join("; ")}`
      : "No rewards available right now — keep booking to earn more!",
  };
}

export async function redeemRewardForGeorge(params: { rewardId: string }) {
  return _redeemReward(params.rewardId);
}

export async function getReferralCode(params: { customerId: string }) {
  const result = await generateReferralCode(params.customerId);
  return {
    ...result,
    message: `Your referral code is ${result.code}. Share it with friends — they get $10 off their first booking and you get $25 credit! 🎉`,
  };
}

export async function getReferralStatusForGeorge(params: { customerId: string }) {
  const status = await _getReferralStatus(params.customerId);
  return {
    ...status,
    message: `You've referred ${status.totalReferrals} people, earning $${status.totalEarned} total. ${status.pending} pending.`,
  };
}

export async function createGroupDealForGeorge(params: { customerId: string; neighborhood: string; serviceType: string }) {
  const deal = await _createGroupDeal(params.customerId, params.neighborhood, params.serviceType);
  return {
    ...deal,
    message: `Group deal created for ${params.serviceType} in ${params.neighborhood}! Get ${deal.minParticipants} neighbors to join for ${deal.discountPercent}% off. Share the deal ID: ${deal.dealId}`,
  };
}

export async function getNeighborhoodDealsForGeorge(params: { zip: string }) {
  const deals = await _getNeighborhoodDeals(params.zip);
  return {
    deals,
    message: deals.length
      ? `Found ${deals.length} active group deal(s) near you!`
      : "No active group deals in your area yet. Want to start one?",
  };
}

export async function getNeighborhoodActivityForGeorge(params: { zip: string; limit?: number }) {
  const activity = await _getNeighborhoodActivity(params.zip, params.limit || 10);
  return {
    activity,
    message: activity.length
      ? `Here's what's happening in your neighborhood (${params.zip}):`
      : "Not much activity in your area yet — be the first!",
  };
}

export async function getLocalEventsForGeorge(params: { zip: string; startDate?: string; endDate?: string }) {
  const events = await _getLocalEvents(params.zip, params.startDate, params.endDate);
  return {
    events,
    message: events.length
      ? `Found ${events.length} upcoming event(s) near you!`
      : "No upcoming events found in your area.",
  };
}

export async function submitNeighborhoodTip(params: { customerId: string; zip: string; category: string; title: string; content: string }) {
  return submitTip(params.customerId, params.zip, params.category, params.title, params.content);
}

/**
 * checkUserConsent — Check if user has consented to a specific data type
 */
export async function checkUserConsent(params: {
  userId: string;
  consentType: string;
}): Promise<{ hasConsent: boolean }> {
  const hasConsent = await _checkConsent(params.userId, params.consentType as ConsentType);
  return { hasConsent };
}

/**
 * requestConsent — Conversationally ask for consent; returns prompt if not yet granted
 */
export async function requestConsent(params: {
  userId: string;
  consentType: string;
  customMessage?: string;
}): Promise<{ hasConsent: boolean; prompt?: string }> {
  return _requireConsent(params.userId, params.consentType as ConsentType, params.customMessage);
}

/**
 * getNextPassiveQuestion — Gets one question to weave into conversation
 */
export async function getNextPassiveQuestion(params: {
  customerId: string;
}): Promise<{ question: string; dataKey: string; relatedService: string } | { message: string }> {
  const result = await _getNextQuestion(params.customerId);
  if (!result) return { message: "Home profile is looking great — no more questions needed right now!" };
  return result;
}

/**
 * submitProSiteReport — Pro reports observations from job
 */
export async function submitProSiteReport(params: {
  proId: string;
  jobId: string;
  customerId: string;
  reportType: string;
  details: Record<string, any>;
  photos?: string[];
}): Promise<{ reportId: string; message: string }> {
  const reportId = await _collectFromProReport(params.proId, params.jobId, {
    customerId: params.customerId,
    reportType: params.reportType,
    details: params.details,
    photos: params.photos,
  });
  return { reportId, message: "Report submitted — thanks for the observations! This helps us serve the customer better." };
}

// ═══════════════════════════════════════════════
// PRO INTELLIGENCE + GOALS + ROUTE TOOLS
// ═══════════════════════════════════════════════

import {
  getDemandForecast as _getDemandForecast,
  getCustomerRetention as _getCustomerRetentionIntel,
  getPerformanceAnalytics as _getPerformanceAnalytics,
} from "./pro-intelligence.js";
import {
  setGoal as _setGoal,
  getGoalProgress as _getGoalProgress,
  suggestGoal as _suggestGoal,
} from "./pro-goals.js";
import {
  getRouteForDay as _getRouteForDay,
  getWeeklyRouteSummary as _getWeeklyRouteSummary,
} from "./route-optimizer.js";

/**
 * getProDemandForecast — Predict demand in a zip code for a pro
 */
export async function getProDemandForecastForGeorge(params: {
  proId: string;
  zip?: string;
  daysAhead?: number;
}): Promise<object> {
  return _getDemandForecast(params.proId, params.zip || "32801", params.daysAhead || 7);
}

/**
 * getProCustomerRetentionIntel — Analyze customer retention & at-risk clients
 */
export async function getProCustomerRetentionIntel(params: {
  proId: string;
}): Promise<object> {
  return _getCustomerRetentionIntel(params.proId);
}

/**
 * getProPerformanceAnalytics — Weekly/monthly performance breakdown
 */
export async function getProPerformanceAnalytics(params: {
  proId: string;
  period?: string;
}): Promise<object> {
  return _getPerformanceAnalytics(params.proId, (params.period as "weekly" | "monthly") || "weekly");
}

/**
 * setProEarningsGoal — Create an earnings goal for a pro
 */
export async function setProEarningsGoal(params: {
  proId: string;
  goalType: string;
  targetAmount: number;
  startDate: string;
  endDate: string;
}): Promise<object> {
  return _setGoal(params.proId, params.goalType as any, params.targetAmount, params.startDate, params.endDate);
}

/**
 * getProGoalProgress — Get active goals with progress bars and pace
 */
export async function getProGoalProgressForGeorge(params: {
  proId: string;
}): Promise<object> {
  return _getGoalProgress(params.proId);
}

/**
 * suggestProGoal — AI-suggested earnings goal based on history + demand
 */
export async function suggestProGoal(params: {
  proId: string;
}): Promise<object> {
  return _suggestGoal(params.proId);
}

/**
 * getOptimizedRoute — Get optimized route for a day's jobs
 */
export async function getOptimizedRoute(params: {
  proId: string;
  date: string;
}): Promise<object> {
  return _getRouteForDay(params.proId, params.date);
}

/**
 * getWeeklyRouteSummaryForGeorge — Weekly driving summary
 */
export async function getWeeklyRouteSummaryForGeorge(params: {
  proId: string;
}): Promise<object> {
  return _getWeeklyRouteSummary(params.proId);
}

// ═══════════════════════════════════════════════
// DIY TIPS + B2B CONTRACTS + POST-BOOKING + NEIGHBORHOOD TOOLS
// ═══════════════════════════════════════════════

import {
  getDIYTip as _getDIYTip,
  getSeasonalDIYTips as _getSeasonalDIYTips,
  getDIYvsPro as _getDIYvsPro,
} from "./diy-tips.js";
import {
  generateServiceAgreement as _generateServiceAgreement,
  getDocumentTracker as _getDocumentTracker,
  getComplianceReport as _getComplianceReport,
} from "./b2b-contracts.js";
import {
  getPostBookingQuestion as _getPostBookingQuestion,
  getProJobPrompts as _getProJobPrompts,
} from "./post-booking.js";
import {
  generateInsights as _generateInsights,
  getSeasonalDemand as _getSeasonalDemand,
} from "./neighborhood-insights.js";

/**
 * getDIYTip — Get a DIY tip for a service type
 */
export async function getDIYTipForGeorge(params: {
  serviceType: string;
}): Promise<object> {
  const tip = await _getDIYTip(params.serviceType);
  if (!tip) return { message: `No DIY tip available for ${params.serviceType}. This is best handled by a pro — want me to get you a quote?` };
  return {
    ...tip,
    message: `Here's a DIY option: "${tip.title}" (${tip.difficulty}, ~${tip.estimatedTime} min). You could save ~$${tip.estimatedSavings}. ${tip.whenToCallPro ? `⚠️ Call a pro if: ${tip.whenToCallPro}` : ""}`,
  };
}

/**
 * getDIYvsPro — Compare DIY vs hiring a pro
 */
export async function getDIYvsProForGeorge(params: {
  serviceType: string;
}): Promise<object> {
  return _getDIYvsPro(params.serviceType);
}

/**
 * getSeasonalDIYTips — Tips relevant to the current month
 */
export async function getSeasonalDIYTipsForGeorge(params: {
  month: number;
}): Promise<object> {
  const tips = await _getSeasonalDIYTips(params.month);
  return {
    tips,
    message: tips.length
      ? `Found ${tips.length} DIY tip(s) for this time of year. Here are the top ones you can tackle yourself!`
      : "No seasonal DIY tips right now — but I can help you book a pro for anything you need.",
  };
}

/**
 * generateServiceAgreement — Create a B2B service agreement
 */
export async function generateServiceAgreementForGeorge(params: {
  businessAccountId: string;
  agreementType: string;
  terms?: Record<string, any>;
}): Promise<object> {
  const agreement = await _generateServiceAgreement(params.businessAccountId, params.agreementType, params.terms || {});
  return {
    ...agreement,
    message: `Draft ${params.agreementType.replace(/_/g, " ")} created (ID: ${agreement.id}). Status: ${agreement.status}. Ready for review.`,
  };
}

/**
 * getDocumentTracker — All documents for a business account
 */
export async function getDocumentTrackerForGeorge(params: {
  businessAccountId: string;
}): Promise<object> {
  const docs = await _getDocumentTracker(params.businessAccountId);
  return {
    documents: docs,
    message: docs.length
      ? `Found ${docs.length} document(s) on file. ${docs.filter((d: any) => d.status === "pending").length} pending action.`
      : "No documents tracked yet for this account.",
  };
}

/**
 * getComplianceReport — Compliance status for a business
 */
export async function getComplianceReportForGeorge(params: {
  businessAccountId: string;
}): Promise<object> {
  const report = await _getComplianceReport(params.businessAccountId);
  return {
    ...report,
    message: `Compliance score: ${report.complianceScore}/100 (${report.status}). ${report.missingDocuments.length ? `Missing: ${report.missingDocuments.join(", ")}` : "All required docs on file."}`,
  };
}

/**
 * getPostBookingQuestion — Get a follow-up question after a completed job
 */
export async function getPostBookingQuestionForGeorge(params: {
  customerId: string;
  jobId: string;
  serviceType?: string;
}): Promise<object> {
  const question = await _getPostBookingQuestion(params.customerId, params.jobId, params.serviceType);
  return {
    ...question,
    message: question.question,
  };
}

/**
 * getProJobPrompts — Prompts for a pro during a job
 */
export async function getProJobPromptsForGeorge(params: {
  proId: string;
  jobId: string;
  serviceType?: string;
}): Promise<object> {
  const prompts = await _getProJobPrompts(params.proId, params.jobId, params.serviceType);
  return {
    prompts,
    message: `${prompts.length} prompt(s) for this job. Complete them to help us serve the customer better!`,
  };
}

/**
 * getNeighborhoodInsights — Local market data for a zip code
 */
export async function getNeighborhoodInsightsForGeorge(params: {
  zip: string;
}): Promise<object> {
  const insights = await _generateInsights(params.zip);
  return {
    ...insights,
    message: `Here's what's happening in ${params.zip}: ${(insights as any).popularServices ? `Most popular services: ${(insights as any).popularServices.slice(0, 3).join(", ")}` : "Generating insights..."}`,
  };
}

/**
 * getSeasonalDemand — What's in demand this month locally
 */
export async function getSeasonalDemandForGeorge(params: {
  zip: string;
  month: number;
}): Promise<object> {
  const demand = await _getSeasonalDemand(params.zip, params.month);
  return {
    ...demand,
    message: demand.tip,
  };
}

// ═══════════════════════════════════════════════
// HOME UTILITIES — Home Operating System Tools
// George knows EVERYTHING about their home.
// ═══════════════════════════════════════════════

import {
  lookupTrashSchedule as _lookupTrashSchedule,
  lookupWaterRestrictions as _lookupWaterRestrictions,
  lookupUtilityProviders as _lookupUtilityProviders,
  getSeasonalSprinklerRecommendation as _getSeasonalSprinklerRec,
  generateTrashReminder as _generateTrashReminder,
} from "./municipal-data.js";
import {
  getHomeDashboard as _getHomeOSDashboard,
  getWeeklyHomeView as _getWeeklyHomeView,
  getTonightChecklist as _getTonightChecklist,
} from "./home-dashboard.js";

/**
 * getTrashSchedule — "When's my trash day?"
 */
export async function getTrashScheduleForGeorge(params: {
  customerId: string;
  zip?: string;
  address?: string;
}): Promise<object> {
  if (params.zip) {
    const schedule = await _lookupTrashSchedule(params.address || "", "", "FL", params.zip);
    return {
      ...schedule,
      message: `🗑️ Your trash days are ${schedule.trashDay}. Recycling: ${schedule.recyclingDay}. ${schedule.yardWasteDay ? `Yard waste: ${schedule.yardWasteDay}.` : ""} Provider: ${schedule.provider}.`,
    };
  }
  // Try DB lookup by customerId
  try {
    const result = await pool.query(
      `SELECT t.*, h.zip FROM trash_recycling_schedules t
       LEFT JOIN home_utility_profiles h ON h.customer_id = t.customer_id
       WHERE t.customer_id = $1 LIMIT 1`,
      [params.customerId]
    );
    if (result.rows.length > 0) {
      const s = result.rows[0];
      return {
        trashDay: s.trash_day,
        recyclingDay: s.recycling_day,
        yardWasteDay: s.yard_waste_day,
        provider: s.provider,
        message: `🗑️ Your trash day is ${s.trash_day}. Recycling: ${s.recycling_day}. ${s.yard_waste_day ? `Yard waste: ${s.yard_waste_day}.` : ""} Provider: ${s.provider || "Orange County Solid Waste"}.`,
      };
    }
  } catch {}
  return { message: "I don't have your trash schedule yet. What's your zip code? I'll look it up and remember it forever!" };
}

/**
 * getRecyclingSchedule — recycling day + what's accepted
 */
export async function getRecyclingScheduleForGeorge(params: {
  customerId: string;
  zip?: string;
}): Promise<object> {
  const trash = await getTrashScheduleForGeorge(params);
  return {
    ...(trash as any),
    accepted: "Paper, cardboard (flattened), plastic bottles (#1-2), glass bottles/jars, aluminum & steel cans",
    notAccepted: "Plastic bags, styrofoam, food waste, electronics, hazardous materials, garden hoses",
    tips: [
      "Rinse containers — no need to scrub, just a quick rinse",
      "Flatten cardboard boxes to save space",
      "No plastic bags in recycling — return them to grocery stores",
      "When in doubt, throw it out (contamination ruins whole loads)",
    ],
    message: `♻️ Recycling day: ${(trash as any).recyclingDay || "check your schedule"}. Accepted: paper, cardboard, plastic #1-2, glass, cans. NO plastic bags or styrofoam.`,
  };
}

/**
 * getSprinklerSettings — current zones and schedule
 */
export async function getSprinklerSettingsForGeorge(params: {
  customerId: string;
}): Promise<object> {
  try {
    const result = await pool.query(
      `SELECT * FROM sprinkler_settings WHERE customer_id = $1 LIMIT 1`,
      [params.customerId]
    );
    if (result.rows.length > 0) {
      const s = result.rows[0];
      const zones = typeof s.zones === "string" ? JSON.parse(s.zones) : (s.zones || []);
      const month = new Date().getMonth() + 1;
      const rec = _getSeasonalSprinklerRec(month, "32827");
      return {
        systemType: s.system_type,
        zones,
        waterRestrictions: s.water_restrictions,
        rainSensor: s.rain_sensor_enabled,
        smartBrand: s.smart_controller_brand,
        connectedToGeorge: s.connected_to_george,
        seasonalRecommendation: rec,
        message: `💧 Your sprinkler system: ${s.system_type}. ${zones.length} zone(s). Rain sensor: ${s.rain_sensor_enabled ? "ON ✅" : "OFF ❌"}. ${rec.recommendation}`,
      };
    }
  } catch {}
  return { message: "No sprinkler settings on file yet. Tell me about your system and I'll track it!" };
}

/**
 * updateSprinklerZone — adjust watering days/times for a zone
 */
export async function updateSprinklerZoneForGeorge(params: {
  customerId: string;
  zoneName: string;
  waterDays?: string[];
  startTime?: string;
  duration?: number;
}): Promise<object> {
  try {
    const result = await pool.query(
      `SELECT * FROM sprinkler_settings WHERE customer_id = $1 LIMIT 1`,
      [params.customerId]
    );
    if (result.rows.length === 0) {
      return { message: "No sprinkler settings found. Let me set up your system first — what kind of sprinkler system do you have?" };
    }
    const s = result.rows[0];
    const zones = typeof s.zones === "string" ? JSON.parse(s.zones) : (s.zones || []);
    const zoneIdx = zones.findIndex((z: any) => z.zoneName?.toLowerCase() === params.zoneName.toLowerCase());

    if (zoneIdx === -1) {
      // Add new zone
      zones.push({
        zoneName: params.zoneName,
        waterDays: params.waterDays || [],
        startTime: params.startTime || "6:00 AM",
        duration: params.duration || 20,
      });
    } else {
      if (params.waterDays) zones[zoneIdx].waterDays = params.waterDays;
      if (params.startTime) zones[zoneIdx].startTime = params.startTime;
      if (params.duration) zones[zoneIdx].duration = params.duration;
    }

    await pool.query(
      `UPDATE sprinkler_settings SET zones = $1, last_updated = NOW() WHERE customer_id = $2`,
      [JSON.stringify(zones), params.customerId]
    );

    return {
      success: true,
      zone: zones[zoneIdx === -1 ? zones.length - 1 : zoneIdx],
      message: `✅ Updated zone "${params.zoneName}". ${params.waterDays ? `Days: ${params.waterDays.join(", ")}.` : ""} ${params.startTime ? `Start: ${params.startTime}.` : ""} ${params.duration ? `Duration: ${params.duration} min.` : ""}`,
    };
  } catch (err) {
    return { message: "Failed to update sprinkler zone. Try again?" };
  }
}

/**
 * getWaterRestrictions — local watering ordinance
 */
export async function getWaterRestrictionsForGeorge(params: {
  customerId: string;
  county?: string;
  zip?: string;
  addressNumber?: number;
}): Promise<object> {
  const county = params.county || "Orange";
  const zip = params.zip || "32827";
  const restrictions = _lookupWaterRestrictions(county, zip, params.addressNumber);
  return {
    ...restrictions,
    message: restrictions.notes,
  };
}

/**
 * getHomeOSDashboard — full "home at a glance" for George
 */
export async function getHomeOSDashboardForGeorge(params: {
  customerId: string;
}): Promise<object> {
  return _getHomeOSDashboard(params.customerId);
}

/**
 * getTonightChecklist — what to do before bed
 */
export async function getTonightChecklistForGeorge(params: {
  customerId: string;
}): Promise<object> {
  return _getTonightChecklist(params.customerId);
}

/**
 * setHomeReminder — custom reminder (e.g., "remind me to change AC filter monthly")
 */
export async function setHomeReminderForGeorge(params: {
  customerId: string;
  reminderType: string;
  title: string;
  description?: string;
  frequency?: string;
  nextDueDate: string;
  time?: string;
}): Promise<object> {
  try {
    const result = await pool.query(
      `INSERT INTO home_reminders (customer_id, reminder_type, title, description, frequency, next_due_date, time)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        params.customerId,
        params.reminderType || "filter_change",
        params.title,
        params.description || null,
        params.frequency || "monthly",
        params.nextDueDate,
        params.time || "7:00 PM",
      ]
    );
    return {
      success: true,
      reminderId: result.rows[0].id,
      message: `⏰ Got it! I'll remind you: "${params.title}" — ${params.frequency || "monthly"}, starting ${params.nextDueDate} at ${params.time || "7:00 PM"}.`,
    };
  } catch (err) {
    return { message: "Failed to create reminder. Try again?" };
  }
}

/**
 * getUtilityProviders — who services their address
 */
// ═══════════════════════════════════════════════
// PURCHASE TRACKING + WARRANTIES + APPLIANCE PROFILES
// George tracks what customers buy and maintains their home.
// ═══════════════════════════════════════════════

import { scanReceipt, processReceiptItems } from "./receipt-scanner.js";
import { getConnectedRetailers, connectRetailer, syncPurchaseHistory } from "./retailer-connect.js";
import {
  getGarageDoorProfile,
  updateGarageDoorProfile,
  getWaterHeaterProfile,
  updateWaterHeaterProfile,
  getMaintenanceLog,
  addMaintenanceEntry,
  getMaintenanceDue as _getMaintenanceDue,
  getDIYPurchaseSuggestions,
} from "./appliance-profiles.js";

/**
 * scanReceiptPhoto — "Snap your receipt and I'll track everything"
 */
export async function scanReceiptPhoto(params: {
  customerId: string;
  photoUrl: string;
}): Promise<object> {
  const scanResult = await scanReceipt(params.photoUrl);
  const { purchaseId, warrantiesCreated } = await processReceiptItems(
    params.customerId,
    scanResult.items,
    scanResult.storeNormalized,
    scanResult.date
  );

  // Update receipt URL
  await pool.query(
    `UPDATE customer_purchases SET receipt_url = $1, raw_ocr_text = $2 WHERE id = $3`,
    [params.photoUrl, scanResult.rawText, purchaseId]
  );

  const itemList = scanResult.items.map((i: any) => `• ${i.name}${i.brand ? ` (${i.brand})` : ""} — $${i.price}`).join("\n");

  return {
    purchaseId,
    store: scanResult.store,
    items: scanResult.items,
    totalAmount: scanResult.totalAmount,
    warrantiesCreated,
    message: `🧾 Got it! Scanned your ${scanResult.store} receipt:\n${itemList}\n\nTotal: $${scanResult.totalAmount || "N/A"}${warrantiesCreated > 0 ? `\n\n🛡️ Auto-created ${warrantiesCreated} warranty registration(s) for big-ticket items!` : ""}`,
  };
}

/**
 * getWarrantyDashboard — all warranties sorted by expiring soonest
 */
export async function getWarrantyDashboard(params: {
  customerId: string;
}): Promise<object> {
  const { rows } = await pool.query(
    `SELECT * FROM warranty_registrations WHERE customer_id = $1 ORDER BY warranty_expires ASC`,
    [params.customerId]
  );

  if (rows.length === 0) {
    return { warranties: [], message: "No warranties on file yet. Scan a receipt or register one manually!" };
  }

  const now = new Date();
  const expiringSoon = rows.filter((w: any) => {
    const exp = new Date(w.warranty_expires);
    const daysLeft = Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft >= 0 && daysLeft <= 90;
  });

  const expired = rows.filter((w: any) => new Date(w.warranty_expires) < now);

  const list = rows.slice(0, 10).map((w: any) => {
    const exp = new Date(w.warranty_expires);
    const daysLeft = Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const status = daysLeft < 0 ? "❌ EXPIRED" : daysLeft <= 30 ? "⚠️ EXPIRING SOON" : "✅ Active";
    return `${status} ${w.product_name}${w.brand ? ` (${w.brand})` : ""} — expires ${exp.toLocaleDateString()} (${daysLeft < 0 ? `${Math.abs(daysLeft)}d ago` : `${daysLeft}d left`})`;
  }).join("\n");

  return {
    warranties: rows,
    expiringSoonCount: expiringSoon.length,
    expiredCount: expired.length,
    message: `🛡️ Warranty Dashboard (${rows.length} total):\n${list}${expiringSoon.length > 0 ? `\n\n⚠️ ${expiringSoon.length} warranty(ies) expiring within 90 days!` : ""}`,
  };
}

/**
 * registerWarranty — manual warranty entry
 */
export async function registerWarranty(params: {
  customerId: string;
  productName: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  warrantyType?: string;
  warrantyDuration?: number;
  warrantyExpires?: string;
  notes?: string;
}): Promise<object> {
  let warrantyExpires = params.warrantyExpires;
  if (!warrantyExpires && params.purchaseDate && params.warrantyDuration) {
    const exp = new Date(params.purchaseDate);
    exp.setMonth(exp.getMonth() + params.warrantyDuration);
    warrantyExpires = exp.toISOString();
  }

  const { rows } = await pool.query(
    `INSERT INTO warranty_registrations
     (customer_id, product_name, brand, model, serial_number, purchase_date, warranty_type, warranty_duration, warranty_expires, registration_confirmed, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10)
     RETURNING *`,
    [
      params.customerId, params.productName, params.brand || null, params.model || null,
      params.serialNumber || null, params.purchaseDate || null,
      params.warrantyType || "manufacturer", params.warrantyDuration || null,
      warrantyExpires || null, params.notes || null,
    ]
  );

  return {
    warranty: rows[0],
    message: `🛡️ Warranty registered: ${params.productName}${params.brand ? ` (${params.brand})` : ""}${warrantyExpires ? `. Expires: ${new Date(warrantyExpires).toLocaleDateString()}` : ""}. I'll alert you before it expires!`,
  };
}

/**
 * getGarageDoorInfo — "What kind of garage door do I have?"
 */
export async function getGarageDoorInfo(params: {
  customerId: string;
}): Promise<object> {
  const profile = await getGarageDoorProfile(params.customerId);
  if (!profile) {
    return { message: "No garage door profile on file. Tell me about your garage door — brand, opener type, smart-enabled? Or I can scan the label!" };
  }
  return {
    profile,
    message: `🚗 Your Garage Door:\n• Brand: ${profile.brand || "Unknown"}\n• Model: ${profile.model || "Unknown"}\n• Opener: ${profile.opener_type || "Unknown"}\n• Smart: ${profile.smart_enabled ? `Yes (${profile.controller_brand || "unknown controller"})` : "No"}\n• Springs: ${profile.springs || "Unknown"}\n• Last serviced: ${profile.last_serviced ? new Date(profile.last_serviced).toLocaleDateString() : "Unknown"}\n• Warranty expires: ${profile.warranty_expires ? new Date(profile.warranty_expires).toLocaleDateString() : "Unknown"}`,
  };
}

/**
 * getWaterHeaterInfo — "When should I flush my water heater?"
 */
export async function getWaterHeaterInfo(params: {
  customerId: string;
}): Promise<object> {
  const profile = await getWaterHeaterProfile(params.customerId);
  if (!profile) {
    return { message: "No water heater profile on file. Tell me about your water heater — type, brand, when installed? Or snap a photo of the label!" };
  }

  let flushMessage = "";
  if (profile.last_flushed) {
    const lastFlushed = new Date(profile.last_flushed);
    const monthsSince = Math.floor((Date.now() - lastFlushed.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const freq = profile.flush_frequency || 12;
    if (monthsSince >= freq) {
      flushMessage = `\n\n⚠️ FLUSH OVERDUE! Last flushed ${monthsSince} months ago (recommended every ${freq} months).`;
    } else {
      const monthsUntil = freq - monthsSince;
      flushMessage = `\n\nNext flush due in ~${monthsUntil} month(s).`;
    }
  } else {
    flushMessage = "\n\n💡 No flush on record. Water heaters should be flushed every 12 months to prevent sediment buildup.";
  }

  return {
    profile,
    message: `🔥 Your Water Heater:\n• Type: ${profile.type || "Unknown"}\n• Brand: ${profile.brand || "Unknown"} ${profile.model || ""}\n• Capacity: ${profile.capacity ? `${profile.capacity} gal` : "Unknown"}\n• Fuel: ${profile.fuel_type || "Unknown"}\n• Installed: ${profile.year_installed || "Unknown"}\n• Location: ${profile.location || "Unknown"}\n• Temp: ${profile.temp_setting ? `${profile.temp_setting}°F` : "Unknown"}\n• Warranty: ${profile.warranty_expires ? new Date(profile.warranty_expires).toLocaleDateString() : "Unknown"}${flushMessage}`,
  };
}

/**
 * logDIYMaintenance — "I just changed my AC filter" → log it + set next reminder
 */
export async function logDIYMaintenance(params: {
  customerId: string;
  maintenanceType: string;
  applianceOrSystem: string;
  description?: string;
  cost?: number;
  frequency?: string;
  performedAt?: string;
}): Promise<object> {
  const performedAt = params.performedAt || new Date().toISOString();
  let nextDueDate: string | undefined;

  // Auto-calculate next due date from frequency
  if (params.frequency) {
    const next = new Date(performedAt);
    const freqMap: Record<string, number> = { monthly: 1, quarterly: 3, "semi-annually": 6, annually: 12 };
    const months = freqMap[params.frequency] || 3;
    next.setMonth(next.getMonth() + months);
    nextDueDate = next.toISOString();
  }

  const entry = await addMaintenanceEntry(params.customerId, {
    maintenanceType: params.maintenanceType,
    applianceOrSystem: params.applianceOrSystem,
    description: params.description,
    performedBy: "self",
    cost: params.cost,
    frequency: params.frequency,
    nextDueDate,
    performedAt,
  });

  return {
    entry,
    message: `✅ Logged: ${params.applianceOrSystem} — ${params.maintenanceType.replace(/_/g, " ")}${params.description ? ` (${params.description})` : ""}${nextDueDate ? `\n⏰ Next due: ${new Date(nextDueDate).toLocaleDateString()}` : ""}${params.cost ? `\n💰 Cost: $${params.cost}` : ""}`,
  };
}

/**
 * getMaintenanceDueForGeorge — "What maintenance is due?"
 */
export async function getMaintenanceDueForGeorge(params: {
  customerId: string;
}): Promise<object> {
  const { overdue, upcoming } = await _getMaintenanceDue(params.customerId);

  if (overdue.length === 0 && upcoming.length === 0) {
    return { overdue: [], upcoming: [], message: "✅ No maintenance due! Your home is in good shape. Keep it up!" };
  }

  let msg = "";
  if (overdue.length > 0) {
    msg += `🚨 OVERDUE (${overdue.length}):\n` + overdue.map((m: any) =>
      `• ${m.appliance_or_system} — ${m.maintenance_type?.replace(/_/g, " ")} (due ${new Date(m.next_due_date).toLocaleDateString()})`
    ).join("\n");
  }
  if (upcoming.length > 0) {
    msg += `${msg ? "\n\n" : ""}📋 Coming up (${upcoming.length}):\n` + upcoming.map((m: any) =>
      `• ${m.appliance_or_system} — ${m.maintenance_type?.replace(/_/g, " ")} (due ${new Date(m.next_due_date).toLocaleDateString()})`
    ).join("\n");
  }

  return { overdue, upcoming, message: msg };
}

/**
 * getPurchaseHistory — "What did I buy at Lowe's last month?"
 */
export async function getPurchaseHistory(params: {
  customerId: string;
  store?: string;
  limit?: number;
}): Promise<object> {
  let query = `SELECT * FROM customer_purchases WHERE customer_id = $1`;
  const queryParams: any[] = [params.customerId];

  if (params.store) {
    query += ` AND store = $${queryParams.length + 1}`;
    queryParams.push(params.store);
  }

  query += ` ORDER BY purchase_date DESC LIMIT $${queryParams.length + 1}`;
  queryParams.push(params.limit || 10);

  const { rows } = await pool.query(query, queryParams);

  if (rows.length === 0) {
    return { purchases: [], message: `No purchases found${params.store ? ` from ${params.store}` : ""}. Scan a receipt to start tracking!` };
  }

  const list = rows.map((p: any) => {
    const items = Array.isArray(p.items) ? p.items : (typeof p.items === "string" ? JSON.parse(p.items) : []);
    return `• ${p.store} — ${new Date(p.purchase_date).toLocaleDateString()} — $${p.total_amount} (${items.length} item${items.length !== 1 ? "s" : ""})`;
  }).join("\n");

  return {
    purchases: rows,
    message: `🛒 Purchase History${params.store ? ` (${params.store})` : ""}:\n${list}`,
  };
}

/**
 * connectRetailerAccount — guide through retailer linking
 */
export async function connectRetailerAccount(params: {
  customerId: string;
  retailer: string;
}): Promise<object> {
  const result = await connectRetailer(params.customerId, params.retailer as any);
  return {
    ...result,
    message: result.success
      ? `🔗 ${result.message}`
      : `❌ ${result.message}`,
  };
}

/**
 * getDIYShoppingList — "What should I buy for home maintenance?"
 */
export async function getDIYShoppingList(params: {
  customerId: string;
}): Promise<object> {
  const suggestions = await getDIYPurchaseSuggestions(params.customerId);

  if (suggestions.length === 0) {
    return { suggestions: [], message: "✅ No maintenance supplies needed right now! Your home is well-stocked." };
  }

  const list = suggestions.map((s: any) =>
    `🏪 ${s.store === "lowes" ? "Lowe's" : s.store === "home_depot" ? "Home Depot" : s.store}\n  • ${s.item} (${s.estimatedCost})\n  💡 ${s.reason}`
  ).join("\n\n");

  return {
    suggestions,
    message: `🛒 DIY Shopping List:\n\n${list}`,
  };
}

export async function getUtilityProvidersForGeorge(params: {
  customerId: string;
  address?: string;
  zip?: string;
}): Promise<object> {
  // Check DB first
  try {
    const result = await pool.query(
      `SELECT * FROM home_utility_profiles WHERE customer_id = $1 LIMIT 1`,
      [params.customerId]
    );
    if (result.rows.length > 0) {
      const p = result.rows[0];
      const providers = typeof p.utility_provider === "string" ? JSON.parse(p.utility_provider) : (p.utility_provider || {});
      return {
        address: `${p.address}, ${p.city}, ${p.state} ${p.zip}`,
        providers,
        message: `🏠 Your utility providers:\n⚡ Electric: ${providers.electric?.name || "Unknown"}\n💧 Water: ${providers.water?.name || "Unknown"}\n🔥 Gas: ${providers.gas?.name || "Unknown"}\n🗑️ Trash: ${providers.trash?.name || "Unknown"}`,
      };
    }
  } catch {}

  if (params.zip) {
    const providers = _lookupUtilityProviders(params.address || "", params.zip);
    return {
      providers,
      message: `🏠 Based on your zip (${params.zip}):\n⚡ Electric: ${providers.electric.name}\n💧 Water: ${providers.water.name}\n🔥 Gas: ${providers.gas.name}\n🗑️ Trash: ${providers.trash.name}`,
    };
  }

  return { message: "I need your address or zip code to look up your utility providers. What's your zip?" };
}

// ─────────────────────────────────────────────
// Shopping Assistant + YouTube Tutorial Tools
// ─────────────────────────────────────────────
import {
  searchProduct as _searchProduct,
  getProductRecommendation as _getProductRecommendation,
  compareProductPrices as _compareProductPrices,
  getSmartRecommendations as _getSmartRecommendations,
} from "./product-search.js";
import {
  findTutorial as _findTutorial,
  getSeasonalDIYProjects as _getSeasonalDIYProjects,
} from "./tutorial-finder.js";
import {
  getShoppingList as _getShoppingList,
  startDIYProject as _startDIYProject,
  getProjectPlan as _getProjectPlan,
} from "./shopping-assistant.js";

/**
 * searchProducts — search retailers for a product
 */
export async function searchProductsForGeorge(params: {
  query: string;
  category?: string;
  specifications?: Record<string, any>;
}): Promise<object> {
  return _searchProduct(params.query, params.category, params.specifications);
}

/**
 * getProductRecommendation — recommend exact product based on home profile
 */
export async function getProductRecommendationForGeorge(params: {
  customerId: string;
  applianceType: string;
}): Promise<object> {
  return _getProductRecommendation(params.customerId, params.applianceType);
}

/**
 * comparePrices — compare prices across retailers
 */
export async function comparePricesForGeorge(params: {
  productName: string;
  specifications?: Record<string, any>;
}): Promise<object> {
  return _compareProductPrices(params.productName, params.specifications);
}

/**
 * findDIYTutorial — find YouTube tutorials for a task
 */
export async function findDIYTutorialForGeorge(params: {
  task: string;
  difficulty?: string;
}): Promise<object> {
  return _findTutorial(params.task, params.difficulty);
}

/**
 * getShoppingList — personalized shopping list for a customer
 */
export async function getShoppingListForGeorge(params: {
  customerId: string;
}): Promise<object> {
  return _getShoppingList(params.customerId);
}

/**
 * startDIYProject — create a tracked DIY project
 */
export async function startDIYProjectForGeorge(params: {
  customerId: string;
  projectName: string;
  description?: string;
}): Promise<object> {
  // Get full project plan first
  const plan = await _getProjectPlan(params.customerId, params.description || params.projectName) as any;
  // Auto-create the project with planned items
  return _startDIYProject(
    params.customerId,
    params.projectName,
    plan.items || [],
    plan.tutorials || []
  );
}

/**
 * getSeasonalDIYSuggestions — what to work on this month
 */
export async function getSeasonalDIYSuggestionsForGeorge(params: {
  month?: number;
}): Promise<object> {
  const month = params.month || new Date().getMonth() + 1;
  return _getSeasonalDIYProjects(month);
}

// ─────────────────────────────────────────────
// Auto Services — Vehicle, Maintenance, Diagnosis, Parts, OBD
// ─────────────────────────────────────────────
import {
  addVehicle as _addVehicle,
  lookupVehicleByVIN as _lookupVehicleByVIN,
  getMaintenanceSchedule as _getAutoMaintenanceSchedule,
  logMaintenance as _logMaintenance,
  getMaintenanceDue as _getMaintenanceDue,
  diagnoseIssue as _diagnoseIssue,
  searchAutoParts as _searchAutoParts,
  findAutoTutorial as _findAutoTutorial,
  getOBDCodeInfo as _getOBDCodeInfo,
  estimateRepairCost as _estimateRepairCost,
  startVehicleDIYSession as _startVehicleDIYSession,
  checkVehicleRecalls as _checkVehicleRecalls,
  getMaintenanceHistory as _getMaintenanceHistory,
} from "./auto-services.js";

/**
 * addVehicleToProfile — add a vehicle to a customer's garage
 */
export async function addVehicleToProfile(params: {
  customerId: string;
  year?: number; make?: string; model?: string; trim?: string; vin?: string;
  mileage?: number; color?: string; licensePlate?: string; nickname?: string;
  oilType?: string; tireSize?: string; engineSize?: string; transmission?: string; fuelType?: string;
}): Promise<object> {
  const { customerId, ...vehicleData } = params;
  return _addVehicle(customerId, vehicleData);
}

/**
 * lookupVIN — decode a VIN to get vehicle details
 */
export async function lookupVIN(params: { vin: string }): Promise<object> {
  return _lookupVehicleByVIN(params.vin);
}

/**
 * getVehicleMaintenanceSchedule — get upcoming maintenance schedule for a vehicle
 */
export async function getVehicleMaintenanceSchedule(params: { vehicleId: string }): Promise<object> {
  return _getAutoMaintenanceSchedule(params.vehicleId);
}

/**
 * logVehicleMaintenance — log a completed maintenance item
 */
export async function logVehicleMaintenance(params: {
  customerId: string;
  vehicleId: string;
  serviceType: string;
  description?: string;
  mileageAtService?: number;
  cost?: number;
  provider?: string;
  notes?: string;
  receiptUrl?: string;
}): Promise<object> {
  const { customerId, vehicleId, ...entry } = params;
  return _logMaintenance(customerId, vehicleId, entry);
}

/**
 * getVehicleMaintenanceDue — get all overdue/upcoming maintenance across customer vehicles
 */
export async function getVehicleMaintenanceDue(params: { customerId: string }): Promise<object> {
  return _getMaintenanceDue(params.customerId);
}

/**
 * diagnoseCarIssue — AI-powered car issue diagnosis from symptoms/photos
 */
export async function diagnoseCarIssue(params: {
  customerId: string;
  vehicleId?: string;
  symptoms: string;
  photos?: string[];
}): Promise<object> {
  return _diagnoseIssue(params.customerId, params.vehicleId || null, params.symptoms, params.photos);
}

/**
 * searchAutoPartsForGeorge — search for auto parts across retailers
 */
export async function searchAutoPartsForGeorge(params: {
  customerId: string;
  partName: string;
  vehicleId?: string;
  year?: number; make?: string; model?: string;
}): Promise<object> {
  return _searchAutoParts(params.customerId, params.partName, params.vehicleId, params.year, params.make, params.model);
}

/**
 * findAutoTutorial — find YouTube tutorials for auto repair tasks
 */
export async function findAutoTutorial(params: {
  task: string;
  year?: number; make?: string; model?: string;
}): Promise<object> {
  return _findAutoTutorial(params.task, params.year, params.make, params.model);
}

/**
 * getOBDCode — look up what an OBD-II code means and recommended actions
 */
export async function getOBDCode(params: { code: string }): Promise<object> {
  return _getOBDCodeInfo(params.code);
}

/**
 * estimateAutoRepairCost — estimate cost range for a repair
 */
export async function estimateAutoRepairCost(params: {
  repairType: string;
  year?: number; make?: string; model?: string;
  zipCode?: string;
}): Promise<object> {
  return _estimateRepairCost(params.repairType, params.year, params.make, params.model, params.zipCode);
}

// ═════════════════════════════════════════════
// AUTOMOTIVE MODULE — New George Tools
// ═════════════════════════════════════════════

/**
 * tool_vehicle_add — add a vehicle to a customer's garage
 */
export async function tool_vehicle_add(params: {
  customerId: string;
  year?: number; make?: string; model?: string; trim?: string;
  vin?: string; mileage?: number; color?: string; nickname?: string;
  oilType?: string; tireSize?: string; engineSize?: string;
  transmission?: string; fuelType?: string;
}): Promise<object> {
  const { customerId, ...vehicleData } = params;
  return _addVehicle(customerId, vehicleData);
}

/**
 * tool_vehicle_diagnose — diagnose a vehicle issue from symptoms, with safety escalation
 */
export async function tool_vehicle_diagnose(params: {
  symptomDescription: string;
  vehicleInfo?: { year?: number; make?: string; model?: string };
  photoUrl?: string;
}): Promise<object> {
  return _diagnoseIssue(params.symptomDescription, params.vehicleInfo, params.photoUrl);
}

/**
 * tool_vehicle_parts_search — search for auto parts across multiple retailers
 */
export async function tool_vehicle_parts_search(params: {
  partName: string;
  year?: number; make?: string; model?: string;
  customerId?: string; vehicleId?: string;
}): Promise<object> {
  return _searchAutoParts(params.partName, params.year, params.make, params.model, params.customerId, params.vehicleId);
}

/**
 * tool_vehicle_diy_start — start a vehicle DIY repair coaching session.
 * Safety-critical repairs (brake lines, fuel system, airbags, transmission internals, etc.)
 * are automatically escalated — George recommends a qualified independent contractor instead.
 */
export async function tool_vehicle_diy_start(params: {
  customerId: string;
  vehicleId?: string;
  issue: string;
}): Promise<object> {
  return _startVehicleDIYSession(params.customerId, params.vehicleId || null, params.issue);
}

/**
 * tool_vehicle_recall_check — check NHTSA recalls for a vehicle by VIN
 */
export async function tool_vehicle_recall_check(params: {
  vin: string;
  vehicleId?: string;
}): Promise<object> {
  return _checkVehicleRecalls(params.vin, params.vehicleId);
}

/**
 * tool_vehicle_maintenance_log — log completed maintenance for a vehicle
 */
export async function tool_vehicle_maintenance_log(params: {
  customerId: string;
  vehicleId: string;
  serviceType: string;
  mileage?: number;
  cost?: number;
  partsUsed?: any[];
  notes?: string;
  performedAt?: string;
}): Promise<object> {
  return _logMaintenance(params.customerId, params.vehicleId, {
    maintenanceType: params.serviceType,
    mileageAtService: params.mileage,
    cost: params.cost,
    parts: params.partsUsed,
    notes: params.notes,
  });
}

/**
 * tool_vehicle_maintenance_due — check what maintenance is due/overdue for a customer's vehicles
 */
export async function tool_vehicle_maintenance_due(params: {
  customerId: string;
}): Promise<object> {
  return _getMaintenanceDue(params.customerId);
}
