import { useState, useEffect, useId } from "react";
import { LuCopy, LuCheck, LuRefreshCw } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QueryTypeSelector } from "./QueryTypeSelector";
import { FieldTree } from "./FieldTree";
import { QueryArgsEditor } from "./QueryArgsEditor";
import {
  generateDefaultQuery,
  generateQueryString,
  toggleField,
  countSelectedFields,
  parseQueryFields,
  parseQueryArguments,
  selectFieldsByNames,
  type SelectedField,
} from "../lib/queryBuilderUtils";
import { QUERY_BUILDER } from "../lib/config";
import { useTranslation } from "@/lib/utils";
import { useExplorer } from "../useExplorer";

export function QueryBuilder() {
  const { config, authoredQuery, setQuery } = useExplorer();
  const { locale, showQueryTypeSelector } = config;

  // Seeded from the page-authored query, not the live one: the effect below
  // emits a new query, and seeding from that would re-enter this loop.
  const initialQuery = authoredQuery;
  const onQueryChange = setQuery;

  const [queryType, setQueryType] = useState(config.initialQueryType ?? "books");
  const [selectedFields, setSelectedFields] = useState<SelectedField[]>([]);
  const [queryArgs, setQueryArgs] = useState<Record<string, any>>({ limit: QUERY_BUILDER.DEFAULT_LIMIT });
  const [selectedLimit, setSelectedLimit] = useState<number>(QUERY_BUILDER.DEFAULT_LIMIT);
  const [generatedQuery, setGeneratedQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const t = (key: string) => useTranslation(`ui.graphQLExplorer.queryBuilder.${key}`, locale);

  // Initialize fields when query type changes
  useEffect(() => {
    const defaultFields = generateDefaultQuery(queryType, QUERY_BUILDER.MAX_DEPTH);

    // If we have an initial query, parse it and select those fields
    if (initialQuery) {
      const parsedFieldNames = parseQueryFields(initialQuery, queryType);
      const parsedArgs = parseQueryArguments(initialQuery, queryType);

      const fieldsWithSelection = selectFieldsByNames(defaultFields, parsedFieldNames);
      setSelectedFields(fieldsWithSelection);

      // Set query args from parsed query, but ensure limit is set
      const mergedArgs = {
        limit: parsedArgs.limit || selectedLimit,
        ...parsedArgs
      };
      setQueryArgs(mergedArgs);

      // Update selected limit if it was parsed from query
      if (parsedArgs.limit) {
        setSelectedLimit(parsedArgs.limit);
      }
    } else {
      setSelectedFields(defaultFields);
      setQueryArgs({ limit: selectedLimit }); // Reset args but keep limit
    }
  }, [queryType, initialQuery]);

  // Handle limit change
  const handleLimitChange = (limit: number) => {
    setSelectedLimit(limit);
    setQueryArgs((prev) => ({ ...prev, limit }));
  };

  // Generate query when fields or args change
  useEffect(() => {
    const query = generateQueryString(queryType, selectedFields, queryArgs);
    setGeneratedQuery(query);
    onQueryChange(query);
  }, [selectedFields, queryArgs, queryType, onQueryChange]);

  const handleFieldToggle = (path: string[]) => {
    setSelectedFields((prev) => toggleField(prev, path));
  };

  const handleCopyQuery = async () => {
    try {
      await navigator.clipboard.writeText(generatedQuery);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy query:", err);
    }
  };

  const handleResetFields = () => {
    const defaultFields = generateDefaultQuery(queryType, QUERY_BUILDER.MAX_DEPTH);
    setSelectedFields(defaultFields);
    setQueryArgs({ limit: selectedLimit }); // Keep limit when resetting
  };

  const selectedCount = countSelectedFields(selectedFields);

  const limitLabelId = useId();
  const fieldsLabelId = useId();
  const generatedLabelId = useId();

  return (
    <div className="space-y-4">
      {/* Query Type Selector */}
      {showQueryTypeSelector && (
        <QueryTypeSelector value={queryType} onChange={setQueryType} />
      )}

      {/* Limit Selector */}
      <div className="space-y-2">
        <span id={limitLabelId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('resultLimit')}
        </span>
        <div className="flex gap-2" role="group" aria-labelledby={limitLabelId}>
          {QUERY_BUILDER.LIMIT_OPTIONS.map((limit) => (
            <button
              key={limit}
              type="button"
              aria-pressed={selectedLimit === limit}
              onClick={() => handleLimitChange(limit)}
              className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-1 ${
                selectedLimit === limit
                  ? "bg-accent-600 text-white border-accent-600"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {limit}
            </button>
          ))}
        </div>
      </div>

      {/* Field Selection and Generated Query - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Field Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span id={fieldsLabelId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('selectFields')} ({selectedCount} {t('selected')})
            </span>
            <Button onClick={handleResetFields} variant="ghost" size="sm">
              <LuRefreshCw aria-hidden="true" className="w-4 h-4 mr-2" />
              {t('reset')}
            </Button>
          </div>
          <div
            role="group"
            aria-labelledby={fieldsLabelId}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-transparent"
          >
            <ScrollArea className="h-[400px] pr-4">
              <FieldTree fields={selectedFields} onFieldToggle={handleFieldToggle} />
            </ScrollArea>
          </div>
        </div>

        {/* Generated Query Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span id={generatedLabelId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('generatedQuery')}
            </span>
            <Button
              onClick={handleCopyQuery}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {copied ? (
                <>
                  <LuCheck className="w-4 h-4" />
                  {t('copied')}
                </>
              ) : (
                <>
                  <LuCopy className="w-4 h-4" />
                  {t('copyQuery')}
                </>
              )}
            </Button>
          </div>
          <div
            role="region"
            aria-labelledby={generatedLabelId}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
          >
            <ScrollArea className="h-[400px] pr-4">
              <pre className="text-sm font-mono">
                <code className="text-gray-900 dark:text-gray-50">{generatedQuery}</code>
              </pre>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Query Arguments */}
      <QueryArgsEditor
        args={queryArgs}
        onChange={setQueryArgs}
        availableFields={selectedFields.map(f => f.name)}
      />
    </div>
  );
}
