/**
 * Try one SDK method: fill in its inputs, see the code to copy, run it with
 * your token (reads) or preview exactly what it would send (writes), and see
 * the result, every request the SDK made, and the rate limit.
 *
 * Each explorer on a page is independent. The token is shared with the
 * GraphQL explorer, so a reader who pasted one there is signed in here too.
 */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import * as sdk from "@hardcover/sdk";
import { clearCredential, readCredential, writeCredential } from "@/components/GraphQLExplorer/lib/credentials";
import { lookupExample, lookupInputs, rememberViewer } from "./lib/lookup";
import { URLS } from "@/Consts";
import { buildArgs, exampleValues, InputError, type Values } from "./lib/args";
import { findMethod, type Param } from "./lib/catalog";
import { snippet } from "./lib/codegen";
import { call, type Outcome } from "./lib/run";
import "./SdkExplorer.css";

export interface SdkExplorerProps {
  /** "library.add" */
  method: string;
  /** Overrides for the catalog's example values, by input path ("bookId", "options.status"). */
  values?: Values;
  /** On a page that already shows the summary and scopes: show just the call and its badge. */
  compact?: boolean;
}

type Status = "idle" | "running" | "done";
type Tab = "result" | "requests" | "rateLimit";

export const SdkExplorerIsland = ({ method: id, values: overrides, compact = false }: SdkExplorerProps) => {
  const found = findMethod(id);
  const headingId = useId();

  const [values, setValues] = useState<Values>(() => (found ? { ...exampleValues(found.method), ...overrides } : {}));
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [tab, setTab] = useState<Tab>("result");
  const [copied, setCopied] = useState(false);

  // Inputs the reader changed (lookups never overwrite them) and inputs filled from their account.
  const touched = useRef(new Set<string>());
  const [fromAccount, setFromAccount] = useState<Set<string>>(new Set());

  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  // The saved token is read after mount: storage isn't there during the build.
  useEffect(() => {
    const credential = readCredential();
    if (credential.kind === "pat") setToken(credential.token);
  }, []);

  // Look examples up only once the explorer is on screen, not for a whole page at load.
  useEffect(() => {
    const element = sectionRef.current;
    if (!element || typeof IntersectionObserver === "undefined") return setVisible(true);

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "200px" });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Fill in examples from the reader's account, in call order so one can use
  // another (a list's id, then that list's rows).
  useEffect(() => {
    if (!found || !token || !visible) return;

    let cancelled = false;
    const inputs = lookupInputs(found.method.params);

    void (async () => {
      let current = values;

      for (const { path, lookup } of inputs) {
        if (touched.current.has(path)) continue;

        const example = await lookupExample(lookup, token, current);
        if (cancelled) return;
        if (example === undefined) continue;

        current = { ...current, [path]: example };
        setValues((latest) => (touched.current.has(path) ? latest : { ...latest, [path]: example }));
        setFromAccount((paths) => new Set(paths).add(path));
      }
    })();

    return () => {
      cancelled = true;
    };
    // Runs per token and once visible; values are read at the start on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [found?.method, token, visible]);

  // The arguments, or which input is wrong. The code panel always matches what would run.
  const built = useMemo(() => {
    if (!found) return { error: null, args: [] };
    try {
      return { error: null, args: buildArgs(found.method, values) };
    } catch (error) {
      return { error: error instanceof InputError ? error : null, args: [] };
    }
  }, [found, values]);

  if (!found) {
    return <p className="sdkx-missing">Unknown SDK method: {id}</p>;
  }

  const { resource, method } = found;
  const preview = method.writes;
  const code = snippet(resource, method.name, built.args).code;

  const set = (path: string, value: string | boolean) => {
    touched.current.add(path);
    setFromAccount((paths) => {
      const next = new Set(paths);
      next.delete(path);
      return next;
    });
    setValues((current) => ({ ...current, [path]: value }));
  };

  // A new token: forget the old one's user id, then learn this one's.
  const saveToken = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === token) return;

    clearCredential();
    setToken(trimmed);

    if (trimmed) {
      writeCredential({ kind: "pat", token: trimmed });
      void rememberViewer(trimmed);
    }
  };

  const run = async () => {
    if (built.error || !token) return;

    setStatus("running");
    setOutcome(null);

    const result = await call({ resource, method: method.name, args: built.args, token, preview });

    setOutcome(result);
    setTab(result.error ? "requests" : preview ? "requests" : "result");
    setStatus("done");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the code is still selectable.
    }
  };

  const callName = resource.call === "function" ? `${method.name}(hc, …)` : `hc.${resource.name}.${method.name}`;

  return (
    <section className="sdkx" aria-labelledby={headingId} ref={sectionRef}>
      <header className="sdkx-head">
        <div className="sdkx-title">
          <h4 id={headingId}>
            <code>{callName}</code>
          </h4>
          <span className={`sdkx-badge ${method.destructive ? "is-delete" : method.writes ? "is-write" : "is-read"}`}>
            {method.destructive ? "Deletes · preview only" : method.writes ? "Writes · preview only" : "Reads"}
          </span>
        </div>
        {!compact && <p className="sdkx-summary">{method.summary}</p>}
        {!compact && method.scopes.length > 0 && (
          <p className="sdkx-scopes">
            <span>Scopes:</span>{" "}
            {method.scopes.map((scope) => (
              <code key={scope}>{scope}</code>
            ))}
          </p>
        )}
      </header>

      <div className="sdkx-body">
        <form
          className="sdkx-form"
          onSubmit={(event) => {
            event.preventDefault();
            void run();
          }}
        >
          <fieldset>
            <legend>Inputs</legend>
            {method.params.length === 0 && <p className="sdkx-hint">This method takes no inputs.</p>}
            {method.params.map((param) => (
              <Field key={param.name} param={param} path={param.name} values={values} set={set} error={built.error} fromAccount={fromAccount} />
            ))}
          </fieldset>

          <div className="sdkx-actions">
            <button type="submit" className="sdkx-run" disabled={!token || Boolean(built.error) || status === "running"}>
              {status === "running" ? "Running…" : preview ? "Preview request" : "Run"}
            </button>
            <TokenStatus token={token} showToken={showToken} toggle={() => setShowToken((shown) => !shown)} />
          </div>

          {showToken && <TokenField token={token} save={saveToken} />}
          {preview && (
            <p className="sdkx-hint">
              Nothing changes on your account: reads the method needs first still run, and the write stops before it's sent.
            </p>
          )}
        </form>

        <div className="sdkx-code">
          <div className="sdkx-code-head">
            <span>Example usage</span>
            <button type="button" onClick={() => void copy()}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre tabIndex={0} aria-label="Example usage for this call">
            <code>{code}</code>
          </pre>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {status === "running" ? "Running" : status === "done" ? (outcome?.error ? `Failed: ${outcome.error.name}` : "Done") : ""}
      </p>

      {outcome && <Results outcome={outcome} tab={tab} setTab={setTab} />}
    </section>
  );
};

