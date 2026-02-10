/**
 * Property Health Score Calculator
 *
 * Calculates a 1-100 "credit score for your home" based on 8 categories:
 * 1. Roof (20%)
 * 2. HVAC (20%)
 * 3. Exterior (15%)
 * 4. Interior (10%)
 * 5. Landscape (10%)
 * 6. Pool (10% if applicable, redistributed if no pool)
 * 7. Appliances (10%)
 * 8. Maintenance (5%)
 *
 * Each category scored 0-100, weighted average = overall score.
 */

import {
  getPropertyById,
  updatePropertyHealthScore,
  getAppliancesByProperty,
  getActiveWarranties,
  getHealthEventsByProperty,
  getMaintenanceTasksByProperty,
} from "../storage/domains/properties/storage";
import type { Property, PropertyAppliance, PropertyWarranty, PropertyHealthEvent, PropertyMaintenanceSchedule } from "../../shared/schema";

interface CategoryScore {
  score: number; // 0-100
  weight: number; // 0-1 (percentage)
  factors: string[]; // What influenced this score
}

interface HealthScoreResult {
  overallScore: number; // 0-100
  breakdown: {
    roof: CategoryScore;
    hvac: CategoryScore;
    exterior: CategoryScore;
    interior: CategoryScore;
    landscape: CategoryScore;
    pool: CategoryScore | null;
    appliances: CategoryScore;
    maintenance: CategoryScore;
  };
}

// ==========================================
// CATEGORY CALCULATORS
// ==========================================

function calculateRoofScore(property: Property, events: PropertyHealthEvent[]): CategoryScore {
  let score = 100;
  const factors: string[] = [];

  // Age factor (most important)
  const roofAge = property.roofAgeYears || 15; // Default to 15 if unknown
  if (roofAge >= 25) {
    score -= 40;
    factors.push("Roof age 25+ years (past expected life)");
  } else if (roofAge >= 20) {
    score -= 30;
    factors.push("Roof age 20-25 years (nearing replacement)");
  } else if (roofAge >= 15) {
    score -= 15;
    factors.push("Roof age 15-20 years (mid-life)");
  } else if (roofAge >= 10) {
    score -= 5;
    factors.push("Roof age 10-15 years");
  } else {
    factors.push("Roof age <10 years (excellent)");
  }

  // Recent maintenance/repairs (positive)
  const roofEvents = events.filter((e) =>
    ["roof_inspection", "roof_repair", "roof_replacement", "roof_cleaning"].includes(e.eventType)
  );
  const recentRoofWork = roofEvents.filter((e) => {
    const eventDate = new Date(e.eventDate);
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
    return eventDate > sixMonthsAgo;
  });

  if (recentRoofWork.length > 0) {
    score += 10;
    factors.push(`Recent roof work: ${recentRoofWork.length} event(s) in last 6 months`);
  }

  // Climate factor (Florida-specific)
  if (property.state === "FL") {
    score -= 5; // FL weather is harsh on roofs
    factors.push("Florida climate adjustment");
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    weight: 0.2,
    factors,
  };
}

