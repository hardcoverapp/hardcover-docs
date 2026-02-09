import * as React from 'react';
import { cn } from '@/lib/utils';

export type SortOption = 'newest' | 'updated' | 'alphabetical' | 'featured' | 'stars';

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'Browser Extension': '🧩',
    'Mobile App': '📱',
    'Web App': '🌐',
    'CLI Tool': '⌨️',
    'E-ink Display': '📊',
    'Home Automation': '🏠',
    'Desktop App': '💻',
    'Widget': '📊',
    'Integration': '🔗',
    'Automation': '⚡',
    'Other': '📦',
  };
  return icons[category] || '📦';
}

interface ShowcaseFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  availableCategories: string[];
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'featured', label: 'Featured First' },
  { value: 'newest', label: 'Newest' },
  { value: 'updated', label: 'Recently Updated' },
  { value: 'stars', label: 'Most Stars' },
  { value: 'alphabetical', label: 'Alphabetical' },
];

export function ShowcaseFilters({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  availableCategories,
}: ShowcaseFiltersProps) {
  return (
    <div className="not-content flex flex-col gap-4">
      <div className="flex flex-row items-center gap-4 flex-wrap">
        <div className="relative flex-[1_1_300px] min-w-[200px]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-md text-sm outline-none box-border bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="h-10 px-3 rounded-md text-sm outline-none w-[180px] box-border bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => onCategoryChange(null)}
          className={cn(
            'h-8 px-3 text-sm font-medium rounded-md cursor-pointer inline-flex items-center justify-center box-border',
            selectedCategory === null
              ? 'bg-blue-600 text-white border-0'
              : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          )}
        >
          All
        </button>
        {availableCategories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={cn(
              'h-8 px-3 text-sm font-medium rounded-md cursor-pointer inline-flex items-center justify-center gap-1.5 box-border',
              selectedCategory === category
                ? 'bg-blue-600 text-white border-0'
                : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
          >
            <span>{getCategoryIcon(category)}</span>
            <span>{category}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
