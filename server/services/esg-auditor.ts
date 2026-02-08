import { storage } from "../storage";
import { db } from "../db";
import { esgImpactLogs, dispatchBatches, disposalRecommendations } from "@shared/schema";
import { sql, eq } from "drizzle-orm";

export async function runNightlyEsgAudit(): Promise<void> {
  console.log("[ESG Auditor] Starting nightly sustainability audit...");

  try {
    const esgAgg = await db.select({
      totalJobs: sql<number>`count(*)::int`,
      totalCo2EmittedKg: sql<number>`coalesce(sum(${esgImpactLogs.carbonFootprintLbs} * 0.453592), 0)`,
      totalRecycledLbs: sql<number>`coalesce(sum(${esgImpactLogs.recycledWeightLbs}), 0)`,
      totalDonatedLbs: sql<number>`coalesce(sum(${esgImpactLogs.donatedWeightLbs}), 0)`,
      totalEwasteLbs: sql<number>`coalesce(sum(${esgImpactLogs.eWasteWeightLbs}), 0)`,
      totalLandfilledLbs: sql<number>`coalesce(sum(${esgImpactLogs.landfilledWeightLbs}), 0)`,
      totalWaterSaved: sql<number>`coalesce(sum(${esgImpactLogs.waterSavedGallons}), 0)`,
      totalEnergySaved: sql<number>`coalesce(sum(${esgImpactLogs.energySavedKwh}), 0)`,
      avgDiversionRate: sql<number>`coalesce(avg(${esgImpactLogs.diversionRate}), 0)`,
      totalTreesEquivalent: sql<number>`coalesce(sum(${esgImpactLogs.treesEquivalent}), 0)`,
      totalCarbonOffsets: sql<number>`coalesce(sum(CASE WHEN ${esgImpactLogs.carbonOffsetPurchased} = true THEN ${esgImpactLogs.carbonOffsetCost} ELSE 0 END), 0)`,
    }).from(esgImpactLogs);

    const dispatchAgg = await db.select({
      totalDeadheadSaved: sql<number>`coalesce(sum(${dispatchBatches.deadheadMilesSaved}), 0)`,
      totalCo2SavedFromDispatch: sql<number>`coalesce(sum(${dispatchBatches.co2SavedLbs} * 0.453592), 0)`,
    }).from(dispatchBatches);

    const disposalAgg = await db.select({
      co2AvoidedFromDisposal: sql<number>`coalesce(sum(${disposalRecommendations.co2AvoidedLbs} * 0.453592), 0)`,
    }).from(disposalRecommendations).where(eq(disposalRecommendations.status, "completed"));

    const esg = esgAgg[0];
    const dispatch = dispatchAgg[0];
    const disposal = disposalAgg[0];

    const totalDivertedLbs = (esg?.totalRecycledLbs || 0) + (esg?.totalDonatedLbs || 0) + (esg?.totalEwasteLbs || 0);

    const recyclingCo2AvoidedKg = (esg?.totalRecycledLbs || 0) * 0.5 * 0.453592;
    const donationCo2AvoidedKg = (esg?.totalDonatedLbs || 0) * 0.8 * 0.453592;
    const ewasteCo2AvoidedKg = (esg?.totalEwasteLbs || 0) * 2.0 * 0.453592;

    const totalCo2SavedKg =
      recyclingCo2AvoidedKg +
      donationCo2AvoidedKg +
      ewasteCo2AvoidedKg +
      (dispatch?.totalCo2SavedFromDispatch || 0) +
      (disposal?.co2AvoidedFromDisposal || 0);

    const treesEquivalent = totalCo2SavedKg / 22;

    const stats = await storage.upsertPlatformSustainabilityStats({
      totalJobsAudited: esg?.totalJobs || 0,
      totalCo2SavedKg: parseFloat(totalCo2SavedKg.toFixed(2)),
      totalCo2EmittedKg: parseFloat((esg?.totalCo2EmittedKg || 0).toFixed(2)),
      totalLandfillDivertedLbs: parseFloat(totalDivertedLbs.toFixed(2)),
      totalRecycledLbs: parseFloat((esg?.totalRecycledLbs || 0).toFixed(2)),
      totalDonatedLbs: parseFloat((esg?.totalDonatedLbs || 0).toFixed(2)),
      totalEwasteLbs: parseFloat((esg?.totalEwasteLbs || 0).toFixed(2)),
      totalLandfilledLbs: parseFloat((esg?.totalLandfilledLbs || 0).toFixed(2)),
      treesEquivalent: parseFloat(treesEquivalent.toFixed(2)),
      waterSavedGallons: parseFloat((esg?.totalWaterSaved || 0).toFixed(2)),
      energySavedKwh: parseFloat((esg?.totalEnergySaved || 0).toFixed(2)),
      avgDiversionRate: parseFloat(((esg?.avgDiversionRate || 0) * 100).toFixed(1)),
      deadheadMilesSaved: parseFloat((dispatch?.totalDeadheadSaved || 0).toFixed(2)),
      totalCarbonOffsetsPurchased: parseFloat((esg?.totalCarbonOffsets || 0).toFixed(2)),
      lastAuditedAt: new Date().toISOString(),
    });

    console.log(`[ESG Auditor] Audit complete:
      Jobs audited: ${stats.totalJobsAudited}
      CO2 saved: ${stats.totalCo2SavedKg} kg (${(stats.totalCo2SavedKg! / 1000).toFixed(3)} tonnes)
      Landfill diverted: ${stats.totalLandfillDivertedLbs} lbs
      Trees equivalent: ${stats.treesEquivalent}
      Deadhead miles saved: ${stats.deadheadMilesSaved}
    `);
  } catch (error) {
    console.error("[ESG Auditor] Error during nightly audit:", error);
  }
}

let auditorInterval: ReturnType<typeof setInterval> | null = null;

export function startEsgAuditor(): void {
  runNightlyEsgAudit();

  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const msUntilMidnight = midnight.getTime() - now.getTime();

  setTimeout(() => {
    runNightlyEsgAudit();
    auditorInterval = setInterval(() => {
      runNightlyEsgAudit();
    }, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);

  console.log(`[ESG Auditor] Scheduled nightly audit. Next run at midnight (${Math.round(msUntilMidnight / 60000)} minutes from now)`);
}

export function stopEsgAuditor(): void {
  if (auditorInterval) {
    clearInterval(auditorInterval);
    auditorInterval = null;
  }
}
