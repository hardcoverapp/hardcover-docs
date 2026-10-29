const START_RE = /SECTION START:\s*(.+?)\s*:SECTION/;
const END_RE = /SECTION END:\s*(.+?)\s*:SECTION/;

function findMarker(lines: string[], marker: RegExp, name: string): number {
  return lines.findIndex((line) => marker.exec(line)?.[1] === name);
}

export function extractSection(
  source: string,
  name: string,
  opts: {
    dedent?: boolean;
  } = {},
): string {
  const { dedent = true } = opts;
  const lines = source.split("\n");
  const start = findMarker(lines, START_RE, name);
  const end = findMarker(lines, END_RE, name);

  if (start === -1 || end === -1) {
    throw new Error(`Section "${name}" not found`);
  }

  // remove sections in case of nesting
  const body = lines
    .slice(start + 1, end)
    .filter((l) => !START_RE.test(l) && !END_RE.test(l));

  if (!dedent) return body.join("\n");

  // remove indents
  const nonBlank = body.filter((l) => l.trim());
  // Math.min() of no arguments is Infinity -- guard against a section that's
  // only blank lines instead of silently slicing every line to ''.
  if (nonBlank.length === 0) return body.join("\n");
  const indent = Math.min(...nonBlank.map((l) => l.match(/^\s*/)![0].length));
  return body.map((l) => l.slice(indent)).join("\n");
}

export function findDuplicateSectionNames(source: string): string[] {
  const counts = new Map<string, number>();
  for (const line of source.split("\n")) {
    const m = START_RE.exec(line);
    if (m) counts.set(m[1], (counts.get(m[1]) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([, n]) => n > 1).map(([name]) => name);
}

// The file as readers see it (markers removed), with each section's 1-indexed
// line range in that stripped text, so the highlight lines up with what renders.
export function stripSections(source: string): {
  code: string;
  sections: Record<string, { start: number; end: number }>;
} {
  const kept: string[] = [];
  const sections: Record<string, { start: number; end: number }> = {};
  const openStarts = new Map<string, number>();

  for (const line of source.split("\n")) {
    const s = START_RE.exec(line);
    if (s) {
      openStarts.set(s[1], kept.length + 1);
      continue;
    }
    const e = END_RE.exec(line);
    if (e) {
      const start = openStarts.get(e[1]);
      if (start !== undefined) sections[e[1]] = { start, end: kept.length };
      continue;
    }
    kept.push(line);
  }

  return { code: kept.join("\n"), sections };
}
