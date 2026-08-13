import { useTranslation } from "@/lib/utils";
import type { ExplorerError, ExplorerErrorCode } from "../lib/errors";

/**
 * Turns an error code into copy.
 *
 * This is the only place error codes become words. The service layer stays
 * language-free, which is what lets callers branch on *why* something failed.
 *
 * The exhaustive `Record` is deliberate: adding a code without adding copy is a
 * type error rather than a blank message at runtime.
 */
const MESSAGE_KEYS: Record<ExplorerErrorCode, string> = {
  empty_query: "emptyQuery",
  empty_token: "emptyToken",
  mutation_not_allowed: "mutationQueryNotAllowed",
  invalid_token: "invalidToken",
  expired_credential: "expiredCredential",
  insufficient_scope: "insufficientScope",
  blocked_operation: "blockedOperation",
  rate_limited: "rateLimited",
  connection_error: "connectionError",
  server_error: "errorRunning",
  query_error: "errorRunning",
};

export const ErrorNotice = ({
  error,
  locale,
}: {
  error: ExplorerError;
  locale: string;
}) => {
  const message = useTranslation(
    `ui.graphQLExplorer.statusMessages.${MESSAGE_KEYS[error.code]}`,
    locale,
  );

  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20 p-3"
    >
      <div className="flex items-start gap-2">
        <span aria-hidden="true" className="text-red-600 dark:text-red-400 text-sm">
          ✕
        </span>
        <div className="text-sm text-red-700 dark:text-red-300">
          <p>{message}</p>
          {/* The API's own wording, when it gave one. Always English, so it
              supplements the translated line rather than replacing it. */}
          {error.detail && (
            <p className="mt-1 font-mono text-xs opacity-80">{error.detail}</p>
          )}
        </div>
      </div>
    </div>
  );
};
