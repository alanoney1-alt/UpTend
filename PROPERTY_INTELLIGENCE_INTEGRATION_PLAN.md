# Property Intelligence Layer - Integration Plan

**Status:** Schema Conflict Detected - Requires Manual Review
**Date:** February 9, 2026

---

## 🚨 Schema Conflict Detected

The Property Intelligence Layer schema includes a `properties` table that conflicts with an existing table at line 2157 of `schema.ts`.

### Existing `properties` Table (Minimal)
```typescript
// Line 2157 - Simple property tracking
export const properties = pgTable("properties", {
  id: varchar("id"),
  addressHash: varchar("address_hash").unique(),
  fullAddress: text("full_address"),
  ownerId: varchar("owner_id"),
  maintenanceScore: integer("maintenance_score"),
  lastAssessmentDate: text("last_assessment_date"),
  estimatedValueIncrease: integer("estimated_value_increase"),
});
```

### Proposed `properties` Table (Comprehensive)
The Property Intelligence Layer includes a **comprehensive** properties table with:
- 60+ fields for complete property tracking
- Property Health Score (the "credit score for homes")
- Appliance registry linkage
- Warranty tracking
- Insurance integration
- DwellScan history
- Builder partnership data

---

## 📋 Integration Options

### Option 1: Enhance Existing Table (RECOMMENDED)
**Migrate existing `properties` to comprehensive Property Intelligence schema**

**Pros:**
- Single source of truth
- Backward compatible (keep existing fields)
- Clean architecture

**Cons:**
- Requires data migration
- Need to update existing code referencing `properties`

**Steps:**
1. Rename existing `properties` to `properties_old` (temporary)
2. Create new comprehensive `properties` table
3. Migrate data from `properties_old` to `properties`
4. Update existing code references
5. Drop `properties_old` after verification

### Option 2: Rename Property Intelligence Tables
**Use different table names (e.g., `home_properties`, `customer_properties`)**

**Pros:**
- No conflicts
- Existing code unchanged
- Faster to implement

**Cons:**
- Two property tables (confusing)
- Data fragmentation
- Not scalable long-term

### Option 3: Merge and Extend
**Extend existing `properties` with new columns in place**

**Pros:**
- No table rename needed
- Preserves existing data
- Gradual migration possible

**Cons:**
- Schema gets very large
- Need to add 50+ new columns

---

## ✅ RECOMMENDED APPROACH: Option 3 (Merge and Extend)

Add Property Intelligence fields to the **existing** `properties` table as new optional columns.

### Migration Script

```sql
-- Step 1: Add Property Intelligence columns to existing properties table
ALTER TABLE properties
ADD COLUMN unit TEXT,
ADD COLUMN city TEXT,
ADD COLUMN state TEXT,
ADD COLUMN zip_code TEXT,
ADD COLUMN county TEXT,
ADD COLUMN latitude REAL,
ADD COLUMN longitude REAL,
ADD COLUMN property_type TEXT DEFAULT 'single_family',
ADD COLUMN year_built INTEGER,
ADD COLUMN sqft INTEGER,
ADD COLUMN lot_size_sqft INTEGER,
ADD COLUMN bedrooms INTEGER,
ADD COLUMN bathrooms REAL,
ADD COLUMN stories INTEGER,
ADD COLUMN garage_type TEXT,
ADD COLUMN has_pool BOOLEAN DEFAULT false,
ADD COLUMN pool_type TEXT,
ADD COLUMN roof_type TEXT,
ADD COLUMN roof_age_years INTEGER,
ADD COLUMN exterior_type TEXT,
ADD COLUMN hvac_type TEXT,
ADD COLUMN hvac_age_years INTEGER,
-- Property Health Scores
ADD COLUMN property_health_score REAL,
ADD COLUMN health_score_updated_at TEXT,
ADD COLUMN health_score_history JSONB,
ADD COLUMN health_score_roof REAL,
ADD COLUMN health_score_hvac REAL,
ADD COLUMN health_score_exterior REAL,
ADD COLUMN health_score_interior REAL,
ADD COLUMN health_score_landscape REAL,
ADD COLUMN health_score_pool REAL,
ADD COLUMN health_score_appliances REAL,
ADD COLUMN health_score_maintenance REAL,
-- DwellScan linkage
ADD COLUMN initial_scan_id VARCHAR,
ADD COLUMN last_scan_id VARCHAR,
ADD COLUMN total_scans INTEGER DEFAULT 0,
-- Aggregated stats
ADD COLUMN total_jobs_completed INTEGER DEFAULT 0,
ADD COLUMN total_spent REAL DEFAULT 0,
ADD COLUMN last_service_date TEXT,
ADD COLUMN active_warranty_count INTEGER DEFAULT 0,
ADD COLUMN expiring_warranty_count INTEGER DEFAULT 0,
-- Source tracking
ADD COLUMN source TEXT DEFAULT 'organic',
ADD COLUMN builder_partnership_id VARCHAR,
ADD COLUMN realtor_referral_code VARCHAR,
ADD COLUMN move_in_date TEXT,
ADD COLUMN is_primary_residence BOOLEAN DEFAULT true,
-- Status
ADD COLUMN status TEXT DEFAULT 'active',
ADD COLUMN onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN onboarding_completed_at TEXT,
ADD COLUMN onboarding_step INTEGER DEFAULT 0,
ADD COLUMN updated_at TEXT DEFAULT now();

-- Step 2: Update existing records with defaults
UPDATE properties SET
  property_type = 'single_family',
  status = 'active',
  source = 'organic',
  is_primary_residence = true
WHERE property_type IS NULL;
```

