import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Gift, Copy, Share2, CheckCircle, Clock, DollarSign } from "lucide-react";

export function ReferralWidget() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Get referral code
  const { data: codeData } = useQuery({
    queryKey: ["/api/referrals/my-code"],
    queryFn: async () => {
      const response = await fetch("/api/referrals/my-code", { credentials: "include" });
      if (!response.ok) return null;
      return response.json();
    },
  });

  // Get referral stats
  const { data: stats } = useQuery({
    queryKey: ["/api/referrals/my-stats"],
    queryFn: async () => {
      const response = await fetch("/api/referrals/my-stats", { credentials: "include" });
      if (!response.ok) return null;
      return response.json();
    },
  });

  const handleCopy = () => {
    if (!codeData?.shareUrl) return;

    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({
      title: "Link copied!",
      description: "Share it with friends to earn $25 each",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!codeData?.shareUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join UpTend and get $25 off",
          text: "I've been using UpTend for junk removal and home services. Use my referral code and we both get $25 credit!",
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or error occurred
        console.log("Share cancelled");
      }
    } else {
      // Fallback to copy
      handleCopy();
    }
  };

  // Use defaults if API not available yet
  const referralCode = codeData?.code || "UPTEND25";
  const shareUrl = codeData?.shareUrl || `https://uptendapp.com/?ref=${referralCode}`;
  const referralStats = stats || { referrals: 0, earned: 0, pending: 0 };

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Gift className="w-6 h-6 text-primary" />
          <div>
            <h3 className="font-bold text-lg">Refer & Earn</h3>
            <p className="text-sm text-muted-foreground">$25 for you, $25 for them</p>
          </div>
        </div>
        <Badge className="bg-green-600 text-white">Active</Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{referralStats.referrals}</div>
          <div className="text-xs text-muted-foreground">Referrals</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">${referralStats.earned}</div>
          <div className="text-xs text-muted-foreground">Earned</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">${referralStats.pending}</div>
          <div className="text-xs text-muted-foreground">Pending</div>
        </div>
      </div>

      {/* Referral Code */}
      <div className="bg-background/50 rounded-lg p-4 mb-4">
        <p className="text-xs text-muted-foreground mb-2">Your Referral Code</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xl font-bold tracking-wider bg-background px-3 py-2 rounded border">
            {referralCode}
          </code>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Button variant="outline" onClick={handleCopy} className="w-full">
          <Copy className="w-4 h-4 mr-2" />
          Copy Link
        </Button>
        <Button onClick={handleShare} className="w-full">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </div>

      {/* Recent Referrals */}
      {referralStats.referrals && referralStats.referrals.length > 0 && (
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-3">Recent Referrals</p>
          <div className="space-y-2">
            {referralStats.referrals.slice(0, 3).map((referral: any) => (
              <div key={referral.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {referral.status === "completed" ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-orange-600" />
                  )}
                  <span className="text-muted-foreground">
                    {referral.referredEmail.substring(0, 3)}***
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {referral.credited ? (
                    <Badge variant="secondary" className="text-xs">
                      <DollarSign className="w-3 h-3 mr-1" />
                      ${referral.creditAmount}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">Pending</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 text-xs text-muted-foreground">
        <p> Your friend gets $25 off their first booking</p>
        <p> You get $25 credit when they complete their first job</p>
      </div>
    </Card>
  );
}
