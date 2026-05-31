"use client";
import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import type { CdrStatus } from "@cdr-kit/core";
import type { UnlockableRenderState } from "@cdr-kit/react";
import { AccessStepper, type AccessStatus } from "./access-stepper";
import { CdrError } from "./cdr-error";
import { useFloatingCard } from "./use-floating-card";
import { Lock, LockOpen, X } from "./icons";

function asAccessStatus(s: CdrStatus): AccessStatus {
  if (s === "paying" || s === "collecting-partials" || s === "ready" || s === "error") return s;
  return "idle";
}

export interface UnlockableCardProps {
  anchorRef: RefObject<HTMLElement | null>;
  state: UnlockableRenderState;
  priceLabel: string;
  /** Renders the decrypted bytes into the card body. */
  unlockedRenderer: (data: Uint8Array) => ReactNode;
  /** Short title shown above the price (e.g. the highlighted phrase or vault label). */
  title?: ReactNode;
  /** Sub-line under the title, e.g. "1 photo · attached". */
  subtitle?: ReactNode;
}

export function UnlockableCard({ anchorRef, state, priceLabel, unlockedRenderer, title, subtitle }: UnlockableCardProps) {
  const pos = useFloatingCard(true, anchorRef);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const close = state.close;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    function onClick(e: MouseEvent) {
      const target = e.target as Node;
      if (cardRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      close();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [close, anchorRef]);

  if (typeof document === "undefined") return null;

  const inFlight = state.status === "paying" || state.status === "collecting-partials";
  const unlocked = state.status === "ready" && state.data;
  const errored = state.status === "error" || state.error;

  const className = `cdr-ui-unl-card cdr-ui-unl-card--${pos.mode}${unlocked ? " is-unlocked" : ""}${pos.placement === "above" ? " is-above" : ""}`;
  const style =
    pos.mode === "popover"
      ? { top: pos.top, left: pos.left, width: pos.width, transform: pos.placement === "above" ? "translateY(-100%)" : undefined }
      : undefined;

  return createPortal(
    <div ref={cardRef} className={className} style={style} role="dialog" aria-modal={pos.mode === "sheet"} aria-label="Unlockable content" data-cdr-ui="">
      <header className="cdr-ui-unl-head">
        <span className="cdr-ui-unl-icon">{unlocked ? <LockOpen width={16} height={16} /> : <Lock width={16} height={16} />}</span>
        <div className="cdr-ui-unl-meta">
          {title && <div className="t">{title}</div>}
          {subtitle && <div className="s">{subtitle}</div>}
        </div>
        <button type="button" className="cdr-ui-unl-close" onClick={state.close} aria-label="Close">
          <X width={14} height={14} />
        </button>
      </header>

      <div className="cdr-ui-unl-body">
        {unlocked ? (
          unlockedRenderer(state.data!)
        ) : inFlight ? (
          <AccessStepper status={asAccessStatus(state.status)} progress={state.status === "collecting-partials" ? { collected: 4, threshold: 7 } : undefined} withPay={state.status !== "collecting-partials" || false} />
        ) : errored ? (
          <CdrError title="Unlock failed" message={state.error?.message ?? "Something went wrong while reading the vault."} onRetry={() => void state.request()} />
        ) : (
          <div className="cdr-ui-unl-pre">
            <div className="cdr-ui-unl-price">
              <span className="amt">{priceLabel}</span>
              <span className="per">one-time unlock</span>
            </div>
            <button type="button" className="cdr-ui-unl-cta" onClick={() => void state.request()}>
              Unlock
            </button>
            <div className="cdr-ui-unl-foot">Pays via Story CDR · decrypts locally in your browser.</div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
