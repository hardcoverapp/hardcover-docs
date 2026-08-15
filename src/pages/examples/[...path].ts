import type { APIRoute } from "astro";
import { loadManifests } from "@/lib/codeExamples/loadManifests";

const rawFiles = import.meta.glob("/src/examples/**/*", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

// mrmime (a tiny wrapper around the mime-db dataset)
import { lookup } from "mrmime";

// mrmime has a few wrong entries for programming languages, since they ware not registered
// so this is a list of overrides
const MIME_OVERRIDES: Record<string, string> = {
  ts: "text/typescript",
  py: "text/x-python",
  rb: "text/x-ruby",
  go: "text/x-go",
  rs: "text/x-rust",
  php: "text/x-php",
  graphql: "application/graphql",
  sh: "application/x-sh",
};

function mimeFor(ext: string): string {
  return MIME_OVERRIDES[ext] ?? lookup(ext) ?? "text/plain";
}

export async function getStaticPaths() {
  // Enumerate only files a manifest actually lists
  return Object.entries(loadManifests()).flatMap(([dir, manifest]) => {
    const entries =
      "items" in manifest
        ? manifest.items
        : Object.values(manifest.groups).flat();
    return entries.map(({ file }) => ({ params: { path: `${dir}/${file}` } }));
  });
}

export const GET: APIRoute = ({ params }) => {
  const source = rawFiles[`/src/examples/${params.path}`];
  if (!source) return new Response("Not found", { status: 404 });
  const ext = params.path!.split(".").pop() ?? "";
  // Content-Type only, deliberately no Content-Disposition: attachment.
  // This renders inline as a plain page (GitHub's "Raw" view, not a download prompt), so a reader
  // can read/select/copy from it directly, or hit Ctrl+S themselves if they actually want the file saved.
  return new Response(source, {
    headers: { "Content-Type": `${mimeFor(ext)}; charset=utf-8` },
  });
};
