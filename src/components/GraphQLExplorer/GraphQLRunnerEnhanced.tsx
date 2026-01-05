import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { URLS } from "@/Consts";
import { getPreference, setPreference, useTranslation } from "@/lib/utils.ts";
import React, { useEffect, useState } from "react";
import {
  LuChartNoAxesCombined,
  LuCode,
  LuKeyRound,
  LuLoader,
  LuPlay,
  LuTable,
  LuTerminal,
  LuWand
} from "react-icons/lu";
import { ChartResults } from "./ChartResults";
import { JSONResults } from "./JSONResults";
import { QueryBuilder } from "./QueryBuilder";
import { TableResults } from "./TableResults";

export const GraphQLRunnerEnhanced = (props: {
  query: string,
  description?: string,
  presentation?: 'json' | 'table' | 'chart' | undefined,
  forcePresentation?: 'json' | 'table' | 'chart' | undefined
  chartable?: boolean,
  chartConfigs?: any,
  locale?: string,
  initialQueryType?: string,
  showQueryTypeSelector?: boolean,
  defaultMode?: 'static' | 'advanced'
  canToggleMode?: boolean
}) => {
  const {
    description,
    forcePresentation,
    locale = 'en',
    chartable = true,
    chartConfigs,
    initialQueryType,
    showQueryTypeSelector = false,
    defaultMode = 'static',
    canToggleMode = false
  } = props;
  let { presentation } = props;

  if (!presentation) {
    presentation = getPreference('graphQLResults');
  }

  // Mode toggle: static (original behavior) or advanced (query builder)
  const [mode, setMode] = useState<'static' | 'advanced'>(defaultMode);

  // Get the query from props so we can modify it
  const [query, setQuery] = useState(props.query);

  // Get the auth token and user_id from local storage if it exists
  const localAuthToken = window.localStorage.getItem('auth_token');
  const [userId, setUserId] = useState(window.localStorage.getItem('user_id') || '');
  const [authToken, setAuthToken] = useState(localAuthToken || '');

  // If the query is a mutation, we don't allow it to be run here
  const isMutation = query.trim().toLowerCase().includes('mutation');

  // Query execution state
  const [queryStatus, setQueryStatus] = useState<'running' | 'success' | 'error' | 'idle'>('idle');
  const [queryError, setQueryError] = useState<string | undefined>();
  const [queryResults, setQueryResults] = useState<any>(null);

  const [showAuthToken, setShowAuthToken] = useState(!authToken);
  const [showQuery, setShowQuery] = useState(mode === 'static');
  const [explicitQuery, setExplicitQuery] = useState(false);

  const [currentPresentation, setCurrentPresentation] = useState(forcePresentation ? forcePresentation : presentation || 'json');

  /**
   * Replace query tokens like ##USER_ID## with actual values
   */
  const ReplaceQueryTokens = (query: string): string => {
    if (!!userId) {
      query = query.replace(/##USER_ID##/g, userId);
    }
    return query;
  }

  useEffect(() => {
    // Only replace tokens in static mode
    if (mode === 'static') {
      setQuery(ReplaceQueryTokens(props.query));
    }
  }, [userId, mode, props.query]);

  /**
   * Handle query execution with fetch
   */
  const handleQueryWithFetch = (runningQuery: string | undefined, keepQuery = false): {
    then(resolve: any, reject: any): void;
  } => {
    return {
      then(resolve: any, reject: any) {
        if (!authToken || !authToken.trim()) {
          reject(new Error(useTranslation("ui.graphQLExplorer.statusMessages.emptyToken", locale)));
          return;
        }

        if (isMutation) {
          reject(new Error(useTranslation("ui.graphQLExplorer.statusMessages.mutationQueryNotAllowed", locale)));
          return;
        }

        if (!runningQuery || !runningQuery.trim()) {
          reject(new Error(useTranslation("ui.graphQLExplorer.statusMessages.emptyQuery", locale)));
          return;
        }

        fetch(URLS.GRAPHQL_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authToken.startsWith('Bearer') ? authToken : `Bearer ${authToken}`
          },
          body: JSON.stringify({ query: runningQuery })
        }).then(res => {
          if (!res.ok) {
            reject(new Error(useTranslation("ui.graphQLExplorer.statusMessages.errorRunning", locale)));
            return;
          }

          res.json().then(data => {
            if (data.error) {
              console.error({ error: data.error });
              reject(new Error(data.error));
            }

            if (data.errors) {
              console.error({ errors: data.errors });
              if (data.errors[ 0 ].message) {
                reject(new Error(data.errors[ 0 ].message));
                return;
              }
              reject(new Error(useTranslation("ui.graphQLExplorer.statusMessages.errorRunning", locale)));
            }

            if (!explicitQuery && !keepQuery) {
              setShowQuery(false);
            }

            resolve(data);
          });
        }, () => {
          reject(new Error(useTranslation("ui.graphQLExplorer.statusMessages.connectionError", locale)));
        });
      }
    };
  };

  /**
   * Update auth token UI
   */
  const updateAuthTokenUI = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const newAuthToken = event.target?.value?.trim();
    setAuthToken(newAuthToken);
  }

  /**
   * Validate and save auth token
   */
  const handleAuthTokenChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const newAuthToken = event.target?.value?.trim();

    const userIdQuery = `
            query {
                me {
                    id
                }
            }
        `;

    handleQueryWithFetch(userIdQuery, true).then((res: any) => {
      if (!res?.data?.me) {
        console.error(useTranslation("ui.graphQLExplorer.statusMessages.invalidToken", locale));
        return;
      }

      window.localStorage.setItem('auth_token', newAuthToken);
      window.localStorage.setItem('user_id', res.data.me[ 0 ].id);
      setUserId(res.data.me[ 0 ].id);

    }, (err: { message: string; }) => {
      console.error(useTranslation("ui.graphQLExplorer.statusMessages.invalidToken", locale), { err: err.message });
    });
  };

  /**
   * Determine the best view based on the data structure
   */
  const determineBestView = (data: any): 'json' | 'table' | 'chart' => {
    if (!data) return 'json';

    // Get the first key's data (e.g., data.books, data.users, etc.)
    const firstKey = Object.keys(data)[ 0 ];
    const firstValue = data[ firstKey ];

    // If it's not an array, use JSON view
    if (!Array.isArray(firstValue)) {
      return 'json';
    }

    // If empty array, use JSON view
    if (firstValue.length === 0) {
      return 'json';
    }

    // Check if all items are objects with similar structure
    const firstItem = firstValue[ 0 ];
    if (typeof firstItem !== 'object' || firstItem === null) {
      return 'json';
    }

    // Count numeric fields in the first item
    const keys = Object.keys(firstItem);
    const numericFields = keys.filter(key => {
      const value = firstItem[ key ];
      return typeof value === 'number' && !isNaN(value);
    });

    // If we have numeric data and the chart is available, use chart view
    if (numericFields.length >= 1 && chartable) {
      return 'chart';
    }

    // If it's an array of objects with consistent structure, use table view
    // Check if first few items have similar keys
    const allSimilar = firstValue.slice(0, 3).every((item: any) => {
      if (typeof item !== 'object' || item === null) return false;
      const itemKeys = Object.keys(item);
      return itemKeys.length > 0 && itemKeys.length <= 15; // Not too many fields for a table
    });

    if (allSimilar) {
      return 'table';
    }

    // Default to JSON for complex structures
    return 'json';
  };

  /**
   * Run the query
   */
  const handleRunQuery = (): void => {
    setQueryStatus('running');

    handleQueryWithFetch(query).then((res: any) => {
      setQueryResults(res.data);
      setQueryStatus('success');

      // Auto-select best view unless presentation is forced
      if (!forcePresentation) {
        const bestView = determineBestView(res.data);
        setCurrentPresentation(bestView);
      }
    }, (err: { message: string; }) => {
      setQueryError(err.message);
      setQueryStatus('error');
    });
  };

  /**
   * Handle query change from QueryBuilder
   */
  const handleQueryBuilderChange = (newQuery: string) => {
    setQuery(ReplaceQueryTokens(newQuery));
  };

  return (
    <div className="space-y-4">
      {isMutation && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20 p-4">
          <div className="flex items-start gap-3">
            <div className="text-red-600 dark:text-red-400 mt-0.5">⚠</div>
            <div>
              <h4 className="text-sm font-semibold text-red-900 dark:text-red-100">
                {useTranslation("ui.graphQLExplorer.warning", locale)}
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {useTranslation("ui.graphQLExplorer.statusMessages.mutationQueryNotAllowed", locale)}
              </p>
            </div>
          </div>
        </div>
      )}

      {!isMutation && (
        <>
          {/* Compact Toolbar */}
          <div
            className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            {/* Left: Mode Toggle + View Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Mode Toggle */}
              {canToggleMode && (
                <div className="inline-flex rounded-md shadow-sm" role="group">
                  <button
                    type="button"
                    onClick={() => setMode('static')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-l-md border ${
                      mode === 'static'
                        ? 'bg-accent-600 text-white border-accent-600'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <LuTerminal className="inline h-3.5 w-3.5 mr-1.5"/>
                    {useTranslation("ui.graphQLExplorer.queryBuilder.static", locale)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('advanced')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-r-md border-t border-r border-b ${
                      mode === 'advanced'
                        ? 'bg-accent-600 text-white border-accent-600'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <LuWand className="inline h-3.5 w-3.5 mr-1.5"/>
                    {useTranslation("ui.graphQLExplorer.queryBuilder.advancedBuilder", locale)}
                  </button>
                </div>
              )}

              {/* Divider */}
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"/>

              {/* View Controls */}
              <div className="flex items-center gap-1">
                <Button
                  onClick={() => setShowAuthToken(!showAuthToken)}
                  title={useTranslation("ui.graphQLExplorer.authToken", locale)}
                  variant="ghost"
                  size="sm"
                  className={showAuthToken ? "!bg-accent-600 !text-white hover:!bg-accent-600/90 h-7" : "hover:!bg-gray-200 dark:hover:!bg-gray-700 h-7"}
                >
                  <LuKeyRound className="h-3.5 w-3.5"/>
                </Button>
                {mode === 'static' && (
                  <Button
                    onClick={() => {
                      setShowQuery(!showQuery);
                      setExplicitQuery(!explicitQuery);
                    }}
                    title={useTranslation("ui.graphQLExplorer.viewQuery", locale)}
                    variant="ghost"
                    size="sm"
                    className={showQuery ? "!bg-accent-600 !text-white hover:!bg-accent-600/90 h-7" : "hover:!bg-gray-200 dark:hover:!bg-gray-700 h-7"}
                  >
                    <LuCode className="h-3.5 w-3.5"/>
                  </Button>
                )}
              </div>
            </div>

            {/* Right: Run button */}
            <Button
              onClick={handleRunQuery}
              title={useTranslation("ui.graphQLExplorer.runDescription", locale)}
              disabled={queryStatus === 'running'}
              size="sm"
              className="gap-2 !bg-accent-600 !text-white hover:!bg-accent-600/90 h-7 px-4"
            >
              {queryStatus === 'running' ? (
                <>
                  <LuLoader className="animate-spin h-3.5 w-3.5"/>
                  <span className="text-xs">{useTranslation("ui.graphQLExplorer.statusMessages.loading", locale)}</span>
                </>
              ) : (
                <>
                  <LuPlay className="h-3.5 w-3.5"/>
                  <span className="text-xs">{useTranslation("ui.graphQLExplorer.run", locale)}</span>
                </>
              )}
            </Button>
          </div>

          {/* Auth Token Section - Inline */}
          {showAuthToken && (
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                {useTranslation("ui.graphQLExplorer.authToken", locale)}
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {useTranslation("ui.graphQLExplorer.authTokenDescription", locale)}
              </p>
              <Textarea
                className="font-mono text-sm min-h-20"
                id="auth_token"
                placeholder="Bearer your-token-here"
                onChange={updateAuthTokenUI}
                onBlur={handleAuthTokenChange}
                value={authToken}
                required
              />
            </div>
          )}

          {/* Status Messages - Inline */}
          {( queryStatus === 'error' || queryStatus === 'idle' && queryError ) && (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20 p-3">
              <div className="flex items-start gap-2">
                <div className="text-red-600 dark:text-red-400 text-sm">✕</div>
                <div className="text-sm text-red-700 dark:text-red-300">{queryError}</div>
              </div>
            </div>
          )}

          {/* Query Builder (Advanced Mode) */}
          {mode === 'advanced' && (
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <QueryBuilder
                initialQueryType={initialQueryType || 'books'}
                initialQuery={props.query}
                onQueryChange={handleQueryBuilderChange}
                showQueryTypeSelector={showQueryTypeSelector}
                locale={locale}
              />
            </div>
          )}

          {/* Static Query Section */}
          {mode === 'static' && showQuery && (
            <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {useTranslation("ui.graphQLExplorer.query", locale)}
                </h3>
                {description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
                )}
              </div>
              <ScrollArea
                className="w-full h-48 rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 p-3">
                <pre className="text-xs font-mono text-gray-800 dark:text-gray-200">{query}</pre>
              </ScrollArea>
            </div>
          )}

          {/* Results Section with Tabs */}
          {queryStatus === 'success' && (
            <div
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
              {/* Results Header with Tabs */}
              <div
                className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {useTranslation("ui.graphQLExplorer.results", locale)}
                </h3>

                {!forcePresentation && (
                  <div className="inline-flex rounded-md shadow-sm" role="group">
                    <button
                      onClick={() => {
                        setCurrentPresentation('json');
                        setPreference('graphQLResults', 'json');
                      }}
                      className={`px-2 py-1 text-xs font-medium rounded-l-md border ${
                        currentPresentation === 'json'
                          ? 'bg-accent-600 text-white border-accent-600'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      title={useTranslation("ui.graphQLExplorer.views.json", locale)}
                    >
                      <LuCode className="h-3.5 w-3.5"/>
                    </button>
                    <button
                      onClick={() => {
                        setCurrentPresentation('table');
                        setPreference('graphQLResults', 'table');
                      }}
                      className={`px-2 py-1 text-xs font-medium ${chartable ? 'border-t border-b' : 'rounded-r-md border'} ${
                        currentPresentation === 'table'
                          ? 'bg-accent-600 text-white border-accent-600'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                      title={useTranslation("ui.graphQLExplorer.views.table", locale)}
                    >
                      <LuTable className="h-3.5 w-3.5"/>
                    </button>
                    {chartable && (
                      <button
                        onClick={() => {
                          setCurrentPresentation('chart');
                          setPreference('graphQLResults', 'chart');
                        }}
                        className={`px-2 py-1 text-xs font-medium rounded-r-md border-t border-r border-b ${
                          currentPresentation === 'chart'
                            ? 'bg-accent-600 text-white border-accent-600'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                        title={useTranslation("ui.graphQLExplorer.views.chart", locale)}
                      >
                        <LuChartNoAxesCombined className="h-3.5 w-3.5"/>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Results Content */}
              <div className="p-4">
                {currentPresentation === 'json' && (
                  <JSONResults results={queryResults} locale={locale}/>
                )}
                {currentPresentation === 'table' && (
                  <TableResults results={queryResults} locale={locale}/>
                )}
                {currentPresentation === 'chart' && chartable && (
                  <ChartResults results={queryResults}/>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
