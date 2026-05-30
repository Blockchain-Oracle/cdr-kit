import type { ReactNode } from "react";

export type ConditionKind = "subscription" | "tiergate" | "composable" | "open";

const LABELS: Record<ConditionKind, string> = {
  subscription: "Subscription",
  tiergate: "Tier-gated",
  composable: "Composable",
  open: "Open",
};

export interface ConditionBadgeProps {
  kind: ConditionKind;
  children?: ReactNode;
}

/** Color-mapped pill for a vault's read condition. */
export function ConditionBadge({ kind, children }: ConditionBadgeProps) {
  return (
    <span className={`cdr-ui-badge cdr-ui-badge--${kind}`}>
      <span className="d" />
      {children ?? LABELS[kind]}
    </span>
  );
}
