import type { Lead } from '../types.js';

/**
 * Built-in sample businesses so the whole pipeline runs with zero API keys.
 * A realistic mix: some with no website, some with a weak/old one.
 */
export function mockLeads(): Omit<Lead, 'createdAt' | 'updatedAt'>[] {
  const base = (l: Partial<Lead> & { id: string; name: string; category: string }): Omit<
    Lead,
    'createdAt' | 'updatedAt'
  > => ({ source: 'mock', ...l });

  return [
    base({
      id: 'mock-1',
      name: 'Bluebird Coffee Roasters',
      category: 'coffee shop',
      address: '210 W 4th St, Austin, TX 78701',
      phone: '+1 512-555-0142',
      website: null, // no site at all -> top priority
      rating: 4.7,
    }),
    base({
      id: 'mock-2',
      name: "Mama Rosa's Trattoria",
      category: 'restaurant',
      address: '88 Congress Ave, Austin, TX 78701',
      phone: '+1 512-555-0199',
      website: 'http://mamarosas-austin.example.com', // old/broken (example domain)
      email: 'hello@mamarosas-austin.example.com',
      rating: 4.4,
    }),
    base({
      id: 'mock-3',
      name: 'The Corner Bakery & Pastries',
      category: 'bakery',
      address: '1500 S Lamar Blvd, Austin, TX 78704',
      phone: '+1 512-555-0177',
      website: null,
      rating: 4.8,
    }),
    base({
      id: 'mock-4',
      name: 'Lone Star Boutique',
      category: 'boutique',
      address: '600 N Lamar Blvd, Austin, TX 78703',
      phone: '+1 512-555-0123',
      website: 'http://lonestarboutique.example.com',
      rating: 4.2,
    }),
    base({
      id: 'mock-5',
      name: 'Eastside Barber Co.',
      category: 'barber shop',
      address: '2300 E Cesar Chavez St, Austin, TX 78702',
      phone: '+1 512-555-0166',
      website: null,
      rating: 4.9,
    }),
  ];
}
