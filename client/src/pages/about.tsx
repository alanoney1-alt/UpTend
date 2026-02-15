import { usePageTitle } from "@/hooks/use-page-title";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, Zap, Leaf, Quote, ArrowRight,
  Shield, DollarSign, Heart, Users, CheckCircle,
  Target,
} from "lucide-react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import founderPhoto from "@assets/stock_images/professional_male_wo_4cd11950.jpg";

function useValues() {
  const { t } = useTranslation();
  return [
    {
      icon: Shield,
      title: t("about.value_accountability_title"),
      description: t("about.value_accountability_desc"),
    },
    {
      icon: Heart,
      title: t("about.value_empowerment_title"),
      description: t("about.value_empowerment_desc"),
    },
    {
      icon: DollarSign,
      title: t("about.value_pricing_title"),
      description: t("about.value_pricing_desc"),
    },
    {
      icon: Leaf,
      title: t("about.value_sustainability_title"),
      description: t("about.value_sustainability_desc"),
    },
  ];
}

const milestones = [
  { year: "2024", event: "UpTend founded in Orlando, Florida" },
  { year: "2024", event: "First 100 Verified Pros join the network" },
  { year: "2025", event: "Expanded to serve all of Central Florida" },
  { year: "2025", event: "Launched AI-powered visual quoting" },
  { year: "2025", event: "10,000+ jobs completed with full impact tracking" },
];

