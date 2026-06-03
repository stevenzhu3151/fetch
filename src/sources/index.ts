import type { Lead } from '../types.js';
import { config } from '../config.js';
import { log } from '../logger.js';
import { searchPlaces } from './places.js';
import { mockLeads } from './mock.js';

type RawLead = Omit<Lead, 'createdAt' | 'updatedAt'>;

/**
 * Pull candidate businesses from every configured search query.
 * Falls back to built-in sample data when no Places key is set.
 */
export async function discoverLeads(): Promise<RawLead[]> {
  if (!config.googlePlacesKey) {
    log.warn('No GOOGLE_PLACES_API_KEY set — using built-in sample data.');
    return mockLeads();
  }

  const all: RawLead[] = [];
  const seen = new Set<string>();
  for (const query of config.search.queries) {
    try {
      const results = await searchPlaces(query, config.search.location);
      log.info(`Places "${query}" → ${results.length} results`);
      for (const r of results) {
        if (!seen.has(r.id)) {
          seen.add(r.id);
          all.push(r);
        }
      }
    } catch (err) {
      log.warn(`Search failed for "${query}": ${(err as Error).message}`);
    }
  }
  return all;
}
