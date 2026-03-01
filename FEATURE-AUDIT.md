# UpTend Feature Audit — 2026-02-28

Full route and component audit of `client/src/App.tsx` and `server/routes/index.ts`.

---

## ALIVE (component exists, has real content, route works)

| Route Path | Component | File | Lines |
|---|---|---|---|
| `/` | Landing / BusinessLanding | landing.tsx / business-landing.tsx | 531 / 289 |
| `/smart-book` | SmartBooking | smart-booking.tsx | 284 |
| `/book` | Booking | booking.tsx | 215 |
| `/booking-success` | BookingSuccess | booking-success.tsx | 310 |
| `/haulers` | Haulers | haulers.tsx | 594 |
| `/drive` | Drive | drive.tsx | 372 |
| `/pros` | HaulerLanding | hauler-landing.tsx | 332 |
| `/tracking` | TrackingLookup | tracking-lookup.tsx | 192 |
| `/track/:jobId` | Tracking | tracking.tsx | 916 |
| `/my-jobs` | MyJobs | my-jobs.tsx | 105 |
| `/pro/dashboard` | HaulerDashboard | hauler-dashboard.tsx | 3916 |
| `/pro/earnings` | EarningsPage | hauler/earnings.tsx | 129 |
| `/pro/rates` | HaulerDashboard | hauler-dashboard.tsx | 3916 |
| `/pro/background-check` | ProBackgroundCheck | pro-background-check.tsx | 251 |
| `/career-dashboard` | CareerDashboard | career-dashboard.tsx | 324 |
| `/hauler/dashboard` | HaulerDashboard | hauler-dashboard.tsx | 3916 |
| `/hauler/earnings` | EarningsPage | hauler/earnings.tsx | 129 |
| `/business/partners` | BusinessPartnersLanding | business-partners.tsx | 144 |
| `/business/signup` | BusinessPartnerSignup | business-signup.tsx | 413 |
| `/business/partner-dashboard` | BusinessPartnerDashboard | bp-dashboard.tsx | 419 |
| `/business` | BusinessLanding (lazy) | business.tsx | 359 |
| `/business/login` | BusinessLogin | business-login.tsx | 154 |
| `/business/register` | BusinessRegister | business-register.tsx | 270 |
| `/business/dashboard` | BusinessDashboard | business-dashboard.tsx | 669 |
| `/business/compliance` | BusinessCompliance | business-compliance.tsx | 441 |
| `/business/government` | BusinessGovernment | business-government.tsx | 459 |
| `/government/contracts` | GovernmentContractDashboard | government/contract-dashboard.tsx | 298 |
| `/government/contracts/:id` | GovernmentContractDetail | government/contract-detail.tsx | 742 |
| `/government/contracts/:id/labor` | GovernmentLaborEntry | government/labor-entry.tsx | 153 |
| `/government/contracts/:id/payroll/:reportId` | GovernmentPayrollReport | government/payroll-report.tsx | 266 |
| `/government/work-orders` | GovernmentWorkOrders | government/work-orders.tsx | 203 |
| `/government/float` | GovernmentFloatDashboard | government/float-dashboard.tsx | 401 |
| `/government/work-orders/:id` | GovernmentWorkOrderDetail | government/work-order-detail.tsx | 247 |
| `/business/communities` | BusinessCommunities | business-communities.tsx | 429 |
| `/business/properties` | BusinessProperties | business-properties.tsx | 392 |
| `/business/construction` | BusinessConstruction | business-construction.tsx | 340 |
| `/business/reports` | BusinessReports | business-reports.tsx | 335 |
| `/business/invoices` | BusinessInvoices | business-invoices.tsx | 263 |
| `/business/integrations` | BusinessIntegrations | business-integrations.tsx | 425 |
| `/business/bp-integrations` | BpIntegrations | bp-integrations.tsx | 338 |
| `/business/onboarding` | BusinessOnboarding | business-onboarding.tsx | 1037 |
| `/business/booking` | BusinessBooking | business-booking.tsx | 769 |
| `/business/violations` | BusinessViolations | business-violations.tsx | 270 |
| `/business/community` | BusinessCommunityHub | business-community-hub.tsx | 215 |
| `/business/board-report` | BusinessBoardReport | business-board-report.tsx | 224 |
| `/business/emergency` | BusinessEmergency | business-emergency.tsx | 209 |
| `/business/billing` | BusinessBilling | business-billing.tsx | 362 |
| `/admin/billing` | AdminBilling | admin/billing.tsx | 297 |
| `/veterans` | VeteransPage | veterans.tsx | 303 |
| `/rewards` | Loyalty | loyalty.tsx | 383 |
| `/loyalty` | Loyalty | loyalty.tsx | 383 |
| `/ref/:code` | ReferralLanding | referral-landing.tsx | 153 |
| `/pro/signup` | PyckerSignup | pycker-signup.tsx | 2325 |
| `/pro/login` | AuthPage | auth-page.tsx | 307 |
| `/pycker/signup` | PyckerSignup | pycker-signup.tsx | 2325 |
| `/pycker-signup` | PyckerSignup | pycker-signup.tsx | 2325 |
| `/become-a-pycker` | PyckerSignup | pycker-signup.tsx | 2325 |
| `/auth` | AuthPage | auth-page.tsx | 307 |
| `/pycker/login` | AuthPage | auth-page.tsx | 307 |
| `/pycker-login` | AuthPage | auth-page.tsx | 307 |
| `/signup` | CustomerSignup | customer-signup.tsx | 303 |
| `/customer-signup` | CustomerSignup | customer-signup.tsx | 303 |
| `/login` | AuthPage | auth-page.tsx | 307 |
| `/register` | CustomerSignup | customer-signup.tsx | 303 |
| `/customer-login` | CustomerLogin | customer-login.tsx | 211 |
| `/forgot-password` | ForgotPassword | forgot-password.tsx | 128 |
| `/reset-password` | ResetPassword | reset-password.tsx | 199 |
| `/payment-setup` | PaymentSetup | payment-setup.tsx | 319 |
| `/pro/payouts/setup` | ProPayoutSetup | pro-payout-setup.tsx | 206 |
| `/pro/payouts/setup/complete` | ProPayoutSetup | pro-payout-setup.tsx | 206 |
| `/pro/payouts/setup/refresh` | ProPayoutSetup | pro-payout-setup.tsx | 206 |
| `/profile` | Profile | profile.tsx | 1200 |
| `/about` | About | about.tsx | 244 |
| `/meet-george` | MeetGeorge | meet-george.tsx | 128 |
| `/faq` | FAQ | faq.tsx | 256 |
| `/terms` | Terms | terms.tsx | 660 |
| `/privacy` | Privacy | privacy.tsx | 319 |
| `/cancellation-policy` | CancellationPolicy | cancellation-policy.tsx | 131 |
| `/service-guarantee` | ServiceGuarantee | service-guarantee.tsx | 110 |
| `/b2b-terms` | B2BTerms | b2b-terms.tsx | 308 |
| `/acceptable-use` | AcceptableUse | acceptable-use.tsx | 157 |
| `/accessibility` | AccessibilityPage | accessibility.tsx | 68 |
| `/cookies` | CookiePolicy | cookies.tsx | 112 |
| `/communications-consent` | CommunicationsConsent | communications-consent.tsx | 111 |
| `/affiliate-disclosure` | AffiliateDisclosure | affiliate-disclosure.tsx | 74 |
| `/admin` | Admin | admin.tsx | 1193 |
| `/admin/agentic-brain` | AgenticBrain | agentic-brain.tsx | 632 |
| `/admin/carbon-tracking` | CarbonTracking | admin/carbon-tracking.tsx | 548 |
| `/admin-login` | AdminLogin | admin-login.tsx | 135 |
| `/contact` | Contact | contact.tsx | 299 |
| `/quote` | Redirect → /book | (redirect) | — |
| `/claim/:token` | ClaimProperty | claim-property.tsx | 278 |
| `/my-home` | MyHomeInventory | my-home-inventory.tsx | 298 |
| `/my-properties` | MyProperties | my-properties.tsx | 277 |
| `/career` | CareerDashboard | career-dashboard.tsx | 324 |
| `/academy` | PyckerAcademy | hauler-onboarding/academy.tsx | 1155 |
| `/job/:jobId/work` | ActiveJob | active-job.tsx | 101 |
| `/dashboard` | CustomerDashboard | customer-dashboard.tsx | 996 |
| `/customer-dashboard` | CustomerDashboard | customer-dashboard.tsx | 996 |
| `/subscriptions` | CustomerSubscriptions | customer-subscriptions.tsx | 459 |
| `/plans` | SubscriptionPlans | subscription-plans.tsx | 354 |
| `/admin/pro-map` | AdminProMap | admin/pro-map.tsx | 266 |
| `/admin/god-mode` | GodMode | admin/god-mode.tsx | 501 |
| `/admin/accounting` | AdminAccounting | admin/accounting.tsx | 570 |
| `/settings` | ProfileSettings | profile-settings.tsx | 651 |
| `/pricing` | Redirect → /services | (redirect) | — |
| `/become-pro` | BecomePro | become-pro.tsx | 216 |
| `/hauler-landing` | HaulerLanding | hauler-landing.tsx | 332 |
| `/pro-signup` | Redirect → /login?tab=pro | (redirect) | — |
| `/pro-login` | Redirect → /login?tab=pro | (redirect) | — |
| `/academy-syllabus` | AcademySyllabus | academy-syllabus.tsx | 129 |
| `/academy/:slug` | AcademySyllabus | academy-syllabus.tsx | 129 |
| `/services` | Services | services.tsx | 589 |
| `/services/home-audit` | HomeAudit | home-audit.tsx | 358 |
| `/services/audit` | HomeAudit | home-audit.tsx | 358 |
| `/home-audit` | HomeAudit | home-audit.tsx | 358 |
| `/home-scan` | Redirect → /services/home-audit | (redirect) | — |
| `/dwellscan` | HomeAudit | home-audit.tsx | 358 |
| `/home-health-audit` | HomeHealthAudit | home-health-audit.tsx | 703 |
| `/audit` | HomeHealthAudit | home-health-audit.tsx | 703 |
| `/services/junk-removal` | JunkRemoval | junk-removal.tsx | 272 |
| `/services/material-recovery` | Redirect → /services/junk-removal | (redirect) | — |
| `/services/junk` | JunkRemoval | junk-removal.tsx | 272 |
| `/cost-guides` | CostGuidesHub | cost-guides/index.tsx | 64 |
| `/cost-guides/:slug` | CostGuide | cost-guides/guide.tsx | 159 |
| `/services/junk-removal-lake-nona` | JunkRemovalLakeNona | services/junk-removal-lake-nona.tsx | 63 |
| `/services/pressure-washing-orlando` | PressureWashingOrlando | services/pressure-washing-orlando.tsx | 64 |
| `/services/handyman-orlando` | HandymanOrlando | services/handyman-orlando.tsx | 64 |
| `/services/landscaping-lake-nona` | LandscapingLakeNona | services/landscaping-lake-nona.tsx | 63 |
| `/services/gutter-cleaning-orlando` | GutterCleaningOrlando | services/gutter-cleaning-orlando.tsx | 64 |
| `/services/pool-cleaning-lake-nona` | PoolCleaningLakeNona | services/pool-cleaning-lake-nona.tsx | 63 |
| `/services/home-services-lake-nona` | HomeServicesLakeNona | services/home-services-lake-nona.tsx | 63 |
| `/services/home-cleaning-orlando` | HomeCleaningOrlando | services/home-cleaning-orlando.tsx | 64 |
| `/services/moving-labor-orlando` | MovingLaborOrlando | services/moving-labor-orlando.tsx | 64 |
| `/services/:slug` | ServiceSlugRouter (→ SeoServiceCityPage or ServiceDetail) | services/seo-service-city-pages.tsx / service-detail.tsx | 491 / 668 |
| `/sustainability` | Sustainability | sustainability.tsx | 164 |
| `/marketplace` | Marketplace | marketplace.tsx | 377 |
| `/pro/verify` | ProVerification | pro-verification.tsx | 161 |
| `/pro/sustainability-cert` | ProSustainabilityCert | pro-sustainability-cert.tsx | 247 |
| `/properties` | Properties | properties.tsx | 443 |
| `/properties/:propertyId` | PropertyDashboard | property-dashboard.tsx | 247 |
| `/emergency` | Emergency | emergency.tsx | 370 |
| `/emergency-sos` | EmergencySos | emergency-sos.tsx | 323 |
| `/neighborhood` | Neighborhood | neighborhood.tsx | 232 |
| `/lake-nona` | LakeNonaLanding | neighborhood-landing.tsx | 442 |
| `/winter-park` | WinterParkLanding | neighborhood-landing.tsx | 442 |
| `/dr-phillips` | DrPhillipsLanding | neighborhood-landing.tsx | 442 |
| `/windermere` | WindermereLanding | neighborhood-landing.tsx | 442 |
| `/celebration` | CelebrationLanding | neighborhood-landing.tsx | 442 |
| `/join` | JoinPage | join.tsx | 302 |
| `/event` | EventPage | event.tsx | 339 |
| `/kissimmee` | KissimmeeLanding | neighborhood-landing.tsx | 442 |
| `/winter-garden` | WinterGardenLanding | neighborhood-landing.tsx | 442 |
| `/altamonte-springs` | AltamonteSpringsLanding | neighborhood-landing.tsx | 442 |
| `/ocoee` | OcoeeLanding | neighborhood-landing.tsx | 442 |
| `/sanford` | SanfordLanding | neighborhood-landing.tsx | 442 |
| `/apopka` | ApopkaLanding | neighborhood-landing.tsx | 442 |
| `/clermont` | ClermontLanding | neighborhood-landing.tsx | 442 |
| `/insurance` | Insurance | insurance.tsx | 181 |
| `/ai` | AIFeaturesHub | ai/index.tsx | 123 |
| `/ai/photo-quote` | Redirect → /book | (redirect) | — |
| `/snap-quote` | Redirect → /book | (redirect) | — |
| `/ai/documents` | DocumentScanner | ai/document-scanner.tsx | 308 |
| `/home-dna-scan` | HomeScan | ai/home-scan.tsx | 542 |
| `/ai/home-scan` | HomeScan | ai/home-scan.tsx | 542 |
| `/find-pro` | FindPro | find-pro.tsx | 523 |
| `/certifications` | Certifications | certifications.tsx | 122 |
| `/b2b-pricing` | B2BPricing | b2b-pricing.tsx | 283 |
| `/fleet-tracking` | FleetTracking | fleet-tracking.tsx | 125 |
| `/partners` | PartnersLanding | partners/index.tsx | 95 |
| `/partners/register` | PartnerRegister | partners/register.tsx | 147 |
| `/partners/dashboard` | PartnerDashboard | partners/dashboard.tsx | 147 |
| `/my-home-profile` | HomeProfilePage | home-profile.tsx | 304 |
| `/jobs/:jobId/track` | JobLiveTracker | job-live-tracker.tsx | 286 |
| `/jobs/:jobId` | JobDetail | job-detail.tsx | 227 |
| `/tax-center` | TaxCenter | tax-center.tsx | 224 |
| `/gallery` | Gallery | gallery.tsx | 36 |
| `/warranty` | WarrantyManager | warranty-manager.tsx | 231 |
| `/builder/handoff` | BuilderHandoff | builder-handoff.tsx | 165 |
| `/quality-reports` | QualityReports | quality-reports.tsx | 100 |
| `/blog` | BlogIndex | blog/index.tsx | 159 |
| `/blog/home-services-lake-nona` | BlogHomeServicesLakeNona | blog/home-services-lake-nona.tsx | 228 |
| `/blog/:slug` | BlogPost | blog/post.tsx | 430 |
| `*` (404) | NotFound | not-found.tsx | 39 |

