/**
 * Opens off-site links from markdown/MDX prose in a new tab.
 *
 * Component links set target/rel themselves, but markdown (`[text](https://…)`)
 * has no syntax for it — so this handles the whole content collection instead of
 * hand-tagging every link and hoping new pages remember.
 *
 * Links to `site` are left alone: they're absolute URLs to the docs themselves,
 * not somewhere else. Anything that already declares a target is respected.
 *
 * Written locally rather than pulling in `rehype-external-links`: it's a small
 * enough job, and the repo's `min-release-age` policy makes new deps a chore.
 */
import {URLS} from '../Consts';

/**
 * Resolves a static `URLS.FOO` expression to its actual URL.
 *
 * Prose links written as MDX JSX carry their href as an unevaluated expression.
 * Looking the constant up here means external detection works the same for
 * `<a href={URLS.DISCORD}>` as for `[text](https://…)` — otherwise it would rest
 * on the author remembering `target="_blank"`, and the glyph would appear on
 * some links but not others.
 */
function resolveUrlsExpression(expression) {
    const match = /^\s*URLS\.([A-Z0-9_]+)\s*$/.exec(expression ?? '');
    const value = match ? URLS[match[1]] : undefined;
    return typeof value === 'string' ? value : null;
}

export default function rehypeExternalLinks({site} = {}) {
    let siteHost;
    try {
        siteHost = site ? new URL(site).hostname : undefined;
    } catch {
        siteHost = undefined;
    }

    const isOffSite = (href) => {
        if (!/^https?:\/\//i.test(href)) return false;
        try {
            return new URL(href).hostname !== siteHost;
        } catch {
            return false;
        }
    };

    const addClass = (properties, name) => {
        const existing = properties.className;
        if (Array.isArray(existing)) existing.push(name);
        else if (existing) properties.className = [existing, name];
        else properties.className = [name];
    };

    /** Plain markdown link: `[text](https://…)` → a real hast element. */
    const visitElement = (node) => {
        const {href, target} = node.properties;
        if (typeof href === 'string' && !target && isOffSite(href)) {
            node.properties.target = '_blank';
            node.properties.rel = 'noreferrer noopener';
            addClass(node.properties, 'external-link');
        }
    };

    /**
     * Anchors authored as MDX JSX — `<a href={URLS.DISCORD}>`. These stay as
     * mdxJsx*Element nodes (name/attributes, not tagName/properties), so they
     * need handling separately or they'd silently miss the glyph.
     *
     * href resolves in priority order: a literal string, then a `URLS.*` lookup.
     * Only if it's some other expression we can't evaluate do we fall back to
     * trusting an author-written target="_blank".
     */
    const visitJsx = (node) => {
        const attributes = node.attributes ?? [];
        const attr = (name) =>
            attributes.find((a) => a.type === 'mdxJsxAttribute' && a.name === name);

        const href = attr('href');
        const target = attr('target');
        if (!href) return;

        const resolved =
            typeof href.value === 'string'
                ? href.value
                : resolveUrlsExpression(href.value?.value);

        const external = resolved ? isOffSite(resolved) : target?.value === '_blank';
        if (!external) return;

        if (!target) {
            attributes.push({type: 'mdxJsxAttribute', name: 'target', value: '_blank'});
            attributes.push({type: 'mdxJsxAttribute', name: 'rel', value: 'noreferrer noopener'});
        }

        const cls = attr('class');
        if (!cls) attributes.push({type: 'mdxJsxAttribute', name: 'class', value: 'external-link'});
        else if (typeof cls.value === 'string' && !cls.value.split(/\s+/).includes('external-link')) {
            cls.value = `${cls.value} external-link`;
        }
    };

    const visit = (node) => {
        // Marks links for the trailing ↗ glyph (see docs-theme.css). Prose only —
        // UI chrome sets its own target and never passes through this plugin.
        if (node.tagName === 'a' && node.properties) visitElement(node);
        else if (
            (node.type === 'mdxJsxTextElement' || node.type === 'mdxJsxFlowElement') &&
            node.name === 'a'
        ) visitJsx(node);

        for (const child of node.children ?? []) visit(child);
    };

    return (tree) => visit(tree);
}
