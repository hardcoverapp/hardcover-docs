/**
 * This file is responsible for loading the translations for the UI components.
 * Currently only the UI components are translated here.
 * Page translations are handled in the mdx files.
 * Example:
 * `src/content/docs/it/ui.json` -- Italian translations for the UI components
 * `src/content/docs/it/librarians/FAQ.mdx` -- Italian translations for the FAQ page
 *
 * Translations are provided by the community and are not guaranteed to be complete.
 *
 * In the future this will likely be replaced with `react-intl` or `react-i18next`
  */

import * as IT from '../content/docs/it/ui.json';
import * as EN from '../content/docs/ui.json';

const locales = {
    en: EN,
    it: IT,
}

const defaultLocale = "en";

/**
 * Try to get the specified locale from the locales object. If it doesn't exist, return the default locale.
 * @param locale
 * @returns The locale object
 * @example
 * ```ts
 * import { getLocale } from "@/lib/utils"
 * const locale = getLocale("it");
 * // locale would be the Italian translations object
 * ```
 */
const getLocale = (locale: string) => {
    // @ts-ignore
    return locales[locale] || locales[defaultLocale];
}

/**
 * Split the translation key into an array of strings.
 * @param key
 * @returns The split translation key
 * @example
 * ```ts
 * import { splitTranslationKey } from "@/lib/utils"
 * const key = "ui.greeting";
 * const splitKey = splitTranslationKey(key);
 * // splitKey would be ["ui", "greeting"]
 * ```
 */
const splitTranslationKey = (key: string) => {
    return key.split('.');
}

/**
 * Utility function to get the translation for a given key and locale
 *
 * In the future this will likely be replaced with `react-intl` or `react-i18next`
 * @param key
 * @param locale
 * @returns The translation for the given key and locale as a string
 * @example
 * ```ts
 * import { useTranslation } from "@/lib/utils"
 * const translation = useTranslation("ui.greeting", "it");
 * // translation would be "Ciao"
 * ```
 */
export const getTranslationNode = (key: string, locale: string) => {
    const data = getLocale(locale);
    const splitKey = splitTranslationKey(key);

    let node = data;
    for (const k of splitKey) {
        node = node && Object.keys(node).includes(k) ? node[k] : null;
    }

    if (node) {
        return node;
    }

    // If the node doesn't exist for the specified locale, return the en translation
    let enNode = getLocale('en');

    for (const k of splitKey) {
        enNode = enNode && Object.keys(enNode).includes(k) ? enNode[k] : null;
    }

    if (enNode) {
        return enNode;
    }

    return null;
}
