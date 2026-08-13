import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getPreference, setPreference } from "@/lib/utils";
import { executeQuery, fetchViewerId } from "./lib/client";
import {
  NO_CREDENTIAL,
  readCredential,
  readUserId,
  writeCredential,
  writeUserId,
  type Credential,
} from "./lib/credentials";
import type { ExplorerError } from "./lib/errors";
import { canRun } from "./lib/policy";
import { hasUserIdToken, substituteTokens } from "./lib/tokens";
import { determineBestView, type ResultView } from "./lib/view";

export type ExplorerMode = "static" | "advanced";

export type QueryStatus = "idle" | "running" | "success" | "error";

/**
 * Whether the reader's own id could be resolved. `unavailable` means the
 * credential is fine but lacks `read:me` — `##USER_ID##` cannot be filled in,
 * which is very different from the credential being wrong.
 */
export type ViewerStatus = "unknown" | "resolved" | "unavailable";

export interface ExplorerConfig {
  endpoint: string;
  locale: string;
  description: string;
  chartable: boolean;
  /** When set, the reader cannot switch result views. */
  forcePresentation: ResultView | null;
  canToggleMode: boolean;
  showQueryTypeSelector: boolean;
  initialQueryType?: string;
}

export interface ExplorerContextValue {
  config: ExplorerConfig;

  /**
   * The query exactly as the MDX page authored it. Never changes.
   *
   * The builder seeds itself from this rather than from `sourceQuery`: seeding
   * from the live query would re-run its initialisation every time it emitted a
   * new one, which loops.
   */
  authoredQuery: string;
  /** The current query, before placeholder substitution. */
  sourceQuery: string;
  /** What will actually be sent. */
  query: string;
  setQuery: (query: string) => void;

  credential: Credential;
  /** Persist and validate a pasted token. */
  submitToken: (token: string) => Promise<void>;
  userId: string | null;
  viewerStatus: ViewerStatus;
  /** True when the query needs an id we could not resolve. */
  userIdUnresolved: boolean;

  status: QueryStatus;
  results: unknown;
  error: ExplorerError | null;
  run: () => Promise<void>;

  mode: ExplorerMode;
  setMode: (mode: ExplorerMode) => void;

  presentation: ResultView;
  setPresentation: (view: ResultView) => void;

  showAuth: boolean;
  toggleAuth: () => void;
  showQuery: boolean;
  toggleQuery: () => void;
}

export const ExplorerContext = createContext<ExplorerContextValue | null>(null);

export interface ExplorerProviderProps {
  config: ExplorerConfig;
  initialQuery: string;
  defaultMode: ExplorerMode;
  /** Page-authored starting view; falls back to the reader's saved preference. */
  initialPresentation?: ResultView | null;
  children: React.ReactNode;
}

/**
 * Owns everything for a single explorer.
 *
 * Each "Try it" tab is its own island and its own provider — there is
 * deliberately no state shared between explorers on a page or across pages.
 * They are independent try-it-yourself views.
 */
