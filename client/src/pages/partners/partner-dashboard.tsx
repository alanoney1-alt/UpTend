import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/landing/header";
import { 
  Users, Briefcase, DollarSign, Star, ArrowLeft,
  Phone, Clock, CheckCircle, AlertCircle, Calendar
} from "lucide-react";
import { Link } from "wouter";

export default function PartnerDashboardPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: stats } = useQuery({
    queryKey: ["partner-stats", slug],
    queryFn: async () => {
      const res = await fetch(`/api/partners/${slug}/stats`);
      if (!res.ok) throw new Error("Failed to load stats");
      return res.json();
    },
  });

  const { data: leads } = useQuery({
    queryKey: ["partner-leads", slug],
    queryFn: async () => {
      const res = await fetch(`/api/partners/${slug}/leads`);
      if (!res.ok) throw new Error("Failed to load leads");
      return res.json();
    },
  });

  const { data: jobs } = useQuery({
    queryKey: ["partner-jobs", slug],
    queryFn: async () => {
      const res = await fetch(`/api/partners/${slug}/jobs`);
      if (!res.ok) throw new Error("Failed to load jobs");
      return res.json();
    },
  });

  const s = stats?.stats;

  const statusColors: Record<string, string> = {
    new: "bg-blue-500/10 text-blue-500",
    contacted: "bg-yellow-500/10 text-yellow-500",
    quoted: "bg-purple-500/10 text-purple-500",
    booked: "bg-green-500/10 text-green-500",
    in_progress: "bg-orange-500/10 text-orange-500",
    completed: "bg-green-500/10 text-green-500",
    scheduled: "bg-blue-500/10 text-blue-500",
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/partners" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Partner Dashboard</h1>
          <Badge variant="outline">{slug}</Badge>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s?.totalLeads ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">Leads This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Briefcase className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s?.activeJobs ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">Active Jobs</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    ${(s?.revenueThisMonth ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Revenue This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Star className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s?.averageRating ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">Average Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Leads */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="w-4 h-4" /> Recent Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(leads?.leads || []).map((lead: any) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.issue}</p>
                      <p className="text-xs text-muted-foreground">{lead.phone}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <Badge className={statusColors[lead.status] || ""} variant="outline">
                        {lead.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(lead.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {(!leads?.leads || leads.leads.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No leads yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Jobs Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(jobs?.jobs || []).map((job: any) => (
                  <div key={job.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{job.customer}</p>
                      <p className="text-xs text-muted-foreground">{job.service}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3 space-y-1">
                      <Badge className={statusColors[job.status] || ""} variant="outline">
                        {job.status.replace(/_/g, " ")}
                      </Badge>
                      <p className="text-sm font-medium">{job.amount}</p>
                      <p className="text-xs text-muted-foreground">{job.date}</p>
                    </div>
                  </div>
                ))}
                {(!jobs?.jobs || jobs.jobs.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No jobs yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reviews Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-4 h-4" /> Reviews & Ratings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-yellow-500">{s?.averageRating ?? "—"}</p>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <div className="flex justify-center mt-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i <= Math.round(s?.averageRating ?? 0) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`}
                    />
                  ))}
                </div>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold">{s?.reviewRequestsSent ?? 0}</p>
                <p className="text-sm text-muted-foreground">Review Requests Sent</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-green-500">{s?.reviewsReceived ?? 0}</p>
                <p className="text-sm text-muted-foreground">Reviews Received</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
