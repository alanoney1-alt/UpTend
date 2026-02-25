import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Logo } from "@/components/ui/logo";
import { SERVICE_PRICE_RANGES } from "@/constants/service-price-ranges";
import {
  Building2, Users, DollarSign, TrendingUp, Star, Plus,
  ArrowLeft, Loader2, Wifi, WifiOff, ChevronDown, ChevronUp, X, Settings,
} from "lucide-react";

const SERVICE_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(SERVICE_PRICE_RANGES).map(([k, v]) => [k, v.displayName])
);

export default function BpDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);

  // Add employee form
  const [empFirstName, setEmpFirstName] = useState("");
  const [empLastName, setEmpLastName] = useState("");
  const [empEmail, setEmpEmail] = useState("");
  const [empPhone, setEmpPhone] = useState("");
  const [empServices, setEmpServices] = useState<string[]>([]);

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ["/api/business-partner/dashboard"],
    enabled: isAuthenticated,
  });

  const { data: employees = [], isLoading: empLoading } = useQuery<any[]>({
    queryKey: ["/api/business-partner/employees"],
    enabled: isAuthenticated,
  });

  const { data: jobs = [] } = useQuery<any[]>({
    queryKey: ["/api/business-partner/jobs"],
    enabled: isAuthenticated,
  });

  const { data: revenueData } = useQuery<any>({
    queryKey: ["/api/business-partner/revenue"],
    enabled: isAuthenticated,
  });

  const { data: ratesData } = useQuery<any>({
    queryKey: ["/api/business-partner/rates"],
    enabled: isAuthenticated,
  });

  const addEmployeeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/business-partner/employees", {
        firstName: empFirstName,
        lastName: empLastName,
        email: empEmail,
        phone: empPhone,
        serviceTypes: empServices,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Employee added", description: "They will receive login credentials by email." });
      queryClient.invalidateQueries({ queryKey: ["/api/business-partner/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/business-partner/dashboard"] });
      setAddEmployeeOpen(false);
      setEmpFirstName(""); setEmpLastName(""); setEmpEmail(""); setEmpPhone(""); setEmpServices([]);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const removeEmployeeMutation = useMutation({
    mutationFn: async (proId: string) => {
      await apiRequest("DELETE", `/api/business-partner/employees/${proId}`);
    },
    onSuccess: () => {
      toast({ title: "Employee removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/business-partner/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/business-partner/dashboard"] });
    },
  });

  const updateRatesMutation = useMutation({
    mutationFn: async (rates: { serviceType: string; baseRate: number }[]) => {
      const res = await apiRequest("POST", "/api/business-partner/rates", { rates });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Rates updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/business-partner/rates"] });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-6 max-w-md text-center">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-[#ea580c]" />
          <h2 className="text-xl font-bold mb-2">Business Partner Dashboard</h2>
          <p className="text-muted-foreground mb-4">Sign in to access your business dashboard.</p>
          <Link href="/login"><Button>Sign In</Button></Link>
        </Card>
      </div>
    );
  }

  if (dashLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#ea580c]" />
      </div>
    );
  }

  const dash = dashboard as any;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Header */}
      <div className="bg-slate-900 text-white py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Logo className="w-8 h-8" textClassName="text-xl" />
            </Link>
            <span className="text-slate-400">|</span>
            <span className="font-semibold">{dash?.companyName || "Business Dashboard"}</span>
          </div>
          <Link href="/profile"><Button variant="ghost" className="text-slate-300">Account</Button></Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 mx-auto mb-1 text-slate-500" />
              <div className="text-2xl font-bold">{dash?.totalEmployees || 0}</div>
              <div className="text-xs text-slate-500">Total Employees</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Wifi className="w-6 h-6 mx-auto mb-1 text-green-500" />
              <div className="text-2xl font-bold">{dash?.onlineCount || 0}</div>
              <div className="text-xs text-slate-500">Currently Online</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="w-6 h-6 mx-auto mb-1 text-[#ea580c]" />
              <div className="text-2xl font-bold">${(dash?.revenueThisMonth || 0).toLocaleString()}</div>
              <div className="text-xs text-slate-500">Revenue This Month</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Star className="w-6 h-6 mx-auto mb-1 text-amber-500" />
              <div className="text-2xl font-bold">{dash?.avgRating || "0.0"}</div>
              <div className="text-xs text-slate-500">Avg Team Rating</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-slate-500 mb-1">Jobs This Week</div>
              <div className="text-xl font-bold">{dash?.jobsThisWeek || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-slate-500 mb-1">Jobs This Month</div>
              <div className="text-xl font-bold">{dash?.jobsThisMonth || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="employees" className="space-y-4">
          <TabsList>
            <TabsTrigger value="employees">Employee Roster</TabsTrigger>
            <TabsTrigger value="jobs">Jobs Feed</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="rates">Company Rates</TabsTrigger>
          </TabsList>

          {/* Employees Tab */}
          <TabsContent value="employees" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Your Team</h3>
              <Dialog open={addEmployeeOpen} onOpenChange={setAddEmployeeOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#ea580c] hover:bg-[#c2410c] text-white">
                    <Plus className="w-4 h-4 mr-1" /> Add Employee
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Employee</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>First Name</Label><Input value={empFirstName} onChange={e => setEmpFirstName(e.target.value)} /></div>
                      <div><Label>Last Name</Label><Input value={empLastName} onChange={e => setEmpLastName(e.target.value)} /></div>
                    </div>
                    <div><Label>Email</Label><Input type="email" value={empEmail} onChange={e => setEmpEmail(e.target.value)} /></div>
                    <div><Label>Phone</Label><Input type="tel" value={empPhone} onChange={e => setEmpPhone(e.target.value)} /></div>
                    <div>
                      <Label>Services</Label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {Object.entries(SERVICE_LABELS).filter(([k]) => k !== "home_scan").map(([key, label]) => (
                          <label key={key} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={empServices.includes(key)}
                              onCheckedChange={() => setEmpServices(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key])}
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">They will receive an email with login credentials.</p>
                    <Button
                      className="w-full bg-[#ea580c] hover:bg-[#c2410c] text-white"
                      onClick={() => addEmployeeMutation.mutate()}
                      disabled={addEmployeeMutation.isPending || !empFirstName || !empEmail}
                    >
                      {addEmployeeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Add Employee
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {empLoading ? (
              <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
            ) : employees.length === 0 ? (
              <Card className="p-8 text-center text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No employees yet. Add your first team member above.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {employees.map((emp: any) => (
                  <Card key={emp.proUserId} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${emp.isAvailable ? "bg-green-500" : "bg-slate-300"}`} />
                        <div>
                          <div className="font-medium">{emp.firstName} {emp.lastName}</div>
                          <div className="text-xs text-slate-500">{emp.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <div className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" /> {emp.rating || "5.0"}</div>
                          <div className="text-xs text-slate-500">{emp.jobsCompleted || 0} jobs</div>
                        </div>
                        <button
                          onClick={() => setExpandedEmployee(expandedEmployee === emp.proUserId ? null : emp.proUserId)}
                        >
                          {expandedEmployee === emp.proUserId ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    {expandedEmployee === emp.proUserId && (
                      <div className="mt-4 pt-4 border-t space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {(emp.serviceTypes || []).map((st: string) => (
                            <Badge key={st} variant="secondary" className="text-xs">{SERVICE_LABELS[st] || st}</Badge>
                          ))}
                        </div>
                        <div className="text-sm text-slate-500">Phone: {emp.phone || "Not provided"}</div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 border-red-200 hover:bg-red-50"
                          onClick={() => {
                            if (confirm("Remove this employee? They keep their profile and reviews.")) {
                              removeEmployeeMutation.mutate(emp.proUserId);
                            }
                          }}
                        >
                          Remove from Team
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-3">
            <h3 className="font-bold text-lg">Business-Routed Jobs</h3>
            {(jobs as any[]).length === 0 ? (
              <Card className="p-8 text-center text-slate-500">No business-routed jobs yet.</Card>
            ) : (
              (jobs as any[]).map((job: any) => (
                <Card key={job.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{SERVICE_LABELS[job.serviceType] || job.serviceType}</div>
                      <div className="text-sm text-slate-500">{job.pickupAddress}</div>
                      <div className="text-xs text-slate-400">{job.proFirstName ? `Assigned to ${job.proFirstName}` : "Unassigned"}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#ea580c]">${job.finalPrice || job.priceEstimate || "--"}</div>
                      <Badge variant={job.status === "completed" ? "default" : "secondary"} className="text-xs mt-1">
                        {job.status}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-4">
            <h3 className="font-bold text-lg">Revenue Analytics</h3>
            {revenueData && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4 text-center">
                    <div className="text-sm text-slate-500">Gross Revenue</div>
                    <div className="text-xl font-bold">${(revenueData as any).grossRevenue?.toLocaleString() || "0"}</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <div className="text-sm text-slate-500">Platform Fee (15%)</div>
                    <div className="text-xl font-bold text-slate-400">${(revenueData as any).platformFee?.toLocaleString() || "0"}</div>
                  </Card>
                  <Card className="p-4 text-center">
                    <div className="text-sm text-slate-500">Net Payout</div>
                    <div className="text-xl font-bold text-green-600">${(revenueData as any).netPayout?.toLocaleString() || "0"}</div>
                  </Card>
                </div>

                {(revenueData as any).byEmployee?.length > 0 && (
                  <Card className="p-4">
                    <h4 className="font-semibold mb-3">By Employee</h4>
                    <div className="space-y-2">
                      {(revenueData as any).byEmployee.map((emp: any) => (
                        <div key={emp.proId} className="flex justify-between items-center py-2 border-b last:border-0">
                          <span className="font-medium">{emp.name}</span>
                          <div className="text-right text-sm">
                            <span className="font-bold">${emp.netPayout?.toLocaleString()}</span>
                            <span className="text-slate-400 ml-2">({emp.jobs} jobs)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Rates Tab */}
          <TabsContent value="rates" className="space-y-4">
            <h3 className="font-bold text-lg">Company Rates</h3>
            <p className="text-sm text-slate-500">Set rates for services. Your team keeps 85% of each job.</p>
            {ratesData?.rates?.map((rate: any) => {
              const range = SERVICE_PRICE_RANGES[rate.serviceType];
              if (!range) return null;
              return (
                <div key={rate.serviceType} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm">{rate.displayName}</span>
                    <span className="font-bold text-[#ea580c]">${rate.currentRate} <span className="text-xs text-slate-400 font-normal">{rate.unit}</span></span>
                  </div>
                  <Slider
                    value={[rate.currentRate]}
                    min={rate.minRate}
                    max={rate.maxRate}
                    step={1}
                    onValueChange={([v]) => {
                      updateRatesMutation.mutate([{ serviceType: rate.serviceType, baseRate: v }]);
                    }}
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>${rate.minRate}</span>
                    <span>${rate.maxRate}</span>
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
