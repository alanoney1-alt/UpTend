import { Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function PricingTransparencyModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="inline-flex items-center gap-1 text-sm text-muted-foreground underline underline-offset-2 hover-elevate active-elevate-2 rounded-md"
          data-testid="button-pricing-transparency"
        >
          <Info className="w-3.5 h-3.5" />
          Is this price final?
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>UpTend Price Promise</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your Visual Quote is a guaranteed starting price based on the photos
            and details you provided. In most cases, this is the exact amount
            you will pay.
          </p>

          <div>
            <p className="text-sm font-medium mb-2">
              The only reasons your price might change:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground shrink-0">Access:</span>
                <span>Stairs requiring carry -- $15 per flight</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground shrink-0">Labor:</span>
                <span>Disassembly required for large items (e.g., bed frames, desks)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-foreground shrink-0">Volume:</span>
                <span>Additional items not shown in original photos</span>
              </li>
            </ul>
          </div>

          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-sm font-medium mb-1">You stay in control</p>
            <p className="text-sm text-muted-foreground">
              If any adjustment is needed, your Pro will document the reason
              on-site and you will receive a digital approval request before any
              additional charges apply. No surprises.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
