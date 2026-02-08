/**
 * HOA ESG Emissions Dashboard
 *
 * Displays aggregated environmental impact for all properties in HOA portfolio:
 * - Total waste diverted from landfills
 * - CO2 emissions avoided
 * - Carbon credit generation
 * - Property-level breakdown
 * - Timeline trends
 * - Resident leaderboard
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Leaf, TrendingUp, Recycle, Droplets, TreeDeciduous,
  Award, BarChart3, MapPin, Home, Calendar
} from "lucide-react";
import type { HoaProperty } from "@shared/schema";

interface EsgMetrics {
  totalJobsCompleted: number;
  totalWasteDivertedLbs: number;
  totalCo2AvoidedLbs: number;
  totalWaterSavedGallons: number;
  treesEquivalent: number;
  diversionRate: number;
  carbonCreditsEarned: number;
  carbonCreditsValue: number;
  propertyBreakdown: Array<{
    propertyId: string;
    address: string;
    jobsCompleted: number;
    wasteDivertedLbs: number;
    co2AvoidedLbs: number;
    diversionRate: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    wasteDivertedLbs: number;
    co2AvoidedLbs: number;
    jobsCompleted: number;
  }>;
}

interface HoaEsgDashboardProps {
  businessAccountId: string;
}

export function HoaEsgDashboard({ businessAccountId }: HoaEsgDashboardProps) {
  // Fetch ESG metrics
  const { data: metrics, isLoading } = useQuery<EsgMetrics>({
    queryKey: [`/api/business/${businessAccountId}/esg-metrics`],
  });

  // Fetch properties for reference
  const { data: properties } = useQuery<HoaProperty[]>({
    queryKey: [`/api/business/${businessAccountId}/properties`],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const hasData = metrics && metrics.totalJobsCompleted > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Leaf className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <CardTitle>Community Environmental Impact</CardTitle>
              <CardDescription>
                Aggregated sustainability metrics for {properties?.length || 0} properties
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {!hasData ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Leaf className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No ESG Data Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Environmental impact metrics will appear here once properties in your portfolio complete UpTend services
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Key Metrics Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Waste Diverted
                  </CardTitle>
                  <Recycle className="w-4 h-4 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {(metrics.totalWasteDivertedLbs / 1000).toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">tons from landfills</p>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {metrics.diversionRate.toFixed(0)}% diversion rate
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    CO₂ Avoided
                  </CardTitle>
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {(metrics.totalCo2AvoidedLbs / 1000).toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">tons CO₂ emissions</p>
                <div className="mt-3 flex items-center gap-2">
                  <TreeDeciduous className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-muted-foreground">
                    {metrics.treesEquivalent.toFixed(1)} trees equivalent
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-500/10 to-transparent border-cyan-500/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Water Saved
                  </CardTitle>
                  <Droplets className="w-4 h-4 text-cyan-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">
                  {(metrics.totalWaterSavedGallons / 1000).toFixed(1)}k
                </div>
                <p className="text-xs text-muted-foreground mt-1">gallons conserved</p>
                <div className="mt-3">
                  <Badge variant="secondary" className="text-xs">
                    {metrics.totalJobsCompleted} jobs completed
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Carbon Credits
                  </CardTitle>
                  <Award className="w-4 h-4 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {metrics.carbonCreditsEarned.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">credits earned</p>
                <div className="mt-3">
                  <Badge variant="secondary" className="text-xs">
                    ${metrics.carbonCreditsValue.toFixed(0)} value
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="properties" className="space-y-6">
            <TabsList>
              <TabsTrigger value="properties">
                <Home className="w-4 h-4 mr-1" />
                By Property
              </TabsTrigger>
              <TabsTrigger value="trends">
                <BarChart3 className="w-4 h-4 mr-1" />
                Trends
              </TabsTrigger>
              <TabsTrigger value="leaderboard">
                <Award className="w-4 h-4 mr-1" />
                Leaderboard
              </TabsTrigger>
            </TabsList>

            {/* Property Breakdown */}
            <TabsContent value="properties" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Environmental Impact by Property</CardTitle>
                  <CardDescription>
                    See which properties are leading in sustainability
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics.propertyBreakdown
                      .sort((a, b) => b.wasteDivertedLbs - a.wasteDivertedLbs)
                      .map((property, index) => (
                        <div key={property.propertyId} className="space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="text-sm font-bold text-primary">
                                  #{index + 1}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold truncate">{property.address}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {property.jobsCompleted} service{property.jobsCompleted !== 1 ? "s" : ""} completed
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant="secondary"
                              className={
                                property.diversionRate >= 70
                                  ? "bg-green-500/10 text-green-600 border-green-500/20"
                                  : property.diversionRate >= 50
                                  ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                                  : ""
                              }
                            >
                              {property.diversionRate.toFixed(0)}% diverted
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pl-11">
                            <div className="p-3 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-2 mb-1">
                                <Recycle className="w-3 h-3 text-green-600" />
                                <span className="text-xs text-muted-foreground">Waste Diverted</span>
                              </div>
                              <p className="text-sm font-semibold">
                                {property.wasteDivertedLbs.toLocaleString()} lbs
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="w-3 h-3 text-blue-600" />
                                <span className="text-xs text-muted-foreground">CO₂ Avoided</span>
                              </div>
                              <p className="text-sm font-semibold">
                                {property.co2AvoidedLbs.toLocaleString()} lbs
                              </p>
                            </div>
                          </div>

                          {index < metrics.propertyBreakdown.length - 1 && <Separator />}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Monthly Trends */}
            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Environmental Trends</CardTitle>
                  <CardDescription>
                    Track your community's sustainability progress over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics.monthlyTrends.map((month) => (
                      <div key={month.month} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{month.month}</span>
                          </div>
                          <Badge variant="secondary">
                            {month.jobsCompleted} job{month.jobsCompleted !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                            <p className="text-xs text-muted-foreground mb-1">Waste Diverted</p>
                            <p className="text-lg font-bold text-green-600">
                              {(month.wasteDivertedLbs / 1000).toFixed(1)} tons
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                            <p className="text-xs text-muted-foreground mb-1">CO₂ Avoided</p>
                            <p className="text-lg font-bold text-blue-600">
                              {(month.co2AvoidedLbs / 1000).toFixed(1)} tons
                            </p>
                          </div>
                        </div>
                        <Separator />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Resident Leaderboard */}
            <TabsContent value="leaderboard" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sustainability Leaders</CardTitle>
                  <CardDescription>
                    Top properties by environmental impact
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics.propertyBreakdown
                      .sort((a, b) => b.co2AvoidedLbs - a.co2AvoidedLbs)
                      .slice(0, 5)
                      .map((property, index) => (
                        <div key={property.propertyId} className="flex items-center gap-4">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              index === 0
                                ? "bg-yellow-500 text-white"
                                : index === 1
                                ? "bg-gray-400 text-white"
                                : index === 2
                                ? "bg-orange-600 text-white"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{property.address}</p>
                            <p className="text-sm text-muted-foreground">
                              {property.co2AvoidedLbs.toLocaleString()} lbs CO₂ avoided
                            </p>
                          </div>
                          {index === 0 && (
                            <Award className="w-5 h-5 text-yellow-500" />
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Export & Share */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-semibold mb-1">Share Your Impact</h3>
                  <p className="text-sm text-muted-foreground">
                    Export ESG report or generate resident newsletter
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    📊 CSV Export Coming Soon
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    📧 Newsletter Coming Soon
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
