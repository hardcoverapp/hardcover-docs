// The enums and errors every SDK shares (the SDK repo's shared/enums.json and
// shared/errors.json, synced per minor version), shaped for the reference page.
const enumFiles = import.meta.glob<EnumFile>("../reference/*/enums.json", { eager: true, import: "default" });
const errorFiles = import.meta.glob<ErrorFile>("../reference/*/errors.json", { eager: true, import: "default" });

interface EnumFile {
  [name: string]: unknown;
}

interface RawEnum {
  type: string;
  description?: string;
  notes?: string;
  generated?: boolean;
  values?: { id: number | string; key: string; label?: string }[];
  min?: number;
  max?: number;
  step?: number;
}

interface ErrorFile {
  base: string;
  baseFields: string[];
  errors: { name: string; parent: string; fields?: string[]; retry: boolean | string; reasons?: string[] }[];
}

export interface EnumMember {
  /** The TypeScript name, as the SDK generates it: WANT_TO_READ → WantToRead. */
  member: string;
  value: number | string;
  label?: string;
}

export interface EnumDoc {
  name: string;
  description?: string;
  members: EnumMember[];
  /** For enums without a value list: what the values are. */
  note?: string;
}

export interface ErrorDoc {
  name: string;
  parent: string;
  depth: number;
  fields: string[];
  retried: string;
  reasons?: string[];
}

function load<T>(files: Record<string, T>, version: string, name: string): T {
  const file = files[`../reference/${version}/${name}.json`];
  if (!file) throw new Error(`No SDK ${name} for ${version}. Run npm run sync:sdk-catalog.`);
  return file;
}

// The same rule as the SDK's generator (scripts/gen-shared.mjs).
const pascal = (key: string) => key.toLowerCase().replace(/(^|_)([a-z])/g, (_, __, c: string) => c.toUpperCase());

/**
 * Every shared enum. Enums the API defines itself (TrendingDuration) take
 * their values from `generated`, the API's schema values.
 */
export function enumDocs(version: string, generated: Record<string, string[]> = {}): EnumDoc[] {
  const file = load(enumFiles, version, "enums");

  return Object.entries(file)
    .filter(([name]) => !name.startsWith("$"))
    .map(([name, raw]) => {
      const e = raw as RawEnum;

      if (e.values?.length) {
        return {
          name,
          description: e.description,
          members: e.values.map((value) => ({ member: pascal(value.key), value: value.id, label: value.label })),
        };
      }

      if (e.type === "decimal" && e.min !== undefined) {
        return { name, description: e.description, members: [], note: `A number from ${e.min} to ${e.max} in steps of ${e.step}. ${e.notes ?? ""}`.trim() };
      }

      const values = generated[name] ?? [];
      return {
        name,
        description: e.description,
        members: values.map((value) => ({ member: JSON.stringify(value), value })),
        note: values.length ? "Pass the value as a string." : e.notes,
      };
    });
}

/** Every error, each after its parent, with how deep it sits under the base error. */
export function errorDocs(version: string): { base: string; baseFields: string[]; errors: ErrorDoc[] } {
  const file = load(errorFiles, version, "errors");
  const ordered: ErrorDoc[] = [];

  const visit = (parent: string, depth: number) => {
    for (const error of file.errors.filter((e) => e.parent === parent)) {
      ordered.push({
        name: error.name,
        parent: error.parent,
        depth,
        fields: error.fields ?? [],
        retried: error.retry === false ? "No" : String(error.retry).replace(/^./, (c) => c.toUpperCase()),
        reasons: error.reasons,
      });
      visit(error.name, depth + 1);
    }
  };

  visit(file.base, 0);
  return { base: file.base, baseFields: file.baseFields, errors: ordered };
}

/** Reader-facing: when each error happens and what an app does about it. A test keeps this in step with errors.json. */
export const ERROR_TEXT: Record<string, string> = {
  AuthenticationError: "The token is missing, expired, revoked or malformed. Sign in again or get a new token.",
  SignedOutError:
    "An OAuth session has no usable tokens: never signed in, signed out, revoked on the website, or expired. `onSignedOut` has already run; show sign-in.",
  ScopeError: "The token lacks scopes this call needs. `missingScopes` lists every one; ask for them.",
  UnsupportedOperationError: "API tokens can't run this operation at all, whatever their scopes.",
  RequestTooLargeError: "The request has more top-level fields than the token's burst limit. Split it into smaller requests.",
  RateLimitError: "The rate limit stayed spent after retries, or the daily limit is used up. Wait `retryAfterSeconds`; `window` says which.",
  InvalidRequestError: "The API couldn't read the request: a malformed query, or a filter the API doesn't allow.",
  GraphQLError: "The query ran but the API reported errors. `errors` has each one; `data` has whatever came back.",
  ActionError: "The API refused a write and said why in `messages`. Show them to the reader.",
  OAuthError: "Sign-in failed: the reader declined (`access_denied`), the server refused, or the redirect didn't belong to this sign-in.",
  NotFoundError: "A method that changes something by id found nothing, like updating a goal that doesn't exist. `resource` and `id` say what. Lookups that can find nothing return null instead.",
  ServerError: "The API failed on its side. Reads are retried with backoff first.",
  TimeoutError: "No answer in time. Reads are retried first. For a write, `mayHaveSucceeded` says it might have landed: check before retrying.",
  NetworkError: "The connection failed. Reads are retried first. For a write, `mayHaveSucceeded` says it might have landed: check before retrying.",
};
