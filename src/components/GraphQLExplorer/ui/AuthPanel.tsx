import { useEffect, useId, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/lib/utils";
import { useExplorer } from "../useExplorer";

/**
 * Token entry.
 *
 * The field is uncontrolled-ish on purpose: the reader types freely and the
 * token is only validated and persisted on blur, so we do not fire a request
 * per keystroke.
 */
export const AuthPanel = () => {
  const { config, credential, submitToken, viewerStatus } = useExplorer();
  const { locale } = config;
  const fieldId = useId();
  const hintId = useId();

  const stored = credential.kind === "pat" ? credential.token : "";
  const [draft, setDraft] = useState(stored);

  // Adopt the stored token once it has been read from storage at mount.
  useEffect(() => setDraft(stored), [stored]);

  return (
    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <label
        htmlFor={fieldId}
        className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block"
      >
        {useTranslation("ui.graphQLExplorer.authToken", locale)}
      </label>
      <p id={hintId} className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        {useTranslation("ui.graphQLExplorer.authTokenDescription", locale)}
      </p>
      <Textarea
        id={fieldId}
        aria-describedby={hintId}
        className="font-mono text-sm min-h-20"
        placeholder="Bearer your-token-here"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={(event) => void submitToken(event.target.value)}
      />
      {viewerStatus === "unavailable" && (
        <p role="status" className="mt-2 text-xs text-amber-700 dark:text-amber-400">
          {useTranslation("ui.graphQLExplorer.statusMessages.userIdUnavailable", locale)}
        </p>
      )}
    </div>
  );
};
