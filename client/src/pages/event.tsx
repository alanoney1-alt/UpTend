import { usePageTitle } from "@/hooks/use-page-title";
import {
  ShieldCheck, CheckCircle, Zap, Users, ArrowRight,
  Wrench, Home, Star, MapPin, Smartphone, Heart, Clock, DollarSign,
  Camera, Phone, MessageSquare, AlertTriangle, Thermometer,
  Search, FileText, TrendingUp, Eye, Lock, Hammer,
} from "lucide-react";
import { Founding100 } from "@/components/landing/founding-100";
import { Footer } from "@/components/landing/footer";
import { AnnouncementTicker } from "@/components/landing/announcement-ticker";
import { Button } from "@/components/ui/button";
import { GeorgeInlinePrompt } from "@/components/ai/george-inline-prompt";

export default function EventPage() {
  usePageTitle("UpTend | World of Wellness 2026");

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Minimal header - no nav, just logo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src="/logo-icon.png" alt="UpTend" className="w-8 h-8 rounded-lg" />
            <span className="text-xl font-black text-white">
              <span className="text-[#F47C20]">Up</span>Tend
            </span>
          </a>
          <div className="px-3 py-1 rounded-full bg-[#F47C20]/10 border border-[#F47C20]/20">
            <span className="text-[#F47C20] text-xs font-bold uppercase tracking-wider">World of Wellness 2026</span>
          </div>
        </div>
      </header>

      <main className="pt-16">
        <AnnouncementTicker />

        {/* Hero */}
        <section className="relative pt-16 pb-20 overflow-hidden bg-slate-900">
          <div className="absolute inset-0">
            <img src="/images/site/hero-home-service.webp" alt="" className="w-full h-full object-cover" loading="eager" />
            <div className="absolute inset-0 bg-slate-900/80" />
          </div>
          <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
            <div className="inline-block px-5 py-2 rounded-full bg-[#F47C20]/15 border border-[#F47C20]/30 mb-6">
              <p className="text-[#F47C20] text-sm font-bold uppercase tracking-wider">World of Wellness 2026</p>
            </div>
            <p className="text-[#F47C20] text-xs font-semibold uppercase tracking-[0.2em] mb-4">Home Intelligence</p>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
              One Price. One Pro.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F47C20] to-orange-300">Done.</span>
            </h1>
            <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-6">
              UpTend is the first Home Intelligence platform. We match you with a single vetted pro, lock your price before they arrive, and manage every step from booking to completion.
            </p>

            {/* Founding 100 callout */}
            <div className="inline-block bg-[#F47C20]/15 border border-[#F47C20]/30 rounded-2xl px-8 py-4 mb-8">
              <p className="text-[#F47C20] font-black text-3xl mb-1">Founding 100</p>
              <p className="text-white/70 text-sm">Join now and get 10% off your first 10 jobs</p>
            </div>

            {/* George inline chat prompt */}
            <div className="mb-8 max-w-xl mx-auto">
              <GeorgeInlinePrompt
                onSubmit={(msg) => {
                  window.dispatchEvent(new CustomEvent("george:open", { detail: { message: msg } }));
                }}
                onTap={() => {
                  window.dispatchEvent(new CustomEvent("george:open"));
                }}
              />
            </div>

            <div className="block">
              <a href="#join">
                <Button size="lg" className="bg-[#F47C20] hover:bg-[#E06910] text-white text-sm sm:text-lg px-6 sm:px-10 h-14 rounded-xl shadow-lg shadow-[#F47C20]/25 whitespace-normal max-w-[90vw]">
                  Join the Founding 100 <ArrowRight className="ml-2 w-5 h-5 shrink-0" />
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-12">
              Stop wasting time on platforms that don't work.
            </h2>
            <div className="grid md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <h3 className="font-bold text-slate-400 text-sm uppercase tracking-wider">Thumbtack, Angi, TaskRabbit</h3>
                <div className="space-y-3 text-sm text-slate-500">
                  <p className="flex items-start gap-3"><span className="text-red-500 font-bold text-lg leading-none mt-0.5">x</span> You post a job and wait for 5 strangers to bid</p>
                  <p className="flex items-start gap-3"><span className="text-red-500 font-bold text-lg leading-none mt-0.5">x</span> You compare quotes, read reviews, hope for the best</p>
                  <p className="flex items-start gap-3"><span className="text-red-500 font-bold text-lg leading-none mt-0.5">x</span> Price changes when the pro shows up and "sees the job"</p>
                  <p className="flex items-start gap-3"><span className="text-red-500 font-bold text-lg leading-none mt-0.5">x</span> Pro pays $15 to $50 per lead just to talk to you</p>
                  <p className="flex items-start gap-3"><span className="text-red-500 font-bold text-lg leading-none mt-0.5">x</span> No one manages the job. You're on your own.</p>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-[#F47C20] text-sm uppercase tracking-wider">UpTend</h3>
                <div className="space-y-3 text-sm text-slate-700">
                  <p className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /> George finds you one pro. The right one.</p>
                  <p className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /> One price, locked before they arrive. Guaranteed.</p>
                  <p className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /> Scope changes require your approval with photo proof</p>
                  <p className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /> Pros keep 85%. No lead fees. Better work.</p>
                  <p className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" /> George manages everything. Booking to completion.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Problem */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-4">Hiring a pro shouldn't feel like gambling.</h2>
            <p className="text-slate-600 text-lg text-center max-w-2xl mx-auto mb-14">
              You've been there. The endless quotes. The no-shows. The price that "changed" once they arrived. The stranger in your house you know nothing about. It's broken. We fixed it.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: AlertTriangle, title: "No more mystery pros", desc: "Every pro on UpTend passes a full background check and carries insurance. You see their rating, experience, and verified badge before they ever step foot in your home." },
                { icon: DollarSign, title: "No more price surprises", desc: "Your price is locked at booking with our Price Protection Guarantee. If the scope is bigger than expected, any changes require YOUR approval with photo evidence." },
                { icon: Clock, title: "No more waiting games", desc: "No posting a job and hoping someone responds. George matches you with the best available pro instantly. One price. One pro. Book in seconds." },
                { icon: Eye, title: "No more wondering", desc: "Track your pro in real time from the moment they leave to the moment they arrive. Every job is documented with before and after photos." },
                { icon: Lock, title: "No more risk", desc: "Payments are held until the job is done to your satisfaction. Disputes are handled by our team. You're protected from start to finish." },
                { icon: Phone, title: "No more phone tag", desc: "Everything happens on the platform. Booking, communication, scheduling, payment. No chasing contractors by text or calling five numbers." },
              ].map((item) => (
                <div key={item.title} className="p-6 rounded-xl bg-white border border-slate-200">
                  <div className="w-12 h-12 rounded-xl bg-[#F47C20]/10 flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-[#F47C20]" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What is UpTend */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-black mb-4">So what exactly is UpTend?</h2>
            <p className="text-slate-600 text-lg max-w-3xl mx-auto mb-14">
              UpTend is a home services platform built around one idea: the customer should never have to do the hard part. We handle matching, pricing, scheduling, tracking, payment, and quality control. You just say what you need.
            </p>
            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div className="p-6 rounded-2xl bg-white border border-slate-200">
                <Home className="w-8 h-8 text-[#F47C20] mb-4" />
                <h3 className="font-bold text-lg mb-2">11 Service Categories</h3>
                <p className="text-slate-600 text-sm">Junk Removal, Pressure Washing, Gutter Cleaning, Home Cleaning, Handyman, Landscaping, Moving Labor, Light Demolition, Garage Cleanout, Pool Cleaning, and Carpet Cleaning. One platform for everything.</p>
              </div>
              <div className="p-6 rounded-2xl bg-white border border-slate-200">
                <ShieldCheck className="w-8 h-8 text-[#F47C20] mb-4" />
                <h3 className="font-bold text-lg mb-2">Every Pro is Verified</h3>
                <p className="text-slate-600 text-sm">Background-checked, insured, and rated by real customers. You see their first name, rating, number of completed jobs, and how long they've been on the platform. No unknowns.</p>
              </div>
              <div className="p-6 rounded-2xl bg-white border border-slate-200">
                <DollarSign className="w-8 h-8 text-[#F47C20] mb-4" />
                <h3 className="font-bold text-lg mb-2">Fair for Everyone</h3>
                <p className="text-slate-600 text-sm">Customers get one locked price. Pros keep 85% of every job with zero lead fees. When pros are paid fairly, they do better work. Everyone wins.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Meet George */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-black mb-4">Meet George. Your home expert.</h2>
              <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                George is an AI assistant who actually knows homes. He's not a chatbot reading a script. He has real expertise in home maintenance, repair costs, Florida-specific issues, and how to get the right pro for the job.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-[#F47C20]" /> What George Can Do
                </h3>
                {[
                  { icon: Camera, title: "Photo Diagnosis", desc: "Snap a photo of a problem and George identifies what's wrong, estimates the cost, and tells you if it's a DIY fix or needs a pro." },
                  { icon: Search, title: "Find the Right Pro", desc: "George matches you with a single pro based on quality, price, proximity, and availability. No comparing five strangers." },
                  { icon: MessageSquare, title: "Answer Any Home Question", desc: "How often should I clean my gutters? Is this mold or mildew? What's that noise my AC is making? George knows." },
                  { icon: Hammer, title: "DIY Walkthrough", desc: "For jobs you want to handle yourself, George walks you through step-by-step with video tutorials from trusted creators." },
                  { icon: Thermometer, title: "Seasonal Maintenance", desc: "George knows Florida. Hurricane prep in summer, AC tune-ups in spring, pool care year-round. He reminds you before problems happen." },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4 p-4 rounded-xl bg-white border border-slate-200">
                    <div className="w-10 h-10 rounded-lg bg-[#F47C20]/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-[#F47C20]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm mb-1">{item.title}</h4>
                      <p className="text-slate-600 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#F47C20]" /> George Also Handles
                </h3>
                {[
                  { icon: FileText, title: "Home DNA Scan", desc: "Walk through your home room by room with George. He builds a complete profile of your systems, appliances, and maintenance needs. Think Carfax, but for your house." },
                  { icon: DollarSign, title: "Cost Intelligence", desc: "George knows what things actually cost in Orlando. Not national averages. Real local pricing so you never overpay." },
                  { icon: Clock, title: "Booking to Completion", desc: "George doesn't just find your pro. He manages the entire job: scheduling, tracking, payment, photos, and follow-up. You don't lift a finger." },
                  { icon: Star, title: "Product Recommendations", desc: "Need a specific part, tool, or product? George recommends exact items with real prices and links. No guessing." },
                  { icon: AlertTriangle, title: "Emergency Mode", desc: "Pipe burst? AC out in August? George fast-tracks emergency jobs and connects you with the nearest available pro immediately." },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4 p-4 rounded-xl bg-white border border-slate-200">
                    <div className="w-10 h-10 rounded-lg bg-[#F47C20]/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-[#F47C20]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm mb-1">{item.title}</h4>
                      <p className="text-slate-600 text-xs leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: "1", title: "Tell Us What You Need", desc: "Pick a service, describe the job, or just snap a photo and let George figure it out." },
                { step: "2", title: "Get Matched", desc: "George finds the best pro for your job based on quality, price, and proximity. No bidding wars." },
                { step: "3", title: "Book Instantly", desc: "One price. Confirm with a tap. Your price is locked and your pro is on the way." },
                { step: "4", title: "Done", desc: "Track your pro in real time. Pay when the job is complete. Leave a review." },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-[#F47C20] text-white font-bold text-xl flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-bold mb-2">{item.title}</h3>
                  <p className="text-slate-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* For Customers AND Pros */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-4">
              Fair for customers. Fair for pros.
            </h2>
            <p className="text-slate-600 text-lg text-center max-w-2xl mx-auto mb-14">
              When pros keep 85% of every job, they do better work. When customers get one locked price, they stop worrying. UpTend makes both sides win.
            </p>
            <div className="grid md:grid-cols-2 gap-10">
              <div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-[#F47C20]" /> For Homeowners
                </h3>
                <div className="space-y-3">
                  {[
                    { icon: Zap, title: "One price, locked at booking", desc: "No haggling. No \"I'll get back to you.\" Your price is confirmed before they arrive." },
                    { icon: ShieldCheck, title: "Background-checked and insured", desc: "Every pro is verified, insured, and rated by real customers. Know who's walking through your door." },
                    { icon: Clock, title: "Live tracking and photo docs", desc: "Follow your pro in real time. Every job documented with photos. Transparent from start to finish." },
                    { icon: DollarSign, title: "Price Protection Guarantee", desc: "The price you're quoted is the most you'll ever pay. Scope changes require your approval with photo evidence." },
                  ].map((item) => (
                    <div key={item.title} className="p-4 flex gap-4 rounded-xl bg-white border border-slate-200">
                      <div className="w-10 h-10 rounded-lg bg-[#F47C20]/10 flex items-center justify-center shrink-0">
                        <item.icon className="w-5 h-5 text-[#F47C20]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm mb-1">{item.title}</h4>
                        <p className="text-slate-600 text-xs leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-[#F47C20]" /> For Pros
                </h3>
                <div className="space-y-3">
                  {[
                    { icon: DollarSign, title: "Keep 85% of every job", desc: "15% platform fee. No lead fees. No bidding wars. No pay-to-play." },
                    { icon: ShieldCheck, title: "Guaranteed payment", desc: "Finish the job, get paid. Payments guaranteed through the platform." },
                    { icon: MapPin, title: "Set your own rates", desc: "You choose your rate within the market range. We match you with customers who value quality." },
                    { icon: Star, title: "You're protected too", desc: "Insurance support, job documentation, guaranteed payments. Built for professionals, not gig workers." },
                  ].map((item) => (
                    <div key={item.title} className="p-4 flex gap-4 rounded-xl bg-white border border-slate-200">
                      <div className="w-10 h-10 rounded-lg bg-[#F47C20]/10 flex items-center justify-center shrink-0">
                        <item.icon className="w-5 h-5 text-[#F47C20]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm mb-1">{item.title}</h4>
                        <p className="text-slate-600 text-xs leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-black mb-4">11 Services. One Platform.</h2>
            <p className="text-slate-600 mb-10">Serving the entire Orlando metro: Lake Nona, Winter Park, Dr. Phillips, Windermere, Celebration, and more.</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                "Junk Removal", "Pressure Washing", "Gutter Cleaning", "Home Cleaning",
                "Handyman", "Landscaping", "Moving Labor", "Light Demolition",
                "Garage Cleanout", "Pool Cleaning", "Carpet Cleaning"
              ].map((svc) => (
                <span key={svc} className="px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-sm text-slate-700 font-medium">
                  {svc}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Founding 100 Signup */}
        <div id="join">
          <Founding100 />
        </div>

      </main>
      <Footer />
    </div>
  );
}
