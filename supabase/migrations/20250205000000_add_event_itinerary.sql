-- Add itinerary columns to hiking_events table
-- Migration: Add hiking itinerary features
-- Created: 2025-02-05

-- Add columns for storing itinerary data
ALTER TABLE public.hiking_events
ADD COLUMN itinerary_geojson JSONB NULL,
ADD COLUMN itinerary_distance_meters NUMERIC(10,2) NULL,
ADD COLUMN itinerary_elevation_gain_meters NUMERIC(10,2) NULL,
ADD COLUMN itinerary_elevation_loss_meters NUMERIC(10,2) NULL,
ADD COLUMN itinerary_estimated_duration_minutes INTEGER NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.hiking_events.itinerary_geojson IS 'GeoJSON LineString representing the hiking route coordinates';
COMMENT ON COLUMN public.hiking_events.itinerary_distance_meters IS 'Total distance of the route in meters';
COMMENT ON COLUMN public.hiking_events.itinerary_elevation_gain_meters IS 'Total elevation gain in meters';
COMMENT ON COLUMN public.hiking_events.itinerary_elevation_loss_meters IS 'Total elevation loss in meters';
COMMENT ON COLUMN public.hiking_events.itinerary_estimated_duration_minutes IS 'Estimated hiking duration in minutes (based on Naismith rule)';

-- Add index for efficient querying of events with itineraries
CREATE INDEX idx_hiking_events_has_itinerary ON public.hiking_events ((itinerary_geojson IS NOT NULL));
