import { notFound } from "next/navigation";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import type { ComponentType, ReactElement, ReactNode } from "react";
import { source } from "@/lib/source";
import { DocPage } from "@/components/docs/doc-page";
import { CopyPageButton } from "@/components/docs/copy-page-button";
import { getMDXComponents } from "@/lib/mdx-components";

/** Recursively flatten an MDX heading title (string | ReactElement) to plain text.
 *  Without this, headings containing `<code>foo</code>` or other markup render as
 *  empty labels in the right rail because the React element isn't a string. */
function flattenTitle(node: unknown): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flattenTitle).join("");
  if (typeof node === "object" && "props" in node) {
    const props = (node as ReactElement<{ children?: ReactNode }>).props;
    return flattenTitle(props?.children);
  }
  return "";
}

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
  // When a heading contains markup (e.g. `## <code>foo</code>`), `title` is a React
  // element rather than a string — flatten it to text so the rail isn't blank.
  const tocItems = data.toc
    .filter((node) => node.depth <= 3)
    .map((node) => ({
      id: node.url.replace(/^#/, ""),
      label: flattenTitle(node.title),
    }));

  // Raw MDX for the per-page Copy button. Server-read once; passed as a string
  // to the client component so there's no extra fetch round-trip. The MDX file
  // path is derived from the URL — try both <rel>.mdx (leaf pages) and
  // <rel>/index.mdx (section index pages like /docs/components).
  let rawMarkdown = "";
  const rel = page.url.replace(/^\/docs\/?/, "") || "index";
  const candidates = [
    join(process.cwd(), "content/docs", `${rel}.mdx`),
    join(process.cwd(), "content/docs", rel, "index.mdx"),
  ];
  for (const path of candidates) {
    try {
      rawMarkdown = readFileSync(path, "utf-8");
      break;
    } catch {
      // try next candidate
    }
  }
  if (!rawMarkdown) {
    console.warn(`[docs] No MDX source found for ${page.url} (tried: ${candidates.join(", ")})`);
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
