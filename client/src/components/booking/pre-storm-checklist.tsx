import { ShieldCheck, AlertCircle, Circle, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface PreStormChecklistProps {
  address: string;
  onClose: () => void;
  onGreenLight: () => void;
}

const checklistItems = [
  { service: "Home DNA Scan", task: "360° Home DNA Scan & Asset Log", status: "Missing" as const, priority: "High" as const },
  { service: "Gutter Care", task: "Clear debris & downspout flow test", status: "Unverified" as const, priority: "High" as const },
  { service: "Material Recovery", task: "Remove potential wind-borne hazards", status: "Unverified" as const, priority: "Medium" as const },
  { service: "Pressure Wash", task: "Seal check & surface heat reflection", status: "Unverified" as const, priority: "Low" as const },
  { service: "Moving Labor", task: "Furniture anchors & sandbag staging", status: "Planned" as const, priority: "Emergency Only" as const },
];

export function PreStormChecklist({ address, onClose, onGreenLight }: PreStormChecklistProps) {
  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg p-0 overflow-hidden" data-testid="dialog-storm-checklist">
        <DialogHeader className="bg-slate-900 dark:bg-slate-800 p-6 text-white text-center relative">
          <div className="flex justify-center mb-3">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <DialogTitle className="text-xl font-black uppercase tracking-tight text-white" data-testid="text-checklist-title">
            Property Green-Light Status
          </DialogTitle>
          <DialogDescription className="text-slate-300 text-xs mt-1">
            Address: {address}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Mandatory Intelligence Tasks
            </span>
            <Badge variant="destructive" data-testid="badge-action-required">Action Required</Badge>
          </div>

          {checklistItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 p-3 rounded-md hover-elevate"
              data-testid={`checklist-item-${idx}`}
            >
              <div className="flex items-center gap-3">
                {item.status === "Missing" ? (
                  <AlertCircle className="text-destructive w-5 h-5 shrink-0" />
                ) : (
                  <Circle className="text-muted-foreground/30 w-5 h-5 shrink-0" />
                )}
                <div>
                  <p className="text-sm font-bold" data-testid={`text-checklist-service-${idx}`}>{item.service}</p>
                  <p className="text-[10px] text-muted-foreground">{item.task}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold shrink-0 ${
                item.priority === "High" ? "text-destructive" : "text-muted-foreground/50"
              }`}>
                {item.priority}
              </span>
            </div>
          ))}
        </div>

        <div className="p-6 bg-muted/50 border-t border-border">
          <div className="mb-4 flex items-center gap-3 p-3 bg-primary/5 dark:bg-primary/10 rounded-md border border-primary/20 dark:border-primary/20">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <p className="text-[10px] font-bold text-orange-800 dark:text-orange-300 leading-tight" data-testid="text-pro-availability">
              Verified Pros are currently nearby. Instant-dispatch available.
            </p>
          </div>

          <Button
            className="w-full font-bold bg-slate-900 dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white"
            size="lg"
            onClick={onGreenLight}
            data-testid="button-green-light"
          >
            Green-Light My Property <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <p className="text-center text-[10px] text-muted-foreground mt-4 uppercase font-bold tracking-widest" data-testid="text-shield-value">
            Secures your $8,400+ Insurance Shield
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
