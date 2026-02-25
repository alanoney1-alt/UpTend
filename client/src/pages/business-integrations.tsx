import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useBusinessTier } from "@/hooks/use-business-tier";
import { UpgradePrompt } from "@/components/business/upgrade-prompt";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft, RefreshCw, Plug, Unplug, CheckCircle, XCircle,
  Clock, Activity, Building2, Users, Briefcase, Shield,
  Zap, Globe, Wrench, FileText, TrendingUp
} from "lucide-react";

// Business account ID. in production, derive from auth context
const BUSINESS_ACCOUNT_ID = "demo-business-1";

interface CrmIntegration {
  id: string;
  name: string;
  platform: string;
  description: string;
  icon: React.ReactNode;
  authType: "oauth2" | "apikey" | "credentials";
  fields: { key: string; label: string; type?: string; placeholder?: string }[];
  category: "enterprise" | "midmarket" | "homeservice" | "government";
}

const CRM_INTEGRATIONS: CrmIntegration[] = [
  {
    id: "salesforce", name: "Salesforce", platform: "salesforce",
    description: "The #1 CRM. used by enterprise PM companies and government contractors. Sync contacts, accounts, opportunities.",
    icon: <Globe className="h-8 w-8 text-blue-500" />,
    authType: "oauth2",
    fields: [
      { key: "clientId", label: "Client ID", placeholder: "Your Salesforce Connected App Client ID" },
      { key: "clientSecret", label: "Client Secret", type: "password", placeholder: "Client Secret" },
      { key: "redirectUri", label: "Redirect URI", placeholder: "https://your-domain.com/api/integrations/salesforce/callback" },
    ],
    category: "enterprise",
  },
  {
    id: "hubspot", name: "HubSpot", platform: "hubspot",
    description: "Popular with mid-market PM and construction companies. Sync contacts, companies, deals.",
    icon: <TrendingUp className="h-8 w-8 text-orange-500" />,
    authType: "oauth2",
    fields: [
      { key: "clientId", label: "Client ID (or leave blank for API key)", placeholder: "OAuth Client ID" },
      { key: "clientSecret", label: "Client Secret", type: "password" },
      { key: "apiKey", label: "API Key (alternative)", type: "password", placeholder: "HubSpot Private App Token" },
    ],
    category: "midmarket",
  },
  {
    id: "zoho", name: "Zoho CRM", platform: "zoho",
    description: "Big with small-medium PM and HOA management companies. Full contact, account, and deal sync.",
    icon: <Briefcase className="h-8 w-8 text-red-500" />,
    authType: "oauth2",
    fields: [
      { key: "clientId", label: "Client ID", placeholder: "Zoho Client ID" },
      { key: "clientSecret", label: "Client Secret", type: "password" },
      { key: "redirectUri", label: "Redirect URI" },
    ],
    category: "midmarket",
  },
  {
    id: "monday", name: "Monday.com", platform: "monday",
    description: "Used by construction companies and project-heavy PM firms. Sync boards, items, and push updates.",
    icon: <Zap className="h-8 w-8 text-purple-500" />,
    authType: "apikey",
    fields: [
      { key: "apiToken", label: "API Token", type: "password", placeholder: "Monday.com API v2 Token" },
    ],
    category: "midmarket",
  },
  {
    id: "servicetitan", name: "ServiceTitan", platform: "servicetitan",
    description: "The dominant CRM for home service companies. Sync customers, jobs, invoices, and technicians.",
    icon: <Wrench className="h-8 w-8 text-green-600" />,
    authType: "oauth2",
    fields: [
      { key: "clientId", label: "Client ID", placeholder: "App Key" },
      { key: "clientSecret", label: "Client Secret", type: "password" },
      { key: "tenantId", label: "Tenant ID", placeholder: "Your ServiceTitan Tenant ID" },
    ],
    category: "homeservice",
  },
  {
    id: "jobber", name: "Jobber", platform: "jobber",
    description: "Popular CRM for smaller home service companies. Sync clients, properties, jobs, quotes.",
    icon: <FileText className="h-8 w-8 text-teal-500" />,
    authType: "oauth2",
    fields: [
      { key: "clientId", label: "Client ID" },
      { key: "clientSecret", label: "Client Secret", type: "password" },
      { key: "redirectUri", label: "Redirect URI" },
    ],
    category: "homeservice",
  },
  {
    id: "housecallpro", name: "Housecall Pro", platform: "housecallpro",
    description: "Another big home services CRM. Sync customers, jobs, estimates, invoices.",
    icon: <Building2 className="h-8 w-8 text-indigo-500" />,
    authType: "apikey",
    fields: [
      { key: "apiKey", label: "API Key", type: "password", placeholder: "Housecall Pro API Token" },
    ],
    category: "homeservice",
  },
  {
    id: "govwin", name: "GovWin / Deltek", platform: "govwin",
    description: "Government contract tracking CRM. Sync opportunities, tracked contracts, push bids.",
    icon: <Shield className="h-8 w-8 text-amber-600" />,
    authType: "credentials",
    fields: [
      { key: "apiKey", label: "API Key", type: "password", placeholder: "GovWin API Key" },
      { key: "username", label: "Username (optional)" },
      { key: "password", label: "Password (optional)", type: "password" },
    ],
    category: "government",
  },
];

