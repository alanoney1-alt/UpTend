import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, CreditCard, Shield, CheckCircle2, Lock, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/landing/header";

let stripePromise: Promise<any> | null = null;

async function getStripe() {
  if (!stripePromise) {
    const response = await fetch("/api/stripe/publishable-key");
    const { publishableKey } = await response.json();
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

function PaymentSetupForm({ 
  clientSecret, 
  customerId, 
  onSuccess 
}: { 
  clientSecret: string; 
  customerId: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const confirmMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const response = await apiRequest("POST", "/api/customers/confirm-payment-setup", {
        paymentMethodId,
        stripeCustomerId: customerId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers/payment-status"] });
      onSuccess();
    },
    onError: (error: any) => {
      // Parse error message from API response
      let errorMessage = "Could not save payment method";
      if (error?.message) {
        try {
          const jsonMatch = error.message.match(/\{.*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            errorMessage = parsed.error || errorMessage;
          }
        } catch {
          errorMessage = error.message;
        }
      }
      toast({
        title: "Setup Failed",
        description: errorMessage,
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

    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message || "Payment setup failed",
        variant: "destructive",
      });
      setIsProcessing(false);
    } else if (setupIntent && setupIntent.status === "succeeded") {
      confirmMutation.mutate(setupIntent.payment_method as string);
    } else {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-muted/50 rounded-lg p-4 mb-4">
        <PaymentElement 
          options={{
            layout: "tabs",
          }}
        />
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-start gap-2 text-muted-foreground">
          <Lock className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
          <span>Your card is securely stored with Stripe. We never see your full card number.</span>
        </div>
        <div className="flex items-start gap-2 text-muted-foreground">
          <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
          <span><strong>No charges until you confirm a booking.</strong> You'll see the exact price before any payment is processed.</span>
        </div>
        <div className="flex items-start gap-2 text-muted-foreground">
          <Shield className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
          <span>Payment is only authorized after you accept a Pro's quote and confirm your booking.</span>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing || confirmMutation.isPending}
        data-testid="button-save-payment"
      >
        {isProcessing || confirmMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving Payment Method...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Save Payment Method & Continue
          </>
        )}
      </Button>
    </form>
  );
}

export default function PaymentSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [stripeInstance, setStripeInstance] = useState<any>(null);
  const [setupComplete, setSetupComplete] = useState(false);

  // Check if user is authenticated
  const authQuery = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/user", { credentials: "include" });
      if (res.status === 401) {
        return null;
      }
      if (!res.ok) {
        throw new Error("Failed to check auth status");
      }
      return res.json();
    },
  });

  useEffect(() => {
    getStripe()
      .then(setStripeInstance)
      .catch(error => {
        console.error('Failed to load Stripe:', error);
        toast({
          title: 'Payment Error',
          description: 'Failed to load payment system. Please refresh the page.',
          variant: 'destructive',
        });
      });
  }, [toast]);

  const setupQuery = useQuery({
    queryKey: ["/api/customers/setup-payment"],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/customers/setup-payment", {});
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to setup payment");
      }
      return response.json();
    },
    enabled: !!authQuery.data, // Only run when authenticated
  });

  const handleSuccess = () => {
    setSetupComplete(true);
    toast({
      title: "Payment Method Saved!",
      description: "You're all set to book hauling services.",
    });
  };

  const handleContinue = () => {
    setLocation("/book");
  };

  if (setupComplete) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <Card className="w-full max-w-md p-8 text-center" data-testid="card-payment-success">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">You're All Set!</h1>
            <p className="text-muted-foreground mb-6">
              Your payment method has been saved. You can now book hauling services instantly.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 mb-6 text-sm text-left space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span>Your card won't be charged until you confirm a booking</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                <span>You'll see the exact price before any charge</span>
              </div>
            </div>
            <Button onClick={handleContinue} className="w-full" data-testid="button-start-booking">
              Start Booking
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <Card className="p-8" data-testid="card-payment-setup">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2">Add Payment Method</h1>
              <p className="text-muted-foreground">
                Securely save a card to enable instant booking
              </p>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">No charges until you book</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    We securely save your card to enable instant booking. You'll see your exact price and won't be charged until you confirm a booking with a Pro.
                  </p>
                </div>
              </div>
            </div>

            {authQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : !authQuery.data ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Please log in to add a payment method.</p>
                <Button onClick={() => setLocation("/login")} variant="default" data-testid="button-login-redirect">
                  Log In
                </Button>
              </div>
            ) : setupQuery.isLoading || !stripeInstance ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : setupQuery.error ? (
              <div className="text-center py-8">
                <p className="text-destructive mb-4">Failed to load payment form. Please try again.</p>
                <Button onClick={() => setupQuery.refetch()} variant="outline" data-testid="button-retry">
                  Retry
                </Button>
              </div>
            ) : setupQuery.data?.clientSecret ? (
              <Elements 
                stripe={stripeInstance} 
                options={{ 
                  clientSecret: setupQuery.data.clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#F47C20',
                    },
                  },
                }}
              >
                <PaymentSetupForm 
                  clientSecret={setupQuery.data.clientSecret}
                  customerId={setupQuery.data.customerId}
                  onSuccess={handleSuccess}
                />
              </Elements>
            ) : null}
          </Card>
        </div>
      </main>
    </div>
  );
}
