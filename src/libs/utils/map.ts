import type { RecommendationListItem } from "@/libs/types";
import type { Region } from "react-native-maps";

/**
 * Calculate the region for a set of recommendations
 * This function determines the appropriate zoom level and center point
 * for displaying recommendations on a map
 */
export const calculateRegion = (
  recommendations: RecommendationListItem[],
): Region | null => {
  if (!recommendations?.length) {
    return null;
  }

  const latitudes = recommendations.map((r) => r.coordinates.latitude);
  const longitudes = recommendations.map((r) => r.coordinates.longitude);

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;

  // For single markers or very close markers, use larger default deltas
  const isSingleOrCloseMarkers = latSpan < 0.001 || lngSpan < 0.001;

  // Default zoom levels (deltas) for the map
  let latitudeOffset = 0;
  let latitudeDelta = Math.max(latSpan * 2.5, 0.4);
  let longitudeDelta = Math.max(lngSpan * 2.5, 0.4);

  // Adjust values for single or close markers
  if (isSingleOrCloseMarkers) {
    latitudeDelta = 0.02;
    longitudeDelta = 0.05;
    latitudeOffset = 0.02;
  }

  return {
    latitudeDelta,
    longitudeDelta,
    longitude: centerLng,
    latitude: centerLat - latitudeOffset,
  };
};
