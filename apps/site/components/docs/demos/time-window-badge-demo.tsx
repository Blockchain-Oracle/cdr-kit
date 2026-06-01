"use client";
import { useEffect, useState } from "react";
import { Badge } from "@/components/primitives/badge";

/** Cycles through the 3 visual states a TimeWindowBadge can render. */
export function TimeWindowBadgeDemo() {
  const STATES = [
    { label: "opens in 4h 30m", tone: undefined as undefined | "live" | "primary", dataAttr: "upcoming" },
    { label: "closes in 59m 30s", tone: "primary" as const, dataAttr: "open" },
    { label: "closed", tone: undefined, dataAttr: "closed" },
  ];
  const [i, setI] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % STATES.length), 2500);
    return () => clearInterval(id);
  }, [STATES.length]);

  const s = STATES[i]!;
  return (
    <div className="vg" style={{ padding: 28 }}>
      <div className="vg-head">
        <span className="vg-id">vault <b>#5101</b></span>
        <Badge tone={s.tone}>TimeWindow</Badge>
      </div>
      <div className="vg-body" style={{ alignItems: "flex-start" }}>
        <span data-cdr-window={s.dataAttr} style={{ fontSize: 14, color: "var(--ink-1)" }}>
          {s.label}
        </span>
        <small style={{ color: "var(--ink-3)" }}>cycles every 2.5s · in-component logic ticks every 1s in live</small>
      </div>
    </div>
  );
}
