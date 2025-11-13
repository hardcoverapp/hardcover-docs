import {Button} from "@/components/ui/button";
import {Label} from "@/components/ui/label";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Textarea} from "@/components/ui/textarea";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {URLS} from "@/Consts";
import {useTranslation, getPreference, setPreference} from "@/lib/utils.ts";
import React, {useEffect, useState} from "react";
import {LuChartNoAxesCombined, LuChevronDown, LuChevronUp, LuCode, LuKeyRound, LuLoader, LuPlay, LuTable, LuTerminal} from "react-icons/lu";
import {JSONResults} from "./JSONResults";
import {StatusMessages} from "./StatusMessages";
import {TableResults} from "./TableResults";
import {ChartResults} from "./ChartResults";

export const GraphQLRunner = (props: {
    query: string, description?: string,
    presentation?: 'json' | 'table' | 'chart' | undefined, // If not provided, will use the default from user preferences
    forcePresentation?: 'json' | 'table' | 'chart' | undefined
    chartable?: boolean, // If true, will show the chart results
    chartConfigs?: any,
    locale?: string
}) => {
    const {description, forcePresentation, locale = 'en', chartable = true, chartConfigs} = props;
    let {presentation} = props;

    if (!presentation) {
        presentation = getPreference('graphQLResults');
    }

    // Get the query from props so we can modify it
    const [query, setQuery] = useState(props.query);

    // Get the auth token and user_id from local storage if it exists
    const localAuthToken = window.localStorage.getItem('auth_token');
    const [userId, setUserId] = useState(window.localStorage.getItem('user_id') || '');
    const [authToken, setAuthToken] = useState(localAuthToken || '');

    // If the query is a mutation, we don't allow it to be run here, and instead we will show a message to the user
    const isMutation = query.trim().toLowerCase().includes('mutation');

    // If the query has been run, we need to store the results in the React state
    const [queryStatus, setQueryStatus] = useState<'running' | 'success' | 'error' | 'idle'>('idle');
    const [queryError, setQueryError] = useState<string | undefined>();
    const [queryResults, setQueryResults] = useState<any>(null);

    const [showAuthToken, setShowAuthToken] = useState(!authToken);
    const [showQuery, setShowQuery] = useState(true);
    const [explicitQuery, setExplicitQuery] = useState(false);

    const [currentPresentation, setCurrentPresentation] = useState(forcePresentation ? forcePresentation : presentation || 'json');

    /**
     * This function will replace the ##USER_ID## token in the query with the actual user_id.
     * Additional tokens can be added here as needed.
     * @param query - string
     * @returns {string}
     */
    const ReplaceQueryTokens = (query: string): string => {
        if (!!userId) {
            // Replace the user_id token with the actual user_id
            query = query.replace(/##USER_ID##/g, userId);
        }

        return query;
    }

    useEffect(() => {
        // Replace the tokens in the query
        // Use the original query from props to ensure can this can be re-run if data changes
        setQuery(ReplaceQueryTokens(props.query));
    }, [userId]);

    /**
     * This function will handle the query using fetch.
     * In an actual application, you would want to use something like apollo-client to handle this.
     * @param runningQuery - string | undefined
     * @param keepQuery - boolean
     * @returns {Promise<any>}
     */
    const handleQueryWithFetch = (runningQuery: string | undefined, keepQuery = false): {
        then(resolve: any, reject: any): void;
    } => {
        return {
            then(resolve: any, reject: any) {
                // Ensure the auth token is provided
                if (!authToken || !authToken.trim()) {
                    reject(new Error(useTranslation("ui.graphQLExplorer.statusMessages.emptyToken", locale)));
                    return;
                }

                // If the query is a mutation, we don't allow it to be run here, and instead we will show a message to the user
                if (isMutation) {
                    reject(new Error(useTranslation("ui.graphQLExplorer.statusMessages.mutationQueryNotAllowed", locale)));
                    return;
                }

                // Ensure the query is not empty
                if (!runningQuery || !runningQuery.trim()) {
                    reject(new Error(useTranslation("ui.graphQLExplorer.statusMessages.emptyQuery", locale)));
                    return;
                }

                // Call the GraphQL endpoint with the query using fetch
                fetch(URLS.GRAPHQL_URL, {
                    method: 'POST', headers: {
                        'Content-Type': 'application/json',
                        'Authorization': authToken.startsWith('Bearer') ? authToken : `Bearer ${authToken}`
                    }, body: JSON.stringify({
                        query: runningQuery
                    })
                }).then(res => {
                    // If the response is not ok, reject the promise
                    if (!res.ok) {
                        reject(new Error(useTranslation("ui.graphQLExplorer.statusMessages.errorRunning", locale)));
                        return;
                    }

                    // Parse the JSON response
                    res.json().then(data => {
                        // If there is an error in the response, reject the promise
                        if (data.error) {
                            console.error({error: data.error});
                            reject(new Error(data.error));
                        }

                        if (data.errors) {
                            console.error({errors: data.errors});

                            // If there is a message in the errors, reject the promise with the message
                            if (data.errors[0].message) {
                                reject(new Error(data.errors[0].message));
                                return;
                            }

                            // If there is no message, reject the promise a generic error message
                            reject(new Error(useTranslation("ui.graphQLExplorer.statusMessages.errorRunning", locale)));
                        }

                        if (!explicitQuery && !keepQuery) {
                            // If the query was not explicitly set, hide the query
                            setShowQuery(false);
                        }

                        // Return the data from the query
                        resolve(data);
                    });
                }, () => {
                    // If there is an error with the fetch request, reject the promise
                    reject(new Error(useTranslation("ui.graphQLExplorer.statusMessages.connectionError", locale)));
                });
            }
        };
    };

    /**
     * This function will handle the onChange event for the auth token input field.
     * We need to update the auth token in the React state to be able to display it.
     * @param event - React.ChangeEvent<HTMLTextAreaElement>
     * @returns {void}
     */
    const updateAuthTokenUI = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
        // Get the new auth token from the input field and trim it
        const newAuthToken = event.target?.value?.trim();

        // Update the React state with the new auth token to be able to display it
        setAuthToken(newAuthToken);
    }

    /**
     * This function will handle the onBlur event for the auth token input field.
     * We are using blur instead of change to ensure the user has finished typing before we test the auth token.
     * @param event - React.ChangeEvent<HTMLTextAreaElement>
     * @returns {void}
     */
    const handleAuthTokenChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
        // Get the new auth token from the input field and trim it
        // This should be handled by the updateAuthTokenUI function,
        // but we are doing it here as well to be safe
        const newAuthToken = event.target?.value?.trim();

        // Query to get the user's ID
        const userIdQuery = `
            query {
                me {
                    id
                }
            }
        `;

        // Test the auth token to ensure it is valid and get the user's ID while we are at it
        handleQueryWithFetch(userIdQuery, true).then((res: any) => {
            // If the return data does not have the "me" object, the auth token is invalid
            if (!res?.data?.me) {
                console.error(useTranslation("ui.graphQLExplorer.statusMessages.invalidToken", locale));
                return;
            }

            // Only update the local storage if the auth token is valid
            window.localStorage.setItem('auth_token', newAuthToken);
            // Update the local storage with the user's ID as well to be able to use it later
            // Note: the "me" object is an array, so we need to get the first item
            window.localStorage.setItem('user_id', res.data.me[0].id);

            // Update the React state with the user's ID, so we can use it for the limit to my account filter
            setUserId(res.data.me[0].id);

        }, (err: { message: string; }) => {
            console.error(useTranslation("ui.graphQLExplorer.statusMessages.invalidToken", locale), {err: err.message});
        });
    };

    /**
     * This function will handle the onClick event for the Run Query button.
     * We need to run the query and display the results.
     * @returns {void}
     */
    const handleRunQuery = (): void => {
        // In this version we are running the unmodified query
        // In a future version we will add the filters to the query for the limit to my account
        // and results length options

        // Set the query status to running
        setQueryStatus('running');

        // Run the query using fetch
        handleQueryWithFetch(query).then((res: any) => {
            // Update the React state with the results
            setQueryResults(res.data);

            // Set the query status to success
            setQueryStatus('success');
        }, (err: { message: string; }) => {
            // Update the React state with the error message
            setQueryError(err.message);

            // Set the query status to error
            setQueryStatus('error');
        });
    };

    // Render the component
    return (
        <div className="space-y-6">
            {isMutation && (
                <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-red-900 dark:text-red-100 text-base">
                            {useTranslation("ui.graphQLExplorer.warning", locale)}
                        </CardTitle>
                        <CardDescription className="text-red-700 dark:text-red-300">
                            {useTranslation("ui.graphQLExplorer.statusMessages.mutationQueryNotAllowed", locale)}
                        </CardDescription>
                    </CardHeader>
                </Card>
            )}

            {!isMutation && (
                <>
                    {/* Toolbar Card */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                {/* Left side - Settings */}
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={() => {
                                            setShowAuthToken(!showAuthToken);
                                        }}
                                        title={useTranslation("ui.graphQLExplorer.authToken", locale)}
                                        variant="ghost"
                                        size="sm"
                                        className={showAuthToken ? "!bg-accent-600 !text-white hover:!bg-accent-600/90" : "hover:!bg-accent-200 dark:hover:!bg-accent-900"}
                                    >
                                        <LuKeyRound className="h-4 w-4"/>
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setShowQuery(!showQuery);
                                            setExplicitQuery(!explicitQuery);
                                        }}
                                        title={useTranslation("ui.graphQLExplorer.viewQuery", locale)}
                                        variant="ghost"
                                        size="sm"
                                        className={showQuery ? "!bg-accent-600 !text-white hover:!bg-accent-600/90" : "hover:!bg-accent-200 dark:hover:!bg-accent-900"}
                                    >
                                        <LuTerminal className="h-4 w-4"/>
                                    </Button>
                                </div>

                                {/* Right side - Run button */}
                                <Button
                                    onClick={handleRunQuery}
                                    title={useTranslation("ui.graphQLExplorer.runDescription", locale)}
                                    disabled={queryStatus === 'running'}
                                    size="default"
                                    className="gap-2 w-full sm:w-auto !bg-accent-600 !text-white hover:!bg-accent-600/90"
                                >
                                    {queryStatus === 'running' ? (
                                        <>
                                            <LuLoader className="animate-spin h-4 w-4"/>
                                            {useTranslation("ui.graphQLExplorer.statusMessages.loading", locale)}
                                        </>
                                    ) : (
                                        <>
                                            <LuPlay className="h-4 w-4"/>
                                            {useTranslation("ui.graphQLExplorer.run", locale)}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Auth Token Section */}
                    {showAuthToken && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    {useTranslation("ui.graphQLExplorer.authToken", locale)}
                                </CardTitle>
                                <CardDescription>
                                    {useTranslation("ui.graphQLExplorer.authTokenDescription", locale)}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    className="font-mono text-sm min-h-24"
                                    id="auth_token"
                                    placeholder="Bearer your-token-here"
                                    onChange={updateAuthTokenUI}
                                    onBlur={handleAuthTokenChange}
                                    value={authToken}
                                    required
                                />
                            </CardContent>
                        </Card>
                    )}

                    {/* Status Messages */}
                    <StatusMessages queryStatus={queryStatus} queryError={queryError} locale={locale} />

                    {/* Query Section */}
                    {showQuery && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    {useTranslation("ui.graphQLExplorer.query", locale)}
                                </CardTitle>
                                {description && (
                                    <CardDescription>{description}</CardDescription>
                                )}
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="w-full h-48 rounded-lg border bg-muted/50 p-4">
                                    <pre className="text-sm font-mono">{query}</pre>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    )}

                    {/* Results Section with Tabs */}
                    {queryStatus === 'success' && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    {useTranslation("ui.graphQLExplorer.results", locale)}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!forcePresentation ? (
                                    <Tabs
                                        value={currentPresentation}
                                        onValueChange={(value) => {
                                            setCurrentPresentation(value as 'json' | 'table' | 'chart');
                                            setPreference('graphQLResults', value as 'json' | 'table' | 'chart');
                                        }}
                                        className="w-full"
                                    >
                                        <TabsList className="inline-flex h-9 items-center justify-start bg-transparent p-0 text-gray-500 dark:text-gray-400 mb-4">
                                            <TabsTrigger
                                                value="json"
                                                className="px-3 rounded-l-md rounded-r-none border-r border-gray-300 dark:border-gray-700 cursor-pointer transition-colors hover:!bg-accent-200 dark:hover:!bg-accent-900 data-[state=active]:!bg-accent-600 data-[state=active]:!text-white data-[state=active]:!shadow-none"
                                                title={useTranslation("ui.graphQLExplorer.views.json", locale)}
                                            >
                                                <LuCode className="h-4 w-4"/>
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="table"
                                                className={`px-3 rounded-none ${chartable ? 'border-r border-gray-300 dark:border-gray-700' : 'rounded-r-md'} cursor-pointer transition-colors hover:!bg-accent-200 dark:hover:!bg-accent-900 data-[state=active]:!bg-accent-600 data-[state=active]:!text-white data-[state=active]:!shadow-none`}
                                                title={useTranslation("ui.graphQLExplorer.views.table", locale)}
                                            >
                                                <LuTable className="h-4 w-4"/>
                                            </TabsTrigger>
                                            {chartable && (
                                                <TabsTrigger
                                                    value="chart"
                                                    className="px-3 rounded-l-none rounded-r-md cursor-pointer transition-colors hover:!bg-accent-200 dark:hover:!bg-accent-900 data-[state=active]:!bg-accent-600 data-[state=active]:!text-white data-[state=active]:!shadow-none"
                                                    title={useTranslation("ui.graphQLExplorer.views.chart", locale)}
                                                >
                                                    <LuChartNoAxesCombined className="h-4 w-4"/>
                                                </TabsTrigger>
                                            )}
                                        </TabsList>

                                        <TabsContent value="json" className="mt-0">
                                            <JSONResults results={queryResults} locale={locale} />
                                        </TabsContent>

                                        <TabsContent value="table" className="mt-0">
                                            <TableResults results={queryResults} locale={locale} />
                                        </TabsContent>

                                        {chartable && (
                                            <TabsContent value="chart" className="mt-0">
                                                <ChartResults results={queryResults} locale={locale} />
                                            </TabsContent>
                                        )}
                                    </Tabs>
                                ) : (
                                    <>
                                        {currentPresentation === 'json' && (
                                            <JSONResults results={queryResults} locale={locale} />
                                        )}
                                        {currentPresentation === 'table' && (
                                            <TableResults results={queryResults} locale={locale} />
                                        )}
                                        {currentPresentation === 'chart' && (
                                            <ChartResults results={queryResults} locale={locale} />
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
};