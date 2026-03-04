import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Megaphone, Users, Eye, MousePointer, TrendingUp, Calendar, Edit, Trash2, Play, Pause } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Campaign {
  id: number;
  partner_slug: string;
  name: string;
  description: string;
  type: 'email' | 'sms' | 'social' | 'direct_mail';
  status: 'draft' | 'active' | 'paused' | 'completed';
  target_audience: string;
  budget: number;
  start_date: string;
  end_date?: string;
  impressions: number;
  clicks: number;
  conversions: number;
  cost_per_click: number;
  conversion_rate: number;
  created_at: string;
  updated_at: string;
}

interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalBudget: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  averageCTR: number;
  averageConversionRate: number;
}

export default function PartnerCampaigns() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [isEditCampaignOpen, setIsEditCampaignOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch campaigns
  const { data: campaignsData, isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns', slug],
    queryFn: async () => {
      const response = await fetch(`/api/partners/${slug}/campaigns`);
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      return response.json();
    }
  });
  
  // Fetch campaign stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['campaign-stats', slug],
    queryFn: async () => {
      const response = await fetch(`/api/partners/${slug}/campaigns/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  const campaigns = campaignsData?.campaigns || [];
  const stats: CampaignStats = statsData?.stats || { 
    totalCampaigns: 0, 
    activeCampaigns: 0, 
    totalBudget: 0,
    totalImpressions: 0,
    totalClicks: 0,
    totalConversions: 0,
    averageCTR: 0,
    averageConversionRate: 0
  };

  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: Omit<Campaign, 'id' | 'partner_slug' | 'impressions' | 'clicks' | 'conversions' | 'cost_per_click' | 'conversion_rate' | 'created_at' | 'updated_at'>) => {
      const response = await fetch(`/api/partners/${slug}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData)
      });
      if (!response.ok) throw new Error('Failed to create campaign');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', slug] });
      queryClient.invalidateQueries({ queryKey: ['campaign-stats', slug] });
      setIsCreateCampaignOpen(false);
      toast({ title: "Success", description: "Campaign created successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create campaign", variant: "destructive" });
    }
  });

  // Update campaign status mutation
  const updateCampaignStatusMutation = useMutation({
    mutationFn: async ({ campaignId, status }: { campaignId: number, status: Campaign['status'] }) => {
      const response = await fetch(`/api/partners/${slug}/campaigns/${campaignId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update campaign status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', slug] });
      queryClient.invalidateQueries({ queryKey: ['campaign-stats', slug] });
      toast({ title: "Success", description: "Campaign status updated!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update campaign status", variant: "destructive" });
    }
  });

  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
  const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'paused': return 'secondary';
      case 'completed': return 'outline';
      default: return 'destructive';
    }
  };

  const getCampaignTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return '📧';
      case 'sms': return '📱';
      case 'social': return '📱';
      case 'direct_mail': return '📬';
      default: return '📢';
    }
  };

  const CampaignForm = ({ 
    campaign, 
    onSubmit, 
    isLoading 
  }: { 
    campaign?: Campaign, 
    onSubmit: (data: any) => void, 
    isLoading: boolean 
  }) => {
    const [formData, setFormData] = useState({
      name: campaign?.name || '',
      description: campaign?.description || '',
      type: campaign?.type || 'email',
      target_audience: campaign?.target_audience || '',
      budget: campaign?.budget || 0,
      start_date: campaign?.start_date ? new Date(campaign.start_date).toISOString().split('T')[0] : '',
      end_date: campaign?.end_date ? new Date(campaign.end_date).toISOString().split('T')[0] : '',
      status: campaign?.status || 'draft'
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Campaign Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Spring HVAC Promotion"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Campaign description and goals"
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="type">Campaign Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as Campaign['type'] })}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="social">Social Media</SelectItem>
                <SelectItem value="direct_mail">Direct Mail</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="budget">Budget ($)</Label>
            <Input
              id="budget"
              type="number"
              step="0.01"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) })}
              required
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="target_audience">Target Audience</Label>
          <Input
            id="target_audience"
            value={formData.target_audience}
            onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
            placeholder="e.g., Homeowners 35-65 in service area"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_date">Start Date</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="end_date">End Date (Optional)</Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>
        </div>
        
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Saving..." : campaign ? "Update Campaign" : "Create Campaign"}
        </Button>
      </form>
    );
  };

  if (campaignsLoading || statsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
          <h1 className="text-2xl font-bold">Marketing Campaigns</h1>
          <p className="text-muted-foreground">Create and manage marketing campaigns</p>
        </div>
        
        <Dialog open={isCreateCampaignOpen} onOpenChange={setIsCreateCampaignOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Marketing Campaign</DialogTitle>
            </DialogHeader>
            <CampaignForm 
              onSubmit={(data) => createCampaignMutation.mutate(data)}
              isLoading={createCampaignMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Megaphone className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalCampaigns}</p>
                <p className="text-sm text-muted-foreground">Total Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Eye className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalImpressions.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Impressions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MousePointer className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{formatPercentage(stats.averageCTR)}</p>
                <p className="text-sm text-muted-foreground">Average CTR</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{formatPercentage(stats.averageConversionRate)}</p>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Active Campaigns:</span>
                  <span className="font-semibold">{stats.activeCampaigns}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Budget:</span>
                  <span className="font-semibold">{formatCurrency(stats.totalBudget)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Clicks:</span>
                  <span className="font-semibold">{stats.totalClicks.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Conversions:</span>
                  <span className="font-semibold">{stats.totalConversions.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Campaign Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['email', 'sms', 'social', 'direct_mail'].map(type => {
                    const count = campaigns.filter((campaign: Campaign) => campaign.type === type).length;
                    const percentage = stats.totalCampaigns > 0 ? (count / stats.totalCampaigns) * 100 : 0;
                    
                    return (
                      <div key={type} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{getCampaignTypeIcon(type)} {type.replace('_', ' ')}</span>
                          <span>{count} ({percentage.toFixed(0)}%)</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {campaigns.map((campaign: Campaign) => (
              <Card key={campaign.id} className="relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span>{getCampaignTypeIcon(campaign.type)}</span>
                        {campaign.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{campaign.description}</p>
                      <p className="text-sm text-muted-foreground">
                        Target: {campaign.target_audience}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusBadgeVariant(campaign.status)}>
                        {campaign.status}
                      </Badge>
                      {campaign.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => updateCampaignStatusMutation.mutate({ campaignId: campaign.id, status: 'active' })}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Launch
                        </Button>
                      )}
                      {campaign.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateCampaignStatusMutation.mutate({ campaignId: campaign.id, status: 'paused' })}
                        >
                          <Pause className="w-4 h-4 mr-1" />
                          Pause
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <p className="text-sm text-muted-foreground">Budget</p>
                      <p className="font-semibold">{formatCurrency(campaign.budget)}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <p className="text-sm text-muted-foreground">Impressions</p>
                      <p className="font-semibold">{campaign.impressions.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <p className="text-sm text-muted-foreground">Clicks</p>
                      <p className="font-semibold">{campaign.clicks.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <p className="text-sm text-muted-foreground">Conversions</p>
                      <p className="font-semibold">{campaign.conversions.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      <p>Started: {new Date(campaign.start_date).toLocaleDateString()}</p>
                      {campaign.end_date && (
                        <p>Ends: {new Date(campaign.end_date).toLocaleDateString()}</p>
                      )}
                    </div>
                    <div className="text-sm">
                      <p>CTR: {formatPercentage(campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0)}</p>
                      <p>CVR: {formatPercentage(campaign.conversion_rate)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {campaigns.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No campaigns yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Create your first marketing campaign to get started
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Performance Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Performance chart would go here</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Track clicks, conversions, and ROI over time
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Channel Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Channel comparison chart would go here</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Compare performance across email, SMS, social, and direct mail
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}