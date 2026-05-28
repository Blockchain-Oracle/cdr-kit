"use client";

import { motion } from "framer-motion";
import { Check, CreditCard, Boxes, KeyRound, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type AccessPhase = "idle" | "paying" | "collecting-partials" | "ready" | "error";

type StepDef = { key: string; label: string; sub: string; icon: typeof Boxes };

function buildSteps(withPay: boolean): StepDef[] {
  return [
    ...(withPay ? [{ key: "pay", label: "Subscribe & pay", sub: "On-chain subscription tx", icon: CreditCard }] : []),
    { key: "collect", label: "Collect validator partials", sub: "Threshold decryption (~7 min on Aeneid)", icon: Boxes },
    { key: "decrypt", label: "Decrypt", sub: "Recover the data key locally", icon: KeyRound },
  ];
}

function stageIndex(phase: AccessPhase, withPay: boolean, atThreshold: boolean): number {
  const collect = withPay ? 1 : 0;
  switch (phase) {
    case "idle":
      return -1;
    case "paying":
      return 0;
    case "collecting-partials":
      return atThreshold ? collect + 1 : collect;
    case "ready":
      return withPay ? 3 : 2;
    case "error":
      return collect;
  }
}

export function AccessStepper({
  phase,
  progress,
  withPay,
}: {
  phase: AccessPhase;
  progress?: { collected: number; threshold: number };
  withPay: boolean;
}) {
  const steps = buildSteps(withPay);
  const atThreshold = !!progress && progress.collected >= progress.threshold;
  const stage = stageIndex(phase, withPay, atThreshold);

  return (
    <ol className="relative space-y-1">
      {steps.map((s, i) => {
        const done = i < stage;
        const active = i === stage && phase !== "ready";
        const errored = phase === "error" && active;
        const isCollect = s.key === "collect";
        const Icon = s.icon;
        return (
          <li key={s.key} className="relative flex gap-3 pb-4 last:pb-0">
            {/* connector */}
            {i < steps.length - 1 && (
              <span
                className={cn(
                  "absolute left-[15px] top-9 h-[calc(100%-1.5rem)] w-px",
                  done ? "bg-signal/40" : "bg-border",
                )}
              />
            )}
            {/* node */}
            <span
              className={cn(
                "relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                errored
                  ? "border-destructive/40 bg-destructive/15 text-destructive"
                  : done
                    ? "border-signal/40 bg-signal/15 text-signal"
                    : active
                      ? "border-primary/50 bg-primary/15 text-primary"
                      : "border-border bg-card text-muted-foreground",
              )}
            >
              {active && !errored && (
                <motion.span
                  className="absolute inset-0 rounded-full ring-2 ring-primary/40"
                  animate={{ opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                />
              )}
              {done ? <Check className="h-4 w-4" /> : errored ? <AlertCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </span>

            <div className="min-w-0 flex-1 pt-1">
              <p className={cn("text-sm font-medium", done || active ? "text-foreground" : "text-muted-foreground")}>
                {s.label}
              </p>
              <p className="text-xs text-muted-foreground">{s.sub}</p>

              {/* determinate validator-collection bar */}
              {isCollect && active && progress && (
                <div className="mt-2.5">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: progress.threshold }).map((_, k) => (
                      <motion.span
                        key={k}
                        initial={{ opacity: 0.25, scaleY: 0.6 }}
                        animate={k < progress.collected ? { opacity: 1, scaleY: 1 } : { opacity: 0.25, scaleY: 0.6 }}
                        className={cn(
                          "h-5 flex-1 rounded-[3px]",
                          k < progress.collected ? "bg-gradient-to-t from-primary to-signal" : "bg-muted",
                        )}
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
                    {progress.collected} / {progress.threshold} partials collected
                  </p>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
