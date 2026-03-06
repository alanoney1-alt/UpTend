import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSEO } from "@/hooks/use-seo";
import { useSearch, useLocation } from "wouter";
import { useEffect } from "react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { GeorgeInlineTip } from "@/components/george-inline-tip";
import { FloridaEstimator } from "@/components/booking/florida-estimator";
import { NeighborhoodPriceContext } from "@/components/neighborhood-price-context";
import { PaymentForm } from "@/components/payment-form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  ShieldCheck,
  CheckCircle,
  Shield,
  ClipboardCheck,
  MapPin,
  Calendar,
  ChevronDown,
} from "lucide-react";

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border dark:border-slate-700">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="text-sm font-semibold text-foreground dark:text-white pr-4">
          {question}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <p className="pb-4 text-sm text-muted-foreground dark:text-slate-300 leading-relaxed">
          {answer}
        </p>
      )}
    </div>
  );
}

export default function BookingPage() {
  const { t } = useTranslation();
  useSEO({
    title: "Book a Service | UpTend",
    description: "Book trusted Orlando home services in minutes. Instant quotes for cleaning, lawn care, pressure washing, junk removal & more. Vetted pros, satisfaction guaranteed.",
    path: "/book",
  });
  const searchString = useSearch();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const params = new URLSearchParams(searchString);
  const preselectedService = params.get("service");
  const preselectedTiming = params.get("timing");

  const directJobId = params.get("jobId");
  const directAmount = params.get("amount");
  const directStep = params.get("step");

  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // Direct payment step
  if (directStep === "payment" && directJobId && directAmount) {
    const amount = parseFloat(directAmount);
    const customerId = (user as any)?.userId || (user as any)?.id || "";
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main id="main-content" className="container mx-auto px-4 pt-24 pb-24 md:pt-28 md:pb-12">
          <div className="w-full max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground dark:text-white mb-3">
                {t("booking_page.complete_payment")}
              </h2>
              <p className="text-base text-muted-foreground dark:text-slate-300">
                {t("booking_page.authorize_payment")}
              </p>
            </div>
            <PaymentForm
              amount={amount}
              jobId={directJobId}
              customerId={customerId}
              onSuccess={() => {
                toast({
                  title: "Payment authorized!",
                  description:
                    "Your booking is confirmed. A verified Pro will be dispatched soon.",
                });
                navigate("/booking-success");
              }}
              onError={(error) => {
                toast({
                  title: "Payment didn't go through",
                  description: error || "Check your card details and give it another shot.",
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
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-20">
      </div>
      <main id="main-content" className="container mx-auto px-4 pt-24 pb-16 md:pt-28">
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h1 className="text-3xl md:text-5xl font-black text-foreground dark:text-white tracking-tight mb-3">
            {t("booking_page.hero_title")}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground dark:text-slate-300 mb-6">
            {t("booking_page.hero_subtitle")}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { icon: ShieldCheck, label: t("booking_page.badge_price"), tooltip: t("booking_page.badge_price_tooltip") },
              { icon: CheckCircle, label: t("booking_page.badge_background") },
              { icon: Shield, label: t("booking_page.badge_insured") },
            ].map((badge) => (
              <div
                key={badge.label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold"
                title={(badge as any).tooltip || ""}
              >
                <badge.icon className="w-3.5 h-3.5" />
                {badge.label}
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { step: 1, icon: MapPin, text: t("booking_page.step1") },
              { step: 2, icon: ClipboardCheck, text: t("booking_page.step2") },
              { step: 3, icon: Calendar, text: t("booking_page.step3") },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center gap-2">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{item.step}</span>
                  </div>
                  <item.icon className="w-3.5 h-3.5 text-primary absolute -bottom-0.5 -right-0.5" />
                </div>
                <span className="text-xs text-muted-foreground dark:text-slate-400 leading-tight font-medium">
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Services Banner */}
        <div className="max-w-2xl mx-auto mb-6 px-4 py-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-center">
          <p className="text-sm font-medium text-foreground dark:text-white">
            Now serving <strong>HVAC</strong> and <strong>Junk Removal</strong> in Orlando Metro. More services coming soon.
          </p>
        </div>

        {/* Florida Estimator */}
        <FloridaEstimator
          preselectedService={preselectedService ?? undefined}
          preselectedTiming={preselectedTiming ?? undefined}
        />

        {/* Neighborhood Price Context */}
        {preselectedService && (
          <div className="max-w-2xl mx-auto mt-6">
            <NeighborhoodPriceContext serviceType={preselectedService} />
          </div>
        )}

        {/* Trust line */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-10 mb-12 max-w-lg mx-auto">
          {t("booking_page.trust_line")}
        </p>

        {/* FAQ */}
        <div className="max-w-xl mx-auto mb-8">
          <h2 className="text-lg font-bold text-foreground dark:text-white mb-4 text-center">
            {t("booking_page.faq_title")}
          </h2>
          <FAQItem
            question={t("booking_page.faq_q1")}
            answer={t("booking_page.faq_a1")}
          />
          <FAQItem
            question={t("booking_page.faq_q2")}
            answer={t("booking_page.faq_a2")}
          />
          <FAQItem
            question={t("booking_page.faq_q3")}
            answer={t("booking_page.faq_a3")}
          />
          <FAQItem
            question={t("booking_page.faq_q4")}
            answer={t("booking_page.faq_a4")}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
