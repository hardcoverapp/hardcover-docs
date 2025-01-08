import React from 'react';
import { URLS } from "@/Consts";

export const LibrarianBanners = () => {
    const currentPath = window.location.pathname;
    const isStandards = currentPath.includes('/standards/');
    const isResources = currentPath.includes('/resources/');

    return (
        <>
            {isStandards && (
                <div className="border-l-4 border-l-accent-600 bg-accent-200 dark:bg-accent-950 p-4 dark:text-white">
                        <h5 className="!text-accent-900 !dark:text-accent-200">Note:</h5>
                        <p>The rules and guidelines included in the standards sections of this documentation are intended to provide a general framework to guide new librarians, provide examples about how to handle common editing scenarios, and present consistency across the site. That said, no two books are the same, and so it is impossible for any single standard to be perfectly applicable in all situations. If you believe a particular work does not fit into these standards or have suggestions for improvement, please let us know in the <a href={URLS.LIBRARIAN_DISCORD} target="_blank" rel="noreferrer noopener">#librarians</a> Discord channel.</p>
                </div>
            )}
        </>
    );
}