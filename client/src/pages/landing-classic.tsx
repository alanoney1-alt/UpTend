import { usePageTitle } from "@/hooks/use-page-title";
import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { useSiteMode } from "@/contexts/site-mode-context";
import {
  Truck, TreePine, Droplets, Wrench, Sparkles, Home,
  Scissors, Waves, HardHat, Hammer, ScanLine,
  ArrowRight, Shield, Clock, MapPin, Zap, Star,
} from "lucide-react";

const SERVICES = [
  { icon: Truck, name: "Junk Removal", from: "$99", desc: "Furniture, appliances, yard waste — gone." },
  { icon: Droplets, name: "Pressure Washing", from: "$120", desc: "Driveways, patios, pool decks." },
  { icon: Home, name: "Gutter Cleaning", from: "$150", desc: "Prevent water damage before it starts." },
  { icon: Wrench, name: "Handyman", from: "$75/hr", desc: "Repairs, mounting, installations." },
  { icon: HardHat, name: "Moving Labor", from: "$65/hr", desc: "Loading, unloading, rearranging." },
  { icon: Hammer, name: "Light Demolition", from: "$199", desc: "Sheds, decks, interior teardown." },
  { icon: Sparkles, name: "Home Cleaning", from: "$99", desc: "Standard, deep, and move-out cleans." },
  { icon: Waves, name: "Pool Cleaning", from: "$120/mo", desc: "Crystal clear, every month." },
  { icon: TreePine, name: "Landscaping", from: "$49", desc: "Mowing, edging, trimming, mulching." },
  { icon: Scissors, name: "Carpet Cleaning", from: "$50/room", desc: "Standard, deep, and pet treatments." },
  { icon: Home, name: "Garage Cleanout", from: "$150", desc: "Organize, haul, reclaim your space." },
  { icon: ScanLine, name: "AI Home Scan", from: "$99", desc: "Full health report, roof to foundation." },
] as const;

export default function LandingClassic() {
  usePageTitle("UpTend — Your Home, Handled.");
  const { toggle } = useSiteMode();

  return (
    <div className="min-h-screen bg-[#FFFBF5]" data-testid="page-landing-classic">
      <Header />

      {/* Hero */}
      <section className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-stone-900 leading-tight">
            Home services,<br />finally done right.
          </h1>
          <p className="mt-4 text-lg text-stone-500 max-w-lg mx-auto leading-relaxed">
            Vetted pros. Guaranteed prices. Book in 60 seconds. Serving the Orlando metro area.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/book" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-stone-900 text-white font-semibold hover:bg-stone-800 transition-colors">
              Book a Service <ArrowRight className="w-4 h-4" />
            </a>
            <button onClick={toggle} className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-stone-200 text-stone-700 font-semibold hover:bg-stone-50 transition-colors">
              Try George AI
            </button>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-12 px-4 border-y border-stone-100">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { icon: Shield, label: "Guaranteed Pricing" },
            { icon: Zap, label: "Book in 60 Seconds" },
            { icon: Clock, label: "Same-Day Available" },
            { icon: MapPin, label: "Orlando Metro" },
          ].map((t, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <t.icon className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm font-medium text-stone-700">{t.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-stone-900 mb-3">Our Services</h2>
          <p className="text-center text-stone-500 mb-10">12 categories. Vetted pros. Fair prices.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {SERVICES.map(({ icon: Icon, name, from, desc }) => (
              <a key={name} href={`/book?service=${encodeURIComponent(name)}`} className="group flex items-start gap-4 p-5 rounded-xl border border-stone-100 bg-white hover:border-amber-200 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 transition-colors">
                  <Icon className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-stone-900 text-sm">{name}</p>
                  <p className="text-xs text-stone-500 mt-0.5">{desc}</p>
                  <p className="text-xs text-amber-600 font-medium mt-1">from {from}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-stone-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-stone-900 mb-10">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Tell Us What You Need", desc: "Pick a service or describe the job. Get an instant price estimate." },
              { step: "2", title: "We Match You With a Pro", desc: "Vetted, background-checked pros matched to your job and location." },
              { step: "3", title: "Sit Back, We Handle It", desc: "Guaranteed price. Real-time tracking. Quality work, every time." },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-10 h-10 rounded-full bg-amber-500 text-white font-bold text-sm flex items-center justify-center mx-auto mb-3">
                  {s.step}
                </div>
                <h3 className="font-semibold text-stone-900 mb-1">{s.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-stone-900 mb-3">Ready to get started?</h2>
        <p className="text-stone-500 mb-6">No account needed. Pick a service and book in under a minute.</p>
        <a href="/book" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-stone-900 text-white font-semibold hover:bg-stone-800 transition-colors">
          Book Now <ArrowRight className="w-4 h-4" />
        </a>
      </section>

      <Footer />
    </div>
  );
}
