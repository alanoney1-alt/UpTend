import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

const monthlyTasks = [
  {
    month: "January",
    title: "Post-Holiday Maintenance",
    description: "January is perfect for indoor projects while temperatures are mild. Focus on systems that worked hard during holiday entertaining.",
    tasks: [
      "Test smoke and carbon monoxide detectors",
      "Deep clean HVAC filters (changed monthly in Florida)",
      "Inspect attic insulation for settling or moisture damage",
      "Service pool equipment before spring heat arrives",
      "Trim trees away from house (before spring growth)",
      "Check caulking around windows and doors"
    ]
  },
  {
    month: "February",
    title: "Equipment Prep",
    description: "Prepare major systems before the demanding spring and summer seasons. Cool, dry weather is ideal for outdoor maintenance.",
    tasks: [
      "Schedule AC maintenance tune-up before peak season",
      "Inspect roof for loose shingles or missing tiles",
      "Clean gutters and downspouts",
      "Test irrigation system and adjust for spring growth",
      "Pressure wash exterior surfaces",
      "Check and clean dryer vents"
    ]
  },
  {
    month: "March",
    title: "Spring AC Prep",
    description: "This is the most critical month for AC maintenance in Central Florida. Units will run non-stop from April through October.",
    tasks: [
      "Professional AC tune-up and coil cleaning",
      "Replace HVAC filters with high-efficiency options",
      "Clear vegetation around outdoor AC unit (3-foot clearance)",
      "Test thermostat programming for cooling season",
      "Inspect ductwork for leaks (especially in attics)",
      "Apply pre-emergent herbicide to prevent summer weeds"
    ]
  },
  {
    month: "April",
    title: "Hurricane Season Prep Begins",
    description: "Hurricane season officially starts June 1, but preparation should begin now. April weather is ideal for exterior projects.",
    tasks: [
      "Inspect and secure outdoor furniture and decorations",
      "Check backup generator (if applicable)",
      "Trim palm fronds and remove dead branches",
      "Test sump pump in flood-prone areas",
      "Review homeowner's insurance coverage",
      "Stock hurricane supplies (batteries, water, non-perishables)"
    ]
  },
  {
    month: "May",
    title: "Final Hurricane Prep",
    description: "Complete hurricane preparations before peak season. May is typically the last month of manageable heat for major outdoor work.",
    tasks: [
      "Install or inspect storm shutters",
      "Secure loose roof tiles or shingles",
      "Trim trees professionally (especially large branches over roof)",
      "Clean and inspect pool equipment thoroughly",
      "Test and service lawn mower (rainy season ahead)",
      "Apply summer fertilizer to established plants"
    ]
  },
  {
    month: "June",
    title: "Hurricane Season Begins",
    description: "Hurricane season starts June 1. Focus on monitoring systems and maintaining readiness while heat intensifies.",
    tasks: [
      "Monitor AC performance (runs constantly now)",
      "Check humidity levels indoors (should stay under 60%)",
      "Inspect caulk around windows (summer storms test seals)",
      "Service pool weekly (higher usage and heat stress equipment)",
      "Keep hurricane kit updated and accessible",
      "Deep water lawn twice weekly instead of daily shallow watering"
    ]
  },
  {
    month: "July",
    title: "Peak Heat Management",
    description: "July averages 92°F in Orlando with extreme humidity. Focus on helping your home's systems cope with peak stress.",
    tasks: [
      "Change AC filters (may need bi-weekly during peak usage)",
      "Monitor electric bills for AC efficiency issues",
      "Clean pool filters more frequently",
      "Water landscape early morning to reduce evaporation",
      "Inspect attic ventilation (crucial in extreme heat)",
      "Check weather stripping around doors and windows"
    ]
  },
  {
    month: "August",
    title: "Storm Season Peak",
    description: "August and September are peak months for tropical activity. Maintain vigilance while managing heat stress on your home.",
    tasks: [
      "Monitor tropical weather forecasts closely",
      "Keep vehicles fueled and emergency supplies fresh",
      "Inspect and clear storm drains around property",
      "Test backup power systems monthly",
      "Maintain pool chemistry (storms affect water balance)",
      "Avoid major landscaping (stress plants in extreme heat)"
    ]
  },
  {
    month: "September",
    title: "Continued Vigilance",
    description: "September remains active for hurricanes while heat continues. Stay prepared while beginning to plan fall maintenance.",
    tasks: [
      "Continue hurricane season precautions",
      "Deep clean AC coils if efficiency has dropped",
      "Inspect roof after summer storms",
      "Plan fall landscaping projects",
      "Check and clean outdoor lighting",
      "Fertilize heat-stressed grass areas"
    ]
  },
  {
    month: "October",
    title: "Transition Season",
    description: "October brings relief from peak heat. Perfect time for maintenance tasks that were too hot to tackle in summer.",
    tasks: [
      "Schedule second annual AC maintenance (post-summer stress)",
      "Plant fall flowers and vegetables",
      "Inspect and seal exterior wood surfaces",
      "Clean and cover outdoor furniture for winter",
      "Test heating system before occasional cool fronts",
      "Apply fall fertilizer to lawn"
    ]
  },
  {
    month: "November",
    title: "Hurricane Season Ends",
    description: "Hurricane season officially ends November 30. Time to shift focus to winter preparation and system recovery from summer stress.",
    tasks: [
      "Store hurricane supplies properly",
      "Deep clean pool and reduce chemical treatments",
      "Plant cool-season flowers and vegetables",
      "Pressure wash home exterior (remove summer algae and mildew)",
      "Inspect and clean ceiling fans",
      "Schedule chimney cleaning if applicable"
    ]
  },
  {
    month: "December",
    title: "Year-End Maintenance",
    description: "December's mild weather is perfect for major maintenance projects and preparing for the new year cycle.",
    tasks: [
      "Test smoke detectors and replace batteries",
      "Deep clean or replace HVAC filters",
      "Inspect and touch up exterior paint",
      "Service major appliances",
      "Review and update home maintenance records",
      "Plan next year's major home improvement projects"
    ]
  }
];

