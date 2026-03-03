import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "wouter";

interface Message {
  role: "george" | "user";
  content: string;
}

interface CollectedData {
  // Phase 1: Their World
  companyName?: string;
  serviceType?: string;
  teamSize?: string;
  yearsInBusiness?: string;
  serviceArea?: string;
  seasonalPatterns?: string;
  avgTicket?: string;
  // Phase 2: How Customers Find Them
  leadSources?: string;
  monthlySpend?: string;
  leadVolume?: string;
  websiteStatus?: string;
  seoRanking?: string;
  competitorAwareness?: string;
  targetNeighborhoods?: string;
  // Phase 3: What Happens When a Lead Comes In
  afterHoursHandling?: string;
  responseTime?: string;
  followUpProcess?: string;
  estimateConversion?: string;
  truckRollWaste?: string;
  schedulingMethod?: string;
  customerPortal?: string;
  // Phase 4: After the Job
  reviewProcess?: string;
  customerRetention?: string;
  repeatRevenue?: string;
  crossSellRequests?: string;
  financingOffered?: string;
  // Phase 5: Marketing & Visibility
  socialMediaPresence?: string;
  postingFrequency?: string;
  videoContent?: string;
  gbpStatus?: string;
  roiTracking?: string;
  // Phase 6: Tools & Spend
  currentTools?: string;
  totalToolSpend?: string;
  toolSatisfaction?: string;
  // Phase 7: Goals
  topPainPoint?: string;
  oneThingToFix?: string;
  twelveMonthGoal?: string;
  growthBlockers?: string;
  // Derived
  painPoints: string[];
  goals?: string;
}

interface Proposal {
  companySummary: string;
  painPoints: string[];
  packageName: string;
  packagePrice: string;
  roiNumbers: string;
  timeline: string[];
}

type Phase = "hero" | "chat" | "building" | "proposal";

