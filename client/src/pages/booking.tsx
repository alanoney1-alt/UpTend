import { usePageTitle } from "@/hooks/use-page-title";
import { useSearch, useLocation } from "wouter";
import { useEffect, useState, useMemo } from "react";
import { Header } from "@/components/landing/header";
import { FloridaEstimator } from "@/components/booking/florida-estimator";
import { PaymentForm } from "@/components/payment-form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Check } from "lucide-react";

/* ─── Step Progress Indicator ─── */
const BOOKING_STEPS = [
  { label: "Service", num: 1 },
  { label: "Details", num: 2 },
  { label: "Schedule", num: 3 },
  { label: "Review", num: 4 },
  { label: "Payment", num: 5 },
] as const;

function StepProgressBar({ activeStep }: { activeStep: number }) {
  return (
    <div className="sticky top-16 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-black/5 dark:border-white/5 py-3 px-4">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        {BOOKING_STEPS.map((step, i) => {
          const isCompleted = activeStep > step.num;
          const isActive = activeStep === step.num;
          return (
            <div key={step.num} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isActive
                      ? "bg-[#F47C20] text-white ring-4 ring-[#F47C20]/20"
                      : "bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.num}
                </div>
                <span
                  className={`text-[10px] font-medium ${
                    isCompleted
                      ? "text-green-600 dark:text-green-400"
                      : isActive
                      ? "text-[#F47C20]"
                      : "text-gray-400 dark:text-zinc-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < BOOKING_STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mt-[-12px] ${
                    activeStep > step.num
                      ? "bg-green-500"
                      : "bg-gray-200 dark:bg-zinc-700"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Mr. George Tips ─── */
const GEORGE_TIPS: Record<string, string> = {
  pressure_washing: "Pressure washing? Most Orlando homes need it twice a year due to humidity and mildew.",
  moving_labor: "Moving? Our pros bring all equipment — just point and direct!",
  junk_removal: "Pro tip: Group similar items together before pickup day to save time and money.",
  handyman: "Not sure what's wrong? Our handymen can diagnose and fix in one visit.",
  home_cleaning: "First-time deep clean usually takes 2-3x longer than maintenance cleans.",
  landscaping: "Florida lawns grow year-round — monthly maintenance keeps things sharp.",
  gutter_cleaning: "Clogged gutters cause 90% of Florida roof leaks. Clean them twice a year!",
  pool_cleaning: "Pool chemistry changes fast in Florida heat — weekly service prevents algae.",
  carpet_cleaning: "For best results, vacuum thoroughly before our pros arrive.",
  garage_cleanout: "Take photos of everything first — you'll be surprised what you want to keep!",
  light_demolition: "Our demo crews handle permits when needed. Just tell us what's coming down.",
};

function GeorgeTip({ service }: { service: string | null }) {
  const tip = service ? GEORGE_TIPS[service] : null;
  const defaultTip = "All our pros are background-checked, insured, and rated by real Orlando homeowners.";
  return (
    <div className="max-w-2xl mx-auto mb-4">
      <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-700/30 rounded-xl px-4 py-3">
        <span className="text-lg leading-none mt-0.5">💡</span>
        <div>
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Mr. George tip</span>
          <p className="text-sm text-amber-900 dark:text-amber-200 mt-0.5">{tip || defaultTip}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Map internal estimator step to display step ─── */
function mapToDisplayStep(internalStep: number | string): number {
  if (internalStep === 1) return 1;
  if (internalStep === 2 || internalStep === "choose-pro") return 2;
  if (internalStep === 3 || internalStep === 4 || internalStep === 5) return 3;
  if (internalStep === 6) return 4;
  if (internalStep === 7) return 5;
  return 1;
}

export default function BookingPage() {
  usePageTitle("Book a Service | UpTend");
  const searchString = useSearch();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const params = new URLSearchParams(searchString);
  const preselectedService = params.get("service");
  const preselectedTiming = params.get("timing");

  // Track estimator step for progress bar
  const [estimatorStep, setEstimatorStep] = useState<number | string>(1);
  const displayStep = useMemo(() => mapToDisplayStep(estimatorStep), [estimatorStep]);

  // Direct payment step — used when Mr. George AI creates a booking draft and redirects here
  const directJobId = params.get("jobId");
  const directAmount = params.get("amount");
  const directStep = params.get("step");

  // Scroll to top on mount — belt-and-suspenders with App-level ScrollToTop
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // Direct payment step: ?step=payment&jobId=xxx&amount=yyy
  if (directStep === "payment" && directJobId && directAmount) {
    const amount = parseFloat(directAmount);
    const customerId = (user as any)?.userId || (user as any)?.id || "";
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-white dark:from-zinc-950 dark:to-zinc-900">
        <Header />
        <StepProgressBar activeStep={5} />
        <main className="container mx-auto px-4 pt-6 pb-24 md:pb-12">
          <GeorgeTip service={null} />
          <div className="w-full max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">
                Complete Payment
              </h2>
              <p className="text-base text-slate-600 dark:text-slate-300">
                Authorize payment to confirm your booking
              </p>
            </div>
            <PaymentForm
              amount={amount}
              jobId={directJobId}
              customerId={customerId}
              onSuccess={() => {
                toast({
                  title: "Payment authorized!",
                  description: "Your booking is confirmed. A verified Pro will be dispatched soon.",
                });
                navigate("/booking-success");
              }}
              onError={(error) => {
                toast({
                  title: "Payment failed",
                  description: error,
                  variant: "destructive",
                });
              }}
            />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-white dark:from-zinc-950 dark:to-zinc-900">
      <Header />
      <StepProgressBar activeStep={displayStep} />
      <main className="container mx-auto px-4 pt-6 pb-24 md:pb-12">
        <GeorgeTip service={preselectedService} />
        <FloridaEstimator
          preselectedService={preselectedService ?? undefined}
          preselectedTiming={preselectedTiming ?? undefined}
          onStepChange={setEstimatorStep}
        />
      </main>
    </div>
  );
}
