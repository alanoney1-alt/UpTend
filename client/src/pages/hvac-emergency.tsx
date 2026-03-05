import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { AlertTriangle, Thermometer, Zap, Wind, Fan, Phone, ArrowRight } from "lucide-react";

const emergencySteps = [
  {
    icon: Thermometer,
    title: "Step 1: Check Your Thermostat",
    description: "Make sure the thermostat is set to COOL (not heat or off), the fan is set to AUTO, and the temperature is set at least 3°F below the current room temperature. Replace the batteries if the screen is blank. Try switching it off for 30 seconds, then back on.",
  },
  {
    icon: Zap,
    title: "Step 2: Check Your Breaker Panel",
    description: "Go to your electrical panel and look for any tripped breakers. Your HVAC system typically has two breakers — one for the indoor air handler and one for the outdoor condenser. If either is tripped, flip it fully OFF, wait 30 seconds, then flip it back ON. If it trips again immediately, do not reset it — this indicates an electrical fault that needs a professional.",
  },
  {
    icon: Wind,
    title: "Step 3: Check Your Air Filter",
    description: "A clogged air filter is the #1 cause of HVAC failures in Florida. Pull out the filter and hold it up to light — if you can't see light through it, replace it. In Orlando's humid climate, filters should be changed every 30–60 days, especially during summer. A severely clogged filter can cause the evaporator coil to freeze, shutting down the entire system.",
  },
  {
    icon: Fan,
    title: "Step 4: Check the Outdoor Unit",
    description: "Go outside and inspect the condenser unit. Clear any debris, leaves, or vegetation within 2 feet of the unit. Listen for any unusual sounds — grinding, buzzing, or clicking. Check if the fan is spinning when the system is running. If the unit is running but not blowing cold air, the compressor or refrigerant may be the issue — this requires a technician.",
  },
];

