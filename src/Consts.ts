export const URLS = {
    APP: 'https://hardcover.app',
    API: 'https://api.hardcover.app',
    API_ACCOUNT_URL: 'https://hardcover.app/account/api',
    DOCS: 'https://docs.hardcover.app',

    GRAPHQL_URL: 'https://api.hardcover.app/v1/graphql',

    GITHUB: 'https://github.com/hardcoverapp/hardcover-docs/',
    GITHUB_EDIT: 'https://github.com/hardcoverapp/hardcover-docs/edit/main/',
    GITHUB_DEV: 'https://github.dev/hardcoverapp/hardcover-docs/blob/main/',

    ISSUES: 'https://github.com/hardcoverapp/hardcover-docs/issues',
    CREATE_ISSUE: 'https://github.com/hardcoverapp/hardcover-docs/issues/new?assignees=&labels=&projects=&template=bug_report.md&title=',
    SUGGEST_FEATURE: 'https://github.com/hardcoverapp/hardcover-docs/issues/new?assignees=&labels=&projects=&template=feature_request.md&title=',

    DISCORD: 'https://discord.gg/edGpYN8ym8',
    API_DISCORD: 'https://discord.com/channels/835558721115389962/1278040045324075050',
    BUGS_DISCORD: 'https://discord.com/channels/835558721115389962/1105920773257953310',
    LIBRARIAN_DISCORD: 'https://discord.com/channels/835558721115389962/1105918193022812282',
    
    LIBRARIAN_APPLICATION: 'https://hardcover.app/librarians/apply',
    MEMBERSHIP: 'https://hardcover.app/account/membership',
    LINK_ROLES: 'https://hardcover.app/pages/how-to-link-hardcover-roles-with-discord',

    APP_STORE: 'https://apps.apple.com/us/app/hardcover-app/id1663379893',
    PLAY_STORE: 'https://play.google.com/store/apps/details?id=hardcover.app',

    INSTAGRAM: 'https://instagram.com/hardcover.app',
    MASTODON: 'https://mastodon.hardcover.app/@hardcover',
};

export const defaultPreferences: {
    theme: 'auto' | 'dark' | 'light';
    editMode: 'basic' | 'developer';
    graphQLResults: 'table' | 'json' | 'chart';
} = {
    theme: 'auto',
    editMode: 'basic',
    graphQLResults: 'table',
}

/**
 * Query Builder Configuration
 */
export const QUERY_BUILDER = {
    /** Maximum depth allowed for nested queries (matches API limit) */
    MAX_DEPTH: 3,

    /** Default limit for query results */
    DEFAULT_LIMIT: 10,

    /** Available limit options for users to select */
    LIMIT_OPTIONS: [1, 5, 10, 20],

    /** Default where operator */
    DEFAULT_WHERE_OPERATOR: "_eq",

    /** Default order by direction */
    DEFAULT_ORDER_DIRECTION: "asc" as const,

    /** Field name patterns to exclude from auto-selection */
    EXCLUDED_FIELD_PATTERNS: ["cached_"],

    /** GraphQL where clause operators */
    WHERE_OPERATORS: [
        { value: "_eq", label: "equals" },
        { value: "_neq", label: "not equals" },
        { value: "_gt", label: "greater than" },
        { value: "_gte", label: "greater than or equal" },
        { value: "_lt", label: "less than" },
        { value: "_lte", label: "less than or equal" },
        { value: "_like", label: "like" },
        { value: "_ilike", label: "like (case insensitive)" },
        { value: "_in", label: "in" },
        { value: "_nin", label: "not in" },
    ] as const,

    /** Common query arguments that can be quickly added */
    COMMON_ARGS: [
        { label: "limit", type: "number" as const },
        { label: "offset", type: "number" as const },
    ] as const,

    /** Scalar types in GraphQL schema */
    SCALAR_TYPES: [
        "String",
        "Int",
        "Float",
        "Boolean",
        "ID",
        "json",
        "jsonb",
        "timestamp",
        "timestamptz",
        "date",
        "uuid",
        "smallint",
        "bigint",
        "numeric",
    ] as const,
} as const;
