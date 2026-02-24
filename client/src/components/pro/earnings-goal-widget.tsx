import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Target, TrendingUp, Flame, Trophy, Zap, Award, Calendar, 
  ArrowUp, ArrowDown, Clock, DollarSign, CheckCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EarningsTrackData {
  profile: {
    annualIncomeGoal: number;
    availableHoursPerWeek: number;
    currentStreakWeeks: number;
    longestStreakWeeks: number;
    earningsLevel: string;
    careerTotalEarnings: number;
  };
  jobTrack: {
    weeklyTarget: number;
    avgPayout: number;
    jobsPerWeek: number;
    hoursNeeded: number;
    recommendation: string;
    canMeetGoal: boolean;
    certUpgrade?: {
      currentJobsPerWeek: number;
      withCertJobsPerWeek: number;
      savings: string;
    };
  } | null;
  progress: {
    ytdEarnings: number;
    ytdJobs: number;
    progressPercent: number;
    paceStatus: "ahead" | "on_track" | "behind";
    earningsLevel: string;
    weeksPassed: number;
  };
  thisWeek: {
    earnings: number;
    jobs: number;
    weeklyTarget: number;
    targetMet: boolean;
  };
  milestones: Array<{
    id: string;
    milestoneType: string;
    milestoneValue: string;
    achievedAt: string;
  }>;
}

const LEVEL_CONFIGS = {
  starter: { label: "Starter", color: "bg-gray-500", icon: "", range: "$0-$10K" },
  rising: { label: "Rising", color: "bg-blue-500", icon: "", range: "$10K-$25K" },
  pro: { label: "Pro", color: "bg-purple-500", icon: "", range: "$25K-$50K" },
  elite: { label: "Elite", color: "bg-amber-500", icon: "", range: "$50K-$100K" },
  legend: { label: "Legend", color: "bg-gradient-to-r from-amber-400 to-orange-500", icon: "", range: "$100K+" },
};

const GOAL_PRESETS = [30000, 45000, 60000, 75000, 100000, 120000];

