// What each API scope means, from capabilities.json (the API's own list), for
// scope pills and tooltips across the docs.
import capabilities from "../../capabilities.json";

export interface ScopeInfo {
  scope: string;
  kind: "read" | "write" | null;
  description: string;

  /** Broader scopes that grant this one too (read:me grants read:me:content). "all" is left out. */
  grantedBy: string[];
}

interface Scope {
  scope: string;
  action: string | null;
  description: string | null;
  implies?: string[];
}

const scopes = capabilities.scopes as Scope[];

/** A scope's meaning, or a bare entry for one the API doesn't list. */
export function scopeInfo(scope: string): ScopeInfo {
  const found = scopes.find((s) => s.scope === scope);

  const grantedBy = scopes
    .filter((s) => s.scope !== "all" && s.scope !== scope && (s.implies ?? []).includes(scope))
    .map((s) => s.scope);

  return {
    scope,
    kind: found?.action === "read" || found?.action === "write" ? found.action : null,
    description: found?.description ?? "",
    grantedBy,
  };
}
