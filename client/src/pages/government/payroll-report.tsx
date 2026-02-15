import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FileText, Send, Printer, AlertTriangle } from "lucide-react";

function cents(amount: number | null | undefined) {
  return `$${((amount || 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

/**
 * WH-347 Compliance Report Viewer
 *
 * INTERNAL ADMIN TOOL ONLY — This page is for government compliance reporting.
 * All figures shown here (including any rate-of-pay columns) are BACK-CALCULATED
 * from flat-rate work order quotes for WH-347 form compliance. They do NOT represent
 * the contractor's actual compensation structure. Contractors are paid flat-rate per job.
 *
 * This page should NEVER be shown to pros/contractors.
 */
export default function PayrollReport() {
  const { id: contractId, reportId } = useParams<{ id: string; reportId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: payrollData, isLoading } = useQuery({
    queryKey: [`/api/government/payroll/${reportId}`],
  });

  const { data: wh347Data } = useQuery({
    queryKey: [`/api/government/payroll/${reportId}/wh347`],
  });

  const submitMutation = useMutation({
    mutationFn: () => apiRequest("PUT", `/api/government/payroll/${reportId}/submit`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/government/payroll/${reportId}`] });
      toast({ title: "Report submitted to contracting officer" });
    },
  });

  if (isLoading) return <div className="p-6 text-gray-500">Loading compliance report...</div>;
  if (!payrollData) return <div className="p-6 text-red-500">Report not found</div>;

  const report = (payrollData as any).report;
  const entries = (payrollData as any).entries || [];
  const wh347 = wh347Data as any;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(`/government/contracts/${contractId}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-6 w-6 text-amber-600" /> WH-347 Compliance Report
              </h1>
              <p className="text-gray-500">Report #{report.reportNumber} — Week Ending {report.weekEndingDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={report.status === "submitted" ? "bg-blue-100 text-blue-800" : report.status === "accepted" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
              {report.status}
            </Badge>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
            {report.status === "draft" && (
              <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => submitMutation.mutate()}>
                <Send className="h-4 w-4 mr-2" /> Submit
              </Button>
            )}
          </div>
        </div>

        {/* INTERNAL NOTICE */}
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex items-start gap-2 print:hidden">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <strong>Internal Compliance Report</strong> — All rate and time figures below are back-calculated from
            flat-rate work order quotes to satisfy DOL WH-347 form requirements. They do not represent contractor
            compensation structure. Pros are paid flat-rate per job.
          </div>
        </div>

        {/* WH-347 Form */}
        <Card className="print:shadow-none print:border-2 print:border-black">
          <CardContent className="pt-6">
            {/* Form Header */}
            <div className="text-center border-b-2 border-black pb-4 mb-4">
              <h2 className="text-lg font-bold">U.S. DEPARTMENT OF LABOR</h2>
              <h3 className="text-sm font-semibold">WAGE AND HOUR DIVISION</h3>
              <h3 className="text-xl font-bold mt-2">PAYROLL</h3>
              <p className="text-xs text-gray-500">(For Contractor's Optional Use; See Instructions at Form WH-347 Instructions)</p>
            </div>

            {/* Form Info */}
            <div className="grid grid-cols-2 gap-4 text-sm border-b pb-4 mb-4">
              <div>
                <p><strong>Name and Address of Contractor:</strong></p>
                <p>{wh347?.header?.contractorOrSubcontractor || "UpTend LLC"}</p>
              </div>
              <div>
                <p><strong>Payroll No:</strong> {report.reportNumber}</p>
                <p><strong>For Week Ending:</strong> {report.weekEndingDate}</p>
              </div>
              <div>
                <p><strong>Project and Location:</strong></p>
                <p>{wh347?.header?.projectAndLocation || "N/A"}</p>
              </div>
              <div>
                <p><strong>Project or Contract No:</strong></p>
                <p>{wh347?.header?.projectOrContractNo || "N/A"}</p>
              </div>
            </div>

            {/* Worker Table */}
            {/* INTERNAL COMPLIANCE CALCULATION ONLY — all rates are back-calculated from flat-rate quotes */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-1 text-left">#</th>
                    <th className="border p-1 text-left">Name / Address / SSN Last 4</th>
                    <th className="border p-1 text-left">Work Classification</th>
                    <th className="border p-1 text-center">S</th>
                    <th className="border p-1 text-center">M</th>
                    <th className="border p-1 text-center">T</th>
                    <th className="border p-1 text-center">W</th>
                    <th className="border p-1 text-center">T</th>
                    <th className="border p-1 text-center">F</th>
                    <th className="border p-1 text-center">S</th>
                    <th className="border p-1 text-center">Total</th>
                    <th className="border p-1 text-right">Rate*</th>
                    <th className="border p-1 text-right">Gross</th>
                    <th className="border p-1 text-right">FICA</th>
                    <th className="border p-1 text-right">W/H</th>
                    <th className="border p-1 text-right">Other</th>
                    <th className="border p-1 text-right">Total Ded.</th>
                    <th className="border p-1 text-right">Net Pay</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry: any, idx: number) => {
                    const fica = (entry.socialSecurity || 0) + (entry.medicare || 0);
                    const wh = (entry.federalTax || 0) + (entry.stateTax || 0);
                    const totalDed = fica + wh + (entry.otherDeductions || 0);
                    return (
                      <tr key={entry.id} className="hover:bg-amber-50">
                        <td className="border p-1">{idx + 1}</td>
                        <td className="border p-1">
                          <div className="font-medium">{entry.proName}</div>
                          <div className="text-gray-400">{entry.proAddress || ""}</div>
                          {entry.proSSNLast4 && <div className="text-gray-400">xxx-xx-{entry.proSSNLast4}</div>}
                        </td>
                        <td className="border p-1">{entry.jobClassification}</td>
                        <td className="border p-1 text-center">{entry.hoursSunday || ""}</td>
                        <td className="border p-1 text-center">{entry.hoursMonday || ""}</td>
                        <td className="border p-1 text-center">{entry.hoursTuesday || ""}</td>
                        <td className="border p-1 text-center">{entry.hoursWednesday || ""}</td>
                        <td className="border p-1 text-center">{entry.hoursThursday || ""}</td>
                        <td className="border p-1 text-center">{entry.hoursFriday || ""}</td>
                        <td className="border p-1 text-center">{entry.hoursSaturday || ""}</td>
                        <td className="border p-1 text-center font-medium">{entry.totalHours}</td>
                        {/* INTERNAL COMPLIANCE CALCULATION ONLY — back-calculated from flat-rate quote */}
                        <td className="border p-1 text-right">{cents(entry.hourlyRate)}</td>
                        <td className="border p-1 text-right font-medium">{cents(entry.grossPay)}</td>
                        <td className="border p-1 text-right">{cents(fica)}</td>
                        <td className="border p-1 text-right">{cents(wh)}</td>
                        <td className="border p-1 text-right">{cents(entry.otherDeductions)}</td>
                        <td className="border p-1 text-right">{cents(totalDed)}</td>
                        <td className="border p-1 text-right font-medium">{cents(entry.netPay)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={12} className="border p-1 text-right">TOTALS:</td>
                    <td className="border p-1 text-right">{cents(report.totalGrossWages)}</td>
                    <td colSpan={3} className="border p-1"></td>
                    <td className="border p-1 text-right">{cents(report.totalDeductions)}</td>
                    <td className="border p-1 text-right">{cents(report.totalNetPay)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Rate footnote */}
            <p className="text-xs text-gray-400 mt-2 italic print:text-black">
              * Rate column: Back-calculated equivalent from flat-rate work order quotes for WH-347 compliance. Not actual compensation rate.
            </p>

            {/* Statement of Compliance */}
            <div className="mt-6 border-t-2 border-black pt-4">
              <h3 className="text-sm font-bold mb-2">STATEMENT OF COMPLIANCE</h3>
              <div className="text-xs space-y-2">
                <p>
                  I, <span className="border-b border-black px-8">
                    {wh347?.statementOfCompliance?.signedBy || "____________________"}
                  </span>,
                  <span className="border-b border-black px-8">
                    {wh347?.statementOfCompliance?.title || "____________________"}
                  </span> (Title),
                </p>
                <p>do hereby state:</p>
                <p className="pl-4">
                  (1) That I pay or supervise the payment of the persons employed by{" "}
                  <span className="font-medium">UpTend LLC</span> on the{" "}
                  <span className="font-medium">{wh347?.header?.projectAndLocation || "____"}</span>;
                  that during the payroll period commencing on the{" "}
                  <span className="font-medium">{report.weekEndingDate}</span> and ending the{" "}
                  <span className="font-medium">{report.weekEndingDate}</span>,
                  all persons employed on said project have been paid the full weekly wages earned, that no rebates have been or will be made
                  either directly or indirectly to or on behalf of said from the full weekly wages earned by any person and that no deductions
                  have been made either directly or indirectly from the full wages earned by any person, other than permissible deductions as
                  defined in Regulations, Part 3 (29 CFR Subtitle A), issued by the Secretary of Labor under the Copeland Act, as amended (48
                  Stat. 948, 63 Stat. 108, 72 Stat. 967; 76 Stat. 357; 40 U.S.C. § 3145).
                </p>
                <p className="pl-4">
                  (2) That any payrolls otherwise under this contract required to be submitted for the above period are correct and complete;
                  that the wage rates for laborers or mechanics contained therein are not less than the applicable wage rates contained in any
                  wage determination incorporated into the contract; that the classifications set forth therein for each laborer or mechanic
                  conform with the work he performed.
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-8 text-sm">
                <div>
                  <p className="border-b border-black pb-1 mb-1">Signature: ____________________________</p>
                  <p className="text-xs text-gray-500">
                    {wh347?.statementOfCompliance?.isCertified ? "✓ Certified" : "Not yet certified"}
                  </p>
                </div>
                <div>
                  <p className="border-b border-black pb-1 mb-1">
                    Date: {wh347?.statementOfCompliance?.signedDate || "____________________________"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fringe Benefits Summary */}
        {report.totalFringeBenefits > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Fringe Benefits Summary</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm">Total Fringe Benefits: <strong>{cents(report.totalFringeBenefits)}</strong></p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
