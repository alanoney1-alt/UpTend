import { usePageTitle } from "@/hooks/use-page-title";
import { useSearch } from "wouter";
import { useEffect } from "react";
import { Header } from "@/components/landing/header";
import { FloridaEstimator } from "@/components/booking/florida-estimator";

export default function BookingPage() {
  usePageTitle("Book a Service | UpTend");
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const preselectedService = params.get("service");

  // Scroll to top on mount — belt-and-suspenders with App-level ScrollToTop
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-white dark:from-zinc-950 dark:to-zinc-900">
      <Header />
      <main className="container mx-auto px-4 py-8 md:py-12">
        <FloridaEstimator preselectedService={preselectedService ?? undefined} />
      </main>
    </div>
  );
}
