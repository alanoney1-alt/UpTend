import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Loader2, X, Download, Leaf, Droplet, TreePine, BarChart3 } from "lucide-react";

interface SustainabilityReportProps {
  jobId: string;
  serviceType: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function SustainabilityReport({ jobId, onComplete, onCancel }: SustainabilityReportProps) {
  const { toast } = useToast();
  const [report, setReport] = useState<any>(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/jobs/${jobId}/verification/generate-report`, {});
    },
    onSuccess: (data) => {
      setReport(data.report);
      toast({
        title: "Report generated",
        description: "Sustainability report created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  if (!report && !generateMutation.isPending) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Generate Sustainability Report</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Create the final environmental impact report
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">
              📊 Report Includes:
            </p>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-disc">
              <li>Total weight processed and diversion rate</li>
              <li>Breakdown by disposal category</li>
              <li>Carbon offset calculations (CO2 avoided)</li>
              <li>Environmental impact metrics</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>Sustainability Report</CardTitle>
              <p className="text-sm text-muted-foreground">
                Environmental impact summary
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-xs text-green-700 dark:text-green-300 mb-1">Total Weight</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              {report.summary.totalWeightLbs.toFixed(0)}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">lbs</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mb-1">Diversion Rate</p>
            <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
              {report.summary.diversionRate}
            </p>
          </div>

          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">CO2 Avoided</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {report.environmentalImpact.co2AvoidedLbs}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">lbs</p>
          </div>

          <div className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 border border-teal-200 dark:border-teal-800 rounded-lg">
            <p className="text-xs text-teal-700 dark:text-teal-300 mb-1">Carbon Offset</p>
            <p className="text-2xl font-bold text-teal-900 dark:text-teal-100">
              {report.summary.carbonOffsetTons}
            </p>
            <p className="text-xs text-teal-600 dark:text-teal-400">metric tons</p>
          </div>
        </div>

        {/* Disposal Breakdown */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Disposal Breakdown
          </h3>
          <div className="space-y-2">
            {report.breakdown.recycled > 0 && (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50 dark:bg-green-950">
                <span className="text-sm font-medium">♻️ Recycled</span>
                <Badge variant="outline" className="bg-white dark:bg-background">
                  {report.breakdown.recycled.toFixed(0)} lbs
                </Badge>
              </div>
            )}
            {report.breakdown.donated > 0 && (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-pink-50 dark:bg-pink-950">
                <span className="text-sm font-medium">❤️ Donated</span>
                <Badge variant="outline" className="bg-white dark:bg-background">
                  {report.breakdown.donated.toFixed(0)} lbs
                </Badge>
              </div>
            )}
            {report.breakdown.resold > 0 && (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 dark:bg-blue-950">
                <span className="text-sm font-medium">🛍️ Resold</span>
                <Badge variant="outline" className="bg-white dark:bg-background">
                  {report.breakdown.resold.toFixed(0)} lbs
                </Badge>
              </div>
            )}
            {report.breakdown.landfilled > 0 && (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-950">
                <span className="text-sm font-medium">🗑️ Landfilled</span>
                <Badge variant="outline" className="bg-white dark:bg-background">
                  {report.breakdown.landfilled.toFixed(0)} lbs
                </Badge>
              </div>
            )}
            {report.breakdown.specialty > 0 && (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-950">
                <span className="text-sm font-medium">⚡ Specialty</span>
                <Badge variant="outline" className="bg-white dark:bg-background">
                  {report.breakdown.specialty.toFixed(0)} lbs
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Environmental Impact */}
        <div className="space-y-3">
          <h3 className="font-semibold">Environmental Impact</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-4 border rounded-lg">
              <TreePine className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{report.environmentalImpact.treesEquivalent}</p>
              <p className="text-xs text-muted-foreground">Trees Worth</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Droplet className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{report.environmentalImpact.waterSavedGallons}</p>
              <p className="text-xs text-muted-foreground">Gallons Saved</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Leaf className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{report.summary.divertedWeightLbs.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">lbs Diverted</p>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-3">
          <h3 className="font-semibold">Items Processed ({report.disposalRecords.length})</h3>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {report.disposalRecords.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between text-sm p-2 border rounded">
                <span className="font-medium">{item.item}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {item.weight} lbs
                  </Badge>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {item.category}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button className="flex-1" onClick={onComplete}>
            Complete Verification →
          </Button>
          <Button variant="outline" size="icon">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
