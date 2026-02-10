// ==========================================
// Property Intelligence Layer
// ==========================================
// The "Kelly Blue Book for Homes" — property health records, appliance registry,
// warranty tracking, insurance integration, builder partnerships, and notification engine.
//
// APPEND TO END OF shared/schema.ts

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Import existing tables for relations (uncomment in schema.ts)
// import { users } from "./models/auth";
// import { serviceRequests, haulerProfiles, businessAccounts } from "./schema";

// ==========================================
// ENUMS
// ==========================================

export const propertyTypeEnum = z.enum([
  "single_family", "townhouse", "condo", "duplex", "triplex",
  "mobile_home", "villa", "apartment", "other"
]);

export const applianceCategoryEnum = z.enum([
  "hvac", "water_heater", "refrigerator", "dishwasher", "oven_range",
  "microwave", "washer", "dryer", "garbage_disposal", "garage_door_opener",
  "pool_pump", "pool_heater", "irrigation_system", "smoke_detector",
  "security_system", "ceiling_fan", "light_fixture", "thermostat",
  "water_softener", "air_purifier", "generator", "other"
]);

export const warrantyTypeEnum = z.enum([
  "builder_structural", "builder_systems", "builder_workmanship",
  "home_warranty_plan", "manufacturer", "extended", "service_contract"
]);

export const insuranceTypeEnum = z.enum([
  "homeowners", "flood", "windstorm", "umbrella", "rental_dwelling", "condo_ho6"
]);

export const healthEventTypeEnum = z.enum([
  "dwellscan_baseline", "dwellscan_rescan", "service_completed",
  "warranty_registered", "warranty_expiring", "warranty_expired", "warranty_claimed",
  "insurance_claim", "appliance_added", "appliance_replaced", "condition_change",
  "maintenance_reminder", "photo_documentation", "builder_handoff"
]);

export const notificationTypeEnum = z.enum([
  "warranty_expiring_90d", "warranty_expiring_60d", "warranty_expiring_30d",
  "warranty_expired", "maintenance_due", "maintenance_overdue",
  "insurance_renewal", "health_score_change", "dwellscan_recommendation",
  "builder_welcome", "appliance_recall", "seasonal_reminder"
]);

// Copy these to schema.ts at the end
