import type { ReactNode } from "react";
import "./roadmap-table.css";

export type RoadmapStatus = "next" | "queued" | "exploring";

export interface RoadmapRow {
  /** Stable anchor id — used as the row's `<a id>`. */
  id: string;
  status: RoadmapStatus;
  title: ReactNode;
  body: ReactNode;
}

interface RoadmapTableProps {
  rows: RoadmapRow[];
}

const STATUS_META: Record<
  RoadmapStatus,
  { label: string; dotClass: string; cardClass: string }
> = {
  next: { label: "next", dotClass: "rm-dot--next", cardClass: "rm-card--next" },
  queued: { label: "queued", dotClass: "rm-dot--queued", cardClass: "rm-card--queued" },
  exploring: {
    label: "exploring",
    dotClass: "rm-dot--exploring",
    cardClass: "rm-card--exploring",
  },
};

/**
 * RoadmapTable — surface used by `/docs/roadmap`. Each row is a self-contained
 * card with a status pill (next / queued / exploring), title, and body copy.
 *
 * Visual goals:
 *   - Status pill colour anchors the row's left border so the page scans
 *     vertically — you can see at a glance how much is `next` vs `exploring`.
 *   - Anchor id on every row so we can deep-link from issues / changelog
 *     entries (`/docs/roadmap#ratelimit-condition`).
 *   - No external CSS framework — uses the same `--cdr-*` tokens as the rest
 *     of the docs site for light/dark parity.
 */
export function RoadmapTable({ rows }: RoadmapTableProps) {
  return (
    <ul className="rm" role="list">
      {rows.map((row) => {
        const meta = STATUS_META[row.status];
        return (
          <li key={row.id} id={row.id} className={`rm-card ${meta.cardClass}`}>
            <header className="rm-head">
              <span className={`rm-status ${meta.dotClass}`}>
                <span className="rm-statusdot" aria-hidden />
                {meta.label}
              </span>
              <a className="rm-anchor" href={`#${row.id}`} aria-label={`Link to ${row.id}`}>
                #
              </a>
            </header>
            <h3 className="rm-title">{row.title}</h3>
            <p className="rm-body">{row.body}</p>
          </li>
        );
      })}
    </ul>
  );
}
