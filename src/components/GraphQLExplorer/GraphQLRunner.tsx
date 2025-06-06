import {Button} from "@/components/ui/button.tsx";
import {Label} from "@/components/ui/label.tsx";
import {ScrollArea} from "@/components/ui/scroll-area.tsx";
import {Textarea} from "@/components/ui/textarea.tsx";
import {URLS} from "@/Consts";
import {useTranslation, getPreference, setPreference} from "@/lib/utils.ts";
import React, {useEffect, useState} from "react";
import {LuCode, LuKeyRound, LuLoader, LuTable, LuTerminal} from "react-icons/lu";
import {JSONResults} from "./JSONResults.tsx";
import {StatusMessages} from "./StatusMessages.tsx";
import {TableResults} from "./TableResults.tsx";

export const GraphQLRunner = (props: {
    query: string, description?: string,
    presentation?: 'json' | 'table' | undefined, // If not provided, will use the default from user preferences
    forcePresentation?: 'json' | 'table' | undefined
    locale?: string
}) => {
    const {description, forcePresentation, locale = 'en'} = props;
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
    // This is a first draft and will be updated as we go along
    return (<>
            {isMutation && (
                <div className="relative my-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
                     role="alert">
                    <strong className="font-bold">{useTranslation("ui.graphQLExplorer.warning", locale)}</strong>
                    <span className="block sm:inline">{useTranslation("ui.graphQLExplorer.statusMessages.mutationQueryNotAllowed", locale)}</span>
                </div>)}
            {!isMutation && (
                <>
                    <div className="my-4 flex row justify-between items-center flex-wrap gap-2">
                        <div className={`flex flex-row items-center space-x-2 gap-2`}>
                            <Button
                                onClick={() => {
                                    setShowAuthToken(!showAuthToken);
                                }}
                                title={useTranslation("ui.graphQLExplorer.authToken", locale)}
                                variant="ghost"
                            >
                                <LuKeyRound/>
                            </Button>
                            <Button
                                onClick={() => {
                                    setShowQuery(!showQuery);
                                    setExplicitQuery(!explicitQuery);
                                }}
                                title={useTranslation("ui.graphQLExplorer.viewQuery", locale)}
                                variant="ghost"
                            >
                                <LuTerminal/>
                            </Button>
                        </div>

                        {!forcePresentation && (
                            <div className={`flex flex-row items-center space-x-2 gap-2`}>
                                <Button
                                    onClick={() => {
                                        setCurrentPresentation('json');
                                        setPreference('graphQLResults', 'json');
                                    }}
                                    title={useTranslation("ui.graphQLExplorer.views.json", locale)}
                                    variant='ghost'
                                    disabled={!queryResults || currentPresentation === 'json'}
                                >
                                    <LuCode/> {useTranslation("ui.graphQLExplorer.views.json", locale)}
                                </Button>
                                <Button
                                    onClick={() => {
                                        setCurrentPresentation('table');
                                        setPreference('graphQLResults', 'table');
                                    }}
                                    title={useTranslation("ui.graphQLExplorer.views.table", locale)}
                                    variant='ghost'
                                    disabled={!queryResults || currentPresentation === 'table'}
                                >
                                    <LuTable/> {useTranslation("ui.graphQLExplorer.views.table", locale)}
                                </Button>
                            </div>
                        )}

                        <Button
                            onClick={handleRunQuery}
                            title={useTranslation("ui.graphQLExplorer.runDescription", locale)}
                            variant="default"
                            disabled={queryStatus === 'running'}
                        >
                            {queryStatus === 'running' ? (
                                <><LuLoader className="animate-spin h-5 w-5 mr-3"/> {useTranslation("ui.graphQLExplorer.statusMessages.loading", locale)}</>
                            ) : (
                                useTranslation("ui.graphQLExplorer.run", locale)
                            )}
                        </Button>
                    </div>

                    {showAuthToken && (
                        <div className="my-4 mb-2 grid w-full gap-1.5">
                            <Label htmlFor="auth_token">
                                {useTranslation("ui.graphQLExplorer.authToken", locale)}
                            </Label>

                            <Textarea
                                className="mb-2 block w-full rounded-lg bg-gray-50 text-sm min-h-24 p-2.5 dark:bg-gray-700"
                                id="auth_token"
                                onChange={updateAuthTokenUI}
                                onBlur={handleAuthTokenChange}
                                title={useTranslation("ui.graphQLExplorer.authTokenDescription", locale)}
                                value={authToken}
                                required/>
                        </div>
                    )}

                    <StatusMessages queryStatus={queryStatus} queryError={queryError} locale={locale} />

                    {showQuery && (
                        <>
                            <h2 className="my-4 text-lg font-semibold text-gray-900 dark:text-white">{useTranslation("ui.graphQLExplorer.query", locale)}</h2>

                            {description && (
                                <p className="my-4 text-sm text-gray-900 dark:text-white">{description}</p>)}

                            <ScrollArea className="w-full h-48 bg-slate-50 border border-gray-300 text-gray-900 text-sm rounded-lg block p-2.5
                                dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white">
                                <pre className="">{query}</pre>
                            </ScrollArea>
                        </>
                    )}

                    {queryStatus === 'success' && (
                        <>
                            <h2 className="my-4 text-lg font-semibold text-gray-900 dark:text-white">{useTranslation("ui.graphQLExplorer.results", locale)}</h2>

                            {currentPresentation === 'json' && (
                                <JSONResults results={queryResults} locale={locale} />
                            )}

                            {currentPresentation === 'table' && (
                                <TableResults results={queryResults} locale={locale} />
                            )}
                        </>
                    )}
                </>
            )}
        </>
    );
};