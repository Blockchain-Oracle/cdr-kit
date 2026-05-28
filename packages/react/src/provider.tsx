"use client";
import { createContext, useContext, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { WagmiProvider, createConfig, http, type Config } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ensureWasm, aeneidChain, type MockCdrKit } from "@cdr-kit/core";

export interface CdrContextValue {
  /** Story-API REST base URL (keeper endpoint for partial collection). */
  apiUrl: string;
  /** True once the CDR crypto WASM is initialized (always true in mock mode). */
  wasmReady: boolean;
  /** When set, hooks run against this in-memory mock instead of a live client (tests/demos). */
  mockKit?: MockCdrKit;
}

const CdrContext = createContext<CdrContextValue | null>(null);

export function useCdrConfig(): CdrContextValue {
  const v = useContext(CdrContext);
  if (!v) throw new Error("cdr-kit: components/hooks must be used within <CdrProvider>");
  return v;
}

const fallbackQueryClient = new QueryClient();
// A minimal wagmi config so wagmi hooks resolve even in mock mode (where they go unused).
const defaultConfig = createConfig({ chains: [aeneidChain], transports: { [aeneidChain.id]: http() } });

/** Theme via CSS custom properties (e.g. `{ "--cdr-skeleton": "#222" }`). */
export interface CdrAppearance {
  variables?: Record<`--cdr-${string}`, string>;
}

export interface CdrProviderProps {
  /** Required for live mode; optional in mock mode. */
  apiUrl?: string;
  /** Required for live mode; a minimal default is used otherwise. */
  config?: Config;
  /** Pass a `createMockCdrKit()` to run everything in-memory (no chain/wallet). */
  mockKit?: MockCdrKit;
  /** Theme tokens applied as CSS variables on the cdr-kit root. */
  appearance?: CdrAppearance;
  queryClient?: QueryClient;
  children: ReactNode;
}

/** Wires wagmi + react-query, initializes the CDR WASM, and (optionally) runs in mock mode. */
export function CdrProvider({ apiUrl = "", config, mockKit, appearance, queryClient, children }: CdrProviderProps) {
  const [wasmReady, setWasmReady] = useState(Boolean(mockKit));
  useEffect(() => {
    if (mockKit) return; // mock mode needs no WASM
    let active = true;
    ensureWasm()
      .then(() => active && setWasmReady(true))
      .catch(() => active && setWasmReady(false));
    return () => {
      active = false;
    };
  }, [mockKit]);

  const value = useMemo<CdrContextValue>(() => ({ apiUrl, wasmReady, mockKit }), [apiUrl, wasmReady, mockKit]);

  return (
    <WagmiProvider config={config ?? defaultConfig}>
      <QueryClientProvider client={queryClient ?? fallbackQueryClient}>
        <CdrContext.Provider value={value}>
          <div data-cdr-root style={appearance?.variables as CSSProperties | undefined}>{children}</div>
        </CdrContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
