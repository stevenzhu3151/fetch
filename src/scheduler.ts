import cron from 'node-cron';
import { config } from './config.js';
import { log } from './logger.js';
import { runPipeline } from './pipeline.js';
import { runFollowUps } from './outreach/followup.js';
import { checkReplies } from './inbox/imap.js';
import { startServer } from './server.js';

/**
 * All-in-one daemon: hosts demos + unsubscribe page AND runs the daily jobs.
 * Keep alive with pm2/systemd/Docker.
 *   - SCHEDULE_CRON   daily discovery+outreach run (default 09:00)
 *   - FOLLOWUP_CRON   daily follow-up pass (default 10:00)
 *   - REPLIES_CRON    inbox scan for replies/opt-outs (default every 30 min)
 */
const runCron = process.env.SCHEDULE_CRON ?? '0 9 * * *';
const followCron = process.env.FOLLOWUP_CRON ?? '0 10 * * *';
const repliesCron = process.env.REPLIES_CRON ?? '*/30 * * * *';

for (const [name, expr] of [
  ['SCHEDULE_CRON', runCron],
  ['FOLLOWUP_CRON', followCron],
  ['REPLIES_CRON', repliesCron],
] as const) {
  if (!cron.validate(expr)) {
    log.error(`Invalid ${name}: "${expr}"`);
    process.exit(1);
  }
}

startServer();

cron.schedule(runCron, async () => {
  log.step('⏰ Daily discovery + outreach run');
  try {
    console.table(await runPipeline(config.dailyLimit));
  } catch (err) {
    log.error(`Run failed: ${(err as Error).message}`);
  }
});

cron.schedule(followCron, async () => {
  log.step('⏰ Follow-up pass');
  try {
    const r = await runFollowUps();
    log.ok(`Follow-ups: ${r.sent}/${r.checked}`);
  } catch (err) {
    log.error(`Follow-up failed: ${(err as Error).message}`);
  }
});

if (config.imap.enabled) {
  cron.schedule(repliesCron, async () => {
    try {
      await checkReplies();
    } catch (err) {
      log.error(`Reply check failed: ${(err as Error).message}`);
    }
  });
}

log.info(
  `Scheduler armed — run="${runCron}", followup="${followCron}", ` +
    `replies="${config.imap.enabled ? repliesCron : 'disabled'}", ${config.dailyLimit} leads/day.`,
);
