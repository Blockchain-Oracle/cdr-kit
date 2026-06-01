"use client";
import { useState } from "react";
import { Badge } from "@/components/primitives/badge";

const SIGNERS = [
  { addr: "0xAlice…", name: "Alice (founder)" },
  { addr: "0xBob…", name: "Bob (cofounder)" },
  { addr: "0xCarol…", name: "Carol (counsel)" },
];

export function MultiSigApprovalTrackerDemo() {
  const [signed, setSigned] = useState<Set<number>>(new Set([0]));
  const threshold = 2;
  const isReady = signed.size >= threshold;

  function toggle(i: number) {
    setSigned((s) => {
      const next = new Set(s);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <div className="vg" style={{ padding: 24 }}>
      <div className="vg-head">
        <span className="vg-id">vault <b>#7331</b></span>
        <Badge tone={isReady ? "live" : "primary"}>MultiSig</Badge>
      </div>
      <div className="vg-body" style={{ gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span data-cdr-multisig={isReady ? "ready" : "pending"} style={{ fontWeight: 600 }}>
            {signed.size} of {threshold} approved · epoch 0
          </span>
          {isReady && <span className="ok">✓ threshold met</span>}
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {SIGNERS.map((s, i) => (
            <li
              key={s.addr}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", border: "1px solid var(--ink-6)", borderRadius: 8 }}
            >
              <span style={{ fontSize: 13 }}>{s.name}</span>
              <button
                className="btn"
                style={{ fontSize: 12, padding: "4px 10px", color: signed.has(i) ? "var(--ink-3)" : undefined }}
                onClick={() => toggle(i)}
              >
                {signed.has(i) ? "✓ signed" : "request sig"}
              </button>
            </li>
          ))}
        </ul>
        <small style={{ color: "var(--ink-3)" }}>
          sigs collected off-chain · binds (uuid, caller, epoch, deadline) · submit as accessAuxData
        </small>
      </div>
    </div>
  );
}
