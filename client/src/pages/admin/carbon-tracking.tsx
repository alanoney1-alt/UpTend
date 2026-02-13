import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Leaf,
  TrendingUp,
  Award,
  Download,
  Droplets,
  Trees,
  Recycle,
  DollarSign,
  ChevronLeft,
  BarChart3,
} from "lucide-react";

interface CarbonTrackingData {
  overview: {
    totalJobs: number;
    totalCo2SavedKg: number;
    totalCo2SavedMetricTons: number;
    totalWasteDivertedLbs: number;
    totalRecycledLbs: number;
    totalDonatedLbs: number;
    totalLandfilledLbs: number;
    avgDiversionRate: number;
    treesEquivalent: number;
    waterSavedGallons: number;
    estimatedCreditValue: number;
    carbonCreditMarketRate: number;
    lastUpdatedAt: string;
  };
  monthlyTrends: Array<{
    month: string;
    monthKey: string;
    totalJobs: number;
    co2SavedKg: number;
    wasteDivertedLbs: number;
    diversionRate: number;
  }>;
  proLeaderboard: Array<{
    proId: string;
    proName: string;
    totalJobs: number;
    totalWasteLbs: number;
    recycledLbs: number;
    donatedLbs: number;
    landfilledLbs: number;
    diversionRate: number;
    co2SavedLbs: number;
  }>;
  totalActivePros: number;
}

