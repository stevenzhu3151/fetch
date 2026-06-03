import { log } from '../logger.js';

export interface WebsiteAssessment {
  score: number; // 0-100, LOWER = needs a new site more
  needsWork: boolean;
  reasons: string[];
}

/**
 * Heuristic "does this business need a new website?" check.
 * No website = maximum need. Otherwise we fetch the page and look for the
 * usual signs of a neglected site (not mobile-friendly, no HTTPS, thin/old).
 */
export async function assessWebsite(url?: string | null): Promise<WebsiteAssessment> {
  if (!url) {
    return { score: 0, needsWork: true, reasons: ['No website at all'] };
  }

  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LeadGenBot/0.1)' },
    });

    if (!res.ok) {
      return { score: 10, needsWork: true, reasons: [`Site returns HTTP ${res.status}`] };
    }

    const html = (await res.text()).slice(0, 200_000);
    const finalUrl = res.url || url;
    let score = 55;
    const reasons: string[] = [];

    if (!/<meta[^>]+name=["']?viewport/i.test(html)) {
      score -= 25;
      reasons.push('Not mobile-friendly (no viewport meta)');
    }
    if (!finalUrl.startsWith('https://')) {
      score -= 15;
      reasons.push('No HTTPS / insecure');
    }
    if (html.replace(/<[^>]+>/g, '').trim().length < 1200) {
      score -= 15;
      reasons.push('Very thin content');
    }
    const oldYear = html.match(/(?:©|copyright)[^0-9]{0,8}(19\d\d|20[0-1]\d)/i);
    if (oldYear) {
      score -= 15;
      reasons.push(`Outdated copyright (${oldYear[1]})`);
    }
    if (/facebook\.com\/|instagram\.com\//i.test(finalUrl)) {
      score -= 20;
      reasons.push('Only a social media page, no real website');
    }

    score = Math.max(0, Math.min(100, score));
    if (reasons.length === 0) reasons.push('Site looks reasonably maintained');
    return { score, needsWork: score < 60, reasons };
  } catch (err) {
    log.warn(`Website check failed for ${url}: ${(err as Error).message}`);
    return { score: 10, needsWork: true, reasons: ['Website unreachable / broken'] };
  }
}
