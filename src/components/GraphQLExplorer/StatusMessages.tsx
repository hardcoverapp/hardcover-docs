import {useTranslation} from "@/lib/utils.ts";
import DOMPurify from "dompurify";
import React from "react";

export const StatusMessages = (props: {
    queryStatus: 'running' | 'success' | 'error' | 'idle',
    queryError?: string,
    locale?: string,
}) => {

    const {queryStatus, queryError, locale = 'en'} = props;
    const sanitizedDisclaimerText = () => (
        DOMPurify.sanitize(
            useTranslation("ui.graphQLExplorer.statusMessages.disclaimer", locale)
        )
    );

    return (
        <>
            {(queryStatus == "idle" || !queryStatus) && (
                <div className="my-4 w-full rounded-lg p-3 text-gray-900 bg-accent-200">
                    {sanitizedDisclaimerText()}
                </div>)}

            {queryStatus == "error" && (
                <div className="my-4 w-full rounded-lg border border-red-400 bg-red-100 p-3 text-red-700">
                    <strong>{useTranslation("ui.graphQLExplorer.statusMessages.error", locale)}: </strong> {queryError}
                </div>)}

            {queryStatus == "success" && (<div
                className="my-4 w-full rounded-lg border border-green-400 bg-green-100 p-3 text-green-700">
                {useTranslation("ui.graphQLExplorer.statusMessages.success", locale)}
            </div>)}
        </>
    );
};
