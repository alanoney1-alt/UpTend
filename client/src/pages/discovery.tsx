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
  websiteUrl?: string;
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
  // Extra
  hasWebsite?: boolean;
  reviewCount?: string;
  googleRating?: string;
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
  // Company name — multiple patterns to catch natural phrasing
  const namePatterns = [
    /(?:called|named?|company is|own|run|I'm with|we're|we are|it's|business is)\s+([A-Z][A-Za-z0-9&'. -]{2,35})/i,
    /^([A-Z][A-Za-z0-9&'. -]{2,35})(?:\s*[-—,]\s*we|\.\s*We)/m,
  ];
  for (const pat of namePatterns) {
    const m = userMsgs.match(pat);
    if (m) { data.companyName = m[1].trim().replace(/[.,]+$/, ""); break; }
  }

  const services = ["plumbing","hvac","electrical","landscaping","roofing","cleaning","painting","pest control","pressure washing","junk removal","lawn care","pool","fencing","flooring","remodeling","handyman","tree","moving","garage door","gutter","solar","locksmith","foundation","insulation","irrigation","sprinkler","septic","chimney","home security","alarm","water treatment","water softener","cabinet","countertop","concrete","masonry","siding","drywall","window cleaning","mold","water damage","fire damage","generator","carpet","appliance repair"];
  for (const s of services) {
    if (lower.includes(s)) { data.serviceType = s.charAt(0).toUpperCase() + s.slice(1); break; }
  }

  // Team size — handles "I have 4 guys", "about 12 techs", "crew of 8", "just me" etc.
  const teamMatch = userMsgs.match(/(\d+)\s*(?:guys|people|employees|techs|technicians|trucks|crews?|team|staff|members|workers|men|installers|painters|plumbers)/i)
    || userMsgs.match(/(?:crew|team|staff)\s*(?:of|is)\s*(?:about\s*)?(\d+)/i)
    || userMsgs.match(/(?:have|got|run)\s*(?:about\s*)?(\d+)\s*(?:guys|people|techs|crew|employees)/i);
  if (teamMatch) data.teamSize = teamMatch[1];
  if (!data.teamSize && /\b(just me|solo|one man|one-man|by myself|only me)\b/i.test(lower)) data.teamSize = "1";

  // Years in business — handles "been doing this 15 years", "started in 2018", etc.
  const yearsMatch = userMsgs.match(/(\d+)\s*(?:years|yrs)/i);
  if (yearsMatch) data.yearsInBusiness = yearsMatch[1];
  if (!data.yearsInBusiness) {
    const startedMatch = userMsgs.match(/(?:started|been|since|est\.?)\s*(?:in\s*)?(\d{4})/i);
    if (startedMatch) data.yearsInBusiness = String(new Date().getFullYear() - parseInt(startedMatch[1]));
  }

  // Average ticket — handles "$350 a job", "about three hundred", "average ticket is 500"
  const ticketMatch = userMsgs.match(/(?:average|avg|typical)\s*(?:ticket|job|invoice).*?\$?\s*(\d[\d,]*)/i)
    || userMsgs.match(/\$?\s*(\d[\d,]*)\s*(?:average|avg|per job|a job|typical)/i)
    || userMsgs.match(/(?:charge|bill|get paid|make)\s*(?:about|around|roughly)?\s*\$?\s*(\d[\d,]*)\s*(?:per|a|each)/i);
  if (ticketMatch) data.avgTicket = ticketMatch[1].replace(/,/g, "");

  // Phase 2: How Customers Find Them
  const spendMatch = userMsgs.match(/\$?\s*(\d[\d,]*)\s*(?:a month|monthly|per month|\/month)/i);
  if (spendMatch) data.monthlySpend = spendMatch[1].replace(/,/g, "");

  if (lower.includes("referral")) data.leadSources = (data.leadSources || "") + "referrals, ";
  if (lower.includes("angi") || lower.includes("homeadvisor")) data.leadSources = (data.leadSources || "") + "Angi, ";
  if (lower.includes("thumbtack")) data.leadSources = (data.leadSources || "") + "Thumbtack, ";
  if (lower.includes("google ads") || lower.includes("ppc")) data.leadSources = (data.leadSources || "") + "Google Ads, ";
  if (lower.includes("facebook ads") || lower.includes("meta ads")) data.leadSources = (data.leadSources || "") + "Facebook Ads, ";

  // Website URL — avoid false positives from tool names like "quickbooks.com" or "angi.com"
  const toolDomains = ["quickbooks.com","servicetitan.com","housecallpro.com","jobber.com","angi.com","thumbtack.com","homeadvisor.com","yelp.com","nextdoor.com","facebook.com","instagram.com","google.com","square.com","calendly.com","mailchimp.com","hootsuite.com"];
  const urlMatch = userMsgs.match(/(https?:\/\/[^\s]+|(?:www\.)[^\s]+|[a-zA-Z0-9-]+\.(?:com|net|org|io|co|biz)(?:\/[^\s]*)?)/i);
  if (urlMatch) {
    const candidate = urlMatch[1].toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "");
    if (!toolDomains.some(d => candidate.startsWith(d))) {
      data.websiteUrl = urlMatch[1].startsWith("http") ? urlMatch[1] : `https://${urlMatch[1]}`;
    }
  }
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

  // Website detection
  if (/\.(com|net|org|io|co)\b/i.test(userMsgs) || /website|site|domain/i.test(lower)) data.hasWebsite = true;
  if (/no website|don't have a (website|site)|no site/i.test(lower)) data.hasWebsite = false;

  // Review count / rating
  const reviewMatch = userMsgs.match(/(\d+)\s*(?:reviews?|stars?|rating)/i);
  if (reviewMatch) data.reviewCount = reviewMatch[1];
  const ratingMatch = userMsgs.match(/(\d\.?\d?)\s*(?:stars?|rating|out of)/i);
  if (ratingMatch) data.googleRating = ratingMatch[1];

  return data;
}

