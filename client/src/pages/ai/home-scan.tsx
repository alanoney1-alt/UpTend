import { usePageTitle } from "@/hooks/use-page-title";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { useTranslation } from "react-i18next";
import {
  Shield, DollarSign, TrendingUp, Clock, AlertTriangle,
  Home, CreditCard, Camera, Cpu, CheckCircle, ArrowRight,
  Lock, Smartphone, Star, Zap, ChevronRight, Award,
  Flame, Eye, Thermometer, Plane,
} from "lucide-react";

function openGeorgeWithScan() {
  // Dispatch custom event to open George and send scan message
  window.dispatchEvent(new CustomEvent("george:open", { detail: { message: "I want to scan my home" } }));
}

export default function HomeScanPage() {
  usePageTitle("Home DNA Scan — Free Home Health Record | UpTend");
  const { t, i18n } = useTranslation();
  const isEs = i18n.language === "es";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection isEs={isEs} />
        <WhatIsItSection isEs={isEs} />
        <WhyDoItSection isEs={isEs} />
        <HowItWorksSection isEs={isEs} />
        <GamificationSection isEs={isEs} />
        <TierComparison isEs={isEs} />
        <DisclaimerBanner isEs={isEs} />
        <TrustSection isEs={isEs} />
        <FinalCTASection isEs={isEs} />
      </main>
      <Footer />
    </div>
  );
}

