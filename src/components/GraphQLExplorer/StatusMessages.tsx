import {useTranslation} from "@/lib/utils.ts";
import {Card, CardContent} from "@/components/ui/card.tsx";
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
                <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20">
                    <CardContent className="pt-6">
                        <p className="text-sm text-blue-900 dark:text-blue-100"
                           dangerouslySetInnerHTML={{ __html: sanitizedDisclaimerText() }}
                        />
                    </CardContent>
                </Card>
            )}

            {queryStatus == "error" && (
                <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
                    <CardContent className="pt-6">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-red-900 dark:text-red-100">
                                {useTranslation("ui.graphQLExplorer.statusMessages.error", locale)}
                            </p>
                            <p className="text-sm text-red-700 dark:text-red-300">{queryError}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {queryStatus == "success" && (
                <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
                    <CardContent className="pt-6">
                        <p className="text-sm text-green-900 dark:text-green-100">
                            {useTranslation("ui.graphQLExplorer.statusMessages.success", locale)}
                        </p>
                    </CardContent>
                </Card>
            )}
        </>
    );
};
