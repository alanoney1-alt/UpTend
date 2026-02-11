# Error Handling Audit

**Last Updated:** 2026-02-09
**Status:** In Progress

## Overview

This document tracks promise chains and async operations that need improved error handling across the UpTend codebase.

---

## 🔴 CRITICAL - Unhandled Promises Outside React Query

These promise chains are NOT protected by React Query's automatic error handling and can cause silent failures or unhandled rejections.

### 1. Stripe Initialization ✅ FIXED
**File:** `/client/src/pages/payment-setup.tsx:174`
**Issue:** `getStripe().then(setStripeInstance)` has no `.catch()`
**Impact:** If Stripe fails to load, the error is unhandled and payment setup silently breaks
**Status:** FIXED - Added `.catch()` handler with toast notification

### 2. Browser Notification Permission ✅ FIXED
**File:** `/client/src/pages/tracking.tsx:373`
**Issue:** `Notification.requestPermission().then()` has no `.catch()`
**Impact:** If permission request fails (rare but possible), error is unhandled
**Status:** FIXED - Added `.catch()` handler with console.warn (silent fail)

### 3. Service Worker Registration ✅ ALREADY GOOD
**File:** `/client/public/sw.js`
**Issue:** NONE - All fetch() chains already have `.catch()` handlers
**Status:** VERIFIED - Service worker properly handles all errors

---

## 🟡 MEDIUM PRIORITY - React Query queryFn Patterns

These `.then()` chains are inside React Query's `queryFn`, which means errors ARE caught and handled by React Query (put into `error` state). However, they could be improved for better debugging and consistency.

### Pattern Found in These Files:
- `/client/src/pages/booking.tsx` (lines 636-637, 775-776)
- `/client/src/pages/active-job.tsx` (lines 16, 23)
- `/client/src/pages/referral-landing.tsx` (lines 29-30)
- `/client/src/pages/hauler-dashboard.tsx` (line 1959)
- `/client/src/components/carbon-dispatcher.tsx` (line 41)
- `/client/src/components/green-verified-receipt.tsx` (line 77)
- `/client/src/components/circular-economy-agent.tsx` (line 57)
- `/client/src/components/dispute-resolution.tsx` (line 128)
- `/client/src/components/safety-copilot.tsx` (line 33)
- `/client/src/components/esg-impact-dashboard.tsx` (lines 46, 55)
- `/client/src/components/compliance-vault.tsx` (lines 82, 87, 92)
- `/client/src/components/scope3-esg-report.tsx` (line 44)
- `/client/src/components/verification-gates.tsx` (line 48)

**Current Pattern:**
```typescript
queryFn: () => fetch('/api/endpoint')
  .then(r => r.json())
```

**Recommended Pattern (for better error messages):**
```typescript
queryFn: async () => {
  const res = await fetch('/api/endpoint');
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
}
```

**Why?**
- Current pattern: React Query catches errors but error messages are generic ("Failed to fetch")
- Recommended: Provides detailed error messages from backend (e.g., "User not found", "Invalid token")
- React Query still handles the thrown errors properly

**Status:** NOT URGENT - React Query handles these, but improvement would help debugging

---

## 🟢 LOW PRIORITY - Already Handled Correctly

### Server-Side Error Handling
Most server routes already use `asyncHandler` wrapper or try/catch blocks:
```typescript
app.get('/api/example', asyncHandler(async (req, res) => {
  // Errors caught by asyncHandler
}));
```

### Notification Service
All async functions in `/server/services/notifications.ts` have proper try/catch blocks and return error objects:
```typescript
export async function sendEmail(...): Promise<{ success: boolean; error?: string }> {
  try {
    await sgMail.send(...);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

---

## Implementation Plan

### Phase 1: Fix Critical Issues ✅ COMPLETED
- [x] Add error handling to `getStripe().then()` in payment-setup.tsx
- [x] Add error handling to `Notification.requestPermission().then()` in tracking.tsx
- [x] Audit and fix service worker fetch chains in sw.js (already had proper error handling)

### Phase 2: Improve React Query Patterns (NEXT SPRINT)
- [ ] Create `apiRequest` utility function with proper error parsing
- [ ] Refactor 20+ React Query queryFn instances to use async/await
- [ ] Add detailed error messages from backend responses

### Phase 3: Add Error Boundaries (FUTURE)
- [ ] Create React Error Boundary components for each major section
- [ ] Add fallback UIs for failed data fetches
- [ ] Implement error reporting to logging service (Sentry/LogRocket)

---

## Best Practices

### DO:
✅ Use async/await instead of .then() chains (more readable)
✅ Always add .catch() to promises outside React Query
✅ Throw errors in React Query queryFn for proper error state
✅ Log errors with context (what failed, why, how to recover)
✅ Return structured error objects from API: `{ success: boolean; error?: string; data?: T }`

### DON'T:
❌ Leave .then() chains without .catch() outside React Query
❌ Swallow errors silently (always log or surface to user)
❌ Use generic error messages ("Something went wrong")
❌ Forget to check res.ok before calling res.json()

---

## Metrics

| Category | Count | Status |
|----------|-------|--------|
| Critical unhandled promises | 0 | 🟢 All fixed! |
| React Query queryFn | 20+ | 🟡 Handled by library, could improve |
| Server routes with try/catch | 100+ | 🟢 Already good |
| Notification functions | 15+ | 🟢 Already good |

---

## Notes

- React Query automatically catches errors in `queryFn` and stores them in `error` state
- The `useQuery` hook exposes `isError` and `error` for UI handling
- Most "unhandled promise" warnings are actually handled by React Query
- Focus on promises OUTSIDE React Query (event handlers, useEffect, etc.)
