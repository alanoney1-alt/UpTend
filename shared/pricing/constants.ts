/**
 * UpTend Pricing Constants - Services 11 & 12
 * Carpet Cleaning & Landscaping
 * Orlando market competitive pricing
 */

export interface PricingTier {
  id: string;
  label: string;
  description: string;
  basePrice: number; // in cents
  maxPrice?: number; // in cents
  unit: 'flat' | 'per_room' | 'per_item' | 'monthly' | 'per_sqft';
}

// ════════════════════════════════════════════════════════════
// SERVICE 11: LANDSCAPING (LANDSCAPING & LAWN CARE)
// Orlando market: Mow $38-$52/visit (1/4 acre), $152-$208/mo
// UpTend target: 10-35% under market
// ════════════════════════════════════════════════════════════

export const FRESHCUT_ONE_TIME: PricingTier[] = [
  { id: 'fc_mow_quarter', label: 'Lawn Mow+Edge+Blow (up to 1/4 acre)', description: 'Standard residential', basePrice: 3500, unit: 'flat' },
  { id: 'fc_mow_half', label: 'Lawn Mow+Edge+Blow (1/4–1/2 acre)', description: '', basePrice: 5500, unit: 'flat' },
  { id: 'fc_mow_full', label: 'Lawn Mow+Edge+Blow (1/2–1 acre)', description: '', basePrice: 8500, unit: 'flat' },
  { id: 'fc_overgrown_sm', label: 'Overgrown Surcharge (small)', description: 'Grass 6-10 inches', basePrice: 2500, unit: 'flat' },
  { id: 'fc_overgrown_lg', label: 'Overgrown Surcharge (large)', description: 'Grass 10+ inches', basePrice: 5000, unit: 'flat' },
  { id: 'fc_shrub_trim', label: 'Shrub/Hedge Trimming', description: 'Per visit', basePrice: 6500, maxPrice: 14900, unit: 'flat' },
  { id: 'fc_mulch_yard', label: 'Mulch Install (per cubic yard)', description: 'Includes material + labor', basePrice: 5500, unit: 'per_item' },
  { id: 'fc_flowerbed', label: 'Flower Bed Cleanup/Weeding', description: '', basePrice: 4900, maxPrice: 9900, unit: 'flat' },
  { id: 'fc_leaf_cleanup', label: 'Leaf Removal / Yard Cleanup', description: '', basePrice: 8900, maxPrice: 17900, unit: 'flat' },
  { id: 'fc_sod_1000', label: 'Sod Installation (per 1,000 sq ft)', description: 'St. Augustine or Bahia', basePrice: 45000, maxPrice: 65000, unit: 'flat' },
  { id: 'fc_tree_trim', label: 'Tree Trimming (under 20ft)', description: 'Per tree', basePrice: 14900, maxPrice: 34900, unit: 'per_item' },
  { id: 'fc_fertilize', label: 'Fertilizer Application (1/4 acre)', description: '', basePrice: 4900, unit: 'flat' },
  { id: 'fc_weed_control', label: 'Weed Control Application (1/4 acre)', description: '', basePrice: 4500, unit: 'flat' },
  { id: 'fc_landscape_fabric', label: 'Landscape Fabric / Weed Barrier', description: 'Per sq ft', basePrice: 50, maxPrice: 100, unit: 'per_item' },
];

