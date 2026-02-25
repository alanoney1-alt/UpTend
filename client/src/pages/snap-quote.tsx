import { Camera, ArrowRight, Shield } from "lucide-react";
import { SnapQuote } from "@/components/snap-quote";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

export default function SnapQuotePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-white">
      <Header />
      {/* Hero */}
      <section className="max-w-2xl mx-auto px-4 pt-28 pb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
          Snap a Photo.<br />Get a Price.<br />Book a Pro.
        </h1>
        <p className="mt-4 text-lg text-slate-600 max-w-lg mx-auto">
          Take a photo of any home issue and get a guaranteed price in seconds.
          No waiting, no phone calls, no surprises.
        </p>
      </section>

      {/* Upload Area */}
      <section className="max-w-lg mx-auto px-4 pb-12">
        <SnapQuote />
      </section>

      {/* How It Works */}
      <section className="max-w-3xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              step: "1",
              title: "Snap",
              desc: "Take a photo of the issue -- clogged gutters, messy garage, overgrown yard, anything.",
            },
            {
              step: "2",
              title: "Quote",
              desc: "George analyzes the photo and gives you a guaranteed maximum price in seconds.",
            },
            {
              step: "3",
              title: "Book",
              desc: "One tap to book. Your price is locked. A verified pro shows up and gets it done.",
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 font-bold text-lg flex items-center justify-center mx-auto mb-3">
                {item.step}
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
              <p className="text-sm text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Price Protection */}
      <section className="max-w-2xl mx-auto px-4 pb-20">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 sm:p-8 text-center">
          <Shield className="w-10 h-10 text-amber-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Price Protection Guarantee</h2>
          <p className="text-slate-600">
            The price you see is the maximum you will ever pay. If your pro finds extra work
            on-site, they must get your approval before any price change. If the job costs less,
            you pay less. No hidden fees. No surprises.
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
}
