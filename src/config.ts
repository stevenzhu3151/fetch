import 'dotenv/config';

const bool = (v: string | undefined, def: boolean) =>
  v === undefined ? def : v.toLowerCase() === 'true';

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

  demoBaseUrl: (process.env.DEMO_BASE_URL ?? '').replace(/\/$/, ''),

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

  sender: {
    businessName: process.env.SENDER_BUSINESS_NAME ?? 'Acme Web Studio',
    physicalAddress:
      process.env.SENDER_ADDRESS ?? '123 Main St, Austin, TX 78701, USA',
    unsubscribeUrl: process.env.UNSUBSCRIBE_URL ?? 'https://example.com/unsubscribe',
    calendarUrl: process.env.CALENDAR_URL ?? 'https://calendly.com/you/15min',
  },
};

export type Config = typeof config;