// One input, labeled, with its hint and any error tied to it.
interface FieldProps {
  param: Param;
  path: string;
  values: Values;
  set: (path: string, value: string | boolean) => void;
  error: InputError | null;
  fromAccount: Set<string>;
}

function Field({ param, path, values, set, error, fromAccount }: FieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const value = values[path];
  const failed = error?.path === path;
  const filled = fromAccount.has(path);
  const describedBy = [param.hint || filled ? hintId : "", failed ? errorId : ""].filter(Boolean).join(" ") || undefined;

  if (param.kind === "options") {
    // Required fields and those with a value up front; the rest one click away.
    const fields = param.fields ?? [];
    const prominent = (field: Param) => field.required || hasValue(values, `${path}.${field.name}`);
    const shown = fields.filter(prominent);
    const more = fields.filter((field) => !prominent(field));

    const render = (field: Param) => (
      <Field key={field.name} param={field} path={`${path}.${field.name}`} values={values} set={set} error={error} fromAccount={fromAccount} />
    );

    return (
      <fieldset className="sdkx-options">
        <legend>{param.label || "Options"}</legend>
        {shown.map(render)}
        {more.length > 0 && (
          <details className="sdkx-more">
            <summary>More options ({more.length})</summary>
            <div>{more.map(render)}</div>
          </details>
        )}
      </fieldset>
    );
  }

  if (param.kind === "period") return <PeriodField path={path} values={values} set={set} />;

  const common = { id, "aria-describedby": describedBy, "aria-invalid": failed || undefined };
  const text = typeof value === "string" ? value : "";

  let control;
  switch (param.kind) {
    case "boolean":
      // Optional: not set / Yes / No, so "false" and "not set" stay different.
      control = param.required ? (
        <input {...common} type="checkbox" checked={value === true} onChange={(e) => set(path, e.target.checked)} />
      ) : (
        <select {...common} value={text} onChange={(e) => set(path, e.target.value)}>
          <option value="">(not set)</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      );
      break;
    case "enum": {
      const all = Object.keys((sdk as unknown as Record<string, Record<string, unknown>>)[param.enum!] ?? {});
      const members = param.values ?? all;
      control = (
        <select {...common} value={text} onChange={(e) => set(path, e.target.value)}>
          {!param.required && <option value="">(not set)</option>}
          {members.map((key) => (
            <option key={key} value={key}>
              {key.replace(/([a-z])([A-Z])/g, "$1 $2")}
            </option>
          ))}
        </select>
      );
      break;
    }
    case "literal":
      control = (
        <select {...common} value={text} onChange={(e) => set(path, e.target.value)}>
          {!param.required && <option value="">(not set)</option>}
          {(param.values ?? []).map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      );
      break;
    case "longText":
    case "lines":
    case "json":
      control = <textarea {...common} value={text} rows={param.kind === "json" ? 6 : 3} spellCheck={param.kind === "longText"} onChange={(e) => set(path, e.target.value)} />;
      break;
    default:
      control = (
        <input
          {...common}
          type={param.kind === "number" ? "number" : param.kind === "date" ? "date" : param.kind === "datetime" ? "datetime-local" : "text"}
          step={param.kind === "number" ? "any" : undefined}
          value={text}
          onChange={(e) => set(path, e.target.value)}
        />
      );
  }

  return (
    <div className={`sdkx-field ${param.kind === "boolean" && param.required ? "is-check" : ""}`}>
      <label htmlFor={id}>
        {param.label}
        {param.required && <span className="sdkx-required"> (required)</span>}
      </label>
      {control}
      {(param.hint || filled) && (
        <p id={hintId} className="sdkx-hint">
          {filled && <span className="sdkx-from-account">From your account. </span>}
          {param.hint}
        </p>
      )}
      {failed && (
        <p id={errorId} className="sdkx-field-error">
          {error!.message}
        </p>
      )}
    </div>
  );
}

// Whether an input (or anything inside a group of inputs) has a value.
function hasValue(values: Values, path: string): boolean {
  return Object.entries(values).some(
    ([key, value]) => (key === path || key.startsWith(`${path}.`)) && (value === true || (typeof value === "string" && value !== "")),
  );
}

// A stats period: life, a year, a month, or a custom range.
function PeriodField({ path, values, set }: { path: string; values: Values; set: (path: string, value: string | boolean) => void }) {
  const id = useId();
  const kind = String(values[`${path}.kind`] ?? "year");
  const input = (name: string, label: string, type: string) => (
    <div className="sdkx-field">
      <label htmlFor={`${id}-${name}`}>{label}</label>
      <input id={`${id}-${name}`} type={type} value={String(values[`${path}.${name}`] ?? "")} onChange={(e) => set(`${path}.${name}`, e.target.value)} />
    </div>
  );

  return (
    <fieldset className="sdkx-options">
      <legend>Period</legend>
      <div className="sdkx-field">
        <label htmlFor={`${id}-kind`}>Span</label>
        <select id={`${id}-kind`} value={kind} onChange={(e) => set(`${path}.kind`, e.target.value)}>
          <option value="year">A year</option>
          <option value="month">A month</option>
          <option value="custom">Custom range</option>
          <option value="life">Everything</option>
        </select>
      </div>
      {(kind === "year" || kind === "month") && input("year", "Year", "number")}
      {kind === "month" && input("month", "Month (1 to 12)", "number")}
      {kind === "custom" && input("from", "From", "date")}
      {kind === "custom" && input("to", "To", "date")}
    </fieldset>
  );
}

function TokenStatus({ token, showToken, toggle }: { token: string; showToken: boolean; toggle: () => void }) {
  return (
    <p className="sdkx-token-status">
      {token ? "Using your saved token." : "Add a token to run this."}{" "}
      <button type="button" className="sdkx-link" aria-expanded={showToken} onClick={toggle}>
        {token ? "Change" : "Add token"}
      </button>
    </p>
  );
}

function TokenField({ token, save }: { token: string; save: (raw: string) => void }) {
  const id = useId();
  const [draft, setDraft] = useState(token);
  const [visible, setVisible] = useState(false);

  return (
    <div className="sdkx-field sdkx-token">
      <label htmlFor={id}>Personal access token</label>
      <div className="sdkx-token-row">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete="off"
          spellCheck={false}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => save(e.target.value)}
          aria-describedby={`${id}-hint`}
        />
        <button type="button" onClick={() => setVisible((shown) => !shown)} aria-pressed={visible}>
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      <p id={`${id}-hint`} className="sdkx-hint">
        Saved in this browser only, and shared with the GraphQL explorer.{" "}
        <a href={URLS.API_NEW_TOKEN_URL}>Create a token</a>.
      </p>
    </div>
  );
}

