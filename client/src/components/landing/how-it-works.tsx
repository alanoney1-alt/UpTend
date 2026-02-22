import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, ShieldCheck, Handshake, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const steps = [
  {
    pillar: "VALUE",
    keyword: "Value",
    title: "Unbeatable Value",
    description: "Instant AI-powered quotes mean no guessing and no haggling. You see the real price before you book.",
    icon: BadgeCheck,
    bullets: ["Instant AI Pricing", "Verified Maintenance Record", "Home Value Protection"],
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/30",
    checkColor: "text-orange-400 dark:text-orange-500",
  },
  {
    pillar: "SAFETY",
    keyword: "Safety",
    title: "Built-In Safety",
    description: "Every Pro is background-checked, fully insured up to $1M, and tracked in real-time.",
    icon: ShieldCheck,
    bullets: ["Background-Checked Pros", "$1M Liability Coverage", "Real-Time GPS Tracking"],
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    checkColor: "text-blue-400 dark:text-blue-500",
  },
  {
    pillar: "TRUST",
    keyword: "Trust",
    title: "Earned Trust",
    description: "We treat Pros like professionals \u2014 fair pay, instant payouts, and a real career path.",
    icon: Handshake,
    bullets: ["Instant Pro Payouts", "No Lead Fees Ever", "Full Photo Documentation"],
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    checkColor: "text-emerald-400 dark:text-emerald-500",
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
