# React SDK Packaging (@cdr-kit/react)

Mirror how wagmi v2 / RainbowKit publish.

## Peer dependencies — never bundle these
`react`, `wagmi`, `viem`, `@tanstack/react-query` as **`peerDependencies`** (bundling → duplicate-React / duplicate-wagmi-context bugs).
```jsonc
{ "name":"@cdr-kit/react",
  "peerDependencies": { "react":">=18","wagmi":">=2","viem":">=2","@tanstack/react-query":">=5" },
  "peerDependenciesMeta": { "react": { "optional": false } } }
```
Pure address/encoding/condition-encoder helpers live in `@cdr-kit/core` (server-safe, no React) so they never drag in `"use client"`.

## "use client" preservation — the gotcha
Bundlers strip top-of-file directives by default. Two options:
- **Preserve per-module** (wagmi/RainbowKit style): emit unbundled output so each client file keeps its own `"use client"`. tsdown has an `unbundle` mode — ⚠️ confirm exact flag name at scaffold time (fast-moving).
- **Banner injection** (simpler, single client entry):
```ts
// packages/react/tsdown.config.ts
export default defineConfig({
  entry:['src/index.ts'], format:['esm','cjs'], dts:true,
  external:['react','wagmi','viem','@tanstack/react-query'],
  outputOptions:{ banner: "'use client'" },
})
```
- Keep wagmi `createConfig` in a NON-`"use client"` file (runs server+client). Put `"use client"` only on `<CdrProvider>` (wraps `WagmiProvider` + `QueryClientProvider`).

## Proposed surface (shape it in the spec)
- `<CdrProvider config={...}>` — wires wagmi + query client + `initWasm()` + CDR `apiUrl`/network. (Handle the WASM init + the ~7-min read latency with a loading/polling state baked into hooks.)
- `<VaultGate vaultId condition>{children}</VaultGate>` — renders children only when the connected wallet satisfies the read condition; otherwise shows a pay/subscribe/connect CTA.
- Hooks: `useVault(uuid)`, `useCreateVault()`, `useSubscription(uuid)`, `useAccessVault(uuid)` (returns `{ data, status: 'idle'|'paying'|'collecting-partials'|'ready', progress }` — must surface the multi-minute read), `useCreatorVaults(addr)`, `useAuditLog(uuid)`.
- Re-export/wrap the `@wagmi/cli`-generated `useRead*/useWrite*` condition hooks from `@cdr-kit/contracts`.

## Dashboard (apps/dashboard)
- Next.js (App Router). Privy or RainbowKit for wallet (cdr-demo uses Privy). Tailwind.
- Server-safe primitives from `@cdr-kit/core`; client components use `@cdr-kit/react`.
- Must visibly handle: WASM init, ~7-min read polling, ~1KB inline vs file path, allocate fee (`msg.value`), the 2-step pay→access flow.

## Versioning/publish
Changesets; `release` script; npm OIDC (see `monorepo-build-ci.md`). `publint` + `attw` gate in CI for every published package.
