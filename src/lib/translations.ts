import * as ES from '../content/docs/es/ui.json';
import * as FR from '../content/docs/fr/ui.json';
import * as IT from '../content/docs/it/ui.json';
import * as PL from '../content/docs/pl/ui.json';
import * as EN from '../content/docs/ui.json';

export const locales = {
    en: EN,
    es: ES,
    fr: FR,
    it: IT,
    pl: PL
}

export const defaultLocale = "en";

export const getLocale = (locale: string) => {
    // @ts-ignore
    return locales[locale] || locales[defaultLocale];
}

export const splitTranslationKey = (key: string) => {
    return key.split('.');
}

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
