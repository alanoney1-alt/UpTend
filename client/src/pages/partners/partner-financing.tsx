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
import { Plus, CreditCard, DollarSign, TrendingUp, Calendar, Edit, Trash2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FinancingApplication {
  id: number;
  partner_slug: string;
  customer_id: string;
  customer_name: string;
  email: string;
  phone: string;
  requested_amount: number;
  approved_amount?: number;
  status: 'pending' | 'approved' | 'rejected' | 'funded';
  credit_score?: number;
  monthly_income: number;
  employment_status: string;
  loan_term_months: number;
  interest_rate?: number;
  monthly_payment?: number;
  created_at: string;
  updated_at: string;
}

interface FinancingStats {
  totalApplications: number;
  approvedApplications: number;
  approvalRate: number;
  averageLoanAmount: number;
  totalFunded: number;
  pendingReview: number;
}

export default function PartnerFinancing() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedApplication, setSelectedApplication] = useState<FinancingApplication | null>(null);
  const [isCreateApplicationOpen, setIsCreateApplicationOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch financing applications
  const { data: applicationsData, isLoading: applicationsLoading } = useQuery({
    queryKey: ['financing-applications', slug],
    queryFn: async () => {
      const response = await fetch(`/api/partners/${slug}/financing/applications`);
      if (!response.ok) throw new Error('Failed to fetch applications');
      return response.json();
    }
  });
  
  // Fetch financing stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['financing-stats', slug],
    queryFn: async () => {
      const response = await fetch(`/api/partners/${slug}/financing/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  const applications = applicationsData?.applications || [];
  const stats: FinancingStats = statsData?.stats || { 
    totalApplications: 0, 
    approvedApplications: 0, 
    approvalRate: 0,
    averageLoanAmount: 0,
    totalFunded: 0,
    pendingReview: 0
  };

  // Review application mutation
  const reviewApplicationMutation = useMutation({
    mutationFn: async ({ applicationId, decision, approvedAmount, interestRate }: { 
      applicationId: number, 
      decision: 'approve' | 'reject',
      approvedAmount?: number,
      interestRate?: number
    }) => {
      const response = await fetch(`/api/partners/${slug}/financing/applications/${applicationId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, approvedAmount, interestRate })
      });
      if (!response.ok) throw new Error('Failed to review application');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financing-applications', slug] });
      queryClient.invalidateQueries({ queryKey: ['financing-stats', slug] });
      setIsReviewDialogOpen(false);
      setSelectedApplication(null);
      toast({ title: "Success", description: "Application reviewed successfully!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to review application", variant: "destructive" });
    }
  });

  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'funded': return 'secondary';
      default: return 'outline';
    }
  };

  const ReviewDialog = () => {
    const [decision, setDecision] = useState<'approve' | 'reject'>('approve');
    const [approvedAmount, setApprovedAmount] = useState(selectedApplication?.requested_amount || 0);
    const [interestRate, setInterestRate] = useState(7.5);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedApplication) return;
      
      reviewApplicationMutation.mutate({
        applicationId: selectedApplication.id,
        decision,
        approvedAmount: decision === 'approve' ? approvedAmount : undefined,
        interestRate: decision === 'approve' ? interestRate : undefined
      });
    };

    return (
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Financing Application</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Customer: {selectedApplication?.customer_name}</Label>
              <p className="text-sm text-muted-foreground">
                Requested: {formatCurrency(selectedApplication?.requested_amount || 0)}
              </p>
            </div>
            
            <div className="flex space-x-4">
              <Button
                type="button"
                variant={decision === 'approve' ? 'default' : 'outline'}
                onClick={() => setDecision('approve')}
                className="flex-1"
              >
                Approve
              </Button>
              <Button
                type="button"
                variant={decision === 'reject' ? 'destructive' : 'outline'}
                onClick={() => setDecision('reject')}
                className="flex-1"
              >
                Reject
              </Button>
            </div>
            
            {decision === 'approve' && (
              <>
                <div>
                  <Label htmlFor="approvedAmount">Approved Amount</Label>
                  <Input
                    id="approvedAmount"
                    type="number"
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(parseFloat(e.target.value))}
                    max={selectedApplication?.requested_amount}
                  />
                </div>
                <div>
                  <Label htmlFor="interestRate">Interest Rate (%)</Label>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                  />
                </div>
              </>
            )}
            
            <Button type="submit" disabled={reviewApplicationMutation.isPending} className="w-full">
              {reviewApplicationMutation.isPending ? "Processing..." : `${decision === 'approve' ? 'Approve' : 'Reject'} Application`}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  if (applicationsLoading || statsLoading) {
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
          <h1 className="text-2xl font-bold">Customer Financing</h1>
          <p className="text-muted-foreground">Manage financing applications and loan approvals</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalApplications}</p>
                <p className="text-sm text-muted-foreground">Total Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.approvalRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Approval Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalFunded)}</p>
                <p className="text-sm text-muted-foreground">Total Funded</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.pendingReview}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Average Loan Amount:</span>
                  <span className="font-semibold">{formatCurrency(stats.averageLoanAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Approved Applications:</span>
                  <span className="font-semibold">{stats.approvedApplications}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending Review:</span>
                  <span className="font-semibold">{stats.pendingReview}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Application Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['pending', 'approved', 'rejected', 'funded'].map(status => {
                    const count = applications.filter((app: FinancingApplication) => app.status === status).length;
                    const percentage = stats.totalApplications > 0 ? (count / stats.totalApplications) * 100 : 0;
                    
                    return (
                      <div key={status} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{status}</span>
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

        <TabsContent value="applications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Financing Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {applications.map((application: FinancingApplication) => (
                  <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{application.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{application.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Applied: {new Date(application.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm">
                        Income: {formatCurrency(application.monthly_income)}/mo • {application.employment_status}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(application.requested_amount)}</p>
                        <p className="text-sm text-muted-foreground">
                          {application.loan_term_months} months
                        </p>
                        {application.credit_score && (
                          <p className="text-sm text-muted-foreground">
                            Credit: {application.credit_score}
                          </p>
                        )}
                      </div>
                      <Badge variant={getStatusBadgeVariant(application.status)}>
                        {application.status}
                      </Badge>
                      {application.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedApplication(application);
                            setIsReviewDialogOpen(true);
                          }}
                        >
                          Review
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {applications.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No financing applications yet</p>
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
                <CardTitle>Approval Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Approval trends chart would go here</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Track approval rates and loan volume over time
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Credit Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Credit score distribution would go here</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    View credit score ranges of approved applicants
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <ReviewDialog />
    </div>
  );
}