import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Video, ShieldCheck, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ManifestItem {
  name: string;
  condition: string;
  resale_potential: boolean;
}

interface ManifestScannerProps {
  jobId: number | string;
  onComplete?: (inventory: ManifestItem[]) => void;
}

export function ManifestScanner({ jobId, onComplete }: ManifestScannerProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [scannedItems, setScannedItems] = useState<ManifestItem[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startScan = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: true,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      toast({
        variant: "destructive",
        title: "Camera Error",
        description: "Allow camera and microphone access to verify items.",
      });
    }
  };

  const stopScan = async () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    setIsRecording(false);

    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream)
        .getTracks()
        .forEach((track) => track.stop());
    }

    setUploading(true);
    const blob = new Blob(chunksRef.current, { type: "video/webm" });
    const formData = new FormData();
    formData.append("video", blob);
    formData.append("jobId", String(jobId));

    try {
      const res = await fetch("/api/hauler/scan-manifest", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();

      if (data.success) {
        setScannedItems(data.inventory);
        toast({
          title: "Manifest Updated",
          description: `Logged ${data.itemCount} items. Liability protection active.`,
        });
        onComplete?.(data.inventory);
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "Check your connection and try again.",
      });
    } finally {
      setUploading(false);
      chunksRef.current = [];
    }
  };

  return (
    <Card data-testid="card-manifest-scanner">
      <div className="bg-blue-600 dark:bg-blue-700 p-3 flex justify-between items-center gap-4 rounded-t-lg">
        <span className="font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" /> Liability &amp; Inventory Scan
        </span>
        <Badge variant="secondary" data-testid="badge-manifest-req">REQ-01</Badge>
      </div>

      <div className="aspect-video bg-black relative">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
          data-testid="video-manifest-feed"
        />

        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          {!isRecording && !uploading && (
            <Button
              variant="destructive"
              size="lg"
              className="rounded-full w-16 h-16"
              onClick={startScan}
              data-testid="button-manifest-record"
            >
              <Video className="w-6 h-6" />
            </Button>
          )}

          {isRecording && (
            <Button
              variant="outline"
              size="lg"
              className="rounded-full w-16 h-16 animate-pulse"
              onClick={stopScan}
              data-testid="button-manifest-stop"
            >
              <div className="w-6 h-6 bg-destructive rounded-sm" />
            </Button>
          )}
        </div>

        {!isRecording && !uploading && scannedItems.length === 0 && (
          <div className="absolute top-4 left-4 right-4 bg-black/60 p-3 rounded-lg text-sm text-center text-white">
            Walk around the items. Call out any pre-existing damage.
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <p className="font-bold text-white" data-testid="text-manifest-securing">Securing Evidence...</p>
            <p className="text-xs text-slate-400">Analyzing content for resale potential</p>
          </div>
        )}
      </div>

      {scannedItems.length > 0 && (
        <CardContent className="p-4 space-y-3">
          <h4 className="font-bold text-sm" data-testid="text-manifest-items-title">Scanned Items</h4>
          <div className="space-y-2">
            {scannedItems.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-lg border"
                data-testid={`row-manifest-item-${i}`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={item.resale_potential ? "default" : "secondary"}>
                    {item.condition}
                  </Badge>
                  {item.resale_potential && (
                    <Badge variant="outline" data-testid={`badge-resale-${i}`}>Resale</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}

      <CardContent className="p-4 border-t">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 dark:text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground" data-testid="text-manifest-tip">
            <strong>Pro Tip:</strong> Narrate the video. &ldquo;Loading Sofa, left leg is already scratched.&rdquo; This audio protects your rating.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
