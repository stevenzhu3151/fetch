import { config } from './config.js';
import { log } from './logger.js';
import { LeadStore } from './db.js';
import { runPipeline } from './pipeline.js';
import { runFollowUps } from './outreach/followup.js';
import { checkReplies } from './inbox/imap.js';
import { startServer } from './server.js';
import { suppression } from './suppression.js';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const hasFlag = (name: string) => process.argv.includes(`--${name}`);

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
          `${s.dryRun} emails in DRY-RUN (data/outbox/). Review, then set ` +
            `DRY_RUN=false & EMAIL_ENABLED=true to send for real.`,
        );
      }
      break;
    }

    case 'serve':
      startServer();
      break; // keep process alive

    case 'followup': {
      const r = await runFollowUps(hasFlag('force'));
      log.ok(`Follow-ups: ${r.sent} sent of ${r.checked} due.`);
      break;
    }

    case 'check-replies': {
      const r = await checkReplies(Number(arg('days') ?? 14));
      log.ok(`Replies: ${r.replies}, opt-outs: ${r.optOuts}.`);
      break;
    }

    case 'suppress': {
      const email = process.argv[3];
      if (!email) return void log.error('Usage: suppress <email>');
      suppression.add(email, 'manual');
      log.ok(`Suppressed ${email}`);
      break;
    }

    case 'unsuppress': {
      const email = process.argv[3];
      if (!email) return void log.error('Usage: unsuppress <email>');
      suppression.remove(email);
      log.ok(`Removed ${email} from suppression list`);
      break;
    }

    case 'list': {
      const leads = new LeadStore().all();
      console.table(
        leads.map((l) => ({
          name: l.name,
          score: l.websiteScore,
          email: l.email ?? '—',
          status: l.emailStatus ?? '—',
          followUps: l.followUpCount ?? 0,
          replied: l.repliedAt ? 'yes' : '',
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
        replied: leads.filter((l) => l.repliedAt).length,
        unsubscribed: leads.filter((l) => l.unsubscribedAt).length,
        suppressed: suppression.all().length,
        skipped: by('skipped'),
        failed: by('failed'),
      });
      break;
    }

    default:
      console.log(`Usage:
  npm run run:once -- --limit 5    Pipeline: discover → demo → outreach
  npm run serve                    Host demos + unsubscribe page (long-running)
  npm run followup -- [--force]    Send due follow-ups (--force ignores delay)
  npm run check-replies            Scan inbox; mark replies, honor opt-outs
  npm run list / npm run stats     Inspect leads
  npm start -- suppress <email>    Add an address to the do-not-contact list
  npm run schedule                 Run everything on a daily schedule`);
  }
}

main().catch((err) => {
  log.error(err.stack ?? String(err));
  process.exit(1);
});
