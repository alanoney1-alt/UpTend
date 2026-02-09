/**
 * Cross-Sell Suggestion Engine
 * Recommends complementary services after initial service selection
 */

export interface CrossSellSuggestion {
  serviceId: string;
  suggestedService: string;
  headline: string;
  description: string;
  badge?: string;
}

/**
 * Cross-sell matrix: What to suggest based on what's already selected
 */
export const CROSS_SELL_MATRIX: Record<string, CrossSellSuggestion> = {
  junk_removal: {
    serviceId: "junk_removal",
    suggestedService: "home_cleaning",
    headline: "Now that the clutter is gone, let us make it shine",
    description: "Add a PolishUp™ deep clean and transform your space completely.",
    badge: "Perfect Combo",
  },
  home_cleaning: {
    serviceId: "home_cleaning",
    suggestedService: "recurring",
    headline: "Keep it this clean - biweekly saves 10%",
    description: "Schedule recurring PolishUp™ service and save on every visit.",
    badge: "Save 10%",
  },
  pressure_washing: {
    serviceId: "pressure_washing",
    suggestedService: "gutter_cleaning",
    headline: "While we're at the exterior, want gutters too?",
    description: "Complete your exterior refresh with GutterFlush™ gutter cleaning.",
    badge: "Bundle & Save",
  },
  gutter_cleaning: {
    serviceId: "gutter_cleaning",
    suggestedService: "pressure_washing",
    headline: "Complete the exterior refresh",
    description: "Add FreshWash™ pressure washing to make your home's exterior sparkle.",
    badge: "Curb Appeal Package",
  },
  moving_labor: {
    serviceId: "moving_labor",
    suggestedService: "home_cleaning",
    headline: "Need a move-out clean at your old place?",
    description: "Add PolishUp™ move-out clean and leave your old home spotless.",
  },
  light_demolition: {
    serviceId: "light_demolition",
    suggestedService: "junk_removal",
    headline: "Debris from the demo? We'll haul it all.",
    description: "Add BulkSnap™ junk removal to clear out all the demolition debris.",
  },
  garage_cleanout: {
    serviceId: "garage_cleanout",
    suggestedService: "home_cleaning",
    headline: "Garage is done — want the house to match?",
    description: "Add PolishUp™ deep clean and get your whole home in order.",
  },
  truck_unloading: {
    serviceId: "truck_unloading",
    suggestedService: "home_cleaning",
    headline: "Just moved in? Start fresh with a deep clean.",
    description: "Add PolishUp™ deep clean before unpacking and settle into a spotless home.",
  },
  home_consultation: {
    serviceId: "home_consultation",
    suggestedService: "audit_recommendations",
    headline: "Book recommended services from your audit",
    description: "After your DwellScan™, we'll recommend specific services based on what we find.",
  },
};

/**
 * Get cross-sell suggestion for a selected service
 */
export function getCrossSellSuggestion(serviceId: string): CrossSellSuggestion | null {
  return CROSS_SELL_MATRIX[serviceId] || null;
}

/**
 * Get multiple cross-sell suggestions for a list of services
 */
export function getCrossSellSuggestions(selectedServices: string[]): CrossSellSuggestion[] {
  const suggestions: CrossSellSuggestion[] = [];
  const suggestedServiceIds = new Set<string>();

  for (const serviceId of selectedServices) {
    const suggestion = CROSS_SELL_MATRIX[serviceId];
    if (suggestion && !suggestedServiceIds.has(suggestion.suggestedService)) {
      // Only suggest if not already selected
      if (!selectedServices.includes(suggestion.suggestedService)) {
        suggestions.push(suggestion);
        suggestedServiceIds.add(suggestion.suggestedService);
      }
    }
  }

  return suggestions;
}

/**
 * Check if two services are complementary
 */
export function areServicesComplementary(serviceA: string, serviceB: string): boolean {
  const suggestionA = CROSS_SELL_MATRIX[serviceA];
  const suggestionB = CROSS_SELL_MATRIX[serviceB];

  return (
    (suggestionA?.suggestedService === serviceB) ||
    (suggestionB?.suggestedService === serviceA)
  );
}

/**
 * Get bundle recommendation based on selected services
 */
export function getBundleRecommendation(selectedServices: string[]): string | null {
  const serviceSet = new Set(selectedServices);

  // Check for "The Refresh" bundle (junk_removal + home_cleaning)
  if (serviceSet.has("junk_removal") && serviceSet.has("home_cleaning")) {
    return "refresh";
  }

  // Check for "The Curb Appeal" bundle (pressure_washing + gutter_cleaning)
  if (serviceSet.has("pressure_washing") && serviceSet.has("gutter_cleaning")) {
    return "curb_appeal";
  }

  // Check for "The Move-Out" bundle
  if (
    serviceSet.has("home_consultation") &&
    serviceSet.has("junk_removal") &&
    serviceSet.has("home_cleaning") &&
    serviceSet.has("pressure_washing")
  ) {
    return "move_out";
  }

  // Check for "The Full Reset" bundle
  if (
    serviceSet.has("home_consultation") &&
    serviceSet.has("junk_removal") &&
    serviceSet.has("home_cleaning") &&
    serviceSet.has("pressure_washing") &&
    serviceSet.has("gutter_cleaning")
  ) {
    return "full_reset";
  }

  return null;
}
