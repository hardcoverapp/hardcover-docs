import React, { useState, useEffect } from "react";
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
} from "@/lib/queryBuilderUtils";
import { QUERY_BUILDER } from "@/Consts";
import { useTranslation } from "@/lib/utils";

interface QueryBuilderProps {
  initialQueryType?: string;
  initialQuery?: string;
  onQueryChange: (query: string) => void;
  showQueryTypeSelector?: boolean;
  locale?: string;
}

export function QueryBuilder({
  initialQueryType = "books",
  initialQuery,
  onQueryChange,
  showQueryTypeSelector = true,
  locale = 'en',
}: QueryBuilderProps) {
  const [queryType, setQueryType] = useState(initialQueryType);
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

  return (
    <div className="space-y-4">
      {/* Query Type Selector */}
      {showQueryTypeSelector && (
        <QueryTypeSelector value={queryType} onChange={setQueryType} locale={locale} />
      )}

      {/* Limit Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('resultLimit')}
        </label>
        <div className="flex gap-2">
          {QUERY_BUILDER.LIMIT_OPTIONS.map((limit) => (
            <button
              key={limit}
              onClick={() => handleLimitChange(limit)}
              className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
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
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('selectFields')} ({selectedCount} {t('selected')})
            </label>
            <Button onClick={handleResetFields} variant="ghost" size="sm">
              <LuRefreshCw className="w-4 h-4 mr-2" />
              {t('reset')}
            </Button>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-transparent">
            <ScrollArea className="h-[400px] pr-4">
              <FieldTree fields={selectedFields} onFieldToggle={handleFieldToggle} locale={locale} />
            </ScrollArea>
          </div>
        </div>

        {/* Generated Query Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('generatedQuery')}
            </label>
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
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
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
        locale={locale}
      />
    </div>
  );
}
