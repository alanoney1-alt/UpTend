import { useState, useRef } from "react";
import { useUpload } from "@/hooks/use-upload";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { processImageForUpload } from "@/lib/image-utils";

interface PhotoUploadProps {
  label: string;
  description?: string;
  onUploadComplete: (url: string) => void;
  accept?: string;
  className?: string;
  testId?: string;
}

export function PhotoUpload({
  label,
  description,
  onUploadComplete,
  accept = "image/*",
  className,
  testId,
}: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile, isUploading, error, progress } = useUpload({
    onSuccess: (response) => {
      const publicUrl = response.objectPath;
      setUploadedUrl(publicUrl);
      onUploadComplete(publicUrl);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    await uploadFile(file);
  };

  const handleRemove = () => {
    setPreview(null);
    setUploadedUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="text-sm font-medium">{label}</div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        data-testid={testId ? `${testId}-input` : undefined}
      />

      {!preview ? (
        <Button
          type="button"
          variant="outline"
          onClick={triggerFileInput}
          disabled={isUploading}
          className="w-full h-32 flex flex-col items-center justify-center gap-2 border-dashed"
          data-testid={testId}
        >
          <Camera className="w-8 h-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Click to upload photo
          </span>
        </Button>
      ) : (
        <div className="relative w-full">
          <div className="relative w-full h-32 rounded-lg overflow-hidden border">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs">{Math.round(progress)}%</span>
              </div>
            )}
            {uploadedUrl && !isUploading && (
              <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Uploaded
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={handleRemove}
            disabled={isUploading}
            data-testid={testId ? `${testId}-remove` : undefined}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive">{error.message}</p>
      )}
    </div>
  );
}

interface MultiPhotoUploadProps {
  label?: string;
  description?: string;
  onPhotosChange: (urls: string[]) => void;
  maxPhotos?: number;
  accept?: string;
  className?: string;
  testId?: string;
  photos?: string[];
}

export function MultiPhotoUpload({
  label,
  description,
  onPhotosChange,
  maxPhotos = 5,
  accept = "image/*",
  className,
  testId,
}: MultiPhotoUploadProps) {
  const [photos, setPhotos] = useState<{ preview: string; url: string | null }[]>([]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadFile, isUploading, error, progress } = useUpload({
    onSuccess: (response) => {
      const publicUrl = response.objectPath;
      setPhotos((prev) => {
        const updated = [...prev];
        if (uploadingIndex !== null && updated[uploadingIndex]) {
          updated[uploadingIndex].url = publicUrl;
        }
        const urls = updated.filter((p) => p.url).map((p) => p.url as string);
        onPhotosChange(urls);
        return updated;
      });
      setUploadingIndex(null);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newIndex = photos.length;
    setUploadingIndex(newIndex);

    // Process image: fix orientation and compress
    const processedFile = await processImageForUpload(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotos((prev) => [...prev, { preview: e.target?.result as string, url: null }]);
    };
    reader.readAsDataURL(processedFile);

    await uploadFile(processedFile);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = (index: number) => {
    setPhotos((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      const urls = updated.filter((p) => p.url).map((p) => p.url as string);
      onPhotosChange(urls);
      return updated;
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="text-sm font-medium">{label}</div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        data-testid={testId ? `${testId}-input` : undefined}
      />

      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, index) => (
          <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
            <img
              src={photo.preview}
              alt={`Photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {uploadingIndex === index && isUploading && (
              <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-1">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-xs">{Math.round(progress)}%</span>
              </div>
            )}
            {photo.url && (
              <div className="absolute bottom-1 left-1 bg-green-500 text-white p-0.5 rounded">
                <CheckCircle className="w-3 h-3" />
              </div>
            )}
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-5 w-5"
              onClick={() => handleRemove(index)}
              disabled={uploadingIndex === index && isUploading}
              data-testid={testId ? `${testId}-remove-${index}` : undefined}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ))}

        {photos.length < maxPhotos && (
          <Button
            type="button"
            variant="outline"
            onClick={triggerFileInput}
            disabled={isUploading}
            className="aspect-square flex flex-col items-center justify-center gap-1 border-dashed"
            data-testid={testId}
          >
            <Upload className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Add</span>
          </Button>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive">{error.message}</p>
      )}
    </div>
  );
}
