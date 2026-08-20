import { useMemo, useState } from "react";
import { LuCopy, LuCheck, LuExternalLink } from "react-icons/lu";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { URLS } from "@/Consts";
import SCOPE_GROUPS, { EXPLICIT_IMPLICATIONS, WILDCARD_SCOPE } from "@/data/scopeGroups";
import SCOPE_PRESETS from "@/data/scopePresets";
import { cn } from "@/lib/utils";

// Ported from the account settings API key form (rails app:
// components/account/api/ScopePicker.tsx) so this picker behaves the same
// way -- toggling a parent selects/clears its children, and scopes with an
// explicit implication (e.g. the email scope) drag their implied scope
// along with them.

function scopeCovers(granted: string, required: string): boolean {
  return (
    granted === required ||
    granted === "all" ||
    required.startsWith(`${granted}:`)
  );
}

function isCovered(scope: string, selected: string[]): boolean {
  return selected.some(s => scopeCovers(s, scope));
}

function toggleParent(
  parentScope: string,
  childScopes: string[],
  selected: string[],
): string[] {
  const withoutAll = selected.filter(s => s !== "all");
  if (isCovered(parentScope, withoutAll)) {
    return withoutAll.filter(s => s !== parentScope && !childScopes.includes(s));
  }
  return [...withoutAll.filter(s => !childScopes.includes(s)), parentScope];
}

function addWithImplications(scope: string, current: string[]): string[] {
  const result = [...current, scope];
  const implied = EXPLICIT_IMPLICATIONS[scope];
  if (implied && !isCovered(implied, result)) {
    result.push(implied);
  }
  return result;
}

function toggleChild(
  childScope: string,
  parentScope: string,
  allChildren: string[],
  selected: string[],
): string[] {
  const withoutAll = selected.filter(s => s !== "all");
  const parentCovered = isCovered(parentScope, withoutAll);
  const childCovered = isCovered(childScope, withoutAll);

  if (childCovered) {
    if (parentCovered) {
      return [
        ...withoutAll.filter(s => s !== parentScope),
        ...allChildren.filter(c => c !== childScope),
      ];
    }
    return withoutAll.filter(s => s !== childScope);
  }
  return addWithImplications(childScope, withoutAll);
}

function toggleStandalone(scope: string, selected: string[]): string[] {
  const withoutAll = selected.filter(s => s !== "all");
  return isCovered(scope, withoutAll)
    ? withoutAll.filter(s => s !== scope)
    : addWithImplications(scope, withoutAll);
}

function buildLink(scopes: string[]): string {
  const url = new URL(URLS.API_NEW_TOKEN_URL);
  if (scopes.length) url.searchParams.set("scope", scopes.join(" "));
  return url.toString();
}

