// Contact · 6-field form per live tamazia.in (TAMAZIA-13 §8)
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
      id: 'company',
      label: 'Company or Organisation',
      type: 'text',
      required: true,
      autocomplete: 'organization',
      placeholder: 'Company name',
    },
    {
      id: 'role',
      label: 'Your role or title',
      type: 'text',
      required: true,
      autocomplete: 'organization-title',
      placeholder: 'Managing Partner, CMO, General Counsel…',
    },
    {
      id: 'sector',
      label: 'Sector',
      type: 'select',
      required: true,
      // Verbatim 12 options from live tamazia.in contact form
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

  submitLabel: 'Request SEO & Compliance Audit',

  calendlyHeading: 'Or schedule directly using the calendar below.',
  calendlyUrl: 'https://calendly.com/tamazia',

  confidentiality: 'All briefings are conducted under NDA on request. The founder reviews every enquiry.',

  successMessage: {
    heading: 'Your briefing request has been received.',
    body: 'The founder will be in touch within 12 hours.',
    note: 'If your enquiry is time-sensitive, book directly using the calendar.',
  },
};
