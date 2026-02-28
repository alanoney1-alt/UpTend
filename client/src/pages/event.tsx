import { usePageTitle } from "@/hooks/use-page-title";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";

export default function EventPage() {
  usePageTitle("UpTend | World of Wellness");

  const [form, setForm] = useState({ name: "", email: "", phone: "", zip: "", type: "customer" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [spot, setSpot] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) {
      setError("Please fill in your name, email, and phone.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/founding-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          zip: form.zip,
          type: form.type,
          source: "event-wellness-2026",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSpot(data.spotNumber || null);
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Something went wrong. Try again.");
      }
    } catch {
      setError("Could not connect. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[#10B981]/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-[#10B981]" />
          </div>
          <h1 className="text-3xl font-black text-white mb-3">You're In!</h1>
          {spot && (
            <p className="text-[#F47C20] text-lg font-bold mb-3">Founding Member #{spot}</p>
          )}
          <p className="text-slate-400 text-lg mb-6">
            You've got a $25 credit waiting for your first service. We'll text you when we're live in your area.
          </p>
          <a href="/" className="text-[#F47C20] text-sm font-semibold hover:underline">
            Explore uptendapp.com
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo + Event Badge */}
        <div className="text-center mb-8">
          <img src="/logo-icon.png" alt="UpTend" className="w-16 h-16 mx-auto mb-4 rounded-xl" />
          <h1 className="text-4xl font-black text-white mb-1">
            <span className="text-[#F47C20]">Up</span>Tend
          </h1>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-[0.2em] mb-4">Home Intelligence</p>
          <div className="inline-block px-4 py-1.5 rounded-full bg-[#F47C20]/10 border border-[#F47C20]/20">
            <p className="text-[#F47C20] text-xs font-bold uppercase tracking-wider">World of Wellness 2026</p>
          </div>
        </div>

        {/* Value Prop */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-white mb-2">
            Your Home, Handled.
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Tell us what you need. Get a fair price in 60 seconds. One verified pro, matched and booked. That's it.
          </p>
        </div>

        {/* Credit Offer */}
        <div className="bg-[#F47C20]/10 border border-[#F47C20]/20 rounded-xl p-4 text-center mb-8">
          <p className="text-[#F47C20] font-black text-2xl mb-1">$25 Credit</p>
          <p className="text-slate-400 text-sm">On your first service. Sign up now.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Your name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#F47C20]/50 transition-colors"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#F47C20]/50 transition-colors"
          />
          <input
            type="tel"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#F47C20]/50 transition-colors"
          />
          <input
            type="text"
            placeholder="Zip code"
            value={form.zip}
            onChange={(e) => setForm({ ...form, zip: e.target.value })}
            className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#F47C20]/50 transition-colors"
          />

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            size="lg"
            className="w-full bg-[#F47C20] hover:bg-[#E06910] text-white font-bold text-lg h-14 rounded-xl shadow-lg shadow-[#F47C20]/25 transition-all"
          >
            {loading ? "Signing up..." : "Claim Your $25 Credit"} 
            {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
          </Button>
        </form>

        {/* Trust signals */}
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-slate-500">
          <span>Background-Checked Pros</span>
          <span>Price-Protected</span>
          <span>Lake Nona Based</span>
        </div>

        {/* Services teaser */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">Services Available</p>
          <div className="flex flex-wrap justify-center gap-2">
            {["Junk Removal", "Pressure Washing", "Gutter Cleaning", "Home Cleaning", "Handyman", "Landscaping", "Pool Cleaning"].map((s) => (
              <span key={s} className="px-3 py-1 rounded-full bg-white/5 border border-white/8 text-slate-400 text-xs">
                {s}
              </span>
            ))}
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-slate-600 uppercase tracking-widest">
          Lake Nona, FL
        </p>
      </div>
    </div>
  );
}
