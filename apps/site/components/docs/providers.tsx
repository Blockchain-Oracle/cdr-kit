"use client";

import { useMemo, type ReactNode } from "react";
import { CdrProvider } from "@cdr-kit/react";
import { createMockCdrKit } from "@cdr-kit/core";

const PLAINTEXT = '{ "signal": "BUY", "pair": "ETH/USD",\n  "confidence": 0.86, "ttl": "30d" }';

/** Wraps a demo subtree in a real `<CdrProvider>` driven by `createMockCdrKit()`, seeded so vault
 *  4200's accessVault returns the canonical mock signal. Used by every live demo on every docs page. */
export function DocsMockProvider({ children }: { children: ReactNode }) {
  const kit = useMemo(() => {
    const k = createMockCdrKit({ readDelayMs: 2200, threshold: 7 });
    void k.writeVaultData({ uuid: 4200, dataKey: new TextEncoder().encode(PLAINTEXT) });
    return k;
  }, []);
  return <CdrProvider mockKit={kit}>{children}</CdrProvider>;
}
