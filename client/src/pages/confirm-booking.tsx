import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, CreditCard, Shield, CheckCircle2, Lock, AlertCircle, MapPin, Calendar, Clock, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { trackPageView } from "@/lib/page-tracker";

let stripePromise: Promise<any> | null = null;

async function getStripe() {
  if (!stripePromise) {
    const response = await fetch("/api/stripe/publishable-key");
    const { publishableKey } = await response.json();
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

function ConfirmationForm({
  request,
  token,
  onSuccess
}: {
  request: any;
  token: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const confirmMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const response = await apiRequest("POST", `/api/service-requests/${request.id}/confirm`, {
        token,
        paymentMethodId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        onSuccess();
      } else {
        toast({
          title: "Confirmation Failed",
          description: data.error || "Please try again",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Confirmation Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        elements,
        params: {
          type: 'card',
        },
      });

      if (error) {
        toast({
          title: "Payment Method Error",
          description: error.message || "Please check your card details",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Confirm booking with payment method
      confirmMutation.mutate(paymentMethod.id);
    } catch (err) {
      toast({
        title: "Payment Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Payment Details</h3>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total Amount</span>
          <span className="text-2xl font-bold text-primary">${(request.quotedPrice || request.priceEstimate || 0).toFixed(2)}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Your card will be authorized now but only charged when the work is completed.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <PaymentElement
          options={{
            layout: "tabs"
          }}
        />

        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex gap-3">
          <Shield className="w-6 h-6 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-green-900 dark:text-green-200 text-sm">The UpTend Promise</h4>
            <p className="text-xs text-green-700 dark:text-green-400 mt-1">
              If you aren't 100% satisfied with the job, we will come back and fix it for free.
              If you still hate it, you don't pay.
            </p>
          </div>
        </div>

        <Button
          type="submit"
          disabled={!stripe || isProcessing || confirmMutation.isPending}
          className="w-full"
          size="lg"
        >
          {isProcessing || confirmMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Confirm & Authorize ${(request.quotedPrice || request.priceEstimate || 0).toFixed(2)}
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          By confirming, you authorize payment and agree to our Terms of Service.
        </p>
      </form>
    </Card>
  );
}

export default function ConfirmBooking() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [stripeInstance, setStripeInstance] = useState<any>(null);

  // Track page view for analytics (auto-detect if partner-related)
  useEffect(() => {
    trackPageView(); // Will auto-detect partner slug and page type from URL
  }, []);
  const [isSuccess, setIsSuccess] = useState(false);

  // Extract requestId from path and token from query
  const pathParts = location.split('/');
  const requestId = pathParts[pathParts.indexOf('confirm') + 1]?.split('?')[0];
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  // Fetch service request with token validation
  const { data: request, isLoading, error } = useQuery({
    queryKey: ["/api/service-requests", requestId, "confirm"],
    queryFn: async () => {
      if (!requestId || !token) {
        throw new Error("Missing request ID or confirmation token");
      }
      const response = await apiRequest("GET", `/api/service-requests/${requestId}?token=${token}`);
      return response.json();
    },
    enabled: !!requestId && !!token,
  });

  useEffect(() => {
    getStripe().then(setStripeInstance);
  }, []);

  if (!requestId || !token) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Invalid Link</h1>
            <p className="text-muted-foreground mb-4">
              This confirmation link is invalid or has expired.
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p>Loading your quote...</p>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Quote Not Found</h1>
            <p className="text-muted-foreground mb-4">
              This quote is no longer available or has already been confirmed.
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-green-600 dark:text-green-400">
              Booking Confirmed!
            </h1>
            <p className="text-muted-foreground mb-6">
              Your payment has been authorized and your professional has been notified.
              You'll only be charged when the work is completed.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold mb-2">What happens next?</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Your pro will contact you to schedule the work</li>
                <li>• You'll receive updates via email and SMS</li>
                <li>• Payment will be processed only after completion</li>
                <li>• You can track progress in your UpTend dashboard</li>
              </ul>
            </div>
            <Button onClick={() => navigate('/')} className="w-full">
              Return to UpTend
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const scheduledDate = request.scheduledFor ? new Date(request.scheduledFor) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to UpTend
          </Button>
          <h1 className="text-3xl font-bold">Confirm Your Booking</h1>
          <p className="text-muted-foreground mt-2">
            Review the details and authorize payment to confirm your service.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Quote Details */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Quote Details</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">{request.serviceType || "Service"}</div>
                    <div className="text-sm text-muted-foreground">Service Type</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">{request.pickupAddress || "Address on file"}</div>
                    <div className="text-sm text-muted-foreground">Service Location</div>
                  </div>
                </div>

                {scheduledDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">{scheduledDate.toLocaleDateString()}</div>
                      <div className="text-sm text-muted-foreground">Scheduled Date</div>
                    </div>
                  </div>
                )}

                {request.estimatedDuration && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">{request.estimatedDuration}</div>
                      <div className="text-sm text-muted-foreground">Estimated Duration</div>
                    </div>
                  </div>
                )}

                {request.quoteNotes && (
                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-2">Professional Notes</h3>
                    <p className="text-sm text-muted-foreground">{request.quoteNotes}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-primary/5 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Quote</span>
                  <span className="text-2xl font-bold text-primary">
                    ${(request.quotedPrice || request.priceEstimate || 0).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  You'll only be charged when the work is completed
                </p>
              </div>
            </Card>
          </div>

          {/* Payment Form */}
          <div>
            {stripeInstance ? (
              <Elements
                stripe={stripeInstance}
                options={{
                  mode: 'payment',
                  amount: Math.round((request.quotedPrice || request.priceEstimate || 0) * 100),
                  currency: 'usd',
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#2563eb',
                    },
                  },
                }}
              >
                <ConfirmationForm
                  request={request}
                  token={token}
                  onSuccess={() => setIsSuccess(true)}
                />
              </Elements>
            ) : (
              <Card className="p-6">
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
                  <span>Loading payment form...</span>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}