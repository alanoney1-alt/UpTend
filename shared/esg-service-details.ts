import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";
import { serviceRequests, users, esgImpactLogs } from "./schema";

// ── Enums ──

export const esgServiceTypeEnum = z.enum([
  "junk_removal",
  "light_demolition",
  "garage_cleanout",
  "moving_labor",
  "pressure_washing",
  "pool_cleaning",
  "lawn_care",
  "home_cleaning",
  "carpet_cleaning",
  "gutter_cleaning",
  "handyman",
  "truck_unloading",
  "ai_home_scan",
]);
export type EsgServiceType = z.infer<typeof esgServiceTypeEnum>;

export const equipmentPowerEnum = z.enum([
  "electric",
  "gas",
  "battery",
  "manual",
  "hybrid",
  "propane",
]);
export type EquipmentPower = z.infer<typeof equipmentPowerEnum>;

export const chemicalCertEnum = z.enum([
  "epa_safer_choice",
  "green_seal",
  "ecologo",
  "nsf_certified",
  "none",
  "unknown",
]);
export type ChemicalCert = z.infer<typeof chemicalCertEnum>;

export const wastewaterMethodEnum = z.enum([
  "storm_drain",
  "sanitary_sewer",
  "containment_vacuum",
  "filtration_reclaim",
  "ground_absorption",
  "evaporation",
  "hauled_offsite",
  "unknown",
]);
export type WastewaterMethod = z.infer<typeof wastewaterMethodEnum>;

// ── Table ──

