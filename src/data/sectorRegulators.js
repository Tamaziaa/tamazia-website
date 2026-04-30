// Phase C · Canonical regulator mapping per sector
// Used by audit.js and future sector page templates

export const SECTOR_REGULATORS = {
  hospitality: ['CMA', 'ASA', 'GDPR/ICO', 'FHH', 'Tourism Authority (AE)', 'DTCM', 'SCTA Saudi', 'CAP Code'],
  healthcare: ['CQC', 'MHRA', 'ABPI', 'ASA', 'HIPAA (US)', 'ICO', 'GMC GMP', 'NMC Code', 'EMA', 'MDR'],
  legal: ['SRA Standards', 'Bar Standards Board', 'CLC', 'CILEX', 'FCA (financial services law)', 'CCBE Code'],
  'real-estate': ['RICS', 'TPO', 'NAEA', 'FCA', 'Land Registry', 'GDPR/ICO', 'RERA Dubai', 'REGA Saudi'],
  finance: ['FCA', 'PRA', 'FOS', 'GDPR/ICO', 'MiFID II', 'AMLD5', 'PRA Rulebook', 'FCA COBS', 'FSMA 2000'],
  'restaurants-fb': ['FSA', 'ASA CAP', 'GDPR/ICO', 'CMA', 'Allergen Regs (EU 1169/2011)', 'HMRC'],
  education: ['Ofsted', 'QAA', 'GDPR/ICO', 'FERPA (US)', 'COPPA', 'Equality Act 2010'],
  tech: ['EU AI Act', 'DSA', 'DMA', 'GDPR/ICO', 'NIS2', 'Cyber Resilience Act', 'ISO 27001'],
};

export const SECTOR_REGULATOR_LABELS = {
  hospitality: 'Hotels, Hospitality & Tourism',
  healthcare: 'Healthcare & Life Sciences',
  legal: 'Legal Services',
  'real-estate': 'Real Estate & Property',
  finance: 'Financial Services',
  'restaurants-fb': 'Restaurants & F&B',
  education: 'Education',
  tech: 'Technology & SaaS',
};
