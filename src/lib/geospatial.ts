import { ItineraryCoordinate } from '@/types/itinerary';

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns distance in meters
 */
export function haversineDistance(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (coord1.lat * Math.PI) / 180;
  const φ2 = (coord2.lat * Math.PI) / 180;
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate total distance of a route
 */
export function calculateRouteDistance(coordinates: ItineraryCoordinate[]): number {
  let totalDistance = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    totalDistance += haversineDistance(coordinates[i], coordinates[i + 1]);
  }
  return totalDistance;
}

/**
 * Calculate elevation gain and loss
 */
export function calculateElevationMetrics(
  coordinates: ItineraryCoordinate[]
): { gain: number; loss: number } {
  let gain = 0;
  let loss = 0;

  for (let i = 0; i < coordinates.length - 1; i++) {
    const elevationDiff = (coordinates[i + 1].elevation || 0) - (coordinates[i].elevation || 0);
    if (elevationDiff > 0) {
      gain += elevationDiff;
    } else {
      loss += Math.abs(elevationDiff);
    }
  }

  return { gain, loss };
}

/**
 * Calculate estimated hiking duration using Naismith's rule with adjustments
 * - Base: 5 km/h on flat terrain
 * - Add: 1 hour per 600m elevation gain
 * - Subtract: 10 minutes per 300m elevation loss
 * - Adjust by difficulty multiplier
 *
 * @param distanceMeters Total distance in meters
 * @param elevationGainMeters Total elevation gain in meters
 * @param elevationLossMeters Total elevation loss in meters
 * @param difficulty Event difficulty level
 * @returns Estimated duration in minutes
 */
export function calculateHikingDuration(
  distanceMeters: number,
  elevationGainMeters: number,
  elevationLossMeters: number,
  difficulty: 'easy' | 'moderate' | 'hard' | 'expert' = 'moderate'
): number {
  // Base time: distance / speed (5 km/h = 83.33 m/min)
  const baseMinutes = distanceMeters / 83.33;

  // Elevation gain penalty: 1 hour per 600m
  const gainMinutes = (elevationGainMeters / 600) * 60;

  // Elevation loss bonus: -10 minutes per 300m (capped to not go negative)
  const lossMinutes = Math.min((elevationLossMeters / 300) * 10, baseMinutes * 0.3);

  // Difficulty multipliers
  const difficultyMultipliers: Record<string, number> = {
    easy: 0.9,
    moderate: 1.0,
    hard: 1.15,
    expert: 1.3,
  };

  // Default to moderate if difficulty is not recognized
  const multiplier = difficultyMultipliers[difficulty] || 1.0;
  const totalMinutes = (baseMinutes + gainMinutes - lossMinutes) * multiplier;

  // Return 0 if calculation results in NaN
  if (isNaN(totalMinutes)) {
    return 0;
  }

  return Math.round(totalMinutes);
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  // Handle invalid values
  if (isNaN(meters) || !isFinite(meters) || meters < 0) {
    return '0 m';
  }

  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format elevation for display
 */
export function formatElevation(meters: number): string {
  // Handle invalid values
  if (isNaN(meters) || !isFinite(meters)) {
    return '0 m';
  }
  return `${Math.round(meters)} m`;
}

/**
 * Format duration for display
 */
export function formatDuration(minutes: number): string {
  // Handle invalid values
  if (isNaN(minutes) || !isFinite(minutes) || minutes < 0) {
    return '0 min';
  }

  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (hours === 0) {
    return `${mins} min`;
  }
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h${mins.toString().padStart(2, '0')}`;
}
