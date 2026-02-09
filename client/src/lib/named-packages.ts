/**
 * Named Packages - Pre-Configured Service Bundles
 *
 * Marketing layer on top of service pricing. Packages combine multiple
 * services with catchy names to increase cart size and simplify booking.
 *
 * All packages automatically qualify for multi-service discounts (10-15% off)
 * and can be customized after selection.
 */

export interface NamedPackage {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string; // Emoji or icon name
  services: Array<{
    serviceType: string;
    serviceBranded: string;
    required: boolean; // Can customer remove this?
    defaultOptions?: Record<string, any>; // Pre-selected options
  }>;
  idealFor: string[]; // Use cases
  estimatedPrice: {
    from: number;
    to: number;
  };
  savingsMessage: string;
  seasonalBadge?: string; // "Spring Special", "Holiday Season", etc.
}

/**
 * All available named packages
 */
export const NAMED_PACKAGES: Record<string, NamedPackage> = {
  the_refresh: {
    id: 'the_refresh',
    name: 'The Refresh',
    tagline: 'Inside & Outside Shine',
    description: 'Professional home cleaning plus pressure washing for a complete property refresh',
    icon: '✨',
    services: [
      {
        serviceType: 'home_cleaning',
        serviceBranded: 'PolishUp™',
        required: true,
        defaultOptions: {
          cleanType: 'standard',
        },
      },
      {
        serviceType: 'pressure_washing',
        serviceBranded: 'FreshWash™',
        required: true,
      },
    ],
    idealFor: [
      'Getting ready for guests',
      'Post-winter cleanup',
      'Spring refresh',
      'Preparing to sell your home',
    ],
    estimatedPrice: {
      from: 299,
      to: 549,
    },
    savingsMessage: '10% off when bundled',
  },

  the_curb_appeal: {
    id: 'the_curb_appeal',
    name: 'The Curb Appeal',
    tagline: 'First Impressions Matter',
    description: 'Complete exterior transformation: pressure washing, gutter cleaning, and lawn care',
    icon: '🏡',
    services: [
      {
        serviceType: 'pressure_washing',
        serviceBranded: 'FreshWash™',
        required: true,
      },
      {
        serviceType: 'gutter_cleaning',
        serviceBranded: 'GutterFlush™',
        required: true,
      },
      {
        serviceType: 'lawn_care',
        serviceBranded: 'YardPro™',
        required: false, // Optional add-on
      },
    ],
    idealFor: [
      'Listing your home',
      'HOA compliance',
      'Seasonal maintenance',
      'After storm cleanup',
    ],
    estimatedPrice: {
      from: 369,
      to: 619,
    },
    savingsMessage: '10% off - save up to $60',
    seasonalBadge: 'Spring Special',
  },

  the_move_out: {
    id: 'the_move_out',
    name: 'The Move-Out',
    tagline: 'Leave It Spotless',
    description: 'Complete move-out package: deep cleaning, junk removal, and exterior wash for deposit return',
    icon: '📦',
    services: [
      {
        serviceType: 'home_cleaning',
        serviceBranded: 'PolishUp™',
        required: true,
        defaultOptions: {
          cleanType: 'move_out',
        },
      },
      {
        serviceType: 'junk_removal',
        serviceBranded: 'BulkSnap™',
        required: true,
      },
      {
        serviceType: 'pressure_washing',
        serviceBranded: 'FreshWash™',
        required: false, // Optional add-on
      },
    ],
    idealFor: [
      'Moving out of rental',
      'Getting deposit back',
      'Handing over property',
      'End of lease',
    ],
    estimatedPrice: {
      from: 549,
      to: 899,
    },
    savingsMessage: '10-15% off - save up to $130',
  },

  the_full_reset: {
    id: 'the_full_reset',
    name: 'The Full Reset',
    tagline: 'Complete Property Overhaul',
    description: 'Ultimate package: home audit, deep cleaning, junk removal, pressure washing, and gutter cleaning',
    icon: '🔄',
    services: [
      {
        serviceType: 'home_audit',
        serviceBranded: 'DwellScan™',
        required: true,
        defaultOptions: {
          tier: 'aerial', // Premium tier
        },
      },
      {
        serviceType: 'home_cleaning',
        serviceBranded: 'PolishUp™',
        required: true,
        defaultOptions: {
          cleanType: 'deep',
        },
      },
      {
        serviceType: 'junk_removal',
        serviceBranded: 'BulkSnap™',
        required: false,
      },
      {
        serviceType: 'pressure_washing',
        serviceBranded: 'FreshWash™',
        required: false,
      },
      {
        serviceType: 'gutter_cleaning',
        serviceBranded: 'GutterFlush™',
        required: false,
      },
    ],
    idealFor: [
      'New homeowners',
      'Major renovation prep',
      'Annual deep maintenance',
      'Estate property cleanup',
    ],
    estimatedPrice: {
      from: 799,
      to: 1499,
    },
    savingsMessage: '15% off + $49 DwellScan credit - save up to $270',
  },

  the_movers_bundle: {
    id: 'the_movers_bundle',
    name: "The Mover's Bundle",
    tagline: 'We Do The Heavy Lifting',
    description: 'Moving labor, junk removal, and final cleanup - everything you need for moving day',
    icon: '🚚',
    services: [
      {
        serviceType: 'moving_labor',
        serviceBranded: 'LiftCrew™',
        required: true,
        defaultOptions: {
          crewSize: 2,
          hours: 4,
        },
      },
      {
        serviceType: 'junk_removal',
        serviceBranded: 'BulkSnap™',
        required: false,
      },
      {
        serviceType: 'home_cleaning',
        serviceBranded: 'PolishUp™',
        required: false,
        defaultOptions: {
          cleanType: 'standard',
        },
      },
    ],
    idealFor: [
      'Moving day',
      'Loading/unloading',
      'Downsizing',
      'Estate sales',
    ],
    estimatedPrice: {
      from: 419,
      to: 899,
    },
    savingsMessage: '10% off - save up to $90',
  },

  the_landlord_special: {
    id: 'the_landlord_special',
    name: 'The Landlord Special',
    tagline: 'Turnover Ready',
    description: 'Fast tenant turnover: move-out clean, junk removal, basic repairs',
    icon: '🔑',
    services: [
      {
        serviceType: 'home_cleaning',
        serviceBranded: 'PolishUp™',
        required: true,
        defaultOptions: {
          cleanType: 'move_out',
        },
      },
      {
        serviceType: 'junk_removal',
        serviceBranded: 'BulkSnap™',
        required: true,
      },
      {
        serviceType: 'handyman',
        serviceBranded: 'FixIt™',
        required: false,
      },
    ],
    idealFor: [
      'Property managers',
      'Landlords',
      'Vacation rentals',
      'Between tenants',
    ],
    estimatedPrice: {
      from: 499,
      to: 849,
    },
    savingsMessage: '10% off + PM tier discount if applicable',
  },

  the_seasonal_prep: {
    id: 'the_seasonal_prep',
    name: 'The Seasonal Prep',
    tagline: 'Ready For Any Season',
    description: 'Seasonal maintenance: gutter cleaning, pressure washing, HVAC filter change',
    icon: '🍂',
    services: [
      {
        serviceType: 'gutter_cleaning',
        serviceBranded: 'GutterFlush™',
        required: true,
      },
      {
        serviceType: 'pressure_washing',
        serviceBranded: 'FreshWash™',
        required: true,
      },
      {
        serviceType: 'hvac_service',
        serviceBranded: 'AirCare™',
        required: false,
      },
    ],
    idealFor: [
      'Fall prep (before leaves)',
      'Spring cleaning',
      'Storm preparation',
      'Annual maintenance',
    ],
    estimatedPrice: {
      from: 369,
      to: 619,
    },
    savingsMessage: '10% off seasonal maintenance',
    seasonalBadge: 'Fall Special',
  },

  the_party_ready: {
    id: 'the_party_ready',
    name: 'The Party Ready',
    tagline: 'Host With Confidence',
    description: 'Get your home party-ready: deep cleaning, pressure washing, and yard cleanup',
    icon: '🎉',
    services: [
      {
        serviceType: 'home_cleaning',
        serviceBranded: 'PolishUp™',
        required: true,
        defaultOptions: {
          cleanType: 'deep',
        },
      },
      {
        serviceType: 'pressure_washing',
        serviceBranded: 'FreshWash™',
        required: false,
      },
      {
        serviceType: 'junk_removal',
        serviceBranded: 'BulkSnap™',
        required: false,
      },
    ],
    idealFor: [
      'Hosting events',
      'Holiday parties',
      'Family gatherings',
      'Special occasions',
    ],
    estimatedPrice: {
      from: 349,
      to: 749,
    },
    savingsMessage: '10-15% off - save up to $110',
  },
};

