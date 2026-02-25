import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Scale, CheckCircle, Award, ArrowLeft, ArrowRight, Leaf, TrendingUp } from "lucide-react";

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

const QUIZ: QuizQuestion[] = [
  {
    question: 'What is a "Verified Recovery"?',
    options: [
      "Talking to the customer about the weather",
      "Snapping a photo of the recycling receipt or the empty, clean space",
    ],
    correctIndex: 1,
  },
  {
    question: "Why do we log material weights?",
    options: [
      "Because we like math",
      'To give the homeowner their "Insurance Shield" and "Green Record"',
    ],
    correctIndex: 1,
  },
  {
    question: 'What happens when you hit "Sentinel" status?',
    options: [
      "You get first access to high-value Property Management contracts",
      "You get a free pizza",
    ],
    correctIndex: 0,
  },
];

const TIERS = [
  { level: 1, name: "Steward", jobs: 0, perk: "Standard rates" },
  { level: 2, name: "Guardian", jobs: 10, perk: "5% bonus on Carbon Neutral jobs" },
  { level: 3, name: "Sentinel", jobs: 50, perk: "Priority Dispatch for Enterprise jobs" },
];

export default function ProSustainabilityCert() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [completed, setCompleted] = useState(false);

  const totalSlides = 3;

  const allCorrect = QUIZ.every(
    (q, i) => answers[i] === q.correctIndex
  );

  if (completed) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex flex-col items-center justify-center p-6 bg-background" data-testid="page-cert-success">
        <div className="bg-green-500 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
          <Award className="text-white w-10 h-10" />
        </div>
        <Badge variant="outline" className="text-green-600 dark:text-green-400 border-green-300 dark:border-green-700 mb-4">
          Sustainability Certified
        </Badge>
        <h1 className="text-2xl font-black text-center mb-2">Certification Complete</h1>
        <p className="text-muted-foreground text-center mb-8">
          You now have access to junk removal jobs and can earn Sustainability Points toward your Enterprise-Ready Badge.
        </p>

        <Card className="w-full mb-6">
          <CardContent className="p-6">
            <h3 className="font-bold mb-4">Your Path to Sentinel</h3>
            <div className="space-y-3">
              {TIERS.map((tier) => (
                <div
                  key={tier.level}
                  className={`flex items-center justify-between p-3 rounded-md border ${
                    tier.level === 1
                      ? "bg-primary/10 border-primary/20"
                      : "border-border"
                  }`}
                  data-testid={`tier-${tier.name.toLowerCase()}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                      tier.level === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {tier.level}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{tier.name}</p>
                      <p className="text-[10px] text-muted-foreground">{tier.jobs}+ verified hauls</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{tier.perk}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Link href="/pro/dashboard">
          <Button className="w-full" data-testid="button-unlock-jobs">
            Unlock Junk Removal Jobs
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen p-6" data-testid="page-pro-sustainability-cert">
      <div className="flex items-center justify-between mb-6">
        <Link href="/academy">
          <Button variant="ghost" size="sm" className="gap-1" data-testid="button-back-academy">
            <ArrowLeft className="w-4 h-4" />
            Academy
          </Button>
        </Link>
        <Badge variant="secondary" className="text-xs">
          {currentSlide + 1} of {totalSlides}
        </Badge>
      </div>

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Award className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-black mb-1" data-testid="text-cert-title">
          Sustainability Certification
        </h1>
        <p className="text-muted-foreground text-sm">
          Unlock high-value Enterprise & junk removal jobs.
        </p>
      </div>

      {currentSlide === 0 && (
        <Card className="mb-6" data-testid="slide-money-shot">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">
                1
              </div>
              <h3 className="font-bold">The "Money" Shot</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Before leaving the site, you MUST snap a photo of the empty space and your recycling receipt.
              This is the <strong>Proof of Impact</strong> that generates the homeowner's credit.
            </p>
            <div className="bg-muted aspect-video rounded-md flex items-center justify-center border-2 border-dashed border-border">
              <Camera className="text-muted-foreground w-8 h-8" />
            </div>
          </CardContent>
        </Card>
      )}

      {currentSlide === 1 && (
        <Card className="mb-6" data-testid="slide-log-weight">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">
                2
              </div>
              <h3 className="font-bold">Log the Weight</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Guessing is fine, but receipts are better. Every 100 lbs you recycle earns you <strong>Sustainability Points</strong>.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Metal: 150 lbs</Badge>
              <Badge variant="secondary">Wood: 40 lbs</Badge>
              <Badge variant="secondary">E-Waste: 12 lbs</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {currentSlide === 2 && (
        <div className="space-y-4 mb-6" data-testid="slide-quiz">
          <h3 className="font-bold text-center mb-2">Quick Certification Check</h3>
          {QUIZ.map((q, qi) => (
            <Card key={qi}>
              <CardContent className="p-4">
                <p className="font-bold text-sm mb-3">{q.question}</p>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <Button
                      key={oi}
                      type="button"
                      variant="outline"
                      onClick={() => setAnswers((prev) => ({ ...prev, [qi]: oi }))}
                      className={`w-full text-left justify-start whitespace-normal ${
                        answers[qi] === oi
                          ? answers[qi] === q.correctIndex
                            ? "bg-green-500/10 border-green-500 text-green-700 dark:text-green-300"
                            : "bg-destructive/10 border-destructive text-destructive"
                          : ""
                      }`}
                      data-testid={`quiz-${qi}-option-${oi}`}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        {currentSlide > 0 && (
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setCurrentSlide((s) => s - 1)}
            data-testid="button-prev-slide"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        )}
        {currentSlide < totalSlides - 1 ? (
          <Button
            className="flex-1"
            onClick={() => setCurrentSlide((s) => s + 1)}
            data-testid="button-next-slide"
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button
            className="flex-1"
            disabled={!allCorrect}
            onClick={() => setCompleted(true)}
            data-testid="button-complete-cert"
          >
            {allCorrect ? "I Understand. Unlock Jobs." : "Answer All Correctly"}
          </Button>
        )}
      </div>
    </div>
  );
}
