"use client";

import type { ReactNode } from "react";
import { CdrProvider } from "@cdr-kit/react";
import { mockKit } from "@/mock/seed";

const CDR_API_URL = process.env.NEXT_PUBLIC_CDR_API_URL;

/**
 * Live when `NEXT_PUBLIC_CDR_API_URL` (the Story-API keeper) is set: `CdrProvider` owns the wagmi
 * instance the hooks use and ships an injected connector, so `useCdrWallet()` connects a real wallet
 * and the flows hit Aeneid. Otherwise mock-first — the whole flow runs in-memory with no chain/wallet.
 */
export function Providers({ children }: { children: ReactNode }) {
  if (CDR_API_URL) {
    return <CdrProvider apiUrl={CDR_API_URL}>{children}</CdrProvider>;
  }
  return <CdrProvider mockKit={mockKit}>{children}</CdrProvider>;
}