export const FRESHCUT_RECURRING: PricingTier[] = [
  // 1/4 acre plans
  { id: 'fc_std_qtr_weekly', label: 'Standard 1/4 acre Weekly', description: 'Mow+Edge+Blow', basePrice: 12900, unit: 'monthly' },
  { id: 'fc_std_qtr_biweekly', label: 'Standard 1/4 acre Biweekly', description: 'Mow+Edge+Blow', basePrice: 8900, unit: 'monthly' },
  { id: 'fc_enh_qtr_weekly', label: 'Enhanced 1/4 acre Weekly', description: '+Shrub trim quarterly', basePrice: 16900, unit: 'monthly' },
  { id: 'fc_enh_qtr_biweekly', label: 'Enhanced 1/4 acre Biweekly', description: '+Shrub trim quarterly', basePrice: 11900, unit: 'monthly' },
  { id: 'fc_prm_qtr_weekly', label: 'Premium 1/4 acre Weekly', description: 'Full+Fert+Weed', basePrice: 21900, unit: 'monthly' },
  { id: 'fc_prm_qtr_biweekly', label: 'Premium 1/4 acre Biweekly', description: 'Full+Fert+Weed', basePrice: 15900, unit: 'monthly' },
  // 1/2 acre plans
  { id: 'fc_std_half_weekly', label: 'Standard 1/2 acre Weekly', description: 'Mow+Edge+Blow', basePrice: 18900, unit: 'monthly' },
  { id: 'fc_std_half_biweekly', label: 'Standard 1/2 acre Biweekly', description: 'Mow+Edge+Blow', basePrice: 12900, unit: 'monthly' },
  { id: 'fc_enh_half_weekly', label: 'Enhanced 1/2 acre Weekly', description: '+Shrub trim quarterly', basePrice: 23900, unit: 'monthly' },
  { id: 'fc_enh_half_biweekly', label: 'Enhanced 1/2 acre Biweekly', description: '+Shrub trim quarterly', basePrice: 16900, unit: 'monthly' },
  { id: 'fc_prm_half_weekly', label: 'Premium 1/2 acre Weekly', description: 'Full+Fert+Weed', basePrice: 29900, unit: 'monthly' },
  { id: 'fc_prm_half_biweekly', label: 'Premium 1/2 acre Biweekly', description: 'Full+Fert+Weed', basePrice: 21900, unit: 'monthly' },
  // 1 acre plans
  { id: 'fc_std_acre_weekly', label: 'Standard 1 acre Weekly', description: 'Mow+Edge+Blow', basePrice: 27900, unit: 'monthly' },
  { id: 'fc_std_acre_biweekly', label: 'Standard 1 acre Biweekly', description: 'Mow+Edge+Blow', basePrice: 18900, unit: 'monthly' },
  { id: 'fc_enh_acre_weekly', label: 'Enhanced 1 acre Weekly', description: '+Shrub trim quarterly', basePrice: 34900, unit: 'monthly' },
  { id: 'fc_enh_acre_biweekly', label: 'Enhanced 1 acre Biweekly', description: '+Shrub trim quarterly', basePrice: 24900, unit: 'monthly' },
  { id: 'fc_prm_acre_weekly', label: 'Premium 1 acre Weekly', description: 'Full+Fert+Weed', basePrice: 44900, unit: 'monthly' },
  { id: 'fc_prm_acre_biweekly', label: 'Premium 1 acre Biweekly', description: 'Full+Fert+Weed', basePrice: 31900, unit: 'monthly' },
];

export const FRESHCUT_ADDONS: PricingTier[] = [
  { id: 'fc_pest_spray', label: 'Pest Control Spray', description: 'Lawn insects', basePrice: 3900, unit: 'flat' },
  { id: 'fc_aeration', label: 'Aeration (1/4 acre)', description: '', basePrice: 7900, unit: 'flat' },
  { id: 'fc_overseed', label: 'Overseeding (1/4 acre)', description: '', basePrice: 5900, unit: 'flat' },
  { id: 'fc_irrigation', label: 'Irrigation/Sprinkler Check', description: '', basePrice: 4900, unit: 'flat' },
  { id: 'fc_palm_trim', label: 'Palm Tree Trim (per palm)', description: 'Florida-specific', basePrice: 3500, maxPrice: 7500, unit: 'per_item' },
  { id: 'fc_landscape_fabric_addon', label: 'Weed Barrier Install (per sq ft)', description: '', basePrice: 50, maxPrice: 100, unit: 'per_item' },
];

// ════════════════════════════════════════════════════════════
// SERVICE 12: CARPET CLEANING (CARPET & UPHOLSTERY CLEANING)
// Orlando market: $40-$90/room, SS $60-$80, Oxi $40-$60
// UpTend target: 15-40% under Stanley Steemer
// ════════════════════════════════════════════════════════════

export const DEEPFIBER_PER_ROOM: PricingTier[] = [
  { id: 'df_1room', label: '1 Room (up to 250 sq ft)', description: '', basePrice: 4900, unit: 'per_room' },
  { id: 'df_2room', label: '2 Rooms', description: '', basePrice: 8900, unit: 'per_room' },
  { id: 'df_3room', label: '3 Rooms', description: '', basePrice: 11900, unit: 'per_room' },
  { id: 'df_4room', label: '4 Rooms', description: '', basePrice: 14900, unit: 'per_room' },
  { id: 'df_5room', label: '5 Rooms', description: '', basePrice: 17900, unit: 'per_room' },
  { id: 'df_whole', label: 'Whole House (6+ rooms)', description: '', basePrice: 19900, maxPrice: 34900, unit: 'per_room' },
  { id: 'df_hallway', label: 'Hallway / Stairs (each)', description: '', basePrice: 2900, unit: 'per_item' },
  { id: 'df_closet', label: 'Walk-In Closet', description: '', basePrice: 2500, unit: 'per_item' },
];

