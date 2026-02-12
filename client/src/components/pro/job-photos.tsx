import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Upload, Image, CheckCircle2, X } from "lucide-react";

interface JobPhotosProps {
  jobId: string;
  type: "before" | "after";
  onUploaded?: (urls: string[]) => void;
}

export function JobPhotos({ jobId, type, onUploaded }: JobPhotosProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploaded, setUploaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const upload = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/jobs/${jobId}/photos`, {
        type,
        photos: previews,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setUploaded(true);
      onUploaded?.(data.urls);
    },
  });

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePreview = (idx: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  if (uploaded) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-4 pb-4 flex items-center gap-2 text-green-700">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">{type === "before" ? "Before" : "After"} photos uploaded</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Camera className="w-5 h-5 text-[#F47C20]" />
          {type === "before" ? "Before" : "After"} Photos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Previews */}
        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {previews.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img src={src} alt={`${type} photo ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removePreview(i)}
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload buttons */}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1"
          >
            <Camera className="w-4 h-4 mr-1" />
            Camera
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1"
          >
            <Image className="w-4 h-4 mr-1" />
            Gallery
          </Button>
        </div>

        {/* Upload */}
        {previews.length > 0 && (
          <Button
            onClick={() => upload.mutate()}
            disabled={upload.isPending}
            className="w-full bg-[#F47C20] hover:bg-[#E06A10]"
          >
            <Upload className="w-4 h-4 mr-2" />
            {upload.isPending ? "Uploading..." : `Upload ${previews.length} Photo${previews.length > 1 ? "s" : ""}`}
          </Button>
        )}

        {upload.isError && (
          <p className="text-sm text-red-500">Upload failed. Try again.</p>
        )}
      </CardContent>
    </Card>
  );
}
