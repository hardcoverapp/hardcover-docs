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
  const indent = Math.min(
    ...body.filter((l) => l.trim()).map((l) => l.match(/^\s*/)![0].length),
  );
  return body.map((l) => l.slice(indent)).join("\n");
}
