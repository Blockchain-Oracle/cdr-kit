"use client";
import { useState } from "react";
import { Badge } from "@/components/primitives/badge";

type Stage = "idle" | "signing" | "signed";

// Fake but well-shaped 65-byte hex (r || s || v) that mirrors what walletClient.signTypedData
// returns. Real sigs will differ each time; this is purely visual.
const MOCK_SIG =
  "0x9c4a7e2b3f0d1a8c5b6e9f2d4a7c1e8b3a5d6f9e2c4b7a1d8e5c3f6b9a2d4e7c1b5a8e3d6f9c2b4a7d1e8c3b5a6f9d2e4c7b1a8e3d5f6c9b2a4d7e1c8b3a5d6f9e1b";

export function MultiSigSignerDemo() {
  const [stage, setStage] = useState<Stage>("idle");
  const [copied, setCopied] = useState(false);

  function sign() {
    setStage("signing");
    setTimeout(() => setStage("signed"), 800);
  }

  function copy() {
    void navigator.clipboard?.writeText(MOCK_SIG).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="vg" style={{ padding: 24 }}>
      <div className="vg-head">
        <span className="vg-id">
          vault <b>#7331</b> · approving as <b>0xAlice…</b>
        </span>
        <Badge tone={stage === "signed" ? "live" : "primary"}>MultiSig</Badge>
      </div>
      <div className="vg-body" style={{ gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span className="lab">domain</span>
          <span className="val mono" style={{ fontSize: 12 }}>cdr-kit:MultiSigCondition v1</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span className="lab">message</span>
          <span className="val mono" style={{ fontSize: 12 }}>
            Approval(uuid=7331, caller=0xBuyer…, epoch=0, deadline=+1h)
          </span>
        </div>

        {stage !== "signed" && (
          <button
            className="btn btn-primary vg-btn"
            disabled={stage === "signing"}
            onClick={sign}
            style={{ marginTop: 4 }}
          >
            {stage === "signing" ? "signing…" : "sign approval"}
          </button>
        )}

        {stage === "signed" && (
          <>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                background: "var(--paper-2)",
                border: "1px solid var(--line)",
                borderRadius: 8,
                padding: "8px 12px",
                fontFamily: "var(--mono)",
                fontSize: 12,
                wordBreak: "break-all",
              }}
            >
              <span style={{ color: "var(--ink-3)" }}>sig</span>
              <span style={{ flex: 1 }}>
                {MOCK_SIG.slice(0, 16)}…{MOCK_SIG.slice(-12)}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" onClick={copy} style={{ flex: 1, fontSize: 13 }}>
                {copied ? "✓ copied" : "copy sig"}
              </button>
              <button className="btn" onClick={sign} style={{ flex: 1, fontSize: 13 }}>
                re-sign
              </button>
            </div>
            <small style={{ color: "var(--ink-3)" }}>
              share with the buyer · they submit threshold-many sigs as accessAuxData
            </small>
          </>
        )}

        {stage === "idle" && (
          <small style={{ color: "var(--ink-3)" }}>
            EIP-712 typed-data signed by the connected wallet · gas-free for signers
          </small>
        )}
      </div>
    </div>
  );
}
