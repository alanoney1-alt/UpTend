import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Re-export auth models (users and sessions tables)
export * from "./models/auth";

// Import users for relations and User type for composite types
import { users, type User } from "./models/auth";

export const userRoleEnum = z.enum(["customer", "hauler", "admin", "business_user"]);
export type UserRole = z.infer<typeof userRoleEnum>;

export const serviceTypeEnum = z.enum([
  "junk_removal", "furniture_moving", "garage_cleanout", "estate_cleanout",
  "truck_unloading", "hvac", "cleaning", "home_cleaning",
  "moving_labor", "pressure_washing", "gutter_cleaning", "light_demolition", "home_consultation"
]);
export type ServiceType = z.infer<typeof serviceTypeEnum>;

export const SUPPORTED_LANGUAGES = ["en", "es", "pt", "fr", "ht", "vi", "zh"] as const;
export const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  es: "Spanish", 
  pt: "Portuguese",
  fr: "French",
  ht: "Haitian Creole",
  vi: "Vietnamese",
  zh: "Chinese",
};

export const moveServiceModeEnum = z.enum(["truck_and_mover", "labor_only"]);
export type MoveServiceMode = z.infer<typeof moveServiceModeEnum>;

export const requestStatusEnum = z.enum(["draft", "requested", "matching", "assigned", "in_progress", "completed", "cancelled"]);
export type RequestStatus = z.infer<typeof requestStatusEnum>;

export const matchStatusEnum = z.enum(["pending", "accepted", "declined", "expired"]);
export type MatchStatus = z.infer<typeof matchStatusEnum>;

export const vehicleTypeEnum = z.enum(["pickup_truck", "cargo_van", "box_truck", "flatbed", "trailer", "none"]);
export type VehicleType = z.infer<typeof vehicleTypeEnum>;

export const capabilityTypeEnum = z.enum([
  "pickup_truck", "cargo_van", "box_truck", "flatbed", "trailer", 
  "labor_only", "uhaul_unload", "furniture_assembly"
]);
export type CapabilityType = z.infer<typeof capabilityTypeEnum>;

export const loadSizeEnum = z.enum(["small", "medium", "large", "extra_large", "minimum", "quarter", "half", "three_quarter", "full", "items"]);
export type LoadSize = z.infer<typeof loadSizeEnum>;

export const usersRelations = relations(users, ({ one, many }) => ({
  haulerProfile: one(haulerProfiles, {
    fields: [users.id],
    references: [haulerProfiles.userId],
  }),
  customerRequests: many(serviceRequests),
  locationHistory: many(locationHistory),
}));

// InsertUser schema for validation
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });

export const haulerProfiles = pgTable("hauler_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  companyName: text("company_name").notNull(),
  bio: text("bio"),
  vehicleType: text("vehicle_type").notNull(),
  capacity: text("capacity").notNull(),
  serviceTypes: text("service_types").array().default(sql`ARRAY['junk_removal', 'furniture_moving', 'garage_cleanout', 'estate_cleanout', 'pressure_washing', 'gutter_cleaning', 'moving_labor', 'light_demolition', 'home_consultation', 'home_cleaning', 'pool_cleaning', 'landscaping', 'carpet_cleaning']::text[]`),
  capabilities: text("capabilities").array().default(sql`ARRAY[]::text[]`),
  offersLaborOnly: boolean("offers_labor_only").default(false),
  serviceRadius: integer("service_radius").notNull().default(25),
  rating: real("rating").default(5.0),
  reviewCount: integer("review_count").default(0),
  jobsCompleted: integer("jobs_completed").default(0),
  yearsInBusiness: integer("years_in_business").default(1),
  isAvailable: boolean("is_available").default(false),
  lastCheckedIn: text("last_checked_in"),
  currentLat: real("current_lat"),
  currentLng: real("current_lng"),
  hourlyRate: real("hourly_rate").default(75),
  verified: boolean("verified").default(false),
  insuranceCoverage: text("insurance_coverage").default("$1M"),
  phone: text("phone"),
  website: text("website"),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  twitterUrl: text("twitter_url"),
  yelpUrl: text("yelp_url"),
  stripeAccountId: text("stripe_account_id"),
  stripeOnboardingComplete: boolean("stripe_onboarding_complete").default(false),
  incidentStripeCustomerId: text("incident_stripe_customer_id"),
  incidentPaymentMethodId: text("incident_payment_method_id"),
  hasCardOnFile: boolean("has_card_on_file").default(false),
  backgroundCheckStatus: text("background_check_status").default("pending"),
  backgroundCheckId: text("background_check_id"),
  backgroundCheckCompletedAt: text("background_check_completed_at"),
  canAcceptJobs: boolean("can_accept_jobs").default(false),
  activeVehicleId: varchar("active_vehicle_id"),
  activeTravelRadius: integer("active_travel_radius").default(25),
  // PYCKER tier system
  pyckerTier: text("pycker_tier").default("independent"), // 'verified_pro' or 'independent'
  hasInsurance: boolean("has_insurance").default(false),
  insuranceVerifiedAt: text("insurance_verified_at"),
  hasBusinessLicense: boolean("has_business_license").default(false),
  businessLicenseVerifiedAt: text("business_license_verified_at"),
  droneCertified: boolean("drone_certified").default(false), // FAA Part 107 certified for DwellScan Aerial
  walkthroughQualified: boolean("walkthrough_qualified").default(true), // Can perform interior walkthroughs
  canDoCombinedDwellscan: boolean("can_do_combined_dwellscan").default(false), // drone_certified AND walkthrough_qualified — opts in during onboarding
  payoutPercentage: real("payout_percentage").default(0.75), // 75% for independent, 80% for verified_pro
  isVerifiedLlc: boolean("is_verified_llc").default(false),
  fiveStarJobCount: real("five_star_job_count").default(0),
  loyaltyPriorityBoost: boolean("loyalty_priority_boost").default(false),
  // Green Guarantee rebate balance
  rebateBalance: real("rebate_balance").default(0), // Accumulated rebate credits from proper disposal
  // Languages spoken by PYCKER
  languagesSpoken: text("languages_spoken").array().default(sql`ARRAY['en']::text[]`), // ['en', 'es', 'pt', etc.]
  // Photo verification
  profilePhotoUrl: text("profile_photo_url"), // Selfie for customer-facing profile
  driversLicensePhotoUrl: text("drivers_license_photo_url"), // DL photo for verification
  selfiePhotoUrl: text("selfie_photo_url"), // ID verification selfie (holding ID)
  idPhotoUrl: text("id_photo_url"), // Government-issued ID photo
  // General Liability Insurance
  generalLiabilityProvider: text("general_liability_provider"),
  generalLiabilityPolicyNumber: text("general_liability_policy_number"),
  generalLiabilityExpiration: text("general_liability_expiration"),
  generalLiabilityDocumentUrl: text("general_liability_document_url"),
  // Vehicle Insurance
  vehicleInsuranceProvider: text("vehicle_insurance_provider"),
  vehicleInsurancePolicyNumber: text("vehicle_insurance_policy_number"),
  vehicleInsuranceExpiration: text("vehicle_insurance_expiration"),
  vehicleInsuranceDocumentUrl: text("vehicle_insurance_document_url"),
  // $10/job Insurance Surcharge System
  hasOwnLiabilityInsurance: boolean("has_own_liability_insurance").default(false), // Does Pro have their own $1M+ liability policy?
  liabilityInsuranceCertificateUrl: text("liability_insurance_certificate_url"), // COI document upload
  liabilityInsuranceVerifiedAt: text("liability_insurance_verified_at"), // When UpTend verified the COI
  insuranceSurchargeWaived: boolean("insurance_surcharge_waived").default(false), // Waived = Pro has own insurance
  // NDA / Non-Solicitation Agreement
  ndaAcceptedAt: text("nda_accepted_at"), // ISO timestamp when NDA was accepted
  ndaVersion: text("nda_version"), // Version of NDA accepted (e.g., "1.0")
  ndaIpAddress: text("nda_ip_address"), // IP address at time of acceptance for legal record
  ndaSignature: text("nda_signature"), // Digital signature (typed full name)
  // Career Ladder
  level: integer("level").default(1), // 1=Rookie, 2=Verified Pro, 3=Consultant
  xpPoints: integer("xp_points").default(0),
  fiveStarRatingCount: integer("five_star_rating_count").default(0),
  isConsultantEligible: boolean("is_consultant_eligible").default(false),
  commissionRate: integer("commission_rate").default(0),
  // Unlicensed 5 Equipment & Skills
  supportedServices: jsonb("supported_services").$type<string[]>().default(sql`'["junk_removal"]'::jsonb`),
  hasPressureWasher: boolean("has_pressure_washer").default(false),
  hasTallLadder: boolean("has_tall_ladder").default(false),
  hasDemoTools: boolean("has_demo_tools").default(false),
  isCertified: boolean("is_certified").default(false),
  certifiedAt: text("certified_at"),
  rookieJobsCompleted: integer("rookie_jobs_completed").default(0),
  isRookieMode: boolean("is_rookie_mode").default(true),
  funFact: text("fun_fact"),
  videoIntroUrl: text("video_intro_url"),
  safetyCode: text("safety_code"),
  // Landscaping Service
  landscapingCertified: boolean("landscaping_certified").default(false),
  lawnEquipment: jsonb("lawn_equipment").default({}), // { "mower": "commercial_zero_turn" | "commercial_walk_behind", "edger": true, "blower": true, "trimmer": true, "type": "gas" | "electric" | "manual" }
  // Carpet Cleaning Service
  carpetCertified: boolean("carpet_certified").default(false),
  hasTruckMount: boolean("has_truck_mount").default(false), // Required for HWE (Hot Water Extraction) method
  // Same-Day Service
  sameDayAvailable: boolean("same_day_available").default(false), // Opt-in to same-day jobs
  sameDayRadius: integer("same_day_radius").default(15), // Miles radius for same-day availability
  // Independent Contractor Agreement (ICA)
  icaAcceptedAt: text("ica_accepted_at"), // ISO timestamp when ICA was accepted
  icaSignedName: text("ica_signed_name"), // Full legal name typed as electronic signature
  icaVersion: text("ica_version"), // Version of ICA accepted (e.g., "v1.0")
  // No-Show Protection
  noShowCount: integer("no_show_count").default(0),
  lastNoShowAt: text("last_no_show_at"),
});

export const haulerProfilesRelations = relations(haulerProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [haulerProfiles.userId],
    references: [users.id],
  }),
  vehicles: many(pyckerVehicles),
}));

export const insertHaulerProfileSchema = createInsertSchema(haulerProfiles).omit({ id: true });
export type InsertHaulerProfile = z.infer<typeof insertHaulerProfileSchema>;
export type HaulerProfile = typeof haulerProfiles.$inferSelect;

export const pyckerVehicles = pgTable("pycker_vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  haulerProfileId: varchar("hauler_profile_id").notNull(),
  vehicleType: text("vehicle_type").notNull(),
  vehicleName: text("vehicle_name").notNull(),
  year: text("year"),
  make: text("make"),
  model: text("model"),
  licensePlate: text("license_plate"),
  capacity: text("capacity").notNull(),
  isEnclosed: boolean("is_enclosed").default(false),
  hasTrailer: boolean("has_trailer").default(false),
  trailerSize: text("trailer_size"),
  bedLength: text("bed_length"),
  maxWeight: integer("max_weight"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: text("created_at").notNull(),
  photoUrls: text("photo_urls").array().default(sql`ARRAY[]::text[]`), // Vehicle photos for validation and customer display
});

export const pyckerVehiclesRelations = relations(pyckerVehicles, ({ one }) => ({
  haulerProfile: one(haulerProfiles, {
    fields: [pyckerVehicles.haulerProfileId],
    references: [haulerProfiles.id],
  }),
}));

export const insertPyckerVehicleSchema = createInsertSchema(pyckerVehicles).omit({ id: true });
export type InsertPyckerVehicle = z.infer<typeof insertPyckerVehicleSchema>;
export type PyckerVehicle = typeof pyckerVehicles.$inferSelect;

// Email verification codes for PYCKER registration
export const emailVerificationCodes = pgTable("email_verification_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmailVerificationCodeSchema = createInsertSchema(emailVerificationCodes).omit({ id: true, createdAt: true });
export type InsertEmailVerificationCode = z.infer<typeof insertEmailVerificationCodeSchema>;
export type EmailVerificationCode = typeof emailVerificationCodes.$inferSelect;

export const serviceRequests = pgTable("service_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(),
  serviceType: text("service_type").notNull(),
  status: text("status").notNull().default("draft"),
  pickupAddress: text("pickup_address").notNull(),
  pickupCity: text("pickup_city").notNull(),
  pickupZip: text("pickup_zip").notNull(),
  pickupLat: real("pickup_lat"),
  pickupLng: real("pickup_lng"),
  destinationAddress: text("destination_address"),
  destinationCity: text("destination_city"),
  destinationZip: text("destination_zip"),
  destinationLat: real("destination_lat"),
  destinationLng: real("destination_lng"),
  pickupStairs: integer("pickup_stairs").default(0),
  destinationStairs: integer("destination_stairs").default(0),
  moveServiceMode: text("move_service_mode").default("truck_and_mover"),
  loadEstimate: text("load_estimate").notNull(),
  description: text("description"),
  accessNotes: text("access_notes"),
  scheduledFor: text("scheduled_for").notNull(),
  priceEstimate: real("price_estimate"),
  finalPrice: real("final_price"),
  livePrice: real("live_price"),
  baseServicePrice: real("base_service_price"), // Service price before 7% UpTend Protection Fee (used for Pro payout calculation)
  surgeFactor: real("surge_factor").default(1.0),
  distanceMiles: real("distance_miles"),
  assignedHaulerId: varchar("assigned_hauler_id"),
  photoUrls: text("photo_urls").array(),
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  paymentStatus: text("payment_status").default("pending"),
  platformFee: real("platform_fee"),
  haulerPayout: real("hauler_payout"),
  paidAt: text("paid_at"),
  acceptedAt: text("accepted_at"),
  contactRequiredBy: text("contact_required_by"),
  contactConfirmedAt: text("contact_confirmed_at"),
  contactReleasedAt: text("contact_released_at"),
  haulerPenaltyApplied: boolean("hauler_penalty_applied").default(false),
  tipAmount: real("tip_amount"),
  tipPaidAt: text("tip_paid_at"),
  tipStripeTransferId: text("tip_stripe_transfer_id"),
  bookingSource: text("booking_source").default("app"),
  firstJobDiscountApplied: boolean("first_job_discount_applied").default(false),
  promotionDiscountAmount: real("promotion_discount_amount").default(0),
  preferVerifiedPro: boolean("prefer_verified_pro").default(false), // Customer preference to only match with Verified Pro PYCKERs
  cancelledAt: text("cancelled_at"),
  cancelledBy: text("cancelled_by"), // 'pycker' or 'customer' or 'system'
  cancellationReason: text("cancellation_reason"),
  cancellationPenaltyCharged: boolean("cancellation_penalty_charged").default(false),
  cancellationPenaltyId: varchar("cancellation_penalty_id"),
  // Environmental Impact tracking
  environmentalCertificateId: varchar("environmental_certificate_id"),
  disposalRecycledPercent: integer("disposal_recycled_percent").default(0),
  disposalDonatedPercent: integer("disposal_donated_percent").default(0),
  disposalLandfilledPercent: integer("disposal_landfilled_percent").default(0),
  carbonFootprintLbs: real("carbon_footprint_lbs"),
  carbonOffsetPurchased: boolean("carbon_offset_purchased").default(false),
  disposalFacilities: text("disposal_facilities").array(),
  environmentalReportGeneratedAt: text("environmental_report_generated_at"),
  // Truck unloading specific fields
  truckSize: text("truck_size"), // '10ft', '15ft', '20ft', '26ft' (U-Haul sizes)
  bedroomCount: integer("bedroom_count"), // 1-5+ bedrooms
  hasAppliances: boolean("has_appliances").default(false),
  appliancesList: text("appliances_list").array(), // ['refrigerator', 'washer', 'dryer', 'dishwasher', etc.]
  hasHeavyItems: boolean("has_heavy_items").default(false),
  heavyItemsList: text("heavy_items_list").array(), // ['piano', 'safe', 'pool_table', etc.]
  estimatedHours: real("estimated_hours"), // Estimated labor hours
  // Customer language preference
  preferredLanguage: text("preferred_language").default("en"), // 'en', 'es', 'pt', etc.
  // Real-Time Matching window fields
  matchingStartedAt: text("matching_started_at"), // When matching countdown began
  matchingExpiresAt: text("matching_expires_at"), // When the Real-Time Matching window expires
  needsManualMatch: boolean("needs_manual_match").default(false), // True if no PYCKER matched in time
  manualMatchAlertSentAt: text("manual_match_alert_sent_at"), // When admin was alerted
  // Customer contact info for booking confirmations
  customerPhone: text("customer_phone"),
  customerEmail: text("customer_email"),
  // Buy Now Pay Later (BNPL) for orders $250+
  bnplEnabled: boolean("bnpl_enabled").default(false), // True if customer chose BNPL
  bnplProvider: text("bnpl_provider"), // 'affirm' or 'klarna'
  bnplPaymentMethodId: text("bnpl_payment_method_id"), // Stripe payment method for BNPL
  backupPaymentMethodId: text("backup_payment_method_id"), // Card on file for on-site price adjustments
  bnplConfirmedAt: text("bnpl_confirmed_at"), // When BNPL was confirmed
  bnplAdjustmentCharged: real("bnpl_adjustment_charged"), // Extra amount charged to backup card
  bnplAdjustmentChargedAt: text("bnpl_adjustment_charged_at"), // When adjustment was charged
  // Customer-selected items (structured JSON for manual item selection)
  customerItems: text("customer_items"), // JSON: [{id, label, quantity, price}]
  // AI Price Range & PYCKER Verification
  aiPriceMin: real("ai_price_min"),
  aiPriceMax: real("ai_price_max"),
  aiConfidence: real("ai_confidence"),
  verificationStatus: text("verification_status").default("pending"),
  verifiedAt: text("verified_at"),
  verifierNotes: text("verifier_notes"),
  verifiedItems: text("verified_items"), // JSON: PYCKER-confirmed items [{id, label, quantity, price}]
  routeOrder: integer("route_order"),
  // Bounty Hunter Mode - surge pricing for hard-to-fill jobs
  bountyAmount: integer("bounty_amount").default(0),
  lastBountyUpdate: text("last_bounty_update"),
  // Smart Lock Integration - B2B access codes
  accessType: text("access_type").default("person"), // 'smart_lock', 'lockbox', 'person'
  encryptedAccessCode: text("encrypted_access_code"),
  accessWindowStart: text("access_window_start"),
  accessWindowEnd: text("access_window_end"),
  // Carbon Offset Upsell
  carbonOffsetOptIn: boolean("carbon_offset_opt_in").default(false),
  carbonOffsetFee: integer("carbon_offset_fee").default(0), // in cents, e.g. 499 = $4.99
  // Vision Vault: Ground Truth Data for AI Training
  aiEstimatedWeight: integer("ai_estimated_weight"),
  actualDisposalWeight: integer("actual_disposal_weight"),
  aiPriceQuote: integer("ai_price_quote"),
  finalDisposalCost: integer("final_disposal_cost"),
  visionAccuracyScore: integer("vision_accuracy_score"),
  trainingConsent: boolean("training_consent").default(true),
  // Field Audit Protocol
  originalAiPrice: integer("original_ai_price"),
  finalLockedPrice: integer("final_locked_price"),
  adjustmentReason: text("adjustment_reason"),
  addedLineItems: text("added_line_items"), // JSON array of { name, cost }
  customerSignatureUrl: text("customer_signature_url"),
  isPriceLocked: boolean("is_price_locked").default(false),
  // Ghost Buster Protocol
  arrivedAt: text("arrived_at"),
  isGhostFlagged: boolean("is_ghost_flagged").default(false),
  // Insurance Flexibility
  insuranceProvider: text("insurance_provider").default("UpTend_Blanket"),
  externalPolicyId: text("external_policy_id"),
  insuranceCost: integer("insurance_cost"),
  // Agent Booking
  isAgentBooking: boolean("is_agent_booking").default(false),
  // Unlicensed 5 Dynamic Pricing Fields
  squareFootage: integer("square_footage"),
  storyCount: integer("story_count"),
  laborHours: integer("labor_hours"),
  laborCrewSize: integer("labor_crew_size").default(1),
  demoDebrisType: varchar("demo_debris_type"),
  isConsultationCreditApplied: boolean("is_consultation_credit_applied").default(false),
  // Price Verification (10% Wiggle Room Rule)
  priceVerified: boolean("price_verified").default(false),
  verifiedPrice: real("verified_price"),
  priceAdjustment: real("price_adjustment"), // Difference from original quote
  priceVerificationData: text("price_verification_data"), // JSON with full verification details
  verificationPhotos: text("verification_photos").array(),
  priceApprovalPending: boolean("price_approval_pending").default(false),
  priceApprovalRequestedAt: text("price_approval_requested_at"),
  priceApprovalRespondedAt: text("price_approval_responded_at"),
  customerApprovedPriceAdjustment: boolean("customer_approved_price_adjustment"),
  customerNotes: text("customer_notes"), // Customer's notes when approving/rejecting price
  // Discount Tracking
  discountsApplied: text("discounts_applied"), // JSON array of applied discounts
  dwellScanCreditUsed: real("dwellscan_credit_used"), // Amount of DwellScan credit applied
  dwellScanCreditId: varchar("dwellscan_credit_id"), // Reference to dwellscan_credits table
  multiServiceDiscountPercent: real("multi_service_discount_percent"), // 0.10 for 10%, 0.15 for 15%
  pmTierDiscountPercent: real("pm_tier_discount_percent"), // Property Manager discount if applied
  promoCodeUsed: varchar("promo_code_used"),
  promoCodeDiscountAmount: real("promo_code_discount_amount"),
  totalDiscountAmount: real("total_discount_amount"), // Sum of all discounts
  priceBeforeDiscounts: real("price_before_discounts"), // Original subtotal
  // Quote method tracking
  quoteMethod: varchar("quote_method").default("manual"), // 'ai', 'manual', 'home_health_audit'
  estimatedPrice: real("estimated_price"), // Original estimated price from quote
  // Service-specific details
  freshSpaceDetails: jsonb("fresh_space_details"), // Details for home cleaning service
  recurringSubscriptionId: varchar("recurring_subscription_id"), // FK to recurring subscriptions
  // Guaranteed Price Ceiling
  guaranteedCeiling: real("guaranteed_ceiling"),
  finalCustomerPrice: real("final_customer_price"),
  ceilingOutcome: text("ceiling_outcome"), // 'under_ceiling' | 'at_ceiling' | 'scope_change'
  customerSavings: real("customer_savings"),
  ceilingLockedAt: text("ceiling_locked_at"),
  // Chargeback/Dispute Protection Fields
  tosAcceptedAt: text("tos_accepted_at"),
  cancellationPolicyAcceptedAt: text("cancellation_policy_accepted_at"),
  customerSignoffAt: text("customer_signoff_at"),
  customerSignoffMethod: text("customer_signoff_method"), // 'manual' | 'auto' | null
  // No-Show Protection
  isUrgentReassign: boolean("is_urgent_reassign").default(false),
  originalProId: text("original_pro_id"),
  noShowAt: text("no_show_at"),
});

export const serviceRequestsRelations = relations(serviceRequests, ({ one, many }) => ({
  customer: one(users, {
    fields: [serviceRequests.customerId],
    references: [users.id],
  }),
  assignedHauler: one(users, {
    fields: [serviceRequests.assignedHaulerId],
    references: [users.id],
  }),
  matches: many(matchAttempts),
  crewAssignments: many(jobCrewAssignments),
}));

export const insertServiceRequestSchema = createInsertSchema(serviceRequests).omit({ id: true });
export type InsertServiceRequest = z.infer<typeof insertServiceRequestSchema>;
export type ServiceRequest = typeof serviceRequests.$inferSelect;

export const matchAttempts = pgTable("match_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id").notNull(),
  haulerId: varchar("hauler_id").notNull(),
  status: text("status").notNull().default("pending"),
  quotedPrice: real("quoted_price"),
  etaMinutes: integer("eta_minutes"),
  expiresAt: text("expires_at"),
  createdAt: text("created_at").notNull(),
});

export const matchAttemptsRelations = relations(matchAttempts, ({ one }) => ({
  request: one(serviceRequests, {
    fields: [matchAttempts.requestId],
    references: [serviceRequests.id],
  }),
  hauler: one(users, {
    fields: [matchAttempts.haulerId],
    references: [users.id],
  }),
}));

export const insertMatchAttemptSchema = createInsertSchema(matchAttempts).omit({ id: true });
export type InsertMatchAttempt = z.infer<typeof insertMatchAttemptSchema>;
export type MatchAttempt = typeof matchAttempts.$inferSelect;

/**
 * Job Crew Assignments - Multi-Pro Labor Jobs
 *
 * When a customer books a labor service requiring multiple Pros (laborCrewSize > 1),
 * this table tracks each Pro's acceptance status. Jobs remain "pending" and visible
 * to other Pros until all crew positions are filled.
 *
 * Implementation TODO:
 * 1. Run migration to create this table
 * 2. Update job acceptance logic to create crew assignments
 * 3. Keep jobs visible until X of X Pros confirmed
 * 4. Update Pro dashboard to query crew status
 * 5. Add API endpoint: GET /api/jobs/:id/crew-status
 */
export const jobCrewAssignments = pgTable("job_crew_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id").notNull(),
  haulerId: varchar("hauler_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, declined, cancelled
  acceptedAt: text("accepted_at"),
  declinedAt: text("declined_at"),
  cancelledAt: text("cancelled_at"),
  createdAt: text("created_at").notNull(),
});

export const jobCrewAssignmentsRelations = relations(jobCrewAssignments, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [jobCrewAssignments.serviceRequestId],
    references: [serviceRequests.id],
  }),
  hauler: one(users, {
    fields: [jobCrewAssignments.haulerId],
    references: [users.id],
  }),
}));

export const insertJobCrewAssignmentSchema = createInsertSchema(jobCrewAssignments).omit({ id: true });
export type InsertJobCrewAssignment = z.infer<typeof insertJobCrewAssignmentSchema>;
export type JobCrewAssignment = typeof jobCrewAssignments.$inferSelect;

export const locationHistory = pgTable("location_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  jobId: varchar("job_id"),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  accuracy: real("accuracy"),
  heading: real("heading"),
  speed: real("speed"),
  recordedAt: text("recorded_at").notNull(),
});

export const locationHistoryRelations = relations(locationHistory, ({ one }) => ({
  user: one(users, {
    fields: [locationHistory.userId],
    references: [users.id],
  }),
  job: one(serviceRequests, {
    fields: [locationHistory.jobId],
    references: [serviceRequests.id],
  }),
}));

export const insertLocationHistorySchema = createInsertSchema(locationHistory).omit({ id: true });
export type InsertLocationHistory = z.infer<typeof insertLocationHistorySchema>;
export type LocationHistory = typeof locationHistory.$inferSelect;

// PYCKER Online Status - tracks real-time location of available PYCKERs
export const pyckerOnlineStatusEnum = z.enum(["available", "busy", "offline"]);
export type PyckerOnlineStatusType = z.infer<typeof pyckerOnlineStatusEnum>;

export const pyckerOnlineStatus = pgTable("pycker_online_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pyckerId: varchar("pycker_id").notNull(), // hauler profile id
  userId: varchar("user_id").notNull(), // user id for the pycker
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  accuracy: real("accuracy"), // GPS accuracy in meters
  status: text("status").notNull().default("available"), // available, busy, offline
  currentJobId: varchar("current_job_id"), // if busy, which job
  lastUpdated: text("last_updated").notNull(),
  locationConsentGiven: boolean("location_consent_given").default(false),
  consentGivenAt: text("consent_given_at"),
  // Battery optimization - track update frequency
  updateIntervalSeconds: integer("update_interval_seconds").default(30),
  // Privacy - auto-expire after 48 hours
  expiresAt: text("expires_at").notNull(),
});

export const pyckerOnlineStatusRelations = relations(pyckerOnlineStatus, ({ one }) => ({
  haulerProfile: one(haulerProfiles, {
    fields: [pyckerOnlineStatus.pyckerId],
    references: [haulerProfiles.id],
  }),
  user: one(users, {
    fields: [pyckerOnlineStatus.userId],
    references: [users.id],
  }),
  currentJob: one(serviceRequests, {
    fields: [pyckerOnlineStatus.currentJobId],
    references: [serviceRequests.id],
  }),
}));

export const insertPyckerOnlineStatusSchema = createInsertSchema(pyckerOnlineStatus).omit({ id: true });
export type InsertPyckerOnlineStatus = z.infer<typeof insertPyckerOnlineStatusSchema>;
export type PyckerOnlineStatus = typeof pyckerOnlineStatus.$inferSelect;

// Environmental Certificates for completed jobs
export const environmentalCertificates = pgTable("environmental_certificates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id").notNull(),
  customerId: varchar("customer_id").notNull(),
  certificateNumber: varchar("certificate_number").notNull(),
  // Disposal breakdown
  recycledPercent: integer("recycled_percent").notNull().default(0),
  donatedPercent: integer("donated_percent").notNull().default(0),
  landfilledPercent: integer("landfilled_percent").notNull().default(0),
  // Disposal facilities used
  facilities: text("facilities").array(),
  facilityTypes: text("facility_types").array(), // 'recycling_center', 'donation_center', 'landfill'
  // Weight tracking
  totalWeightLbs: real("total_weight_lbs"),
  recycledWeightLbs: real("recycled_weight_lbs"),
  donatedWeightLbs: real("donated_weight_lbs"),
  landfilledWeightLbs: real("landfilled_weight_lbs"),
  // Carbon footprint
  haulDistanceMiles: real("haul_distance_miles"),
  carbonFootprintLbs: real("carbon_footprint_lbs"),
  carbonOffsetPurchased: boolean("carbon_offset_purchased").default(true),
  carbonOffsetCost: real("carbon_offset_cost"),
  // Certificate details
  issuedAt: text("issued_at").notNull(),
  expiresAt: text("expires_at"),
  verificationUrl: text("verification_url"),
  createdAt: text("created_at").notNull(),
});

export const environmentalCertificatesRelations = relations(environmentalCertificates, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [environmentalCertificates.serviceRequestId],
    references: [serviceRequests.id],
  }),
  customer: one(users, {
    fields: [environmentalCertificates.customerId],
    references: [users.id],
  }),
}));

export const insertEnvironmentalCertificateSchema = createInsertSchema(environmentalCertificates).omit({ id: true });
export type InsertEnvironmentalCertificate = z.infer<typeof insertEnvironmentalCertificateSchema>;
export type EnvironmentalCertificate = typeof environmentalCertificates.$inferSelect;

// DwellScan Credits - $49 credit toward next service
export const dwellScanCredits = pgTable("dwellscan_credits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(),
  dwellScanJobId: varchar("dwellscan_job_id").notNull(), // The DwellScan service request that earned this credit
  creditAmount: integer("credit_amount").notNull().default(49), // In dollars
  used: boolean("used").default(false),
  usedOnBookingId: varchar("used_on_booking_id"), // Service request where credit was applied
  usedAt: text("used_at"),
  createdAt: text("created_at").notNull(),
  expiresAt: text("expires_at").notNull(), // 90 days from creation
});

export const dwellScanCreditsRelations = relations(dwellScanCredits, ({ one }) => ({
  customer: one(users, {
    fields: [dwellScanCredits.customerId],
    references: [users.id],
  }),
  dwellScanJob: one(serviceRequests, {
    fields: [dwellScanCredits.dwellScanJobId],
    references: [serviceRequests.id],
  }),
  usedOnBooking: one(serviceRequests, {
    fields: [dwellScanCredits.usedOnBookingId],
    references: [serviceRequests.id],
  }),
}));

export const insertDwellScanCreditSchema = createInsertSchema(dwellScanCredits).omit({ id: true, createdAt: true });
export type InsertDwellScanCredit = z.infer<typeof insertDwellScanCreditSchema>;
export type DwellScanCredit = typeof dwellScanCredits.$inferSelect;

export const pricingRates = pgTable("pricing_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceType: text("service_type").notNull(),
  vehicleType: text("vehicle_type"),
  loadSize: text("load_size").notNull(),
  baseRate: real("base_rate").notNull(),
  perMileRate: real("per_mile_rate").notNull().default(1.0),
  minPrice: real("min_price").notNull().default(75),
  maxPrice: real("max_price"),
  isActive: boolean("is_active").default(true),
});

export const insertPricingRateSchema = createInsertSchema(pricingRates).omit({ id: true });
export type InsertPricingRate = z.infer<typeof insertPricingRateSchema>;
export type PricingRate = typeof pricingRates.$inferSelect;

export const surgeModifiers = pgTable("surge_modifiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dayOfWeek: integer("day_of_week"),
  startHour: integer("start_hour").notNull(),
  endHour: integer("end_hour").notNull(),
  multiplier: real("multiplier").notNull().default(1.0),
  reason: text("reason"),
  isActive: boolean("is_active").default(true),
});

export const insertSurgeModifierSchema = createInsertSchema(surgeModifiers).omit({ id: true });
export type InsertSurgeModifier = z.infer<typeof insertSurgeModifierSchema>;
export type SurgeModifier = typeof surgeModifiers.$inferSelect;

export const haulerPenalties = pgTable("hauler_penalties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  haulerId: varchar("hauler_id").notNull(),
  requestId: varchar("request_id"),
  reason: text("reason").notNull(),
  amount: real("amount").notNull().default(25),
  status: text("status").notNull().default("assessed"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  chargedAt: text("charged_at"),
  waivedAt: text("waived_at"),
  waivedReason: text("waived_reason"),
  createdAt: text("created_at").notNull(),
});

export const haulerPenaltiesRelations = relations(haulerPenalties, ({ one }) => ({
  hauler: one(users, {
    fields: [haulerPenalties.haulerId],
    references: [users.id],
  }),
  request: one(serviceRequests, {
    fields: [haulerPenalties.requestId],
    references: [serviceRequests.id],
  }),
}));

export const insertHaulerPenaltySchema = createInsertSchema(haulerPenalties).omit({ id: true });
export type InsertHaulerPenalty = z.infer<typeof insertHaulerPenaltySchema>;
export type HaulerPenalty = typeof haulerPenalties.$inferSelect;

export type HaulerWithProfile = User & {
  profile: HaulerProfile;
  haulerInfo?: HaulerProfile; // Alias for profile
  name?: string; // Computed from firstName/lastName or username
};
export type HaulerWithProfileAndVehicle = User & {
  profile: HaulerProfile;
  activeVehicle?: PyckerVehicle;
  haulerInfo?: HaulerProfile; // Alias for profile
  name?: string; // Computed from firstName/lastName or username
};

// Type aliases for Pro terminology (backwards compatibility)
export type ProWithProfile = HaulerWithProfile;
export type ProWithProfileAndVehicle = HaulerWithProfileAndVehicle;
export type ProVehicle = PyckerVehicle;

export type ServiceRequestWithDetails = ServiceRequest & {
  customer?: User;
  hauler?: HaulerWithProfileAndVehicle;
  matches?: MatchAttempt[];
  distance?: number;
  estimatedMinutes?: number;
};