const faqs = [
  {
    question: "When is the best time for home maintenance in Orlando?",
    answer: "October through March offers the most comfortable working conditions in Orlando. Avoid major outdoor projects during peak heat (July-August) and active hurricane season.",
  },
  {
    question: "How often should I change AC filters in Orlando?",
    answer: "Monthly during peak season (April-October), every 2-3 months in winter. Florida's year-round AC usage and pollen levels require frequent filter changes.",
  },
  {
    question: "What's the most critical maintenance month in Orlando?",
    answer: "March is crucial for AC preparation before the demanding summer season. Proper March maintenance prevents costly mid-summer breakdowns when units run constantly.",
  },
  {
    question: "How often should I pressure wash my home in Orlando?",
    answer: "Annually, typically in November after summer humidity promotes algae and mildew growth. Some homes need semi-annual cleaning depending on shade and moisture exposure.",
  },
  {
    question: "When should I prepare for hurricane season in Orlando?",
    answer: "Begin hurricane preparations in April. Complete tasks like tree trimming, storm shutter installation, and supply stocking by May before peak season starts June 1.",
  },
  {
    question: "How is Orlando home maintenance different from other cities?",
    answer: "Orlando's subtropical climate means year-round AC usage, hurricane season prep, constant humidity control, and pest prevention. Systems work harder and need more frequent maintenance than northern climates.",
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
  headline: "Orlando Home Maintenance Calendar: What to Do Each Month",
  datePublished: "2026-03-06",
  dateModified: "2026-03-06",
  author: { "@type": "Organization", name: "UpTend" },
  publisher: { "@type": "Organization", name: "UpTend", url: "https://uptendapp.com" },
  mainEntityOfPage: "https://uptendapp.com/orlando-home-maintenance-calendar",
  keywords: "orlando home maintenance calendar, florida home maintenance schedule, central florida home care, hurricane prep orlando, ac maintenance orlando",
};

export default function OrlandoHomeMaintenanceCalendar() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Helmet>
        <title>Orlando Home Maintenance Calendar: What to Do Each Month | UpTend</title>
        <meta
          name="description"
          content="Monthly home maintenance calendar for Orlando. Hurricane prep, AC maintenance, humidity control, and Central Florida climate-specific home care tasks."
        />
        <link rel="canonical" href="https://uptendapp.com/orlando-home-maintenance-calendar" />
        <meta property="og:title" content="Orlando Home Maintenance Calendar: What to Do Each Month" />
        <meta property="og:description" content="Complete monthly home maintenance guide for Central Florida climate. Hurricane prep, AC care, and seasonal tasks." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://uptendapp.com/orlando-home-maintenance-calendar" />
        <meta property="article:published_time" content="2026-03-06" />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <article className="max-w-4xl mx-auto px-4 pt-28 pb-16 prose prose-lg prose-orange dark:prose-invert max-w-none">
        <nav className="text-sm text-muted-foreground mb-8 not-prose">
          <Link href="/" className="hover:text-orange-600">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/services" className="hover:text-orange-600">Services</Link>
          <span className="mx-2">›</span>
          <span>Orlando Home Maintenance Calendar</span>
        </nav>

        <div className="max-w-3xl">
          <time className="text-sm text-muted-foreground not-prose">Published March 6, 2026</time>
          <h1>Orlando Home Maintenance Calendar: What to Do Each Month</h1>

          <p>
            Central Florida's subtropical climate demands year-round home maintenance. This monthly schedule keeps Orlando homes in peak condition, preventing costly repairs while accounting for hurricane season, extreme heat, and high humidity that stress home systems.
          </p>
        </div>

        <div className="not-prose grid gap-6 mt-8">
          {monthlyTasks.map((month) => (
            <div key={month.month} className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-950/50 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-bold text-sm">{month.month.slice(0, 3).toUpperCase()}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">{month.month} - {month.title}</h2>
                  <p className="text-muted-foreground text-sm">{month.description}</p>
                </div>
              </div>
              <ul className="space-y-2">
                {month.tasks.map((task, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-foreground">{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="max-w-3xl mt-12">
          <h2>Florida-Specific Maintenance Tips</h2>
          
          <h3>Humidity Control</h3>
          <p>Florida homes should maintain 40-60% humidity. Higher levels promote mold and pest problems. Lower levels stress wood and increase dust.</p>
          
          <h3>Pest Prevention</h3>
          <p>Monthly pest control is recommended in Central Florida. Focus on entry points, moisture control, and vegetation management.</p>
          
          <h3>Mold Prevention</h3>
          <p>Inspect areas prone to moisture monthly: bathrooms, laundry rooms, under sinks, and attics. Address leaks immediately.</p>

          <h2>Frequently Asked Questions</h2>
          {faqs.map((faq, i) => (
            <div key={i}>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </div>
          ))}

          <div className="not-prose mt-12 p-6 bg-orange-50 dark:bg-orange-950/30 rounded-xl border border-orange-200 dark:border-orange-900">
            <h2 className="text-xl font-bold text-foreground mb-2">Need Help with Home Maintenance in Orlando?</h2>
            <p className="text-muted-foreground mb-4">
              UpTend handles all 13 home service categories. HVAC, plumbing, electrical, and more. Licensed professionals.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/services"
                className="inline-flex items-center justify-center px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors"
              >
                Book Service →
              </Link>
              <a
                href="tel:+18559012072"
                className="inline-flex items-center justify-center px-6 py-3 border border-orange-600 text-orange-600 dark:text-orange-400 font-semibold rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/50 transition-colors"
              >
                Call (855) 901-2072
              </a>
            </div>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
}