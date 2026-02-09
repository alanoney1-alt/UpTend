import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AdminSurgeControls } from "@/components/admin-surge-controls";
import {
  Truck,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  Car,
  FileText,
  Shield,
  AlertTriangle,
  ChevronLeft,
  Flag,
  DollarSign,
  Image,
  Scale,
  Eye,
  EyeOff,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

interface PendingPycker {
  profileId: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  vehicleType: string;
  backgroundCheckStatus: string;
  canAcceptJobs: boolean;
  registrationData: {
    streetAddress?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    vehicleYear?: string;
    vehicleMake?: string;
    vehicleModel?: string;
    licensePlate?: string;
    driversLicense?: string;
    insuranceProvider?: string;
    insurancePolicyNumber?: string;
    aboutYou?: string;
    submittedAt?: string;
  };
  createdAt?: string;
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPycker, setSelectedPycker] = useState<PendingPycker | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [pyckerToReject, setPyckerToReject] = useState<PendingPycker | null>(null);
  const [piiRevealed, setPiiRevealed] = useState<Record<string, boolean>>({});

  // Check admin authentication
  const { data: authStatus, isLoading: authLoading } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
    retry: false,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !authStatus?.isAdmin) {
      setLocation("/admin-login");
    }
  }, [authLoading, authStatus, setLocation]);

  const { data: allPyckers = [], isLoading } = useQuery<PendingPycker[]>({
    queryKey: ["/api/admin/pyckers/all"],
    enabled: authStatus?.isAdmin === true,
  });
  
  // Filter by status for tabs
  const pendingPyckers = allPyckers.filter(p => p.backgroundCheckStatus === "pending");
  const approvedPyckers = allPyckers.filter(p => p.backgroundCheckStatus === "approved");
  const rejectedPyckers = allPyckers.filter(p => p.backgroundCheckStatus === "rejected");
  
  const [statusFilter, setStatusFilter] = useState("all");

  // Green Guarantee Rebate Claims
  const { data: pendingRebateClaims = [], isLoading: rebatesLoading } = useQuery<any[]>({
    queryKey: ["/api/rebates/pending"],
    enabled: authStatus?.isAdmin === true,
  });
  
  // Active Jobs for Admin Supervision
  const { data: activeJobs = [], isLoading: activeJobsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/jobs/active"],
    enabled: authStatus?.isAdmin === true,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Admin logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/check"] });
      setLocation("/admin-login");
    },
  });

  const [selectedRebateClaim, setSelectedRebateClaim] = useState<any | null>(null);
  const [denyReasonDialogOpen, setDenyReasonDialogOpen] = useState(false);
  const [denyReason, setDenyReason] = useState("");

  const approveRebateMutation = useMutation({
    mutationFn: async (claimId: string) => {
      return apiRequest("POST", `/api/rebates/${claimId}/approve`, { reviewerId: "admin" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rebates/pending"] });
      toast({
        title: "Rebate Approved",
        description: "The rebate has been credited to the Pro's account.",
      });
      setSelectedRebateClaim(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve rebate claim.",
        variant: "destructive",
      });
    },
  });

  const denyRebateMutation = useMutation({
    mutationFn: async ({ claimId, reason }: { claimId: string; reason: string }) => {
      return apiRequest("POST", `/api/rebates/${claimId}/deny`, { reviewerId: "admin", reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rebates/pending"] });
      toast({
        title: "Rebate Denied",
        description: "The rebate claim has been denied.",
      });
      setSelectedRebateClaim(null);
      setDenyReasonDialogOpen(false);
      setDenyReason("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to deny rebate claim.",
        variant: "destructive",
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (profileId: string) => {
      return apiRequest("POST", `/api/admin/pyckers/${profileId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pyckers/all"] });
      toast({
        title: "Pro Approved",
        description: "Background check approved. Pro can now accept jobs.",
      });
      setSelectedPycker(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve Pro. Please try again.",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ profileId, reason }: { profileId: string; reason: string }) => {
      return apiRequest("POST", `/api/admin/pyckers/${profileId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pyckers/all"] });
      toast({
        title: "Pro Rejected",
        description: "Background check has been rejected.",
      });
      setRejectDialogOpen(false);
      setPyckerToReject(null);
      setRejectReason("");
      setSelectedPycker(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject Pro. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Checking authentication...</div>
      </div>
    );
  }

  // Don't render if not authenticated (redirect will happen via useEffect)
  if (!authStatus?.isAdmin) {
    return null;
  }

  // Get the list based on current tab filter
  const getFilteredByStatus = () => {
    switch (statusFilter) {
      case "pending": return pendingPyckers;
      case "approved": return approvedPyckers;
      case "rejected": return rejectedPyckers;
      default: return allPyckers;
    }
  };
  
  const filteredPyckers = getFilteredByStatus().filter(
    (pycker) =>
      pycker.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pycker.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pycker.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReject = (pycker: PendingPycker) => {
    setPyckerToReject(pycker);
    setRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (pyckerToReject) {
      rejectMutation.mutate({ profileId: pyckerToReject.profileId, reason: rejectReason });
    }
  };

  const formatVehicleType = (type: string) => {
    const types: Record<string, string> = {
      pickup: "Pickup Truck",
      cargo_van: "Cargo Van",
      box_truck_small: "Box Truck (Small)",
      box_truck_large: "Box Truck (Large)",
      flatbed: "Flatbed",
      trailer: "Trailer",
    };
    return types[type] || type;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background" data-testid="page-admin">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back-home">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/" className="flex items-center gap-3">
              <Logo className="w-10 h-10" textClassName="text-xl" />
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-lg font-semibold">Admin Dashboard</span>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/admin/agentic-brain">
              <Button variant="outline" size="sm" data-testid="button-agentic-brain">
                Agentic Brain
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              data-testid="button-admin-logout"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-primary" />
                      Pro Applications
                    </CardTitle>
                    <CardDescription>
                      Review and manage all Pro applications
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary" className="w-fit bg-yellow-500/10 text-yellow-700">
                      {pendingPyckers.length} pending
                    </Badge>
                    <Badge variant="secondary" className="w-fit bg-green-500/10 text-green-700">
                      {approvedPyckers.length} approved
                    </Badge>
                    <Badge variant="secondary" className="w-fit bg-red-500/10 text-red-700">
                      {rejectedPyckers.length} rejected
                    </Badge>
                  </div>
                </div>
                
                <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mt-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all" data-testid="tab-all">
                      All ({allPyckers.length})
                    </TabsTrigger>
                    <TabsTrigger value="pending" data-testid="tab-pending">
                      Pending ({pendingPyckers.length})
                    </TabsTrigger>
                    <TabsTrigger value="approved" data-testid="tab-approved">
                      Approved ({approvedPyckers.length})
                    </TabsTrigger>
                    <TabsTrigger value="rejected" data-testid="tab-rejected">
                      Rejected ({rejectedPyckers.length})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-pyckers"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : filteredPyckers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No Pros match your search" : "No applications found"}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredPyckers.map((pycker) => (
                      <div
                        key={pycker.profileId}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors hover-elevate ${
                          selectedPycker?.profileId === pycker.profileId
                            ? "border-primary bg-primary/5"
                            : ""
                        }`}
                        onClick={() => setSelectedPycker(pycker)}
                        data-testid={`card-pycker-${pycker.profileId}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold truncate">{pycker.name || "Unknown"}</h3>
                              <Badge variant="outline" className="shrink-0">
                                {formatVehicleType(pycker.vehicleType)}
                              </Badge>
                              {pycker.backgroundCheckStatus === "approved" && (
                                <Badge className="bg-green-500/10 text-green-700 border-green-200">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approved
                                </Badge>
                              )}
                              {pycker.backgroundCheckStatus === "rejected" && (
                                <Badge className="bg-red-500/10 text-red-700 border-red-200">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Rejected
                                </Badge>
                              )}
                              {pycker.backgroundCheckStatus === "pending" && (
                                <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-200">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {pycker.companyName || "No company name"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Applied: {formatDate(pycker.createdAt)}
                            </p>
                          </div>
                          {pycker.backgroundCheckStatus === "pending" && (
                            <div className="flex gap-2 shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  approveMutation.mutate(pycker.profileId);
                                }}
                                disabled={approveMutation.isPending}
                                data-testid={`button-approve-${pycker.profileId}`}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReject(pycker);
                                }}
                                disabled={rejectMutation.isPending}
                                data-testid={`button-reject-${pycker.profileId}`}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24 z-40">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Application Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPycker ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedPycker.name}</h3>
                      <p className="text-muted-foreground">{selectedPycker.companyName}</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span data-testid="text-pycker-email">
                          {piiRevealed[`email_${selectedPycker.profileId}`]
                            ? selectedPycker.email
                            : selectedPycker.email ? `${selectedPycker.email.slice(0, 3)}***@${selectedPycker.email.split("@")[1] || "***"}` : "N/A"
                          }
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            const key = `email_${selectedPycker.profileId}`;
                            if (!piiRevealed[key]) {
                              fetch("/api/audit/pii-reveal", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                credentials: "include",
                                body: JSON.stringify({ fieldType: "email", resourceId: `pycker_${selectedPycker.profileId}` }),
                              }).catch(() => {});
                            }
                            setPiiRevealed(prev => ({ ...prev, [key]: !prev[key] }));
                          }}
                          data-testid="button-toggle-email"
                        >
                          {piiRevealed[`email_${selectedPycker.profileId}`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span data-testid="text-pycker-phone">
                          {piiRevealed[`phone_${selectedPycker.profileId}`]
                            ? selectedPycker.phone
                            : selectedPycker.phone ? `(${selectedPycker.phone.replace(/\D/g, "").slice(0, 3)}) ***-${selectedPycker.phone.replace(/\D/g, "").slice(-4)}` : "N/A"
                          }
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            const key = `phone_${selectedPycker.profileId}`;
                            if (!piiRevealed[key]) {
                              fetch("/api/audit/pii-reveal", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                credentials: "include",
                                body: JSON.stringify({ fieldType: "phone_number", resourceId: `pycker_${selectedPycker.profileId}` }),
                              }).catch(() => {});
                            }
                            setPiiRevealed(prev => ({ ...prev, [key]: !prev[key] }));
                          }}
                          data-testid="button-toggle-phone"
                        >
                          {piiRevealed[`phone_${selectedPycker.profileId}`] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </Button>
                      </div>
                      {selectedPycker.registrationData.city && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {selectedPycker.registrationData.city}, {selectedPycker.registrationData.state} {selectedPycker.registrationData.zipCode}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        Vehicle Information
                      </h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Type:</span> {formatVehicleType(selectedPycker.vehicleType)}</p>
                        {selectedPycker.registrationData.vehicleYear && (
                          <p>
                            <span className="text-muted-foreground">Vehicle:</span>{" "}
                            {selectedPycker.registrationData.vehicleYear} {selectedPycker.registrationData.vehicleMake} {selectedPycker.registrationData.vehicleModel}
                          </p>
                        )}
                        {selectedPycker.registrationData.licensePlate && (
                          <p><span className="text-muted-foreground">License Plate:</span> {selectedPycker.registrationData.licensePlate}</p>
                        )}
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Documents
                      </h4>
                      <div className="space-y-1 text-sm">
                        {selectedPycker.registrationData.driversLicense && (
                          <p><span className="text-muted-foreground">Driver's License:</span> {selectedPycker.registrationData.driversLicense}</p>
                        )}
                        {selectedPycker.registrationData.insuranceProvider && (
                          <p><span className="text-muted-foreground">Insurance:</span> {selectedPycker.registrationData.insuranceProvider}</p>
                        )}
                        {selectedPycker.registrationData.insurancePolicyNumber && (
                          <p><span className="text-muted-foreground">Policy #:</span> {selectedPycker.registrationData.insurancePolicyNumber}</p>
                        )}
                      </div>
                    </div>

                    {selectedPycker.registrationData.aboutYou && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-2">About</h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedPycker.registrationData.aboutYou}
                        </p>
                      </div>
                    )}

                    <div className="border-t pt-4 flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => approveMutation.mutate(selectedPycker.profileId)}
                        disabled={approveMutation.isPending}
                        data-testid="button-approve-detail"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleReject(selectedPycker)}
                        disabled={rejectMutation.isPending}
                        data-testid="button-reject-detail"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Select a Pro to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Green Guarantee Rebate Claims Section */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5 text-green-500" />
                  Green Guarantee - Rebate Claims Review
                </CardTitle>
                <CardDescription>
                  AI validates receipts automatically. You have final approval on all rebates (10% max $25).
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary" className="w-fit bg-green-500/10 text-green-700">
                  {pendingRebateClaims.filter((c: any) => c.status === 'pending').length} pending
                </Badge>
                <Badge variant="secondary" className="w-fit bg-amber-500/10 text-amber-700">
                  {pendingRebateClaims.filter((c: any) => c.status === 'flagged').length} flagged
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {rebatesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
              </div>
            ) : pendingRebateClaims.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Flag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No pending rebate claims</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRebateClaims.map((claim: any) => {
                  const isFlagged = claim.status === 'flagged';
                  const validationFlags = claim.validationFlags || [];
                  
                  return (
                    <div
                      key={claim.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors hover-elevate ${
                        selectedRebateClaim?.id === claim.id 
                          ? isFlagged ? "border-amber-500 bg-amber-500/5" : "border-green-500 bg-green-500/5" 
                          : isFlagged ? "border-amber-400/50 bg-amber-500/5" : ""
                      }`}
                      onClick={() => setSelectedRebateClaim(claim)}
                      data-testid={`card-rebate-${claim.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {isFlagged && (
                              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                            )}
                            <h3 className="font-semibold truncate">{claim.facilityName || "Disposal Receipt"}</h3>
                            <Badge variant="outline" className={`shrink-0 ${isFlagged ? 'bg-amber-500/10 text-amber-700' : 'bg-green-500/10'}`}>
                              {isFlagged ? 'Flagged' : 'Pending'}
                            </Badge>
                            <Badge variant="outline" className="shrink-0">
                              {claim.facilityType || "recycling"}
                            </Badge>
                          </div>
                          
                          {/* Validation Flags */}
                          {validationFlags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {validationFlags.map((flag: string) => (
                                <Badge key={flag} variant="destructive" className="text-xs">
                                  {flag.replace(/_/g, ' ')}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          {/* Receipt Details Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-sm">
                            <div>
                              <span className="text-muted-foreground block text-xs">Job Total</span>
                              <span className="font-medium">${claim.jobTotalPrice?.toFixed(2) || "0.00"}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-xs">Rebate</span>
                              <span className="font-medium text-green-600">${claim.rebateAmount?.toFixed(2) || "0.00"}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-xs">Weight</span>
                              <span className={`font-medium ${claim.varianceStatus === 'high' || claim.varianceStatus === 'low' ? 'text-amber-600' : ''}`}>
                                {claim.receiptWeight ? `${claim.receiptWeight} lbs` : 'N/A'}
                                {claim.estimatedWeight && (
                                  <span className="text-muted-foreground text-xs ml-1">(est: {claim.estimatedWeight})</span>
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-xs">Variance</span>
                              <span className={`font-medium ${(claim.variancePercent || 0) > 20 ? 'text-amber-600' : 'text-green-600'}`}>
                                {claim.variancePercent !== null ? `${claim.variancePercent?.toFixed(1)}%` : 'N/A'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Receipt Info */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 text-sm">
                            <div>
                              <span className="text-muted-foreground block text-xs">Receipt #</span>
                              <span className="font-mono text-xs">{claim.receiptNumber || 'Not provided'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-xs">Receipt Date</span>
                              <span className="text-xs">{claim.receiptDate ? new Date(claim.receiptDate).toLocaleString() : 'Not provided'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-xs">Fee Charged</span>
                              <span className="text-xs">{claim.feeCharged ? `$${claim.feeCharged.toFixed(2)}` : 'Not provided'}</span>
                            </div>
                          </div>
                          
                          {/* Facility Address */}
                          {claim.facilityAddress && (
                            <div className="mt-2">
                              <span className="text-muted-foreground text-xs block">Facility Address</span>
                              <span className="text-xs">{claim.facilityAddress}</span>
                            </div>
                          )}
                          
                          {/* AI Validation Section */}
                          <div className="mt-3 pt-3 border-t border-dashed">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-medium text-muted-foreground">AI Validation:</span>
                              {claim.aiValidationStatus === 'pending' ? (
                                <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-700">
                                  Pending Analysis
                                </Badge>
                              ) : claim.aiValidationStatus === 'passed' ? (
                                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700">
                                  AI Approved
                                </Badge>
                              ) : claim.aiValidationStatus === 'failed' ? (
                                <Badge variant="outline" className="text-xs bg-red-500/10 text-red-700">
                                  AI Flagged
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-700">
                                  Needs Review
                                </Badge>
                              )}
                              {claim.aiConfidenceScore !== null && claim.aiConfidenceScore !== undefined && (
                                <span className="text-xs text-muted-foreground">
                                  ({claim.aiConfidenceScore}% confidence)
                                </span>
                              )}
                            </div>
                            {claim.aiValidationNotes && (
                              <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                                {claim.aiValidationNotes}
                              </p>
                            )}
                          </div>
                          
                          <p className="text-xs text-muted-foreground mt-2">
                            Submitted: {new Date(claim.submittedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 border-green-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              approveRebateMutation.mutate(claim.id);
                            }}
                            disabled={approveRebateMutation.isPending}
                            data-testid={`button-approve-rebate-${claim.id}`}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRebateClaim(claim);
                              setDenyReasonDialogOpen(true);
                            }}
                            disabled={denyRebateMutation.isPending}
                            data-testid={`button-deny-rebate-${claim.id}`}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {claim.receiptUrl && (
                        <div className="mt-3 pt-3 border-t">
                          <a 
                            href={claim.receiptUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary flex items-center gap-1 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                            data-testid={`link-receipt-${claim.id}`}
                          >
                            <Image className="h-4 w-4" />
                            View Receipt Photo
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Active Jobs Supervision Section */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Active Jobs Supervision
                </CardTitle>
                <CardDescription>
                  Monitor all in-progress jobs across the platform. Real-time updates every 30 seconds.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary" className="w-fit bg-primary/10 text-primary">
                  {activeJobs.filter((j: any) => j.status === 'in_progress').length} in progress
                </Badge>
                <Badge variant="secondary" className="w-fit bg-amber-500/10 text-amber-700">
                  {activeJobs.filter((j: any) => j.status === 'accepted' || j.status === 'assigned').length} awaiting start
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activeJobsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : activeJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No active jobs at the moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeJobs.map((job: any) => {
                  const isInProgress = job.status === 'in_progress';
                  const hasAdjustments = job.adjustments && job.adjustments.length > 0;
                  const adjustmentsTotal = job.adjustments?.reduce((sum: number, adj: any) => sum + (adj.priceChange || 0), 0) || 0;
                  
                  return (
                    <div
                      key={job.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        isInProgress ? "border-primary/50 bg-primary/5" : "border-amber-400/50 bg-amber-500/5"
                      }`}
                      data-testid={`card-active-job-${job.id}`}
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <Badge variant={isInProgress ? "default" : "secondary"} className="shrink-0">
                              {isInProgress ? (
                                <>
                                  <Clock className="h-3 w-3 mr-1 animate-pulse" />
                                  In Progress
                                </>
                              ) : (
                                <>
                                  <Clock className="h-3 w-3 mr-1" />
                                  {job.status === 'accepted' ? 'Accepted' : 'Assigned'}
                                </>
                              )}
                            </Badge>
                            <Badge variant="outline" className="shrink-0">
                              {job.serviceType?.replace(/_/g, ' ') || 'Service'}
                            </Badge>
                            {hasAdjustments && (
                              <Badge variant="outline" className="shrink-0 bg-amber-500/10 text-amber-700">
                                +${adjustmentsTotal} adjustments
                              </Badge>
                            )}
                          </div>
                          
                          {/* Job Details Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground block text-xs">Customer</span>
                              <span className="font-medium">{job.customerName || 'N/A'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-xs">Pro</span>
                              <span className="font-medium">{job.haulerName || 'Unassigned'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-xs">Price</span>
                              <span className="font-medium text-green-600">
                                ${job.livePrice || job.priceEstimate || 0}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground block text-xs">Payment</span>
                              <Badge variant="outline" className={`text-xs ${
                                job.paymentStatus === 'authorized' ? 'bg-green-500/10 text-green-700' :
                                job.paymentStatus === 'captured' ? 'bg-blue-500/10 text-blue-700' :
                                'bg-amber-500/10 text-amber-700'
                              }`}>
                                {job.paymentStatus || 'pending'}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Location */}
                          <div className="flex items-start gap-2 mt-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>{job.pickupAddress}, {job.pickupCity} {job.pickupZip}</span>
                          </div>
                          
                          {/* Adjustments List */}
                          {hasAdjustments && (
                            <div className="mt-3 pt-3 border-t border-dashed">
                              <span className="text-xs font-medium text-muted-foreground mb-2 block">Adjustments:</span>
                              <div className="flex flex-wrap gap-2">
                                {job.adjustments.map((adj: any, idx: number) => (
                                  <Badge 
                                    key={idx} 
                                    variant="outline" 
                                    className={`text-xs ${
                                      adj.status === 'approved' ? 'bg-green-500/10 text-green-700' :
                                      adj.status === 'pending' ? 'bg-amber-500/10 text-amber-700' :
                                      'bg-red-500/10 text-red-700'
                                    }`}
                                  >
                                    {adj.itemName}: {adj.priceChange >= 0 ? '+' : ''}${adj.priceChange}
                                    {adj.status === 'pending' && ' (pending)'}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Timeline */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs text-muted-foreground">
                            {job.acceptedAt && (
                              <div>
                                <span className="block">Accepted</span>
                                <span className="font-medium">{new Date(job.acceptedAt).toLocaleTimeString()}</span>
                              </div>
                            )}
                            {job.startedAt && (
                              <div>
                                <span className="block">Started</span>
                                <span className="font-medium">{new Date(job.startedAt).toLocaleTimeString()}</span>
                              </div>
                            )}
                            {job.contactConfirmedAt && (
                              <div>
                                <span className="block">Customer Contacted</span>
                                <span className="font-medium text-green-600">
                                  <CheckCircle className="h-3 w-3 inline mr-1" />
                                  Yes
                                </span>
                              </div>
                            )}
                            {!job.contactConfirmedAt && job.acceptedAt && (
                              <div>
                                <span className="block">Customer Contacted</span>
                                <span className="font-medium text-amber-600">
                                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                                  Not yet
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Actions Column */}
                        <div className="flex flex-col gap-2 shrink-0">
                          <Badge variant="outline" className="text-xs justify-center">
                            #{job.id?.slice(0, 8)}
                          </Badge>
                          {job.haulerPhone && (
                            <a 
                              href={`tel:${job.haulerPhone}`} 
                              className="text-xs text-center text-primary hover:underline flex items-center justify-center gap-1"
                              data-testid={`link-call-pycker-${job.id}`}
                            >
                              <Phone className="h-3 w-3" />
                              Call Pro
                            </a>
                          )}
                          {job.customerPhone && (
                            <a 
                              href={`tel:${job.customerPhone}`} 
                              className="text-xs text-center text-muted-foreground hover:underline flex items-center justify-center gap-1"
                              data-testid={`link-call-customer-${job.id}`}
                            >
                              <Phone className="h-3 w-3" />
                              Call Customer
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Deny Rebate Dialog */}
      <Dialog open={denyReasonDialogOpen} onOpenChange={(open) => {
        setDenyReasonDialogOpen(open);
        if (!open) {
          setDenyReason("");
          setSelectedRebateClaim(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Deny Rebate Claim
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for denying this rebate claim.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Reason for denial</label>
            <Textarea
              placeholder="e.g., Receipt weight doesn't match job estimate, invalid facility, etc."
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
              className="mt-2"
              data-testid="input-deny-rebate-reason"
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDenyReasonDialogOpen(false);
                setDenyReason("");
                setSelectedRebateClaim(null);
              }}
              data-testid="button-cancel-deny-rebate"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedRebateClaim) {
                  denyRebateMutation.mutate({ claimId: selectedRebateClaim.id, reason: denyReason });
                }
              }}
              disabled={denyRebateMutation.isPending || !denyReason.trim()}
              data-testid="button-confirm-deny-rebate"
            >
              {denyRebateMutation.isPending ? "Denying..." : "Deny Claim"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Reject Application
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reject {pyckerToReject?.name}'s application? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Reason for rejection (optional)</label>
            <Textarea
              placeholder="Provide a reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-2"
              data-testid="input-reject-reason"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={rejectMutation.isPending}
              data-testid="button-confirm-reject"
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="mt-8">
        <AdminSurgeControls />
      </div>
    </div>
  );
}
