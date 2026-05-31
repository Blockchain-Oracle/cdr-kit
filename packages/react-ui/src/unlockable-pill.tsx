"use client";
import { useState, type ReactNode } from "react";
import type { Hex } from "viem";
import * as Popover from "@radix-ui/react-popover";
import { useUnlockable, type UnlockableMode } from "@cdr-kit/react";
import { Lock, LockOpen } from "./icons";
import { UnlockableCard } from "./unlockable-card";
import { unlockedAuto } from "./unlocked-auto";

export interface UnlockablePillProps {
  uuid: number;
  /** Human-readable price for the card (e.g. "5 $IP"). Pill itself shows lock + anchor text. */
  priceLabel?: string;
  /** Subscribe (default) or access — when readers already have rights (open / tier-gate). */
  mode?: UnlockableMode;
  /** Override the subscription condition address (default: aeneid.subscriptionCondition). */
  subscriptionCondition?: Hex;
  /** Optional card title. Defaults to "Unlock to reveal". */
  title?: ReactNode;
  /** Optional subtitle in the card head, e.g. "1 photo · attached". */
  subtitle?: ReactNode;
  /** Override the default auto-detect renderer for the decrypted bytes. */
  unlockedRenderer?: (data: Uint8Array) => ReactNode;
  /** The anchor text (always plaintext, SEO-visible). */
  children: ReactNode;
}

/** Inline "free to read, pay to unlock" pill — click to open the floating unlock card.
 *  Built on `@radix-ui/react-popover` for a11y (focus trap, focus return, escape, click-outside, ARIA Dialog).
 *  The anchor text (children) stays plaintext; the encrypted payload is in CDR vault `uuid`. */
export function UnlockablePill({
  uuid,
  priceLabel = "5 $IP",
  mode,
  subscriptionCondition,
  title = "Unlock to reveal",
  subtitle,
  unlockedRenderer = unlockedAuto,
  children,
}: UnlockablePillProps) {
  const [open, setOpen] = useState(false);
  const state = useUnlockable({ uuid, mode, subscriptionCondition });
  const unlocked = state.status === "ready" && state.data;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <span
          className={`cdr-ui-unl-pill${unlocked ? " is-unlocked" : ""}${open ? " is-open" : ""}`}
          role="button"
          tabIndex={0}
          data-cdr-ui=""
        >
          <span className="cdr-ui-unl-pill-text">{children}</span>
          <span className="cdr-ui-unl-pill-badge" aria-hidden="true">
            {unlocked ? <LockOpen width={11} height={11} /> : <Lock width={11} height={11} />}
          </span>
        </span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="center"
          side="bottom"
          sideOffset={10}
          collisionPadding={12}
          className={`cdr-ui-unl-popover${unlocked ? " is-unlocked" : ""}`}
          asChild
        >
          <UnlockableCard
            state={state}
            priceLabel={priceLabel}
            unlockedRenderer={unlockedRenderer}
            title={title}
            subtitle={subtitle}
            onClose={() => setOpen(false)}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
