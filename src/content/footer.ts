// Footer · verbatim live tamazia.co.uk (TAMAZIA-13 §9)

export const footerContent = {
  wordmark: 'TAMAZIA',
  tagline: 'International SEO for regulated enterprises.',

  // Live site uses "International presence" label with locations + Worldwide
  presenceLabel: 'International presence',
  locations: ['London', 'Dubai', 'New York', 'EU', 'Worldwide'],

  // Verbatim credentials line from live site footer
  credentialsLine:
    'London · Dubai · New York · EU | Member, Chartered Institute of Arbitrators | Member, American Bar Association',

  // Optional partner badges (kept but not in main credentials line)
  partnerBadges: ['GOOGLE PARTNER', 'META BUSINESS PARTNER'],

  socialLinks: [
    { label: 'Instagram', icon: 'instagram', href: 'https://instagram.com/tamazia' },
    { label: 'LinkedIn', icon: 'linkedin', href: 'https://linkedin.com/company/tamazia' },
  ],

  navigationHeading: 'NAVIGATION',
  navigationItems: [
    { label: 'Why Us', href: '/#why-us' },
    { label: 'Services', href: '/services/' },
    { label: 'Case Studies', href: '/case-studies/' },
    { label: 'About', href: '/about/' },
    { label: 'How We Work', href: '/#process' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'FAQ', href: '/#faq' },
    { label: 'Contact', href: '/#contact' },
    { label: 'Resources', href: '/resources/' },
  ],

  briefingsHeading: 'REGULATORY BRIEFINGS',
  briefingsBody:
    'Receive a quarterly briefing on regulatory developments affecting your sector. No marketing, no sales. Findings only.',
  briefingsCta: 'Receive briefings →',
  briefingsConsent: 'By submitting you consent to receive regulatory briefings from Tamazia. Unsubscribe at any time. No marketing or sales content.',

  legalLinks: [
    { label: 'Terms of Service', href: '/terms/' },
    { label: 'Privacy Notice', href: '/privacy-notice/' },
    { label: 'Cookie Policy', href: '/cookie-policy/' },
  ],

  copyright: '© 2026 Tamazia. All rights reserved.',

  // Legacy field current Footer.astro reads
  // Phase B: order LLM first, then CIArb, then ABA. Partner badges removed until verification confirmed (I.31).
  credentials: [
    "LLM · KING'S COLLEGE LONDON",
    'MEMBER, CHARTERED INSTITUTE OF ARBITRATORS',
    'MEMBER, AMERICAN BAR ASSOCIATION',
  ],
};
