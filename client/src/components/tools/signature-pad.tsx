import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PenTool, RotateCcw } from "lucide-react";

interface JobSignOffProps {
  onSign: (dataUrl: string) => void;
  disabled?: boolean;
}

export function JobSignOff({ onSign, disabled }: JobSignOffProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const getCoordinates = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if ("touches" in e) {
        return {
          x: (e.touches[0].clientX - rect.left) * scaleX,
          y: (e.touches[0].clientY - rect.top) * scaleY,
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const isDark = document.documentElement.classList.contains("dark");
    ctx.strokeStyle = isDark ? "#e2e8f0" : "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const save = () => {
    if (!hasSignature) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSign(dataUrl);
  };

  return (
    <Card data-testid="card-signature-pad">
      <CardContent className="p-4 space-y-4">
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2 mb-2">
            <PenTool className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-bold text-lg" data-testid="text-signature-title">Customer Sign-Off</h3>
          </div>
          <p className="text-xs text-muted-foreground" data-testid="text-signature-desc">
            I certify the job is complete and no damage occurred.
          </p>
        </div>

        <div className="border-2 border-dashed rounded-lg bg-muted/30 touch-none">
          <canvas
            ref={canvasRef}
            width={300}
            height={150}
            className="w-full cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            data-testid="canvas-signature"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={clear}
            className="flex-1"
            data-testid="button-signature-clear"
          >
            <RotateCcw className="w-4 h-4 mr-1" /> Clear
          </Button>
          <Button
            onClick={save}
            disabled={!hasSignature || disabled}
            className="flex-1"
            data-testid="button-signature-accept"
          >
            Accept &amp; Close Job
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
