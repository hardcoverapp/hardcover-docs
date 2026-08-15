import type { APIRoute } from "astro";
import { loadManifests } from "@/lib/codeExamples/loadManifests";

const rawFiles = import.meta.glob("/src/examples/**/*", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const MIME: Record<string, string> = {
  js: "text/javascript",
  ts: "text/typescript",
  py: "text/x-python",
  graphql: "application/graphql",
  css: "text/css",
  html: "text/html",
  json: "application/json",
  sh: "application/x-sh",
};

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
    headers: { "Content-Type": `${MIME[ext] ?? "text/plain"}; charset=utf-8` },
  });
};
