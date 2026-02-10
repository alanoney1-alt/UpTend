import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Zap, Leaf, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const steps = [
  {
    pillar: "PROTECT",
    keyword: "Protect",
    title: "The Intelligence Phase",
    description: "Our AI monitors your home value and tracks market shifts. Your journey starts with a 360\u00B0 Home Audit that creates a digital shield, protecting you during insurance claims and resale.",
    icon: ShieldCheck,
    bullets: ["360\u00B0 Video Documentation", "Insurance Claim Shield", "Market Value Monitoring"],
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    checkColor: "text-blue-400 dark:text-blue-500",
  },
  {
    pillar: "CONNECT",
    keyword: "Connect",
    title: "The Action Phase",
    description: "Get on-demand access to our network of Vetted Pros. No middle-men, no lead fees, and no guessing. You book in minutes; we handle the rest with total transparency.",
    icon: Zap,
    bullets: ["Instant Match with local Pros", "Bilingual Support", "Transparent, Up-front Pay"],
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-100 dark:bg-cyan-900/30",
    checkColor: "text-cyan-400 dark:text-cyan-500",
  },
  {
    pillar: "SUSTAIN",
    keyword: "Sustain",
    title: "The Impact Phase",
    description: "Every job is ESG-tracked. We provide you with a verified report on the sustainability impact of your service, while our Pros build green credentials for their own careers.",
    icon: Leaf,
    bullets: ["Verified ESG Reporting", "Material Diversion Tracking", "Pro Sustainability Badges"],
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    checkColor: "text-green-400 dark:text-green-500",
  },
];

export function HowItWorks() {
  const { t } = useTranslation();

  const stepKeys = [
    { pillar: t("hero.pill_protect"), title: t("how.how_protect_title"), desc: t("how.how_protect_desc"), bullets: [t("how.how_protect_b1"), t("how.how_protect_b2"), t("how.how_protect_b3")] },
    { pillar: t("hero.pill_connect"), title: t("how.how_connect_title"), desc: t("how.how_connect_desc"), bullets: [t("how.how_connect_b1"), t("how.how_connect_b2"), t("how.how_connect_b3")] },
    { pillar: t("hero.pill_sustain"), title: t("how.how_sustain_title"), desc: t("how.how_sustain_desc"), bullets: [t("how.how_sustain_b1"), t("how.how_sustain_b2"), t("how.how_sustain_b3")] },
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24 bg-muted/30" data-testid="section-how-it-works">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            {t("how.how_badge")}
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 leading-tight" data-testid="text-how-headline">
            {t("how.how_headline")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("how.how_subhead")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 relative">
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 z-0" />

          {steps.map((step, idx) => (
            <Card
              key={step.keyword}
              className="relative z-10 p-6 lg:p-8 hover-elevate flex flex-col h-full"
              data-testid={`card-pillar-${step.keyword.toLowerCase()}`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`flex items-center justify-center w-12 h-12 rounded-md ${step.bg}`}>
                  <step.icon className={`w-6 h-6 ${step.color}`} />
                </div>
                <span className={`text-xs font-black uppercase tracking-widest ${step.color}`}>
                  {stepKeys[idx].pillar}
                </span>
              </div>

              <h3 className="text-xl lg:text-2xl font-black mb-3">{stepKeys[idx].title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-8 flex-1">
                {stepKeys[idx].desc}
              </p>

              <ul className="space-y-3">
                {stepKeys[idx].bullets.map((bullet, bIdx) => (
                  <li key={bIdx} className="flex items-center gap-3 text-xs font-bold">
                    <CheckCircle2 className={`w-4 h-4 ${step.checkColor} shrink-0`} />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <div className="mt-16 p-8 bg-slate-900 dark:bg-slate-950 rounded-md text-center">
          <p className="text-white text-lg md:text-xl font-medium italic opacity-90" data-testid="text-brand-mantra">
            &ldquo;{t("how.how_mantra")}&rdquo;
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="w-8 h-0.5 bg-primary" />
            <span className="text-primary text-xs font-bold uppercase tracking-widest">{t("how.how_mission")}</span>
            <div className="w-8 h-0.5 bg-primary" />
          </div>
        </div>
      </div>
    </section>
  );
}
