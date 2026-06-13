// Mission D · single source of truth for Tamazia social profile links.
// Rendered in Header.astro AND Footer.astro. Add new social profiles here only.
//
// Both URLs are founder-confirmed and live (2026-06-13):
//   Instagram: https://www.instagram.com/tamaziauk/
//   LinkedIn:  https://www.linkedin.com/in/amanpareekk/ (founder profile)
//
// The isPlaceholder() guard is retained: any future profile left blank or set to the
// sentinel renders disabled (non-navigating) so no broken or guessed URL ever ships.

export const INSTAGRAM_URL = 'https://www.instagram.com/tamaziauk/';

export const LINKEDIN_URL = 'https://www.linkedin.com/in/amanpareekk/';

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
