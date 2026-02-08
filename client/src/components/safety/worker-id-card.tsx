import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck, Star, ChevronDown, ChevronUp,
  Video, Lock, Award, UserCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface WorkerIdCardProps {
  worker?: {
    name: string;
    image?: string;
    rating: number;
    jobs: number;
    bio?: string | null;
    funFact?: string | null;
    videoIntroUrl?: string | null;
    backgroundCheckDate?: string;
    safetyCode?: string;
  };
}

export function WorkerIdCard({ worker }: WorkerIdCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasDigitalHandshake = Boolean(
    worker?.bio || worker?.funFact || worker?.videoIntroUrl
  );

  const pycker = worker || {
    name: "Mike Rodriguez",
    image: undefined,
    rating: 4.9,
    jobs: 142,
    bio: null,
    funFact: null,
    videoIntroUrl: null,
    backgroundCheckDate: "Jan 2026",
    safetyCode: "84-BLUE",
  };

  const initials = pycker.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const toggleLabel = isExpanded
    ? "Hide Profile"
    : pycker.videoIntroUrl
      ? "View Video Intro"
      : "View Full Profile";

  return (
    <Card
      className="w-full transition-all duration-300"
      data-testid="card-worker-id"
    >
      <div className="p-4 flex items-center gap-4">
        <div className="relative shrink-0">
          <Avatar className="w-14 h-14 border-2 border-muted shadow-sm">
            {pycker.image ? (
              <AvatarImage src={pycker.image} alt={pycker.name} />
            ) : null}
            <AvatarFallback className="text-sm font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div
            className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground p-0.5 rounded-full border-2 border-background"
            data-testid="icon-verified-check"
          >
            <ShieldCheck className="w-3 h-3" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold truncate" data-testid="text-worker-name">{pycker.name}</h3>
            {hasDigitalHandshake && (
              <Badge variant="secondary" className="text-[10px] gap-1 no-default-active-elevate" data-testid="badge-trusted-pro">
                <Award className="w-3 h-3" /> Trusted Pro
              </Badge>
            )}
          </div>

          <div className="flex items-center text-xs text-muted-foreground gap-2 mt-0.5">
            <span className="flex items-center text-yellow-500 dark:text-yellow-400 font-bold" data-testid="text-worker-rating">
              <Star className="w-3 h-3 fill-current mr-1" /> {pycker.rating}
            </span>
            <span data-testid="text-worker-jobs">{pycker.jobs} Jobs</span>
          </div>
        </div>

        {pycker.safetyCode && (
          <div className="text-right shrink-0" data-testid="section-safety-code">
            <p className="text-[10px] text-muted-foreground uppercase font-bold" data-testid="label-safety-code">Safety Code</p>
            <div
              className="bg-muted font-mono font-bold px-2 py-1 rounded-md text-sm border border-border"
              data-testid="text-safety-code"
            >
              {pycker.safetyCode}
            </div>
          </div>
        )}
      </div>

      {hasDigitalHandshake ? (
        <Button
          variant="ghost"
          className="w-full rounded-none justify-between gap-4 bg-muted/50 px-4 py-2 border-t border-border text-xs font-bold text-muted-foreground uppercase"
          onClick={() => setIsExpanded(!isExpanded)}
          data-testid="button-toggle-profile"
        >
          <span className="flex items-center gap-2">
            {toggleLabel}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </Button>
      ) : (
        <div className="bg-muted/50 px-4 py-2 flex justify-between items-center gap-4 border-t border-border">
          <span className="text-xs font-bold text-muted-foreground flex items-center gap-2" data-testid="text-identity-verified">
            <UserCheck className="w-3 h-3" /> Identity Verified
          </span>
        </div>
      )}

      {hasDigitalHandshake && isExpanded && (
        <CardContent className="p-4 border-t border-border space-y-4" data-testid="section-digital-handshake">
          {pycker.videoIntroUrl && (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full gap-2 border-dashed"
                  data-testid="button-watch-video"
                >
                  <Video className="w-4 h-4" /> Watch {pycker.name.split(" ")[0]}&apos;s Intro (15s)
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0 bg-black dark:bg-black max-w-lg">
                <DialogHeader className="sr-only">
                  <DialogTitle>Video Introduction</DialogTitle>
                  <DialogDescription>Worker video introduction</DialogDescription>
                </DialogHeader>
                <div className="aspect-video flex items-center justify-center text-white">
                  <div className="text-center">
                    <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-neutral-400">Video Player</p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            {pycker.bio && (
              <div className="bg-muted/50 p-3 rounded-lg border border-border" data-testid="text-worker-bio">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1 flex items-center gap-1" data-testid="label-why-i-work">
                  Why I Work
                </p>
                <p className="text-xs leading-relaxed italic">&ldquo;{pycker.bio}&rdquo;</p>
              </div>
            )}
            {pycker.funFact && (
              <div className="bg-muted/50 p-3 rounded-lg border border-border" data-testid="text-worker-funfact">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1" data-testid="label-fun-fact">Fun Fact</p>
                <p className="text-xs leading-relaxed">{pycker.funFact}</p>
              </div>
            )}
          </div>

          {pycker.backgroundCheckDate && (
            <div className="flex items-center justify-between gap-4 text-[10px] text-muted-foreground pt-1 flex-wrap" data-testid="section-background-check">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3" /> Background Checked
              </span>
              <span>Verified: {pycker.backgroundCheckDate}</span>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
