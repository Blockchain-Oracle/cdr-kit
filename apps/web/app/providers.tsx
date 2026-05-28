"use client";

import type { ReactNode } from "react";
import { CdrProvider } from "@cdr-kit/react";
import { mockKit } from "@/mock/seed";

// Use the library's batteries-included CdrProvider so the WagmiProvider + QueryClient and the
// library's hooks share ONE wagmi instance (avoids the monorepo dual-instance "useConfig must be
// used within WagmiProvider" mismatch). When we wire Privy + live Aeneid, this swaps to the
// Privy wagmi stack + CdrConfigProvider(apiUrl).
export function Providers({ children }: { children: ReactNode }) {
  return <CdrProvider mockKit={mockKit}>{children}</CdrProvider>;
}