const faqs = [
  {
    question: "My AC stopped working in the middle of the night. What should I do?",
    answer: "Follow the four troubleshooting steps above (thermostat, breaker, filter, outdoor unit). If none resolve the issue, turn the system off to prevent further damage. Open windows if the outdoor temperature is cooler, or use portable fans. For emergency service in Orlando, call UpTend at (855) 901-2072 — we connect you with HVAC pros who offer after-hours service.",
  },
  {
    question: "Is a frozen AC unit an emergency?",
    answer: "A frozen evaporator coil is common in Orlando's humid climate but isn't a safety emergency. Turn the system to FAN ONLY (not cool) for 2–4 hours to let it thaw. Check and replace the air filter. If it freezes again after thawing, the system likely has a refrigerant leak or airflow problem that needs professional diagnosis.",
  },
  {
    question: "My AC is blowing warm air. What's wrong?",
    answer: "Common causes include: a dirty air filter restricting airflow, low refrigerant from a leak, a failed compressor, a tripped outdoor unit breaker, or a faulty thermostat. Start with the basic checks (filter, breaker, thermostat settings). If those don't resolve it, you need a technician to diagnose the refrigerant level and compressor function.",
  },
  {
    question: "How quickly can I get emergency HVAC service in Orlando?",
    answer: "Most Orlando HVAC companies offer same-day or next-day service. During peak summer months (June–September), wait times can extend to 24–48 hours due to high demand. Emergency after-hours calls are available from many providers but typically cost $50–$150 more than standard service calls. UpTend can connect you with available pros in your area.",
  },
  {
    question: "Should I turn off my AC if it's making strange noises?",
    answer: "Yes. Grinding, screeching, or banging noises indicate mechanical failure — a failing compressor, broken fan blade, or loose component. Continuing to run the system can cause further damage and more expensive repairs. Turn the system off at the thermostat and call a technician.",
  },
  {
    question: "My thermostat is blank. Is my AC broken?",
    answer: "Not necessarily. A blank thermostat is often caused by dead batteries (if battery-powered), a tripped breaker, or a blown fuse in the air handler. Replace the batteries first. If it's hardwired, check the breaker panel. If neither resolves it, the issue may be a blown control board fuse — an inexpensive fix ($50–$150) for a technician.",
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
  headline: "Orlando HVAC Emergency — What To Do When Your AC Breaks",
  datePublished: "2026-03-01",
  dateModified: "2026-03-05",
  author: { "@type": "Organization", name: "UpTend" },
  publisher: { "@type": "Organization", name: "UpTend", url: "https://uptendapp.com" },
  mainEntityOfPage: "https://uptendapp.com/hvac-emergency",
  keywords: "hvac emergency orlando, ac stopped working orlando, ac not cooling orlando, emergency ac repair orlando",
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "What to Do When Your AC Stops Working in Orlando",
  description: "Step-by-step troubleshooting guide for Orlando homeowners when their HVAC system stops working.",
  step: emergencySteps.map((step, i) => ({
    "@type": "HowToStep",
    position: i + 1,
    name: step.title.replace(/^Step \d+: /, ""),
    text: step.description,
  })),
};

export default function HvacEmergency() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Helmet>
        <title>Orlando HVAC Emergency — What To Do | UpTend</title>
        <meta
          name="description"
          content="AC stopped working in Orlando? Step-by-step troubleshooting guide: check thermostat, breaker, filter, and outdoor unit. When to call a pro and how to get emergency HVAC service."
        />
        <link rel="canonical" href="https://uptendapp.com/hvac-emergency" />
        <meta property="og:title" content="Orlando HVAC Emergency — What To Do When Your AC Breaks" />
        <meta property="og:description" content="Step-by-step guide for Orlando homeowners when the AC stops working. Troubleshoot before calling a pro." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://uptendapp.com/hvac-emergency" />
        <meta property="article:published_time" content="2026-03-01" />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(howToSchema)}</script>
      </Helmet>

      <article className="max-w-3xl mx-auto px-4 pt-28 pb-16">
        <nav className="text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-orange-600">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/services/hvac" className="hover:text-orange-600">HVAC Services</Link>
          <span className="mx-2">›</span>
          <span>HVAC Emergency</span>
        </nav>

        {/* Emergency banner */}
        <div className="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl mb-8">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground">If you smell gas or see smoke, leave your home immediately and call 911.</p>
            <p className="text-sm text-muted-foreground mt-1">
              The troubleshooting steps below are for non-emergency AC failures. Gas leaks and electrical fires require emergency services first.
            </p>
          </div>
        </div>

        <time className="text-sm text-muted-foreground">Updated March 5, 2026</time>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mt-2 mb-6">
          Orlando HVAC Emergency — What To Do
        </h1>

        <div className="prose prose-lg prose-orange dark:prose-invert mb-12">
          <p>
            Your AC just stopped. It's 92°F outside and the house is getting hotter by the minute.
            Before you call anyone, run through these four checks. About 30% of HVAC "emergencies" can be
            resolved without a technician.
          </p>
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-6">4 Things to Check Before Calling a Pro</h2>

        <div className="space-y-6 mb-12">
          {emergencySteps.map((step) => (
            <div key={step.title} className="flex gap-4 p-5 bg-card border border-border rounded-xl">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center">
                <step.icon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="prose prose-lg prose-orange dark:prose-invert mb-12">
          <h2>When to Call a Professional</h2>
          <p>
            If you've checked all four steps above and your system still isn't working, it's time for a
            technician. Here are signs that the issue is beyond DIY:
          </p>
          <ul>
            <li><strong>System runs but doesn't cool</strong> — likely a refrigerant leak or compressor issue</li>
            <li><strong>Breaker trips repeatedly</strong> — electrical fault that can be a fire hazard</li>
            <li><strong>Ice on indoor or outdoor coils</strong> — refrigerant leak or severe airflow restriction</li>
            <li><strong>Unusual smells</strong> — burning smell means stop the system immediately; musty smell indicates mold in the ducts</li>
            <li><strong>Water pooling around indoor unit</strong> — clogged condensate drain line (common in Florida humidity)</li>
            <li><strong>System is 15+ years old</strong> — repeated failures usually mean it's time for replacement</li>
          </ul>

          <h2>Get Emergency HVAC Help in Orlando</h2>
          <p>
            UpTend connects Orlando homeowners with vetted, local HVAC professionals. We can help you find available
            technicians for same-day and emergency service.
          </p>
        </div>

        {/* CTA Block */}
        <div className="p-6 bg-orange-50 dark:bg-orange-950/30 rounded-xl border border-orange-200 dark:border-orange-900 mb-12">
          <h2 className="text-xl font-bold text-foreground mb-2">Need HVAC Help Now?</h2>
          <p className="text-muted-foreground mb-4">
            Call UpTend or request service online. We'll connect you with an available HVAC pro in your area.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="tel:+18559012072"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors"
            >
              <Phone className="w-4 h-4" />
              Call (855) 901-2072
            </a>
            <Link
              href="/services/hvac"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-orange-600 text-orange-600 dark:text-orange-400 font-semibold rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/50 transition-colors"
            >
              Request Service Online
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="prose prose-lg prose-orange dark:prose-invert">
          <h2>Frequently Asked Questions</h2>
          {faqs.map((faq, i) => (
            <div key={i}>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </div>
          ))}
        </div>
      </article>

      <Footer />
    </div>
  );
}
