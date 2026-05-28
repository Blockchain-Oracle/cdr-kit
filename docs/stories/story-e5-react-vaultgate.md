# Story E5 — @cdr-kit/react (CdrProvider, VaultGate, hooks)

**As** a developer, **I want** to gate private CDR data in my React app with a provider + a `<VaultGate>` component + hooks **so that** I add confidential, paid, license-gated data in < 20 lines without touching the SDK plumbing, WASM lifecycle, or the ~7-min read latency. This package IS the DX product.

Packaging rules (peer deps, `"use client"`): `../../context/best-practices/react-sdk-packaging.md`.

## Design
```tsx
<CdrProvider config={{ network:'testnet', apiUrl, wagmiConfig }}>   // wires wagmi + react-query + initWasm()
  ...
  <VaultGate uuid={uuid} accessAuxData={aux} fallback={<SubscribeCTA uuid={uuid} />}>
    {(data) => <Render data={data} />}        {/* render-prop child; renders only when entitled + decrypted */}
  </VaultGate>
  {/* `fallback` is a PROP, not a child (shown when not entitled) */}
</CdrProvider>

// hooks
useVault(uuid)            // metadata + condition info + creator
useCreateVault()          // wraps CdrKitVault.createVault (reads allocateFee for msg.value)
useSubscription(uuid)     // status + subscribe/renew (2-step) + expiry countdown
useAccessVault(uuid)      // { data, status:'idle'|'paying'|'collecting-partials'|'ready'|'error', progress, error }
useCreatorVaults(addr)    // from VaultCreated events (paginated)
usePaymentLog(uuid)       // subscription/payment events (NOT a who-decrypted log — D11)
```

## Acceptance criteria (BDD)

**Scenario: <20-line integration**
- **Given** a fresh Next.js app with wagmi configured
- **When** a dev wraps the tree in `<CdrProvider>` and drops a `<VaultGate uuid>` with a fallback
- **Then** gated data renders for an entitled wallet and the fallback CTA renders otherwise — in under 20 lines of app code.

**Scenario: latency is visible, never a dead spinner**
- **Given** an access in progress (~7 min)
- **When** `useAccessVault` runs
- **Then** `status` transitions `paying → collecting-partials (with progress) → ready`, the UI stays interactive, and a timeout surfaces a typed retryable error — never an indefinite blank spinner.

**Scenario: WASM handled by the provider**
- **Given** the app mounts
- **When** `<CdrProvider>` initializes
- **Then** `initWasm()` runs once; any encrypt/decrypt before init shows a clear "secure module initializing" state, never an opaque WASM error.

**Scenario: not entitled → CTA, not crash**
- **Given** a wallet that doesn't satisfy the condition
- **When** `<VaultGate>` evaluates
- **Then** it renders `fallback` (subscribe/mint/connect), driven by a typed `ConditionNotSatisfiedError`, not an exception.

**Scenario: SSR safe**
- **Given** Next.js App Router
- **When** the package is imported
- **Then** server-safe primitives (from `@cdr-kit/core`) don't drag `"use client"`; only the provider/components are client; no hydration errors.

## Constraints
`react`, `wagmi`, `viem`, `@tanstack/react-query` as peer deps. `"use client"` preserved (tsdown banner/unbundle). Re-export generated condition hooks from `@cdr-kit/contracts`. Vitest + Testing Library (mock viem transport). ≤400 lines/file. `publint`+`attw` in CI.
