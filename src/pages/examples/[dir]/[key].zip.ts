import type { APIRoute } from "astro";
import { strToU8, zipSync } from "fflate";
import { stripSections } from "@/components/CodeExamples/lib/codeSnippets";
import {
  loadManifests,
  loadRawFiles,
  type Entry,
} from "@/components/CodeExamples/lib/loaders";

const rawFiles = loadRawFiles();

export async function getStaticPaths() {
  return Object.entries(loadManifests()).flatMap(([dir, manifest]) => {
    const entries: Entry[] =
      "items" in manifest
        ? manifest.items
        : Object.values(manifest.groups).flat();
    return entries.map((entry) => {
      const key = "key" in entry ? entry.key : entry.label;
      return {
        params: { dir, key: `${dir}-${key}` },
        props: { entry, dir, key, dirFiles: manifest.files ?? [] },
      };
    });
  });
}

export const GET: APIRoute = ({ params, props }) => {
  const { entry, dir, key, dirFiles } = props as {
    entry: Entry;
    dir: string;
    key: string;
    dirFiles: string[];
  };

  // Nested under a folder named after the key, so extracting doesn't scatter
  // files into whatever directory the reader extracted it into.
  const files = Object.fromEntries(
    [entry.file, ...(entry.files ?? []), ...dirFiles].map((file) => [
      `${key}/${file}`,
      strToU8(stripSections(rawFiles[`/src/examples/${dir}/${file}`]).code),
    ]),
  );
  return new Response(zipSync(files, { level: 9 }), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${params.key}.zip"`,
    },
  });
};
