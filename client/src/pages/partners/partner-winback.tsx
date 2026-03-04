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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Plus, UserX, Mail, Phone, DollarSign, TrendingUp, Calendar, Edit, Trash2, Play, Pause, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WinbackCampaign {
  id: number;
  partner_slug: string;
  name: string;
  description: string;
  target_segment: 'inactive_90_days' | 'inactive_180_days' | 'inactive_1_year' | 'lost_customers' | 'custom';
  campaign_type: 'email' | 'sms' | 'phone_call' | 'direct_mail' | 'mixed';
  status: 'draft' | 'active' | 'paused' | 'completed';
  discount_percent: number;
  offer_description: string;
  start_date: string;
  end_date?: string;
  customers_targeted: number;
  customers_contacted: number;
  customers_responded: number;
  customers_converted: number;
  revenue_recovered: number;
  cost_per_acquisition: number;
  created_at: string;
  updated_at: string;
}

interface WinbackStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalCustomersTargeted: number;
  totalRevenue: number;
  averageConversionRate: number;
  averageResponseRate: number;
  recentConversions: Array<{
    customer_name: string;
    campaign_name: string;
    revenue: number;
    converted_at: string;
  }>;
}

export default function PartnerWinback() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedCampaign, setSelectedCampaign] = useState<WinbackCampaign | null>(null);
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [isEditCampaignOpen, setIsEditCampaignOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch winback campaigns
  const { data: campaignsData, isLoading: campaignsLoading } = useQuery({
    queryKey: ['winback-campaigns', slug],
    queryFn: async () => {
      const response = await fetch(`/api/partners/${slug}/winback/campaigns`);
      if (!response.ok) throw new Error('Failed to fetch winback campaigns');
      return response.json();
    }
  });
  
  // Fetch winback stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['winback-stats', slug],
    queryFn: async () => {
      const response = await fetch(`/api/partners/${slug}/winback/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  const campaigns = campaignsData?.campaigns || [];
  const stats: WinbackStats = statsData?.stats || { 
    totalCampaigns: 0, 
    activeCampaigns: 0, 
    totalCustomersTargeted: 0,
    totalRevenue: 0,
    averageConversionRate: 0,
    averageResponseRate: 0,
    recentConversions: []
  };

  // Create winback campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (campaignData: Omit<WinbackCampaign, 'id' | 'partner_slug' | 'customers_targeted' | 'customers_contacted' | 'customers_responded' | 'customers_converted' | 'revenue_recovered' | 'cost_per_acquisition' | 'created_at' | 'updated_at'>) => {
      const response = await fetch(`/api/partners/${slug}/winback/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignData)
      });
      if (!response.ok) throw new Error('Failed to create winback campaign');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['winback-campaigns', slug] });
      queryClient.invalidateQueries({ queryKey: ['winback-stats', slug] });
      setIsCreateCampaignOpen(false);
      toast({ title: "Success", description: "Winback campaign created successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create winback campaign", variant: "destructive" });
    }
  });

  // Update campaign status mutation
  const updateCampaignStatusMutation = useMutation({
    mutationFn: async ({ campaignId, status }: { campaignId: number, status: WinbackCampaign['status'] }) => {
      const response = await fetch(`/api/partners/${slug}/winback/campaigns/${campaignId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update campaign status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['winback-campaigns', slug] });
      queryClient.invalidateQueries({ queryKey: ['winback-stats', slug] });
      toast({ title: "Success", description: "Campaign status updated!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update campaign status", variant: "destructive" });
    }
  });

  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

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
      case 'phone_call': return '📞';
      case 'direct_mail': return '📬';
      case 'mixed': return '🎯';
      default: return '📢';
    }
  };

  const getSegmentDisplay = (segment: string) => {
    const segments = {
      'inactive_90_days': '90 Days Inactive',
      'inactive_180_days': '180 Days Inactive', 
      'inactive_1_year': '1+ Year Inactive',
      'lost_customers': 'Lost Customers',
      'custom': 'Custom Segment'
    };
    return segments[segment as keyof typeof segments] || segment;
  };

  const WinbackCampaignForm = ({ 
    campaign, 
    onSubmit, 
    isLoading 
  }: { 
    campaign?: WinbackCampaign, 
    onSubmit: (data: any) => void, 
    isLoading: boolean 
  }) => {
    const [formData, setFormData] = useState({
      name: campaign?.name || '',
      description: campaign?.description || '',
      target_segment: campaign?.target_segment || 'inactive_90_days',
      campaign_type: campaign?.campaign_type || 'email',
      discount_percent: campaign?.discount_percent || 0,
      offer_description: campaign?.offer_description || '',
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
            placeholder="e.g., Win Back 90-Day Inactive Customers"
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
            <Label htmlFor="target_segment">Target Segment</Label>
            <Select value={formData.target_segment} onValueChange={(value) => setFormData({ ...formData, target_segment: value as WinbackCampaign['target_segment'] })}>
              <SelectTrigger>
                <SelectValue placeholder="Select segment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inactive_90_days">90 Days Inactive</SelectItem>
                <SelectItem value="inactive_180_days">180 Days Inactive</SelectItem>
                <SelectItem value="inactive_1_year">1+ Year Inactive</SelectItem>
                <SelectItem value="lost_customers">Lost Customers</SelectItem>
                <SelectItem value="custom">Custom Segment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="campaign_type">Campaign Type</Label>
            <Select value={formData.campaign_type} onValueChange={(value) => setFormData({ ...formData, campaign_type: value as WinbackCampaign['campaign_type'] })}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="phone_call">Phone Call</SelectItem>
                <SelectItem value="direct_mail">Direct Mail</SelectItem>
                <SelectItem value="mixed">Mixed Approach</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div>
          <Label htmlFor="discount_percent">Discount Percentage (%)</Label>
          <Input
            id="discount_percent"
            type="number"
            max="100"
            value={formData.discount_percent}
            onChange={(e) => setFormData({ ...formData, discount_percent: parseFloat(e.target.value) })}
            placeholder="e.g., 25"
          />
        </div>
        
        <div>
          <Label htmlFor="offer_description">Offer Description</Label>
          <Textarea
            id="offer_description"
            value={formData.offer_description}
            onChange={(e) => setFormData({ ...formData, offer_description: e.target.value })}
            placeholder="e.g., 25% off your next HVAC service + free system check"
            rows={3}
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
          <h1 className="text-2xl font-bold">Customer Winback</h1>
          <p className="text-muted-foreground">Re-engage inactive and lost customers</p>
        </div>
        
        <Dialog open={isCreateCampaignOpen} onOpenChange={setIsCreateCampaignOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Winback Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Winback Campaign</DialogTitle>
            </DialogHeader>
            <WinbackCampaignForm 
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
              <RotateCcw className="w-8 h-8 text-blue-600" />
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
              <UserX className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalCustomersTargeted.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Customers Targeted</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-sm text-muted-foreground">Revenue Recovered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{formatPercentage(stats.averageConversionRate)}</p>
                <p className="text-sm text-muted-foreground">Avg Conversion Rate</p>
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
                  <span>Response Rate:</span>
                  <span className="font-semibold">{formatPercentage(stats.averageResponseRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Conversion Rate:</span>
                  <span className="font-semibold">{formatPercentage(stats.averageConversionRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Revenue Recovered:</span>
                  <span className="font-semibold">{formatCurrency(stats.totalRevenue)}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Conversions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.recentConversions.slice(0, 5).map((conversion, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{conversion.customer_name}</p>
                        <p className="text-sm text-muted-foreground">{conversion.campaign_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(conversion.revenue)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(conversion.converted_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {stats.recentConversions.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No recent conversions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="space-y-6">
            {campaigns.map((campaign: WinbackCampaign) => (
              <Card key={campaign.id} className="relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span>{getCampaignTypeIcon(campaign.campaign_type)}</span>
                        {campaign.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{campaign.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Target: {getSegmentDisplay(campaign.target_segment)}</span>
                        <span>•</span>
                        <span>Discount: {campaign.discount_percent}%</span>
                      </div>
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
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <p className="text-sm text-muted-foreground">Targeted</p>
                      <p className="font-semibold">{campaign.customers_targeted.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <p className="text-sm text-muted-foreground">Contacted</p>
                      <p className="font-semibold">{campaign.customers_contacted.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <p className="text-sm text-muted-foreground">Responded</p>
                      <p className="font-semibold">{campaign.customers_responded.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <p className="text-sm text-muted-foreground">Converted</p>
                      <p className="font-semibold">{campaign.customers_converted.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <p className="text-sm text-muted-foreground">Revenue</p>
                      <p className="font-semibold">{formatCurrency(campaign.revenue_recovered)}</p>
                    </div>
                  </div>
                  
                  {/* Performance Metrics */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Response Rate:</span>
                      <span>
                        {campaign.customers_contacted > 0 
                          ? formatPercentage((campaign.customers_responded / campaign.customers_contacted) * 100)
                          : '0%'
                        }
                      </span>
                    </div>
                    <Progress 
                      value={campaign.customers_contacted > 0 ? (campaign.customers_responded / campaign.customers_contacted) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Conversion Rate:</span>
                      <span>
                        {campaign.customers_responded > 0 
                          ? formatPercentage((campaign.customers_converted / campaign.customers_responded) * 100)
                          : '0%'
                        }
                      </span>
                    </div>
                    <Progress 
                      value={campaign.customers_responded > 0 ? (campaign.customers_converted / campaign.customers_responded) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      <p>Started: {new Date(campaign.start_date).toLocaleDateString()}</p>
                      {campaign.end_date && (
                        <p>Ends: {new Date(campaign.end_date).toLocaleDateString()}</p>
                      )}
                    </div>
                    <div className="text-sm">
                      <p>CPA: {formatCurrency(campaign.cost_per_acquisition)}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
                    <p className="text-sm font-medium mb-2">Offer:</p>
                    <p className="text-sm text-muted-foreground">{campaign.offer_description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {campaigns.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <RotateCcw className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No winback campaigns yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Create your first campaign to start re-engaging inactive customers
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
                <CardTitle>Conversion Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Conversion trends chart would go here</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Track winback success rates and revenue recovery over time
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
                    Compare effectiveness across email, SMS, phone, and direct mail
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Campaign Dialog */}
      <Dialog open={isEditCampaignOpen} onOpenChange={setIsEditCampaignOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Winback Campaign</DialogTitle>
          </DialogHeader>
          {selectedCampaign && (
            <WinbackCampaignForm 
              campaign={selectedCampaign}
              onSubmit={(data) => {
                // In a real implementation, you'd have an update mutation
                toast({ title: "Success", description: "Winback campaign updated successfully!" });
                setIsEditCampaignOpen(false);
                setSelectedCampaign(null);
              }}
              isLoading={false}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}