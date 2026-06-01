"use client";
import { useState, type ReactNode } from "react";
import type { Hex } from "viem";
import {
  useDeadManTimer,
  useEscrowState,
  useMultiSigStatus,
  useTimeWindowState,
} from "./condition-hooks.js";

/**
 * The components here are deliberately HEADLESS — they wire data and actions but leave styling
 * to the consumer (cdr-kit/react stays light per the design bar; @cdr-kit/react-ui ships the
 * premium-styled wrappers using author-built primitives — see [[premium-design-bar]]).
 *
 * Each component accepts an optional `children` render-prop receiving the typed hook result, so
 * dashboards can render whatever they want. The default rendering is a minimal-but-correct
 * fallback (countdown text, badge, "x of y", confirm button).
 */

function formatRemaining(ms: number): string {
  if (ms <= 0) return "0s";
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

/* ============================================================ */
/* HeartbeatTimer                                                */
/* ============================================================ */

export interface HeartbeatTimerProps {
  uuid: number;
  /** Custom render — receives `{ remainingMs, isUnlocked, isCritical, poke }`. */
  children?: (state: ReturnType<typeof useDeadManTimer>) => ReactNode;
}

/** Renders a dead-man-switch countdown with a "poke" button. Default render is minimal text. */
export function HeartbeatTimer({ uuid, children }: HeartbeatTimerProps) {
  const state = useDeadManTimer(uuid);
  if (children) return <>{children(state)}</>;
  if (state.isLoading) return <span data-cdr-heartbeat="loading">…</span>;
  if (state.isUnlocked) return <span data-cdr-heartbeat="unlocked">unlocked</span>;
  return (
    <span data-cdr-heartbeat={state.isCritical ? "critical" : "ok"}>
      unlocks in {formatRemaining(state.remainingMs)}
      <button type="button" onClick={() => void state.poke()}>
        extend now
      </button>
    </span>
  );
}

/* ============================================================ */
/* TimeWindowBadge                                               */
/* ============================================================ */

export interface TimeWindowBadgeProps {
  uuid: number;
  children?: (state: ReturnType<typeof useTimeWindowState>) => ReactNode;
}

export function TimeWindowBadge({ uuid, children }: TimeWindowBadgeProps) {
  const state = useTimeWindowState(uuid);
  if (children) return <>{children(state)}</>;
  if (state.isLoading) return <span data-cdr-window="loading">…</span>;
  if (state.isOpen) {
    if (state.closesInMs === 0) return <span data-cdr-window="open">open · no end</span>;
    return <span data-cdr-window="open">closes in {formatRemaining(state.closesInMs)}</span>;
  }
  if (state.opensInMs > 0) return <span data-cdr-window="upcoming">opens in {formatRemaining(state.opensInMs)}</span>;
  return <span data-cdr-window="closed">closed</span>;
}

/* ============================================================ */
/* MultiSigApprovalTracker                                       */
/* ============================================================ */

export interface MultiSigApprovalTrackerProps {
  uuid: number;
  /** Off-chain set of signers who have signed for THIS read attempt (driven by the consumer's
   *  signature-collection UI — the contract doesn't store approvals). */
  signedBy?: readonly Hex[];
  children?: (state: ReturnType<typeof useMultiSigStatus> & { signedCount: number; isReady: boolean }) => ReactNode;
}

export function MultiSigApprovalTracker({ uuid, signedBy = [], children }: MultiSigApprovalTrackerProps) {
  const status = useMultiSigStatus(uuid);
  // Combine on-chain approve() count + any off-chain sig collection state the caller passed.
  // Either path alone hitting threshold satisfies the read.
  const signedSet = new Set(signedBy.map((s) => s.toLowerCase()));
  const offChainCount = status.signers.filter((s) => signedSet.has(s.toLowerCase())).length;
  const signedCount = Math.max(status.onChainApprovals, offChainCount);
  const isReady = signedCount >= status.threshold;
  const merged = { ...status, signedCount, isReady };
  if (children) return <>{children(merged)}</>;
  if (status.isLoading) return <span data-cdr-multisig="loading">…</span>;
  return (
    <span data-cdr-multisig={isReady ? "ready" : "pending"}>
      {signedCount} of {status.threshold} approved · epoch {String(status.epoch)}
    </span>
  );
}

/* ============================================================ */
/* EscrowDeliveryConfirm                                         */
/* ============================================================ */

export interface EscrowDeliveryConfirmProps {
  uuid: number;
  buyer: Hex | undefined;
  children?: (state: ReturnType<typeof useEscrowState>) => ReactNode;
}

export function EscrowDeliveryConfirm({ uuid, buyer, children }: EscrowDeliveryConfirmProps) {
  const state = useEscrowState(uuid, buyer);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error>();

  if (children) return <>{children(state)}</>;
  if (state.isLoading) return <span data-cdr-escrow="loading">…</span>;
  if (state.delivered) return <span data-cdr-escrow="delivered">delivered</span>;
  if (state.paidAt === 0n) {
    return (
      <button
        type="button"
        data-cdr-escrow="pay"
        disabled={pending}
        onClick={() => {
          setPending(true);
          state.pay().catch((e) => setError(e as Error)).finally(() => setPending(false));
        }}
      >
        pay
      </button>
    );
  }
  return (
    <span data-cdr-escrow="awaiting-delivery">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setPending(true);
          state.confirmDelivery().catch((e) => setError(e as Error)).finally(() => setPending(false));
        }}
      >
        confirm delivery
      </button>
      {error && <span data-cdr-escrow-error>{error.message}</span>}
      {state.timeoutInMs > 0 && <span> · seller can claim in {formatRemaining(state.timeoutInMs)}</span>}
    </span>
  );
}
