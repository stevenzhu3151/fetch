# leadgen-fetch

An automated daily pipeline that finds local US businesses (cafés, restaurants,
bakeries, boutiques, barbers…) whose website is **missing, broken, or outdated**,
builds a **free demo website** for each, and sends a **compliant outreach email**
offering to make it real.

```
discover → de-dupe → score website → find email → build demo → send outreach
                                                         ↓
              host demo + unsubscribe page  ←  built-in web server
                                                         ↓
            follow-up sequence  ·  reply detection  ·  suppression list
```

Built with Node.js + TypeScript. Modular, so each stage can be swapped or scaled
independently. A built-in web server hosts every generated demo at a unique URL
and powers the one-click unsubscribe page.

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

Serve the demos + unsubscribe page (each demo gets a unique URL at `/d/<id>/`):

```bash
npm run serve            # http://localhost:8787
```

Then inspect results and run the rest of the lifecycle:

```bash
npm run list                  # table of all leads
npm run stats                 # counts by status (sent/replied/unsubscribed…)
npm run followup -- --force   # send the next follow-up (--force ignores the wait)
npm run check-replies         # scan inbox, mark replies, honor opt-out replies
npm start -- suppress a@b.com # manually add to the do-not-contact list
```

---

## Going live

1. **Get a Google Places API key** → set `GOOGLE_PLACES_API_KEY`. Tune
   `SEARCH_QUERIES` and `SEARCH_LOCATION`.
2. **(Optional) Anthropic key** for AI-written copy → `ANTHROPIC_API_KEY`.
   Without it, tasteful per-category templates are used (zero AI cost).
3. **Expose the server**: run `npm run serve` on a box with a public URL and set
   `PUBLIC_BASE_URL=https://leads.yourdomain.com`. Demos are then live at
   `<base>/d/<id>/` and the unsubscribe page at `<base>/u`. Set a strong
   `UNSUB_SECRET`. (Host demos elsewhere? set `DEMO_BASE_URL` instead.)
4. **Configure email**: `SMTP_*`, `EMAIL_FROM`, and the CAN-SPAM fields.
   For reply detection, also set `IMAP_ENABLED=true` + `IMAP_*`.
5. **Flip the switch**: `DRY_RUN=false` and `EMAIL_ENABLED=true`.
6. **Schedule it**: `npm run schedule` — one daemon that hosts the server AND
   runs the daily discovery, the follow-up pass, and inbox scans on cron
   (`SCHEDULE_CRON` / `FOLLOWUP_CRON` / `REPLIES_CRON`). Keep alive with
   pm2/systemd/Docker.

### The full lifecycle, automated

- **Hosting** — every demo is instantly live at a unique, unguessable URL.
- **Follow-ups** — `FOLLOWUP_MAX` polite nudges, `FOLLOWUP_DELAY_DAYS` apart,
  automatically stopped once someone replies or unsubscribes.
- **Reply detection** — IMAP scan marks leads `replied` (so they drop out of the
  follow-up queue) and auto-suppresses anyone who replies "unsubscribe/stop".
- **Suppression list** — the authoritative do-not-contact gate, checked before
  every send. Fed by the unsubscribe page (signed, per-recipient links),
  opt-out replies, and manual `suppress` commands.

---

## Project layout

```
src/
  config.ts            env-driven config (safe defaults)
  pipeline.ts          orchestrator — one full pass
  cli.ts               run / serve / followup / check-replies / list / stats
  scheduler.ts         all-in-one daemon: server + daily cron jobs
  server.ts            hosts demos (/d/<id>/), unsubscribe (/u), open pixel
  suppression.ts       do-not-contact list + signed unsubscribe tokens
  db.ts                JSON lead store (swap for SQLite/Postgres later)
  sources/             discovery: Google Places (+ sample fallback)
  enrich/              websiteCheck (need score) + emailFinder
  demo/                ai (copy) + template (HTML) + generator
  outreach/            emailTemplate (CAN-SPAM) + sender + followup sequence
  inbox/               imap reply detection + opt-out handling
```

## How "needs a website" is scored

`enrich/websiteCheck.ts` gives each business a 0–100 score (lower = more in need):
no website at all = top priority; otherwise it fetches the page and penalizes
no mobile viewport, no HTTPS, thin content, an outdated copyright year, or only a
social-media page. Score < 60 → it becomes a target.

## Roadmap ideas

Done: ✅ demo hosting · ✅ follow-up sequence · ✅ reply detection ·
✅ suppression list wired to unsubscribes · ✅ open tracking.

Next:

- A/B subject lines + click tracking + open-rate reporting.
- Richer demos (pull the business's real photos/menu/hours).
- Move the JSON store to SQLite/Postgres for concurrent server + cron access.
- CRM export / webhook on reply.
- Per-domain send throttling + automatic warm-up ramp.
