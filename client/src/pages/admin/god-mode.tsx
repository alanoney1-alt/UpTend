import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  MapPin,
  DollarSign,
  AlertTriangle,
  Users,
  Search,
  ChevronLeft,
  Activity,
  Truck,
  Clock,
  Ban,
  RefreshCw,
  Loader2,
  Shield,
  TrendingUp,
  Zap,
  Eye,
} from "lucide-react";

interface ActiveJob {
  id: string;
  status: string;
  serviceType?: string;
  customerName?: string;
  haulerName?: string;
  livePrice?: number;
  pickupAddress?: string;
  lat?: number;
  lng?: number;
  createdAt?: string;
}

interface UserRecord {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  phone?: string;
  isBanned?: boolean;
  createdAt?: string;
}

export default function GodMode() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);

  const { data: authStatus, isLoading: authLoading } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check"],
    retry: false,
  });

  useEffect(() => {
    if (!authLoading && !authStatus?.isAdmin) {
      setLocation("/admin-login");
    }
  }, [authLoading, authStatus, setLocation]);

  const { data: activeJobs = [], isLoading: jobsLoading } = useQuery<ActiveJob[]>({
    queryKey: ["/api/admin/jobs/active"],
    enabled: authStatus?.isAdmin === true,
    refetchInterval: 15000,
  });

  const { data: allJobs = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/jobs/active", "all"],
    queryFn: async () => {
      const res = await fetch("/api/admin/jobs/active");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: authStatus?.isAdmin === true,
    refetchInterval: 30000,
  });

  const flaggedJobs = activeJobs.filter(
    (j) => j.status === "disputed" || j.status === "problem" || j.status === "flagged"
  );

  const todayRevenue = activeJobs.reduce((sum, j) => sum + (j.livePrice || 0), 0);
  const pyckerPayouts = todayRevenue * 0.8;

  const banUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/admin/users/${userId}/ban`, {});
    },
    onSuccess: () => {
      toast({ title: "User Banned", description: "The user has been banned from the platform." });
      setBanDialogOpen(false);
      setSelectedUser(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to ban user.", variant: "destructive" });
    },
  });

  const refundUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/admin/users/${userId}/refund`, {});
    },
    onSuccess: () => {
      toast({ title: "Refund Initiated", description: "The refund has been initiated." });
      setRefundDialogOpen(false);
      setSelectedUser(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to process refund.", variant: "destructive" });
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!authStatus?.isAdmin) return null;

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  return (
    <div className="min-h-screen bg-background" data-testid="page-god-mode">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Button variant="ghost" size="icon" data-testid="button-back-admin">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-bold">God Mode</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1" data-testid="badge-live">
              <Activity className="w-3 h-3 text-emerald-500" />
              Live
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="card-active-jobs">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Active Jobs</p>
                  <p className="text-3xl font-bold" data-testid="text-active-jobs-count">{activeJobs.length}</p>
                </div>
                <div className="p-3 rounded-md bg-primary/10">
                  <Truck className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-revenue-today">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue Today</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400" data-testid="text-revenue-today">
                    {formatCurrency(todayRevenue)}
                  </p>
                </div>
                <div className="p-3 rounded-md bg-emerald-500/10">
                  <TrendingUp className="w-6 h-6 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-pycker-payouts">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Pro Payouts</p>
                  <p className="text-3xl font-bold" data-testid="text-pycker-payouts">
                    {formatCurrency(pyckerPayouts)}
                  </p>
                </div>
                <div className="p-3 rounded-md bg-blue-500/10">
                  <DollarSign className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-disputes">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Disputes / Flags</p>
                  <p className="text-3xl font-bold text-destructive" data-testid="text-disputes-count">
                    {flaggedJobs.length}
                  </p>
                </div>
                <div className="p-3 rounded-md bg-destructive/10">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="map" data-testid="tabs-god-mode">
          <TabsList>
            <TabsTrigger value="map" data-testid="tab-live-map">Live Map</TabsTrigger>
            <TabsTrigger value="disputes" data-testid="tab-disputes">Dispute Center</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">User Manager</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-4">
            <Card data-testid="card-live-map">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Live Job &amp; Pro Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-md p-8 min-h-[400px] flex flex-col items-center justify-center gap-4" data-testid="map-placeholder">
                  <MapPin className="w-12 h-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground text-center">
                    Live map integration ready. Connect Google Maps API to display real-time job pins and Pro locations.
                  </p>
                  {activeJobs.length > 0 && (
                    <div className="w-full max-w-2xl space-y-2 mt-4">
                      <p className="text-sm font-semibold">Active Job Locations:</p>
                      {activeJobs.map((job) => (
                        <div
                          key={job.id}
                          className="flex items-center justify-between gap-4 p-3 rounded-md border"
                          data-testid={`map-job-pin-${job.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                            <div>
                              <p className="text-sm font-medium">{job.haulerName || "Unassigned"}</p>
                              <p className="text-xs text-muted-foreground">{job.pickupAddress || "Address pending"}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="capitalize">
                            {job.status?.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeJobs.length === 0 && !jobsLoading && (
                    <p className="text-sm text-muted-foreground">No active jobs right now.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="disputes" className="mt-4">
            <Card data-testid="card-dispute-center">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Dispute Center
                </CardTitle>
              </CardHeader>
              <CardContent>
                {flaggedJobs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground" data-testid="text-no-disputes">
                    <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                    <p>No flagged jobs. All clear.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {flaggedJobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between gap-4 p-4 rounded-md border border-destructive/20 bg-destructive/5"
                        data-testid={`dispute-job-${job.id}`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">Job #{job.id}</p>
                            <Badge variant="destructive" className="capitalize">
                              {job.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {job.customerName} — {job.haulerName || "Unassigned"}
                          </p>
                          <p className="text-xs text-muted-foreground">{job.pickupAddress}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" data-testid={`button-view-dispute-${job.id}`}>
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <Card data-testid="card-user-manager">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Manager
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-user-search"
                  />
                </div>

                {userSearchQuery.length >= 2 ? (
                  <UserSearchResults
                    query={userSearchQuery}
                    onBan={(user) => { setSelectedUser(user); setBanDialogOpen(true); }}
                    onRefund={(user) => { setSelectedUser(user); setRefundDialogOpen(true); }}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-search-prompt">
                    <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
                    <p>Type at least 2 characters to search for users.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Are you sure you want to ban {selectedUser?.firstName} {selectedUser?.lastName}? They will be unable to use the platform.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => selectedUser && banUserMutation.mutate(selectedUser.id)}
              disabled={banUserMutation.isPending}
              data-testid="button-confirm-ban"
            >
              {banUserMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4 mr-1" />}
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Refund</DialogTitle>
            <DialogDescription>
              Issue a manual refund for {selectedUser?.firstName} {selectedUser?.lastName}? This will process via Stripe.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => selectedUser && refundUserMutation.mutate(selectedUser.id)}
              disabled={refundUserMutation.isPending}
              data-testid="button-confirm-refund"
            >
              {refundUserMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserSearchResults({
  query,
  onBan,
  onRefund,
}: {
  query: string;
  onBan: (user: UserRecord) => void;
  onRefund: (user: UserRecord) => void;
}) {
  const { data: results = [], isLoading } = useQuery<UserRecord[]>({
    queryKey: ["/api/admin/users/search", query],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: query.length >= 2,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground" data-testid="text-no-results">
        <p>No users found matching "{query}"</p>
      </div>
    );
  }

  return (
    <div className="space-y-2" data-testid="user-search-results">
      {results.map((user) => (
        <div
          key={user.id}
          className="flex items-center justify-between gap-4 p-4 rounded-md border"
          data-testid={`user-row-${user.id}`}
        >
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{user.firstName} {user.lastName}</p>
              <Badge variant="secondary" className="capitalize">{user.role || "customer"}</Badge>
              {user.isBanned && <Badge variant="destructive">Banned</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRefund(user)}
              data-testid={`button-refund-${user.id}`}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Refund
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onBan(user)}
              disabled={!!user.isBanned}
              data-testid={`button-ban-${user.id}`}
            >
              <Ban className="w-3 h-3 mr-1" />
              Ban
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
