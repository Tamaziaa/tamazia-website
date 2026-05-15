// Footer · verbatim live tamazia.co.uk (TAMAZIA-13 §9)

export const footerContent = {
  wordmark: 'TAMAZIA',
  tagline: 'International SEO for regulated enterprises.',

  // Live site uses "International presence" label with locations + Worldwide
  presenceLabel: 'International presence',
  // S44 (Impl Doc v1.0) · 2-segment line rendered with `·` separator → "London · Engagements delivered across UK, UAE, USA, EU"
  locations: ['London', 'Engagements delivered across UK, UAE, USA, EU'],

  // S44 (Impl Doc v1.0) · founder-confirmed office address
  address: 'C1, Barking Wharf Square, London, IG11 7ZQ',

  // Verbatim credentials line from live site footer
  // Phase 10 founder decision · ABA line removed pending verification (credibility risk)
  credentialsLine:
    'London · Dubai · New York · EU | Member, Chartered Institute of Arbitrators',

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
    { label: 'Book a strategy call', href: '/book/' },
    { label: 'Press', href: '/press/' },
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

  // Companies Act 2006 s.82 + Companies (Trading Disclosures) Regs 2008 compliance
  // Plus voluntary identity disclosure for investor and client trust signals
  legalEntity: {
    name: 'Tamazia Ltd',
    registeredOffice: 'Registered in England and Wales',
    cin: 'Registration in progress',
    contactEmail: 'founder@tamazia.co.uk',
    dataController: 'Tamazia Ltd',
    dpoContact: 'dpo@tamazia.co.uk',
    icoRegistration: 'Article 27 UK Representative · appointment in progress',
    dataProtectionNoticeHref: '/legal/data-protection/',
    dpaHref: '/legal/dpa/',
    subProcessorsHref: '/legal/sub-processors/',
  },

  modernSlaveryHref: '/modern-slavery-statement/',
  complaintsHref: '/complaints/',
  acceptableUseHref: '/acceptable-use/',
  securityHref: '/security-policy/',

  // Legacy field current Footer.astro reads
  // Phase B: order LLM first, then CIArb, then ABA. Partner badges removed until verification confirmed (I.31).
  credentials: [
    'GOOGLE PARTNER',
    'META BUSINESS PARTNER',
  ],
};