export interface CleaningMethod {
  id: string;
  label: string;
  centsPerRoom: number;
  maxCentsPerRoom: number;
  dryTimeHrs: string;
  isDefault: boolean;
  requiresTruckMount: boolean;
}

export const DEEPFIBER_METHODS: CleaningMethod[] = [
  { id: 'df_hwe', label: 'Hot Water Extraction (Steam)', centsPerRoom: 4900, maxCentsPerRoom: 7900, dryTimeHrs: '6-12', isDefault: true, requiresTruckMount: true },
  { id: 'df_encap', label: 'Low-Moisture Encapsulation', centsPerRoom: 3900, maxCentsPerRoom: 5900, dryTimeHrs: '1-2', isDefault: false, requiresTruckMount: false },
  { id: 'df_bonnet', label: 'Bonnet Cleaning', centsPerRoom: 2900, maxCentsPerRoom: 4900, dryTimeHrs: '2-4', isDefault: false, requiresTruckMount: false },
  { id: 'df_dry', label: 'Dry Compound', centsPerRoom: 4500, maxCentsPerRoom: 6900, dryTimeHrs: '0-0.5', isDefault: false, requiresTruckMount: false },
];

export const DEEPFIBER_ADDONS: PricingTier[] = [
  { id: 'df_scotchgard', label: 'Stain Protection (per room)', description: 'Scotchgard / fiber protector', basePrice: 2000, unit: 'per_room' },
  { id: 'df_pet_odor', label: 'Pet Odor Treatment (per room)', description: 'Enzyme treatment', basePrice: 2500, unit: 'per_room' },
  { id: 'df_spot', label: 'Deep Stain Spot Treatment', description: 'Per spot', basePrice: 1500, unit: 'per_item' },
  { id: 'df_deodorize', label: 'Deodorizer (per room)', description: '', basePrice: 1200, unit: 'per_room' },
  { id: 'df_sofa', label: 'Upholstery — Sofa (3-seat)', description: '', basePrice: 8900, unit: 'flat' },
  { id: 'df_loveseat', label: 'Upholstery — Loveseat', description: '', basePrice: 6900, unit: 'flat' },
  { id: 'df_chair', label: 'Upholstery — Chair/Recliner', description: '', basePrice: 4900, unit: 'flat' },
  { id: 'df_sectional', label: 'Upholstery — Sectional', description: 'Base + $30/additional section', basePrice: 12900, maxPrice: 18900, unit: 'flat' },
  { id: 'df_mattress', label: 'Mattress Cleaning', description: '', basePrice: 5900, unit: 'flat' },
  { id: 'df_area_rug', label: 'Area Rug (per sq ft)', description: '', basePrice: 75, maxPrice: 200, unit: 'per_item' },
  { id: 'df_tile_grout', label: 'Tile & Grout (per sq ft)', description: '', basePrice: 75, maxPrice: 150, unit: 'per_item' },
  { id: 'df_water_damage', label: 'Water Damage Extraction', description: 'Emergency service', basePrice: 29900, unit: 'flat' },
];

export interface RecurringDiscount {
  id: string;
  label: string;
  discountPct: number;
}

export const DEEPFIBER_RECURRING_DISCOUNTS: RecurringDiscount[] = [
  { id: 'df_semi', label: 'Semi-Annual (every 6 months)', discountPct: 0.08 },
  { id: 'df_quarterly', label: 'Quarterly', discountPct: 0.17 },
  { id: 'df_monthly', label: 'Monthly (Commercial)', discountPct: 0.25 },
];

// ════════════════════════════════════════════════════════════
// UPDATED BUNDLES (9 total — all 12 services)
// ════════════════════════════════════════════════════════════

export interface Bundle {
  id: string;
  name: string;
  services: string[];
  discountPct: number;
  target: string;
  description: string;
}

