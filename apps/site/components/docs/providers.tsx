"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { CdrConfigProvider } from "@cdr-kit/react";
import { createMockCdrKit } from "@cdr-kit/core";
import { DEMO_VAULTS } from "@/lib/demo-vaults";

/**
 * Mock CDR provider for docs demos. Every hook/component renders against an
 * in-memory mock kit — no wallet, no chain, no funded testnet account required.
 *
 * Why mock for docs:
 *   - The docs site must "just work" for any visitor landing on cdrkit.xyz.
 *   - Asking visitors to connect a wallet + grab testnet IP just to see a demo
 *     is a brutal first impression and breaks the read-the-docs path.
 *   - Scaffolded templates (`create-cdr-kit-app`) are where real integration lives —
 *     consumers shipping products configure their own wagmi + funded wallet there.
 *
 * The mock kit pre-seeds the canonical DEMO_VAULTS uuids with realistic payloads
 * (trading-signal JSON, unlockable prose, etc.) so demos look identical to live.
 * Every demo using this provider should pass `badge={<Badge>mock kit</Badge>}`
 * to its enclosing `<Demo>` so visitors know what they're seeing.
 */
export function DocsMockProvider({ children }: { children: ReactNode }) {
  const mockKit = useMemo(() => {
    const kit = createMockCdrKit({ readDelayMs: 2400, threshold: 5 });
    // Pre-seed canonical demo vaults so `accessVault` / `subscribeAndAccess`
    // return realistic content without needing a prior `createVault` step.
    const enc = new TextEncoder();
    void kit.writeVaultData({
      uuid: DEMO_VAULTS.tradingSignal,
      dataKey: enc.encode(
        JSON.stringify({ signal: "BUY", pair: "ETH/USD", confidence: 0.86, ts: Date.now() }),
      ),
    });
    void kit.writeVaultData({
      uuid: DEMO_VAULTS.secondarySignal,
      dataKey: enc.encode(
        JSON.stringify({ signal: "SELL", pair: "SOL/USDC", confidence: 0.74, ts: Date.now() }),
      ),
    });
    void kit.writeVaultData({
      uuid: DEMO_VAULTS.image,
      dataKey: enc.encode("[fake-image-payload: closing chapter handwritten page · 4.4 MB]"),
    });
    void kit.writeVaultData({
      uuid: DEMO_VAULTS.unlockProse,
      dataKey: enc.encode(
        "She told the press she was alone in Tahoe. The timeline in the official record doesn't add up — and the photo nobody published shows otherwise.",
      ),
    });
    return kit;
  }, []);

  return <CdrConfigProvider mockKit={mockKit}>{children}</CdrConfigProvider>;
}