**Total: 148 route entries, ALL components exist and have real content.**

---

## DEAD (component missing, empty, or stub)

**None missing.** All 134 unique component files exist.

### ⚠️ Near-Stubs (functional but minimal)

| Route | Component | Lines | Notes |
|---|---|---|---|
| `/refund-policy` | RefundPolicy | 4 | **Just a redirect** to `/cancellation-policy` — intentional, not broken |
| `/gallery` | Gallery | 36 | Very thin page, but renders real content |
| `/not-found` (404) | NotFound | 39 | Minimal by design |

### ⚠️ Naming Conflict (compiles but shadowed)

`BusinessLanding` is declared twice in App.tsx:
1. **Eager import** (line 19): `import BusinessLanding from "@/pages/business-landing"` — used for `/` on business domain
2. **Lazy import** (line 37): `const BusinessLanding = lazy(() => import("@/pages/business"))` — used for `/business` route

The lazy declaration **shadows** the eager import. On the business domain, `/` will render `business.tsx` (359 lines), NOT `business-landing.tsx` (289 lines). This is likely a bug — `business-landing.tsx` is effectively orphaned on the business domain.

---

## ORPHANED

### Components imported but potentially unused
| Component | File | Notes |
|---|---|---|
| `PyckerLogin` | pycker-login.tsx (197 lines) | Imported as lazy but **never used in any Route** — all pycker login routes point to `AuthPage` |
| `PublicPricing` | pricing.tsx (411 lines) | Imported as `PublicPricing` but `/pricing` is a redirect to `/services` — the component is never rendered |
| `BusinessLanding` (eager) | business-landing.tsx (289 lines) | Shadowed by lazy `BusinessLanding` — see naming conflict above |

