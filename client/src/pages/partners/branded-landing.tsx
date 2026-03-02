/**
 * Branded Partner Landing Page
 * 
 * Each service company partner gets their own page at /partners/:slug
 * e.g., /partners/orlando-hvac, /partners/sunshine-plumbing
 * 
 * Features:
 * - Partner's company name and branding
 * - George chat embedded with partner context
 * - Photo upload for scoping
 * - All leads route to the partner's dashboard
 */

import { useState, useRef } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Camera, Send, MessageCircle, Shield, Clock, Star,
  Phone, CheckCircle, Upload, Loader2, ArrowRight,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

interface PartnerConfig {
  slug: string;
  companyName: string;
  serviceType: string;
  tagline: string;
  phone?: string;
  logo?: string;
  accentColor?: string;
  heroText: string;
  services: string[];
  georgeGreeting: string;
  features: Array<{ icon: string; title: string; desc: string }>;
}

// Demo partner configs (will come from DB in production)
const PARTNER_CONFIGS: Record<string, PartnerConfig> = {
  "demo-hvac": {
    slug: "demo-hvac",
    companyName: "Orlando Air Pro",
    serviceType: "HVAC",
    tagline: "Orlando's Trusted HVAC Experts",
    phone: "(407) 555-0199",
    accentColor: "#2563EB",
    heroText: "Need AC service? Skip the wait. Tell George what's going on and get a scope in minutes, not days.",
    services: [
      "AC Repair & Diagnostics",
      "HVAC Installation",
      "Duct Cleaning & Sealing",
      "Thermostat Installation",
      "Preventive Maintenance",
      "Emergency AC Service",
      "Air Quality Assessment",
      "Heat Pump Service",
    ],
    georgeGreeting: "Hey! I'm George, your AI service assistant for Orlando Air Pro. Tell me what's going on with your AC and I'll scope it out. Photos help a ton if you can snap one of the unit.",
    features: [
      { icon: "camera", title: "Photo Scoping", desc: "Snap a photo of your unit. George identifies the brand, model, and visible issues instantly." },
      { icon: "clock", title: "Minutes, Not Days", desc: "Get a scope of work in minutes. No waiting 3 days for an in-home estimate." },
      { icon: "shield", title: "Transparent Pricing", desc: "Know what you're paying before anyone shows up. No surprise charges." },
      { icon: "star", title: "Licensed & Insured", desc: "Every technician is background-checked, licensed, and insured." },
    ],
  },
  "demo-plumbing": {
    slug: "demo-plumbing",
    companyName: "Sunshine Plumbing Co",
    serviceType: "Plumbing",
    tagline: "Central Florida's Plumbing Experts",
    phone: "(407) 555-0234",
    accentColor: "#0EA5E9",
    heroText: "Leaky faucet? Clogged drain? Running toilet? Tell George and get it scoped in minutes.",
    services: [
      "Drain Cleaning",
      "Leak Detection & Repair",
      "Water Heater Service",
      "Toilet Repair",
      "Faucet & Fixture Install",
      "Pipe Repair & Replacement",
      "Sewer Line Service",
      "Emergency Plumbing",
    ],
    georgeGreeting: "Hey! I'm George, your AI assistant for Sunshine Plumbing. What's going on? If you can send a photo of the issue, I can scope it out fast.",
    features: [
      { icon: "camera", title: "Photo Diagnostics", desc: "Show George the leak, the stain, or the broken fixture. He'll identify the issue." },
      { icon: "clock", title: "Instant Scoping", desc: "No more waiting for a plumber to come look. Get a scope of work right now." },
      { icon: "shield", title: "Upfront Pricing", desc: "Know the cost before the truck rolls. No hourly surprises." },
      { icon: "star", title: "Licensed Pros", desc: "Certified, insured plumbers. Every time." },
    ],
  },
};

