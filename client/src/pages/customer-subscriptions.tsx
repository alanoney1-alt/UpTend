/**
 * Customer Subscriptions Dashboard
 *
 * Manage PolishUp recurring cleaning subscriptions
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/landing/header";
import { apiRequest } from "@/lib/queryClient";
import {
  Calendar,
  Clock,
  Pause,
  Play,
  X,
  Edit,
  SkipForward,
  Sparkles,
  CheckCircle,
  AlertCircle,
  User,
} from "lucide-react";

interface RecurringSubscription {
  id: string;
  customerId: string;
  serviceType: string;
  frequency: "weekly" | "biweekly" | "monthly";
  homeDetails: {
    bedrooms: string;
    bathrooms: string;
    cleanType: "standard" | "deep" | "moveInOut";
    addOns: string[];
    specialInstructions?: string;
    bringsSupplies: boolean;
  };
  preferredDay?: string;
  preferredTimeWindow?: "morning" | "afternoon" | "evening";
  assignedProId?: string;
  stripeSubscriptionId?: string;
  status: "active" | "paused" | "cancelled";
  nextBookingDate?: string;
  bookingsCompleted: number;
  minimumBookingsCommitment: number;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

const FREQUENCY_LABELS = {
  weekly: "Weekly",
  biweekly: "Every 2 Weeks",
  monthly: "Monthly",
};

const CLEAN_TYPE_LABELS = {
  standard: "Standard Clean",
  deep: "Deep Clean",
  moveInOut: "Move-In/Move-Out Clean",
};

const TIME_WINDOW_LABELS = {
  morning: "Morning (8am-12pm)",
  afternoon: "Afternoon (12pm-4pm)",
  evening: "Evening (4pm-8pm)",
};

export default function CustomerSubscriptions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<RecurringSubscription | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");

  // Fetch subscriptions
  const { data: subscriptions = [], isLoading } = useQuery<RecurringSubscription[]>({
    queryKey: [`/api/subscriptions/customer/${user?.id}`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/subscriptions/customer/${user?.id}`);
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Pause subscription
  const pauseMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const response = await apiRequest("PUT", `/api/subscriptions/${subscriptionId}/pause`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/subscriptions/customer/${user?.id}`] });
    },
  });

  // Resume subscription
  const resumeMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const response = await apiRequest("PUT", `/api/subscriptions/${subscriptionId}/resume`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/subscriptions/customer/${user?.id}`] });
    },
  });

  // Cancel subscription
  const cancelMutation = useMutation({
    mutationFn: async ({ subscriptionId, reason }: { subscriptionId: string; reason: string }) => {
      const response = await apiRequest("PUT", `/api/subscriptions/${subscriptionId}/cancel`, {
        cancellationReason: reason,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/subscriptions/customer/${user?.id}`] });
      setCancelDialogOpen(false);
      setSelectedSubscription(null);
      setCancellationReason("");
    },
  });

  // Skip next booking
  const skipMutation = useMutation({
    mutationFn: async (subscriptionId: string) => {
      const response = await apiRequest("POST", `/api/subscriptions/${subscriptionId}/skip-booking`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/subscriptions/customer/${user?.id}`] });
    },
  });

  const handlePause = (subscription: RecurringSubscription) => {
    pauseMutation.mutate(subscription.id);
  };

  const handleResume = (subscription: RecurringSubscription) => {
    resumeMutation.mutate(subscription.id);
  };

  const handleCancelClick = (subscription: RecurringSubscription) => {
    setSelectedSubscription(subscription);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = () => {
    if (!selectedSubscription || !cancellationReason.trim()) return;
    cancelMutation.mutate({ subscriptionId: selectedSubscription.id, reason: cancellationReason });
  };

  const handleSkip = (subscription: RecurringSubscription) => {
    if (confirm("Skip your next scheduled clean? Your next booking will be pushed to the following cycle.")) {
      skipMutation.mutate(subscription.id);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 px-6 max-w-5xl mx-auto">
          <p className="text-center text-muted-foreground">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  const activeSubscriptions = subscriptions.filter(s => s.status === "active");
  const pausedSubscriptions = subscriptions.filter(s => s.status === "paused");
  const cancelledSubscriptions = subscriptions.filter(s => s.status === "cancelled");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-24 pb-16 px-6 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Subscriptions</h1>
          <p className="text-muted-foreground">Manage your recurring PolishUp<sup>™</sup> cleaning plans</p>
        </div>

        {subscriptions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Subscriptions Yet</h3>
              <p className="text-muted-foreground mb-6">
                Set up a recurring clean and save 10-15% on every visit
              </p>
              <Button onClick={() => (window.location.href = "/book?service=home_cleaning")}>
                Book PolishUp<sup>™</sup> Clean
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Active Subscriptions */}
            {activeSubscriptions.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Active Plans ({activeSubscriptions.length})
                </h2>
                <div className="space-y-4">
                  {activeSubscriptions.map((subscription) => (
                    <Card key={subscription.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {CLEAN_TYPE_LABELS[subscription.homeDetails.cleanType]}
                              <Badge variant="default">Active</Badge>
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {subscription.homeDetails.bedrooms} bed • {subscription.homeDetails.bathrooms} bath •{" "}
                              {FREQUENCY_LABELS[subscription.frequency]}
                            </CardDescription>
                          </div>
                          <Sparkles className="w-6 h-6 text-primary" />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Next Clean</p>
                              <p className="text-sm text-muted-foreground">
                                {subscription.nextBookingDate
                                  ? formatDate(subscription.nextBookingDate)
                                  : "To be scheduled"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Preferred Time</p>
                              <p className="text-sm text-muted-foreground">
                                {subscription.preferredTimeWindow
                                  ? TIME_WINDOW_LABELS[subscription.preferredTimeWindow]
                                  : "Flexible"}
                              </p>
                            </div>
                          </div>
                          {subscription.assignedProId && (
                            <div className="flex items-start gap-3">
                              <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                              <div>
                                <p className="text-sm font-medium">Your Pro</p>
                                <p className="text-sm text-muted-foreground">Assigned Pro (same each time)</p>
                              </div>
                            </div>
                          )}
                          <div className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Completed</p>
                              <p className="text-sm text-muted-foreground">
                                {subscription.bookingsCompleted} of {subscription.minimumBookingsCommitment} minimum
                              </p>
                            </div>
                          </div>
                        </div>

                        {subscription.homeDetails.addOns.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Add-Ons</p>
                            <div className="flex flex-wrap gap-2">
                              {subscription.homeDetails.addOns.map((addon) => (
                                <Badge key={addon} variant="secondary">
                                  {addon.replace("_", " ")}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2 pt-4 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSkip(subscription)}
                            disabled={skipMutation.isPending}
                          >
                            <SkipForward className="w-4 h-4 mr-2" />
                            Skip Next Clean
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePause(subscription)}
                            disabled={pauseMutation.isPending}
                          >
                            <Pause className="w-4 h-4 mr-2" />
                            Pause
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => (window.location.href = `/book?service=home_cleaning&edit=${subscription.id}`)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Plan
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelClick(subscription)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Paused Subscriptions */}
            {pausedSubscriptions.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Pause className="w-5 h-5 text-yellow-500" />
                  Paused Plans ({pausedSubscriptions.length})
                </h2>
                <div className="space-y-4">
                  {pausedSubscriptions.map((subscription) => (
                    <Card key={subscription.id} className="opacity-75">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {CLEAN_TYPE_LABELS[subscription.homeDetails.cleanType]}
                              <Badge variant="secondary">Paused</Badge>
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {subscription.homeDetails.bedrooms} bed • {subscription.homeDetails.bathrooms} bath •{" "}
                              {FREQUENCY_LABELS[subscription.frequency]}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleResume(subscription)}
                            disabled={resumeMutation.isPending}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Resume
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelClick(subscription)}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Cancelled Subscriptions */}
            {cancelledSubscriptions.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-muted-foreground" />
                  Past Plans ({cancelledSubscriptions.length})
                </h2>
                <div className="space-y-4">
                  {cancelledSubscriptions.map((subscription) => (
                    <Card key={subscription.id} className="opacity-60">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {CLEAN_TYPE_LABELS[subscription.homeDetails.cleanType]}
                          <Badge variant="outline">Cancelled</Badge>
                        </CardTitle>
                        <CardDescription>
                          Cancelled on {subscription.cancelledAt ? formatDate(subscription.cancelledAt) : "Unknown"}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this recurring clean? You can always restart it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancellation-reason">Reason for cancelling (optional)</Label>
              <Textarea
                id="cancellation-reason"
                placeholder="Let us know why you're cancelling so we can improve..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? "Cancelling..." : "Cancel Subscription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
