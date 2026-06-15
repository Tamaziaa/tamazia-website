// Contact · 6-field form per live tamazia.co.uk (TAMAZIA-13 §8)
// 12-option sector dropdown matching live site exactly.

export const contactContent = {
  eyebrow: 'TAMAZIA',
  h2: 'Every engagement begins with a conversation.',
  subline: 'Start yours below.',

  fields: [
    {
      id: 'name',
      label: 'Full Name',
      type: 'text',
      required: true,
      autocomplete: 'name',
      placeholder: 'Your full name',
    },
    {
      id: 'email',
      label: 'Work Email',
      type: 'email',
      required: true,
      autocomplete: 'email',
      placeholder: 'you@firm.com',
    },
    {
      // Mission D · D5 · website field (feeds Neon domain capture via neon-sync.js).
      id: 'website',
      label: 'Website',
      type: 'url',
      required: true,
      autocomplete: 'url',
      placeholder: 'https://yourfirm.com',
    },
    {
      id: 'company',
      label: 'Company',
      type: 'text',
      required: true,
      autocomplete: 'organization',
      placeholder: 'Company name',
    },
    {
      id: 'sector',
      label: 'Sector',
      type: 'select',
      required: true,
      // Verbatim 12 options from live tamazia.co.uk contact form
      options: [
        'Law Firm',
        'Healthcare',
        'Hotels and Hospitality',
        'Real Estate',
        'Financial Services',
        'Restaurants and F&B',
        'Education',
        'E-commerce',
        'Automotive',
        'Wellness and Fitness',
        'Executive Personal Brand',
        'Other',
      ],
    },
    {
      id: 'outcome',
      label: 'Primary objective',
      type: 'textarea',
      required: true,
      rows: 4,
      placeholder: 'Describe the brief: sector, geography, and the outcome you need.',
    },
  ],

  submitLabel: 'Submit briefing request',

  calendlyHeading: 'Or schedule directly using the calendar below.',
  calendlyUrl: '/book/',

  // Founder direct line · rendered beside the calendar in the contact pane (mirrors the audit
  // founder block: email + phone). Founder-confirmed 2026-06-15.
  founderEmail: 'founder@tamazia.co.uk',
  founderPhone: '+44 7778243657',

  confidentiality: 'All briefings are conducted under NDA on request. The founder reviews every enquiry.',

  successMessage: {
    heading: 'Your briefing request has been received.',
    body: 'The founder will be in touch within one business day.',
    note: 'If your enquiry is time-sensitive, book directly using the calendar.',
  },
};
