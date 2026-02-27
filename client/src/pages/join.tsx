import { usePageTitle } from "@/hooks/use-page-title";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShieldCheck, CheckCircle, Zap, Users, ArrowRight,
  Wrench, Home, Star, MapPin, Smartphone, Heart, Clock, DollarSign,
} from "lucide-react";
import { Founding100 } from "@/components/landing/founding-100";
import { Logo } from "@/components/ui/logo";

export default function JoinPage() {
  usePageTitle("Join UpTend | Home Intelligence");

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Minimal header */}
      <header className="fixed top-0 w-full z-50 bg-slate-950/90 backdrop-blur border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <Logo variant="light" />
          </Link>
          <a href="#join">
            <Button size="sm" className="bg-[#F47C20] hover:bg-[#E06910] text-white">
              Sign Up
            </Button>
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-28 pb-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[#F47C20] text-xs font-semibold uppercase tracking-[0.2em] mb-4">Home Intelligence</p>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            One Price. One Pro.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F47C20] to-orange-300">Done.</span>
          </h1>
          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-8">
            UpTend is the first Home Intelligence platform. Background-checked pros, transparent pricing, and George, an AI home expert who knows your house and handles everything.
          </p>
          <a href="#join">
            <Button size="lg" className="bg-[#F47C20] hover:bg-[#E06910] text-white text-lg px-10 h-14 rounded-xl">
              Join the Founding 100 <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </a>
        </div>
      </section>

      {/* What is UpTend */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">What is UpTend?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#F47C20]/10 flex items-center justify-center mx-auto mb-4">
                <Home className="w-7 h-7 text-[#F47C20]" />
              </div>
              <h3 className="font-bold text-lg mb-2">Every Home Service</h3>
              <p className="text-slate-400 text-sm">
                11 service categories from junk removal to pool cleaning. One platform for everything your home needs.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#F47C20]/10 flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-7 h-7 text-[#F47C20]" />
              </div>
              <h3 className="font-bold text-lg mb-2">Meet George</h3>
              <p className="text-slate-400 text-sm">
                Your AI home expert. George knows your home, diagnoses problems from photos, finds the right pro, and handles booking to completion.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#F47C20]/10 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-7 h-7 text-[#F47C20]" />
              </div>
              <h3 className="font-bold text-lg mb-2">Total Transparency</h3>
              <p className="text-slate-400 text-sm">
                Upfront pricing with a Guaranteed Price Ceiling. Every pro is background-checked and insured. No surprises.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-slate-900/50 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Tell Us What You Need", desc: "Pick a service or snap a photo and let George figure it out." },
              { step: "2", title: "Get Matched", desc: "George finds the best pro for your job based on quality, price, and proximity." },
              { step: "3", title: "Book Instantly", desc: "One price. Confirm with a tap. Your pro is on the way." },
              { step: "4", title: "Done", desc: "Track your pro in real time. Pay when the job is complete. Leave a review." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-[#F47C20] text-white font-bold text-lg flex items-center justify-center mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="font-bold mb-1">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">11 Services. One Platform.</h2>
          <p className="text-slate-400 text-center mb-10">Serving Orlando metro: Lake Nona, Winter Park, Dr. Phillips, Windermere, Celebration, and 7 more neighborhoods.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              "Junk Removal", "Pressure Washing", "Gutter Cleaning", "Home Cleaning",
              "Handyman", "Landscaping", "Moving Labor", "Light Demolition",
              "Garage Cleanout", "Pool Cleaning", "Carpet Cleaning"
            ].map((svc) => (
              <span key={svc} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300">
                {svc}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Why Join Now */}
      <section className="py-16 px-4 bg-slate-900/50 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Why Join Now?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Users className="w-8 h-8 text-[#F47C20] shrink-0" />
                  <div>
                    <h3 className="font-bold text-white mb-1">For Homeowners</h3>
                    <ul className="text-slate-400 text-sm space-y-1">
                      <li>10% off your first service</li>
                      <li>Priority booking access</li>
                      <li>Direct line to George</li>
                      <li>"Founding Member" badge forever</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Wrench className="w-8 h-8 text-[#F47C20] shrink-0" />
                  <div>
                    <h3 className="font-bold text-white mb-1">For Pros</h3>
                    <ul className="text-slate-400 text-sm space-y-1">
                      <li>12% platform fee (vs 15%) for Year 1</li>
                      <li>Priority placement in matching</li>
                      <li>"Founding Pro" badge on your profile</li>
                      <li>Direct input on platform features</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Punchy Quote */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              Fair for customers. Fair for Pros.<br />
              <span className="text-[#F47C20]">That's the whole point.</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              When Pros keep 85% of every job, they do better work. When customers get one locked price, they stop worrying. UpTend makes both sides win.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                <Heart className="w-5 h-5 text-[#F47C20]" /> For Homeowners
              </h3>
              <div className="space-y-3">
                {[
                  { icon: Zap, title: "One price, locked at booking", desc: "No haggling. No \"I'll get back to you.\" Your price is confirmed before they arrive." },
                  { icon: ShieldCheck, title: "Background-checked and insured", desc: "Every pro is verified, insured, and rated by real customers. Know who's walking through your door." },
                  { icon: Clock, title: "Live tracking and photo docs", desc: "Follow your pro in real time. Every job documented with photos. Transparent from start to finish." },
                  { icon: DollarSign, title: "Price Protection Guarantee", desc: "The price you're quoted is the most you'll ever pay. Scope changes require your approval with photo evidence." },
                ].map((item) => (
                  <div key={item.title} className="p-4 flex gap-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="w-10 h-10 rounded-lg bg-[#F47C20]/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-[#F47C20]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm mb-1">{item.title}</h4>
                      <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                <Wrench className="w-5 h-5 text-[#F47C20]" /> Why Our Pros Are Better
              </h3>
              <div className="space-y-3">
                {[
                  { icon: DollarSign, title: "Keep 85% of every job", desc: "Our 15% platform fee. No lead fees. No bidding wars. No pay-to-play." },
                  { icon: ShieldCheck, title: "Guaranteed payment", desc: "Finish the job, get paid. Payments guaranteed through the platform." },
                  { icon: MapPin, title: "Set your own rates", desc: "You choose your rate within the market range. We match you with customers who value quality." },
                  { icon: Star, title: "You're protected too", desc: "Insurance, documentation, guaranteed payments. Dispute insurance that's actually fair." },
                ].map((item) => (
                  <div key={item.title} className="p-4 flex gap-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="w-10 h-10 rounded-lg bg-[#F47C20]/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-[#F47C20]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm mb-1">{item.title}</h4>
                      <p className="text-slate-400 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Grid */}
      <section className="py-16 px-4 bg-slate-900/50 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black text-center mb-10 text-white">
            Stop wasting time on other platforms.
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-500 text-sm uppercase tracking-wider">Thumbtack, Angi, TaskRabbit</h3>
              <div className="space-y-3 text-sm text-slate-500">
                <p className="flex items-start gap-3"><span className="text-red-400 font-bold text-lg leading-none mt-0.5">x</span> You post a job and wait for 5 strangers to bid</p>
                <p className="flex items-start gap-3"><span className="text-red-400 font-bold text-lg leading-none mt-0.5">x</span> You compare quotes, read reviews, hope for the best</p>
                <p className="flex items-start gap-3"><span className="text-red-400 font-bold text-lg leading-none mt-0.5">x</span> Price changes when the pro shows up and "sees the job"</p>
                <p className="flex items-start gap-3"><span className="text-red-400 font-bold text-lg leading-none mt-0.5">x</span> Pro pays $15-50 per lead just to talk to you</p>
                <p className="flex items-start gap-3"><span className="text-red-400 font-bold text-lg leading-none mt-0.5">x</span> No one manages the job. You're on your own.</p>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-[#F47C20] text-sm uppercase tracking-wider">UpTend</h3>
              <div className="space-y-3 text-sm text-slate-300">
                <p className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> George finds you one pro. The right one.</p>
                <p className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> One price, locked before they arrive. Guaranteed.</p>
                <p className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Scope changes require your approval with photo proof</p>
                <p className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> Pros keep 85%. No lead fees. Better work.</p>
                <p className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /> George manages everything. Booking to completion.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Founding 100 Signup */}
      <div id="join">
        <Founding100 />
      </div>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/5 text-center">
        <Link href="/">
          <Logo variant="light" />
        </Link>
        <p className="text-slate-500 text-xs mt-4">
          &copy; {new Date().getFullYear()} UpTend Services LLC. Orlando, FL.
        </p>
        <div className="flex justify-center gap-6 mt-3 text-xs text-slate-500">
          <Link href="/terms" className="hover:text-white">Terms</Link>
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
          <a href="https://uptendapp.com" className="hover:text-white">uptendapp.com</a>
        </div>
      </footer>
    </div>
  );
}
