import type { Lead, DemoCopy } from '../types.js';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Render a responsive single-page demo site for a lead. Pure string template. */
export function renderDemo(lead: Lead, copy: DemoCopy): string {
  const services = copy.services
    .map(
      (s) => `
      <div class="card">
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.description)}</p>
      </div>`,
    )
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(lead.name)} — ${esc(lead.category)}</title>
<style>
  :root { --primary: ${copy.primaryColor}; --accent: ${copy.accentColor}; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #1c1c1c; line-height: 1.6; }
  .demo-banner { background: #111; color: #fff; text-align: center; padding: 8px; font-size: 13px; }
  .demo-banner b { color: var(--accent); }
  header { background: var(--primary); color: #fff; padding: 80px 20px; text-align: center; }
  header h1 { font-size: clamp(28px, 5vw, 48px); }
  header p { font-size: clamp(16px, 2.5vw, 22px); opacity: .9; margin-top: 12px; }
  .btn { display: inline-block; margin-top: 24px; background: var(--accent); color: #111; font-weight: 700;
         padding: 12px 28px; border-radius: 8px; text-decoration: none; }
  section { max-width: 960px; margin: 0 auto; padding: 56px 20px; }
  section h2 { color: var(--primary); font-size: 28px; margin-bottom: 20px; text-align: center; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; }
  .card { border: 1px solid #eee; border-radius: 12px; padding: 24px; box-shadow: 0 4px 14px rgba(0,0,0,.05); }
  .card h3 { color: var(--accent); margin-bottom: 8px; }
  .contact { background: #f7f7f7; text-align: center; }
  .contact p { margin: 4px 0; }
  footer { background: var(--primary); color: #fff; text-align: center; padding: 24px; font-size: 14px; }
</style>
</head>
<body>
  <div class="demo-banner">✨ This is a <b>free concept site</b> we built for ${esc(lead.name)}. Like it? Let's make it real.</div>

  <header>
    <h1>${esc(lead.name)}</h1>
    <p>${esc(copy.tagline)}</p>
    <a class="btn" href="#contact">Visit Us</a>
  </header>

  <section>
    <h2>About Us</h2>
    <p style="text-align:center; max-width:680px; margin:0 auto;">${esc(copy.about)}</p>
  </section>

  <section>
    <h2>What We Offer</h2>
    <div class="grid">${services}
    </div>
  </section>

  <section class="contact" id="contact">
    <h2>Find Us</h2>
    ${lead.address ? `<p>📍 ${esc(lead.address)}</p>` : ''}
    ${lead.phone ? `<p>📞 ${esc(lead.phone)}</p>` : ''}
    ${lead.rating ? `<p>⭐ ${lead.rating} rating from happy customers</p>` : ''}
  </section>

  <footer>
    <p>© ${new Date().getFullYear()} ${esc(lead.name)}. Demo concept design.</p>
  </footer>
</body>
</html>`;
}
