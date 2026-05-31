"use client";

import { useMemo, type ReactNode } from "react";
import { CdrProvider } from "@cdr-kit/react";
import { createMockCdrKit } from "@cdr-kit/core";

const PLAINTEXT = '{ "signal": "BUY", "pair": "ETH/USD",\n  "confidence": 0.86, "ttl": "30d" }';
const UNLOCK_TEXT = "Tahoe county sheriff's report — exhibit 14B:\n\n\"At 7:42pm the suspect was observed exiting via the boat-house door, not the main path as the witness initially stated. The discrepancy is the case.\"";
const UNLOCK_PROSE = "The shadow on the dock wasn't her sister.\n\nArlo had paid Mrs. Calder twenty dollars to keep the negative — she'd developed it in her own basement that summer, before the fire. The woman in the silver swimsuit was Eleanor Vance, and she had not, as she would later testify, been three hundred miles south at the time.";
// 1x1 transparent PNG — smallest valid PNG we can use to prove the auto-detect image branch.
// Real demos would hold an actual image; this is enough to flip the magic-byte detector.
const TINY_PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x60, 0x00, 0x00, 0x00, 0x40, 0x08, 0x06, 0x00, 0x00, 0x00, 0x52, 0x99, 0xe8,
  0xb9, 0x00, 0x00, 0x00, 0x19, 0x74, 0x45, 0x58, 0x74, 0x53, 0x6f, 0x66, 0x74, 0x77, 0x61, 0x72,
  0x65, 0x00, 0x41, 0x64, 0x6f, 0x62, 0x65, 0x20, 0x49, 0x6d, 0x61, 0x67, 0x65, 0x52, 0x65, 0x61,
  0x64, 0x79, 0x71, 0xc9, 0x65, 0x3c, 0x00, 0x00, 0x00, 0x1f, 0x49, 0x44, 0x41, 0x54, 0x78, 0xda,
  0xed, 0xc1, 0x01, 0x0d, 0x00, 0x00, 0x00, 0xc2, 0xa0, 0xf7, 0x4f, 0x6d, 0x0e, 0x37, 0xa0, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xbe, 0x0d, 0x21, 0x00, 0x00, 0x01, 0x9a, 0x60, 0xe1,
  0xd5, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

/** Wraps a demo subtree in a real `<CdrProvider>` driven by `createMockCdrKit()`, seeded so the
 *  canonical demo uuids resolve to real bytes. Used by every live demo on every docs page. */
export function DocsMockProvider({ children }: { children: ReactNode }) {
  const kit = useMemo(() => {
    const k = createMockCdrKit({ readDelayMs: 2200, threshold: 7 });
    void k.writeVaultData({ uuid: 4200, dataKey: new TextEncoder().encode(PLAINTEXT) });
    void k.writeVaultData({ uuid: 4242, dataKey: new TextEncoder().encode(UNLOCK_TEXT) });
    void k.writeVaultData({ uuid: 4243, dataKey: TINY_PNG });
    void k.writeVaultData({ uuid: 4244, dataKey: new TextEncoder().encode(UNLOCK_PROSE) });
    return k;
  }, []);
  return <CdrProvider mockKit={kit}>{children}</CdrProvider>;
}
