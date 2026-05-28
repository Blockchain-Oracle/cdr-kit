"use client";
import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { Hex } from "viem";
import type { CdrReadProgress, CdrStatus, CdrError } from "@cdr-kit/core";
import { useAccessVault } from "./hooks.js";
import { useCdrConfig } from "./provider.js";

interface VaultCtxValue {
  status: CdrStatus;
  data?: Uint8Array;
  error?: CdrError;
  progress?: CdrReadProgress;
  access: (accessAuxData?: Hex) => Promise<Uint8Array>;
}
const VaultCtx = createContext<VaultCtxValue | null>(null);

function useVaultCtx(): VaultCtxValue {
  const v = useContext(VaultCtx);
  if (!v) throw new Error("cdr-kit: <Vault.Unlocked|Locked|Loading> must be inside <Vault>");
  return v;
}

export interface VaultProps {
  uuid: number;
  accessAuxData?: Hex;
  /** Auto-trigger access on mount (default true). */
  auto?: boolean;
  children: ReactNode;
}

/**
 * Compound component for one vault: a single access drives the shared state, and the slot children
 * (`Vault.Unlocked` / `Vault.Locked` / `Vault.Loading`) render against it — mirroring Clerk's
 * SignedIn/SignedOut, adapted to CDR's per-vault, eventually-consistent read.
 */
export function Vault({ uuid, accessAuxData, auto = true, children }: VaultProps) {
  const v = useAccessVault(uuid);
  useEffect(() => {
    if (auto && v.status === "idle") void v.access(accessAuxData).catch(() => undefined);
  }, [auto, v.status, v.access, accessAuxData]);
  return (
    <VaultCtx.Provider value={{ status: v.status, data: v.data, error: v.error, progress: v.progress, access: v.access }}>
      {children}
    </VaultCtx.Provider>
  );
}

Vault.Unlocked = function VaultUnlocked({ children }: { children: (data: Uint8Array) => ReactNode }) {
  const { status, data } = useVaultCtx();
  return status === "ready" && data ? <>{children(data)}</> : null;
};

Vault.Locked = function VaultLocked({ children }: { children: ReactNode }) {
  const { status } = useVaultCtx();
  return status === "idle" || status === "error" ? <>{children}</> : null;
};

Vault.Loading = function VaultLoading({ children }: { children?: (progress?: CdrReadProgress) => ReactNode }) {
  const { status, progress } = useVaultCtx();
  if (status !== "collecting-partials" && status !== "paying") return null;
  return <>{children ? children(progress) : <CdrSkeleton />}</>;
};

/** A skeleton placeholder (themed via the `--cdr-skeleton` CSS variable). */
export function CdrSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div data-cdr-skeleton aria-busy="true" aria-live="polite">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} style={{ height: 12, margin: "8px 0", borderRadius: 4, background: "var(--cdr-skeleton, #e5e7eb)" }} />
      ))}
    </div>
  );
}

/** Explicit empty state (distinct from loading). */
export function EmptyVaults({ children }: { children?: ReactNode }) {
  return <div data-cdr-empty>{children ?? "No vaults yet."}</div>;
}

/** Dev panel: shows how the kit is wired (mock vs live, WASM, keeper). Drop it in during dev. */
export function CdrInspector() {
  const { apiUrl, wasmReady, mockKit } = useCdrConfig();
  return (
    <div
      data-cdr-inspector
      style={{
        font: "12px ui-monospace, monospace",
        padding: 8,
        border: "1px solid var(--cdr-border, #d0d0d0)",
        borderRadius: 6,
      }}
    >
      <strong>cdr-kit</strong>
      {` · mode: ${mockKit ? "mock" : "live"} · wasm: ${wasmReady ? "ready" : "…"}`}
      {apiUrl ? ` · api: ${apiUrl}` : ""}
    </div>
  );
}
