import { usePageTitle } from "@/hooks/use-page-title";
import { Link } from "wouter";
import { Footer } from "@/components/landing/footer";
import {
  Camera, FileSearch, Leaf, CalendarClock, Sparkles, ArrowRight,
  MessageCircle, ScanLine, Video, Calculator,
} from "lucide-react";

/* ─── Design Tokens ─── */
const T = {
  bg: "#FFFBF5",
  primary: "#F59E0B",
  primaryDark: "#D97706",
  text: "#1E293B",
  textMuted: "#64748B",
  card: "#FFFFFF",
};

function openGeorge(message?: string) {
  window.dispatchEvent(new CustomEvent("george:open", { detail: message ? { message } : undefined }));
}

function GeorgeAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = size === "sm" ? "w-10 h-10 text-lg" : size === "lg" ? "w-20 h-20 text-3xl" : "w-14 h-14 text-2xl";
  return (
    <div
      className={`${s} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}
      style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})` }}
    >
      G
    </div>
  );
}

const capabilities = [
  {
    icon: Camera,
    title: "Photo-to-Quote",
    george: "Snap a photo of anything — junk, damage, a messy garage — and I'll estimate the cost instantly.",
    href: "/ai/photo-quote",
    ready: true,
  },
  {
    icon: FileSearch,
    title: "Document Scanner",
    george: "Got warranties, receipts, or insurance docs? I'll pull out the key dates and amounts for you.",
    href: "/ai/documents",
    ready: true,
  },
  {
    icon: ScanLine,
    title: "Home Scan",
    george: "Walk me through a room and I'll catalog everything I see — appliances, furniture, condition, all of it.",
    href: "/ai/home-scan",
    ready: true,
  },
  {
    icon: Leaf,
    title: "Seasonal Advisor",
    george: "I'll tell you exactly what your home needs this season based on where you live. No more surprises.",
    href: "",
    ready: false,
  },
  {
    icon: CalendarClock,
    title: "Smart Scheduling",
    george: "I check the weather and pro availability to find you the perfect time to book. Just say when.",
    href: "",
    ready: false,
  },
  {
    icon: Calculator,
    title: "Instant Estimates",
    george: "Describe what you need and I'll give you a ballpark before you even book. No obligation.",
    href: "",
    ready: false,
  },
];

export default function AIFeaturesHub() {
  usePageTitle("Mr. George's Toolkit | UpTend");

  return (
    <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-4 pt-20 pb-10">
        <GeorgeAvatar size="lg" />
        <h1 className="mt-4 text-2xl md:text-3xl font-bold tracking-tight" style={{ color: T.text }}>
          What can I do for you?
        </h1>
        <p className="mt-2 text-sm md:text-base max-w-lg text-center" style={{ color: T.textMuted }}>
          I've got a whole toolkit of tricks. Want me to scan a room? Analyze a photo? Find you a tutorial? Just pick one.
        </p>
      </section>

      {/* Capabilities */}
      <section className="max-w-3xl mx-auto px-4 pb-16 w-full">
        <div className="space-y-4">
          {capabilities.map((cap) => {
            const content = (
              <div
                className={`rounded-2xl p-5 border shadow-sm transition-all ${
                  cap.ready
                    ? "border-amber-100 hover:shadow-md hover:border-amber-200 cursor-pointer"
                    : "border-gray-100 opacity-70"
                }`}
                style={{ background: T.card }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <cap.icon className="w-6 h-6" style={{ color: T.primary }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold" style={{ color: T.text }}>{cap.title}</h3>
                      {!cap.ready && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: T.textMuted }}>
                      "{cap.george}"
                    </p>
                  </div>
                  {cap.ready && (
                    <ArrowRight className="w-5 h-5 shrink-0 mt-1" style={{ color: T.primary }} />
                  )}
                </div>
              </div>
            );

            return cap.ready && cap.href ? (
              <Link key={cap.title} href={cap.href}>{content}</Link>
            ) : (
              <div key={cap.title}>{content}</div>
            );
          })}
        </div>

        {/* George CTA */}
        <div className="mt-10 text-center">
          <p className="text-sm mb-4" style={{ color: T.textMuted }}>
            Not sure what you need? Just ask me.
          </p>
          <button
            onClick={() => openGeorge("What should I do for my home?")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-bold shadow-lg hover:shadow-xl transition-shadow"
            style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})` }}
          >
            <MessageCircle className="w-5 h-5" />
            Chat with George
          </button>
        </div>
      </section>

      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