/* ─── HERO ─── */
function HeroSection({ isEs }: { isEs: boolean }) {
  return (
    <section className="relative pt-28 md:pt-36 pb-20 overflow-hidden bg-slate-900 dark:bg-slate-950">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#3B1D5A]/50 to-slate-900" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#3B1D5A]/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#F47C20]/15 rounded-full blur-[120px]" />

      <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
        <Badge className="mb-6 bg-[#F47C20]/20 text-[#F47C20] border-[#F47C20]/30 text-sm px-4 py-1.5">
          ✨ {isEs ? "100% Gratis — Gana Créditos" : "100% Free — Earn Credits"}
        </Badge>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 tracking-tight leading-[1.1]">
          {isEs ? "Conoce Tu Hogar." : "Know Your Home."}<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F47C20] to-orange-300">
            {isEs ? "Protege Tu Inversión." : "Protect Your Investment."}
          </span>
        </h1>

        <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          {isEs
            ? "Escanea tu hogar en 15 minutos. Obtén un registro completo de salud — y gana $25+ en créditos."
            : "Scan your home in 15 minutes. Get a complete health record — and earn $25+ in credits."}
        </p>

        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 mb-6">
          <Button
            size="lg"
            className="bg-[#F47C20] hover:bg-[#e06910] text-white font-bold text-lg px-8 py-6 rounded-xl shadow-lg shadow-[#F47C20]/25 w-full sm:w-auto"
            onClick={openGeorgeWithScan}
          >
            {isEs ? "Iniciar Mi Escaneo Gratis" : "Start My Free Scan"} <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Link href="/book?service=home_consultation">
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 font-bold text-base px-6 py-6 rounded-xl w-full sm:w-auto">
              {isEs ? "Escaneo Pro ($99)" : "Pro Scan ($99)"}
            </Button>
          </Link>
          <Link href="/book?service=aerial_scan">
            <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 font-bold text-base px-6 py-6 rounded-xl w-full sm:w-auto">
              {isEs ? "Escaneo Aéreo con Dron ($249)" : "Aerial Drone Scan ($249)"}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── WHAT IS IT ─── */
function WhatIsItSection({ isEs }: { isEs: boolean }) {
  const features = [
    {
      icon: Camera,
      title: isEs ? "Cada Aparato Documentado" : "Every Appliance Documented",
      desc: isEs
        ? "Fotos + análisis de IA para cada sistema en tu hogar"
        : "Photos + AI analysis for every system in your home",
    },
    {
      icon: Cpu,
      title: isEs ? "IA GPT-5.2 Vision" : "GPT-5.2 AI Vision",
      desc: isEs
        ? "Lee marcas, modelos, números de serie, estima edad y condición"
        : "Reads brands, models, serial numbers, estimates age and condition",
    },
    {
      icon: Clock,
      title: isEs ? "Seguimiento de Garantías" : "Warranty Tracking",
      desc: isEs
        ? "Mr. George te alerta antes de que expiren tus garantías"
        : "Mr. George alerts you before warranties expire",
    },
    {
      icon: Zap,
      title: isEs ? "Cronograma de Mantenimiento" : "Maintenance Timeline",
      desc: isEs
        ? "Sabe exactamente cuándo las cosas necesitan atención"
        : "Know exactly when things need attention",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            {isEs ? "Tu Registro de Salud del Hogar" : "Your Home Health Record"}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {isEs
              ? "Cada aparato, cada sistema, documentado con fotos y análisis de IA."
              : "Every appliance, every system, documented with photos and AI analysis."}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <Card key={f.title} className="border-border hover:border-[#F47C20]/50 transition-all hover:shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-[#F47C20]/10 flex items-center justify-center mx-auto mb-4">
                  <f.icon className="w-6 h-6 text-[#F47C20]" />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Phone mockup */}
        <div className="mt-14 flex justify-center">
          <div className="relative w-64 h-[500px] bg-slate-900 rounded-[2.5rem] border-4 border-slate-700 shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-900 rounded-b-2xl" />
            <div className="mt-10 px-4 space-y-3">
              <div className="bg-[#F47C20]/20 rounded-xl p-3 text-xs text-white">
                <p className="font-bold text-[#F47C20] mb-1">🏠 {isEs ? "Escaneando: Cocina" : "Scanning: Kitchen"}</p>
                <p className="text-slate-300">{isEs ? "Apunta tu cámara al refrigerador..." : "Point your camera at the fridge..."}</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-3 text-xs text-slate-300">
                <p className="font-bold text-white mb-1">✅ Samsung RF28R7351SR</p>
                <p>{isEs ? "Refrigerador French Door • ~3 años" : "French Door Refrigerator • ~3 years old"}</p>
                <p className="text-green-400 mt-1">{isEs ? "Condición: Excelente" : "Condition: Excellent"}</p>
              </div>
              <div className="bg-slate-800 rounded-xl p-3 text-xs text-slate-300">
                <p className="font-bold text-white mb-1">✅ KitchenAid KDTE334GPS</p>
                <p>{isEs ? "Lavavajillas • ~5 años" : "Dishwasher • ~5 years old"}</p>
                <p className="text-yellow-400 mt-1">{isEs ? "Condición: Buena" : "Condition: Good"}</p>
              </div>
              <div className="bg-[#F47C20] rounded-xl p-3 text-xs text-white text-center font-bold">
                +$3 {isEs ? "créditos ganados" : "credits earned"} 🎉
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Progress value={42} className="flex-1 h-2" />
                <span className="text-[10px] text-slate-400">42%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── WHY DO IT (THE SELL) ─── */
function WhyDoItSection({ isEs }: { isEs: boolean }) {
  const reasons = [
    {
      emoji: "🛡️",
      icon: Shield,
      title: isEs ? "Protección de Seguro" : "Insurance Protection",
      desc: isEs
        ? "Cuando ocurra un desastre, tendrás evidencia fotográfica con fecha y hora de cada aparato ANTES del daño. Las aseguradoras procesan reclamos documentados 3x más rápido."
        : "When disaster strikes, you'll have timestamped photo evidence of every appliance BEFORE the damage. Insurance companies process documented claims 3x faster.",
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      emoji: "💰",
      icon: DollarSign,
      title: isEs ? "Ahorra $3,000-5,000/Año" : "Save $3,000-5,000/Year",
      desc: isEs
        ? "Detecta problemas antes de que se conviertan en emergencias. Un cambio de filtro de $50 previene un reemplazo de HVAC de $5,000."
        : "Catch problems before they become emergencies. A $50 filter change prevents a $5,000 HVAC replacement.",
      color: "bg-green-500/10 text-green-500",
    },
    {
      emoji: "📈",
      icon: TrendingUp,
      title: isEs ? "Aumenta el Valor de Reventa" : "Boost Resale Value",
      desc: isEs
        ? "Los hogares completamente documentados se venden 3-5% más alto. Los compradores confían en lo que pueden verificar."
        : "Fully documented homes sell 3-5% higher. Buyers trust what they can verify.",
      color: "bg-purple-500/10 text-purple-500",
    },
    {
      emoji: "⏰",
      icon: Clock,
      title: isEs ? "Nunca Pierdas una Garantía" : "Never Miss a Warranty",
      desc: isEs
        ? "Mr. George rastrea cada garantía y te alerta antes de que expiren. No más perder cientos porque te pasó una fecha límite."
        : "Mr. George tracks every warranty and alerts you before they expire. No more losing hundreds because you missed a deadline.",
      color: "bg-orange-500/10 text-orange-500",
    },
    {
      emoji: "🚨",
      icon: AlertTriangle,
      title: isEs ? "Listo para Emergencias" : "Emergency Ready",
      desc: isEs
        ? "Si una tubería se rompe a las 2AM, Mr. George ya conoce tu sistema de plomería, las ubicaciones de cierre y qué profesional llamar."
        : "If a pipe bursts at 2AM, Mr. George already knows your plumbing system, your shutoff locations, and which pro to call.",
      color: "bg-red-500/10 text-red-500",
    },
    {
      emoji: "🏠",
      icon: Home,
      title: isEs ? "Mantenimiento Inteligente" : "Smart Maintenance",
      desc: isEs
        ? "Mr. George aprende tu hogar y te dice exactamente cuándo cambiar el filtro del HVAC, cuándo tu calentador de agua se acerca al fin de su vida útil."
        : "Mr. George learns your home and tells you exactly when your HVAC filter needs changing, when your water heater is approaching end-of-life.",
      color: "bg-cyan-500/10 text-cyan-500",
    },
    {
      emoji: "💵",
      icon: CreditCard,
      title: isEs ? "Es GRATIS + Ganas Créditos" : "It's FREE + You Earn Credits",
      desc: isEs
        ? "La mayoría de los propietarios ganan $40-50 en créditos para su primer servicio."
        : "Most homeowners earn $40-50 in credits toward their first service.",
      color: "bg-[#F47C20]/10 text-[#F47C20]",
    },
  ];

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900/50 border-t border-border">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            {isEs ? "¿Por Qué Escanear Tu Hogar?" : "Why Scan Your Home?"}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {isEs
              ? "7 razones por las que los propietarios inteligentes escanean primero."
              : "7 reasons smart homeowners scan first."}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((r) => (
            <Card key={r.title} className="border-border hover:border-[#F47C20]/40 transition-all hover:shadow-lg group">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${r.color} flex items-center justify-center shrink-0`}>
                    <r.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-2">{r.emoji} {r.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── HOW IT WORKS ─── */
function HowItWorksSection({ isEs }: { isEs: boolean }) {
  const steps = [
    {
      num: "1",
      icon: Smartphone,
      title: isEs ? "Abre Mr. George y di 'Escanea mi hogar'" : "Open Mr. George & say 'Scan my home'",
      desc: isEs ? "Mr. George te guía habitación por habitación" : "Mr. George guides you room by room",
    },
    {
      num: "2",
      icon: Camera,
      title: isEs ? "Toma fotos de aparatos y sistemas" : "Snap photos of appliances & systems",
      desc: isEs ? "La IA GPT-5.2 lee todo: marca, modelo, serie, condición" : "GPT-5.2 AI reads everything: brand, model, serial, condition",
    },
    {
      num: "3",
      icon: Star,
      title: isEs ? "Obtén tu Registro de Salud del Hogar" : "Get your Home Health Record",
      desc: isEs ? "Perfil completo + $25 bono + $1 por artículo escaneado" : "Complete profile + $25 bonus + $1 per item scanned",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-background">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            {isEs ? "Cómo Funciona" : "How It Works"}
          </h2>
          <p className="text-muted-foreground text-lg">
            {isEs ? "3 pasos simples. 15 minutos. Gana créditos reales." : "3 simple steps. 15 minutes. Earn real credits."}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.num} className="text-center group">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#F47C20] to-orange-600 flex items-center justify-center mx-auto shadow-lg shadow-[#F47C20]/20 group-hover:scale-110 transition-transform">
                  <s.icon className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-800 border-2 border-[#F47C20] flex items-center justify-center text-sm font-black text-[#F47C20] mx-auto md:left-1/2 md:translate-x-6">
                  {s.num}
                </div>
              </div>
              <h3 className="font-bold text-lg mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button
            size="lg"
            className="bg-[#F47C20] hover:bg-[#e06910] text-white font-bold text-lg px-10 py-6 rounded-xl shadow-lg shadow-[#F47C20]/25 w-full sm:w-auto"
            onClick={openGeorgeWithScan}
          >
            {isEs ? "Iniciar Mi Escaneo Gratis" : "Start My Free Scan"} <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ─── GAMIFICATION ─── */
function GamificationSection({ isEs }: { isEs: boolean }) {
  const rooms = [
    { name: isEs ? "Cocina" : "Kitchen", done: true },
    { name: isEs ? "Garaje" : "Garage", done: true },
    { name: "HVAC", done: false },
    { name: isEs ? "Baño" : "Bathroom", done: false },
    { name: isEs ? "Lavandería" : "Laundry", done: false },
    { name: isEs ? "Exterior" : "Exterior", done: false },
  ];

  const tiers = [
    { name: isEs ? "Hogar Bronce" : "Bronze Home", pct: "25%", active: false },
    { name: isEs ? "Hogar Plata" : "Silver Home", pct: "50%", active: false },
    { name: isEs ? "Hogar Oro" : "Gold Home", pct: "75%", active: false },
    { name: "Smart Home Ready", pct: "100%", active: false },
  ];

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900/50 border-t border-border">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            {isEs ? "Haz Que Sea un Juego" : "Make It a Game"} 🎮
          </h2>
          <p className="text-muted-foreground text-lg">
            {isEs ? "Rastrea tu progreso. Desbloquea insignias. Gana más." : "Track your progress. Unlock badges. Earn more."}
          </p>
        </div>

        {/* Progress mockup */}
        <Card className="max-w-lg mx-auto mb-10 border-[#F47C20]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold">{isEs ? "Tu hogar está 64% escaneado" : "Your home is 64% scanned"}</span>
              <Badge className="bg-[#F47C20]/20 text-[#F47C20] border-[#F47C20]/30">64%</Badge>
            </div>
            <Progress value={64} className="h-3 mb-4" />
            <div className="flex flex-wrap gap-2">
              {rooms.map((r) => (
                <Badge
                  key={r.name}
                  variant={r.done ? "default" : "outline"}
                  className={r.done ? "bg-green-600 text-white" : "text-muted-foreground"}
                >
                  {r.done ? "✅" : "⏳"} {r.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tier badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {tiers.map((tier, i) => (
            <div key={tier.name} className="text-center p-4 rounded-xl bg-background border border-border">
              <Award className={`w-10 h-10 mx-auto mb-2 ${i === 0 ? "text-amber-700" : i === 1 ? "text-slate-400" : i === 2 ? "text-yellow-500" : "text-[#F47C20]"}`} />
              <p className="font-bold text-sm">{tier.name}</p>
              <p className="text-xs text-muted-foreground">{tier.pct}</p>
            </div>
          ))}
        </div>

        {/* Streak bonus */}
        <div className="text-center">
          <Card className="inline-block border-[#F47C20]/30">
            <CardContent className="p-4 flex items-center gap-3">
              <Flame className="w-6 h-6 text-[#F47C20]" />
              <span className="font-bold text-sm">
                {isEs ? "Escanea 3 días seguidos → $5 extra" : "Scan 3 days in a row → extra $5"}
              </span>
              <Flame className="w-6 h-6 text-[#F47C20]" />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

/* ─── TIER COMPARISON ─── */
function TierComparison({ isEs }: { isEs: boolean }) {
  const tiers = [
    {
      name: isEs ? "Auto-Servicio" : "Self-Serve",
      price: isEs ? "GRATIS" : "FREE",
      highlight: true,
      badge: isEs ? "Más Popular" : "Most Popular",
      features: [
        { label: isEs ? "Tú escaneas" : "You scan", value: "✅" },
        { label: isEs ? "Créditos ganados" : "Credits earned", value: "$25+" },
        { label: isEs ? "Sistemas interiores" : "Interior systems", value: "✅" },
        { label: isEs ? "Techo/exterior" : "Roof/exterior", value: isEs ? "Solo fotos" : "Photos only" },
        { label: isEs ? "Imagen térmica" : "Thermal imaging", value: "—" },
        { label: isEs ? "Tiempo" : "Time", value: "15-20 min" },
      ],
    },
    {
      name: isEs ? "Recorrido Pro" : "Pro Walk-Through",
      price: "$99",
      highlight: false,
      badge: null,
      features: [
        { label: isEs ? "Quién escanea" : "Who scans", value: isEs ? "Un Pro lo hace" : "Pro does it" },
        { label: isEs ? "Créditos ganados" : "Credits earned", value: "—" },
        { label: isEs ? "Sistemas interiores" : "Interior systems", value: "✅" },
        { label: isEs ? "Techo/exterior" : "Roof/exterior", value: "Visual" },
        { label: isEs ? "Imagen térmica" : "Thermal imaging", value: "—" },
        { label: isEs ? "Tiempo" : "Time", value: "45 min" },
      ],
    },
    {
      name: isEs ? "Aéreo + Interior" : "Aerial + Interior",
      price: "$249",
      highlight: false,
      badge: "Premium",
      features: [
        { label: isEs ? "Quién escanea" : "Who scans", value: isEs ? "Pro + dron" : "Pro + drone" },
        { label: isEs ? "Créditos ganados" : "Credits earned", value: "—" },
        { label: isEs ? "Sistemas interiores" : "Interior systems", value: "✅" },
        { label: isEs ? "Techo/exterior" : "Roof/exterior", value: isEs ? "Dron aéreo" : "Drone aerial" },
        { label: isEs ? "Imagen térmica" : "Thermal imaging", value: "✅" },
        { label: isEs ? "Tiempo" : "Time", value: "90 min" },
      ],
    },
  ];

  return (
    <section className="py-20 bg-background border-t border-border">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            {isEs ? "Elige Tu Escaneo" : "Choose Your Scan"}
          </h2>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-4 text-sm text-muted-foreground"></th>
                {tiers.map((t) => (
                  <th key={t.name} className={`p-4 text-center ${t.highlight ? "bg-[#F47C20]/5 rounded-t-xl" : ""}`}>
                    {t.badge && (
                      <Badge className={`mb-2 ${t.highlight ? "bg-[#F47C20] text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"}`}>
                        {t.badge}
                      </Badge>
                    )}
                    <div className="font-black text-lg">{t.name}</div>
                    <div className={`text-2xl font-black mt-1 ${t.highlight ? "text-[#F47C20]" : ""}`}>{t.price}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tiers[0].features.map((_, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="p-4 text-sm font-medium">{tiers[0].features[i].label}</td>
                  {tiers.map((t) => (
                    <td key={t.name} className={`p-4 text-center text-sm ${t.highlight ? "bg-[#F47C20]/5" : ""}`}>
                      {t.features[i].value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile stacked cards */}
        <div className="md:hidden space-y-6">
          {tiers.map((t) => (
            <Card key={t.name} className={`${t.highlight ? "border-[#F47C20] ring-2 ring-[#F47C20]/20" : "border-border"}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    {t.badge && (
                      <Badge className={`mb-1 ${t.highlight ? "bg-[#F47C20] text-white" : "bg-slate-200 dark:bg-slate-700"}`}>
                        {t.badge}
                      </Badge>
                    )}
                    <h3 className="font-black text-xl">{t.name}</h3>
                  </div>
                  <span className={`text-3xl font-black ${t.highlight ? "text-[#F47C20]" : ""}`}>{t.price}</span>
                </div>
                <div className="space-y-3">
                  {t.features.map((f) => (
                    <div key={f.label} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{f.label}</span>
                      <span className="font-medium">{f.value}</span>
                    </div>
                  ))}
                </div>
                <Button
                  className={`w-full mt-4 ${t.highlight ? "bg-[#F47C20] hover:bg-[#e06910] text-white" : ""}`}
                  variant={t.highlight ? "default" : "outline"}
                  onClick={t.highlight ? openGeorgeWithScan : undefined}
                >
                  {t.highlight
                    ? (isEs ? "Empezar Gratis" : "Start Free")
                    : (isEs ? "Reservar" : "Book Now")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── DISCLAIMER ─── */
function DisclaimerBanner({ isEs }: { isEs: boolean }) {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-y border-amber-200 dark:border-amber-800 py-4 px-4">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          ⚠️ {isEs
            ? "El Home DNA Scan proporciona estimaciones informativas únicamente y no es un sustituto de una inspección de hogar con licencia."
            : "The Home DNA Scan provides informational estimates only and is not a substitute for a licensed home inspection."}{" "}
          <Link href="/legal/home-scan-terms" className="underline font-medium hover:text-amber-900 dark:hover:text-amber-100">
            {isEs ? "Ver Términos y Condiciones completos" : "See full Terms & Conditions"}
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ─── TRUST ─── */
function TrustSection({ isEs }: { isEs: boolean }) {
  const items = [
    {
      icon: Lock,
      title: isEs ? "Tus datos son tuyos" : "Your data is yours",
      desc: isEs ? "Elimina cuando quieras. Nunca vendemos tus datos." : "Delete anytime. We never sell it.",
    },
    {
      icon: Shield,
      title: isEs ? "Encriptado y seguro" : "Encrypted & secure",
      desc: isEs ? "Fotos encriptadas y almacenadas de forma segura" : "Photos encrypted and stored securely",
    },
    {
      icon: CheckCircle,
      title: isEs ? "Cumplimiento legal" : "CCPA & GDPR compliant",
      desc: isEs ? "Cumplimos con CCPA y GDPR" : "Full compliance with data privacy regulations",
    },
  ];

  return (
    <section className="py-16 bg-slate-900 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          {items.map((item) => (
            <div key={item.title}>
              <item.icon className="w-8 h-8 text-[#F47C20] mx-auto mb-3" />
              <h3 className="font-bold text-white text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FINAL CTA ─── */
function FinalCTASection({ isEs }: { isEs: boolean }) {
  return (
    <section className="py-20 bg-background text-center">
      <div className="max-w-3xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-black mb-4">
          {isEs ? "Comienza Tu Escaneo Gratis Ahora" : "Start Your Free Scan Now"}
        </h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
          {isEs
            ? "15 minutos. $25+ en créditos. Cero riesgo."
            : "15 minutes. $25+ in credits. Zero risk."}
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4">
          <Button
            size="lg"
            className="bg-[#F47C20] hover:bg-[#e06910] text-white font-bold text-lg px-10 py-6 rounded-xl shadow-lg shadow-[#F47C20]/25 w-full sm:w-auto"
            onClick={openGeorgeWithScan}
          >
            {isEs ? "Iniciar Mi Escaneo Gratis" : "Start Your Free Scan Now"} <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="font-bold text-lg px-8 py-6 rounded-xl border-[#F47C20] text-[#F47C20] hover:bg-[#F47C20]/10 w-full sm:w-auto"
            onClick={openGeorgeWithScan}
          >
            {isEs ? "¿Preguntas? Pregúntale a Mr. George 👉" : "Questions? Just ask Mr. George 👉"}
          </Button>
        </div>
      </div>
    </section>
  );
}
