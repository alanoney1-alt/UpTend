import { useState, useEffect, useRef, useCallback } from "react";

export interface GeoLocationState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number | null;
  error: string | null;
  isTracking: boolean;
  isSupported: boolean;
}

export interface GeoLocationOptions {
  enableHighAccuracy?: boolean;
  maximumAge?: number;
  timeout?: number;
}

const defaultOptions: GeoLocationOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 10000,
};

export function useGeoLocation(
  enabled: boolean = false,
  options: GeoLocationOptions = {}
) {
  const opts = { ...defaultOptions, ...options };
  const watchIdRef = useRef<number | null>(null);
  
  const [state, setState] = useState<GeoLocationState>({
    lat: null,
    lng: null,
    accuracy: null,
    heading: null,
    speed: null,
    timestamp: null,
    error: null,
    isTracking: false,
    isSupported: typeof navigator !== "undefined" && "geolocation" in navigator,
  });

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setState((prev) => ({
      ...prev,
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: position.timestamp,
      error: null,
      isTracking: true,
    }));
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage: string;
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = "Location permission denied. Please enable location access in your browser settings.";
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = "Location unavailable. Please check your device's GPS is enabled.";
        break;
      case error.TIMEOUT:
        errorMessage = "Location request timed out. Please try again.";
        break;
      default:
        errorMessage = "An unknown error occurred while getting your location.";
    }
    setState((prev) => ({
      ...prev,
      error: errorMessage,
      isTracking: false,
    }));
  }, []);

  const startTracking = useCallback(() => {
    if (!state.isSupported) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation is not supported by your browser.",
        isTracking: false,
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: opts.enableHighAccuracy,
      maximumAge: opts.maximumAge,
      timeout: opts.timeout,
    });

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: opts.enableHighAccuracy,
        maximumAge: opts.maximumAge,
        timeout: opts.timeout,
      }
    );
  }, [state.isSupported, handleSuccess, handleError, opts]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isTracking: false,
    }));
  }, []);

  const requestPermission = useCallback(async () => {
    if (!state.isSupported) return false;
    
    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      if (result.state === "granted") {
        return true;
      } else if (result.state === "prompt") {
        return new Promise<boolean>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => resolve(true),
            () => resolve(false),
            { enableHighAccuracy: true, timeout: 10000 }
          );
        });
      }
      return false;
    } catch {
      return new Promise<boolean>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });
    }
  }, [state.isSupported]);

  useEffect(() => {
    if (enabled && state.isSupported) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [enabled, state.isSupported]);

  return {
    ...state,
    startTracking,
    stopTracking,
    requestPermission,
  };
}

