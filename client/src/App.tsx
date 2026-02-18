import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, lazy, Suspense } from "react";
import { trackInstall } from "@/lib/analytics";
import { InstallBanner } from "@/components/pwa/install-banner";
import { CookieConsent } from "@/components/cookie-consent";
import { UpTendGuide } from "@/components/ai/uptend-guide";
import { MobileNav } from "@/components/mobile-nav";
import { ErrorBoundary } from "@/components/error-boundary";

// Eagerly load critical path pages
import Landing from "@/pages/landing";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";

// Lazy load everything else
const Booking = lazy(() => import("@/pages/booking"));
const BookingSuccess = lazy(() => import("@/pages/booking-success"));
const Tracking = lazy(() => import("@/pages/tracking"));
const TrackingLookup = lazy(() => import("@/pages/tracking-lookup"));
const HaulerDashboard = lazy(() => import("@/pages/hauler-dashboard"));
const Haulers = lazy(() => import("@/pages/haulers"));
const Drive = lazy(() => import("@/pages/drive"));
const BusinessDashboard = lazy(() => import("@/pages/business-dashboard"));
const BusinessLanding = lazy(() => import("@/pages/business"));
const BusinessLogin = lazy(() => import("@/pages/business-login"));
const BusinessRegister = lazy(() => import("@/pages/business-register"));
const Loyalty = lazy(() => import("@/pages/loyalty"));
const PyckerSignup = lazy(() => import("@/pages/pycker-signup"));
const PyckerLogin = lazy(() => import("@/pages/pycker-login"));
const CustomerSignup = lazy(() => import("@/pages/customer-signup"));
const CustomerLogin = lazy(() => import("@/pages/customer-login"));
const PaymentSetup = lazy(() => import("@/pages/payment-setup"));
const ProPayoutSetup = lazy(() => import("@/pages/pro-payout-setup"));
const Profile = lazy(() => import("@/pages/profile"));
const About = lazy(() => import("@/pages/about"));
const FAQ = lazy(() => import("@/pages/faq"));
const Terms = lazy(() => import("@/pages/terms"));
const Privacy = lazy(() => import("@/pages/privacy"));
const RefundPolicy = lazy(() => import("@/pages/refund-policy"));
const CancellationPolicy = lazy(() => import("@/pages/cancellation-policy"));
const ServiceGuarantee = lazy(() => import("@/pages/service-guarantee"));
const Admin = lazy(() => import("@/pages/admin"));
const AdminLogin = lazy(() => import("@/pages/admin-login"));
const ForgotPassword = lazy(() => import("@/pages/forgot-password"));
const ResetPassword = lazy(() => import("@/pages/reset-password"));
const Contact = lazy(() => import("@/pages/contact"));
const Quote = lazy(() => import("@/pages/quote"));
const AgenticBrain = lazy(() => import("@/pages/agentic-brain"));
const ClaimProperty = lazy(() => import("@/pages/claim-property"));
const MyHomeInventory = lazy(() => import("@/pages/my-home-inventory"));
const CareerDashboard = lazy(() => import("@/pages/career-dashboard"));
const HaulerLanding = lazy(() => import("@/pages/hauler-landing"));
const PyckerAcademy = lazy(() => import("@/pages/hauler-onboarding/academy"));
const ActiveJob = lazy(() => import("@/pages/active-job"));
const CustomerDashboard = lazy(() => import("@/pages/customer-dashboard"));
const CustomerSubscriptions = lazy(() => import("@/pages/customer-subscriptions"));
const GodMode = lazy(() => import("@/pages/admin/god-mode"));
const CarbonTracking = lazy(() => import("@/pages/admin/carbon-tracking"));
const AdminProMap = lazy(() => import("@/pages/admin/pro-map"));
const AdminAccounting = lazy(() => import("@/pages/admin/accounting"));
const ProfileSettings = lazy(() => import("@/pages/profile-settings"));
const EarningsPage = lazy(() => import("@/pages/hauler/earnings"));
const PublicPricing = lazy(() => import("@/pages/pricing"));
const BecomePro = lazy(() => import("@/pages/become-pro"));
const AcademySyllabus = lazy(() => import("@/pages/academy-syllabus"));
const ProVerification = lazy(() => import("@/pages/pro-verification"));
const ProSustainabilityCert = lazy(() => import("@/pages/pro-sustainability-cert"));
const Services = lazy(() => import("@/pages/services"));
const HomeAudit = lazy(() => import("@/pages/home-audit"));
const HomeHealthAudit = lazy(() => import("@/pages/home-health-audit"));
const JunkRemoval = lazy(() => import("@/pages/junk-removal"));
const ReferralLanding = lazy(() => import("@/pages/referral-landing"));
const Marketplace = lazy(() => import("@/pages/marketplace"));
const BookFreshCut = lazy(() => import("@/pages/book-freshcut"));
const BookDeepFiber = lazy(() => import("@/pages/book-deepfiber"));
const Properties = lazy(() => import("@/pages/properties"));
const PropertyDashboard = lazy(() => import("@/pages/property-dashboard"));
const AIFeaturesHub = lazy(() => import("@/pages/ai/index"));
const PhotoToQuote = lazy(() => import("@/pages/ai/photo-quote"));
const DocumentScanner = lazy(() => import("@/pages/ai/document-scanner"));
const HomeScan = lazy(() => import("@/pages/ai/home-scan"));
const MyJobs = lazy(() => import("@/pages/my-jobs"));
const ServiceDetail = lazy(() => import("@/pages/service-detail"));
const Sustainability = lazy(() => import("@/pages/sustainability"));
const Emergency = lazy(() => import("@/pages/emergency"));
const Neighborhood = lazy(() => import("@/pages/neighborhood"));
const Insurance = lazy(() => import("@/pages/insurance"));
const SubscriptionPlans = lazy(() => import("@/pages/subscription-plans"));
const CostGuidesHub = lazy(() => import("@/pages/cost-guides/index"));
const CostGuide = lazy(() => import("@/pages/cost-guides/guide"));
const PartnersLanding = lazy(() => import("@/pages/partners/index"));
const PartnerRegister = lazy(() => import("@/pages/partners/register"));
const PartnerDashboard = lazy(() => import("@/pages/partners/dashboard"));
const FleetTracking = lazy(() => import("@/pages/fleet-tracking"));
const BusinessIntegrations = lazy(() => import("@/pages/business-integrations"));
const HomeProfilePage = lazy(() => import("@/pages/home-profile"));
const BusinessCompliance = lazy(() => import("@/pages/business-compliance"));
const BusinessGovernment = lazy(() => import("@/pages/business-government"));
const GovernmentContractDashboard = lazy(() => import("@/pages/government/contract-dashboard"));
const GovernmentContractDetail = lazy(() => import("@/pages/government/contract-detail"));
const GovernmentLaborEntry = lazy(() => import("@/pages/government/labor-entry"));
const GovernmentPayrollReport = lazy(() => import("@/pages/government/payroll-report"));
const GovernmentWorkOrders = lazy(() => import("@/pages/government/work-orders"));
const GovernmentFloatDashboard = lazy(() => import("@/pages/government/float-dashboard"));
const GovernmentWorkOrderDetail = lazy(() => import("@/pages/government/work-order-detail"));
const BusinessCommunities = lazy(() => import("@/pages/business-communities"));
const BusinessProperties = lazy(() => import("@/pages/business-properties"));
const BusinessConstruction = lazy(() => import("@/pages/business-construction"));
const VeteransPage = lazy(() => import("@/pages/veterans"));
const BusinessReports = lazy(() => import("@/pages/business-reports"));
const B2BPricing = lazy(() => import("@/pages/b2b-pricing"));
const BusinessInvoices = lazy(() => import("@/pages/business-invoices"));
const BusinessOnboarding = lazy(() => import("@/pages/business-onboarding"));
const BusinessBooking = lazy(() => import("@/pages/business-booking"));
const BusinessBilling = lazy(() => import("@/pages/business-billing"));
const AdminBilling = lazy(() => import("@/pages/admin/billing"));
const FindPro = lazy(() => import("@/pages/find-pro"));