export default function About() {
  usePageTitle("About UpTend | Smarter Home Services");
  const { t } = useTranslation();
  const values = useValues();
  return (
    <div className="min-h-screen bg-background" data-testid="page-about">
      <Header />

      {/* PERSONAL HERO SECTION */}
      <section className="pt-28 pb-16 px-4 md:px-6" data-testid="section-about-hero">
        <div className="max-w-4xl mx-auto">
          <span className="text-primary font-bold uppercase tracking-widest text-sm mb-4 block" data-testid="text-our-story-label">{t("about.our_story")}</span>
          <h1 className="text-4xl md:text-6xl font-black mb-8 leading-tight" data-testid="text-about-headline">
            {t("about.headline")} <br className="hidden md:block" />
            <span className="text-muted-foreground underline decoration-primary decoration-4 underline-offset-8 italic">{t("about.headline_highlight")}</span>
          </h1>

          <div className="flex flex-col md:flex-row gap-12 items-start mt-12">
            <div className="w-full md:w-1/3 shrink-0">
              <div className="sticky top-24 z-10">
                <div className="aspect-[3/4] bg-muted rounded-md overflow-hidden shadow-2xl border-4 border-background">
                  <img
                    src={founderPhoto}
                    alt="Alan, Founder of UpTend"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="mt-6 text-center font-bold" data-testid="text-founder-name">{t("about.founder_name")}</p>
                <p className="text-center text-xs text-muted-foreground uppercase tracking-widest" data-testid="text-founder-title">{t("about.founder_title")}</p>
              </div>
            </div>

            <div className="flex-1 space-y-6 text-lg text-muted-foreground leading-relaxed text-left">
              <p>{t("about.story_p1")}</p>
              <p>{t("about.story_p2")}</p>
              <p>
                <strong className="text-foreground">{t("about.story_p3")}</strong>
              </p>
              <p>{t("about.story_p4")}</p>
              <p className="font-bold text-foreground">{t("about.story_p5")}</p>
              <p className="text-foreground">{t("about.story_p6")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* THE THREE PILLARS ORIGIN STORY */}
      <section className="py-16 md:py-24 bg-muted/50 px-4 md:px-6" data-testid="section-pillars-origin">
        <div className="max-w-5xl mx-auto space-y-24">
          <div className="flex flex-col md:flex-row gap-12 items-start" data-testid="section-pillar-protect">
            <div className="w-16 h-16 bg-primary rounded-md flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
              <ShieldCheck className="text-white w-8 h-8" />
            </div>
            <div className="text-left">
              <h3 className="text-2xl font-black mb-4 uppercase italic tracking-tighter" data-testid="text-pillar-protect">{t("about.pillar_protect")}</h3>
              <p className="text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: t("about.pillar_protect_text") }} />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-12 items-start" data-testid="section-pillar-connect">
            <div className="w-16 h-16 bg-secondary rounded-md flex items-center justify-center shrink-0 shadow-lg shadow-secondary/20">
              <Zap className="text-white w-8 h-8" />
            </div>
            <div className="text-left">
              <h3 className="text-2xl font-black mb-4 uppercase italic tracking-tighter" data-testid="text-pillar-connect">{t("about.pillar_connect")}</h3>
              <p className="text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: t("about.pillar_connect_text") }} />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-12 items-start" data-testid="section-pillar-sustain">
            <div className="w-16 h-16 bg-green-500 dark:bg-green-600 rounded-md flex items-center justify-center shrink-0 shadow-lg shadow-green-500/20">
              <Leaf className="text-white w-8 h-8" />
            </div>
            <div className="text-left">
              <h3 className="text-2xl font-black mb-4 uppercase italic tracking-tighter" data-testid="text-pillar-sustain">{t("about.pillar_sustain")}</h3>
              <p className="text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: t("about.pillar_sustain_text") }} />
            </div>
          </div>
        </div>
      </section>

      {/* OUR VALUES */}
      <section className="py-16 md:py-24 max-w-5xl mx-auto px-4 md:px-6" data-testid="section-about-values">
        <h2 className="text-2xl font-bold mb-8 text-center" data-testid="text-values-heading">{t("about.values_heading")}</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {values.map((value) => (
            <Card key={value.title} className="p-6" data-testid={`card-value-${value.title.toLowerCase().replace(/\s/g, "-")}`}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <value.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground text-sm">{value.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* OUR MISSION */}
      <section className="py-16 md:py-24 bg-muted/50 px-4 md:px-6" data-testid="section-about-mission">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <Card className="p-8 bg-primary/5 border-primary/20" data-testid="card-mission">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-8 h-8 text-primary" />
                <h3 className="text-xl font-semibold">{t("about.mission_label")}</h3>
              </div>
              <p className="text-lg text-muted-foreground">
                {t("about.mission_text")}
              </p>
            </Card>
            <div>
              <h2 className="text-2xl font-bold mb-4">{t("about.about_uptend")}</h2>
              <p className="text-muted-foreground mb-4">
                {t("about.about_text_1")}
              </p>
              <p className="text-muted-foreground">
                {t("about.about_text_2")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* JOURNEY TIMELINE */}
      <section className="py-16 md:py-24 max-w-5xl mx-auto px-4 md:px-6" data-testid="section-about-journey">
        <h2 className="text-2xl font-bold mb-8 text-center" data-testid="text-journey-heading">{t("about.journey_heading")}</h2>
        <div className="relative">
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div key={index} className={`relative flex items-center gap-4 flex-wrap ${index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`} data-testid={`milestone-${index}`}>
                <div className={`flex-1 ${index % 2 === 0 ? "md:text-right" : "md:text-left"} hidden md:block`}>
                  <Card className="p-4 inline-block">
                    <p className="font-medium">{milestone.event}</p>
                  </Card>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center z-10 flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-primary">{milestone.year}</span>
                  <Card className="p-4 mt-1 md:hidden">
                    <p className="font-medium">{milestone.event}</p>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROVEN IMPACT STATS */}
      <section className="py-16 md:py-24 bg-muted/50 px-4 md:px-6" data-testid="section-about-stats">
        <div className="max-w-5xl mx-auto">
          <Card className="p-8 text-center bg-primary/5 border-primary/20" data-testid="card-stats">
            <h2 className="text-2xl font-bold mb-4">{t("about.proven_impact")}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
              <div data-testid="stat-jobs">
                <div className="text-3xl font-bold text-primary mb-1">10K+</div>
                <p className="text-sm text-muted-foreground">{t("about.stat_jobs")}</p>
              </div>
              <div data-testid="stat-pros">
                <div className="text-3xl font-bold text-primary mb-1">500+</div>
                <p className="text-sm text-muted-foreground">{t("about.stat_pros")}</p>
              </div>
              <div data-testid="stat-rating">
                <div className="text-3xl font-bold text-primary mb-1">4.9</div>
                <p className="text-sm text-muted-foreground">{t("about.stat_rating")}</p>
              </div>
              <div data-testid="stat-diverted">
                <div className="text-3xl font-bold text-primary mb-1">70%</div>
                <p className="text-sm text-muted-foreground">{t("about.stat_diverted")}</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* FINAL MANTRA */}
      <section className="py-16 md:py-24 text-center px-4 md:px-6" data-testid="section-about-mantra">
        <Quote className="w-12 h-12 text-muted-foreground/20 mx-auto mb-8" />
        <h2 className="text-3xl font-black mb-6" data-testid="text-about-mantra">{t("about.mantra")}</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-10 text-lg leading-relaxed">
          {t("about.mantra_text")}
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/book">
            <Button size="lg" data-testid="button-about-book">
              {t("about.get_started")} <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link href="/become-pro">
            <Button variant="outline" size="lg" data-testid="button-about-join">
              {t("about.join_as_pro")}
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
