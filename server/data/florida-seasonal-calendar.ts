/**
 * Florida Seasonal Home Maintenance Calendar
 * Month-by-month recommendations for Florida homeowners
 */

export interface MaintenanceRecommendation {
  service: string;
  serviceType: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

// Month index 0-11
const MONTHLY_RECOMMENDATIONS: Record<number, MaintenanceRecommendation[]> = {
  0: [ // January
    { service: "HVAC Inspection", serviceType: "hvac", reason: "Annual heating system check before cold snaps", priority: "medium" },
    { service: "Pest Control", serviceType: "pest_control", reason: "Quarterly pest prevention treatment", priority: "medium" },
  ],
  1: [ // February
    { service: "Landscaping Cleanup", serviceType: "landscaping", reason: "Pre-spring yard cleanup and mulching", priority: "low" },
    { service: "Pressure Washing", serviceType: "pressure_washing", reason: "Remove winter mildew before spring", priority: "medium" },
  ],
  2: [ // March
    { service: "AC Maintenance", serviceType: "hvac", reason: "Service AC before Florida heat kicks in - avoid breakdowns", priority: "high" },
    { service: "Pressure Washing", serviceType: "pressure_washing", reason: "Spring cleaning for driveways, patios, and siding", priority: "medium" },
  ],
  3: [ // April
    { service: "Pool Cleaning", serviceType: "pool_cleaning", reason: "Pool season starting - get it swim-ready", priority: "high" },
    { service: "Pest Control", serviceType: "pest_control", reason: "Quarterly pest prevention - spring bugs are active", priority: "medium" },
    { service: "Landscaping", serviceType: "landscaping", reason: "Spring planting season and lawn fertilization", priority: "medium" },
  ],
  4: [ // May
    { service: "Gutter Cleaning", serviceType: "gutter_cleaning", reason: "Clear gutters before summer rainy season", priority: "high" },
    { service: "Home Cleaning", serviceType: "home_cleaning", reason: "Deep spring cleaning", priority: "low" },
  ],
  5: [ // June - Hurricane season starts
    { service: "Hurricane Prep", serviceType: "handyman", reason: "Hurricane season started - check shutters, trim trees, secure yard", priority: "high" },
    { service: "AC Checkup", serviceType: "hvac", reason: "Peak heat - ensure AC is running efficiently", priority: "high" },
  ],
  6: [ // July
    { service: "Pest Control", serviceType: "pest_control", reason: "Quarterly treatment - summer pests at peak", priority: "medium" },
    { service: "Pool Maintenance", serviceType: "pool_cleaning", reason: "Peak pool usage - check chemicals and equipment", priority: "medium" },
  ],
  7: [ // August
    { service: "Hurricane Prep Check", serviceType: "handyman", reason: "Peak hurricane season - verify storm readiness", priority: "high" },
    { service: "Roof Inspection", serviceType: "handyman", reason: "Check roof before peak storm months", priority: "high" },
  ],
  8: [ // September
    { service: "Hurricane Prep", serviceType: "handyman", reason: "Peak hurricane month - final storm prep check", priority: "high" },
    { service: "AC Filter Change", serviceType: "hvac", reason: "Replace filters after heavy summer use", priority: "medium" },
  ],
  9: [ // October
    { service: "Gutter Cleaning", serviceType: "gutter_cleaning", reason: "Clear fall debris and prep for winter rains", priority: "high" },
    { service: "Pest Control", serviceType: "pest_control", reason: "Quarterly pest prevention - rodents seek shelter", priority: "medium" },
    { service: "Pressure Washing", serviceType: "pressure_washing", reason: "Remove summer algae and mildew buildup", priority: "medium" },
  ],
  10: [ // November
    { service: "Gutter Cleaning", serviceType: "gutter_cleaning", reason: "Final leaf cleanup before holidays", priority: "medium" },
    { service: "HVAC Tune-up", serviceType: "hvac", reason: "Prep heating for cooler months", priority: "low" },
    { service: "Landscaping", serviceType: "landscaping", reason: "Fall planting and yard winterization", priority: "low" },
  ],
  11: [ // December
    { service: "Home Cleaning", serviceType: "home_cleaning", reason: "Holiday deep clean", priority: "low" },
    { service: "Handyman Services", serviceType: "handyman", reason: "Year-end home repairs and touch-ups", priority: "low" },
  ],
};

/**
 * Returns upcoming maintenance recommendations based on what services
 * have been recently completed. Looks at current month + next 2 months.
 */
export function getUpcomingMaintenance(
  lastServices: Record<string, Date>
): MaintenanceRecommendation[] {
  const now = new Date();
  const currentMonth = now.getMonth();
  const results: MaintenanceRecommendation[] = [];
  const seen = new Set<string>();

  // Check current month + next 2 months
  for (let offset = 0; offset <= 2; offset++) {
    const month = (currentMonth + offset) % 12;
    const recs = MONTHLY_RECOMMENDATIONS[month] || [];

    for (const rec of recs) {
      if (seen.has(rec.serviceType)) continue;

      const lastDone = lastServices[rec.serviceType];
      // Recommend if never done or done more than 60 days ago
      if (!lastDone || (now.getTime() - lastDone.getTime()) > 60 * 24 * 60 * 60 * 1000) {
        results.push(rec);
        seen.add(rec.serviceType);
      }
    }
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  results.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return results;
}

/**
 * Calculate a Home Health Score (0-100) based on:
 * - Recency of last service (0-40 points)
 * - Number of unique services used (0-30 points)
 * - Seasonal maintenance status (0-30 points)
 */
export function calculateHomeHealthScore(
  lastServiceDate: Date | null,
  uniqueServicesUsed: number,
  lastServices: Record<string, Date>
): number {
  let score = 0;

  // Recency score (0-40): full marks if service within 30 days, degrades over 180 days
  if (lastServiceDate) {
    const daysSince = (Date.now() - lastServiceDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince <= 30) score += 40;
    else if (daysSince <= 60) score += 32;
    else if (daysSince <= 90) score += 24;
    else if (daysSince <= 120) score += 16;
    else if (daysSince <= 180) score += 8;
    // 0 if > 180 days
  }

  // Service diversity score (0-30): more types = healthier home
  const diversityScore = Math.min(uniqueServicesUsed * 5, 30);
  score += diversityScore;

  // Seasonal compliance (0-30): how many upcoming recs are already covered
  const upcoming = getUpcomingMaintenance({});
  const totalRecs = upcoming.length || 1;
  const coveredRecs = upcoming.filter((rec) => {
    const lastDone = lastServices[rec.serviceType];
    return lastDone && (Date.now() - lastDone.getTime()) < 90 * 24 * 60 * 60 * 1000;
  }).length;
  score += Math.round((coveredRecs / totalRecs) * 30);

  return Math.min(Math.max(score, 0), 100);
}
