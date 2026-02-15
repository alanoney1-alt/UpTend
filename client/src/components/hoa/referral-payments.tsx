/**
 * HOA Referral Payment Tracking
 *
 * Tracks referral commissions earned when residents book UpTend services:
 * - 5% commission on all jobs from properties in HOA portfolio
 * - Monthly payout summaries
 * - Property-level breakdown
 * - Payment history
 * - Pending vs. paid commissions
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign, TrendingUp, Calendar, MapPin, CheckCircle,
  Clock, Gift, Home, Receipt
} from "lucide-react";
import { format } from "date-fns";

interface ReferralPayment {
  id: string;
  propertyId: string;
  propertyAddress: string;
  serviceRequestId: string;
  serviceType: string;
  jobAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: "pending" | "processing" | "paid";
  completedAt: string;
  paidAt?: string;
}

interface ReferralSummary {
  totalEarned: number;
  pendingAmount: number;
  processingAmount: number;
  paidAmount: number;
  totalJobs: number;
  averageCommission: number;
  monthlyBreakdown: Array<{
    month: string;
    jobCount: number;
    totalCommission: number;
    paidCommission: number;
  }>;
  propertyBreakdown: Array<{
    propertyId: string;
    propertyAddress: string;
    jobCount: number;
    totalCommission: number;
  }>;
  recentPayments: ReferralPayment[];
}

interface HoaReferralPaymentsProps {
  businessAccountId: string;
}

export function HoaReferralPayments({ businessAccountId }: HoaReferralPaymentsProps) {
  // Fetch referral payment summary
  const { data: summary, isLoading } = useQuery<ReferralSummary>({
    queryKey: [`/api/business/${businessAccountId}/referral-payments`],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const hasData = summary && summary.totalJobs > 0;

  if (!summary) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>Unable to load referral payment data.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Gift className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <CardTitle>Referral Commissions</CardTitle>
              <CardDescription>
                Earn 5% on all services booked by residents in your community
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {!hasData ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Referrals Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Commissions will appear here when residents in your properties book UpTend services
            </p>
            <div className="max-w-md mx-auto text-left space-y-2 mt-6">
              <p className="text-sm font-medium">How it works:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Residents book services for properties in your portfolio</li>
                <li>• You earn 5% commission on completed jobs</li>
                <li>• Payments processed monthly via ACH</li>
                <li>• Track earnings in real-time</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Earned
                  </CardTitle>
                  <DollarSign className="w-4 h-4 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  ${summary.totalEarned.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From {summary.totalJobs} completed job{summary.totalJobs !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-500/10 to-transparent border-yellow-500/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pending
                  </CardTitle>
                  <Clock className="w-4 h-4 text-yellow-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  ${summary.pendingAmount.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting job completion
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Processing
                  </CardTitle>
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  ${summary.processingAmount.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Next payout cycle
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Paid Out
                  </CardTitle>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  ${summary.paidAmount.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Received to date
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="recent" className="space-y-6">
            <TabsList>
              <TabsTrigger value="recent">
                <Receipt className="w-4 h-4 mr-1" />
                Recent Activity
              </TabsTrigger>
              <TabsTrigger value="properties">
                <Home className="w-4 h-4 mr-1" />
                By Property
              </TabsTrigger>
              <TabsTrigger value="monthly">
                <Calendar className="w-4 h-4 mr-1" />
                Monthly Trends
              </TabsTrigger>
            </TabsList>

            {/* Recent Payments */}
            <TabsContent value="recent" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Commissions</CardTitle>
                  <CardDescription>
                    Latest referral payments from resident bookings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {summary.recentPayments.map((payment) => (
                      <div key={payment.id} className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                              <h4 className="font-medium truncate">{payment.propertyAddress}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground capitalize">
                              {payment.serviceType.replace(/_/g, " ")} • {format(new Date(payment.completedAt), "MMM d, yyyy")}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                              ${payment.commissionAmount.toFixed(2)}
                            </div>
                            <Badge
                              variant={
                                payment.status === "paid"
                                  ? "default"
                                  : payment.status === "processing"
                                  ? "secondary"
                                  : "outline"
                              }
                              className="text-xs"
                            >
                              {payment.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground pl-6">
                          <span>Job Amount: ${payment.jobAmount.toFixed(2)}</span>
                          <span>•</span>
                          <span>Commission: {(payment.commissionRate * 100).toFixed(0)}%</span>
                        </div>
                        <Separator />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Property Breakdown */}
            <TabsContent value="properties" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Commissions by Property</CardTitle>
                  <CardDescription>
                    See which properties generate the most referrals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {summary.propertyBreakdown
                      .sort((a, b) => b.totalCommission - a.totalCommission)
                      .map((property, index) => (
                        <div key={property.propertyId} className="space-y-2">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <span className="text-sm font-bold text-primary">
                                  #{index + 1}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold truncate">{property.propertyAddress}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {property.jobCount} booking{property.jobCount !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                ${property.totalCommission.toFixed(2)}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                ${(property.totalCommission / property.jobCount).toFixed(2)} avg
                              </p>
                            </div>
                          </div>
                          {index < summary.propertyBreakdown.length - 1 && <Separator />}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Monthly Trends */}
            <TabsContent value="monthly" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Commission Trends</CardTitle>
                  <CardDescription>
                    Track your referral income over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {summary.monthlyBreakdown.map((month) => (
                      <div key={month.month} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{month.month}</span>
                          </div>
                          <Badge variant="secondary">
                            {month.jobCount} booking{month.jobCount !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                            <p className="text-xs text-muted-foreground mb-1">Total Commission</p>
                            <p className="text-xl font-bold text-purple-600">
                              ${month.totalCommission.toFixed(2)}
                            </p>
                          </div>
                          <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                            <p className="text-xs text-muted-foreground mb-1">Paid Out</p>
                            <p className="text-xl font-bold text-green-600">
                              ${month.paidCommission.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <Separator />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Payout Info */}
          <Card className="bg-muted/50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">Payout Schedule</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Commissions are paid monthly via ACH on the 15th of each month for the previous month's completed jobs. Minimum payout threshold: $25.
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      Next Payout: {format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 15), "MMM d")}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Average: ${summary.averageCommission.toFixed(2)}/job
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
