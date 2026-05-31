"use client";
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import type { CdrStatus } from "@cdr-kit/core";
import type { UnlockableRenderState } from "@cdr-kit/react";
import { AccessStepper, type AccessStatus } from "./access-stepper";
import { CdrError } from "./cdr-error";
import { Lock, LockOpen, X } from "./icons";

function asAccessStatus(s: CdrStatus): AccessStatus {
  if (s === "paying" || s === "collecting-partials" || s === "ready" || s === "error") return s;
  return "idle";
}

export interface UnlockableCardProps extends Omit<ComponentPropsWithoutRef<"div">, "title"> {
  state: UnlockableRenderState;
  priceLabel: string;
  /** Renders the decrypted bytes into the card body. */
  unlockedRenderer: (data: Uint8Array) => ReactNode;
  /** Card header title (ReactNode — accepts strings, JSX, anything). */
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Called when the close button is clicked. (Radix handles Escape/outside-click separately.) */
  onClose?: () => void;
}

/** Card body rendered inside the Radix Popover.Content portal. Pure presentational — all
 *  positioning/focus/dismiss is handled by Radix; we drive content from the unlock state. */
export const UnlockableCard = forwardRef<HTMLDivElement, UnlockableCardProps>(function UnlockableCard(
  { state, priceLabel, unlockedRenderer, title, subtitle, onClose, className, ...rest },
  ref,
) {
  const inFlight = state.status === "paying" || state.status === "collecting-partials";
  const unlocked = state.status === "ready" && state.data;
  const errored = state.status === "error" || state.error;

  return (
    <div
      ref={ref}
      className={["cdr-ui-unl-card", unlocked ? "is-unlocked" : "", className ?? ""].filter(Boolean).join(" ")}
      data-cdr-ui=""
      {...rest}
    >
      <header className="cdr-ui-unl-head">
        <span className="cdr-ui-unl-icon">{unlocked ? <LockOpen width={16} height={16} /> : <Lock width={16} height={16} />}</span>
        <div className="cdr-ui-unl-meta">
          {title && <div className="t">{title}</div>}
          {subtitle && <div className="s">{subtitle}</div>}
        </div>
        <button type="button" className="cdr-ui-unl-close" onClick={onClose} aria-label="Close">
          <X width={14} height={14} />
        </button>
      </header>

      <div className="cdr-ui-unl-body">
        {unlocked ? (
          unlockedRenderer(state.data!)
        ) : inFlight ? (
          <AccessStepper
            status={asAccessStatus(state.status)}
            progress={state.status === "collecting-partials" ? { collected: 4, threshold: 7 } : undefined}
            withPay={state.status !== "collecting-partials"}
          />
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
    </div>
  );
});
