"use client";

/**
 * Bare visual surface for the @cdr-kit/react library exports — used during design conversations to
 * judge what we actually ship today. NOT the eventual showcase; the design agent will redesign this.
 */
import { CdrInspector, CdrSkeleton, EmptyVaults, Vault, VaultGate } from "@cdr-kit/react";

function Cell({ name, source, children }: { name: string; source: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <code className="text-sm font-semibold text-foreground">{name}</code>
        <span className="font-mono text-[10px] text-muted-foreground">{source}</span>
      </div>
      <div className="rounded-lg border border-border/60 bg-background/60 p-4">{children}</div>
    </div>
  );
}

export default function LibPreviewPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold">@cdr-kit/react — current library surface (visual pass)</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Each cell renders one library export with whatever default visual it ships with. The components are
          intentionally headless; consumer-provided render-props supply the look. This page exists so the design
          conversation has a concrete starting point.
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        <Cell name="<CdrInspector />" source="components.tsx:81">
          <CdrInspector />
        </Cell>

        <Cell name="<CdrSkeleton />" source="components.tsx:65">
          <CdrSkeleton />
        </Cell>

        <Cell name="<EmptyVaults />" source="components.tsx:76">
          <EmptyVaults />
        </Cell>

        <Cell name="<EmptyVaults> with override" source="components.tsx:76">
          <EmptyVaults>No vaults match your filter.</EmptyVaults>
        </Cell>

        <Cell name="<VaultGate> · fallback slot (idle)" source="vault-gate.tsx:20">
          <VaultGate
            uuid={9001}
            auto={false}
            fallback={<div className="text-sm text-muted-foreground">[fallback render-prop output]</div>}
            loading={<CdrSkeleton lines={2} />}
          >
            {() => null}
          </VaultGate>
        </Cell>

        <Cell name="<VaultGate> · loading + ready" source="vault-gate.tsx:20">
          <VaultGate
            uuid={9001}
            auto
            loading={<CdrSkeleton lines={2} />}
            fallback={<div className="text-sm text-muted-foreground">idle</div>}
          >
            {(data) => (
              <pre className="overflow-auto font-mono text-xs">
                {new TextDecoder().decode(data).slice(0, 120)}…
              </pre>
            )}
          </VaultGate>
        </Cell>

        <Cell name="<Vault> compound · all three slots" source="components.tsx:36">
          <Vault uuid={9002} auto>
            <Vault.Locked>
              <div className="text-sm text-muted-foreground">[Vault.Locked render-prop]</div>
            </Vault.Locked>
            <Vault.Loading />
            <Vault.Unlocked>
              {(data) => (
                <pre className="overflow-auto font-mono text-xs">
                  {new TextDecoder().decode(data).slice(0, 120)}…
                </pre>
              )}
            </Vault.Unlocked>
          </Vault>
        </Cell>

        <Cell name="hooks (no visual)" source="hooks.ts, wallet.ts, use-discover-vaults.ts">
          <p className="text-sm text-muted-foreground">
            useAccessVault · useSubscribeAndAccess · useCreateVault · useDiscoverVaults · useVault · useVaultEvents ·
            useCreatorVaults · useCdrWallet — return state + callbacks; no visual surface.
          </p>
        </Cell>
      </div>
    </div>
  );
}
