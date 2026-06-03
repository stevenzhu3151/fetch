import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import nodemailer from 'nodemailer';
import type { Lead, EmailStatus } from '../types.js';
import { config } from '../config.js';
import { log } from '../logger.js';
import { suppression, unsubscribeUrl } from '../suppression.js';
import { composeInitial, type ComposedEmail } from './emailTemplate.js';

export interface SendResult {
  status: EmailStatus;
  subject: string;
}

let transporter: nodemailer.Transporter | null = null;
function getTransport() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: { user: config.email.user, pass: config.email.pass },
    });
  }
  return transporter;
}

/**
 * Deliver a composed email to a lead. The single choke point for sending:
 *   1. never sends to a suppressed/unsubscribed address,
 *   2. in DRY-RUN, writes the message to data/outbox/ for review,
 *   3. otherwise sends via SMTP with a per-recipient one-click unsubscribe header.
 * `tag` distinguishes outbox files (e.g. "followup1").
 */
export async function deliver(
  lead: Lead,
  email: ComposedEmail,
  tag = 'initial',
): Promise<SendResult> {
  if (!lead.email) return { status: 'skipped', subject: '' };

  if (suppression.isSuppressed(lead.email)) {
    log.warn(`  ↳ ${lead.email} is on the suppression list — not sending`);
    return { status: 'skipped', subject: email.subject };
  }

  if (config.email.dryRun || !config.email.enabled) {
    const dir = join('data', 'outbox');
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, `${lead.id}.${tag}.html`),
      `<!-- To: ${lead.email} | Subject: ${email.subject} -->\n${email.html}`,
    );
    log.info(`  ↳ [dry-run] ${tag} email for ${lead.name} → outbox (to ${lead.email})`);
    return { status: 'dryrun', subject: email.subject };
  }

  try {
    const unsub = unsubscribeUrl(lead.email);
    await getTransport().sendMail({
      from: config.email.from,
      to: lead.email,
      replyTo: config.email.replyTo || undefined,
      subject: email.subject,
      text: email.text,
      html: email.html,
      headers: {
        // RFC 8058 one-click unsubscribe — big deliverability win.
        'List-Unsubscribe': `<${unsub}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });
    log.ok(`  ↳ ${tag} email sent to ${lead.email}`);
    return { status: 'sent', subject: email.subject };
  } catch (err) {
    log.error(`  ↳ send failed for ${lead.email}: ${(err as Error).message}`);
    return { status: 'failed', subject: email.subject };
  }
}

/** Compose + deliver the first-touch outreach email. */
export async function sendOutreach(lead: Lead): Promise<SendResult> {
  if (!lead.email) return { status: 'skipped', subject: '' };
  return deliver(lead, composeInitial(lead), 'initial');
}
