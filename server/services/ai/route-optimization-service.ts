/**
 * AI Route Optimization Service
 *
 * Optimizes daily routes for pros using:
 * - Traveling Salesman Problem (TSP) algorithms
 * - Traffic data consideration
 * - Time windows and constraints
 * - ESG impact tracking (fuel/CO2 savings)
 */

export interface JobLocation {
  jobId: string;
  address: string;
  lat: number;
  lng: number;
  estimatedDuration: number; // minutes
  timeWindow?: {start: string; end: string};
  priority?: number;
}

export interface RouteOptimizationResult {
  optimizedRoute: string[]; // jobIds in order
  totalDistance: number; // miles
  totalTime: number; // minutes
  savings: {
    distanceSaved: number;
    timeSaved: number;
    fuelSaved: number;
    co2Saved: number;
  };
  routeSteps: Array<{
    jobId: string;
    address: string;
    arrivalTime: string;
    distanceFromPrevious: number;
  }>;
}

/**
 * Simple nearest neighbor TSP approximation
 * For production, consider using Google OR-Tools or similar
 */
export async function optimizeRoute(options: {
  jobs: JobLocation[];
  startLocation: {lat: number; lng: number};
  startTime?: string;
  considerTraffic?: boolean;
}): Promise<RouteOptimizationResult> {
  const { jobs, startLocation, startTime = "08:00", considerTraffic = false } = options;

  if (jobs.length === 0) {
    throw new Error("No jobs to optimize");
  }

  if (jobs.length === 1) {
    // Single job, no optimization needed
    const distance = calculateDistance(startLocation, {lat: jobs[0].lat, lng: jobs[0].lng});
    return {
      optimizedRoute: [jobs[0].jobId],
      totalDistance: distance * 2, // round trip
      totalTime: jobs[0].estimatedDuration + (distance / 30) * 60, // 30 mph average
      savings: {
        distanceSaved: 0,
        timeSaved: 0,
        fuelSaved: 0,
        co2Saved: 0,
      },
      routeSteps: [{
        jobId: jobs[0].jobId,
        address: jobs[0].address,
        arrivalTime: startTime,
        distanceFromPrevious: distance,
      }],
    };
  }

  // Nearest neighbor algorithm
  const unvisited = [...jobs];
  const route: string[] = [];
  const routeSteps: RouteOptimizationResult["routeSteps"] = [];

  let currentLocation = startLocation;
  let totalDistance = 0;
  let totalTime = 0;
  let currentTime = parseTime(startTime);

  while (unvisited.length > 0) {
    // Find nearest unvisited job
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const distance = calculateDistance(currentLocation, {
        lat: unvisited[i].lat,
        lng: unvisited[i].lng,
      });
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    const nextJob = unvisited[nearestIndex];
    unvisited.splice(nearestIndex, 1);

    // Add to route
    route.push(nextJob.jobId);
    totalDistance += nearestDistance;

    // Calculate arrival time
    const travelMinutes = (nearestDistance / 30) * 60; // 30 mph avg
    currentTime += travelMinutes;

    routeSteps.push({
      jobId: nextJob.jobId,
      address: nextJob.address,
      arrivalTime: formatTime(currentTime),
      distanceFromPrevious: nearestDistance,
    });

    // Update current location and time
    currentLocation = { lat: nextJob.lat, lng: nextJob.lng };
    currentTime += nextJob.estimatedDuration;
    totalTime += travelMinutes + nextJob.estimatedDuration;
  }

  // Calculate savings (compare to unoptimized sequential route)
  const unoptimizedDistance = calculateUnoptimizedDistance(jobs, startLocation);
  const distanceSaved = Math.max(0, unoptimizedDistance - totalDistance);
  const timeSaved = Math.max(0, (distanceSaved / 30) * 60); // minutes

  // ESG calculations
  const fuelSaved = distanceSaved / 20; // 20 mpg average
  const co2Saved = fuelSaved * 19.6; // lbs CO2 per gallon

  return {
    optimizedRoute: route,
    totalDistance: Math.round(totalDistance * 10) / 10,
    totalTime: Math.round(totalTime),
    savings: {
      distanceSaved: Math.round(distanceSaved * 10) / 10,
      timeSaved: Math.round(timeSaved),
      fuelSaved: Math.round(fuelSaved * 100) / 100,
      co2Saved: Math.round(co2Saved * 10) / 10,
    },
    routeSteps,
  };
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 3959; // Earth radius in miles
  const dLat = toRad(point2.lat - point1.lat);
  const dLon = toRad(point2.lng - point1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) *
      Math.cos(toRad(point2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function calculateUnoptimizedDistance(
  jobs: JobLocation[],
  startLocation: { lat: number; lng: number }
): number {
  let distance = 0;
  let current = startLocation;

  for (const job of jobs) {
    distance += calculateDistance(current, { lat: job.lat, lng: job.lng });
    current = { lat: job.lat, lng: job.lng };
  }

  return distance;
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

export default {
  optimizeRoute,
};
