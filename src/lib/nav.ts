/**
 * Off-site links open in a new tab. Internal routes are always relative here,
 * so an absolute URL means it leaves the docs.
 */
export function isExternal(href: string): boolean {
    return /^https?:\/\//i.test(href);
}

/**
 * Top-level section links, shared by the header nav and the mobile menu.
 * `labelKey` is resolved by the consumer so it can pass the current locale.
 */
export const NAV_LINKS = [
    {labelKey: 'ui.nav.guides', href: '/api/guides'},
    {labelKey: 'ui.nav.apiReference', href: '/api/graphql/schemas'},
    {labelKey: 'ui.nav.librarians', href: '/librarians/getting-started'},
    {labelKey: 'ui.nav.showcase', href: '/showcase'},
] as const;