export const esgServiceDetails = pgTable("esg_service_details", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id").notNull(),
  esgImpactLogId: varchar("esg_impact_log_id"),
  proId: varchar("pro_id"),
  serviceType: text("service_type").notNull(),

  // PRESSURE WASHING
  waterUsageGallons: real("water_usage_gallons"),
  waterSourceType: text("water_source_type"),
  chemicalProductName: text("chemical_product_name"),
  chemicalType: text("chemical_type"),
  chemicalVolumeOz: real("chemical_volume_oz"),
  chemicalCertification: text("chemical_certification"),
  chemicalConcentrationPct: real("chemical_concentration_pct"),
  wastewaterMethod: text("wastewater_method"),
  wastewaterContainmentDeployed: boolean("wastewater_containment_deployed").default(false),
  wastewaterVolumeGallons: real("wastewater_volume_gallons"),
  runoffComplianceStatus: boolean("runoff_compliance_status").default(true),
  surfaceType: text("surface_type"),
  surfaceAreaSqft: real("surface_area_sqft"),
  equipmentType: text("equipment_type"),
  equipmentPowerSource: text("equipment_power_source"),
  equipmentPsiRating: integer("equipment_psi_rating"),
  equipmentRuntimeMinutes: integer("equipment_runtime_minutes"),

  // POOL CLEANING
  poolChemicals: jsonb("pool_chemicals"),
  poolChlorineOz: real("pool_chlorine_oz"),
  poolAcidOz: real("pool_acid_oz"),
  poolStabilizerOz: real("pool_stabilizer_oz"),
  poolAlgaecideOz: real("pool_algaecide_oz"),
  poolShockTreatment: boolean("pool_shock_treatment").default(false),
  poolFilterStatus: text("pool_filter_status"),
  poolFilterType: text("pool_filter_type"),
  poolFilterDisposalMethod: text("pool_filter_disposal_method"),
  poolWaterDrainedGallons: real("pool_water_drained_gallons"),
  poolWaterAddedGallons: real("pool_water_added_gallons"),
  poolEquipmentEnergyKwh: real("pool_equipment_energy_kwh"),

  // LAWN CARE
  fertilizerProductName: text("fertilizer_product_name"),
  fertilizerNpkRatio: text("fertilizer_npk_ratio"),
  fertilizerQuantityLbs: real("fertilizer_quantity_lbs"),
  fertilizerEpaRegistration: text("fertilizer_epa_registration"),
  fertilizerApplicationMethod: text("fertilizer_application_method"),
  fertilizerOrganic: boolean("fertilizer_organic").default(false),
  pesticideProductName: text("pesticide_product_name"),
  pesticideQuantityOz: real("pesticide_quantity_oz"),
  pesticideTargetPest: text("pesticide_target_pest"),
  pesticideApplicationMethod: text("pesticide_application_method"),
  pesticideEpaRegistration: text("pesticide_epa_registration"),
  greenWasteClippingsLbs: real("green_waste_clippings_lbs"),
  greenWasteBranchesLbs: real("green_waste_branches_lbs"),
  greenWasteDisposalMethod: text("green_waste_disposal_method"),
  greenWasteBagsFilled: integer("green_waste_bags_filled"),
  lawnWaterUsageGallons: real("lawn_water_usage_gallons"),
  lawnEquipment: jsonb("lawn_equipment"),
  lawnPrimaryMowerType: text("lawn_primary_mower_type"),
  lawnTotalEquipmentRuntimeMin: integer("lawn_total_equipment_runtime_min"),
  lawnLotSizeSqft: real("lawn_lot_size_sqft"),

  // HOME CLEANING
  cleaningProducts: jsonb("cleaning_products"),
  cleaningProductCount: integer("cleaning_product_count"),
  cleaningGreenProductCount: integer("cleaning_green_product_count"),
  cleaningGreenProductPct: real("cleaning_green_product_pct"),
  cleaningTrashBags: integer("cleaning_trash_bags"),
  cleaningWasteEstimateLbs: real("cleaning_waste_estimate_lbs"),
  cleaningDisposableSupplies: jsonb("cleaning_disposable_supplies"),
  cleaningVacuumRuntimeMin: integer("cleaning_vacuum_runtime_min"),
  cleaningEquipmentPower: text("cleaning_equipment_power"),

  // CARPET CLEANING
  carpetChemicalName: text("carpet_chemical_name"),
  carpetChemicalType: text("carpet_chemical_type"),
  carpetChemicalVolumeGallons: real("carpet_chemical_volume_gallons"),
  carpetChemicalCertification: text("carpet_chemical_certification"),
  carpetExtractionMethod: text("carpet_extraction_method"),
  carpetWastewaterGallons: real("carpet_wastewater_gallons"),
  carpetWastewaterDisposal: text("carpet_wastewater_disposal"),
  carpetEquipmentEnergyKwh: real("carpet_equipment_energy_kwh"),
  carpetRoomsCleaned: integer("carpet_rooms_cleaned"),
  carpetTotalSqft: real("carpet_total_sqft"),

  // GUTTER CLEANING
  gutterDebrisWeightLbs: real("gutter_debris_weight_lbs"),
  gutterDebrisType: text("gutter_debris_type"),
  gutterDebrisDisposalMethod: text("gutter_debris_disposal_method"),
  gutterReplacedMaterialType: text("gutter_replaced_material_type"),
  gutterReplacedMaterialWeightLbs: real("gutter_replaced_material_weight_lbs"),
  gutterLinearFeet: real("gutter_linear_feet"),

  // HANDYMAN
  handymanMaterialWaste: jsonb("handyman_material_waste"),
  handymanTotalWasteLbs: real("handyman_total_waste_lbs"),
  handymanPaintUsed: boolean("handyman_paint_used").default(false),
  handymanPaintType: text("handyman_paint_type"),
  handymanPaintVocLevel: text("handyman_paint_voc_level"),
  handymanPaintQuantityOz: real("handyman_paint_quantity_oz"),
  handymanReplacedItemsDisposal: text("handyman_replaced_items_disposal"),
  handymanPackagingWasteLbs: real("handyman_packaging_waste_lbs"),

  // TRUCK UNLOADING
  unloadPackagingWaste: jsonb("unload_packaging_waste"),
  unloadTotalPackagingLbs: real("unload_total_packaging_lbs"),
  unloadCardboardLbs: real("unload_cardboard_lbs"),
  unloadPlasticLbs: real("unload_plastic_lbs"),
  unloadFoamLbs: real("unload_foam_lbs"),
  unloadPalletCount: integer("unload_pallet_count"),
  unloadPalletDisposal: text("unload_pallet_disposal"),
  unloadDamagedItemsCount: integer("unload_damaged_items_count"),
  unloadDamagedItemsDisposal: text("unload_damaged_items_disposal"),

  // MOVING LABOR
  movingDiscardedItems: jsonb("moving_discarded_items"),
  movingDiscardedTotalLbs: real("moving_discarded_total_lbs"),
  movingPackingMaterialWaste: jsonb("moving_packing_material_waste"),
  movingCardboardLbs: real("moving_cardboard_lbs"),
  movingPlasticWrapLbs: real("moving_plastic_wrap_lbs"),
  movingFoamLbs: real("moving_foam_lbs"),
  movingBubbleWrapLbs: real("moving_bubble_wrap_lbs"),
  movingDonatedFurnitureLbs: real("moving_donated_furniture_lbs"),
  movingDonatedToOrg: text("moving_donated_to_org"),
  movingTotalDistanceMiles: real("moving_total_distance_miles"),
  movingScope3EmissionsLbs: real("moving_scope3_emissions_lbs"),

  // AI HOME SCAN
  scanEnergyEfficiencyFlags: jsonb("scan_energy_efficiency_flags"),
  scanAgingApplianceCount: integer("scan_aging_appliance_count"),
  scanInsulationGaps: boolean("scan_insulation_gaps").default(false),
  scanHvacEfficiencyScore: real("scan_hvac_efficiency_score"),
  scanWaterFixtureLeaks: integer("scan_water_fixture_leaks"),
  scanEstimatedAnnualWasteKwh: real("scan_estimated_annual_waste_kwh"),
  scanEstimatedAnnualWaterWasteGal: real("scan_estimated_annual_water_waste_gal"),
  scanPropertyHealthImpact: real("scan_property_health_impact"),
  scanRecommendedServices: jsonb("scan_recommended_services"),

  // UNIVERSAL FIELDS
  proEquipmentProfile: jsonb("pro_equipment_profile"),
  proUsedDifferentEquipment: boolean("pro_used_different_equipment").default(false),
  esgComplianceScore: real("esg_compliance_score"),
  greenProductUsagePct: real("green_product_usage_pct"),
  totalChemicalVolumeOz: real("total_chemical_volume_oz"),
  totalWaterUsageGallons: real("total_water_usage_gallons"),
  totalWasteGeneratedLbs: real("total_waste_generated_lbs"),
  totalEquipmentRuntimeMin: integer("total_equipment_runtime_min"),
  estimatedEquipmentCo2Lbs: real("estimated_equipment_co2_lbs"),
  dataCompleteness: real("data_completeness"),
  proSubmittedAt: text("pro_submitted_at"),
  aiEnrichedAt: text("ai_enriched_at"),
  adminReviewedAt: text("admin_reviewed_at"),
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
  notes: text("notes"),
});

