import type { Lead } from './types.js';
import { config } from './config.js';
import { log } from './logger.js';
import { LeadStore } from './db.js';
import { discoverLeads } from './sources/index.js';
import { assessWebsite } from './enrich/websiteCheck.js';
import { findEmail } from './enrich/emailFinder.js';
import { generateDemo } from './demo/generator.js';
import { sendOutreach } from './outreach/sender.js';
import { suppression } from './suppression.js';

export interface RunSummary {
  discovered: number;
  processed: number;
  needWork: number;
  demosBuilt: number;
  emailsSent: number;
  dryRun: number;
  skippedNoEmail: number;
  skippedFine: number;
}

/**
 * One full pass of the pipeline:
 *   discover → de-dupe → assess website → find email → build demo → send outreach
 * Only brand-new leads (not already in the store) are processed, up to `limit`.
 */
export async function runPipeline(limit = config.dailyLimit): Promise<RunSummary> {
  const store = new LeadStore();
  const summary: RunSummary = {
    discovered: 0,
    processed: 0,
    needWork: 0,
    demosBuilt: 0,
    emailsSent: 0,
    dryRun: 0,
    skippedNoEmail: 0,
    skippedFine: 0,
  };

  log.step('Discovering businesses…');
  const raw = await discoverLeads();
  summary.discovered = raw.length;

  // Only process leads we have never seen before.
  const fresh = raw.filter((l) => !store.has(l.id)).slice(0, limit);
  log.info(`${raw.length} found, ${fresh.length} are new (cap ${limit}).`);

  for (const r of fresh) {
    summary.processed++;
    const lead: Lead = store.upsert(r);
    log.step(`[${summary.processed}/${fresh.length}] ${lead.name} (${lead.category})`);

    // 1. Does it need a new website?
    const assessment = await assessWebsite(lead.website);
    store.upsert({
      id: lead.id,
      websiteScore: assessment.score,
      needsWork: assessment.needsWork,
      needReasons: assessment.reasons,
    });
    log.info(`  ↳ website score ${assessment.score}/100 — ${assessment.reasons[0]}`);

    if (!assessment.needsWork) {
      store.upsert({ id: lead.id, emailStatus: 'skipped', notes: 'site looks fine' });
      summary.skippedFine++;
      continue;
    }
    summary.needWork++;

    // 2. Find a contact email.
    const email = lead.email ?? (await findEmail(lead.website));
    if (!email) {
      store.upsert({ id: lead.id, emailStatus: 'skipped', notes: 'no email found' });
      summary.skippedNoEmail++;
      log.warn('  ↳ no email found — skipping outreach');
      continue;
    }
    store.upsert({ id: lead.id, email });

    // Never contact a suppressed/unsubscribed address.
    if (suppression.isSuppressed(email)) {
      store.upsert({ id: lead.id, emailStatus: 'skipped', notes: 'suppressed' });
      summary.skippedNoEmail++;
      log.warn('  ↳ email is on the suppression list — skipping');
      continue;
    }

    // 3. Build the demo.
    const demo = await generateDemo({ ...lead, email });
    store.upsert({ id: lead.id, demoPath: demo.path, demoUrl: demo.url });
    summary.demosBuilt++;
    log.ok(`  ↳ demo built (${demo.generatedBy}) → ${demo.path}`);

    // 4. Send / queue the outreach email.
    const current = store.get(lead.id)!;
    const result = await sendOutreach(current);
    const contacted = result.status === 'sent' || result.status === 'dryrun';
    store.upsert({
      id: lead.id,
      emailStatus: result.status,
      emailSubject: result.subject,
      emailSentAt: result.status === 'sent' ? new Date().toISOString() : null,
      lastContactedAt: contacted ? new Date().toISOString() : null,
      followUpCount: 0,
    });
    if (result.status === 'sent') summary.emailsSent++;
    if (result.status === 'dryrun') summary.dryRun++;
  }

  return summary;
}
