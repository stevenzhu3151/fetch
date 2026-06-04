import type { Lead, DemoCopy } from '../types.js';
import { config } from '../config.js';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const ICONS = ['✦', '❖', '✧', '◆', '✺', '❉'];

/** Render a polished, responsive single-page demo site for a lead. */
export function renderDemo(lead: Lead, copy: DemoCopy): string {
  const studio = esc(config.sender.businessName);
  const year = new Date().getFullYear();

  const services = copy.services
    .map(
      (s, i) => `
        <div class="card reveal">
          <div class="card-icon">${ICONS[i % ICONS.length]}</div>
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.description)}</p>
        </div>`,
    )
    .join('');

  // Placeholder gallery tiles (the production build uses the client's real photos).
  const gallery = [0, 1, 2, 3]
    .map(
      (i) => `<div class="tile reveal" style="--i:${i}"><span>Your photo here</span></div>`,
    )
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(lead.name)} — ${esc(lead.category)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@600;700;800&display=swap" rel="stylesheet" />
<style>
  :root { --primary: ${copy.primaryColor}; --accent: ${copy.accentColor}; --ink:#1a1a1a; --muted:#6b6b6b; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { font-family: 'Inter', -apple-system, Segoe UI, Roboto, sans-serif; color: var(--ink); line-height: 1.7; -webkit-font-smoothing: antialiased; }
  h1,h2,h3 { font-family: 'Playfair Display', Georgia, serif; line-height: 1.15; }
  a { color: inherit; }

  .demo-banner { background:#111; color:#fff; text-align:center; padding:10px 16px; font-size:13px; position:relative; z-index:50; }
  .demo-banner b { color: var(--accent); }

  /* Nav */
  nav { position: sticky; top: 0; z-index: 40; display:flex; align-items:center; justify-content:space-between;
        padding: 16px 28px; backdrop-filter: blur(10px); background: rgba(255,255,255,.82); border-bottom:1px solid #eee; }
  nav .brand { font-family:'Playfair Display',serif; font-weight:800; font-size:20px; color:var(--primary); }
  nav .links a { margin-left: 22px; text-decoration:none; font-size:14px; font-weight:500; color:var(--ink); }
  nav .links a:hover { color: var(--accent); }
  @media (max-width:640px){ nav .links { display:none; } }

  /* Hero */
  .hero { position:relative; min-height: 86vh; display:flex; align-items:center; justify-content:center; text-align:center;
          padding: 100px 20px; color:#fff; overflow:hidden;
          background: radial-gradient(circle at 78% 18%, ${copy.accentColor}55, transparent 46%), linear-gradient(155deg, var(--primary), #121212); }
  .hero-inner { max-width: 760px; }
  .hero .eyebrow { text-transform:uppercase; letter-spacing:.28em; font-size:12px; opacity:.85; margin-bottom:18px; }
  .hero h1 { font-size: clamp(34px, 6vw, 66px); font-weight:800; }
  .hero p { font-size: clamp(16px, 2.4vw, 22px); opacity:.92; margin: 20px auto 0; max-width:560px; }
  .cta { display:inline-flex; gap:14px; flex-wrap:wrap; justify-content:center; margin-top:34px; }
  .btn { display:inline-block; padding:14px 30px; border-radius:999px; text-decoration:none; font-weight:600; font-size:15px; transition:transform .15s ease; }
  .btn:hover { transform: translateY(-2px); }
  .btn-primary { background: var(--accent); color:#111; }
  .btn-ghost { border:1.5px solid rgba(255,255,255,.6); color:#fff; }

  section { max-width: 1040px; margin: 0 auto; padding: 84px 24px; }
  .eyebrow-d { text-transform:uppercase; letter-spacing:.22em; font-size:12px; color:var(--accent); font-weight:600; text-align:center; }
  section h2 { color: var(--primary); font-size: clamp(26px,4vw,38px); margin:10px 0 14px; text-align:center; }
  .lead { text-align:center; max-width:660px; margin:0 auto; color:var(--muted); font-size:18px; }

  /* About split */
  .about { display:grid; grid-template-columns: 1.1fr 1fr; gap:48px; align-items:center; }
  .about .art { height:320px; border-radius:18px; background: linear-gradient(135deg, var(--primary), var(--accent)); box-shadow:0 20px 50px rgba(0,0,0,.18); }
  @media (max-width:760px){ .about { grid-template-columns:1fr; } .about .art{ height:200px; } }

  /* Cards */
  .grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(240px,1fr)); gap:24px; margin-top:46px; }
  .card { border:1px solid #eee; border-radius:18px; padding:32px 26px; text-align:center; transition:transform .2s ease, box-shadow .2s ease; background:#fff; }
  .card:hover { transform: translateY(-6px); box-shadow:0 18px 40px rgba(0,0,0,.08); }
  .card-icon { width:56px; height:56px; margin:0 auto 16px; border-radius:50%; display:grid; place-items:center; font-size:22px; color:#fff; background: linear-gradient(135deg, var(--primary), var(--accent)); }
  .card h3 { font-size:20px; margin-bottom:8px; }
  .card p { color:var(--muted); font-size:15px; }

  /* Gallery */
  .gallery { background:#faf8f6; }
  .tiles { display:grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap:16px; margin-top:44px; }
  .tile { height:200px; border-radius:14px; display:grid; place-items:center; color:rgba(255,255,255,.85); font-size:13px; letter-spacing:.05em;
          background: linear-gradient(${'135'}deg, var(--primary), var(--accent)); filter:saturate(.9); }
  .tile:nth-child(even){ background: linear-gradient(45deg, var(--accent), var(--primary)); }

  /* Testimonial */
  .quote { text-align:center; }
  .quote .stars { color: var(--accent); font-size:22px; letter-spacing:4px; }
  .quote blockquote { font-family:'Playfair Display',serif; font-size: clamp(22px,3.4vw,32px); color:var(--primary); max-width:760px; margin:18px auto 0; font-style:italic; }

  /* Contact + hours */
  .info { display:grid; grid-template-columns:1fr 1fr; gap:40px; }
  .info .box { background:#fff; border:1px solid #eee; border-radius:18px; padding:30px; }
  .info h3 { color:var(--primary); font-size:20px; margin-bottom:14px; }
  .info p, .info li { color:var(--muted); }
  .hours li { display:flex; justify-content:space-between; list-style:none; padding:6px 0; border-bottom:1px dashed #eee; }
  @media (max-width:680px){ .info{ grid-template-columns:1fr; } }

  /* CTA band */
  .band { background: linear-gradient(150deg, var(--primary), #121212); color:#fff; text-align:center; }
  .band h2 { color:#fff; }
  .band p { opacity:.9; max-width:560px; margin:10px auto 0; }

  footer { background:#111; color:#bbb; text-align:center; padding:34px 20px; font-size:13px; }
  footer b { color:#fff; }

  .reveal { opacity:0; transform: translateY(20px); transition: opacity .6s ease, transform .6s ease; }
  .reveal.in { opacity:1; transform:none; }
</style>
</head>
<body>
  <div class="demo-banner">✨ Free concept site designed for <b>${esc(lead.name)}</b> by ${studio}. Like it? We'll build the real thing.</div>

  <nav>
    <div class="brand">${esc(lead.name)}</div>
    <div class="links">
      <a href="#about">About</a>
      <a href="#offer">Offerings</a>
      <a href="#gallery">Gallery</a>
      <a href="#visit">Visit</a>
    </div>
  </nav>

  <header class="hero">
    <div class="hero-inner reveal">
      <div class="eyebrow">${esc(lead.category)}</div>
      <h1>${esc(lead.name)}</h1>
      <p>${esc(copy.tagline)}</p>
      <div class="cta">
        <a class="btn btn-primary" href="#visit">Visit Us</a>
        <a class="btn btn-ghost" href="#offer">See What We Offer</a>
      </div>
    </div>
  </header>

  <section id="about" class="about">
    <div class="reveal">
      <div class="eyebrow-d" style="text-align:left">Our Story</div>
      <h2 style="text-align:left">About ${esc(lead.name)}</h2>
      <p style="color:var(--muted);font-size:17px;">${esc(copy.about)}</p>
    </div>
    <div class="art reveal"></div>
  </section>

  <section id="offer">
    <div class="eyebrow-d">What We Do</div>
    <h2>Why People Love Us</h2>
    <p class="lead">A few of the things that keep our regulars coming back.</p>
    <div class="grid">${services}
    </div>
  </section>

  <section id="gallery" class="gallery" style="max-width:none;">
    <div style="max-width:1040px;margin:0 auto;">
      <div class="eyebrow-d">A Look Inside</div>
      <h2>Gallery</h2>
      <p class="lead">In the full site, these become your real photos.</p>
      <div class="tiles">${gallery}
      </div>
    </div>
  </section>

  <section class="quote reveal">
    <div class="stars">★★★★★</div>
    <blockquote>"Honestly the best ${esc(lead.category)} around — friendly, consistent, and always worth the trip."</blockquote>
    <p style="color:var(--muted);margin-top:14px;">— a happy local customer</p>
  </section>

  <section id="visit" class="info">
    <div class="box reveal">
      <h3>Find Us</h3>
      ${lead.address ? `<p>📍 ${esc(lead.address)}</p>` : ''}
      ${lead.phone ? `<p style="margin-top:8px;">📞 ${esc(lead.phone)}</p>` : ''}
      ${lead.rating ? `<p style="margin-top:8px;">⭐ ${lead.rating} average rating</p>` : ''}
    </div>
    <div class="box hours reveal">
      <h3>Hours</h3>
      <ul style="padding:0;margin:0;">
        <li><span>Mon – Fri</span><span>8:00 – 18:00</span></li>
        <li><span>Saturday</span><span>9:00 – 17:00</span></li>
        <li><span>Sunday</span><span>10:00 – 16:00</span></li>
      </ul>
    </div>
  </section>

  <section class="band" style="max-width:none;">
    <div style="max-width:760px;margin:0 auto;">
      <h2>Come Say Hello</h2>
      <p>We'd love to see you. Stop by, give us a call, or follow along for what's new.</p>
      <div class="cta">${lead.phone ? `<a class="btn btn-primary" href="tel:${esc(lead.phone)}">Call Us</a>` : ''}</div>
    </div>
  </section>

  <footer>
    <p>© ${year} <b>${esc(lead.name)}</b>. &nbsp;·&nbsp; Concept design by ${studio}.</p>
  </footer>

  <script>
    // Subtle scroll-reveal for a premium feel.
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  </script>
</body>
</html>`;
}