export type PriceQuote = {
  basePrice: number;
  distanceCharge: number;
  loadSizeMultiplier: number;
  vehicleSurcharge: number;
  surgeMultiplier: number;
  totalPrice: number;
  priceMin: number;
  priceMax: number;
  confidence: number;
  breakdown: {
    label: string;
    amount: number;
  }[];
};

export const aiEstimates = pgTable("ai_estimates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestId: varchar("request_id"), // Nullable for unauthenticated quotes (linked later on booking)
  quoteMethod: varchar("quote_method").default("ai"), // ai, manual, home_health_audit
  serviceType: varchar("service_type"), // junk_removal, pressure_washing, etc.
  photoUrls: text("photo_urls").array(),
  videoUrl: text("video_url"),
  identifiedItems: text("identified_items").array(),
  estimatedVolumeCubicFt: real("estimated_volume_cubic_ft"),
  recommendedLoadSize: text("recommended_load_size"),
  confidence: real("confidence"),
  suggestedPrice: real("suggested_price"),
  suggestedPriceMin: real("suggested_price_min"),
  suggestedPriceMax: real("suggested_price_max"),
  reasoning: text("reasoning"),
  rawResponse: text("raw_response"),

  // Manual estimate fields
  manualInputs: text("manual_inputs"), // JSON: {sqft, stories, hours, items, etc.}
  requiresHitlValidation: boolean("requires_hitl_validation").default(false),
  validatedPrice: real("validated_price"),
  validatedBy: varchar("validated_by"), // Pro ID who validated

  // Pressure washing specific
  totalSqft: real("total_sqft"),
  surfaces: text("surfaces"), // JSON array of surface objects

  // Home Health Audit specific
  homeHealthReport: text("home_health_report"), // JSON: comprehensive home assessment
  uptendServices: text("uptend_services"), // JSON: services UpTend can handle with quotes
  referralRecommendations: text("referral_recommendations"), // JSON: services requiring partners
  priorityLevel: varchar("priority_level"), // urgent, recommended, optional

  createdAt: text("created_at").notNull(),
});

export const insertAiEstimateSchema = createInsertSchema(aiEstimates).omit({ id: true });
export type InsertAiEstimate = z.infer<typeof insertAiEstimateSchema>;
export type AiEstimate = typeof aiEstimates.$inferSelect;

export const haulerReviews = pgTable("hauler_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  haulerId: varchar("hauler_id").notNull(),
  customerId: varchar("customer_id").notNull(),
  serviceRequestId: varchar("service_request_id").notNull(),
  rating: integer("rating").notNull(),
  title: text("title"),
  comment: text("comment"),
  createdAt: text("created_at").notNull(),
});

export const haulerReviewsRelations = relations(haulerReviews, ({ one }) => ({
  hauler: one(haulerProfiles, {
    fields: [haulerReviews.haulerId],
    references: [haulerProfiles.id],
  }),
  customer: one(users, {
    fields: [haulerReviews.customerId],
    references: [users.id],
  }),
  serviceRequest: one(serviceRequests, {
    fields: [haulerReviews.serviceRequestId],
    references: [serviceRequests.id],
  }),
}));

export const insertHaulerReviewSchema = createInsertSchema(haulerReviews).omit({ id: true });
export type InsertHaulerReview = z.infer<typeof insertHaulerReviewSchema>;
export type HaulerReview = typeof haulerReviews.$inferSelect;

export type HaulerReviewWithCustomer = HaulerReview & {
  customer?: User;
};

export const quoteRequestSchema = z.object({
  serviceType: serviceTypeEnum,
  loadSize: loadSizeEnum,
  pickupLat: z.number().optional(),
  pickupLng: z.number().optional(),
  destinationLat: z.number().optional(),
  destinationLng: z.number().optional(),
  vehicleType: vehicleTypeEnum.optional(),
  scheduledFor: z.string().optional(),
});
export type QuoteRequest = z.infer<typeof quoteRequestSchema>;

export const locationUpdateSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  accuracy: z.number().optional(),
  heading: z.number().optional(),
  speed: z.number().optional(),
});
export type LocationUpdate = z.infer<typeof locationUpdateSchema>;

export const haulerCheckInSchema = z.object({
  lat: z.number().optional(),
  lng: z.number().optional(),
});
export type HaulerCheckIn = z.infer<typeof haulerCheckInSchema>;

export const haulerProfileUpdateSchema = z.object({
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  facebookUrl: z.string().url().optional().or(z.literal("")),
  instagramUrl: z.string().url().optional().or(z.literal("")),
  twitterUrl: z.string().url().optional().or(z.literal("")),
  yelpUrl: z.string().url().optional().or(z.literal("")),
  bio: z.string().optional(),
  languagesSpoken: z.array(z.string()).optional(),
  serviceTypes: z.array(z.string()).optional(),
});
export type HaulerProfileUpdate = z.infer<typeof haulerProfileUpdateSchema>;

export const referralStatusEnum = z.enum(["pending", "completed", "paid", "expired"]);
export type ReferralStatus = z.infer<typeof referralStatusEnum>;

export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").notNull(),
  referredEmail: text("referred_email").notNull(),
  referredUserId: varchar("referred_user_id"),
  referralCode: text("referral_code").notNull().unique(),
  status: text("status").notNull().default("pending"),
  referrerBonusAmount: real("referrer_bonus_amount").notNull().default(50),
  referredBonusAmount: real("referred_bonus_amount").notNull().default(50),
  referrerPaidAt: text("referrer_paid_at"),
  referredPaidAt: text("referred_paid_at"),
  firstJobCompletedAt: text("first_job_completed_at"),
  createdAt: text("created_at").notNull(),
  expiresAt: text("expires_at"),
});

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
  }),
  referredUser: one(users, {
    fields: [referrals.referredUserId],
    references: [users.id],
  }),
}));

export const insertReferralSchema = createInsertSchema(referrals).omit({ id: true });
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referrals.$inferSelect;

export const businessAccountTypeEnum = z.enum(["property_manager", "contractor", "retailer", "restaurant", "office", "other"]);
export type BusinessAccountType = z.infer<typeof businessAccountTypeEnum>;

export const businessAccounts = pgTable("business_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  businessName: text("business_name").notNull(),
  businessType: text("business_type").notNull(),
  taxId: text("tax_id"),
  billingAddress: text("billing_address"),
  billingCity: text("billing_city"),
  billingState: text("billing_state"),
  billingZip: text("billing_zip"),
  primaryContactName: text("primary_contact_name"),
  primaryContactPhone: text("primary_contact_phone"),
  primaryContactEmail: text("primary_contact_email"),
  volumeDiscountTier: text("volume_discount_tier").default("none"),
  monthlyJobTarget: integer("monthly_job_target"),
  invoicingEnabled: boolean("invoicing_enabled").default(false),
  netPaymentTerms: integer("net_payment_terms").default(0),
  totalJobsCompleted: integer("total_jobs_completed").default(0),
  totalSpent: real("total_spent").default(0),
  // HOA/Property Management specific fields
  accountType: text("account_type").default("business"), // "hoa", "property_manager", "business"
  communityName: text("community_name"), // For HOAs/property managers
  totalProperties: integer("total_properties").default(0), // Number of properties in community
  referralRate: real("referral_rate").default(0.10), // 10% default referral kickback
  referralProgramActive: boolean("referral_program_active").default(false),
  firstTenJobsBonus: boolean("first_ten_jobs_bonus").default(true), // 10% on first 10 jobs
  jobsWithReferralPaid: integer("jobs_with_referral_paid").default(0), // Track how many jobs had referral fee
  totalReferralFeesEarned: real("total_referral_fees_earned").default(0),
  totalReferralFeesPaid: real("total_referral_fees_paid").default(0),
  carbonCreditBalance: real("carbon_credit_balance").default(0), // Total carbon credits owned (metric tons CO2e)
  carbonCreditsGenerated: real("carbon_credits_generated").default(0), // Lifetime credits generated
  carbonCreditsSold: real("carbon_credits_sold").default(0), // Credits sold
  carbonCreditRevenue: real("carbon_credit_revenue").default(0), // Revenue from selling credits
  stripeConnectAccountId: text("stripe_connect_account_id"), // For automatic referral payouts
  stripeConnectOnboardingComplete: boolean("stripe_connect_onboarding_complete").default(false),
  // Weekly Billing fields
  billingFrequency: text("billing_frequency").default("weekly"),
  paymentMethodId: text("payment_method_id"), // Stripe payment method for auto-billing
  stripeCustomerId: text("stripe_customer_id"), // Stripe customer ID for billing
  autoBillingEnabled: boolean("auto_billing_enabled").default(true),
  billingContactEmail: text("billing_contact_email"),
  billingDayOfWeek: integer("billing_day_of_week").default(1), // 1 = Monday
  createdAt: text("created_at").notNull(),
});

export const businessAccountsRelations = relations(businessAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [businessAccounts.userId],
    references: [users.id],
  }),
  recurringJobs: many(recurringJobs),
  properties: many(hoaProperties),
  violations: many(hoaViolations),
  referralPayments: many(hoaReferralPayments),
  carbonCredits: many(carbonCredits),
  teamMembers: many(businessTeamMembers),
}));

export const insertBusinessAccountSchema = createInsertSchema(businessAccounts).omit({ id: true });
export type InsertBusinessAccount = z.infer<typeof insertBusinessAccountSchema>;
export type BusinessAccount = typeof businessAccounts.$inferSelect;

// ==========================================
// Business Team Members (Multi-User B2B)
// ==========================================
export const businessTeamMembers = pgTable("business_team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessAccountId: varchar("business_account_id").notNull(),
  userId: varchar("user_id").notNull(),
  role: text("role").notNull().default("member"), // "owner", "admin", "member"

  // Permissions
  canViewFinancials: boolean("can_view_financials").default(false),
  canManageTeam: boolean("can_manage_team").default(false),
  canCreateJobs: boolean("can_create_jobs").default(true),
  canApprovePayments: boolean("can_approve_payments").default(false),
  canAccessEsgReports: boolean("can_access_esg_reports").default(true),
  canManageProperties: boolean("can_manage_properties").default(false),

  // Invitation
  invitedBy: varchar("invited_by"),
  invitationToken: text("invitation_token"),
  invitationStatus: text("invitation_status").default("pending"), // "pending", "accepted", "declined"

  isActive: boolean("is_active").default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const businessTeamMembersRelations = relations(businessTeamMembers, ({ one }) => ({
  businessAccount: one(businessAccounts, {
    fields: [businessTeamMembers.businessAccountId],
    references: [businessAccounts.id],
  }),
  user: one(users, {
    fields: [businessTeamMembers.userId],
    references: [users.id],
  }),
  inviter: one(users, {
    fields: [businessTeamMembers.invitedBy],
    references: [users.id],
  }),
}));

export const insertBusinessTeamMemberSchema = createInsertSchema(businessTeamMembers).omit({ id: true });
export type InsertBusinessTeamMember = z.infer<typeof insertBusinessTeamMemberSchema>;
export type BusinessTeamMember = typeof businessTeamMembers.$inferSelect;

export const recurringFrequencyEnum = z.enum(["daily", "weekly", "biweekly", "monthly", "quarterly"]);
export type RecurringFrequency = z.infer<typeof recurringFrequencyEnum>;

export const recurringJobs = pgTable("recurring_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessAccountId: varchar("business_account_id").notNull(),
  serviceType: text("service_type").notNull(),
  pickupAddress: text("pickup_address").notNull(),
  pickupCity: text("pickup_city").notNull(),
  pickupZip: text("pickup_zip").notNull(),
  description: text("description"),
  frequency: text("frequency").notNull(),
  preferredDayOfWeek: integer("preferred_day_of_week"),
  preferredTimeSlot: text("preferred_time_slot"),
  estimatedLoadSize: text("estimated_load_size").notNull(),
  negotiatedPrice: real("negotiated_price"),
  isActive: boolean("is_active").default(true),
  nextScheduledDate: text("next_scheduled_date"),
  lastCompletedDate: text("last_completed_date"),
  preferredHaulerId: varchar("preferred_hauler_id"),
  totalCompletedJobs: integer("total_completed_jobs").default(0),
  createdAt: text("created_at").notNull(),
});

export const recurringJobsRelations = relations(recurringJobs, ({ one }) => ({
  businessAccount: one(businessAccounts, {
    fields: [recurringJobs.businessAccountId],
    references: [businessAccounts.id],
  }),
  preferredHauler: one(users, {
    fields: [recurringJobs.preferredHaulerId],
    references: [users.id],
  }),
}));

export const insertRecurringJobSchema = createInsertSchema(recurringJobs).omit({ id: true });
export type InsertRecurringJob = z.infer<typeof insertRecurringJobSchema>;
export type RecurringJob = typeof recurringJobs.$inferSelect;

export const loyaltyTierEnum = z.enum(["bronze", "silver", "gold", "platinum"]);
export type LoyaltyTier = z.infer<typeof loyaltyTierEnum>;

export const loyaltyAccounts = pgTable("loyalty_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  currentPoints: integer("current_points").default(0),
  lifetimePoints: integer("lifetime_points").default(0),
  currentTier: text("current_tier").notNull().default("bronze"),
  tierExpiresAt: text("tier_expires_at"),
  totalJobsCompleted: integer("total_jobs_completed").default(0),
  totalSpent: real("total_spent").default(0),
  referralBonusEarned: real("referral_bonus_earned").default(0),
  lastPointsEarnedAt: text("last_points_earned_at"),
  createdAt: text("created_at").notNull(),
});

export const loyaltyAccountsRelations = relations(loyaltyAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [loyaltyAccounts.userId],
    references: [users.id],
  }),
  transactions: many(loyaltyTransactions),
}));

export const insertLoyaltyAccountSchema = createInsertSchema(loyaltyAccounts).omit({ id: true });
export type InsertLoyaltyAccount = z.infer<typeof insertLoyaltyAccountSchema>;
export type LoyaltyAccount = typeof loyaltyAccounts.$inferSelect;

export const loyaltyTransactionTypeEnum = z.enum(["earned", "redeemed", "bonus", "expired", "adjustment"]);
export type LoyaltyTransactionType = z.infer<typeof loyaltyTransactionTypeEnum>;

export const loyaltyTransactions = pgTable("loyalty_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  loyaltyAccountId: varchar("loyalty_account_id").notNull(),
  type: text("type").notNull(),
  points: integer("points").notNull(),
  description: text("description"),
  serviceRequestId: varchar("service_request_id"),
  createdAt: text("created_at").notNull(),
});

export const loyaltyTransactionsRelations = relations(loyaltyTransactions, ({ one }) => ({
  loyaltyAccount: one(loyaltyAccounts, {
    fields: [loyaltyTransactions.loyaltyAccountId],
    references: [loyaltyAccounts.id],
  }),
  serviceRequest: one(serviceRequests, {
    fields: [loyaltyTransactions.serviceRequestId],
    references: [serviceRequests.id],
  }),
}));

export const insertLoyaltyTransactionSchema = createInsertSchema(loyaltyTransactions).omit({ id: true });
export type InsertLoyaltyTransaction = z.infer<typeof insertLoyaltyTransactionSchema>;
export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;

export const loyaltyRewards = pgTable("loyalty_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  pointsCost: integer("points_cost").notNull(),
  rewardType: text("reward_type").notNull(),
  discountAmount: real("discount_amount"),
  discountPercent: real("discount_percent"),
  minimumTier: text("minimum_tier").default("bronze"),
  isActive: boolean("is_active").default(true),
  usageLimit: integer("usage_limit"),
  currentUsageCount: integer("current_usage_count").default(0),
  validFrom: text("valid_from"),
  validUntil: text("valid_until"),
});

export const insertLoyaltyRewardSchema = createInsertSchema(loyaltyRewards).omit({ id: true });
export type InsertLoyaltyReward = z.infer<typeof insertLoyaltyRewardSchema>;
export type LoyaltyReward = typeof loyaltyRewards.$inferSelect;

export const priorityBookingTierEnum = z.enum(["standard", "priority", "premium"]);
export type PriorityBookingTier = z.infer<typeof priorityBookingTierEnum>;

export const LOYALTY_TIER_CONFIG = {
  bronze: { minPoints: 0, pointsMultiplier: 1.0, priorityMatching: false, discountPercent: 0 },
  silver: { minPoints: 500, pointsMultiplier: 1.25, priorityMatching: false, discountPercent: 5 },
  gold: { minPoints: 2000, pointsMultiplier: 1.5, priorityMatching: true, discountPercent: 10 },
  platinum: { minPoints: 5000, pointsMultiplier: 2.0, priorityMatching: true, discountPercent: 15 },
};

export const POINTS_PER_DOLLAR = 10;

// First job discount and app booking priority constants
export const FIRST_JOB_DISCOUNT_AMOUNT = 25;
export const APP_PRIORITY_HOLD_HOURS = 2;

export const bookingSourceEnum = z.enum(["app", "web", "phone", "partner"]);
export type BookingSource = z.infer<typeof bookingSourceEnum>;

// Promotions table for tracking applied discounts
export const promotions = pgTable("promotions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  promotionType: text("promotion_type").notNull(), // 'first_job_discount', 'referral_bonus', etc.
  discountAmount: real("discount_amount").notNull(),
  serviceRequestId: varchar("service_request_id"),
  appliedAt: text("applied_at"),
  createdAt: text("created_at").notNull(),
});

export const promotionsRelations = relations(promotions, ({ one }) => ({
  user: one(users, {
    fields: [promotions.userId],
    references: [users.id],
  }),
  serviceRequest: one(serviceRequests, {
    fields: [promotions.serviceRequestId],
    references: [serviceRequests.id],
  }),
}));

export const insertPromotionSchema = createInsertSchema(promotions).omit({ id: true });
export type InsertPromotion = z.infer<typeof insertPromotionSchema>;
export type Promotion = typeof promotions.$inferSelect;

// App priority slots for same-day and weekend bookings
export const appPrioritySlots = pgTable("app_priority_slots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slotDate: text("slot_date").notNull(),
  slotTime: text("slot_time").notNull(),
  isSameDay: boolean("is_same_day").default(false),
  isWeekend: boolean("is_weekend").default(false),
  reservedForAppUntil: text("reserved_for_app_until"),
  bookedBy: varchar("booked_by"),
  bookingSource: text("booking_source"),
  createdAt: text("created_at").notNull(),
});

export const insertAppPrioritySlotSchema = createInsertSchema(appPrioritySlots).omit({ id: true });
export type InsertAppPrioritySlot = z.infer<typeof insertAppPrioritySlotSchema>;
export type AppPrioritySlot = typeof appPrioritySlots.$inferSelect;

// Analytics events for tracking install and job funnel
export const analyticsEventTypeEnum = z.enum([
  "app_install",
  "app_open",
  "job_posted",
  "job_booked",
  "job_completed",
  "promo_applied",
  "payment_completed"
]);
export type AnalyticsEventType = z.infer<typeof analyticsEventTypeEnum>;

export const analyticsEvents = pgTable("analytics_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  sessionId: varchar("session_id"),
  eventType: text("event_type").notNull(),
  eventData: text("event_data"), // JSON string for additional data
  deviceType: text("device_type"), // mobile, desktop, tablet
  platform: text("platform"), // ios, android, web
  appVersion: text("app_version"),
  referralSource: text("referral_source"),
  createdAt: text("created_at").notNull(),
});

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({ id: true });
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;

// Promo codes for discounts
export const promoCodes = pgTable("promo_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  description: text("description"),
  discountType: text("discount_type").notNull(), // 'fixed' or 'percent'
  discountAmount: real("discount_amount").notNull(),
  minOrderAmount: real("min_order_amount").default(0),
  maxUses: integer("max_uses"),
  currentUses: integer("current_uses").default(0),
  appOnly: boolean("app_only").default(false),
  firstTimeOnly: boolean("first_time_only").default(false),
  validFrom: text("valid_from"),
  validUntil: text("valid_until"),
  isActive: boolean("is_active").default(true),
  createdAt: text("created_at").notNull(),
});

export const insertPromoCodeSchema = createInsertSchema(promoCodes).omit({ id: true });
export type InsertPromoCode = z.infer<typeof insertPromoCodeSchema>;
export type PromoCode = typeof promoCodes.$inferSelect;

// Track promo code usage per user
export const promoCodeUsage = pgTable("promo_code_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  promoCodeId: varchar("promo_code_id").notNull(),
  userId: varchar("user_id").notNull(),
  serviceRequestId: varchar("service_request_id"),
  discountApplied: real("discount_applied").notNull(),
  usedAt: text("used_at").notNull(),
});

export const promoCodeUsageRelations = relations(promoCodeUsage, ({ one }) => ({
  promoCode: one(promoCodes, {
    fields: [promoCodeUsage.promoCodeId],
    references: [promoCodes.id],
  }),
  user: one(users, {
    fields: [promoCodeUsage.userId],
    references: [users.id],
  }),
  serviceRequest: one(serviceRequests, {
    fields: [promoCodeUsage.serviceRequestId],
    references: [serviceRequests.id],
  }),
}));

export const insertPromoCodeUsageSchema = createInsertSchema(promoCodeUsage).omit({ id: true });
export type InsertPromoCodeUsage = z.infer<typeof insertPromoCodeUsageSchema>;

// Green Guarantee - Approved Disposal Facilities
export const approvedFacilities = pgTable("approved_facilities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code"),
  facilityType: text("facility_type").notNull(), // 'transfer_station', 'recycling', 'landfill', 'hazmat'
  licenseNumber: text("license_number"),
  phone: text("phone"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  isActive: boolean("is_active").default(true),
  isBlocked: boolean("is_blocked").default(false), // Block questionable facilities
  blockReason: text("block_reason"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

export const insertApprovedFacilitySchema = createInsertSchema(approvedFacilities).omit({ id: true });
export type InsertApprovedFacility = z.infer<typeof insertApprovedFacilitySchema>;
export type ApprovedFacility = typeof approvedFacilities.$inferSelect;

// Green Guarantee - Disposal Rebate Claims
export const rebateClaims = pgTable("rebate_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id").notNull(),
  haulerId: varchar("hauler_id").notNull(),
  status: text("status").default("pending"), // 'pending', 'approved', 'denied', 'flagged'
  receiptUrl: text("receipt_url").notNull(),
  // Facility information
  facilityId: varchar("facility_id"), // Link to approved facility (optional)
  facilityName: text("facility_name").notNull(),
  facilityAddress: text("facility_address"),
  facilityType: text("facility_type"), // 'transfer_station', 'recycling', 'landfill', 'hazmat'
  facilityApproved: boolean("facility_approved").default(false), // Is this a known approved facility?
  // Receipt details
  receiptNumber: text("receipt_number"),
  receiptDate: text("receipt_date").notNull(), // Date/time on receipt
  receiptWeight: real("receipt_weight").notNull(), // Weight from disposal receipt (lbs)
  feeCharged: real("fee_charged"), // Disposal fee shown on receipt
  // Job reference data
  jobCompletedAt: text("job_completed_at"), // When job was completed (for 24-hour validation)
  estimatedWeight: real("estimated_weight"), // Weight estimated from job load size
  jobTotalPrice: real("job_total_price"), // Total price of the completed job
  // Validation results
  variancePercent: real("variance_percent"), // Calculated variance between receipt and estimate
  withinVariance: boolean("within_variance").default(false), // True if within 10% variance
  within48Hours: boolean("within_48_hours").default(false), // True if receipt within 48 hours of job
  validationFlags: text("validation_flags").array(), // Array of validation issues: 'weight_high', 'weight_low', 'late_receipt', 'unknown_facility', etc.
  // Rebate calculation
  rebateAmount: real("rebate_amount"), // Calculated rebate (10% of job, max $25)
  // AI Validation (runs before admin review)
  aiValidationStatus: text("ai_validation_status").default("pending"), // 'pending', 'passed', 'failed', 'needs_review'
  aiValidationResult: text("ai_validation_result"), // JSON string with detailed AI analysis
  aiValidationNotes: text("ai_validation_notes"), // Human-readable AI summary/recommendation
  aiValidatedAt: text("ai_validated_at"),
  aiConfidenceScore: real("ai_confidence_score"), // 0-100 confidence in the validation
  // Review workflow (admin final approval)
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: text("reviewed_at"),
  denialReason: text("denial_reason"),
  submittedAt: text("submitted_at").notNull(),
  paidOut: boolean("paid_out").default(false),
  paidOutAt: text("paid_out_at"),
});

export const rebateClaimsRelations = relations(rebateClaims, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [rebateClaims.serviceRequestId],
    references: [serviceRequests.id],
  }),
  hauler: one(haulerProfiles, {
    fields: [rebateClaims.haulerId],
    references: [haulerProfiles.id],
  }),
  reviewer: one(users, {
    fields: [rebateClaims.reviewedBy],
    references: [users.id],
  }),
  facility: one(approvedFacilities, {
    fields: [rebateClaims.facilityId],
    references: [approvedFacilities.id],
  }),
}));

export const insertRebateClaimSchema = createInsertSchema(rebateClaims).omit({ id: true });
export type InsertRebateClaim = z.infer<typeof insertRebateClaimSchema>;
export type RebateClaim = typeof rebateClaims.$inferSelect;
export type PromoCodeUsage = typeof promoCodeUsage.$inferSelect;

// Launch notification signups
export const launchNotifications = pgTable("launch_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  city: text("city"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLaunchNotificationSchema = createInsertSchema(launchNotifications).omit({ id: true, createdAt: true });
export type InsertLaunchNotification = z.infer<typeof insertLaunchNotificationSchema>;
export type LaunchNotification = typeof launchNotifications.$inferSelect;

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({ id: true, createdAt: true });
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Job adjustments - for extra items/charges added during a job
export const jobAdjustments = pgTable("job_adjustments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id").notNull(),
  haulerId: varchar("hauler_id").notNull(),
  adjustmentType: text("adjustment_type").notNull(), // 'add_item', 'remove_item', 'price_adjustment', 'extra_service'
  itemId: text("item_id"), // Reference to the item from bundle-pricing
  itemName: text("item_name").notNull(),
  quantity: integer("quantity").default(1),
  priceChange: real("price_change").notNull(), // Positive for additions, negative for removals
  reason: text("reason"),
  photoUrls: text("photo_urls").array(),
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'declined'
  customerApprovedAt: text("customer_approved_at"),
  customerDeclinedAt: text("customer_declined_at"),
  createdAt: text("created_at").notNull(),
});

export const jobAdjustmentsRelations = relations(jobAdjustments, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [jobAdjustments.serviceRequestId],
    references: [serviceRequests.id],
  }),
  hauler: one(users, {
    fields: [jobAdjustments.haulerId],
    references: [users.id],
  }),
}));

export const insertJobAdjustmentSchema = createInsertSchema(jobAdjustments).omit({ id: true });
export type InsertJobAdjustment = z.infer<typeof insertJobAdjustmentSchema>;
export type JobAdjustment = typeof jobAdjustments.$inferSelect;

// Job completion verification
export const jobCompletions = pgTable("job_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id").notNull().unique(),
  haulerId: varchar("hauler_id").notNull(),
  // PYCKER verification checklist
  arrivedAtPickup: boolean("arrived_at_pickup").default(false),
  arrivedAtPickupAt: text("arrived_at_pickup_at"),
  itemsVerified: boolean("items_verified").default(false),
  itemsVerifiedAt: text("items_verified_at"),
  workCompleted: boolean("work_completed").default(false),
  workCompletedAt: text("work_completed_at"),
  photosBefore: text("photos_before").array(),
  photosAfter: text("photos_after").array(),
  pyckerNotes: text("pycker_notes"),
  // Final totals
  originalQuote: real("original_quote").notNull(),
  adjustmentsTotal: real("adjustments_total").default(0),
  finalAmount: real("final_amount").notNull(),
  // Payment capture
  paymentCaptured: boolean("payment_captured").default(false),
  paymentCapturedAt: text("payment_captured_at"),
  stripeChargeId: text("stripe_charge_id"),
  // Customer confirmation (optional)
  customerConfirmedAt: text("customer_confirmed_at"),
  customerRating: integer("customer_rating"),
  customerFeedback: text("customer_feedback"),
  // Dispute handling
  hasDispute: boolean("has_dispute").default(false),
  disputeReason: text("dispute_reason"),
  disputeResolvedAt: text("dispute_resolved_at"),
  disputeResolution: text("dispute_resolution"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at"),
});

export const jobCompletionsRelations = relations(jobCompletions, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [jobCompletions.serviceRequestId],
    references: [serviceRequests.id],
  }),
  hauler: one(users, {
    fields: [jobCompletions.haulerId],
    references: [users.id],
  }),
}));

export const insertJobCompletionSchema = createInsertSchema(jobCompletions).omit({ id: true });
export type InsertJobCompletion = z.infer<typeof insertJobCompletionSchema>;
export type JobCompletion = typeof jobCompletions.$inferSelect;

// ==========================================
// ESG Impact Logs - Carbon tracking per job
// ==========================================
export const esgDisposalCategoryEnum = z.enum(["landfill", "recycling", "donation", "e_waste", "hazmat", "compost", "metal_scrap"]);
export type EsgDisposalCategory = z.infer<typeof esgDisposalCategoryEnum>;

export const esgImpactLogs = pgTable("esg_impact_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id").notNull(),
  haulerId: varchar("hauler_id"),
  customerId: varchar("customer_id"),
  carbonFootprintLbs: real("carbon_footprint_lbs").notNull().default(0),
  carbonOffsetCost: real("carbon_offset_cost").default(0),
  carbonOffsetPurchased: boolean("carbon_offset_purchased").default(false),
  haulDistanceMiles: real("haul_distance_miles").default(0),
  totalWeightLbs: real("total_weight_lbs").default(0),
  disposalBreakdown: text("disposal_breakdown"), // JSON: { landfill: 30, recycling: 40, donation: 20, e_waste: 10 }
  aiCategorization: text("ai_categorization"), // JSON: AI-generated item-by-item disposal categories
  recycledWeightLbs: real("recycled_weight_lbs").default(0),
  recycledLbs: real("recycled_lbs").default(0), // Alias for recycledWeightLbs
  donatedWeightLbs: real("donated_weight_lbs").default(0),
  donatedLbs: real("donated_lbs").default(0), // Alias for donatedWeightLbs
  landfilledWeightLbs: real("landfilled_weight_lbs").default(0),
  landfilledLbs: real("landfilled_lbs").default(0), // Alias for landfilledWeightLbs
  eWasteWeightLbs: real("e_waste_weight_lbs").default(0),
  ewastedLbs: real("ewasted_lbs").default(0), // Alias for eWasteWeightLbs
  carbonSavedLbs: real("carbon_saved_lbs").default(0), // Carbon emissions avoided
  diversionRate: real("diversion_rate").default(0),
  treesEquivalent: real("trees_equivalent").default(0),
  waterSavedGallons: real("water_saved_gallons").default(0),
  energySavedKwh: real("energy_saved_kwh").default(0),
  serviceType: text("service_type"),
  methaneFactorApplied: boolean("methane_factor_applied").default(false),
  methaneCo2EquivalentLbs: real("methane_co2_equivalent_lbs").default(0),
  metalDivertedLbs: real("metal_diverted_lbs").default(0),
  avoidedEmissionsKg: real("avoided_emissions_kg").default(0),
  seerRatingOld: real("seer_rating_old"),
  seerRatingNew: real("seer_rating_new"),
  cleanerType: text("cleaner_type"),
  waterUsedGallons: real("water_used_gallons").default(0),
  routingSavingsKg: real("routing_savings_kg").default(0),
  routingSavingsPct: real("routing_savings_pct").default(0),
  taxCreditAlerts: text("tax_credit_alerts"),
  createdAt: text("created_at").notNull(),
});

export const esgImpactLogsRelations = relations(esgImpactLogs, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [esgImpactLogs.serviceRequestId],
    references: [serviceRequests.id],
  }),
  hauler: one(users, {
    fields: [esgImpactLogs.haulerId],
    references: [users.id],
  }),
  customer: one(users, {
    fields: [esgImpactLogs.customerId],
    references: [users.id],
  }),
}));

export const insertEsgImpactLogSchema = createInsertSchema(esgImpactLogs).omit({ id: true });
export type InsertEsgImpactLog = z.infer<typeof insertEsgImpactLogSchema>;
export type EsgImpactLog = typeof esgImpactLogs.$inferSelect;

// ==========================================
// Service-Specific ESG Metrics (Multi-Service)
// ==========================================
export const serviceEsgMetrics = pgTable("service_esg_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id").notNull().references(() => serviceRequests.id),
  serviceType: text("service_type").notNull(),

  // Universal metrics
  waterUsedGallons: real("water_used_gallons").default(0),
  waterSavedGallons: real("water_saved_gallons").default(0),
  waterEfficiencyPct: real("water_efficiency_pct").default(0),
  energyUsedKwh: real("energy_used_kwh").default(0),
  energySavedKwh: real("energy_saved_kwh").default(0),

  // Chemical metrics
  chemicalUsedOz: real("chemical_used_oz").default(0),
  chemicalType: text("chemical_type"),
  chemicalCo2ePerOz: real("chemical_co2e_per_oz").default(0),

  // Material metrics
  materialsSalvagedLbs: real("materials_salvaged_lbs").default(0),
  salvageRate: real("salvage_rate").default(0),

  // Service-specific
  preventionValue: real("prevention_value").default(0), // Gutter/pool preventative maintenance
  repairVsReplaceSavings: real("repair_vs_replace_savings").default(0), // Handyman
  routeOptimizationSavings: real("route_optimization_savings").default(0), // Moving/furniture
  carbonSequestered: real("carbon_sequestered").default(0), // Landscaping

  // Aggregated impact
  totalCo2SavedLbs: real("total_co2_saved_lbs").default(0),
  totalCo2EmittedLbs: real("total_co2_emitted_lbs").default(0),
  netCo2ImpactLbs: real("net_co2_impact_lbs").default(0),
  esgScore: real("esg_score").default(0), // 0-100

  // Metadata
  calculationMethod: text("calculation_method").notNull(),
  verificationStatus: text("verification_status").default("pending"), // "pending", "verified", "audited"
  calculationDetails: text("calculation_details"), // JSON with breakdown details
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const serviceEsgMetricsRelations = relations(serviceEsgMetrics, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [serviceEsgMetrics.serviceRequestId],
    references: [serviceRequests.id],
  }),
}));

export const insertServiceEsgMetricsSchema = createInsertSchema(serviceEsgMetrics).omit({ id: true });
export type InsertServiceEsgMetrics = z.infer<typeof insertServiceEsgMetricsSchema>;
export type ServiceEsgMetrics = typeof serviceEsgMetrics.$inferSelect;

// ==========================================
// Tax Credit Claims for ESG compliance
// ==========================================
export const taxCreditClaims = pgTable("tax_credit_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessAccountId: varchar("business_account_id").notNull(),
  taxYear: integer("tax_year").notNull(),
  totalDivertedLbs: real("total_diverted_lbs").default(0),
  totalRecycledLbs: real("total_recycled_lbs").default(0),
  totalDonatedLbs: real("total_donated_lbs").default(0),
  estimatedCreditAmount: real("estimated_credit_amount").default(0),
  jobCount: integer("job_count").default(0),
  reportUrl: text("report_url"),
  status: text("status").default("draft"), // 'draft', 'generated', 'submitted', 'approved'
  generatedAt: text("generated_at"),
  createdAt: text("created_at").notNull(),
});

