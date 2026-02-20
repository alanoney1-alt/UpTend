import { usePageTitle } from "@/hooks/use-page-title";
import { useSearch, useLocation } from "wouter";
import { useEffect } from "react";
import { Header } from "@/components/landing/header";
import { FloridaEstimator } from "@/components/booking/florida-estimator";
import { PaymentForm } from "@/components/payment-form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function BookingPage() {
  usePageTitle("Book a Service | UpTend");
  const searchString = useSearch();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const params = new URLSearchParams(searchString);
  const preselectedService = params.get("service");
  const preselectedTiming = params.get("timing");

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
        <main className="container mx-auto px-4 py-8 md:py-12">
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
      <main className="container mx-auto px-4 py-8 md:py-12">
        <FloridaEstimator preselectedService={preselectedService ?? undefined} preselectedTiming={preselectedTiming ?? undefined} />
      </main>
    </div>
  );
}
