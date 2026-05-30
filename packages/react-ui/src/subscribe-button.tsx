"use client";

import { useState } from "react";
import type { Hex } from "viem";
import { useSubscribeAndAccess } from "@cdr-kit/react";
import { Check } from "./icons";
import { AccessStepper, type AccessStatus } from "./access-stepper";

export interface SubscribeButtonProps {
  uuid: number;
  /** Total value in wei sent to the subscribe call. */
  priceWei: bigint;
  /** Number of subscription periods to pay for. */
  periods?: bigint;
  /** Human-readable price label rendered on the button (e.g. "5 $IP"). */
  priceLabel: string;
  /** Optional subscription condition address override. */
  subscriptionCondition?: Hex;
  /** Called with decrypted bytes once the flow completes. */
  onAccess?: (bytes: Uint8Array) => void;
}

/** Batteries-included CTA: button → inline AccessStepper → decoded JSON pane.
 *  Wraps `useSubscribeAndAccess` from `@cdr-kit/react`. Works in mock or live mode. */
export function SubscribeButton({ uuid, priceWei, periods = BigInt(1), priceLabel, subscriptionCondition, onAccess }: SubscribeButtonProps) {
  const sub = useSubscribeAndAccess(uuid, subscriptionCondition);
  const [decoded, setDecoded] = useState<string | null>(null);
  const [stage, setStage] = useState<AccessStatus>("idle");

  async function start() {
    setStage("paying");
    setTimeout(() => setStage((s) => (s === "paying" ? "collecting-partials" : s)), 600);
    try {
      const out = await sub.run({ periods, maxPricePerPeriod: priceWei, value: priceWei * periods });
      setStage("ready");
      const text = new TextDecoder().decode(out);
      setDecoded(text);
      onAccess?.(out);
    } catch {
      setStage("error");
    }
  }

  const inFlight = stage === "paying" || stage === "collecting-partials";

  return (
    <div className="cdr-ui-subwrap" data-cdr-ui="">
      {decoded ? (
        <div className="cdr-ui-decoded">
          <div className="dhead">
            <Check width={14} height={14} />
            Decrypted · access granted
          </div>
          <pre>{decoded}</pre>
        </div>
      ) : (
        <>
          <button type="button" className="cdr-ui-sub-cta" disabled={inFlight} onClick={start}>
            {inFlight ? "Working…" : `Subscribe & access · ${priceLabel}`}
          </button>
          {stage !== "idle" && (
            <div className="cdr-ui-sub-panel">
              <AccessStepper status={stage} progress={stage === "collecting-partials" ? { collected: 6, threshold: 10 } : undefined} withPay />
            </div>
          )}
        </>
      )}
    </div>
  );
}