// SEO Landing Pages
const JunkRemovalLakeNona = lazy(() => import("@/pages/services/junk-removal-lake-nona"));
const PressureWashingOrlando = lazy(() => import("@/pages/services/pressure-washing-orlando"));
const HandymanOrlando = lazy(() => import("@/pages/services/handyman-orlando"));
const LandscapingLakeNona = lazy(() => import("@/pages/services/landscaping-lake-nona"));
const GutterCleaningOrlando = lazy(() => import("@/pages/services/gutter-cleaning-orlando"));
const PoolCleaningLakeNona = lazy(() => import("@/pages/services/pool-cleaning-lake-nona"));
const HomeServicesLakeNona = lazy(() => import("@/pages/services/home-services-lake-nona"));
const HomeCleaningOrlando = lazy(() => import("@/pages/services/home-cleaning-orlando"));
const MovingLaborOrlando = lazy(() => import("@/pages/services/moving-labor-orlando"));

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}

function Router() {
  return (
    <>
    <ScrollToTop />
    <Suspense fallback={<PageLoader />}>
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/book" component={Booking} />
      <Route path="/booking-success" component={BookingSuccess} />
      <Route path="/haulers" component={Haulers} />
      <Route path="/drive" component={Drive} />
      <Route path="/pros" component={HaulerLanding} />
      <Route path="/tracking" component={TrackingLookup} />
      <Route path="/track/:jobId" component={Tracking} />
      <Route path="/my-jobs" component={MyJobs} />
      {/* Pro routes (new terminology) */}
      <Route path="/pro/dashboard" component={HaulerDashboard} />
      <Route path="/pro/earnings" component={EarningsPage} />
      {/* Legacy hauler routes for backward compatibility */}
      <Route path="/hauler/dashboard" component={HaulerDashboard} />
      <Route path="/hauler/earnings" component={EarningsPage} />
      <Route path="/business" component={BusinessLanding} />
      <Route path="/business/login" component={BusinessLogin} />
      <Route path="/business/register" component={BusinessRegister} />
      <Route path="/business/dashboard" component={BusinessDashboard} />
      <Route path="/business/compliance" component={BusinessCompliance} />
      <Route path="/business/government" component={BusinessGovernment} />
      <Route path="/government/contracts" component={GovernmentContractDashboard} />
      <Route path="/government/contracts/:id" component={GovernmentContractDetail} />
      <Route path="/government/contracts/:id/labor" component={GovernmentLaborEntry} />
      <Route path="/government/contracts/:id/payroll/:reportId" component={GovernmentPayrollReport} />
      <Route path="/government/work-orders" component={GovernmentWorkOrders} />
      <Route path="/government/float" component={GovernmentFloatDashboard} />
      <Route path="/government/work-orders/:id" component={GovernmentWorkOrderDetail} />
      <Route path="/business/communities" component={BusinessCommunities} />
      <Route path="/business/properties" component={BusinessProperties} />
      <Route path="/business/construction" component={BusinessConstruction} />
      <Route path="/business/reports" component={BusinessReports} />
      <Route path="/business/invoices" component={BusinessInvoices} />
      <Route path="/business/integrations" component={BusinessIntegrations} />
      <Route path="/business/onboarding" component={BusinessOnboarding} />
      <Route path="/business/booking" component={BusinessBooking} />
      <Route path="/business/billing" component={BusinessBilling} />
      <Route path="/admin/billing" component={AdminBilling} />
      <Route path="/veterans" component={VeteransPage} />
      <Route path="/rewards" component={Loyalty} />
      <Route path="/loyalty" component={Loyalty} />
      <Route path="/ref/:code" component={ReferralLanding} />
      {/* Pro signup/login routes (new terminology) */}
      <Route path="/pro/signup" component={PyckerSignup} />
      <Route path="/pro/login" component={AuthPage} />
      {/* Legacy pycker routes for backward compatibility */}
      <Route path="/pycker/signup" component={PyckerSignup} />
      <Route path="/pycker-signup" component={PyckerSignup} />
      <Route path="/become-a-pycker" component={PyckerSignup} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/pycker/login" component={AuthPage} />
      <Route path="/pycker-login" component={AuthPage} />
      <Route path="/signup" component={CustomerSignup} />
      <Route path="/customer-signup" component={CustomerSignup} />
      <Route path="/login" component={AuthPage} />
      <Route path="/register" component={CustomerSignup} />
      <Route path="/customer-login" component={CustomerLogin} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/payment-setup" component={PaymentSetup} />
      <Route path="/pro/payouts/setup" component={ProPayoutSetup} />
      <Route path="/pro/payouts/setup/complete" component={ProPayoutSetup} />
      <Route path="/pro/payouts/setup/refresh" component={ProPayoutSetup} />
      <Route path="/profile" component={Profile} />
      <Route path="/about" component={About} />
      <Route path="/faq" component={FAQ} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/refund-policy" component={RefundPolicy} />
      <Route path="/cancellation-policy" component={CancellationPolicy} />
      <Route path="/service-guarantee" component={ServiceGuarantee} />
      <Route path="/admin" component={Admin} />
      <Route path="/admin/agentic-brain" component={AgenticBrain} />
      <Route path="/admin/carbon-tracking" component={CarbonTracking} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/contact" component={Contact} />
      <Route path="/quote" component={Quote} />
      <Route path="/claim/:token" component={ClaimProperty} />
      <Route path="/my-home" component={MyHomeInventory} />
      <Route path="/career" component={CareerDashboard} />
      <Route path="/academy" component={PyckerAcademy} />
      <Route path="/job/:jobId/work" component={ActiveJob} />
      <Route path="/dashboard" component={CustomerDashboard} />
      <Route path="/subscriptions" component={CustomerSubscriptions} />
      <Route path="/plans" component={SubscriptionPlans} />
      <Route path="/admin/pro-map" component={AdminProMap} />
      <Route path="/admin/god-mode" component={GodMode} />
      <Route path="/admin/accounting" component={AdminAccounting} />
      <Route path="/settings" component={ProfileSettings} />
      <Route path="/pricing" component={PublicPricing} />
      <Route path="/become-pro" component={BecomePro} />
      <Route path="/pro-signup">{() => <Redirect to="/login?tab=pro" />}</Route>
      <Route path="/academy-syllabus" component={AcademySyllabus} />
      <Route path="/academy/:slug" component={AcademySyllabus} />
      <Route path="/services" component={Services} />
      <Route path="/services/home-audit" component={HomeAudit} />
      <Route path="/services/audit" component={HomeAudit} />
      <Route path="/home-audit" component={HomeAudit} />
      <Route path="/home-scan">{() => <Redirect to="/services/home-audit" />}</Route>
      <Route path="/dwellscan" component={HomeAudit} />{/* Legacy redirect */}
      <Route path="/home-health-audit" component={HomeHealthAudit} />
      <Route path="/audit" component={HomeHealthAudit} />
      <Route path="/services/material-recovery" component={JunkRemoval} />
      <Route path="/services/junk" component={JunkRemoval} />
      <Route path="/book/freshcut" component={BookFreshCut} />
      <Route path="/book/deepfiber" component={BookDeepFiber} />
      <Route path="/cost-guides" component={CostGuidesHub} />
      <Route path="/cost-guides/:slug" component={CostGuide} />
      <Route path="/services/junk-removal-lake-nona" component={JunkRemovalLakeNona} />
      <Route path="/services/pressure-washing-orlando" component={PressureWashingOrlando} />
      <Route path="/services/handyman-orlando" component={HandymanOrlando} />
      <Route path="/services/landscaping-lake-nona" component={LandscapingLakeNona} />
      <Route path="/services/gutter-cleaning-orlando" component={GutterCleaningOrlando} />
      <Route path="/services/pool-cleaning-lake-nona" component={PoolCleaningLakeNona} />
      <Route path="/services/home-services-lake-nona" component={HomeServicesLakeNona} />
      <Route path="/services/home-cleaning-orlando" component={HomeCleaningOrlando} />
      <Route path="/services/moving-labor-orlando" component={MovingLaborOrlando} />
      <Route path="/services/:slug" component={ServiceDetail} />
      <Route path="/sustainability" component={Sustainability} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/pro/verify" component={ProVerification} />
      <Route path="/pro/sustainability-cert" component={ProSustainabilityCert} />
      <Route path="/properties" component={Properties} />
      <Route path="/properties/:propertyId" component={PropertyDashboard} />
      <Route path="/emergency" component={Emergency} />
      <Route path="/neighborhood" component={Neighborhood} />
      <Route path="/insurance" component={Insurance} />
      <Route path="/ai" component={AIFeaturesHub} />
      <Route path="/ai/photo-quote" component={PhotoToQuote} />
      <Route path="/ai/documents" component={DocumentScanner} />
      <Route path="/ai/home-scan" component={HomeScan} />
      <Route path="/find-pro" component={FindPro} />
      <Route path="/b2b-pricing" component={B2BPricing} />
      <Route path="/fleet-tracking" component={FleetTracking} />
      <Route path="/partners" component={PartnersLanding} />
      <Route path="/partners/register" component={PartnerRegister} />
      <Route path="/partners/dashboard" component={PartnerDashboard} />
      <Route path="/my-home-profile" component={HomeProfilePage} />
      <Route component={NotFound} />
    </Switch>
    </Suspense>
    </>
  );
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
    }
  }, []);

  return <>{children}</>;
}

function App() {
  useEffect(() => {
    trackInstall();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeProvider>
            <Toaster />
            <Router />
            <MobileNav />
            <UpTendGuide />
            <InstallBanner />
            <CookieConsent />
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
