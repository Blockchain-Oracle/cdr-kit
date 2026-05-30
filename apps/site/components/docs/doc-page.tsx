import type { ReactNode } from "react";
import { Breadcrumb, DocTitle, H2, PrevNext, PropsTable } from "./parts";
import { Toc } from "./toc";

export interface DocSection {
  id: string;
  title: string;
  content: ReactNode;
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

/** The canonical anatomy: breadcrumb → title row → lede → import badge → optional callout → sections → prev/next. */
export function DocPage({ data }: { data: DocPageData }) {
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
            <H2 id={s.id}>{s.title}</H2>
            {s.content}
          </section>
        ))}
        <PrevNext prev={data.prev} next={data.next} />
      </main>
      <Toc items={data.sections.map((s) => ({ id: s.id, label: s.title }))} />
    </>
  );
}

export { PropsTable };
