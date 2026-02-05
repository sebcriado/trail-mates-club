import { ItineraryCoordinate } from '@/types/itinerary';

/**
 * Fetch elevation data for coordinates using Open-Elevation API
 * Free, open-source, no API key required
 * https://open-elevation.com/
 */
export async function fetchElevationData(
  coordinates: ItineraryCoordinate[]
): Promise<ItineraryCoordinate[]> {
  if (coordinates.length === 0) {
    return coordinates;
  }

  try {
    // Open-Elevation accepts POST with array of locations
    // Limit to 100 points per request as per API limits
    const batchSize = 100;
    const enrichedCoordinates: ItineraryCoordinate[] = [];

    for (let i = 0; i < coordinates.length; i += batchSize) {
      const batch = coordinates.slice(i, i + batchSize);

      const response = await fetch('https://api.open-elevation.com/api/v1/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          locations: batch.map(c => ({
            latitude: c.lat,
            longitude: c.lng
          }))
        })
      });

      if (!response.ok) {
        console.warn(`Open-Elevation API request failed with status ${response.status}`);
        // Return coordinates without elevation data
        enrichedCoordinates.push(...batch);
        continue;
      }

      const data = await response.json();

      const batchEnriched = batch.map((coord, idx) => ({
        ...coord,
        elevation: data.results?.[idx]?.elevation || 0
      }));

      enrichedCoordinates.push(...batchEnriched);

      // Rate limiting delay between batches to be respectful to the free API
      // Wait 500ms between batches
      if (i + batchSize < coordinates.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return enrichedCoordinates;
  } catch (error) {
    console.error('Error fetching elevation from Open-Elevation:', error);
    // Return coordinates without elevation data on error
    return coordinates.map(c => ({ ...c, elevation: 0 }));
  }
}

/**
 * Alternative: Fetch elevation using Mapbox Tilequery API
 * Requires Mapbox access token
 * Free tier: 100k requests/month
 * https://docs.mapbox.com/api/maps/tilequery/
 */
export async function fetchElevationDataMapbox(
  coordinates: ItineraryCoordinate[]
): Promise<ItineraryCoordinate[]> {
  const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  if (!accessToken) {
    console.warn('Mapbox token not configured, falling back to Open-Elevation');
    return fetchElevationData(coordinates);
  }

  if (coordinates.length === 0) {
    return coordinates;
  }

  // Mapbox Tilequery requires individual requests per coordinate
  // Batch in groups of 50 to avoid overwhelming the API
  const batchSize = 50;
  const batches: ItineraryCoordinate[][] = [];

  for (let i = 0; i < coordinates.length; i += batchSize) {
    batches.push(coordinates.slice(i, i + batchSize));
  }

  const enrichedCoordinates: ItineraryCoordinate[] = [];

  for (const batch of batches) {
    const batchResults = await Promise.all(
      batch.map(async (coord) => {
        try {
          // Mapbox Tilequery for terrain-rgb tileset
          // Note: This is a simplified approach. Production code might use contour tileset
          const url = `https://api.mapbox.com/v4/mapbox.mapbox-terrain-v2/tilequery/${coord.lng},${coord.lat}.json?layers=contour&limit=1&access_token=${accessToken}`;

          const response = await fetch(url);
          if (!response.ok) {
            console.warn(`Failed to fetch elevation for ${coord.lng},${coord.lat}`);
            return coord;
          }

          const data = await response.json();

          // Extract elevation from the contour feature
          const feature = data.features?.[0];
          if (feature?.properties?.ele) {
            return { ...coord, elevation: feature.properties.ele };
          }

          return coord;
        } catch (error) {
          console.error('Error fetching elevation for coordinate:', error);
          return coord;
        }
      })
    );

    enrichedCoordinates.push(...batchResults);

    // Rate limiting delay between batches (600ms = ~100 req/min)
    if (batches.indexOf(batch) < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 600));
    }
  }

  return enrichedCoordinates;
}
