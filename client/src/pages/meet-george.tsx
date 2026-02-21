import { useState, useEffect, useRef } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { Header } from "@/components/landing/header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Send, MessageCircle, Video, ShoppingCart, Camera, Calculator, Phone,
  MapPin, Shield, Wrench, Brain, Star, Zap, Mail
} from "lucide-react";

const CHAT_BUBBLES = [
  "I know every home service trick in the book.",
  "I've watched thousands of repair videos so you don't have to.",
  "I can quote you a price, find you a pro, or walk you through fixing it yourself.",
  "Try me. Ask me anything about your home.",
];

const capabilities = [
  { icon: MessageCircle, label: "Home Expert" },
  { icon: Video, label: "Video Tutorials" },
  { icon: ShoppingCart, label: "Product Picks" },
  { icon: Calculator, label: "Instant Quotes" },
  { icon: Camera, label: "Photo Diagnosis" },
  { icon: Brain, label: "Room Scanner" },
  { icon: MapPin, label: "Pro Tracking" },
  { icon: Shield, label: "Price Guarantee" },
  { icon: Phone, label: "Voice & Text" },
  { icon: Mail, label: "Email Reports" },
  { icon: Wrench, label: "Pro Matching" },
  { icon: Star, label: "Home Record" },
];

export default function MeetGeorgePage() {
  usePageTitle("Meet Mr. George | UpTend");

  const [visibleBubbles, setVisibleBubbles] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "george"; text: string }[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Animate bubbles appearing one by one
  useEffect(() => {
    if (visibleBubbles < CHAT_BUBBLES.length) {
      const timer = setTimeout(() => setVisibleBubbles(v => v + 1), 800);
      return () => clearTimeout(timer);
    }
  }, [visibleBubbles]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleChat = () => {
    if (!chatInput.trim()) return;
    const q = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", text: q }]);
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        role: "george",
        text: "Great question! I'd love to help with that. For the full experience, head to the home page and use the orange chat bubble — I can pull up videos, quotes, and pros right there. 🏠"
      }]);
    }, 600);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFFBF5" }}>
      <Header />

      <main className="pt-28 pb-20">
        {/* Hero — George avatar with glow */}
        <section className="max-w-2xl mx-auto px-4 text-center mb-12">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 rounded-full bg-amber-400/30 animate-pulse scale-110" />
            <div className="relative w-28 h-28 rounded-full bg-amber-500 flex items-center justify-center shadow-xl shadow-amber-200">
              <span className="text-white text-5xl font-bold">G</span>
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-stone-800 mb-3">
            I'm George. Your home's best friend.
          </h1>
          <p className="text-stone-500 text-base md:text-lg max-w-lg mx-auto">
            AI-powered, always available, and here to save you time and money on everything home.
          </p>
        </section>

        {/* Chat bubbles — George tells his story */}
        <section className="max-w-xl mx-auto px-4 mb-10">
          <div className="space-y-3">
            {CHAT_BUBBLES.slice(0, visibleBubbles).map((text, i) => (
              <div key={i} className="flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                {i === 0 ? (
                  <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">G</span>
                  </div>
                ) : (
                  <div className="w-8 flex-shrink-0" />
                )}
                <div className="bg-white border border-amber-100 rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm">
                  <p className="text-sm text-stone-700 leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Live chat input */}
        <section className="max-w-xl mx-auto px-4 mb-16">
          <div className="border border-amber-200 rounded-2xl bg-white p-4 shadow-sm">
            {chatMessages.length > 0 && (
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm ${
                      msg.role === "user"
                        ? "bg-amber-500 text-white rounded-br-md"
                        : "bg-amber-50 text-stone-700 rounded-bl-md"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChat()}
                placeholder="Ask me anything about your home..."
                className="border-amber-200 focus-visible:ring-amber-300 rounded-xl"
              />
              <Button onClick={handleChat} size="icon" className="bg-amber-500 hover:bg-amber-600 rounded-xl shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Capabilities grid */}
        <section className="max-w-3xl mx-auto px-4">
          <h2 className="text-xl font-bold text-stone-800 text-center mb-6">What I can do</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {capabilities.map((cap) => (
              <div key={cap.label} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white border border-amber-100 hover:border-amber-300 transition-colors">
                <cap.icon className="w-6 h-6 text-amber-500" />
                <span className="text-xs font-medium text-stone-600 text-center leading-tight">{cap.label}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