/**
 * Get all packages
 */
export function getAllPackages(): NamedPackage[] {
  return Object.values(NAMED_PACKAGES);
}

/**
 * Get package by ID
 */
export function getPackageById(id: string): NamedPackage | undefined {
  return NAMED_PACKAGES[id];
}

/**
 * Get packages for a specific use case
 */
export function getPackagesByUseCase(useCase: string): NamedPackage[] {
  return Object.values(NAMED_PACKAGES).filter(pkg =>
    pkg.idealFor.some(ideal =>
      ideal.toLowerCase().includes(useCase.toLowerCase())
    )
  );
}

/**
 * Get seasonal packages
 */
export function getSeasonalPackages(): NamedPackage[] {
  return Object.values(NAMED_PACKAGES).filter(pkg => pkg.seasonalBadge);
}

/**
 * Convert package to cart services
 */
export function packageToCartServices(
  packageId: string,
  customOptions?: Record<string, any>
): Array<{
  serviceType: string;
  serviceBranded: string;
  price: number; // Would be calculated from pricing engines
  isDwellScan?: boolean;
}> {
  const pkg = getPackageById(packageId);
  if (!pkg) return [];

  return pkg.services
    .filter(svc => svc.required || customOptions?.[svc.serviceType])
    .map(svc => ({
      serviceType: svc.serviceType,
      serviceBranded: svc.serviceBranded,
      price: 0, // Placeholder - actual price calculated by pricing engines
      isDwellScan: svc.serviceType === 'home_audit',
    }));
}

