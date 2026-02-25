import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Lock, CheckCircle, Calendar, Info, Shield, ArrowRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const BNPL_THRESHOLD = 199; // Minimum order amount for BNPL (Afterpay/Klarna)

let stripePromise: ReturnType<typeof loadStripe> | null = null;

async function getStripe() {
  if (!stripePromise) {
    const response = await fetch("/api/stripe/publishable-key");
    const { publishableKey } = await response.json();
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

type PaymentMethod = "card" | "affirm" | "klarna";

interface PaymentFormProps {
  amount: number;
  jobId: string;
  customerId: string;
  assignedHaulerId?: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function CheckoutForm({ onSuccess, onError }: { onSuccess: () => void; onError: (error: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (error) {
      onError(error.message || "Payment failed");
      setIsProcessing(false);
    } else if (paymentIntent) {
      switch (paymentIntent.status) {
        case "requires_capture":
        case "succeeded":
          setPaymentComplete(true);
          onSuccess();
          break;
        case "requires_action":
          // 3D Secure or additional authentication — Stripe.js handles the redirect
          // If we get here with redirect: "if_required", it means the action couldn't be handled
          onError("Additional authentication required. Please try again or use a different card.");
          setIsProcessing(false);
          break;
        case "canceled":
          onError("This payment was canceled. Please try again.");
          setIsProcessing(false);
          break;
        default:
          onError(`Unexpected payment status: ${paymentIntent.status}. Please try again.`);
          setIsProcessing(false);
          break;
      }
    }
  };

  if (paymentComplete) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <p className="font-medium text-green-600 dark:text-green-400">Payment Authorized</p>
        <p className="text-sm text-muted-foreground mt-1">
          Your card will be charged when the job is complete.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex gap-3" data-testid="card-green-promise">
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
        disabled={!stripe || isProcessing} 
        className="w-full"
        data-testid="button-confirm-payment"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 mr-2" />
            Authorize Payment
          </>
        )}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        Your card will be authorized now but only charged when the job is complete.
      </p>
    </form>
  );
}

function BnplCheckoutForm({ 
  provider, 
  amount, 
  jobId,
  onSuccess, 
  onError,
  onBackupCardComplete
}: { 
  provider: "affirm" | "klarna";
  amount: number;
  jobId: string;
  onSuccess: () => void; 
  onError: (error: string) => void;
  onBackupCardComplete: (paymentMethodId: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [backupCardSaved, setBackupCardSaved] = useState(false);
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(null);

  const handleSaveBackupCard = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      elements,
      params: {
        type: 'card',
      },
    });

    if (error) {
      onError(error.message || "Failed to save backup card");
      setIsProcessing(false);
    } else if (paymentMethod) {
      setPaymentMethodId(paymentMethod.id);
      setBackupCardSaved(true);
      onBackupCardComplete(paymentMethod.id);
      setIsProcessing(false);
    }
  };

  const handleConfirmBnpl = async () => {
    if (!paymentMethodId) {
      onError("Please save a backup card first");
      return;
    }

    setIsProcessing(true);

    try {
      const response = await apiRequest("POST", "/api/payments/confirm-bnpl", {
        jobId,
        provider,
        backupPaymentMethodId: paymentMethodId,
      });

      const data = await response.json();
      
      if (data.success) {
        onSuccess();
      } else {
        onError(data.error || "BNPL confirmation failed");
      }
    } catch (err: any) {
      onError(err.message || "BNPL confirmation failed");
    } finally {
      setIsProcessing(false);
    }
  };

  if (backupCardSaved) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Backup card saved</span>
          </div>
          <p className="text-sm text-green-600 dark:text-green-500 mt-1">
            This card will only be charged if there are on-site adjustments to your order.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="font-medium">
              {provider === "affirm" ? "Affirm" : "Klarna"} Pay Later
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {provider === "affirm" 
              ? "Pay in 4 interest-free payments with Affirm"
              : "Pay in 4 interest-free installments with Klarna"}
          </p>
          <div className="mt-3 text-lg font-bold">
            4 payments of ${(amount / 4).toFixed(2)}
          </div>
        </div>

        <Button 
          onClick={handleConfirmBnpl}
          disabled={isProcessing}
          className="w-full"
          data-testid="button-confirm-bnpl"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Confirm with {provider === "affirm" ? "Affirm" : "Klarna"}
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveBackupCard} className="space-y-4">
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-300">Backup card required</p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              For BNPL orders, we require a backup card on file. This card will only be charged 
              if there are on-site adjustments to your order (e.g., additional items or services).
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Backup Card Details</label>
        <PaymentElement />
      </div>

      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
        data-testid="button-save-backup-card"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Shield className="w-4 h-4 mr-2" />
            Save Backup Card & Continue
          </>
        )}
      </Button>
    </form>
  );
}

