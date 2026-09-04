import { formatStatValue, type StatTile } from "../../lib/shape";

/**
 * A row of stat tiles for results that are headline numbers rather than a series.
 *
 * Aggregate queries return unrelated magnitudes — a count in the hundreds of
 * thousands beside an average below one. Plotting those on a shared axis renders
 * everything but the largest as nothing, and two axes would invent a
 * relationship the data does not have. The numbers are the visualisation.
 */
export const StatResults = ({ tiles }: { tiles: StatTile[] }) => (
  <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
    {tiles.map((tile) => (
      <div
        key={tile.key}
        className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
      >
        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">{tile.label}</dt>
        {/* Proportional figures: tabular-nums makes standalone numbers look
            loose at display sizes. It belongs in the table view, not here. */}
        <dd
          className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100"
          title={String(tile.value)}
        >
          {formatStatValue(tile.value)}
        </dd>
      </div>
    ))}
  </dl>
);
