"use client";

import { useState } from "react";
import { useSubscribeAndAccess } from "@cdr-kit/react";
import { Badge } from "@/components/primitives/badge";
import { DocsLiveProvider } from "../providers";

const PRICE_WEI = BigInt(5);
const PERIOD = 30 * 24 * 60 * 60;

function VaultWidget() {
  const sub = useSubscribeAndAccess(4200);
  const [stage, setStage] = useState<"idle" | "paying" | "collecting" | "ready">("idle");

  async function start() {
    setStage("paying");
    // Real call against the seeded mock kit — the status machine + decrypted bytes are honest.
    setTimeout(() => setStage("collecting"), 700);
    try {
      const out = await sub.run({ periods: BigInt(1), maxPricePerPeriod: PRICE_WEI, value: PRICE_WEI });
      void out;
      setStage("ready");
    } catch {
      setStage("idle");
    }
  }

  const decoded = sub.data ? new TextDecoder().decode(sub.data) : null;
  const isLocked = stage === "idle" || (!decoded && stage !== "ready");

  return (
    <div className="vg">
      <div className="vg-head">
        <span className="vg-id">
          vault <b>#4200</b>
        </span>
        <Badge tone="primary">Subscription</Badge>
      </div>
      <div className="vg-body">
        <div className="vg-cond">
          <span className="lab">read.condition</span>
          <span className="val">5 $IP / {PERIOD / 86400}d</span>
        </div>
        <div className={isLocked ? "vg-data" : "vg-data unlocked"}>
          {decoded ?? "7b 22 73 69 67 6e 61 6c 22 3a 22 ?? ?? 9f a3 2e c1 04 7d e8 11 b6 ?? ?? 6a 0c"}
        </div>
        <div className="vg-progress">
          {stage === "paying" && (
            <>
              <span className="sp" />
              <span>tx 0x4e…b1 — paying 5 $IP…</span>
            </>
          )}
          {stage === "collecting" && (
            <>
              <span className="sp" />
              <span>collecting key shares · threshold 7 / 10…</span>
            </>
          )}
          {stage === "ready" && <span className="ok">✓ condition satisfied · decrypted locally</span>}
        </div>
        <div className="vg-bar">
          <i
            style={{
              width: stage === "ready" ? "100%" : stage === "collecting" ? "70%" : stage === "paying" ? "30%" : "0%",
            }}
          />
        </div>
      </div>
      <div className="vg-foot">
        <button className="btn btn-primary vg-btn" onClick={start} disabled={stage !== "idle" && stage !== "ready"}>
          {stage === "ready" ? "Access granted" : stage === "idle" ? "Subscribe · 5 $IP" : "Working…"}
        </button>
      </div>
    </div>
  );
}

export function VaultGateDemo() {
  return (
    <DocsLiveProvider>
      <VaultWidget />
    </DocsLiveProvider>
  );
}