/**
 * Calculate estimated savings for a package
 */
export function calculatePackageSavings(
  packageId: string,
  individualPrices: number[]
): {
  subtotal: number;
  discount: number;
  discountPercent: number;
  finalPrice: number;
  savingsMessage: string;
} {
  const pkg = getPackageById(packageId);
  if (!pkg) {
    return {
      subtotal: 0,
      discount: 0,
      discountPercent: 0,
      finalPrice: 0,
      savingsMessage: '',
    };
  }

  const subtotal = individualPrices.reduce((sum, price) => sum + price, 0);

  // Determine discount tier
  const serviceCount = pkg.services.filter(s => s.required).length;
  const discountPercent = serviceCount >= 5 ? 0.15 : serviceCount >= 3 ? 0.10 : 0;

  const discount = Math.round(subtotal * discountPercent);
  const finalPrice = subtotal - discount;

  const savingsMessage = pkg.savingsMessage || `${Math.round(discountPercent * 100)}% off - save $${discount}`;

  return {
    subtotal,
    discount,
    discountPercent,
    finalPrice,
    savingsMessage,
  };
}

/**
 * Get recommended package based on customer needs
 */
export function getRecommendedPackage(context: {
  isMoving?: boolean;
  hasUpcomingEvent?: boolean;
  isNewHomeowner?: boolean;
  isLandlord?: boolean;
  season?: 'spring' | 'summer' | 'fall' | 'winter';
}): NamedPackage | null {
  if (context.isMoving) {
    return NAMED_PACKAGES.the_move_out;
  }

  if (context.hasUpcomingEvent) {
    return NAMED_PACKAGES.the_party_ready;
  }

  if (context.isNewHomeowner) {
    return NAMED_PACKAGES.the_full_reset;
  }

  if (context.isLandlord) {
    return NAMED_PACKAGES.the_landlord_special;
  }

  if (context.season === 'fall') {
    return NAMED_PACKAGES.the_seasonal_prep;
  }

  if (context.season === 'spring') {
    return NAMED_PACKAGES.the_curb_appeal;
  }

  // Default recommendation
  return NAMED_PACKAGES.the_refresh;
}
