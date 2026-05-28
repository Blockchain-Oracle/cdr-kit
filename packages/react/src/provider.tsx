"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { WagmiProvider, type Config } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ensureWasm } from "@cdr-kit/core";

interface CdrConfigValue {
  /** Story-API REST base URL (keeper endpoint for partial collection). */
  apiUrl: string;
  /** True once the CDR crypto WASM is initialized. */
  wasmReady: boolean;
}

const CdrContext = createContext<CdrConfigValue | null>(null);

export function useCdrConfig(): CdrConfigValue {
  const v = useContext(CdrContext);
  if (!v) throw new Error("cdr-kit: components/hooks must be used within <CdrProvider>");
  return v;
}

const fallbackQueryClient = new QueryClient();

export interface CdrProviderProps {
  config: Config;
  apiUrl: string;
  queryClient?: QueryClient;
  children: ReactNode;
}

/** Wires wagmi + react-query and initializes the CDR WASM once. */
export function CdrProvider({ config, apiUrl, queryClient, children }: CdrProviderProps) {
  const [wasmReady, setWasmReady] = useState(false);
  useEffect(() => {
    let active = true;
    ensureWasm()
      .then(() => active && setWasmReady(true))
      .catch(() => active && setWasmReady(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient ?? fallbackQueryClient}>
        <CdrContext.Provider value={{ apiUrl, wasmReady }}>{children}</CdrContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
