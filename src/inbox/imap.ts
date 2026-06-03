import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { config } from '../config.js';
import { log } from '../logger.js';
import { LeadStore } from '../db.js';
import { suppression } from '../suppression.js';

const UNSUB_INTENT = /\b(unsubscribe|stop|remove me|opt[- ]?out|take me off)\b/i;

/**
 * Scan the inbox for replies and reconcile them with leads:
 *  - a reply from a lead's address  → mark the lead 'replied' (stops follow-ups),
 *  - a reply that asks to opt out    → add the address to the suppression list.
 * Matches by sender email; cheap and reliable for cold outreach.
 */
export async function checkReplies(sinceDays = 14): Promise<{ replies: number; optOuts: number }> {
  if (!config.imap.enabled) {
    log.warn('IMAP disabled (set IMAP_ENABLED=true and IMAP_* creds) — skipping reply check.');
    return { replies: 0, optOuts: 0 };
  }

  const store = new LeadStore();
  // Index leads by their contact email for O(1) reply matching.
  const byEmail = new Map<string, ReturnType<LeadStore['get']>>();
  for (const l of store.all()) if (l.email) byEmail.set(l.email.toLowerCase(), l);

  const client = new ImapFlow({
    host: config.imap.host,
    port: config.imap.port,
    secure: config.imap.secure,
    auth: { user: config.imap.user, pass: config.imap.pass },
    logger: false,
  });

  let replies = 0;
  let optOuts = 0;

  await client.connect();
  const lock = await client.getMailboxLock('INBOX');
  try {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    for await (const msg of client.fetch({ since }, { envelope: true, source: true })) {
      const from = msg.envelope?.from?.[0]?.address?.toLowerCase();
      if (!from) continue;

      const lead = byEmail.get(from);
      if (!lead) continue; // not from anyone we contacted

      if (!lead.repliedAt) {
        store.upsert({ id: lead.id, emailStatus: 'replied', repliedAt: new Date().toISOString() });
        replies++;
        log.ok(`Reply from ${lead.name} <${from}> — marked replied`);
      }

      // Honor opt-out requests sent as a reply.
      const parsed = await simpleParser(msg.source as Buffer);
      const body = `${parsed.subject ?? ''}\n${parsed.text ?? ''}`;
      if (UNSUB_INTENT.test(body) && !suppression.isSuppressed(from)) {
        suppression.add(from, 'reply-optout');
        store.upsert({ id: lead.id, unsubscribedAt: new Date().toISOString() });
        optOuts++;
        log.warn(`Opt-out reply from ${from} — suppressed`);
      }
    }
  } finally {
    lock.release();
    await client.logout();
  }

  log.info(`Reply check done: ${replies} new replies, ${optOuts} opt-outs.`);
  return { replies, optOuts };
}
