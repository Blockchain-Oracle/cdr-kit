"use client";

import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  label: string;
}

/** Right-rail "On this page" with scrollspy. Pass the section anchors the page exposes. */
export function Toc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    if (items.length === 0 || typeof IntersectionObserver === "undefined") return;
    const targets = items.map((i) => document.getElementById(i.id)).filter((n): n is HTMLElement => Boolean(n));
    if (targets.length === 0) return;
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.target.id) setActive(e.target.id);
        });
      },
      { rootMargin: "-10% 0px -70% 0px", threshold: 0 },
    );
    targets.forEach((t) => spy.observe(t));
    return () => spy.disconnect();
  }, [items]);

  if (items.length === 0) return null;
  return (
    <nav className="toc">
      <h6>On this page</h6>
      {items.map((i) => (
        <a key={i.id} href={`#${i.id}`} className={active === i.id ? "active" : undefined}>
          {i.label}
        </a>
      ))}
    </nav>
  );
}
