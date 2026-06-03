import type { Lead } from '../types.js';
import { config } from '../config.js';
import { log } from '../logger.js';

interface PlacesResponse {
  places?: {
    id: string;
    displayName?: { text: string };
    formattedAddress?: string;
    nationalPhoneNumber?: string;
    websiteUri?: string;
    rating?: number;
    primaryType?: string;
  }[];
}

/**
 * Discover businesses via the Google Places API (New) Text Search endpoint.
 * Docs: https://developers.google.com/maps/documentation/places/web-service/text-search
 */
export async function searchPlaces(
  query: string,
  location: string,
): Promise<Omit<Lead, 'createdAt' | 'updatedAt'>[]> {
  if (!config.googlePlacesKey) return [];

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': config.googlePlacesKey,
      // Only request the fields we use -> cheaper + faster.
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.primaryType',
    },
    body: JSON.stringify({
      textQuery: `${query} in ${location}`,
      maxResultCount: 20,
      languageCode: 'en',
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    log.warn(`Places API ${res.status} for "${query}": ${await res.text()}`);
    return [];
  }

  const data = (await res.json()) as PlacesResponse;
  return (data.places ?? []).map((p) => ({
    id: p.id,
    name: p.displayName?.text ?? 'Unknown',
    category: p.primaryType ?? query,
    source: 'google_places',
    address: p.formattedAddress,
    phone: p.nationalPhoneNumber ?? null,
    website: p.websiteUri ?? null,
    rating: p.rating ?? null,
  }));
}
