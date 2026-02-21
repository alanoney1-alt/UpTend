/**
 * Google Maps Service
 * Central place for all Google Maps API interactions.
 * Uses native fetch, in-memory caching (1hr TTL), graceful error handling.
 */

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const MAPS_BASE = "https://maps.googleapis.com/maps/api";

// ─── In-memory cache with TTL ────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expires: number;
}

const geocodeCache = new Map<string, CacheEntry<{ lat: number; lng: number; formattedAddress: string }>>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T): void {
  cache.set(key, { data, expires: Date.now() + CACHE_TTL });
}

// ─── Helpers ─────────────────────────────────────────────────────

async function mapsGet(endpoint: string, params: Record<string, string>): Promise<any> {
  if (!API_KEY) throw new Error("GOOGLE_PLACES_API_KEY not configured");
  const url = new URL(`${MAPS_BASE}/${endpoint}/json`);
  url.searchParams.set("key", API_KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Google Maps API error: ${res.status} ${res.statusText}`);
  return res.json();
}

function metersToMiles(m: number): number {
  return Math.round((m / 1609.344) * 10) / 10;
}

function secondsToMinutes(s: number): number {
  return Math.round(s / 60);
}

// ─── Geocode address → { lat, lng, formattedAddress } ────────────

export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number; formattedAddress: string } | null> {
  try {
    const cacheKey = address.toLowerCase().trim();
    const cached = getCached(geocodeCache, cacheKey);
    if (cached) return cached;

    const data = await mapsGet("geocode", { address });
    if (data.status !== "OK" || !data.results?.length) {
      console.warn(`[google-maps] geocode failed for "${address}": ${data.status}`);
      return null;
    }

    const result = data.results[0];
    const out = {
      lat: result.geometry.location.lat as number,
      lng: result.geometry.location.lng as number,
      formattedAddress: result.formatted_address as string,
    };
    setCache(geocodeCache, cacheKey, out);
    return out;
  } catch (err) {
    console.error("[google-maps] geocodeAddress error:", err);
    return null;
  }
}

// ─── Reverse geocode ─────────────────────────────────────────────

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const data = await mapsGet("geocode", { latlng: `${lat},${lng}` });
    if (data.status !== "OK" || !data.results?.length) return null;
    return data.results[0].formatted_address;
  } catch (err) {
    console.error("[google-maps] reverseGeocode error:", err);
    return null;
  }
}

// ─── Driving distance between two points ─────────────────────────

export async function getDrivingDistance(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{ distanceMiles: number; durationMinutes: number; durationInTraffic?: number } | null> {
  try {
    const data = await mapsGet("directions", {
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      departure_time: "now",
    });
    if (data.status !== "OK" || !data.routes?.length) return null;

    const leg = data.routes[0].legs[0];
    return {
      distanceMiles: metersToMiles(leg.distance.value),
      durationMinutes: secondsToMinutes(leg.duration.value),
      durationInTraffic: leg.duration_in_traffic
        ? secondsToMinutes(leg.duration_in_traffic.value)
        : undefined,
    };
  } catch (err) {
    console.error("[google-maps] getDrivingDistance error:", err);
    return null;
  }
}

// ─── Distance matrix: one origin → many destinations ─────────────

export async function getDistanceMatrix(
  origin: { lat: number; lng: number },
  destinations: Array<{ id: string; lat: number; lng: number }>
): Promise<Array<{ id: string; distanceMiles: number; durationMinutes: number }>> {
  if (!destinations.length) return [];
  try {
    // API limit: 25 destinations per request
    const chunks: Array<typeof destinations> = [];
    for (let i = 0; i < destinations.length; i += 25) {
      chunks.push(destinations.slice(i, i + 25));
    }

    const results: Array<{ id: string; distanceMiles: number; durationMinutes: number }> = [];

    for (const chunk of chunks) {
      const destStr = chunk.map((d) => `${d.lat},${d.lng}`).join("|");
      const data = await mapsGet("distancematrix", {
        origins: `${origin.lat},${origin.lng}`,
        destinations: destStr,
        departure_time: "now",
      });

      if (data.status !== "OK") {
        console.warn("[google-maps] distanceMatrix status:", data.status);
        continue;
      }

      const elements = data.rows?.[0]?.elements || [];
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (el.status === "OK") {
          results.push({
            id: chunk[i].id,
            distanceMiles: metersToMiles(el.distance.value),
            durationMinutes: secondsToMinutes(
              el.duration_in_traffic?.value || el.duration.value
            ),
          });
        }
      }
    }

    return results.sort((a, b) => a.durationMinutes - b.durationMinutes);
  } catch (err) {
    console.error("[google-maps] getDistanceMatrix error:", err);
    return [];
  }
}

// ─── Optimized route (waypoint optimization) ─────────────────────

export async function getOptimizedRoute(
  origin: { lat: number; lng: number },
  stops: Array<{ id: string; lat: number; lng: number; address: string }>
): Promise<{
  optimizedOrder: string[];
  totalDistanceMiles: number;
  totalDurationMinutes: number;
  legs: Array<{ from: string; to: string; distanceMiles: number; durationMinutes: number }>;
}> {
  if (!stops.length) {
    return { optimizedOrder: [], totalDistanceMiles: 0, totalDurationMinutes: 0, legs: [] };
  }

  try {
    const waypoints = stops.map((s) => `${s.lat},${s.lng}`).join("|");
    const data = await mapsGet("directions", {
      origin: `${origin.lat},${origin.lng}`,
      destination: `${stops[stops.length - 1].lat},${stops[stops.length - 1].lng}`,
      waypoints: `optimize:true|${waypoints}`,
      departure_time: "now",
    });

    if (data.status !== "OK" || !data.routes?.length) {
      throw new Error(`Directions API returned ${data.status}`);
    }

    const route = data.routes[0];
    const waypointOrder: number[] = route.waypoint_order || stops.map((_, i) => i);
    const optimizedOrder = waypointOrder.map((i) => stops[i].id);

    let totalDistanceMiles = 0;
    let totalDurationMinutes = 0;
    const legs: Array<{ from: string; to: string; distanceMiles: number; durationMinutes: number }> = [];

    for (let i = 0; i < route.legs.length; i++) {
      const leg = route.legs[i];
      const dist = metersToMiles(leg.distance.value);
      const dur = secondsToMinutes(leg.duration.value);
      totalDistanceMiles += dist;
      totalDurationMinutes += dur;

      const fromId = i === 0 ? "origin" : optimizedOrder[i - 1];
      const toId = i < optimizedOrder.length ? optimizedOrder[i] : optimizedOrder[optimizedOrder.length - 1];
      legs.push({ from: fromId, to: toId, distanceMiles: dist, durationMinutes: dur });
    }

    return {
      optimizedOrder,
      totalDistanceMiles: Math.round(totalDistanceMiles * 10) / 10,
      totalDurationMinutes,
      legs,
    };
  } catch (err) {
    console.error("[google-maps] getOptimizedRoute error:", err);
    throw err;
  }
}

// ─── Autocomplete address ────────────────────────────────────────

export async function autocompleteAddress(
  input: string,
  location?: { lat: number; lng: number }
): Promise<Array<{ placeId: string; description: string; mainText: string; secondaryText: string }>> {
  try {
    const params: Record<string, string> = {
      input,
      types: "address",
      components: "country:us",
    };
    if (location) {
      params.location = `${location.lat},${location.lng}`;
      params.radius = "80000"; // 50 miles
    }

    const data = await mapsGet("place/autocomplete", params);
    if (data.status !== "OK") return [];

    return (data.predictions || []).map((p: any) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting?.main_text || p.description,
      secondaryText: p.structured_formatting?.secondary_text || "",
    }));
  } catch (err) {
    console.error("[google-maps] autocompleteAddress error:", err);
    return [];
  }
}

// ─── Place details from placeId ──────────────────────────────────

export async function getPlaceDetails(
  placeId: string
): Promise<{ lat: number; lng: number; formattedAddress: string; components: any } | null> {
  try {
    const data = await mapsGet("place/details", {
      place_id: placeId,
      fields: "geometry,formatted_address,address_components",
    });
    if (data.status !== "OK" || !data.result) return null;

    const r = data.result;
    return {
      lat: r.geometry.location.lat,
      lng: r.geometry.location.lng,
      formattedAddress: r.formatted_address,
      components: r.address_components,
    };
  } catch (err) {
    console.error("[google-maps] getPlaceDetails error:", err);
    return null;
  }
}
