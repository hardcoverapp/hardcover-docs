/**
 * Pick the best default result view for a GraphQL response.
 *
 * Extracted from GraphQLRunnerEnhanced so the branching is unit-testable.
 * Chart is only auto-selected when there's genuinely something to plot: a single
 * row is nothing to chart — and ChartResults itself refuses fewer than 2 items —
 * so a one-row numeric result falls through to table/JSON rather than landing on
 * an empty "insufficient data" chart.
 */
export type ResultView = 'json' | 'table' | 'chart';

export function determineBestView(data: any, chartable: boolean): ResultView {
  if (!data) return 'json';

  // The first key's value (e.g. data.books, data.users, …).
  const firstKey = Object.keys(data)[0];
  const firstValue = data[firstKey];

  if (!Array.isArray(firstValue)) return 'json';
  if (firstValue.length === 0) return 'json';

  const firstItem = firstValue[0];
  if (typeof firstItem !== 'object' || firstItem === null) return 'json';

  const numericFields = Object.keys(firstItem).filter((key) => {
    const value = firstItem[key];
    return typeof value === 'number' && !isNaN(value);
  });

  // Needs 2+ points to be worth charting (matches ChartResults' minimum).
  if (firstValue.length >= 2 && numericFields.length >= 1 && chartable) {
    return 'chart';
  }

  // An array of similarly-shaped objects (not too wide) tables well.
  const allSimilar = firstValue.slice(0, 3).every((item: any) => {
    if (typeof item !== 'object' || item === null) return false;
    const itemKeys = Object.keys(item);
    return itemKeys.length > 0 && itemKeys.length <= 15;
  });

  return allSimilar ? 'table' : 'json';
}