function Results({ outcome, tab, setTab }: { outcome: Outcome; tab: Tab; setTab: (tab: Tab) => void }) {
  const tabs: [Tab, string][] = [
    ["result", outcome.mode === "preview" ? "Result (preview)" : "Result"],
    ["requests", `Requests (${outcome.requests.length})`],
    ["rateLimit", "Rate limit"],
  ];

  return (
    <div className="sdkx-results">
      {outcome.error && <ErrorCard error={outcome.error} />}

      <div role="tablist" aria-label="Results" className="sdkx-tabs">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={tab === key}
            tabIndex={tab === key ? 0 : -1}
            onClick={() => setTab(key)}
            onKeyDown={(e) => {
              const index = tabs.findIndex(([k]) => k === key);
              if (e.key === "ArrowRight") setTab(tabs[(index + 1) % tabs.length]![0]);
              if (e.key === "ArrowLeft") setTab(tabs[(index + tabs.length - 1) % tabs.length]![0]);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="sdkx-panel" tabIndex={0}>
        {tab === "result" &&
          (outcome.mode === "preview" ? (
            <p className="sdkx-hint">Previews don't send the write, so there's no result. See Requests for exactly what it would send.</p>
          ) : (
            <pre>{outcome.result === undefined ? "(no value)" : JSON.stringify(outcome.result, null, 2)}</pre>
          ))}

        {tab === "requests" && <Requests outcome={outcome} />}

        {tab === "rateLimit" &&
          (outcome.rateLimit ? (
            <dl className="sdkx-limits">
              <dt>Burst left</dt>
              <dd>
                {outcome.rateLimit.burst?.remaining ?? "?"} of {outcome.rateLimit.burst?.limit ?? "?"}
              </dd>
              <dt>Today left</dt>
              <dd>
                {outcome.rateLimit.daily?.remaining ?? "?"} of {outcome.rateLimit.daily?.limit ?? "?"}
              </dd>
              <dt>Tier</dt>
              <dd>{outcome.rateLimit.tier ?? "?"}</dd>
            </dl>
          ) : (
            <p className="sdkx-hint">No rate-limit headers came back.</p>
          ))}
      </div>
    </div>
  );
}

function Requests({ outcome }: { outcome: Outcome }) {
  if (outcome.requests.length === 0) return <p className="sdkx-hint">No requests were made.</p>;

  return (
    <ol className="sdkx-requests">
      {outcome.requests.map((request, i) => (
        <li key={i}>
          <p>
            <strong>{request.operations.join(" + ")}</strong>{" "}
            <span className={`sdkx-badge ${request.kind === "write" ? "is-write" : "is-read"}`}>{request.kind === "write" ? "Write" : "Read"}</span>{" "}
            {request.sent ? (request.status ? `HTTP ${request.status}` : "") : <em>Not sent (preview)</em>}
            {request.operations.length > 1 && " · batched"}
          </p>
          <pre>{JSON.stringify(request.variables.length === 1 ? request.variables[0] : request.variables, null, 2)}</pre>
        </li>
      ))}
    </ol>
  );
}

function ErrorCard({ error }: { error: NonNullable<Outcome["error"]> }) {
  const missing = Array.isArray(error.fields.missingScopes) ? (error.fields.missingScopes as string[]) : null;
  const shown = Object.entries(error.fields).filter(([key]) => !["status", "operationName", "missingScopes"].includes(key));

  return (
    <div role="alert" className="sdkx-error">
      <p>
        <strong>{error.name}</strong>: {error.message}
      </p>
      {missing && (
        <p>
          Your token is missing {missing.map((scope) => <code key={scope}>{scope}</code>)}.{" "}
          <a href={`${URLS.API_NEW_TOKEN_URL}?scope=${encodeURIComponent(missing.join(" "))}`}>Create a token with them</a>.
        </p>
      )}
      {shown.length > 0 && (
        <dl>
          {shown.map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
