import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import Landing from "@/pages/landing";
import Booking from "@/pages/booking";
import BookingSuccess from "@/pages/booking-success";
import Tracking from "@/pages/tracking";
import TrackingLookup from "@/pages/tracking-lookup";
import HaulerDashboard from "@/pages/hauler-dashboard";
import Haulers from "@/pages/haulers";
import Drive from "@/pages/drive";
import BusinessDashboard from "@/pages/business-dashboard";
import Loyalty from "@/pages/loyalty";
import PyckerSignup from "@/pages/pycker-signup";
import PyckerLogin from "@/pages/pycker-login";
import CustomerSignup from "@/pages/customer-signup";
import CustomerLogin from "@/pages/customer-login";
import AuthPage from "@/pages/auth-page";
import PaymentSetup from "@/pages/payment-setup";
import Profile from "@/pages/profile";
import About from "@/pages/about";
import FAQ from "@/pages/faq";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import RefundPolicy from "@/pages/refund-policy";
import CancellationPolicy from "@/pages/cancellation-policy";
import ServiceGuarantee from "@/pages/service-guarantee";
import Admin from "@/pages/admin";
import AdminLogin from "@/pages/admin-login";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import Contact from "@/pages/contact";
import Quote from "@/pages/quote";
import AgenticBrain from "@/pages/agentic-brain";
import ClaimProperty from "@/pages/claim-property";
import MyHomeInventory from "@/pages/my-home-inventory";
import CareerDashboard from "@/pages/career-dashboard";
import HaulerLanding from "@/pages/hauler-landing";
import PyckerAcademy from "@/pages/hauler-onboarding/academy";
import ActiveJob from "@/pages/active-job";
import CustomerDashboard from "@/pages/customer-dashboard";
import CustomerSubscriptions from "@/pages/customer-subscriptions";
import GodMode from "@/pages/admin/god-mode";
import CarbonTracking from "@/pages/admin/carbon-tracking";
import ProfileSettings from "@/pages/profile-settings";
import EarningsPage from "@/pages/hauler/earnings";
import PublicPricing from "@/pages/pricing";
import BecomePro from "@/pages/become-pro";
import AcademySyllabus from "@/pages/academy-syllabus";
import ProVerification from "@/pages/pro-verification";
import ProSustainabilityCert from "@/pages/pro-sustainability-cert";
import Services from "@/pages/services";
import HomeAudit from "@/pages/home-audit";
import HomeHealthAudit from "@/pages/home-health-audit";
import JunkRemoval from "@/pages/junk-removal";
import ReferralLanding from "@/pages/referral-landing";
import Marketplace from "@/pages/marketplace";
import BookFreshCut from "@/pages/book-freshcut";
import BookDeepFiber from "@/pages/book-deepfiber";
import NotFound from "@/pages/not-found";
import { trackInstall } from "@/lib/analytics";
import { InstallBanner } from "@/components/pwa/install-banner";
import { SupportWidget } from "@/components/support-widget";
import { MobileNav } from "@/components/mobile-nav";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/book" component={Booking} />
      <Route path="/booking-success" component={BookingSuccess} />
      <Route path="/haulers" component={Haulers} />
      <Route path="/drive" component={Drive} />
      <Route path="/pros" component={HaulerLanding} />
      <Route path="/tracking" component={TrackingLookup} />
      <Route path="/track/:jobId" component={Tracking} />
      <Route path="/hauler/dashboard" component={HaulerDashboard} />
      <Route path="/business" component={BusinessDashboard} />
      <Route path="/rewards" component={Loyalty} />
      <Route path="/loyalty" component={Loyalty} />
      <Route path="/ref/:code" component={ReferralLanding} />
      <Route path="/pycker/signup" component={PyckerSignup} />
      <Route path="/pycker-signup" component={PyckerSignup} />
      <Route path="/become-a-pycker" component={PyckerSignup} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/pycker/login" component={AuthPage} />
      <Route path="/pycker-login" component={AuthPage} />
      <Route path="/signup" component={CustomerSignup} />
      <Route path="/customer-signup" component={CustomerSignup} />
      <Route path="/login" component={AuthPage} />
      <Route path="/customer-login" component={AuthPage} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/payment-setup" component={PaymentSetup} />
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
      <Route path="/admin/god-mode" component={GodMode} />
      <Route path="/settings" component={ProfileSettings} />
      <Route path="/hauler/earnings" component={EarningsPage} />
      <Route path="/pricing" component={PublicPricing} />
      <Route path="/become-pro" component={BecomePro} />
      <Route path="/academy-syllabus" component={AcademySyllabus} />
      <Route path="/services" component={Services} />
      <Route path="/services/home-audit" component={HomeAudit} />
      <Route path="/services/audit" component={HomeAudit} />
      <Route path="/home-audit" component={HomeAudit} />
      <Route path="/dwellscan" component={HomeAudit} />
      <Route path="/home-health-audit" component={HomeHealthAudit} />
      <Route path="/audit" component={HomeHealthAudit} />
      <Route path="/services/material-recovery" component={JunkRemoval} />
      <Route path="/services/junk" component={JunkRemoval} />
      <Route path="/services/freshcut" component={BookFreshCut} />
      <Route path="/services/landscaping" component={BookFreshCut} />
      <Route path="/book/freshcut" component={BookFreshCut} />
      <Route path="/services/deepfiber" component={BookDeepFiber} />
      <Route path="/services/carpet-cleaning" component={BookDeepFiber} />
      <Route path="/book/deepfiber" component={BookDeepFiber} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/pro/verify" component={ProVerification} />
      <Route path="/pro/sustainability-cert" component={ProSustainabilityCert} />
      <Route component={NotFound} />
    </Switch>
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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <Toaster />
          <Router />
          <MobileNav />
          <SupportWidget />
          <InstallBanner />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
