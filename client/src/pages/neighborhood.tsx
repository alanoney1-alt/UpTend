import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import {
  Users, Star, TrendingUp, Tag, MapPin, ThumbsUp, MessageSquare,
} from "lucide-react";

export default function NeighborhoodPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showRecommendForm, setShowRecommendForm] = useState(false);
  const [recForm, setRecForm] = useState({ haulerId: "", serviceType: "", rating: 5, review: "" });

  const { data: neighborhood, isLoading } = useQuery({
    queryKey: ["/api/neighborhoods/mine"],
    queryFn: async () => {
      const res = await fetch("/api/neighborhoods/mine", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  const { data: feed } = useQuery({
    queryKey: ["/api/neighborhoods/feed", neighborhood?.id],
    queryFn: async () => {
      const res = await fetch(`/api/neighborhoods/${neighborhood.id}/feed`, { credentials: "include" });
      return res.json();
    },
    enabled: !!neighborhood?.id,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/neighborhoods/join", { neighborhoodId: neighborhood.id });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/neighborhoods/mine"] });
      toast({ title: "Welcome!", description: "You've joined your neighborhood network." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to join neighborhood. Please try again.", variant: "destructive" });
    },
  });

  const recommendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/neighborhoods/${neighborhood.id}/recommend`, recForm);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/neighborhoods/feed"] });
      setShowRecommendForm(false);
      setRecForm({ haulerId: "", serviceType: "", rating: 5, review: "" });
      toast({ title: "Thanks!", description: "Your recommendation helps your neighbors." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit recommendation. Please try again.", variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />
      <main className="pt-24 pb-16 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-2">Your Neighborhood</h1>
          <p className="text-slate-400">See what your neighbors recommend. Book together, save together.</p>
        </div>

        {isLoading && <p className="text-center text-slate-500">Loading your neighborhood...</p>}

        {neighborhood && !neighborhood.error && (
          <div className="space-y-8">
            {/* Neighborhood Info */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-6 h-6 text-primary" />
                    <div>
                      <CardTitle className="text-white">{neighborhood.name}</CardTitle>
                      <p className="text-sm text-slate-400">{neighborhood.city}, {neighborhood.state} {neighborhood.zipCode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{neighborhood.memberCount} members</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!neighborhood.isMember ? (
                  <Button onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending} className="w-full">
                    <Users className="w-4 h-4 mr-2" /> Join Your Neighborhood
                  </Button>
                ) : (
                  <div className="flex items-center gap-3">
                    <Badge className="bg-green-600/20 text-green-400 border-green-600/30"> Member</Badge>
                    <Button variant="outline" size="sm" onClick={() => setShowRecommendForm(!showRecommendForm)} className="border-slate-600">
                      <ThumbsUp className="w-4 h-4 mr-2" /> Recommend a Pro
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommend Form */}
            {showRecommendForm && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader><CardTitle className="text-white text-lg">Recommend a Pro</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Pro/Hauler ID" value={recForm.haulerId} onChange={e => setRecForm(f => ({ ...f, haulerId: e.target.value }))} className="bg-slate-900 border-slate-700" />
                  <Input placeholder="Service type (e.g. junk_removal)" value={recForm.serviceType} onChange={e => setRecForm(f => ({ ...f, serviceType: e.target.value }))} className="bg-slate-900 border-slate-700" />
                  <div>
                    <label className="text-sm text-slate-400 mb-1 block">Rating: {recForm.rating}/5</label>
                    <input type="range" min={1} max={5} value={recForm.rating} onChange={e => setRecForm(f => ({ ...f, rating: Number(e.target.value) }))} className="w-full" />
                  </div>
                  <Textarea placeholder="Your review (optional)" value={recForm.review} onChange={e => setRecForm(f => ({ ...f, review: e.target.value }))} className="bg-slate-900 border-slate-700" />
                  <Button onClick={() => recommendMutation.mutate()} disabled={!recForm.haulerId || !recForm.serviceType || recommendMutation.isPending}>
                    Submit Recommendation
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Group Deals */}
            {feed?.groupDeals?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-green-400" /> Group Deals
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {feed.groupDeals.map((deal: any) => (
                    <Card key={deal.serviceType} className="bg-green-900/20 border-green-700/30">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-white capitalize">{deal.serviceType.replace(/_/g, " ")}</p>
                            <p className="text-sm text-slate-400">{deal.neighborsBooked} neighbors booked</p>
                          </div>
                          <Badge className="bg-green-600 text-white text-lg px-3 py-1">
                            {deal.discountPercent}% OFF
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Services */}
            {feed?.popularServices?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" /> Popular in Your Area
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {feed.popularServices.map((svc: any) => (
                    <Card key={svc.serviceType} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4 text-center">
                        <p className="font-medium text-white capitalize">{svc.serviceType.replace(/_/g, " ")}</p>
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="text-sm text-slate-300">{Number(svc.avgRating).toFixed(1)}</span>
                          <span className="text-xs text-slate-500">({svc.count} recs)</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Feed */}
            {feed?.recommendations?.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-slate-400" /> Recent Activity
                </h2>
                <div className="space-y-3">
                  {feed.recommendations.slice(0, 10).map((rec: any) => (
                    <Card key={rec.id} className="bg-slate-800/50 border-slate-700">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white capitalize font-medium">{rec.serviceType.replace(/_/g, " ")}</p>
                            {rec.review && <p className="text-sm text-slate-400 mt-1">"{rec.review}"</p>}
                          </div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: rec.rating }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {feed && feed.recommendations?.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No activity yet. Be the first to recommend a pro!</p>
              </div>
            )}
          </div>
        )}

        {neighborhood?.error && (
          <div className="text-center py-12">
            <p className="text-slate-400">{neighborhood.error}</p>
            <Button className="mt-4" asChild><a href="/settings">Update Your Profile</a></Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
