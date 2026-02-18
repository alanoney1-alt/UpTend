# Uptend E2E Test Results — Retest

**Date:** 2026-02-18 00:00 EST  
**Target:** https://uptendapp.com (production)  
**Purpose:** Retest 6 previously-failed endpoints + George chat after bug fixes

## Summary

| # | Endpoint | Status | Result |
|---|----------|--------|--------|
| 1 | POST /api/customers/login | ✅ PASS | Returns `userId`, `role`, `hasPaymentMethod` — **userId confirmed** |
| 2 | GET /api/consent/{userId} | ✅ PASS | 200 — returns `{ success: true, consents: [] }` |
| 3 | GET /api/pro/forecast/{proId} | ❌ FAIL | 500 — `operator does not exist: text > timestamp with time zone` |
| 4 | GET /api/pro/route/{proId}/{date} | ❌ FAIL | 500 — `column "estimated_duration_hours" does not exist` |
| 5 | POST /api/pricing/quote | ✅ PASS | 200 — returns `totalPrice: 75`, full breakdown |
| 6 | GET /api/insurance/storm-prep | ❌ FAIL | 500 — `null value in column "customer_id" of relation "storm_prep_checklists" violates not-null constraint` |
| 7 | POST /api/ai/chat (George) | ✅ PASS | 200 — George responds with gutter cleaning pricing, buttons, conversationId |

**4 of 7 passed. 3 still failing (all DB/query issues).**

## Details

### 1. POST /api/customers/login ✅
```json
{"success":true,"userId":"c58fa1d1-92b2-426d-a7c4-11b9f58f76e8","role":"customer","hasPaymentMethod":false}
```
**Fix verified:** `userId` is now returned.

### 2. GET /api/consent/{userId} ✅
```json
{"success":true,"consents":[]}
```

### 3. GET /api/pro/forecast/pro-001 ❌
```json
{"error":"operator does not exist: text > timestamp with time zone"}
```
**Bug:** A text column is being compared to a timestamp without casting. Likely in a WHERE clause filtering by date.

### 4. GET /api/pro/route/pro-001/2026-02-18 ❌
```json
{"error":"column \"estimated_duration_hours\" does not exist"}
```
**Bug:** Missing column in the `jobs` or `bookings` table. Needs a migration or column rename.

### 5. POST /api/pricing/quote ✅
```json
{"basePrice":75,"totalPrice":75,"priceMin":63.75,"priceMax":86.25,"confidence":0.85}
```

### 6. GET /api/insurance/storm-prep?stormType=hurricane ❌
```json
{"error":"null value in column \"customer_id\" of relation \"storm_prep_checklists\" violates not-null constraint"}
```
**Bug:** The endpoint tries to INSERT into `storm_prep_checklists` but doesn't pass `customer_id` from the session. Auth cookie is set correctly (chat endpoint works), so this is a backend bug in the storm-prep handler.

### 7. POST /api/ai/chat (George) ✅
George responded with detailed gutter cleaning pricing, interactive buttons, and a conversationId. Working great.

## Remaining Fixes Needed

1. **pro/forecast** — Cast text column to timestamp in the forecast query
2. **pro/route** — Add `estimated_duration_hours` column (migration) or fix the column name in the query
3. **storm-prep** — Pass `req.session.userId` (or equivalent) as `customer_id` when inserting into `storm_prep_checklists`