function calculateHvacScore(property: Property, appliances: PropertyAppliance[], events: PropertyHealthEvent[]): CategoryScore {
  let score = 100;
  const factors: string[] = [];

  // Find HVAC appliance
  const hvac = appliances.find((a) => a.category === "hvac");

  if (hvac) {
    const age = hvac.estimatedAgeYears || property.hvacAgeYears || 10;

    if (age >= 20) {
      score -= 40;
      factors.push("HVAC age 20+ years (past expected life)");
    } else if (age >= 15) {
      score -= 30;
      factors.push("HVAC age 15-20 years (nearing replacement)");
    } else if (age >= 10) {
      score -= 15;
      factors.push("HVAC age 10-15 years (mid-life)");
    } else if (age >= 5) {
      score -= 5;
      factors.push("HVAC age 5-10 years");
    } else {
      factors.push("HVAC age <5 years (excellent)");
    }

    // Condition factor
    if (hvac.condition === "excellent") {
      score += 5;
      factors.push("HVAC condition: excellent");
    } else if (hvac.condition === "poor" || hvac.condition === "needs_replacement") {
      score -= 15;
      factors.push("HVAC condition: poor");
    }
  } else {
    score -= 10;
    factors.push("No HVAC appliance registered");
  }

  // Recent service (positive)
  const hvacEvents = events.filter((e) =>
    ["hvac_service", "hvac_repair", "hvac_replacement", "hvac_filter_change"].includes(e.eventType)
  );
  const recentService = hvacEvents.filter((e) => {
    const eventDate = new Date(e.eventDate);
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
    return eventDate > sixMonthsAgo;
  });

  if (recentService.length > 0) {
    score += 10;
    factors.push(`Recent HVAC service: ${recentService.length} event(s) in last 6 months`);
  } else if (hvacEvents.length === 0) {
    score -= 10;
    factors.push("No HVAC service history");
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    weight: 0.2,
    factors,
  };
}

function calculateExteriorScore(property: Property, events: PropertyHealthEvent[]): CategoryScore {
  let score = 100;
  const factors: string[] = [];

  // Recent pressure washing (positive)
  const pressureWashing = events.filter((e) => e.eventType === "pressure_washing");
  const recentWash = pressureWashing.filter((e) => {
    const eventDate = new Date(e.eventDate);
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    return eventDate > oneYearAgo;
  });

  if (recentWash.length > 0) {
    score += 5;
    factors.push("Recent pressure washing");
  } else if (property.state === "FL") {
    score -= 10;
    factors.push("No pressure washing in 1+ year (FL homes need annual washing)");
  }

  // Recent painting/siding work
  const exteriorWork = events.filter((e) =>
    ["exterior_painting", "siding_repair", "siding_replacement", "window_replacement"].includes(e.eventType)
  );

  if (exteriorWork.length > 0) {
    const mostRecent = new Date(exteriorWork[0].eventDate);
    const yearsAgo = (Date.now() - mostRecent.getTime()) / (365 * 24 * 60 * 60 * 1000);

    if (yearsAgo < 5) {
      score += 10;
      factors.push("Recent exterior work (within 5 years)");
    } else if (yearsAgo > 15) {
      score -= 15;
      factors.push("Exterior work 15+ years old");
    }
  } else {
    score -= 10;
    factors.push("No exterior maintenance history");
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    weight: 0.15,
    factors,
  };
}

function calculateInteriorScore(property: Property, events: PropertyHealthEvent[]): CategoryScore {
  let score = 100;
  const factors: string[] = [];

  // Recent interior work
  const interiorWork = events.filter((e) =>
    [
      "interior_painting",
      "flooring_installation",
      "flooring_repair",
      "carpet_cleaning",
      "carpet_replacement",
      "cabinet_installation",
      "countertop_installation",
    ].includes(e.eventType)
  );

  if (interiorWork.length > 0) {
    score += 10;
    factors.push(`${interiorWork.length} interior improvement(s)`);
  }

  // Carpet cleaning (if applicable)
  const carpetCleaning = events.filter((e) => e.eventType === "carpet_cleaning");
  if (carpetCleaning.length > 0) {
    score += 5;
    factors.push("Regular carpet cleaning");
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    weight: 0.1,
    factors,
  };
}

