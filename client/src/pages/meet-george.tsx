import { useTranslation } from "react-i18next";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { usePageTitle } from "@/hooks/use-page-title";
import { Zap, DollarSign, Video, Camera, CalendarCheck, Brain, ShieldCheck, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

const capabilityKeys = [
  { icon: DollarSign, key: "instant_quotes" },
  { icon: Video, key: "diy_guidance" },
  { icon: Camera, key: "photo_diagnosis" },
  { icon: CalendarCheck, key: "smart_booking" },
  { icon: Brain, key: "home_dna_expert" },
  { icon: ShieldCheck, key: "cost_protection" },
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
  const { t } = useTranslation();
  usePageTitle("Meet Mr. George | UpTend");

  const capabilities = capabilityKeys.map((c) => ({
    icon: c.icon,
    title: t(`george.${c.key}_title`),
    desc: t(`george.${c.key}_desc`),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white">
      <Header />
      <main className="relative pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 h-[500px]">
          <img src="/images/site/hero-meet-george.webp" alt="" className="w-full h-full object-cover" loading="eager" />
          <div className="absolute inset-0 bg-slate-900/80" />
        </div>
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-4 text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-[#F47C20]/20 text-[#F47C20] rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Bot className="w-4 h-4" />
            {t("george.badge")}
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            {t("george.hero_line1")}<br />
            <span className="text-[#F47C20]">{t("george.hero_line2")}</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t("george.hero_desc")}
          </p>
          <Button
            size="lg"
            className="bg-[#F47C20] hover:bg-[#e06910] text-white font-bold text-lg px-10 py-6 rounded-xl"
            onClick={openChatWidget}
          >
            <Zap className="w-5 h-5 mr-2" /> {t("george.try_now")}
          </Button>
        </section>

        {/* What Can George Do */}
        <section className="max-w-5xl mx-auto px-4 mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">{t("george.what_can_do")}</h2>
          <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">
            {t("george.capabilities_sub")}
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
          <h2 className="text-2xl md:text-3xl font-bold mb-10">{t("george.how_it_works")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="w-12 h-12 rounded-full bg-[#F47C20] text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-bold text-lg mb-2">{t("george.step1_title")}</h3>
              <p className="text-sm text-slate-400">{t("george.step1_desc")}</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-[#F47C20] text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-bold text-lg mb-2">{t("george.step2_title")}</h3>
              <p className="text-sm text-slate-400">{t("george.step2_desc")}</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-full bg-[#F47C20] text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-bold text-lg mb-2">{t("george.step3_title")}</h3>
              <p className="text-sm text-slate-400">{t("george.step3_desc")}</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-r from-[#F47C20]/20 to-orange-500/20 border border-[#F47C20]/30 rounded-2xl p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{t("george.cta_title")}</h2>
            <p className="text-slate-300 mb-6">{t("george.cta_desc")}</p>
            <Button
              size="lg"
              className="bg-[#F47C20] hover:bg-[#e06910] text-white font-bold text-lg px-8 py-6 rounded-xl"
              onClick={openChatWidget}
            >
              {t("george.try_now")}
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
