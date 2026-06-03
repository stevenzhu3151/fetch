import Anthropic from '@anthropic-ai/sdk';
import type { Lead, DemoCopy } from '../types.js';
import { config } from '../config.js';
import { log } from '../logger.js';

/** Category → sensible default branding/copy when AI is disabled. */
function templateDefaults(lead: Lead): DemoCopy {
  const palettes: Record<string, [string, string]> = {
    'coffee shop': ['#6f4e37', '#c8a165'],
    cafe: ['#6f4e37', '#c8a165'],
    restaurant: ['#8b1e2d', '#d4a017'],
    bakery: ['#b5651d', '#f2c14e'],
    boutique: ['#2c2c54', '#e056a0'],
    'barber shop': ['#1a1a1a', '#c0392b'],
  };
  const key = Object.keys(palettes).find((k) => lead.category.toLowerCase().includes(k));
  const [primaryColor, accentColor] = palettes[key ?? ''] ?? ['#1f3a5f', '#e08a3c'];

  return {
    tagline: `Welcome to ${lead.name}`,
    about: `${lead.name} is a beloved local ${lead.category} proudly serving the community. We focus on quality, warmth, and a great experience every time you visit.`,
    primaryColor,
    accentColor,
    services: [
      { title: 'Quality You Can Taste', description: 'Carefully made, locally loved.' },
      { title: 'Friendly Service', description: 'A warm welcome on every visit.' },
      { title: 'Right in the Neighborhood', description: 'Conveniently located and easy to find.' },
    ],
    generatedBy: 'template',
  };
}

/**
 * Generate site copy + a color palette for a lead. Uses Anthropic when a key
 * is configured (the "AI" half of template+AI), otherwise template defaults.
 */
export async function generateDemoCopy(lead: Lead): Promise<DemoCopy> {
  if (!config.ai.key) return templateDefaults(lead);

  try {
    const client = new Anthropic({ apiKey: config.ai.key });
    const msg = await client.messages.create({
      model: config.ai.model,
      max_tokens: 700,
      messages: [
        {
          role: 'user',
          content:
            `You write website copy for small local businesses. Return ONLY minified JSON, no prose.\n` +
            `Business name: ${lead.name}\nType: ${lead.category}\nLocation: ${lead.address ?? 'USA'}\n\n` +
            `JSON shape: {"tagline": string (<=8 words, catchy), "about": string (2 warm sentences), ` +
            `"primaryColor": hex, "accentColor": hex (tasteful, fits the business type), ` +
            `"services": [{"title": string, "description": string} x3]}`,
        },
      ],
    });

    const text = msg.content.find((b) => b.type === 'text');
    const raw = text && 'text' in text ? text.text : '';
    const json = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
    const parsed = JSON.parse(json) as Partial<DemoCopy>;

    const def = templateDefaults(lead);
    return {
      tagline: parsed.tagline ?? def.tagline,
      about: parsed.about ?? def.about,
      primaryColor: parsed.primaryColor ?? def.primaryColor,
      accentColor: parsed.accentColor ?? def.accentColor,
      services: parsed.services?.length ? parsed.services : def.services,
      generatedBy: 'ai',
    };
  } catch (err) {
    log.warn(`AI copy failed for ${lead.name}, using template: ${(err as Error).message}`);
    return templateDefaults(lead);
  }
}
