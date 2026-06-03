export type EmailStatus =
  | 'pending'
  | 'sent'
  | 'dryrun'
  | 'skipped'
  | 'failed'
  | 'replied';

/** A single prospect business as it flows through the pipeline. */
export interface Lead {
  id: string; // stable id from the source (e.g. Google Place id)
  name: string;
  category: string;
  source: string;

  address?: string;
  phone?: string | null;
  website?: string | null;
  email?: string | null;
  rating?: number | null;

  // ── enrichment ──
  websiteScore?: number; // 0-100, LOWER = more in need of a new site
  needsWork?: boolean;
  needReasons?: string[];

  // ── demo ──
  demoPath?: string | null; // local file path
  demoUrl?: string | null; // public URL if hosted

  // ── outreach ──
  emailStatus?: EmailStatus;
  emailSubject?: string | null;
  emailSentAt?: string | null;

  createdAt: string;
  updatedAt: string;
  notes?: string;
}

/** AI/template-derived branding + copy for a demo site. */
export interface DemoCopy {
  tagline: string;
  about: string;
  primaryColor: string;
  accentColor: string;
  services: { title: string; description: string }[];
  generatedBy: 'ai' | 'template';
}
