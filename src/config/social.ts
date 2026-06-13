// Mission D · single source of truth for Tamazia social profile links.
// Rendered in Header.astro AND Footer.astro. Add new social profiles here only.
//
// Instagram: confirmed handle is TamaziaUK.
// LinkedIn: the company-page URL is FOUNDER-GATED. It is intentionally left as the
// sentinel 'TODO-founder' so it is a one-line fill. Do NOT invent a URL. While the
// value is the sentinel, isPlaceholder() is true and the link renders disabled
// (non-navigating) so no broken or guessed URL ever ships.

export const INSTAGRAM_URL = 'https://instagram.com/TamaziaUK';

// FOUNDER-GATED. Replace 'TODO-founder' with the real LinkedIn company URL
// (e.g. https://www.linkedin.com/company/<slug>/) to go live.
export const LINKEDIN_URL = 'TODO-founder';

export const SOCIAL_TODO_SENTINEL = 'TODO-founder';

export function isPlaceholder(url: string): boolean {
  return !url || url === SOCIAL_TODO_SENTINEL || !/^https?:\/\//i.test(url);
}

export interface SocialLink {
  label: string;
  icon: 'instagram' | 'linkedin';
  href: string;
  placeholder: boolean;
}

// Order is the render order. `placeholder` flags a founder-gated, non-navigating link.
export const socialLinks: SocialLink[] = [
  { label: 'Instagram', icon: 'instagram', href: INSTAGRAM_URL, placeholder: isPlaceholder(INSTAGRAM_URL) },
  { label: 'LinkedIn', icon: 'linkedin', href: LINKEDIN_URL, placeholder: isPlaceholder(LINKEDIN_URL) },
];
