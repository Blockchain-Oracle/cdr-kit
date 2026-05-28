"use client";
import { useEffect, type ReactNode } from "react";
import type { Hex } from "viem";
import { useAccessVault } from "./hooks.js";

export interface VaultGateProps {
  uuid: number;
  accessAuxData?: Hex;
  /** Shown while the read/decrypt is in flight. */
  loading?: ReactNode;
  /** Shown when not yet accessed / not entitled (e.g. a Subscribe CTA). */
  fallback?: ReactNode;
  /** Auto-trigger the access on mount (default: false — let the fallback drive it). */
  auto?: boolean;
  /** Render-prop: receives the decrypted bytes once available. */
  children: (data: Uint8Array) => ReactNode;
}

/** Renders gated CDR content once decrypted; otherwise renders `loading`/`fallback`. */
export function VaultGate({ uuid, accessAuxData, loading, fallback, auto, children }: VaultGateProps) {
  const { access, status, data } = useAccessVault(uuid);

  useEffect(() => {
    if (auto && status === "idle") void access(accessAuxData).catch(() => undefined);
  }, [auto, status, access, accessAuxData]);

  if (status === "ready" && data) return <>{children(data)}</>;
  if (status === "collecting-partials") return <>{loading ?? null}</>;
  return <>{fallback ?? null}</>;
}
