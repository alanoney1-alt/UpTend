import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";
import { useGooglePlaces, getPlaceDetails } from "@/hooks/useGooglePlaces";
import { cn } from "@/lib/utils";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectAddress?: (address: string, placeDetails?: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  icon?: boolean;
}

/**
 * Google Places Address Autocomplete Component
 *
 * @example
 * <AddressAutocomplete
 *   value={address}
 *   onChange={setAddress}
 *   onSelectAddress={(address, details) => {
 *     console.log('Selected:', address, details);
 *   }}
 *   placeholder="Enter your address"
 * />
 */
export function AddressAutocomplete({
  value,
  onChange,
  onSelectAddress,
  placeholder = "Enter your address",
  className,
  inputClassName,
  disabled = false,
  icon = true,
}: AddressAutocompleteProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { suggestions, isLoading, clearSuggestions } = useGooglePlaces(value, {
    componentRestrictions: { country: 'us' },
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false);
        clearSuggestions();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [clearSuggestions]);

  const handleSelect = async (description: string, placeId: string) => {
    onChange(description);
    setIsFocused(false);
    clearSuggestions();

    if (onSelectAddress) {
      try {
        const placeDetails = await getPlaceDetails(placeId);
        onSelectAddress(description, placeDetails || undefined);
      } catch (error) {
        console.error('Failed to get place details:', error);
        onSelectAddress(description);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isFocused || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          const selected = suggestions[selectedIndex];
          handleSelect(selected.description, selected.place_id);
        }
        break;
      case 'Escape':
        setIsFocused(false);
        clearSuggestions();
        break;
    }
  };

  const showDropdown = isFocused && (suggestions.length > 0 || isLoading);

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <div className="relative">
        {icon && (
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        )}
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(icon && "pl-10", inputClassName)}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-md shadow-xl max-h-60 overflow-auto">
          {isLoading && suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              Searching addresses...
            </div>
          ) : (
            suggestions.map((suggestion, index) => (
              <button
                key={suggestion.place_id}
                type="button"
                onClick={() => handleSelect(suggestion.description, suggestion.place_id)}
                className={cn(
                  "w-full px-4 py-3 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors",
                  "focus:bg-zinc-100 dark:focus:bg-zinc-700 focus:outline-none",
                  index === selectedIndex && "bg-zinc-100 dark:bg-zinc-700"
                )}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {suggestion.structured_formatting ? (
                      <>
                        <div className="font-medium text-foreground truncate">
                          {suggestion.structured_formatting.main_text}
                        </div>
                        <div className="text-muted-foreground text-xs truncate">
                          {suggestion.structured_formatting.secondary_text}
                        </div>
                      </>
                    ) : (
                      <div className="text-foreground">{suggestion.description}</div>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
