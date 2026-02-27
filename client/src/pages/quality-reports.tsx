import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/landing/header";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { ClipboardCheck, Loader2, Star } from "lucide-react";

interface QualityReport {
  id: number;
  service_type: string | null;
  pro_name: string | null;
  quality_score: number;
  findings: string | null;
  recommendations: string | null;
  photos: string[];
  created_at: string;
}

function scoreColor(score: number): string {
  if (score >= 90) return "text-green-700 bg-green-50";
  if (score >= 75) return "text-amber-700 bg-amber-50";
  return "text-red-700 bg-red-50";
}

export default function QualityReports() {
  const { user } = useAuth();
  const userId = (user as any)?.id || (user as any)?.userId || "";

  const { data, isLoading } = useQuery({
    queryKey: ["/api/reports/quality", userId],
    queryFn: () => apiRequest("GET", `/api/reports/quality/${userId}`).then(r => r.json()),
    enabled: !!userId,
  });

  const reports: QualityReport[] = data?.reports || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Quality Inspection Reports</h1>
          <p className="text-gray-600 mt-1">Review quality assessments from completed jobs at your property.</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-600" /></div>
        ) : reports.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <ClipboardCheck className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">No reports yet</h3>
              <p className="text-gray-500 mt-1">Quality inspection reports will appear here after completed jobs are reviewed.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{r.service_type || "Service"}</h3>
                      {r.pro_name && <p className="text-sm text-gray-500">Completed by {r.pro_name}</p>}
                      <p className="text-sm text-gray-400">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${scoreColor(r.quality_score)}`}>
                      <Star className="w-4 h-4" />
                      {r.quality_score}/100
                    </div>
                  </div>
                  {r.findings && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Findings</p>
                      <p className="text-sm text-gray-600">{r.findings}</p>
                    </div>
                  )}
                  {r.recommendations && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Recommendations</p>
                      <p className="text-sm text-gray-600">{r.recommendations}</p>
                    </div>
                  )}
                  {r.photos && r.photos.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {r.photos.map((url, i) => (
                        <img key={i} src={url} alt={`Photo ${i + 1}`} className="w-20 h-20 object-cover rounded" />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
