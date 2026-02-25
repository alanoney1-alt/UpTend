/**
 * Business Partner Integrations Hub
 * 
 * QuickBooks, Gusto, Jobber accounting/payroll integrations
 * plus coming-soon placeholders for Housecall Pro and ServiceTitan.
 */
import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/ui/logo";
import {
  ArrowLeft, RefreshCw, Plug, Unplug, CheckCircle, Clock,
  DollarSign, Users, FileText, Loader2, ExternalLink, Lock,
} from "lucide-react";

interface IntegrationConfig {
  id: string;
  name: string;
  description: string;
  statusEndpoint: string;
  authEndpoint: string;
  syncEndpoint: string | null;
  disconnectEndpoint: string;
  historyEndpoint: string | null;
  comingSoon?: boolean;
}

const INTEGRATIONS: IntegrationConfig[] = [
  {
    id: "quickbooks",
    name: "QuickBooks Online",
    description: "Sync revenue, expenses, and payouts automatically",
    statusEndpoint: "/api/integrations/quickbooks/status",
    authEndpoint: "/api/integrations/quickbooks/auth",
    syncEndpoint: "/api/integrations/quickbooks/sync",
    disconnectEndpoint: "/api/integrations/quickbooks/disconnect",
    historyEndpoint: "/api/integrations/quickbooks/sync-history",
  },
  {
    id: "gusto",
    name: "Gusto",
    description: "Push employee hours directly to payroll",
    statusEndpoint: "/api/integrations/gusto/status",
    authEndpoint: "/api/integrations/gusto/auth",
    syncEndpoint: "/api/integrations/gusto/sync-hours",
    disconnectEndpoint: "/api/integrations/gusto/disconnect",
    historyEndpoint: null,
  },
  {
    id: "jobber",
    name: "Jobber",
    description: "Sync completed jobs to your Jobber account",
    statusEndpoint: "/api/integrations/jobber-bp/status",
    authEndpoint: "/api/integrations/jobber-bp/auth",
    syncEndpoint: "/api/integrations/jobber-bp/sync",
    disconnectEndpoint: "/api/integrations/jobber-bp/disconnect",
    historyEndpoint: null,
  },
  {
    id: "housecallpro",
    name: "Housecall Pro",
    description: "Sync jobs and invoices with Housecall Pro",
    statusEndpoint: "",
    authEndpoint: "",
    syncEndpoint: null,
    disconnectEndpoint: "",
    historyEndpoint: null,
    comingSoon: true,
  },
  {
    id: "servicetitan",
    name: "ServiceTitan",
    description: "Enterprise job management integration",
    statusEndpoint: "",
    authEndpoint: "",
    syncEndpoint: null,
    disconnectEndpoint: "",
    historyEndpoint: null,
    comingSoon: true,
  },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  quickbooks: <DollarSign className="h-8 w-8 text-green-600" />,
  gusto: <Users className="h-8 w-8 text-[#ea580c]" />,
  jobber: <FileText className="h-8 w-8 text-teal-600" />,
  housecallpro: <Plug className="h-8 w-8 text-slate-400" />,
  servicetitan: <Plug className="h-8 w-8 text-slate-400" />,
};

