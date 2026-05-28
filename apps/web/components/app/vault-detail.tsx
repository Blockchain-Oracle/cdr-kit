"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, ShieldCheck, Download } from "lucide-react";
import { useAccessVault } from "@cdr-kit/react";
import { Button } from "@/components/ui/button";
import { ConditionBadge } from "./condition-badge";
import { AccessStepper, type AccessPhase } from "./access-stepper";
import { vaultByUuid } from "@/mock/seed";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}

export function VaultDetail({ uuid }: { uuid: number }) {
  const v = vaultByUuid(uuid);
  const { access, status, data, error, progress } = useAccessVault(uuid);
  const [paying, setPaying] = useState(false);

  if (!v) return <div className="p-10 text-muted-foreground">Vault {uuid} not found.</div>;

  const withPay = v.condition === "subscription";
  const phase: AccessPhase = paying ? "paying" : (status as AccessPhase);

  async function run() {
    if (withPay) {
      setPaying(true);
      await sleep(900);
      setPaying(false);
    }
    await access().catch(() => undefined);
  }

  const decoded = data ? new TextDecoder().decode(data) : null;
  const pretty = decoded
    ? (() => {
        try {
          return JSON.stringify(JSON.parse(decoded), null, 2);
        } catch {
          return decoded;
        }
      })()
    : null;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Marketplace
      </Link>

      <div className="mt-5 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        {/* metadata */}
        <div>
          <div className="flex items-center gap-3">
            <ConditionBadge kind={v.condition} />
            <span className="font-mono text-xs text-muted-foreground">uuid {v.uuid}</span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">{v.title}</h1>
          <p className="mt-3 leading-relaxed text-muted-foreground">{v.description}</p>

          <div className="mt-6 rounded-xl border border-border bg-card/50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Access condition</p>
            <p className="mt-1.5 flex items-center gap-2 text-sm">
              <Lock className="h-4 w-4 text-primary" />
              {v.terms}
            </p>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <Meta label="Data type" value={v.dataType} />
            <Meta label="Subscribers" value={String(v.subscribers)} />
            <Meta label="Creator" value={v.creatorName} />
            <Meta label="Price" value={v.priceIp != null ? `${v.priceIp} IP / 30d` : "License-gated"} />
          </dl>
        </div>

        {/* access panel */}
        <div className="h-fit rounded-2xl border border-border bg-card/60 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Access data</h2>
            <span className="font-mono text-[11px] text-muted-foreground">mock · ~2.6s</span>
          </div>

          {phase === "idle" && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                {withPay
                  ? `Subscribe for ${v.priceIp} IP to unlock a 30-day decryption window.`
                  : "You hold the required license — decrypt the latest payload."}
              </p>
              <Button className="mt-4 w-full gap-2" onClick={run}>
                {withPay ? "Subscribe & access" : "Access data"}
              </Button>
            </div>
          )}

          {(phase === "paying" || phase === "collecting-partials" || phase === "error") && (
            <div className="mt-5">
              <AccessStepper phase={phase} progress={progress} withPay={withPay} />
              {phase === "error" && (
                <p className="mt-3 text-sm text-destructive">{error?.message ?? "Access failed."}</p>
              )}
            </div>
          )}

          {phase === "ready" && pretty && (
            <div className="mt-5">
              <div className="flex items-center gap-2 text-sm font-medium text-signal">
                <ShieldCheck className="h-4 w-4" />
                Decrypted
              </div>
              <pre className="mt-3 max-h-64 overflow-auto rounded-lg border border-border bg-background/60 p-3 font-mono text-xs leading-relaxed text-foreground/90">
                {pretty}
              </pre>
              <Button variant="outline" className="mt-3 w-full gap-2">
                <Download className="h-4 w-4" />
                Download payload
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
