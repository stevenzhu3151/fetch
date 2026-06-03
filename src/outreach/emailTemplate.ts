import type { Lead } from '../types.js';
import { config } from '../config.js';

export interface ComposedEmail {
  subject: string;
  text: string;
  html: string;
}

/**
 * Compose the outreach email. Includes the demo link, a concrete offer, a clear
 * next step, AND the CAN-SPAM-required physical address + unsubscribe link.
 */
export function composeEmail(lead: Lead): ComposedEmail {
  const demoLink = lead.demoUrl ?? '(demo link — host the generated file and set DEMO_BASE_URL)';
  const reason = lead.needReasons?.[0] ?? 'a fresh, modern look';
  const { businessName, physicalAddress, unsubscribeUrl, calendarUrl } = config.sender;

  const subject = `A free website concept for ${lead.name}`;

  const text = `Hi ${lead.name} team,

I'm an independent web designer in the area. I came across ${lead.name} and noticed your online presence could use ${reason} — so I went ahead and built you a free concept site to show what's possible:

${demoLink}

No obligation at all — it's yours to look at. If you like it, I can have a polished version live for you quickly. My intro offer for local businesses is a complete, mobile-friendly site with everything set up.

Want to chat for 15 minutes? Grab a time here: ${calendarUrl}
Or just reply to this email.

Cheers,
${businessName}

---
${businessName} · ${physicalAddress}
Don't want these emails? Unsubscribe: ${unsubscribeUrl}`;

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1c1c1c;line-height:1.6;">
  <p>Hi ${escapeHtml(lead.name)} team,</p>
  <p>I'm an independent web designer in the area. I came across <b>${escapeHtml(lead.name)}</b> and noticed your online presence could use ${escapeHtml(reason)} — so I went ahead and built you a <b>free concept site</b> to show what's possible:</p>
  <p style="text-align:center;margin:28px 0;">
    <a href="${escapeAttr(lead.demoUrl ?? '#')}" style="background:#e08a3c;color:#111;font-weight:700;padding:12px 28px;border-radius:8px;text-decoration:none;">👀 View your free concept site</a>
  </p>
  <p>No obligation at all — it's yours to look at. If you like it, I can have a polished version live for you quickly. My intro offer for local businesses is a complete, mobile-friendly site with everything set up.</p>
  <p>Want to chat for 15 minutes? <a href="${escapeAttr(calendarUrl)}">Grab a time here</a>, or just reply to this email.</p>
  <p>Cheers,<br/>${escapeHtml(businessName)}</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
  <p style="font-size:12px;color:#888;">
    ${escapeHtml(businessName)} · ${escapeHtml(physicalAddress)}<br/>
    Don't want these emails? <a href="${escapeAttr(unsubscribeUrl)}" style="color:#888;">Unsubscribe</a>.
  </p>
</div>`;

  return { subject, text, html };
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(s: string) {
  return escapeHtml(s).replace(/"/g, '&quot;');
}
