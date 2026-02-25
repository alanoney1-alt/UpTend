import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowLeft, Truck, Star, Award, TrendingUp, Loader2,
  Medal, ShieldCheck, Zap, Target, Lock, ChevronDown, ChevronUp, Building2
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { MyRates } from "@/components/pro/my-rates";
import { InsuranceStatusCard } from "@/components/pro/insurance-status";
import { useState } from "react";

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
  { level: 1, title: "Rookie", icon: Star, color: "text-primary", requiredJobs: 0, requiredStars: 0, payout: "75%" },
  { level: 2, title: "Verified Pro", icon: ShieldCheck, color: "text-green-500", requiredJobs: 10, requiredStars: 0, payout: "80%" },
  { level: 3, title: "Master Consultant", icon: Award, color: "text-amber-500", requiredJobs: 50, requiredStars: 40, payout: "85% + Commissions" },
];

function BusinessPartnerSection() {
  const { data: bpCheck } = useQuery<any>({
    queryKey: ["/api/business-partner/check"],
  });

  if (!bpCheck?.isBusinessPartner && !bpCheck?.isEmployee) return null;

  const bp = bpCheck.businessPartner;
  if (!bp) return null;

  return (
    <Card className="p-5 border-amber-200 bg-amber-50/50">
      <div className="flex items-center gap-3">
        <Building2 className="w-8 h-8 text-[#ea580c]" />
        <div className="flex-1">
          {bpCheck.isEmployee ? (
            <>
              <h3 className="font-bold">You are part of {bp.companyName}'s team</h3>
              <p className="text-sm text-muted-foreground">
                Business-routed jobs are managed by your company. Your independent jobs and reviews are always yours.
              </p>
            </>
          ) : (
            <>
              <h3 className="font-bold">{bp.companyName} -- Business Partner</h3>
              <p className="text-sm text-muted-foreground">
                <Link href="/business/partner-dashboard" className="text-[#ea580c] hover:underline">
                  Go to Business Dashboard
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

function MyRatesSection() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Card className="p-5" data-testid="card-my-rates">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between"
      >
        <h3 className="font-bold flex items-center gap-2">
          <Target className="w-5 h-5 text-[#ea580c]" />
          My Rates
        </h3>
        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {isOpen && (
        <div className="mt-4">
          <MyRates />
        </div>
      )}
    </Card>
  );
}

export default function CareerDashboard() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 max-w-md text-center">
          <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h2 className="text-xl font-bold mb-2">Sign In Required</h2>
          <p className="text-muted-foreground mb-4">Please sign in to view your career dashboard.</p>
          <Link href="/login">
            <Button data-testid="button-go-to-login">Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const currentLevel = careerData?.level || 1;
  const currentLevelConfig = levelConfig.find((l) => l.level === currentLevel) || levelConfig[0];
  const CurrentIcon = currentLevelConfig.icon;

  return (
    <div className="min-h-screen bg-background" data-testid="page-career-dashboard">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-2 flex-wrap">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="w-10 h-10" textClassName="text-xl" />
          </Link>
          <Link href="/profile">
            <Button variant="ghost" size="sm" data-testid="button-back-profile">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <Card className="p-6 text-center" data-testid="card-level-hero">
          <CurrentIcon className={`w-16 h-16 mx-auto ${currentLevelConfig.color}`} />
          <h1 className="text-2xl font-bold mt-3" data-testid="text-level-title">
            {currentLevelConfig.title}
          </h1>
          <Badge variant="secondary" className="mt-2">
            Level {currentLevel}
          </Badge>
          <p className="text-muted-foreground text-sm mt-2">
            Payout Rate: {currentLevelConfig.payout}
          </p>
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4 text-center" data-testid="card-stat-xp">
            <Zap className="w-5 h-5 mx-auto text-amber-500 mb-1" />
            <p className="text-2xl font-bold">{careerData?.xpPoints || 0}</p>
            <p className="text-xs text-muted-foreground">XP Points</p>
          </Card>
          <Card className="p-4 text-center" data-testid="card-stat-jobs">
            <Target className="w-5 h-5 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{careerData?.jobsCompleted || 0}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </Card>
          <Card className="p-4 text-center" data-testid="card-stat-stars">
            <Star className="w-5 h-5 mx-auto text-yellow-500 mb-1" />
            <p className="text-2xl font-bold">{careerData?.fiveStarRatingCount || 0}</p>
            <p className="text-xs text-muted-foreground">5-Star Reviews</p>
          </Card>
          <Card className="p-4 text-center" data-testid="card-stat-rating">
            <Medal className="w-5 h-5 mx-auto text-green-500 mb-1" />
            <p className="text-2xl font-bold">{careerData?.rating || "N/A"}</p>
            <p className="text-xs text-muted-foreground">Rating</p>
          </Card>
        </div>

        {currentLevel < 3 && (
          <Card className="p-5" data-testid="card-next-level">
            <div className="flex justify-between mb-2 gap-2 flex-wrap">
              <div>
                <h3 className="font-bold">Next: {levelConfig[currentLevel].title}</h3>
                <p className="text-xs text-muted-foreground">Level {currentLevel + 1}</p>
              </div>
              <Badge variant="outline">
                <TrendingUp className="w-3 h-3 mr-1" />
                {careerData?.progress || 0}%
              </Badge>
            </div>
            <Progress value={careerData?.progress || 0} className="h-2 mb-3" />

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span>
                  {careerData?.jobsCompleted || 0} / {levelConfig[currentLevel].requiredJobs} Jobs
                </span>
              </div>
              {levelConfig[currentLevel].requiredStars > 0 && (
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {careerData?.fiveStarRatingCount || 0} / {levelConfig[currentLevel].requiredStars} Stars
                  </span>
                </div>
              )}
            </div>
          </Card>
        )}

        <Card className="p-5" data-testid="card-career-ladder">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Career Ladder
          </h3>
          <div className="space-y-4">
            {levelConfig.map((level) => {
              const unlocked = currentLevel >= level.level;
              const LevelIcon = level.icon;
              return (
                <div key={level.level} className="flex gap-3 items-center" data-testid={`level-row-${level.level}`}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      unlocked
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {unlocked ? (
                      <LevelIcon className="w-5 h-5" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm ${unlocked ? "" : "text-muted-foreground"}`}>
                      {level.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {level.level === 1
                        ? "Starting level"
                        : `${level.requiredJobs} jobs${level.requiredStars > 0 ? ` + ${level.requiredStars} five-star reviews` : ""}`}
                    </p>
                  </div>
                  <Badge variant={unlocked ? "default" : "outline"} className="shrink-0">
                    {level.payout}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Tax Center Link */}
        <Card className="p-5">
          <Link href="/tax-center" className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-[#ea580c]" />
              <div>
                <h3 className="font-bold">Tax Center</h3>
                <p className="text-xs text-muted-foreground">View earnings reports, download tax documents</p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground -rotate-90 group-hover:text-[#ea580c]" />
          </Link>
        </Card>

        {/* Insurance Status */}
        <InsuranceStatusCard />

        {/* Business Partner Section */}
        <BusinessPartnerSection />

        {/* My Rates Section */}
        <MyRatesSection />

        {certifications.length > 0 && (
          <Card className="p-5" data-testid="card-certifications">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Certifications
            </h3>
            <div className="flex gap-2 flex-wrap">
              {certifications.map((cert) => (
                <Badge key={cert.id} variant="secondary" data-testid={`badge-cert-${cert.id}`}>
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  {cert.certType.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        {careerData?.isConsultantEligible && (
          <Card className="p-5 border-primary/30 bg-primary/5" data-testid="card-consultation-unlock">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-primary" />
              <div>
                <h3 className="font-bold">Consultation Mode Unlocked</h3>
                <p className="text-sm text-muted-foreground">
                  You can perform $99 Home Assessments and earn {careerData.commissionRate}% commission.
                </p>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
