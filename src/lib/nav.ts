/**
 * Off-site links open in a new tab. Internal routes are always relative here,
 * so an absolute URL means it leaves the docs.
 */
export function isExternal(href: string): boolean {
    return /^https?:\/\//i.test(href);
}

/** Top-level section links, shared by the header nav and the mobile menu. */
export const NAV_LINKS = [
    {label: 'Guides', href: '/api/guides'},
    {label: 'API Reference', href: '/api/graphql/schemas'},
    {label: 'Librarians', href: '/librarians/getting-started'},
    {label: 'Showcase', href: '/showcase'},
] as const;
