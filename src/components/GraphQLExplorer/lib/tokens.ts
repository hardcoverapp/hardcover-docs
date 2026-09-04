/**
 * Placeholder substitution for authored example queries.
 *
 * Docs pages write `##USER_ID##` where the reader's own id belongs, so the
 * examples read sensibly on the page and still run for whoever is signed in.
 */

export const USER_ID_TOKEN = "##USER_ID##";

export const hasUserIdToken = (query: string): boolean =>
  (query ?? "").includes(USER_ID_TOKEN);

export interface SubstitutionContext {
  userId?: string | null;
}

/**
 * Replace known placeholders. An unresolved placeholder is deliberately left
 * intact rather than blanked: sending `user_id: {_eq: }` would be a confusing
 * syntax error, whereas the literal token makes the cause obvious and lets the
 * UI explain that the reader's id could not be resolved.
 */
export const substituteTokens = (
  query: string,
  { userId }: SubstitutionContext = {},
): string => {
  if (!query) return query;
  if (!userId) return query;
  return query.split(USER_ID_TOKEN).join(userId);
};
