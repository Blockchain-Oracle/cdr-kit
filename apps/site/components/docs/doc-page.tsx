import type { ReactNode } from "react";
import { Breadcrumb, DocTitle, H2, PrevNext, PropsTable } from "./parts";
import { Toc } from "./toc";

export interface DocSection {
  id: string;
  title: string;
  content: ReactNode;
}

/** Right-rail TOC item — either derived from `sections` or supplied directly (e.g. from fumadocs MDX heading scan). */
export interface DocTocItem {
  id: string;
  label: string;
}

export interface DocPageData {
  breadcrumb: string[];
  title: string;
  badges?: ReactNode;
  lede: ReactNode;
  importLine?: string;
  callout?: ReactNode;
  sections: DocSection[];
  prev?: { href: string; label: string };
  next?: { href: string; label: string };
}

/** The canonical anatomy: breadcrumb → title row → lede → import badge → optional callout → sections → prev/next.
 *  Pass `tocItems` to override the right-rail TOC (e.g. from MDX heading scan); otherwise derived from sections. */
export function DocPage({
  data,
  tocItems,
}: {
  data: DocPageData;
  tocItems?: DocTocItem[];
}) {
  const items = tocItems ?? data.sections.filter((s) => s.title).map((s) => ({ id: s.id, label: s.title }));
  return (
    <>
      <main className="doc">
        <Breadcrumb parts={data.breadcrumb} />
        <DocTitle title={data.title} badges={data.badges} />
        <div className="doc-lede">{data.lede}</div>
        {data.importLine && (
          <div className="doc-imports">
            <span className="badge mono">{data.importLine}</span>
          </div>
        )}
        {data.callout}
        {data.sections.map((s) => (
          <section key={s.id}>
            {s.title && <H2 id={s.id}>{s.title}</H2>}
            {s.content}
          </section>
        ))}
        <PrevNext prev={data.prev} next={data.next} />
      </main>
      <Toc items={items} />
    </>
  );
}

export { PropsTable };
