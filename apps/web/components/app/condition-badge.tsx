import { cn } from "@/lib/utils";
import type { ConditionKind } from "@/mock/seed";

const MAP: Record<ConditionKind, { label: string; cls: string }> = {
  subscription: { label: "Subscription", cls: "text-primary bg-primary/12 border-primary/25" },
  tiergate: { label: "Tier-gated", cls: "text-amber-300 bg-amber-400/12 border-amber-400/25" },
  composable: { label: "Composable", cls: "text-signal bg-signal/12 border-signal/25" },
};

export function ConditionBadge({ kind, className }: { kind: ConditionKind; className?: string }) {
  const c = MAP[kind];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        c.cls,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {c.label}
    </span>
  );
}
