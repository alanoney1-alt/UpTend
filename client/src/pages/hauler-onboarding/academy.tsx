import { usePageTitle } from "@/hooks/use-page-title";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  ShieldCheck, DollarSign, TrendingUp, AlertTriangle,
  ArrowRight, ArrowLeft, CheckCircle, GraduationCap, Lock,
  Droplets, Home as HomeIcon, Hammer, Move, Trash2,
  Search, UserCheck, Star, Clock, Shield,
} from "lucide-react";
import { useLocation, Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface AcademyModule {
  id: string;
  skillType: string;
  title: string;
  icon: any;
  iconColor: string;
  required: boolean;
  description: string;
  lessons: string[];
  quiz: QuizQuestion[];
}

const MODULES: AcademyModule[] = [
  {
    id: "core_safety",
    skillType: "core_safety",
    title: "Customer Safety (Core)",
    icon: ShieldCheck,
    iconColor: "text-primary",
    required: true,
    description: "Required for all Pros. Learn professional standards, safety codes, and customer interaction protocols.",
    lessons: [
      "Always wear a collared shirt or UpTend gear. Introduce yourself by name.",
      "Display your Safety Code to the customer before starting any work.",
      "Never negotiate cash. All payments go through the app.",
      "Zero tolerance: No harassment, no illegal dumping, no sharing personal contact info.",
    ],
    quiz: [
      {
        question: "A customer opens the door. How do you greet them?",
        options: [
          "Where's the trash?",
          "Hi, I'm [Name] with UpTend. I'm here to help.",
        ],
        correct: 1,
        explanation: "First impressions matter. A professional greeting sets you apart.",
      },
      {
        question: "The customer offers to pay you cash directly. What do you do?",
        options: [
          "Accept the cash to avoid platform fees",
          "Politely decline and explain all payments go through the app",
        ],
        correct: 1,
        explanation: "Cash deals void your insurance, remove payout protection, and result in an instant ban.",
      },
    ],
  },
  {
    id: "junk_removal",
    skillType: "junk_removal",
    title: "Junk Removal",
    icon: Trash2,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    required: false,
    description: "Proper lifting mechanics, donation sorting, and responsible disposal.",
    lessons: [
      "Lift with your legs, not your back. Use a dolly for items over 50lbs.",
      "Sort items: Donate, Recycle, E-Waste, or Landfill. Upload disposal receipts for tax bonuses.",
      "Check for hazardous materials (paint, batteries, chemicals) before loading.",
    ],
    quiz: [
      {
        question: "You find cans of old paint during a cleanout. What do you do?",
        options: [
          "Toss them in the truck with everything else",
          "Set them aside as hazardous waste and note it in the app",
        ],
        correct: 1,
        explanation: "Paint is hazardous waste. Improper disposal is illegal and a liability risk.",
      },
      {
        question: "A customer adds a sofa to the haul. What do you do?",
        options: [
          "Take cash on the side for the extra item",
          "Use the 'Update Scope' tool in the app",
        ],
        correct: 1,
        explanation: "Updating scope in-app protects your payout and keeps insurance active.",
      },
    ],
  },
  {
    id: "pressure_washing",
    skillType: "pressure_washing",
    title: "Pressure Washing",
    icon: Droplets,
    iconColor: "text-blue-600 dark:text-blue-400",
    required: false,
    description: "PSI limits, chemical safety, and surface-specific techniques.",
    lessons: [
      "Concrete: 3,000-4,000 PSI. Wood decks: 500-600 PSI. Vinyl siding: 1,300-1,600 PSI.",
      "Always test a small area first. Start from the top and work down.",
      "Use sodium hypochlorite for mold, never mix chemicals, and wear eye protection.",
    ],
    quiz: [
      {
        question: "What PSI should you use on a wooden deck?",
        options: [
          "3,000+ PSI to blast off all the grime",
          "500-600 PSI to avoid damaging the wood",
        ],
        correct: 1,
        explanation: "High pressure destroys wood grain. Low pressure with proper detergent is the correct method.",
      },
      {
        question: "You're washing a house and notice mold on the siding. What chemical do you use?",
        options: [
          "Mix bleach and ammonia for maximum cleaning power",
          "Use sodium hypochlorite (bleach solution) only, never mix chemicals",
        ],
        correct: 1,
        explanation: "Mixing bleach and ammonia creates toxic chloramine gas. Only use approved single-chemical solutions.",
      },
    ],
  },
  {
    id: "gutter_cleaning",
    skillType: "gutter_cleaning",
    title: "Gutter Cleaning",
    icon: HomeIcon,
    iconColor: "text-amber-600 dark:text-amber-400",
    required: false,
    description: "Ladder safety, 2-story protocols, and proper debris removal.",
    lessons: [
      "Always use a stabilizer bar on extension ladders. 4-to-1 rule: 1 foot out for every 4 feet up.",
      "For 2-story homes, use a ladder standoff and never lean more than arm's reach.",
      "Check downspouts for clogs. Flush with a garden hose after clearing debris.",
    ],
    quiz: [
      {
        question: "You're setting up a ladder for a 2-story gutter job. What's your first step?",
        options: [
          "Just lean the ladder against the gutter and climb",
          "Attach a stabilizer bar and follow the 4-to-1 rule",
        ],
        correct: 1,
        explanation: "Leaning directly on gutters can crush them and cause falls. Always use proper stabilization.",
      },
      {
        question: "After clearing gutter debris, what's the final step?",
        options: [
          "Pack up and leave",
          "Flush downspouts with a hose to confirm proper flow",
        ],
        correct: 1,
        explanation: "Clogged downspouts defeat the purpose. Always verify water flows freely.",
      },
    ],
  },
  {
    id: "moving_labor",
    skillType: "moving_labor",
    title: "Moving Labor",
    icon: Move,
    iconColor: "text-violet-600 dark:text-violet-400",
    required: false,
    description: "Proper wrapping, loading sequence, and damage prevention.",
    lessons: [
      "Wrap all furniture in moving blankets. Use stretch wrap on drawers and doors.",
      "Load heavy items first (bottom), lighter on top. Fill gaps to prevent shifting.",
      "Photograph high-value items before moving. Communicate any pre-existing damage.",
    ],
    quiz: [
      {
        question: "How should you load a moving truck?",
        options: [
          "Put whatever fits first, fill in the gaps later",
          "Heavy items on the bottom, lighter on top, fill gaps to prevent shifting",
        ],
        correct: 1,
        explanation: "Proper loading prevents damage during transport and maximizes truck space.",
      },
      {
        question: "You notice a scratch on a customer's dresser before moving it. What do you do?",
        options: [
          "Don't mention it and hope they don't notice",
          "Photograph it and note the pre-existing damage in the app",
        ],
        correct: 1,
        explanation: "Documenting pre-existing damage protects you from false claims.",
      },
    ],
  },
  {
    id: "home_cleaning",
    skillType: "home_cleaning",
    title: "Home Cleaning",
    icon: HomeIcon,
    iconColor: "text-pink-600 dark:text-pink-400",
    required: false,
    description: "Professional cleaning standards, checklist completion, and before/after verification protocols.",
    lessons: [
      "Always follow the cleaning checklist in the app. Complete all tasks marked for the service type (standard/deep/move-in-out).",
      "Take BEFORE photos when you arrive (every room, all surfaces). Take AFTER photos when done. Our AI verifies cleanliness quality.",
      "Bring your own supplies if the customer selected that option. Use eco-friendly products when possible.",
      "Work systematically: Start high (ceiling fans, light fixtures), then surfaces, then floors. Leave the room spotless.",
      "Communicate delays or issues immediately. If you find additional cleaning needs beyond the scope, use 'Update Scope' in the app.",
    ],
    quiz: [
      {
        question: "You arrive at a home for a standard clean. What's your first step?",
        options: [
          "Start cleaning immediately to save time",
          "Take before photos of all areas, then begin following the checklist",
        ],
        correct: 1,
        explanation: "Before photos document the initial state and protect both you and the customer. They're also required for AI verification.",
      },
      {
        question: "You're 80% through the checklist but running late. What do you do?",
        options: [
          "Skip the remaining tasks and mark the job complete",
          "Notify the customer of the delay and complete all checklist items",
        ],
        correct: 1,
        explanation: "Incomplete checklists result in payment disputes and lower ratings. Always communicate delays and finish the work.",
      },
      {
        question: "What's the correct order for cleaning a room?",
        options: [
          "Floors first, then surfaces, then high areas",
          "High areas first (ceiling, lights), then surfaces, then floors last",
        ],
        correct: 1,
        explanation: "Cleaning top-to-bottom ensures dust and debris fall to lower areas that you'll clean afterward.",
      },
      {
        question: "A customer asks you to clean inside the oven, but it's not on the checklist. What do you do?",
        options: [
          "Do it for free to be nice",
          "Use the 'Update Scope' tool to add it as an add-on service",
        ],
        correct: 1,
        explanation: "Extra work deserves extra pay. The app protects your earnings by documenting scope changes.",
      },
    ],
  },
];

function AcademyPublicLanding() {
  const [badgeId, setBadgeId] = useState("");
  const [verifyResult, setVerifyResult] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    if (!badgeId.trim()) return;
    setVerifying(true);
    try {
      const res = await fetch(`/api/verify-badge/${encodeURIComponent(badgeId.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setVerifyResult(`Verified: ${data.name} is Active and Certified in ${data.specialty || "General Services"}.`);
      } else {
        setVerifyResult("Badge not found. Please check the ID and try again.");
      }
    } catch {
      setVerifyResult("Unable to verify at this time. Please try again later.");
    }
    setVerifying(false);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-16 mt-16">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 text-sm">
            <GraduationCap className="w-4 h-4 mr-1" /> The Pro Academy
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Every Pro on Our Platform is{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              Certified
            </span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
            Our Pros complete mandatory safety certification, background checks, and skill verification
            before they ever set foot on your property.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap">
            <Link href="/book">
              <Button size="lg" className="font-bold text-lg" data-testid="button-academy-book">
                Book a Certified Pro
              </Button>
            </Link>
            <Link href="/pro/signup">
              <Button variant="outline" size="lg" className="text-lg border-slate-600 text-slate-300" data-testid="button-academy-apply">
                Apply to Become a Pro
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            {
              icon: ShieldCheck,
              title: "Background Checked",
              desc: "Every Pro undergoes identity verification and background screening before activation.",
            },
            {
              icon: GraduationCap,
              title: "Academy Certified",
              desc: "Mandatory certification modules covering safety protocols, customer interaction, and proper handling.",
            },
            {
              icon: Star,
              title: "Performance Rated",
              desc: "Real-time ratings and reviews from verified customers. Low performers are automatically flagged.",
            },
          ].map((item) => (
            <Card key={item.title} className="p-6 bg-slate-800/50 border-slate-700">
              <item.icon className="w-10 h-10 text-cyan-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-slate-400">{item.desc}</p>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {[
            { icon: Shield, label: "$1M Insurance", desc: "Every job covered by comprehensive liability insurance" },
            { icon: Clock, label: "GPS Tracked", desc: "Real-time location tracking for every active job" },
            { icon: UserCheck, label: "Safety Codes", desc: "Unique verification codes confirm your Pro's identity" },
            { icon: CheckCircle, label: "Photo Documentation", desc: "Before/after photos create a verifiable record" },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-4 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="font-semibold text-white">{item.label}</p>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Card className="p-6 bg-slate-800/50 border-slate-700 max-w-lg mx-auto" data-testid="card-verify-badge">
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <Search className="w-5 h-5 text-cyan-400" />
            Verify a Pro
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            Enter a badge ID to verify your Pro's certification status.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. PRO-492"
              value={badgeId}
              onChange={(e) => setBadgeId(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
              data-testid="input-badge-id"
            />
            <Button onClick={handleVerify} disabled={verifying || !badgeId.trim()} data-testid="button-verify-badge">
              {verifying ? "Checking..." : "Verify"}
            </Button>
          </div>
          {verifyResult && (
            <p
              className={`mt-3 text-sm ${verifyResult.startsWith("Verified") ? "text-green-400" : "text-red-400"}`}
              data-testid="text-verify-result"
            >
              {verifyResult.startsWith("Verified") ? (
                <><CheckCircle className="w-4 h-4 inline mr-1" />{verifyResult}</>
              ) : verifyResult}
            </p>
          )}
        </Card>
      </div>
      <Footer />
    </div>
  );
}

export default function PyckerAcademy() {
  usePageTitle("Pro Academy | UpTend");
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated && (user?.role === "hauler" || user?.role === "pro")) {
    return <ProAcademyDashboard />;
  }

  return <AcademyPublicLanding />;
}

function ProAcademyDashboard() {
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [phase, setPhase] = useState<"lesson" | "quiz">("lesson");
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const [moduleScores, setModuleScores] = useState<Record<string, number>>({});
  const [certifying, setCertifying] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const currentModule = MODULES[currentModuleIndex];
  const currentQuiz = currentModule.quiz[currentQuizIndex];
  const coreComplete = completedModules.has("core_safety");
  const totalCompleted = completedModules.size;
  const overallProgress = (totalCompleted / MODULES.length) * 100;

  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    setShowResult(true);
  };

  const handleNextQuiz = () => {
    if (selectedAnswer !== currentQuiz.correct) {
      toast({
        title: "Incorrect Answer",
        description: "Review the lesson and try again.",
        variant: "destructive",
      });
      setSelectedAnswer(null);
      setShowResult(false);
      return;
    }

    const newScore = (moduleScores[currentModule.id] || 0) + 1;
    setModuleScores((prev) => ({ ...prev, [currentModule.id]: newScore }));

    if (currentQuizIndex < currentModule.quiz.length - 1) {
      setCurrentQuizIndex((i) => i + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      const scorePercent = (newScore / currentModule.quiz.length) * 100;
      if (scorePercent >= 80) {
        setCompletedModules((prev) => {
          const next = new Set<string>();
          prev.forEach((v) => next.add(v));
          next.add(currentModule.id);
          return next;
        });
        toast({
          title: `${currentModule.title} Passed!`,
          description: `Score: ${newScore}/${currentModule.quiz.length}. Badge unlocked.`,
        });
      } else {
        toast({
          title: "Certification Failed",
          description: `You scored ${scorePercent.toFixed(0)}%. You need 80% to pass. Retake the quiz.`,
          variant: "destructive",
        });
        setModuleScores((prev) => ({ ...prev, [currentModule.id]: 0 }));
        setCurrentQuizIndex(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setPhase("lesson");
        return;
      }
      setPhase("lesson");
      setCurrentQuizIndex(0);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const startQuiz = () => {
    if (currentModule.id !== "core_safety" && !coreComplete) {
      toast({
        title: "Core Safety Required",
        description: "You must pass the Core Safety module first.",
        variant: "destructive",
      });
      return;
    }
    setPhase("quiz");
    setCurrentQuizIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setModuleScores((prev) => ({ ...prev, [currentModule.id]: 0 }));
  };

  const completeCertification = async () => {
    setCertifying(true);
    try {
      const skills: string[] = [];
      completedModules.forEach((s) => skills.push(s));
      await apiRequest("POST", "/api/academy/certify", {
        skills,
        scores: moduleScores,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pro/career"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pro/certifications"] });
      toast({ title: "Certification Complete", description: "Your badges are active. You can now receive matching jobs." });
      setLocation("/pro/dashboard");
    } catch {
      toast({ title: "Error", description: "Could not complete certification. Try again.", variant: "destructive" });
    } finally {
      setCertifying(false);
    }
  };

  const isModuleComplete = (id: string) => completedModules.has(id);
  const isModuleLocked = (mod: AcademyModule) => mod.id !== "core_safety" && !coreComplete;
  const Icon = currentModule.icon;

  if (coreComplete && totalCompleted >= 1) {
    const allDone = totalCompleted === MODULES.length;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" data-testid="page-academy-progress">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6 pb-6 space-y-6">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold" data-testid="text-academy-title">Pro Academy</h2>
            </div>

            <Progress value={overallProgress} className="h-2" data-testid="progress-academy" />

            <div className="space-y-2">
              {MODULES.map((mod, i) => {
                const ModIcon = mod.icon;
                const done = isModuleComplete(mod.id);
                const locked = isModuleLocked(mod);
                return (
                  <div
                    key={mod.id}
                    className={`flex items-center justify-between gap-4 p-3 rounded-md border ${done ? "border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-900/10" : locked ? "opacity-50" : "border-border"}`}
                    data-testid={`module-row-${mod.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <ModIcon className={`w-5 h-5 ${mod.iconColor}`} />
                      <div>
                        <p className="text-sm font-medium">{mod.title}</p>
                        {mod.required && <Badge variant="secondary" className="text-[10px] mt-0.5">Required</Badge>}
                      </div>
                    </div>
                    {done ? (
                      <Badge variant="default" className="bg-emerald-600 text-white gap-1" data-testid={`badge-complete-${mod.id}`}>
                        <CheckCircle className="w-3 h-3" /> Passed
                      </Badge>
                    ) : locked ? (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCurrentModuleIndex(i);
                          setPhase("lesson");
                        }}
                        data-testid={`button-start-${mod.id}`}
                      >
                        Start
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {allDone && (
              <div className="text-center space-y-4 pt-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mx-auto">
                  <GraduationCap className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="font-bold text-lg" data-testid="text-all-complete">All Modules Complete</p>
              </div>
            )}

            <Button
              className="w-full gap-2"
              onClick={completeCertification}
              disabled={!coreComplete || certifying}
              data-testid="button-activate-account"
            >
              {certifying ? "Activating..." : `Activate My Account (${totalCompleted} badge${totalCompleted !== 1 ? "s" : ""})`}
              <ArrowRight className="w-4 h-4" />
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Core Safety is required. Additional badges unlock higher-paying job types.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" data-testid="page-academy">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 pb-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-lg" data-testid="text-academy-title">Pro Academy</h2>
            </div>
            <div className="flex items-center gap-2">
              {!isModuleComplete(currentModule.id) && (
                <Badge variant="secondary" data-testid="badge-module-name">
                  {currentModule.title}
                </Badge>
              )}
            </div>
          </div>

          {phase === "lesson" && !isModuleComplete(currentModule.id) && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                    <Icon className={`w-5 h-5 ${currentModule.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold" data-testid="text-module-title">
                      {currentModule.title}
                    </h3>
                    {currentModule.required && <Badge variant="secondary" className="text-[10px]">Required</Badge>}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground" data-testid="text-module-description">
                  {currentModule.description}
                </p>

                <div className="space-y-2">
                  {currentModule.lessons.map((lesson, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 rounded-md bg-muted text-sm">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <p>{lesson}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full gap-2" onClick={startQuiz} data-testid="button-start-quiz">
                Take the Quiz
                <ArrowRight className="w-4 h-4" />
              </Button>

              <div className="flex items-center gap-2 flex-wrap">
                {MODULES.map((mod, i) => (
                  <Button
                    key={mod.id}
                    variant={i === currentModuleIndex ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setCurrentModuleIndex(i);
                      setPhase("lesson");
                    }}
                    disabled={isModuleLocked(mod) && !isModuleComplete(mod.id)}
                    data-testid={`button-nav-${mod.id}`}
                    className="text-xs gap-1"
                  >
                    {isModuleComplete(mod.id) && <CheckCircle className="w-3 h-3" />}
                    {isModuleLocked(mod) && !isModuleComplete(mod.id) && <Lock className="w-3 h-3" />}
                    {mod.title.split(" ")[0]}
                  </Button>
                ))}
              </div>
            </>
          )}

          {phase === "quiz" && (
            <>
              <Progress
                value={((currentQuizIndex + (showResult ? 1 : 0)) / currentModule.quiz.length) * 100}
                className="h-2"
                data-testid="progress-quiz"
              />

              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold text-sm" data-testid="text-quiz-label">
                    Quiz: {currentModule.title}
                  </p>
                  <Badge variant="secondary" data-testid="badge-quiz-progress">
                    {currentQuizIndex + 1} / {currentModule.quiz.length}
                  </Badge>
                </div>
                <p className="text-sm italic text-muted-foreground" data-testid="text-quiz-question">
                  {currentQuiz.question}
                </p>

                <div className="space-y-2">
                  {currentQuiz.options.map((opt, i) => {
                    let extraClass = "";
                    if (showResult && i === currentQuiz.correct) {
                      extraClass = "border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200";
                    } else if (showResult && i === selectedAnswer && i !== currentQuiz.correct) {
                      extraClass = "border-destructive bg-destructive/10 text-destructive";
                    }
                    return (
                      <Button
                        key={i}
                        variant="outline"
                        className={`w-full justify-start text-left h-auto py-3 whitespace-normal ${extraClass}`}
                        onClick={() => handleAnswer(i)}
                        disabled={showResult}
                        data-testid={`button-answer-${i}`}
                      >
                        <span className="font-semibold mr-2 shrink-0">{String.fromCharCode(65 + i)}.</span>
                        {opt}
                      </Button>
                    );
                  })}
                </div>

                {showResult && (
                  <div className="p-3 rounded-md bg-muted text-sm" data-testid="text-explanation">
                    <p className="font-medium mb-1">
                      {selectedAnswer === currentQuiz.correct ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Correct
                        </span>
                      ) : (
                        <span className="text-destructive flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" /> Incorrect
                        </span>
                      )}
                    </p>
                    <p className="text-muted-foreground">{currentQuiz.explanation}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPhase("lesson");
                    setSelectedAnswer(null);
                    setShowResult(false);
                  }}
                  data-testid="button-back-to-lesson"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> Lesson
                </Button>
                <Button
                  className="flex-1 gap-2"
                  onClick={handleNextQuiz}
                  disabled={!showResult}
                  data-testid="button-next-quiz"
                >
                  {currentQuizIndex === currentModule.quiz.length - 1 ? "Submit" : "Next Question"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
