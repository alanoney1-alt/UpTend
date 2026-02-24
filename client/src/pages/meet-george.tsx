import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { usePageTitle } from "@/hooks/use-page-title";
import { Zap, DollarSign, Video, Camera, CalendarCheck, Brain, ShieldCheck, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

const capabilities = [
  {
    icon: DollarSign,
    title: "Instant Quotes",
    desc: "Get a price in seconds, not days. AI-powered quotes based on your home and location.",
  },
  {
    icon: Video,
    title: "DIY Guidance",
    desc: "Step-by-step video tutorials from trusted creators. George finds the right one for your exact problem.",
  },
  {
    icon: Camera,
    title: "Photo Diagnosis",
    desc: "Snap a photo, George tells you what's wrong. AI vision identifies the issue and gives you a fix plan.",
  },
  {
    icon: CalendarCheck,
    title: "Smart Booking",
    desc: "George finds the right pro and handles scheduling. Background-checked, insured, and available now.",
  },
  {
    icon: Brain,
    title: "Home DNA Expert",
    desc: "George knows your home inside and out. Every appliance, every system, every maintenance event tracked.",
  },
  {
    icon: ShieldCheck,
    title: "Cost Protection",
    desc: "Price ceiling guarantee on every job. The price George quotes is the most you'll ever pay. Period.",
  },
];

function openChatWidget() {
  // Trigger the George guide open event
  const event = new CustomEvent("george:open");
  window.dispatchEvent(event);
  // Fallback: click the chat bubble if it exists
  const bubble = document.querySelector("[data-chat-bubble]") as HTMLElement;
  if (bubble) bubble.click();
}

export default function MeetGeorgePage() {
  usePageTitle("Meet Mr. George | UpTend");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      <Header />
      <main className="pt-28 pb-20">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-4 text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-[#F47C20]/20 text-[#F47C20] rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Bot className="w-4 h-4" />
            AI-Powered Home Assistant
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            Your Home Expert.<br />
            <span className="text-[#F47C20]">Available 24/7.</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Mr. George diagnoses problems, finds solutions, quotes prices, and books pros --
            all from one conversation. No apps to download. No calls to make.
          </p>
          <Button
            size="lg"
            className="bg-[#F47C20] hover:bg-[#e06910] text-white font-bold text-lg px-10 py-6 rounded-xl"
            onClick={openChatWidget}
          >
            <Zap className="w-5 h-5 mr-2" /> Try George Now
          </Button>
        </section>

        {/* What Can George Do */}
        <section className="max-w-5xl mx-auto px-4 mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">What can George do?</h2>
          <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">
            Six capabilities that replace a dozen phone calls.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((cap) => (
              <div
                key={cap.title}
                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-[#F47C20]/20 flex items-center justify-center mb-4">
                  <cap.icon className="w-6 h-6 text-[#F47C20]" />
                </div>
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
            <p className="text-slate-300 mb-6">Available 24/7 on every page. Just click the orange bubble or tap below.</p>
            <Button
              size="lg"
              className="bg-[#F47C20] hover:bg-[#e06910] text-white font-bold text-lg px-8 py-6 rounded-xl"
              onClick={openChatWidget}
            >
              Try George Now
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