function generateProposal(data: CollectedData, messages: Message[]): Proposal {
  const name = data.companyName || "Your Company";
  const service = data.serviceType || "Home Services";
  const team = data.teamSize ? parseInt(data.teamSize) : 5;
  const spend = data.monthlySpend ? parseInt(data.monthlySpend) : 2000;

  // Match actual UpTend partner packages: Starter $297, Growth $597, Dominate $997
  let packageName: string;
  let price: string;
  let roi: string;
  let setupFee: string;

  if (team > 10 || spend > 3000) {
    packageName = "Dominate";
    price = "$997/mo";
    setupFee = "$5,000 setup";
    roi = "4x to 7x";
  } else if (team > 3 || spend > 1000) {
    packageName = "Growth";
    price = "$597/mo";
    setupFee = "$2,500 setup";
    roi = "3x to 5x";
  } else {
    packageName = "Starter";
    price = "$297/mo";
    setupFee = "$1,500 setup";
    roi = "2x to 4x";
  }

  // Calculate breakeven based on vertical
  const avgTicket = data.avgTicket ? parseInt(data.avgTicket) : 350;
  const monthlyPrice = parseInt(price.replace(/[^0-9]/g, ""));
  const jobsToBreakeven = Math.ceil(monthlyPrice / avgTicket) + 1; // +1 for 5% job fee

  return {
    companySummary: `${name} — ${service.toLowerCase()}${data.teamSize ? `, ${data.teamSize} team members` : ""}${data.yearsInBusiness ? `, ${data.yearsInBusiness} years in business` : ""}${data.serviceArea ? `, covers ${data.serviceArea}` : ""}${data.monthlySpend ? `. Currently spending ~$${data.monthlySpend}/mo on marketing` : ""}.`,
    painPoints: data.painPoints.length > 0 ? data.painPoints : ["Inconsistent lead flow", "Limited online presence", "Missing after hours calls"],
    packageName,
    packagePrice: `${price} + ${setupFee}`,
    roiNumbers: `At ${price}, you need ${jobsToBreakeven} extra jobs per month to cover the entire cost. Based on similar ${service.toLowerCase()} companies, we typically see a ${roi} return within 90 days. That's ${roi} back for every dollar in.`,
    timeline: [
      "Step 1: Sales reviews this summary and preps for consultation call",
      "Step 2: Consultation call — walk through findings, recommend package",
      "Step 3: If they're in — onboarding call, George AI configured",
      "Step 4: SEO pages live, lead capture + review automation launched",
      "Step 5: First performance report + optimization",
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
  const [conversationMode, setConversationMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
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

  // Sentence-level TTS queue for stream-to-speech
  const ttsQueueRef = useRef<string[]>([]);
  const ttsPlayingRef = useRef(false);
  const ttsBufRef = useRef("");

  const processTTSQueue = useCallback(async () => {
    if (ttsPlayingRef.current || ttsQueueRef.current.length === 0) return;
    ttsPlayingRef.current = true;
    while (ttsQueueRef.current.length > 0) {
      const sentence = ttsQueueRef.current.shift()!;
      if (sentence.trim()) await speak(sentence.trim());
    }
    ttsPlayingRef.current = false;
  }, [speak]);

  const feedTTSToken = useCallback((token: string) => {
    ttsBufRef.current += token;
    const parts = ttsBufRef.current.split(/(?<=[.!?])\s+/);
    if (parts.length > 1) {
      for (let i = 0; i < parts.length - 1; i++) ttsQueueRef.current.push(parts[i]);
      ttsBufRef.current = parts[parts.length - 1];
      processTTSQueue();
    }
  }, [processTTSQueue]);

  const flushTTS = useCallback(() => {
    if (ttsBufRef.current.trim()) {
      ttsQueueRef.current.push(ttsBufRef.current.trim());
      ttsBufRef.current = "";
      processTTSQueue();
    }
  }, [processTTSQueue]);

  // Pre-warm server connection on mount
  useEffect(() => {
    fetch("/api/ai/guide/voice-status").catch(() => {});
  }, []);

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
    // Fire audit as soon as we know company name + service type (usually by exchange 2-3)
    // Audit runs in background while George keeps asking questions
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

  // Unlock audio for Safari/iOS — call on any user gesture before playing
  const audioCtxRef = useRef<AudioContext | null>(null);
  const unlockAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current?.state === "suspended") audioCtxRef.current.resume();
    try {
      const s = new Audio("data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYZt");
      s.volume = 0.01;
      s.play().then(() => s.pause()).catch(() => {});
    } catch {}
  }, []);

  // Voice: speak George's message via ElevenLabs with browser fallback
  // Returns a promise that resolves when speech finishes (for conversation loop)
  const speak = useCallback(async (text: string, force?: boolean): Promise<void> => {
    if (!voiceMode && !force) return;
    setIsSpeaking(true);

    const browserFallback = (t: string): Promise<void> => {
      return new Promise((resolve) => {
        try {
          if (window.speechSynthesis) {
            const clean = t.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");
            const u = new SpeechSynthesisUtterance(clean);
            u.rate = 0.95;
            u.pitch = 0.9;
            u.onend = () => { setIsSpeaking(false); resolve(); };
            u.onerror = () => { setIsSpeaking(false); resolve(); };
            window.speechSynthesis.speak(u);
          } else {
            setIsSpeaking(false);
            resolve();
          }
        } catch {
          setIsSpeaking(false);
          resolve();
        }
      });
    };

    // Play audio through AudioContext (works on Safari/iOS after user gesture unlock)
    const playViaAudioContext = (base64: string): Promise<void> => {
      return new Promise(async (resolve) => {
        try {
          if (!audioCtxRef.current) {
            const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) audioCtxRef.current = new AudioCtx();
          }
          const ctx = audioCtxRef.current;
          if (!ctx) { setIsSpeaking(false); resolve(); return; }
          if (ctx.state === "suspended") await ctx.resume();
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const buffer = await ctx.decodeAudioData(bytes.buffer);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.onended = () => { setIsSpeaking(false); resolve(); };
          source.start(0);
        } catch {
          // AudioContext decode failed — try HTML5 Audio, then browser TTS
          try {
            const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
            audio.onended = () => { setIsSpeaking(false); resolve(); };
            audio.onerror = () => browserFallback(text).then(resolve);
            await audio.play();
          } catch {
            browserFallback(text).then(resolve);
          }
        }
      });
    };

    try {
      const resp = await fetch("/api/ai/guide/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.audio) {
          await playViaAudioContext(data.audio);
          return;
        }
      }
      await browserFallback(text);
    } catch {
      await browserFallback(text);
    }
  }, [voiceMode]);

  // Voice: listen — in conversation mode, auto-sends when user stops talking
  const sendMessageRef = useRef<((text?: string) => Promise<void>) | null>(null);
  const conversationModeRef = useRef(false);
  useEffect(() => { conversationModeRef.current = conversationMode; }, [conversationMode]);

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      if (conversationModeRef.current && sendMessageRef.current) {
        // In conversation mode: auto-send immediately, no typing needed
        sendMessageRef.current(text);
      } else {
        setInput(text);
      }
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
      // Use streaming endpoint for faster first-token display
      const streamRes = await fetch("/api/ai/guide/chat-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          conversationHistory: newMessages.map(m => ({
            role: m.role === "george" ? "assistant" : "user",
            content: m.content,
          })),
          context: {
            page: "/discovery",
            currentPage: "/discovery",
            userRole: "partner_discovery",
            discoveryMode: true,
            collectedData: collected,
            liveAudit: auditData,
          },
        }),
      });

      let reply = "";
      if (streamRes.ok && streamRes.body) {
        // Add empty message and stream into it
        setMessages(prev => [...prev, { role: "george", content: "" }]);
        ttsBufRef.current = "";
        ttsQueueRef.current = [];
        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
          for (const line of lines) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.token) {
                reply += data.token;
                const currentReply = reply;
                setMessages(prev => {
                  const updated = [...prev];
                  if (updated.length > 0 && updated[updated.length - 1].role === "george") {
                    updated[updated.length - 1] = { ...updated[updated.length - 1], content: currentReply };
                  }
                  return updated;
                });
                if (voiceMode) feedTTSToken(data.token);
              }
            } catch {}
          }
        }
        if (voiceMode) flushTTS();
      } else {
        // Fallback to non-streaming
        const fallbackRes = await fetch("/api/ai/guide/chat", {
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
            },
          }),
        });
        const data = await fallbackRes.json();
        reply = data.reply || data.response || data.message || "Let me think on that for a second...";
        setMessages(prev => [...prev, { role: "george", content: reply }]);
      }

      // If we streamed with TTS, just wait for queue to drain then auto-listen
      // If non-streaming fallback, speak the whole thing
      if (!(streamRes.ok && streamRes.body)) {
        speak(reply).then(() => {
          if (conversationModeRef.current) {
            setTimeout(() => { if (conversationModeRef.current) startListening(); }, 400);
          }
        });
      } else {
        // For streamed TTS, wait a bit for queue to finish then auto-listen
        const waitForTTS = () => {
          if (ttsPlayingRef.current || ttsQueueRef.current.length > 0) {
            setTimeout(waitForTTS, 200);
          } else if (conversationModeRef.current) {
            setTimeout(() => { if (conversationModeRef.current) startListening(); }, 400);
          }
        };
        waitForTTS();
      }

      // Auto-generate proposal silently when George wraps up the conversation
      // Detect hand-off phrases (George collecting contact info = conversation is ending)
      const lowerReply = reply.toLowerCase();
      const isWrappingUp = /that's everything i need|get this to the team|set up a.*(consultation|call)|reach out to you|we'll be in touch|best (phone|email|number|way to reach)/i.test(reply);
      if (isWrappingUp && !readyPromptShown) {
        setReadyPromptShown(true);
        // Wait for George to finish speaking, then silently show proposal for salesperson
        setTimeout(() => {
          buildProposal();
        }, 3000);
      }
    } catch {
      setMessages(prev => [...prev, { role: "george", content: "Having a connection issue. Give it another shot." }]);
    }
    setIsLoading(false);
  }, [input, messages, isLoading, speak, readyPromptShown, startListening]);

  // Keep ref in sync for conversation mode auto-send
  useEffect(() => { sendMessageRef.current = sendMessage; }, [sendMessage]);

  // Start/stop conversation mode
  const toggleConversationMode = useCallback(() => {
    const next = !conversationMode;
    setConversationMode(next);
    setVoiceMode(next); // voice must be on for conversation mode
    unlockAudio(); // unlock Safari audio on this user gesture
    if (next) {
      // If no messages yet, send the greeting which triggers George to speak + auto-listen
      if (messages.length === 0) {
        sendMessage("Hey");
      } else {
        // Already in convo — start listening for next input
        startListening();
      }
    } else {
      // Exiting conversation mode — stop listening if active
      stopListening();
    }
  }, [conversationMode, messages, sendMessage, startListening, stopListening, unlockAudio]);

  const startChat = useCallback((voice: boolean) => {
    setVoiceMode(voice);
    setPhase("chat");
    const greeting = params.slug
      ? `Hey, I'm George with UpTend. We work with ${params.slug.replace(/-/g, " ")} and a bunch of other service companies in the area. What's the name of your business and what type of home service do you do?`
      : "Hey, I'm George with UpTend. We work with home service companies all over Orlando. What's the name of your business and what type of home service do you do?";
    setMessages([{ role: "george", content: greeting }]);
    if (voice) speak(greeting, true);
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
            <button onClick={() => { unlockAudio(); startChat(true); }} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
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
            <h1 className="text-3xl font-bold mb-2">Discovery Summary</h1>
            <p className="text-gray-400">Internal — for sales review</p>
          </div>

          {/* Company Summary */}
          <section className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h3 className="text-blue-400 text-sm font-semibold uppercase tracking-wider mb-3">Business Summary</h3>
            <p className="text-gray-300 leading-relaxed">{proposal.companySummary}</p>
          </section>

          {/* Pain Points */}
          <section className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h3 className="text-blue-400 text-sm font-semibold uppercase tracking-wider mb-3">Pain Points Identified</h3>
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
            <h3 className="text-blue-400 text-sm font-semibold uppercase tracking-wider mb-3">Suggested Package</h3>
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
            <h3 className="text-blue-400 text-sm font-semibold uppercase tracking-wider mb-3">Next Steps</h3>
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
              <h3 className="text-lg font-semibold mb-4">Send proposal to prospect</h3>
              <div className="space-y-3">
                <input value={leadName} onChange={e => setLeadName(e.target.value)} placeholder="Your name" className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email" type="email" className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
                <button onClick={submitEmail} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-semibold transition-all">Send Proposal</button>
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
        <span className="text-xs text-gray-400">
          {conversationMode ? (isSpeaking ? "George is talking..." : isListening ? "Listening..." : isLoading ? "Thinking..." : "Conversation mode") : voiceMode ? "Voice on" : ""}
        </span>
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
        {/* Proposal button removed — proposal auto-generates silently after conversation ends */}
        <div ref={chatEndRef} />
      </div>

      <div className="text-center px-4 pt-2">
        <p className="text-[10px] text-gray-600">
          By continuing this conversation, you agree to our{" "}
          <a href="/legal/partner-terms" className="underline hover:text-gray-400">Partner Terms</a> and{" "}
          <a href="/privacy" className="underline hover:text-gray-400">Privacy Policy</a>.
        </p>
      </div>
      <div className="p-3 border-t border-white/5">
        {/* Conversation mode: big center button */}
        {conversationMode ? (
          <div className="flex flex-col items-center gap-3 max-w-2xl mx-auto">
            <button
              onClick={toggleConversationMode}
              className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center transition-all shadow-lg shadow-red-500/30"
              title="End conversation"
            >
              {isSpeaking ? (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" /></svg>
              ) : isListening ? (
                <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              ) : (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
              )}
            </button>
            <p className="text-xs text-gray-500">
              {isSpeaking ? "George is talking..." : isListening ? "Listening to you..." : isLoading ? "Thinking..." : "Tap to end conversation"}
            </p>
            {/* Fallback text input in conversation mode */}
            <div className="flex gap-2 w-full">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
                placeholder="Or type here..."
                className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
              />
              <button onClick={() => sendMessage()} disabled={isLoading || !input.trim()} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-30 px-3 rounded-xl transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 max-w-2xl mx-auto">
            {/* Start Conversation button — enters continuous voice mode */}
            <button
              onClick={toggleConversationMode}
              className="w-12 h-12 rounded-full bg-green-600 hover:bg-green-500 flex items-center justify-center flex-shrink-0 transition-all"
              title="Start voice conversation with George"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
            {/* Speaker toggle */}
            <button
              onClick={() => {
                const next = !voiceMode;
                setVoiceMode(next);
                unlockAudio();
                if (next) {
                  const lastGeorge = [...messages].reverse().find(m => m.role === "george");
                  if (lastGeorge?.content) speak(lastGeorge.content, true);
                }
              }}
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${voiceMode ? "bg-blue-600" : "bg-white/10 hover:bg-white/20"}`}
              title={voiceMode ? "Turn off George's voice" : "Hear George speak"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {voiceMode
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                }
              </svg>
            </button>
            {/* Mic button */}
            <button
              onClick={isListening ? stopListening : startListening}
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${isListening ? "bg-red-500 animate-pulse" : "bg-white/10 hover:bg-white/20"}`}
              title={isListening ? "Stop listening" : "Talk to George"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { unlockAudio(); sendMessage(); } }}
              placeholder="Type your message..."
              className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
            />
            <button onClick={() => { unlockAudio(); sendMessage(); }} disabled={isLoading || !input.trim()} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-30 px-4 rounded-xl transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
// build 1772546820