export const taxCreditClaimsRelations = relations(taxCreditClaims, ({ one }) => ({
  businessAccount: one(businessAccounts, {
    fields: [taxCreditClaims.businessAccountId],
    references: [businessAccounts.id],
  }),
}));

export const insertTaxCreditClaimSchema = createInsertSchema(taxCreditClaims).omit({ id: true });
export type InsertTaxCreditClaim = z.infer<typeof insertTaxCreditClaimSchema>;
export type TaxCreditClaim = typeof taxCreditClaims.$inferSelect;

// ==========================================
// Disputes - Before/After photo conflict resolution
// ==========================================
export const disputeStatusEnum = z.enum(["open", "ai_reviewed", "admin_review", "resolved_customer", "resolved_pycker", "closed"]);
export type DisputeStatus = z.infer<typeof disputeStatusEnum>;

export const disputes = pgTable("disputes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id").notNull(),
  jobCompletionId: varchar("job_completion_id"),
  customerId: varchar("customer_id").notNull(),
  haulerId: varchar("hauler_id").notNull(),
  reason: text("reason").notNull(),
  description: text("description"),
  status: text("status").notNull().default("open"),
  photosBefore: text("photos_before").array(),
  photosAfter: text("photos_after").array(),
  damagePhotos: text("damage_photos").array(),
  aiAnalysisResult: text("ai_analysis_result"), // JSON: AI comparison findings
  aiConfidence: real("ai_confidence"),
  aiRecommendation: text("ai_recommendation"), // 'customer_favor', 'pycker_favor', 'needs_review'
  aiAnalyzedAt: text("ai_analyzed_at"),
  adminNotes: text("admin_notes"),
  resolution: text("resolution"),
  refundAmount: real("refund_amount"),
  resolvedBy: varchar("resolved_by"),
  resolvedAt: text("resolved_at"),
  createdAt: text("created_at").notNull(),
});

export const disputesRelations = relations(disputes, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [disputes.serviceRequestId],
    references: [serviceRequests.id],
  }),
  customer: one(users, {
    fields: [disputes.customerId],
    references: [users.id],
  }),
  hauler: one(users, {
    fields: [disputes.haulerId],
    references: [users.id],
  }),
}));

export const insertDisputeSchema = createInsertSchema(disputes).omit({ id: true });
export type InsertDispute = z.infer<typeof insertDisputeSchema>;
export type Dispute = typeof disputes.$inferSelect;

// ==========================================
// Worker Skills - Skill-graph for intelligent matching
// ==========================================
export const workerSkills = pgTable("worker_skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  haulerProfileId: varchar("hauler_profile_id").notNull(),
  skillType: text("skill_type").notNull(), // 'heavy_lifting', 'piano', 'hazmat', 'electronics', 'appliance', 'fragile', 'stairs'
  rating: real("rating").default(5.0), // 1-10 skill score
  jobsCompleted: integer("jobs_completed").default(0), // Jobs completed with this skill
  lastUsedAt: text("last_used_at"),
  verifiedByAdmin: boolean("verified_by_admin").default(false),
  createdAt: text("created_at").notNull(),
});

export const workerSkillsRelations = relations(workerSkills, ({ one }) => ({
  haulerProfile: one(haulerProfiles, {
    fields: [workerSkills.haulerProfileId],
    references: [haulerProfiles.id],
  }),
}));

export const insertWorkerSkillSchema = createInsertSchema(workerSkills).omit({ id: true });
export type InsertWorkerSkill = z.infer<typeof insertWorkerSkillSchema>;
export type WorkerSkill = typeof workerSkills.$inferSelect;

// ==========================================
// Demand Heatmap Data - Predictive demand for earnings heatmap
// ==========================================
export const demandHeatmapData = pgTable("demand_heatmap_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  zipCode: text("zip_code"),
  city: text("city"),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sun-Sat)
  hourOfDay: integer("hour_of_day").notNull(), // 0-23
  demandScore: real("demand_score").notNull().default(0), // 0-100
  avgJobValue: real("avg_job_value").default(0),
  historicalJobCount: integer("historical_job_count").default(0),
  serviceType: text("service_type"),
  predictionConfidence: real("prediction_confidence").default(0.5),
  lastUpdated: text("last_updated").notNull(),
});

export const insertDemandHeatmapDataSchema = createInsertSchema(demandHeatmapData).omit({ id: true });
export type InsertDemandHeatmapData = z.infer<typeof insertDemandHeatmapDataSchema>;
export type DemandHeatmapData = typeof demandHeatmapData.$inferSelect;

// ==========================================
// AI Safety Alerts - Hazard detection from verification photos
// ==========================================
export const aiSafetyAlerts = pgTable("ai_safety_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id").notNull(),
  haulerId: varchar("hauler_id").notNull(),
  alertType: text("alert_type").notNull(), // 'hazmat', 'sharp_objects', 'heavy_item', 'biohazard', 'electrical', 'structural'
  severity: text("severity").notNull().default("warning"), // 'info', 'warning', 'danger'
  description: text("description").notNull(),
  safetyInstructions: text("safety_instructions"),
  disposalGuideUrl: text("disposal_guide_url"),
  photoUrl: text("photo_url"),
  acknowledged: boolean("acknowledged").default(false),
  acknowledgedAt: text("acknowledged_at"),
  createdAt: text("created_at").notNull(),
});

export const aiSafetyAlertsRelations = relations(aiSafetyAlerts, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [aiSafetyAlerts.serviceRequestId],
    references: [serviceRequests.id],
  }),
  hauler: one(users, {
    fields: [aiSafetyAlerts.haulerId],
    references: [users.id],
  }),
}));

export const insertAiSafetyAlertSchema = createInsertSchema(aiSafetyAlerts).omit({ id: true });
export type InsertAiSafetyAlert = z.infer<typeof insertAiSafetyAlertSchema>;
export type AiSafetyAlert = typeof aiSafetyAlerts.$inferSelect;

// ==========================================
// Bundling Suggestions - AI add-on recommendations
// ==========================================
export const bundlingSuggestions = pgTable("bundling_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id").notNull(),
  customerId: varchar("customer_id").notNull(),
  suggestedServiceType: text("suggested_service_type").notNull(),
  suggestedItems: text("suggested_items"), // JSON array of suggested items
  reason: text("reason").notNull(),
  estimatedAdditionalCost: real("estimated_additional_cost"),
  discountPercent: real("discount_percent").default(0),
  accepted: boolean("accepted").default(false),
  acceptedAt: text("accepted_at"),
  dismissed: boolean("dismissed").default(false),
  dismissedAt: text("dismissed_at"),
  createdAt: text("created_at").notNull(),
});

export const bundlingSuggestionsRelations = relations(bundlingSuggestions, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [bundlingSuggestions.serviceRequestId],
    references: [serviceRequests.id],
  }),
  customer: one(users, {
    fields: [bundlingSuggestions.customerId],
    references: [users.id],
  }),
}));

export const insertBundlingSuggestionSchema = createInsertSchema(bundlingSuggestions).omit({ id: true });
export type InsertBundlingSuggestion = z.infer<typeof insertBundlingSuggestionSchema>;
export type BundlingSuggestion = typeof bundlingSuggestions.$inferSelect;

// ==========================================
// Carbon-Intelligent Dispatcher Batches
// ==========================================
export const dispatchBatches = pgTable("dispatch_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  batchDate: text("batch_date").notNull(),
  region: text("region").notNull(),
  haulerId: varchar("hauler_id"),
  jobIds: text("job_ids").notNull(), // JSON array of service request IDs
  totalDistanceMiles: real("total_distance_miles").default(0),
  optimizedDistanceMiles: real("optimized_distance_miles").default(0),
  deadheadMilesSaved: real("deadhead_miles_saved").default(0),
  co2SavedLbs: real("co2_saved_lbs").default(0),
  discountOffered: real("discount_offered").default(0),
  status: text("status").default("proposed"), // 'proposed', 'accepted', 'dispatched', 'completed'
  createdAt: text("created_at").notNull(),
});

export const insertDispatchBatchSchema = createInsertSchema(dispatchBatches).omit({ id: true });
export type InsertDispatchBatch = z.infer<typeof insertDispatchBatchSchema>;
export type DispatchBatch = typeof dispatchBatches.$inferSelect;

// ==========================================
// Circular Economy - AI Disposal Recommendations
// ==========================================
export const disposalRecommendations = pgTable("disposal_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id").notNull(),
  itemName: text("item_name").notNull(),
  category: text("category").notNull(), // 'donate', 'recycle', 'resell', 'landfill', 'e_waste', 'hazardous'
  estimatedWeightLbs: real("estimated_weight_lbs").default(0),
  destinationName: text("destination_name"), // e.g., "Habitat for Humanity", "Best Buy E-Waste"
  destinationAddress: text("destination_address"),
  estimatedValue: real("estimated_value").default(0), // for resale items
  co2AvoidedLbs: real("co2_avoided_lbs").default(0),
  status: text("status").default("pending"), // 'pending', 'accepted', 'completed'
  createdAt: text("created_at").notNull(),
});

export const insertDisposalRecommendationSchema = createInsertSchema(disposalRecommendations).omit({ id: true });
export type InsertDisposalRecommendation = z.infer<typeof insertDisposalRecommendationSchema>;
export type DisposalRecommendation = typeof disposalRecommendations.$inferSelect;

// ==========================================
// Compliance Vault - PYCKER Receipt & Mileage Tracking
// ==========================================
export const complianceReceipts = pgTable("compliance_receipts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  haulerId: varchar("hauler_id").notNull(),
  serviceRequestId: varchar("service_request_id"),
  receiptType: text("receipt_type").notNull(), // 'fuel', 'disposal', 'equipment', 'insurance', 'license', 'other'
  vendorName: text("vendor_name"),
  amount: real("amount").notNull(),
  receiptDate: text("receipt_date").notNull(),
  receiptImageUrl: text("receipt_image_url"),
  aiExtractedData: text("ai_extracted_data"), // JSON: AI-parsed receipt fields
  taxDeductible: boolean("tax_deductible").default(false),
  category: text("category"), // IRS category: 'vehicle_expense', 'supplies', 'insurance', 'business_license'
  createdAt: text("created_at").notNull(),
});

export const insertComplianceReceiptSchema = createInsertSchema(complianceReceipts).omit({ id: true });
export type InsertComplianceReceipt = z.infer<typeof insertComplianceReceiptSchema>;
export type ComplianceReceipt = typeof complianceReceipts.$inferSelect;

export const mileageLogs = pgTable("mileage_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  haulerId: varchar("hauler_id").notNull(),
  serviceRequestId: varchar("service_request_id"),
  startAddress: text("start_address"),
  endAddress: text("end_address"),
  distanceMiles: real("distance_miles").notNull(),
  purpose: text("purpose").default("business"), // 'business', 'personal'
  tripDate: text("trip_date").notNull(),
  irsRateCentsPerMile: real("irs_rate_cents_per_mile").default(67), // 2024 IRS rate
  deductionAmount: real("deduction_amount").default(0),
  createdAt: text("created_at").notNull(),
});

export const insertMileageLogSchema = createInsertSchema(mileageLogs).omit({ id: true });
export type InsertMileageLog = z.infer<typeof insertMileageLogSchema>;
export type MileageLog = typeof mileageLogs.$inferSelect;

// ==========================================
// B2B Scope 3 ESG Reports
// ==========================================
export const esgReports = pgTable("esg_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessAccountId: varchar("business_account_id").notNull(),
  reportMonth: integer("report_month").notNull(),
  reportYear: integer("report_year").notNull(),
  totalJobsCount: integer("total_jobs_count").default(0),
  co2SavedKg: real("co2_saved_kg").default(0),
  landfillDiversionLbs: real("landfill_diversion_lbs").default(0),
  taxCreditsUnlockedUsd: real("tax_credits_unlocked_usd").default(0),
  waterSavedGallons: real("water_saved_gallons").default(0),
  energySavedKwh: real("energy_saved_kwh").default(0),
  totalCarbonFootprintLbs: real("total_carbon_footprint_lbs").default(0),
  deadheadMilesSaved: real("deadhead_miles_saved").default(0),
  circularEconomyLbs: real("circular_economy_lbs").default(0), // recycled + donated
  auditReady: boolean("audit_ready").default(false),
  reportData: text("report_data"), // Full JSON report for download
  generatedAt: text("generated_at"),
  createdAt: text("created_at").notNull(),
});

export const esgReportsRelations = relations(esgReports, ({ one }) => ({
  businessAccount: one(businessAccounts, {
    fields: [esgReports.businessAccountId],
    references: [businessAccounts.id],
  }),
}));

export const insertEsgReportSchema = createInsertSchema(esgReports).omit({ id: true });
export type InsertEsgReport = z.infer<typeof insertEsgReportSchema>;
export type EsgReport = typeof esgReports.$inferSelect;

// ==========================================
// Platform Sustainability Stats (Nightly ESG Auditor)
// ==========================================
export const platformSustainabilityStats = pgTable("platform_sustainability_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  totalJobsAudited: integer("total_jobs_audited").default(0),
  totalCo2SavedKg: real("total_co2_saved_kg").default(0),
  totalCo2EmittedKg: real("total_co2_emitted_kg").default(0),
  totalLandfillDivertedLbs: real("total_landfill_diverted_lbs").default(0),
  totalRecycledLbs: real("total_recycled_lbs").default(0),
  totalDonatedLbs: real("total_donated_lbs").default(0),
  totalEwasteLbs: real("total_ewaste_lbs").default(0),
  totalLandfilledLbs: real("total_landfilled_lbs").default(0),
  treesEquivalent: real("trees_equivalent").default(0),
  waterSavedGallons: real("water_saved_gallons").default(0),
  energySavedKwh: real("energy_saved_kwh").default(0),
  avgDiversionRate: real("avg_diversion_rate").default(0),
  deadheadMilesSaved: real("deadhead_miles_saved").default(0),
  totalCarbonOffsetsPurchased: real("total_carbon_offsets_purchased").default(0),
  lastAuditedAt: text("last_audited_at"),
  updatedAt: text("updated_at").notNull(),
});

export const insertPlatformSustainabilityStatsSchema = createInsertSchema(platformSustainabilityStats).omit({ id: true });
export type InsertPlatformSustainabilityStats = z.infer<typeof insertPlatformSustainabilityStatsSchema>;
export type PlatformSustainabilityStats = typeof platformSustainabilityStats.$inferSelect;

// ==========================================
// AGENTIC BRAIN - AI Triage Reports
// ==========================================
export const triageClassificationEnum = z.enum(["junk", "donation", "hazardous", "recyclable", "e_waste", "mixed"]);
export type TriageClassification = z.infer<typeof triageClassificationEnum>;

export const aiTriageReports = pgTable("ai_triage_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id"),
  requestedBy: varchar("requested_by"),
  photoUrls: text("photo_urls").array().notNull(),
  overallClassification: text("overall_classification").notNull(),
  confidence: real("confidence").notNull().default(0),
  inventory: text("inventory").notNull(), // JSON: [{name, classification, estimatedWeightLbs, quantity, hazardNotes}]
  totalEstimatedWeightLbs: real("total_estimated_weight_lbs").default(0),
  totalItemCount: integer("total_item_count").default(0),
  hazardousItemCount: integer("hazardous_item_count").default(0),
  donationItemCount: integer("donation_item_count").default(0),
  recyclableItemCount: integer("recyclable_item_count").default(0),
  guaranteedPrice: real("guaranteed_price"),
  recommendedCrewSize: integer("recommended_crew_size").default(2),
  recommendedVehicleType: text("recommended_vehicle_type"),
  specialEquipmentNeeded: text("special_equipment_needed").array(),
  safetyWarnings: text("safety_warnings").array(),
  rawResponse: text("raw_response"),
  createdAt: text("created_at").notNull(),
});

export const aiTriageReportsRelations = relations(aiTriageReports, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [aiTriageReports.serviceRequestId],
    references: [serviceRequests.id],
  }),
}));

export const insertAiTriageReportSchema = createInsertSchema(aiTriageReports).omit({ id: true });
export type InsertAiTriageReport = z.infer<typeof insertAiTriageReportSchema>;
export type AiTriageReport = typeof aiTriageReports.$inferSelect;

// ==========================================
// AGENTIC BRAIN - Smart Dispatch Recommendations
// ==========================================
export const dispatchRecommendations = pgTable("dispatch_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id").notNull(),
  triageReportId: varchar("triage_report_id"),
  recommendedCrewSize: integer("recommended_crew_size").notNull().default(2),
  recommendedVehicleType: text("recommended_vehicle_type").notNull(),
  estimatedTotalWeightLbs: real("estimated_total_weight_lbs").default(0),
  estimatedVolumeCubicFt: real("estimated_volume_cubic_ft").default(0),
  estimatedDurationHours: real("estimated_duration_hours").default(2),
  fuelEfficiencyScore: real("fuel_efficiency_score").default(50),
  greenMatchPriority: boolean("green_match_priority").default(false),
  reasoning: text("reasoning").notNull(),
  matchedHaulerIds: text("matched_hauler_ids").array(),
  status: text("status").default("pending"),
  createdAt: text("created_at").notNull(),
});

export const dispatchRecommendationsRelations = relations(dispatchRecommendations, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [dispatchRecommendations.serviceRequestId],
    references: [serviceRequests.id],
  }),
  triageReport: one(aiTriageReports, {
    fields: [dispatchRecommendations.triageReportId],
    references: [aiTriageReports.id],
  }),
}));

export const insertDispatchRecommendationSchema = createInsertSchema(dispatchRecommendations).omit({ id: true });
export type InsertDispatchRecommendation = z.infer<typeof insertDispatchRecommendationSchema>;
export type DispatchRecommendation = typeof dispatchRecommendations.$inferSelect;

// ==========================================
// AGENTIC BRAIN - Revenue Protector (Sentiment Analysis)
// ==========================================
export const sentimentRiskEnum = z.enum(["low", "medium", "high", "critical"]);
export type SentimentRisk = z.infer<typeof sentimentRiskEnum>;

export const sentimentFlags = pgTable("sentiment_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceType: text("source_type").notNull(),
  sourceId: varchar("source_id"),
  serviceRequestId: varchar("service_request_id"),
  customerId: varchar("customer_id"),
  haulerId: varchar("hauler_id"),
  rawText: text("raw_text").notNull(),
  sentimentScore: real("sentiment_score").notNull(),
  riskLevel: text("risk_level").notNull().default("low"),
  keyPhrases: text("key_phrases").array(),
  issues: text("issues").array(),
  recommendedAction: text("recommended_action").notNull(),
  urgencyReason: text("urgency_reason"),
  status: text("status").default("new"),
  resolvedBy: varchar("resolved_by"),
  resolvedAt: text("resolved_at"),
  resolutionNotes: text("resolution_notes"),
  createdAt: text("created_at").notNull(),
});

export const sentimentFlagsRelations = relations(sentimentFlags, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [sentimentFlags.serviceRequestId],
    references: [serviceRequests.id],
  }),
  customer: one(users, {
    fields: [sentimentFlags.customerId],
    references: [users.id],
  }),
}));

export const insertSentimentFlagSchema = createInsertSchema(sentimentFlags).omit({ id: true });
export type InsertSentimentFlag = z.infer<typeof insertSentimentFlagSchema>;
export type SentimentFlag = typeof sentimentFlags.$inferSelect;

// ==========================================
// AGENTIC BRAIN - Conflict Shield (Before/After Damage Detection)
// ==========================================
export const conflictShieldReports = pgTable("conflict_shield_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id").notNull(),
  requestedBy: varchar("requested_by"),
  photosBefore: text("photos_before").array().notNull(),
  photosAfter: text("photos_after").array(),
  preExistingDamage: text("pre_existing_damage").notNull(), // JSON: [{location, type, severity, description}]
  preExistingDamageCount: integer("pre_existing_damage_count").default(0),
  newDamageDetected: boolean("new_damage_detected").default(false),
  newDamage: text("new_damage"), // JSON: [{location, type, severity, description}]
  confidence: real("confidence").notNull().default(0),
  summary: text("summary").notNull(),
  recommendation: text("recommendation"),
  rawResponse: text("raw_response"),
  status: text("status").default("completed"),
  createdAt: text("created_at").notNull(),
});

export const conflictShieldReportsRelations = relations(conflictShieldReports, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [conflictShieldReports.serviceRequestId],
    references: [serviceRequests.id],
  }),
}));

export const insertConflictShieldReportSchema = createInsertSchema(conflictShieldReports).omit({ id: true });
export type InsertConflictShieldReport = z.infer<typeof insertConflictShieldReportSchema>;
export type ConflictShieldReport = typeof conflictShieldReports.$inferSelect;

// ==========================================
// Green Guarantee Rebate - Disposal Receipt Verification
// ==========================================
export const disposalReceipts = pgTable("disposal_receipts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  haulerId: varchar("hauler_id").notNull(),
  jobId: varchar("job_id"),
  receiptImageUrl: text("receipt_image_url").notNull(),
  facilityName: text("facility_name"),
  receiptDate: text("receipt_date"),
  amountPaid: real("amount_paid"),
  bonusAmount: real("bonus_amount").default(20),
  bonusStatus: text("bonus_status").default("pending"),
  aiVerified: boolean("ai_verified").default(false),
  aiConfidence: real("ai_confidence"),
  aiExtractedData: text("ai_extracted_data"),
  rejectionReason: text("rejection_reason"),
  receiptHash: text("receipt_hash"),
  createdAt: text("created_at").notNull(),
});

export const insertDisposalReceiptSchema = createInsertSchema(disposalReceipts).omit({ id: true });
export type InsertDisposalReceipt = z.infer<typeof insertDisposalReceiptSchema>;
export type DisposalReceipt = typeof disposalReceipts.$inferSelect;

// ==========================================
// Audit Logs - Immutable Security & Compliance Trail
// ==========================================
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actorId: varchar("actor_id").notNull(),
  actorRole: varchar("actor_role").notNull(),
  actionType: varchar("action_type").notNull(),
  resourceTarget: varchar("resource_target").notNull(),
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  metadata: text("metadata"),
  timestamp: text("timestamp").notNull(),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true });
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// ==========================================
// Home Inventory (Insurance Vault + Reseller Marketplace)
// ==========================================
export const homeInventory = pgTable("home_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(),
  serviceRequestId: varchar("service_request_id"),
  consultationId: varchar("consultation_id"),
  itemName: varchar("item_name").notNull(),
  category: varchar("category"), // 'electronics', 'furniture', 'appliance', 'gym', 'decor'
  estimatedValue: integer("estimated_value"),
  confidenceScore: integer("confidence_score"), // 0-100 AI confidence
  brandDetected: varchar("brand_detected"),
  condition: varchar("condition"), // 'new', 'like_new', 'good', 'fair', 'poor', 'scrap'
  conditionNotes: text("condition_notes"),
  photoUrl: text("photo_url"),
  verificationPhotoUrl: text("verification_photo_url"),
  resaleStatus: varchar("resale_status").default("active"), // 'active', 'sold', 'donated', 'disposed', 'claimed_for_resale'
  resaleListingUrl: text("resale_listing_url"),
  resaleDescription: text("resale_description"),
  generatedAt: text("generated_at").notNull(),
  verifiedAt: text("verified_at"),
});

export const homeInventoryRelations = relations(homeInventory, ({ one }) => ({
  customer: one(users, {
    fields: [homeInventory.customerId],
    references: [users.id],
  }),
  serviceRequest: one(serviceRequests, {
    fields: [homeInventory.serviceRequestId],
    references: [serviceRequests.id],
  }),
}));

export const insertHomeInventorySchema = createInsertSchema(homeInventory).omit({ id: true });
export type InsertHomeInventory = z.infer<typeof insertHomeInventorySchema>;
export type HomeInventory = typeof homeInventory.$inferSelect;

// ==========================================
// Hauler Risk Profile (Ghost Buster Anti-Leakage)
// ==========================================
export const haulerRiskProfile = pgTable("hauler_risk_profile", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  haulerId: varchar("hauler_id").notNull().unique(),
  ghostIncidents: integer("ghost_incidents").default(0),
  keywordsDetected: integer("keywords_detected").default(0),
  riskScore: integer("risk_score").default(0),
  lastIncidentAt: text("last_incident_at"),
});

export const insertHaulerRiskProfileSchema = createInsertSchema(haulerRiskProfile).omit({ id: true });
export type InsertHaulerRiskProfile = z.infer<typeof insertHaulerRiskProfileSchema>;
export type HaulerRiskProfile = typeof haulerRiskProfile.$inferSelect;

// ==========================================
// Chat Messages (SafeComms Privacy Firewall)
// ==========================================
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull(),
  senderId: varchar("sender_id").notNull(),
  content: text("content").notNull(),
  isRedacted: boolean("is_redacted").default(false),
  sentAt: text("sent_at").notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true });
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// ==========================================
// Properties (Property History / "Carfax" for Homes)
// ==========================================
export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Original fields (backward compatible)
  addressHash: varchar("address_hash").unique(),
  fullAddress: text("full_address"),
  ownerId: varchar("owner_id"),
  maintenanceScore: integer("maintenance_score").default(0),
  lastAssessmentDate: text("last_assessment_date"),
  estimatedValueIncrease: integer("estimated_value_increase").default(0),

  // Property Intelligence Layer - Address details
  unit: text("unit"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  county: text("county"),
  latitude: real("latitude"),
  longitude: real("longitude"),

  // Property details
  propertyType: text("property_type").default("single_family"),
  yearBuilt: integer("year_built"),
  sqft: integer("sqft"),
  lotSizeSqft: integer("lot_size_sqft"),
  bedrooms: integer("bedrooms"),
  bathrooms: real("bathrooms"),
  stories: integer("stories"),
  garageType: text("garage_type"),
  hasPool: boolean("has_pool").default(false),
  poolType: text("pool_type"),
  roofType: text("roof_type"),
  roofAgeYears: integer("roof_age_years"),
  exteriorType: text("exterior_type"),
  hvacType: text("hvac_type"),
  hvacAgeYears: integer("hvac_age_years"),

  // Property Health Score (the "credit score for homes")
  propertyHealthScore: real("property_health_score"),
  healthScoreUpdatedAt: text("health_score_updated_at"),
  healthScoreHistory: jsonb("health_score_history"),
  healthScoreRoof: real("health_score_roof"),
  healthScoreHvac: real("health_score_hvac"),
  healthScoreExterior: real("health_score_exterior"),
  healthScoreInterior: real("health_score_interior"),
  healthScoreLandscape: real("health_score_landscape"),
  healthScorePool: real("health_score_pool"),
  healthScoreAppliances: real("health_score_appliances"),
  healthScoreMaintenance: real("health_score_maintenance"),

  // DwellScan linkage
  initialScanId: varchar("initial_scan_id"),
  lastScanId: varchar("last_scan_id"),
  totalScans: integer("total_scans").default(0),

  // Aggregated stats
  totalJobsCompleted: integer("total_jobs_completed").default(0),
  totalSpent: real("total_spent").default(0),
  lastServiceDate: text("last_service_date"),
  activeWarrantyCount: integer("active_warranty_count").default(0),
  expiringWarrantyCount: integer("expiring_warranty_count").default(0),

  // Acquisition source
  source: text("source").default("organic"),
  builderPartnershipId: varchar("builder_partnership_id"),
  realtorReferralCode: varchar("realtor_referral_code"),

  // Homeowner info
  moveInDate: text("move_in_date"),
  isPrimaryResidence: boolean("is_primary_residence").default(true),

  // Status
  status: text("status").default("active"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  onboardingCompletedAt: text("onboarding_completed_at"),
  onboardingStep: integer("onboarding_step").default(0),

  // Timestamps
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(users, {
    fields: [properties.ownerId],
    references: [users.id],
  }),
  appliances: many(propertyAppliances),
  warranties: many(propertyWarranties),
  insurancePolicies: many(propertyInsurance),
  healthEvents: many(propertyHealthEvents),
  maintenanceSchedule: many(propertyMaintenanceSchedule),
  documents: many(propertyDocuments),
}));

export const insertPropertySchema = createInsertSchema(properties).omit({ id: true });
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

// ==========================================
// Property Events (Maintenance History)
// ==========================================
export const propertyEvents = pgTable("property_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  serviceRequestId: varchar("service_request_id"),
  eventType: varchar("event_type"),
  description: text("description"),
  verifiedBy: varchar("verified_by"),
  photosBefore: text("photos_before"), // JSON array
  photosAfter: text("photos_after"), // JSON array
  date: text("date"),
  isTransferable: boolean("is_transferable").default(true),
});

export const propertyEventsRelations = relations(propertyEvents, ({ one }) => ({
  property: one(properties, {
    fields: [propertyEvents.propertyId],
    references: [properties.id],
  }),
  serviceRequest: one(serviceRequests, {
    fields: [propertyEvents.serviceRequestId],
    references: [serviceRequests.id],
  }),
}));

export const insertPropertyEventSchema = createInsertSchema(propertyEvents).omit({ id: true });
export type InsertPropertyEvent = z.infer<typeof insertPropertyEventSchema>;
export type PropertyEvent = typeof propertyEvents.$inferSelect;

// ===========================
// PROPERTY TRANSFERS
// ===========================
export const propertyTransfers = pgTable("property_transfers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").references(() => properties.id),
  fromUserId: varchar("from_user_id"),
  toEmail: text("to_email").notNull(),
  claimToken: varchar("claim_token").unique().notNull(),
  status: varchar("status").default("pending"),
  claimedByUserId: varchar("claimed_by_user_id"),
  createdAt: text("created_at").default(sql`now()`),
  claimedAt: text("claimed_at"),
});

export const propertyTransfersRelations = relations(propertyTransfers, ({ one }) => ({
  property: one(properties, {
    fields: [propertyTransfers.propertyId],
    references: [properties.id],
  }),
}));

export const insertPropertyTransferSchema = createInsertSchema(propertyTransfers).omit({ id: true });
export type InsertPropertyTransfer = z.infer<typeof insertPropertyTransferSchema>;
export type PropertyTransfer = typeof propertyTransfers.$inferSelect;

// ==========================================
// Property Scores (Gamified Home Score like FICO)
// ==========================================
export const propertyScores = pgTable("property_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id"),
  userId: varchar("user_id").notNull(),
  totalScore: integer("total_score").default(500),
  maintenanceHealth: integer("maintenance_health").default(50),
  documentationHealth: integer("documentation_health").default(50),
  safetyHealth: integer("safety_health").default(50),
  lastUpdated: text("last_updated").default(sql`now()`),
});

export const propertyScoresRelations = relations(propertyScores, ({ one }) => ({
  property: one(properties, {
    fields: [propertyScores.propertyId],
    references: [properties.id],
  }),
  user: one(users, {
    fields: [propertyScores.userId],
    references: [users.id],
  }),
}));

export const insertPropertyScoreSchema = createInsertSchema(propertyScores).omit({ id: true });
export type InsertPropertyScore = z.infer<typeof insertPropertyScoreSchema>;
export type PropertyScore = typeof propertyScores.$inferSelect;

// ==========================================
// Score History (Points Ledger)
// ==========================================
export const scoreHistory = pgTable("score_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  scoreId: varchar("score_id").notNull(),
  serviceRequestId: varchar("service_request_id"),
  pointsChanged: integer("points_changed"),
  reason: text("reason"),
  category: varchar("category"), // 'maintenance', 'safety', 'documentation'
  createdAt: text("created_at").default(sql`now()`),
});

export const scoreHistoryRelations = relations(scoreHistory, ({ one }) => ({
  score: one(propertyScores, {
    fields: [scoreHistory.scoreId],
    references: [propertyScores.id],
  }),
}));

export const insertScoreHistorySchema = createInsertSchema(scoreHistory).omit({ id: true });
export type InsertScoreHistory = z.infer<typeof insertScoreHistorySchema>;
export type ScoreHistory = typeof scoreHistory.$inferSelect;

// ==========================================
// Consultations ($49 Commitment Credit)
// ==========================================
export const consultations = pgTable("consultations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(),
  haulerId: varchar("hauler_id"),
  status: varchar("status").default("scheduled"), // 'scheduled', 'completed', 'converted'
  price: integer("price").default(4900), // $49.00 in cents
  isCreditUsed: boolean("is_credit_used").default(false),
  generatedTreatmentPlan: jsonb("generated_treatment_plan"),
  homeScoreImpact: integer("home_score_impact").default(50),
  scheduledAt: text("scheduled_at"),
  completedAt: text("completed_at"),
  createdAt: text("created_at").default(sql`now()`),
});

export const consultationsRelations = relations(consultations, ({ one }) => ({
  customer: one(users, {
    fields: [consultations.customerId],
    references: [users.id],
  }),
}));

export const insertConsultationSchema = createInsertSchema(consultations).omit({ id: true });
export type InsertConsultation = z.infer<typeof insertConsultationSchema>;
export type Consultation = typeof consultations.$inferSelect;

// ==========================================
// Deferred Jobs (Nudge Engine)
// ==========================================
export const deferredJobs = pgTable("deferred_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  consultationId: varchar("consultation_id"),
  title: varchar("title").notNull(),
  estimatedPrice: integer("estimated_price"), // in cents
  reasonForDeferral: varchar("reason"), // 'budget', 'timing', 'not_ready'
  nudgeCount: integer("nudge_count").default(0),
  nextNudgeDate: text("next_nudge_date"),
  status: varchar("status").default("pending"), // 'pending', 'converted', 'dismissed'
  photoUrl: text("photo_url"),
  createdAt: text("created_at").default(sql`now()`),
});

export const deferredJobsRelations = relations(deferredJobs, ({ one }) => ({
  user: one(users, {
    fields: [deferredJobs.userId],
    references: [users.id],
  }),
}));

export const insertDeferredJobSchema = createInsertSchema(deferredJobs).omit({ id: true });
export type InsertDeferredJob = z.infer<typeof insertDeferredJobSchema>;
export type DeferredJob = typeof deferredJobs.$inferSelect;

// ==========================================
// Hauler Certifications (Badge System for 1099 Contractors)
// ==========================================
export const skillTypeEnum = z.enum([
  "core_safety", "junk_removal", "pressure_washing", "gutter_cleaning", "moving_labor"
]);
export type SkillType = z.infer<typeof skillTypeEnum>;

export const haulerCertifications = pgTable("hauler_certifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  haulerId: varchar("hauler_id").notNull(),
  type: varchar("type").default("home_estimator"),
  skillType: varchar("skill_type").default("core_safety"),
  status: varchar("status").default("active"),
  isActive: boolean("is_active").default(true),
  earnedAt: text("earned_at").default(sql`now()`),
  expiresAt: text("expires_at"),
  quizScore: integer("quiz_score").default(100),
  accuracyRating: integer("accuracy_rating").default(100),
});

export const haulerCertificationsRelations = relations(haulerCertifications, ({ one }) => ({
  hauler: one(haulerProfiles, {
    fields: [haulerCertifications.haulerId],
    references: [haulerProfiles.id],
  }),
}));

