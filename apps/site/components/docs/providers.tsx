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
    // Pre-seed the legacy uuid range used by the /showcase/blog story + the
    // UnlockableDemo component (uuids 4242–4244). These are hardcoded literals
    // in the showcase prose and the gallery demo, not the DEMO_VAULTS constants,
    // so they need their own seed entries here.
    void kit.writeVaultData({
      uuid: 4242,
      dataKey: enc.encode(
        // Sheriff's-report exhibit — short prose redacted-style snippet so the demo's reveal feels textual.
        "Exhibit 14B · Lakeside SO Case 0741\nWitness places a second subject on the dock at 22:47 PT. " +
          "Description: female, 5'7\", dark coat. Conflicts with subject's solo-residence statement filed 23:10 PT.",
      ),
    });
    void kit.writeVaultData({
      uuid: 4243,
      dataKey: enc.encode(
        "[image · LAKESIDE-0741 · 4.4 MB · single-frame negative]\n" +
          "(In a live deploy, this vault would carry the CID of the encrypted photograph; the mock returns the descriptor so the reveal lands cleanly.)",
      ),
    });
    void kit.writeVaultData({
      uuid: 4244,
      dataKey: enc.encode(
        "Closing chapter — torn page, in Arlo's hand:\n\n" +
          "“I told them I was alone. I wasn't. The boat-house door was open for an hour and I am the only one who knows why. " +
          "If you are reading this it means the page survived me. That was the part I did not plan for.”",
      ),
    });
    return kit;
  }, []);

  return <CdrConfigProvider mockKit={mockKit}>{children}</CdrConfigProvider>;
}
