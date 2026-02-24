import { Header } from "@/components/landing/header";
import { usePageTitle } from "@/hooks/use-page-title";
import { Bot, Video, ShoppingCart, Camera, Calculator, Phone, Mail, MapPin, Shield, Wrench, Brain, MessageCircle, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const capabilities = [
  { icon: MessageCircle, title: "AI Home Expert", desc: "Ask anything about home repair, maintenance, or improvement. George knows 63+ DIY repairs inside out." },
  { icon: Video, title: "Video Tutorials", desc: "George searches YouTube and plays repair videos right in the chat — no leaving the app." },
  { icon: ShoppingCart, title: "Product Recommendations", desc: "Need parts? George finds exact products with real prices from Amazon, Home Depot, and Lowe's." },
  { icon: Calculator, title: "Instant Quotes", desc: "Get real pricing for any service in seconds. AI-powered quotes based on your home and location." },
  { icon: Camera, title: "Photo Diagnosis", desc: "Snap a photo of what's broken. George uses AI vision to diagnose the problem and give you a fix plan + price." },
  { icon: Brain, title: "Room Scanner", desc: "Walk through your home room by room. George inventories every appliance — brand, model, age, condition." },
  { icon: MapPin, title: "Real-Time Tracking", desc: "Know exactly when your Pro is arriving, working, and done. Live GPS tracking like Uber for your home." },
  { icon: Shield, title: "Price Ceiling Guarantee", desc: "The price George quotes is the most you'll ever pay. Period. No surprises, no hidden fees." },
  { icon: Phone, title: "Voice & Text", desc: "Talk to George by voice or text. He speaks English and Spanish and adapts to your communication style." },
  { icon: Mail, title: "Email Summaries", desc: "George sends you quote breakdowns, booking confirmations, and home health reports by email." },
  { icon: Wrench, title: "Pro Matching", desc: "When DIY isn't the move, George matches you with a background-checked, insured Pro in minutes." },
  { icon: Star, title: "Home Health Record", desc: "George builds a living record of your home — every appliance, service, and maintenance event tracked." },
];

export default function MeetGeorgePage() {
  usePageTitle("Meet Mr. George | UpTend");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      <Header />
      <main className="pt-28 pb-20">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-4 text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#F47C20]/20 text-[#F47C20] rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Bot className="w-4 h-4" />
            AI-Powered Home Assistant
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            Meet <span className="text-[#F47C20]">Mr. George</span> 
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            Your AI home expert who knows everything about home repair, finds the best Pros, 
            and saves you money — all from one conversation.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/book" asChild>
              <Button size="lg" className="bg-[#F47C20] hover:bg-[#e06910] text-white font-bold text-lg px-8 py-6 rounded-xl">
                <Zap className="w-5 h-5 mr-2" /> Try George Now
              </Button>
            </Link>
          </div>
        </section>

        {/* Capabilities Grid */}
        <section className="max-w-6xl mx-auto px-4 mb-20">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4">What George Can Do</h2>
          <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">
            140 tools. 13 AI capabilities. One conversation.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {capabilities.map((cap) => (
              <div key={cap.title} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors">
                <cap.icon className="w-8 h-8 text-[#F47C20] mb-3" />
                <h3 className="font-bold text-lg mb-2">{cap.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{cap.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="max-w-4xl mx-auto px-4 mb-20 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-10">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="w-12 h-12 rounded-full bg-[#F47C20] text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-bold text-lg mb-2">Tell George What's Going On</h3>
              <p className="text-sm text-slate-400">Describe your problem, send a photo, or just ask a question. George understands it all.</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-[#F47C20] text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-bold text-lg mb-2">Get Your Answer Instantly</h3>
              <p className="text-sm text-slate-400">DIY walkthrough with video? Product recommendation? Instant quote? George handles it in seconds.</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-[#F47C20] text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-bold text-lg mb-2">Book a Pro or Fix It Yourself</h3>
              <p className="text-sm text-slate-400">Your choice. George books a verified Pro in minutes, or coaches you through the repair step by step.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-r from-[#F47C20]/20 to-orange-500/20 border border-[#F47C20]/30 rounded-2xl p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Meet George?</h2>
            <p className="text-slate-300 mb-6">He's available 24/7 on every page. Just click the orange bubble in the corner.</p>
            <Link href="/" asChild>
              <Button size="lg" className="bg-[#F47C20] hover:bg-[#e06910] text-white font-bold text-lg px-8 py-6 rounded-xl">
                Get Started
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
