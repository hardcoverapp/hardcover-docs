import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

import { getTranslationNode } from "./translations.ts";

/**
 * Utility function to merge class names
 * @param inputs - Class names to merge
 * @returns Merged class names as a string
 * @example
 * ```ts
 * import { cn } from "@/lib/utils"
 * const className = cn("bg-red-500", "text-white", { "font-bold": true })
 * // className will be "bg-red-500 text-white font-bold"
 * ```
 */

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}


/**
 * Capitalizes the first letter of a string
 * @param str
 * @returns The string with the first letter capitalized
 * @example
 * ```ts
 * import { uCFirst } from "@/lib/utils"
 * const capitalized = uCFirst("hello world")
 * // capitalized will be "Hello world"
 * ```
 */
export const uCFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};


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
export const useTranslation = (key: string, locale: string = 'en') => {
    return getTranslationNode(key, locale);
};

/**
 * Utility function to get the translation for a given key and locale with tokens.
 *
 * See `/contributing/using-translations` for more information on how to use tokens.
 *
 * In the future this will likely be replaced with `react-intl` or `react-i18next`
 *
 * @param key
 * @param locale
 * @param tokens
 * @returns The translation for the given key and locale with tokens replaced
 * @example
 * ```ts
 * import { useTokenTranslation } from "@/lib/utils"
 * const name = "John";
 * const translation = useTokenTranslation("ui.token_greeting", "it", { "name": () => name });
 * // translation would be "Ciao John"
 * ```
 */
export const useTokenTranslation = (key: string, locale: string = 'en', tokens: object) => {
    let node = getTranslationNode(key, locale);

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
