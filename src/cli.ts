import { config } from './config.js';
import { log } from './logger.js';
import { LeadStore } from './db.js';
import { runPipeline } from './pipeline.js';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const cmd = process.argv[2] ?? 'run';

  switch (cmd) {
    case 'run': {
      const limit = Number(arg('limit') ?? config.dailyLimit);
      log.info(
        `Starting run — market=${config.market}, limit=${limit}, ` +
          `dryRun=${config.email.dryRun || !config.email.enabled}`,
      );
      const s = await runPipeline(limit);
      console.log('\n──────── Run summary ────────');
      console.table(s);
      if (s.dryRun > 0) {
        log.warn(
          `${s.dryRun} emails are in DRY-RUN (saved to data/outbox/). ` +
            `Review them, then set DRY_RUN=false & EMAIL_ENABLED=true to send for real.`,
        );
      }
      break;
    }

    case 'list': {
      const leads = new LeadStore().all();
      console.table(
        leads.map((l) => ({
          name: l.name,
          category: l.category,
          score: l.websiteScore,
          email: l.email ?? '—',
          status: l.emailStatus ?? '—',
        })),
      );
      break;
    }

    case 'stats': {
      const leads = new LeadStore().all();
      const by = (k: string) => leads.filter((l) => l.emailStatus === k).length;
      console.table({
        total: leads.length,
        needWork: leads.filter((l) => l.needsWork).length,
        sent: by('sent'),
        dryrun: by('dryrun'),
        skipped: by('skipped'),
        failed: by('failed'),
        replied: by('replied'),
      });
      break;
    }

    default:
      console.log(`Usage:
  npm run run:once -- --limit 5   Run the pipeline (discover → demo → outreach)
  npm run list                    List all known leads
  npm run stats                   Show pipeline stats
  npm run schedule                Run daily on a cron schedule`);
  }
}

main().catch((err) => {
  log.error(err.stack ?? String(err));
  process.exit(1);
});
