import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Plus, Star, TrendingUp, TrendingDown, Minus, Eye, Trash2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Competitor {
  id: number;
  partner_slug: string;
  competitor_name: string;
  website?: string;
  google_rating?: number;
  review_count: number;
  services: string[];
  price_range?: string;
  last_checked?: string;
  snapshot_count: number;
  latest_rating?: number;
  latest_review_count?: number;
}

interface CompetitorOverview {
  partnerStats: {
    rating: number;
    reviewCount: number;
  };
  marketPosition: {
    ratingsAbove: number;
    ratingsBelow: number;
    reviewsAbove: number;
    reviewsBelow: number;
    totalCompetitors: number;
  };
  marketAverages: {
    rating: number;
    reviewCount: number;
  };
  competitors: Competitor[];
  recentActivity: Array<{
    competitor_name: string;
    snapshot_date: string;
    google_rating: number;
    review_count: number;
    ad_detected: boolean;
  }>;
  insights: {
    ratingAdvantage: boolean;
    reviewAdvantage: boolean;
    marketLeader: boolean;
  };
}

export default function PartnerCompetitors() {
  const [isAddCompetitorOpen, setIsAddCompetitorOpen] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get partner slug from URL or context
  const partnerSlug = "sample-partner";
  
  // Fetch competitors
  const { data: competitorsData, isLoading: competitorsLoading } = useQuery({
    queryKey: ['competitors', partnerSlug],
    queryFn: async () => {
      const response = await fetch(`/api/partners/${partnerSlug}/competitors`);
      if (!response.ok) throw new Error('Failed to fetch competitors');
      return response.json();
    }
  });
  
  // Fetch market overview
  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['competitor-overview', partnerSlug],
    queryFn: async () => {
      const response = await fetch(`/api/partners/${partnerSlug}/competitors/overview`);
      if (!response.ok) throw new Error('Failed to fetch overview');
      return response.json();
    }
  });
  
  // Fetch competitor history when selected
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['competitor-history', selectedCompetitor?.id],
    queryFn: async () => {
      if (!selectedCompetitor) return null;
      const response = await fetch(`/api/partners/${partnerSlug}/competitors/${selectedCompetitor.id}/history`);
      if (!response.ok) throw new Error('Failed to fetch history');
      return response.json();
    },
    enabled: !!selectedCompetitor
  });

  const competitors: Competitor[] = competitorsData?.competitors || [];
  const overview: CompetitorOverview = overviewData?.overview || {
    partnerStats: { rating: 0, reviewCount: 0 },
    marketPosition: { ratingsAbove: 0, ratingsBelow: 0, reviewsAbove: 0, reviewsBelow: 0, totalCompetitors: 0 },
    marketAverages: { rating: 0, reviewCount: 0 },
    competitors: [],
    recentActivity: [],
    insights: { ratingAdvantage: false, reviewAdvantage: false, marketLeader: false }
  };

  // Add competitor mutation
  const addCompetitorMutation = useMutation({
    mutationFn: async (competitorData: Omit<Competitor, 'id' | 'partner_slug' | 'last_checked' | 'snapshot_count' | 'latest_rating' | 'latest_review_count'>) => {
      const response = await fetch(`/api/partners/${partnerSlug}/competitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(competitorData)
      });
      if (!response.ok) throw new Error('Failed to add competitor');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitors', partnerSlug] });
      queryClient.invalidateQueries({ queryKey: ['competitor-overview', partnerSlug] });
      setIsAddCompetitorOpen(false);
      toast({ title: "Success", description: "Competitor added successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add competitor", variant: "destructive" });
    }
  });

  // Create snapshot mutation
  const createSnapshotMutation = useMutation({
    mutationFn: async (competitorId: number) => {
      const response = await fetch(`/api/partners/${partnerSlug}/competitors/${competitorId}/snapshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ google_rating: 4.5, review_count: 123 }) // In real app, would fetch current data
      });
      if (!response.ok) throw new Error('Failed to create snapshot');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitors', partnerSlug] });
      queryClient.invalidateQueries({ queryKey: ['competitor-overview', partnerSlug] });
      toast({ title: "Success", description: "Snapshot created successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create snapshot", variant: "destructive" });
    }
  });

  // Delete competitor mutation
  const deleteCompetitorMutation = useMutation({
    mutationFn: async (competitorId: number) => {
      const response = await fetch(`/api/partners/${partnerSlug}/competitors/${competitorId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete competitor');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitors', partnerSlug] });
      queryClient.invalidateQueries({ queryKey: ['competitor-overview', partnerSlug] });
      toast({ title: "Success", description: "Competitor removed successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove competitor", variant: "destructive" });
    }
  });

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 4.0) return "text-yellow-600";
    return "text-red-600";
  };

  const getRatingTrend = (current: number, historical: number) => {
    if (current > historical) return { icon: TrendingUp, color: "text-green-600" };
    if (current < historical) return { icon: TrendingDown, color: "text-red-600" };
    return { icon: Minus, color: "text-gray-500" };
  };

  const AddCompetitorForm = ({ onSubmit, isLoading }: { onSubmit: (data: any) => void, isLoading: boolean }) => {
    const [formData, setFormData] = useState({
      competitor_name: '',
      website: '',
      google_rating: '',
      review_count: '',
      services: '',
      price_range: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit({
        competitor_name: formData.competitor_name,
        website: formData.website || undefined,
        google_rating: formData.google_rating ? parseFloat(formData.google_rating) : undefined,
        review_count: formData.review_count ? parseInt(formData.review_count) : 0,
        services: formData.services ? formData.services.split(',').map(s => s.trim()) : [],
        price_range: formData.price_range || undefined
      });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="competitor_name">Competitor Name</Label>
          <Input
            id="competitor_name"
            value={formData.competitor_name}
            onChange={(e) => setFormData({ ...formData, competitor_name: e.target.value })}
            placeholder="e.g., ABC HVAC Services"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="website">Website (optional)</Label>
          <Input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://example.com"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="google_rating">Google Rating (optional)</Label>
            <Input
              id="google_rating"
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={formData.google_rating}
              onChange={(e) => setFormData({ ...formData, google_rating: e.target.value })}
              placeholder="4.5"
            />
          </div>
          <div>
            <Label htmlFor="review_count">Review Count (optional)</Label>
            <Input
              id="review_count"
              type="number"
              min="0"
              value={formData.review_count}
              onChange={(e) => setFormData({ ...formData, review_count: e.target.value })}
              placeholder="123"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="services">Services (comma-separated)</Label>
          <Input
            id="services"
            value={formData.services}
            onChange={(e) => setFormData({ ...formData, services: e.target.value })}
            placeholder="HVAC Repair, Installation, Maintenance"
          />
        </div>
        
        <div>
          <Label htmlFor="price_range">Price Range (optional)</Label>
          <Input
            id="price_range"
            value={formData.price_range}
            onChange={(e) => setFormData({ ...formData, price_range: e.target.value })}
            placeholder="$100-300"
          />
        </div>
        
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Adding..." : "Add Competitor"}
        </Button>
      </form>
    );
  };

  if (competitorsLoading || overviewLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Competitor Monitoring</h1>
          <p className="text-muted-foreground">Track your competitive position in the market</p>
        </div>
        
        <Dialog open={isAddCompetitorOpen} onOpenChange={setIsAddCompetitorOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Competitor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Competitor</DialogTitle>
            </DialogHeader>
            <AddCompetitorForm 
              onSubmit={(data) => addCompetitorMutation.mutate(data)}
              isLoading={addCompetitorMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Market Position Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="w-5 h-5" />
              <span>Your Rating</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className={cn("text-3xl font-bold", getRatingColor(overview.partnerStats.rating))}>
                  {overview.partnerStats.rating.toFixed(1)}
                </span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star 
                      key={i} 
                      className={cn("w-4 h-4", i <= overview.partnerStats.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300")} 
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {overview.partnerStats.reviewCount} reviews
              </p>
              <div className="text-sm">
                <p className={cn(overview.insights.ratingAdvantage ? "text-green-600" : "text-red-600")}>
                  {overview.insights.ratingAdvantage ? "Above" : "Below"} market average ({overview.marketAverages.rating.toFixed(1)})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Market Position</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Competitors with higher ratings:</span>
                <Badge variant="secondary">{overview.marketPosition.ratingsAbove}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Competitors with lower ratings:</span>
                <Badge variant="secondary">{overview.marketPosition.ratingsBelow}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total competitors tracked:</span>
                <Badge variant="outline">{overview.marketPosition.totalCompetitors}</Badge>
              </div>
              {overview.insights.marketLeader && (
                <Badge className="w-full justify-center bg-green-600">Market Leader</Badge>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overview.recentActivity.slice(0, 3).map((activity, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium truncate">{activity.competitor_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {activity.google_rating.toFixed(1)}★
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.snapshot_date).toLocaleDateString()} • {activity.review_count} reviews
                  </p>
                </div>
              ))}
              {overview.recentActivity.length === 0 && (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Competitors Grid */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Competitors</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competitors.map((competitor) => (
              <Card key={competitor.id} className="relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{competitor.competitor_name}</CardTitle>
                      {competitor.website && (
                        <a 
                          href={competitor.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {competitor.website}
                        </a>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => createSnapshotMutation.mutate(competitor.id)}
                        disabled={createSnapshotMutation.isPending}
                      >
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedCompetitor(competitor);
                          setIsHistoryOpen(true);
                        }}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteCompetitorMutation.mutate(competitor.id)}
                        disabled={deleteCompetitorMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(competitor.latest_rating || competitor.google_rating) && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <span className={cn("text-2xl font-bold", getRatingColor(competitor.latest_rating || competitor.google_rating || 0))}>
                            {(competitor.latest_rating || competitor.google_rating || 0).toFixed(1)}
                          </span>
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {competitor.latest_review_count || competitor.review_count || 0} reviews
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {competitor.services.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Services:</p>
                      <div className="flex flex-wrap gap-1">
                        {competitor.services.slice(0, 3).map((service, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                        {competitor.services.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{competitor.services.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {competitor.price_range && (
                    <div className="flex justify-between text-sm">
                      <span>Price Range:</span>
                      <Badge variant="outline">{competitor.price_range}</Badge>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    Last checked: {competitor.last_checked ? new Date(competitor.last_checked).toLocaleDateString() : 'Never'}
                    {competitor.snapshot_count > 0 && (
                      <span> • {competitor.snapshot_count} snapshots</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {competitors.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No competitors tracked yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Add competitors to monitor their ratings, reviews, and market position
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Market Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Trend analysis chart would go here</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Rating and review count trends over time for all competitors
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Competitor History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedCompetitor?.competitor_name} - History
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {historyLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading history...</p>
              </div>
            ) : historyData?.history ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Rating Trend: </span>
                    <Badge variant={
                      historyData.history.trends.rating === 'improving' ? 'default' :
                      historyData.history.trends.rating === 'declining' ? 'destructive' : 'secondary'
                    }>
                      {historyData.history.trends.rating}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Review Trend: </span>
                    <Badge variant={
                      historyData.history.trends.reviews === 'growing' ? 'default' :
                      historyData.history.trends.reviews === 'declining' ? 'destructive' : 'secondary'
                    }>
                      {historyData.history.trends.reviews}
                    </Badge>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-3">Snapshot History ({historyData.history.dataPoints} data points)</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {historyData.history.snapshots.map((snapshot: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-lg text-sm">
                        <div>
                          <p className="font-medium">{new Date(snapshot.snapshot_date).toLocaleDateString()}</p>
                          {snapshot.notes && (
                            <p className="text-muted-foreground">{snapshot.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p>{snapshot.google_rating?.toFixed(1)} ★</p>
                          <p className="text-muted-foreground">{snapshot.review_count} reviews</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No history available</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}