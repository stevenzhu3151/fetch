import type { Lead } from '../types.js';
import { config } from '../config.js';
import { unsubscribeUrl } from '../suppression.js';

export interface ComposedEmail {
  subject: string;
  text: string;
  html: string;
}

export const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const escapeAttr = (s: string) => escapeHtml(s).replace(/"/g, '&quot;');

/** CAN-SPAM-required footer: real postal address + per-recipient unsubscribe. */
export function footer(email: string): { text: string; html: string } {
  const { businessName, physicalAddress } = config.sender;
  const unsub = unsubscribeUrl(email);
  return {
    text: `\n\n---\n${businessName} · ${physicalAddress}\nDon't want these emails? Unsubscribe: ${unsub}`,
    html: `<hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
  <p style="font-size:12px;color:#888;">
    ${escapeHtml(businessName)} · ${escapeHtml(physicalAddress)}<br/>
    Don't want these emails? <a href="${escapeAttr(unsub)}" style="color:#888;">Unsubscribe</a>.
  </p>`,
  };
}

/** Optional open-tracking pixel (only meaningful once the server is hosted). */
function trackingPixel(lead: Lead): string {
  return `<img src="${escapeAttr(config.server.baseUrl)}/t/o/${encodeURIComponent(lead.id)}.gif" width="1" height="1" alt="" style="display:none"/>`;
}

/** The first-touch outreach email: demo link + offer + clear next step. */
export function composeInitial(lead: Lead): ComposedEmail {
  const demoLink = lead.demoUrl ?? '(host the demo and set PUBLIC_BASE_URL/DEMO_BASE_URL)';
  const reason = lead.needReasons?.[0] ?? 'a fresh, modern look';
  const { businessName, calendarUrl } = config.sender;
  const foot = footer(lead.email!);

  const subject = `A free website concept for ${lead.name}`;

  const text = `Hi ${lead.name} team,

I'm an independent web designer in the area. I came across ${lead.name} and noticed your online presence could use ${reason} — so I went ahead and built you a free concept site to show what's possible:

${demoLink}

No obligation at all — it's yours to look at. If you like it, I can have a polished version live for you quickly. My intro offer for local businesses is a complete, mobile-friendly site with everything set up.

Want to chat for 15 minutes? Grab a time here: ${calendarUrl}
Or just reply to this email.

Cheers,
${businessName}${foot.text}`;

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1c1c1c;line-height:1.6;">
  <p>Hi ${escapeHtml(lead.name)} team,</p>
  <p>I'm an independent web designer in the area. I came across <b>${escapeHtml(lead.name)}</b> and noticed your online presence could use ${escapeHtml(reason)} — so I went ahead and built you a <b>free concept site</b> to show what's possible:</p>
  <p style="text-align:center;margin:28px 0;">
    <a href="${escapeAttr(lead.demoUrl ?? '#')}" style="background:#e08a3c;color:#111;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;">👀 View your free concept site</a>
  </p>
  <p>No obligation at all — it's yours to look at. If you like it, I can have a polished version live for you quickly. My intro offer for local businesses is a complete, mobile-friendly site with everything set up.</p>
  <p>Want to chat for 15 minutes? <a href="${escapeAttr(calendarUrl)}">Grab a time here</a>, or just reply to this email.</p>
  <p>Cheers,<br/>${escapeHtml(businessName)}</p>
  ${foot.html}
  ${trackingPixel(lead)}
</div>`;

  return { subject, text, html };
}
