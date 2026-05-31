"use client";
import { useCallback, useState, type ReactNode } from "react";
import type { Hex } from "viem";
import type { CdrStatus, CdrError } from "@cdr-kit/core";
import { useAccessVault, useSubscribeAndAccess } from "./hooks.js";

/** Which CDR flow drives the unlock. */
export type UnlockableMode = "subscribe" | "access";

export interface UnlockableSubscribeParams {
  /** Number of subscription periods to buy (mock-mode ignores). */
  periods?: bigint;
  /** Max price per period (in wei). */
  maxPricePerPeriod?: bigint;
  /** Native value to send with the subscribe tx. */
  value?: bigint;
  /** Optional ABI-encoded auxiliary data for the read condition. */
  accessAuxData?: Hex;
}

export interface UnlockableRenderState {
  status: CdrStatus;
  data?: Uint8Array;
  error?: CdrError;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  request: (params?: UnlockableSubscribeParams) => Promise<Uint8Array | undefined>;
  reset: () => void;
}

export interface UseUnlockableProps {
  uuid: number;
  mode?: UnlockableMode;
  subscriptionCondition?: Hex;
}

const DEFAULT_SUBSCRIBE: Required<Pick<UnlockableSubscribeParams, "periods" | "maxPricePerPeriod" | "value">> = {
  periods: 1n,
  maxPricePerPeriod: 5_000_000_000_000_000_000n,
  value: 5_000_000_000_000_000_000n,
};

/** Headless state machine for an inline "free to read, pay to unlock" pill.
 *  Wraps `useSubscribeAndAccess` (default) or `useAccessVault` and adds open/close UI state. */
export function useUnlockable({ uuid, mode = "subscribe", subscriptionCondition }: UseUnlockableProps): UnlockableRenderState {
  const subscribe = useSubscribeAndAccess(uuid, subscriptionCondition);
  const accessHook = useAccessVault(uuid);
  const [isOpen, setIsOpen] = useState(false);
  const [localError, setLocalError] = useState<CdrError | undefined>();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const request = useCallback(
    async (params: UnlockableSubscribeParams = {}) => {
      setLocalError(undefined);
      try {
        if (mode === "access") {
          return await accessHook.access(params.accessAuxData);
        }
        return await subscribe.run({
          periods: params.periods ?? DEFAULT_SUBSCRIBE.periods,
          maxPricePerPeriod: params.maxPricePerPeriod ?? DEFAULT_SUBSCRIBE.maxPricePerPeriod,
          value: params.value ?? DEFAULT_SUBSCRIBE.value,
          accessAuxData: params.accessAuxData,
        });
      } catch (e) {
        setLocalError(e as CdrError);
        return undefined;
      }
    },
    [mode, subscribe, accessHook],
  );

  const reset = useCallback(() => {
    setIsOpen(false);
    setLocalError(undefined);
  }, []);

  if (mode === "access") {
    return {
      status: accessHook.status,
      data: accessHook.data,
      error: accessHook.error ?? localError,
      isOpen, open, close, toggle, request, reset,
    };
  }
  return {
    status: subscribe.status,
    data: subscribe.data,
    error: localError,
    isOpen, open, close, toggle, request, reset,
  };
}

export interface UnlockableProps extends UseUnlockableProps {
  /** Render-prop receives the full unlock state. */
  children: (state: UnlockableRenderState) => ReactNode;
}

/** Headless render-prop wrapper around `useUnlockable` — gives the consumer full visual control. */
export function Unlockable({ children, ...config }: UnlockableProps) {
  const state = useUnlockable(config);
  return <>{children(state)}</>;
}
