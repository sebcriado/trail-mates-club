import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Map, Trash2, Info, Crown, Upload } from 'lucide-react';
import { ItineraryGeoJSON, ItineraryMetrics, ItineraryCoordinate } from '@/types/itinerary';
import {
  calculateRouteDistance,
  calculateElevationMetrics,
  calculateHikingDuration,
  formatDistance,
  formatElevation,
  formatDuration,
} from '@/lib/geospatial';
import { fetchElevationData } from '@/services/elevationService';
import { usePremium } from '@/contexts/PremiumContext';
import { Link } from 'react-router-dom';
import { parseGPXFile, isGPXFile } from '@/lib/gpxParser';
import { useToast } from '@/hooks/use-toast';

interface ItineraryDrawMapProps {
  initialGeojson?: ItineraryGeoJSON | null;
  difficulty?: 'easy' | 'moderate' | 'hard' | 'expert';
  onItineraryChange: (geojson: ItineraryGeoJSON | null, metrics: ItineraryMetrics | null) => void;
}

export function ItineraryDrawMap({
  initialGeojson,
  difficulty,
  onItineraryChange,
}: ItineraryDrawMapProps) {
  // Normalize difficulty - handle empty string or invalid values
  const normalizedDifficulty: 'easy' | 'moderate' | 'hard' | 'expert' =
    difficulty && ['easy', 'moderate', 'hard', 'expert'].includes(difficulty)
      ? difficulty
      : 'moderate';
  const { isPremium } = usePremium();
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<ItineraryMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !isPremium) return;

    const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!accessToken) {
      console.error('Mapbox access token is not configured');
      setError('Configuration Mapbox manquante');
      return;
    }

    mapboxgl.accessToken = accessToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: import.meta.env.VITE_MAPBOX_STYLE || 'mapbox://styles/mapbox/outdoors-v12',
      center: [2.3522, 48.8566], // Default: Paris
      zoom: 10,
      attributionControl: true,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add geocoder (address search bar)
    const geocoder = new MapboxGeocoder({
      accessToken: accessToken,
      mapboxgl: mapboxgl as any,
      marker: false, // Don't add a marker on search
      placeholder: 'Rechercher un lieu...',
      countries: 'fr', // Limit to France (remove this line to search worldwide)
      language: 'fr',
    });
    map.current.addControl(geocoder as any, 'top-left');

    // Initialize drawing tools
    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        line_string: true,
        trash: true,
      },
      defaultMode: 'draw_line_string',
      styles: [
        // Custom styles for drawn line
        {
          id: 'gl-draw-line',
          type: 'line',
          filter: ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
          paint: {
            'line-color': '#22c55e', // Green color
            'line-width': 4,
          },
        },
        {
          id: 'gl-draw-polygon-and-line-vertex-active',
          type: 'circle',
          filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
          paint: {
            'circle-radius': 6,
            'circle-color': '#22c55e',
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 2,
          },
        },
      ],
    });

    map.current.addControl(draw.current as any);

    // Load initial geojson if provided
    if (initialGeojson && draw.current) {
      const feature = {
        type: 'Feature' as const,
        geometry: initialGeojson,
        properties: {},
      };
      draw.current.add(feature);
      // Fit map to route bounds
      const coordinates = initialGeojson.coordinates as [number, number][];
      const bounds = coordinates.reduce(
        (bounds, coord) => bounds.extend(coord as [number, number]),
        new mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
      );
      map.current.fitBounds(bounds, { padding: 50 });
    }

    // Handle drawing updates
    map.current.on('draw.create', handleDrawUpdate);
    map.current.on('draw.update', handleDrawUpdate);
    map.current.on('draw.delete', handleDrawDelete);

    return () => {
      map.current?.remove();
    };
  }, [isPremium, initialGeojson]);

  const handleDrawUpdate = async () => {
    if (!draw.current) return;

    const data = draw.current.getAll();
    const lineFeature = data.features.find((f) => f.geometry.type === 'LineString');

    if (!lineFeature || lineFeature.geometry.type !== 'LineString') {
      onItineraryChange(null, null);
      setMetrics(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convert coordinates to our format
      const coords = lineFeature.geometry.coordinates.map(([lng, lat]) => ({ lng, lat }));

      // Fetch elevation data
      const enrichedCoords = await fetchElevationData(coords);

      // Calculate metrics
      const distance = calculateRouteDistance(enrichedCoords);
      const { gain, loss } = calculateElevationMetrics(enrichedCoords);
      const duration = calculateHikingDuration(distance, gain, loss, normalizedDifficulty);

      const calculatedMetrics: ItineraryMetrics = {
        distanceMeters: distance,
        elevationGainMeters: gain,
        elevationLossMeters: loss,
        estimatedDurationMinutes: duration,
      };

      const geojson: ItineraryGeoJSON = {
        type: 'LineString',
        coordinates: enrichedCoords.map((c) => [c.lng, c.lat, c.elevation]),
      };

      setMetrics(calculatedMetrics);
      onItineraryChange(geojson, calculatedMetrics);
    } catch (err) {
      console.error('Error calculating metrics:', err);
      setError("Erreur lors du calcul des métriques de l'itinéraire");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrawDelete = () => {
    onItineraryChange(null, null);
    setMetrics(null);
  };

  const clearRoute = () => {
    if (draw.current) {
      draw.current.deleteAll();
      handleDrawDelete();
    }
  };

  const handleGPXImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!isGPXFile(file)) {
      toast({
        title: 'Fichier invalide',
        description: 'Veuillez sélectionner un fichier GPX',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Parse GPX file
      const { geojson, coordinates } = await parseGPXFile(file);

      // Clear existing route
      if (draw.current) {
        draw.current.deleteAll();
      }

      // Add the route to the map
      if (draw.current && map.current) {
        const feature = {
          type: 'Feature' as const,
          geometry: geojson,
          properties: {},
        };
        draw.current.add(feature);

        // Fit map to route bounds
        const coords = geojson.coordinates as [number, number][];
        const bounds = coords.reduce(
          (bounds, coord) => bounds.extend(coord),
          new mapboxgl.LngLatBounds(coords[0], coords[0])
        );
        map.current.fitBounds(bounds, { padding: 50 });
      }

      // Fetch elevation data if not present in GPX
      const needsElevation = coordinates.some((c) => !c.elevation);
      let enrichedCoords = coordinates;

      if (needsElevation) {
        enrichedCoords = await fetchElevationData(coordinates);
      }

      // Calculate metrics
      const distance = calculateRouteDistance(enrichedCoords);
      const { gain, loss } = calculateElevationMetrics(enrichedCoords);
      const duration = calculateHikingDuration(distance, gain, loss, normalizedDifficulty);

      const calculatedMetrics: ItineraryMetrics = {
        distanceMeters: distance,
        elevationGainMeters: gain,
        elevationLossMeters: loss,
        estimatedDurationMinutes: duration,
      };

      const finalGeojson: ItineraryGeoJSON = {
        type: 'LineString',
        coordinates: enrichedCoords.map((c) => [c.lng, c.lat, c.elevation]),
      };

      setMetrics(calculatedMetrics);
      onItineraryChange(finalGeojson, calculatedMetrics);

      toast({
        title: 'Import réussi',
        description: 'Votre trace GPX a été importée avec succès',
      });
    } catch (err) {
      console.error('Error importing GPX:', err);
      setError('Erreur lors de l\'import du fichier GPX');
      toast({
        title: 'Erreur d\'import',
        description: 'Impossible de lire le fichier GPX. Vérifiez que le fichier est valide.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Premium gate
  if (!isPremium) {
    return (
      <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Itinéraire
            <span className="ml-2 inline-flex items-center rounded-full border border-accent bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
              <Crown className="h-3 w-3 mr-1" />
              Premium
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Créez des itinéraires interactifs pour vos randonnées avec carte et métriques
              détaillées
            </p>
            <Link to="/pricing">
              <Button className="bg-gradient-trail hover:opacity-90">
                <Crown className="h-4 w-4 mr-2" />
                Passer à Premium
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Tracer l'itinéraire
          </CardTitle>
          {metrics && (
            <Button variant="outline" size="sm" onClick={clearRoute}>
              <Trash2 className="h-4 w-4 mr-2" />
              Effacer
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Cliquez sur la carte pour tracer votre itinéraire point par point ou importez un fichier GPX.
          </AlertDescription>
        </Alert>

        {/* GPX Import Button */}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".gpx"
            onChange={handleGPXImport}
            className="hidden"
            id="gpx-upload"
          />
          <label htmlFor="gpx-upload" className="flex-1">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importer un fichier GPX
            </Button>
          </label>
        </div>

        {/* Map container */}
        <div
          ref={mapContainer}
          className="w-full h-[400px] md:h-[500px] rounded-lg border border-border overflow-hidden"
        />

        {/* Loading state */}
        {isLoading && (
          <div className="text-center text-sm text-muted-foreground">
            Calcul des métriques en cours...
          </div>
        )}

        {/* Error state */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Metrics display */}
        {metrics && !isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Distance</p>
              <p className="text-lg font-bold">{formatDistance(metrics.distanceMeters)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Dénivelé +</p>
              <p className="text-lg font-bold text-green-600">
                {formatElevation(metrics.elevationGainMeters)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Dénivelé -</p>
              <p className="text-lg font-bold text-blue-600">
                {formatElevation(metrics.elevationLossMeters)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Durée estimée</p>
              <p className="text-lg font-bold">
                {formatDuration(metrics.estimatedDurationMinutes)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