export const ExplorerProvider = ({
  config,
  initialQuery,
  defaultMode,
  initialPresentation = null,
  children,
}: ExplorerProviderProps) => {
  const [credential, setCredential] = useState<Credential>(NO_CREDENTIAL);
  const [userId, setUserId] = useState<string | null>(null);
  const [viewerStatus, setViewerStatus] = useState<ViewerStatus>("unknown");

  const [mode, setMode] = useState<ExplorerMode>(defaultMode);
  const [sourceQuery, setSourceQuery] = useState(initialQuery);

  const [status, setStatus] = useState<QueryStatus>("idle");
  const [results, setResults] = useState<unknown>(null);
  const [error, setError] = useState<ExplorerError | null>(null);

  const [presentation, setPresentationState] = useState<ResultView>(
    () =>
      config.forcePresentation ??
      initialPresentation ??
      (getPreference("graphQLResults") as ResultView) ??
      "json",
  );

  const [showAuth, setShowAuth] = useState(false);
  const [showQuery, setShowQuery] = useState(defaultMode === "static");
  /** Once the reader opens the query panel themselves, stop auto-hiding it. */
  const queryPanelPinned = useRef(false);

  const inFlight = useRef<AbortController | null>(null);

  // Credentials are read once per island at mount. We deliberately do not
  // validate here: on a page with fourteen explorers that would be fourteen
  // requests before the reader has done anything.
  useEffect(() => {
    const stored = readCredential();
    setCredential(stored);
    setShowAuth(stored.kind === "none");

    const storedUserId = readUserId();
    if (storedUserId) {
      setUserId(storedUserId);
      setViewerStatus("resolved");
    }
  }, []);

  useEffect(() => {
    setSourceQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => () => inFlight.current?.abort(), []);

  const query = useMemo(
    () => (mode === "static" ? substituteTokens(sourceQuery, { userId }) : sourceQuery),
    [mode, sourceQuery, userId],
  );

  const userIdUnresolved = hasUserIdToken(query);

  const submitToken = useCallback(
    async (raw: string) => {
      const token = raw.trim();

      if (!token) {
        setCredential(NO_CREDENTIAL);
        writeCredential(NO_CREDENTIAL);
        setUserId(null);
        setViewerStatus("unknown");
        return;
      }

      const next: Credential = { kind: "pat", token };
      setCredential(next);

      const viewer = await fetchViewerId({ endpoint: config.endpoint, credential: next });

      if (viewer.status === "unauthenticated") {
        setError(viewer.error);
        setStatus("error");
        setViewerStatus("unknown");
        return;
      }

      // The token works. Persist it even when we could not read an id — a
      // catalog-scoped token is perfectly usable for most documented examples.
      writeCredential(next);
      setError(null);
      setStatus((current) => (current === "error" ? "idle" : current));

      if (viewer.status === "ok") {
        setUserId(viewer.userId);
        writeUserId(viewer.userId);
        setViewerStatus("resolved");
      } else {
        setUserId(null);
        setViewerStatus("unavailable");
      }
    },
    [config.endpoint],
  );

  const setPresentation = useCallback((view: ResultView) => {
    setPresentationState(view);
    setPreference("graphQLResults", view);
  }, []);

  const run = useCallback(async () => {
    const verdict = canRun(query, credential);
    if (!verdict.allowed) {
      setError(verdict.error);
      setStatus("error");
      return;
    }

    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;

    setStatus("running");
    setError(null);

    let result;
    try {
      result = await executeQuery({
        endpoint: config.endpoint,
        query,
        credential,
        signal: controller.signal,
      });
    } catch {
      // Superseded by a newer run; the newer one owns the UI now.
      return;
    }

    if (controller.signal.aborted) return;

    if (!result.ok) {
      setError(result.error);
      setStatus("error");
      return;
    }

    setResults(result.data);
    setStatus("success");

    if (!config.forcePresentation) {
      setPresentationState(determineBestView(result.data, config.chartable));
    }

    // Collapsing the query panel is a presentation decision, so it lives here
    // rather than inside the fetch as it used to.
    if (!queryPanelPinned.current) {
      setShowQuery(false);
    }
  }, [query, credential, config.endpoint, config.forcePresentation, config.chartable]);

  const toggleAuth = useCallback(() => setShowAuth((open) => !open), []);

  const toggleQuery = useCallback(() => {
    queryPanelPinned.current = true;
    setShowQuery((open) => !open);
  }, []);

  const value = useMemo<ExplorerContextValue>(
    () => ({
      config,
      authoredQuery: initialQuery,
      sourceQuery,
      query,
      setQuery: setSourceQuery,
      credential,
      submitToken,
      userId,
      viewerStatus,
      userIdUnresolved,
      status,
      results,
      error,
      run,
      mode,
      setMode,
      presentation,
      setPresentation,
      showAuth,
      toggleAuth,
      showQuery,
      toggleQuery,
    }),
    [
      config,
      initialQuery,
      sourceQuery,
      query,
      credential,
      submitToken,
      userId,
      viewerStatus,
      userIdUnresolved,
      status,
      results,
      error,
      run,
      mode,
      presentation,
      setPresentation,
      showAuth,
      toggleAuth,
      showQuery,
      toggleQuery,
    ],
  );

  return <ExplorerContext.Provider value={value}>{children}</ExplorerContext.Provider>;
};
