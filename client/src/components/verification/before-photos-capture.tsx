import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Camera, Loader2, MapPin, X, Upload } from "lucide-react";
import { MultiPhotoUpload } from "@/components/photo-upload";

interface BeforePhotosCaptureProps {
  jobId: string;
  serviceType: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function BeforePhotosCapture({ jobId, onComplete, onCancel }: BeforePhotosCaptureProps) {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<string[]>([]);
  const [gpsCoordinates, setGpsCoordinates] = useState<string>("");
  const [gpsLoading, setGpsLoading] = useState(false);

  // Get GPS coordinates
  const getGpsCoordinates = async () => {
    setGpsLoading(true);
    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation not supported");
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const coords = `${position.coords.latitude.toFixed(6)},${position.coords.longitude.toFixed(6)}`;
      setGpsCoordinates(coords);
      toast({
        title: "Location captured",
        description: "GPS coordinates recorded",
      });
    } catch (error) {
      toast({
        title: "Location error",
        description: "Unable to get GPS coordinates. Please enable location services.",
        variant: "destructive",
      });
    } finally {
      setGpsLoading(false);
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (photos.length < 2) {
        throw new Error("At least 2 photos required");
      }
      if (!gpsCoordinates) {
        throw new Error("GPS coordinates required");
      }

      return apiRequest("POST", `/api/jobs/${jobId}/verification/before-photos`, {
        photos,
        gpsCoordinates,
      });
    },
    onSuccess: () => {
      toast({
        title: "Before photos uploaded",
        description: "You can now proceed to track items",
      });
      onComplete();
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>Before Photos</CardTitle>
              <p className="text-sm text-muted-foreground">
                Document the job site before starting work
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">
            📸 Photo Guidelines:
          </p>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-disc">
            <li>Take at least 2 photos showing all items to be removed</li>
            <li>Include wide shots of the entire area</li>
            <li>Show the condition of items and surroundings</li>
            <li>Ensure good lighting and clarity</li>
          </ul>
        </div>

        {/* GPS Capture */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">GPS Location</span>
            </div>
            {gpsCoordinates ? (
              <span className="text-xs text-green-600 font-mono">{gpsCoordinates}</span>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={getGpsCoordinates}
                disabled={gpsLoading}
              >
                {gpsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Capture Location"
                )}
              </Button>
            )}
          </div>
          {!gpsCoordinates && (
            <p className="text-xs text-muted-foreground">
              GPS coordinates are required to verify job location
            </p>
          )}
        </div>

        {/* Photo Upload */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Photos</label>
          <MultiPhotoUpload
            maxPhotos={5}
            onPhotosChange={setPhotos}
            photos={photos}
          />
          {photos.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {photos.length} photo{photos.length > 1 ? "s" : ""} selected
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <Button
            className="flex-1"
            onClick={() => uploadMutation.mutate()}
            disabled={photos.length < 2 || !gpsCoordinates || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Before Photos
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
