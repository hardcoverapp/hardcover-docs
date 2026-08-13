import { URLS } from "@/Consts";
import { ExplorerProvider, type ExplorerConfig, type ExplorerMode } from "./ExplorerProvider";
import type { ResultView } from "./lib/view";
import { ExplorerShell } from "./ui/ExplorerShell";

/**
 * The single client-side entry point for one explorer.
 *
 * Everything here arrives from Astro frontmatter and therefore crosses a JSON
 * boundary — props must stay serialisable. Anything richer is constructed
 * inside the island.
 */
export interface ExplorerIslandProps {
  query: string;
  description?: string;
  presentation?: ResultView;
  forcePresentation?: ResultView | null;
  chartable?: boolean;
  locale?: string;
  initialQueryType?: string;
  showQueryTypeSelector?: boolean;
  defaultMode?: ExplorerMode;
  canToggleMode?: boolean;
}

export const ExplorerIsland = ({
  query,
  description = "",
  presentation,
  forcePresentation = null,
  chartable = true,
  locale = "en",
  initialQueryType,
  showQueryTypeSelector = false,
  defaultMode = "static",
  canToggleMode = false,
}: ExplorerIslandProps) => {
  const config: ExplorerConfig = {
    endpoint: URLS.GRAPHQL_URL,
    locale,
    description,
    chartable,
    forcePresentation,
    canToggleMode,
    showQueryTypeSelector,
    initialQueryType,
  };

  return (
    <ExplorerProvider
      config={config}
      initialQuery={query}
      defaultMode={defaultMode}
      initialPresentation={presentation ?? null}
    >
      <ExplorerShell />
    </ExplorerProvider>
  );
};

export default ExplorerIsland;
