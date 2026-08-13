import { useState } from "react";
import { LuChevronDown, LuChevronRight } from "react-icons/lu";
import type { SelectedField } from "../lib/queryBuilderUtils";
import { isScalarType, extractBaseType } from "../lib/queryBuilderUtils";
import { QUERY_BUILDER } from "../lib/config";
import { useTranslation } from "@/lib/utils";
import { useExplorerLocale } from "../useExplorer";

interface FieldTreeProps {
  fields: SelectedField[];
  onFieldToggle: (path: string[]) => void;
  path?: string[];
  level?: number;
}

export function FieldTree({
  fields,
  onFieldToggle,
  path = [],
  level = 0,
}: FieldTreeProps) {
  return (
    <div className="space-y-1">
      {fields.map((field) => (
        <FieldTreeItem
          key={field.name}
          field={field}
          onFieldToggle={onFieldToggle}
          path={[...path, field.name]}
          level={level}
        />
      ))}
    </div>
  );
}

interface FieldTreeItemProps {
  field: SelectedField;
  onFieldToggle: (path: string[]) => void;
  path: string[];
  level: number;
}

function FieldTreeItem({ field, onFieldToggle, path, level }: FieldTreeItemProps) {
  const locale = useExplorerLocale();
  const [isExpanded, setIsExpanded] = useState(false); // All collapsed by default
  const hasChildren = field.children && field.children.length > 0;
  const baseType = extractBaseType(field.type);
  const isScalar = isScalarType(baseType);
  const isArray = field.type.includes("[");
  const isAtMaxDepth = level >= QUERY_BUILDER.MAX_DEPTH;

  const t = (key: string) => useTranslation(`ui.graphQLExplorer.queryBuilder.${key}`, locale);

  // Styling
  const indentStyle = { paddingLeft: `${level * 1.5}rem` };
  const selectedCount = hasChildren
    ? field.children!.filter((c) => c.selected).length
    : 0;

  return (
    <div className="bg-transparent">
      <div
        className="flex items-center gap-2 py-1 px-1 bg-transparent"
        style={indentStyle}
      >
        {/* Expand/Collapse Icon */}
        {hasChildren && !isAtMaxDepth ? (
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? t('collapse') : t('expand')} ${field.name}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 rounded transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-600"
          >
            {isExpanded ? (
              <LuChevronDown aria-hidden="true" className="w-4 h-4" />
            ) : (
              <LuChevronRight aria-hidden="true" className="w-4 h-4" />
            )}
          </button>
        ) : hasChildren && isAtMaxDepth ? (
          <span className="w-5 text-xs text-amber-600 dark:text-amber-400" title={t('tooltips.maxDepthReached')}>⚠</span>
        ) : (
          <span className="w-5" /> // Spacer for alignment
        )}

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={field.selected}
          onChange={() => onFieldToggle(path)}
          aria-label={field.name}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Field Name */}
        <div
          onClick={() => {
            if (hasChildren) {
              setIsExpanded(!isExpanded);
            }
          }}
          className="flex-1 text-left flex items-center gap-2"
        >
          <span
            className={`font-mono text-sm ${
              field.selected
                ? "text-gray-900 dark:text-gray-100 font-medium"
                : "text-gray-600 dark:text-gray-400"
            }`}
          >
            {field.name}
          </span>

          {/* Type Badge */}
          <span
            className={`text-xs px-1.5 py-0.5 rounded font-medium ${
              isScalar
                ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200"
                : isArray
                ? "bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200"
                : "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200"
            }`}
          >
            {isArray ? "[]" : isScalar ? t('fieldTypes.scalar') : t('fieldTypes.object')}
          </span>

          {/* Selected Count for Objects */}
          {hasChildren && selectedCount > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({selectedCount} {t('selected')})
            </span>
          )}
        </div>
      </div>

      {/* Nested Children */}
      {hasChildren && isExpanded && (
        <FieldTree
          fields={field.children!}
          onFieldToggle={onFieldToggle}
          path={path}
          level={level + 1}
        />
      )}
    </div>
  );
}
