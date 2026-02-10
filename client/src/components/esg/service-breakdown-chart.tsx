/**
 * ServiceBreakdownChart Component
 *
 * Displays service-specific ESG metrics as bar charts
 * Props:
 * - data: Array of service breakdown data
 * - metric: "co2" | "water" | "score" (which metric to display)
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Leaf, Droplets, TrendingUp } from "lucide-react";

export interface ServiceBreakdownData {
  serviceType: string;
  jobs: number;
  co2SavedLbs: number;
  waterSavedGallons: number;
  avgEsgScore: number;
}

interface ServiceBreakdownChartProps {
  data: ServiceBreakdownData[];
  metric?: "co2" | "water" | "score";
}

const SERVICE_LABELS: Record<string, string> = {
  junk_removal: "Junk Removal",
  pressure_washing: "Pressure Washing",
  gutter_cleaning: "Gutter Cleaning",
  pool_cleaning: "Pool Cleaning",
  landscaping: "Landscaping",
  carpet_cleaning: "Carpet Cleaning",
  home_cleaning: "Home Cleaning",
  moving_labor: "Moving Labor",
  light_demolition: "Light Demo",
  handyman: "Handyman",
  garage_cleanout: "Garage Cleanout",
  truck_unloading: "Truck Unloading",
};

export function ServiceBreakdownChart({ data, metric = "co2" }: ServiceBreakdownChartProps) {
  // Transform data for display
  const chartData = data.map((item) => ({
    name: SERVICE_LABELS[item.serviceType] || item.serviceType,
    jobs: item.jobs,
    co2: item.co2SavedLbs,
    water: item.waterSavedGallons,
    score: item.avgEsgScore,
  }));

  const renderChart = (metricKey: string, color: string, label: string) => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          angle={-45}
          textAnchor="end"
          height={100}
          tick={{ fontSize: 12 }}
        />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey={metricKey} fill={color} name={label} />
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Service Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={metric} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="co2" className="flex items-center gap-2">
              <Leaf className="w-4 h-4" />
              CO₂ Saved
            </TabsTrigger>
            <TabsTrigger value="water" className="flex items-center gap-2">
              <Droplets className="w-4 h-4" />
              Water Saved
            </TabsTrigger>
            <TabsTrigger value="score" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              ESG Score
            </TabsTrigger>
          </TabsList>

          <TabsContent value="co2" className="mt-6">
            {renderChart("co2", "#16A34A", "CO₂ Saved (lbs)")}
          </TabsContent>

          <TabsContent value="water" className="mt-6">
            {renderChart("water", "#0EA5E9", "Water Saved (gallons)")}
          </TabsContent>

          <TabsContent value="score" className="mt-6">
            {renderChart("score", "#8B5CF6", "Average ESG Score")}
          </TabsContent>
        </Tabs>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {data.reduce((sum, item) => sum + item.co2SavedLbs, 0).toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">Total CO₂ Saved (lbs)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {data.reduce((sum, item) => sum + item.waterSavedGallons, 0).toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Water Saved (gal)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {data.length > 0
                ? (
                    data.reduce((sum, item) => sum + item.avgEsgScore, 0) / data.length
                  ).toFixed(0)
                : 0}
            </p>
            <p className="text-xs text-muted-foreground">Avg ESG Score</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
