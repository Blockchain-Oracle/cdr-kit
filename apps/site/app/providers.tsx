"use client";

import { useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { wagmiConfig } from "@/lib/wagmi-config";
import "@rainbow-me/rainbowkit/styles.css";

/**
 * Site-wide client providers: wagmi → react-query → RainbowKit. Wraps everything
 * inside <body>. No CdrConfigProvider here — that lives inside the docs Demo blocks
 * (via DocsLiveProvider) so non-docs pages don't pay the WASM init cost.
 */
export function SiteProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "oklch(78% 0.16 70)",
            accentColorForeground: "oklch(15% 0.012 90)",
            borderRadius: "medium",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
