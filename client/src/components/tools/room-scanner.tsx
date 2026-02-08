import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Video, Box, Layers, Package,
  DollarSign, Truck, Camera, RotateCcw, Save,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InventoryItem {
  item: string;
  category: string;
  value_est: number;
}

interface RoomAnalysis {
  estimated_volume_cu_ft: number;
  truck_load_estimate: string;
  inventory: InventoryItem[];
  summary: string;
}

export function RoomScanner({ onSave }: { onSave?: (analysis: RoomAnalysis) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [analysis, setAnalysis] = useState<RoomAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraReady(true);
    } catch {
      toast({
        title: "Camera Access Required",
        description: "Please allow camera access to scan your room.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, { mimeType: "video/webm" });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.onstop = () => {
      analyzeVideo();
    };
    mediaRecorderRef.current.stop();
    setIsRecording(false);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  };

  const analyzeVideo = async () => {
    setLoading(true);

    const blob = new Blob(chunksRef.current, { type: "video/webm" });
    const formData = new FormData();
    formData.append("video", blob, "room-scan.webm");

    try {
      const res = await fetch("/api/ai/analyze-room", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();
      setAnalysis(data.data);
    } catch {
      toast({
        title: "Analysis Failed",
        description: "Could not process the video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setCameraReady(false);
    chunksRef.current = [];
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "electronics":
        return <Box className="w-4 h-4 text-blue-500" />;
      case "furniture":
        return <Package className="w-4 h-4 text-amber-500" />;
      default:
        return <Package className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (analysis) {
    const totalValue = analysis.inventory.reduce((sum, i) => sum + i.value_est, 0);
    return (
      <Card className="overflow-hidden animate-in slide-in-from-bottom-5" data-testid="card-room-analysis">
        <div className="bg-foreground p-4 flex justify-between items-center gap-4">
          <span className="font-bold text-background flex items-center gap-2">
            <Layers className="w-4 h-4" /> Room Scan Complete
          </span>
          <Badge variant="secondary">
            {analysis.inventory.length} Items Found
          </Badge>
        </div>
        <CardContent className="p-5 space-y-5">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Card className="p-3">
              <p className="text-xs text-muted-foreground uppercase font-semibold">Volume</p>
              <p className="text-xl font-bold mt-1" data-testid="text-volume">
                {analysis.estimated_volume_cu_ft}
                <span className="text-xs font-normal text-muted-foreground ml-1">cu ft</span>
              </p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground uppercase font-semibold">Truck</p>
              <p className="text-xl font-bold mt-1" data-testid="text-truck-load">
                {analysis.truck_load_estimate}
              </p>
            </Card>
            <Card className="p-3">
              <p className="text-xs text-muted-foreground uppercase font-semibold">Value</p>
              <p className="text-xl font-bold mt-1 text-green-600 dark:text-green-400" data-testid="text-total-value">
                ${totalValue}
              </p>
            </Card>
          </div>

          <div>
            <h4 className="font-bold mb-3 flex items-center gap-2">
              <Box className="w-4 h-4 text-muted-foreground" /> Detected Inventory
            </h4>
            <div className="rounded-md border overflow-hidden">
              {analysis.inventory.map((item, i) => (
                <div
                  key={i}
                  className="p-3 border-b last:border-b-0 flex justify-between items-center"
                  data-testid={`row-inventory-item-${i}`}
                >
                  <div className="flex items-center gap-3">
                    {getCategoryIcon(item.category)}
                    <div>
                      <p className="font-medium text-sm">{item.item}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    <DollarSign className="w-3 h-3 mr-0.5" />
                    {item.value_est}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {analysis.summary && (
            <p className="text-sm text-muted-foreground italic">
              {analysis.summary}
            </p>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleReset} className="flex-1" data-testid="button-scan-again">
              <RotateCcw className="w-4 h-4 mr-1" /> Scan Again
            </Button>
            <Button
              onClick={() => onSave?.(analysis)}
              className="flex-1"
              data-testid="button-save-inventory"
            >
              <Save className="w-4 h-4 mr-1" /> Save to Home Score
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-8" data-testid="card-room-analyzing">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-muted-foreground" />
          <h3 className="font-bold text-lg">Analyzing Room...</h3>
          <p className="text-sm text-muted-foreground">
            Our AI is identifying items and estimating volumes. This takes a few seconds.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden" data-testid="card-room-scanner">
      {cameraReady ? (
        <div className="relative aspect-[4/3] bg-black">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
          />
          <div className="absolute inset-0 flex flex-col justify-between p-4 z-10">
            <div className="bg-black/50 backdrop-blur-sm p-3 rounded-md text-white text-center text-sm">
              {isRecording
                ? "Recording... Pan slowly around the room, then stop."
                : "Ready. Press record and slowly pan the room left to right."}
            </div>

            <div className="flex justify-center mb-4">
              {!isRecording ? (
                <Button
                  variant="destructive"
                  size="lg"
                  className="rounded-full w-16 h-16"
                  onClick={startRecording}
                  data-testid="button-start-recording"
                >
                  <Video className="w-7 h-7" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full w-16 h-16"
                  onClick={stopRecording}
                  data-testid="button-stop-recording"
                >
                  <div className="w-6 h-6 bg-destructive rounded-sm" />
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Camera className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Video Room Scanner</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Record a 10-second video of your room. Our AI will identify every item,
              estimate cubic volume, and calculate truck space needed.
            </p>
          </div>
          <div className="flex gap-4 justify-center text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Layers className="w-3 h-3" /> Volume Estimation
            </div>
            <div className="flex items-center gap-1">
              <Box className="w-3 h-3" /> Item Detection
            </div>
            <div className="flex items-center gap-1">
              <Truck className="w-3 h-3" /> Truck Sizing
            </div>
          </div>
          <Button onClick={startCamera} className="w-full" data-testid="button-open-camera">
            <Camera className="w-4 h-4 mr-2" />
            Open Camera
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
