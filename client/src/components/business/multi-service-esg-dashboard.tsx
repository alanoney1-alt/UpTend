/**
 * Multi-Service ESG Dashboard Component
 *
 * Displays aggregated ESG metrics across all services for a business account
 */

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

interface EsgMetric {
  serviceType: string;
  totalJobs: number;
  totalCo2SavedLbs: number;
  totalWaterSavedGallons: number;
  avgEsgScore: number;
}

interface MultiServiceEsgDashboardProps {
  businessAccountId: string;
}

const SERVICE_NAMES: Record<string, string> = {
  pressure_washing: "Pressure Washing",
  gutter_cleaning: "Gutter Cleaning",
  pool_cleaning: "Pool Cleaning",
  home_cleaning: "Home Cleaning",
  landscaping: "Landscaping",
  handyman: "Handyman",
  moving_labor: "Moving Labor",
  furniture_moving: "Furniture Moving",
  carpet_cleaning: "Carpet Cleaning",
  light_demolition: "Light Demolition",
  junk_removal: "Junk Removal",
};

export function MultiServiceEsgDashboard({ businessAccountId }: MultiServiceEsgDashboardProps) {
  const [metrics, setMetrics] = useState<EsgMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  useEffect(() => {
    fetchEsgMetrics();
  }, [businessAccountId, dateRange]);

  const fetchEsgMetrics = async () => {
    try {
      setLoading(true);
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString();

      // Fetch metrics for each service type
      const serviceTypes = Object.keys(SERVICE_NAMES);
      const promises = serviceTypes.map(async (serviceType) => {
        try {
          const response = await fetch(
            `/api/esg/service-types/${serviceType}/aggregate?startDate=${startDate}&endDate=${endDate}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            return {
              serviceType,
              ...data.aggregate,
            };
          }
          return null;
        } catch (error) {
          return null;
        }
      });

      const results = (await Promise.all(promises)).filter(Boolean) as EsgMetric[];
      setMetrics(results.filter((m) => m.totalJobs > 0));
    } catch (error) {
      console.error("Failed to fetch ESG metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalCo2Saved = metrics.reduce((sum, m) => sum + m.totalCo2SavedLbs, 0);
  const totalWaterSaved = metrics.reduce((sum, m) => sum + m.totalWaterSavedGallons, 0);
  const totalJobs = metrics.reduce((sum, m) => sum + m.totalJobs, 0);
  const avgEsgScore = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + m.avgEsgScore, 0) / metrics.length
    : 0;

  const chartData = metrics
    .map((m) => ({
      name: SERVICE_NAMES[m.serviceType] || m.serviceType,
      jobs: m.totalJobs,
      co2Saved: Math.round(m.totalCo2SavedLbs),
      waterSaved: Math.round(m.totalWaterSavedGallons),
      esgScore: Math.round(m.avgEsgScore),
    }))
    .sort((a, b) => b.co2Saved - a.co2Saved);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Multi-Service ESG Dashboard</h2>
        <div className="flex gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => fetchEsgMetrics()} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalJobs}</div>
            <p className="text-xs text-gray-500 mt-1">Across {metrics.length} services</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">CO₂ Saved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(totalCo2Saved).toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">lbs CO₂ equivalent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Water Saved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(totalWaterSaved).toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">gallons</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg ESG Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(avgEsgScore)}</div>
            <p className="text-xs text-gray-500 mt-1">out of 100</p>
          </CardContent>
        </Card>
      </div>

      {/* CO2 Savings by Service */}
      <Card>
        <CardHeader>
          <CardTitle>CO₂ Savings by Service</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="co2Saved" fill="#10b981" name="CO₂ Saved (lbs)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ESG Score by Service */}
      <Card>
        <CardHeader>
          <CardTitle>ESG Performance by Service</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="esgScore" fill="#3b82f6" name="ESG Score" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Service Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Service Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Service</th>
                  <th className="text-right p-2">Jobs</th>
                  <th className="text-right p-2">CO₂ Saved (lbs)</th>
                  <th className="text-right p-2">Water Saved (gal)</th>
                  <th className="text-right p-2">ESG Score</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row) => (
                  <tr key={row.name} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{row.name}</td>
                    <td className="text-right p-2">{row.jobs}</td>
                    <td className="text-right p-2">{row.co2Saved.toLocaleString()}</td>
                    <td className="text-right p-2">{row.waterSaved.toLocaleString()}</td>
                    <td className="text-right p-2">
                      <span
                        className={`inline-block px-2 py-1 rounded text-sm ${
                          row.esgScore >= 80
                            ? "bg-green-100 text-green-800"
                            : row.esgScore >= 60
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {row.esgScore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export ESG Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="outline">
              Download PDF Report
            </Button>
            <Button variant="outline">
              Download CSV Data
            </Button>
            <Button variant="outline">
              Generate Scope 3 Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
