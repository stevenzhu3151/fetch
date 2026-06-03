import 'dotenv/config';

const bool = (v: string | undefined, def: boolean) =>
  v === undefined ? def : v.toLowerCase() === 'true';

const port = Number(process.env.PORT ?? 8787);
const baseUrl = (process.env.PUBLIC_BASE_URL ?? `http://localhost:${port}`).replace(/\/$/, '');

export const config = {
  market: process.env.MARKET ?? 'US',
  dailyLimit: Number(process.env.DAILY_LIMIT ?? 100),

  search: {
    queries: (process.env.SEARCH_QUERIES ?? 'coffee shop,restaurant,bakery,boutique')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    location: process.env.SEARCH_LOCATION ?? 'Austin, TX',
  },

  googlePlacesKey: process.env.GOOGLE_PLACES_API_KEY ?? '',

  ai: {
    key: process.env.ANTHROPIC_API_KEY ?? '',
    model: process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001',
  },

  // Built-in web server hosts demos + the unsubscribe page + open tracking.
  server: {
    port,
    baseUrl,
  },
  // Where demos are served from. Defaults to the built-in server (/d/<id>/),
  // but can point at Netlify/S3/etc. if you host them elsewhere.
  demoBaseUrl: (process.env.DEMO_BASE_URL ?? `${baseUrl}/d`).replace(/\/$/, ''),

  unsub: {
    // Used to sign per-recipient unsubscribe links so they can't be forged.
    secret: process.env.UNSUB_SECRET ?? 'change-me-in-production',
  },

  followup: {
    max: Number(process.env.FOLLOWUP_MAX ?? 2), // touches AFTER the first email
    delayDays: Number(process.env.FOLLOWUP_DELAY_DAYS ?? 3),
  },

  email: {
    dryRun: bool(process.env.DRY_RUN, true), // default DRY-RUN for safety
    enabled: bool(process.env.EMAIL_ENABLED, false),
    host: process.env.SMTP_HOST ?? '',
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.EMAIL_FROM ?? 'Your Name <you@example.com>',
    replyTo: process.env.EMAIL_REPLY_TO ?? '',
  },

  // IMAP inbox to scan for replies (so we stop chasing people who answered).
  imap: {
    enabled: bool(process.env.IMAP_ENABLED, false),
    host: process.env.IMAP_HOST ?? '',
    port: Number(process.env.IMAP_PORT ?? 993),
    secure: bool(process.env.IMAP_SECURE, true),
    user: process.env.IMAP_USER ?? '',
    pass: process.env.IMAP_PASS ?? '',
  },

  sender: {
    businessName: process.env.SENDER_BUSINESS_NAME ?? 'Acme Web Studio',
    physicalAddress:
      process.env.SENDER_ADDRESS ?? '123 Main St, Austin, TX 78701, USA',
    calendarUrl: process.env.CALENDAR_URL ?? 'https://calendly.com/you/15min',
  },
};

export type Config = typeof config;
