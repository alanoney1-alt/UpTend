import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Leaf, Droplet, TreePine, Recycle, Download, Share2, TrendingUp, Sparkles, Award } from "lucide-react";
import { ServiceBreakdownChart, ServiceBreakdownData } from "@/components/esg/service-breakdown-chart";
import { useRef } from "react";
import html2canvas from "html2canvas";

interface ImpactData {
  totalJobs: number;
  totalWeightDiverted: number;
  itemsRecycled: number;
  itemsDonated: number;
  carbonOffsetLbs: number;
  treesEquivalent: number;
  waterSavedGallons: number;
  diversionRate: number;
}

// Generate dynamic, compelling share text based on impact
function getShareText(data: ImpactData): string {
  const weight = data.totalWeightDiverted;
  const trees = data.treesEquivalent;
  const diversion = data.diversionRate;

  // Different messages based on impact level
  if (weight > 1000) {
    return ` I've kept ${weight.toLocaleString()} lbs of waste out of landfills with @UpTend!\n\n` +
      `That's equivalent to ${trees} trees worth of CO2. Every item tracked. Every impact verified.\n\n` +
      ` ${data.itemsRecycled.toLocaleString()} lbs recycled\n` +
      ` ${data.itemsDonated.toLocaleString()} lbs donated to families in need\n` +
      ` ${Math.round(data.waterSavedGallons).toLocaleString()} gallons of water saved\n\n` +
      `Your stuff doesn't have to end up in a landfill. Join me → uptendapp.com`;
  } else if (weight > 500) {
    return ` Just hit ${weight} lbs diverted from landfills with @UpTend!\n\n` +
      ` ${diversion}% landfill diversion rate\n` +
      ` ${trees} trees worth of CO2 offset\n` +
      ` ${Math.round(data.waterSavedGallons).toLocaleString()} gallons saved\n\n` +
      `Every junk removal job comes with verified impact tracking. Try it → uptendapp.com`;
  } else {
    return ` Started tracking my environmental impact with @UpTend!\n\n` +
      `Already diverted ${weight} lbs from landfills:\n` +
      ` ${data.itemsRecycled} lbs recycled\n` +
      ` ${data.itemsDonated} lbs donated\n` +
      ` ${trees} trees worth of CO2\n\n` +
      `Every job = verified sustainability certificate → uptendapp.com`;
  }
}

// Get achievement level based on weight
function getAchievementLevel(weight: number): { level: string; emoji: string; color: string } {
  if (weight > 2000) return { level: "Planet Protector", emoji: "", color: "text-purple-600" };
  if (weight > 1000) return { level: "Impact Champion", emoji: "", color: "text-yellow-600" };
  if (weight > 500) return { level: "Eco Warrior", emoji: "", color: "text-blue-600" };
  if (weight > 200) return { level: "Green Pioneer", emoji: "", color: "text-green-600" };
  return { level: "Impact Starter", emoji: "", color: "text-emerald-600" };
}

