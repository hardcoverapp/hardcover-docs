// Relative, not the `@/` alias: astro.config.mjs imports this too, and it loads
// before Vite's aliases are available.
import {URLS} from '../Consts';

/**
 * Social links, shared by `astro.config.mjs` (Starlight's `social` config) and
 * the SocialIcons override that renders them.
 *
 * Single source of truth on purpose: the override renders these itself rather
 * than delegating to Starlight's default component, which hardcodes
 * `<a rel="me">` with no way to add `target`. Keeping one list means the two
 * can't drift apart.
 */
export const SOCIAL_LINKS = [
    {icon: 'discord', label: 'Discord', href: URLS.DISCORD},
    {icon: 'github', label: 'GitHub', href: URLS.GITHUB},
    {icon: 'instagram', label: 'Instagram', href: URLS.INSTAGRAM},
    {icon: 'mastodon', label: 'Mastodon', href: URLS.MASTODON},
] as const;
