"use client";

import Link from "next/link";
import { Boxes, Users, Coins, Receipt } from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { ConditionBadge } from "@/components/app/condition-badge";
import { seedVaults } from "@/mock/seed";

const revenueOf = (v: (typeof seedVaults)[number]) => (v.priceIp ?? 0) * v.subscribers;

const events = [
  { addr: "0x9f2a…c41b", action: "subscribe", vault: "ETH/USD oracle feed", periods: 3, amount: 24, when: "2m ago" },
  { addr: "0x3e88…77de", action: "subscribe", vault: "DEX liquidation alpha", periods: 1, amount: 12, when: "14m ago" },
  { addr: "0xbb10…0a1e", action: "renew", vault: "On-chain credit-risk scores", periods: 1, amount: 25, when: "1h ago" },
  { addr: "0x4c9b…c34b", action: "subscribe", vault: "DEX liquidation alpha", periods: 6, amount: 72, when: "3h ago" },
  { addr: "0x7c6b…ff34", action: "subscribe", vault: "ETH/USD oracle feed", periods: 1, amount: 8, when: "5h ago" },
];

function Stat({ icon: Icon, label, value }: { icon: typeof Boxes; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export default function SellerPage() {
  const totalSubs = seedVaults.reduce((a, v) => a + v.subscribers, 0);
  const totalRevenue = seedVaults.reduce((a, v) => a + revenueOf(v), 0);

  return (
    <>
      <AppHeader title="Seller dashboard" />
      <div className="mx-auto w-full max-w-6xl px-6 py-8">
        <h2 className="text-2xl font-semibold tracking-tight">Your vaults</h2>
        <p className="mt-1 text-sm text-muted-foreground">Revenue, subscribers, and the payment event log.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat icon={Boxes} label="Vaults" value={String(seedVaults.length)} />
          <Stat icon={Users} label="Total subscribers" value={totalSubs.toLocaleString()} />
          <Stat icon={Coins} label="Est. revenue" value={`${totalRevenue.toLocaleString()} IP`} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          {/* vaults table */}
          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-border bg-card/60 px-4 py-2.5 text-xs text-muted-foreground">
              <span>Vault</span>
              <span className="text-right">Subs</span>
              <span className="text-right">Revenue</span>
            </div>
            {seedVaults.map((v) => (
              <Link
                key={v.uuid}
                href={`/vault/${v.uuid}`}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-border/50 px-4 py-3 text-sm transition-colors last:border-0 hover:bg-accent/40"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{v.title}</span>
                  <ConditionBadge kind={v.condition} className="mt-1" />
                </span>
                <span className="text-right tabular-nums">{v.subscribers}</span>
                <span className="text-right font-medium tabular-nums">
                  {v.priceIp != null ? `${revenueOf(v).toLocaleString()} IP` : "—"}
                </span>
              </Link>
            ))}
          </div>

          {/* event log */}
          <div className="rounded-2xl border border-border bg-card/40 p-5">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Payments &amp; subscriptions</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              From <span className="font-mono">subscribe()</span> events — not a who-decrypted log (CDR can&apos;t
              provide one).
            </p>
            <ul className="mt-4 space-y-3">
              {events.map((e, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-signal" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate">
                      <span className="font-mono text-xs text-muted-foreground">{e.addr}</span>{" "}
                      <span className="text-foreground">{e.action}</span> · {e.periods}p
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{e.vault}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-medium tabular-nums">{e.amount} IP</p>
                    <p className="text-xs text-muted-foreground">{e.when}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
