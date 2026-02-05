import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Map, TrendingUp, TrendingDown, Clock, Route } from 'lucide-react';
import { ItineraryGeoJSON, ItineraryMetrics } from '@/types/itinerary';
import { formatDistance, formatElevation, formatDuration } from '@/lib/geospatial';

interface ItineraryDisplayMapProps {
  geojson: ItineraryGeoJSON;
  metrics: ItineraryMetrics;
  location?: string; // Event location for map centering
}

export function ItineraryDisplayMap({ geojson, metrics, location }: ItineraryDisplayMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !geojson) return;

    const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!accessToken) {
      console.error('Mapbox access token is not configured');
      return;
    }

    mapboxgl.accessToken = accessToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: import.meta.env.VITE_MAPBOX_STYLE || 'mapbox://styles/mapbox/outdoors-v12',
      center: geojson.coordinates[0] as [number, number],
      zoom: 12,
      interactive: true, // Allow users to zoom/pan
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add geocoder (address search bar)
    const geocoder = new MapboxGeocoder({
      accessToken: accessToken,
      mapboxgl: mapboxgl as any,
      marker: false,
      placeholder: 'Rechercher un lieu...',
      countries: 'fr',
      language: 'fr',
    });
    map.current.addControl(geocoder as any, 'top-left');

    map.current.on('load', () => {
      if (!map.current) return;

      // Add route layer
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: geojson,
        },
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#22c55e',
          'line-width': 4,
        },
      });

      // Add start marker
      const startCoord = geojson.coordinates[0];
      new mapboxgl.Marker({ color: '#22c55e' })
        .setLngLat(startCoord as [number, number])
        .setPopup(new mapboxgl.Popup().setHTML('<strong>Départ</strong>'))
        .addTo(map.current);

      // Add end marker
      const endCoord = geojson.coordinates[geojson.coordinates.length - 1];
      new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat(endCoord as [number, number])
        .setPopup(new mapboxgl.Popup().setHTML('<strong>Arrivée</strong>'))
        .addTo(map.current);

      // Fit map to route bounds
      const coordinates = geojson.coordinates as [number, number][];
      const bounds = coordinates.reduce(
        (bounds, coord) => bounds.extend(coord),
        new mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
      );
      map.current.fitBounds(bounds, { padding: 50 });
    });

    return () => {
      map.current?.remove();
    };
  }, [geojson]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="h-5 w-5" />
          Itinéraire
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Map */}
        <div
          ref={mapContainer}
          className="w-full h-[400px] md:h-[500px] rounded-lg border border-border overflow-hidden"
        />

        {/* Metrics grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
            <Route className="h-5 w-5 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground mb-1">Distance</p>
            <p className="text-lg font-bold">{formatDistance(metrics.distanceMeters)}</p>
          </div>

          <div className="flex flex-col items-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <TrendingUp className="h-5 w-5 text-green-600 mb-2" />
            <p className="text-xs text-muted-foreground mb-1">Dénivelé positif</p>
            <p className="text-lg font-bold text-green-600">
              +{formatElevation(metrics.elevationGainMeters)}
            </p>
          </div>

          <div className="flex flex-col items-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <TrendingDown className="h-5 w-5 text-blue-600 mb-2" />
            <p className="text-xs text-muted-foreground mb-1">Dénivelé négatif</p>
            <p className="text-lg font-bold text-blue-600">
              -{formatElevation(metrics.elevationLossMeters)}
            </p>
          </div>

          <div className="flex flex-col items-center p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
            <Clock className="h-5 w-5 text-amber-600 mb-2" />
            <p className="text-xs text-muted-foreground mb-1">Durée estimée</p>
            <p className="text-lg font-bold text-amber-600">
              {formatDuration(metrics.estimatedDurationMinutes)}
            </p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Durée calculée selon la règle de Naismith (5 km/h + 1h/600m D+)
        </div>
      </CardContent>
    </Card>
  );
}
