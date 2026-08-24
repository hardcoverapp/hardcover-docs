/**
 * `<` opens a JSX tag and `{` opens a JSX expression, so both break the build
 * if they reach MDX raw. Quotes only matter inside attribute values, so they
 * are deliberately left alone.
 */
const MDX_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "{": "&#123;",
  "}": "&#125;",
};
const MDX_ESCAPES_REGEX = new RegExp(
  `[${Object.keys(MDX_ESCAPES).join("")}]`,
  "g",
);

/**
 * Escape a string for interpolation into MDX element text.
 */
export function escapeHtml(str: string): string {
  return str.replace(MDX_ESCAPES_REGEX, (c) => MDX_ESCAPES[c]);
}
