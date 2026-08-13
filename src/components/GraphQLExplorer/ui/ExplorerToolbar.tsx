import { LuCode, LuKeyRound, LuLoader, LuPlay, LuTerminal, LuWand } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/utils";
import { useExplorer } from "../useExplorer";
import { ToggleButton } from "./ToggleButton";

export const ExplorerToolbar = () => {
  const {
    config,
    mode,
    setMode,
    showAuth,
    toggleAuth,
    showQuery,
    toggleQuery,
    status,
    run,
  } = useExplorer();
  const { locale, canToggleMode } = config;

  const running = status === "running";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      <div className="flex items-center gap-2 flex-wrap">
        {canToggleMode && (
          <>
            <div
              className="inline-flex rounded-md shadow-sm"
              role="group"
              aria-label={useTranslation("ui.graphQLExplorer.queryBuilder.mode", locale)}
            >
              <ToggleButton
                pressed={mode === "static"}
                onClick={() => setMode("static")}
                label={useTranslation("ui.graphQLExplorer.queryBuilder.static", locale)}
                position="start"
                className="px-3 py-1.5"
              >
                <LuTerminal aria-hidden="true" className="inline h-3.5 w-3.5 mr-1.5" />
                {useTranslation("ui.graphQLExplorer.queryBuilder.static", locale)}
              </ToggleButton>
              <ToggleButton
                pressed={mode === "advanced"}
                onClick={() => setMode("advanced")}
                label={useTranslation("ui.graphQLExplorer.queryBuilder.advancedBuilder", locale)}
                position="end"
                className="px-3 py-1.5"
              >
                <LuWand aria-hidden="true" className="inline h-3.5 w-3.5 mr-1.5" />
                {useTranslation("ui.graphQLExplorer.queryBuilder.advancedBuilder", locale)}
              </ToggleButton>
            </div>

            <div aria-hidden="true" className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
          </>
        )}

        <div className="flex items-center gap-1">
          <ToggleButton
            pressed={showAuth}
            onClick={toggleAuth}
            label={useTranslation("ui.graphQLExplorer.viewAuthToken", locale)}
            position="only"
            className="h-7 px-2"
          >
            <LuKeyRound aria-hidden="true" className="h-3.5 w-3.5" />
          </ToggleButton>

          {mode === "static" && (
            <ToggleButton
              pressed={showQuery}
              onClick={toggleQuery}
              label={useTranslation("ui.graphQLExplorer.viewQuery", locale)}
              position="only"
              className="h-7 px-2"
            >
              <LuCode aria-hidden="true" className="h-3.5 w-3.5" />
            </ToggleButton>
          )}
        </div>
      </div>

      <Button
        onClick={() => void run()}
        title={useTranslation("ui.graphQLExplorer.runDescription", locale)}
        disabled={running}
        size="sm"
        className="gap-2 !bg-accent-600 !text-white hover:!bg-accent-600/90 h-7 px-4"
      >
        {running ? (
          <>
            <LuLoader aria-hidden="true" className="animate-spin h-3.5 w-3.5" />
            <span className="text-xs">
              {useTranslation("ui.graphQLExplorer.statusMessages.loading", locale)}
            </span>
          </>
        ) : (
          <>
            <LuPlay aria-hidden="true" className="h-3.5 w-3.5" />
            <span className="text-xs">{useTranslation("ui.graphQLExplorer.run", locale)}</span>
          </>
        )}
      </Button>
    </div>
  );
};
