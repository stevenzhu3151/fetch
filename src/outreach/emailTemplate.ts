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
  const reason = lead.needReasons?.[0] ?? 'a fresher, more modern look';
  const { businessName, calendarUrl } = config.sender;
  const { introPrice, marketPrice, monthly } = config.offer;
  const foot = footer(lead.email!);

  const subject = `A free website concept we made for ${lead.name}`;

  const text = `Hi ${lead.name} team,

My name's from ${businessName} — we're a small web design studio (a startup, honestly), and we're building our portfolio with a handful of standout local businesses.

We came across ${lead.name} and felt your site could use ${reason}, so rather than just pitch you, we went ahead and designed a free concept site for you. Here it is, no strings attached:

${demoLink}

To be clear: this is just a quick concept to show direction. If you'd like to move forward, we build you a fully custom, polished production site — your real photos, menu, hours, online booking, Google/SEO setup, the works — far beyond what this preview shows.

Because we're young and growing, our intro pricing is well below market:
  • Complete custom website: ${introPrice} (comparable studios charge ${marketPrice})
  • Optional hosting, updates & support: ${monthly}

If the concept resonates, just reply and we'll take it from there — or grab 15 minutes here: ${calendarUrl}

Either way, the concept is yours to keep. Thanks for the great work you do locally.

Warm regards,
The ${businessName} team${foot.text}`;

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1c1c1c;line-height:1.65;">
  <p>Hi ${escapeHtml(lead.name)} team,</p>
  <p>My name's from <b>${escapeHtml(businessName)}</b> — we're a small web design studio (a startup, honestly), and we're building our portfolio with a handful of standout local businesses.</p>
  <p>We came across <b>${escapeHtml(lead.name)}</b> and felt your site could use ${escapeHtml(reason)}, so rather than just pitch you, we went ahead and designed a <b>free concept site</b> for you. Here it is, no strings attached:</p>
  <p style="text-align:center;margin:28px 0;">
    <a href="${escapeAttr(lead.demoUrl ?? '#')}" style="background:#e08a3c;color:#111;font-weight:700;padding:14px 30px;border-radius:8px;text-decoration:none;font-size:16px;">👀 View your free concept site</a>
  </p>
  <p>To be clear: this is just a quick concept to show direction. If you'd like to move forward, we build you a <b>fully custom, polished production site</b> — your real photos, menu, hours, online booking, Google/SEO setup, the works — far beyond what this preview shows.</p>
  <p>Because we're young and growing, our intro pricing is <b>well below market</b>:</p>
  <ul style="line-height:1.8;">
    <li>Complete custom website: <b>${escapeHtml(introPrice)}</b> <span style="color:#888;">(comparable studios charge ${escapeHtml(marketPrice)})</span></li>
    <li>Optional hosting, updates &amp; support: <b>${escapeHtml(monthly)}</b></li>
  </ul>
  <p>If the concept resonates, just reply and we'll take it from there — or <a href="${escapeAttr(calendarUrl)}">grab 15 minutes here</a>.</p>
  <p>Either way, the concept is yours to keep. Thanks for the great work you do locally.</p>
  <p>Warm regards,<br/>The ${escapeHtml(businessName)} team</p>
  ${foot.html}
  ${trackingPixel(lead)}
</div>`;

  return { subject, text, html };
}
