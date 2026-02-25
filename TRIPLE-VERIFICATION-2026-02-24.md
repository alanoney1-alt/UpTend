# UpTend Triple Verification Report
**Date:** 2026-02-24 19:25 EST  
**Purpose:** Verify 21 fixed features across 3 rounds  
**Customer userId:** 37814f76-1de4-4dc3-8fd0-367081fb8734 | **Pro Id:** 65a176a9-9e91-42c7-a293-c25675d3da34

---


## Round 1 Results

| Endpoint | Code | Response Preview | Result |
|----------|------|-----------------|--------|
| customer/login | 200 | `{"success":true,"message":"Login successful","userId":"37814` | **PASS** |
| service-requests | 200 | `[{"id":"91d14a1a-b810-4d83-877d-5822f9bf1ba4","customerId":"` | **PASS** |
| loyalty/status | 200 | `{"programName":"OpenClaw Rewards","tiers":["bronze","silver"` | **PASS** |
| loyalty/{userId} | 200 | `{"userId":"37814f76-1de4-4dc3-8fd0-367081fb8734","points":0,` | **PASS** |
| subscriptions | 200 | `{"subscriptions":[],"plans":[],"total":0}` | **PASS** |
| wallet | 200 | `{"success":true,"wallet":{"id":"d84c4f11-f21d-4350-b708-87be` | **PASS** |
| notifications | 500 | `{"error":"Failed to fetch notifications"}` | **FAIL** |
| properties | 200 | `[]` | **PASS** |
| home-profile | 200 | `{"success":true,"profiles":[],"upcomingMaintenance":[],"expi` | **PASS** |
| vehicles | 200 | `{"vehicles":[{"id":"76465cbc-a980-4b05-81a1-261bd3b4dc1b","c` | **PASS** |
| spending-tracker | 200 | `{"success":true,"totalSpent":75,"totalRequests":1,"byService` | **PASS** |
| appliances | 200 | `{"success":true,"appliances":[]}` | **PASS** |
| warranties | 200 | `{"success":true,"active":[],"expiringSoon":[],"expired":[],"` | **PASS** |
| home-inventory | 200 | `{"success":true,"items":[]}` | **PASS** |
| referrals/mine | 200 | `{"totalReferrals":0,"credited":0,"pending":0,"totalEarned":0` | **PASS** |
| calendar/upcoming | 401 | `{"error":"User not found"}` | **FAIL** |
| briefing/{userId} | 200 | `{"greeting":"Good morning! ","weather":{"current":{"tempF":"` | **PASS** |
| certifications | 200 | `[{"id":"4de56233-f148-4c61-944e-8998024bbcad","name":"AI Hom` | **PASS** |
| haulers/available | 500 | `{"error":"Failed to fetch available pros"}` | **FAIL** |
| haulers/available?svc | 500 | `{"error":"Failed to fetch available pros"}` | **FAIL** |
| ai/guide/toilet | 200 | `{"reply":"Before we start — quick heads up: I'm an AI assi` | **PASS** |
| ai/guide/pricing | 200 | `{"reply":"**Gutter cleaning starts at $129** for a single-st` | **PASS** |
| haulers/login | 200 | `{"success":true,"message":"Login successful","role":"hauler"` | **PASS** |
| haulers/dashboard | 200 | `{"totalJobs":0,"activeJobs":0,"completedJobs":0,"totalEarnin` | **PASS** |
| haulers/earnings | 200 | `{"earnings":{"thisWeek":0,"thisMonth":0,"ytd":0,"allTime":0}` | **PASS** |
| haulers/jobs | 200 | `{"upcoming":[{"id":"92bae7d3-0cdf-46fa-bbb3-6303148b01da","s` | **PASS** |
| haulers/certifications | 200 | `{"certifications":[],"legacyCertifications":[]}` | **PASS** |
| haulers/quality-score | 200 | `{"qualityScore":75,"breakdown":{"averageRating":5,"reviewCou` | **PASS** |
| background-check | 200 | `{"status":"not_started","proId":"UNKNOWN"}` | **PASS** |

### Pages

| Page | Code | Result |
|------|------|--------|
| / | 200 | **PASS** |
| /book | 200 | **PASS** |
| /pricing | 200 | **PASS** |
| /services | 200 | **PASS** |
| /find-pro | 200 | **PASS** |
| /meet-george | 200 | **PASS** |
| /loyalty | 200 | **PASS** |
| /certifications | 200 | **PASS** |
| /emergency | 200 | **PASS** |
| /home-dna-scan | 200 | **PASS** |
| /blog | 200 | **PASS** |
| /about | 200 | **PASS** |
| /faq | 200 | **PASS** |
| /become-pro | 200 | **PASS** |
| /business | 200 | **PASS** |
| /b2b-pricing | 200 | **PASS** |
| /career | 200 | **PASS** |
| /profile | 200 | **PASS** |
| /login | 200 | **PASS** |


