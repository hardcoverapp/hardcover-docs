import DOMPurify from "dompurify";

import {URLS} from "@/Consts";
import {useTokenTranslation, useTranslation} from "@/lib/utils";

export const APIBanner = (locale: any = "en") => {
    // @ts-ignore
    const bannerText: string | Node = useTokenTranslation('pages.api.disclaimerBanner.text', locale, {
        "a": () => {
            return `<a href=${URLS.API_DISCORD}
                   target="_blank" rel="noreferrer noopener">{chunks}</a>`
        }
    });

    const sanitizedBannerText = () => ({
        __html: DOMPurify.sanitize(bannerText)
    });

    return (
        <>
            <div className="rounded-lg border border-indigo-line bg-indigo-soft p-4 text-foreground">
                <h5 className="!mt-0 !text-primary">{
                    useTranslation('pages.api.disclaimerBanner.title', locale)
                }:</h5>
                <p dangerouslySetInnerHTML={sanitizedBannerText()}/>
            </div>
        </>
    );
}