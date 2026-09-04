import type { ReactNode } from "react";
import { LuChartNoAxesCombined, LuCode, LuTable } from "react-icons/lu";
import { useTranslation } from "@/lib/utils";
import type { ResultView } from "../lib/view";
import { useExplorer } from "../useExplorer";
import { extractStatTiles } from "../lib/shape";
import { ChartResults } from "./results/ChartResults";
import { JSONResults } from "./results/JSONResults";
import { StatResults } from "./results/StatResults";
import { TableResults } from "./results/TableResults";
import { ToggleButton, type TogglePosition } from "./ToggleButton";

export const ResultsPanel = () => {
  const { config, presentation, setPresentation, results } = useExplorer();
  const { locale, chartable, forcePresentation } = config;

  const statTiles = extractStatTiles(results);

  const views: { view: ResultView; icon: ReactNode; position: TogglePosition }[] = [
    { view: "json", icon: <LuCode className="h-3.5 w-3.5" />, position: "start" },
    {
      view: "table",
      icon: <LuTable className="h-3.5 w-3.5" />,
      position: chartable ? "middle" : "end",
    },
    ...(chartable
      ? [
          {
            view: "chart" as const,
            icon: <LuChartNoAxesCombined className="h-3.5 w-3.5" />,
            position: "end" as const,
          },
        ]
      : []),
  ];

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {useTranslation("ui.graphQLExplorer.results", locale)}
        </h3>

        {!forcePresentation && (
          <div
            className="inline-flex rounded-md shadow-sm"
            role="group"
            aria-label={useTranslation("ui.graphQLExplorer.results", locale)}
          >
            {views.map(({ view, icon, position }) => (
              <ToggleButton
                key={view}
                pressed={presentation === view}
                onClick={() => setPresentation(view)}
                label={useTranslation(`ui.graphQLExplorer.views.${view}`, locale)}
                position={position}
              >
                {icon}
              </ToggleButton>
            ))}
          </div>
        )}
      </div>

      <div className="p-4">
        {presentation === "json" && <JSONResults results={results as object} locale={locale} />}
        {presentation === "table" && <TableResults results={results as object} locale={locale} />}
        {/* Aggregate results are headline numbers, not a series. Dispatching
            here rather than inside ChartResults keeps that component's hooks
            unconditional when the result shape changes between runs. */}
        {presentation === "chart" && chartable && (
          statTiles ? (
            <StatResults tiles={statTiles} />
          ) : (
            <ChartResults results={(results ?? {}) as Record<string, any>} />
          )
        )}
      </div>
    </div>
  );
};
