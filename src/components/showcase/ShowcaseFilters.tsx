import * as React from 'react';
import { cn } from '@/lib/utils';

export type SortOption = 'newest' | 'updated' | 'alphabetical' | 'featured';

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
    <div className="not-content" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 300px', minWidth: '200px' }}>
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
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              height: '40px',
              paddingLeft: '40px',
              paddingRight: '16px',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          style={{
            height: '40px',
            padding: '0 12px',
            borderRadius: '6px',
            fontSize: '14px',
            outline: 'none',
            width: '180px',
            boxSizing: 'border-box',
          }}
          className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={() => onCategoryChange(null)}
          style={{
            height: '32px',
            padding: '0 12px',
            fontSize: '14px',
            fontWeight: 500,
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
          }}
          className={
            selectedCategory === null
              ? 'bg-blue-600 text-white border-0'
              : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }
        >
          All
        </button>
        {availableCategories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            style={{
              height: '32px',
              padding: '0 12px',
              fontSize: '14px',
              fontWeight: 500,
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxSizing: 'border-box',
            }}
            className={
              selectedCategory === category
                ? 'bg-blue-600 text-white border-0'
                : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }
          >
            <span>{getCategoryIcon(category)}</span>
            <span>{category}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
