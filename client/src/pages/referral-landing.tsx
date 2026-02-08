import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

export default function ReferralLanding() {
  const params = useParams();
  const [, navigate] = useLocation();
  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [message, setMessage] = useState("");

  const code = params.code?.toUpperCase();

  useEffect(() => {
    if (!code) {
      setValidating(false);
      setValid(false);
      setMessage("Invalid referral link");
      return;
    }

    // Validate referral code
    fetch(`/api/referrals/validate/${code}`)
      .then(res => res.json())
      .then(data => {
        setValidating(false);
        setValid(data.valid);
        setMessage(data.message || "");
      })
      .catch(() => {
        setValidating(false);
        setValid(false);
        setMessage("Unable to validate referral code");
      });
  }, [code]);

  const handleSignup = () => {
    // Redirect to auth with referral code in query
    navigate(`/auth?referral=${code}&redirect=booking`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-20 max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <Gift className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            You've Been Invited to UpTend!
          </h1>
          <p className="text-xl text-muted-foreground">
            A friend wants you to get $25 off your first service
          </p>
        </div>

        <Card className="p-8">
          {validating && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
              <p className="text-muted-foreground">Validating your referral code...</p>
            </div>
          )}

          {!validating && !valid && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
              <h3 className="font-bold text-lg mb-2">Invalid Referral Code</h3>
              <p className="text-muted-foreground mb-6">{message}</p>
              <Button onClick={() => navigate("/")}>
                Go to Homepage
              </Button>
            </div>
          )}

          {!validating && valid && (
            <>
              <div className="text-center mb-8">
                <Badge className="bg-green-600 text-white text-lg px-6 py-2 mb-4">
                  Valid Referral Code
                </Badge>
                <div className="bg-muted rounded-lg p-6 mb-6">
                  <code className="text-3xl font-bold tracking-wider">{code}</code>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-1" />
                  <div>
                    <p className="font-medium">Get $25 Off Your First Service</p>
                    <p className="text-sm text-muted-foreground">
                      Sign up now and your credit will be automatically applied at checkout
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-1" />
                  <div>
                    <p className="font-medium">Verified Pros Only</p>
                    <p className="text-sm text-muted-foreground">
                      Background-checked professionals with instant payouts and ratings
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-1" />
                  <div>
                    <p className="font-medium">Sustainability Tracked</p>
                    <p className="text-sm text-muted-foreground">
                      Every job comes with a verified environmental impact certificate
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={handleSignup} size="lg" className="w-full text-lg">
                Sign Up & Claim $25 Credit
              </Button>

              <p className="text-center text-xs text-muted-foreground mt-4">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            </>
          )}
        </Card>

        {!validating && valid && (
          <Card className="mt-6 p-6 bg-primary/5 border-primary/20">
            <h3 className="font-bold mb-3">How It Works</h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li>1. Sign up with your email using the button above</li>
              <li>2. Book your first service (junk removal, moving, pressure washing, etc.)</li>
              <li>3. Your $25 credit is automatically applied at checkout</li>
              <li>4. Your friend who referred you also gets $25 after you complete the job</li>
            </ol>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
