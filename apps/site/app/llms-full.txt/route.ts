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
    chunks.push(`\nSource: https://cdr-kit.dev${page.url}\n\n`);

    // Read the raw MDX file for the body — page.data.body is a compiled React
    // component, not text. Derive file path from URL: /docs/x/y → content/docs/x/y.mdx;
    // /docs → content/docs/index.mdx.
    try {
      const rel = page.url.replace(/^\/docs\/?/, "") || "index";
      const mdxPath = join(process.cwd(), "content/docs", `${rel}.mdx`);
      const raw = readFileSync(mdxPath, "utf-8");
      // Strip frontmatter — content between first two `---` lines
      const body = raw.replace(/^---\n[\s\S]*?\n---\n/, "").trim();
      chunks.push(body);
      chunks.push("\n\n---\n\n");
    } catch {
      // skip pages we can't read; the index in llms.txt still covers them
    }
  }

  return new Response(chunks.join(""), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
