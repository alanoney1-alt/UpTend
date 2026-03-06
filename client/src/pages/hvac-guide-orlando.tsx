import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

const faqs = [
  {
    question: "What SEER rating is best for Orlando, Florida?",
    answer: "For Orlando's climate, a minimum of 15 SEER is required by federal regulation for new installations in the Southeast. Most HVAC professionals recommend 16–18 SEER for the best balance of cost and efficiency. Systems rated 20+ SEER (variable speed) offer the best comfort and lowest energy bills but have a higher upfront cost ($8,000–$12,000+).",
  },
  {
    question: "How does Florida humidity affect my HVAC system?",
    answer: "Orlando's average humidity is 74%, which forces HVAC systems to work as dehumidifiers in addition to cooling. This means longer run times, higher energy consumption, and more strain on the compressor and evaporator coil. Oversized systems cool the air quickly but don't run long enough to remove humidity, leaving your home feeling clammy. Properly sized systems with variable-speed blowers handle Florida humidity best.",
  },
  {
    question: "How should I prepare my HVAC for hurricane season?",
    answer: "Before hurricane season (June 1 – November 30): secure or store any loose outdoor components, turn off the HVAC at the breaker before a storm hits, cover the outdoor condenser only if debris is likely, and after the storm, inspect for damage before turning the system back on. Never run the system if the outdoor unit is submerged or debris-damaged. Have a technician inspect it first.",
  },
  {
    question: "How often should I change my AC filter in Florida?",
    answer: "In Florida, change your AC filter every 30–60 days, not the 90 days recommended for moderate climates. Orlando's high humidity, pollen, and year-round system use clog filters faster. Homes with pets, smokers, or allergy sufferers should change filters every 30 days. A clogged filter is the #1 cause of AC failures in Florida.",
  },
  {
    question: "Should I repair or replace my HVAC system?",
    answer: "Use the 5,000 Rule: multiply the system's age by the repair cost. If the result exceeds $5,000, replace it. Other factors favoring replacement: the system uses R-22 refrigerant (phased out), energy bills are rising despite maintenance, the system is over 15 years old, or you need frequent repairs (more than twice per year).",
  },
  {
    question: "What is the best thermostat setting for Orlando homes?",
    answer: "The Department of Energy recommends 78°F when you're home and active. In Orlando's climate, most homeowners find 76–78°F comfortable with proper humidity control. Setting the thermostat below 72°F forces the system to work excessively hard and can increase energy bills by 25–40%. A programmable or smart thermostat that adjusts when you're away can save 10–15% on cooling costs.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Complete Orlando HVAC Guide 2026 — Everything Florida Homeowners Need to Know",
  datePublished: "2026-03-01",
  dateModified: "2026-03-05",
  author: { "@type": "Organization", name: "UpTend" },
  publisher: { "@type": "Organization", name: "UpTend", url: "https://uptendapp.com" },
  mainEntityOfPage: "https://uptendapp.com/hvac-guide-orlando",
  keywords: "orlando hvac guide, hvac florida, ac maintenance orlando, hvac hurricane prep florida, seer rating florida",
};

const maintenanceSchedule = [
  {
    season: "Spring (March–April)",
    tasks: [
      "Schedule professional tune-up and inspection",
      "Replace air filter",
      "Clean around outdoor condenser unit (2 ft clearance)",
      "Test thermostat — switch to cooling mode",
      "Check condensate drain line (pour vinegar to prevent clogs)",
      "Inspect ductwork for visible leaks or disconnections",
    ],
  },
  {
    season: "Summer (May–September)",
    tasks: [
      "Replace air filter every 30 days during peak use",
      "Monitor energy bills for unusual spikes",
      "Keep blinds/curtains closed during peak sun hours",
      "Ensure supply and return vents are not blocked",
      "Check outdoor unit is running when system cycles on",
    ],
  },
  {
    season: "Fall (October–November)",
    tasks: [
      "Schedule second professional tune-up",
      "Replace air filter",
      "Clean debris from outdoor unit after hurricane season",
      "Test heating mode (yes, Orlando occasionally needs heat)",
      "Inspect and clean condensate drain line again",
      "Consider duct cleaning if not done in past 3–5 years",
    ],
  },
  {
    season: "Winter (December–February)",
    tasks: [
      "Replace air filter",
      "Verify heat pump or backup heat is functional for cold snaps",
      "Check thermostat batteries and settings",
      "Monitor for unusual cycling (system turning on/off frequently)",
      "This is the best time for system replacement — lower demand and better pricing",
    ],
  },
];

export default function HvacGuideOrlando() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Helmet>
        <title>Complete Orlando HVAC Guide 2026 | Florida Homeowner's Handbook | UpTend</title>
        <meta
          name="description"
          content="Everything Orlando homeowners need to know about HVAC in 2026. Florida humidity, hurricane prep, seasonal maintenance schedule, SEER ratings, and when to repair vs replace."
        />
        <link rel="canonical" href="https://uptendapp.com/hvac-guide-orlando" />
        <meta property="og:title" content="Complete Orlando HVAC Guide 2026 — Florida Homeowner's Handbook" />
        <meta property="og:description" content="The definitive HVAC guide for Orlando homeowners. Florida-specific maintenance schedules, humidity management, hurricane prep, and smart upgrade decisions." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://uptendapp.com/hvac-guide-orlando" />
        <meta property="article:published_time" content="2026-03-01" />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <article className="max-w-3xl mx-auto px-4 pt-28 pb-16 prose prose-lg prose-orange dark:prose-invert">
        <nav className="text-sm text-muted-foreground mb-8 not-prose">
          <Link href="/" className="hover:text-orange-600">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/services/hvac" className="hover:text-orange-600">HVAC Services</Link>
          <span className="mx-2">›</span>
          <span>Orlando HVAC Guide</span>
        </nav>

        <time className="text-sm text-muted-foreground not-prose">Updated March 5, 2026</time>
        <h1>Complete Orlando HVAC Guide 2026</h1>

        <p>
          Running an HVAC system in Orlando isn't the same as running one in Chicago or Phoenix. Florida's
          combination of extreme humidity, year-round heat, hurricane season, and salt air (for coastal areas)
          creates unique challenges that most generic HVAC advice doesn't address.
        </p>
        <p>
          This guide covers everything Orlando homeowners need to know — from choosing the right system to
          maintaining it through Florida's demanding climate.
        </p>

        <h2>Why Orlando HVAC Is Different</h2>

        <h3>Humidity Is the Real Enemy</h3>
        <p>
          Orlando's average relative humidity sits around 74% year-round, regularly exceeding 90% on summer
          mornings. Your AC system doesn't just cool the air — it's your primary dehumidifier. This means:
        </p>
        <ul>
          <li>Systems run 2,500–3,000+ hours per year (vs. 1,000–1,500 in moderate climates)</li>
          <li>Oversized systems are worse than undersized ones — they cool too quickly without removing moisture</li>
          <li>Condensate drain lines clog frequently in high humidity — the #2 cause of AC failures in Florida after dirty filters</li>
          <li>Mold can grow in ductwork if humidity isn't controlled, especially in homes with poor insulation</li>
        </ul>
        <p>
          A properly sized system with a variable-speed blower handles Florida humidity significantly better than a
          single-stage system. It runs longer at lower speeds, pulling more moisture from the air.{" "}
          <Link href="/services/hvac">UpTend's HVAC pros</Link> can assess your home's humidity needs and recommend
          the right system.
        </p>

        <h3>The Cooling Season Never Really Ends</h3>
        <p>
          Orlando averages 233 days per year above 80°F. Most homes run their AC from March through November, and
          many run it year-round. This extended cooling season means:
        </p>
        <ul>
          <li>System lifespan averages 10–15 years (vs. 15–20 in moderate climates)</li>
          <li>Annual energy costs for cooling average $1,800–$2,400 in Orlando</li>
          <li>System efficiency matters more — each SEER point saves roughly $100–$150/year in Orlando</li>
        </ul>

        <h2>SEER Ratings for Florida</h2>
        <p>
          SEER (Seasonal Energy Efficiency Ratio) measures cooling efficiency. Higher SEER means lower energy costs.
          Here's how different ratings perform in Orlando's climate:
        </p>

        <div className="not-prose overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 px-4 text-foreground font-semibold">SEER Rating</th>
                <th className="py-3 px-4 text-foreground font-semibold">Category</th>
                <th className="py-3 px-4 text-foreground font-semibold">Est. Annual Cost*</th>
                <th className="py-3 px-4 text-foreground font-semibold">Best For</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50">
                <td className="py-3 px-4 text-foreground font-mono">14–15</td>
                <td className="py-3 px-4 text-foreground">Federal minimum</td>
                <td className="py-3 px-4 text-foreground">$2,200–$2,400</td>
                <td className="py-3 px-4 text-foreground">Budget installs, rentals</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-3 px-4 text-foreground font-mono">16–17</td>
                <td className="py-3 px-4 text-foreground">Mid-efficiency</td>
                <td className="py-3 px-4 text-foreground">$1,800–$2,000</td>
                <td className="py-3 px-4 text-foreground">Most Orlando homes (best value)</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-3 px-4 text-foreground font-mono">18–20</td>
                <td className="py-3 px-4 text-foreground">High-efficiency</td>
                <td className="py-3 px-4 text-foreground">$1,400–$1,700</td>
                <td className="py-3 px-4 text-foreground">Larger homes, long-term ownership</td>
              </tr>
              <tr className="border-b border-border/50">
                <td className="py-3 px-4 text-foreground font-mono">20+</td>
                <td className="py-3 px-4 text-foreground">Variable speed / inverter</td>
                <td className="py-3 px-4 text-foreground">$1,200–$1,400</td>
                <td className="py-3 px-4 text-foreground">Best comfort + humidity control</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          *Estimated annual cooling cost for a 2,000 sq ft Orlando home at $0.13/kWh (FPL average). Actual costs vary.
        </p>
        <p>
          For most Orlando homeowners, <strong>16–18 SEER hits the sweet spot</strong> — meaningful energy savings
          without the premium cost of variable-speed systems. If you're staying in your home 10+ years, 18–20 SEER
          pays for itself.{" "}
          <Link href="/services/hvac">Get a quote from UpTend's HVAC pros</Link> to compare options for your home.
        </p>

        <h2>Hurricane Season HVAC Preparation</h2>
        <p>
          Florida's hurricane season runs June 1 through November 30. Orlando is inland enough to avoid direct
          coastal storm surge, but tropical storms and hurricanes still bring damaging winds, flying debris, and
          extended power outages. Here's how to protect your HVAC investment:
        </p>

        <h3>Before the Storm</h3>
        <ul>
          <li><strong>Turn off the system at the breaker</strong> — power surges during and after storms are the #1 cause of HVAC electrical damage</li>
          <li><strong>Secure loose components</strong> — remove or secure any window AC units, portable condensers, or loose covers</li>
          <li><strong>Don't cover the outdoor unit</strong> — covers can trap moisture and debris. Only use a plywood shield if large debris is likely</li>
          <li><strong>Clear the area</strong> — remove anything within 5 feet of the outdoor unit that could become a projectile</li>
          <li><strong>Consider a surge protector</strong> — whole-home surge protectors ($200–$500 installed) protect all electronics including HVAC</li>
        </ul>

        <h3>After the Storm</h3>
        <ul>
          <li><strong>Inspect before powering on</strong> — check the outdoor unit for visible damage, debris, standing water, or shifted position</li>
          <li><strong>Wait 24 hours after power returns</strong> — this allows the compressor's internal pressure to equalize</li>
          <li><strong>Never run a flooded or damaged unit</strong> — if the outdoor unit was submerged, it needs professional inspection</li>
          <li><strong>Check the condensate line</strong> — storm debris and water backup can clog drain lines</li>
          <li><strong>Schedule a post-storm inspection</strong> — even if the system seems fine, hidden damage can cause failures weeks later</li>
        </ul>
        <p>
          <Link href="/services/hvac">UpTend's HVAC network</Link> offers post-storm inspection services throughout
          the Orlando metro area.
        </p>

        <h2>Seasonal Maintenance Schedule for Orlando</h2>
        <p>
          Florida HVAC systems need more frequent maintenance than systems in moderate climates. Follow this
          Orlando-specific schedule to maximize system life and efficiency:
        </p>

        <div className="not-prose space-y-6 my-8">
          {maintenanceSchedule.map((period) => (
            <div key={period.season} className="p-5 bg-card border border-border rounded-xl">
              <h3 className="font-semibold text-foreground text-lg mb-3">{period.season}</h3>
              <ul className="space-y-2">
                {period.tasks.map((task, i) => (
                  <li key={i} className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-orange-500 mt-1.5 shrink-0">•</span>
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p>
          Don't want to track this yourself? An{" "}
          <Link href="/services/hvac">UpTend HVAC maintenance plan</Link> ($149–$299/year) covers biannual
          professional tune-ups, priority scheduling, and repair discounts.
        </p>

        <h2>When to Repair vs. Replace</h2>
        <p>
          This is the most expensive decision Orlando homeowners face with their HVAC. Here's a framework that
          actually helps:
        </p>

        <h3>The 5,000 Rule</h3>
        <p>
          Multiply the system's age (in years) by the repair cost. If the result exceeds $5,000, replacement is
          typically the better investment. Examples:
        </p>
        <ul>
          <li>8-year-old system, $400 repair → 8 × 400 = $3,200 → <strong>Repair</strong></li>
          <li>12-year-old system, $500 repair → 12 × 500 = $6,000 → <strong>Replace</strong></li>
          <li>6-year-old system, $1,200 repair → 6 × 1,200 = $7,200 → <strong>Get a replacement quote</strong></li>
        </ul>

        <h3>Always Replace If:</h3>
        <ul>
          <li>The system uses <strong>R-22 refrigerant</strong> (Freon) — phased out in 2020, remaining stock is expensive ($75–$150/lb)</li>
          <li>You've had <strong>3+ repairs in the past 2 years</strong></li>
          <li>Energy bills are <strong>rising steadily</strong> despite maintenance</li>
          <li>The system is <strong>over 15 years old</strong> — even with a minor repair, failure is likely within 1–3 years</li>
          <li>The home has <strong>uneven cooling</strong> or <strong>humidity problems</strong> that cleaning and maintenance haven't fixed</li>
        </ul>

        <h3>Always Repair If:</h3>
        <ul>
          <li>System is <strong>under 8 years old</strong> and the repair is under $1,000</li>
          <li>It's a <strong>simple component failure</strong> (capacitor, contactor, thermostat) — these are $150–$400 fixes</li>
          <li>The system is still under <strong>manufacturer warranty</strong> (typically 5–10 years on compressor)</li>
        </ul>

        <p>
          Not sure which way to go?{" "}
          <Link href="/services/hvac">Request a free assessment through UpTend</Link> — our HVAC pros will give
          you honest repair vs. replace recommendations with transparent pricing.
        </p>

        <h2>Frequently Asked Questions</h2>
        {faqs.map((faq, i) => (
          <div key={i}>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </div>
        ))}

        <div className="not-prose mt-12 p-6 bg-orange-50 dark:bg-orange-950/30 rounded-xl border border-orange-200 dark:border-orange-900">
          <h2 className="text-xl font-bold text-foreground mb-2">Ready to Take Care of Your HVAC?</h2>
          <p className="text-muted-foreground mb-4">
            Whether you need a tune-up, repair, or full system replacement, UpTend connects you with vetted Orlando
            HVAC professionals at transparent prices.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/services/hvac"
              className="inline-flex items-center justify-center px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors"
            >
              Get HVAC Service →
            </Link>
            <a
              href="tel:+18559012072"
              className="inline-flex items-center justify-center px-6 py-3 border border-orange-600 text-orange-600 dark:text-orange-400 font-semibold rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/50 transition-colors"
            >
              Call (855) 901-2072
            </a>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
}
