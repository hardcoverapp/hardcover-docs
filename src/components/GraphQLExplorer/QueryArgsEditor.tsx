import React, { useState } from "react";
import { LuPlus, LuX } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QUERY_BUILDER } from "@/Consts";
import { useTranslation } from "@/lib/utils";

interface QueryArgsEditorProps {
  args: Record<string, any>;
  onChange: (args: Record<string, any>) => void;
  availableFields?: string[];
  locale?: string;
}

interface ArgField {
  key: string;
  value: string;
  type: "number" | "string" | "object";
}

export function QueryArgsEditor({ args, onChange, availableFields = [], locale = 'en' }: QueryArgsEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const t = (key: string) => useTranslation(`ui.graphQLExplorer.queryBuilder.${key}`, locale);

  // State for order_by
  const [orderByField, setOrderByField] = useState<string>("");
  const [orderByDirection, setOrderByDirection] = useState<"asc" | "desc">(QUERY_BUILDER.DEFAULT_ORDER_DIRECTION);

  // State for where
  const [whereField, setWhereField] = useState<string>("");
  const [whereOperator, setWhereOperator] = useState<string>(QUERY_BUILDER.DEFAULT_WHERE_OPERATOR);
  const [whereValue, setWhereValue] = useState<string>("");

  const [argFields, setArgFields] = useState<ArgField[]>(() => {
    return Object.entries(args)
      .filter(([key]) => key !== "order_by" && key !== "where") // Exclude special args
      .map(([key, value]) => ({
        key,
        value: typeof value === "object" ? JSON.stringify(value) : String(value),
        type: typeof value === "object" ? "object" : typeof value === "number" ? "number" : "string",
      }));
  });

  const updateArgs = (fields: ArgField[], includeSpecialArgs = true) => {
    const newArgs: Record<string, any> = {};

    // Add regular args
    fields.forEach((field) => {
      if (field.key && field.value) {
        if (field.type === "number") {
          newArgs[field.key] = Number(field.value);
        } else if (field.type === "object") {
          try {
            newArgs[field.key] = JSON.parse(field.value);
          } catch {
            // Invalid JSON, skip
          }
        } else {
          newArgs[field.key] = field.value;
        }
      }
    });

    // Add order_by if set
    if (includeSpecialArgs && orderByField) {
      newArgs.order_by = { [orderByField]: orderByDirection };
    }

    // Add where if set
    if (includeSpecialArgs && whereField && whereValue) {
      newArgs.where = { [whereField]: { [whereOperator]: whereValue } };
    }

    onChange(newArgs);
  };

  const handleOrderByChange = (field: string, direction: "asc" | "desc") => {
    setOrderByField(field);
    setOrderByDirection(direction);
    const newArgs = { ...args };
    if (field) {
      newArgs.order_by = { [field]: direction };
    } else {
      delete newArgs.order_by;
    }
    onChange(newArgs);
  };

  const handleWhereChange = (field: string, operator: string, value: string) => {
    setWhereField(field);
    setWhereOperator(operator);
    setWhereValue(value);
    const newArgs = { ...args };
    if (field && value) {
      newArgs.where = { [field]: { [operator]: value } };
    } else {
      delete newArgs.where;
    }
    onChange(newArgs);
  };

  const addArg = () => {
    const newFields = [...argFields, { key: "", value: "", type: "string" as const }];
    setArgFields(newFields);
  };

  const removeArg = (index: number) => {
    const newFields = argFields.filter((_, i) => i !== index);
    setArgFields(newFields);
    updateArgs(newFields);
  };

  const updateArg = (index: number, updates: Partial<ArgField>) => {
    const newFields = argFields.map((field, i) =>
      i === index ? { ...field, ...updates } : field
    );
    setArgFields(newFields);
    updateArgs(newFields);
  };


  const addCommonArg = (key: string, type: "number" | "object") => {
    const newFields = [...argFields, { key, value: type === "object" ? "{}" : "10", type }];
    setArgFields(newFields);
    updateArgs(newFields);
  };

  const argCount = argFields.filter((f) => f.key && f.value).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
        >
          {t('queryArguments')} {argCount > 0 && `(${argCount})`}
        </button>
        {!isExpanded && argCount > 0 && (
          <span className="text-xs text-gray-500">{t('clickToEdit')}</span>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-3 p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800/50">
          {/* Order By */}
          {availableFields.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{t('orderBy')}</label>
              <div className="flex gap-2">
                <Select value={orderByField} onValueChange={(field) => handleOrderByChange(field, orderByDirection)}>
                  <SelectTrigger className="flex-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder={t('selectField')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                    {availableFields.map((field) => (
                      <SelectItem key={field} value={field}>
                        {field}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={orderByDirection} onValueChange={(dir: "asc" | "desc") => handleOrderByChange(orderByField, dir)}>
                  <SelectTrigger className="w-28 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                    <SelectItem value="asc">{t('ascending')}</SelectItem>
                    <SelectItem value="desc">{t('descending')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Where Clause */}
          {availableFields.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">{t('where')}</label>
              <div className="flex gap-2">
                <Select value={whereField} onValueChange={(field) => handleWhereChange(field, whereOperator, whereValue)}>
                  <SelectTrigger className="flex-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                    <SelectValue placeholder={t('selectField')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                    {availableFields.map((field) => (
                      <SelectItem key={field} value={field}>
                        {field}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={whereOperator} onValueChange={(op) => handleWhereChange(whereField, op, whereValue)}>
                  <SelectTrigger className="w-40 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                    <SelectItem value="_eq">{t('operators.equals')}</SelectItem>
                    <SelectItem value="_neq">{t('operators.notEquals')}</SelectItem>
                    <SelectItem value="_gt">{t('operators.greaterThan')}</SelectItem>
                    <SelectItem value="_gte">{t('operators.greaterThanOrEqual')}</SelectItem>
                    <SelectItem value="_lt">{t('operators.lessThan')}</SelectItem>
                    <SelectItem value="_lte">{t('operators.lessThanOrEqual')}</SelectItem>
                    <SelectItem value="_like">{t('operators.like')}</SelectItem>
                    <SelectItem value="_ilike">{t('operators.likeInsensitive')}</SelectItem>
                    <SelectItem value="_in">{t('operators.in')}</SelectItem>
                    <SelectItem value="_nin">{t('operators.notIn')}</SelectItem>
                  </SelectContent>
                </Select>
                <input
                  type="text"
                  placeholder={t('value')}
                  value={whereValue}
                  onChange={(e) => handleWhereChange(whereField, whereOperator, e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          )}

          {/* Quick Add Common Args */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">{t('quickAdd')}</span>
            {QUERY_BUILDER.COMMON_ARGS.map((arg) => (
              <button
                key={arg.label}
                onClick={() => addCommonArg(arg.label, arg.type)}
                disabled={argFields.some((f) => f.key === arg.label)}
                className="text-xs px-2 py-1 rounded font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800/70 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t(`commonArgs.${arg.label}`)}
              </button>
            ))}
          </div>

          {/* Arg Fields */}
          <div className="space-y-2">
            {argFields.map((field, index) => (
              <div key={index} className="flex gap-2 items-start">
                <input
                  type="text"
                  placeholder={t('key')}
                  value={field.key}
                  onChange={(e) => updateArg(index, { key: e.target.value })}
                  className="w-32 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
                <select
                  value={field.type}
                  onChange={(e) =>
                    updateArg(index, { type: e.target.value as "number" | "string" | "object" })
                  }
                  className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="object">JSON</option>
                </select>
                <input
                  type="text"
                  placeholder={field.type === "object" ? '{"field": "value"}' : t('value')}
                  value={field.value}
                  onChange={(e) => updateArg(index, { value: e.target.value })}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono"
                />
                <button
                  onClick={() => removeArg(index)}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600 dark:text-red-400"
                >
                  <LuX className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Button */}
          <Button
            onClick={addArg}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <LuPlus className="w-4 h-4 mr-2" />
            {t('addArgument')}
          </Button>
        </div>
      )}
    </div>
  );
}
