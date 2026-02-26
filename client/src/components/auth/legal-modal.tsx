import { useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

interface LegalModalProps {
  isOpen: boolean;
  onAccept: () => void;
}

export function LegalModal({ isOpen, onAccept }: LegalModalProps) {
  const [canAccept, setCanAccept] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 20;
    if (atBottom) setCanAccept(true);
  }, []);

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md [&>button]:hidden" data-testid="dialog-legal">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-muted-foreground" />
            <DialogTitle data-testid="text-legal-title">Contractor Agreement</DialogTitle>
          </div>
        </DialogHeader>

        <div
          className="h-[300px] w-full rounded-lg border p-4 bg-muted/30 overflow-y-auto"
          onScroll={handleScroll}
          data-testid="scroll-legal-content"
        >
          <div
            ref={scrollRef}
            className="text-sm text-muted-foreground space-y-4 pr-2"
          >
            <p>
              <strong>1. Independent Contractor Status.</strong> You acknowledge
              and agree that you are an independent contractor and not an
              employee, agent, or representative of UpTend Inc. You retain full
              control over the manner and means by which you perform services.
            </p>
            <p>
              <strong>2. Safety &amp; Liability.</strong> You are responsible for
              ensuring the safety of yourself, the customer, and the
              customer&apos;s property while performing services. You agree to
              follow all safety protocols outlined in the Pro Academy and to
              use the UpTend app to document the condition of items before and
              after service.
            </p>
            <p>
              <strong>3. Background Check.</strong> You consent to a
              background screening conducted by our third-party partner. This
              check may include criminal history, driving record, and identity
              verification. Failure to pass may result in account deactivation.
            </p>
            <p>
              <strong>4. Payment Terms.</strong> You will be paid via Stripe
              Connect. UpTend retains a flat 15% platform fee. You keep 85%. Payouts
              are processed weekly on Fridays for the prior week&apos;s work.
            </p>
            <p>
              <strong>5. Insurance.</strong> UpTend provides blanket general
              liability coverage of up to $1,000,000 per occurrence for jobs
              performed through the platform. This coverage is secondary to any
              personal insurance you may carry.
            </p>
            <p>
              <strong>6. Non-Solicitation.</strong> You agree not to solicit
              customers encountered through the UpTend platform for off-platform
              services for a period of 12 months following your last completed
              job. Violation of this clause may result in account termination and
              legal action.
            </p>
            <p>
              <strong>7. Dispute Resolution.</strong> Any disputes arising under
              this agreement shall be resolved through binding arbitration in
              accordance with the rules of the American Arbitration Association.
            </p>
            <p>
              <strong>8. Termination.</strong> Either party may terminate this
              agreement at any time with or without cause. Upon termination, any
              outstanding payouts will be processed within 30 business days.
            </p>
            <p className="italic text-xs">-- End of Agreement --</p>
          </div>
        </div>

        <Button
          onClick={onAccept}
          disabled={!canAccept}
          className="w-full mt-2"
          data-testid="button-legal-accept"
        >
          {canAccept ? "I Agree & Accept" : "Read to the bottom to accept"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
