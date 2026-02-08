import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Gift, Star, Trophy, ArrowLeft, Crown, Zap, 
  TrendingUp, Clock, DollarSign, CheckCircle, Sparkles
} from "lucide-react";
import type { LoyaltyAccount, LoyaltyTransaction, LoyaltyReward } from "@shared/schema";
import { LOYALTY_TIER_CONFIG, POINTS_PER_DOLLAR } from "@shared/schema";

const tierIcons: Record<string, typeof Crown> = {
  bronze: Star,
  silver: Trophy,
  gold: Crown,
  platinum: Sparkles,
};

const tierColors: Record<string, string> = {
  bronze: "text-amber-600",
  silver: "text-slate-400",
  gold: "text-yellow-500",
  platinum: "text-purple-500",
};

const tierBgColors: Record<string, string> = {
  bronze: "bg-amber-600/10",
  silver: "bg-slate-400/10",
  gold: "bg-yellow-500/10",
  platinum: "bg-purple-500/10",
};

export default function Loyalty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const demoUserId = "demo-customer";

  const { data, isLoading } = useQuery<{ 
    account: LoyaltyAccount; 
    transactions: LoyaltyTransaction[];
    availableRewards: LoyaltyReward[];
  }>({
    queryKey: ["/api/loyalty", demoUserId],
    queryFn: async () => {
      const res = await fetch(`/api/loyalty/${demoUserId}`);
      if (!res.ok) throw new Error("Failed to fetch loyalty data");
      return res.json();
    },
  });

  const redeemMutation = useMutation({
    mutationFn: async (rewardId: string) => {
      const response = await apiRequest("POST", `/api/loyalty/${demoUserId}/redeem`, { rewardId });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty", demoUserId] });
      toast({
        title: "Reward Redeemed!",
        description: `You've successfully redeemed: ${data.reward.name}`,
      });
    },
    onError: (error: Error) => {
      let errorMessage = "Unable to redeem reward. Please try again.";
      try {
        const errorText = error.message;
        if (errorText.includes(":")) {
          const jsonPart = errorText.substring(errorText.indexOf(":") + 1).trim();
          const parsed = JSON.parse(jsonPart);
          if (parsed.error) {
            errorMessage = parsed.error;
          }
        }
      } catch {
        if (error.message) {
          errorMessage = error.message;
        }
      }
      toast({
        title: "Redemption Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Gift className="w-6 h-6 text-primary" />
                <span className="text-xl font-bold">Rewards</span>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-48 w-full mb-6" />
          <div className="grid md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </main>
      </div>
    );
  }

  const account = data?.account;
  const transactions = data?.transactions || [];
  const availableRewards = data?.availableRewards || [];

  const currentTier = account?.currentTier || "bronze";
  const currentPoints = account?.currentPoints || 0;
  const lifetimePoints = account?.lifetimePoints || 0;
  
  const TierIcon = tierIcons[currentTier] || Star;
  const tierInfo = LOYALTY_TIER_CONFIG[currentTier as keyof typeof LOYALTY_TIER_CONFIG];
  
  const tiers = ["bronze", "silver", "gold", "platinum"];
  const currentTierIndex = tiers.indexOf(currentTier);
  const nextTier = currentTierIndex < tiers.length - 1 ? tiers[currentTierIndex + 1] : null;
  const nextTierInfo = nextTier ? LOYALTY_TIER_CONFIG[nextTier as keyof typeof LOYALTY_TIER_CONFIG] : null;
  const progressToNextTier = nextTierInfo 
    ? Math.min((lifetimePoints / nextTierInfo.minPoints) * 100, 100) 
    : 100;
  const pointsToNextTier = nextTierInfo ? Math.max(nextTierInfo.minPoints - lifetimePoints, 0) : 0;

  return (
    <div className="min-h-screen bg-background" data-testid="page-loyalty">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Gift className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">UpTend Rewards</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className={`mb-8 overflow-hidden ${tierBgColors[currentTier]}`}>
          <div className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-full ${tierBgColors[currentTier]}`}>
                  <TierIcon className={`w-12 h-12 ${tierColors[currentTier]}`} />
                </div>
                <div>
                  <h2 className="text-sm text-muted-foreground">Your Status</h2>
                  <h1 className={`text-3xl font-bold capitalize ${tierColors[currentTier]}`} data-testid="current-tier">
                    {currentTier} Member
                  </h1>
                  <p className="text-muted-foreground">
                    {tierInfo?.discountPercent > 0 && `${tierInfo.discountPercent}% discount on all jobs`}
                    {tierInfo?.priorityMatching && " • Priority matching"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Available Points</p>
                <p className="text-4xl font-bold text-primary" data-testid="current-points">
                  {currentPoints.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Earn {POINTS_PER_DOLLAR} points per $1 spent
                </p>
              </div>
            </div>

            {nextTier && (
              <div className="mt-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="capitalize">{currentTier}</span>
                  <span className="text-muted-foreground">
                    {pointsToNextTier.toLocaleString()} points to {nextTier}
                  </span>
                  <span className={`capitalize ${tierColors[nextTier]}`}>{nextTier}</span>
                </div>
                <Progress value={progressToNextTier} className="h-2" />
              </div>
            )}
          </div>
        </Card>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {tiers.map((tier, index) => {
            const info = LOYALTY_TIER_CONFIG[tier as keyof typeof LOYALTY_TIER_CONFIG];
            const Icon = tierIcons[tier];
            const isCurrentTier = tier === currentTier;
            const isUnlocked = index <= currentTierIndex;

            return (
              <Card 
                key={tier} 
                className={`p-4 ${isCurrentTier ? 'ring-2 ring-primary' : ''} ${!isUnlocked ? 'opacity-50' : ''}`}
                data-testid={`tier-card-${tier}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-5 h-5 ${tierColors[tier]}`} />
                  <h3 className={`font-semibold capitalize ${tierColors[tier]}`}>{tier}</h3>
                  {isCurrentTier && <Badge variant="secondary" className="ml-auto text-xs">Current</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {info.minPoints.toLocaleString()}+ points
                </p>
                <ul className="text-xs space-y-1">
                  {info.discountPercent > 0 && (
                    <li className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {info.discountPercent}% discount
                    </li>
                  )}
                  {info.priorityMatching && (
                    <li className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Priority matching
                    </li>
                  )}
                </ul>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="rewards" className="space-y-6">
          <TabsList>
            <TabsTrigger value="rewards">Available Rewards</TabsTrigger>
            <TabsTrigger value="history">Points History</TabsTrigger>
          </TabsList>

          <TabsContent value="rewards" className="space-y-4">
            <h2 className="text-xl font-semibold">Redeem Your Points</h2>
            
            {availableRewards.length === 0 ? (
              <Card className="p-8 text-center">
                <Gift className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Rewards Available</h3>
                <p className="text-muted-foreground">Check back soon for new rewards!</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableRewards.filter(r => r.isActive).map(reward => {
                  const canAfford = currentPoints >= reward.pointsCost;
                  
                  return (
                    <Card key={reward.id} className="overflow-hidden" data-testid={`reward-${reward.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{reward.name}</CardTitle>
                          <Badge variant={canAfford ? "default" : "secondary"}>
                            {reward.pointsCost.toLocaleString()} pts
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{reward.description}</p>
                        
                        {reward.discountAmount && (
                          <p className="text-sm font-medium text-green-600">
                            ${reward.discountAmount} off your next job
                          </p>
                        )}
                        {reward.discountPercent && (
                          <p className="text-sm font-medium text-green-600">
                            {reward.discountPercent}% off your next job
                          </p>
                        )}

                        <Button 
                          className="w-full" 
                          disabled={!canAfford || redeemMutation.isPending}
                          onClick={() => redeemMutation.mutate(reward.id)}
                          data-testid={`redeem-${reward.id}`}
                        >
                          {!canAfford 
                            ? `Need ${(reward.pointsCost - currentPoints).toLocaleString()} more pts`
                            : redeemMutation.isPending 
                              ? "Redeeming..." 
                              : "Redeem Reward"
                          }
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <h2 className="text-xl font-semibold">Points Activity</h2>
            
            {transactions.length === 0 ? (
              <Card className="p-8 text-center">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Activity Yet</h3>
                <p className="text-muted-foreground">
                  Complete your first job to start earning points!
                </p>
                <Link href="/booking">
                  <Button className="mt-4">Book Now</Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-2">
                {transactions.slice(0, 20).map(tx => (
                  <Card key={tx.id} className="p-4" data-testid={`transaction-${tx.id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${tx.type === 'earned' ? 'bg-green-500/10' : 'bg-orange-500/10'}`}>
                          {tx.type === 'earned' 
                            ? <TrendingUp className="w-4 h-4 text-green-500" />
                            : <Gift className="w-4 h-4 text-orange-500" />
                          }
                        </div>
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : ""}
                          </p>
                        </div>
                      </div>
                      <span className={`font-semibold ${tx.type === 'earned' ? 'text-green-600' : 'text-orange-600'}`}>
                        {tx.type === 'earned' ? '+' : '-'}{tx.points.toLocaleString()} pts
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Card className="mt-8 p-6 bg-primary/5 border-primary/20">
          <div className="flex items-start gap-4">
            <Sparkles className="w-8 h-8 text-primary flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-1">How UpTend Rewards Works</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Earn {POINTS_PER_DOLLAR} points for every $1 you spend on jobs
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Climb tiers to unlock bigger discounts (up to 15% off)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Gold and Platinum members get priority matching with top Pros
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Redeem points for discounts on future jobs
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