export function ImpactTracker() {
  const { toast } = useToast();
  const shareCardRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery<ImpactData>({
    queryKey: ["/api/my-impact"],
    queryFn: async () => {
      const response = await fetch("/api/my-impact", { credentials: "include" });
      if (!response.ok) return null;
      return response.json();
    },
  });

  // Fetch service breakdown data
  const { data: serviceBreakdown } = useQuery<{ success: boolean; data: ServiceBreakdownData[] }>({
    queryKey: ["/api/my-impact/by-service"],
    queryFn: async () => {
      const response = await fetch("/api/my-impact/by-service", { credentials: "include" });
      if (!response.ok) return { success: false, data: [] };
      return response.json();
    },
  });

  const handleShare = async () => {
    if (!data) return;

    const shareText = getShareText(data);

    if (navigator.share) {
      try {
        await navigator.share({
          title: "My UpTend Environmental Impact",
          text: shareText,
        });
        toast({
          title: "Thanks for sharing! ",
          description: "Every share helps more people discover verified sustainability",
        });
      } catch (err) {
        // User cancelled, no error needed
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied to clipboard! ",
        description: "Paste it anywhere to share your impact",
      });
    }
  };

  const handleDownload = async () => {
    if (!shareCardRef.current) return;

    try {
      toast({
        title: "Creating your impact card...",
        description: "This takes a few seconds",
      });

      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: null,
        scale: 2,
        logging: false,
      });

      const link = document.createElement("a");
      link.download = `uptend-impact-${data?.totalWeightDiverted}lbs.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast({
        title: "Impact card ready! ",
        description: "Post it on Instagram, Facebook, or Twitter",
      });
    } catch (err) {
      console.error("Download error:", err);
      toast({
        title: "Couldn't generate image",
        description: "Try the text share instead",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Leaf className="w-6 h-6 text-green-600 animate-pulse" />
          <h3 className="font-bold text-lg">My Impact</h3>
        </div>
        <p className="text-sm text-muted-foreground">Loading your environmental impact...</p>
      </Card>
    );
  }

  if (!data || data.totalJobs === 0) {
    return (
      <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <Leaf className="w-6 h-6 text-green-600" />
            <Sparkles className="w-3 h-3 text-yellow-500 absolute -top-1 -right-1" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Your Impact Awaits</h3>
            <p className="text-sm text-muted-foreground">Track every pound diverted</p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-blue-500/20 mb-4">
            <TrendingUp className="w-10 h-10 text-green-600" />
          </div>
          <h4 className="font-bold text-xl mb-2">Start Building Your Legacy</h4>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Every job you book creates verified environmental impact. See exactly how much waste you've kept out of landfills, then share it with the world.
          </p>
          <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
            <a href="/book">Book Your First Service</a>
          </Button>
        </div>
      </Card>
    );
  }

  const achievement = getAchievementLevel(data.totalWeightDiverted);

  return (
    <div className="space-y-4">
      {/* Main Impact Card */}
      <Card className="p-6 bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10 border-green-500/30 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl" />

        <div className="relative">
          {/* Header with Achievement */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Leaf className="w-7 h-7 text-green-600" />
                <Award className="w-4 h-4 text-yellow-500 absolute -top-1 -right-1" />
              </div>
              <div>
                <h3 className="font-bold text-xl">My Environmental Impact</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-sm font-bold ${achievement.color}`}>
                    {achievement.emoji} {achievement.level}
                  </span>
                  <span className="text-xs text-muted-foreground">• {data.totalJobs} jobs</span>
                </div>
              </div>
            </div>
            <Badge className="bg-green-600 text-white text-base px-3 py-1">
              {data.diversionRate}% Diverted
            </Badge>
          </div>

          {/* Hero Metric */}
          <div className="text-center mb-6 p-6 rounded-lg bg-background/50 backdrop-blur-sm">
            <div className="text-6xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
              {data.totalWeightDiverted.toLocaleString()}
            </div>
            <div className="text-lg text-muted-foreground font-medium">
              pounds kept out of landfills
            </div>
          </div>

          {/* Impact Metrics Grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
              <TreePine className="w-7 h-7 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">{data.treesEquivalent}</div>
              <div className="text-xs text-muted-foreground mt-1">Trees of CO2</div>
            </div>

            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20">
              <Droplet className="w-7 h-7 mx-auto mb-2 text-cyan-600" />
              <div className="text-2xl font-bold text-cyan-600">{Math.round(data.waterSavedGallons / 1000)}k</div>
              <div className="text-xs text-muted-foreground mt-1">Gallons Saved</div>
            </div>

            <div className="text-center p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
              <Recycle className="w-7 h-7 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">{data.itemsRecycled}</div>
              <div className="text-xs text-muted-foreground mt-1">lbs Recycled</div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-3 mb-6">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Recycle className="w-4 h-4 text-green-600" />
                  Recycled
                </span>
                <span className="font-bold text-green-600">{data.itemsRecycled.toLocaleString()} lbs</span>
              </div>
              <Progress
                value={(data.itemsRecycled / data.totalWeightDiverted) * 100}
                className="h-2.5 bg-muted"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <span className="text-red-500"></span>
                  Donated
                </span>
                <span className="font-bold text-purple-600">{data.itemsDonated.toLocaleString()} lbs</span>
              </div>
              <Progress
                value={(data.itemsDonated / data.totalWeightDiverted) * 100}
                className="h-2.5 bg-muted"
              />
            </div>
          </div>

          {/* Service Breakdown Chart */}
          {serviceBreakdown?.data && serviceBreakdown.data.length > 0 && (
            <div className="mb-6">
              <ServiceBreakdownChart data={serviceBreakdown.data} metric="co2" />
            </div>
          )}

          {/* CTA - Make sharing irresistible */}
          <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-lg p-4 mb-4 border border-green-500/30">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-sm mb-1">Share Your Impact</p>
                <p className="text-xs text-muted-foreground">
                  Show the world what verified sustainability looks like. Every share helps more people discover us.
                </p>
              </div>
            </div>
          </div>

          {/* Share Buttons - BIG and obvious */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleShare}
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
            >
              <Share2 className="w-5 h-5 mr-2" />
              Share Now
            </Button>
            <Button
              variant="outline"
              onClick={handleDownload}
              size="lg"
              className="w-full border-green-500/50 hover:bg-green-500/10"
            >
              <Download className="w-5 h-5 mr-2" />
              Save Image
            </Button>
          </div>
        </div>
      </Card>

      {/* Hidden Shareable Card for Screenshot - ENHANCED */}
      <div className="fixed -left-[9999px] top-0">
        <div
          ref={shareCardRef}
          className="w-[1200px] h-[630px] bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 p-12 text-white relative overflow-hidden"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

          <div className="relative h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <Leaf className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-4xl font-black tracking-tight">My UpTend Impact</h2>
                <p className="text-white/80 text-xl">{achievement.emoji} {achievement.level}</p>
              </div>
            </div>

            {/* Hero Number */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="text-center mb-8">
                <div className="text-9xl font-black mb-4 leading-none">
                  {data.totalWeightDiverted.toLocaleString()}
                </div>
                <div className="text-4xl font-bold text-white/90 mb-8">
                  pounds diverted from landfills
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
                  <TreePine className="w-12 h-12 mx-auto mb-3" />
                  <div className="text-5xl font-black mb-2">{data.treesEquivalent}</div>
                  <div className="text-white/80 text-lg">Trees of CO2</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
                  <Recycle className="w-12 h-12 mx-auto mb-3" />
                  <div className="text-5xl font-black mb-2">{data.itemsRecycled}</div>
                  <div className="text-white/80 text-lg">lbs Recycled</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
                  <Droplet className="w-12 h-12 mx-auto mb-3" />
                  <div className="text-5xl font-black mb-2">{Math.round(data.waterSavedGallons / 1000)}k</div>
                  <div className="text-white/80 text-lg">Gallons Saved</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-8 border-t-2 border-white/20">
              <div className="text-2xl text-white/90">
                Every job tracked. Every impact verified.
              </div>
              <div className="text-3xl font-black">
                uptendapp.com
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