export function ScopeLinkBuilder({ className }: { className?: string }) {
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const allSelected = selectedScopes.includes("all");
  const impliedScopes = useMemo(
    () =>
      new Set(
        selectedScopes.flatMap(s =>
          Object.entries(EXPLICIT_IMPLICATIONS)
            .filter(([k]) => scopeCovers(s, k))
            .map(([, v]) => v),
        ),
      ),
    [selectedScopes],
  );

  const link = useMemo(() => buildLink(selectedScopes), [selectedScopes]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  return (
    <div className={cn("space-y-5", className)}>
      <Select
        value=""
        onValueChange={presetId => {
          const preset = SCOPE_PRESETS.find(p => p.id === presetId);
          if (preset) setSelectedScopes(preset.scopes);
        }}
      >
        <SelectTrigger className="w-full font-semibold">
          <SelectValue placeholder="Start from a preset..." />
        </SelectTrigger>
        <SelectContent className="max-h-96">
          {SCOPE_PRESETS.map(preset => (
            <SelectItem key={preset.id} value={preset.id}>
              <div className="flex flex-col py-0.5">
                <span>{preset.label}</span>
                <span
                  className={cn(
                    "text-xs",
                    preset.id === "full-access"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground",
                  )}
                >
                  {preset.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="border border-muted rounded-md max-h-96 overflow-y-auto p-3 space-y-3">
        <div>
          <label className="flex items-start gap-2 cursor-pointer rounded-sm px-1 py-0.5 hover:bg-secondary">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => setSelectedScopes(allSelected ? [] : [WILDCARD_SCOPE.scope])}
              className="mt-1 shrink-0 accent-current"
            />
            <div className="min-w-0">
              <span className="text-sm font-mono">{WILDCARD_SCOPE.scope}</span>
              <span className="text-xs text-amber-600 dark:text-amber-400 ml-2">
                Grants unrestricted access. Use with caution.
              </span>
            </div>
          </label>
        </div>

        {SCOPE_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const childScopes = "children" in item ? item.children?.map(c => c.scope) ?? [] : [];
                const parentCovered = isCovered(item.scope, selectedScopes);
                const disableParent = allSelected || impliedScopes.has(item.scope);
                return (
                  <div key={item.scope}>
                    <label
                      className={cn(
                        "flex items-start gap-2 rounded-sm px-1 py-0.5",
                        !disableParent && "cursor-pointer hover:bg-secondary",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={parentCovered}
                        disabled={disableParent}
                        onChange={
                          disableParent
                            ? undefined
                            : () =>
                                childScopes.length
                                  ? setSelectedScopes(
                                      toggleParent(item.scope, childScopes, selectedScopes),
                                    )
                                  : setSelectedScopes(
                                      toggleStandalone(item.scope, selectedScopes),
                                    )
                        }
                        className="mt-1 shrink-0 accent-current"
                      />
                      <div className="min-w-0">
                        <span
                          className={cn(
                            "text-sm font-mono",
                            disableParent && "text-muted-foreground",
                          )}
                        >
                          {item.scope}
                        </span>
                        {!allSelected && (
                          <span className="text-xs text-muted-foreground ml-2">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </label>
                    {"children" in item && item.children && (
                      <div className="ml-6 space-y-0.5 mt-0.5">
                        {item.children.map(child => {
                          const covered =
                            parentCovered ||
                            isCovered(child.scope, selectedScopes) ||
                            impliedScopes.has(child.scope);
                          const disableChild = allSelected || impliedScopes.has(child.scope);
                          return (
                            <label
                              key={child.scope}
                              className={cn(
                                "flex items-start gap-2 rounded-sm px-1 py-0.5",
                                !disableChild && "cursor-pointer hover:bg-secondary",
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={covered}
                                disabled={disableChild}
                                onChange={
                                  disableChild
                                    ? undefined
                                    : () =>
                                        setSelectedScopes(
                                          toggleChild(
                                            child.scope,
                                            item.scope,
                                            childScopes,
                                            selectedScopes,
                                          ),
                                        )
                                }
                                className="mt-1 shrink-0 accent-current"
                              />
                              <div className="min-w-0">
                                <span
                                  className={cn(
                                    "text-sm font-mono",
                                    disableChild && "text-muted-foreground",
                                  )}
                                >
                                  {child.scope}
                                </span>
                                {!allSelected && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {child.description}
                                  </span>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <div className="flex gap-2">
          <Input readOnly value={link} className="font-mono text-xs" onFocus={e => e.target.select()} />
          <Button type="button" variant="outline" size="icon" onClick={handleCopy} title="Copy link">
            {copied ? <LuCheck className="h-4 w-4" /> : <LuCopy className="h-4 w-4" />}
          </Button>
          <Button type="button" variant="outline" size="icon" asChild title="Open link">
            <a href={link} target="_blank" rel="noreferrer noopener">
              <LuExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {selectedScopes.length
            ? "This link opens the new key form with these scopes pre-checked -- the person creating the key can still add or remove any before they submit."
            : "No scopes selected -- the link opens the new key form empty."}
        </p>
      </div>
    </div>
  );
}

export default ScopeLinkBuilder;
