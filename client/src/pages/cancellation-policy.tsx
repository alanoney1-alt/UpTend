import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, ArrowLeft, XCircle, Phone, Mail, Clock, AlertTriangle } from "lucide-react";

export default function CancellationPolicy() {
  return (
    <div className="min-h-screen bg-background" data-testid="page-cancellation-policy">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
              <Truck className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold">UpTend</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <XCircle className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold mb-4">Cancellation Policy</h1>
          <p className="text-muted-foreground">
            Last updated: January 2026
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4 text-center border-green-500/30 bg-green-500/5">
            <Clock className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <p className="font-semibold text-green-700 dark:text-green-400">2+ Hours Before</p>
            <p className="text-2xl font-bold text-green-600">FREE</p>
            <p className="text-xs text-muted-foreground mt-1">Full refund, no fees</p>
          </Card>
          <Card className="p-4 text-center border-amber-500/30 bg-amber-500/5">
            <Clock className="w-8 h-8 mx-auto mb-2 text-amber-600" />
            <p className="font-semibold text-amber-700 dark:text-amber-400">30 Min - 2 Hours</p>
            <p className="text-2xl font-bold text-amber-600">$15 Fee</p>
            <p className="text-xs text-muted-foreground mt-1">Covers Pro travel</p>
          </Card>
          <Card className="p-4 text-center border-red-500/30 bg-red-500/5">
            <Clock className="w-8 h-8 mx-auto mb-2 text-red-600" />
            <p className="font-semibold text-red-700 dark:text-red-400">Under 30 Min</p>
            <p className="text-2xl font-bold text-red-600">$25 Fee</p>
            <p className="text-xs text-muted-foreground mt-1">Pro may be en route</p>
          </Card>
        </div>

        <Card className="p-8 prose prose-gray dark:prose-invert max-w-none">
          <h2>Customer Cancellations</h2>
          
          <h3>Free Cancellation Window</h3>
          <p>
            You may cancel your booking <strong>free of charge</strong> if you cancel at least 
            <strong> 2 hours before</strong> your scheduled pickup time. You'll receive a full refund 
            to your original payment method.
          </p>

          <h3>Late Cancellation Fees</h3>
          <p>
            We charge cancellation fees for late cancellations because Pros are independent contractors 
            who reserve their time for your job. Late cancellations mean lost income for them.
          </p>
          <ul>
            <li><strong>30 minutes to 2 hours before pickup:</strong> $15 cancellation fee</li>
            <li><strong>Less than 30 minutes before pickup:</strong> $25 cancellation fee</li>
            <li><strong>After Pro arrives:</strong> Up to 50% of the quoted price</li>
          </ul>

          <h3>How to Cancel</h3>
          <p>You can cancel your booking through:</p>
          <ul>
            <li><strong>The UpTend app:</strong> Go to your booking and tap "Cancel Booking"</li>
            <li><strong>Phone:</strong> Call (407) 338-3342</li>
            <li><strong>Text:</strong> Reply "CANCEL" to your booking confirmation text</li>
          </ul>

          <h2>Pro Cancellations</h2>
          <p>
            We take Pro reliability seriously. If your Pro cancels:
          </p>
          <ul>
            <li>You'll be automatically matched with another available Pro when possible</li>
            <li>If no replacement is available, you receive a <strong>full refund</strong> plus a <strong>$10 credit</strong></li>
            <li>Pros with repeated cancellations face penalties and potential deactivation</li>
          </ul>

          <h2>No-Show Policy</h2>
          
          <h3>Customer No-Shows</h3>
          <p>
            If you're not present at the scheduled time and haven't responded to the Pro's contact 
            attempts within 15 minutes:
          </p>
          <ul>
            <li>The job will be marked as a customer no-show</li>
            <li>A <strong>$25 no-show fee</strong> will be charged</li>
            <li>You'll need to rebook for a new time</li>
          </ul>

          <h3>Pro No-Shows</h3>
          <p>
            If a Pro doesn't arrive and doesn't communicate:
          </p>
          <ul>
            <li>You receive a <strong>full refund</strong></li>
            <li>You receive a <strong>$25 credit</strong> toward your next booking</li>
            <li>The Pro is penalized and may face account suspension</li>
          </ul>

          <h2>Rescheduling</h2>
          <p>
            Need to change your time instead of canceling? <strong>Rescheduling is always free</strong> if done 
            at least 2 hours before your original pickup time. You can reschedule through the app or by 
            contacting us.
          </p>

          <h2>Special Circumstances</h2>
          <p>
            We understand emergencies happen. In cases of:
          </p>
          <ul>
            <li>Medical emergencies</li>
            <li>Severe weather (hurricane, flood warnings)</li>
            <li>Other genuine emergencies</li>
          </ul>
          <p>
            Please contact us and we'll waive cancellation fees on a case-by-case basis. We just ask 
            that you let us know as soon as possible.
          </p>

          <h2>Contact Us</h2>
          <p>
            Questions about cancellations? We're here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 not-prose mt-4">
            <Button variant="outline" asChild data-testid="button-email-support">
              <a href="mailto:support@uptend.app">
                <Mail className="w-4 h-4 mr-2" />
                support@uptend.app
              </a>
            </Button>
            <Button asChild data-testid="button-call-support">
              <a href="tel:407-338-3342">
                <Phone className="w-4 h-4 mr-2" />
                (407) 338-3342
              </a>
            </Button>
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg text-xs text-muted-foreground not-prose">
            <strong>Marketplace Notice:</strong> UpTend is a technology platform connecting customers with independent 
            service providers (Pros). Cancellation fees help compensate Pros for their reserved time. 
            Pros are independent contractors, not UpTend employees.
          </div>
        </Card>
      </main>

      <footer className="border-t py-8 mt-16">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} UpTend. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/refund-policy" className="hover:text-foreground">Refunds</Link>
            <Link href="/service-guarantee" className="hover:text-foreground">Guarantee</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
