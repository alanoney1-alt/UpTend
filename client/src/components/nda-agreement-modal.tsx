import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FileText, Shield, AlertTriangle } from "lucide-react";

const NDA_VERSION = "1.0";

interface NdaAgreementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proName: string;
  onSuccess?: () => void;
}

export function NdaAgreementModal({ open, onOpenChange, proName, onSuccess }: NdaAgreementModalProps) {
  const [signature, setSignature] = useState("");
  const [hasReadAgreement, setHasReadAgreement] = useState(false);
  const [agreesToTerms, setAgreesToTerms] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const acceptNdaMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/pros/accept-nda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          signature,
          version: NDA_VERSION,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to accept NDA");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Agreement Accepted",
        description: "You have successfully signed the Non-Solicitation Agreement.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/pro/profile"] });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept agreement",
        variant: "destructive",
      });
    },
  });

  const canSubmit = signature.trim().length > 0 && hasReadAgreement && agreesToTerms;
  const signatureMatches = signature.trim().toLowerCase() === proName.trim().toLowerCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Non-Solicitation & Confidentiality Agreement
          </DialogTitle>
          <DialogDescription>
            Please read and sign the following agreement to accept jobs through UpTend.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[400px] border rounded-md p-4 bg-muted/30">
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <FileText className="h-4 w-4" />
              UpTend Pro Non-Solicitation Agreement (v{NDA_VERSION})
            </div>

            <p className="font-medium">
              This Non-Solicitation and Confidentiality Agreement ("Agreement") is entered into between UpTend, LLC ("Company") and the undersigned independent contractor ("Pro").
            </p>

            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">1. Non-Solicitation of Customers</h4>
              <p className="text-muted-foreground">
                Pro agrees that during the term of their relationship with UpTend and for a period of <strong>two (2) years</strong> following the last job completed through the UpTend platform, Pro shall not, directly or indirectly:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Solicit, contact, or attempt to do business with any customer initially connected through the UpTend platform for hauling, moving, junk removal, or similar services outside of the UpTend platform.</li>
                <li>Provide business cards, personal contact information, or alternative booking methods to customers met through UpTend.</li>
                <li>Encourage or assist customers in bypassing the UpTend platform for future services.</li>
                <li>Accept direct payment from customers met through UpTend outside of the platform.</li>
              </ul>

              <h4 className="font-semibold text-foreground">2. Confidential Information</h4>
              <p className="text-muted-foreground">
                Pro acknowledges that customer information, including names, addresses, phone numbers, and service preferences, constitutes confidential and proprietary information belonging to UpTend. Pro agrees to:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Use customer information solely for completing jobs assigned through the UpTend platform.</li>
                <li>Not copy, retain, or store customer contact information beyond what is necessary to complete an assigned job.</li>
                <li>Delete or destroy any customer information in their possession upon completion of each job.</li>
              </ul>

              <h4 className="font-semibold text-foreground">3. Liquidated Damages</h4>
              <p className="text-muted-foreground">
                Pro acknowledges that a breach of this Agreement would cause substantial harm to UpTend that would be difficult to quantify. Therefore, Pro agrees to pay liquidated damages of <strong>$5,000 per violation</strong> plus:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>100% of any revenue earned from the solicited customer for the 2-year restricted period.</li>
                <li>All reasonable attorney's fees and costs incurred in enforcing this Agreement.</li>
              </ul>

              <h4 className="font-semibold text-foreground">4. Platform Fee Protection</h4>
              <p className="text-muted-foreground">
                Pro understands that UpTend invests significant resources in customer acquisition, marketing, and platform development. The platform fee collected by UpTend compensates for these investments. Circumventing the platform deprives UpTend of this rightful compensation.
              </p>

              <h4 className="font-semibold text-foreground">5. Injunctive Relief</h4>
              <p className="text-muted-foreground">
                Pro agrees that monetary damages alone would be insufficient to remedy a breach of this Agreement and consents to UpTend seeking injunctive relief, including temporary restraining orders and preliminary injunctions, without the requirement of posting a bond.
              </p>

              <h4 className="font-semibold text-foreground">6. Term and Survival</h4>
              <p className="text-muted-foreground">
                This Agreement shall remain in effect for the duration of Pro's active status on the UpTend platform and shall survive termination for a period of two (2) years following the last completed job.
              </p>

              <h4 className="font-semibold text-foreground">7. Acknowledgment</h4>
              <p className="text-muted-foreground">
                By signing below, Pro acknowledges that they have read, understand, and voluntarily agree to all terms of this Agreement. Pro further acknowledges that they have had the opportunity to seek independent legal counsel before signing.
              </p>
            </div>

            <div className="mt-4 p-3 bg-destructive/10 rounded-md border border-destructive/20">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                <p className="text-destructive text-xs">
                  <strong>Warning:</strong> Violation of this agreement may result in immediate account termination, legal action, and financial penalties up to $5,000 per incident plus disgorgement of all fees earned from solicited customers.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="space-y-4 pt-4">
          <div className="flex items-start gap-2">
            <Checkbox
              id="read-agreement"
              checked={hasReadAgreement}
              onCheckedChange={(checked) => setHasReadAgreement(checked === true)}
              data-testid="checkbox-read-agreement"
            />
            <Label htmlFor="read-agreement" className="text-sm leading-tight cursor-pointer">
              I have read and understand the entire Non-Solicitation Agreement above.
            </Label>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="agree-terms"
              checked={agreesToTerms}
              onCheckedChange={(checked) => setAgreesToTerms(checked === true)}
              data-testid="checkbox-agree-terms"
            />
            <Label htmlFor="agree-terms" className="text-sm leading-tight cursor-pointer">
              I voluntarily agree to be bound by all terms of this Agreement and understand the consequences of violation.
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signature">Digital Signature (Type your full name exactly as shown: "{proName}")</Label>
            <Input
              id="signature"
              placeholder="Type your full legal name"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              data-testid="input-nda-signature"
            />
            {signature.length > 0 && !signatureMatches && (
              <p className="text-xs text-destructive">Signature must match your registered name exactly.</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-nda">
            Cancel
          </Button>
          <Button
            onClick={() => acceptNdaMutation.mutate()}
            disabled={!canSubmit || !signatureMatches || acceptNdaMutation.isPending}
            data-testid="button-accept-nda"
          >
            {acceptNdaMutation.isPending ? "Processing..." : "Sign Agreement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