export const BUNDLES: Bundle[] = [
  {
    id: 'refresh',
    name: 'The Refresh',
    services: ['polishup', 'bulksnap'],
    discountPct: 0.10,
    target: 'General cleanout',
    description: 'PolishUp standard + BulkSnap removal',
  },
  {
    id: 'curb_appeal',
    name: 'Curb Appeal',
    services: ['freshwash', 'gutterflush'],
    discountPct: 0.10,
    target: 'Exterior refresh',
    description: 'FreshWash + GutterFlush',
  },
  {
    id: 'curb_appeal_plus',
    name: 'Curb Appeal+',
    services: ['freshwash', 'gutterflush', 'freshcut'],
    discountPct: 0.12,
    target: 'Full exterior',
    description: 'FreshWash + GutterFlush + FreshCut lawn mow',
  },
  {
    id: 'move_out_plus',
    name: 'Move-Out+',
    services: ['polishup', 'bulksnap', 'deepfiber'],
    discountPct: 0.15,
    target: 'Tenant turnover / PM',
    description: 'PolishUp deep + BulkSnap 1/4 load + DeepFiber 3 rooms',
  },
  {
    id: 'full_reset_plus',
    name: 'Full Reset+',
    services: ['polishup', 'bulksnap', 'freshwash', 'freshcut', 'deepfiber'],
    discountPct: 0.18,
    target: 'Complete PM turnover',
    description: 'PolishUp deep + BulkSnap 1/2 + FreshWash + FreshCut + DeepFiber',
  },
  {
    id: 'splash_ready',
    name: 'Splash Ready',
    services: ['poolspark', 'freshwash'],
    discountPct: 0.10,
    target: 'Pool owners',
    description: 'PoolSpark deep clean + FreshWash patio',
  },
  {
    id: 'fresh_start',
    name: 'Fresh Start',
    services: ['polishup', 'deepfiber'],
    discountPct: 0.10,
    target: 'New move-in',
    description: 'PolishUp standard + DeepFiber 3 rooms',
  },
  {
    id: 'hoa_blitz',
    name: 'HOA Blitz',
    services: ['freshcut', 'freshwash', 'gutterflush', 'home_scan'],
    discountPct: 0.15,
    target: 'HOA compliance',
    description: 'FreshCut + FreshWash + GutterFlush + AI Home Scan audit',
  },
  {
    id: 'seasonal_reset',
    name: 'Seasonal Reset',
    services: ['freshcut', 'poolspark', 'freshwash'],
    discountPct: 0.12,
    target: 'Seasonal prep',
    description: 'FreshCut premium + PoolSpark deep + FreshWash house',
  },
];

// ════════════════════════════════════════════════════════════
// MULTI-SERVICE & PM DISCOUNTS
// ════════════════════════════════════════════════════════════
// SERVICE 13: POOL CLEANING (POOLSPARK)
// Orlando market: $80–$200/month for weekly service
// UpTend tiers: Basic $89, Standard $129, Full Service $169, Deep Clean $199
// ════════════════════════════════════════════════════════════

export const POOLSPARK_RECURRING: PricingTier[] = [
  { id: 'ps_basic', label: 'Basic Pool Cleaning', description: 'Weekly chemicals + skim surface + empty baskets', basePrice: 8900, unit: 'monthly' },
  { id: 'ps_standard', label: 'Standard Pool Cleaning', description: 'Basic + brush walls + vacuum + filter check', basePrice: 12900, unit: 'monthly' },
  { id: 'ps_full', label: 'Full Service Pool Cleaning', description: 'Standard + tile cleaning + equipment monitoring + filter cleaning', basePrice: 16900, unit: 'monthly' },
];

export const POOLSPARK_ONE_TIME: PricingTier[] = [
  { id: 'ps_deep_clean', label: 'One-Time Deep Clean', description: 'Deep clean for neglected/green pools', basePrice: 19900, unit: 'flat' },
];

// ════════════════════════════════════════════════════════════

export const MULTI_SERVICE_DISCOUNTS = [
  { minServices: 2, discountPct: 0.05 },
  { minServices: 3, discountPct: 0.10 },
  { minServices: 4, discountPct: 0.15 },
];

export interface PmVolumeDiscount {
  minUnits: number;
  maxUnits: number;
  discountPct: number;
  accountManager?: boolean;
}

export const PM_VOLUME_DISCOUNTS: PmVolumeDiscount[] = [
  { minUnits: 10, maxUnits: 19, discountPct: 0.05 },
  { minUnits: 20, maxUnits: 49, discountPct: 0.10 },
  { minUnits: 50, maxUnits: Infinity, discountPct: 0.15, accountManager: true },
];
