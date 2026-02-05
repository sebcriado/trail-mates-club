// GeoJSON types for itinerary data
export interface ItineraryCoordinate {
  lng: number;
  lat: number;
  elevation?: number; // Optional, filled after elevation API call
}

export interface ItineraryGeoJSON {
  type: 'LineString';
  coordinates: [number, number, number?][]; // [lng, lat, elevation?]
}

export interface ItineraryMetrics {
  distanceMeters: number;
  elevationGainMeters: number;
  elevationLossMeters: number;
  estimatedDurationMinutes: number;
}

export interface ItineraryData {
  geojson: ItineraryGeoJSON;
  metrics: ItineraryMetrics;
}

// Map drawing state
export interface DrawingPoint {
  lng: number;
  lat: number;
  elevation?: number;
}
