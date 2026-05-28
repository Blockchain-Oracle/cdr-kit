import Link from "next/link";
import { ConditionBadge } from "./condition-badge";
import type { SeedVault } from "@/mock/seed";

export function VaultCard({ v }: { v: SeedVault }) {
  return (
    <Link
      href={`/vault/${v.uuid}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card/60 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card"
    >
      {/* hover corner glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(360px circle at 85% 0%, color-mix(in srgb, var(--primary) 14%, transparent), transparent 60%)",
        }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <ConditionBadge kind={v.condition} />
        <span className="font-mono text-[11px] text-muted-foreground">uuid {v.uuid}</span>
      </div>

      <h3 className="relative mt-4 text-base font-semibold leading-snug tracking-tight">{v.title}</h3>
      <p className="relative mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{v.description}</p>

      <div className="relative mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-md bg-muted px-2 py-0.5 text-foreground/80">{v.dataType}</span>
        <span className="text-muted-foreground/60">·</span>
        <span>{v.subscribers} subscribers</span>
      </div>

      <div className="relative mt-5 flex items-center justify-between border-t border-border/60 pt-4">
        <div className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-full bg-gradient-to-br from-primary/50 to-signal/40 ring-1 ring-border" />
          <span className="text-xs text-muted-foreground">{v.creatorName}</span>
        </div>
        <div className="text-sm font-medium">
          {v.priceIp != null ? (
            <>
              {v.priceIp} IP<span className="text-xs font-normal text-muted-foreground"> / 30d</span>
            </>
          ) : (
            <span className="text-muted-foreground">License-gated</span>
          )}
        </div>
      </div>
    </Link>
  );
}
