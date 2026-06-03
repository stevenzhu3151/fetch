# leadgen-fetch

An automated daily pipeline that finds local US businesses (cafés, restaurants,
bakeries, boutiques, barbers…) whose website is **missing, broken, or outdated**,
builds a **free demo website** for each, and sends a **compliant outreach email**
offering to make it real.

```
discover → de-dupe → score website → find email → build demo → send outreach
```

Built with Node.js + TypeScript. Modular, so each stage can be swapped or scaled
independently.

---

## ⚠️ Read this first — legal & deliverability

This tool sends cold B2B email. That is **legal in the US under CAN-SPAM**, but
only if you follow the rules. The pipeline is built to help you comply, but
**you** are responsible:

- ✅ **Real physical postal address** in every email — set `SENDER_ADDRESS`.
- ✅ **Working unsubscribe link**, honored within 10 days — set `UNSUBSCRIBE_URL`
  and actually build that page.
- ✅ **No deceptive subject lines / "From" names** — the templates are honest.
- ⛔ **Don't target the EU/UK/Canada** with this without consent — GDPR/ePrivacy
  and CASL are much stricter (often opt-in only). This project defaults to the US.
- 📉 **Deliverability:** a new domain blasting 100 cold emails/day gets blacklisted
  fast. Before sending for real:
  - Use a **separate domain** (not your main one), with **SPF + DKIM + DMARC**.
  - **Warm it up** for 2–4 weeks (ramp from ~10/day).
  - Consider a sending provider (Resend, Postmark, Amazon SES) over raw SMTP.

The pipeline **defaults to DRY-RUN** — it writes every email to `data/outbox/`
instead of sending, so nothing goes out until you consciously flip the switch.

---

## Quick start

```bash
npm install
cp .env.example .env       # all defaults are safe; works with zero keys
npm run run:once -- --limit 5
```

With no API keys, it runs on **built-in sample businesses** and saves demo sites
+ dry-run emails locally. Open them:

- Demos → `data/demos/<id>/index.html`
- Emails → `data/outbox/<id>.html`

Then inspect results:

```bash
npm run list     # table of all leads
npm run stats    # counts by status
```

---

## Going live

1. **Get a Google Places API key** → set `GOOGLE_PLACES_API_KEY`. Tune
   `SEARCH_QUERIES` and `SEARCH_LOCATION`.
2. **(Optional) Anthropic key** for AI-written copy → `ANTHROPIC_API_KEY`.
   Without it, tasteful per-category templates are used (zero AI cost).
3. **Host the demos** somewhere public (Netlify drop, S3, a cheap VPS) and set
   `DEMO_BASE_URL` so the email can link to each demo.
4. **Configure email**: `SMTP_*`, `EMAIL_FROM`, and the CAN-SPAM fields.
5. **Flip the switch**: `DRY_RUN=false` and `EMAIL_ENABLED=true`.
6. **Schedule it**: `npm run schedule` (daily cron; keep alive with pm2/systemd/Docker).

---

## Project layout

```
src/
  config.ts            env-driven config (safe defaults)
  pipeline.ts          orchestrator — one full pass
  cli.ts               run / list / stats commands
  scheduler.ts         daily cron runner
  db.ts                JSON lead store (swap for SQLite/Postgres later)
  sources/             discovery: Google Places (+ sample fallback)
  enrich/              websiteCheck (need score) + emailFinder
  demo/                ai (copy) + template (HTML) + generator
  outreach/            emailTemplate (CAN-SPAM) + sender (SMTP/dry-run)
```

## How "needs a website" is scored

`enrich/websiteCheck.ts` gives each business a 0–100 score (lower = more in need):
no website at all = top priority; otherwise it fetches the page and penalizes
no mobile viewport, no HTTPS, thin content, an outdated copyright year, or only a
social-media page. Score < 60 → it becomes a target.

## Roadmap ideas

- Reply detection + automated follow-up sequence (IMAP/webhook).
- One-click demo hosting (auto-deploy each demo, unique URL).
- A/B subject lines + open/click tracking.
- CRM export, dedupe across runs, suppression list wired to unsubscribes.
- Richer demos (pull the business's real photos/menu).