export const insertHaulerCertificationSchema = createInsertSchema(haulerCertifications).omit({ id: true });
export type InsertHaulerCertification = z.infer<typeof insertHaulerCertificationSchema>;
export type HaulerCertification = typeof haulerCertifications.$inferSelect;

// ==========================================
// Referral Partner System (Home Health Audit referrals)
// ==========================================
export const referralPartners = pgTable("referral_partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessName: varchar("business_name").notNull(),
  category: varchar("category").notNull(), // landscaping, roofing, hvac, plumbing, electrical, tree_service, pest_control
  contactName: varchar("contact_name"),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  website: text("website"),
  serviceArea: text("service_area"), // ZIP codes or city names
  commissionRate: integer("commission_rate").default(10), // percentage (10 = 10%)
  isActive: boolean("is_active").default(true),
  rating: real("rating"),
  jobsCompleted: integer("jobs_completed").default(0),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertReferralPartnerSchema = createInsertSchema(referralPartners).omit({ id: true });
export type InsertReferralPartner = z.infer<typeof insertReferralPartnerSchema>;
export type ReferralPartner = typeof referralPartners.$inferSelect;

export const partnerReferrals = pgTable("partner_referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  homeHealthAuditId: varchar("home_health_audit_id"), // Links to serviceRequests where serviceType = 'home_consultation'
  customerId: varchar("customer_id").notNull(),
  proId: varchar("pro_id").notNull(), // Pro who did the home health audit, gets 10% commission
  partnerId: varchar("partner_id").notNull(),
  category: varchar("category").notNull(), // Same as referralPartners.category
  description: text("description"), // What needs to be done
  estimatedValue: integer("estimated_value"), // Estimated job value in dollars
  status: varchar("status").default("pending"), // pending, contacted, completed, cancelled
  completedAt: text("completed_at"),
  referralAmount: integer("referral_amount"), // Actual job value when completed
  commissionAmount: integer("commission_amount"), // 10% of referralAmount, paid to Pro
  commissionPaidAt: text("commission_paid_at"),
  customerNotes: text("customer_notes"),
  createdAt: text("created_at").default(sql`now()`),
});

export const partnerReferralsRelations = relations(partnerReferrals, ({ one }) => ({
  customer: one(users, {
    fields: [partnerReferrals.customerId],
    references: [users.id],
  }),
  pro: one(haulerProfiles, {
    fields: [partnerReferrals.proId],
    references: [haulerProfiles.id],
  }),
  partner: one(referralPartners, {
    fields: [partnerReferrals.partnerId],
    references: [referralPartners.id],
  }),
}));

export const insertPartnerReferralSchema = createInsertSchema(partnerReferrals).omit({ id: true });
export type InsertPartnerReferral = z.infer<typeof insertPartnerReferralSchema>;
export type PartnerReferral = typeof partnerReferrals.$inferSelect;

// ==========================================
// Pro Marketplace (Items for resale from material recovery jobs)
// ==========================================
export const marketplaceItems = pgTable("marketplace_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proId: varchar("pro_id").notNull(), // Pro selling the item
  serviceRequestId: varchar("service_request_id"), // Job where item was recovered
  title: varchar("title").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // in dollars
  photos: text("photos").array(),
  category: varchar("category"), // furniture, appliances, electronics, tools, decor, outdoor, etc.
  condition: varchar("condition"), // like_new, good, fair, for_parts
  status: varchar("status").default("available"), // available, pending, sold, removed
  postedAt: text("posted_at").default(sql`now()`),
  soldAt: text("sold_at"),
  buyerId: varchar("buyer_id"), // Customer who bought it
  views: integer("views").default(0),
  location: varchar("location"), // City or ZIP for local pickup
});

export const marketplaceItemsRelations = relations(marketplaceItems, ({ one }) => ({
  pro: one(haulerProfiles, {
    fields: [marketplaceItems.proId],
    references: [haulerProfiles.id],
  }),
  buyer: one(users, {
    fields: [marketplaceItems.buyerId],
    references: [users.id],
  }),
}));

export const insertMarketplaceItemSchema = createInsertSchema(marketplaceItems).omit({ id: true });
export type InsertMarketplaceItem = z.infer<typeof insertMarketplaceItemSchema>;
export type MarketplaceItem = typeof marketplaceItems.$inferSelect;

// ==========================================
// HOA / Property Management Portal
// ==========================================

// HOA Properties - Property roster for HOA communities
export const hoaProperties = pgTable("hoa_properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessAccountId: varchar("business_account_id").notNull(), // FK to businessAccounts
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  ownerName: text("owner_name"),
  ownerEmail: text("owner_email"), // Required for communication
  ownerPhone: text("owner_phone"), // Optional
  marketingConsent: boolean("marketing_consent").default(false), // TCPA compliance - did they opt-in?
  consentDate: text("consent_date"), // When they gave consent
  consentMethod: text("consent_method"), // "hoa_agreement", "email_optin", "sms_reply", etc.
  moveInDate: text("move_in_date"), // Track new move-ins for home health check offer
  status: text("status").default("active"), // active, vacant, pending_sale, etc.
  isActive: boolean("is_active").default(true), // Whether property is actively managed
  notes: text("notes"), // Internal notes about property
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at"),
});

export const hoaPropertiesRelations = relations(hoaProperties, ({ one, many }) => ({
  businessAccount: one(businessAccounts, {
    fields: [hoaProperties.businessAccountId],
    references: [businessAccounts.id],
  }),
  violations: many(hoaViolations),
}));

export const insertHoaPropertySchema = createInsertSchema(hoaProperties).omit({ id: true });
export type InsertHoaProperty = z.infer<typeof insertHoaPropertySchema>;
export type HoaProperty = typeof hoaProperties.$inferSelect;

// HOA Violations - Track violation notices submitted by HOAs
export const hoaViolations = pgTable("hoa_violations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessAccountId: varchar("business_account_id").notNull(), // FK to businessAccounts
  propertyId: varchar("property_id").notNull(), // FK to hoaProperties
  violationType: text("violation_type").notNull(), // "landscaping", "junk_removal", "gutter_cleaning", "pressure_washing", etc.
  title: text("title").notNull(), // e.g., "Dead tree removal required"
  description: text("description").notNull(), // Full violation details
  dueDate: text("due_date"), // Deadline for compliance
  deadline: text("deadline"), // Alias for dueDate
  documentUrl: text("document_url"), // Scanned violation letter
  photos: text("photos").array(), // Array of photo URLs
  status: text("status").notNull().default("submitted"), // submitted, contacted_owner, owner_responded, scheduled, job_completed, resolved, expired
  serviceRequestId: varchar("service_request_id"), // FK to serviceRequests when job is created
  submittedBy: varchar("submitted_by"), // HOA admin who submitted
  submittedAt: text("submitted_at").notNull().default(sql`now()`),
  contactedOwnerAt: text("contacted_owner_at"), // When we first reached out to homeowner
  ownerRespondedAt: text("owner_responded_at"), // When homeowner replied/clicked
  scheduledAt: text("scheduled_at"), // When job was scheduled
  resolvedAt: text("resolved_at"), // When violation was marked resolved
  notes: text("notes"), // Internal notes
  urgency: text("urgency").default("normal"), // low, normal, high, critical
  severity: text("severity"), // Alias for urgency
});

export const hoaViolationsRelations = relations(hoaViolations, ({ one, many }) => ({
  businessAccount: one(businessAccounts, {
    fields: [hoaViolations.businessAccountId],
    references: [businessAccounts.id],
  }),
  property: one(hoaProperties, {
    fields: [hoaViolations.propertyId],
    references: [hoaProperties.id],
  }),
  serviceRequest: one(serviceRequests, {
    fields: [hoaViolations.serviceRequestId],
    references: [serviceRequests.id],
  }),
  communications: many(violationCommunications),
}));

export const insertHoaViolationSchema = createInsertSchema(hoaViolations).omit({ id: true });
export type InsertHoaViolation = z.infer<typeof insertHoaViolationSchema>;
export type HoaViolation = typeof hoaViolations.$inferSelect;

// Violation Communications - Track emails/SMS/calls to homeowners
export const violationCommunications = pgTable("violation_communications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  violationId: varchar("violation_id"), // FK to hoaViolations (optional for general communications)
  propertyId: varchar("property_id"), // FK to hoaProperties (optional)
  businessAccountId: varchar("business_account_id"), // FK to businessAccounts (optional)
  communicationType: text("communication_type"), // Type of communication
  method: text("method"), // Method used (alias for channel)
  sentBy: varchar("sent_by"), // User ID who sent the communication
  channel: text("channel").notNull(), // "email", "sms", "call"
  recipient: text("recipient").notNull(), // Email or phone number
  subject: text("subject"), // For emails
  message: text("message").notNull(), // Content sent
  sentAt: text("sent_at").notNull().default(sql`now()`),
  createdAt: text("created_at").default(sql`now()`), // Creation timestamp
  opened: boolean("opened").default(false), // Email opened tracking
  openedAt: text("opened_at"),
  clicked: boolean("clicked").default(false), // Link clicked
  clickedAt: text("clicked_at"),
  replied: boolean("replied").default(false), // Homeowner replied
  repliedAt: text("replied_at"),
  bounced: boolean("bounced").default(false), // Email bounced
  unsubscribed: boolean("unsubscribed").default(false), // User opted out
  status: text("status").default("sent"), // sent, delivered, opened, clicked, replied, bounced, failed
});

export const violationCommunicationsRelations = relations(violationCommunications, ({ one }) => ({
  violation: one(hoaViolations, {
    fields: [violationCommunications.violationId],
    references: [hoaViolations.id],
  }),
}));

export const insertViolationCommunicationSchema = createInsertSchema(violationCommunications).omit({ id: true });
export type InsertViolationCommunication = z.infer<typeof insertViolationCommunicationSchema>;
export type ViolationCommunication = typeof violationCommunications.$inferSelect;

// HOA Referral Payments - Track 10% referral fees paid to HOAs
export const hoaReferralPayments = pgTable("hoa_referral_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessAccountId: varchar("business_account_id").notNull(), // FK to businessAccounts
  serviceRequestId: varchar("service_request_id").notNull(), // FK to serviceRequests
  propertyId: varchar("property_id"), // FK to hoaProperties (optional)
  serviceType: text("service_type"), // Type of service performed
  jobTotal: real("job_total").notNull(), // Total job amount
  jobAmount: real("job_amount"), // Alias for jobTotal
  referralRate: real("referral_rate").notNull(), // Usually 0.10 (10%)
  commissionRate: real("commission_rate"), // Alias for referralRate
  referralAmount: real("referral_amount").notNull(), // Amount owed to HOA
  commissionAmount: real("commission_amount"), // Alias for referralAmount
  status: text("status").default("pending"), // pending, paid, voided
  paidAt: text("paid_at"),
  stripeTransferId: text("stripe_transfer_id"), // Stripe Connect transfer ID
  createdAt: text("created_at").notNull().default(sql`now()`),
  notes: text("notes"),
});

export const hoaReferralPaymentsRelations = relations(hoaReferralPayments, ({ one }) => ({
  businessAccount: one(businessAccounts, {
    fields: [hoaReferralPayments.businessAccountId],
    references: [businessAccounts.id],
  }),
  serviceRequest: one(serviceRequests, {
    fields: [hoaReferralPayments.serviceRequestId],
    references: [serviceRequests.id],
  }),
}));

export const insertHoaReferralPaymentSchema = createInsertSchema(hoaReferralPayments).omit({ id: true });
export type InsertHoaReferralPayment = z.infer<typeof insertHoaReferralPaymentSchema>;
export type HoaReferralPayment = typeof hoaReferralPayments.$inferSelect;

// Carbon Credits - Track carbon credits generated from waste diversion
export const carbonCredits = pgTable("carbon_credits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessAccountId: varchar("business_account_id"), // FK to businessAccounts - HOA who owns these credits
  serviceRequestId: varchar("service_request_id").notNull(), // FK to serviceRequests - Job that generated credits
  creditsGenerated: real("credits_generated").notNull(), // Amount of carbon credits (in metric tons CO2e)
  creditsEarned: real("credits_earned"), // Alias for creditsGenerated
  status: text("status").default("pending"), // pending, certified, rejected (alias for certificationStatus)
  calculationMethod: text("calculation_method"), // How we calculated it (e.g., "waste_diversion_epa_model")
  wasteWeightLbs: real("waste_weight_lbs"), // Total waste diverted
  landfillDiversionRate: real("landfill_diversion_rate"), // % diverted from landfill
  certificationStatus: text("certification_status").default("pending"), // pending, certified, rejected
  certificationDate: text("certification_date"),
  certificateUrl: text("certificate_url"), // Link to carbon credit certificate
  marketValue: real("market_value"), // Estimated value based on current market price
  soldAt: text("sold_at"), // When credits were sold
  salePrice: real("sale_price"), // Price sold for
  buyerInfo: text("buyer_info"), // Who bought the credits
  createdAt: text("created_at").notNull().default(sql`now()`),
  notes: text("notes"),
});

export const carbonCreditsRelations = relations(carbonCredits, ({ one }) => ({
  businessAccount: one(businessAccounts, {
    fields: [carbonCredits.businessAccountId],
    references: [businessAccounts.id],
  }),
  serviceRequest: one(serviceRequests, {
    fields: [carbonCredits.serviceRequestId],
    references: [serviceRequests.id],
  }),
}));

export const insertCarbonCreditSchema = createInsertSchema(carbonCredits).omit({ id: true });
export type InsertCarbonCredit = z.infer<typeof insertCarbonCreditSchema>;
export type CarbonCredit = typeof carbonCredits.$inferSelect;

// ==========================================
// Job Completion Verification System
// ==========================================

// Job Verification - Before/After photos, GPS tracking, completion workflow
export const jobVerification = pgTable("job_verification", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id").notNull().unique(), // FK to serviceRequests

  // Before Photos (required, minimum 2)
  beforePhotos: text("before_photos").array(), // Array of photo URLs
  beforePhotosTimestamp: text("before_photos_timestamp"), // When before photos were taken
  beforePhotosGps: text("before_photos_gps"), // GPS coordinates "lat,lng"
  beforePhotosAiAnalysis: jsonb("before_photos_ai_analysis"), // AI catalog of items, volume, condition

  // After Photos (required, minimum 2)
  afterPhotos: text("after_photos").array(), // Array of photo URLs
  afterPhotosTimestamp: text("after_photos_timestamp"), // When after photos were taken
  afterPhotosGps: text("after_photos_gps"), // GPS coordinates "lat,lng"
  afterPhotosAiAnalysis: jsonb("after_photos_ai_analysis"), // AI verification that work was done

  // Verification Status
  verificationStatus: text("verification_status").default("pending"), // pending, in_progress, awaiting_receipts, awaiting_customer, completed, failed
  stepsCompleted: jsonb("steps_completed").default('{"beforePhotos": false, "itemTracking": false, "afterPhotos": false, "receipts": false, "customerConfirmation": false}'), // Track which steps are done

  // Timestamps
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),

  // Totals from disposal records
  totalWeightLbs: real("total_weight_lbs").default(0),
  totalRecycledLbs: real("total_recycled_lbs").default(0),
  totalDonatedLbs: real("total_donated_lbs").default(0),
  totalResoldLbs: real("total_resold_lbs").default(0),
  totalLandfilledLbs: real("total_landfilled_lbs").default(0),
  totalSpecialtyLbs: real("total_specialty_lbs").default(0),
  diversionRate: real("diversion_rate").default(0), // (recycled + donated + resold) / total
  carbonOffsetTons: real("carbon_offset_tons").default(0), // Total CO2e saved
  carbonCreditValue: real("carbon_credit_value").default(0), // USD value at current market rate

  // Cleanliness Scores (for PolishUp home cleaning)
  cleanlinessScoreBefore: real("cleanliness_score_before"), // AI-generated cleanliness score 1-10 before cleaning
  cleanlinessScoreAfter: real("cleanliness_score_after"), // AI-generated cleanliness score 1-10 after cleaning

  // Customer Confirmation
  customerConfirmedAt: text("customer_confirmed_at"),
  customerFeedback: text("customer_feedback"),
  customerIssuesFlagged: boolean("customer_issues_flagged").default(false),
  autoApprovedAt: text("auto_approved_at"), // Auto-approve after 48 hours

  // Admin Override
  adminOverrideBy: varchar("admin_override_by"), // Admin user ID who overrode
  adminOverrideReason: text("admin_override_reason"),
  adminOverrideAt: text("admin_override_at"),
});

export const jobVerificationRelations = relations(jobVerification, ({ one, many }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [jobVerification.serviceRequestId],
    references: [serviceRequests.id],
  }),
  disposalRecords: many(disposalRecords),
}));

export const insertJobVerificationSchema = createInsertSchema(jobVerification).omit({ id: true });
export type InsertJobVerification = z.infer<typeof insertJobVerificationSchema>;
export type JobVerification = typeof jobVerification.$inferSelect;

// Disposal Records - Track where every item goes (recycle, donate, resale, landfill, specialty)
export const disposalRecords = pgTable("disposal_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id").notNull(), // FK to serviceRequests
  jobVerificationId: varchar("job_verification_id").notNull(), // FK to jobVerification

  // Item Details
  itemDescription: text("item_description").notNull(), // e.g., "Wooden dresser", "Mixed cardboard boxes"
  itemPhotoUrl: text("item_photo_url"), // Photo of the item
  estimatedWeightLbs: real("estimated_weight_lbs").notNull(), // Pro's estimate
  actualWeightLbs: real("actual_weight_lbs"), // From receipt if available

  // Disposal Category
  category: text("category").notNull(), // "recycle", "donate", "resale", "landfill", "specialty"

  // Destination Details
  destinationName: text("destination_name").notNull(), // Facility name, org name, listing platform, etc.
  destinationType: text("destination_type"), // For specialty: "e-waste", "hazmat", "paint", "chemicals"
  destinationAddress: text("destination_address"), // Physical address of facility/org

  // Required Proof
  receiptPhotoUrl: text("receipt_photo_url"), // Photo of receipt, ticket, or proof
  receiptOcrData: jsonb("receipt_ocr_data"), // Extracted data from OCR (weight, date, facility name)
  proofType: text("proof_type"), // "facility_receipt", "donation_receipt", "listing_screenshot", "weight_ticket", "disposal_certificate"
  proofVerified: boolean("proof_verified").default(false), // Admin or AI verified the proof is legitimate

  // GPS & Timestamp
  gpsCoordinates: text("gps_coordinates"), // "lat,lng" where disposal happened
  timestamp: text("timestamp").notNull().default(sql`now()`), // When item was disposed

  // Carbon Calculation
  carbonOffsetTons: real("carbon_offset_tons").default(0), // CO2e saved for this specific item
  carbonCalculationMethod: text("carbon_calculation_method"), // e.g., "EPA_WARM_mixed_waste"

  // For DONATE category
  donationOrganization: text("donation_organization"), // Goodwill, Habitat ReStore, Salvation Army, etc.
  donationReceiptNumber: text("donation_receipt_number"), // Receipt # from organization

  // For RESALE category
  resalePlatform: text("resale_platform"), // Facebook Marketplace, OfferUp, Craigslist, etc.
  resaleListingUrl: text("resale_listing_url"), // Link to listing
  resaleListingScreenshotUrl: text("resale_listing_screenshot_url"), // Screenshot of listing

  // For LANDFILL category
  landfillReason: text("landfill_reason"), // Why it couldn't be diverted: "hazardous", "contaminated", "broken_beyond_use", etc.
  landfillFacilityName: text("landfill_facility_name"),
  landfillWeightTicketUrl: text("landfill_weight_ticket_url"), // Weight ticket photo

  // For SPECIALTY category (e-waste, hazmat, etc.)
  specialtyDisposalType: text("specialty_disposal_type"), // "e-waste", "paint", "chemicals", "batteries", "tires"
  specialtyFacilityName: text("specialty_facility_name"),
  specialtyDisposalCertificateUrl: text("specialty_disposal_certificate_url"),

  // AI Suggestions
  aiSuggestedCategory: text("ai_suggested_category"), // AI's suggestion based on item photo
  aiConfidence: real("ai_confidence"), // AI's confidence in the suggestion (0-1)

  // Metadata
  createdAt: text("created_at").notNull().default(sql`now()`),
  notes: text("notes"), // Pro's notes about this item
});

export const disposalRecordsRelations = relations(disposalRecords, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [disposalRecords.serviceRequestId],
    references: [serviceRequests.id],
  }),
  jobVerification: one(jobVerification, {
    fields: [disposalRecords.jobVerificationId],
    references: [jobVerification.id],
  }),
}));

export const insertDisposalRecordSchema = createInsertSchema(disposalRecords).omit({ id: true });
export type InsertDisposalRecord = z.infer<typeof insertDisposalRecordSchema>;
export type DisposalRecord = typeof disposalRecords.$inferSelect;

// ==========================================
// PolishUp Home Cleaning System
// ==========================================

// Cleaning Checklists - Room-by-room task completion for PolishUp jobs
export const cleaningChecklists = pgTable("cleaning_checklists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id").notNull(), // FK to serviceRequests
  roomType: text("room_type").notNull(), // "kitchen", "bathroom", "bedroom", "living_room", "dining_room", "office", "general"
  taskName: text("task_name").notNull(), // e.g., "Countertops wiped and sanitized", "Toilet cleaned inside and out"
  completed: boolean("completed").default(false),
  skipped: boolean("skipped").default(false),
  skipReason: text("skip_reason"), // If skipped, why? e.g., "Customer asked to skip", "Area inaccessible"
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const cleaningChecklistsRelations = relations(cleaningChecklists, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [cleaningChecklists.serviceRequestId],
    references: [serviceRequests.id],
  }),
}));

export const insertCleaningChecklistSchema = createInsertSchema(cleaningChecklists).omit({ id: true });
export type InsertCleaningChecklist = z.infer<typeof insertCleaningChecklistSchema>;
export type CleaningChecklist = typeof cleaningChecklists.$inferSelect;

// Recurring Subscriptions - For recurring PolishUp bookings
export const recurringSubscriptions = pgTable("recurring_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(), // FK to users
  serviceType: text("service_type").notNull(), // "home_cleaning" for PolishUp
  frequency: text("frequency").notNull(), // "weekly", "biweekly", "monthly"
  homeDetails: jsonb("home_details").notNull(), // {bedrooms: 3, bathrooms: 2, addOns: ["inside_oven"], cleanType: "standard"}
  preferredDay: text("preferred_day"), // "monday", "tuesday", etc.
  preferredTimeWindow: text("preferred_time_window"), // "morning", "afternoon", "evening"
  assignedProId: varchar("assigned_pro_id"), // FK to users - same Pro for consistency
  stripeSubscriptionId: text("stripe_subscription_id"), // Stripe subscription ID for recurring billing
  status: text("status").notNull().default("active"), // "active", "paused", "cancelled"
  nextBookingDate: text("next_booking_date"), // ISO date string of next scheduled booking
  bookingsCompleted: integer("bookings_completed").default(0), // Count of completed bookings
  minimumBookingsCommitment: integer("minimum_bookings_commitment").default(3), // 3-booking minimum
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").notNull().default(sql`now()`),
  cancelledAt: text("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
});

export const recurringSubscriptionsRelations = relations(recurringSubscriptions, ({ one }) => ({
  customer: one(users, {
    fields: [recurringSubscriptions.customerId],
    references: [users.id],
  }),
  assignedPro: one(users, {
    fields: [recurringSubscriptions.assignedProId],
    references: [users.id],
  }),
}));

export const insertRecurringSubscriptionSchema = createInsertSchema(recurringSubscriptions).omit({ id: true });
export type InsertRecurringSubscription = z.infer<typeof insertRecurringSubscriptionSchema>;
export type RecurringSubscription = typeof recurringSubscriptions.$inferSelect;

// ==========================================
// AI Assistant / SMS Bot System
// ==========================================

// SMS Conversations - Track SMS bot conversations by phone number
export const smsConversations = pgTable("sms_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: text("phone_number").notNull().unique(), // Customer's phone number (E.164 format)
  userId: varchar("user_id"), // FK to users if they create an account later

  // Conversation State
  language: text("language").default("en"), // "en" or "es" (auto-detected)
  lastMessageAt: text("last_message_at").notNull().default(sql`now()`),
  messageCount: integer("message_count").default(0),
  isActive: boolean("is_active").default(true),

  // Rate Limiting
  messagesLastHour: integer("messages_last_hour").default(0),
  lastHourResetAt: text("last_hour_reset_at").default(sql`now()`),
  isRateLimited: boolean("is_rate_limited").default(false),
  rateLimitedUntil: text("rate_limited_until"),

  // Opt-Out / Compliance
  optedOut: boolean("opted_out").default(false),
  optedOutAt: text("opted_out_at"),
  optOutReason: text("opt_out_reason"), // "STOP", "UNSUBSCRIBE", etc.

  // Customer Info (collected during conversation)
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  callbackRequested: boolean("callback_requested").default(false),

  // Metadata
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const smsConversationsRelations = relations(smsConversations, ({ one, many }) => ({
  user: one(users, {
    fields: [smsConversations.userId],
    references: [users.id],
  }),
  messages: many(smsMessages),
}));

export const insertSmsConversationSchema = createInsertSchema(smsConversations).omit({ id: true });
export type InsertSmsConversation = z.infer<typeof insertSmsConversationSchema>;
export type SmsConversation = typeof smsConversations.$inferSelect;

// SMS Messages - Individual messages in SMS conversations
export const smsMessages = pgTable("sms_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(), // FK to smsConversations

  // Message Details
  direction: text("direction").notNull(), // "inbound" (from customer) or "outbound" (from bot)
  messageBody: text("message_body").notNull(),
  twilioMessageSid: text("twilio_message_sid"), // Twilio message ID

  // Media Attachments (MMS photos)
  mediaUrls: text("media_urls").array(), // Array of photo URLs sent by customer
  mediaContentTypes: text("media_content_types").array(), // MIME types of media

  // AI Analysis (if photos were sent)
  aiAnalysisResult: jsonb("ai_analysis_result"), // AI quote result from photo analysis
  quoteGenerated: boolean("quote_generated").default(false),
  quotedPrice: real("quoted_price"), // Price quoted to customer

  // Status
  deliveryStatus: text("delivery_status"), // "queued", "sending", "sent", "delivered", "failed"
  errorCode: text("error_code"),
  errorMessage: text("error_message"),

  // Timestamps
  sentAt: text("sent_at").default(sql`now()`),
  deliveredAt: text("delivered_at"),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const smsMessagesRelations = relations(smsMessages, ({ one }) => ({
  conversation: one(smsConversations, {
    fields: [smsMessages.conversationId],
    references: [smsConversations.id],
  }),
}));

export const insertSmsMessageSchema = createInsertSchema(smsMessages).omit({ id: true });
export type InsertSmsMessage = z.infer<typeof insertSmsMessageSchema>;
export type SmsMessage = typeof smsMessages.$inferSelect;

// ==========================================
// Property Intelligence Layer - Enums
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
  // DwellScan Events
  "dwellscan_baseline", "dwellscan_rescan",

  // General Service Events
  "service_completed", "maintenance_reminder", "photo_documentation", "builder_handoff",

  // Warranty Events
  "warranty_registered", "warranty_expiring", "warranty_expired", "warranty_claimed",

  // Insurance Events
  "insurance_claim",

  // Appliance Events
  "appliance_added", "appliance_replaced", "appliance_service", "appliance_repair",

  // Structural Events
  "foundation_inspection", "foundation_repair", "foundation_waterproofing",

  // Roof Events
  "roof_inspection", "roof_repair", "roof_replacement", "roof_cleaning", "gutter_service",

  // HVAC Events
  "hvac_inspection", "hvac_service", "hvac_repair", "hvac_replacement", "hvac_filter_change", "hvac_duct_cleaning",

  // Plumbing Events
  "plumbing_inspection", "plumbing_repair", "plumbing_replacement", "water_heater_service", "water_heater_replacement",
  "leak_repair", "pipe_replacement", "sewer_line_service",

  // Electrical Events
  "electrical_inspection", "electrical_repair", "electrical_upgrade", "panel_upgrade", "generator_installation",
  "generator_service",

  // Exterior Events
  "exterior_painting", "siding_repair", "siding_replacement", "window_replacement", "door_replacement",
  "pressure_washing", "soffit_fascia_repair",

  // Interior Events
  "interior_painting", "flooring_installation", "flooring_repair", "carpet_cleaning", "carpet_replacement",
  "drywall_repair", "cabinet_installation", "countertop_installation",

  // Garage Events
  "garage_door_service", "garage_door_replacement", "garage_door_opener_service", "garage_door_opener_installation",

  // Landscape Events
  "landscape_installation", "landscape_service", "irrigation_installation", "irrigation_repair", "tree_removal",
  "tree_trimming", "sod_installation", "mulch_installation",

  // Pool Events
  "pool_inspection", "pool_service", "pool_repair", "pool_equipment_replacement", "pool_resurfacing",
  "pool_deck_repair",

  // Pest Control Events
  "pest_inspection", "pest_treatment", "termite_inspection", "termite_treatment",

  // Other
  "condition_change", "general_repair", "emergency_repair", "preventive_maintenance"
]);

export const notificationTypeEnum = z.enum([
  "warranty_expiring_90d", "warranty_expiring_60d", "warranty_expiring_30d",
  "warranty_expired", "maintenance_due", "maintenance_overdue",
  "insurance_renewal", "health_score_change", "dwellscan_recommendation",
  "builder_welcome", "appliance_recall", "seasonal_reminder"
]);

export const documentTypeEnum = z.enum([
  // Legal & Ownership
  "deed", "title", "survey", "hoa_docs", "property_disclosure",

  // Inspections & Reports
  "home_inspection_report", "foundation_inspection", "roof_inspection", "hvac_inspection",
  "plumbing_inspection", "electrical_inspection", "pest_inspection", "termite_inspection",
  "mold_inspection", "radon_test", "water_quality_test", "septic_inspection",

  // Warranties
  "builder_warranty", "home_warranty_policy", "appliance_warranty", "roof_warranty",
  "hvac_warranty", "pool_warranty", "manufacturer_warranty",

  // Insurance
  "insurance_policy", "insurance_claim_docs", "insurance_declaration_page",

  // Contractor Work & Receipts
  "contractor_receipt", "service_receipt", "purchase_receipt", "invoice",
  "work_order", "estimate", "contract", "permit",

  // Before/After Documentation
  "before_photos", "after_photos", "before_after_video", "progress_photos",
  "damage_documentation", "repair_documentation",

  // DwellScan & Media
  "dwellscan_report", "property_health_report", "video_walkthrough", "drone_aerial",
  "360_video", "room_photos", "exterior_photos",

  // Appliance & Equipment
  "appliance_manual", "equipment_manual", "model_plate_photo", "serial_number_photo",

  // Maintenance Records
  "maintenance_log", "service_history", "filter_change_record", "seasonal_maintenance",

  // Financial
  "tax_assessment", "appraisal", "closing_documents", "mortgage_docs",

  // Transferable Reports (for resale)
  "transferable_health_report", "transferable_maintenance_history", "carfax_for_homes_report",

  // Other
  "floor_plan", "blueprint", "manual", "other"
]);

// ==========================================
// Property Intelligence Layer - Tables
// ==========================================

