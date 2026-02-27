import { usePageTitle } from "@/hooks/use-page-title";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShieldCheck, CheckCircle, Zap, Users, ArrowRight,
  Wrench, Home, Star, MapPin, Smartphone,
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
