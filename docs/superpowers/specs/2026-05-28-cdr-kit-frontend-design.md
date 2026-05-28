# cdr-kit Frontend — Design Spec

**Date:** 2026-05-28 · **Status:** Approved (Abu) · **Decision:** D19 in `context/decisions/decision-log.md`

The flagship visual layer for cdr-kit: a single Next.js product app (`apps/web`) whose home is a premium marketing landing and whose app routes are the data-marketplace dashboard, plus a separate Fumadocs docs site (`apps/docs`, sub-project #3). Built **on** `@cdr-kit/react` (dogfooding), to a "best of the best / no slop" bar.

## Goals
1. Make the kit *visible* — the Application-track money shot: create → subscribe (2nd wallet) → access round-trip, with the `paying → collecting-partials → ready` flow shown honestly.
2. Exercise `@cdr-kit/react` + `@cdr-kit/core` in anger and surface/fix rough edges (three library improvements below).
3. Premium, distinctive UI (premium-ui skill + visual loop), browser-verified — never claimed from `tsc`.
4. Be demoable with zero on-chain dependency (mock-first), and flip to live Aeneid when configured.

## Non-goals
- No confidential-compute / who-decrypted claims (D11 — CDR can't).
- No mainnet (Aeneid testnet only).
- Not premium-ifying the `@cdr-kit/react` **library** (stays headless; premium lives in the app).
- secrets-vault template = Phase 2. MVP template = data-marketplace.

## Architecture

### Two surfaces
```
apps/web/                       # ONE Next.js App Router app, deploys as the product
  app/
    (marketing)/page.tsx        # /            → premium landing (THE HOME, non-negotiable)
    (app)/
      marketplace/page.tsx      # /marketplace → browse grid + filters
      vault/[uuid]/page.tsx     # /vault/:uuid → detail + access stepper
      create/page.tsx           # /create      → 3-step vault wizard
      seller/page.tsx           # /seller      → vault list, revenue, event log (D11)
      buyer/page.tsx            # /buyer       → active subs, expiry, renew, re-access
    layout.tsx                  # providers: Privy → Wagmi → Query → CdrProvider
  src/{components,mock,lib,styles}/
apps/docs/                      # Fumadocs (own landing + guides) — sub-project #3
```
Route groups `(marketing)` and `(app)` give the landing its own chrome (nav/footer/CTA) and the app its own (wallet header/sidebar), sharing one design system + one Vercel deploy.

### Provider stack (`apps/web/app/layout.tsx`)
`PrivyProvider → WagmiProvider → QueryClientProvider → CdrProvider`.
- **Privy** is the wallet (embedded + email/social). If `NEXT_PUBLIC_PRIVY_APP_ID` is unset → a **mock connect button** so the UI never blocks on Privy setup.
- **CdrProvider** runs in **mock mode** (`createMockCdrKit`) unless `NEXT_PUBLIC_CDR_API_URL` + a connected wallet are present → then live Aeneid.

### Data abstraction (`src/lib/use-cdr-data.ts`)
One hook layer so screens never branch on mock-vs-live: discovery, vault metadata, access, subscribe, create — each resolves to the mock kit or the live `@cdr-kit/react` hooks. Mock seed (~6 data-marketplace vaults: price feeds, dataset samples, research PDFs, model weights) lives in `src/mock/`.

## Screens (from `docs/ux-spec.md`, IA corrected: `/` = landing)

| Route | Screen | Core content |
|---|---|---|
| `/` | **Landing** | Premium hero ("the Stripe for CDR"), feature bento, code sample, package grid, agent-demo highlight, CTAs → `/marketplace` + docs. Built last (reuses the design system). |
| `/marketplace` | **Browse** | Vault-card grid (title, data type, condition badge, price, #subs, creator) + filters (condition/price/type). Mock seed in mock mode; **historical `getLogs` discovery** in live mode. |
| `/vault/[uuid]` | **Detail** | Metadata + condition in plain language + the **access stepper** (`Paying ▸ Waiting for validators ▸ Decrypting ▸ Done`) with progress; result renders (text/JSON) or downloads (file). The critical component. |
| `/create` | **Create** | 3-step wizard: data (auto 1KB-inline-vs-file note) → condition (dynamic form: Subscription→price+period+mode / TierGate→allowed tiers / Composable→combine) → IP/PIL terms + allocate fee → submit → vault id + shareable link. |
| `/seller` | **Seller** | Vault list w/ subscriber count, revenue, condition + **payment/subscription event log** (D11 — not who-decrypted). |
| `/buyer` | **Buyer** | Active subs w/ expiry countdown, one-click renew, re-access, payment history. |

## Library improvements (in-scope, driven by real dashboard needs)
Kept light; no heavy deps added to the library.
- **(a) Opt-in default stylesheet** — `@cdr-kit/react/styles.css`: tasteful defaults for the headless components via the existing `--cdr-*` CSS vars, so consumers get a decent look without weight or lock-in.
- **(b) Historical discovery hook** — `useDiscoverVaults` (bounded, paginated `getLogs` over `VaultCreated`, per D11). `useVaultEvents` stays as the live/watch feed; Browse needs *history*.
- **(c) `onProgress` through `@cdr-kit/core`'s `accessVault`** — so the live access stepper is determinate (partial-collection counts), not just indeterminate. `useAccessVault` forwards it. (Approved by Abu — "we could add that now".)

## Error & latency UX (D17)
Every read path uses the discriminated status union + skeletons/determinate progress, never a bare spinner. Surface human messages for: WASM-not-initialized, condition-not-satisfied, partial-collection-timeout, payload-too-large, wrong-network — via the typed `CdrError` taxonomy.

## Testing & verification
- **Mock-mode** makes all screens unit/visually testable with no chain.
- **Visual loop (day-0):** layout research/mining first, then screenshot → anchor-diff → fresh-context vision review on every iteration. A vision/anti-slop pass gates "done."
- **Live e2e** (when a funded Aeneid key is available): create (1st wallet) → subscribe + access (2nd wallet) round-trip with visible stepper.
- ≤400 lines/file holds (split screens/components); `consola` for any app-side logging, never `console.log`.

## Build sequence
1. Scaffold `apps/web` (workspace + Turborepo wiring), provider stack, design tokens, visual loop.
2. Library improvements (a)/(b)/(c) inline where the app first needs them.
3. App core: marketplace → vault detail + stepper → create → seller → buyer (mock-first, live-toggle).
4. Landing `/` (premium showcase reusing the design system).
5. `apps/docs` (Fumadocs) — separate brainstorm.

## Open sub-decisions (resolved as I build unless flagged)
- Mock seed theme = data-marketplace (fits the MVP template).
- Dark-mode-first with a light toggle (premium aesthetic + matches mem0).
- Privy app: created later; mock connect button until then.