### Updated Schema Definition (Replace existing properties table)

```typescript
export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Keep existing fields for backward compatibility
  addressHash: varchar("address_hash").unique(),
  fullAddress: text("full_address"),
  ownerId: varchar("owner_id"),
  maintenanceScore: integer("maintenance_score").default(0),
  lastAssessmentDate: text("last_assessment_date"),
  estimatedValueIncrease: integer("estimated_value_increase").default(0),

  // NEW: Property Intelligence fields
  unit: text("unit"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  county: text("county"),
  latitude: real("latitude"),
  longitude: real("longitude"),
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

  // Property Health Scores
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

  // Stats
  totalJobsCompleted: integer("total_jobs_completed").default(0),
  totalSpent: real("total_spent").default(0),
  lastServiceDate: text("last_service_date"),
  activeWarrantyCount: integer("active_warranty_count").default(0),
  expiringWarrantyCount: integer("expiring_warranty_count").default(0),

  // Source
  source: text("source").default("organic"),
  builderPartnershipId: varchar("builder_partnership_id"),
  realtorReferralCode: varchar("realtor_referral_code"),
  moveInDate: text("move_in_date"),
  isPrimaryResidence: boolean("is_primary_residence").default(true),

  // Status
  status: text("status").default("active"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  onboardingCompletedAt: text("onboarding_completed_at"),
  onboardingStep: integer("onboarding_step").default(0),
  createdAt: text("created_at").notNull().default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});
```

---

## 📦 New Tables to Add (No Conflicts)

These tables can be added immediately without conflicts:

1. ✅ **property_appliances** - Appliance registry
2. ✅ **property_warranties** - Warranty tracker
3. ✅ **property_insurance** - Insurance policies
4. ✅ **property_health_events** - Timeline/"Carfax"
5. ✅ **property_maintenance_schedule** - Maintenance cadence
6. ✅ **builder_partnerships** - Builder partnerships
7. ✅ **insurance_partners** - Insurance partners
8. ✅ **property_documents** - Document storage
9. ✅ **notification_queue** - Notification engine

**Complete schema:** See `/shared/property-intelligence-schema.ts`

---

## 🚀 Implementation Steps

### Phase 1: Add Non-Conflicting Tables
```bash
# 1. Copy property-intelligence-schema.ts tables to schema.ts
#    (Skip the properties table for now)

# 2. Run migration
npm run db:push
```

### Phase 2: Enhance Existing Properties Table
```bash
# 1. Apply ALTER TABLE migration (see SQL above)
# 2. Update schema.ts properties definition
# 3. Run migration
npm run db:push
```

### Phase 3: Create Storage Layer
- `/server/storage/domains/properties/storage.ts`
- Property CRUD operations
- Appliance, warranty, insurance management
- Health event tracking

### Phase 4: Create API Routes
- `/server/routes/properties/property.routes.ts`
- `/server/routes/properties/appliances.routes.ts`
- `/server/routes/properties/warranties.routes.ts`
- `/server/routes/properties/insurance.routes.ts`

### Phase 5: Create Services
- `/server/services/property-health-calculator.ts`
- `/server/services/warranty-alert-engine.ts`
- `/server/services/maintenance-scheduler.ts`
- `/server/services/notification-engine.ts`

### Phase 6: Create UI Components
- `/client/src/pages/property-dashboard.tsx`
- `/client/src/components/property/property-health-score.tsx`
- `/client/src/components/property/appliance-registry.tsx`
- `/client/src/components/property/warranty-tracker.tsx`
- `/client/src/components/property/maintenance-calendar.tsx`

---

## 🎯 Next Steps

**DECISION REQUIRED:**

1. **Review Options Above** - Which integration approach?
2. **Confirm Existing Table Usage** - Is the current `properties` table actively used?
3. **Choose Migration Strategy** - Option 1, 2, or 3?

**Recommended:** Option 3 (Merge and Extend) for cleanest long-term architecture.

---

## 📚 Reference Files

- **Complete Schema:** `/shared/property-intelligence-schema.ts`
- **This Plan:** `/PROPERTY_INTELLIGENCE_INTEGRATION_PLAN.md`
- **ESG Implementation:** `/COMPLETE_IMPLEMENTATION_SUMMARY.md`

**Status:** ⏸️ PAUSED - Awaiting integration decision
