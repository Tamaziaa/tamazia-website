// Phase 12 · Cal.com event type configuration
// Each event has a slug at cal.com/tamazia/<slug> and a Service JSON-LD entry.
export interface BookingEvent {
  slug: string;
  title: string;
  duration: string; // "15-min" etc · for human display
  durationMinutes: number;
  description: string;
  audience: string;
  price?: string; // "£99" if paid
  href: string; // local URL · /book/<slug>/
}

export const BOOKING_EVENTS: BookingEvent[] = [
  {
    slug: 'intro',
    title: '15-minute introduction',
    duration: '15-min',
    durationMinutes: 15,
    description: 'A quick orientation call. You describe what you do; I describe how Tamazia Pvt Ltd would approach the engagement. No commitment, no agenda beyond mutual fit.',
    audience: 'Anyone evaluating Tamazia for the first time',
    href: '/book/intro/'
  },
  {
    slug: 'strategy-call',
    title: '30-minute strategy call',
    duration: '30-min',
    durationMinutes: 30,
    description: 'Thirty minutes to map your growth picture, scope of work, and the shape of an engagement. No deck, no sales motion.',
    audience: 'Decision-makers ready to scope a project',
    href: '/book/strategy-call/'
  },
  {
    slug: 'discovery',
    title: '60-minute discovery',
    duration: '60-min',
    durationMinutes: 60,
    description: 'A one-hour deep dive into your sector regulatory map, current SEO posture, competitive landscape, and the engagement we would propose.',
    audience: 'Pre-engagement scoping for serious enquiries',
    href: '/book/discovery/'
  },
  {
    slug: 'workshop',
    title: '90-minute workshop',
    duration: '90-min',
    durationMinutes: 90,
    description: 'A structured working session on a specific compliance and SEO question your team is trying to resolve. Bring your team. Output: a written one-page recommendation by end of week.',
    audience: 'Existing engagements + paid pre-engagement workshops',
    price: '£499',
    href: '/book/workshop/'
  },
  {
    slug: 'deep-audit',
    title: '£99 deep audit',
    duration: '60-min',
    durationMinutes: 60,
    description: 'A paid deep audit of your existing SEO posture against the regulatory frameworks of your sector. Includes a written 5-page deliverable + 60-minute walkthrough call. Refundable against a full engagement.',
    audience: 'Companies that want a thorough audit before committing',
    price: '£99',
    href: '/book/deep-audit/'
  }
];

export const BOOKING_SECTORS = [
  { slug: 'legal', name: 'Legal services', regulator: 'SRA' },
  { slug: 'healthcare', name: 'Healthcare', regulator: 'CQC + MHRA' },
  { slug: 'hospitality', name: 'Hospitality', regulator: 'CMA + ASA' },
  { slug: 'real-estate', name: 'Real estate', regulator: 'RICS + TPO' },
  { slug: 'finance', name: 'Financial services', regulator: 'FCA + PRA' }
];
