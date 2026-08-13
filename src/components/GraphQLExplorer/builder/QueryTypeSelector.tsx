import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAvailableQueryTypes } from "../lib/queryBuilderUtils";
import { useTranslation } from "@/lib/utils";
import { useId } from "react";
import { useExplorerLocale } from "../useExplorer";

interface QueryTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  locale?: string;
}

export function QueryTypeSelector({ value, onChange }: QueryTypeSelectorProps) {
  const locale = useExplorerLocale();
  const queryTypes = getAvailableQueryTypes();
  const t = (key: string) => useTranslation(`ui.graphQLExplorer.queryBuilder.${key}`, locale);
  const labelId = useId();

  return (
    <div className="space-y-2">
      <span id={labelId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('queryType')}
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          aria-labelledby={labelId}
          className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
        >
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
