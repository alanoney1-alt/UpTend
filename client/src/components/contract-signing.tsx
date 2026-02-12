import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, FileText, PenTool, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ContractSigningProps {
  contract: {
    id: string;
    serviceRequestId: string;
    scopeOfWork: string;
    agreedPrice: number;
    customerSignature?: string | null;
    customerSignedAt?: string | null;
    proSignature?: string | null;
    proSignedAt?: string | null;
    status: string;
  };
  userRole: "customer" | "pro";
  onSigned?: () => void;
}

export function ContractSigning({ contract, userRole, onSigned }: ContractSigningProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const alreadySigned = userRole === "customer"
    ? !!contract.customerSignature
    : !!contract.proSignature;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || alreadySigned) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
  }, [alreadySigned]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSigned(true);
  };

  const endDraw = () => setIsDrawing(false);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const submitSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSigned) return;
    setSubmitting(true);
    try {
      const signature = canvas.toDataURL("image/png");
      const res = await fetch(`/api/contracts/${contract.id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ signature }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to sign");
      }
      toast({ title: "Contract signed!", description: "Your signature has been recorded." });
      onSigned?.();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700",
    pending_customer: "bg-yellow-100 text-yellow-700",
    pending_pro: "bg-blue-100 text-blue-700",
    signed: "bg-emerald-100 text-emerald-700",
    voided: "bg-red-100 text-red-700",
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-primary" />
            Pre-Work Authorization
          </CardTitle>
          <Badge className={statusColor[contract.status] || "bg-slate-100"}>
            {contract.status.replace("_", " ").toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-1">Scope of Work</h4>
          <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{contract.scopeOfWork}</p>
        </div>

        <div className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
          <span className="text-sm font-medium text-slate-700">Agreed Price</span>
          <span className="text-lg font-bold text-primary">${contract.agreedPrice.toFixed(2)}</span>
        </div>

        {/* Signature status */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`p-3 rounded-lg border ${contract.customerSignature ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
            <div className="flex items-center gap-2 text-sm font-medium mb-1">
              {contract.customerSignature ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-slate-400" />}
              Customer
            </div>
            <p className="text-xs text-slate-500">
              {contract.customerSignedAt ? `Signed ${new Date(contract.customerSignedAt).toLocaleDateString()}` : "Awaiting signature"}
            </p>
          </div>
          <div className={`p-3 rounded-lg border ${contract.proSignature ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
            <div className="flex items-center gap-2 text-sm font-medium mb-1">
              {contract.proSignature ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-slate-400" />}
              Pro
            </div>
            <p className="text-xs text-slate-500">
              {contract.proSignedAt ? `Signed ${new Date(contract.proSignedAt).toLocaleDateString()}` : "Awaiting signature"}
            </p>
          </div>
        </div>

        {/* Signing pad */}
        {!alreadySigned && contract.status !== "signed" && contract.status !== "voided" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <PenTool className="w-4 h-4" />
              Sign below ({userRole === "customer" ? "Customer" : "Pro"})
            </div>
            <canvas
              ref={canvasRef}
              width={400}
              height={150}
              className="w-full border-2 border-dashed border-slate-300 rounded-lg bg-white cursor-crosshair touch-none"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearSignature}>Clear</Button>
              <Button size="sm" onClick={submitSignature} disabled={!hasSigned || submitting}>
                {submitting ? "Submitting..." : "Sign Contract"}
              </Button>
            </div>
          </div>
        )}

        {alreadySigned && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg text-emerald-700 text-sm">
            <CheckCircle className="w-4 h-4" />
            You have signed this contract.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
