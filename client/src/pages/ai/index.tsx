import { usePageTitle } from "@/hooks/use-page-title";
import { Link } from "wouter";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  FileSearch,
  Leaf,
  CalendarClock,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    title: "Photo-to-Quote",
    description:
      "Snap a photo of your junk or items. Our AI instantly estimates service type, scope, and price — no waiting for callbacks.",
    icon: Camera,
    href: "/ai/photo-quote",
    badge: "Popular",
    color: "bg-orange-100 text-[#F47C20]",
  },
  {
    title: "Document Scanner",
    description:
      "Upload warranties, receipts, or insurance docs. AI extracts key dates, amounts, and coverage details in seconds.",
    icon: FileSearch,
    href: "/ai/documents",
    badge: null,
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "Seasonal Advisor",
    description:
      "Get personalized maintenance tips based on your location and the time of year. Stay ahead of costly repairs.",
    icon: Leaf,
    href: "",
    badge: "Coming Soon",
    color: "bg-green-100 text-green-600",
  },
  {
    title: "Smart Scheduling",
    description:
      "AI suggests optimal service times based on weather forecasts and pro availability. Book at the perfect moment.",
    icon: CalendarClock,
    href: "",
    badge: "Coming Soon",
    color: "bg-purple-100 text-purple-600",
  },
];

export default function AIFeaturesHub() {
  usePageTitle("AI Home Tools | UpTend");
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#F47C20]/10 via-white to-orange-50 dark:from-[#F47C20]/5 dark:via-gray-950 dark:to-gray-900 pt-16 pb-10 md:pt-24 md:pb-16">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#F47C20]/10 text-[#F47C20] rounded-full px-3 py-1 text-xs font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Powered by AI
            </div>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
              Smart Home Services
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              From instant photo quotes to smart scheduling, our AI tools make
              managing your home effortless.
            </p>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="container mx-auto px-4 -mt-4 pb-20">
          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {features.map((f) => {
              const Wrapper = f.href ? Link : "div";
              const wrapperProps = f.href ? { href: f.href } : {};
              return (
              <Wrapper key={f.title} {...(wrapperProps as any)}>
                <Card className={`group p-6 transition-all duration-200 border-gray-200 dark:border-gray-800 h-full ${f.href ? "hover:shadow-lg cursor-pointer" : "opacity-80"}`}>
                  <div className="flex items-start gap-4">
                    <div
                      className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${f.color}`}
                    >
                      <f.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {f.title}
                        </h3>
                        {f.badge && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-[#F47C20]/10 text-[#F47C20]"
                          >
                            {f.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {f.description}
                      </p>
                    </div>
                    {f.href && <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#F47C20] transition-colors shrink-0 mt-1" />}
                  </div>
                </Card>
              </Wrapper>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
