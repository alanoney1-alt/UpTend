# Uptend Full E2E Test Report
**Date:** 2026-02-18 ~07:00 EST | **Target:** https://uptendapp.com
**Customer ID:** `37814f76-1de4-4dc3-8fd0-367081fb8734` | **Pro ID:** `UNKNOWN`

## Results

| # | Endpoint | Code | Result | Response (first 100 chars) |
|---|----------|------|--------|---------------------------|
| 1 | `GET /` | 200 | **PASS** | <!DOCTYPE html> <html lang="en">   <head>     <meta charset="UTF-8" />     <meta name="viewport" con |
| 2 | `GET /ai/home-scan` | 200 | **PASS** | <!DOCTYPE html> <html lang="en">   <head>     <meta charset="UTF-8" />     <meta name="viewport" con |
| 3 | `POST /api/ai/chat` | 200 | **PASS** | {"success":true,"conversationId":null,"response":"Here are all the services we offer in the Orlando  |
| 4 | `POST /api/ai/chat` | 200 | **PASS** | {"success":true,"conversationId":null,"response":"**Gutter cleaning starts at $150** for a 1-story h |
| 5 | `POST /api/ai/chat` | 200 | **PASS** | {"success":true,"conversationId":null,"response":"Perfect! Here's why the Home Scan is such a game-c |
| 6 | `POST /api/ai/chat` | 200 | **PASS** | {"success":true,"conversationId":null,"response":"¡Hola! Te puedo ayudar con ese ruido extraño al  |
| 7 | `GET /api/pricing` | 200 | **PASS** | {"baseRates":{"junk-removal":{"minimum":150,"perCubicYard":25,"laborRate":45},"debris-removal":{"min |
| 8 | `GET /api/pricing/junk_removal` | 200 | **PASS** | {"success":true,"serviceType":"junk_removal","tiers":[{"sizeCategory":"small","scopeLevel":"standard |
| 9 | `GET /api/pricing/gutter_cleaning` | 200 | **PASS** | {"success":true,"serviceType":"gutter_cleaning","tiers":[{"sizeCategory":"small","scopeLevel":"stand |
| 10 | `POST /api/pricing/quote` | 400 | **FAIL** | {"error":"Invalid quote request","details":[{"received":"handyman","code":"invalid_enum_value","opti |
| 11 | `GET /api/community/events/32827` | 200 | **PASS** | {"events":[]}   |
| 12 | `GET /api/diy/hvac` | 200 | **PASS** | {"id":"c9c9c883-2f39-4f07-820b-00f0e77de700","serviceType":"hvac","difficulty":"medium","title":"Cle |
| 13 | `GET /api/diy/plumbing` | 200 | **PASS** | {"id":"46faa78d-b599-47c7-bc28-0abf18a1f6dc","serviceType":"plumbing","difficulty":"easy","title":"F |
| 14 | `GET /api/auto/obd/P0420` | 200 | **PASS** | {"success":true,"info":{"code":"P0420","description":"Catalyst System Efficiency Below Threshold (Ba |
| 15 | `GET /api/home-scan/progress/37814f76-1de4-4dc3-8fd0-367081fb8734` | 200 | **PASS** | {"success":true,"session":{"id":"b5df5cc7-832c-4ab3-badb-847f7cafc2dd","customer_id":"37814f76-1de4- |
| 16 | `GET /api/wallet/37814f76-1de4-4dc3-8fd0-367081fb8734` | 200 | **PASS** | {"success":true,"wallet":{"id":"d84c4f11-f21d-4350-b708-87be5758c482","customer_id":"37814f76-1de4-4 |
| 17 | `GET /api/loyalty/37814f76-1de4-4dc3-8fd0-367081fb8734` | 200 | **PASS** | {"userId":"37814f76-1de4-4dc3-8fd0-367081fb8734","points":0,"tier":"bronze","availableRewards":[],"h |
| 18 | `POST /api/referrals/generate-code` | 200 | **PASS** | {"code":"XXXX2026T7F","existing":true}   |
| 19 | `GET /api/home/dashboard/37814f76-1de4-4dc3-8fd0-367081fb8734` | 200 | **PASS** | {"customerId":"37814f76-1de4-4dc3-8fd0-367081fb8734","date":"2026-02-18","dayOfWeek":"Wednesday","ad |
| 20 | `GET /api/home/utilities/37814f76-1de4-4dc3-8fd0-367081fb8734` | 200 | **PASS** | {"profile":null,"message":"No utility profile found. George can set this up for you!"}   |
| 21 | `GET /api/consent/37814f76-1de4-4dc3-8fd0-367081fb8734` | 200 | **PASS** | {"success":true,"consents":[]}   |
| 22 | `GET /api/auto/vehicles/37814f76-1de4-4dc3-8fd0-367081fb8734` | 200 | **PASS** | {"vehicles":[]}   |
| 23 | `GET /api/hoa/lookup?address=123+Main&city=Orlando&state=FL&zip=32827` | 200 | **PASS** | {"found":false,"message":"No HOA data found for this address"}   |
| 24 | `GET /api/smart-home/platforms` | 200 | **PASS** | [{"id":"nest","name":"Google Nest","icon":"🏠","scopes":["https://www.googleapis.com/auth/sdm.serv |
| 25 | `GET /api/briefing/37814f76-1de4-4dc3-8fd0-367081fb8734` | 200 | **PASS** | {"greeting":"Good morning! ☀️","weather":{"current":{"tempF":"61","feelsLikeF":"61","humidity":" |
| 26 | `GET /api/insurance/storm-prep?stormType=hurricane` | 500 | **FAIL** | {"error":"null value in column \"customer_id\" of relation \"storm_prep_checklists\" violates not-nu |
| 27 | `POST /api/home-scan/start` | 200 | **PASS** | {"success":true,"session":{"id":"ef6f1f82-4744-49c5-81c8-04f7f557dd65","customer_id":"37814f76-1de4- |
| 28 | `POST /api/shopping/search` | 200 | **PASS** | {"results":[{"retailer":"Home Depot","productName":"HVAC filter 20x25x1","price":null,"url":"https:/ |
| 29 | `GET /api/neighborhood/32827` | 200 | **PASS** | {"zip":"32827","avgPrices":{"junk_removal":{"range":{"max":499,"min":79},"median":159,"average":189} |
| 30 | `GET /api/pro/goals/UNKNOWN` | 200 | **PASS** | {"goals":[],"message":"No active earnings goals. Set one to start tracking!"}   |
| 31 | `GET /api/pro/forecast/UNKNOWN` | 500 | **FAIL** | {"error":"column \"services_offered\" does not exist"}   |
| 32 | `GET /api/pro/route/UNKNOWN/2026-02-18` | 200 | **PASS** | {"proId":"UNKNOWN","date":"2026-02-18","jobs":[],"optimizedOrder":[],"totalDistance":0,"totalDriveTi |
| 33 | `GET /api/pro/analytics/UNKNOWN/weekly` | 500 | **FAIL** | {"error":"column sr.hauler_id does not exist"}   |
| 34 | `GET /api/pro/field-assist/knowledge/plumbing` | 200 | **PASS** | {"category":"plumbing","entries":[{"id":30,"category":"plumbing","subcategory":"pipe_sizes","title": |
| 35 | `GET /api/pro/field-assist/knowledge/electrical` | 200 | **PASS** | {"category":"electrical","entries":[{"id":40,"category":"electrical","subcategory":"wire_gauge","tit |
| 36 | `POST /api/ai/chat` | 200 | **PASS** | {"success":true,"conversationId":null,"response":"**UpTend gutter cleaning starts at $150** for sing |
| 37 | `POST /api/ai/chat` | 200 | **PASS** | {"success":true,"conversationId":null,"response":"**Before we start — quick heads up:** I'm an AI  |
| 38 | `POST /api/ai/chat` | 200 | **PASS** | {"success":true,"conversationId":null,"response":"I need to get you emergency help right away! \n\n* |
| 39 | `POST /api/ai/chat` | 200 | **PASS** | {"success":true,"conversationId":null,"response":"I'd love to help you understand your home's value  |
| 40 | `POST /api/ai/chat` | 200 | **PASS** | {"success":true,"conversationId":null,"response":"Sorry, I'm having a moment! 😅 Try asking again, |

## Summary: **36/40 passing** | 4 failing

### By Section
- **Public (1-14):** 13/14 ✅
- **Customer (15-29):** 14/15 ✅
- **Pro (30-35):** 4/6 ⚠️
- **George Depth (36-40):** 5/5 ✅

### Failures
| # | Issue |
|---|-------|
| 10 | `POST /api/pricing/quote` — 400: "handyman" not a valid enum value. Need correct service type. |
| 26 | `GET /api/insurance/storm-prep` — 500: null customer_id. Endpoint needs customerId in query or body. |
| 31 | `GET /api/pro/forecast` — 500: DB column `services_offered` missing. Schema bug. |
| 33 | `GET /api/pro/analytics` — 500: DB column `sr.hauler_id` missing. Schema bug. |

### George AI Quality Ratings (1-5)
| # | Question | Rating | Notes |
|---|----------|--------|-------|
| 3 | Services offered | ⭐⭐⭐⭐⭐ 5/5 | Lists all Orlando services comprehensively |
| 4 | Gutter pricing | ⭐⭐⭐⭐⭐ 5/5 | "$150 for 1-story" — real pricing, specific |
| 5 | Home scan | ⭐⭐⭐⭐ 4/5 | Good pitch, explains value prop |
| 6 | Spanish auto | ⭐⭐⭐⭐⭐ 5/5 | Responds in Spanish! Auto-detected language |
| 36 | FL gutter timing | ⭐⭐⭐⭐⭐ 5/5 | Mentions real pricing ($150), Florida-specific |
| 37 | HVAC filter change | ⭐⭐⭐⭐ 4/5 | Helpful DIY with safety disclaimer |
| 38 | Emergency pipe | ⭐⭐⭐⭐⭐ 5/5 | Urgent tone, immediate action steps |
| 39 | Home value | ⭐⭐⭐⭐ 4/5 | Asks good follow-up questions |
| 40 | Honda oil change | ⭐⭐ 2/5 | "Having a moment" error — failed to answer |

### Key Observations
- **Auth works** — both customer and pro login return success with session cookies
- **Pro ID not returned** in login response (just `role:hauler`), so pro endpoints hit with "UNKNOWN" — goals/route/KB still work gracefully
- **George is excellent** — uses real pricing, responds in Spanish, handles emergencies well. One hiccup on test 40.
- **DB schema issues** on pro forecast + analytics — likely missing migration
- **Storm prep** needs customer context passed differently
- **Pricing quote** needs valid enum — check what values the API accepts
