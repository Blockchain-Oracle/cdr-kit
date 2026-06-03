import { notFound } from "next/navigation";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import type { ComponentType } from "react";
import { source } from "@/lib/source";
import { DocPage } from "@/components/docs/doc-page";
import { CopyPageButton } from "@/components/docs/copy-page-button";
import { getMDXComponents } from "@/lib/mdx-components";

type Props = { params: Promise<{ slug?: string[] }> };

// The frontmatter schema (defined in source.config.ts) doesn't flow into source.getPage().data
// as typed fields — fumadocs surfaces them as `unknown` by default. This interface is the
// runtime shape we know exists.
interface DocFrontmatter {
  title: string;
  description?: string;
  importLine?: string;
  breadcrumb?: string[];
  prev?: { href: string; label: string };
  next?: { href: string; label: string };
  body: ComponentType<{ components: ReturnType<typeof getMDXComponents> }>;
  toc: Array<{ url: string; title: unknown; depth: number }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) return {};
  const data = page.data as unknown as DocFrontmatter;
  return {
    title: `${data.title} — cdr-kit`,
    description: data.description,
  };
}

export async function generateStaticParams() {
  return source.generateParams();
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  const data = page.data as unknown as DocFrontmatter;
  const MDX = data.body;

  // Map fumadocs TOC ({ url: "#id", title, depth }) → DocTocItem ({ id, label }).
  // Only h2/h3 land in the right rail to match the existing scrollspy density.
  const tocItems = data.toc
    .filter((node) => node.depth <= 3)
    .map((node) => ({
      id: node.url.replace(/^#/, ""),
      label: typeof node.title === "string" ? node.title : "",
    }));

  // Raw MDX for the per-page Copy button. Server-read once; passed as a string
  // to the client component so there's no extra fetch round-trip. The MDX file
  // path is derived from the URL: /docs/components/x → content/docs/components/x.mdx;
  // /docs → content/docs/index.mdx.
  let rawMarkdown = "";
  try {
    const rel = page.url.replace(/^\/docs\/?/, "") || "index";
    const mdxPath = join(process.cwd(), "content/docs", `${rel}.mdx`);
    rawMarkdown = readFileSync(mdxPath, "utf-8");
  } catch (err) {
    // Surface but don't crash — the page itself is already rendered via fumadocs
    // page.data.body; the Copy button just degrades to an empty payload.
    console.warn(`[docs] Failed to read raw MDX for ${page.url}:`, (err as Error).message);
  }

  return (
    <DocPage
      data={{
        breadcrumb: data.breadcrumb ?? [],
        title: data.title,
        badges: <CopyPageButton markdown={rawMarkdown} />,
        lede: data.description ?? "",
        importLine: data.importLine,
        prev: data.prev,
        next: data.next,
        sections: [
          {
            id: "content",
            title: "",
            content: <MDX components={getMDXComponents()} />,
          },
        ],
      }}
      tocItems={tocItems}
    />
  );
}
