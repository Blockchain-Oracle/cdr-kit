import Link from "next/link";
import type { ReactNode } from "react";
import { InfoCircle } from "../icons";

/** Mono breadcrumb above the title. */
export function Breadcrumb({ parts }: { parts: string[] }) {
  return (
    <div className="crumbs">
      {parts.map((p, i) => (
        <span key={i} className={i === parts.length - 1 ? "cur" : undefined}>
          {p}
          {i < parts.length - 1 && <span className="sep" style={{ marginLeft: 8 }}>/</span>}
        </span>
      ))}
    </div>
  );
}

/** Title row: h1 + status badges (e.g. "component" "mock-ready" "deployed"). */
export function DocTitle({ title, badges }: { title: string; badges?: ReactNode }) {
  return (
    <div className="doc-titlerow">
      <h1 className="doc-title">{title}</h1>
      {badges}
    </div>
  );
}

/** Soft primary-tinted info box. */
export function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="callout">
      <InfoCircle className="ic" width={18} height={18} />
      <div>{children}</div>
    </div>
  );
}

/** Section heading with anchor link (#). */
export function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id}>
      {children}
      <a className="hash" href={`#${id}`} aria-label="permalink">
        #
      </a>
    </h2>
  );
}

/** Bottom navigation: Previous / Next page. */
export function PrevNext({
  prev,
  next,
}: {
  prev?: { href: string; label: string };
  next?: { href: string; label: string };
}) {
  return (
    <div className="doc-nav-foot">
      {prev ? (
        <Link href={prev.href}>
          <span className="dir">← Previous</span>
          <div className="nm">{prev.label}</div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link href={next.href} className="next">
          <span className="dir">Next →</span>
          <div className="nm">{next.label}</div>
        </Link>
      ) : (
        <div />
      )}
    </div>
  );
}

interface PropRow {
  name: string;
  type: string;
  defaultValue?: string;
  required?: boolean;
  description: ReactNode;
}

/** Standard props/options table. */
export function PropsTable({ rows }: { rows: PropRow[] }) {
  return (
    <table className="props">
      <thead>
        <tr>
          <th>Prop</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.name}>
            <td>
              <span className="pn">{r.name}</span>
              {r.required && <span className="req">required</span>}
            </td>
            <td>
              <span className="pt">{r.type}</span>
            </td>
            <td>
              <span className="pt">{r.defaultValue ?? "—"}</span>
            </td>
            <td>{r.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
