import Link from "next/link";
import { GlowCard } from "@/components/ui/spotlight-card";
import { ConditionBadge } from "./condition-badge";
import type { SeedVault } from "@/mock/seed";

export function VaultCard({ v }: { v: SeedVault }) {
  return (
    <Link href={`/vault/${v.uuid}`} className="group block">
      <GlowCard customSize glowColor="blue" className="flex h-full w-full flex-col rounded-2xl !bg-card/70 p-5">
        <div className="flex items-start justify-between gap-3">
          <ConditionBadge kind={v.condition} />
          <span className="font-mono text-[11px] text-muted-foreground">uuid {v.uuid}</span>
        </div>

        <h3 className="mt-4 text-base font-semibold leading-snug tracking-tight">{v.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{v.description}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-md bg-muted px-2 py-0.5 text-foreground/80">{v.dataType}</span>
          <span className="text-muted-foreground/60">·</span>
          <span>{v.subscribers} subscribers</span>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-4">
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
      </GlowCard>
    </Link>
  );
}
