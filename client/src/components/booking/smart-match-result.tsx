/**
 * SmartMatchResult — Split-screen pro preview for booking confirmation
 * 
 * Desktop: two columns (job summary left, pro card right)
 * Mobile: stacked vertically with divider
 * Green checkmark animation on load, full-width Book Now below both panels.
 */

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ShieldCheck, Star, Clock, CheckCircle, ChevronDown, Play, Quote,
  MapPin, Calendar, Zap, Briefcase, User,
} from "lucide-react";

interface MatchedPro {
  firstName: string;
  rating: number;
  completedJobs: number;
  verified: boolean;
  tenureMonths: number;
  videoIntroUrl?: string;
  tagline?: string;
  avatarUrl?: string;
  reviewCount?: number;
  responseTimeMin?: number;
  specialties?: string[];
}

interface JobSummary {
  serviceType: string;
  address: string;
  dateTime: string;
}

interface SmartMatchResultProps {
  pro: MatchedPro;
  price: number;
  serviceFee: number;
  totalPrice: number;
  matchId: string;
  job?: JobSummary;
  onBook: (matchId: string, proId?: string) => void;
  onViewAlternatives?: (matchId: string) => void;
  isBooking?: boolean;
}

function CheckmarkAnimation({ show }: { show: boolean }) {
  return (
    <div className={`flex items-center justify-center mb-6 transition-all duration-700 ${show ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}>
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <CheckCircle className="w-9 h-9 text-emerald-500 animate-[bounce-in_0.6s_ease-out]" />
        </div>
        <div className={`absolute inset-0 rounded-full border-2 border-emerald-400/50 ${show ? "animate-ping" : ""}`} style={{ animationIterationCount: 1, animationDuration: "1s" }} />
      </div>
    </div>
  );
}

export function SmartMatchResult({
  pro,
  price,
  serviceFee,
  totalPrice,
  matchId,
  job,
  onBook,
  onViewAlternatives,
  isBooking = false,
}: SmartMatchResultProps) {
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setShowCheck(true), 200);
    return () => clearTimeout(t);
  }, []);

  const yearsExperience = pro.tenureMonths >= 12
    ? `${Math.floor(pro.tenureMonths / 12)}+ years`
    : `${pro.tenureMonths} months`;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <CheckmarkAnimation show={showCheck} />

      <p className="text-center text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2 tracking-wide uppercase">
        Match Found
      </p>
      <h2 className="text-center text-xl font-bold text-slate-900 dark:text-white mb-6">
        We found the perfect pro for you
      </h2>

      <Card className="border-2 border-amber-200 dark:border-amber-800 shadow-lg overflow-hidden">
        {/* Price Protection Banner */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 px-5 py-3 flex items-center justify-center gap-2 border-b border-amber-200 dark:border-amber-800">
          <ShieldCheck className="w-4 h-4 text-[#ea580c]" />
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Price Protected</span>
        </div>

        <CardContent className="p-6">
          {/* Split layout: md+ two columns, mobile stacked */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* LEFT: Job Summary */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Job Details</h3>

              {job && (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{job.serviceType}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-slate-600 dark:text-slate-300">{job.address}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-slate-600 dark:text-slate-300">{job.dateTime}</p>
                  </div>
                </div>
              )}

              {/* Price Breakdown */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Service</span>
                  <span className="font-medium text-slate-900 dark:text-white">${price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Service fee</span>
                  <span className="font-medium text-slate-900 dark:text-white">${serviceFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">Total</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">${totalPrice.toFixed(2)}</span>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Includes Price Protection, background checks, and our guarantee
                </p>
              </div>
            </div>

            {/* Divider — mobile only */}
            <div className="block md:hidden border-t border-slate-200 dark:border-slate-700" />

            {/* RIGHT: Pro Card */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Your Pro</h3>

              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 border-2 border-amber-200 dark:border-amber-700">
                  {pro.avatarUrl && <AvatarImage src={pro.avatarUrl} alt={pro.firstName} />}
                  <AvatarFallback className="bg-amber-100 text-amber-700 text-xl font-bold">
                    {pro.firstName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">{pro.firstName}</h4>
                    {pro.verified && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] px-1.5 py-0">
                        <CheckCircle className="w-3 h-3 mr-0.5" />
                        Verified Pro
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">{pro.rating}</span>
                    {pro.reviewCount && (
                      <span className="text-xs text-slate-400">({pro.reviewCount} reviews)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{yearsExperience}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Experience</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{pro.completedJobs}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Jobs Completed</p>
                </div>
                {pro.responseTimeMin && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center col-span-2">
                    <div className="flex items-center justify-center gap-1">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{pro.responseTimeMin} min</p>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Avg. Response Time</p>
                  </div>
                )}
              </div>

              {/* Specialties */}
              {pro.specialties && pro.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {pro.specialties.map((s) => (
                    <Badge key={s} variant="outline" className="text-[11px] font-medium text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600">
                      {s}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Video Intro / Tagline */}
              {pro.videoIntroUrl ? (
                <div>
                  {!videoPlaying ? (
                    <button
                      onClick={() => {
                        setVideoPlaying(true);
                        setTimeout(() => videoRef.current?.play(), 50);
                      }}
                      className="relative w-full aspect-video bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden group"
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-[#ea580c]/90 flex items-center justify-center group-hover:bg-[#ea580c] transition-colors shadow-lg">
                          <Play className="w-5 h-5 text-white ml-0.5" />
                        </div>
                      </div>
                      <p className="absolute bottom-2 left-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Meet {pro.firstName}
                      </p>
                    </button>
                  ) : (
                    <video
                      ref={videoRef}
                      src={pro.videoIntroUrl}
                      controls
                      playsInline
                      className="w-full aspect-video rounded-xl bg-black"
                      onEnded={() => setVideoPlaying(false)}
                    />
                  )}
                </div>
              ) : pro.tagline ? (
                <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <Quote className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-600 dark:text-slate-400 italic">{pro.tagline}</p>
                </div>
              ) : null}
            </div>
          </div>

          {/* Book Button — full width below both panels */}
          <div className="mt-8 space-y-3">
            <Button
              onClick={() => onBook(matchId)}
              disabled={isBooking}
              className="w-full bg-[#ea580c] hover:bg-[#dc4c08] text-white font-bold text-base py-6 rounded-xl"
            >
              {isBooking ? "Booking..." : "Book Now"}
            </Button>

            {onViewAlternatives && (
              <button
                onClick={() => onViewAlternatives(matchId)}
                className="w-full text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors flex items-center justify-center gap-1"
              >
                View other matches
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface AlternativeProCardProps {
  pro: MatchedPro & { proId: string; totalPrice: number; serviceFee: number; valueScore: number };
  isTopMatch?: boolean;
  onSelect: (proId: string) => void;
}

export function AlternativeProCard({ pro, isTopMatch, onSelect }: AlternativeProCardProps) {
  return (
    <Card className={`border ${isTopMatch ? "border-[#ea580c]/50 bg-orange-50/30 dark:bg-orange-950/10" : "border-slate-200 dark:border-slate-700"}`}>
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-sm text-slate-900 dark:text-white">{pro.firstName}</span>
            {pro.verified && (
              <Badge variant="secondary" className="bg-green-100 text-green-700 text-[10px] px-1 py-0">
                Verified
              </Badge>
            )}
            {isTopMatch && (
              <Badge className="bg-[#ea580c] text-white text-[10px] px-1.5 py-0">
                Best Match
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-0.5">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              {pro.rating}
            </span>
            <span>{pro.completedJobs} jobs</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-slate-900 dark:text-white">${pro.totalPrice.toFixed(2)}</div>
          <button
            onClick={() => onSelect(pro.proId)}
            className="text-xs font-semibold text-[#ea580c] hover:underline"
          >
            Select
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