interface ConnectionStatus {
  id: string;
  platform: string;
  status: string;
  lastSyncAt: string | null;
  autoSync: boolean;
  syncFrequency: string;
}

interface SyncLog {
  id: string;
  connectionId: string;
  platform: string;
  action: string;
  status: string;
  recordsProcessed: number;
  details: any;
  createdAt: string;
}

export default function BusinessIntegrations() {
  const { isIndependent } = useBusinessTier();
  const { toast } = useToast();
  const [connectDialog, setConnectDialog] = useState<CrmIntegration | null>(null);
  const [formFields, setFormFields] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("all");

  const { data: statusData, isLoading } = useQuery<{ connections: ConnectionStatus[] }>({
    queryKey: ["/api/integrations/crm/status", BUSINESS_ACCOUNT_ID],
    queryFn: () => apiRequest("GET", `/api/integrations/crm/status?businessAccountId=${BUSINESS_ACCOUNT_ID}`).then(r => r.json()),
  });

  const { data: logsData } = useQuery<{ logs: SyncLog[] }>({
    queryKey: ["/api/integrations/crm/sync-logs", BUSINESS_ACCOUNT_ID],
    queryFn: () => apiRequest("GET", `/api/integrations/crm/sync-logs?businessAccountId=${BUSINESS_ACCOUNT_ID}&limit=20`).then(r => r.json()),
  });

  const connectMutation = useMutation({
    mutationFn: async ({ platform, fields }: { platform: string; fields: Record<string, string> }) => {
      const resp = await apiRequest("POST", `/api/integrations/${platform}/connect`, {
        businessAccountId: BUSINESS_ACCOUNT_ID,
        ...fields,
      });
      return resp.json();
    },
    onSuccess: (data) => {
      toast({ title: "Connected!", description: data.authUrl ? "Redirecting to OAuth..." : "Integration connected successfully." });
      if (data.authUrl) window.open(data.authUrl, "_blank");
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/crm/status"] });
      setConnectDialog(null);
      setFormFields({});
    },
    onError: (error: any) => {
      toast({ title: "Connection Failed", description: error.message, variant: "destructive" });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (platform: string) => {
      const resp = await apiRequest("POST", "/api/integrations/crm/disconnect", {
        businessAccountId: BUSINESS_ACCOUNT_ID,
        platform,
      });
      return resp.json();
    },
    onSuccess: () => {
      toast({ title: "Disconnected" });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/crm/status"] });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (platform: string) => {
      const endpoint = platform === "monday" ? "sync-boards"
        : platform === "salesforce" ? "sync-contacts"
        : platform === "hubspot" ? "sync-contacts"
        : platform === "govwin" ? "sync-opportunities"
        : "sync";
      const resp = await apiRequest("POST", `/api/integrations/${platform}/${endpoint}`, {
        businessAccountId: BUSINESS_ACCOUNT_ID,
      });
      return resp.json();
    },
    onSuccess: (data) => {
      toast({ title: "Sync Complete", description: `${data.synced || 0} records synced` });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/crm/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/crm/sync-logs"] });
    },
    onError: (error: any) => {
      toast({ title: "Sync Failed", description: error.message, variant: "destructive" });
    },
  });

  const connections = statusData?.connections || [];
  const logs = logsData?.logs || [];

  function getConnectionStatus(platform: string): ConnectionStatus | undefined {
    return connections.find(c => c.platform === platform);
  }

  const categories = [
    { key: "all", label: "All CRMs" },
    { key: "enterprise", label: "Enterprise" },
    { key: "midmarket", label: "Mid-Market" },
    { key: "homeservice", label: "Home Services" },
    { key: "government", label: "Government" },
  ];

  const filtered = activeTab === "all" ? CRM_INTEGRATIONS : CRM_INTEGRATIONS.filter(c => c.category === activeTab);

  if (isIndependent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <UpgradePrompt featureName="CRM Integrations" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/business/dashboard">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">CRM Integrations</h1>
              <p className="text-muted-foreground">Connect your CRM to sync contacts, push jobs, and automate workflows</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Plug className="h-3 w-3" />
              {connections.filter(c => c.status === "active").length} Connected
            </Badge>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {categories.map(cat => (
              <TabsTrigger key={cat.key} value={cat.key}>{cat.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* CRM Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(crm => {
            const conn = getConnectionStatus(crm.platform);
            const isConnected = conn?.status === "active";

            return (
              <Card key={crm.id} className={`relative ${isConnected ? "border-green-500/50" : ""}`}>
                {isConnected && (
                  <Badge className="absolute top-3 right-3 bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" /> Connected
                  </Badge>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    {crm.icon}
                    <div>
                      <CardTitle className="text-lg">{crm.name}</CardTitle>
                      <Badge variant="outline" className="text-xs mt-1">{crm.category}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <CardDescription className="text-sm">{crm.description}</CardDescription>

                  {isConnected && conn?.lastSyncAt && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Last sync: {new Date(conn.lastSyncAt).toLocaleDateString()}
                    </div>
                  )}

                  <div className="flex gap-2">
                    {isConnected ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => syncMutation.mutate(crm.platform)}
                          disabled={syncMutation.isPending}
                        >
                          <RefreshCw className={`h-3 w-3 mr-1 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                          Sync Now
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => disconnectMutation.mutate(crm.platform)}
                        >
                          <Unplug className="h-3 w-3 mr-1" /> Disconnect
                        </Button>
                      </>
                    ) : (
                      <Dialog open={connectDialog?.id === crm.id} onOpenChange={(open) => {
                        if (open) { setConnectDialog(crm); setFormFields({}); }
                        else setConnectDialog(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plug className="h-3 w-3 mr-1" /> Connect
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              {crm.icon} Connect {crm.name}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            {crm.fields.map(field => (
                              <div key={field.key} className="space-y-2">
                                <Label>{field.label}</Label>
                                <Input
                                  type={field.type || "text"}
                                  placeholder={field.placeholder}
                                  value={formFields[field.key] || ""}
                                  onChange={e => setFormFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                                />
                              </div>
                            ))}
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setConnectDialog(null)}>Cancel</Button>
                            <Button
                              onClick={() => connectMutation.mutate({ platform: crm.platform, fields: formFields })}
                              disabled={connectMutation.isPending}
                            >
                              {connectMutation.isPending ? "Connecting..." : "Connect"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" /> Recent Sync Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No sync activity yet. Connect a CRM to get started.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Platform</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium capitalize">{log.platform}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>
                        <Badge variant={log.status === "success" ? "default" : log.status === "error" ? "destructive" : "outline"}>
                          {log.status === "success" ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.recordsProcessed}</TableCell>
                      <TableCell className="text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
