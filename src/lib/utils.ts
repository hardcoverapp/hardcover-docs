import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"

import {translations} from "@/translations.ts";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const uCFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

export const useTranslation = (key: string, locale: string = 'en') => {
    return translations.getTranslationNode(key, locale);
};

export const useTokenTranslation = (key: string, locale: string = 'en', tokens: object) => {
    let node = translations.getTranslationNode(key, locale);

    if (typeof node === 'string') {
        Object.entries(tokens).forEach(([key, value]) => {
            const tokenRegex = new RegExp("\<" + key + "\>(.*?)\<\/" + key + "\>", 'g');
            const matches = node.match(tokenRegex);

            if (matches) {
                matches.forEach((match: string) => {
                    const tokenValue = match.replace(tokenRegex, '$1');
                    let tokenReplacement = value(tokenValue);
                    tokenReplacement = tokenReplacement.replace('{chunks}', tokenValue);

                    node = node.replace(match, tokenReplacement);
                });
            }
        });

        return node;
    }
}
