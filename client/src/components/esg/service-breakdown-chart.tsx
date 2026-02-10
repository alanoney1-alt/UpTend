/**
 * ServiceBreakdownChart Component
 *
 * Displays bar chart of ESG metrics by service type using Recharts
 *
 * Props:
 * - data: Array of service breakdown data
 * - metric: Which metric to display ("co2" | "water" | "score")
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface ServiceBreakdownData {
  serviceType: string;
  totalJobs: number;
  totalCo2SavedLbs: number;
  totalWaterSavedGallons: number;
  avgEsgScore: number;
}

interface ServiceBreakdownChartProps {
  data: ServiceBreakdownData[];
  metric?: "co2" | "water" | "score";
}

const SERVICE_LABELS: Record<string, string> = {
  pressure_washing: "Pressure Washing",
  gutter_cleaning: "Gutter Cleaning",
  pool_cleaning: "Pool Cleaning",
  home_cleaning: "Home Cleaning",
  landscaping: "Landscaping",
  handyman: "Handyman",
  moving_labor: "Moving",
  furniture_moving: "Furniture Moving",
  carpet_cleaning: "Carpet Cleaning",
  light_demolition: "Demolition",
  junk_removal: "Junk Removal",
};

export function ServiceBreakdownChart({ data, metric = "co2" }: ServiceBreakdownChartProps) {
  // Transform data for chart with friendly labels
  const chartData = data.map((item) => ({
    name: SERVICE_LABELS[item.serviceType] || item.serviceType.replace(/_/g, " "),
    co2: Math.round(item.totalCo2SavedLbs * 10) / 10,
    water: Math.round(item.totalWaterSavedGallons),
    score: Math.round(item.avgEsgScore * 10) / 10,
    jobs: item.totalJobs,
  }));

  const renderChart = (dataKey: string, color: string, label: string) => (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          angle={-45}
          textAnchor="end"
          height={120}
          interval={0}
          style={{ fontSize: "12px" }}
        />
        <YAxis />
        <Tooltip
          formatter={(value: number, name: string) => {
            if (name === "co2") return [value + " lbs", "CO₂ Saved"];
            if (name === "water") return [value + " gal", "Water Saved"];
            if (name === "score") return [value, "ESG Score"];
            return [value, name];
          }}
        />
        <Legend />
        <Bar dataKey={dataKey} fill={color} name={label} />
      </BarChart>
    </ResponsiveContainer>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Impact by Service Type</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={metric} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="co2">CO₂ Saved</TabsTrigger>
            <TabsTrigger value="water">Water Saved</TabsTrigger>
            <TabsTrigger value="score">ESG Score</TabsTrigger>
          </TabsList>

          <TabsContent value="co2" className="mt-6">
            {renderChart("co2", "#10b981", "CO₂ Saved (lbs)")}
          </TabsContent>

          <TabsContent value="water" className="mt-6">
            {renderChart("water", "#3b82f6", "Water Saved (gal)")}
          </TabsContent>

          <TabsContent value="score" className="mt-6">
            {renderChart("score", "#8b5cf6", "ESG Score")}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
