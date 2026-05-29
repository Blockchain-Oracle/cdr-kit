"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, RefreshCw, ArrowUpRight, Check, Receipt } from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { ConditionBadge } from "@/components/app/condition-badge";
import { Button } from "@/components/ui/button";
import { vaultByUuid } from "@/mock/seed";
import { cn } from "@/lib/utils";

const subs = [
  { uuid: 9001, daysLeft: 12, period: 30 },
  { uuid: 9005, daysLeft: 4, period: 30 },
  { uuid: 9003, daysLeft: 26, period: 30 },
];

const history = [
  { vault: "ETH/USD oracle feed", amount: 8, when: "May 17", periods: 1 },
  { vault: "DEX liquidation alpha", amount: 12, when: "May 11", periods: 1 },
  { vault: "On-chain credit-risk scores", amount: 25, when: "May 3", periods: 1 },
];

export default function BuyerPage() {
  const [renewed, setRenewed] = useState<Record<number, boolean>>({});

  return (
    <>
      <AppHeader title="Buyer dashboard" />
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <h2 className="text-2xl font-semibold tracking-tight">Your subscriptions</h2>
        <p className="mt-1 text-sm text-muted-foreground">Active access, expiry, and one-click renew.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subs.map((s) => {
            const v = vaultByUuid(s.uuid);
            if (!v) return null;
            const pct = Math.round((s.daysLeft / s.period) * 100);
            const soon = s.daysLeft <= 5;
            return (
              <div key={s.uuid} className="flex flex-col rounded-2xl border border-border bg-card/60 p-5">
                <div className="flex items-start justify-between gap-2">
                  <ConditionBadge kind={v.condition} />
                  <span className="font-mono text-[11px] text-muted-foreground">uuid {v.uuid}</span>
                </div>
                <h3 className="mt-3 text-sm font-semibold leading-snug">{v.title}</h3>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className={cn("flex items-center gap-1.5", soon ? "text-destructive" : "text-muted-foreground")}>
                      <Clock className="h-3.5 w-3.5" />
                      Expires in {s.daysLeft}d
                    </span>
                    <span className="text-muted-foreground">{v.priceIp} IP / 30d</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full", soon ? "bg-destructive" : "bg-gradient-to-r from-primary to-signal")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant={renewed[s.uuid] ? "outline" : "default"}
                    className="flex-1 gap-1.5"
                    onClick={() => setRenewed((r) => ({ ...r, [s.uuid]: true }))}
                    disabled={renewed[s.uuid]}
                  >
                    {renewed[s.uuid] ? <Check className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    {renewed[s.uuid] ? "Renewed" : "Renew"}
                  </Button>
                  <Link href={`/vault/${v.uuid}`} className="shrink-0">
                    <Button size="sm" variant="outline" className="gap-1.5">
                      Access <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card/40 p-5">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Payment history</h3>
          </div>
          <ul className="mt-4 divide-y divide-border/50">
            {history.map((h, i) => (
              <li key={i} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-foreground">{h.vault}</span>
                <span className="flex items-center gap-6 text-muted-foreground">
                  <span className="text-xs">{h.periods}p</span>
                  <span className="font-medium tabular-nums text-foreground">{h.amount} IP</span>
                  <span className="w-14 text-right text-xs">{h.when}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
