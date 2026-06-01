"use client";
import { useState } from "react";
import { Badge } from "@/components/primitives/badge";

type Stage = "unpaid" | "paid" | "delivered";

export function EscrowDeliveryConfirmDemo() {
  const [stage, setStage] = useState<Stage>("unpaid");

  return (
    <div className="vg" style={{ padding: 24 }}>
      <div className="vg-head">
        <span className="vg-id">vault <b>#8812</b></span>
        <Badge tone={stage === "delivered" ? "live" : stage === "paid" ? "primary" : undefined}>Escrow</Badge>
      </div>
      <div className="vg-body" style={{ gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span className="lab">price</span>
          <span className="val">0.01 $IP</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span className="lab">timeout</span>
          <span className="val">24h after pay</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span className="lab">state</span>
          <span data-cdr-escrow={stage} style={{ fontWeight: 600 }}>
            {stage === "unpaid" ? "awaiting payment" : stage === "paid" ? "awaiting delivery confirmation" : "delivered ✓"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          {stage === "unpaid" && (
            <button className="btn btn-primary vg-btn" onClick={() => setStage("paid")}>
              pay 0.01 $IP
            </button>
          )}
          {stage === "paid" && (
            <button className="btn btn-primary vg-btn" onClick={() => setStage("delivered")}>
              confirm delivery
            </button>
          )}
          {stage === "delivered" && (
            <button className="btn" onClick={() => setStage("unpaid")} style={{ fontSize: 12 }}>
              reset demo
            </button>
          )}
        </div>
        <small style={{ color: "var(--ink-3)" }}>
          confirm releases funds to seller AND grants buyer read access. No arbiter = no refund path.
        </small>
      </div>
    </div>
  );
}