export function EarningsGoalWidget() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showSetup, setShowSetup] = useState(false);
  const [customGoal, setCustomGoal] = useState("");
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);

  const { data, isLoading } = useQuery<EarningsTrackData>({
    queryKey: ["/api/pro/earnings-track"],
  });

  const setupMutation = useMutation({
    mutationFn: async ({ goal, hours }: { goal: number; hours?: number }) => {
      const res = await apiRequest("POST", "/api/pro/income-goal", {
        annualIncomeGoal: goal,
        availableHoursPerWeek: hours,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Income goal set! ", description: "Your personalized job track is ready." });
      setShowSetup(false);
      queryClient.invalidateQueries({ queryKey: ["/api/pro/earnings-track"] });
    },
    onError: (err: Error) => {
      toast({ title: "Setup failed", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  // Show setup if no goal is set
  if (!data?.profile.annualIncomeGoal || showSetup) {
    return (
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <div className="text-center mb-6">
          <Target className="w-12 h-12 mx-auto mb-4 text-blue-600" />
          <h3 className="text-xl font-bold mb-2">Set Your Annual Income Goal</h3>
          <p className="text-muted-foreground">
            We'll create a personalized job track to help you hit your target
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {GOAL_PRESETS.map((goal) => (
            <Button
              key={goal}
              variant={selectedGoal === goal ? "default" : "outline"}
              onClick={() => setSelectedGoal(goal)}
              className="text-sm h-12"
            >
              ${goal.toLocaleString()}
            </Button>
          ))}
        </div>

        <div className="mb-6">
          <Label htmlFor="customGoal">Custom Goal</Label>
          <Input
            id="customGoal"
            placeholder="e.g., 80000"
            value={customGoal}
            onChange={(e) => {
              setCustomGoal(e.target.value);
              setSelectedGoal(null);
            }}
            className="mt-1"
          />
        </div>

        <Button
          onClick={() => {
            const goal = selectedGoal || parseInt(customGoal);
            if (goal && goal > 0) {
              setupMutation.mutate({ goal });
            }
          }}
          disabled={setupMutation.isPending || (!selectedGoal && !customGoal)}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          Set Income Goal & Get My Job Track
        </Button>
      </Card>
    );
  }

  const { profile, jobTrack, progress, thisWeek, milestones } = data;
  const levelConfig = LEVEL_CONFIGS[profile.earningsLevel as keyof typeof LEVEL_CONFIGS];

  return (
    <div className="space-y-6">
      {/* Main Progress Ring */}
      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress.progressPercent / 100)}`}
                className="text-green-600 transition-all duration-1000"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">
                  {Math.round(progress.progressPercent)}%
                </div>
                <div className="text-xs text-green-600">of goal</div>
              </div>
            </div>
          </div>

          <div className="flex-1 text-center lg:text-left">
            <h3 className="text-2xl font-bold mb-2">
              ${progress.ytdEarnings.toLocaleString()} / ${profile.annualIncomeGoal.toLocaleString()}
            </h3>
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-3">
              <Badge 
                variant="outline"
                className={cn(
                  progress.paceStatus === "ahead" && "border-green-500 text-green-700",
                  progress.paceStatus === "on_track" && "border-blue-500 text-blue-700", 
                  progress.paceStatus === "behind" && "border-red-500 text-red-700"
                )}
              >
                {progress.paceStatus === "ahead" && <ArrowUp className="w-3 h-3 mr-1" />}
                {progress.paceStatus === "behind" && <ArrowDown className="w-3 h-3 mr-1" />}
                {progress.paceStatus === "on_track" && <Target className="w-3 h-3 mr-1" />}
                {progress.paceStatus === "ahead" ? "Ahead of Pace" : 
                 progress.paceStatus === "behind" ? "Behind Pace" : "On Track"}
              </Badge>
              
              <Badge className={levelConfig.color}>
                {levelConfig.icon} {levelConfig.label}
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {progress.ytdJobs} jobs completed • {progress.weeksPassed} weeks into the year
            </p>
          </div>
        </div>
      </Card>

      {/* This Week Progress */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold">This Week</h4>
          </div>
          {thisWeek.targetMet && (
            <Badge className="bg-green-100 text-green-700 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              Target Hit!
            </Badge>
          )}
        </div>
        
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span>${thisWeek.earnings.toLocaleString()} earned</span>
            <span>${thisWeek.weeklyTarget.toLocaleString()} target</span>
          </div>
          <Progress 
            value={(thisWeek.earnings / thisWeek.weeklyTarget) * 100} 
            className="h-2"
          />
        </div>
        
        <p className="text-sm text-muted-foreground">
          {thisWeek.jobs} jobs completed
        </p>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Streak Counter */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <h4 className="font-semibold">Streak</h4>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {profile.currentStreakWeeks} 
            </div>
            <p className="text-sm text-muted-foreground">
              consecutive weeks • best: {profile.longestStreakWeeks}
            </p>
          </div>
        </Card>

        {/* Job Track */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-purple-500" />
            <h4 className="font-semibold">Your Path</h4>
          </div>
          
          {jobTrack && (
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">{jobTrack.jobsPerWeek} jobs/week</span>
                <span className="text-muted-foreground"> @ ${jobTrack.avgPayout} avg</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {jobTrack.hoursNeeded}h needed • {jobTrack.canMeetGoal ? "" : ""} {jobTrack.canMeetGoal ? "Achievable" : "Stretch"}
              </div>
              
              {jobTrack.certUpgrade && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs font-medium text-amber-800 mb-1"> Pro Tip</p>
                  <p className="text-xs text-amber-700">
                    Get B2B certification → {jobTrack.certUpgrade.withCertJobsPerWeek} jobs/week
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Milestones */}
      {milestones.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h4 className="font-semibold">Recent Achievements</h4>
          </div>
          
          <div className="space-y-2">
            {milestones.slice(0, 3).map((milestone) => (
              <div key={milestone.id} className="flex items-center gap-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <Award className="w-4 h-4 text-yellow-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {milestone.milestoneType.replace("_", " ")} milestone
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {milestone.milestoneValue} • {new Date(milestone.achievedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Button 
          variant="outline"
          onClick={() => setShowSetup(true)}
          size="sm"
        >
          Adjust Goal
        </Button>
        <Button 
          variant="outline"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/pro/earnings-track"] })}
          size="sm"
        >
          Refresh
        </Button>
      </div>
    </div>
  );
}