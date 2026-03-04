import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Header } from "@/components/landing/header";
import { 
  TrendingUp, TrendingDown, DollarSign, Star, Clock, 
  Briefcase, Users, ArrowLeft, Calendar
} from "lucide-react";
import { Link } from "wouter";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsData {
  jobsCompleted: number;
  totalRevenue: number;
  averageJobValue: number;
  averageRating: number;
  averageResponseTime: number;
  
  statusBreakdown: {
    [key: string]: number;
  };
  
  jobsPerDay: Array<{
    date: string;
    count: number;
    revenue: number;
  }>;
  
  topPros: Array<{
    id: string;
    name: string;
    jobsCompleted: number;
    averageRating: number;
    averageResponseTime: number;
    revenue: number;
  }>;
  
  serviceTypes: Array<{
    type: string;
    count: number;
    revenue: number;
    averageValue: number;
  }>;
  
  trends: {
    jobsCompletedChange: number;
    revenueChange: number;
    ratingChange: number;
    responseTimeChange: number;
  };
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function MetricCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  format = "number" 
}: { 
  title: string; 
  value: number; 
  change?: number; 
  icon: any; 
  format?: "number" | "currency" | "time" | "rating";
}) {
  const formatValue = (val: number) => {
    switch (format) {
      case "currency":
        return `$${val.toLocaleString()}`;
      case "time":
        return `${Math.round(val)} min`;
      case "rating":
        return val.toFixed(1);
      default:
        return val.toLocaleString();
    }
  };

  const isPositive = change ? change > 0 : null;
  const showTrend = change !== undefined && change !== null && Math.abs(change) > 0.1;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold">{formatValue(value)}</p>
            {showTrend && (
              <div className={`flex items-center mt-1 text-sm ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {Math.abs(change!).toFixed(1)}%
              </div>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-lg">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PartnerAnalytics() {
  const { slug } = useParams<{ slug: string }>();
  const [period, setPeriod] = useState("30d");

  // Fetch analytics data
  const { data, isLoading, error } = useQuery({
    queryKey: ["partner-analytics", slug, period],
    queryFn: async () => {
      const res = await fetch(`/api/dispatch/${slug}/analytics?period=${period}`);
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("UPGRADE_REQUIRED");
        }
        throw new Error("Failed to load analytics");
      }
      return res.json();
    },
  });

  const analytics: AnalyticsData | undefined = data?.analytics;

  if (error) {
    if (error.message === "UPGRADE_REQUIRED") {
      return (
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <Link href={`/partners/${slug}/dashboard`} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
              <Badge variant="outline">{slug}</Badge>
            </div>

            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Upgrade to Scale Plan</h2>
                <p className="text-muted-foreground mb-4">
                  Advanced analytics and reporting are available on our Scale plan. 
                  Get insights on job performance, revenue trends, and team productivity.
                </p>
                <Button>Upgrade Plan</Button>
              </CardContent>
            </Card>
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Failed to load analytics data</p>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <p className="text-muted-foreground">No analytics data available</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href={`/partners/${slug}/dashboard`} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
            <Badge variant="outline">{slug}</Badge>
          </div>
          
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Jobs Completed"
            value={analytics.jobsCompleted}
            change={analytics.trends.jobsCompletedChange}
            icon={Briefcase}
          />
          <MetricCard
            title="Total Revenue"
            value={analytics.totalRevenue}
            change={analytics.trends.revenueChange}
            icon={DollarSign}
            format="currency"
          />
          <MetricCard
            title="Average Rating"
            value={analytics.averageRating}
            change={analytics.trends.ratingChange}
            icon={Star}
            format="rating"
          />
          <MetricCard
            title="Avg Response Time"
            value={analytics.averageResponseTime}
            change={analytics.trends.responseTimeChange}
            icon={Clock}
            format="time"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Jobs Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Jobs Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.jobsPerDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number, name: string) => [
                      name === 'count' ? value.toLocaleString() : `$${value.toLocaleString()}`,
                      name === 'count' ? 'Jobs' : 'Revenue'
                    ]}
                  />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Service Types */}
          <Card>
            <CardHeader>
              <CardTitle>Service Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.serviceTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analytics.serviceTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Jobs']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Pros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Top Performing Pros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topPros.map((pro, index) => (
                <div key={pro.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                      #{index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold">{pro.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {pro.jobsCompleted} jobs • {pro.averageRating.toFixed(1)} ⭐ • {Math.round(pro.averageResponseTime)} min avg
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${pro.revenue.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                  </div>
                </div>
              ))}
              
              {analytics.topPros.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No pro performance data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}