// Property Appliances - Complete appliance registry
export const propertyAppliances = pgTable("property_appliances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  
  // Appliance Details
  category: text("category").notNull(), // From applianceCategoryEnum
  brand: text("brand"),
  modelNumber: text("model_number"),
  serialNumber: text("serial_number"),
  installDate: text("install_date"),
  purchaseDate: text("purchase_date"),
  purchasePrice: real("purchase_price"),
  
  // Location & Specs
  location: text("location"), // "Kitchen", "Garage", "Basement", etc.
  capacity: text("capacity"), // "5000 BTU", "50 gallon", etc.
  energyRating: text("energy_rating"), // Energy Star rating
  specifications: jsonb("specifications"), // Flexible specs storage
  
  // Lifecycle Tracking
  estimatedLifespanYears: integer("estimated_lifespan_years"),
  ageYears: integer("age_years"),
  conditionScore: real("condition_score"), // 0-100
  lastServiceDate: text("last_service_date"),
  nextServiceDue: text("next_service_due"),
  serviceHistory: jsonb("service_history"), // Array of service records
  
  // Warranty & Insurance
  warrantyId: varchar("warranty_id"), // FK to property_warranties
  underInsurance: boolean("under_insurance").default(false),
  insurancePolicyId: varchar("insurance_policy_id"),
  
  // Documentation
  manualUrl: text("manual_url"),
  receiptUrl: text("receipt_url"),
  photoUrls: text("photo_urls").array(),
  
  // Alerts & Reminders
  hasActiveWarranty: boolean("has_active_warranty").default(false),
  warrantyExpiresAt: text("warranty_expires_at"),
  maintenanceAlertEnabled: boolean("maintenance_alert_enabled").default(true),
  
  // Status
  status: text("status").default("active"), // "active", "replaced", "removed", "broken"
  replacedBy: varchar("replaced_by"), // FK to new appliance
  notes: text("notes"),
  
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const propertyAppliancesRelations = relations(propertyAppliances, ({ one }) => ({
  property: one(properties, {
    fields: [propertyAppliances.propertyId],
    references: [properties.id],
  }),
  warranty: one(propertyWarranties, {
    fields: [propertyAppliances.warrantyId],
    references: [propertyWarranties.id],
  }),
}));

export const insertPropertyApplianceSchema = createInsertSchema(propertyAppliances).omit({ id: true });
export type InsertPropertyAppliance = z.infer<typeof insertPropertyApplianceSchema>;
export type PropertyAppliance = typeof propertyAppliances.$inferSelect;

// Appliance Scans - AI-powered appliance scanning
export const applianceScans = pgTable("appliance_scans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  scanSessionId: varchar("scan_session_id"),

  // Scan Details
  photoUrls: text("photo_urls").array(),
  location: text("location"), // "Kitchen", "Garage", etc.
  scanMethod: text("scan_method").notNull(), // "customer_scan", "pro_scan", "dwellscan"
  scannedBy: varchar("scanned_by"), // User ID or Pro ID
  scannedAt: text("scanned_at").notNull().default(sql`now()`),
  scanSessionSequence: integer("scan_session_sequence"), // Order within session

  // AI Processing
  aiProcessingStatus: text("ai_processing_status").notNull().default("uploaded"), // "uploaded", "queued", "processing", "completed", "failed"
  aiProcessingStartedAt: text("ai_processing_started_at"),
  aiProcessingCompletedAt: text("ai_processing_completed_at"),
  aiProcessingDurationMs: integer("ai_processing_duration_ms"),
  aiProcessingError: text("ai_processing_error"),

  // AI Extraction Results
  extractedBrand: text("extracted_brand"),
  extractedModel: text("extracted_model"),
  extractedSerialNumber: text("extracted_serial_number"),
  extractedCategory: text("extracted_category"),
  confidenceScore: real("confidence_score"), // 0-1
  confidenceBreakdown: jsonb("confidence_breakdown"), // { brand: 0.9, model: 0.85, serialNumber: 0.95 }

  // Validation & Confirmation
  needsReview: boolean("needs_review").default(false),
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: text("reviewed_at"),
  userConfirmed: boolean("user_confirmed").default(false),
  userRejected: boolean("user_rejected").default(false),
  autoConfirmed: boolean("auto_confirmed").default(false),

  // Appliance Creation
  applianceCreated: boolean("appliance_created").default(false),
  applianceId: varchar("appliance_id"), // FK to property_appliances if created

  // Pro Bonus Tracking
  proScanBonus: boolean("pro_scan_bonus").default(false),
  proBonusEarned: boolean("pro_bonus_earned").default(false),
  proBonusAmount: real("pro_bonus_amount").default(1.0),

  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const applianceScansRelations = relations(applianceScans, ({ one }) => ({
  property: one(properties, {
    fields: [applianceScans.propertyId],
    references: [properties.id],
  }),
  session: one(applianceScanSessions, {
    fields: [applianceScans.scanSessionId],
    references: [applianceScanSessions.id],
  }),
}));

export const insertApplianceScanSchema = createInsertSchema(applianceScans).omit({ id: true });
export type InsertApplianceScan = z.infer<typeof insertApplianceScanSchema>;
export type ApplianceScan = typeof applianceScans.$inferSelect;

// Appliance Scan Sessions - Batch scanning sessions
export const applianceScanSessions = pgTable("appliance_scan_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  scannedBy: varchar("scanned_by").notNull(), // User ID or Pro ID
  scanMethod: text("scan_method").notNull(), // "customer_scan", "pro_scan", "dwellscan"

  // Session Tracking
  status: text("status").default("active"), // "active", "processing", "completed"
  startedAt: text("started_at").notNull().default(sql`now()`),
  completedAt: text("completed_at"),
  durationSeconds: integer("duration_seconds"),

  // Counts
  totalScans: integer("total_scans").default(0),
  scansProcessed: integer("scans_processed").default(0),
  appliancesCreated: integer("appliances_created").default(0),
  scansNeedingReview: integer("scans_needing_review").default(0),

  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const applianceScanSessionsRelations = relations(applianceScanSessions, ({ one, many }) => ({
  property: one(properties, {
    fields: [applianceScanSessions.propertyId],
    references: [properties.id],
  }),
  scans: many(applianceScans),
}));

export const insertApplianceScanSessionSchema = createInsertSchema(applianceScanSessions).omit({ id: true });
export type InsertApplianceScanSession = z.infer<typeof insertApplianceScanSessionSchema>;
export type ApplianceScanSession = typeof applianceScanSessions.$inferSelect;

// Property Warranties - Comprehensive warranty tracking
export const propertyWarranties = pgTable("property_warranties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  
  // Warranty Details
  warrantyType: text("warranty_type").notNull(), // From warrantyTypeEnum
  provider: text("provider").notNull(), // Company name
  policyNumber: text("policy_number"),
  description: text("description"),
  
  // Coverage
  coverageItems: text("coverage_items").array(), // What's covered
  coverageAmount: real("coverage_amount"),
  deductible: real("deductible"),
  exclusions: text("exclusions").array(),
  
  // Dates & Duration
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  durationYears: integer("duration_years"),
  autoRenew: boolean("auto_renew").default(false),
  
  // Alert Tracking (30/60/90 day alerts)
  alert90DaySent: boolean("alert_90_day_sent").default(false),
  alert90DaySentAt: text("alert_90_day_sent_at"),
  alert60DaySent: boolean("alert_60_day_sent").default(false),
  alert60DaySentAt: text("alert_60_day_sent_at"),
  alert30DaySent: boolean("alert_30_day_sent").default(false),
  alert30DaySentAt: text("alert_30_day_sent_at"),
  expirationAlertSent: boolean("expiration_alert_sent").default(false),
  
  // Contact & Claims
  providerPhone: text("provider_phone"),
  providerEmail: text("provider_email"),
  providerWebsite: text("provider_website"),
  claimInstructions: text("claim_instructions"),
  totalClaimsMade: integer("total_claims_made").default(0),
  lastClaimDate: text("last_claim_date"),
  
  // Documentation
  documentUrls: text("document_urls").array(),
  policyDocumentUrl: text("policy_document_url"),
  
  // Cost
  annualCost: real("annual_cost"),
  totalCostPaid: real("total_cost_paid").default(0),
  
  // Status
  status: text("status").default("active"), // "active", "expired", "cancelled", "claimed"
  notes: text("notes"),
  
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const propertyWarrantiesRelations = relations(propertyWarranties, ({ one, many }) => ({
  property: one(properties, {
    fields: [propertyWarranties.propertyId],
    references: [properties.id],
  }),
  appliances: many(propertyAppliances),
}));

export const insertPropertyWarrantySchema = createInsertSchema(propertyWarranties).omit({ id: true });
export type InsertPropertyWarranty = z.infer<typeof insertPropertyWarrantySchema>;
export type PropertyWarranty = typeof propertyWarranties.$inferSelect;

// Property Insurance - Insurance policy tracking
export const propertyInsurance = pgTable("property_insurance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  
  // Policy Details
  insuranceType: text("insurance_type").notNull(), // From insuranceTypeEnum
  carrier: text("carrier").notNull(),
  policyNumber: text("policy_number").notNull(),
  agentName: text("agent_name"),
  agentPhone: text("agent_phone"),
  agentEmail: text("agent_email"),
  
  // Coverage & Costs
  coverageAmount: real("coverage_amount").notNull(),
  deductible: real("deductible"),
  annualPremium: real("annual_premium"),
  monthlyPremium: real("monthly_premium"),
  
  // Coverage Details
  dwellingCoverage: real("dwelling_coverage"),
  personalPropertyCoverage: real("personal_property_coverage"),
  liabilityCoverage: real("liability_coverage"),
  additionalCoverages: text("additional_coverages").array(),
  
  // Dates
  effectiveDate: text("effective_date").notNull(),
  expirationDate: text("expiration_date").notNull(),
  renewalDate: text("renewal_date"),
  
  // Discount Tracking
  discounts: jsonb("discounts"), // { "security_system": 5, "multiple_policy": 10 }
  totalDiscountPct: real("total_discount_pct").default(0),
  
  // Claims History
  totalClaimsMade: integer("total_claims_made").default(0),
  lastClaimDate: text("last_claim_date"),
  claimsHistory: jsonb("claims_history"), // Array of claim records
  
  // Partner Integration
  insurancePartnerId: varchar("insurance_partner_id"), // FK to insurance_partners
  discountEligible: boolean("discount_eligible").default(false),
  
  // Alerts
  renewalAlertSent: boolean("renewal_alert_sent").default(false),
  renewalAlertSentAt: text("renewal_alert_sent_at"),
  
  // Documentation
  policyDocumentUrl: text("policy_document_url"),
  documentUrls: text("document_urls").array(),
  
  // Status
  status: text("status").default("active"), // "active", "expired", "cancelled"
  notes: text("notes"),
  
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const propertyInsuranceRelations = relations(propertyInsurance, ({ one }) => ({
  property: one(properties, {
    fields: [propertyInsurance.propertyId],
    references: [properties.id],
  }),
  partner: one(insurancePartners, {
    fields: [propertyInsurance.insurancePartnerId],
    references: [insurancePartners.id],
  }),
}));

export const insertPropertyInsuranceSchema = createInsertSchema(propertyInsurance).omit({ id: true });
export type InsertPropertyInsurance = z.infer<typeof insertPropertyInsuranceSchema>;
export type PropertyInsurance = typeof propertyInsurance.$inferSelect;

// Property Health Events - Complete timeline/Carfax for homes
export const propertyHealthEvents = pgTable("property_health_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  
  // Event Details
  eventType: text("event_type").notNull(), // From healthEventTypeEnum
  title: text("title").notNull(),
  description: text("description"),
  
  // Associated Records
  serviceRequestId: varchar("service_request_id"), // FK to serviceRequests
  applianceId: varchar("appliance_id"), // FK to propertyAppliances
  warrantyId: varchar("warranty_id"), // FK to propertyWarranties
  insurancePolicyId: varchar("insurance_policy_id"), // FK to propertyInsurance
  dwellscanId: varchar("dwellscan_id"), // FK to DwellScan results
  
  // Impact on Property Health
  healthScoreImpact: real("health_score_impact"), // -10 to +10
  categoryImpacted: text("category_impacted"), // "roof", "hvac", etc.
  previousScore: real("previous_score"),
  newScore: real("new_score"),
  
  // Financial Impact
  costAmount: real("cost_amount"),
  valueSaved: real("value_saved"),
  preventiveValue: real("preventive_value"),
  
  // Documentation
  photoUrls: text("photo_urls").array(),
  documentUrls: text("document_urls").array(),
  receiptUrl: text("receipt_url"),
  
  // Metadata
  performedBy: text("performed_by"), // Pro/contractor name
  verifiedBy: text("verified_by"), // Admin/system
  isVerified: boolean("is_verified").default(false),
  verifiedAt: text("verified_at"),
  
  // Timeline
  eventDate: text("event_date").notNull(),
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
  
  // Tags & Search
  tags: text("tags").array(),
  isPublic: boolean("is_public").default(true), // Visible to realtors/buyers
  notes: text("notes"),
});

export const propertyHealthEventsRelations = relations(propertyHealthEvents, ({ one }) => ({
  property: one(properties, {
    fields: [propertyHealthEvents.propertyId],
    references: [properties.id],
  }),
  serviceRequest: one(serviceRequests, {
    fields: [propertyHealthEvents.serviceRequestId],
    references: [serviceRequests.id],
  }),
  appliance: one(propertyAppliances, {
    fields: [propertyHealthEvents.applianceId],
    references: [propertyAppliances.id],
  }),
  warranty: one(propertyWarranties, {
    fields: [propertyHealthEvents.warrantyId],
    references: [propertyWarranties.id],
  }),
}));

export const insertPropertyHealthEventSchema = createInsertSchema(propertyHealthEvents).omit({ id: true });
export type InsertPropertyHealthEvent = z.infer<typeof insertPropertyHealthEventSchema>;
export type PropertyHealthEvent = typeof propertyHealthEvents.$inferSelect;

// Property Maintenance Schedule - AI-generated maintenance cadence
export const propertyMaintenanceSchedule = pgTable("property_maintenance_schedule", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  
  // Task Details
  taskName: text("task_name").notNull(),
  taskDescription: text("task_description"),
  taskCategory: text("task_category"), // "hvac", "roof", "landscape", etc.
  serviceType: text("service_type"), // Maps to serviceTypeEnum
  
  // Scheduling
  frequency: text("frequency").notNull(), // "monthly", "quarterly", "semi_annual", "annual", "biennial"
  frequencyDays: integer("frequency_days"), // Days between occurrences
  nextDueDate: text("next_due_date").notNull(),
  lastCompletedDate: text("last_completed_date"),
  
  // Priority & Urgency
  priority: text("priority").default("medium"), // "low", "medium", "high", "critical"
  isOverdue: boolean("is_overdue").default(false),
  overdueBy: integer("overdue_by"), // Days overdue
  
  // AI Generation
  aiGenerated: boolean("ai_generated").default(false),
  aiConfidence: real("ai_confidence"), // 0-100
  generatedFrom: text("generated_from"), // "dwellscan", "age", "seasonal", "manual"
  
  // Cost Estimates
  estimatedCost: real("estimated_cost"),
  estimatedDurationHours: real("estimated_duration_hours"),
  
  // Completion Tracking
  totalCompletions: integer("total_completions").default(0),
  averageCost: real("average_cost"),
  lastServiceRequestId: varchar("last_service_request_id"),
  
  // Reminders
  reminderEnabled: boolean("reminder_enabled").default(true),
  reminderDaysBefore: integer("reminder_days_before").default(7),
  lastReminderSent: text("last_reminder_sent"),
  
  // Linked Records
  applianceId: varchar("appliance_id"), // If appliance-specific
  warrantyId: varchar("warranty_id"), // If warranty-required
  
  // Status
  status: text("status").default("active"), // "active", "completed", "skipped", "cancelled"
  notes: text("notes"),
  
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const propertyMaintenanceScheduleRelations = relations(propertyMaintenanceSchedule, ({ one }) => ({
  property: one(properties, {
    fields: [propertyMaintenanceSchedule.propertyId],
    references: [properties.id],
  }),
  appliance: one(propertyAppliances, {
    fields: [propertyMaintenanceSchedule.applianceId],
    references: [propertyAppliances.id],
  }),
  lastServiceRequest: one(serviceRequests, {
    fields: [propertyMaintenanceSchedule.lastServiceRequestId],
    references: [serviceRequests.id],
  }),
}));

export const insertPropertyMaintenanceScheduleSchema = createInsertSchema(propertyMaintenanceSchedule).omit({ id: true });
export type InsertPropertyMaintenanceSchedule = z.infer<typeof insertPropertyMaintenanceScheduleSchema>;
export type PropertyMaintenanceSchedule = typeof propertyMaintenanceSchedule.$inferSelect;

// Builder Partnerships - Builder/developer partnership platform
export const builderPartnerships = pgTable("builder_partnerships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Builder Details
  builderName: text("builder_name").notNull(),
  builderCompany: text("builder_company").notNull(),
  builderLicense: text("builder_license"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  
  // Service Areas
  serviceStates: text("service_states").array(),
  serviceCities: text("service_cities").array(),
  serviceZipCodes: text("service_zip_codes").array(),
  
  // Partnership Terms
  partnershipTier: text("partnership_tier").default("basic"), // "basic", "preferred", "exclusive"
  commissionRate: real("commission_rate"), // Percentage
  referralFee: real("referral_fee"), // Flat fee per referral
  
  // Offerings
  offersDwellScan: boolean("offers_dwellscan").default(false),
  offersWarrantyPackage: boolean("offers_warranty_package").default(false),
  offersMaintenancePlan: boolean("offers_maintenance_plan").default(false),
  customPackages: jsonb("custom_packages"), // Custom offerings
  
  // Stats & Performance
  totalProperties: integer("total_properties").default(0),
  totalHomeowners: integer("total_homeowners").default(0),
  totalRevenue: real("total_revenue").default(0),
  averageHomeValue: real("average_home_value"),
  
  // Closing Workflow
  closingWorkflowEnabled: boolean("closing_workflow_enabled").default(false),
  closingDayHandoffProtocol: text("closing_day_handoff_protocol"),
  digitalWelcomePacket: boolean("digital_welcome_packet").default(false),
  
  // Contract & Legal
  contractStartDate: text("contract_start_date"),
  contractEndDate: text("contract_end_date"),
  contractDocumentUrl: text("contract_document_url"),
  insuranceCertificateUrl: text("insurance_certificate_url"),
  
  // Branding
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url"),
  marketingMaterials: text("marketing_materials").array(),
  
  // Status
  status: text("status").default("active"), // "active", "inactive", "suspended"
  isVerified: boolean("is_verified").default(false),
  verifiedAt: text("verified_at"),
  notes: text("notes"),
  
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const builderPartnershipsRelations = relations(builderPartnerships, ({ many }) => ({
  properties: many(properties),
}));

export const insertBuilderPartnershipSchema = createInsertSchema(builderPartnerships).omit({ id: true });
export type InsertBuilderPartnership = z.infer<typeof insertBuilderPartnershipSchema>;
export type BuilderPartnership = typeof builderPartnerships.$inferSelect;

// Insurance Partners - Insurance carrier partnership platform
export const insurancePartners = pgTable("insurance_partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Carrier Details
  carrierName: text("carrier_name").notNull(),
  carrierCode: text("carrier_code").unique(), // NAIC code
  amBestRating: text("am_best_rating"), // A++, A+, A, etc.
  contactName: text("contact_name"),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  
  // Service Areas
  licensedStates: text("licensed_states").array().notNull(),
  serviceZipCodes: text("service_zip_codes").array(),
  
  // Policy Types Offered
  offersHomeowners: boolean("offers_homeowners").default(true),
  offersFlood: boolean("offers_flood").default(false),
  offersWindstorm: boolean("offers_windstorm").default(false),
  offersUmbrella: boolean("offers_umbrella").default(false),
  
  // Discount Programs
  maintenanceDiscount: boolean("maintenance_discount").default(false),
  maintenanceDiscountPct: real("maintenance_discount_pct"),
  dwellscanDiscount: boolean("dwellscan_discount").default(false),
  dwellscanDiscountPct: real("dwellscan_discount_pct"),
  warrantyDiscount: boolean("warranty_discount").default(false),
  warrantyDiscountPct: real("warranty_discount_pct"),
  
  // Integration Details
  apiEnabled: boolean("api_enabled").default(false),
  apiEndpoint: text("api_endpoint"),
  apiKey: text("api_key"), // Encrypted
  webhookUrl: text("webhook_url"),
  
  // Performance
  totalPolicies: integer("total_policies").default(0),
  totalPremiumVolume: real("total_premium_volume").default(0),
  averageDiscount: real("average_discount"),
  claimApprovalRate: real("claim_approval_rate"),
  
  // Commission & Revenue
  commissionRate: real("commission_rate"),
  referralFee: real("referral_fee"),
  totalRevenue: real("total_revenue").default(0),
  
  // Partnership Terms
  partnershipTier: text("partnership_tier").default("standard"), // "standard", "preferred", "exclusive"
  contractStartDate: text("contract_start_date"),
  contractEndDate: text("contract_end_date"),
  contractDocumentUrl: text("contract_document_url"),
  
  // Branding
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url"),
  quoteUrl: text("quote_url"), // Direct link to get quote
  
  // Status
  status: text("status").default("active"), // "active", "inactive", "suspended"
  isVerified: boolean("is_verified").default(false),
  verifiedAt: text("verified_at"),
  notes: text("notes"),
  
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const insurancePartnersRelations = relations(insurancePartners, ({ many }) => ({
  policies: many(propertyInsurance),
}));

export const insertInsurancePartnerSchema = createInsertSchema(insurancePartners).omit({ id: true });
export type InsertInsurancePartner = z.infer<typeof insertInsurancePartnerSchema>;
export type InsurancePartner = typeof insurancePartners.$inferSelect;

export const customerInsurance = pgTable("customer_insurance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(),
  insurancePartnerId: varchar("insurance_partner_id").notNull(),
  policyNumber: text("policy_number").notNull(),
  coverageType: text("coverage_type").notNull(),
  expiresAt: text("expires_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertCustomerInsuranceSchema = createInsertSchema(customerInsurance).omit({ id: true, createdAt: true });
export type InsertCustomerInsurance = z.infer<typeof insertCustomerInsuranceSchema>;
export type CustomerInsurance = typeof customerInsurance.$inferSelect;

// Property Documents - Centralized document storage
export const propertyDocuments = pgTable("property_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  
  // Document Details
  documentName: text("document_name").notNull(),
  documentType: text("document_type").notNull(), // See documentTypeEnum for all supported types
  description: text("description"),
  
  // File Details
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"), // Bytes
  fileType: text("file_type"), // "application/pdf", "image/jpeg", etc.
  thumbnailUrl: text("thumbnail_url"),
  
  // Categorization
  category: text("category"), // "legal", "maintenance", "financial", "warranty", "insurance"
  tags: text("tags").array(),
  
  // Associated Records
  applianceId: varchar("appliance_id"), // If appliance-related
  warrantyId: varchar("warranty_id"), // If warranty document
  insurancePolicyId: varchar("insurance_policy_id"), // If insurance document
  serviceRequestId: varchar("service_request_id"), // If service receipt
  
  // Document Metadata
  documentDate: text("document_date"), // Date of the document (not upload date)
  expirationDate: text("expiration_date"), // If applicable
  issuer: text("issuer"), // Who issued the document
  
  // Access Control
  isPublic: boolean("is_public").default(false), // Share with realtors/buyers
  sharedWith: text("shared_with").array(), // User IDs with access
  
  // OCR & AI Analysis
  ocrText: text("ocr_text"), // Extracted text for search
  aiSummary: text("ai_summary"), // AI-generated summary
  aiExtractedData: jsonb("ai_extracted_data"), // Structured data extracted
  
  // Version Control
  version: integer("version").default(1),
  previousVersionId: varchar("previous_version_id"), // FK to earlier version
  
  // Upload Details
  uploadedBy: varchar("uploaded_by"), // User ID
  uploadSource: text("upload_source"), // "web", "mobile", "email", "dwellscan"
  
  // Status
  status: text("status").default("active"), // "active", "archived", "deleted"
  notes: text("notes"),
  
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const propertyDocumentsRelations = relations(propertyDocuments, ({ one }) => ({
  property: one(properties, {
    fields: [propertyDocuments.propertyId],
    references: [properties.id],
  }),
  appliance: one(propertyAppliances, {
    fields: [propertyDocuments.applianceId],
    references: [propertyAppliances.id],
  }),
  warranty: one(propertyWarranties, {
    fields: [propertyDocuments.warrantyId],
    references: [propertyWarranties.id],
  }),
  insurancePolicy: one(propertyInsurance, {
    fields: [propertyDocuments.insurancePolicyId],
    references: [propertyInsurance.id],
  }),
  serviceRequest: one(serviceRequests, {
    fields: [propertyDocuments.serviceRequestId],
    references: [serviceRequests.id],
  }),
}));

export const insertPropertyDocumentSchema = createInsertSchema(propertyDocuments).omit({ id: true });
export type InsertPropertyDocument = z.infer<typeof insertPropertyDocumentSchema>;
export type PropertyDocument = typeof propertyDocuments.$inferSelect;

// Notification Queue - Push/Email/SMS notification engine
export const notificationQueue = pgTable("notification_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Recipient
  userId: varchar("user_id").notNull(),
  propertyId: varchar("property_id"), // If property-specific
  
  // Notification Details
  notificationType: text("notification_type").notNull(), // From notificationTypeEnum
  channel: text("channel").notNull(), // "push", "email", "sms", "all"
  priority: text("priority").default("normal"), // "low", "normal", "high", "urgent"
  
  // Content
  title: text("title").notNull(),
  message: text("message").notNull(),
  actionText: text("action_text"), // Button text
  actionUrl: text("action_url"), // Deep link or URL
  
  // Related Records
  warrantyId: varchar("warranty_id"),
  insurancePolicyId: varchar("insurance_policy_id"),
  maintenanceTaskId: varchar("maintenance_task_id"),
  applianceId: varchar("appliance_id"),
  healthEventId: varchar("health_event_id"),
  
  // Metadata
  metadata: jsonb("metadata"), // Additional contextual data
  
  // Scheduling
  scheduledFor: text("scheduled_for"), // When to send (null = send now)
  expiresAt: text("expires_at"), // After this, don't send
  
  // Status Tracking
  status: text("status").default("pending"), // "pending", "sent", "delivered", "failed", "cancelled"
  sentAt: text("sent_at"),
  deliveredAt: text("delivered_at"),
  openedAt: text("opened_at"),
  clickedAt: text("clicked_at"),
  
  // Channel-Specific IDs
  pushNotificationId: text("push_notification_id"),
  emailMessageId: text("email_message_id"),
  smsMessageId: text("sms_message_id"),
  
  // Error Handling
  failureReason: text("failure_reason"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  
  // Analytics
  isRead: boolean("is_read").default(false),
  isClicked: boolean("is_clicked").default(false),
  
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const notificationQueueRelations = relations(notificationQueue, ({ one }) => ({
  user: one(users, {
    fields: [notificationQueue.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [notificationQueue.propertyId],
    references: [properties.id],
  }),
  warranty: one(propertyWarranties, {
    fields: [notificationQueue.warrantyId],
    references: [propertyWarranties.id],
  }),
  insurancePolicy: one(propertyInsurance, {
    fields: [notificationQueue.insurancePolicyId],
    references: [propertyInsurance.id],
  }),
  maintenanceTask: one(propertyMaintenanceSchedule, {
    fields: [notificationQueue.maintenanceTaskId],
    references: [propertyMaintenanceSchedule.id],
  }),
  appliance: one(propertyAppliances, {
    fields: [notificationQueue.applianceId],
    references: [propertyAppliances.id],
  }),
  healthEvent: one(propertyHealthEvents, {
    fields: [notificationQueue.healthEventId],
    references: [propertyHealthEvents.id],
  }),
}));

export const insertNotificationQueueSchema = createInsertSchema(notificationQueue).omit({ id: true });
export type InsertNotificationQueue = z.infer<typeof insertNotificationQueueSchema>;
export type NotificationQueue = typeof notificationQueue.$inferSelect;
// ==========================================
// AI EXPANSION SCHEMA — 13 New AI Capabilities
// ==========================================
// Features #9-15, #17-18, #20, #22-25 from the UpTend AI Platform Map

// ==========================================
// #9 — AI Concierge / Chat Assistant
// ==========================================
export const aiConversations = pgTable("ai_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  propertyId: varchar("property_id"),

  title: text("title"),
  channel: text("channel").notNull().default("in_app"),
  status: text("status").notNull().default("active"),
  
  contextType: text("context_type"),
  referencedApplianceId: varchar("referenced_appliance_id"),
  referencedWarrantyId: varchar("referenced_warranty_id"),
  referencedServiceRequestId: varchar("referenced_service_request_id"),
  
  resultedInBooking: boolean("resulted_in_booking").default(false),
  resultedInWarrantyClaim: boolean("resulted_in_warranty_claim").default(false),
  resultedInEscalation: boolean("resulted_in_escalation").default(false),
  bookingServiceRequestId: varchar("booking_service_request_id"),
  
  customerRating: integer("customer_rating"),
  messageCount: integer("message_count").default(0),
  aiModelUsed: text("ai_model_used").default("claude-sonnet"),
  totalTokensUsed: integer("total_tokens_used").default(0),
  
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  resolvedAt: text("resolved_at"),
});

export const aiConversationsRelations = relations(aiConversations, ({ one, many }) => ({
  user: one(users, {
    fields: [aiConversations.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [aiConversations.propertyId],
    references: [properties.id],
  }),
  messages: many(aiConversationMessages),
}));

export const insertAiConversationSchema = createInsertSchema(aiConversations).omit({ id: true });
export type InsertAiConversation = z.infer<typeof insertAiConversationSchema>;
export type AiConversation = typeof aiConversations.$inferSelect;

export const aiConversationMessages = pgTable("ai_conversation_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  
  role: text("role").notNull(),
  content: text("content").notNull(),
  
  mediaUrls: text("media_urls").array(),
  mediaContentTypes: text("media_content_types").array(),
  
  detectedIntent: text("detected_intent"),
  detectedService: text("detected_service"),
  detectedUrgency: text("detected_urgency"),
  suggestedActions: jsonb("suggested_actions"),
  
  propertyContextSnapshot: jsonb("property_context_snapshot"),
  
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const aiConversationMessagesRelations = relations(aiConversationMessages, ({ one }) => ({
  conversation: one(aiConversations, {
    fields: [aiConversationMessages.conversationId],
    references: [aiConversations.id],
  }),
}));

export const insertAiConversationMessageSchema = createInsertSchema(aiConversationMessages).omit({ id: true });
export type InsertAiConversationMessage = z.infer<typeof insertAiConversationMessageSchema>;
export type AiConversationMessage = typeof aiConversationMessages.$inferSelect;

// ==========================================
// #10 — AI Photo-to-Quote
// ==========================================
export const photoQuoteRequests = pgTable("photo_quote_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  propertyId: varchar("property_id"),
  
  photoUrls: text("photo_urls").array().notNull(),
  photoContentTypes: text("photo_content_types").array(),
  
  aiClassifiedService: text("ai_classified_service"),
  aiClassifiedCategory: text("ai_classified_category"),
  aiConfidence: real("ai_confidence"),
  aiDescription: text("ai_description"),
  
  estimatedPriceMin: real("estimated_price_min"),
  estimatedPriceMax: real("estimated_price_max"),
  estimatedScope: text("estimated_scope"),
  estimatedDuration: text("estimated_duration"),
  
  additionalServices: jsonb("additional_services"),
  
  status: text("status").notNull().default("pending"),
  convertedToServiceRequestId: varchar("converted_to_service_request_id"),
  convertedAt: text("converted_at"),
  
  source: text("source").default("in_app"),
  
  aiModelUsed: text("ai_model_used"),
  processingTimeMs: integer("processing_time_ms"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const photoQuoteRequestsRelations = relations(photoQuoteRequests, ({ one }) => ({
  user: one(users, {
    fields: [photoQuoteRequests.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [photoQuoteRequests.propertyId],
    references: [properties.id],
  }),
  convertedServiceRequest: one(serviceRequests, {
    fields: [photoQuoteRequests.convertedToServiceRequestId],
    references: [serviceRequests.id],
  }),
}));

export const insertPhotoQuoteRequestSchema = createInsertSchema(photoQuoteRequests).omit({ id: true });
export type InsertPhotoQuoteRequest = z.infer<typeof insertPhotoQuoteRequestSchema>;
export type PhotoQuoteRequest = typeof photoQuoteRequests.$inferSelect;

// ==========================================
// #11 — AI Seasonal Home Advisor
// ==========================================
export const seasonalAdvisories = pgTable("seasonal_advisories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  userId: varchar("user_id").notNull(),
  zipCode: text("zip_code"),

  triggerType: text("trigger_type").notNull(),
  triggerData: jsonb("trigger_data"),
  
  title: text("title").notNull(),
  message: text("message").notNull(),
  urgency: text("urgency").notNull().default("medium"),
  category: text("category"),
  
  recommendedServices: jsonb("recommended_services"),
  bundleOffer: jsonb("bundle_offer"),
  estimatedSavings: real("estimated_savings"),
  
  propertyHealthScoreAtTime: real("property_health_score_at_time"),
  relevantApplianceData: jsonb("relevant_appliance_data"),
  lastServiceDates: jsonb("last_service_dates"),
  
  deliveryChannel: text("delivery_channel").default("push"),
  deliveredAt: text("delivered_at"),
  openedAt: text("opened_at"),
  clickedAt: text("clicked_at"),
  dismissedAt: text("dismissed_at"),
  
  status: text("status").notNull().default("pending"),
  resultedInBooking: boolean("resulted_in_booking").default(false),
  bookingServiceRequestIds: text("booking_service_request_ids").array(),
  bookingTotalValue: real("booking_total_value"),
  
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  expiresAt: text("expires_at"),
});

export const seasonalAdvisoriesRelations = relations(seasonalAdvisories, ({ one }) => ({
  property: one(properties, {
    fields: [seasonalAdvisories.propertyId],
    references: [properties.id],
  }),
  user: one(users, {
    fields: [seasonalAdvisories.userId],
    references: [users.id],
  }),
}));

export const insertSeasonalAdvisorySchema = createInsertSchema(seasonalAdvisories).omit({ id: true });
export type InsertSeasonalAdvisory = z.infer<typeof insertSeasonalAdvisorySchema>;
export type SeasonalAdvisory = typeof seasonalAdvisories.$inferSelect;

// ==========================================
// #12 — AI Smart Scheduling
// ==========================================
export const smartScheduleSuggestions = pgTable("smart_schedule_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  propertyId: varchar("property_id"),
  
  serviceTypes: text("service_types").array().notNull(),
  
  suggestedSlots: jsonb("suggested_slots"),
  schedulingReason: text("scheduling_reason"),
  
  weatherForecast: jsonb("weather_forecast"),
  customerPatterns: jsonb("customer_patterns"),
  proAvailability: jsonb("pro_availability"),
  serviceOrderLogic: text("service_order_logic"),
  
  status: text("status").notNull().default("suggested"),
  acceptedAt: text("accepted_at"),
  modifiedSchedule: jsonb("modified_schedule"),
  
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const smartScheduleSuggestionsRelations = relations(smartScheduleSuggestions, ({ one }) => ({
  user: one(users, {
    fields: [smartScheduleSuggestions.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [smartScheduleSuggestions.propertyId],
    references: [properties.id],
  }),
}));

export const insertSmartScheduleSuggestionSchema = createInsertSchema(smartScheduleSuggestions).omit({ id: true });
export type InsertSmartScheduleSuggestion = z.infer<typeof insertSmartScheduleSuggestionSchema>;
export type SmartScheduleSuggestion = typeof smartScheduleSuggestions.$inferSelect;

// ==========================================
// #13 — AI Move-In Wizard
// ==========================================
export const moveInPlans = pgTable("move_in_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  propertyId: varchar("property_id").notNull(),
  
  source: text("source").notNull().default("self_reported"),
  builderPartnershipId: varchar("builder_partnership_id"),
  moveInDate: text("move_in_date"),
  
  propertyType: text("property_type"),
  sqft: integer("sqft"),
  yearBuilt: integer("year_built"),
  hasPool: boolean("has_pool").default(false),
  hasLawn: boolean("has_lawn").default(true),
  climateZone: text("climate_zone"),
  lotSizeSqft: integer("lot_size_sqft"),
  
  planTitle: text("plan_title"),
  planSummary: text("plan_summary"),
  
  week1Tasks: jsonb("week1_tasks"),
  month1Tasks: jsonb("month1_tasks"),
  month2Tasks: jsonb("month2_tasks"),
  month3Tasks: jsonb("month3_tasks"),
  ongoingRecurring: jsonb("ongoing_recurring"),
  
  recommendedBundles: jsonb("recommended_bundles"),
  totalEstimatedCost90Days: real("total_estimated_cost_90_days"),
  totalEstimatedSavings: real("total_estimated_savings"),
  
  tasksCompleted: integer("tasks_completed").default(0),
  totalTasks: integer("total_tasks").default(0),
  completionPercentage: real("completion_percentage").default(0),
  totalBooked: real("total_booked").default(0),
  
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const moveInPlansRelations = relations(moveInPlans, ({ one }) => ({
  user: one(users, {
    fields: [moveInPlans.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [moveInPlans.propertyId],
    references: [properties.id],
  }),
}));

export const insertMoveInPlanSchema = createInsertSchema(moveInPlans).omit({ id: true });
export type InsertMoveInPlan = z.infer<typeof insertMoveInPlanSchema>;
export type MoveInPlan = typeof moveInPlans.$inferSelect;

// ==========================================
// #14 — AI Receipt & Document Scanner
// ==========================================
export const documentScans = pgTable("document_scans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  propertyId: varchar("property_id"),
  
  documentUrl: text("document_url").notNull(),
  documentContentType: text("document_content_type"),
  originalFilename: text("original_filename"),
  
  documentType: text("document_type"),
  aiConfidence: real("ai_confidence"),
  
  extractedData: jsonb("extracted_data"),
  
  linkedWarrantyId: varchar("linked_warranty_id"),
  linkedInsuranceId: varchar("linked_insurance_id"),
  linkedHealthEventId: varchar("linked_health_event_id"),
  linkedApplianceId: varchar("linked_appliance_id"),
  
  processingStatus: text("processing_status").notNull().default("uploaded"),
  aiModelUsed: text("ai_model_used"),
  processingTimeMs: integer("processing_time_ms"),
  errorMessage: text("error_message"),
  
  userVerified: boolean("user_verified").default(false),
  userCorrectedData: jsonb("user_corrected_data"),
  
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  processedAt: text("processed_at"),
});

export const documentScansRelations = relations(documentScans, ({ one }) => ({
  user: one(users, {
    fields: [documentScans.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [documentScans.propertyId],
    references: [properties.id],
  }),
  linkedWarranty: one(propertyWarranties, {
    fields: [documentScans.linkedWarrantyId],
    references: [propertyWarranties.id],
  }),
  linkedAppliance: one(propertyAppliances, {
    fields: [documentScans.linkedApplianceId],
    references: [propertyAppliances.id],
  }),
  linkedHealthEvent: one(propertyHealthEvents, {
    fields: [documentScans.linkedHealthEventId],
    references: [propertyHealthEvents.id],
  }),
}));

export const insertDocumentScanSchema = createInsertSchema(documentScans).omit({ id: true });
export type InsertDocumentScan = z.infer<typeof insertDocumentScanSchema>;
export type DocumentScan = typeof documentScans.$inferSelect;

// ==========================================
// #15 — AI Route Optimizer (Pro-Facing)
// ==========================================
export const proRouteOptimizations = pgTable("pro_route_optimizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proUserId: varchar("pro_user_id").notNull(),
  
  routeDate: text("route_date").notNull(),
  assignedJobIds: text("assigned_job_ids").array().notNull(),
  
  originalOrder: jsonb("original_order"),
  optimizedOrder: jsonb("optimized_order"),
  
  originalTotalMiles: real("original_total_miles"),
  optimizedTotalMiles: real("optimized_total_miles"),
  milesSaved: real("miles_saved"),
  estimatedTimeSavedMinutes: integer("estimated_time_saved_minutes"),
  co2Saved: real("co2_saved"),
  
  nearbyUpsellOpportunities: jsonb("nearby_upsell_opportunities"),
  upsellsSent: integer("upsells_sent").default(0),
  upsellsConverted: integer("upsells_converted").default(0),
  upsellRevenue: real("upsell_revenue").default(0),
  
  proAccepted: boolean("pro_accepted"),
  proFeedback: text("pro_feedback"),
  
  status: text("status").notNull().default("generated"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const proRouteOptimizationsRelations = relations(proRouteOptimizations, ({ one }) => ({
  pro: one(users, {
    fields: [proRouteOptimizations.proUserId],
    references: [users.id],
  }),
}));

export const insertProRouteOptimizationSchema = createInsertSchema(proRouteOptimizations).omit({ id: true });
export type InsertProRouteOptimization = z.infer<typeof insertProRouteOptimizationSchema>;
export type ProRouteOptimization = typeof proRouteOptimizations.$inferSelect;

// ==========================================
// #17 — AI Training & Quality Scoring
// ==========================================
export const proQualityScores = pgTable("pro_quality_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proUserId: varchar("pro_user_id").notNull(),
  serviceType: text("service_type").notNull(),
  
  totalJobsScored: integer("total_jobs_scored").default(0),
  averageQualityScore: real("average_quality_score"),
  averageCustomerRating: real("average_customer_rating"),
  qualityTrend: text("quality_trend"),
  trendChangeDate: text("trend_change_date"),
  
  cleanlinessScore: real("cleanliness_score"),
  thoroughnessScore: real("thoroughness_score"),
  beforeAfterImprovementScore: real("before_after_improvement_score"),
  
  flaggedIssues: jsonb("flagged_issues"),
  
  recommendedTraining: jsonb("recommended_training"),
  trainingCompletedModules: text("training_completed_modules").array(),
  
  qualityBoost: real("quality_boost").default(0),
  
  lastUpdated: text("last_updated").notNull().default(sql`CURRENT_TIMESTAMP`),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const proQualityScoresRelations = relations(proQualityScores, ({ one }) => ({
  pro: one(users, {
    fields: [proQualityScores.proUserId],
    references: [users.id],
  }),
}));

export const insertProQualityScoreSchema = createInsertSchema(proQualityScores).omit({ id: true });
export type InsertProQualityScore = z.infer<typeof insertProQualityScoreSchema>;
export type ProQualityScore = typeof proQualityScores.$inferSelect;

export const jobQualityAssessments = pgTable("job_quality_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id").notNull(),
  proUserId: varchar("pro_user_id").notNull(),
  serviceType: text("service_type").notNull(),
  
  beforePhotoUrls: text("before_photo_urls").array(),
  afterPhotoUrls: text("after_photo_urls").array(),
  aiQualityScore: real("ai_quality_score"),
  aiAnalysis: text("ai_analysis"),
  
  issuesDetected: jsonb("issues_detected"),
  checklistComplianceRate: real("checklist_compliance_rate"),
  
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const jobQualityAssessmentsRelations = relations(jobQualityAssessments, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [jobQualityAssessments.serviceRequestId],
    references: [serviceRequests.id],
  }),
  pro: one(users, {
    fields: [jobQualityAssessments.proUserId],
    references: [users.id],
  }),
}));

export const insertJobQualityAssessmentSchema = createInsertSchema(jobQualityAssessments).omit({ id: true });
export type InsertJobQualityAssessment = z.infer<typeof insertJobQualityAssessmentSchema>;
export type JobQualityAssessment = typeof jobQualityAssessments.$inferSelect;

// ==========================================
// #18 — AI Inventory Estimator
// ==========================================
export const inventoryEstimates = pgTable("inventory_estimates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id"),
  userId: varchar("user_id").notNull(),
  initiatedBy: text("initiated_by").notNull(),
  serviceType: text("service_type").notNull(),
  
  videoUrl: text("video_url"),
  frameUrls: text("frame_urls").array(),
  photoUrls: text("photo_urls").array(),
  
  roomInventories: jsonb("room_inventories"),
  
  totalItems: integer("total_items"),
  totalEstimatedWeight: real("total_estimated_weight"),
  estimatedTruckPercentage: real("estimated_truck_percentage"),
  estimatedTruckLoads: real("estimated_truck_loads"),
  estimatedProsNeeded: integer("estimated_pros_needed"),
  estimatedHours: real("estimated_hours"),
  
  generatedPriceMin: real("generated_price_min"),
  generatedPriceMax: real("generated_price_max"),
  priceBreakdown: jsonb("price_breakdown"),
  
  junkCategorization: jsonb("junk_categorization"),
  
  aiModelUsed: text("ai_model_used"),
  processingTimeMs: integer("processing_time_ms"),
  totalFramesAnalyzed: integer("total_frames_analyzed"),
  
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const inventoryEstimatesRelations = relations(inventoryEstimates, ({ one }) => ({
  user: one(users, {
    fields: [inventoryEstimates.userId],
    references: [users.id],
  }),
  serviceRequest: one(serviceRequests, {
    fields: [inventoryEstimates.serviceRequestId],
    references: [serviceRequests.id],
  }),
}));

export const insertInventoryEstimateSchema = createInsertSchema(inventoryEstimates).omit({ id: true });
export type InsertInventoryEstimate = z.infer<typeof insertInventoryEstimateSchema>;
export type InventoryEstimate = typeof inventoryEstimates.$inferSelect;

// ==========================================
// #20 — AI Property Manager Portfolio Dashboard
// ==========================================
export const portfolioHealthReports = pgTable("portfolio_health_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessAccountId: varchar("business_account_id").notNull(),
  generatedByUserId: varchar("generated_by_user_id"),
  
  propertyIds: text("property_ids").array().notNull(),
  totalProperties: integer("total_properties").notNull(),
  
  portfolioHealthScore: real("portfolio_health_score"),
  lowestScoringPropertyId: varchar("lowest_scoring_property_id"),
  highestScoringPropertyId: varchar("highest_scoring_property_id"),
  scoreDistribution: jsonb("score_distribution"),
  
  overdueMaintenanceItems: jsonb("overdue_maintenance_items"),
  agingApplianceAlerts: jsonb("aging_appliance_alerts"),
  missingDwellScans: jsonb("missing_dwellscans"),
  
  actionPlan: jsonb("action_plan"),
  totalRecommendedSpend: real("total_recommended_spend"),
  projectedHealthScoreAfterActions: real("projected_health_score_after_actions"),
  
  portfolioEsgSummary: jsonb("portfolio_esg_summary"),
  
  reportPdfUrl: text("report_pdf_url"),
  status: text("status").notNull().default("generating"),
  deliveredAt: text("delivered_at"),
  
  actionsBooked: integer("actions_booked").default(0),
  totalBookedValue: real("total_booked_value").default(0),
  
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  reportPeriod: text("report_period"),
});

export const portfolioHealthReportsRelations = relations(portfolioHealthReports, ({ one }) => ({
  businessAccount: one(businessAccounts, {
    fields: [portfolioHealthReports.businessAccountId],
    references: [businessAccounts.id],
  }),
  generatedBy: one(users, {
    fields: [portfolioHealthReports.generatedByUserId],
    references: [users.id],
  }),
}));

export const insertPortfolioHealthReportSchema = createInsertSchema(portfolioHealthReports).omit({ id: true });
export type InsertPortfolioHealthReport = z.infer<typeof insertPortfolioHealthReportSchema>;
export type PortfolioHealthReport = typeof portfolioHealthReports.$inferSelect;

// ==========================================
// #22 — AI Fraud & Quality Detection
// ==========================================
export const fraudAlerts = pgTable("fraud_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id"),
  proUserId: varchar("pro_user_id").notNull(),
  
  alertType: text("alert_type").notNull(),
  severity: text("severity").notNull(),
  
  evidence: jsonb("evidence"),
  aiConfidence: real("ai_confidence"),
  aiExplanation: text("ai_explanation"),
  
  status: text("status").notNull().default("pending"),
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: text("reviewed_at"),
  reviewNotes: text("review_notes"),
  actionTaken: text("action_taken"),
  
  affectedCustomerIds: text("affected_customer_ids").array(),
  refundIssued: boolean("refund_issued").default(false),
  refundAmount: real("refund_amount"),
  
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const fraudAlertsRelations = relations(fraudAlerts, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [fraudAlerts.serviceRequestId],
    references: [serviceRequests.id],
  }),
  pro: one(users, {
    fields: [fraudAlerts.proUserId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [fraudAlerts.reviewedBy],
    references: [users.id],
  }),
}));

export const insertFraudAlertSchema = createInsertSchema(fraudAlerts).omit({ id: true });
export type InsertFraudAlert = z.infer<typeof insertFraudAlertSchema>;
export type FraudAlert = typeof fraudAlerts.$inferSelect;

// ==========================================
// #23 — AI-Generated Marketing Content
// ==========================================
export const aiMarketingContent = pgTable("ai_marketing_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id").notNull(),
  serviceType: text("service_type").notNull(),
  proUserId: varchar("pro_user_id"),
  customerId: varchar("customer_id"),
  
  beforePhotoUrl: text("before_photo_url"),
  afterPhotoUrl: text("after_photo_url"),
  transformationScore: real("transformation_score"),
  
  postCaption: text("post_caption"),
  postHashtags: text("post_hashtags").array(),
  targetPlatforms: text("target_platforms").array(),
  
  neighborhood: text("neighborhood"),
  zipCode: text("zip_code"),
  city: text("city"),
  
  customerShareLink: text("customer_share_link"),
  customerShareCredit: real("customer_share_credit").default(10),
  customerSharedAt: text("customer_shared_at"),
  customerSharePlatform: text("customer_share_platform"),
  
  status: text("status").notNull().default("draft"),
  publishedAt: text("published_at"),
  publishedPlatforms: text("published_platforms").array(),
  
  impressions: integer("impressions").default(0),
  engagements: integer("engagements").default(0),
  clickThroughs: integer("click_throughs").default(0),
  bookingsFromPost: integer("bookings_from_post").default(0),
  
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const aiMarketingContentRelations = relations(aiMarketingContent, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [aiMarketingContent.serviceRequestId],
    references: [serviceRequests.id],
  }),
  pro: one(users, {
    fields: [aiMarketingContent.proUserId],
    references: [users.id],
  }),
  customer: one(users, {
    fields: [aiMarketingContent.customerId],
    references: [users.id],
  }),
}));

export const insertAiMarketingContentSchema = createInsertSchema(aiMarketingContent).omit({ id: true });
export type InsertAiMarketingContent = z.infer<typeof insertAiMarketingContentSchema>;
export type AiMarketingContent = typeof aiMarketingContent.$inferSelect;

// ==========================================
// #24 — AI Voice Assistant for Booking
// ==========================================
export const voiceBookingSessions = pgTable("voice_booking_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  callerPhone: text("caller_phone").notNull(),
  userId: varchar("user_id"),
  propertyId: varchar("property_id"),
  
  callDirection: text("call_direction").notNull().default("inbound"),
  callDurationSeconds: integer("call_duration_seconds"),
  callStartedAt: text("call_started_at").notNull(),
  callEndedAt: text("call_ended_at"),
  
  transcriptUrl: text("transcript_url"),
  transcriptText: text("transcript_text"),
  detectedLanguage: text("detected_language").default("en"),
  detectedIntent: text("detected_intent"),
  detectedService: text("detected_service"),
  
  sttProvider: text("stt_provider"),
  ttsProvider: text("tts_provider"),
  aiModelUsed: text("ai_model_used"),
  
  status: text("status").notNull().default("in_progress"),
  outcome: text("outcome"),
  
  serviceRequestId: varchar("service_request_id"),
  quotedPrice: real("quoted_price"),
  scheduledDate: text("scheduled_date"),
  
  escalatedToHuman: boolean("escalated_to_human").default(false),
  escalationReason: text("escalation_reason"),
  humanAgentId: varchar("human_agent_id"),
  
  customerSatisfaction: integer("customer_satisfaction"),
  
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const voiceBookingSessionsRelations = relations(voiceBookingSessions, ({ one }) => ({
  user: one(users, {
    fields: [voiceBookingSessions.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [voiceBookingSessions.propertyId],
    references: [properties.id],
  }),
  serviceRequest: one(serviceRequests, {
    fields: [voiceBookingSessions.serviceRequestId],
    references: [serviceRequests.id],
  }),
  humanAgent: one(users, {
    fields: [voiceBookingSessions.humanAgentId],
    references: [users.id],
  }),
}));

export const insertVoiceBookingSessionSchema = createInsertSchema(voiceBookingSessions).omit({ id: true });
export type InsertVoiceBookingSession = z.infer<typeof insertVoiceBookingSessionSchema>;
export type VoiceBookingSession = typeof voiceBookingSessions.$inferSelect;

// ==========================================
// #25 — AI Neighborhood Intelligence
// ==========================================
export const neighborhoodIntelligenceReports = pgTable("neighborhood_intelligence_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  zipCode: text("zip_code").notNull(),
  neighborhood: text("neighborhood"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  
  reportPeriod: text("report_period").notNull(),
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),
  
  totalPropertiesAnalyzed: integer("total_properties_analyzed").notNull(),
  totalJobsAnalyzed: integer("total_jobs_analyzed").notNull(),
  totalAppliancesAnalyzed: integer("total_appliances_analyzed").default(0),
  
  averageHealthScore: real("average_health_score"),
  healthScoreDistribution: jsonb("health_score_distribution"),
  topMaintenanceIssues: jsonb("top_maintenance_issues"),
  
  applianceAgeProfiles: jsonb("appliance_age_profiles"),
  failureRateInsights: jsonb("failure_rate_insights"),
  warrantyGapAnalysis: jsonb("warranty_gap_analysis"),
  
  serviceDemandByType: jsonb("service_demand_by_type"),
  seasonalPatterns: jsonb("seasonal_patterns"),
  averageSpendPerHome: real("average_spend_per_home"),
  
  buildYearDistribution: jsonb("build_year_distribution"),
  builderQualityIndicators: jsonb("builder_quality_indicators"),
  
  avgDiversionRate: real("avg_diversion_rate"),
  avgCo2SavedPerJob: real("avg_co2_saved_per_job"),
  sustainabilityTrend: text("sustainability_trend"),
  
  reportPdfUrl: text("report_pdf_url"),
  isPublic: boolean("is_public").default(false),
  
  licensedToPartners: text("licensed_to_partners").array(),
  
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertNeighborhoodIntelligenceReportSchema = createInsertSchema(neighborhoodIntelligenceReports).omit({ id: true });
export type InsertNeighborhoodIntelligenceReport = z.infer<typeof insertNeighborhoodIntelligenceReportSchema>;
export type NeighborhoodIntelligenceReport = typeof neighborhoodIntelligenceReports.$inferSelect;

// ============ Satisfaction Guarantee Claims ============

export const guaranteeClaimStatusEnum = z.enum(["pending", "approved", "denied", "refunded"]);
export type GuaranteeClaimStatus = z.infer<typeof guaranteeClaimStatusEnum>;

export const guaranteeClaims = pgTable("guarantee_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id").notNull(),
  customerId: varchar("customer_id").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"),
  amount: real("amount"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  resolvedAt: text("resolved_at"),
  resolvedBy: varchar("resolved_by"),
  notes: text("notes"),
});

export const insertGuaranteeClaimSchema = createInsertSchema(guaranteeClaims).omit({ id: true, createdAt: true });
export type InsertGuaranteeClaim = z.infer<typeof insertGuaranteeClaimSchema>;
export type GuaranteeClaim = typeof guaranteeClaims.$inferSelect;

// ============ Service Contracts / Pre-Work Authorization ============

export const contractStatusEnum = z.enum(["draft", "pending_customer", "pending_pro", "signed", "voided"]);
export type ContractStatus = z.infer<typeof contractStatusEnum>;

export const serviceContracts = pgTable("service_contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id").notNull(),
  customerId: varchar("customer_id").notNull(),
  haulerId: varchar("hauler_id").notNull(),
  scopeOfWork: text("scope_of_work").notNull(),
  agreedPrice: real("agreed_price").notNull(),
  customerSignature: text("customer_signature"),
  customerSignedAt: text("customer_signed_at"),
  proSignature: text("pro_signature"),
  proSignedAt: text("pro_signed_at"),
  status: text("status").notNull().default("draft"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertServiceContractSchema = createInsertSchema(serviceContracts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertServiceContract = z.infer<typeof insertServiceContractSchema>;
export type ServiceContract = typeof serviceContracts.$inferSelect;

// ==========================================
// Emergency Dispatch
// ==========================================
export const emergencyServiceTypeEnum = z.enum([
  "water_damage", "fire_damage", "lockout", "broken_pipe",
  "electrical_emergency", "gas_leak", "storm_damage"
]);
export type EmergencyServiceType = z.infer<typeof emergencyServiceTypeEnum>;

export const emergencyStatusEnum = z.enum([
  "pending", "searching", "accepted", "en_route", "in_progress", "completed", "cancelled"
]);
export type EmergencyStatus = z.infer<typeof emergencyStatusEnum>;

export const emergencyRequests = pgTable("emergency_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(),
  emergencyType: text("emergency_type").notNull(),
  description: text("description"),
  photoUrls: text("photo_urls").array(),
  addressLine1: text("address_line1").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  lat: real("lat"),
  lng: real("lng"),
  status: text("status").notNull().default("searching"),
  assignedHaulerId: varchar("assigned_hauler_id"),
  pricingMultiplier: real("pricing_multiplier").notNull().default(2.0),
  estimatedPrice: real("estimated_price"),
  etaMinutes: integer("eta_minutes"),
  acceptedAt: text("accepted_at"),
  completedAt: text("completed_at"),
  serviceRequestId: varchar("service_request_id"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertEmergencyRequestSchema = createInsertSchema(emergencyRequests).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEmergencyRequest = z.infer<typeof insertEmergencyRequestSchema>;
export type EmergencyRequest = typeof emergencyRequests.$inferSelect;

// ==========================================
// Neighbor Networks
// ==========================================
export const neighborhoods = pgTable("neighborhoods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  zipCode: text("zip_code").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  memberCount: integer("member_count").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertNeighborhoodSchema = createInsertSchema(neighborhoods).omit({ id: true, createdAt: true });
export type InsertNeighborhood = z.infer<typeof insertNeighborhoodSchema>;
export type Neighborhood = typeof neighborhoods.$inferSelect;

export const neighborhoodMembers = pgTable("neighborhood_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  neighborhoodId: varchar("neighborhood_id").notNull(),
  customerId: varchar("customer_id").notNull(),
  joinedAt: text("joined_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertNeighborhoodMemberSchema = createInsertSchema(neighborhoodMembers).omit({ id: true, joinedAt: true });
export type InsertNeighborhoodMember = z.infer<typeof insertNeighborhoodMemberSchema>;
export type NeighborhoodMember = typeof neighborhoodMembers.$inferSelect;

export const neighborhoodRecommendations = pgTable("neighborhood_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  neighborhoodId: varchar("neighborhood_id").notNull(),
  customerId: varchar("customer_id").notNull(),
  haulerId: varchar("hauler_id").notNull(),
  serviceType: text("service_type").notNull(),
  rating: integer("rating").notNull(),
  review: text("review"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertNeighborhoodRecommendationSchema = createInsertSchema(neighborhoodRecommendations).omit({ id: true, createdAt: true });
export type InsertNeighborhoodRecommendation = z.infer<typeof insertNeighborhoodRecommendationSchema>;
export type NeighborhoodRecommendation = typeof neighborhoodRecommendations.$inferSelect;

// ==========================================
// Service Subscriptions (Recurring Plans)
// ==========================================
export const subscriptionFrequencyEnum = z.enum(["weekly", "biweekly", "monthly"]);
export type SubscriptionFrequency = z.infer<typeof subscriptionFrequencyEnum>;

export const subscriptionStatusEnum = z.enum(["active", "paused", "cancelled"]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusEnum>;

export const serviceSubscriptions = pgTable("service_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(),
  serviceType: text("service_type").notNull(), // home_cleaning, pool_cleaning, landscaping, carpet_cleaning, gutter_cleaning, pressure_washing
  frequency: text("frequency").notNull(), // weekly, biweekly, monthly
  preferredDay: text("preferred_day"), // monday, tuesday, etc.
  preferredTime: text("preferred_time"), // morning, afternoon, evening
  addressLine1: text("address_line1"),
  addressLine2: text("address_line2"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  notes: text("notes"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status").notNull().default("active"), // active, paused, cancelled
  nextServiceDate: text("next_service_date"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertServiceSubscriptionSchema = createInsertSchema(serviceSubscriptions).omit({ id: true, createdAt: true });
export type InsertServiceSubscription = z.infer<typeof insertServiceSubscriptionSchema>;
export type ServiceSubscription = typeof serviceSubscriptions.$inferSelect;

// ==========================================
// B2B Partner Portal
// ==========================================
export const partners = pgTable("partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  passwordHash: text("password_hash"),
  type: text("type").notNull().default("other"), // property_manager | airbnb_host | real_estate | other
  apiKey: text("api_key"),
  status: text("status").notNull().default("pending"), // pending | active | suspended
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertPartnerSchema = createInsertSchema(partners).omit({ id: true });
export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type Partner = typeof partners.$inferSelect;

export const partnerBookings = pgTable("partner_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull(),
  serviceRequestId: varchar("service_request_id"),
  serviceType: text("service_type").notNull(),
  clientName: text("client_name").notNull(),
  clientPhone: text("client_phone"),
  clientEmail: text("client_email"),
  address: text("address").notNull(),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  preferredDate: text("preferred_date"),
  originalAmount: text("original_amount"),
  discountAmount: text("discount_amount"),
  finalAmount: text("final_amount"),
  commissionRate: text("commission_rate"),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertPartnerBookingSchema = createInsertSchema(partnerBookings).omit({ id: true });
export type InsertPartnerBooking = z.infer<typeof insertPartnerBookingSchema>;
export type PartnerBooking = typeof partnerBookings.$inferSelect;

// ==========================================
// Home CRM / Home Profile
// ==========================================
export const homeProfiles = pgTable("home_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  homeType: text("home_type").notNull().default("single_family"),
  squareFootage: text("square_footage"),
  yearBuilt: text("year_built"),
  bedrooms: text("bedrooms"),
  bathrooms: text("bathrooms"),
  lotSize: text("lot_size"),
  photoUrl: text("photo_url"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertHomeProfileSchema = createInsertSchema(homeProfiles).omit({ id: true });
export type InsertHomeProfile = z.infer<typeof insertHomeProfileSchema>;
export type HomeProfile = typeof homeProfiles.$inferSelect;

export const homeServiceHistory = pgTable("home_service_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  homeProfileId: varchar("home_profile_id").notNull(),
  serviceType: text("service_type").notNull(),
  provider: text("provider"),
  date: text("date").notNull(),
  cost: text("cost"),
  notes: text("notes"),
  receiptUrl: text("receipt_url"),
  warrantyExpiry: text("warranty_expiry"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertHomeServiceHistorySchema = createInsertSchema(homeServiceHistory).omit({ id: true });
export type InsertHomeServiceHistory = z.infer<typeof insertHomeServiceHistorySchema>;
export type HomeServiceHistoryRecord = typeof homeServiceHistory.$inferSelect;

export const homeAppliances = pgTable("home_appliances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  homeProfileId: varchar("home_profile_id").notNull(),
  name: text("name").notNull(),
  brand: text("brand"),
  model: text("model"),
  purchaseDate: text("purchase_date"),
  warrantyExpiry: text("warranty_expiry"),
  lastServiceDate: text("last_service_date"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertHomeApplianceSchema = createInsertSchema(homeAppliances).omit({ id: true });
export type InsertHomeAppliance = z.infer<typeof insertHomeApplianceSchema>;
export type HomeAppliance = typeof homeAppliances.$inferSelect;

// Scope Change Requests (Guaranteed Price Ceiling)
export const scopeChangeRequests = pgTable("scope_change_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id").notNull(),
  proId: varchar("pro_id").notNull(),
  customerId: varchar("customer_id").notNull(),
  originalCeiling: real("original_ceiling").notNull(),
  proposedCeiling: real("proposed_ceiling").notNull(),
  additionalAmount: real("additional_amount").notNull(),
  reason: text("reason").notNull(),
  changeType: text("change_type").notNull(), // 'additional_items' | 'access_difficulty' | 'hazardous_materials' | 'larger_scope' | 'other'
  evidencePhotos: text("evidence_photos").array().notNull(),
  evidenceDescription: text("evidence_description"),
  aiValidated: boolean("ai_validated").default(false),
  aiConfidenceScore: real("ai_confidence_score"),
  aiAnalysis: text("ai_analysis"),
  status: text("status").notNull().default("pending"), // 'pending' | 'approved' | 'declined' | 'expired'
  customerNotifiedAt: text("customer_notified_at"),
  customerRespondedAt: text("customer_responded_at"),
  customerNotes: text("customer_notes"),
  expiresAt: text("expires_at"),
  flaggedForReview: boolean("flagged_for_review").default(false),
  adminReviewedAt: text("admin_reviewed_at"),
  adminReviewedBy: varchar("admin_reviewed_by"),
  adminNotes: text("admin_notes"),
  createdAt: text("created_at").notNull(),
});

export const scopeChangeRequestsRelations = relations(scopeChangeRequests, ({ one }) => ({
  serviceRequest: one(serviceRequests, {
    fields: [scopeChangeRequests.serviceRequestId],
    references: [serviceRequests.id],
  }),
}));

export const insertScopeChangeRequestSchema = createInsertSchema(scopeChangeRequests).omit({ id: true, createdAt: true });
export type InsertScopeChangeRequest = z.infer<typeof insertScopeChangeRequestSchema>;
export type ScopeChangeRequest = typeof scopeChangeRequests.$inferSelect;

// Ceiling Analytics
export const ceilingAnalytics = pgTable("ceiling_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),
  periodType: text("period_type").notNull(), // 'daily' | 'weekly' | 'monthly'
  totalJobsCompleted: integer("total_jobs_completed").notNull().default(0),
  totalJobsWithCeiling: integer("total_jobs_with_ceiling").notNull().default(0),
  jobsUnderCeiling: integer("jobs_under_ceiling").notNull().default(0),
  jobsAtCeiling: integer("jobs_at_ceiling").notNull().default(0),
  jobsScopeChanged: integer("jobs_scope_changed").notNull().default(0),
  pctUnderCeiling: real("pct_under_ceiling"),
  pctAtCeiling: real("pct_at_ceiling"),
  pctScopeChanged: real("pct_scope_changed"),
  totalCustomerSavings: real("total_customer_savings").default(0),
  avgCustomerSavings: real("avg_customer_savings").default(0),
  avgSavingsPct: real("avg_savings_pct").default(0),
  scopeChangeRequestsCount: integer("scope_change_requests_count").default(0),
  scopeChangesApproved: integer("scope_changes_approved").default(0),
  scopeChangesDeclined: integer("scope_changes_declined").default(0),
  scopeChangesExpired: integer("scope_changes_expired").default(0),
  scopeChangeApprovalRate: real("scope_change_approval_rate"),
  avgScopeChangeAmount: real("avg_scope_change_amount"),
  avgAiConfidence: real("avg_ai_confidence"),
  avgCeilingAccuracy: real("avg_ceiling_accuracy"),
  byServiceType: text("by_service_type"), // JSON string
  createdAt: text("created_at").notNull(),
});

export const insertCeilingAnalyticsSchema = createInsertSchema(ceilingAnalytics).omit({ id: true, createdAt: true });
export type InsertCeilingAnalytics = z.infer<typeof insertCeilingAnalyticsSchema>;
export type CeilingAnalytics = typeof ceilingAnalytics.$inferSelect;

// ESG Service Details (per-service environmental data)
export * from "./esg-service-details";

// ==========================================
// B2B FEATURES - NEW TABLES
// ==========================================

// ==========================================
// 1. Insurance Certificates (COI Vault)
// ==========================================
export const insuranceCertificates = pgTable("insurance_certificates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(),
  policyNumber: text("policy_number").notNull(),
  provider: text("provider").notNull(),
  coverageAmount: real("coverage_amount").notNull(),
  expiryDate: text("expiry_date").notNull(),
  documentUrl: text("document_url"),
  verified: boolean("verified").default(false),
  verifiedAt: text("verified_at"),
  verifiedBy: varchar("verified_by"),
  autoNotify: boolean("auto_notify").default(true),
  notifyDaysBefore: integer("notify_days_before").default(30),
  businessAccountId: varchar("business_account_id"),
  proId: varchar("pro_id"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insuranceCertificatesRelations = relations(insuranceCertificates, ({ one }) => ({
  businessAccount: one(businessAccounts, {
    fields: [insuranceCertificates.businessAccountId],
    references: [businessAccounts.id],
  }),
  pro: one(users, {
    fields: [insuranceCertificates.proId],
    references: [users.id],
  }),
}));

export const insertInsuranceCertificateSchema = createInsertSchema(insuranceCertificates).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInsuranceCertificate = z.infer<typeof insertInsuranceCertificateSchema>;
export type InsuranceCertificate = typeof insuranceCertificates.$inferSelect;

// ==========================================
// 2. Compliance Documents
// ==========================================
export const complianceDocuments = pgTable("compliance_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proId: varchar("pro_id").notNull(),
  docType: text("doc_type").notNull(), // 'w9', 'license', 'osha_cert', 'background_check'
  title: text("title"),
  expiry: text("expiry"),
  verified: boolean("verified").default(false),
  verifiedAt: text("verified_at"),
  verifiedBy: varchar("verified_by"),
  documentUrl: text("document_url"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const complianceDocumentsRelations = relations(complianceDocuments, ({ one }) => ({
  pro: one(users, {
    fields: [complianceDocuments.proId],
    references: [users.id],
  }),
}));

export const insertComplianceDocumentSchema = createInsertSchema(complianceDocuments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertComplianceDocument = z.infer<typeof insertComplianceDocumentSchema>;
export type ComplianceDocument = typeof complianceDocuments.$inferSelect;

// ==========================================
// 3. Background Checks
// ==========================================
export const backgroundChecks = pgTable("background_checks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proId: varchar("pro_id").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'in_progress', 'completed', 'failed'
  provider: text("provider").default("checkr"),
  providerCheckId: text("provider_check_id"),
  completedAt: text("completed_at"),
  result: text("result"), // 'clear', 'consider', 'flagged'
  expiry: text("expiry"),
  reportUrl: text("report_url"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const backgroundChecksRelations = relations(backgroundChecks, ({ one }) => ({
  pro: one(users, {
    fields: [backgroundChecks.proId],
    references: [users.id],
  }),
}));

export const insertBackgroundCheckSchema = createInsertSchema(backgroundChecks).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBackgroundCheck = z.infer<typeof insertBackgroundCheckSchema>;
export type BackgroundCheck = typeof backgroundChecks.$inferSelect;

// ==========================================
// 4. Prevailing Wages (Davis-Bacon)
// ==========================================
export const prevailingWages = pgTable("prevailing_wages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  county: text("county").notNull(),
  state: text("state").notNull(),
  trade: text("trade").notNull(),
  wageRate: real("wage_rate").notNull(),
  fringe: real("fringe").notNull().default(0),
  effectiveDate: text("effective_date").notNull(),
  expirationDate: text("expiration_date"),
  source: text("source"), // 'davis_bacon', 'state'
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertPrevailingWageSchema = createInsertSchema(prevailingWages).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPrevailingWage = z.infer<typeof insertPrevailingWageSchema>;
export type PrevailingWage = typeof prevailingWages.$inferSelect;

// ==========================================
// 5. Certified Payrolls (WH-347)
// ==========================================
export const certifiedPayrolls = pgTable("certified_payrolls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(),
  weekEnding: text("week_ending").notNull(),
  proId: varchar("pro_id").notNull(),
  hours: real("hours").notNull(),
  rate: real("rate").notNull(),
  fringe: real("fringe").default(0),
  deductions: real("deductions").default(0),
  netPay: real("net_pay"),
  trade: text("trade"),
  certified: boolean("certified").default(false),
  certifiedBy: varchar("certified_by"),
  certifiedAt: text("certified_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const certifiedPayrollsRelations = relations(certifiedPayrolls, ({ one }) => ({
  pro: one(users, {
    fields: [certifiedPayrolls.proId],
    references: [users.id],
  }),
}));

export const insertCertifiedPayrollSchema = createInsertSchema(certifiedPayrolls).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCertifiedPayroll = z.infer<typeof insertCertifiedPayrollSchema>;
export type CertifiedPayroll = typeof certifiedPayrolls.$inferSelect;

// ==========================================
// 6. SAM Registrations
// ==========================================
export const samRegistrations = pgTable("sam_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull(),
  cageCode: text("cage_code"),
  uei: text("uei"),
  naicsCodes: text("naics_codes").array(),
  status: text("status").notNull().default("pending"), // 'pending', 'active', 'expired', 'inactive'
  expiry: text("expiry"),
  registeredAt: text("registered_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const samRegistrationsRelations = relations(samRegistrations, ({ one }) => ({
  business: one(businessAccounts, {
    fields: [samRegistrations.businessId],
    references: [businessAccounts.id],
  }),
}));

export const insertSamRegistrationSchema = createInsertSchema(samRegistrations).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSamRegistration = z.infer<typeof insertSamRegistrationSchema>;
export type SamRegistration = typeof samRegistrations.$inferSelect;

// ==========================================
// 7. DBE Utilization
// ==========================================
export const dbeUtilization = pgTable("dbe_utilization", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(),
  vendorId: varchar("vendor_id").notNull(),
  certificationType: text("certification_type").notNull(), // 'dbe', 'mbe', 'sdvosb', 'wosb', '8a'
  amount: real("amount").notNull().default(0),
  percentage: real("percentage").default(0),
  goalPercentage: real("goal_percentage"),
  verified: boolean("verified").default(false),
  verificationDocUrl: text("verification_doc_url"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const dbeUtilizationRelations = relations(dbeUtilization, ({ one }) => ({
  vendor: one(users, {
    fields: [dbeUtilization.vendorId],
    references: [users.id],
  }),
}));

export const insertDbeUtilizationSchema = createInsertSchema(dbeUtilization).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDbeUtilization = z.infer<typeof insertDbeUtilizationSchema>;
export type DbeUtilization = typeof dbeUtilization.$inferSelect;

// ==========================================
// 8. Government Bids
// ==========================================
export const governmentBids = pgTable("government_bids", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  agency: text("agency").notNull(),
  dueDate: text("due_date").notNull(),
  status: text("status").notNull().default("draft"), // 'draft', 'submitted', 'won', 'lost', 'cancelled'
  estimatedValue: real("estimated_value"),
  awardedValue: real("awarded_value"),
  solicitationNumber: text("solicitation_number"),
  setAside: text("set_aside"), // 'sdvosb', '8a', 'hubzone', 'wosb', 'none'
  documents: jsonb("documents").$type<string[]>().default(sql`'[]'::jsonb`),
  notes: text("notes"),
  businessAccountId: varchar("business_account_id"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const governmentBidsRelations = relations(governmentBids, ({ one }) => ({
  businessAccount: one(businessAccounts, {
    fields: [governmentBids.businessAccountId],
    references: [businessAccounts.id],
  }),
}));

export const insertGovernmentBidSchema = createInsertSchema(governmentBids).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGovernmentBid = z.infer<typeof insertGovernmentBidSchema>;
export type GovernmentBid = typeof governmentBids.$inferSelect;

// ==========================================
// 9. FEMA Vendors
// ==========================================
export const femaVendors = pgTable("fema_vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proId: varchar("pro_id").notNull(),
  certifications: text("certifications").array(),
  equipment: text("equipment").array(),
  availabilityRadius: integer("availability_radius").default(100),
  activated: boolean("activated").default(false),
  activatedAt: text("activated_at"),
  deactivatedAt: text("deactivated_at"),
  lastDeployedAt: text("last_deployed_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const femaVendorsRelations = relations(femaVendors, ({ one }) => ({
  pro: one(users, {
    fields: [femaVendors.proId],
    references: [users.id],
  }),
}));

export const insertFemaVendorSchema = createInsertSchema(femaVendors).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFemaVendor = z.infer<typeof insertFemaVendorSchema>;
export type FemaVendor = typeof femaVendors.$inferSelect;

// ==========================================
// 10. Retainage Tracking
// ==========================================
export const retainageTracking = pgTable("retainage_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(),
  milestone: text("milestone").notNull(),
  amount: real("amount").notNull(),
  retainagePct: real("retainage_pct").notNull().default(10),
  retainageHeld: real("retainage_held").notNull().default(0),
  released: boolean("released").default(false),
  releasedAt: text("released_at"),
  releasedBy: varchar("released_by"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertRetainageTrackingSchema = createInsertSchema(retainageTracking).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRetainageTracking = z.infer<typeof insertRetainageTrackingSchema>;
export type RetainageTracking = typeof retainageTracking.$inferSelect;

// ==========================================
// 11. Environmental Compliance
// ==========================================
export const environmentalCompliance = pgTable("environmental_compliance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull(),
  wasteType: text("waste_type").notNull(), // 'general', 'hazardous', 'asbestos', 'lead', 'electronic'
  disposalMethod: text("disposal_method").notNull(), // 'landfill', 'recycling', 'incineration', 'treatment'
  manifestNumber: text("manifest_number"),
  epaId: text("epa_id"),
  facilityName: text("facility_name"),
  weightLbs: real("weight_lbs"),
  documentUrl: text("document_url"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const environmentalComplianceRelations = relations(environmentalCompliance, ({ one }) => ({
  job: one(serviceRequests, {
    fields: [environmentalCompliance.jobId],
    references: [serviceRequests.id],
  }),
}));

export const insertEnvironmentalComplianceSchema = createInsertSchema(environmentalCompliance).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEnvironmentalCompliance = z.infer<typeof insertEnvironmentalComplianceSchema>;
export type EnvironmentalCompliance = typeof environmentalCompliance.$inferSelect;

// ==========================================
// 12. Communities (HOA)
// ==========================================
export const communities = pgTable("communities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  unitsCount: integer("units_count").default(0),
  boardContact: text("board_contact"),
  managementCompanyId: varchar("management_company_id"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const communitiesRelations = relations(communities, ({ one, many }) => ({
  managementCompany: one(businessAccounts, {
    fields: [communities.managementCompanyId],
    references: [businessAccounts.id],
  }),
  properties: many(communityProperties),
  boardApprovals: many(boardApprovals),
  maintenanceCalendars: many(maintenanceCalendars),
  reserveStudies: many(reserveStudies),
}));

export const insertCommunitySchema = createInsertSchema(communities).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCommunity = z.infer<typeof insertCommunitySchema>;
export type Community = typeof communities.$inferSelect;

// ==========================================
// 13. Community Properties
// ==========================================
export const communityProperties = pgTable("community_properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull(),
  address: text("address").notNull(),
  unitNumber: text("unit_number"),
  ownerId: varchar("owner_id"),
  residentId: varchar("resident_id"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const communityPropertiesRelations = relations(communityProperties, ({ one }) => ({
  community: one(communities, {
    fields: [communityProperties.communityId],
    references: [communities.id],
  }),
  owner: one(users, {
    fields: [communityProperties.ownerId],
    references: [users.id],
  }),
  resident: one(users, {
    fields: [communityProperties.residentId],
    references: [users.id],
  }),
}));

export const insertCommunityPropertySchema = createInsertSchema(communityProperties).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCommunityProperty = z.infer<typeof insertCommunityPropertySchema>;
export type CommunityProperty = typeof communityProperties.$inferSelect;

// ==========================================
// 14. Board Approvals
// ==========================================
export const boardApprovals = pgTable("board_approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull(),
  requestId: varchar("request_id"),
  requestedBy: varchar("requested_by").notNull(),
  title: text("title"),
  description: text("description"),
  amount: real("amount"),
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'denied'
  votesFor: integer("votes_for").default(0),
  votesAgainst: integer("votes_against").default(0),
  deadline: text("deadline"),
  resolvedAt: text("resolved_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const boardApprovalsRelations = relations(boardApprovals, ({ one }) => ({
  community: one(communities, {
    fields: [boardApprovals.communityId],
    references: [communities.id],
  }),
  requester: one(users, {
    fields: [boardApprovals.requestedBy],
    references: [users.id],
  }),
}));

export const insertBoardApprovalSchema = createInsertSchema(boardApprovals).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBoardApproval = z.infer<typeof insertBoardApprovalSchema>;
export type BoardApproval = typeof boardApprovals.$inferSelect;

// ==========================================
// 15. Maintenance Calendars
// ==========================================
export const maintenanceCalendars = pgTable("maintenance_calendars", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull(),
  serviceType: text("service_type").notNull(),
  frequency: text("frequency").notNull(), // 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually'
  nextDate: text("next_date"),
  lastCompletedDate: text("last_completed_date"),
  assignedProId: varchar("assigned_pro_id"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const maintenanceCalendarsRelations = relations(maintenanceCalendars, ({ one }) => ({
  community: one(communities, {
    fields: [maintenanceCalendars.communityId],
    references: [communities.id],
  }),
  assignedPro: one(users, {
    fields: [maintenanceCalendars.assignedProId],
    references: [users.id],
  }),
}));

export const insertMaintenanceCalendarSchema = createInsertSchema(maintenanceCalendars).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMaintenanceCalendar = z.infer<typeof insertMaintenanceCalendarSchema>;
export type MaintenanceCalendar = typeof maintenanceCalendars.$inferSelect;

// ==========================================
// 16. Reserve Studies
// ==========================================
export const reserveStudies = pgTable("reserve_studies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  communityId: varchar("community_id").notNull(),
  fiscalYear: integer("fiscal_year").notNull(),
  totalReserves: real("total_reserves").notNull().default(0),
  allocated: real("allocated").default(0),
  spent: real("spent").default(0),
  remaining: real("remaining").default(0),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const reserveStudiesRelations = relations(reserveStudies, ({ one }) => ({
  community: one(communities, {
    fields: [reserveStudies.communityId],
    references: [communities.id],
  }),
}));

export const insertReserveStudySchema = createInsertSchema(reserveStudies).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertReserveStudy = z.infer<typeof insertReserveStudySchema>;
export type ReserveStudy = typeof reserveStudies.$inferSelect;

// ==========================================
// 17. PM Portfolios
// ==========================================
export const pmPortfolios = pgTable("pm_portfolios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ownerId: varchar("owner_id").notNull(),
  totalUnits: integer("total_units").default(0),
  totalProperties: integer("total_properties").default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const pmPortfoliosRelations = relations(pmPortfolios, ({ one, many }) => ({
  owner: one(users, {
    fields: [pmPortfolios.ownerId],
    references: [users.id],
  }),
  properties: many(pmProperties),
}));

export const insertPmPortfolioSchema = createInsertSchema(pmPortfolios).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPmPortfolio = z.infer<typeof insertPmPortfolioSchema>;
export type PmPortfolio = typeof pmPortfolios.$inferSelect;

// ==========================================
// 18. PM Properties
// ==========================================
export const pmProperties = pgTable("pm_properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioId: varchar("portfolio_id").notNull(),
  address: text("address").notNull(),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  units: integer("units").default(1),
  type: text("type"), // 'single_family', 'multi_family', 'commercial', 'condo'
  ownerId: varchar("owner_id"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const pmPropertiesRelations = relations(pmProperties, ({ one, many }) => ({
  portfolio: one(pmPortfolios, {
    fields: [pmProperties.portfolioId],
    references: [pmPortfolios.id],
  }),
  owner: one(users, {
    fields: [pmProperties.ownerId],
    references: [users.id],
  }),
  pmUnits: many(pmUnits),
}));

export const insertPmPropertySchema = createInsertSchema(pmProperties).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPmProperty = z.infer<typeof insertPmPropertySchema>;
export type PmProperty = typeof pmProperties.$inferSelect;

// ==========================================
// 19. PM Units
// ==========================================
export const pmUnits = pgTable("pm_units", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  unitNumber: text("unit_number"),
  tenantId: varchar("tenant_id"),
  status: text("status").notNull().default("occupied"), // 'occupied', 'vacant', 'turnover', 'maintenance'
  leaseEnd: text("lease_end"),
  monthlyRent: real("monthly_rent"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const pmUnitsRelations = relations(pmUnits, ({ one, many }) => ({
  property: one(pmProperties, {
    fields: [pmUnits.propertyId],
    references: [pmProperties.id],
  }),
  tenant: one(users, {
    fields: [pmUnits.tenantId],
    references: [users.id],
  }),
  workOrders: many(workOrders),
  turnoverChecklists: many(turnoverChecklists),
}));

export const insertPmUnitSchema = createInsertSchema(pmUnits).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPmUnit = z.infer<typeof insertPmUnitSchema>;
export type PmUnit = typeof pmUnits.$inferSelect;

// ==========================================
// 20. Work Orders
// ==========================================
export const workOrders = pgTable("work_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  unitId: varchar("unit_id").notNull(),
  tenantId: varchar("tenant_id"),
  description: text("description").notNull(),
  priority: text("priority").notNull().default("normal"), // 'emergency', 'urgent', 'normal', 'low'
  status: text("status").notNull().default("open"), // 'open', 'assigned', 'in_progress', 'completed', 'cancelled'
  slaDeadline: text("sla_deadline"),
  photos: text("photos").array(),
  assignedProId: varchar("assigned_pro_id"),
  serviceRequestId: varchar("service_request_id"),
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const workOrdersRelations = relations(workOrders, ({ one }) => ({
  unit: one(pmUnits, {
    fields: [workOrders.unitId],
    references: [pmUnits.id],
  }),
  tenant: one(users, {
    fields: [workOrders.tenantId],
    references: [users.id],
  }),
  assignedPro: one(users, {
    fields: [workOrders.assignedProId],
    references: [users.id],
  }),
  serviceRequest: one(serviceRequests, {
    fields: [workOrders.serviceRequestId],
    references: [serviceRequests.id],
  }),
}));

export const insertWorkOrderSchema = createInsertSchema(workOrders).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;
export type WorkOrder = typeof workOrders.$inferSelect;

// ==========================================
// 21. Turnover Checklists
// ==========================================
export const turnoverChecklists = pgTable("turnover_checklists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  unitId: varchar("unit_id").notNull(),
  task: text("task").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'in_progress', 'completed', 'skipped'
  assignedProId: varchar("assigned_pro_id"),
  completedAt: text("completed_at"),
  photos: text("photos").array(),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const turnoverChecklistsRelations = relations(turnoverChecklists, ({ one }) => ({
  unit: one(pmUnits, {
    fields: [turnoverChecklists.unitId],
    references: [pmUnits.id],
  }),
  assignedPro: one(users, {
    fields: [turnoverChecklists.assignedProId],
    references: [users.id],
  }),
}));

export const insertTurnoverChecklistSchema = createInsertSchema(turnoverChecklists).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTurnoverChecklist = z.infer<typeof insertTurnoverChecklistSchema>;
export type TurnoverChecklist = typeof turnoverChecklists.$inferSelect;

// ==========================================
// 22. SLA Configs
// ==========================================
export const slaConfigs = pgTable("sla_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  priority: text("priority").notNull(), // 'emergency', 'urgent', 'normal', 'low'
  responseHours: integer("response_hours").notNull(),
  resolutionHours: integer("resolution_hours").notNull(),
  escalationContact: text("escalation_contact"),
  penaltyAmount: real("penalty_amount"),
  isActive: boolean("is_active").default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const slaConfigsRelations = relations(slaConfigs, ({ one }) => ({
  client: one(businessAccounts, {
    fields: [slaConfigs.clientId],
    references: [businessAccounts.id],
  }),
}));

export const insertSlaConfigSchema = createInsertSchema(slaConfigs).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSlaConfig = z.infer<typeof insertSlaConfigSchema>;
export type SlaConfig = typeof slaConfigs.$inferSelect;

// ==========================================
// 23. SLA Tracking
// ==========================================
export const slaTracking = pgTable("sla_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull(),
  slaConfigId: varchar("sla_config_id").notNull(),
  responseAt: text("response_at"),
  resolvedAt: text("resolved_at"),
  breached: boolean("breached").default(false),
  breachType: text("breach_type"), // 'response', 'resolution', 'both'
  breachedAt: text("breached_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const slaTrackingRelations = relations(slaTracking, ({ one }) => ({
  job: one(serviceRequests, {
    fields: [slaTracking.jobId],
    references: [serviceRequests.id],
  }),
  slaConfig: one(slaConfigs, {
    fields: [slaTracking.slaConfigId],
    references: [slaConfigs.id],
  }),
}));

export const insertSlaTrackingSchema = createInsertSchema(slaTracking).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSlaTracking = z.infer<typeof insertSlaTrackingSchema>;
export type SlaTracking = typeof slaTracking.$inferSelect;

// ==========================================
// 24. Punch Lists
// ==========================================
export const punchLists = pgTable("punch_lists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  createdBy: varchar("created_by").notNull(),
  title: text("title"),
  status: text("status").notNull().default("open"), // 'open', 'in_progress', 'completed'
  dueDate: text("due_date"),
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const punchListsRelations = relations(punchLists, ({ one, many }) => ({
  creator: one(users, {
    fields: [punchLists.createdBy],
    references: [users.id],
  }),
  items: many(punchListItems),
}));

export const insertPunchListSchema = createInsertSchema(punchLists).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPunchList = z.infer<typeof insertPunchListSchema>;
export type PunchList = typeof punchLists.$inferSelect;

// ==========================================
// 25. Punch List Items
// ==========================================
export const punchListItems = pgTable("punch_list_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  punchListId: varchar("punch_list_id").notNull(),
  description: text("description").notNull(),
  trade: text("trade"),
  assignedProId: varchar("assigned_pro_id"),
  status: text("status").notNull().default("open"), // 'open', 'in_progress', 'completed', 'rejected'
  photoBefore: text("photo_before"),
  photoAfter: text("photo_after"),
  completedAt: text("completed_at"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const punchListItemsRelations = relations(punchListItems, ({ one }) => ({
  punchList: one(punchLists, {
    fields: [punchListItems.punchListId],
    references: [punchLists.id],
  }),
  assignedPro: one(users, {
    fields: [punchListItems.assignedProId],
    references: [users.id],
  }),
}));

export const insertPunchListItemSchema = createInsertSchema(punchListItems).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPunchListItem = z.infer<typeof insertPunchListItemSchema>;
export type PunchListItem = typeof punchListItems.$inferSelect;

// ==========================================
// 26. Lien Waivers
// ==========================================
export const lienWaivers = pgTable("lien_waivers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull(),
  proId: varchar("pro_id").notNull(),
  type: text("type").notNull(), // 'conditional_progress', 'unconditional_progress', 'conditional_final', 'unconditional_final'
  amount: real("amount").notNull(),
  signed: boolean("signed").default(false),
  signedAt: text("signed_at"),
  documentUrl: text("document_url"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const lienWaiversRelations = relations(lienWaivers, ({ one }) => ({
  job: one(serviceRequests, {
    fields: [lienWaivers.jobId],
    references: [serviceRequests.id],
  }),
  pro: one(users, {
    fields: [lienWaivers.proId],
    references: [users.id],
  }),
}));

export const insertLienWaiverSchema = createInsertSchema(lienWaivers).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLienWaiver = z.infer<typeof insertLienWaiverSchema>;
export type LienWaiver = typeof lienWaivers.$inferSelect;

// ==========================================
// 27. Permits
// ==========================================
export const permits = pgTable("permits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull(),
  permitType: text("permit_type").notNull(), // 'building', 'demolition', 'electrical', 'plumbing', 'mechanical'
  permitNumber: text("permit_number"),
  applicationDate: text("application_date"),
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'denied', 'expired'
  inspectionDate: text("inspection_date"),
  approved: boolean("approved").default(false),
  approvedAt: text("approved_at"),
  documentUrl: text("document_url"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const permitsRelations = relations(permits, ({ one }) => ({
  job: one(serviceRequests, {
    fields: [permits.jobId],
    references: [serviceRequests.id],
  }),
}));

export const insertPermitSchema = createInsertSchema(permits).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPermit = z.infer<typeof insertPermitSchema>;
export type Permit = typeof permits.$inferSelect;

// ==========================================
// 28. Digital Signatures
// ==========================================
export const digitalSignatures = pgTable("digital_signatures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  documentType: text("document_type").notNull(), // 'lien_waiver', 'contract', 'change_order', 'nda', 'scope_change'
  documentId: varchar("document_id").notNull(),
  signerId: varchar("signer_id").notNull(),
  signedAt: text("signed_at").notNull(),
  signatureData: text("signature_data"), // base64 or typed name
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const digitalSignaturesRelations = relations(digitalSignatures, ({ one }) => ({
  signer: one(users, {
    fields: [digitalSignatures.signerId],
    references: [users.id],
  }),
}));

export const insertDigitalSignatureSchema = createInsertSchema(digitalSignatures).omit({ id: true, createdAt: true });
export type InsertDigitalSignature = z.infer<typeof insertDigitalSignatureSchema>;
export type DigitalSignature = typeof digitalSignatures.$inferSelect;

// ==========================================
// 29. Veteran Profiles
// ==========================================
export const veteranProfiles = pgTable("veteran_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proId: varchar("pro_id").notNull(),
  branch: text("branch").notNull(), // 'army', 'navy', 'air_force', 'marines', 'coast_guard', 'space_force'
  mosCode: text("mos_code"),
  mosTitle: text("mos_title"),
  serviceStart: text("service_start"),
  serviceEnd: text("service_end"),
  disabilityRating: integer("disability_rating"),
  dd214Verified: boolean("dd214_verified").default(false),
  dd214DocumentUrl: text("dd214_document_url"),
  verifiedAt: text("verified_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const veteranProfilesRelations = relations(veteranProfiles, ({ one }) => ({
  pro: one(users, {
    fields: [veteranProfiles.proId],
    references: [users.id],
  }),
}));

export const insertVeteranProfileSchema = createInsertSchema(veteranProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVeteranProfile = z.infer<typeof insertVeteranProfileSchema>;
export type VeteranProfile = typeof veteranProfiles.$inferSelect;

// ==========================================
// 30. Veteran Certifications
// ==========================================
export const veteranCertifications = pgTable("veteran_certifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull(),
  certType: text("cert_type").notNull(), // 'sdvosb', 'vosb', 'hubzone'
  status: text("status").notNull().default("pending"), // 'pending', 'active', 'expired', 'denied'
  applicationDate: text("application_date"),
  expiry: text("expiry"),
  vaVerificationId: text("va_verification_id"),
  documentUrl: text("document_url"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const veteranCertificationsRelations = relations(veteranCertifications, ({ one }) => ({
  business: one(businessAccounts, {
    fields: [veteranCertifications.businessId],
    references: [businessAccounts.id],
  }),
}));

export const insertVeteranCertificationSchema = createInsertSchema(veteranCertifications).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVeteranCertification = z.infer<typeof insertVeteranCertificationSchema>;
export type VeteranCertification = typeof veteranCertifications.$inferSelect;

// ==========================================
// 31. Veteran Mentorships
// ==========================================
export const veteranMentorships = pgTable("veteran_mentorships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mentorProId: varchar("mentor_pro_id").notNull(),
  menteeProId: varchar("mentee_pro_id").notNull(),
  startedAt: text("started_at").notNull(),
  status: text("status").notNull().default("active"), // 'active', 'completed', 'paused', 'cancelled'
  endedAt: text("ended_at"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const veteranMentorshipsRelations = relations(veteranMentorships, ({ one }) => ({
  mentor: one(users, {
    fields: [veteranMentorships.mentorProId],
    references: [users.id],
  }),
  mentee: one(users, {
    fields: [veteranMentorships.menteeProId],
    references: [users.id],
  }),
}));

export const insertVeteranMentorshipSchema = createInsertSchema(veteranMentorships).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVeteranMentorship = z.infer<typeof insertVeteranMentorshipSchema>;
export type VeteranMentorship = typeof veteranMentorships.$inferSelect;

// ==========================================
// 32. Military Spouse Profiles
// ==========================================
export const militarySpouseProfiles = pgTable("military_spouse_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  sponsorBranch: text("sponsor_branch"), // 'army', 'navy', etc.
  currentBase: text("current_base"),
  skills: text("skills").array(),
  availableFor: text("available_for").array(), // service types they can perform
  isActive: boolean("is_active").default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const militarySpouseProfilesRelations = relations(militarySpouseProfiles, ({ one }) => ({
  user: one(users, {
    fields: [militarySpouseProfiles.userId],
    references: [users.id],
  }),
}));

export const insertMilitarySpouseProfileSchema = createInsertSchema(militarySpouseProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMilitarySpouseProfile = z.infer<typeof insertMilitarySpouseProfileSchema>;
export type MilitarySpouseProfile = typeof militarySpouseProfiles.$inferSelect;

// ==========================================
// 33. Contract Pricing
// ==========================================
export const contractPricing = pgTable("contract_pricing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  clientType: text("client_type").notNull(), // 'hoa', 'property_manager', 'government', 'enterprise'
  serviceType: text("service_type").notNull(),
  rate: real("rate").notNull(),
  discountPct: real("discount_pct").default(0),
  effectiveDate: text("effective_date").notNull(),
  endDate: text("end_date"),
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const contractPricingRelations = relations(contractPricing, ({ one }) => ({
  client: one(businessAccounts, {
    fields: [contractPricing.clientId],
    references: [businessAccounts.id],
  }),
}));

export const insertContractPricingSchema = createInsertSchema(contractPricing).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertContractPricing = z.infer<typeof insertContractPricingSchema>;
export type ContractPricing = typeof contractPricing.$inferSelect;

// ==========================================
// 34. Vendor Scorecards
// ==========================================
export const vendorScorecards = pgTable("vendor_scorecards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proId: varchar("pro_id").notNull(),
  clientId: varchar("client_id").notNull(),
  period: text("period").notNull(), // 'Q1-2026', 'Jan-2026', etc.
  onTimePct: real("on_time_pct"),
  qualityAvg: real("quality_avg"),
  jobsCompleted: integer("jobs_completed").default(0),
  complaints: integer("complaints").default(0),
  overallScore: real("overall_score"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const vendorScorecardsRelations = relations(vendorScorecards, ({ one }) => ({
  pro: one(users, {
    fields: [vendorScorecards.proId],
    references: [users.id],
  }),
  client: one(businessAccounts, {
    fields: [vendorScorecards.clientId],
    references: [businessAccounts.id],
  }),
}));

export const insertVendorScorecardSchema = createInsertSchema(vendorScorecards).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVendorScorecard = z.infer<typeof insertVendorScorecardSchema>;
export type VendorScorecard = typeof vendorScorecards.$inferSelect;

// ==========================================
// 35. Asset Registry
// ==========================================
export const assetRegistry = pgTable("asset_registry", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id"),
  unitId: varchar("unit_id"),
  assetType: text("asset_type").notNull(), // 'hvac', 'water_heater', 'appliance', 'roof', 'elevator', etc.
  brand: text("brand"),
  model: text("model"),
  serialNumber: text("serial_number"),
  installDate: text("install_date"),
  warrantyEnd: text("warranty_end"),
  lastService: text("last_service"),
  nextServiceDue: text("next_service_due"),
  condition: text("condition"), // 'excellent', 'good', 'fair', 'poor', 'replace'
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertAssetRegistrySchema = createInsertSchema(assetRegistry).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAssetRegistry = z.infer<typeof insertAssetRegistrySchema>;
export type AssetRegistry = typeof assetRegistry.$inferSelect;

// ==========================================
// 36. Audit Logs (Immutable)
// ==========================================
export const b2bAuditLogs = pgTable("b2b_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: text("entity_type").notNull(), // 'work_order', 'invoice', 'contract', 'user', etc.
  entityId: varchar("entity_id").notNull(),
  action: text("action").notNull(), // 'created', 'updated', 'deleted', 'approved', 'rejected'
  actorId: varchar("actor_id").notNull(),
  details: jsonb("details"), // arbitrary JSON with change details
  ipAddress: text("ip_address"),
  timestamp: text("timestamp").notNull().default(sql`CURRENT_TIMESTAMP`),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const b2bAuditLogsRelations = relations(b2bAuditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [b2bAuditLogs.actorId],
    references: [users.id],
  }),
}));

export const insertB2bAuditLogSchema = createInsertSchema(b2bAuditLogs).omit({ id: true, createdAt: true });
export type InsertB2bAuditLog = z.infer<typeof insertB2bAuditLogSchema>;
export type B2bAuditLog = typeof b2bAuditLogs.$inferSelect;

// ==========================================
// 37. Custom Reports
// ==========================================
export const customReports = pgTable("custom_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  name: text("name").notNull(),
  filters: jsonb("filters"), // { dateRange, serviceTypes, statuses, etc. }
  columns: jsonb("columns"), // array of column configs
  schedule: text("schedule"), // 'daily', 'weekly', 'monthly', null for on-demand
  lastRunAt: text("last_run_at"),
  recipientEmails: text("recipient_emails").array(),
  isActive: boolean("is_active").default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const customReportsRelations = relations(customReports, ({ one }) => ({
  client: one(businessAccounts, {
    fields: [customReports.clientId],
    references: [businessAccounts.id],
  }),
}));

export const insertCustomReportSchema = createInsertSchema(customReports).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCustomReport = z.infer<typeof insertCustomReportSchema>;
export type CustomReport = typeof customReports.$inferSelect;

// ==========================================
// 38. Invoices (B2B)
// ==========================================
export const b2bInvoices = pgTable("b2b_invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  invoiceNumber: text("invoice_number"),
  amount: real("amount").notNull(),
  dueDate: text("due_date").notNull(),
  status: text("status").notNull().default("draft"), // 'draft', 'sent', 'paid', 'overdue', 'cancelled', 'void'
  paymentTerms: text("payment_terms").default("net_30"), // 'net_15', 'net_30', 'net_45', 'net_60', 'due_on_receipt'
  lineItems: jsonb("line_items").$type<Array<{ description: string; quantity: number; unitPrice: number; total: number }>>(),
  paidAt: text("paid_at"),
  paidAmount: real("paid_amount"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const b2bInvoicesRelations = relations(b2bInvoices, ({ one }) => ({
  client: one(businessAccounts, {
    fields: [b2bInvoices.clientId],
    references: [businessAccounts.id],
  }),
}));

export const insertB2bInvoiceSchema = createInsertSchema(b2bInvoices).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertB2bInvoice = z.infer<typeof insertB2bInvoiceSchema>;
export type B2bInvoice = typeof b2bInvoices.$inferSelect;

// ==========================================
// 39. White Label Configs
// ==========================================
export const whiteLabelConfigs = pgTable("white_label_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color"),
  secondaryColor: text("secondary_color"),
  customDomain: text("custom_domain"),
  companyName: text("company_name"),
  faviconUrl: text("favicon_url"),
  supportEmail: text("support_email"),
  supportPhone: text("support_phone"),
  customCss: text("custom_css"),
  isActive: boolean("is_active").default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const whiteLabelConfigsRelations = relations(whiteLabelConfigs, ({ one }) => ({
  client: one(businessAccounts, {
    fields: [whiteLabelConfigs.clientId],
    references: [businessAccounts.id],
  }),
}));

export const insertWhiteLabelConfigSchema = createInsertSchema(whiteLabelConfigs).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWhiteLabelConfig = z.infer<typeof insertWhiteLabelConfigSchema>;
export type WhiteLabelConfig = typeof whiteLabelConfigs.$inferSelect;

// ==========================================
// 40. B2B Subscription Plans
// ==========================================
export const b2bSubscriptionPlans = pgTable("b2b_subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  segment: text("segment").notNull(), // 'hoa', 'pm', 'construction', 'government'
  tier: text("tier").notNull(), // 'starter', 'professional', 'enterprise', 'project', 'standard'
  pricePerUnit: real("price_per_unit").notNull(),
  unitType: text("unit_type").notNull(), // 'unit', 'door', 'flat_monthly', 'flat_yearly'
  maxUnits: integer("max_units"), // NULL = unlimited
  features: jsonb("features").notNull().default(sql`'[]'`),
  transactionFeePct: real("transaction_fee_pct").notNull().default(5.0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const insertB2bSubscriptionPlanSchema = createInsertSchema(b2bSubscriptionPlans).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertB2bSubscriptionPlan = z.infer<typeof insertB2bSubscriptionPlanSchema>;
export type B2bSubscriptionPlan = typeof b2bSubscriptionPlans.$inferSelect;

// ==========================================
// 41. B2B Subscriptions
// ==========================================
export const b2bSubscriptions = pgTable("b2b_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar("client_id").notNull(),
  planId: varchar("plan_id").notNull(),
  unitsCount: integer("units_count").notNull().default(0),
  monthlyPrice: real("monthly_price").notNull().default(0),
  status: text("status").notNull().default("active"),
  billingCycle: text("billing_cycle").notNull().default("monthly"),
  startedAt: text("started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  nextBillingAt: text("next_billing_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const b2bSubscriptionsRelations = relations(b2bSubscriptions, ({ one }) => ({
  plan: one(b2bSubscriptionPlans, {
    fields: [b2bSubscriptions.planId],
    references: [b2bSubscriptionPlans.id],
  }),
}));

export const insertB2bSubscriptionSchema = createInsertSchema(b2bSubscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertB2bSubscription = z.infer<typeof insertB2bSubscriptionSchema>;
export type B2bSubscription = typeof b2bSubscriptions.$inferSelect;

// ==========================================
// Chargeback/Dispute Protection
// ==========================================
export const chargebackDisputes = pgTable("chargeback_disputes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id"),
  customerId: varchar("customer_id"),
  stripeDisputeId: text("stripe_dispute_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  amount: integer("amount"), // cents
  reason: text("reason"),
  status: text("status").default("needs_response"), // needs_response, under_review, won, lost
  evidenceSubmittedAt: text("evidence_submitted_at"),
  resolvedAt: text("resolved_at"),
  outcome: text("outcome"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const chargebackDisputesRelations = relations(chargebackDisputes, ({ one }) => ({
  job: one(serviceRequests, {
    fields: [chargebackDisputes.jobId],
    references: [serviceRequests.id],
  }),
  customer: one(users, {
    fields: [chargebackDisputes.customerId],
    references: [users.id],
  }),
}));

export const insertChargebackDisputeSchema = createInsertSchema(chargebackDisputes).omit({ id: true });
export type InsertChargebackDispute = z.infer<typeof insertChargebackDisputeSchema>;
export type ChargebackDispute = typeof chargebackDisputes.$inferSelect;

// ─── Accounting / Ledger System ─────────────────────────────────────────────

export const accountTypeEnum = z.enum(["asset", "liability", "equity", "revenue", "expense"]);
export type AccountType = z.infer<typeof accountTypeEnum>;

export const ledgerAccounts = pgTable("ledger_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // asset|liability|equity|revenue|expense
  subtype: text("subtype"),
  parentId: varchar("parent_id"),
  balance: real("balance").default(0).notNull(),
  isSystem: boolean("is_system").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLedgerAccountSchema = createInsertSchema(ledgerAccounts).omit({ id: true, createdAt: true });
export type InsertLedgerAccount = z.infer<typeof insertLedgerAccountSchema>;
export type LedgerAccount = typeof ledgerAccounts.$inferSelect;

export const ledgerEntries = pgTable("ledger_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id").notNull(),
  accountId: varchar("account_id").notNull(),
  debit: real("debit").default(0).notNull(),
  credit: real("credit").default(0).notNull(),
  description: text("description"),
  referenceType: text("reference_type"), // job|subscription|refund|dispute|payout|manual|expense
  referenceId: text("reference_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by").default("system").notNull(),
});

export const insertLedgerEntrySchema = createInsertSchema(ledgerEntries).omit({ id: true, createdAt: true });
export type InsertLedgerEntry = z.infer<typeof insertLedgerEntrySchema>;
export type LedgerEntry = typeof ledgerEntries.$inferSelect;

export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessAccountId: varchar("business_account_id").notNull(),
  invoiceNumber: integer("invoice_number").notNull(),
  status: text("status").default("draft").notNull(), // draft|sent|paid|overdue|void
  subtotal: real("subtotal").default(0).notNull(),
  taxAmount: real("tax_amount").default(0).notNull(),
  total: real("total").default(0).notNull(),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  paidVia: text("paid_via"),
  lineItems: jsonb("line_items").default([]).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export const taxRecords = pgTable("tax_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proId: varchar("pro_id").notNull(),
  year: integer("year").notNull(),
  totalEarnings: real("total_earnings").default(0).notNull(),
  totalJobs: integer("total_jobs").default(0).notNull(),
  form1099Filed: boolean("form_1099_filed").default(false).notNull(),
  filedAt: timestamp("filed_at"),
  w9OnFile: boolean("w9_on_file").default(false).notNull(),
  tin: text("tin"), // encrypted
  legalName: text("legal_name"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTaxRecordSchema = createInsertSchema(taxRecords).omit({ id: true, createdAt: true });
export type InsertTaxRecord = z.infer<typeof insertTaxRecordSchema>;
export type TaxRecord = typeof taxRecords.$inferSelect;

export const monthlyReports = pgTable("monthly_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  totalRevenue: real("total_revenue").default(0).notNull(),
  totalExpenses: real("total_expenses").default(0).notNull(),
  grossProfit: real("gross_profit").default(0).notNull(),
  netIncome: real("net_income").default(0).notNull(),
  reportData: jsonb("report_data"),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

export const insertMonthlyReportSchema = createInsertSchema(monthlyReports).omit({ id: true, generatedAt: true });
export type InsertMonthlyReport = z.infer<typeof insertMonthlyReportSchema>;
export type MonthlyReport = typeof monthlyReports.$inferSelect;

export const manualExpenses = pgTable("manual_expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull(),
  amount: real("amount").notNull(),
  vendor: text("vendor"),
  description: text("description"),
  category: text("category").notNull(), // infrastructure|legal|marketing|payroll|insurance|office|other
  receiptUrl: text("receipt_url"),
  expenseDate: timestamp("expense_date").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const insertManualExpenseSchema = createInsertSchema(manualExpenses).omit({ id: true, createdAt: true, deletedAt: true });
export type InsertManualExpense = z.infer<typeof insertManualExpenseSchema>;
export type ManualExpense = typeof manualExpenses.$inferSelect;

// ==========================================
// Integration Connections
// ==========================================
export const integrationConnections = pgTable("integration_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessAccountId: varchar("business_account_id").notNull(),
  platform: text("platform").notNull(), // appfolio|buildium|yardi|rentmanager|realpage|cinc|townsq|vantaca|sam_gov
  credentials: text("credentials"), // encrypted JSON string
  status: text("status").notNull().default("disconnected"), // active|disconnected|error
  lastSyncAt: timestamp("last_sync_at"),
  lastSyncResult: jsonb("last_sync_result"),
  syncFrequency: text("sync_frequency").notNull().default("manual"), // manual|hourly|daily
  autoSync: boolean("auto_sync").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertIntegrationConnectionSchema = createInsertSchema(integrationConnections).omit({ id: true, createdAt: true });
export type InsertIntegrationConnection = z.infer<typeof insertIntegrationConnectionSchema>;
export type IntegrationConnection = typeof integrationConnections.$inferSelect;

// ==========================================
// Government Opportunities
// ==========================================
export const governmentOpportunities = pgTable("government_opportunities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  agency: text("agency"),
  solicitationNumber: text("solicitation_number"),
  naicsCode: text("naics_code"),
  setAsideType: text("set_aside_type"),
  estimatedValue: real("estimated_value"),
  responseDeadline: timestamp("response_deadline"),
  placeOfPerformance: text("place_of_performance"),
  url: text("url"),
  status: text("status").notNull().default("open"), // open|closed|awarded
  syncedAt: timestamp("synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGovernmentOpportunitySchema = createInsertSchema(governmentOpportunities).omit({ id: true, createdAt: true });
export type InsertGovernmentOpportunity = z.infer<typeof insertGovernmentOpportunitySchema>;
export type GovernmentOpportunity = typeof governmentOpportunities.$inferSelect;

// ==========================================
// Integration Sync Logs
// ==========================================
export const integrationSyncLogs = pgTable("integration_sync_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  connectionId: varchar("connection_id").notNull(),
  platform: text("platform").notNull(),
  action: text("action").notNull(), // sync|push|webhook
  status: text("status").notNull(), // success|error
  recordsProcessed: integer("records_processed").default(0),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertIntegrationSyncLogSchema = createInsertSchema(integrationSyncLogs).omit({ id: true, createdAt: true });
export type InsertIntegrationSyncLog = z.infer<typeof insertIntegrationSyncLogSchema>;
export type IntegrationSyncLog = typeof integrationSyncLogs.$inferSelect;

// ==========================================
// CRM Contact Mappings
// ==========================================
export const crmContactMappings = pgTable("crm_contact_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessAccountId: varchar("business_account_id").notNull(),
  crmPlatform: text("crm_platform").notNull(), // salesforce|hubspot|zoho|monday|servicetitan|jobber|housecallpro|govwin
  externalContactId: text("external_contact_id").notNull(),
  uptendUserId: varchar("uptend_user_id"),
  uptendPropertyId: varchar("uptend_property_id"),
  externalData: jsonb("external_data"),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCrmContactMappingSchema = createInsertSchema(crmContactMappings).omit({ id: true, createdAt: true });
export type InsertCrmContactMapping = z.infer<typeof insertCrmContactMappingSchema>;
export type CrmContactMapping = typeof crmContactMappings.$inferSelect;

// ==========================================
// Parts & Materials Requests
// ==========================================
export const partsRequests = pgTable("parts_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceRequestId: varchar("service_request_id").notNull(),
  requestedByProId: varchar("requested_by_pro_id").notNull(),
  businessAccountId: varchar("business_account_id"),
  status: text("status").notNull().default("pending"), // pending | approved | denied | sourced | installed
  description: text("description").notNull(),
  photoUrl: text("photo_url"),
  estimatedCost: real("estimated_cost"),
  actualCost: real("actual_cost"),
  supplierSource: text("supplier_source"), // pro | pm | uptend_partner
  receiptUrl: text("receipt_url"),
  approvedById: varchar("approved_by_id"),
  approvedAt: text("approved_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const insertPartsRequestSchema = createInsertSchema(partsRequests).omit({ id: true });
export type InsertPartsRequest = z.infer<typeof insertPartsRequestSchema>;
export type PartsRequest = typeof partsRequests.$inferSelect;

export const preferredSuppliers = pgTable("preferred_suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessAccountId: varchar("business_account_id").notNull(),
  supplierName: text("supplier_name").notNull(),
  supplierType: text("supplier_type").notNull(), // hardware | plumbing | electrical | general
  accountNumber: text("account_number"),
  contactInfo: text("contact_info"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const insertPreferredSupplierSchema = createInsertSchema(preferredSuppliers).omit({ id: true });
export type InsertPreferredSupplier = z.infer<typeof insertPreferredSupplierSchema>;
export type PreferredSupplier = typeof preferredSuppliers.$inferSelect;

// ==========================================
// Business Bookings (B2B Booking Flow)
// ==========================================
export const businessBookings = pgTable("business_bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessAccountId: varchar("business_account_id").notNull(),
  propertyId: varchar("property_id"), // FK to hoaProperties (null if ad-hoc address)
  serviceRequestId: varchar("service_request_id"), // FK to serviceRequests when job is created
  serviceType: text("service_type").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  scheduledFor: text("scheduled_for").notNull(),
  scheduledTime: text("scheduled_time"),
  recurringFrequency: text("recurring_frequency"), // weekly, biweekly, monthly, null for one-time
  recurringEndDate: text("recurring_end_date"),
  preferredProId: varchar("preferred_pro_id"), // FK to users (pro)
  accessNotes: text("access_notes"), // gate codes, special instructions
  gateCode: text("gate_code"),
  specialInstructions: text("special_instructions"),
  unitNotes: text("unit_notes"), // unit-specific notes
  status: text("status").notNull().default("pending"), // pending, confirmed, in_progress, completed, cancelled
  priceEstimate: real("price_estimate"),
  finalPrice: real("final_price"),
  bulkBookingGroupId: varchar("bulk_booking_group_id"), // groups bulk bookings together
  billingMethod: text("billing_method").default("business_account"), // business_account, invoice
  createdBy: varchar("created_by").notNull(), // userId who created
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at"),
});

export const businessBookingsRelations = relations(businessBookings, ({ one }) => ({
  businessAccount: one(businessAccounts, {
    fields: [businessBookings.businessAccountId],
    references: [businessAccounts.id],
  }),
  property: one(hoaProperties, {
    fields: [businessBookings.propertyId],
    references: [hoaProperties.id],
  }),
  serviceRequest: one(serviceRequests, {
    fields: [businessBookings.serviceRequestId],
    references: [serviceRequests.id],
  }),
  preferredPro: one(users, {
    fields: [businessBookings.preferredProId],
    references: [users.id],
  }),
}));

export const insertBusinessBookingSchema = createInsertSchema(businessBookings).omit({ id: true, createdAt: true });
export type InsertBusinessBooking = z.infer<typeof insertBusinessBookingSchema>;
export type BusinessBooking = typeof businessBookings.$inferSelect;

// Business Preferred Pros
export const businessPreferredPros = pgTable("business_preferred_pros", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessAccountId: varchar("business_account_id").notNull(),
  proId: varchar("pro_id").notNull(), // FK to users
  proName: text("pro_name"),
  serviceTypes: text("service_types").array(), // which services this pro is preferred for
  rating: real("rating"),
  totalJobsTogether: integer("total_jobs_together").default(0),
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const businessPreferredProsRelations = relations(businessPreferredPros, ({ one }) => ({
  businessAccount: one(businessAccounts, {
    fields: [businessPreferredPros.businessAccountId],
    references: [businessAccounts.id],
  }),
  pro: one(users, {
    fields: [businessPreferredPros.proId],
    references: [users.id],
  }),
}));

export const insertBusinessPreferredProSchema = createInsertSchema(businessPreferredPros).omit({ id: true, createdAt: true });
export type InsertBusinessPreferredPro = z.infer<typeof insertBusinessPreferredProSchema>;
export type BusinessPreferredPro = typeof businessPreferredPros.$inferSelect;

// ==========================================
// Pro Certification Academy
// ==========================================

export const certificationCategoryEnum = z.enum(["b2b", "specialty", "government"]);
export type CertificationCategory = z.infer<typeof certificationCategoryEnum>;

export const certificationStatusEnum = z.enum(["in_progress", "completed", "expired", "revoked"]);
export type CertificationStatus = z.infer<typeof certificationStatusEnum>;

export const certificationPrograms = pgTable("certification_programs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: varchar("slug").notNull(),
  description: text("description").notNull(),
  category: varchar("category").notNull().default("b2b"), // b2b, specialty, government
  prerequisiteCertId: varchar("prerequisite_cert_id"), // self-reference
  requiredScore: integer("required_score").notNull().default(80),
  modulesCount: integer("modules_count").notNull().default(0),
  estimatedMinutes: integer("estimated_minutes").notNull().default(60),
  expirationDays: integer("expiration_days").notNull().default(365),
  isActive: boolean("is_active").default(true),
  badgeIcon: text("badge_icon").default("shield"),
  badgeColor: text("badge_color").default("#f59e0b"),
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").notNull().default(sql`now()`),
});

export const certificationProgramsRelations = relations(certificationPrograms, ({ one, many }) => ({
  prerequisite: one(certificationPrograms, {
    fields: [certificationPrograms.prerequisiteCertId],
    references: [certificationPrograms.id],
  }),
  modules: many(certificationModules),
  questions: many(certificationQuestions),
}));

export const insertCertificationProgramSchema = createInsertSchema(certificationPrograms).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCertificationProgram = z.infer<typeof insertCertificationProgramSchema>;
export type CertificationProgram = typeof certificationPrograms.$inferSelect;

export const certificationModules = pgTable("certification_modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  certificationId: varchar("certification_id").notNull(),
  moduleNumber: integer("module_number").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(), // markdown
  videoUrl: text("video_url"),
  estimatedMinutes: integer("estimated_minutes").notNull().default(15),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const certificationModulesRelations = relations(certificationModules, ({ one }) => ({
  certification: one(certificationPrograms, {
    fields: [certificationModules.certificationId],
    references: [certificationPrograms.id],
  }),
}));

export const insertCertificationModuleSchema = createInsertSchema(certificationModules).omit({ id: true, createdAt: true });
export type InsertCertificationModule = z.infer<typeof insertCertificationModuleSchema>;
export type CertificationModule = typeof certificationModules.$inferSelect;

export const certificationQuestions = pgTable("certification_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  certificationId: varchar("certification_id").notNull(),
  moduleNumber: integer("module_number"),
  question: text("question").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c").notNull(),
  optionD: text("option_d").notNull(),
  correctOption: varchar("correct_option").notNull(), // a, b, c, d
  explanation: text("explanation").notNull(),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const certificationQuestionsRelations = relations(certificationQuestions, ({ one }) => ({
  certification: one(certificationPrograms, {
    fields: [certificationQuestions.certificationId],
    references: [certificationPrograms.id],
  }),
}));

export const insertCertificationQuestionSchema = createInsertSchema(certificationQuestions).omit({ id: true, createdAt: true });
export type InsertCertificationQuestion = z.infer<typeof insertCertificationQuestionSchema>;
export type CertificationQuestion = typeof certificationQuestions.$inferSelect;

export const proCertifications = pgTable("pro_certifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proId: varchar("pro_id").notNull(),
  certificationId: varchar("certification_id").notNull(),
  status: varchar("status").notNull().default("in_progress"), // in_progress, completed, expired, revoked
  score: integer("score"),
  startedAt: text("started_at").notNull().default(sql`now()`),
  completedAt: text("completed_at"),
  expiresAt: text("expires_at"),
  certificateNumber: varchar("certificate_number"),
  modulesCompleted: jsonb("modules_completed").default(sql`'[]'::jsonb`),
  quizAttempts: integer("quiz_attempts").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const proCertificationsRelations = relations(proCertifications, ({ one }) => ({
  certification: one(certificationPrograms, {
    fields: [proCertifications.certificationId],
    references: [certificationPrograms.id],
  }),
}));

export const insertProCertificationSchema = createInsertSchema(proCertifications).omit({ id: true, createdAt: true });
export type InsertProCertification = z.infer<typeof insertProCertificationSchema>;
export type ProCertification = typeof proCertifications.$inferSelect;

// ==========================================
// Weekly B2B Billing System
// ==========================================

export const weeklyBillingRuns = pgTable("weekly_billing_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessAccountId: varchar("business_account_id").notNull(),
  weekStartDate: text("week_start_date").notNull(), // Monday ISO date
  weekEndDate: text("week_end_date").notNull(), // Sunday ISO date
  status: text("status").notNull().default("draft"), // draft | pending | charged | failed | void
  invoiceId: varchar("invoice_id"),
  totalAmount: real("total_amount").notNull().default(0),
  jobCount: integer("job_count").notNull().default(0),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeChargeId: text("stripe_charge_id"),
  errorMessage: text("error_message"),
  dryRun: boolean("dry_run").notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  processedAt: text("processed_at"),
});

export const weeklyBillingRunsRelations = relations(weeklyBillingRuns, ({ one, many }) => ({
  businessAccount: one(businessAccounts, {
    fields: [weeklyBillingRuns.businessAccountId],
    references: [businessAccounts.id],
  }),
  invoice: one(invoices, {
    fields: [weeklyBillingRuns.invoiceId],
    references: [invoices.id],
  }),
  lineItems: many(billingLineItems),
}));

export const insertWeeklyBillingRunSchema = createInsertSchema(weeklyBillingRuns).omit({ id: true });
export type InsertWeeklyBillingRun = z.infer<typeof insertWeeklyBillingRunSchema>;
export type WeeklyBillingRun = typeof weeklyBillingRuns.$inferSelect;

export const billingLineItems = pgTable("billing_line_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  billingRunId: varchar("billing_run_id").notNull(),
  serviceRequestId: varchar("service_request_id").notNull(),
  businessBookingId: varchar("business_booking_id"),
  propertyAddress: text("property_address").notNull(),
  serviceType: text("service_type").notNull(),
  completedAt: text("completed_at").notNull(),
  customerSignoffAt: text("customer_signoff_at"),
  proName: text("pro_name"),
  laborCost: real("labor_cost").notNull().default(0),
  partsCost: real("parts_cost").notNull().default(0),
  platformFee: real("platform_fee").notNull().default(0),
  totalCharge: real("total_charge").notNull().default(0),
  notes: text("notes"),
});

export const billingLineItemsRelations = relations(billingLineItems, ({ one }) => ({
  billingRun: one(weeklyBillingRuns, {
    fields: [billingLineItems.billingRunId],
    references: [weeklyBillingRuns.id],
  }),
  serviceRequest: one(serviceRequests, {
    fields: [billingLineItems.serviceRequestId],
    references: [serviceRequests.id],
  }),
}));

export const insertBillingLineItemSchema = createInsertSchema(billingLineItems).omit({ id: true });
export type InsertBillingLineItem = z.infer<typeof insertBillingLineItemSchema>;
export type BillingLineItem = typeof billingLineItems.$inferSelect;

// ── Stripe Connect Payout Tables ──

export const proPayoutAccounts = pgTable("pro_payout_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proId: varchar("pro_id").notNull(),
  stripeConnectAccountId: text("stripe_connect_account_id"),
  stripeAccountStatus: text("stripe_account_status").default("pending"), // pending | active | restricted | disabled
  onboardingComplete: boolean("onboarding_complete").default(false),
  payoutSpeed: text("payout_speed").default("standard"), // standard | instant
  instantPayoutEligible: boolean("instant_payout_eligible").default(false),
  bankLast4: text("bank_last4"),
  bankName: text("bank_name"),
  debitCardLast4: text("debit_card_last4"),
  totalPaidOut: integer("total_paid_out").default(0), // cents
  lastPayoutAt: text("last_payout_at"),
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").notNull().default(sql`now()`),
});

export const proPayoutAccountsRelations = relations(proPayoutAccounts, ({ one }) => ({
  haulerProfile: one(haulerProfiles, {
    fields: [proPayoutAccounts.proId],
    references: [haulerProfiles.userId],
  }),
}));

export const insertProPayoutAccountSchema = createInsertSchema(proPayoutAccounts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProPayoutAccount = z.infer<typeof insertProPayoutAccountSchema>;
export type ProPayoutAccount = typeof proPayoutAccounts.$inferSelect;

export const proPayouts = pgTable("pro_payouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  proId: varchar("pro_id").notNull(),
  serviceRequestId: varchar("service_request_id"),
  stripeTransferId: text("stripe_transfer_id"),
  stripePayoutId: text("stripe_payout_id"),
  amount: integer("amount").notNull(), // cents - gross job amount
  platformFee: integer("platform_fee").notNull(), // cents
  netPayout: integer("net_payout").notNull(), // cents
  feeRate: real("fee_rate").notNull(), // e.g. 0.20
  instantPayout: boolean("instant_payout").default(false),
  instantFee: integer("instant_fee").default(0), // cents
  status: text("status").notNull().default("pending"), // pending | processing | paid | failed | reversed
  scheduledFor: text("scheduled_for"),
  paidAt: text("paid_at"),
  failureReason: text("failure_reason"),
  idempotencyKey: text("idempotency_key").notNull(),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const proPayoutsRelations = relations(proPayouts, ({ one }) => ({
  haulerProfile: one(haulerProfiles, {
    fields: [proPayouts.proId],
    references: [haulerProfiles.userId],
  }),
  serviceRequest: one(serviceRequests, {
    fields: [proPayouts.serviceRequestId],
    references: [serviceRequests.id],
  }),
}));

export const insertProPayoutSchema = createInsertSchema(proPayouts).omit({ id: true, createdAt: true });
export type InsertProPayout = z.infer<typeof insertProPayoutSchema>;
export type ProPayout = typeof proPayouts.$inferSelect;

// ==========================================
// Government Contract Management & Compliance
// ==========================================

export const governmentContracts = pgTable("government_contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  opportunityId: varchar("opportunity_id"),
  contractNumber: text("contract_number").notNull(),
  awardDate: text("award_date"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  contractType: text("contract_type").notNull().default("firm_fixed_price"), // firm_fixed_price|time_and_materials|cost_plus
  totalValue: integer("total_value").notNull().default(0), // cents
  fundedAmount: integer("funded_amount").notNull().default(0), // cents
  remainingBalance: integer("remaining_balance").notNull().default(0), // cents
  naicsCode: text("naics_code"),
  status: text("status").notNull().default("awarded"), // awarded|active|suspended|completed|closeout|closed
  agencyName: text("agency_name"),
  agencyCode: text("agency_code"),
  contractingOfficer: text("contracting_officer"),
  contractingOfficerEmail: text("contracting_officer_email"),
  contractingOfficerPhone: text("contracting_officer_phone"),
  performanceLocation: text("performance_location"),
  sdvosbSetAside: boolean("sdvosb_set_aside").default(false),
  smallBusinessSetAside: boolean("small_business_set_aside").default(false),
  prevailingWageDetermination: text("prevailing_wage_determination"),
  bondRequired: boolean("bond_required").default(false),
  bondAmount: integer("bond_amount").default(0), // cents
  insuranceMinimum: integer("insurance_minimum").default(0), // cents
  securityClearanceRequired: boolean("security_clearance_required").default(false),
  notes: text("notes"),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertGovernmentContractSchema = createInsertSchema(governmentContracts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertGovernmentContract = z.infer<typeof insertGovernmentContractSchema>;
export type GovernmentContract = typeof governmentContracts.$inferSelect;

export const contractMilestones = pgTable("contract_milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(),
  milestoneNumber: integer("milestone_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  deliverables: text("deliverables"),
  dueDate: text("due_date"),
  completedDate: text("completed_date"),
  status: text("status").notNull().default("pending"), // pending|in_progress|submitted|accepted|rejected
  paymentAmount: integer("payment_amount").default(0), // cents
  paymentStatus: text("payment_status").notNull().default("unbilled"), // unbilled|billed|paid
  invoiceId: varchar("invoice_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertContractMilestoneSchema = createInsertSchema(contractMilestones).omit({ id: true, createdAt: true });
export type InsertContractMilestone = z.infer<typeof insertContractMilestoneSchema>;
export type ContractMilestone = typeof contractMilestones.$inferSelect;

export const contractLaborEntries = pgTable("contract_labor_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(),
  milestoneId: varchar("milestone_id"),
  proId: varchar("pro_id").notNull(),
  workDate: text("work_date").notNull(),
  hoursWorked: real("hours_worked").notNull(),
  hourlyRate: integer("hourly_rate").notNull(), // cents
  prevailingWageRate: integer("prevailing_wage_rate"), // cents
  fringeBenefits: integer("fringe_benefits").default(0), // cents
  overtimeHours: real("overtime_hours").default(0),
  overtimeRate: integer("overtime_rate").default(0), // cents
  jobClassification: text("job_classification").notNull(),
  description: text("description"),
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  status: text("status").notNull().default("pending"), // pending|approved|disputed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertContractLaborEntrySchema = createInsertSchema(contractLaborEntries).omit({ id: true, createdAt: true });
export type InsertContractLaborEntry = z.infer<typeof insertContractLaborEntrySchema>;
export type ContractLaborEntry = typeof contractLaborEntries.$inferSelect;

export const certifiedPayrollReports = pgTable("certified_payroll_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(),
  weekEndingDate: text("week_ending_date").notNull(),
  reportNumber: integer("report_number").notNull(),
  preparedBy: varchar("prepared_by"),
  preparedAt: timestamp("prepared_at"),
  status: text("status").notNull().default("draft"), // draft|submitted|accepted|revision_required
  submittedAt: timestamp("submitted_at"),
  totalGrossWages: integer("total_gross_wages").default(0), // cents
  totalFringeBenefits: integer("total_fringe_benefits").default(0), // cents
  totalDeductions: integer("total_deductions").default(0), // cents
  totalNetPay: integer("total_net_pay").default(0), // cents
  wh347FormData: jsonb("wh347_form_data"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCertifiedPayrollReportSchema = createInsertSchema(certifiedPayrollReports).omit({ id: true, createdAt: true });
export type InsertCertifiedPayrollReport = z.infer<typeof insertCertifiedPayrollReportSchema>;
export type CertifiedPayrollReport = typeof certifiedPayrollReports.$inferSelect;

export const certifiedPayrollEntries = pgTable("certified_payroll_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  payrollReportId: varchar("payroll_report_id").notNull(),
  proId: varchar("pro_id").notNull(),
  proName: text("pro_name").notNull(),
  proAddress: text("pro_address"),
  proSSNLast4: text("pro_ssn_last4"), // encrypted
  jobClassification: text("job_classification").notNull(),
  hoursMonday: real("hours_monday").default(0),
  hoursTuesday: real("hours_tuesday").default(0),
  hoursWednesday: real("hours_wednesday").default(0),
  hoursThursday: real("hours_thursday").default(0),
  hoursFriday: real("hours_friday").default(0),
  hoursSaturday: real("hours_saturday").default(0),
  hoursSunday: real("hours_sunday").default(0),
  totalHours: real("total_hours").notNull().default(0),
  hourlyRate: integer("hourly_rate").notNull(), // cents
  grossPay: integer("gross_pay").notNull().default(0), // cents
  fringeBenefits: integer("fringe_benefits").default(0), // cents
  federalTax: integer("federal_tax").default(0), // cents
  stateTax: integer("state_tax").default(0), // cents
  socialSecurity: integer("social_security").default(0), // cents
  medicare: integer("medicare").default(0), // cents
  otherDeductions: integer("other_deductions").default(0), // cents
  netPay: integer("net_pay").notNull().default(0), // cents
  overtimeHours: real("overtime_hours").default(0),
  overtimeRate: integer("overtime_rate").default(0), // cents
});

export const insertCertifiedPayrollEntrySchema = createInsertSchema(certifiedPayrollEntries).omit({ id: true });
export type InsertCertifiedPayrollEntry = z.infer<typeof insertCertifiedPayrollEntrySchema>;
export type CertifiedPayrollEntry = typeof certifiedPayrollEntries.$inferSelect;

export const contractInvoices = pgTable("contract_invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(),
  milestoneId: varchar("milestone_id"),
  invoiceNumber: text("invoice_number").notNull(),
  invoicePeriodStart: text("invoice_period_start"),
  invoicePeriodEnd: text("invoice_period_end"),
  submittedDate: text("submitted_date"),
  status: text("status").notNull().default("draft"), // draft|submitted|under_review|approved|paid|disputed|rejected
  laborCost: integer("labor_cost").default(0), // cents
  materialsCost: integer("materials_cost").default(0), // cents
  equipmentCost: integer("equipment_cost").default(0), // cents
  subcontractorCost: integer("subcontractor_cost").default(0), // cents
  overhead: integer("overhead").default(0), // cents
  profit: integer("profit").default(0), // cents
  totalAmount: integer("total_amount").notNull().default(0), // cents
  paymentReceivedDate: text("payment_received_date"),
  paymentAmount: integer("payment_amount").default(0), // cents
  checkNumber: text("check_number"),
  eftNumber: text("eft_number"),
  promptPaymentInterest: integer("prompt_payment_interest").default(0), // cents
  notes: text("notes"),
  dueDate: text("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertContractInvoiceSchema = createInsertSchema(contractInvoices).omit({ id: true, createdAt: true });
export type InsertContractInvoice = z.infer<typeof insertContractInvoiceSchema>;
export type ContractInvoice = typeof contractInvoices.$inferSelect;

export const contractModifications = pgTable("contract_modifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(),
  modNumber: text("mod_number").notNull(),
  modType: text("mod_type").notNull(), // administrative|scope_change|funding|time_extension|termination
  description: text("description"),
  previousValue: integer("previous_value"), // cents
  newValue: integer("new_value"), // cents
  previousEndDate: text("previous_end_date"),
  newEndDate: text("new_end_date"),
  effectiveDate: text("effective_date"),
  signedDate: text("signed_date"),
  status: text("status").notNull().default("pending"), // pending|executed|rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertContractModificationSchema = createInsertSchema(contractModifications).omit({ id: true, createdAt: true });
export type InsertContractModification = z.infer<typeof insertContractModificationSchema>;
export type ContractModification = typeof contractModifications.$inferSelect;

export const contractComplianceDocs = pgTable("contract_compliance_docs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(),
  docType: text("doc_type").notNull(), // insurance_cert|bond|sdvosb_cert|sam_registration|w9|eeo_poster|drug_free_workplace|osha_log|safety_plan|quality_plan|past_performance
  fileName: text("file_name"),
  fileUrl: text("file_url"),
  expirationDate: text("expiration_date"),
  status: text("status").notNull().default("missing"), // current|expiring_soon|expired|missing
  uploadedAt: timestamp("uploaded_at"),
  verifiedBy: varchar("verified_by"),
  verifiedAt: timestamp("verified_at"),
  notes: text("notes"),
});

export const insertContractComplianceDocSchema = createInsertSchema(contractComplianceDocs).omit({ id: true });
export type InsertContractComplianceDoc = z.infer<typeof insertContractComplianceDocSchema>;
export type ContractComplianceDoc = typeof contractComplianceDocs.$inferSelect;

export const contractDailyLogs = pgTable("contract_daily_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(),
  logDate: text("log_date").notNull(),
  weather: text("weather"),
  temperature: text("temperature"),
  workPerformed: text("work_performed"),
  materialsUsed: text("materials_used"),
  equipmentUsed: text("equipment_used"),
  personnelOnSite: jsonb("personnel_on_site"), // [{proId, name, hoursWorked, classification}]
  visitorsOnSite: text("visitors_on_site"),
  safetyIncidents: text("safety_incidents"),
  delayReasons: text("delay_reasons"),
  photos: jsonb("photos"), // string[]
  preparedBy: varchar("prepared_by"),
  supervisorSignoff: varchar("supervisor_signoff"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertContractDailyLogSchema = createInsertSchema(contractDailyLogs).omit({ id: true, createdAt: true });
export type InsertContractDailyLog = z.infer<typeof insertContractDailyLogSchema>;
export type ContractDailyLog = typeof contractDailyLogs.$inferSelect;

export const prevailingWageRates = pgTable("prevailing_wage_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  wageDecisionNumber: text("wage_decision_number").notNull(),
  county: text("county"),
  state: text("state"),
  effectiveDate: text("effective_date"),
  expirationDate: text("expiration_date"),
  classification: text("classification").notNull(),
  baseRate: integer("base_rate").notNull(), // cents
  fringeBenefits: integer("fringe_benefits").notNull().default(0), // cents
  totalRate: integer("total_rate").notNull(), // cents
  overtimeRate: integer("overtime_rate").default(0), // cents
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPrevailingWageRateSchema = createInsertSchema(prevailingWageRates).omit({ id: true, createdAt: true });
export type InsertPrevailingWageRate = z.infer<typeof insertPrevailingWageRateSchema>;
export type PrevailingWageRate = typeof prevailingWageRates.$inferSelect;

export const contractAuditLogs = pgTable("contract_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(), // contract|milestone|labor|payroll|invoice|modification|compliance|daily_log
  entityId: varchar("entity_id"),
  userId: varchar("user_id"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ContractAuditLog = typeof contractAuditLogs.$inferSelect;

// ==========================================
// FLAT-RATE WORK ORDER SYSTEM
// Replaces hourly labor entry flow for government contracts.
// Pros quote flat prices per job/deliverable. ZERO hourly language.
// ==========================================

export const contractWorkOrders = pgTable("contract_work_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(),
  milestoneId: varchar("milestone_id"),
  title: text("title").notNull(),
  description: text("description"),
  scopeOfWork: text("scope_of_work"),
  serviceType: text("service_type"),
  deliverables: text("deliverables"), // what defines "done"
  location: text("location"),
  requiredCertifications: jsonb("required_certifications").$type<string[]>().default(sql`'[]'::jsonb`),
  status: text("status").notNull().default("draft"), // draft|posted|quoted|assigned|in_progress|completed|verified
  budgetAmount: integer("budget_amount").default(0), // cents — internal max budget, NOT shown to pro
  postedAt: timestamp("posted_at"),
  deadline: text("deadline"),
  assignedProId: varchar("assigned_pro_id"),
  acceptedQuoteAmount: integer("accepted_quote_amount").default(0), // cents — flat price the pro quoted
  completedAt: timestamp("completed_at"),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: varchar("verified_by"),
  paymentStatus: text("payment_status").notNull().default("unpaid"), // unpaid|partial|paid
  // 50/50 split payment fields
  upfrontPaymentAmount: integer("upfront_payment_amount").default(0), // cents
  upfrontPaymentStatus: text("upfront_payment_status").notNull().default("pending"), // pending|processing|paid|failed
  upfrontPaymentTransferId: text("upfront_payment_transfer_id"),
  upfrontPaidAt: timestamp("upfront_paid_at"),
  completionPaymentAmount: integer("completion_payment_amount").default(0), // cents
  completionPaymentStatus: text("completion_payment_status").notNull().default("pending"), // pending|processing|paid|failed
  completionPaymentTransferId: text("completion_payment_transfer_id"),
  completionPaidAt: timestamp("completion_paid_at"),
  paymentSplit: text("payment_split").notNull().default("50_50"), // 50_50 — future flexibility
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertContractWorkOrderSchema = createInsertSchema(contractWorkOrders).omit({ id: true, createdAt: true });
export type InsertContractWorkOrder = z.infer<typeof insertContractWorkOrderSchema>;
export type ContractWorkOrder = typeof contractWorkOrders.$inferSelect;

export const workOrderQuotes = pgTable("work_order_quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workOrderId: varchar("work_order_id").notNull(),
  proId: varchar("pro_id").notNull(),
  quoteAmount: integer("quote_amount").notNull(), // cents — flat price for the entire job
  estimatedDays: integer("estimated_days"), // scheduling estimate, NOT for billing
  message: text("message"), // pro explains their quote
  status: text("status").notNull().default("submitted"), // submitted|accepted|declined|withdrawn
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWorkOrderQuoteSchema = createInsertSchema(workOrderQuotes).omit({ id: true, createdAt: true });
export type InsertWorkOrderQuote = z.infer<typeof insertWorkOrderQuoteSchema>;
export type WorkOrderQuote = typeof workOrderQuotes.$inferSelect;

export const contractWorkLogs = pgTable("contract_work_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(),
  workOrderId: varchar("work_order_id"),
  milestoneId: varchar("milestone_id"),
  proId: varchar("pro_id").notNull(),
  workDate: text("work_date").notNull(),
  description: text("description"), // what was done — documentation, not billing
  photos: jsonb("photos").$type<string[]>().default(sql`'[]'::jsonb`),
  status: text("status").notNull().default("pending"), // pending|approved
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertContractWorkLogSchema = createInsertSchema(contractWorkLogs).omit({ id: true, createdAt: true });
export type InsertContractWorkLog = z.infer<typeof insertContractWorkLogSchema>;
export type ContractWorkLog = typeof contractWorkLogs.$inferSelect;

// ==========================================
// Government Float Ledger — append-only cash flow tracking
// ==========================================
export const governmentFloatLedger = pgTable("government_float_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(),
  workOrderId: varchar("work_order_id"),
  entryType: text("entry_type").notNull(), // upfront_paid|completion_paid|government_payment_received|adjustment
  amount: integer("amount").notNull(), // cents — positive = cash out, negative = cash in
  balanceAfter: integer("balance_after").notNull(), // cents — running float exposure
  description: text("description"),
  stripeTransferId: text("stripe_transfer_id"),
  stripePaymentId: text("stripe_payment_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type GovernmentFloatLedgerEntry = typeof governmentFloatLedger.$inferSelect;

// ==========================================
// Government Float Settings — threshold configuration
// ==========================================
export const governmentFloatSettings = pgTable("government_float_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  maxFloatExposure: integer("max_float_exposure").notNull().default(50000000), // cents — alert threshold ($500k default)
  alertEmail: text("alert_email"),
  alertSms: text("alert_sms"),
  autoHoldThreshold: integer("auto_hold_threshold").notNull().default(100000000), // cents — stop posting ($1M default)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type GovernmentFloatSettings = typeof governmentFloatSettings.$inferSelect;
