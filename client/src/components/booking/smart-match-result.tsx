/**
 * SmartMatchResult — Shows the George-recommended pro match
 * 
 * Clean, Apple-level design. Cream/amber/slate palette. No emojis.
 * Shows: first name, rating, jobs completed, verified badge, tenure, price.
 * NEVER shows: last name, phone, email, business name.
 */

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Star, Clock, CheckCircle, ChevronDown, Play, Quote } from "lucide-react";

interface MatchedPro {
  firstName: string;
  rating: number;
  completedJobs: number;
  verified: boolean;
  tenureMonths: number;
  videoIntroUrl?: string;
  tagline?: string;
}

interface SmartMatchResultProps {
  pro: MatchedPro;
  price: number;
  serviceFee: number;
  totalPrice: number;
  matchId: string;
  onBook: (matchId: string, proId?: string) => void;
  onViewAlternatives?: (matchId: string) => void;
  isBooking?: boolean;
}

export function SmartMatchResult({
  pro,
  price,
  serviceFee,
  totalPrice,
  matchId,
  onBook,
  onViewAlternatives,
  isBooking = false,
}: SmartMatchResultProps) {
  const [videoPlaying, setVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="border-2 border-amber-200 dark:border-amber-800 shadow-lg overflow-hidden">
        {/* Price Protection Banner */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 px-5 py-3 flex items-center justify-center gap-2 border-b border-amber-200 dark:border-amber-800">
          <ShieldCheck className="w-4 h-4 text-[#ea580c]" />
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Price Protected</span>
        </div>

        <CardContent className="p-6">
          {/* Pro Info */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {pro.firstName}
                </h3>
                {pro.verified && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] px-1.5 py-0">
                    <CheckCircle className="w-3 h-3 mr-0.5" />
                    Verified Pro
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  {pro.rating}
                </span>
                <span>{pro.completedJobs} jobs</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {pro.tenureMonths >= 12
                    ? `${Math.floor(pro.tenureMonths / 12)}+ yr`
                    : `${pro.tenureMonths} mo`}
                </span>
              </div>
            </div>
          </div>

          {/* Video Intro / Tagline */}
          {pro.videoIntroUrl ? (
            <div className="mb-4">
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
            <div className="mb-4 flex items-start gap-2 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <Quote className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <p className="text-sm text-slate-600 dark:text-slate-400 italic">{pro.tagline}</p>
            </div>
          ) : null}

          {/* Price */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                ${totalPrice.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Includes ${serviceFee.toFixed(2)} service fee for Price Protection, background checks, and our guarantee
            </p>
          </div>

          {/* Book Button */}
          <Button
            onClick={() => onBook(matchId)}
            disabled={isBooking}
            className="w-full bg-[#ea580c] hover:bg-[#dc4c08] text-white font-bold text-base py-6 rounded-xl"
          >
            {isBooking ? "Booking..." : "Book Now"}
          </Button>

          {/* View Alternatives */}
          {onViewAlternatives && (
            <button
              onClick={() => onViewAlternatives(matchId)}
              className="w-full mt-3 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors flex items-center justify-center gap-1"
            >
              View other matches
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          )}
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
