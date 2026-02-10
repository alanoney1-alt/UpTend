# Phase 1 Verification Checklist

Use this checklist to verify the Phase 1 implementation is working correctly.

---

## ✅ Database Schema Verification

### 1. Tables Created
- [ ] Open Drizzle Studio: `npm run db:studio`
- [ ] Verify `service_esg_metrics` table exists
- [ ] Verify `business_team_members` table exists
- [ ] Check that both tables have proper indexes

### 2. Schema Fields
Navigate to `service_esg_metrics` table:
- [ ] Verify `id` (VARCHAR primary key)
- [ ] Verify `service_request_id` (VARCHAR)
- [ ] Verify `service_type` (TEXT)
- [ ] Verify water fields: `water_used_gallons`, `water_saved_gallons`
- [ ] Verify energy fields: `energy_used_kwh`, `energy_saved_kwh`
- [ ] Verify chemical fields: `chemical_used_oz`, `chemical_type`
- [ ] Verify CO2 fields: `total_co2_saved_lbs`, `net_co2_impact_lbs`
- [ ] Verify `esg_score` (REAL)
- [ ] Verify `calculation_method` (TEXT)

Navigate to `business_team_members` table:
- [ ] Verify `id` (VARCHAR primary key)
- [ ] Verify `business_account_id` (VARCHAR)
- [ ] Verify `user_id` (VARCHAR)
- [ ] Verify `role` (TEXT)
- [ ] Verify permission fields: `can_view_financials`, `can_manage_team`, etc.
- [ ] Verify invitation fields: `invitation_token`, `invitation_status`

---

## ✅ Data Migration Verification

### 1. Run Migration Script
```bash
npx tsx server/scripts/migrate-business-accounts-to-teams.ts
```

### 2. Verify Results
- [ ] Script completes without errors
- [ ] Migration summary shows count of migrated accounts
- [ ] Check `business_team_members` table in Drizzle Studio
- [ ] Verify each business account has a corresponding team member with:
  - [ ] `role = "owner"`
  - [ ] `invitation_status = "accepted"`
  - [ ] All permissions set to `true`
  - [ ] `is_active = true`

### 3. Check for Edge Cases
- [ ] No duplicate team members for same user + business
- [ ] All existing `businessAccounts.userId` values have team member entries

---

## ✅ ESG Calculator Verification

### 1. Pressure Washing Calculator

**Test 1: Basic Calculation**
```bash
curl -X POST http://localhost:5000/api/esg/calculate/pressure-washing \
  -H "Content-Type: application/json" \
  -d '{
    "sqft": 1000,
    "durationMinutes": 60,
    "actualGPM": 2.0
  }'
```

Verify response:
- [ ] `success: true`
- [ ] `totalCo2SavedLbs > 0`
- [ ] `waterSavedGallons > 0`
- [ ] `esgScore` between 0-100
- [ ] `breakdown` object populated
- [ ] `calculationMethod` contains "EPA"

**Test 2: Eco-Friendly Chemicals**
```bash
curl -X POST http://localhost:5000/api/esg/calculate/pressure-washing \
  -H "Content-Type: application/json" \
  -d '{
    "sqft": 1000,
    "durationMinutes": 60,
    "actualGPM": 2.0,
    "chemicalType": "eco_friendly",
    "waterReclamation": true
  }'
```

Verify:
- [ ] ESG score is higher than Test 1
- [ ] `breakdown.chemicalScore` reflects eco bonus
- [ ] `waterSavedGallons` includes reclamation bonus

### 2. Gutter Cleaning Calculator

**Test 1: Composted Disposal**
```bash
curl -X POST http://localhost:5000/api/esg/calculate/gutter-cleaning \
  -H "Content-Type: application/json" \
  -d '{
    "linearFeet": 200,
    "debrisDisposalMethod": "composted",
    "stormPreventionCredit": true
  }'
```

Verify:
- [ ] `totalCo2SavedLbs > 0`
- [ ] `breakdown.stormPreventionCreditLbs = 50`
- [ ] `breakdown.totalDebrisLbs = 100` (200 ft × 0.5)
- [ ] `esgScore` is high (>70)

