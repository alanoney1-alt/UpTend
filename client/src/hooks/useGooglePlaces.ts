import { useState, useEffect, useRef, useCallback } from "react";

interface PlaceSuggestion {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

interface UseGooglePlacesReturn {
  suggestions: PlaceSuggestion[];
  isLoading: boolean;
  error: string | null;
  clearSuggestions: () => void;
}

let isScriptLoaded = false;
let isScriptLoading = false;
let scriptLoadPromise: Promise<void> | null = null;
let apiKey: string | null = null;

/**
 * Load Google Places API script
 */
async function loadGooglePlacesScript(): Promise<void> {
  // If already loaded, return immediately
  if (isScriptLoaded) return;

  // If currently loading, wait for that promise
  if (isScriptLoading && scriptLoadPromise) {
    return scriptLoadPromise;
  }

  // Fetch API key from server
  if (!apiKey) {
    try {
      const response = await fetch('/api/google/places-key');
      const data = await response.json();
      apiKey = data.apiKey;
    } catch (error) {
      throw new Error('Failed to load Google Places API key');
    }
  }

  // Create new loading promise
  isScriptLoading = true;
  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isScriptLoaded = true;
      isScriptLoading = false;
      resolve();
    };

    script.onerror = () => {
      isScriptLoading = false;
      reject(new Error('Failed to load Google Places API'));
    };

    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

/**
 * Hook for Google Places Autocomplete
 *
 * @param query - Search query string
 * @param options - Autocomplete options (country, types, etc.)
 * @returns Suggestions, loading state, and error
 *
 * @example
 * const { suggestions, isLoading } = useGooglePlaces(address, {
 *   componentRestrictions: { country: 'us' }
 * });
 */
export function useGooglePlaces(
  query: string,
  options?: {
    componentRestrictions?: { country: string | string[] };
    types?: string[];
    fields?: string[];
  }
): UseGooglePlacesReturn {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(isScriptLoaded);

  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load Google Places script on mount
  useEffect(() => {
    if (!scriptLoaded) {
      loadGooglePlacesScript()
        .then(() => setScriptLoaded(true))
        .catch((err) => setError(err.message));
    }
  }, [scriptLoaded]);

  // Initialize autocomplete service when script is loaded
  useEffect(() => {
    if (scriptLoaded && !autocompleteService.current && window.google) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
    }
  }, [scriptLoaded]);

  // Fetch predictions when query changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Clear suggestions if query is too short
    if (query.trim().length < 3) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    // Check if service is ready
    if (!autocompleteService.current) {
      return;
    }

    setIsLoading(true);
    setError(null);

    // Debounce the API call
    debounceRef.current = setTimeout(() => {
      if (!autocompleteService.current) return;

      const request: google.maps.places.AutocompletionRequest = {
        input: query,
        ...options,
      };

      autocompleteService.current.getPlacePredictions(
        request,
        (predictions, status) => {
          setIsLoading(false);

          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(
              predictions.map((p) => ({
                description: p.description,
                place_id: p.place_id,
                structured_formatting: p.structured_formatting,
              }))
            );
          } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            setSuggestions([]);
          } else {
            setError(`Failed to fetch suggestions: ${status}`);
            setSuggestions([]);
          }
        }
      );
    }, 300); // 300ms debounce

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, options]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    clearSuggestions,
  };
}

/**
 * Get place details by place ID
 */
export async function getPlaceDetails(placeId: string): Promise<google.maps.places.PlaceResult | null> {
  await loadGooglePlacesScript();

  return new Promise((resolve, reject) => {
    if (!window.google) {
      reject(new Error('Google Maps not loaded'));
      return;
    }

    // Create a dummy map element (required by PlacesService)
    const mapDiv = document.createElement('div');
    const map = new google.maps.Map(mapDiv);
    const service = new google.maps.places.PlacesService(map);

    service.getDetails(
      {
        placeId,
        fields: ['address_components', 'formatted_address', 'geometry', 'name'],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          resolve(place);
        } else {
          reject(new Error(`Failed to get place details: ${status}`));
        }
      }
    );
  });
}
