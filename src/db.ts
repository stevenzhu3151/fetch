import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Lead } from './types.js';

/**
 * Dead-simple JSON-file store keyed by lead id. Zero native deps so it runs
 * anywhere. Swap for SQLite/Postgres behind this same interface when you scale.
 */
export class LeadStore {
  private leads: Record<string, Lead> = {};

  constructor(private file = 'data/leads.json') {
    if (existsSync(this.file)) {
      try {
        this.leads = JSON.parse(readFileSync(this.file, 'utf8'));
      } catch {
        this.leads = {};
      }
    }
  }

  has(id: string) {
    return id in this.leads;
  }

  get(id: string): Lead | undefined {
    return this.leads[id];
  }

  all(): Lead[] {
    return Object.values(this.leads);
  }

  /** Insert or merge a lead, stamping timestamps. Persists immediately. */
  upsert(lead: Partial<Lead> & { id: string }): Lead {
    const now = new Date().toISOString();
    const prev = this.leads[lead.id];
    const merged: Lead = {
      ...(prev ?? ({ createdAt: now } as Lead)),
      ...lead,
      updatedAt: now,
    } as Lead;
    this.leads[lead.id] = merged;
    this.persist();
    return merged;
  }

  query(filter: (l: Lead) => boolean): Lead[] {
    return this.all().filter(filter);
  }

  private persist() {
    const dir = dirname(this.file);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    // Atomic-ish write: write temp then rename to avoid corruption on crash.
    const tmp = `${this.file}.tmp`;
    writeFileSync(tmp, JSON.stringify(this.leads, null, 2));
    renameSync(tmp, this.file);
  }
}