**Test 2: Landfilled Disposal**
```bash
curl -X POST http://localhost:5000/api/esg/calculate/gutter-cleaning \
  -H "Content-Type: application/json" \
  -d '{
    "linearFeet": 200,
    "debrisDisposalMethod": "landfilled"
  }'
```

Verify:
- [ ] ESG score is lower than Test 1
- [ ] `breakdown.co2SavedFromComposting = 0`

### 3. Pool Cleaning Calculator

**Test 1: Chemical Optimization**
```bash
curl -X POST http://localhost:5000/api/esg/calculate/pool-cleaning \
  -H "Content-Type: application/json" \
  -d '{
    "poolSizeGallons": 20000,
    "chemicalOptimizationPct": 30
  }'
```

Verify:
- [ ] `totalCo2SavedLbs > 0`
- [ ] `breakdown.chemicalScore = 30`
- [ ] `esgScore > 0`

**Test 2: Leak Detection**
```bash
curl -X POST http://localhost:5000/api/esg/calculate/pool-cleaning \
  -H "Content-Type: application/json" \
  -d '{
    "poolSizeGallons": 20000,
    "leakDetected": true,
    "leakGallonsPerDaySaved": 10,
    "filterEfficiencyImprovement": true
  }'
```

Verify:
- [ ] `waterSavedGallons = 300` (10 × 30 days)
- [ ] `energySavedKwh > 0`
- [ ] `breakdown.filterEnergySavedKwh > 0`

### 4. Batch Calculation

```bash
curl -X POST http://localhost:5000/api/esg/calculate/batch \
  -H "Content-Type: application/json" \
  -d '{
    "calculations": [
      {
        "serviceType": "pressure_washing",
        "params": {"sqft": 1000, "durationMinutes": 60, "actualGPM": 2.0}
      },
      {
        "serviceType": "gutter_cleaning",
        "params": {"linearFeet": 200}
      }
    ]
  }'
```

Verify:
- [ ] `results` array has 2 elements
- [ ] Both have `success: true`
- [ ] Each has valid `calculation` object

---

## ✅ Service Metrics API Verification

### 1. Create Service ESG Metrics

**Note:** Requires authentication token. Replace `YOUR_TOKEN` with a valid JWT.

```bash
curl -X POST http://localhost:5000/api/esg/service-metrics \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceRequestId": "test-sr-001",
    "serviceType": "pressure_washing",
    "calculationParams": {
      "sqft": 1000,
      "durationMinutes": 60,
      "actualGPM": 2.0,
      "chemicalType": "eco_friendly"
    }
  }'
```

Verify response:
- [ ] `success: true`
- [ ] `metrics` object returned with database ID
- [ ] `calculation` object matches calculator output
- [ ] Check database: new row in `service_esg_metrics`

### 2. Retrieve Service ESG Metrics

```bash
curl -X GET http://localhost:5000/api/esg/service-metrics/test-sr-001 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Verify:
- [ ] Returns metrics created in step 1
- [ ] `calculationDetails` is parsed JSON
- [ ] All fields match creation request

### 3. Aggregate by Service Type

```bash
curl -X GET "http://localhost:5000/api/esg/service-types/pressure_washing/aggregate" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Verify:
- [ ] `aggregate` object with totals
- [ ] `totalJobs >= 1`
- [ ] `totalCo2SavedLbs > 0`
- [ ] `metrics` array includes test record

---

## ✅ Team Management API Verification

### 1. Invite Team Member

```bash
curl -X POST http://localhost:5000/api/business/YOUR_BUSINESS_ID/team/invite \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newmember@example.com",
    "role": "admin",
    "permissions": {
      "canViewFinancials": true,
      "canManageTeam": true,
      "canCreateJobs": true,
      "canAccessEsgReports": true
    }
  }'
```

Verify response:
- [ ] `success: true`
- [ ] `teamMember` object with invitation details
- [ ] `invitationUrl` present
- [ ] `invitation_token` present
- [ ] Check database: new row in `business_team_members` with `invitation_status = "pending"`

