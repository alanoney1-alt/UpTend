# UpTend E2E Test Results

**Date:** Tue Feb 17 23:51:00 EST 2026
**Target:** https://uptendapp.com
**Auth Model:** Session cookies (connect.sid), no Bearer tokens

## Results

| # | Endpoint | Status | Result |
|---|----------|--------|--------|
| 1 | POST /api/customers/login | 200 | ✅ PASS |
| 2 | POST /api/haulers/login | 200 | ✅ PASS |
| 3 | GET /api/pricing | 200 | ✅ PASS |
| 4 | GET /api/pricing/junk_removal | 200 | ✅ PASS |
| 5 | POST /api/pricing/quote | 400 | ❌ FAIL |
| 6 | POST /api/ai/chat (services) | 200 | ✅ PASS |
| 7 | GET /api/home-scan/progress/1 | 200 | ✅ PASS |
| 8 | GET /api/wallet/1 | 200 | ✅ PASS |
| 9 | GET /api/loyalty/1 | 404 | ❌ FAIL |
| 10 | POST /api/referrals/generate-code | 200 | ✅ PASS |
| 11 | GET /api/community/events/32827 | 200 | ✅ PASS |
| 12 | GET /api/insurance/storm-prep | 400 | ❌ FAIL |
| 13 | GET /api/home/dashboard/1 | 200 | ✅ PASS |
| 14 | GET /api/hoa/lookup | 200 | ✅ PASS |
| 15 | GET /api/smart-home/platforms | 200 | ✅ PASS |
| 16 | GET /api/briefing/1 | 200 | ✅ PASS |
| 17 | GET /api/diy/hvac | 200 | ✅ PASS |
| 18 | POST /api/shopping/search | 200 | ✅ PASS |
| 19 | GET /api/auto/vehicles/1 | 200 | ✅ PASS |
| 20 | GET /api/consent/1 | 500 | ❌ FAIL |
| 21 | GET /api/pro/goals/1 | 200 | ✅ PASS |
| 22 | GET /api/pro/forecast/1 | 500 | ❌ FAIL |
| 23 | GET /api/pro/route/1/2026-02-18 | 500 | ❌ FAIL |
| 24 | GET /api/pro/field-assist/knowledge/plumbing | 200 | ✅ PASS |
| 25 | POST /api/ai/chat (gutter cleaning) | 200 | ✅ PASS |
| 26 | POST /api/ai/chat (home scan) | 200 | ✅ PASS |
| 27 | POST /api/ai/chat (auto/brakes) | 200 | ✅ PASS |

## Summary

**21/27 endpoints passing** (6 failures)

## Failure Analysis

### 🔴 500 Errors (Server Bugs — Need Fixing)

**1. GET /api/consent/:id → 500**
- Error: `invalid input syntax for type uuid: "1"`
- **Fix needed:** Consent endpoint expects UUID customer IDs. Login doesn't return customer ID, so we used `1`. Either the route needs integer support, or login needs to return the customer UUID.

**2. GET /api/pro/forecast/:proId → 500**
- Error: `column "zip_code" does not exist`
- **Fix needed:** SQL query references `zip_code` column that doesn't exist in the table. Likely a schema mismatch — column may be named `zipCode` or `zip`.

**3. GET /api/pro/route/:proId/:date → 500**
- Error: `column "address" does not exist`
- **Fix needed:** SQL query references `address` column that doesn't exist. Similar schema mismatch.

### 🟡 400 Errors (Request/Validation Issues)

**4. POST /api/pricing/quote → 400**
- Error: `loadSize` is required (not `options.size`)
- **Test issue:** Wrong request body. Correct format needs `loadSize` field with enum values: small/medium/large/extra_large/minimum/quarter/half/three_quarter/full/items.

**5. GET /api/insurance/storm-prep → 400**
- Error: `stormType query param required`
- **Test issue:** Missing required `?stormType=` query param. Not a bug.

**6. GET /api/loyalty/1 → 404**
- Error: `User not found`
- **Test issue:** User ID `1` doesn't exist in loyalty system. Login doesn't return customer ID so we couldn't use the real one.

### ⚠️ Structural Issues

- **Login responses don't return user IDs or tokens.** Both `/api/customers/login` and `/api/haulers/login` return `{success, message, role}` but no customer/hauler ID. No `/api/customers/me` or `/api/haulers/me` endpoint exists. This makes it impossible for clients to know their own ID after login.
- **Auth is cookie-based** (connect.sid session cookie), not Bearer token. The original test spec assumed Bearer tokens.

## Recommendations for Next Session

1. **Fix 3 server 500s:** consent UUID handling, pro/forecast `zip_code` column, pro/route `address` column
2. **Add `/me` endpoints** for both customers and haulers so clients can retrieve their own ID after login
3. **Return user ID in login response** as a simpler alternative
4. **Update E2E test** with correct request formats for pricing/quote and insurance/storm-prep
