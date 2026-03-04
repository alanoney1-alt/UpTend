import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { Plus, Users, DollarSign, TrendingUp, Calendar as CalendarIcon, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MembershipPlan {
  id: number;
  partner_slug: string;
  plan_name: string;
  monthly_price: number;
  benefits: string[];
  tune_ups_per_year: number;
  discount_percent: number;
  priority_scheduling: boolean;
  created_at: string;
  updated_at: string;
}

interface MembershipSubscriber {
  id: number;
  plan_id: number;
  customer_id: string;
  partner_slug: string;
  status: 'active' | 'cancelled' | 'paused';
  stripe_subscription_id?: string;
  started_at: string;
  next_tune_up_date?: string;
  cancelled_at?: string;
  plan_name: string;
  monthly_price: number;
  benefits: string[];
}

interface MembershipStats {
  activeMembers: number;
  mrr: number;
  churnRate: number;
  upcomingTuneUps: number;
}

export default function PartnerMemberships() {
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlan | null>(null);
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [isEditPlanOpen, setIsEditPlanOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get partner slug from URL or context
  const partnerSlug = "sample-partner"; // In real app, get from route params
  
  // Fetch membership plans
  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['membership-plans', partnerSlug],
    queryFn: async () => {
      const response = await fetch(`/api/partners/${partnerSlug}/memberships/plans`);
      if (!response.ok) throw new Error('Failed to fetch plans');
      return response.json();
    }
  });
  
  // Fetch membership subscribers
  const { data: subscribersData, isLoading: subscribersLoading } = useQuery({
    queryKey: ['membership-subscribers', partnerSlug],
    queryFn: async () => {
      const response = await fetch(`/api/partners/${partnerSlug}/memberships/subscribers`);
      if (!response.ok) throw new Error('Failed to fetch subscribers');
      return response.json();
    }
  });
  
  // Fetch membership stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['membership-stats', partnerSlug],
    queryFn: async () => {
      const response = await fetch(`/api/partners/${partnerSlug}/memberships/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  const plans = plansData?.plans || [];
  const subscribers = subscribersData?.subscribers || [];
  const stats: MembershipStats = statsData?.stats || { 
    activeMembers: 0, 
    mrr: 0, 
    churnRate: 0, 
    upcomingTuneUps: 0 
  };

  // Create plan mutation
  const createPlanMutation = useMutation({
    mutationFn: async (planData: Omit<MembershipPlan, 'id' | 'partner_slug' | 'created_at' | 'updated_at'>) => {
      const response = await fetch(`/api/partners/${partnerSlug}/memberships/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData)
      });
      if (!response.ok) throw new Error('Failed to create plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership-plans', partnerSlug] });
      setIsCreatePlanOpen(false);
      toast({ title: "Success", description: "Membership plan created successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create membership plan", variant: "destructive" });
    }
  });

  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async ({ planId, planData }: { planId: number, planData: Partial<MembershipPlan> }) => {
      const response = await fetch(`/api/partners/${partnerSlug}/memberships/plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData)
      });
      if (!response.ok) throw new Error('Failed to update plan');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membership-plans', partnerSlug] });
      setIsEditPlanOpen(false);
      setSelectedPlan(null);
      toast({ title: "Success", description: "Membership plan updated successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update membership plan", variant: "destructive" });
    }
  });

  // Schedule tune-ups mutation
  const scheduleTuneUpsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/partners/${partnerSlug}/memberships/schedule-tuneups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to schedule tune-ups');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['membership-stats', partnerSlug] });
      toast({ 
        title: "Success", 
        description: `Scheduled ${data.scheduled} tune-ups for members!` 
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to schedule tune-ups", variant: "destructive" });
    }
  });

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const PlanForm = ({ 
    plan, 
    onSubmit, 
    isLoading 
  }: { 
    plan?: MembershipPlan, 
    onSubmit: (data: any) => void, 
    isLoading: boolean 
  }) => {
    const [formData, setFormData] = useState({
      plan_name: plan?.plan_name || '',
      monthly_price: plan?.monthly_price || 0,
      benefits: plan?.benefits.join('\n') || '',
      tune_ups_per_year: plan?.tune_ups_per_year || 0,
      discount_percent: plan?.discount_percent || 0,
      priority_scheduling: plan?.priority_scheduling || false
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit({
        ...formData,
        benefits: formData.benefits.split('\n').filter(b => b.trim())
      });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="plan_name">Plan Name</Label>
          <Input
            id="plan_name"
            value={formData.plan_name}
            onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
            placeholder="e.g., Premium Care Plan"
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="monthly_price">Monthly Price ($)</Label>
            <Input
              id="monthly_price"
              type="number"
              step="0.01"
              value={formData.monthly_price}
              onChange={(e) => setFormData({ ...formData, monthly_price: parseFloat(e.target.value) })}
              required
            />
          </div>
          <div>
            <Label htmlFor="tune_ups_per_year">Tune-ups per Year</Label>
            <Input
              id="tune_ups_per_year"
              type="number"
              value={formData.tune_ups_per_year}
              onChange={(e) => setFormData({ ...formData, tune_ups_per_year: parseInt(e.target.value) })}
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="discount_percent">Discount Percentage</Label>
          <Input
            id="discount_percent"
            type="number"
            max="100"
            value={formData.discount_percent}
            onChange={(e) => setFormData({ ...formData, discount_percent: parseFloat(e.target.value) })}
          />
        </div>
        
        <div>
          <Label htmlFor="benefits">Benefits (one per line)</Label>
          <Textarea
            id="benefits"
            value={formData.benefits}
            onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
            placeholder="Monthly air filter reminder&#10;Priority scheduling&#10;Seasonal tune-up discount"
            rows={4}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="priority_scheduling"
            checked={formData.priority_scheduling}
            onCheckedChange={(checked) => setFormData({ ...formData, priority_scheduling: checked })}
          />
          <Label htmlFor="priority_scheduling">Priority Scheduling</Label>
        </div>
        
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? "Saving..." : plan ? "Update Plan" : "Create Plan"}
        </Button>
      </form>
    );
  };

  if (plansLoading || subscribersLoading || statsLoading) {
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
          <h1 className="text-2xl font-bold">Membership Program</h1>
          <p className="text-muted-foreground">Manage subscription plans and member relationships</p>
        </div>
        
        <Dialog open={isCreatePlanOpen} onOpenChange={setIsCreatePlanOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Membership Plan</DialogTitle>
            </DialogHeader>
            <PlanForm 
              onSubmit={(data) => createPlanMutation.mutate(data)}
              isLoading={createPlanMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.activeMembers}</p>
                <p className="text-sm text-muted-foreground">Active Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.mrr)}</p>
                <p className="text-sm text-muted-foreground">Monthly Recurring Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{stats.churnRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Churn Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.upcomingTuneUps}</p>
                <p className="text-sm text-muted-foreground">Upcoming Tune-ups</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={() => scheduleTuneUpsMutation.mutate()}
                disabled={scheduleTuneUpsMutation.isPending}
                className="w-full md:w-auto"
              >
                {scheduleTuneUpsMutation.isPending ? "Scheduling..." : "Auto-Schedule Tune-ups"}
              </Button>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-lg font-semibold">{plans.length}</p>
                  <p className="text-sm text-muted-foreground">Total Plans</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-lg font-semibold">{subscribers.length}</p>
                  <p className="text-sm text-muted-foreground">Total Subscribers</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-lg font-semibold">
                    {formatCurrency(stats.mrr * 12)}
                  </p>
                  <p className="text-sm text-muted-foreground">Annual Run Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan: MembershipPlan) => (
              <Card key={plan.id} className="relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{plan.plan_name}</CardTitle>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(plan.monthly_price)}<span className="text-sm font-normal">/month</span>
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedPlan(plan);
                          setIsEditPlanOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Tune-ups per year:</span>
                      <Badge variant="secondary">{plan.tune_ups_per_year}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <Badge variant="secondary">{plan.discount_percent}%</Badge>
                    </div>
                    {plan.priority_scheduling && (
                      <Badge className="w-full justify-center">Priority Scheduling</Badge>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-2">Benefits:</h4>
                    <ul className="space-y-1">
                      {plan.benefits.map((benefit, index) => (
                        <li key={index} className="text-sm text-muted-foreground">
                          • {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="subscribers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Membership Subscribers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscribers.map((subscriber: MembershipSubscriber) => (
                  <div key={subscriber.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">Customer ID: {subscriber.customer_id}</p>
                      <p className="text-sm text-muted-foreground">{subscriber.plan_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Started: {new Date(subscriber.started_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(subscriber.monthly_price)}/mo</p>
                        {subscriber.next_tune_up_date && (
                          <p className="text-sm text-muted-foreground">
                            Next tune-up: {new Date(subscriber.next_tune_up_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Badge 
                        variant={
                          subscriber.status === 'active' ? 'default' : 
                          subscriber.status === 'paused' ? 'secondary' : 
                          'destructive'
                        }
                      >
                        {subscriber.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                {subscribers.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No subscribers yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Member Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Growth chart would go here</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Track member acquisition and retention over time
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Revenue chart would go here</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Monthly recurring revenue and growth trends
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditPlanOpen} onOpenChange={setIsEditPlanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Membership Plan</DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <PlanForm 
              plan={selectedPlan}
              onSubmit={(data) => updatePlanMutation.mutate({ planId: selectedPlan.id, planData: data })}
              isLoading={updatePlanMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}