export default function CarbonTrackingDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");

  const { data, isLoading } = useQuery<CarbonTrackingData>({
    queryKey: ["/api/admin/carbon-tracking"],
  });

  const handleExport = async () => {
    try {
      const response = await fetch("/api/admin/carbon-tracking/export", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `uptend-carbon-report-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export carbon data");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Loading carbon tracking data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">No data available</p>
        </div>
      </div>
    );
  }

  const { overview, monthlyTrends, proLeaderboard } = data;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="mb-4">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Admin
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-2">Carbon Credit Tracking</h1>
          <p className="text-muted-foreground text-lg">
            Platform-wide sustainability metrics and carbon credit analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total CO2 Saved</p>
                <p className="text-3xl font-bold text-green-700">
                  {overview.totalCo2SavedMetricTons.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">metric tons CO2e</p>
              </div>
              <Leaf className="h-12 w-12 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Diversion Rate</p>
                <p className="text-3xl font-bold text-blue-700">
                  {overview.avgDiversionRate.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {overview.totalWasteDivertedLbs.toLocaleString()} lbs diverted
                </p>
              </div>
              <Recycle className="h-12 w-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Estimated Value</p>
                <p className="text-3xl font-bold text-purple-700">
                  ${overview.estimatedCreditValue.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  at ${overview.carbonCreditMarketRate}/ton
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Jobs</p>
                <p className="text-3xl font-bold text-orange-700">
                  {overview.totalJobs.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">audited and verified</p>
              </div>
              <BarChart3 className="h-12 w-12 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Environmental Impact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Trees className="h-10 w-10 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Trees Equivalent</p>
                <p className="text-2xl font-bold">{overview.treesEquivalent.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">trees worth of CO2</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Droplets className="h-10 w-10 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Water Saved</p>
                <p className="text-2xl font-bold">
                  {overview.waterSavedGallons.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">gallons conserved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Recycle className="h-10 w-10 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Material Recovery</p>
                <p className="text-2xl font-bold">
                  {((overview.totalRecycledLbs + overview.totalDonatedLbs) / 1000).toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">tons recycled/donated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="trends">
            <TrendingUp className="mr-2 h-4 w-4" />
            Monthly Trends
          </TabsTrigger>
          <TabsTrigger value="leaderboard">
            <Award className="mr-2 h-4 w-4" />
            Pro Leaderboard
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Material Breakdown</CardTitle>
                <CardDescription>How waste was processed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    const totalWaste = overview.totalRecycledLbs + overview.totalDonatedLbs + overview.totalLandfilledLbs;
                    const pct = (val: number) => totalWaste > 0 ? ((val / totalWaste) * 100).toFixed(1) : "0.0";
                    return (
                      <>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500 rounded"></div>
                            <span className="text-sm">Recycled</span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {overview.totalRecycledLbs.toLocaleString()} lbs
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {pct(overview.totalRecycledLbs)}%
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-500 rounded"></div>
                            <span className="text-sm">Donated</span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {overview.totalDonatedLbs.toLocaleString()} lbs
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {pct(overview.totalDonatedLbs)}%
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-400 rounded"></div>
                            <span className="text-sm">Landfilled</span>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {overview.totalLandfilledLbs.toLocaleString()} lbs
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {pct(overview.totalLandfilledLbs)}%
                            </p>
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  <div className="pt-4 border-t">
                    <div className="flex justify-between">
                      <span className="font-medium">Total Waste Processed</span>
                      <span className="font-bold">
                        {(overview.totalRecycledLbs + overview.totalDonatedLbs + overview.totalLandfilledLbs).toLocaleString()} lbs
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Carbon Credit Details</CardTitle>
                <CardDescription>Methodology and certification</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Calculation Method</p>
                    <p className="text-sm text-muted-foreground">
                      EPA WARM Model v15 (Waste Reduction Model)
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-1">Verification Process</p>
                    <p className="text-sm text-muted-foreground">
                      AI-powered photo analysis + Pro verification + GPS tracking
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-1">Certification Status</p>
                    <Badge>Platform Self-Reported</Badge>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-1">Market Rate</p>
                    <p className="text-sm text-muted-foreground">
                      ${overview.carbonCreditMarketRate} per metric ton CO2e (conservative estimate)
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-1">Last Updated</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(overview.lastUpdatedAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Carbon credits are calculated based on landfill diversion and material
                      recovery. Actual certification through carbon registries may require
                      third-party validation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>6-Month Trend</CardTitle>
              <CardDescription>Platform sustainability performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Jobs</TableHead>
                    <TableHead className="text-right">CO2 Saved (kg)</TableHead>
                    <TableHead className="text-right">Waste Diverted (lbs)</TableHead>
                    <TableHead className="text-right">Diversion Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyTrends.map((month) => (
                    <TableRow key={month.monthKey}>
                      <TableCell className="font-medium">{month.month}</TableCell>
                      <TableCell className="text-right">{month.totalJobs}</TableCell>
                      <TableCell className="text-right">
                        {month.co2SavedKg.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right">
                        {month.wasteDivertedLbs.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{month.diversionRate.toFixed(1)}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> Monthly data is currently showing averaged estimates.
                  Actual month-by-month tracking will be implemented as jobs are completed.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle>Top Eco-Friendly Pros</CardTitle>
              <CardDescription>
                Ranked by landfill diversion rate • {data.totalActivePros} active Pros
              </CardDescription>
            </CardHeader>
            <CardContent>
              {proLeaderboard.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No Pro data available yet. Complete jobs to see rankings.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Pro Name</TableHead>
                      <TableHead className="text-right">Jobs</TableHead>
                      <TableHead className="text-right">Diversion Rate</TableHead>
                      <TableHead className="text-right">CO2 Saved (lbs)</TableHead>
                      <TableHead className="text-right">Total Waste (lbs)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proLeaderboard.map((pro, index) => (
                      <TableRow key={pro.proId}>
                        <TableCell>
                          {index === 0 && <Award className="inline h-5 w-5 text-yellow-500 mr-1" />}
                          {index === 1 && <Award className="inline h-5 w-5 text-gray-400 mr-1" />}
                          {index === 2 && <Award className="inline h-5 w-5 text-orange-600 mr-1" />}
                          {index < 3 ? "" : `#${index + 1}`}
                        </TableCell>
                        <TableCell className="font-medium">{pro.proName}</TableCell>
                        <TableCell className="text-right">{pro.totalJobs}</TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              pro.diversionRate >= 80 ? "default" :
                              pro.diversionRate >= 60 ? "secondary" : "outline"
                            }
                          >
                            {pro.diversionRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {pro.co2SavedLbs.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right">
                          {pro.totalWasteLbs.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <div className="mt-6 grid md:grid-cols-3 gap-4">
                <Card className="bg-green-50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-1">Excellent</p>
                    <p className="text-2xl font-bold text-green-700">≥80%</p>
                    <p className="text-xs text-muted-foreground">diversion rate</p>
                  </CardContent>
                </Card>

                <Card className="bg-yellow-50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-1">Good</p>
                    <p className="text-2xl font-bold text-yellow-700">60-79%</p>
                    <p className="text-xs text-muted-foreground">diversion rate</p>
                  </CardContent>
                </Card>

                <Card className="bg-gray-50">
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-1">Needs Improvement</p>
                    <p className="text-2xl font-bold text-gray-700">&lt;60%</p>
                    <p className="text-xs text-muted-foreground">diversion rate</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
