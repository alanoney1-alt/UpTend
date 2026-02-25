import { Shield } from "lucide-react";
import { SnapQuote } from "@/components/snap-quote";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

export default function SnapQuotePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero. tight, mobile-first */}
      <section className="max-w-lg mx-auto px-4 pt-24 pb-6 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
          Snap. Book. Done.
        </h1>
        <p className="mt-2 text-base text-slate-500 max-w-sm mx-auto">
          Photo → Describe → Price → Pro at your door.
        </p>
      </section>

      {/* The Snap Quote component. the whole flow */}
      <section className="max-w-lg mx-auto px-4 pb-8">
        <SnapQuote />
      </section>

      {/* Compact trust strip */}
      <section className="max-w-lg mx-auto px-4 pb-12">
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <Shield className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-slate-700">
            <strong>Price Protection Guarantee</strong>. The price you see is the max you pay. Always.
          </p>
        </div>
      </section>

      {/* How It Works. minimal */}
      <section className="max-w-lg mx-auto px-4 pb-16">
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { step: "1", label: "Snap" },
            { step: "2", label: "Price" },
            { step: "3", label: "Booked" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-[#F47C20] text-white flex items-center justify-center text-lg font-bold mb-2">{s.step}</div>
              <p className="text-sm font-semibold text-slate-700">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