function calculateLandscapeScore(property: Property, events: PropertyHealthEvent[]): CategoryScore {
  let score = 100;
  const factors: string[] = [];

  // Recent landscaping service
  const landscapeEvents = events.filter((e) =>
    ["landscape_service", "landscape_installation", "tree_trimming", "sod_installation"].includes(e.eventType)
  );

  const recentService = landscapeEvents.filter((e) => {
    const eventDate = new Date(e.eventDate);
    const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000);
    return eventDate > sixMonthsAgo;
  });

  if (recentService.length > 0) {
    score += 10;
    factors.push(`Recent landscape service: ${recentService.length} event(s)`);
  } else if (landscapeEvents.length === 0) {
    score -= 10;
    factors.push("No landscape maintenance history");
  }

  // Irrigation system
  const irrigation = events.filter((e) => ["irrigation_installation", "irrigation_repair"].includes(e.eventType));
  if (irrigation.length > 0) {
    score += 5;
    factors.push("Irrigation system maintained");
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    weight: 0.1,
    factors,
  };
}

function calculatePoolScore(property: Property, events: PropertyHealthEvent[]): CategoryScore | null {
  if (!property.hasPool) return null;

  let score = 100;
  const factors: string[] = [];

  // Recent pool service
  const poolEvents = events.filter((e) =>
    ["pool_service", "pool_repair", "pool_equipment_replacement", "pool_resurfacing"].includes(e.eventType)
  );

  const recentService = poolEvents.filter((e) => {
    const eventDate = new Date(e.eventDate);
    const threeMonthsAgo = new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000);
    return eventDate > threeMonthsAgo;
  });

  if (recentService.length > 0) {
    score += 15;
    factors.push(`Recent pool service: ${recentService.length} event(s)`);
  } else if (poolEvents.length === 0) {
    score -= 20;
    factors.push("No pool maintenance history");
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    weight: 0.1,
    factors,
  };
}

function calculateApplianceScore(appliances: PropertyAppliance[], warranties: PropertyWarranty[]): CategoryScore {
  let score = 100;
  const factors: string[] = [];

  if (appliances.length === 0) {
    score = 50;
    factors.push("No appliances registered");
    return { score, weight: 0.1, factors };
  }

  // Average appliance age
  const appliancesWithAge = appliances.filter((a) => a.estimatedAgeYears);
  if (appliancesWithAge.length > 0) {
    const avgAge = appliancesWithAge.reduce((sum, a) => sum + (a.estimatedAgeYears || 0), 0) / appliancesWithAge.length;

    if (avgAge < 5) {
      score += 10;
      factors.push("Appliances avg age <5 years");
    } else if (avgAge > 15) {
      score -= 20;
      factors.push("Appliances avg age >15 years");
    } else if (avgAge > 10) {
      score -= 10;
      factors.push("Appliances avg age >10 years");
    }
  }

  // Appliances with active warranties
  const appliancesWithWarranty = appliances.filter((a) =>
    warranties.some((w) => w.applianceId === a.id && w.status === "active")
  );
  const warrantyRate = appliancesWithWarranty.length / appliances.length;

  if (warrantyRate > 0.5) {
    score += 10;
    factors.push(`${Math.round(warrantyRate * 100)}% of appliances under warranty`);
  } else if (warrantyRate === 0) {
    score -= 10;
    factors.push("No appliances under warranty");
  }

  // Appliances needing replacement
  const needsReplacement = appliances.filter((a) => a.condition === "needs_replacement");
  if (needsReplacement.length > 0) {
    score -= 15 * needsReplacement.length;
    factors.push(`${needsReplacement.length} appliance(s) need replacement`);
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    weight: 0.1,
    factors,
  };
}

