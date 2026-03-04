import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Phone, TrendingUp, Clock, Target, Filter, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface CallLog {
  id: number;
  tracking_number_id: number;
  caller_phone: string;
  duration_seconds: number;
  recording_url?: string;
  source: string;
  converted_to_lead: boolean;
  lead_id?: number;
  timestamp: string;
  phone_number: string;
  tracking_source: string;
  forwarding_number: string;
}

interface CallStats {
  bySource: Array<{
    source: string;
    total_calls: number;
    conversions: number;
    avg_duration: number;
    conversion_rate: number;
  }>;
  overall: {
    total_calls: number;
    total_conversions: number;
    avg_duration: number;
    overall_conversion_rate: number;
  };
  dailyVolume: Array<{
    call_date: string;
    calls: number;
    conversions: number;
  }>;
}

interface TrackingNumber {
  id: number;
  partner_slug: string;
  phone_number: string;
  source: string;
  forwarding_number: string;
  created_at: string;
  updated_at: string;
}

export default function PartnerCallTracking() {
  const [dateRange, setDateRange] = useState("30");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");
  
  // Get partner slug from URL or context
  const partnerSlug = "sample-partner";
  
  // Fetch call logs
  const { data: callsData, isLoading: callsLoading } = useQuery({
    queryKey: ['call-logs', partnerSlug, sourceFilter, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (sourceFilter !== 'all') params.append('source', sourceFilter);
      if (dateRange !== 'all') {
        const days = parseInt(dateRange);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        params.append('start_date', startDate.toISOString());
      }
      
      const response = await fetch(`/api/partners/${partnerSlug}/calls?${params}`);
      if (!response.ok) throw new Error('Failed to fetch calls');
      return response.json();
    }
  });
  
  // Fetch call statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['call-stats', partnerSlug, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange !== 'all') {
        const days = parseInt(dateRange);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        params.append('start_date', startDate.toISOString());
      }
      
      const response = await fetch(`/api/partners/${partnerSlug}/calls/stats?${params}`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });
  
  // Fetch attribution data
  const { data: attributionData, isLoading: attributionLoading } = useQuery({
    queryKey: ['call-attribution', partnerSlug, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange !== 'all') {
        const days = parseInt(dateRange);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        params.append('start_date', startDate.toISOString());
      }
      
      const response = await fetch(`/api/partners/${partnerSlug}/calls/attribution?${params}`);
      if (!response.ok) throw new Error('Failed to fetch attribution');
      return response.json();
    }
  });
  
  // Fetch tracking numbers
  const { data: trackingNumbersData } = useQuery({
    queryKey: ['tracking-numbers', partnerSlug],
    queryFn: async () => {
      const response = await fetch(`/api/partners/${partnerSlug}/calls/tracking-numbers`);
      if (!response.ok) throw new Error('Failed to fetch tracking numbers');
      return response.json();
    }
  });

  const calls: CallLog[] = callsData?.calls || [];
  const stats: CallStats = statsData?.stats || { 
    bySource: [], 
    overall: { total_calls: 0, total_conversions: 0, avg_duration: 0, overall_conversion_rate: 0 },
    dailyVolume: []
  };
  const attribution = attributionData?.attribution || { bySource: [], qualityMetrics: [], peakHours: [] };
  const trackingNumbers: TrackingNumber[] = trackingNumbersData?.trackingNumbers || [];

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSourceBadgeColor = (source: string) => {
    const colors: { [key: string]: string } = {
      'google_seo': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'facebook': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'instagram': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'direct': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'referral': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'hoa': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    };
    return colors[source] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const sourceDisplayNames: { [key: string]: string } = {
    'google_seo': 'Google SEO',
    'facebook': 'Facebook',
    'instagram': 'Instagram',
    'direct': 'Direct',
    'referral': 'Referral',
    'hoa': 'HOA'
  };

  if (callsLoading || statsLoading || attributionLoading) {
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
      {/* Header with Filters */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold">Call Tracking & Attribution</h1>
          <p className="text-muted-foreground">Monitor call performance across marketing channels</p>
        </div>
        
        <div className="flex space-x-4">
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="google_seo">Google SEO</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="direct">Direct</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
              <SelectItem value="hoa">HOA</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Phone className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.overall.total_calls}</p>
                <p className="text-sm text-muted-foreground">Total Calls</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.overall.total_conversions}</p>
                <p className="text-sm text-muted-foreground">Conversions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.overall.overall_conversion_rate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{formatDuration(Math.round(stats.overall.avg_duration))}</p>
                <p className="text-sm text-muted-foreground">Avg Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calls">Call Log</TabsTrigger>
          <TabsTrigger value="attribution">Attribution</TabsTrigger>
          <TabsTrigger value="numbers">Tracking Numbers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Source Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Performance by Source</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {stats.bySource.map((source) => (
                  <div key={source.source} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <Badge className={cn("text-xs", getSourceBadgeColor(source.source))}>
                          {sourceDisplayNames[source.source] || source.source}
                        </Badge>
                        <span className="font-medium">{source.total_calls} calls</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{source.conversions} conversions</p>
                        <p className="text-sm text-muted-foreground">{source.conversion_rate.toFixed(1)}%</p>
                      </div>
                    </div>
                    <Progress value={source.conversion_rate} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Avg Duration: {formatDuration(Math.round(source.avg_duration))}</span>
                      <span>Conversion Rate: {source.conversion_rate.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Daily Volume Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Call Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Call volume chart would go here</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Daily breakdown of calls and conversions
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calls" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Caller</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calls.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell>
                        <div>
                          <p>{new Date(call.timestamp).toLocaleDateString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(call.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p>{call.caller_phone}</p>
                          <p className="text-sm text-muted-foreground">
                            To: {call.phone_number}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("text-xs", getSourceBadgeColor(call.source))}>
                          {sourceDisplayNames[call.source] || call.source}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDuration(call.duration_seconds)}</TableCell>
                      <TableCell>
                        <Badge variant={call.converted_to_lead ? "default" : "secondary"}>
                          {call.converted_to_lead ? "Converted" : "No conversion"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {call.recording_url && (
                            <Button variant="outline" size="sm">
                              Play
                            </Button>
                          )}
                          {!call.converted_to_lead && (
                            <Button variant="outline" size="sm">
                              Mark Converted
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {calls.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No calls found for the selected filters</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attribution" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Marketing ROI */}
            <Card>
              <CardHeader>
                <CardTitle>Marketing ROI by Channel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {attribution.bySource.map((source: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Badge className={cn("text-xs", getSourceBadgeColor(source.source))}>
                          {sourceDisplayNames[source.source] || source.source}
                        </Badge>
                        <span className="font-medium">${source.estimated_revenue}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{source.total_calls} calls → {source.leads_generated} leads</span>
                        <span>{source.lead_conversion_rate}% conversion</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Call Quality Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Call Quality by Source</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {attribution.qualityMetrics.map((metric: any, index: number) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Badge className={cn("text-xs", getSourceBadgeColor(metric.source))}>
                          {sourceDisplayNames[metric.source] || metric.source}
                        </Badge>
                        <span className="font-medium">{metric.quality_call_rate}%</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Avg Duration: {formatDuration(Math.round(metric.avg_call_duration))}</span>
                        <span>{metric.quality_calls} quality calls</span>
                      </div>
                      <Progress value={metric.quality_call_rate} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Peak Hours Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Peak Calling Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">Peak hours chart would go here</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Hourly call volume breakdown by source
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="numbers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tracking Numbers</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking Number</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Forwards To</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trackingNumbers.map((number) => (
                    <TableRow key={number.id}>
                      <TableCell className="font-mono">{number.phone_number}</TableCell>
                      <TableCell>
                        <Badge className={cn("text-xs", getSourceBadgeColor(number.source))}>
                          {sourceDisplayNames[number.source] || number.source}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">{number.forwarding_number}</TableCell>
                      <TableCell>{new Date(number.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {trackingNumbers.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No tracking numbers configured</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}