### Files that exist but have no route
These page files exist in `client/src/pages/` but aren't referenced in App.tsx routes (not necessarily a problem — they may be used as sub-components):
- None found beyond the three listed above.

---

## SERVER ROUTES

All **131 registered route files** exist. Every single one is ALIVE.

| Route File | Lines | Status |
|---|---|---|
| server/routes/auth/hauler.routes.ts | 862 | ✅ ALIVE |
| server/routes/auth/customer.routes.ts | 170 | ✅ ALIVE |
| server/routes/auth/admin.routes.ts | 228 | ✅ ALIVE |
| server/routes/auth/business.routes.ts | 325 | ✅ ALIVE |
| server/routes/auth/google.routes.ts | 210 | ✅ ALIVE |
| server/routes/auth/unified.routes.ts | 117 | ✅ ALIVE |
| server/routes/hauler/profile.routes.ts | 828 | ✅ ALIVE |
| server/routes/hauler/status.routes.ts | 576 | ✅ ALIVE |
| server/routes/hauler/academy.routes.ts | 189 | ✅ ALIVE |
| server/routes/academy/index.ts | 13 | ✅ ALIVE (thin re-export) |
| server/routes/hauler/certification-gating.routes.ts | 193 | ✅ ALIVE |
| server/routes/hauler/fee-status.routes.ts | 36 | ✅ ALIVE |
| server/routes/hauler/background-check.routes.ts | 70 | ✅ ALIVE |
| server/routes/hauler/payouts.routes.ts | 337 | ✅ ALIVE |
| server/routes/hauler/dashboard.routes.ts | 152 | ✅ ALIVE |
| server/routes/hauler/earnings-goal.routes.ts | 312 | ✅ ALIVE |
| server/routes/customer/account.routes.ts | 459 | ✅ ALIVE |
| server/routes/customer/referrals.routes.ts | 196 | ✅ ALIVE |
| server/routes/customer/impact.routes.ts | 89 | ✅ ALIVE |
| server/routes/customer/dashboard-widgets.routes.ts | 203 | ✅ ALIVE |
| server/routes/customer/loyalty.routes.ts | 136 | ✅ ALIVE |
| server/routes/customer/properties.routes.ts | 113 | ✅ ALIVE |
| server/routes/jobs/service-requests.routes.ts | 854 | ✅ ALIVE |
| server/routes/jobs/job-management.routes.ts | 654 | ✅ ALIVE |
| server/routes/jobs/verification.routes.ts | 736 | ✅ ALIVE |
| server/routes/jobs/price-verification.routes.ts | 412 | ✅ ALIVE |
| server/routes/jobs/no-show.routes.ts | 136 | ✅ ALIVE |
| server/routes/subscriptions.routes.ts | 451 | ✅ ALIVE |
| server/routes/cleaning-checklists.routes.ts | 118 | ✅ ALIVE |
| server/routes/admin/subscription-cron.routes.ts | 63 | ✅ ALIVE |
| server/routes/admin/carbon-tracking.routes.ts | 207 | ✅ ALIVE |
| server/routes/subscriptions-plans.routes.ts | 346 | ✅ ALIVE |
| server/routes/same-day.routes.ts | 118 | ✅ ALIVE |
| server/routes/commerce/pricing-quotes.routes.ts | 246 | ✅ ALIVE |
| server/routes/commerce/payments.routes.ts | 840 | ✅ ALIVE |
| server/routes/marketplace/facilities-rebates.routes.ts | 300 | ✅ ALIVE |
| server/routes/marketplace/analytics-promotions.routes.ts | 154 | ✅ ALIVE |
| server/routes/marketplace/marketplace.routes.ts | 154 | ✅ ALIVE |
| server/routes/hoa/violations.routes.ts | 193 | ✅ ALIVE |
| server/routes/hoa/properties.routes.ts | 155 | ✅ ALIVE |
| server/routes/hoa/esg-metrics.routes.ts | 206 | ✅ ALIVE |
| server/routes/hoa/referral-payments.routes.ts | 157 | ✅ ALIVE |
| server/routes/hoa/communications.routes.ts | 227 | ✅ ALIVE |
| server/routes/hoa/scraper.routes.ts | 79 | ✅ ALIVE |
| server/routes/esg/index.ts | 21 | ✅ ALIVE |
| server/routes/business/index.ts | 45 | ✅ ALIVE |
| server/routes/referrals/referral.routes.ts | 243 | ✅ ALIVE |
| server/routes/ai/analysis.routes.ts | 355 | ✅ ALIVE |
| server/routes/ai/agentic.routes.ts | 449 | ✅ ALIVE |
| server/routes/ai/chatbot.routes.ts | 141 | ✅ ALIVE |
| server/routes/ai/sms-bot.routes.ts | 287 | ✅ ALIVE |
| server/routes/ai/index.ts | 110 | ✅ ALIVE |
| server/routes/ai/snap-quote.routes.ts | 562 | ✅ ALIVE |
| server/routes/reviews/reviews.routes.ts | 140 | ✅ ALIVE |
| server/routes/guarantee.routes.ts | 95 | ✅ ALIVE |
| server/routes/contracts.routes.ts | 117 | ✅ ALIVE |
| server/routes/contact.routes.ts | 87 | ✅ ALIVE |
| server/routes/google-api.routes.ts | 20 | ✅ ALIVE |
| server/routes/property/valuation.routes.ts | 312 | ✅ ALIVE |
| server/routes/properties/index.ts | 34 | ✅ ALIVE |
| server/routes/emergency.routes.ts | 215 | ✅ ALIVE |
| server/routes/emergency-sos.routes.ts | 76 | ✅ ALIVE |
| server/routes/neighborhoods.routes.ts | 215 | ✅ ALIVE |
| server/routes/insurance.routes.ts | 195 | ✅ ALIVE |
| server/routes/insurance/index.ts | 7 | ✅ ALIVE (thin re-export) |
| server/routes/launch-notifications.routes.ts | 39 | ✅ ALIVE |
| server/routes/partners.routes.ts | 273 | ✅ ALIVE |
| server/routes/home-profile.routes.ts | 338 | ✅ ALIVE |
| server/routes/scope-change.routes.ts | 209 | ✅ ALIVE |
| server/routes/parts-requests.routes.ts | 408 | ✅ ALIVE |
| server/routes/hauler/active-nearby.routes.ts | 86 | ✅ ALIVE |
| server/routes/admin/pro-map.routes.ts | 52 | ✅ ALIVE |
| server/routes/admin/admin-management.routes.ts | 346 | ✅ ALIVE |
| server/routes/admin/billing.routes.ts | 206 | ✅ ALIVE |
| server/routes/compliance/index.ts | 350 | ✅ ALIVE |
| server/routes/government/index.ts | 113 | ✅ ALIVE |
| server/routes/communities/index.ts | 92 | ✅ ALIVE |
| server/routes/pm/index.ts | 121 | ✅ ALIVE |
| server/routes/construction/index.ts | 88 | ✅ ALIVE |
| server/routes/veterans/index.ts | 136 | ✅ ALIVE |
| server/routes/enterprise/index.ts | 99 | ✅ ALIVE |
| server/routes/fleet/index.ts | 85 | ✅ ALIVE |
| server/routes/integrations/index.ts | 199 | ✅ ALIVE |
| server/routes/b2b-pricing/index.ts | 176 | ✅ ALIVE |
| server/routes/b2b-outreach.routes.ts | 74 | ✅ ALIVE |
| server/routes/white-label/index.ts | 62 | ✅ ALIVE |
| server/routes/upload.routes.ts | 97 | ✅ ALIVE |
| server/routes/stripe-disputes.ts | 283 | ✅ ALIVE |
| server/routes/accounting/index.ts | 14 | ✅ ALIVE (thin re-export) |
| server/routes/public.routes.ts | 225 | ✅ ALIVE |
| server/routes/public/founding-members.routes.ts | 293 | ✅ ALIVE |
| server/routes/george-cron.routes.ts | 140 | ✅ ALIVE |
| server/routes/george-daily.routes.ts | 197 | ✅ ALIVE |
| server/routes/consent.routes.ts | 126 | ✅ ALIVE |
| server/routes/home-scan.routes.ts | 417 | ✅ ALIVE |
| server/routes/ai/room-scanner.routes.ts | 165 | ✅ ALIVE |
| server/routes/ai/analyze-load.routes.ts | 94 | ✅ ALIVE |
| server/routes/home-report.routes.ts | 208 | ✅ ALIVE |
| server/routes/voice.routes.ts | 203 | ✅ ALIVE |
| server/routes/push.routes.ts | 27 | ✅ ALIVE |
| server/routes/drone-scan.routes.ts | 166 | ✅ ALIVE |
| server/routes/smart-home.routes.ts | 118 | ✅ ALIVE |
| server/routes/insurance-claims.routes.ts | 75 | ✅ ALIVE |
| server/routes/emergency-dispatch.routes.ts | 66 | ✅ ALIVE |
| server/routes/briefing.routes.ts | 29 | ✅ ALIVE |
| server/routes/home-utilities.routes.ts | 276 | ✅ ALIVE |
| server/routes/pricing.routes.ts | 135 | ✅ ALIVE |
| server/routes/diy-b2b-postbooking.routes.ts | 193 | ✅ ALIVE |
| server/routes/diy-coach.routes.ts | 124 | ✅ ALIVE |
| server/routes/pro-intelligence.routes.ts | 173 | ✅ ALIVE |
| server/routes/loyalty.routes.ts | 42 | ✅ ALIVE |
| server/routes/referrals.routes.ts | 66 | ✅ ALIVE |
| server/routes/community.routes.ts | 68 | ✅ ALIVE |
| server/routes/purchases.routes.ts | 208 | ✅ ALIVE |
| server/routes/shopping.routes.ts | 122 | ✅ ALIVE |
| server/routes/pro-field-assist.routes.ts | 139 | ✅ ALIVE |
| server/routes/diy-to-pro.routes.ts | 253 | ✅ ALIVE |
| server/routes/auto.routes.ts | 180 | ✅ ALIVE |
| server/routes/content.routes.ts | 58 | ✅ ALIVE |
| server/routes/invite-codes/invite-codes.routes.ts | 120 | ✅ ALIVE |
| server/routes/app-data.routes.ts | 178 | ✅ ALIVE |
| server/routes/pro-pricing.routes.ts | 159 | ✅ ALIVE |
| server/routes/smart-match.routes.ts | 239 | ✅ ALIVE |
| server/routes/business-partner.routes.ts | 630 | ✅ ALIVE |
| server/routes/insurance-tiered.routes.ts | 143 | ✅ ALIVE |
| server/services/thimble-integration.ts | 174 | ✅ ALIVE |
| server/routes/stripe-connect.routes.ts | 182 | ✅ ALIVE |
| server/routes/tax-reporting.routes.ts | 125 | ✅ ALIVE |
| server/routes/job-lifecycle.routes.ts | 519 | ✅ ALIVE |
| server/routes/batch1-fixes.routes.ts | 470 | ✅ ALIVE |
| server/routes/batch2-aliases.routes.ts | 257 | ✅ ALIVE |
| server/routes/background-check.routes.ts | 107 | ✅ ALIVE |
| server/routes/calendar.routes.ts | 146 | ✅ ALIVE |
| server/routes/sms-bot.routes.ts | 112 | ✅ ALIVE |
| server/routes/warranty.routes.ts | 187 | ✅ ALIVE |
| server/routes/builder-handoff.routes.ts | 80 | ✅ ALIVE |
| server/routes/schedule-batch.routes.ts | 88 | ✅ ALIVE |
| server/routes/quality-reports.routes.ts | 82 | ✅ ALIVE |
| server/routes/websocket/handlers.ts | 323 | ✅ ALIVE |

---

## SUMMARY

| Category | Count |
|---|---|
| Client routes (total entries in Switch) | 148 |
| Unique client components | ~134 |
| Client routes ALIVE | **148/148** ✅ |
| Client components DEAD/MISSING | **0** |
| Client components ORPHANED (imported, never routed) | **3** (PyckerLogin, PublicPricing, eager BusinessLanding) |
| Server route files registered | ~131 |
| Server route files ALIVE | **131/131** ✅ |
| Server route files DEAD/MISSING | **0** |

### Key Issues Found
1. **`BusinessLanding` naming conflict** — lazy import shadows eager import, causing `business-landing.tsx` to be unreachable on the business domain
2. **`PyckerLogin`** (pycker-login.tsx) — imported but never used in any route
3. **`PublicPricing`** (pricing.tsx) — imported but `/pricing` is a redirect; component never renders

**Overall health: Excellent.** No missing files, no broken routes. Three minor dead-code issues.
