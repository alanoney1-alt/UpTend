import { Trophy, Truck, ShieldCheck, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const levels = [
  {
    level: 1,
    title: "The Rookie",
    colorClasses: "bg-muted/50 dark:bg-muted/30 border-border",
    iconColorClass: "text-muted-foreground",
    icon: Truck,
    perks: [
      "Instant Daily Payouts",
      "Access to Junk & Moving Jobs",
      "We Cover Your Insurance",
      "Keep 100% of Tips",
    ],
    income: "$500 - $800 / wk",
  },
  {
    level: 2,
    title: "Verified Pro",
    colorClasses: "bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800",
    iconColorClass: "text-blue-600 dark:text-blue-400",
    icon: ShieldCheck,
    perks: [
      "Unlocks Pressure Washing & Gutters",
      "LOWER Fees (Keep 80%)",
      "Priority Dispatch (See jobs first)",
      "Verified Badge on Profile",
    ],
    income: "$1,000 - $1,500 / wk",
  },
  {
    level: 3,
    title: "Master Consultant",
    colorClasses: "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800",
    iconColorClass: "text-amber-600 dark:text-amber-400",
    icon: Trophy,
    perks: [
      "Paid by UpTend for conducting free Home DNA Scans",
      "10% Commission on Upsells",
      "Dedicated Account Manager",
      "Zero-Fee 'Pass' Once a Month",
    ],
    income: "$2,000+ / wk",
  },
];

export function CareerLadder() {
  return (
    <section id="career-ladder" className="py-16 md:py-24" data-testid="section-career-ladder">
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-2" data-testid="text-ladder-headline">
            Climb the Ladder
          </h2>
          <p className="text-lg text-muted-foreground">
            We don't just give you jobs. We build your career.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {levels.map((lvl) => (
            <Card
              key={lvl.level}
              className={`relative border-2 ${lvl.colorClasses} pt-8`}
              data-testid={`card-career-level-${lvl.level}`}
            >
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-card p-3 rounded-full shadow-sm border">
                <lvl.icon className={`w-8 h-8 ${lvl.iconColorClass}`} />
              </div>

              <CardContent className="pt-4 pb-6 text-center">
                <h3 className="text-xl font-bold mb-1">{lvl.title}</h3>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-6">
                  {lvl.income}
                </p>

                <ul className="space-y-3 text-left text-sm px-2">
                  {lvl.perks.map((perk, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{perk}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/pro/signup">
            <Button size="lg" data-testid="button-start-rookie">
              Start as a Rookie Today
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
