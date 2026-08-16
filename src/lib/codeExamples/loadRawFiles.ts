export function loadRawFiles(): Record<string, string> {
  return import.meta.glob("/src/examples/**/*", {
    query: "?raw",
    import: "default",
    eager: true,
  }) as Record<string, string>;
}
