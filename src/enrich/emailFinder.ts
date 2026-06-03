import { log } from '../logger.js';

const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

// Reject obvious noise: tracking pixels, asset filenames, vendor addresses.
const JUNK = /(sentry|wixpress|\.png|\.jpg|\.gif|\.webp|\.svg|example\.|your@|email@|name@|domain\.com|@2x)/i;

/**
 * Best-effort email discovery: scrape the business's own site (home + a few
 * common contact pages) for a mailto/visible address. Returns the first sane hit.
 *
 * NOTE: only scrapes the prospect's own public website. Respect robots/ToS and
 * the legal notes in the README before using results for outreach.
 */
export async function findEmail(website?: string | null): Promise<string | null> {
  if (!website) return null;

  let origin: string;
  try {
    origin = new URL(website).origin;
  } catch {
    return null;
  }

  const pages = [website, `${origin}/contact`, `${origin}/contact-us`, `${origin}/about`];
  const tried = new Set<string>();

  for (const page of pages) {
    if (tried.has(page)) continue;
    tried.add(page);
    try {
      const res = await fetch(page, {
        redirect: 'follow',
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LeadGenBot/0.1)' },
      });
      if (!res.ok) continue;
      const html = await res.text();

      const matches = html.match(EMAIL_RE) ?? [];
      const cleaned = matches
        .map((m) => m.toLowerCase())
        .filter((m) => !JUNK.test(m));

      if (cleaned.length) {
        // Prefer info@/hello@/contact@ style addresses.
        const preferred =
          cleaned.find((m) => /^(info|hello|contact|hi|sales|book)@/.test(m)) ?? cleaned[0];
        return preferred;
      }
    } catch (err) {
      log.warn(`Email scrape failed for ${page}: ${(err as Error).message}`);
    }
  }
  return null;
}
