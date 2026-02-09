import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Re-export auth models (users and sessions tables)
export * from "./models/auth";

// Import users for relations and User type for composite types
import { users, type User } from "./models/auth";

export const userRoleEnum = z.enum(["customer", "hauler", "admin"]);
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
  serviceTypes: text("service_types").array().default(sql`ARRAY['junk_removal', 'furniture_moving', 'garage_cleanout', 'estate_cleanout']::text[]`),
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
  supportedServices: jsonb("supported_services").default(["junk_removal"]),
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
  // 60-second matching timer fields
  matchingStartedAt: text("matching_started_at"), // When matching countdown began
  matchingExpiresAt: text("matching_expires_at"), // When the 60 seconds expire
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
  insuranceProvider: text("insurance_provider").default("uPYCK_Blanket"),
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
export type ServiceRequestWithDetails = ServiceRequest & { 
  customer?: User;
  hauler?: HaulerWithProfileAndVehicle;
  matches?: MatchAttempt[];
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
}));

export const insertBusinessAccountSchema = createInsertSchema(businessAccounts).omit({ id: true });
export type InsertBusinessAccount = z.infer<typeof insertBusinessAccountSchema>;
export type BusinessAccount = typeof businessAccounts.$inferSelect;

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
  addressHash: varchar("address_hash").unique(),
  fullAddress: text("full_address"),
  ownerId: varchar("owner_id"),
  maintenanceScore: integer("maintenance_score").default(0),
  lastAssessmentDate: text("last_assessment_date"),
  estimatedValueIncrease: integer("estimated_value_increase").default(0),
});

export const propertiesRelations = relations(properties, ({ one }) => ({
  owner: one(users, {
    fields: [properties.ownerId],
    references: [users.id],
  }),
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
  documentUrl: text("document_url"), // Scanned violation letter
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
  communicationType: text("communication_type"), // Type of communication
  method: text("method"), // Method used (alias for channel)
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