// ── Relations ──

export const esgServiceDetailsRelations = relations(esgServiceDetails, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [esgServiceDetails.serviceRequestId],
    references: [serviceRequests.id],
  }),
  esgImpactLog: one(esgImpactLogs, {
    fields: [esgServiceDetails.esgImpactLogId],
    references: [esgImpactLogs.id],
  }),
  pro: one(users, {
    fields: [esgServiceDetails.proId],
    references: [users.id],
  }),
}));

// ── Insert Schema & Types ──

export const insertEsgServiceDetailsSchema = createInsertSchema(esgServiceDetails).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEsgServiceDetails = z.infer<typeof insertEsgServiceDetailsSchema>;
export type EsgServiceDetails = typeof esgServiceDetails.$inferSelect;

// ── Service Templates ──
// Defines which ESG fields are relevant per service type

export const esgServiceTemplates: Record<EsgServiceType, { label: string; relevantFields: string[] }> = {
  junk_removal: {
    label: "Junk Removal",
    relevantFields: [
      "totalWasteGeneratedLbs",
      "estimatedEquipmentCo2Lbs",
      "totalEquipmentRuntimeMin",
    ],
  },
  light_demolition: {
    label: "Light Demolition",
    relevantFields: [
      "totalWasteGeneratedLbs",
      "estimatedEquipmentCo2Lbs",
      "totalEquipmentRuntimeMin",
    ],
  },
  garage_cleanout: {
    label: "Garage Cleanout",
    relevantFields: [
      "totalWasteGeneratedLbs",
      "estimatedEquipmentCo2Lbs",
    ],
  },
  moving_labor: {
    label: "Moving Labor",
    relevantFields: [
      "movingDiscardedItems",
      "movingDiscardedTotalLbs",
      "movingPackingMaterialWaste",
      "movingCardboardLbs",
      "movingPlasticWrapLbs",
      "movingFoamLbs",
      "movingBubbleWrapLbs",
      "movingDonatedFurnitureLbs",
      "movingDonatedToOrg",
      "movingTotalDistanceMiles",
      "movingScope3EmissionsLbs",
    ],
  },
  pressure_washing: {
    label: "Pressure Washing",
    relevantFields: [
      "waterUsageGallons",
      "waterSourceType",
      "chemicalProductName",
      "chemicalType",
      "chemicalVolumeOz",
      "chemicalCertification",
      "chemicalConcentrationPct",
      "wastewaterMethod",
      "wastewaterContainmentDeployed",
      "wastewaterVolumeGallons",
      "runoffComplianceStatus",
      "surfaceType",
      "surfaceAreaSqft",
      "equipmentType",
      "equipmentPowerSource",
      "equipmentPsiRating",
      "equipmentRuntimeMinutes",
    ],
  },
  pool_cleaning: {
    label: "Pool Cleaning",
    relevantFields: [
      "poolChemicals",
      "poolChlorineOz",
      "poolAcidOz",
      "poolStabilizerOz",
      "poolAlgaecideOz",
      "poolShockTreatment",
      "poolFilterStatus",
      "poolFilterType",
      "poolFilterDisposalMethod",
      "poolWaterDrainedGallons",
      "poolWaterAddedGallons",
      "poolEquipmentEnergyKwh",
    ],
  },
  lawn_care: {
    label: "Lawn Care",
    relevantFields: [
      "fertilizerProductName",
      "fertilizerNpkRatio",
      "fertilizerQuantityLbs",
      "fertilizerEpaRegistration",
      "fertilizerApplicationMethod",
      "fertilizerOrganic",
      "pesticideProductName",
      "pesticideQuantityOz",
      "pesticideTargetPest",
      "pesticideApplicationMethod",
      "pesticideEpaRegistration",
      "greenWasteClippingsLbs",
      "greenWasteBranchesLbs",
      "greenWasteDisposalMethod",
      "greenWasteBagsFilled",
      "lawnWaterUsageGallons",
      "lawnEquipment",
      "lawnPrimaryMowerType",
      "lawnTotalEquipmentRuntimeMin",
      "lawnLotSizeSqft",
    ],
  },
  home_cleaning: {
    label: "Home Cleaning",
    relevantFields: [
      "cleaningProducts",
      "cleaningProductCount",
      "cleaningGreenProductCount",
      "cleaningGreenProductPct",
      "cleaningTrashBags",
      "cleaningWasteEstimateLbs",
      "cleaningDisposableSupplies",
      "cleaningVacuumRuntimeMin",
      "cleaningEquipmentPower",
    ],
  },
  carpet_cleaning: {
    label: "Carpet Cleaning",
    relevantFields: [
      "carpetChemicalName",
      "carpetChemicalType",
      "carpetChemicalVolumeGallons",
      "carpetChemicalCertification",
      "carpetExtractionMethod",
      "carpetWastewaterGallons",
      "carpetWastewaterDisposal",
      "carpetEquipmentEnergyKwh",
      "carpetRoomsCleaned",
      "carpetTotalSqft",
    ],
  },
  gutter_cleaning: {
    label: "Gutter Cleaning",
    relevantFields: [
      "gutterDebrisWeightLbs",
      "gutterDebrisType",
      "gutterDebrisDisposalMethod",
      "gutterReplacedMaterialType",
      "gutterReplacedMaterialWeightLbs",
      "gutterLinearFeet",
    ],
  },
  handyman: {
    label: "Handyman",
    relevantFields: [
      "handymanMaterialWaste",
      "handymanTotalWasteLbs",
      "handymanPaintUsed",
      "handymanPaintType",
      "handymanPaintVocLevel",
      "handymanPaintQuantityOz",
      "handymanReplacedItemsDisposal",
      "handymanPackagingWasteLbs",
    ],
  },
  truck_unloading: {
    label: "Truck Unloading",
    relevantFields: [
      "unloadPackagingWaste",
      "unloadTotalPackagingLbs",
      "unloadCardboardLbs",
      "unloadPlasticLbs",
      "unloadFoamLbs",
      "unloadPalletCount",
      "unloadPalletDisposal",
      "unloadDamagedItemsCount",
      "unloadDamagedItemsDisposal",
    ],
  },
  ai_home_scan: {
    label: "Home DNA Scan",
    relevantFields: [
      "scanEnergyEfficiencyFlags",
      "scanAgingApplianceCount",
      "scanInsulationGaps",
      "scanHvacEfficiencyScore",
      "scanWaterFixtureLeaks",
      "scanEstimatedAnnualWasteKwh",
      "scanEstimatedAnnualWaterWasteGal",
      "scanPropertyHealthImpact",
      "scanRecommendedServices",
    ],
  },
};
