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
import SCOPE_GROUPS, {
  EXPLICIT_IMPLICATIONS,
  WILDCARD_SCOPE,
  type ScopeGroupDef,
  type ScopeGroupItem,
  type ScopeItem,
} from "@/data/scopeGroups";
import SCOPE_PRESETS, { type ScopePreset } from "@/data/scopePresets";
import { cn } from "@/lib/utils";

// Ported from the account settings API key form (rails app: components/account/api/ScopePicker.tsx) so this picker behaves the same way.

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

function addWithImplications(scope: string, current: string[]): string[] {
  const result = [...current, scope];
  const implied = EXPLICIT_IMPLICATIONS[scope];
  if (implied && !isCovered(implied, result)) {
    result.push(implied);
  }
  return result;
}

function addAllWithImplications(scopesToAdd: string[]): string[] {
  return scopesToAdd.reduce(
    (acc, s) => (isCovered(s, acc) ? acc : addWithImplications(s, acc)),
    [] as string[],
  );
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
  return addWithImplications(parentScope, withoutAll.filter(s => !childScopes.includes(s)));
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

function PresetSelect({ onSelect }: { onSelect: (preset: ScopePreset) => void }) {
  return (
    <Select
      value=""
      onValueChange={presetId => {
        const preset = SCOPE_PRESETS.find(p => p.id === presetId);
        if (preset) onSelect(preset);
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
  );
}

function WildcardRow({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <div>
      <label className="flex items-start gap-2 cursor-pointer rounded-sm px-1 py-0.5 hover:bg-secondary">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
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
  );
}

function ScopeChildRow({
  child,
  covered,
  disabled,
  allSelected,
  onToggle,
}: {
  child: ScopeItem;
  covered: boolean;
  disabled: boolean;
  allSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-2 rounded-sm px-1 py-0.5",
        !disabled && "cursor-pointer hover:bg-secondary",
      )}
    >
      <input
        type="checkbox"
        checked={covered}
        disabled={disabled}
        onChange={disabled ? undefined : onToggle}
        className="mt-1 shrink-0 accent-current"
      />
      <div className="min-w-0">
        <span className={cn("text-sm font-mono", disabled && "text-muted-foreground")}>
          {child.scope}
        </span>
        {!allSelected && (
          <span className="text-xs text-muted-foreground ml-2">{child.description}</span>
        )}
      </div>
    </label>
  );
}

function ScopeRow({
  item,
  selectedScopes,
  impliedScopes,
  allSelected,
  onToggleParent,
  onToggleStandalone,
  onToggleChild,
}: {
  item: ScopeGroupItem;
  selectedScopes: string[];
  impliedScopes: Set<string>;
  allSelected: boolean;
  onToggleParent: (parentScope: string, childScopes: string[]) => void;
  onToggleStandalone: (scope: string) => void;
  onToggleChild: (childScope: string, parentScope: string, allChildren: string[]) => void;
}) {
  const childScopes = item.children?.map(c => c.scope) ?? [];
  const parentCovered = isCovered(item.scope, selectedScopes);
  const disableParent = allSelected || impliedScopes.has(item.scope);

  return (
    <div>
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
                    ? onToggleParent(item.scope, childScopes)
                    : onToggleStandalone(item.scope)
          }
          className="mt-1 shrink-0 accent-current"
        />
        <div className="min-w-0">
          <span className={cn("text-sm font-mono", disableParent && "text-muted-foreground")}>
            {item.scope}
          </span>
          {!allSelected && (
            <span className="text-xs text-muted-foreground ml-2">{item.description}</span>
          )}
        </div>
      </label>
      {item.children && (
        <div className="ml-6 space-y-0.5 mt-0.5">
          {item.children.map(child => {
            const covered =
              parentCovered ||
              isCovered(child.scope, selectedScopes) ||
              impliedScopes.has(child.scope);
            const disableChild = allSelected || impliedScopes.has(child.scope);
            return (
              <ScopeChildRow
                key={child.scope}
                child={child}
                covered={covered}
                disabled={disableChild}
                allSelected={allSelected}
                onToggle={() => onToggleChild(child.scope, item.scope, childScopes)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function ScopeGroupSection({
  group,
  selectedScopes,
  impliedScopes,
  allSelected,
  onToggleParent,
  onToggleStandalone,
  onToggleChild,
}: {
  group: ScopeGroupDef;
  selectedScopes: string[];
  impliedScopes: Set<string>;
  allSelected: boolean;
  onToggleParent: (parentScope: string, childScopes: string[]) => void;
  onToggleStandalone: (scope: string) => void;
  onToggleChild: (childScope: string, parentScope: string, allChildren: string[]) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
        {group.label}
      </p>
      <div className="space-y-0.5">
        {group.items.map(item => (
          <ScopeRow
            key={item.scope}
            item={item}
            selectedScopes={selectedScopes}
            impliedScopes={impliedScopes}
            allSelected={allSelected}
            onToggleParent={onToggleParent}
            onToggleStandalone={onToggleStandalone}
            onToggleChild={onToggleChild}
          />
        ))}
      </div>
    </div>
  );
}

function LinkOutput({
  link,
  copied,
  hasSelection,
  onCopy,
}: {
  link: string;
  copied: boolean;
  hasSelection: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <Input readOnly value={link} className="font-mono text-xs" onFocus={e => e.target.select()} />
        <Button type="button" variant="outline" size="icon" onClick={onCopy} title="Copy link">
          {copied ? <LuCheck className="h-4 w-4" /> : <LuCopy className="h-4 w-4" />}
        </Button>
        <Button type="button" variant="outline" size="icon" asChild title="Open link">
          <a href={link} target="_blank" rel="noreferrer noopener">
            <LuExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {hasSelection
          ? "This link opens the new key form with these scopes pre-checked. The person creating the key can still add or remove any before they submit."
          : "No scopes selected. The link opens the new key form empty."}
      </p>
    </div>
  );
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
      <PresetSelect onSelect={preset => setSelectedScopes(addAllWithImplications(preset.scopes))} />

      <div className="border border-muted rounded-md max-h-96 overflow-y-auto p-3 space-y-3">
        <WildcardRow
          checked={allSelected}
          onToggle={() => setSelectedScopes(allSelected ? [] : [WILDCARD_SCOPE.scope])}
        />
        {SCOPE_GROUPS.map(group => (
          <ScopeGroupSection
            key={group.label}
            group={group}
            selectedScopes={selectedScopes}
            impliedScopes={impliedScopes}
            allSelected={allSelected}
            onToggleParent={(parentScope, childScopes) =>
              setSelectedScopes(toggleParent(parentScope, childScopes, selectedScopes))
            }
            onToggleStandalone={scope => setSelectedScopes(toggleStandalone(scope, selectedScopes))}
            onToggleChild={(childScope, parentScope, allChildren) =>
              setSelectedScopes(toggleChild(childScope, parentScope, allChildren, selectedScopes))
            }
          />
        ))}
      </div>

      <LinkOutput
        link={link}
        copied={copied}
        hasSelection={selectedScopes.length > 0}
        onCopy={handleCopy}
      />
    </div>
  );
}

export default ScopeLinkBuilder;
