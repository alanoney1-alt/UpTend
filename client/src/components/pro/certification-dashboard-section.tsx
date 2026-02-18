import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CertificationBadges } from "./certification-badge";
import { ShieldCheck, Lock, ArrowRight, Clock, GraduationCap, Trophy, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

interface ProCertResponse {
  active: any[];
  expired: any[];
  inProgress: any[];
  available: any[];
  hiddenJobCount: number;
  missingCerts: string[];
}

export function CertificationDashboardSection() {
  const { data, isLoading } = useQuery<ProCertResponse>({
    queryKey: ["/api/pro/certifications"],
  });

  if (isLoading) {
    return (
      <Card className="p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-3" />
        <div className="h-4 bg-gray-200 rounded w-32" />
      </Card>
    );
  }

  if (!data) return null;

  const active = data.active || [];
  const inProgress = data.inProgress || [];
  const available = data.available || [];
  const hiddenJobCount = data.hiddenJobCount || 0;
  const totalCerts = 6;
  const isFullyCertified = active.length >= totalCerts && available.length === 0;
  const hasNoCerts = active.length === 0 && inProgress.length === 0;

  // Find certs expiring within 30 days
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringSoon = active.filter((cert: any) => {
    if (!cert.expires_at) return false;
    const expiryDate = new Date(cert.expires_at);
    return expiryDate <= thirtyDaysFromNow && expiryDate > now;
  });

  return (
    <div className="space-y-3 mb-4">
      {/* Hidden jobs banner */}
      {hiddenJobCount > 0 && (
        <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-full">
              <Lock className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                🔒 {hiddenJobCount} premium job{hiddenJobCount !== 1 ? "s" : ""} in your area require additional certifications
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Get certified to unlock higher-paying contracts
              </p>
            </div>
            <Link href="/academy">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                Get Certified <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Fully Certified State */}
      {isFullyCertified && (
        <Card className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 dark:from-amber-950/30 dark:to-orange-950/30">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-full">
              <Trophy className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                🏆 Fully Certified
                <Badge className="bg-amber-500 text-white">Elite Pro</Badge>
              </h3>
              <p className="text-sm text-muted-foreground">You have access to all job categories including premium B2B and government contracts</p>
            </div>
          </div>
          {expiringSoon.length > 0 && (
            <div className="mt-3 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 text-sm font-medium mb-1">
                <AlertTriangle className="h-4 w-4" />
                Renewal Reminder
              </div>
              {expiringSoon.map((cert: any) => (
                <p key={cert.id} className="text-sm text-orange-600 dark:text-orange-400">
                  {cert.name} expires {new Date(cert.expires_at).toLocaleDateString()}
                </p>
              ))}
              <Link href="/academy">
                <Button variant="link" size="sm" className="text-orange-600 p-0 mt-1 text-xs">
                  Renew now →
                </Button>
              </Link>
            </div>
          )}
        </Card>
      )}

      {/* No Certs Promotional State */}
      {hasNoCerts && !isFullyCertified && (
        <Card className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-800">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-full flex-shrink-0">
              <GraduationCap className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-amber-900 dark:text-amber-200">🎓 Get Certified, Earn More</h3>
              <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
                Certified pros unlock premium B2B contracts and earn up to 40% more
              </p>
              <div className="grid sm:grid-cols-3 gap-2 mb-4">
                {(available || []).slice(0, 3).map((cert: any) => (
                  <div key={cert.id} className="p-2 bg-white/60 dark:bg-white/10 rounded-lg">
                    <p className="text-xs font-medium">{cert.name}</p>
                    <p className="text-[10px] text-muted-foreground">~{cert.estimated_minutes} min</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <Link href="/academy">
                  <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                    Start Learning <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
                <span className="text-xs text-amber-600">~{hiddenJobCount || 12} premium jobs near you this week</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Active Certifications (when has some but not all) */}
      {active.length > 0 && !isFullyCertified && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">Your Certifications</h3>
              <Badge variant="outline" className="text-xs">{active.length}/{totalCerts}</Badge>
            </div>
            <Link href="/academy">
              <Button variant="ghost" size="sm" className="text-amber-600 text-xs">
                View all →
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {active.map((cert: any) => (
              <div key={cert.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CertificationBadges certSlugs={[cert.slug]} size="md" />
                  <span className="text-sm font-medium">{cert.name}</span>
                </div>
                {cert.expires_at && (
                  <div className={`flex items-center gap-1 text-xs ${
                    expiringSoon.some((e: any) => e.id === cert.id) ? "text-orange-600 font-medium" : "text-gray-500"
                  }`}>
                    <Clock className="h-3 w-3" />
                    {expiringSoon.some((e: any) => e.id === cert.id) ? "⚠️ " : ""}
                    Expires {new Date(cert.expires_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Next recommendation */}
          {available.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs text-muted-foreground mb-1">Recommended next:</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{available[0].name}</span>
                <Link href="/academy">
                  <Button variant="outline" size="sm" className="text-amber-600 border-amber-300 text-xs">
                    Start →
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* In Progress */}
      {inProgress.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-2">In Progress</h3>
          {inProgress.map((cert: any) => (
            <div key={cert.id} className="space-y-1.5 py-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm">{cert.name}</span>
                <Link href="/academy">
                  <Button variant="ghost" size="sm" className="text-amber-600 text-xs">
                    Continue →
                  </Button>
                </Link>
              </div>
              {cert.modules_completed != null && cert.modules_count && (
                <Progress 
                  value={(cert.modules_completed / cert.modules_count) * 100} 
                  className="h-1.5" 
                />
              )}
            </div>
          ))}
        </Card>
      )}

      {/* Available Certs (only when has some active, not fully certified, not in no-certs state) */}
      {available.length > 0 && active.length > 0 && active.length < totalCerts && (
        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-2">Unlock More Jobs</h3>
          <div className="space-y-1.5">
            {available.slice(0, 3).map((cert: any) => (
              <div key={cert.id} className="flex items-center justify-between py-1">
                <div>
                  <span className="text-sm">{cert.name}</span>
                  <span className="text-xs text-gray-500 ml-2">~{cert.estimated_minutes}min</span>
                </div>
                <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50">
                  {cert.category}
                </Badge>
              </div>
            ))}
          </div>
          <Link href="/academy">
            <Button variant="link" size="sm" className="text-amber-600 p-0 mt-2 text-xs">
              View all certifications →
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
