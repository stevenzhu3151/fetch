import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from './config.js';

interface SuppressionEntry {
  reason: string;
  at: string;
}

/**
 * The do-not-contact list. This is the authoritative gate before any send.
 * Reads fresh from disk on every check so the web server (a separate process)
 * can add an unsubscribe and have the pipeline honor it immediately.
 */
class SuppressionStore {
  constructor(private file = 'data/suppression.json') {}

  private read(): Record<string, SuppressionEntry> {
    if (!existsSync(this.file)) return {};
    try {
      return JSON.parse(readFileSync(this.file, 'utf8'));
    } catch {
      return {};
    }
  }

  private write(data: Record<string, SuppressionEntry>) {
    const dir = dirname(this.file);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const tmp = `${this.file}.tmp`;
    writeFileSync(tmp, JSON.stringify(data, null, 2));
    renameSync(tmp, this.file);
  }

  isSuppressed(email: string): boolean {
    return norm(email) in this.read();
  }

  add(email: string, reason: string) {
    const data = this.read();
    const key = norm(email);
    if (!data[key]) data[key] = { reason, at: new Date().toISOString() };
    this.write(data);
  }

  remove(email: string) {
    const data = this.read();
    delete data[norm(email)];
    this.write(data);
  }

  all(): { email: string; reason: string; at: string }[] {
    return Object.entries(this.read()).map(([email, v]) => ({ email, ...v }));
  }
}

const norm = (email: string) => email.trim().toLowerCase();

export const suppression = new SuppressionStore();

// ── Signed, per-recipient unsubscribe links ──────────────────────────────
// token = HMAC(secret, email). Prevents anyone from unsubscribing arbitrary
// addresses by guessing URLs.

export function unsubToken(email: string): string {
  return createHmac('sha256', config.unsub.secret).update(norm(email)).digest('hex').slice(0, 20);
}

export function verifyUnsubToken(email: string, token: string): boolean {
  const expected = unsubToken(email);
  if (token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export function unsubscribeUrl(email: string): string {
  const e = Buffer.from(norm(email)).toString('base64url');
  return `${config.server.baseUrl}/u?e=${e}&t=${unsubToken(email)}`;
}
