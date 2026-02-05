import * as toGeoJSON from '@tmcw/togeojson';
import { ItineraryGeoJSON, ItineraryCoordinate } from '@/types/itinerary';

/**
 * Parse a GPX file and convert it to our ItineraryGeoJSON format
 * @param file GPX file from file input
 * @returns Promise with ItineraryGeoJSON and array of coordinates
 */
export async function parseGPXFile(file: File): Promise<{
  geojson: ItineraryGeoJSON;
  coordinates: ItineraryCoordinate[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const gpxText = e.target?.result as string;

        // Parse XML
        const parser = new DOMParser();
        const gpxDoc = parser.parseFromString(gpxText, 'text/xml');

        // Check for parsing errors
        const parseError = gpxDoc.querySelector('parsererror');
        if (parseError) {
          throw new Error('Erreur lors de la lecture du fichier GPX');
        }

        // Convert GPX to GeoJSON
        const geoJSON = toGeoJSON.gpx(gpxDoc);

        // Extract the first LineString feature (track or route)
        let lineFeature = geoJSON.features.find(
          (f: any) => f.geometry.type === 'LineString'
        );

        // If no LineString found, try MultiLineString and flatten it
        if (!lineFeature) {
          const multiLineFeature = geoJSON.features.find(
            (f: any) => f.geometry.type === 'MultiLineString'
          );

          if (multiLineFeature && multiLineFeature.geometry.coordinates.length > 0) {
            // Take the first track segment
            lineFeature = {
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: multiLineFeature.geometry.coordinates[0],
              },
              properties: multiLineFeature.properties,
            };
          }
        }

        if (!lineFeature || lineFeature.geometry.type !== 'LineString') {
          throw new Error('Aucun tracé trouvé dans le fichier GPX');
        }

        // Convert to our format
        const coords = lineFeature.geometry.coordinates;

        // GPX coordinates are [lng, lat, elevation]
        const itineraryCoordinates: ItineraryCoordinate[] = coords.map((coord: number[]) => ({
          lng: coord[0],
          lat: coord[1],
          elevation: coord[2] || undefined, // Elevation might be present in GPX
        }));

        const itineraryGeoJSON: ItineraryGeoJSON = {
          type: 'LineString',
          coordinates: coords as [number, number, number?][],
        };

        resolve({
          geojson: itineraryGeoJSON,
          coordinates: itineraryCoordinates,
        });
      } catch (error) {
        console.error('Error parsing GPX:', error);
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };

    reader.readAsText(file);
  });
}

/**
 * Validate that a file is a GPX file
 */
export function isGPXFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.gpx') || file.type === 'application/gpx+xml';
}
