import { useTranslation } from "@/lib/utils";
import { QueryBuilder } from "../builder/QueryBuilder";
import { isMutation } from "../lib/policy";
import { useExplorer } from "../useExplorer";
import { AuthPanel } from "./AuthPanel";
import { ErrorNotice } from "./ErrorNotice";
import { ExplorerToolbar } from "./ExplorerToolbar";
import { QueryPanel } from "./QueryPanel";
import { ResultsPanel } from "./ResultsPanel";

/**
 * Layout for one explorer. Composition only: every decision it renders is made
 * in the provider or the lib layer.
 */
export const ExplorerShell = () => {
  const { config, sourceQuery, mode, showAuth, showQuery, status, error } = useExplorer();
  const { locale } = config;

  if (isMutation(sourceQuery)) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20 p-4">
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="text-red-600 dark:text-red-400 mt-0.5">
            ⚠
          </span>
          <div>
            <h4 className="text-sm font-semibold text-red-900 dark:text-red-100">
              {useTranslation("ui.graphQLExplorer.statusMessages.warning", locale)}
            </h4>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {useTranslation(
                "ui.graphQLExplorer.statusMessages.mutationQueryNotAllowed",
                locale,
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ExplorerToolbar />

      {/* Progress and completion are announced without stealing focus.
          Failures are announced by ErrorNotice's own alert role. */}
      <p aria-live="polite" className="sr-only">
        {status === "running" &&
          useTranslation("ui.graphQLExplorer.statusMessages.loading", locale)}
        {status === "success" &&
          useTranslation("ui.graphQLExplorer.statusMessages.success", locale)}
      </p>

      {showAuth && <AuthPanel />}

      {error && <ErrorNotice error={error} locale={locale} />}

      {mode === "advanced" && (
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <QueryBuilder />
        </div>
      )}

      {mode === "static" && showQuery && <QueryPanel />}

      {status === "success" && <ResultsPanel />}
    </div>
  );
};
