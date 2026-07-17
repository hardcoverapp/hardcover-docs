import { describe, expect, test } from 'vitest';
import rehypeExternalLinks from './rehype-external-links.mjs';
import { URLS } from '../Consts.ts';

const run = (node: any) => {
    // The site is the docs host, so absolute self-links are treated as internal.
    rehypeExternalLinks({ site: URLS.DOCS })({ type: 'root', children: [node] });
    return node;
};

// A plain markdown link becomes a hast element.
const el = (href: string, extra: Record<string, any> = {}) => ({
    type: 'element',
    tagName: 'a',
    properties: { href, ...extra },
    children: [{ type: 'text', value: 'link' }],
});

// `<a href={…}>` in MDX stays a JSX node with attributes.
const jsx = (attrs: any[]) => ({
    type: 'mdxJsxTextElement',
    name: 'a',
    attributes: attrs,
    children: [],
});
const strAttr = (name: string, value: string) => ({ type: 'mdxJsxAttribute', name, value });
const exprAttr = (name: string, expr: string) => ({
    type: 'mdxJsxAttribute',
    name,
    value: { type: 'mdxJsxAttributeValueExpression', value: expr },
});

describe('rehype-external-links — markdown (hast) links', () => {
    test('off-site link gets target, rel, and the glyph class', () => {
        const node = run(el('https://graphql.org/learn/'));
        expect(node.properties.target).toBe('_blank');
        expect(node.properties.rel).toBe('noreferrer noopener');
        expect(node.properties.className).toContain('external-link');
    });

    test('same-site absolute link is left alone', () => {
        const node = run(el('https://docs.hardcover.app/api'));
        expect(node.properties.target).toBeUndefined();
        expect(node.properties.className).toBeUndefined();
    });

    test('relative link is left alone', () => {
        const node = run(el('/api/guides'));
        expect(node.properties.target).toBeUndefined();
    });

    test('an author-set target is respected (not overwritten or re-marked)', () => {
        const node = run(el('https://example.com', { target: '_self' }));
        expect(node.properties.target).toBe('_self');
        expect(node.properties.className).toBeUndefined();
    });

    test('an existing class is preserved alongside external-link', () => {
        const node = run(el('https://example.com', { className: ['foo'] }));
        expect(node.properties.className).toEqual(['foo', 'external-link']);
    });
});

describe('rehype-external-links — MDX JSX links', () => {
    test('literal off-site href is marked', () => {
        const node = run(jsx([strAttr('href', 'https://example.com')]));
        const names = node.attributes.map((a: any) => a.name);
        expect(names).toContain('target');
        expect(names).toContain('rel');
        expect(names).toContain('class');
    });

    test('href={URLS.DISCORD} is resolved and marked (the case markdown can’t express)', () => {
        const node = run(jsx([exprAttr('href', 'URLS.DISCORD')]));
        const target = node.attributes.find((a: any) => a.name === 'target');
        const cls = node.attributes.find((a: any) => a.name === 'class');
        expect(target?.value).toBe('_blank');
        expect(cls?.value).toBe('external-link');
    });

    test('an unresolvable expression falls back to the author’s target', () => {
        const node = run(jsx([exprAttr('href', 'someVar'), strAttr('target', '_blank')]));
        expect(node.attributes.find((a: any) => a.name === 'class')?.value).toBe('external-link');
    });

    test('an unresolvable expression with no target is not marked', () => {
        const node = run(jsx([exprAttr('href', 'someVar')]));
        expect(node.attributes.find((a: any) => a.name === 'class')).toBeUndefined();
    });
});
