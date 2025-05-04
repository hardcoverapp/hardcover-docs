import React from "react";
import DOMPurify from "dompurify";

import {URLS} from "@/Consts";
import {useTokenTranslation, useTranslation} from "@/lib/utils";

export const APIBanner = (locale: any = "en") => {
    // @ts-ignore
    const bannerText: string | Node = useTokenTranslation('pages.api.disclaimerBanner.text', locale, {
        "a": (chunks: any) => {
            return `<a href=${URLS.API_DISCORD}
                   target="_blank" rel="noreferrer noopener">{chunks}</a>`
        }
    });

    const sanitizedBannerText = () => ({
        __html: DOMPurify.sanitize(bannerText)
    });

    return (
        <>
            <div className="border-l-4 border-l-yellow-600 bg-yellow-100 dark:bg-yellow-900 p-4 dark:text-white">
                <h5 className="!text-yellow-900 dark:!text-yellow-100">{
                    useTranslation('pages.api.disclaimerBanner.title', locale)
                }:</h5>
                <p dangerouslySetInnerHTML={sanitizedBannerText()}/>
            </div>
        </>
    );
}