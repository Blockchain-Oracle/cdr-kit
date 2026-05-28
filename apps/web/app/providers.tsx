"use client";

import { type ReactNode, useState } from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CdrConfigProvider } from "@cdr-kit/react";
import { aeneidChain } from "@cdr-kit/core";
import { mockKit } from "@/mock/seed";

// Mock-first: a plain wagmi config so wagmi hooks resolve; the CDR flow runs against the seeded
// in-memory mock kit. When NEXT_PUBLIC_PRIVY_APP_ID + NEXT_PUBLIC_CDR_API_URL are set, this is
// where the Privy wagmi stack + live CdrConfigProvider(apiUrl) get swapped in.
const wagmiConfig = createConfig({
  chains: [aeneidChain],
  transports: { [aeneidChain.id]: http() },
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <CdrConfigProvider mockKit={mockKit}>{children}</CdrConfigProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
