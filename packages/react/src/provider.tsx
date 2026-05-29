"use client";
import { createContext, useContext, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { WagmiProvider, createConfig, http, type Config } from "wagmi";
import { injected } from "wagmi/connectors";
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
// Default wagmi config: aeneid + an injected connector so the built-in CdrProvider can connect a
// wallet for live mode. In mock mode the wagmi hooks go unused.
const defaultConfig = createConfig({
  chains: [aeneidChain],
  connectors: [injected()],
  transports: { [aeneidChain.id]: http() },
});

/** Theme via CSS custom properties (e.g. `{ "--cdr-skeleton": "#222" }`). */
export interface CdrAppearance {
  variables?: Record<`--cdr-${string}`, string>;
}

export interface CdrConfigProviderProps {
  /** Required for live mode; optional in mock mode. */
  apiUrl?: string;
  /** Pass a `createMockCdrKit()` to run everything in-memory (no chain/wallet). */
  mockKit?: MockCdrKit;
  /** Theme tokens applied as CSS variables on the cdr-kit root. */
  appearance?: CdrAppearance;
  children: ReactNode;
}

/**
 * CDR context only — initializes the WASM, exposes `apiUrl`/`mockKit`, and themes the root.
 * Does NOT provide wagmi/react-query. Use this when your app already has its own `WagmiProvider`
 * + `QueryClientProvider` (e.g. a Privy/RainbowKit stack); otherwise use {@link CdrProvider},
 * which wraps both for you.
 */
export function CdrConfigProvider({ apiUrl = "", mockKit, appearance, children }: CdrConfigProviderProps) {
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
    <CdrContext.Provider value={value}>
      <div data-cdr-root style={appearance?.variables as CSSProperties | undefined}>
        {children}
      </div>
    </CdrContext.Provider>
  );
}

export interface CdrProviderProps extends CdrConfigProviderProps {
  /** Required for live mode; a minimal default is used otherwise. */
  config?: Config;
  queryClient?: QueryClient;
}

/** Batteries-included: wires wagmi + react-query, then {@link CdrConfigProvider}. The 5-line
 *  quickstart path. For apps with an existing wagmi stack, compose `CdrConfigProvider` instead. */
export function CdrProvider({ apiUrl, config, mockKit, appearance, queryClient, children }: CdrProviderProps) {
  return (
    <WagmiProvider config={config ?? defaultConfig}>
      <QueryClientProvider client={queryClient ?? fallbackQueryClient}>
        <CdrConfigProvider apiUrl={apiUrl} mockKit={mockKit} appearance={appearance}>
          {children}
        </CdrConfigProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
