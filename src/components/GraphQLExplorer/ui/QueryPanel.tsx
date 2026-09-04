import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "@/lib/utils";
import { useExplorer } from "../useExplorer";

/** The query as it will be sent, placeholders already substituted. */
export const QueryPanel = () => {
  const { config, query } = useExplorer();
  const { locale, description } = config;

  return (
    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {useTranslation("ui.graphQLExplorer.query", locale)}
        </h3>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        )}
      </div>
      <ScrollArea className="w-full h-48 rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50 p-3">
        <pre className="text-xs font-mono text-gray-800 dark:text-gray-200">{query}</pre>
      </ScrollArea>
    </div>
  );
};
