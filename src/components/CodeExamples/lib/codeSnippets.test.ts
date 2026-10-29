import {describe, expect, test} from 'vitest'
import {extractSection, findDuplicateSectionNames, stripSections} from "./codeSnippets.ts";

const source = [
    'import os',                                                       // 1
    '# SECTION START: hardcoverOauthEndpoints :SECTION',
    'AUTHORIZE_ENDPOINT = "https://hardcover.app/oauth2/authorize"',   // 2
    '# SECTION START: oauthIssuer :SECTION',
    'ISSUER = "https://api.hardcover.app"',                            // 3
    '# SECTION END: oauthIssuer :SECTION',
    '# SECTION END: hardcoverOauthEndpoints :SECTION',
    '',                                                                // 4
    'def main():',                                                     // 5
    '    # SECTION START: body :SECTION',
    '    if ISSUER:',                                                  // 6
    '        print(ISSUER)',                                           // 7
    '    # SECTION END: body :SECTION',
].join('\n');

describe('extractSection', () => {
    test('drops nested markers from the outer section', () => {
        expect(extractSection(source, 'hardcoverOauthEndpoints')).toBe(
            'AUTHORIZE_ENDPOINT = "https://hardcover.app/oauth2/authorize"\nISSUER = "https://api.hardcover.app"'
        );
        expect(extractSection(source, 'oauthIssuer')).toBe('ISSUER = "https://api.hardcover.app"');
    });

    test('dedents by default, keeps indentation when asked', () => {
        expect(extractSection(source, 'body')).toBe('if ISSUER:\n    print(ISSUER)');
        expect(extractSection(source, 'body', {dedent: false})).toBe('    if ISSUER:\n        print(ISSUER)');
    });

    test('throws on an unknown section', () => {
        expect(() => extractSection(source, 'missing')).toThrow('Section "missing" not found');
    });
});

describe('stripSections', () => {
    test('removes every marker line', () => {
        expect(stripSections(source).code).not.toContain('SECTION');
        expect(stripSections(source).code.split('\n')).toHaveLength(7);
    });

    test('reports line ranges in the stripped text', () => {
        expect(stripSections(source).sections).toEqual({
            hardcoverOauthEndpoints: {start: 2, end: 3},
            oauthIssuer: {start: 3, end: 3},
            body: {start: 6, end: 7},
        });
    });
});

describe('findDuplicateSectionNames', () => {
    test('finds names started more than once', () => {
        expect(findDuplicateSectionNames(source)).toEqual([]);
        expect(findDuplicateSectionNames(`${source}\n# SECTION START: body :SECTION\n# SECTION END: body :SECTION`)).toEqual(['body']);
    });
});
