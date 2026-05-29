"use client";

import { useState } from "react";
import { AppHeader } from "@/components/app/app-header";
import { VaultCard } from "@/components/app/vault-card";
import { type ConditionKind } from "@/mock/seed";
import { useVaults } from "@/lib/use-vaults";
import { cn } from "@/lib/utils";

const FILTERS: { label: string; value: ConditionKind | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Subscription", value: "subscription" },
  { label: "Tier-gated", value: "tiergate" },
  { label: "Composable", value: "composable" },
];

export default function MarketplacePage() {
  const [filter, setFilter] = useState<ConditionKind | "all">("all");
  const { vaults: allVaults, isLoading, isLive } = useVaults();
  const vaults = filter === "all" ? allVaults : allVaults.filter((v) => v.condition === filter);

  return (
    <>
      <AppHeader title="Marketplace" />
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Browse vaults</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Private, paid, license-gated data on Story CDR — {allVaults.length} {isLive ? "on-chain" : "live"} vaults
              {isLive ? " on Aeneid" : ""}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  filter === f.value
                    ? "border-primary/30 bg-primary/12 text-foreground"
                    : "border-border text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {isLive && isLoading && vaults.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">Scanning the factory for vaults on Aeneid…</p>
        ) : vaults.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">No vaults match this filter.</p>
        ) : (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {vaults.map((v) => (
              <VaultCard key={v.uuid} v={v} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
