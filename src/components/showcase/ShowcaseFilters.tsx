import { cn, useTranslation as t } from '@/lib/utils';

export type SourceFilter = 'All' | 'Open source' | 'Closed source';

interface ShowcaseFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  source: SourceFilter;
  onSourceChange: (source: SourceFilter) => void;
  counts: { all: number; oss: number; closed: number };
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  availableCategories: string[];
}

const SOURCES: SourceFilter[] = ['All', 'Open source', 'Closed source'];

// SourceFilter values double as state, so they stay English; only the visible
// label is translated.
const SOURCE_KEYS: Record<SourceFilter, string> = {
  All: 'ui.showcase.filters.all',
  'Open source': 'ui.showcase.filters.openSource',
  'Closed source': 'ui.showcase.filters.closedSource',
};

export function ShowcaseFilters({
  search,
  onSearchChange,
  source,
  onSourceChange,
  counts,
  selectedCategory,
  onCategoryChange,
  availableCategories,
}: ShowcaseFiltersProps) {
  return (
    <div className="not-content flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3.5">
        {/* Search */}
        <div className="flex max-w-[520px] flex-[1_1_340px] items-center gap-3 rounded-xl border border-border bg-card px-[18px] py-[15px] shadow-hc transition-colors focus-within:border-indigo-line">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-muted-foreground">
            <circle cx="9" cy="9" r="6" />
            <path d="m14 14 4 4" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('ui.showcase.filters.searchPlaceholder')}
            className="flex-1 border-0 bg-transparent text-base text-foreground outline-hidden placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              aria-label={t('ui.showcase.filters.clearSearch')}
              className="cursor-pointer border-0 bg-transparent text-base text-muted-foreground"
            >
              ×
            </button>
          )}
        </div>

        {/* Source segmented control */}
        <div className="inline-flex gap-0.5 rounded-[10px] border border-border bg-muted p-[3px] dark:bg-background">
          {SOURCES.map((label) => {
            const active = source === label;
            const n = label === 'All' ? counts.all : label === 'Open source' ? counts.oss : counts.closed;
            return (
              <button
                key={label}
                onClick={() => onSourceChange(label)}
                className={cn(
                  'inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] transition-colors',
                  active
                    ? 'bg-card font-semibold text-foreground shadow-hc'
                    : 'bg-transparent font-medium text-[var(--hc-ink-2)] hover:text-foreground'
                )}
              >
                {label === 'Open source' && <span className="h-[7px] w-[7px] rounded-full bg-primary" />}
                {label === 'Closed source' && <span className="h-[7px] w-[7px] rounded-full bg-closed" />}
                {t(SOURCE_KEYS[label])}
                <span className="font-medium opacity-55">{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-[7px]">
        <button
          onClick={() => onCategoryChange(null)}
          className={cn(
            'cursor-pointer rounded-full border px-[13px] py-1.5 text-[12.5px] font-medium transition-colors',
            selectedCategory === null
              ? 'border-foreground bg-foreground text-[var(--hc-paper)]'
              : 'border-border bg-card text-[var(--hc-ink-2)]'
          )}
        >
          All
        </button>
        {availableCategories.map((category) => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={cn(
              'cursor-pointer rounded-full border px-[13px] py-1.5 text-[12.5px] font-medium transition-colors',
              selectedCategory === category
                ? 'border-foreground bg-foreground text-[var(--hc-paper)]'
                : 'border-border bg-card text-[var(--hc-ink-2)]'
            )}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