## Round 2 Results

| Endpoint | Code | Response Preview | Result |
|----------|------|-----------------|--------|
| customer/login | 200 | `{"success":true,"message":"Login successful","userId":"37814` | **PASS** |
| service-requests | 200 | `[{"id":"91d14a1a-b810-4d83-877d-5822f9bf1ba4","customerId":"` | **PASS** |
| loyalty/status | 200 | `{"programName":"OpenClaw Rewards","tiers":["bronze","silver"` | **PASS** |
| loyalty/{userId} | 200 | `{"userId":"37814f76-1de4-4dc3-8fd0-367081fb8734","points":0,` | **PASS** |
| subscriptions | 200 | `{"subscriptions":[],"plans":[],"total":0}` | **PASS** |
| wallet | 200 | `{"success":true,"wallet":{"id":"d84c4f11-f21d-4350-b708-87be` | **PASS** |
| notifications | 500 | `{"error":"Failed to fetch notifications"}` | **FAIL** |
| properties | 200 | `[]` | **PASS** |
| home-profile | 200 | `{"success":true,"profiles":[],"upcomingMaintenance":[],"expi` | **PASS** |
| vehicles | 200 | `{"vehicles":[{"id":"76465cbc-a980-4b05-81a1-261bd3b4dc1b","c` | **PASS** |
| spending-tracker | 200 | `{"success":true,"totalSpent":75,"totalRequests":1,"byService` | **PASS** |
| appliances | 200 | `{"success":true,"appliances":[]}` | **PASS** |
| warranties | 200 | `{"success":true,"active":[],"expiringSoon":[],"expired":[],"` | **PASS** |
| home-inventory | 200 | `{"success":true,"items":[]}` | **PASS** |
| referrals/mine | 200 | `{"totalReferrals":0,"credited":0,"pending":0,"totalEarned":0` | **PASS** |
| calendar/upcoming | 401 | `{"error":"User not found"}` | **FAIL** |
| briefing/{userId} | 200 | `{"greeting":"Good morning! ","weather":{"current":{"tempF":"` | **PASS** |
| certifications | 200 | `[{"id":"4de56233-f148-4c61-944e-8998024bbcad","name":"AI Hom` | **PASS** |
| haulers/available | 500 | `{"error":"Failed to fetch available pros"}` | **FAIL** |
| haulers/available?svc | 500 | `{"error":"Failed to fetch available pros"}` | **FAIL** |
| ai/guide/toilet | 200 | `{"reply":"Before we dive in, quick heads up: I'm an AI assis` | **PASS** |
| ai/guide/pricing | 200 | `{"reply":"**Gutter cleaning starts at $129** for a single-st` | **PASS** |
| haulers/login | 200 | `{"success":true,"message":"Login successful","role":"hauler"` | **PASS** |
| haulers/dashboard | 200 | `{"totalJobs":0,"activeJobs":0,"completedJobs":0,"totalEarnin` | **PASS** |
| haulers/earnings | 200 | `{"earnings":{"thisWeek":0,"thisMonth":0,"ytd":0,"allTime":0}` | **PASS** |
| haulers/jobs | 200 | `{"upcoming":[{"id":"92bae7d3-0cdf-46fa-bbb3-6303148b01da","s` | **PASS** |
| haulers/certifications | 200 | `{"certifications":[],"legacyCertifications":[]}` | **PASS** |
| haulers/quality-score | 200 | `{"qualityScore":75,"breakdown":{"averageRating":5,"reviewCou` | **PASS** |
| background-check | 200 | `{"status":"not_started","proId":"UNKNOWN"}` | **PASS** |

### Pages

| Page | Code | Result |
|------|------|--------|
| / | 200 | **PASS** |
| /book | 200 | **PASS** |
| /pricing | 200 | **PASS** |
| /services | 200 | **PASS** |
| /find-pro | 200 | **PASS** |
| /meet-george | 200 | **PASS** |
| /loyalty | 200 | **PASS** |
| /certifications | 200 | **PASS** |
| /emergency | 200 | **PASS** |
| /home-dna-scan | 200 | **PASS** |
| /blog | 200 | **PASS** |
| /about | 200 | **PASS** |
| /faq | 200 | **PASS** |
| /become-pro | 200 | **PASS** |
| /business | 200 | **PASS** |
| /b2b-pricing | 200 | **PASS** |
| /career | 200 | **PASS** |
| /profile | 200 | **PASS** |
| /login | 200 | **PASS** |


