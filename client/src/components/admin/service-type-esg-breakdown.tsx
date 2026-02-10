/**
 * Service Type ESG Breakdown Component (Admin)
 *
 * Platform-wide ESG analytics by service type
 */

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const SERVICE_TYPES = [
  { value: "pressure_washing", label: "Pressure Washing" },
  { value: "gutter_cleaning", label: "Gutter Cleaning" },
  { value: "pool_cleaning", label: "Pool Cleaning" },
  { value: "home_cleaning", label: "Home Cleaning" },
  { value: "landscaping", label: "Landscaping" },
  { value: "handyman", label: "Handyman" },
  { value: "moving_labor", label: "Moving Labor" },
  { value: "furniture_moving", label: "Furniture Moving" },
  { value: "carpet_cleaning", label: "Carpet Cleaning" },
  { value: "light_demolition", label: "Light Demolition" },
  { value: "junk_removal", label: "Junk Removal" },
];

export function ServiceTypeEsgBreakdown() {
  const [aggregateData, setAggregateData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");

  useEffect(() => {
    fetchAggregateData();
  }, [dateRange]);

  const fetchAggregateData = async () => {
    try {
      setLoading(true);
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString();

      const promises = SERVICE_TYPES.map(async (service) => {
        try {
          const response = await fetch(
            `/api/esg/service-types/${service.value}/aggregate?startDate=${startDate}&endDate=${endDate}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            return {
              name: service.label,
              ...data.aggregate,
            };
          }
          return null;
        } catch (error) {
          return null;
        }
      });

      const results = (await Promise.all(promises)).filter(Boolean);
      setAggregateData(results.filter((r: any) => r.totalJobs > 0));
    } catch (error) {
      console.error("Failed to fetch aggregate data:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalJobs = aggregateData.reduce((sum, s) => sum + (s.totalJobs || 0), 0);
  const totalCo2 = aggregateData.reduce((sum, s) => sum + (s.totalCo2SavedLbs || 0), 0);
  const totalWater = aggregateData.reduce((sum, s) => sum + (s.totalWaterSavedGallons || 0), 0);

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
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Platform ESG by Service Type</h2>
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
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalJobs.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">{aggregateData.length} active services</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">CO₂ Saved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(totalCo2).toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">lbs CO₂ equivalent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Water Saved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(totalWater).toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">gallons</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Card>
        <CardHeader>
          <CardTitle>Jobs by Service Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={aggregateData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalJobs" fill="#3b82f6" name="Jobs Completed" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CO₂ Savings by Service Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={aggregateData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalCo2SavedLbs" fill="#10b981" name="CO₂ Saved (lbs)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Service Rankings */}
      <Card>
        <CardHeader>
          <CardTitle>Service Type Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Rank</th>
                  <th className="text-left p-2">Service</th>
                  <th className="text-right p-2">Jobs</th>
                  <th className="text-right p-2">CO₂ Saved (lbs)</th>
                  <th className="text-right p-2">Avg ESG Score</th>
                </tr>
              </thead>
              <tbody>
                {aggregateData
                  .sort((a, b) => b.totalCo2SavedLbs - a.totalCo2SavedLbs)
                  .map((service, index) => (
                    <tr key={service.name} className="border-b hover:bg-gray-50">
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2 font-medium">{service.name}</td>
                      <td className="text-right p-2">{service.totalJobs.toLocaleString()}</td>
                      <td className="text-right p-2">{Math.round(service.totalCo2SavedLbs).toLocaleString()}</td>
                      <td className="text-right p-2">
                        <span
                          className={`inline-block px-2 py-1 rounded text-sm ${
                            service.avgEsgScore >= 80
                              ? "bg-green-100 text-green-800"
                              : service.avgEsgScore >= 60
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {Math.round(service.avgEsgScore)}
                        </span>
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
