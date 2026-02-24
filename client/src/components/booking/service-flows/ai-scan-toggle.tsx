import { Button } from "@/components/ui/button";
import { Camera, ClipboardList } from "lucide-react";

interface AiScanToggleProps {
  serviceId: string;
  quoteMode: "ai" | "manual";
  onModeChange: (mode: "ai" | "manual") => void;
}

export function AiScanToggle({ serviceId, quoteMode, onModeChange }: AiScanToggleProps) {
  return (
    <div className="flex gap-2 mb-6">
      <Button
        variant={quoteMode === "ai" ? "default" : "outline"}
        className="flex-1 gap-2"
        onClick={() => onModeChange("ai")}
      >
        <Camera className="w-4 h-4" />
         AI Photo Quote
      </Button>
      <Button
        variant={quoteMode === "manual" ? "default" : "outline"}
        className="flex-1 gap-2"
        onClick={() => onModeChange("manual")}
      >
        <ClipboardList className="w-4 h-4" />
         Build Quote Manually
      </Button>
    </div>
  );
}