export function PaymentForm({ amount, jobId, customerId, assignedHaulerId, onSuccess, onError }: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [stripeInstance, setStripeInstance] = useState<Awaited<ReturnType<typeof loadStripe>> | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card");
  const [bnplBackupComplete, setBnplBackupComplete] = useState(false);

  const showBnplOptions = amount >= BNPL_THRESHOLD;

  useEffect(() => {
    let cancelled = false;

    async function initPayment() {
      try {
        const [stripe, response] = await Promise.all([
          getStripe(),
          apiRequest("POST", "/api/payments/create-intent", {
            jobId,
            customerId,
            amount,
            assignedHaulerId,
          }),
        ]);

        if (cancelled) return;
        const stripeResult = await stripe;
        setStripeInstance(stripeResult);
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        if (!cancelled) {
          onError(err.message || "Failed to initialize payment");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    initPayment();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, customerId, amount, assignedHaulerId]);

  const handleMethodChange = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setBnplBackupComplete(false);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span>Initializing secure payment...</span>
        </div>
      </Card>
    );
  }

  if (!clientSecret || !stripeInstance) {
    return (
      <Card className="p-6">
        <div className="text-center py-4 text-destructive">
          Failed to initialize payment. Please try again.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Payment Details</h3>
      </div>

      <div className="bg-muted/50 rounded-lg p-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total Amount</span>
          <span className="text-xl font-bold">${amount.toFixed(2)}</span>
        </div>
        {showBnplOptions && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              or <span className="font-semibold text-foreground">4 payments of ${(amount / 4).toFixed(2)}</span> with Afterpay or Klarna
            </p>
          </div>
        )}
      </div>

      {showBnplOptions && (
        <div className="mb-6 space-y-3">
          <button
            type="button"
            onClick={() => handleMethodChange("card")}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
              selectedMethod === "card"
                ? "border-primary bg-primary/5"
                : "border-border hover-elevate"
            }`}
            data-testid="button-select-card-payment"
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedMethod === "card" ? "border-primary bg-primary" : "border-muted-foreground"
              }`}>
                {selectedMethod === "card" && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Pay with credit card</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleMethodChange("affirm")}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
              selectedMethod === "affirm"
                ? "border-primary bg-primary/5"
                : "border-border hover-elevate"
            }`}
            data-testid="button-select-affirm-payment"
          >
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                selectedMethod === "affirm" ? "border-primary bg-primary" : "border-muted-foreground"
              }`}>
                {selectedMethod === "affirm" && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Pay over time with Affirm</span>
                  <span className="text-primary font-semibold">(${Math.ceil(amount / 4)}/month)</span>
                </div>
                <a 
                  href="#" 
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                  data-testid="link-affirm-prequalify"
                >
                  Prequalify in seconds
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleMethodChange("klarna")}
            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
              selectedMethod === "klarna"
                ? "border-primary bg-primary/5"
                : "border-border hover-elevate"
            }`}
            data-testid="button-select-klarna-payment"
          >
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                selectedMethod === "klarna" ? "border-primary bg-primary" : "border-muted-foreground"
              }`}>
                {selectedMethod === "klarna" && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Pay over time with Klarna</span>
                  <span className="text-primary font-semibold">(${Math.ceil(amount / 4)}/month)</span>
                </div>
                <a 
                  href="#" 
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                  data-testid="link-klarna-prequalify"
                >
                  Prequalify in seconds
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          </button>

          <p className="text-xs text-muted-foreground text-center pt-2">
            0% APR financing available on orders over $250
          </p>
        </div>
      )}

      <Elements 
        stripe={stripeInstance} 
        options={{ 
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#2563eb',
            },
          },
        }}
      >
        {selectedMethod === "card" ? (
          <CheckoutForm onSuccess={onSuccess} onError={onError} />
        ) : (
          <BnplCheckoutForm
            provider={selectedMethod}
            amount={amount}
            jobId={jobId}
            onSuccess={onSuccess}
            onError={onError}
            onBackupCardComplete={(pmId) => setBnplBackupComplete(true)}
          />
        )}
      </Elements>
    </Card>
  );
}