## Round 3 Results

| Endpoint | Code | Response Preview | Result |
|----------|------|-----------------|--------|
| customer/login | 200 | `{"success":true,"message":"Login successful","userId":"37814` | **PASS** |
| service-requests | 200 | `[{"id":"91d14a1a-b810-4d83-877d-5822f9bf1ba4","customerId":"` | **PASS** |
| loyalty/status | 200 | `{"programName":"OpenClaw Rewards","tiers":["bronze","silver"` | **PASS** |
| loyalty/{userId} | 200 | `{"userId":"37814f76-1de4-4dc3-8fd0-367081fb8734","points":0,` | **PASS** |
| subscriptions | 200 | `{"subscriptions":[],"plans":[],"total":0}` | **PASS** |
| wallet | 200 | `{"success":true,"wallet":{"id":"d84c4f11-f21d-4350-b708-87be` | **PASS** |
| notifications | 500 | `{"error":"Failed to fetch notifications"}` | **FAIL** |
| properties | 200 | `[]` | **PASS** |
| home-profile | 200 | `{"success":true,"profiles":[],"upcomingMaintenance":[],"expi` | **PASS** |
| vehicles | 200 | `{"vehicles":[{"id":"76465cbc-a980-4b05-81a1-261bd3b4dc1b","c` | **PASS** |
| spending-tracker | 200 | `{"success":true,"totalSpent":75,"totalRequests":1,"byService` | **PASS** |
| appliances | 200 | `{"success":true,"appliances":[]}` | **PASS** |
| warranties | 200 | `{"success":true,"active":[],"expiringSoon":[],"expired":[],"` | **PASS** |
| home-inventory | 200 | `{"success":true,"items":[]}` | **PASS** |
| referrals/mine | 200 | `{"totalReferrals":0,"credited":0,"pending":0,"totalEarned":0` | **PASS** |
| calendar/upcoming | 401 | `{"error":"User not found"}` | **FAIL** |
| briefing/{userId} | 200 | `{"greeting":"Good morning! ","weather":{"current":{"tempF":"` | **PASS** |
| certifications | 200 | `[{"id":"4de56233-f148-4c61-944e-8998024bbcad","name":"AI Hom` | **PASS** |
| haulers/available | 500 | `{"error":"Failed to fetch available pros"}` | **FAIL** |
| haulers/available?svc | 500 | `{"error":"Failed to fetch available pros"}` | **FAIL** |
| ai/guide/toilet | 200 | `{"reply":"Before we dive in — quick heads up: I'm an AI as` | **PASS** |
| ai/guide/pricing | 200 | `{"reply":"**Gutter cleaning starts at $129** for a single-st` | **PASS** |
| haulers/login | 200 | `{"success":true,"message":"Login successful","role":"hauler"` | **PASS** |
| haulers/dashboard | 200 | `{"totalJobs":0,"activeJobs":0,"completedJobs":0,"totalEarnin` | **PASS** |
| haulers/earnings | 200 | `{"earnings":{"thisWeek":0,"thisMonth":0,"ytd":0,"allTime":0}` | **PASS** |
| haulers/jobs | 200 | `{"upcoming":[{"id":"92bae7d3-0cdf-46fa-bbb3-6303148b01da","s` | **PASS** |
| haulers/certifications | 200 | `{"certifications":[],"legacyCertifications":[]}` | **PASS** |
| haulers/quality-score | 200 | `{"qualityScore":75,"breakdown":{"averageRating":5,"reviewCou` | **PASS** |
| background-check | 200 | `{"status":"not_started","proId":"UNKNOWN"}` | **PASS** |

### Pages

| Page | Code | Result |
|------|------|--------|
| / | 200 | **PASS** |
| /book | 200 | **PASS** |
| /pricing | 200 | **PASS** |
| /services | 200 | **PASS** |
| /find-pro | 200 | **PASS** |
| /meet-george | 200 | **PASS** |
| /loyalty | 200 | **PASS** |
| /certifications | 200 | **PASS** |
| /emergency | 200 | **PASS** |
| /home-dna-scan | 200 | **PASS** |
| /blog | 200 | **PASS** |
| /about | 200 | **PASS** |
| /faq | 200 | **PASS** |
| /become-pro | 200 | **PASS** |
| /business | 200 | **PASS** |
| /b2b-pricing | 200 | **PASS** |
| /career | 200 | **PASS** |
| /profile | 200 | **PASS** |
| /login | 200 | **PASS** |


---

## Summary Table

