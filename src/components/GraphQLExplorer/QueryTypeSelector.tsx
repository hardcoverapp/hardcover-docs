import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAvailableQueryTypes } from "@/lib/queryBuilderUtils";
import { useTranslation } from "@/lib/utils";

interface QueryTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  locale?: string;
}

export function QueryTypeSelector({ value, onChange, locale = 'en' }: QueryTypeSelectorProps) {
  const queryTypes = getAvailableQueryTypes();
  const t = (key: string) => useTranslation(`ui.graphQLExplorer.queryBuilder.${key}`, locale);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('queryType')}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
          <SelectValue placeholder="Choose a query type..." />
        </SelectTrigger>
        <SelectContent className="max-h-[300px] bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
          {queryTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
