// Curated starting points for the PAT Link Builder.
// These mirror the presets offered on the account settings API key form (rails app: constants/scopePresets.ts)
// -- update both together if you add or change one.

export type ScopePreset = {
  id: string;
  label: string;
  description: string;
  scopes: string[];
};

const SCOPE_PRESETS: ScopePreset[] = [
  {
    id: "e-reader",
    label: "E-Reader / Sync Client",
    description: "Search the catalog and read/update reading progress.",
    scopes: ["read:catalog", "read:library", "write:library", "read:me:content"],
  },
  {
    id: "readonly-dashboard",
    label: "Read-Only Stats / Export",
    description: "View your library, lists, goals, and journal -- no writes.",
    scopes: [
      "read:catalog",
      "read:library",
      "read:lists",
      "read:goals",
      "read:journal",
      "read:me",
    ],
  },
  {
    id: "review-client",
    label: "Review / Blogging Client",
    description: "Look up books and post reviews from an external tool.",
    scopes: ["read:catalog", "read:library:private", "write:reviews", "read:me:content"],
  },
  {
    id: "list-manager",
    label: "List Manager",
    description: "Curate and maintain lists from a third-party tool.",
    scopes: ["read:catalog", "read:lists", "write:lists", "read:me:content"],
  },
  {
    id: "notification-bot",
    label: "Notification Bot",
    description: "Surface and manage notifications (e.g. a Discord/Slack bridge).",
    scopes: ["read:notifications", "write:notifications", "read:me:content"],
  },
  {
    id: "social-automation",
    label: "Social Automation",
    description: "Follow, like, and cross-post on the user's behalf.",
    scopes: ["read:social", "write:social", "read:users", "read:me:content"],
  },
  {
    id: "librarian",
    label: "Librarian / Cataloger Tool",
    description: "Bulk-edit catalog metadata (requires librarian role on the account).",
    scopes: ["read:catalog", "write:catalog:edit", "write:catalog:append"],
  },
  {
    id: "full-access",
    label: "Full Access",
    description: "Everything. Use only for trusted personal tooling.",
    scopes: ["all"],
  },
];

export default SCOPE_PRESETS;