### 2. List Team Members

```bash
curl -X GET http://localhost:5000/api/business/YOUR_BUSINESS_ID/team \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Verify:
- [ ] `teamMembers` array returned
- [ ] Includes migrated owner
- [ ] Includes pending invitation from step 1
- [ ] Each member has role and permissions

### 3. Update Team Member Permissions

```bash
curl -X PATCH http://localhost:5000/api/business/YOUR_BUSINESS_ID/team/MEMBER_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permissions": {
      "canViewFinancials": false,
      "canManageTeam": false
    }
  }'
```

Verify:
- [ ] Updated permissions reflected in response
- [ ] Check database: permissions updated

### 4. Accept Invitation

```bash
curl -X POST http://localhost:5000/api/business/team/accept-invitation \
  -H "Authorization: Bearer INVITED_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invitationToken": "TOKEN_FROM_STEP_1"
  }'
```

Verify:
- [ ] `success: true`
- [ ] `invitation_status = "accepted"`
- [ ] `is_active = true`
- [ ] `user_id` populated

### 5. Remove Team Member

```bash
curl -X DELETE http://localhost:5000/api/business/YOUR_BUSINESS_ID/team/MEMBER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Verify:
- [ ] Success response
- [ ] Check database: `is_active = false`

---

## ✅ Unit Tests Verification

### Run Test Suite

```bash
npm test server/tests/service-esg-calculators.test.ts
```

Verify:
- [ ] All tests pass (20+ tests)
- [ ] No TypeScript compilation errors
- [ ] Test coverage includes:
  - [ ] Pressure washing calculator
  - [ ] Gutter cleaning calculator
  - [ ] Pool cleaning calculator
  - [ ] Service router
  - [ ] ESG score bounds (0-100)
  - [ ] Required fields present

---

## ✅ Documentation Verification

### Files Present
- [ ] `/docs/PHASE_1_IMPLEMENTATION_SUMMARY.md` exists
- [ ] `/docs/SERVICE_ESG_QUICK_START.md` exists
- [ ] `/IMPLEMENTATION_STATUS.md` exists
- [ ] `/README_PHASE_1.md` exists
- [ ] `/PHASE_1_VERIFICATION_CHECKLIST.md` (this file) exists

### Documentation Quality
- [ ] All formulas documented with EPA sources
- [ ] API endpoints have examples
- [ ] Quick start guide includes curl commands
- [ ] Next steps clearly outlined

---

## ✅ Code Quality Verification

### TypeScript Compilation
- [ ] No new TypeScript errors introduced
- [ ] All imports resolve correctly
- [ ] Types properly exported from schema

### Code Organization
- [ ] Routes properly registered in `/server/routes/index.ts`
- [ ] Storage methods exported from storage classes
- [ ] Calculators follow consistent pattern

### Best Practices
- [ ] All async functions handle errors
- [ ] Database queries use indexed fields
- [ ] API responses follow consistent format
- [ ] Comments explain complex calculations

---

## ✅ Performance Verification

### Calculation Speed
- [ ] Pressure washing calculation: <50ms
- [ ] Gutter cleaning calculation: <50ms
- [ ] Pool cleaning calculation: <50ms
- [ ] Batch calculation (3 services): <200ms

### Database Performance
- [ ] Create service ESG metrics: <100ms
- [ ] Get by service request: <50ms
- [ ] Aggregate by service type: <200ms (for 100 records)

---

## 🎯 Final Sign-Off

**Phase 1 Implementation Complete When:**
- [ ] All database schema checks pass ✅
- [ ] Data migration successful ✅
- [ ] All 3 ESG calculators operational ✅
- [ ] All API endpoints tested ✅
- [ ] Team management working ✅
- [ ] Unit tests pass ✅
- [ ] Documentation complete ✅
- [ ] Performance acceptable ✅

**Approved By:** _________________

**Date:** _________________

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## 🚀 Ready for Phase 2!

Once all checks pass, proceed to Phase 2: Multi-User B2B UI implementation.

See `/IMPLEMENTATION_STATUS.md` for Phase 2 requirements.