| Endpoint | R1 | R2 | R3 | Status |
|----------|----|----|----|---------| 
| customer/login | PASS | PASS | PASS | ✅ PASS |
| service-requests | PASS | PASS | PASS | ✅ PASS |
| loyalty/status | PASS | PASS | PASS | ✅ PASS |
| loyalty/{userId} | PASS | PASS | PASS | ✅ PASS |
| subscriptions | PASS | PASS | PASS | ✅ PASS |
| wallet | PASS | PASS | PASS | ✅ PASS |
| notifications | FAIL | FAIL | FAIL | ❌ FAIL |
| properties | PASS | PASS | PASS | ✅ PASS |
| home-profile | PASS | PASS | PASS | ✅ PASS |
| vehicles | PASS | PASS | PASS | ✅ PASS |
| spending-tracker | PASS | PASS | PASS | ✅ PASS |
| appliances | PASS | PASS | PASS | ✅ PASS |
| warranties | PASS | PASS | PASS | ✅ PASS |
| home-inventory | PASS | PASS | PASS | ✅ PASS |
| referrals/mine | PASS | PASS | PASS | ✅ PASS |
| calendar/upcoming | FAIL | FAIL | FAIL | ❌ FAIL |
| briefing/{userId} | PASS | PASS | PASS | ✅ PASS |
| certifications | PASS | PASS | PASS | ✅ PASS |
| haulers/available | FAIL | FAIL | FAIL | ❌ FAIL |
| haulers/available?svc | FAIL | FAIL | FAIL | ❌ FAIL |
| ai/guide/toilet | PASS | PASS | PASS | ✅ PASS |
| ai/guide/pricing | PASS | PASS | PASS | ✅ PASS |
| haulers/login | PASS | PASS | PASS | ✅ PASS |
| haulers/dashboard | PASS | PASS | PASS | ✅ PASS |
| haulers/earnings | PASS | PASS | PASS | ✅ PASS |
| haulers/jobs | PASS | PASS | PASS | ✅ PASS |
| haulers/certifications | PASS | PASS | PASS | ✅ PASS |
| haulers/quality-score | PASS | PASS | PASS | ✅ PASS |
| background-check | PASS | PASS | PASS | ✅ PASS |
| page:/ | PASS | PASS | PASS | ✅ PASS |
| page:/book | PASS | PASS | PASS | ✅ PASS |
| page:/pricing | PASS | PASS | PASS | ✅ PASS |
| page:/services | PASS | PASS | PASS | ✅ PASS |
| page:/find-pro | PASS | PASS | PASS | ✅ PASS |
| page:/meet-george | PASS | PASS | PASS | ✅ PASS |
| page:/loyalty | PASS | PASS | PASS | ✅ PASS |
| page:/certifications | PASS | PASS | PASS | ✅ PASS |
| page:/emergency | PASS | PASS | PASS | ✅ PASS |
| page:/home-dna-scan | PASS | PASS | PASS | ✅ PASS |
| page:/blog | PASS | PASS | PASS | ✅ PASS |
| page:/about | PASS | PASS | PASS | ✅ PASS |
| page:/faq | PASS | PASS | PASS | ✅ PASS |
| page:/become-pro | PASS | PASS | PASS | ✅ PASS |
| page:/business | PASS | PASS | PASS | ✅ PASS |
| page:/b2b-pricing | PASS | PASS | PASS | ✅ PASS |
| page:/career | PASS | PASS | PASS | ✅ PASS |
| page:/profile | PASS | PASS | PASS | ✅ PASS |
| page:/login | PASS | PASS | PASS | ✅ PASS |

---

## Issues Found

Endpoints that failed or were flaky in ANY round:

- **notifications** (500 all 3 rounds): `{"error":"Failed to fetch notifications"}` — Server-side error in notification fetching
- **calendar/upcoming** (401 all 3 rounds): `{"error":"User not found"}` — Auth cookie not translating to valid user lookup; likely session/cookie issue with calendar endpoint specifically
- **haulers/available** (500 all 3 rounds): `{"error":"Failed to fetch available pros"}` — Server-side error fetching pro listings
- **haulers/available?service=gutter_cleaning** (500 all 3 rounds): Same as above — the service filter variant also fails

### Note
- ProId was extracted from login response (`65a176a9-9e91-42c7-a293-c25675d3da34`) but login response uses `proId` key (not nested in `hauler.id`)
- background-check endpoint tested with this proId and returned 200 ✅
- All 19 pages returned 200 across all 3 rounds ✅
- George AI responded correctly to both test prompts in all 3 rounds ✅
- All other customer/pro API endpoints (25 of 29) passed 3/3 ✅

---
*Report generated automatically by OpenClaw triple verification script*
