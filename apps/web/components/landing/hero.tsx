"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeBlock, CodeBlockCode, CodeBlockGroup } from "@/components/ui/code-block";
import { AuroraBackground } from "@/components/ui/aurora-background";

const SAMPLE = `import { CdrProvider, VaultGate } from "@cdr-kit/react";

export function PremiumData({ vaultId }: { vaultId: number }) {
  return (
    <CdrProvider apiUrl={process.env.NEXT_PUBLIC_CDR_API_URL}>
      <VaultGate uuid={vaultId} fallback={<Subscribe />} loading={<Stepper />}>
        {(data) => <Chart bytes={data} />}
      </VaultGate>
    </CdrProvider>
  );
}`;

const ease = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  return (
    <AuroraBackground className="!h-auto min-h-[90vh] !items-stretch !justify-start">
      <div className="mx-auto w-full max-w-6xl px-6 pb-24 pt-20 lg:pt-28">
        <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
          {/* left — copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
              </span>
              Live on Story Aeneid · 5 condition contracts deployed
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease, delay: 0.05 }}
              className="mt-6 text-balance text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl"
            >
              Confidential data,
              <br />
              made{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "linear-gradient(110deg, var(--primary), var(--signal))" }}
              >
                programmable.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease, delay: 0.12 }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground"
            >
              The wagmi/Stripe layer for Story Protocol&apos;s Confidential Data Rails. Ship private, paid,
              license-gated data with audited condition contracts, a typed SDK, a React layer, and an
              autonomous agent kit — without hand-rolling the protocol.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease, delay: 0.19 }}
              className="mt-9 flex flex-wrap items-center gap-3"
            >
              <Button
                size="lg"
                className="group gap-2 shadow-[0_8px_36px_-12px_color-mix(in_srgb,var(--primary)_70%,transparent)]"
              >
                Browse the marketplace
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button size="lg" variant="outline" className="gap-2 border-border bg-card/40 backdrop-blur">
                Read the docs
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="mt-10 flex items-center gap-6 text-sm text-muted-foreground"
            >
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-signal" /> Threshold-encrypted
              </span>
              <span className="font-mono text-xs">npm i @cdr-kit/react</span>
            </motion.div>
          </div>

          {/* right — live SDK sample in editor chrome */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease, delay: 0.18 }}
            className="relative"
          >
            <div
              className="absolute -inset-px -z-10 rounded-2xl opacity-60 blur-xl"
              style={{ background: "linear-gradient(140deg, color-mix(in srgb, var(--primary) 35%, transparent), transparent 60%)" }}
            />
            <CodeBlock className="overflow-hidden border-border/80 bg-card/80 shadow-2xl backdrop-blur">
              <CodeBlockGroup className="border-b border-border/70 px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                </div>
                <span className="font-mono text-xs text-muted-foreground">PremiumData.tsx</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-signal">gated</span>
              </CodeBlockGroup>
              <CodeBlockCode code={SAMPLE} language="tsx" theme="vesper" />
            </CodeBlock>
          </motion.div>
        </div>
      </div>
    </AuroraBackground>
  );
}
