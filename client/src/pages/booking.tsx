import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePageTitle } from "@/hooks/use-page-title";
import { useSearch, useLocation } from "wouter";
import { useEffect } from "react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { FloridaEstimator } from "@/components/booking/florida-estimator";
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
  Camera,
} from "lucide-react";

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-200 dark:border-slate-700">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left"
      >
        <span className="text-sm font-semibold text-slate-900 dark:text-white pr-4">
          {question}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <p className="pb-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {answer}
        </p>
      )}
    </div>
  );
}

export default function BookingPage() {
  const { t } = useTranslation();
  usePageTitle("Book a Service | UpTend");
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
      <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-white dark:from-zinc-950 dark:to-zinc-900">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-24 md:pt-28 md:pb-12">
          <div className="w-full max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">
                {t("booking_page.complete_payment")}
              </h2>
              <p className="text-base text-slate-600 dark:text-slate-300">
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
      <main className="container mx-auto px-4 pt-24 pb-16 md:pt-28">
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
            {t("booking_page.hero_title")}
          </h1>
          <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 mb-6">
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
                <span className="text-xs text-slate-600 dark:text-slate-400 leading-tight font-medium">
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Smart Match CTA */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 p-6 text-center">
            <div className="relative z-10">
              <ShieldCheck className="w-8 h-8 text-[#ea580c] mx-auto mb-3" />
              <h2 className="text-xl font-bold text-white mb-1">Get Matched With Your Best Pro</h2>
              <p className="text-sm text-slate-300 mb-4 max-w-md mx-auto">
                One price. One pro. Background-checked, insured, and price-protected. 5% service fee covers everything.
              </p>
              <a
                href="/smart-book"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#ea580c] hover:bg-[#dc4c08] text-white font-bold text-sm transition-colors"
              >
                Get Matched
              </a>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#ea580c]/10 rounded-full blur-3xl" />
          </div>
        </div>

        {/* Divider */}
        <div className="max-w-2xl mx-auto mb-6 flex items-center gap-4">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          <span className="text-xs text-slate-400 font-semibold uppercase">Or build a custom estimate</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
        </div>

        {/* Snap Quote Option */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="text-center sm:text-left">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Not sure what you need?</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Snap a photo and we'll scope the job for you.</p>
            </div>
            <a
              href="/snap-quote"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors shrink-0"
            >
              <Camera className="w-4 h-4" />
              Photo Quote
            </a>
          </div>
        </div>

        {/* Florida Estimator */}
        <FloridaEstimator
          preselectedService={preselectedService ?? undefined}
          preselectedTiming={preselectedTiming ?? undefined}
        />

        {/* Trust line */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-10 mb-12 max-w-lg mx-auto">
          {t("booking_page.trust_line")}
        </p>

        {/* FAQ */}
        <div className="max-w-xl mx-auto mb-8">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 text-center">
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
