# Named Packages (Marketing Layer)

**Status:** ✅ Complete (Task #69)

Pre-configured service bundles with catchy names to increase cart size and simplify booking.

---

## Available Packages

### 1. The Refresh ⭐ Most Popular
- **Services:** PolishUp™ + FreshWash™
- **Price:** $299 - $549
- **Savings:** 10% off
- **Ideal for:** Spring refresh, preparing to sell, getting ready for guests

### 2. The Curb Appeal
- **Services:** FreshWash™ + GutterFlush™ + YardPro™ (optional)
- **Price:** $369 - $619
- **Savings:** 10% off, save up to $60
- **Ideal for:** Listing home, HOA compliance, seasonal maintenance
- **Badge:** Spring Special

### 3. The Move-Out ⭐ Most Popular
- **Services:** PolishUp™ (move-out) + BulkSnap™ + FreshWash™ (optional)
- **Price:** $549 - $899
- **Savings:** 10-15% off, save up to $130
- **Ideal for:** Moving out of rental, getting deposit back

### 4. The Full Reset
- **Services:** DwellScan™ Aerial + PolishUp™ Deep + All others optional
- **Price:** $799 - $1,499
- **Savings:** 15% off + $49 DwellScan credit, save up to $270
- **Ideal for:** New homeowners, major renovation prep

### 5. The Mover's Bundle
- **Services:** LiftCrew™ + BulkSnap™ (optional) + PolishUp™ (optional)
- **Price:** $419 - $899
- **Savings:** 10% off, save up to $90
- **Ideal for:** Moving day, loading/unloading

### 6. The Landlord Special
- **Services:** PolishUp™ (move-out) + BulkSnap™ + FixIt™ (optional)
- **Price:** $499 - $849
- **Savings:** 10% off + PM tier discount if applicable
- **Ideal for:** Property managers, between tenants

### 7. The Seasonal Prep
- **Services:** GutterFlush™ + FreshWash™ + AirCare™ (optional)
- **Price:** $369 - $619
- **Savings:** 10% off
- **Ideal for:** Fall prep, spring cleaning, storm preparation
- **Badge:** Fall Special

### 8. The Party Ready
- **Services:** PolishUp™ Deep + FreshWash™ (optional) + BulkSnap™ (optional)
- **Price:** $349 - $749
- **Savings:** 10-15% off, save up to $110
- **Ideal for:** Hosting events, holiday parties

---

## Implementation

**Files:**
- Package definitions: `/client/src/lib/named-packages.ts`
- UI component: `/client/src/components/packages/package-selector.tsx`

**Usage:**
```tsx
<PackageSelector
  onSelectPackage={(packageId, selectedServices) => {
    // Navigate to booking with pre-selected services
    navigateToBooking(packageId, selectedServices);
  }}
  showPopularOnly={false}
/>
```

---

## Features

- ✅ 8 pre-configured packages
- ✅ Required vs optional services
- ✅ Customization dialog
- ✅ Auto-applies multi-service discounts
- ✅ Seasonal badges
- ✅ Popularity indicators
- ✅ Use-case recommendations

**Completed:** Task #69 ✅
**Next:** Task #70 - Multi-Pro job coordination
