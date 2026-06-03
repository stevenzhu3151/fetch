import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import nodemailer from 'nodemailer';
import type { Lead, EmailStatus } from '../types.js';
import { config } from '../config.js';
import { log } from '../logger.js';
import { composeEmail } from './emailTemplate.js';

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
 * Send (or, in dry-run, save) the outreach email for a lead.
 *
 * Safety: defaults to DRY-RUN, which writes the rendered email to data/outbox/
 * so you can review every message before a single one is actually sent.
 */
export async function sendOutreach(lead: Lead): Promise<SendResult> {
  if (!lead.email) return { status: 'skipped', subject: '' };

  const email = composeEmail(lead);

  // DRY-RUN: write to outbox instead of sending.
  if (config.email.dryRun || !config.email.enabled) {
    const dir = join('data', 'outbox');
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, `${lead.id}.html`),
      `<!-- To: ${lead.email} | Subject: ${email.subject} -->\n${email.html}`,
    );
    log.info(`  ↳ [dry-run] email for ${lead.name} saved to outbox (would send to ${lead.email})`);
    return { status: 'dryrun', subject: email.subject };
  }

  try {
    await getTransport().sendMail({
      from: config.email.from,
      to: lead.email,
      replyTo: config.email.replyTo || undefined,
      subject: email.subject,
      text: email.text,
      html: email.html,
      headers: {
        // One-click unsubscribe header — strongly recommended for deliverability.
        'List-Unsubscribe': `<${config.sender.unsubscribeUrl}>`,
      },
    });
    log.ok(`  ↳ email sent to ${lead.email}`);
    return { status: 'sent', subject: email.subject };
  } catch (err) {
    log.error(`  ↳ send failed for ${lead.email}: ${(err as Error).message}`);
    return { status: 'failed', subject: email.subject };
  }
}
