import {URLS} from "@/Consts";
import {useTokenTranslation, useTranslation} from '@/lib/utils';
import DOMPurify from 'dompurify'
import React from 'react';

export const LibrarianBanners = (lang: any = "en") => {
    const {locale} = lang;

    const currentPath = window.location.pathname;
    const isStandards = currentPath.includes('/standards/');
    const isResources = currentPath.includes('/resources/');

    // @ts-ignore
    const bannerText: string | Node = useTokenTranslation('pages.librarians.standards.bannerText', locale, {
        "a": (chunks: any) => {
            return `<a href=${URLS.LIBRARIAN_DISCORD}
                                           target="_blank" rel="noreferrer noopener">{chunks}</a>`
        }
    });

    const sanitizedBannerText = () => ({
        __html: DOMPurify.sanitize(bannerText)
    });

    return (
        <>
            {isStandards && (
                <div className="border-l-4 border-l-accent-600 bg-accent-200 dark:bg-accent-950 p-4 dark:text-white">
                    <h5 className="!text-accent-900 dark:!text-accent-200">{
                        useTranslation('pages.librarians.standards.bannerTitle', locale)
                    }:</h5>
                    <p dangerouslySetInnerHTML={sanitizedBannerText()}/>
                </div>
            )}
        </>
    );
}