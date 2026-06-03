import { source } from "@/lib/source";

// Cached forever — page tree changes only at build time
export const revalidate = false;

/**
 * AI-friendly index of every docs page. Mirrors the sidebar tree.
 * AI agents (Claude/GPT/etc.) crawl this to understand the docs surface area.
 */
export async function GET() {
  const lines: string[] = [
    "# cdr-kit",
    "",
    "> Developer toolkit for Story Protocol's Confidential Data Rails (CDR). Ship private, paid, license-gated data on Story.",
    "",
    "## Documentation",
    "",
  ];

  for (const page of source.getPages()) {
    const data = page.data as unknown as { title?: string; description?: string };
    const title = data.title ?? page.url;
    const desc = data.description ? `: ${data.description}` : "";
    lines.push(`- [${title}](https://cdr-kit.dev${page.url})${desc}`);
  }

  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