function calculateMaintenanceScore(
  property: Property,
  maintenanceTasks: PropertyMaintenanceSchedule[]
): CategoryScore {
  let score = 100;
  const factors: string[] = [];

  const activeTasks = maintenanceTasks.filter((t) => t.isActive);

  if (activeTasks.length === 0) {
    score = 50;
    factors.push("No maintenance schedule set up");
    return { score, weight: 0.05, factors };
  }

  // Overdue tasks (negative)
  const overdue = activeTasks.filter((t) => t.isOverdue);
  if (overdue.length > 0) {
    score -= 30 * overdue.length;
    factors.push(`${overdue.length} overdue maintenance task(s)`);
  }

  // Completed tasks (positive)
  const completed = activeTasks.filter((t) => t.lastCompletedDate);
  const completionRate = completed.length / activeTasks.length;

  if (completionRate > 0.8) {
    score += 20;
    factors.push(`${Math.round(completionRate * 100)}% tasks completed`);
  } else if (completionRate < 0.3) {
    score -= 20;
    factors.push(`Only ${Math.round(completionRate * 100)}% tasks completed`);
  }

  // Total jobs completed (from property stats)
  if (property.totalJobsCompleted && property.totalJobsCompleted > 10) {
    score += 10;
    factors.push(`${property.totalJobsCompleted} total jobs completed`);
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    weight: 0.05,
    factors,
  };
}

// ==========================================
// OVERALL CALCULATOR
// ==========================================

export async function calculatePropertyHealthScore(propertyId: string): Promise<HealthScoreResult> {
  // Fetch all related data
  const property = await getPropertyById(propertyId);
  if (!property) {
    throw new Error(`Property ${propertyId} not found`);
  }

  const appliances = await getAppliancesByProperty(propertyId);
  const warranties = await getActiveWarranties(propertyId);
  const events = await getHealthEventsByProperty(propertyId);
  const maintenanceTasks = await getMaintenanceTasksByProperty(propertyId);

  // Calculate each category
  const roof = calculateRoofScore(property, events);
  const hvac = calculateHvacScore(property, appliances, events);
  const exterior = calculateExteriorScore(property, events);
  const interior = calculateInteriorScore(property, events);
  const landscape = calculateLandscapeScore(property, events);
  const pool = calculatePoolScore(property, events);
  const appliancesScore = calculateApplianceScore(appliances, warranties);
  const maintenance = calculateMaintenanceScore(property, maintenanceTasks);

  // Calculate weighted average
  let totalWeight = roof.weight + hvac.weight + exterior.weight + interior.weight + landscape.weight + appliancesScore.weight + maintenance.weight;

  // If no pool, redistribute pool weight proportionally
  if (!pool) {
    const redistributionFactor = 1 + 0.1 / totalWeight;
    roof.weight *= redistributionFactor;
    hvac.weight *= redistributionFactor;
    exterior.weight *= redistributionFactor;
    interior.weight *= redistributionFactor;
    landscape.weight *= redistributionFactor;
    appliancesScore.weight *= redistributionFactor;
    maintenance.weight *= redistributionFactor;
    totalWeight += 0.1;
  } else {
    totalWeight += pool.weight;
  }

  const overallScore =
    roof.score * roof.weight +
    hvac.score * hvac.weight +
    exterior.score * exterior.weight +
    interior.score * interior.weight +
    landscape.score * landscape.weight +
    (pool ? pool.score * pool.weight : 0) +
    appliancesScore.score * appliancesScore.weight +
    maintenance.score * maintenance.weight;

  return {
    overallScore: Math.round(overallScore),
    breakdown: {
      roof,
      hvac,
      exterior,
      interior,
      landscape,
      pool,
      appliances: appliancesScore,
      maintenance,
    },
  };
}

// ==========================================
// UPDATE PROPERTY WITH NEW SCORE
// ==========================================

export async function updatePropertyHealth(propertyId: string): Promise<void> {
  const result = await calculatePropertyHealthScore(propertyId);

  await updatePropertyHealthScore(propertyId, result.overallScore, {
    roof: result.breakdown.roof.score,
    hvac: result.breakdown.hvac.score,
    exterior: result.breakdown.exterior.score,
    interior: result.breakdown.interior.score,
    landscape: result.breakdown.landscape.score,
    pool: result.breakdown.pool?.score,
    appliances: result.breakdown.appliances.score,
    maintenance: result.breakdown.maintenance.score,
  });

  console.log(`[PropertyHealth] Updated property ${propertyId}: ${result.overallScore}/100`);
}
