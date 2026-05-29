"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Check, ArrowRight, ArrowLeft, FileText, ShieldCheck, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { addCreatedVault, type ConditionKind } from "@/mock/seed";

const STEPS = ["Data", "Condition", "IP & terms"];
const TIERS = [
  { id: "noncommercial", label: "Non-commercial" },
  { id: "commercial", label: "Commercial" },
  { id: "commercial-remix", label: "Commercial-remix" },
  { id: "enterprise", label: "Enterprise" },
];
const CONDITIONS: { id: ConditionKind; label: string; blurb: string }[] = [
  { id: "subscription", label: "Subscription", blurb: "Recurring access for a price/period" },
  { id: "tiergate", label: "Tier-gated", blurb: "Gate by Story PIL license tier" },
  { id: "composable", label: "Composable", blurb: "Combine conditions with AND/OR" },
];

function Toggle({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-1.5 text-sm transition-colors",
        active ? "border-primary/40 bg-primary/12 text-foreground" : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function CreateWizard() {
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [data, setData] = useState("");
  const [condition, setCondition] = useState<ConditionKind>("subscription");
  const [price, setPrice] = useState("8");
  const [period, setPeriod] = useState("30");
  const [mode, setMode] = useState<"native" | "royalty">("native");
  const [tiers, setTiers] = useState<string[]>(["commercial"]);
  const [composeMode, setComposeMode] = useState<"AND" | "OR">("AND");
  const [tier, setTier] = useState("commercial");
  const [created, setCreated] = useState<{ uuid: number } | null>(null);

  const bytes = new TextEncoder().encode(data).length;
  const overInline = bytes > 1024;

  function terms(): string {
    if (condition === "subscription") return `Subscribe ${price} IP / ${period} days`;
    if (condition === "tiergate")
      return `Hold a ${tiers.map((t) => TIERS.find((x) => x.id === t)?.label).join(" / ")} license`;
    return `${composeMode === "AND" ? "All" : "Any"} of: subscription, tier-gate`;
  }

  function create() {
    const v = addCreatedVault({
      title: title || "Untitled vault",
      dataType: "Custom",
      condition,
      terms: terms(),
      priceIp: condition === "subscription" ? Number(price) : null,
      subscribers: 0,
      creator: "0x1111111111111111111111111111111111111111",
      creatorName: "you.eth",
      description: "Created in the cdr-kit dashboard (mock mode).",
      sample: data || '{"hello":"world","createdBy":"you.eth"}',
    });
    setCreated({ uuid: v.uuid });
  }

  if (created) {
    return (
      <div className="mx-auto w-full max-w-lg px-6 py-16 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-signal/15 text-signal">
          <PartyPopper className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight">Vault created</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          One <span className="font-mono text-foreground">createVault</span> tx — minted the NFT, registered the IP,
          allocated the vault, and configured the condition atomically.
        </p>
        <div className="mt-6 rounded-xl border border-border bg-card/60 p-4 text-left font-mono text-xs">
          <Row k="uuid" v={String(created.uuid)} />
          <Row k="tx" v="0xab…cd (mock)" />
          <Row k="condition" v={condition} />
          <Row k="terms" v={terms()} />
        </div>
        <div className="mt-6 flex justify-center gap-3">
          <Link href={`/vault/${created.uuid}`}>
            <Button className="gap-2">
              Open vault <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/marketplace">
            <Button variant="outline">View in marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-8">
      {/* step indicator */}
      <ol className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                i < step
                  ? "border-signal/40 bg-signal/15 text-signal"
                  : i === step
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border text-muted-foreground",
              )}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={cn("text-sm", i === step ? "text-foreground" : "text-muted-foreground")}>{s}</span>
            {i < STEPS.length - 1 && <span className="ml-1 h-px flex-1 bg-border" />}
          </li>
        ))}
      </ol>

      <div className="mt-8 rounded-2xl border border-border bg-card/50 p-6">
        {step === 0 && (
          <div className="space-y-5">
            <Field label="Title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="ETH/USD oracle feed" />
            </Field>
            <Field
              label="Data"
              hint={
                overInline
                  ? `${bytes} bytes — over the 1KB inline cap, so this routes to IPFS with the key secured by CDR.`
                  : `${bytes} / 1024 bytes — fits inline (stored on-chain, threshold-encrypted).`
              }
            >
              <Textarea
                value={data}
                onChange={(e) => setData(e.target.value)}
                placeholder='{"pair":"ETH/USD","mark":3412.88}'
                className="min-h-32 font-mono text-xs"
              />
            </Field>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-4 w-4" />
              Paste text/JSON or a key. Files &gt; 1KB auto-route to IPFS.
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <Field label="Condition type">
              <div className="grid gap-2 sm:grid-cols-3">
                {CONDITIONS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCondition(c.id)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-colors",
                      condition === c.id ? "border-primary/40 bg-primary/10" : "border-border hover:border-border/80",
                    )}
                  >
                    <p className="text-sm font-medium">{c.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{c.blurb}</p>
                  </button>
                ))}
              </div>
            </Field>

            {condition === "subscription" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Price per period (IP)">
                  <Input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" />
                </Field>
                <Field label="Period (days)">
                  <Input value={period} onChange={(e) => setPeriod(e.target.value)} inputMode="numeric" />
                </Field>
                <Field label="Payment mode">
                  <div className="flex gap-2">
                    <Toggle active={mode === "native"} onClick={() => setMode("native")}>
                      Native IP
                    </Toggle>
                    <Toggle active={mode === "royalty"} onClick={() => setMode("royalty")}>
                      WIP royalty
                    </Toggle>
                  </div>
                </Field>
              </div>
            )}

            {condition === "tiergate" && (
              <Field label="Allowed PIL tiers">
                <div className="flex flex-wrap gap-2">
                  {TIERS.map((t) => (
                    <Toggle
                      key={t.id}
                      active={tiers.includes(t.id)}
                      onClick={() =>
                        setTiers((cur) => (cur.includes(t.id) ? cur.filter((x) => x !== t.id) : [...cur, t.id]))
                      }
                    >
                      {t.label}
                    </Toggle>
                  ))}
                </div>
              </Field>
            )}

            {condition === "composable" && (
              <Field label="Combine with" hint="Composes the other conditions; children are configured per-uuid by the factory.">
                <div className="flex gap-2">
                  <Toggle active={composeMode === "AND"} onClick={() => setComposeMode("AND")}>
                    AND (all)
                  </Toggle>
                  <Toggle active={composeMode === "OR"} onClick={() => setComposeMode("OR")}>
                    OR (any)
                  </Toggle>
                </div>
              </Field>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <Field label="PIL license tier">
              <div className="flex flex-wrap gap-2">
                {TIERS.map((t) => (
                  <Toggle key={t.id} active={tier === t.id} onClick={() => setTier(t.id)}>
                    {t.label}
                  </Toggle>
                ))}
              </div>
            </Field>
            <div className="rounded-xl border border-border bg-background/40 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Allocate fee (msg.value)</span>
                <span className="font-mono">0 IP</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-muted-foreground">Access condition</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="h-4 w-4 text-signal" />
                  {terms()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        {step < 2 ? (
          <Button onClick={() => setStep((s) => Math.min(2, s + 1))} className="gap-2">
            Next <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={create} className="gap-2">
            Create vault <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-1.5 last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-foreground">{v}</span>
    </div>
  );
}
