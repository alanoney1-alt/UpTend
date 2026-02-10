/**
 * ServiceEsgAdminView Component
 *
 * Admin view of all service-specific ESG metrics
 * Shows aggregated statistics and breakdown charts
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServiceBreakdownChart, ServiceBreakdownData } from "@/components/esg/service-breakdown-chart";
import { Leaf, Droplet, BarChart3, TrendingUp } from "lucide-react";

export function ServiceEsgAdminView() {
  const { data, isLoading } = useQuery<{ success: boolean; data: ServiceBreakdownData[] }>({
    queryKey: ["service-esg-aggregate-all"],
    queryFn: async () => {
      const response = await fetch("/api/esg/service-types/aggregate/all", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch service ESG aggregate");
      }

      const result = await response.json();
      
      // Transform data if needed
      return {
        success: true,
        data: result.data || result.aggregates || [],
      };
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12 text-gray-500">Loading service ESG data...</div>
      </div>
    );
  }

  const serviceData = data?.data || [];

  // Calculate totals
  const totalJobs = serviceData.reduce((sum, s) => sum + s.totalJobs, 0);
  const totalCo2Saved = serviceData.reduce((sum, s) => sum + s.totalCo2SavedLbs, 0);
  const totalWaterSaved = serviceData.reduce((sum, s) => sum + s.totalWaterSavedGallons, 0);
  const avgEsgScore =
    serviceData.length > 0
      ? serviceData.reduce((sum, s) => sum + s.avgEsgScore, 0) / serviceData.length
      : 0;
  const serviceTypesCount = serviceData.length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Service Jobs</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJobs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across {serviceTypesCount} service types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total CO₂ Saved</CardTitle>
            <Leaf className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCo2Saved.toFixed(1)} lbs</div>
            <p className="text-xs text-muted-foreground">
              {(totalCo2Saved / 2204.62).toFixed(2)} metric tons
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Water Saved</CardTitle>
            <Droplet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWaterSaved.toLocaleString()} gal</div>
            <p className="text-xs text-muted-foreground">
              {(totalWaterSaved / 264.172).toFixed(1)} cubic meters
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg ESG Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgEsgScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Platform-wide average</p>
          </CardContent>
        </Card>
      </div>

      {/* Service Breakdown Chart */}
      {serviceData.length > 0 ? (
        <ServiceBreakdownChart data={serviceData} />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-gray-500">
              No service ESG data available yet. Data will appear as services are completed.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Type Table */}
      <Card>
        <CardHeader>
          <CardTitle>Service Type Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2 px-4">Service Type</th>
                  <th className="text-right py-2 px-4">Jobs</th>
                  <th className="text-right py-2 px-4">CO₂ Saved (lbs)</th>
                  <th className="text-right py-2 px-4">Water Saved (gal)</th>
                  <th className="text-right py-2 px-4">Avg ESG Score</th>
                </tr>
              </thead>
              <tbody>
                {serviceData
                  .sort((a, b) => b.totalCo2SavedLbs - a.totalCo2SavedLbs)
                  .map((service) => (
                    <tr key={service.serviceType} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4 font-medium capitalize">
                        {service.serviceType.replace(/_/g, " ")}
                      </td>
                      <td className="text-right py-2 px-4">{service.totalJobs}</td>
                      <td className="text-right py-2 px-4 text-green-600">
                        {service.totalCo2SavedLbs.toFixed(1)}
                      </td>
                      <td className="text-right py-2 px-4 text-blue-600">
                        {service.totalWaterSavedGallons.toFixed(0)}
                      </td>
                      <td className="text-right py-2 px-4 text-purple-600">
                        {service.avgEsgScore.toFixed(1)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
