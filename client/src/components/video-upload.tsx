import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, X, Loader2, Play, Square, Upload, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUpload } from "@/hooks/use-upload";

interface VideoUploadProps {
  onFramesExtracted: (frames: string[]) => void;
  onVideoUploaded?: (videoUrl: string) => void;
  maxDurationSeconds?: number;
  className?: string;
  label?: string;
  description?: string;
  onVideoUpload?: (url: string | null) => void;
  maxDuration?: number;
}

export function VideoUpload({
  onFramesExtracted,
  onVideoUploaded,
  maxDurationSeconds = 60,
  className,
}: VideoUploadProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedFrameCount, setExtractedFrameCount] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [videoUploaded, setVideoUploaded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { uploadFile } = useUpload({
    onSuccess: (response) => {
      if (onVideoUploaded) {
        onVideoUploaded(response.objectPath);
      }
      setVideoUploaded(true);
      setUploadProgress(null);
    },
  });

  const extractFrames = useCallback(async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      video.preload = "auto";
      video.muted = true;
      video.playsInline = true;

      const objectUrl = URL.createObjectURL(file);
      video.src = objectUrl;

      video.onloadedmetadata = async () => {
        const duration = video.duration;
        setVideoDuration(duration);

        if (duration > maxDurationSeconds + 5) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error(`Video is too long. Maximum ${maxDurationSeconds} seconds allowed.`));
          return;
        }

        const frameCount = Math.min(Math.max(Math.ceil(duration / 5), 4), 12);
        const interval = duration / (frameCount + 1);
        const frames: string[] = [];

        canvas.width = Math.min(video.videoWidth, 1280);
        canvas.height = Math.min(video.videoHeight, 720);
        const scale = Math.min(1280 / video.videoWidth, 720 / video.videoHeight, 1);
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);

        for (let i = 1; i <= frameCount; i++) {
          const time = interval * i;
          try {
            await seekTo(video, time);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
            frames.push(dataUrl);
            setExtractedFrameCount(frames.length);
          } catch (err) {
            console.warn(`Failed to extract frame at ${time}s:`, err);
          }
        }

        URL.revokeObjectURL(objectUrl);
        resolve(frames);
      };

      video.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Failed to load video"));
      };
    });
  }, [maxDurationSeconds]);

  const seekTo = (video: HTMLVideoElement, time: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const onSeeked = () => {
        video.removeEventListener("seeked", onSeeked);
        resolve();
      };
      video.addEventListener("seeked", onSeeked);
      video.currentTime = time;
      setTimeout(() => {
        video.removeEventListener("seeked", onSeeked);
        resolve();
      }, 3000);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      return;
    }

    processVideoFile(file);
  };

  const processVideoFile = async (file: File) => {
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    setIsExtracting(true);
    setExtractedFrameCount(0);
    setVideoUploaded(false);

    try {
      setUploadProgress("Uploading video...");
      uploadFile(file);

      const frames = await extractFrames(file);
      onFramesExtracted(frames);
    } catch (err) {
      console.error("Frame extraction failed:", err);
    } finally {
      setIsExtracting(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      recordedChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm",
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const file = new File([blob], `video-walkthrough-${Date.now()}.webm`, { type: "video/webm" });
        processVideoFile(file);
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const next = prev + 1;
          if (next >= maxDurationSeconds) {
            stopRecording();
          }
          return next;
        });
      }, 1000);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
  };

  const removeVideo = () => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setExtractedFrameCount(0);
    setVideoDuration(0);
    setVideoUploaded(false);
    setUploadProgress(null);
    onFramesExtracted([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn("space-y-3", className)}>
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-video-file"
      />

      {isRecording ? (
        <div className="relative rounded-lg overflow-hidden border bg-black">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full aspect-video object-cover"
          />
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-sm font-medium bg-black/50 px-2 py-0.5 rounded">
              {formatTime(recordingTime)} / {formatTime(maxDurationSeconds)}
            </span>
          </div>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center">
            <Button
              type="button"
              variant="destructive"
              onClick={stopRecording}
              className="gap-2"
              data-testid="button-stop-recording"
            >
              <Square className="w-4 h-4" />
              Stop Recording
            </Button>
          </div>
        </div>
      ) : videoPreviewUrl ? (
        <div className="relative rounded-lg overflow-hidden border">
          <video
            src={videoPreviewUrl}
            className="w-full aspect-video object-cover"
            controls
            data-testid="video-preview"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={removeVideo}
            data-testid="button-remove-video"
          >
            <X className="w-4 h-4" />
          </Button>

          {isExtracting && (
            <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm font-medium">
                Extracting frames... ({extractedFrameCount})
              </span>
            </div>
          )}

          <div className="absolute bottom-2 left-2 flex items-center gap-2">
            {videoUploaded && (
              <Badge variant="secondary" className="bg-green-600 text-white gap-1">
                <CheckCircle className="w-3 h-3" />
                Saved
              </Badge>
            )}
            {uploadProgress && !videoUploaded && (
              <Badge variant="secondary" className="gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                {uploadProgress}
              </Badge>
            )}
            {extractedFrameCount > 0 && !isExtracting && (
              <Badge variant="secondary" className="gap-1">
                <CheckCircle className="w-3 h-3" />
                {extractedFrameCount} frames captured
              </Badge>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 h-20 flex flex-col items-center justify-center gap-1.5 border-dashed"
            data-testid="button-upload-video"
          >
            <Upload className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Upload Video</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={startRecording}
            className="flex-1 h-20 flex flex-col items-center justify-center gap-1.5 border-dashed"
            data-testid="button-record-video"
          >
            <Video className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Record Walkthrough</span>
          </Button>
        </div>
      )}

      {!videoPreviewUrl && !isRecording && (
        <p className="text-xs text-muted-foreground">
          Record a walkthrough or upload a video (up to {maxDurationSeconds}s) for the most accurate AI estimate.
          The AI will analyze frames from your video to identify items and estimate pricing.
        </p>
      )}
    </div>
  );
}
