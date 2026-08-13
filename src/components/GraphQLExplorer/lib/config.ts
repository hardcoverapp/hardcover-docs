/**
 * Query Builder Configuration
 *
 * Explorer-only. Moved out of `src/Consts.ts`, which keeps only genuinely
 * site-wide values (URLs, preference defaults).
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

    /**
     * GraphQL where clause operators.
     *
     * The pattern-matching operators (`_like`, `_ilike`, `_regex`, `_similar`
     * and their negations) are deliberately absent: the API rejects them with a
     * 403 before the query reaches Hasura, and they are documented as disabled
     * in `api/Getting-Started.mdx`. Offering them here only produced queries
     * that were guaranteed to fail.
     */
    WHERE_OPERATORS: [
        { value: "_eq", label: "equals" },
        { value: "_neq", label: "not equals" },
        { value: "_gt", label: "greater than" },
        { value: "_gte", label: "greater than or equal" },
        { value: "_lt", label: "less than" },
        { value: "_lte", label: "less than or equal" },
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
