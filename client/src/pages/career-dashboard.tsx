import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { Footer } from "@/components/landing/footer";
import {
  ArrowLeft, Star, Award, TrendingUp, Loader2,
  Medal, ShieldCheck, Zap, Target, Lock, MessageCircle,
} from "lucide-react";

/* ─── Design Tokens ─── */
const T = {
  bg: "#FFFBF5",
  primary: "#F59E0B",
  primaryDark: "#D97706",
  text: "#1E293B",
  textMuted: "#64748B",
  card: "#FFFFFF",
};

function openGeorge(message?: string) {
  window.dispatchEvent(new CustomEvent("george:open", { detail: message ? { message } : undefined }));
}

function GeorgeAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const s = size === "sm" ? "w-10 h-10 text-lg" : size === "lg" ? "w-20 h-20 text-3xl" : "w-14 h-14 text-2xl";
  return (
    <div
      className={`${s} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}
      style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})` }}
    >
      G
    </div>
  );
}

function GeorgeSays({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl px-5 py-4 text-base leading-relaxed shadow-sm ${className}`} style={{ background: T.card, color: T.text }}>
      {children}
    </div>
  );
}

interface CareerStats {
  level: number;
  xpPoints: number;
  fiveStarRatingCount: number;
  isConsultantEligible: boolean;
  commissionRate: number;
  jobsCompleted: number;
  rating: string;
  levelName: string;
  progress: number;
  nextLevel: {
    level: number;
    title: string;
    requirements: any;
  } | null;
}

interface Certification {
  id: string;
  certType: string;
  earnedAt: string;
}

const levelConfig = [
  { level: 1, title: "Rookie", icon: Star, color: "text-amber-500", requiredJobs: 0, requiredStars: 0, payout: "75%" },
  { level: 2, title: "Verified Pro", icon: ShieldCheck, color: "text-green-500", requiredJobs: 10, requiredStars: 0, payout: "80%" },
  { level: 3, title: "Master Consultant", icon: Award, color: "text-amber-600", requiredJobs: 50, requiredStars: 40, payout: "85% + Commissions" },
];

export default function CareerDashboard() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const firstName = user?.firstName || "Pro";

  const { data: careerData, isLoading: careerLoading } = useQuery<CareerStats>({
    queryKey: ["/api/hauler/career"],
    enabled: isAuthenticated,
  });

  const { data: certifications = [], isLoading: certsLoading } = useQuery<Certification[]>({
    queryKey: ["/api/hauler/certifications"],
    enabled: isAuthenticated,
  });

  const isLoading = careerLoading || certsLoading;

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: T.bg }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: T.primary }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: T.bg }}>
        <GeorgeAvatar size="lg" />
        <GeorgeSays className="mt-6 max-w-md text-center">
          <p className="font-medium mb-3">Hey! Sign in so I can show you your career stats.</p>
          <Link href="/login">
            <Button style={{ background: T.primary }} className="text-white font-bold" data-testid="button-go-to-login">Sign In</Button>
          </Link>
        </GeorgeSays>
      </div>
    );
  }

  const currentLevel = careerData?.level || 1;
  const currentLevelConfig = levelConfig.find((l) => l.level === currentLevel) || levelConfig[0];
  const CurrentIcon = currentLevelConfig.icon;
  const jobs = careerData?.jobsCompleted || 0;
  const stars = careerData?.fiveStarRatingCount || 0;
  const xp = careerData?.xpPoints || 0;
  const rating = careerData?.rating || "N/A";

  return (
    <div className="min-h-screen" style={{ background: T.bg }} data-testid="page-career-dashboard">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-amber-100 backdrop-blur-md" style={{ background: `${T.bg}ee` }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})` }}>G</div>
            <span className="font-bold text-lg" style={{ color: T.text }}>UpTend</span>
          </Link>
          <Link href="/profile">
            <Button variant="ghost" size="sm" data-testid="button-back-profile">
              <ArrowLeft className="w-4 h-4 mr-2" /> Profile
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* George's Greeting */}
        <div className="flex flex-col items-center text-center">
          <GeorgeAvatar size="lg" />
          <h1 className="mt-4 text-2xl font-bold" style={{ color: T.text }}>
            Hey {firstName}, here's your day
          </h1>
          <p className="mt-1 text-sm" style={{ color: T.textMuted }}>
            Your Home Health Expert has your career briefing ready
          </p>
        </div>

        {/* George's Briefing Bubble */}
        <div className="flex items-start gap-3">
          <GeorgeAvatar size="sm" />
          <GeorgeSays className="flex-1">
            <p>
              You're a <strong>{currentLevelConfig.title}</strong> with <strong>{jobs}</strong> jobs completed
              and <strong>{stars}</strong> five-star reviews.
              {rating !== "N/A" && <> Your rating is <strong>{rating}</strong>.</>}
              {currentLevel < 3 && careerData?.nextLevel && (
                <> You're <strong>{careerData.progress || 0}%</strong> of the way to <strong>{levelConfig[currentLevel]?.title}</strong>!</>
              )}
              {currentLevel >= 3 && <> You've reached the top tier — incredible work! 🏆</>}
            </p>
          </GeorgeSays>
        </div>

        {/* Level Hero */}
        <div className="rounded-2xl p-6 text-center border border-amber-100 shadow-sm" style={{ background: T.card }} data-testid="card-level-hero">
          <CurrentIcon className={`w-16 h-16 mx-auto ${currentLevelConfig.color}`} />
          <h2 className="text-2xl font-bold mt-3" style={{ color: T.text }} data-testid="text-level-title">
            {currentLevelConfig.title}
          </h2>
          <Badge className="mt-2 bg-amber-100 text-amber-700 border-0">Level {currentLevel}</Badge>
          <p className="text-sm mt-2" style={{ color: T.textMuted }}>Payout Rate: {currentLevelConfig.payout}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Zap, value: xp, label: "XP Points", color: "text-amber-500", bg: "bg-amber-50" },
            { icon: Target, value: jobs, label: "Completed", color: "text-blue-500", bg: "bg-blue-50" },
            { icon: Star, value: stars, label: "5-Star Reviews", color: "text-yellow-500", bg: "bg-yellow-50" },
            { icon: Medal, value: rating, label: "Rating", color: "text-green-500", bg: "bg-green-50" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl p-4 text-center border border-amber-100 shadow-sm"
              style={{ background: T.card }}
              data-testid={`card-stat-${stat.label.toLowerCase().replace(/\s/g, "-")}`}
            >
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-2`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold" style={{ color: T.text }}>{stat.value}</p>
              <p className="text-xs" style={{ color: T.textMuted }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Next Level Progress */}
        {currentLevel < 3 && (
          <div className="rounded-2xl p-5 border border-amber-100 shadow-sm" style={{ background: T.card }} data-testid="card-next-level">
            <div className="flex justify-between mb-2 gap-2 flex-wrap">
              <div>
                <h3 className="font-bold" style={{ color: T.text }}>Next: {levelConfig[currentLevel].title}</h3>
                <p className="text-xs" style={{ color: T.textMuted }}>Level {currentLevel + 1}</p>
              </div>
              <Badge className="bg-amber-50 text-amber-700 border-0">
                <TrendingUp className="w-3 h-3 mr-1" />
                {careerData?.progress || 0}%
              </Badge>
            </div>
            <Progress value={careerData?.progress || 0} className="h-2 mb-3" />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2" style={{ color: T.text }}>
                <Target className="w-4 h-4" style={{ color: T.textMuted }} />
                <span>{jobs} / {levelConfig[currentLevel].requiredJobs} Jobs</span>
              </div>
              {levelConfig[currentLevel].requiredStars > 0 && (
                <div className="flex items-center gap-2" style={{ color: T.text }}>
                  <Star className="w-4 h-4" style={{ color: T.textMuted }} />
                  <span>{stars} / {levelConfig[currentLevel].requiredStars} Stars</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Career Ladder */}
        <div className="rounded-2xl p-5 border border-amber-100 shadow-sm" style={{ background: T.card }} data-testid="card-career-ladder">
          <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: T.text }}>
            <TrendingUp className="w-5 h-5" style={{ color: T.primary }} />
            Career Ladder
          </h3>
          <div className="space-y-4">
            {levelConfig.map((level) => {
              const unlocked = currentLevel >= level.level;
              const LevelIcon = level.icon;
              return (
                <div key={level.level} className="flex gap-3 items-center" data-testid={`level-row-${level.level}`}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${unlocked ? "bg-amber-50" : "bg-gray-100"}`}
                  >
                    {unlocked ? (
                      <LevelIcon className={`w-5 h-5 ${level.color}`} />
                    ) : (
                      <Lock className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm ${unlocked ? "" : "opacity-50"}`} style={{ color: T.text }}>
                      {level.title}
                    </p>
                    <p className="text-xs" style={{ color: T.textMuted }}>
                      {level.level === 1 ? "Starting level" : `${level.requiredJobs} jobs${level.requiredStars > 0 ? ` + ${level.requiredStars} five-star reviews` : ""}`}
                    </p>
                  </div>
                  <Badge className={unlocked ? "bg-amber-100 text-amber-700 border-0" : "bg-gray-100 text-gray-500 border-0"}>
                    {level.payout}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Certifications */}
        {certifications.length > 0 && (
          <div className="rounded-2xl p-5 border border-amber-100 shadow-sm" style={{ background: T.card }} data-testid="card-certifications">
            <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: T.text }}>
              <Award className="w-5 h-5" style={{ color: T.primary }} />
              Certifications
            </h3>
            <div className="flex gap-2 flex-wrap">
              {certifications.map((cert) => (
                <Badge key={cert.id} className="bg-amber-50 text-amber-700 border-0" data-testid={`badge-cert-${cert.id}`}>
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  {cert.certType.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Consultation Unlock */}
        {careerData?.isConsultantEligible && (
          <div
            className="rounded-2xl p-5 border-2 shadow-sm"
            style={{ background: "linear-gradient(135deg, #FFFDF7, #FFF8E7)", borderColor: `${T.primary}40` }}
            data-testid="card-consultation-unlock"
          >
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8" style={{ color: T.primary }} />
              <div>
                <h3 className="font-bold" style={{ color: T.text }}>Consultation Mode Unlocked 🎉</h3>
                <p className="text-sm" style={{ color: T.textMuted }}>
                  You can perform $99 Home Assessments and earn {careerData.commissionRate}% commission.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Ask George CTA */}
        <div className="text-center pt-2">
          <button
            onClick={() => openGeorge("How can I level up faster?")}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-white font-bold shadow-lg hover:shadow-xl transition-shadow"
            style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})` }}
          >
            <MessageCircle className="w-5 h-5" />
            Ask George for tips
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