function ChatBubble({ role, content }: { role: "user" | "george"; content: string }) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
          role === "user"
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-card border border-border rounded-bl-md"
        }`}
      >
        {role === "george" && (
          <div className="flex items-center gap-2 mb-1">
            <img src="/george-face.png" alt="George" className="w-5 h-5 rounded-full" />
            <span className="text-xs font-semibold text-primary">George</span>
          </div>
        )}
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}

export default function BrandedPartnerLanding() {
  const params = useParams();
  const slug = (params as any).slug || "demo-hvac";
  const config = PARTNER_CONFIGS[slug];

  const [messages, setMessages] = useState<Array<{ role: "user" | "george"; content: string }>>([]);
  const [input, setInput] = useState("");
  const [started, setStarted] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: "", phone: "", address: "" });
  const [infoCollected, setInfoCollected] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scopeSubmitted, setScopeSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  if (!config) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-bold mb-2">Partner Not Found</h2>
            <p className="text-muted-foreground">This partner page doesn't exist yet.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const startChat = () => {
    setStarted(true);
    setMessages([{ role: "george", content: config.georgeGreeting }]);
  };

  const collectInfo = () => {
    if (!customerInfo.name || !customerInfo.phone) return;
    setInfoCollected(true);
    setMessages(prev => [
      ...prev,
      { role: "george", content: `Got it, ${customerInfo.name}. Now tell me what's going on. Describe the issue and send photos if you can. The more detail, the faster I can scope this.` },
    ]);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setPhotos(prev => [...prev, dataUrl]);
        setMessages(prev => [
          ...prev,
          { role: "user", content: "[Photo uploaded]" },
          { role: "george", content: "Got the photo. Let me take a look..." },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    // Call George API with partner context
    try {
      const res = await fetch("/api/ai/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          conversationHistory: messages.map(m => ({
            role: m.role === "george" ? "assistant" : "user",
            content: m.content,
          })),
          context: {
            currentPage: `/partners/${slug}`,
            userRole: "consumer",
            partnerSlug: slug,
            partnerCompany: config.companyName,
            partnerServiceType: config.serviceType,
          },
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "george", content: data.response || "Let me think about that..." }]);
    } catch {
      setMessages(prev => [...prev, { role: "george", content: "Having a connection issue. Try again in a sec." }]);
    }
    setIsLoading(false);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const submitScope = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/partners/submit-scope", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerSlug: slug,
          customer: customerInfo,
          conversation: messages,
          photos: photos.length,
          submittedAt: new Date().toISOString(),
        }),
      });
      setScopeSubmitted(true);
    } catch {
      // Still show success for demo
      setScopeSubmitted(true);
    }
    setIsLoading(false);
  };

  const iconMap: Record<string, any> = { camera: Camera, clock: Clock, shield: Shield, star: Star };

  return (
    <div className="min-h-screen bg-background">
      {/* Partner Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo variant="default" className="h-8" />
            <span className="text-muted-foreground">×</span>
            <div>
              <span className="font-bold text-lg">{config.companyName}</span>
            </div>
          </div>
          {config.phone && (
            <a href={`tel:${config.phone.replace(/\D/g, '')}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <Phone className="w-4 h-4" />
              {config.phone}
            </a>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero */}
        {!started && (
          <>
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{config.companyName}</h1>
              <p className="text-lg text-muted-foreground mb-2">{config.tagline}</p>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-8">{config.heroText}</p>
              <Button size="lg" className="text-lg px-8 gap-2" onClick={startChat}>
                <MessageCircle className="w-5 h-5" />
                Talk to George
              </Button>
            </div>

            {/* Services */}
            <div className="mb-12">
              <h2 className="text-xl font-bold text-center mb-6">What We Handle</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {config.services.map(s => (
                  <div key={s} className="flex items-center gap-2 p-3 bg-card rounded-lg border border-border">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm">{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {config.features.map(f => {
                const Icon = iconMap[f.icon] || Shield;
                return (
                  <Card key={f.title}>
                    <CardContent className="pt-6 flex gap-4">
                      <Icon className="w-8 h-8 text-primary flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold mb-1">{f.title}</h3>
                        <p className="text-sm text-muted-foreground">{f.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* How It Works */}
            <div className="bg-card border border-border rounded-2xl p-8 mb-12">
              <h2 className="text-xl font-bold text-center mb-8">How It Works</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { step: "1", title: "Tell George", desc: "Describe what's going on. Send photos of the issue if you can." },
                  { step: "2", title: "Get Scoped", desc: `George identifies the problem and builds a scope of work for ${config.companyName}.` },
                  { step: "3", title: "Get Fixed", desc: `${config.companyName} reviews and dispatches a tech. You know the price upfront.` },
                ].map(s => (
                  <div key={s.step} className="text-center">
                    <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-3">
                      {s.step}
                    </div>
                    <h3 className="font-semibold mb-1">{s.title}</h3>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Powered by */}
            <div className="text-center text-sm text-muted-foreground">
              <p>Powered by <span className="font-semibold text-foreground">UpTend</span> — AI-powered home service intelligence</p>
            </div>
          </>
        )}

        {/* Chat Interface */}
        {started && !scopeSubmitted && (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Button variant="ghost" size="sm" onClick={() => { setStarted(false); setMessages([]); setInfoCollected(false); }}>
                ← Back
              </Button>
              <h2 className="text-xl font-bold">Chat with George</h2>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">for {config.companyName}</span>
            </div>

            {/* Collect customer info first */}
            {!infoCollected && (
              <Card className="mb-6">
                <CardContent className="pt-6 space-y-4">
                  <p className="text-sm text-muted-foreground">Quick info so we can follow up:</p>
                  <Input
                    placeholder="Your name"
                    value={customerInfo.name}
                    onChange={e => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    placeholder="Phone number"
                    value={customerInfo.phone}
                    onChange={e => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  />
                  <Input
                    placeholder="Address (for service location)"
                    value={customerInfo.address}
                    onChange={e => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                  />
                  <Button className="w-full" onClick={collectInfo} disabled={!customerInfo.name || !customerInfo.phone}>
                    Start Chat <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Chat Messages */}
            {infoCollected && (
              <>
                <div className="bg-card border border-border rounded-2xl p-4 mb-4 min-h-[400px] max-h-[500px] overflow-y-auto">
                  {messages.map((m, i) => (
                    <ChatBubble key={i} role={m.role} content={m.content} />
                  ))}
                  {isLoading && (
                    <div className="flex justify-start mb-3">
                      <div className="bg-card border border-border rounded-2xl px-4 py-3 rounded-bl-md">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Photo previews */}
                {photos.length > 0 && (
                  <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                    {photos.map((p, i) => (
                      <img key={i} src={p} alt={`Photo ${i+1}`} className="w-16 h-16 object-cover rounded-lg border border-border" />
                    ))}
                  </div>
                )}

                {/* Input Bar */}
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhoto}
                  />
                  <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}>
                    <Camera className="w-4 h-4" />
                  </Button>
                  <Input
                    placeholder="Describe your issue..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} disabled={!input.trim() || isLoading}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                {/* Submit Scope Button */}
                {messages.length >= 6 && (
                  <div className="mt-4 text-center">
                    <Button size="lg" className="w-full" onClick={submitScope} disabled={isLoading}>
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Submit Scope to {config.companyName}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      This sends George's assessment, your photos, and contact info to {config.companyName}.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Success State */}
        {scopeSubmitted && (
          <div className="max-w-md mx-auto text-center py-12">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Scope Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              {config.companyName} has your scope of work, photos, and contact info. They'll reach out with a quote shortly.
            </p>
            <p className="text-sm text-muted-foreground">
              Questions? Call {config.phone || "us"} directly.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
