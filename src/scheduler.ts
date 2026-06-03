import cron from 'node-cron';
import { config } from './config.js';
import { log } from './logger.js';
import { runPipeline } from './pipeline.js';

/**
 * Daily scheduler. Runs the pipeline once per day at SCHEDULE_CRON
 * (default 09:00 server time). Keep this process alive (pm2/systemd/Docker).
 */
const schedule = process.env.SCHEDULE_CRON ?? '0 9 * * *';

if (!cron.validate(schedule)) {
  log.error(`Invalid SCHEDULE_CRON: "${schedule}"`);
  process.exit(1);
}

log.info(`Scheduler armed: "${schedule}" — ${config.dailyLimit} leads/day. Waiting…`);

cron.schedule(schedule, async () => {
  log.step('⏰ Daily run triggered');
  try {
    const s = await runPipeline(config.dailyLimit);
    console.table(s);
  } catch (err) {
    log.error(`Daily run failed: ${(err as Error).message}`);
  }
});
