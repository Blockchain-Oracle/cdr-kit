"use client";
import { useEffect, useState } from "react";
import { Badge } from "@/components/primitives/badge";

/** Mock countdown that ticks down + flips into critical mode at <25% remaining. */
export function HeartbeatTimerDemo() {
  const TOTAL = 300; // 5 minutes
  const [remaining, setRemaining] = useState(220);

  useEffect(() => {
    const id = setInterval(() => setRemaining((r) => (r > 0 ? r - 1 : TOTAL)), 1000);
    return () => clearInterval(id);
  }, []);

  const isCritical = remaining < TOTAL * 0.25;
  const isUnlocked = remaining <= 0;
  const mm = Math.floor(remaining / 60);
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="vg" style={{ padding: 24 }}>
      <div className="vg-head">
        <span className="vg-id">vault <b>#4242</b></span>
        <Badge tone={isUnlocked ? "live" : isCritical ? "primary" : undefined}>DeadManSwitch</Badge>
      </div>
      <div className="vg-body" style={{ gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="lab">unlocks in</span>
          <span
            className="val"
            style={{
              fontVariantNumeric: "tabular-nums",
              color: isUnlocked ? "var(--ink-3)" : isCritical ? "#b97a00" : "var(--ink-1)",
              fontWeight: 600,
            }}
          >
            {isUnlocked ? "unlocked" : `${mm}:${ss}`}
          </span>
        </div>
        <div className="vg-bar"><i style={{ width: `${(remaining / TOTAL) * 100}%` }} /></div>
        <button
          className="btn btn-primary vg-btn"
          onClick={() => setRemaining(TOTAL)}
          disabled={isUnlocked}
          style={{ alignSelf: "flex-start" }}
        >
          extend now
        </button>
      </div>
    </div>
  );
}
