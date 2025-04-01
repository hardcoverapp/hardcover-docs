import {useTranslation} from "@/lib/utils.ts";
import React from "react";
import {ScrollArea} from "@/components/ui/scroll-area"

export const JSONResults = (props: {
    results: object,
    locale?: string,
}) => {
    const {results, locale = 'en'} = props;

    return (
        <ScrollArea className="h-64 rounded-lg bg-slate-50 border border-gray-300 text-gray-900 text-sm block w-full p-2.5
                                dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">
            <pre role="log">
                {results ? JSON.stringify(results, null, 2) : useTranslation("ui.graphQLExplorer.statusMessages.noResults", locale)}
            </pre>
        </ScrollArea>
    );
};