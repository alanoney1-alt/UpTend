/**
 * Tax Center Page
 * Earnings overview, monthly/quarterly reports, and 1099-K info.
 * Cream/amber/slate palette, no emojis.
 */

import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Loader2, FileText, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { useAuth } from "@/hooks/use-auth";

interface AnnualSummary {
  year: number;
  grossRevenue: number;
  platformFees: number;
  serviceFees: number;
  netPayouts: number;
  totalJobs: number;
  quarters: {
    quarter: number;
    totalGross: number;
    totalFees: number;
    totalNet: number;
    totalJobs: number;
    months: { month: number; grossRevenue: number; platformFees: number; netPayouts: number; jobCount: number }[];
  }[];
}

interface Data1099K {
  year: number;
  grossAmount: number;
  transactionCount: number;
  threshold1099: boolean;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <Card className="p-4 text-center">
      <Icon className="w-5 h-5 mx-auto mb-1 text-[#ea580c]" />
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}

export default function TaxCenter() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const currentYear = new Date().getFullYear();

  const { data: annual, isLoading } = useQuery<AnnualSummary>({
    queryKey: [`/api/tax/annual/${currentYear}`],
    enabled: isAuthenticated,
  });

  const { data: data1099 } = useQuery<Data1099K>({
    queryKey: [`/api/tax/1099/${currentYear}`],
    enabled: isAuthenticated,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#ea580c]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-4">
        <Card className="p-6 max-w-md text-center">
          <p className="font-bold text-lg mb-2">Sign In Required</p>
          <p className="text-muted-foreground mb-4">Please sign in to view your tax center.</p>
          <Link href="/login">
            <Button className="bg-[#ea580c] hover:bg-[#c2410c] text-white">Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const gross = annual?.grossRevenue || 0;
  const fees = annual?.platformFees || 0;
  const net = annual?.netPayouts || 0;
  const jobs = annual?.totalJobs || 0;

  function downloadCSV(url: string, filename: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="w-10 h-10" textClassName="text-xl" />
          </Link>
          <Link href="/career">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tax Center</h1>
          <p className="text-muted-foreground text-sm">{currentYear} Earnings Overview</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Gross Revenue" value={`$${gross.toFixed(0)}`} icon={DollarSign} />
          <StatCard label="Platform Fees" value={`$${fees.toFixed(0)}`} icon={TrendingUp} />
          <StatCard label="Net Payouts" value={`$${net.toFixed(0)}`} icon={DollarSign} />
          <StatCard label="Jobs Completed" value={String(jobs)} icon={Calendar} />
        </div>

        {/* Download Annual Export */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800">Annual Tax Summary</h3>
              <p className="text-sm text-muted-foreground">Download all {currentYear} transactions as CSV</p>
            </div>
            <Button
              variant="outline"
              onClick={() => downloadCSV(`/api/tax/export/${currentYear}`, `uptend-tax-export-${currentYear}.csv`)}
            >
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
          </div>
        </Card>

        {/* Monthly Breakdown */}
        <Card className="p-5">
          <h3 className="font-bold text-slate-800 mb-4">Monthly Breakdown</h3>
          <div className="space-y-2">
            {annual?.quarters?.flatMap((q) =>
              q.months.map((m) => (
                <div key={m.month} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium w-8">{MONTH_NAMES[m.month - 1]}</span>
                    <div>
                      <span className="text-sm">${m.grossRevenue.toFixed(2)} gross</span>
                      <span className="text-xs text-muted-foreground ml-2">({m.jobCount} jobs)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-green-700">${m.netPayouts.toFixed(2)}</span>
                    {m.jobCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() =>
                          downloadCSV(
                            `/api/tax/monthly/${currentYear}/${m.month}?format=csv`,
                            `uptend-tax-${currentYear}-${String(m.month).padStart(2, "0")}.csv`
                          )
                        }
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Quarterly Summaries */}
        <Card className="p-5">
          <h3 className="font-bold text-slate-800 mb-4">Quarterly Summaries</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {annual?.quarters?.map((q) => (
              <div key={q.quarter} className="p-3 bg-slate-50 rounded-lg text-center">
                <p className="font-bold text-sm text-slate-700">Q{q.quarter}</p>
                <p className="text-lg font-bold text-slate-800">${q.totalNet.toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">{q.totalJobs} jobs</p>
              </div>
            ))}
          </div>
        </Card>

        {/* 1099-K Section */}
        <Card className="p-5 border-amber-200 bg-amber-50/30">
          <div className="flex items-start gap-3">
            <FileText className="w-6 h-6 text-[#ea580c] shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-800">1099-K Tax Form</h3>
              {data1099?.threshold1099 ? (
                <p className="text-sm text-slate-600 mt-1">
                  Your {currentYear} gross earnings exceed $600. A 1099-K form will be available by January 31 of the following year.
                </p>
              ) : (
                <p className="text-sm text-slate-600 mt-1">
                  Your {currentYear} gross earnings are below the $600 threshold. No 1099-K will be issued.
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                UpTend reports earnings to the IRS for amounts over $600/year. Consult a tax professional for guidance.
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