function extractData(messages: Message[]): CollectedData {
  const all = messages.map(m => m.content).join(" ");
  const userMsgs = messages.filter(m => m.role === "user").map(m => m.content).join(" ");
  const lower = userMsgs.toLowerCase();
  const data: CollectedData = { painPoints: [] };

  // Phase 1: Their World
  const nameMatch = userMsgs.match(/(?:called|named?|company is|own|run|I'm with)\s+([A-Z][A-Za-z0-9&' ]{2,30})/i);
  if (nameMatch) data.companyName = nameMatch[1].trim();

  const services = ["plumbing","hvac","electrical","landscaping","roofing","cleaning","painting","pest control","pressure washing","junk removal","lawn care","pool","fencing","flooring","remodeling","handyman","tree","moving","garage door","gutter","solar","locksmith","foundation","insulation","irrigation","sprinkler","septic","chimney","home security","alarm","water treatment","water softener","cabinet","countertop","concrete","masonry","siding","drywall","window cleaning","mold","water damage","fire damage","generator","carpet","appliance repair"];
  for (const s of services) {
    if (lower.includes(s)) { data.serviceType = s.charAt(0).toUpperCase() + s.slice(1); break; }
  }

  const teamMatch = userMsgs.match(/(\d+)\s*(?:guys|people|employees|techs|technicians|trucks|crews|team|staff|members)/i);
  if (teamMatch) data.teamSize = teamMatch[1];

  const yearsMatch = userMsgs.match(/(\d+)\s*(?:years|yrs)/i);
  if (yearsMatch) data.yearsInBusiness = yearsMatch[1];

  const ticketMatch = userMsgs.match(/(?:average|avg|typical)\s*(?:ticket|job|invoice).*?\$?\s*(\d[\d,]*)/i) || userMsgs.match(/\$?\s*(\d[\d,]*)\s*(?:average|avg|per job|a job)/i);
  if (ticketMatch) data.avgTicket = ticketMatch[1].replace(/,/g, "");

  // Phase 2: How Customers Find Them
  const spendMatch = userMsgs.match(/\$?\s*(\d[\d,]*)\s*(?:a month|monthly|per month|\/month)/i);
  if (spendMatch) data.monthlySpend = spendMatch[1].replace(/,/g, "");

  if (lower.includes("referral")) data.leadSources = (data.leadSources || "") + "referrals, ";
  if (lower.includes("angi") || lower.includes("homeadvisor")) data.leadSources = (data.leadSources || "") + "Angi, ";
  if (lower.includes("thumbtack")) data.leadSources = (data.leadSources || "") + "Thumbtack, ";
  if (lower.includes("google ads") || lower.includes("ppc")) data.leadSources = (data.leadSources || "") + "Google Ads, ";
  if (lower.includes("facebook ads") || lower.includes("meta ads")) data.leadSources = (data.leadSources || "") + "Facebook Ads, ";

  const urlMatch = userMsgs.match(/(https?:\/\/[^\s]+|(?:www\.)[^\s]+|[a-zA-Z0-9-]+\.(?:com|net|org|io|co|biz)(?:\/[^\s]*)?)/i);
  if (urlMatch) data.websiteUrl = urlMatch[1].startsWith("http") ? urlMatch[1] : `https://${urlMatch[1]}`;
  if (lower.match(/website.*(outdated|old|never|don't have|no website)/)) data.websiteStatus = "outdated or missing";
  if (lower.match(/(don't rank|not on google|can't find us|page 2|not showing up)/)) data.seoRanking = "poor";
  if (lower.match(/competitor|competition/)) data.competitorAwareness = "mentioned";
  if (lower.match(/neighborhood|area|zip|part of town/)) data.targetNeighborhoods = "mentioned";

  // Phase 3: What Happens When a Lead Comes In
  if (lower.match(/(voicemail|miss|don't answer|after hours|no one picks up|goes to vm)/)) data.afterHoursHandling = "gaps identified";
  if (lower.match(/(slow to respond|hours later|next day|don't respond fast)/)) data.responseTime = "slow";
  if (lower.match(/(no follow.?up|don't follow|nobody follows|fall through)/)) data.followUpProcess = "none or manual";
  if (lower.match(/(estimate|quote|truck roll|drive out|wasted trip|don't convert)/)) data.estimateConversion = "issue identified";
  if (lower.match(/(spreadsheet|paper|whiteboard|text|group chat|in my head)/i)) data.schedulingMethod = "informal";
  if (lower.match(/(can't pay online|no portal|no customer login)/)) data.customerPortal = "none";

  // Phase 4: After the Job
  if (lower.match(/(no review|don't ask|few reviews|bad review)/)) data.reviewProcess = "weak";
  if (lower.match(/(one.?time|never come back|don't retain|no repeat)/)) data.customerRetention = "low";
  if (lower.match(/(repeat|maintenance|recurring|come back)/)) data.repeatRevenue = "mentioned";
  if (lower.match(/(ask for.*don't (do|offer)|request.*other service|outside my)/)) data.crossSellRequests = "yes";
  if (lower.match(/(sticker shock|too expensive|can't afford|payment plan|financing)/)) data.financingOffered = "issue identified";

  // Phase 5: Marketing & Visibility
  if (lower.match(/(no social|don't post|no facebook|no instagram|no tiktok)/)) data.socialMediaPresence = "none";
  if (lower.match(/(post.*sometimes|rarely post|once a month|don't post often)/)) data.postingFrequency = "infrequent";
  if (lower.match(/(no video|don't do video|never tried video)/)) data.videoContent = "none";
  if (lower.match(/(google business|gbp|google listing|google profile).*(outdated|never|don't)/)) data.gbpStatus = "neglected";
  if (lower.match(/(don't track|no idea what.?s working|can't measure|no analytics)/)) data.roiTracking = "none";

  // Phase 6: Tools & Spend
  const toolNames = ["servicetitan","housecall pro","jobber","quickbooks","square","calendly","mailchimp","constant contact","hootsuite","yelp","nextdoor"];
  const foundTools = toolNames.filter(t => lower.includes(t));
  if (foundTools.length > 0) data.currentTools = foundTools.join(", ");
  const totalSpendMatch = userMsgs.match(/(?:total|all together|combined|adds up to).*?\$?\s*(\d[\d,]*)/i);
  if (totalSpendMatch) data.totalToolSpend = totalSpendMatch[1].replace(/,/g, "");

  // Phase 7: Goals
  const revenueGoalMatch = userMsgs.match(/(?:goal|want to|get to|hit|reach).*?\$?\s*(\d[\d,]*(?:k|K|m|M)?)/);
  if (revenueGoalMatch) data.twelveMonthGoal = revenueGoalMatch[1];
  if (lower.match(/(holding.*back|blocker|obstacle|challenge|struggle|can't grow)/)) data.growthBlockers = "mentioned";

  // Pain points (expanded)
  const painKeywords = ["after hours","missed calls","no reviews","bad reviews","no leads","slow season","dead months","no website","no seo","no social media","too expensive","wasting money","can't find","don't know","truck rolls","don't convert","no follow up","sticker shock","no financing","competitors","can't track","no analytics","no video","google listing","past customers","forget about me"];
  for (const p of painKeywords) {
    if (all.toLowerCase().includes(p)) data.painPoints.push(p);
  }

  return data;
}

function generateProposal(data: CollectedData, messages: Message[]): Proposal {
  const name = data.companyName || "Your Company";
  const service = data.serviceType || "Home Services";
  const team = data.teamSize ? parseInt(data.teamSize) : 5;
  const spend = data.monthlySpend ? parseInt(data.monthlySpend) : 2000;

  const isLarge = team > 10 || spend > 3000;
  const packageName = isLarge ? "Growth Accelerator" : "Growth Starter";
  const price = isLarge ? "$1,497/mo" : "$797/mo";
  const roi = isLarge ? "3x to 5x" : "2x to 4x";

  return {
    companySummary: `${name} is a ${service.toLowerCase()} company${data.teamSize ? ` with ${data.teamSize} team members` : ""}${data.yearsInBusiness ? `, ${data.yearsInBusiness} years in the business` : ""}. Based on our conversation, here's what we put together.`,
    painPoints: data.painPoints.length > 0 ? data.painPoints : ["Inconsistent lead flow", "Limited online presence", "Missing after hours calls"],
    packageName,
    packagePrice: price,
    roiNumbers: `Based on similar ${service.toLowerCase()} companies, we typically see a ${roi} return within 90 days. That means for every dollar you invest, you could be pulling in ${roi} back in new revenue.`,
    timeline: [
      "Week 1: Onboarding call + set up your AI receptionist",
      "Week 2: Launch your lead generation campaigns",
      "Week 3: Reviews and reputation engine goes live",
      "Week 4: First performance report + optimization",
      "Month 2+: Scale what's working, cut what's not",
    ],
  };
}

export default function DiscoveryPage() {
  const params = useParams<{ slug?: string }>();
  const [phase, setPhase] = useState<Phase>("hero");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [visibleSections, setVisibleSections] = useState(0);
  const [email, setEmail] = useState("");
  const [leadName, setLeadName] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [readyPromptShown, setReadyPromptShown] = useState(false);
  const [auditData, setAuditData] = useState<any>(null);
  const [auditStarted, setAuditStarted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // When we have enough data, trigger the live audit
  const collectedRef = useRef<CollectedData | null>(null);
  useEffect(() => {
    if (messages.length < 2) return;
    const collected = extractData(messages);
    collectedRef.current = collected;
    if (collected.companyName && collected.serviceType && !auditStarted) {
      setAuditStarted(true);
      fetch("/api/partners/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: collected.companyName,
          serviceType: collected.serviceType,
          city: collected.serviceArea || "Orlando",
          websiteUrl: collected.websiteUrl,
        }),
      })
        .then(r => r.json())
        .then(data => { if (data && !data.error) setAuditData(data); })
        .catch(() => {}); // Silent fail — audit is bonus
    }
  }, [messages, auditStarted]);

  // Voice: speak George's message via ElevenLabs Adam voice
  const speak = useCallback(async (text: string) => {
    if (!voiceMode) return;
    try {
      const resp = await fetch("/api/partners/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.audioBase64) {
          const audio = new Audio(`data:audio/mpeg;base64,${data.audioBase64}`);
          audio.play().catch(() => {});
        }
      } else {
        // Fallback to browser TTS if ElevenLabs fails
        if (window.speechSynthesis) {
          const u = new SpeechSynthesisUtterance(text);
          u.rate = 0.95;
          u.pitch = 0.9;
          window.speechSynthesis.speak(u);
        }
      }
    } catch {
      // Fallback to browser TTS
      if (window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.95;
        u.pitch = 0.9;
        window.speechSynthesis.speak(u);
      }
    }
  }, [voiceMode]);

  // Voice: listen
  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setInput(text);
      setIsListening(false);
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: msg }];
    setMessages(newMessages);
    setIsLoading(true);

    const collected = extractData(newMessages);

    try {
      const res = await fetch("/api/ai/guide/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          conversationHistory: newMessages.map(m => ({
            role: m.role === "george" ? "assistant" : "user",
            content: m.content,
          })),
          context: {
            currentPage: "/discovery",
            userRole: "partner_discovery",
            discoveryMode: true,
            collectedData: collected,
            liveAudit: auditData,
            discoveryPhases: {
              phase1_their_world: {
                label: "Their World",
                questions: [
                  "What's your company name, and what services do you offer?",
                  "How long have you been in business?",
                  "How many techs or crew members do you have?",
                  "What's your service area? How far do you go?",
                  "What's your average ticket size?",
                  "Do you have seasonal patterns? Busy months vs. slow months?",
                  "How many calls or leads do you get per week?"
                ],
                dataKeys: ["companyName","serviceType","teamSize","yearsInBusiness","serviceArea","seasonalPatterns","avgTicket"]
              },
              phase2_how_customers_find_them: {
                label: "How Customers Find Them",
                questions: [
                  "Where do most of your leads come from right now?",
                  "What are you currently spending on lead sources per month?",
                  "How many leads do you lose because nobody picked up or responded in time?",
                  "Does your website show up when someone Googles your service + your city?",
                  "When was the last time your website was updated?",
                  "Do you know what your competitors are charging?",
                  "Are there specific neighborhoods where you want more work?"
                ],
                dataKeys: ["leadSources","monthlySpend","leadVolume","websiteStatus","seoRanking","competitorAwareness","targetNeighborhoods"]
              },
              phase3_when_lead_comes_in: {
                label: "What Happens When a Lead Comes In",
                questions: [
                  "How do you handle after hours calls and weekend inquiries?",
                  "How fast do you respond to online inquiries?",
                  "Who follows up if they don't book on the first call?",
                  "How many estimates do you do that don't convert? How many truck rolls just for quotes?",
                  "How do you assign jobs to your crew right now?",
                  "What software do you use for scheduling and dispatch?",
                  "Can your customers check job status or pay online?"
                ],
                dataKeys: ["afterHoursHandling","responseTime","followUpProcess","estimateConversion","truckRollWaste","schedulingMethod","customerPortal"]
              },
              phase4_after_the_job: {
                label: "After the Job",
                questions: [
                  "How do you get Google reviews from customers?",
                  "Do you email or text past customers?",
                  "What percentage of your revenue is repeat/maintenance business?",
                  "Do your customers ever ask for services you don't offer?",
                  "Do you lose big jobs because of sticker shock? Do you offer payment options?"
                ],
                dataKeys: ["reviewProcess","customerRetention","repeatRevenue","crossSellRequests","financingOffered"]
              },
              phase5_marketing_visibility: {
                label: "Marketing & Visibility",
                questions: [
                  "Who manages your social media, if anyone?",
                  "How often do you post on social media?",
                  "Have you tried video content? Before and afters?",
                  "When was the last time you updated your Google Business Profile?",
                  "How do you track your marketing ROI?"
                ],
                dataKeys: ["socialMediaPresence","postingFrequency","videoContent","gbpStatus","roiTracking"]
              },
              phase6_tools_spend: {
                label: "Tools & Spend",
                questions: [
                  "Walk me through every tool you're paying for monthly.",
                  "If you added it all up, what's the total?",
                  "What's working and what's not?"
                ],
                dataKeys: ["currentTools","totalToolSpend","toolSatisfaction"]
              },
              phase7_goals: {
                label: "Goals",
                questions: [
                  "What's your single biggest pain point right now?",
                  "If you could fix one thing about your business tomorrow, what would it be?",
                  "Where do you want to be in 12 months? Revenue? Team size?",
                  "What's holding you back from getting there?"
                ],
                dataKeys: ["topPainPoint","oneThingToFix","twelveMonthGoal","growthBlockers"]
              }
            },
          },
        }),
      });
      const data = await res.json();
      const reply = data.reply || data.response || data.message || "Let me think on that for a second...";
      setMessages(prev => [...prev, { role: "george", content: reply }]);
      speak(reply);

      // Check if ready for proposal
      if (!readyPromptShown && collected.companyName && collected.serviceType && (collected.painPoints.length >= 2 || collected.monthlySpend)) {
        setReadyPromptShown(true);
      }
    } catch {
      setMessages(prev => [...prev, { role: "george", content: "Having a connection issue. Give it another shot." }]);
    }
    setIsLoading(false);
  }, [input, messages, isLoading, speak, readyPromptShown]);

  const startChat = useCallback((voice: boolean) => {
    setVoiceMode(voice);
    setPhase("chat");
    const greeting = params.slug
      ? `Hey there! I see you're coming from ${params.slug.replace(/-/g, " ")}. I'm George, your AI business advisor. Tell me a little about your company. What kind of services do you offer?`
      : "Hey there! I'm George, your AI business advisor. I'm going to learn about your business and put together a custom growth package for you. Let's start simple: what's your company name and what kind of services do you offer?";
    setMessages([{ role: "george", content: greeting }]);
    if (voice) speak(greeting);
  }, [params.slug, speak]);

  const buildProposal = useCallback(() => {
    setPhase("building");
    const p = generateProposal(extractData(messages), messages);
    setProposal(p);
    let count = 0;
    const iv = setInterval(() => {
      count++;
      setVisibleSections(count);
      if (count >= 5) {
        clearInterval(iv);
        setTimeout(() => setPhase("proposal"), 400);
      }
    }, 600);
  }, [messages]);

  const submitEmail = useCallback(async () => {
    if (!email) return;
    try {
      await fetch("/api/partners/discovery-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: leadName, proposal, messages }),
      });
    } catch { /* best effort */ }
    setEmailSent(true);
  }, [email, leadName, proposal, messages]);

  // Hero
  if (phase === "hero") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
        <header className="p-4">
          <img src="/logo-white.png" alt="UpTend" className="h-6 opacity-70" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-lg mx-auto">
          <img src="/george-avatar.png" alt="George" className="w-32 h-32 rounded-full mb-6 shadow-2xl shadow-blue-500/20 border-2 border-blue-500/30" />
          <h1 className="text-4xl font-bold mb-3">Meet George</h1>
          <p className="text-gray-400 text-lg mb-8 leading-relaxed">
            Your AI business advisor. Tell George about your company and he'll build you a custom growth package in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
            <button onClick={() => startChat(true)} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              Start Talking
            </button>
            <button onClick={() => startChat(false)} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 px-6 rounded-xl font-semibold transition-all border border-white/10">
              Start Typing
            </button>
          </div>
          <p className="text-gray-600 text-sm mt-6">Takes about 10 minutes. Everything is confidential.</p>
        </div>
      </div>
    );
  }

  // Building animation
  if (phase === "building") {
    const labels = ["Company Summary", "Pain Points", "Recommended Package", "ROI Projection", "What Happens Next"];
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-8" />
        <h2 className="text-2xl font-bold mb-6">Building your custom package...</h2>
        <div className="space-y-3 w-full max-w-sm">
          {labels.map((label, i) => (
            <div key={label} className={`flex items-center gap-3 transition-all duration-500 ${i < visibleSections ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}>
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">{i < visibleSections ? "✓" : ""}</div>
              <span className="text-gray-300">{label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Proposal
  if (phase === "proposal" && proposal) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        <header className="p-4">
          <img src="/logo-white.png" alt="UpTend" className="h-6 opacity-70" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </header>
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Your Custom Growth Package</h1>
            <p className="text-gray-400">Prepared by George, just for you</p>
          </div>

          {/* Company Summary */}
          <section className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h3 className="text-blue-400 text-sm font-semibold uppercase tracking-wider mb-3">What We Heard</h3>
            <p className="text-gray-300 leading-relaxed">{proposal.companySummary}</p>
          </section>

          {/* Pain Points */}
          <section className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h3 className="text-blue-400 text-sm font-semibold uppercase tracking-wider mb-3">Challenges We Can Solve</h3>
            <ul className="space-y-2">
              {proposal.painPoints.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-300">
                  <span className="text-red-400 mt-1">●</span>
                  <span className="capitalize">{p}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Online Presence Audit */}
          {auditData && (
            <section className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-blue-400 text-sm font-semibold uppercase tracking-wider mb-4">Online Presence Audit</h3>
              <div className="space-y-4">
                {/* Google Rating */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Google Rating</span>
                  <span className="text-white font-semibold">
                    {auditData.company?.rating ? `${auditData.company.rating} ★` : "Not found"}{" "}
                    {auditData.company?.reviewCount ? `(${auditData.company.reviewCount} reviews)` : ""}
                  </span>
                </div>
                {/* Search Ranking */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Search Ranking for "{auditData.searchRanking?.query}"</span>
                  <span className={`font-semibold ${auditData.searchRanking?.position ? (auditData.searchRanking.position <= 5 ? "text-green-400" : "text-yellow-400") : "text-red-400"}`}>
                    {auditData.searchRanking?.position ? `#${auditData.searchRanking.position}` : "Not in top 20"}
                  </span>
                </div>
                {/* Top Competitors */}
                {auditData.competitors && auditData.competitors.length > 0 && (
                  <div>
                    <p className="text-gray-400 text-sm mb-2">Top Competitors</p>
                    <div className="space-y-2">
                      {auditData.competitors.slice(0, 3).map((comp: any, i: number) => (
                        <div key={i} className="bg-white/5 rounded-lg px-3 py-2 flex items-center justify-between">
                          <div>
                            <span className="text-white text-sm font-medium">#{comp.position} {comp.name}</span>
                          </div>
                          <span className="text-gray-400 text-sm">
                            {comp.rating ? `${comp.rating} ★` : ""} {comp.reviewCount ? `(${comp.reviewCount})` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Website Status */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Website</span>
                  <span className={`font-semibold ${auditData.website?.loadedSuccessfully ? "text-green-400" : "text-red-400"}`}>
                    {auditData.website?.exists
                      ? (auditData.website.loadedSuccessfully ? `Live${auditData.website.hasSSL ? " & Secure" : " (No SSL)"}` : "Found but not loading")
                      : "Not found"}
                  </span>
                </div>
                {/* Social Media */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Facebook</span>
                  <span className={`font-semibold ${auditData.socialMedia?.facebook?.found ? "text-green-400" : "text-red-400"}`}>
                    {auditData.socialMedia?.facebook?.found ? "Found" : "Not found"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Instagram</span>
                  <span className={`font-semibold ${auditData.socialMedia?.instagram?.found ? "text-green-400" : "text-red-400"}`}>
                    {auditData.socialMedia?.instagram?.found ? "Found" : "Not found"}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-gray-500">Audit confidence: {auditData.totalConfidence}% · Audited at {new Date(auditData.auditedAt).toLocaleString()}</p>
              </div>
            </section>
          )}

          {/* Package */}
          <section className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl p-6 border border-blue-500/30">
            <h3 className="text-blue-400 text-sm font-semibold uppercase tracking-wider mb-3">Recommended Package</h3>
            <div className="flex items-end justify-between mb-4">
              <span className="text-2xl font-bold">{proposal.packageName}</span>
              <span className="text-3xl font-bold text-blue-400">{proposal.packagePrice}</span>
            </div>
            <ul className="text-gray-300 space-y-1 text-sm">
              <li>✦ AI Receptionist (24/7 call answering)</li>
              <li>✦ Lead generation campaigns</li>
              <li>✦ Review and reputation management</li>
              <li>✦ Monthly performance reports</li>
              <li>✦ Dedicated account manager</li>
            </ul>
          </section>

          {/* ROI */}
          <section className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h3 className="text-blue-400 text-sm font-semibold uppercase tracking-wider mb-3">Expected ROI</h3>
            <p className="text-gray-300 leading-relaxed">{proposal.roiNumbers}</p>
          </section>

          {/* Timeline */}
          <section className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h3 className="text-blue-400 text-sm font-semibold uppercase tracking-wider mb-3">What Happens Next</h3>
            <ol className="space-y-3">
              {proposal.timeline.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-300">
                  <span className="bg-blue-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* Email capture */}
          {!emailSent ? (
            <section className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold mb-4">Where should we send your proposal?</h3>
              <div className="space-y-3">
                <input value={leadName} onChange={e => setLeadName(e.target.value)} placeholder="Your name" className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email" type="email" className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
                <button onClick={submitEmail} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-semibold transition-all">Send This Proposal to My Email</button>
              </div>
            </section>
          ) : (
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
              <p className="text-green-400 font-semibold">✓ We'll send it right over!</p>
            </div>
          )}

          {/* CTA */}
          <div className="text-center space-y-3 pb-12">
            <a href="https://calendly.com" target="_blank" rel="noopener noreferrer" className="block w-full bg-white text-black py-3 rounded-xl font-semibold hover:bg-gray-100 transition-all">Schedule a Call with Alan</a>
            <p className="text-gray-500 text-sm">Or call us: (850) 319-9550</p>
          </div>
        </div>
      </div>
    );
  }

  // Chat
  return (
    <div className="h-[100dvh] bg-[#0a0a0f] text-white flex flex-col">
      <header className="flex items-center justify-between p-3 border-b border-white/5">
        <img src="/logo-white.png" alt="UpTend" className="h-5 opacity-70" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        {voiceMode && (
          <button onClick={() => setVoiceMode(false)} className="text-xs text-gray-400 hover:text-white">Switch to text only</button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "george" && (
              <img src="/george-avatar.png" alt="" className="w-8 h-8 rounded-full flex-shrink-0 mt-1" />
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-white/10 text-gray-200"}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <img src="/george-avatar.png" alt="" className="w-8 h-8 rounded-full flex-shrink-0 mt-1" />
            <div className="bg-white/10 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        {readyPromptShown && !isLoading && messages.length > 5 && (
          <div className="flex justify-center">
            <button onClick={buildProposal} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 px-6 py-2.5 rounded-full text-sm font-semibold transition-all animate-pulse">
              ✨ Ready to see your package?
            </button>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-3 border-t border-white/5">
        <div className="flex gap-2 max-w-2xl mx-auto">
          {voiceMode && (
            <button
              onClick={isListening ? stopListening : startListening}
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${isListening ? "bg-red-500 animate-pulse" : "bg-white/10 hover:bg-white/20"}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            </button>
          )}
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
          />
          <button onClick={() => sendMessage()} disabled={isLoading || !input.trim()} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-30 px-4 rounded-xl transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
