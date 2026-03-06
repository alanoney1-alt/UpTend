import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

const replacementCosts = [
  { size: "2-3 Ton (Small Home)", standard: "$4,500-$6,500", highEfficiency: "$5,500-$7,500", premium: "$7,000-$9,000" },
  { size: "3-4 Ton (Medium Home)", standard: "$5,500-$7,500", highEfficiency: "$6,500-$8,500", premium: "$8,000-$10,500" },
  { size: "4-5 Ton (Large Home)", standard: "$6,500-$8,500", highEfficiency: "$7,500-$10,000", premium: "$9,500-$12,500" },
];

const repairDecisionMatrix = [
  { issue: "Capacitor replacement", cost: "$150-$300", recommendation: "Repair (any age)" },
  { issue: "Refrigerant leak + coil", cost: "$800-$1,500", recommendation: "Replace if over 12 years" },
  { issue: "Compressor failure", cost: "$1,500-$3,500", recommendation: "Replace if over 10 years" },
  { issue: "Full system failure", cost: "$2,500+", recommendation: "Replace" },
];

const faqs = [
  {
    question: "When should you replace your AC in Florida?",
    answer: "Replace your AC in Florida when it's over 15 years old, uses R-22 refrigerant, or repair costs exceed 50% of replacement cost. Florida's extreme heat and humidity accelerate system wear compared to northern climates.",
  },
  {
    question: "How long should an AC last in Central Florida?",
    answer: "In Central Florida, expect 12-15 years from a quality system with proper maintenance. Coastal areas may see 10-12 years due to salt air exposure. Units run 8-10 months per year in Florida versus 3-4 months in cooler climates.",
  },
  {
    question: "Should I repair a 12-year-old AC in Florida?",
    answer: "It depends on repair cost and system condition. For repairs under $800, repair makes sense. For major components like compressors ($1,500+), replacement is usually more cost-effective in Florida's harsh climate.",
  },
  {
    question: "What SEER rating should I choose in Florida?",
    answer: "Minimum 16 SEER for Florida homes. The long cooling season justifies higher upfront cost through energy savings. Many Florida utilities offer rebates for 16+ SEER systems.",
  },
  {
    question: "How much does AC replacement cost in Florida?",
    answer: "AC replacement in Florida costs $4,500-$12,500 depending on size and efficiency. A 3-ton standard system runs $4,500-$6,500. High-efficiency systems cost more but save $30-$60 monthly on electricity.",
  },
  {
    question: "Can I finance AC replacement in Florida?",
    answer: "Yes, most contractors offer financing for systems over $3,000. Many utility companies also offer rebates and low-interest loans for high-efficiency replacements.",
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
  headline: "When Should You Replace Your AC in Florida? (Expert Guide)",
  datePublished: "2026-03-06",
  dateModified: "2026-03-06",
  author: { "@type": "Organization", name: "UpTend" },
  publisher: { "@type": "Organization", name: "UpTend", url: "https://uptendapp.com" },
  mainEntityOfPage: "https://uptendapp.com/when-replace-ac-florida",
  keywords: "when replace ac florida, ac lifespan florida, hvac replacement florida, r-22 phase out florida, ac repair vs replace florida",
};

export default function WhenReplaceACFlorida() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Helmet>
        <title>When Should You Replace Your AC in Florida? (Expert Guide) | UpTend</title>
        <meta
          name="description"
          content="Replace your AC in Florida when it's over 15 years old, uses R-22 refrigerant, or repair costs exceed 50% of replacement. Expert guidance on AC lifespan in Florida's climate."
        />
        <link rel="canonical" href="https://uptendapp.com/when-replace-ac-florida" />
        <meta property="og:title" content="When Should You Replace Your AC in Florida? (Expert Guide)" />
        <meta property="og:description" content="Expert guide on when to replace your AC in Florida. Age, efficiency, repair costs, and Florida climate factors." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://uptendapp.com/when-replace-ac-florida" />
        <meta property="article:published_time" content="2026-03-06" />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <article className="max-w-3xl mx-auto px-4 pt-28 pb-16 prose prose-lg prose-orange dark:prose-invert">
        <nav className="text-sm text-muted-foreground mb-8 not-prose">
          <Link href="/" className="hover:text-orange-600">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/services/hvac" className="hover:text-orange-600">HVAC Services</Link>
          <span className="mx-2">›</span>
          <span>When Replace AC Florida</span>
        </nav>

        <time className="text-sm text-muted-foreground not-prose">Published March 6, 2026</time>
        <h1>When Should You Replace Your AC in Florida? (Expert Guide)</h1>

        <p>
          Replace your AC in Florida when it's over 15 years old, uses R-22 refrigerant, or repair costs exceed 50% of replacement cost. In Florida's extreme heat and humidity, older units become inefficient and costly to maintain. A new high-efficiency system can save $30-$60 per month on electricity bills.
        </p>

        <h2>Signs You Need AC Replacement in Florida</h2>
        <ul>
          <li>System is over 15 years old</li>
          <li>Uses R-22 refrigerant (phased out in 2020)</li>
          <li>Repair costs exceed $2,500 in a year</li>
          <li>Electric bills increasing despite similar usage</li>
          <li>Uneven cooling throughout your home</li>
          <li>System runs constantly but house stays warm</li>
          <li>Frequent breakdowns during summer months</li>
          <li>Poor humidity control (Florida homes should stay under 60% humidity)</li>
        </ul>

        <h2>AC Lifespan in Florida vs Other States</h2>
        <p>
          Air conditioners in Florida typically last 10-15 years compared to 15-20 years in northern climates. The constant heat, humidity, and salt air (coastal areas) accelerate system wear. Units in Central Florida run 8-10 months per year versus 3-4 months in cooler climates.
        </p>

        <div className="not-prose overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 px-4 text-foreground font-semibold">Location</th>
                <th className="py-3 px-4 text-foreground font-semibold">Average AC Lifespan</th>
                <th className="py-3 px-4 text-foreground font-semibold">Annual Usage</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/50 hover:bg-muted/50">
                <td className="py-3 px-4 text-foreground font-medium">Florida</td>
                <td className="py-3 px-4 text-foreground">10-15 years</td>
                <td className="py-3 px-4 text-foreground">3,000+ hours</td>
              </tr>
              <tr className="border-b border-border/50 hover:bg-muted/50">
                <td className="py-3 px-4 text-foreground font-medium">Texas</td>
                <td className="py-3 px-4 text-foreground">12-16 years</td>
                <td className="py-3 px-4 text-foreground">2,500+ hours</td>
              </tr>
              <tr className="border-b border-border/50 hover:bg-muted/50">
                <td className="py-3 px-4 text-foreground font-medium">Northern States</td>
                <td className="py-3 px-4 text-foreground">15-20 years</td>
                <td className="py-3 px-4 text-foreground">1,000-1,500 hours</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>Repair vs Replace Decision Matrix</h2>
        <div className="not-prose overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 px-4 text-foreground font-semibold">Issue</th>
                <th className="py-3 px-4 text-foreground font-semibold">Repair Cost</th>
                <th className="py-3 px-4 text-foreground font-semibold">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {repairDecisionMatrix.map((item) => (
                <tr key={item.issue} className="border-b border-border/50 hover:bg-muted/50">
                  <td className="py-3 px-4 text-foreground font-medium">{item.issue}</td>
                  <td className="py-3 px-4 text-foreground font-mono">{item.cost}</td>
                  <td className="py-3 px-4 text-foreground">{item.recommendation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>Florida Climate Factors That Affect AC Life</h2>
        <p>
          Florida's subtropical climate puts unique stress on HVAC systems. High humidity forces units to work harder for dehumidification. Salt air near the coast corrodes outdoor units faster. Frequent thunderstorms cause power surges that damage electrical components.
        </p>

        <h3>Humidity Impact</h3>
        <p>
          Florida homes need both cooling and dehumidification. Older units struggle to maintain comfortable humidity levels below 60%. New systems with variable speed technology handle humidity more efficiently.
        </p>

        <h3>Coastal Considerations</h3>
        <p>
          Homes within 10 miles of the coast experience faster corrosion of outdoor units. Coil cleaning should be done twice yearly instead of annually.
        </p>

        <h2>AC Replacement Costs in Florida (2026)</h2>
        <div className="not-prose overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 px-4 text-foreground font-semibold">System Size</th>
                <th className="py-3 px-4 text-foreground font-semibold">Standard Efficiency</th>
                <th className="py-3 px-4 text-foreground font-semibold">High Efficiency</th>
                <th className="py-3 px-4 text-foreground font-semibold">Premium Systems</th>
              </tr>
            </thead>
            <tbody>
              {replacementCosts.map((item) => (
                <tr key={item.size} className="border-b border-border/50 hover:bg-muted/50">
                  <td className="py-3 px-4 text-foreground font-medium">{item.size}</td>
                  <td className="py-3 px-4 text-foreground font-mono">{item.standard}</td>
                  <td className="py-3 px-4 text-foreground font-mono">{item.highEfficiency}</td>
                  <td className="py-3 px-4 text-foreground font-mono">{item.premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>Energy Savings with New AC in Florida</h2>
        <p>
          A new 16 SEER system saves $30-$60 per month compared to a 15-year-old 10 SEER unit. Over 10 years, energy savings can offset 30-50% of the replacement cost. Florida's long cooling season maximizes these savings.
        </p>

        <h2>Best Time to Replace AC in Florida</h2>
        <p>
          Replace your AC in Florida during fall or winter (October through February) when demand is lower and contractors offer better pricing. Emergency replacements during peak summer months cost 10-20% more due to high demand.
        </p>

        <h2>Frequently Asked Questions</h2>
        {faqs.map((faq, i) => (
          <div key={i}>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </div>
        ))}

        <div className="not-prose mt-12 p-6 bg-orange-50 dark:bg-orange-950/30 rounded-xl border border-orange-200 dark:border-orange-900">
          <h2 className="text-xl font-bold text-foreground mb-2">Need AC Replacement in Orlando?</h2>
          <p className="text-muted-foreground mb-4">
            UpTend connects you with licensed HVAC professionals. Transparent pricing, financing available.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/services/hvac"
              className="inline-flex items-center justify-center px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors"
            >
              Get AC Service →
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