"use client";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import type { Hex } from "viem";

export interface CdrWallet {
  address?: Hex;
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  connect: () => void;
  disconnect: () => void;
}

/**
 * Wallet connect on cdr-kit's own wagmi instance — pairs with the built-in `<CdrProvider>` (which
 * ships an injected connector). Use this for the simple path; for a custom wallet stack
 * (Privy / RainbowKit) bring your own provider + `<CdrConfigProvider>` instead.
 */
export function useCdrWallet(): CdrWallet {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  return {
    address,
    isConnected,
    isConnecting: isPending,
    error: error ?? null,
    connect: () => {
      connect({ connector: connectors[0] ?? injected() });
    },
    disconnect: () => {
      disconnect();
    },
  };
}