function IntegrationCard({ config }: { config: IntegrationConfig }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: status, isLoading } = useQuery<any>({
    queryKey: [config.statusEndpoint],
    queryFn: () => apiRequest("GET", config.statusEndpoint).then(r => r.json()),
    enabled: !config.comingSoon && !!config.statusEndpoint,
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const resp = await apiRequest("GET", config.authEndpoint);
      const data = await resp.json();
      return data;
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        window.open(data.authUrl, "_blank");
        toast({ title: "Connecting...", description: "Complete authorization in the new window." });
      }
    },
    onError: (err: any) => {
      toast({ title: "Connection failed", description: err.message, variant: "destructive" });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const resp = await apiRequest("POST", config.syncEndpoint!);
      return resp.json();
    },
    onSuccess: () => {
      toast({ title: "Sync complete" });
      queryClient.invalidateQueries({ queryKey: [config.statusEndpoint] });
    },
    onError: (err: any) => {
      toast({ title: "Sync failed", description: err.message, variant: "destructive" });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const resp = await apiRequest("POST", config.disconnectEndpoint);
      return resp.json();
    },
    onSuccess: () => {
      toast({ title: "Disconnected" });
      queryClient.invalidateQueries({ queryKey: [config.statusEndpoint] });
    },
  });

  const isConnected = status?.connected === true;

  return (
    <Card className={`relative ${config.comingSoon ? "opacity-60" : ""} ${isConnected ? "border-green-500/50" : ""}`}>
      {config.comingSoon && (
        <Badge className="absolute top-3 right-3 bg-slate-400">
          <Lock className="h-3 w-3 mr-1" /> Coming Soon
        </Badge>
      )}
      {isConnected && (
        <Badge className="absolute top-3 right-3 bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" /> Connected
        </Badge>
      )}
      {status?.mockMode && isConnected && (
        <Badge className="absolute top-3 right-14 bg-amber-500 text-xs">Demo</Badge>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {ICON_MAP[config.id]}
          <div>
            <CardTitle className="text-lg">{config.name}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{config.description}</p>

        {isConnected && status?.lastSyncAt && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Last synced: {new Date(status.lastSyncAt).toLocaleString()}
          </div>
        )}

        {isConnected && status?.realmId && (
          <div className="text-xs text-muted-foreground">
            Realm: {status.realmId}
          </div>
        )}

        {!config.comingSoon && (
          <div className="flex gap-2 pt-1">
            {isConnected ? (
              <>
                {config.syncEndpoint && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => syncMutation.mutate()}
                    disabled={syncMutation.isPending}
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                    Sync Now
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => disconnectMutation.mutate()}
                  disabled={disconnectMutation.isPending}
                >
                  <Unplug className="h-3 w-3 mr-1" /> Disconnect
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                className="bg-[#ea580c] hover:bg-[#c2410c] text-white"
                onClick={() => connectMutation.mutate()}
                disabled={connectMutation.isPending || isLoading}
              >
                {connectMutation.isPending ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <ExternalLink className="h-3 w-3 mr-1" />
                )}
                Connect
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function BpIntegrations() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-6 max-w-md text-center">
          <Plug className="w-12 h-12 mx-auto mb-4 text-[#ea580c]" />
          <h2 className="text-xl font-bold mb-2">Integrations</h2>
          <p className="text-muted-foreground mb-4">Sign in to manage your integrations.</p>
          <Link href="/login"><Button>Sign In</Button></Link>
        </Card>
      </div>
    );
  }

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
            <span className="font-semibold">Integrations</span>
          </div>
          <Link href="/business/partner-dashboard">
            <Button variant="ghost" className="text-slate-300">
              <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Integrations Hub</h1>
          <p className="text-slate-600 mt-1">
            Connect your accounting, payroll, and job management tools
          </p>
        </div>

        {/* Integration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {INTEGRATIONS.map(config => (
            <IntegrationCard key={config.id} config={config} />
          ))}
        </div>

        {/* How It Works */}
        <Card className="bg-slate-50 border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800">How Integrations Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Plug className="h-4 w-4 text-amber-700" />
                </div>
                <div>
                  <p className="font-medium text-sm text-slate-800">Connect your existing tools in one click</p>
                  <p className="text-xs text-slate-500 mt-0.5">Secure OAuth. we never see your password</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="h-4 w-4 text-green-700" />
                </div>
                <div>
                  <p className="font-medium text-sm text-slate-800">Completed jobs sync automatically</p>
                  <p className="text-xs text-slate-500 mt-0.5">Invoices and deposits created in your books</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-4 w-4 text-red-700" />
                </div>
                <div>
                  <p className="font-medium text-sm text-slate-800">Platform fees tracked as expenses</p>
                  <p className="text-xs text-slate-500 mt-0.5">Automatic expense categorization in QuickBooks</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Users className="h-4 w-4 text-blue-700" />
                </div>
                <div>
                  <p className="font-medium text-sm text-slate-800">Employee hours pushed to payroll</p>
                  <p className="text-xs text-slate-500 mt-0.5">Job hours flow directly into Gusto pay periods</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
