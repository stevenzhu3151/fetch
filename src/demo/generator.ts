import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Lead } from '../types.js';
import { config } from '../config.js';
import { generateDemoCopy } from './ai.js';
import { renderDemo } from './template.js';

export interface GeneratedDemo {
  path: string;
  url: string | null;
  generatedBy: 'ai' | 'template';
}

/**
 * Build a static demo site for a lead: template + AI copy → HTML file on disk.
 * Returns the local path and (if DEMO_BASE_URL is set) the public URL.
 */
export async function generateDemo(lead: Lead): Promise<GeneratedDemo> {
  const copy = await generateDemoCopy(lead);
  const html = renderDemo(lead, copy);

  const dir = join('data', 'demos', lead.id);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, 'index.html');
  writeFileSync(path, html);

  const url = config.demoBaseUrl ? `${config.demoBaseUrl}/${lead.id}/` : null;
  return { path, url, generatedBy: copy.generatedBy };
}
