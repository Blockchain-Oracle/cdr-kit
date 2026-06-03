import { source } from "@/lib/source";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Cached forever — page content changes only at build time
export const revalidate = false;

/**
 * Full text of every docs page, concatenated. AI agents fetch this once
 * to get the entire docs corpus in one shot.
 */
export async function GET() {
  const chunks: string[] = [];

  for (const page of source.getPages()) {
    const data = page.data as unknown as { title?: string; description?: string };
    const title = data.title ?? page.url;
    const desc = data.description ?? "";

    chunks.push(`# ${title}\n`);
    if (desc) chunks.push(`> ${desc}\n`);
    chunks.push(`\nSource: https://cdrkit.xyz${page.url}\n\n`);

    // Read the raw MDX file for the body — page.data.body is a compiled React
    // component, not text. Try both <rel>.mdx (leaves) and <rel>/index.mdx
    // (section index pages like /docs/components).
    const rel = page.url.replace(/^\/docs\/?/, "") || "index";
    const candidates = [
      join(process.cwd(), "content/docs", `${rel}.mdx`),
      join(process.cwd(), "content/docs", rel, "index.mdx"),
    ];
    let raw = "";
    for (const path of candidates) {
      try {
        raw = readFileSync(path, "utf-8");
        break;
      } catch {
        // try next
      }
    }
    if (raw) {
      // Strip frontmatter — content between first two `---` lines
      const body = raw.replace(/^---\n[\s\S]*?\n---\n/, "").trim();
      chunks.push(body);
      chunks.push("\n\n---\n\n");
    }
  }

  return new Response(chunks.join(""), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
