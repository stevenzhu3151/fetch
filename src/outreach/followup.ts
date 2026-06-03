import type { Lead } from '../types.js';
import { config } from '../config.js';
import { log } from '../logger.js';
import { LeadStore } from '../db.js';
import { suppression } from '../suppression.js';
import { type ComposedEmail, footer, escapeHtml, escapeAttr } from './emailTemplate.js';
import { deliver } from './sender.js';

/** Build the Nth follow-up (step 1 = first nudge). Kept short and polite. */
export function composeFollowUp(lead: Lead, step: number): ComposedEmail {
  const { businessName, calendarUrl } = config.sender;
  const foot = footer(lead.email!);
  const demoLink = lead.demoUrl ?? '(your concept site)';

  if (step >= 2) {
    const subject = `Closing the loop on ${lead.name}'s site`;
    const text = `Hi again,

I don't want to clutter your inbox, so this is my last note. The free concept site I built for ${lead.name} is still here if you'd like a look:

${demoLink}

If now's not the time, no worries at all — just reply and I'll close it out.

Cheers,
${businessName}${foot.text}`;
    const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1c1c1c;line-height:1.6;">
  <p>Hi again,</p>
  <p>I don't want to clutter your inbox, so this is my last note. The free concept site I built for <b>${escapeHtml(lead.name)}</b> is still here if you'd like a look:</p>
  <p style="text-align:center;margin:24px 0;"><a href="${escapeAttr(lead.demoUrl ?? '#')}" style="background:#e08a3c;color:#111;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;">👀 View it</a></p>
  <p>If now's not the time, no worries at all — just reply and I'll close it out.</p>
  <p>Cheers,<br/>${escapeHtml(businessName)}</p>
  ${foot.html}
</div>`;
    return { subject, text, html };
  }

  const subject = `Re: A free website concept for ${lead.name}`;
  const text = `Hi,

Just bumping this up in case it got buried — I built ${lead.name} a free website concept and wanted to make sure you saw it:

${demoLink}

Happy to tweak anything or hop on a quick 15-min call: ${calendarUrl}

Cheers,
${businessName}${foot.text}`;
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1c1c1c;line-height:1.6;">
  <p>Hi,</p>
  <p>Just bumping this up in case it got buried — I built <b>${escapeHtml(lead.name)}</b> a free website concept and wanted to make sure you saw it:</p>
  <p style="text-align:center;margin:24px 0;"><a href="${escapeAttr(lead.demoUrl ?? '#')}" style="background:#e08a3c;color:#111;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;">👀 View your concept site</a></p>
  <p>Happy to tweak anything or hop on a quick <a href="${escapeAttr(calendarUrl)}">15-min call</a>.</p>
  <p>Cheers,<br/>${escapeHtml(businessName)}</p>
  ${foot.html}
</div>`;
  return { subject, text, html };
}

/**
 * Find everyone we've contacted who hasn't replied/unsubscribed, whose last
 * touch is older than the configured delay, and send the next follow-up.
 * `force` ignores the delay (handy for testing).
 */
export async function runFollowUps(force = false): Promise<{ sent: number; checked: number }> {
  const store = new LeadStore();
  const now = Date.now();
  const delayMs = config.followup.delayDays * 24 * 60 * 60 * 1000;

  const due = store.query((l) => {
    const contacted = l.emailStatus === 'sent' || l.emailStatus === 'dryrun';
    if (!contacted) return false;
    if (l.repliedAt || l.unsubscribedAt) return false;
    if (l.email && suppression.isSuppressed(l.email)) return false;
    if ((l.followUpCount ?? 0) >= config.followup.max) return false;
    const last = l.lastContactedAt ? Date.parse(l.lastContactedAt) : 0;
    return force || now - last >= delayMs;
  });

  log.info(`Follow-ups due: ${due.length}`);
  let sent = 0;
  for (const lead of due) {
    const step = (lead.followUpCount ?? 0) + 1;
    const email = composeFollowUp(lead, step);
    const result = await deliver(lead, email, `followup${step}`);
    if (result.status === 'sent' || result.status === 'dryrun') {
      store.upsert({
        id: lead.id,
        followUpCount: step,
        lastContactedAt: new Date().toISOString(),
        emailStatus: result.status,
      });
      sent++;
      log.ok(`  ↳ follow-up #${step} → ${lead.name} (${result.status})`);
    }
  }
  return { sent, checked: due.length };
}
