import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

const pricingData = [
  { service: "Diagnostic / Service Call", low: 89, high: 149 },
  { service: "Compressor Replacement", low: 800, high: 2500 },
  { service: "Refrigerant Recharge (R-410A)", low: 150, high: 400 },
  { service: "Capacitor Replacement", low: 150, high: 350 },
  { service: "Blower Motor Replacement", low: 300, high: 700 },
  { service: "Full System Replacement", low: 4000, high: 12000 },
  { service: "Duct Cleaning (Whole Home)", low: 299, high: 599 },
  { service: "Annual Maintenance Plan", low: 149, high: 299, unit: "/yr" },
];

const faqs = [
  {
    question: "How much does an HVAC service call cost in Orlando?",
    answer: "A typical HVAC diagnostic or service call in Orlando costs between $89 and $149. This usually includes the technician's trip to your home, a system inspection, and a diagnosis of the issue. The diagnostic fee is often waived if you proceed with the repair.",
  },
  {
    question: "How much does it cost to replace an AC compressor in Orlando?",
    answer: "AC compressor replacement in Orlando typically costs between $800 and $2,500, depending on the unit size (tonnage), refrigerant type, and whether additional components need replacing. Units using older R-22 refrigerant tend to cost more due to the phase-out.",
  },
  {
    question: "How much does a full HVAC system replacement cost in Orlando?",
    answer: "A full HVAC system replacement in Orlando ranges from $4,000 to $12,000. The price depends on the home's square footage, system efficiency (SEER rating), ductwork condition, and whether you choose a standard or high-efficiency unit. Most Orlando homes need a 14–16 SEER system minimum to handle the climate.",
  },
  {
    question: "Is an HVAC maintenance plan worth it in Florida?",
    answer: "Yes. In Florida's humid subtropical climate, HVAC systems work harder and longer than in most states. An annual maintenance plan ($149–$299/year) typically includes two tune-ups per year, priority scheduling, and discounts on repairs. Regular maintenance can extend your system's lifespan by 5–7 years and reduce energy bills by 15–25%.",
  },
  {
    question: "How often should I service my AC in Orlando?",
    answer: "Orlando homeowners should service their AC at least twice per year — once before summer (March–April) and once before the heating season (October–November). Florida's year-round humidity and heavy summer use make biannual maintenance essential for efficiency and longevity.",
  },
  {
    question: "What SEER rating should I choose for an Orlando HVAC system?",
    answer: "For Orlando's climate, a minimum of 15 SEER is recommended. Systems rated 16–20 SEER offer better energy savings in Florida's long cooling season. The Department of Energy requires a minimum of 15 SEER for new installations in the Southeast region as of 2023.",
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
  headline: "HVAC Repair Costs in Orlando 2026 — Complete Pricing Guide",
  datePublished: "2026-03-01",
  dateModified: "2026-03-05",
  author: { "@type": "Organization", name: "UpTend" },
  publisher: { "@type": "Organization", name: "UpTend", url: "https://uptendapp.com" },
  mainEntityOfPage: "https://uptendapp.com/hvac-costs-orlando",
  keywords: "hvac repair cost orlando, ac repair cost orlando, hvac prices orlando 2026, ac replacement cost orlando florida",
};

export default function HvacCostsOrlando() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Helmet>
        <title>HVAC Repair Costs in Orlando 2026 | Real Pricing Guide | UpTend</title>
        <meta
          name="description"
          content="How much does HVAC repair cost in Orlando in 2026? Real pricing for diagnostics, compressor replacement, refrigerant recharge, full system replacement, and maintenance plans."
        />
        <link rel="canonical" href="https://uptendapp.com/hvac-costs-orlando" />
        <meta property="og:title" content="HVAC Repair Costs in Orlando 2026 — Complete Pricing Guide" />
        <meta property="og:description" content="Real HVAC repair and replacement prices in Orlando for 2026. Diagnostics, compressors, refrigerant, full systems, and maintenance plans." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://uptendapp.com/hvac-costs-orlando" />
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
          <span>HVAC Costs Orlando</span>
        </nav>

        <time className="text-sm text-muted-foreground not-prose">Updated March 5, 2026</time>
        <h1>HVAC Repair Costs in Orlando 2026</h1>

        <p>
          What does HVAC repair actually cost in Orlando? Whether your AC quit on a 95°F August afternoon or you're
          planning a system upgrade, here are the real numbers Orlando homeowners are paying in 2026 — no fluff, no
          "it depends" runarounds.
        </p>

        <h2>Orlando HVAC Pricing Table (2026)</h2>
        <p>
          These are typical price ranges for residential HVAC services in the Orlando metro area, including Orange,
          Seminole, and Osceola counties. Prices include parts and labor unless noted.
        </p>

        <div className="not-prose overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 px-4 text-foreground font-semibold">Service</th>
                <th className="py-3 px-4 text-foreground font-semibold text-right">Typical Cost</th>
              </tr>
            </thead>
            <tbody>
              {pricingData.map((item) => (
                <tr key={item.service} className="border-b border-border/50 hover:bg-muted/50">
                  <td className="py-3 px-4 text-foreground">{item.service}</td>
                  <td className="py-3 px-4 text-foreground text-right font-mono">
                    ${item.low.toLocaleString()} – ${item.high.toLocaleString()}{item.unit || ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-sm text-muted-foreground mt-2">
          Prices reflect Orlando metro averages as of early 2026. Actual costs vary based on system age, brand, home size, and ductwork condition.
        </p>

        <h2>What Affects HVAC Repair Costs in Orlando</h2>

        <h3>System Age and Condition</h3>
        <p>
          Systems over 10 years old often need parts that are harder to source, especially if they use R-22 refrigerant
          (phased out in 2020). Older systems also tend to have cascading failures — fixing the compressor reveals a
          corroded evaporator coil. If your system is 15+ years old and needs a repair over $1,500, replacement usually
          makes more financial sense.
        </p>

        <h3>Unit Size (Tonnage)</h3>
        <p>
          Orlando homes typically need 2.5 to 5 ton units depending on square footage and insulation quality. Larger
          units cost more for both parts and labor. An undersized unit in Florida's heat will run constantly, drive up
          your FPL bill, and fail sooner.
        </p>

        <h3>SEER Rating</h3>
        <p>
          Higher efficiency ratings (16–20+ SEER) cost more upfront but save significantly on energy bills in
          Orlando's 8+ month cooling season. The federal minimum for the Southeast is 15 SEER as of 2023. Most Orlando
          HVAC pros recommend 16 SEER minimum for the best cost-to-efficiency balance.
        </p>

        <h3>Emergency vs. Scheduled Service</h3>
        <p>
          After-hours and weekend emergency calls typically add $50–$150 to the diagnostic fee. Scheduling service
          during weekday business hours saves money. Orlando's peak HVAC demand runs June through September —
          booking maintenance in spring avoids emergency premiums.
        </p>

        <h3>Ductwork Condition</h3>
        <p>
          Florida homes frequently have ductwork in attics where temperatures reach 140°F+. Leaky or poorly insulated
          ducts can reduce system efficiency by 20–30%. If your energy bills seem high despite a functioning system,
          a duct inspection ($99–$199) may reveal the real issue.
        </p>

        <h2>When to Repair vs. Replace Your Orlando HVAC</h2>
        <p>
          Use the <strong>"5,000 Rule"</strong> as a quick guideline: multiply the system's age by the repair cost.
          If the result exceeds $5,000, replacement is usually the better investment.
        </p>
        <ul>
          <li><strong>Under 10 years old, repair under $1,000:</strong> Repair. The system has life left.</li>
          <li><strong>10–15 years old, repair $800–$2,000:</strong> Get a replacement quote too. Compare the numbers.</li>
          <li><strong>Over 15 years old, any major repair:</strong> Replace. Modern systems pay for themselves in energy savings within 3–5 years in Florida.</li>
        </ul>

        <h2>Frequently Asked Questions</h2>
        {faqs.map((faq, i) => (
          <div key={i}>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </div>
        ))}

        <div className="not-prose mt-12 p-6 bg-orange-50 dark:bg-orange-950/30 rounded-xl border border-orange-200 dark:border-orange-900">
          <h2 className="text-xl font-bold text-foreground mb-2">Need HVAC Service in Orlando?</h2>
          <p className="text-muted-foreground mb-4">
            UpTend connects you with vetted, local HVAC pros. Transparent pricing, no middleman markup.
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
