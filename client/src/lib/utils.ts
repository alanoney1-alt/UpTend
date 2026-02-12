import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convert snake_case service type to human-readable label.
 * Falls back to title-casing the raw string.
 */
export function formatServiceType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Safely format a date string, returning fallback for null/invalid values.
 */
export function safeFormatDate(
  dateStr: string | null | undefined,
  fallback = "—",
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!dateStr) return fallback;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString("en-US", options ?? { month: "short", day: "numeric", year: "numeric" });
}
