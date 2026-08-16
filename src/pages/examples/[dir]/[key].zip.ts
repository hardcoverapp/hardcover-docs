import type { APIRoute } from "astro";
import JSZip from "jszip";
import { loadManifests, type Entry } from "@/lib/codeExamples/loadManifests";

const rawFiles = import.meta.glob("/src/examples/**/*", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export async function getStaticPaths() {
  return Object.entries(loadManifests()).flatMap(([dir, manifest]) => {
    const entries: Entry[] =
      "items" in manifest
        ? manifest.items
        : Object.values(manifest.groups).flat();
    return entries.map((entry) => ({
      params: { dir, key: "key" in entry ? entry.key : entry.label },
      props: { entry, dirFiles: manifest.files ?? [] },
    }));
  });
}

export const GET: APIRoute = async ({ params, props }) => {
  const { entry, dirFiles } = props as { entry: Entry; dirFiles: string[] };
  const zip = new JSZip();
  // Nested under a folder named after the key, so extracting doesn't scatter
  // files into whatever directory the reader extracted it into.
  for (const file of [entry.file, ...(entry.files ?? []), ...dirFiles]) {
    zip.file(`${params.key}/${file}`, rawFiles[`/src/examples/${params.dir}/${file}`]);
  }
  const buffer = await zip.generateAsync({ type: "arraybuffer" });
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${params.key}.zip"`,
    },
  });
};
