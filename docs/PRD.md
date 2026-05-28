# cdr-kit — Product Requirements

> Background, ground truth, and the honest wedge live in `../context/`. This PRD = scope + requirements.

## Problem
Story Protocol's Confidential Data Rails (CDR) is powerful but raw: a ~6-week-old SDK, only two officially-deployed condition contracts, a stale docs interface, ~7-min read latency, and no higher-level tooling. Building anything real means hand-writing Solidity conditions against an interface the docs get wrong, hand-rolling the 2-step pay→access flow, and wiring Story IP/licensing/royalty yourself. There is no installable library, no React layer, no agent SDK, no dashboard.

## What we're building
**cdr-kit** — the developer toolkit for CDR (the wagmi/Clerk/Stripe layer). An audited, typed, tested **standard library of condition contracts** + **React layer** + **agent SDK** + a **vault-management dashboard**, with marketplace and secrets-vault templates.

## The wedge (stated honestly — decision D2)
NOT "first to build CDR conditions": `piplabs/cdr-demo` already ships ~9 condition contracts + a vault NFT. cdr-kit's value is **productization + extension**: turn scattered, mostly-untested, app-internal demo contracts into a standard, installable, tested, typed library with React/agent/dashboard DX — and add the advanced conditions that don't exist anywhere (recurring Subscription, TierGate, Revocable, MultiSig, Composable). The framing to lead with: *"we did the productization so the CDR ecosystem grows."* (See `../context/research/existing-vs-missing.md`.)

## Users
- **Data/IP owner (seller):** wants to monetize private data without running billing infra; wants license-tiered, revocable, royalty-bearing access. Lists a vault, picks a condition, sets terms.
- **Developer (integrator):** wants to add gated private data to their app in minutes — `npm i @cdr-kit/react`, drop `<VaultGate>`.
- **AI agent (autonomous consumer):** discovers a vault, pays from its own wallet, pulls data, uses it — no human in the loop.

## Functional requirements

### MVP
**Condition standard library** (Foundry, the verified 4-param interface, 2-step pattern, factory-only config per D8):
- [ ] **MVP (3 net-new + track-mapped):** `SubscriptionCondition` (recurring + `paidUntil`, two payment modes per D12), `TierGateCondition` (license-tier gated), `ComposableCondition` (AND/OR, depth-capped).
- [ ] **Phase 2:** `TimeLockCondition`, `RevocableCondition`, `MultiSigCondition` (EIP-712 + epoch per D9). (TimeLock + Revocable-ish already exist in the demo → low novelty; sequenced, not abandoned.)
- [ ] `CdrKitVault` factory: one-tx mint NFT → register IP → allocate → **`setConfigFromFactory(uuid, creator, config)` atomically** (D14) → attach PIL terms; fixed creator-only write condition (D15).
- [ ] Every condition `view` is revert-safe on an unconfigured uuid; `register/setConfig` is `onlyVault`.
- [ ] Fork-tested on Aeneid: a real `allocate → write → read` round-trip per condition passes/reverts as designed, **plus a negative control proving a non-factory caller cannot configure an allocated uuid.**

**`@cdr-kit/contracts`**: wagmi-cli-generated ABIs + verified addresses + typed read/write hooks.

**`@cdr-kit/core`**: `CDRClient` wrapper; `initWasm` lifecycle; condition encoders (with addresses); the 2-step flows (`subscribeAndAccess`, `accessVault`) with progress callbacks + long timeouts; IPFS routing for >1KB.

**`@cdr-kit/react`**: `<CdrProvider>`, `<VaultGate>`, hooks (`useVault`, `useCreateVault`, `useSubscription`, `useAccessVault` with explicit `paying|collecting-partials|ready` status, `useCreatorVaults`, `useAuditLog`).

**`@cdr-kit/agent`**: own-wallet client `discover()` → `subscribe()` → `access()`; example agent that uses pulled data downstream.

**Dashboard (flagship)**: connect wallet; create vault (choose condition + PIL tier + upload/paste); manage vaults (subscribers, grant/revoke, **payment/subscription event log** — not a "who-decrypted" log, which CDR can't provide; D11); buyer view (active subs + expiry + access). MVP template: data-marketplace.

### Phase 2 / stretch
- [ ] TimeLock + Revocable + MultiSig conditions. [ ] secrets-vault template. [ ] x402 HTTP bridge for the agent. [ ] CLI. [ ] Multi-tier subscriptions on one vault. [ ] Vault hierarchy via ComposableCondition.

## Non-goals
- No confidential compute claims (CDR can't; buyer holds plaintext).
- No mainnet (Aeneid testnet only).
- Not a re-skin of `cdr-demo`'s app — the library + DX is the product.
- No runtime hot-path secrets (7-min latency: provisioning/async only).

## Hackathon scoring rubric (build decisions must trace to this)
Prizes: **Technical $1k · Application $1k + $1k runner-up** (build.usecdr.dev; one project can win both).
- **Technical track:** advanced read/write conditions (multi-sig, time-based, multi-step) · smart contracts enforcing conditional access · **composable vault systems interacting with other contracts** · trustless data exchange · new patterns for programmable permissions. → our condition standard library + `ComposableCondition` + `CdrKitVault` hit these verbatim.
- **Application track:** quality/polish · real traction (Twitter/app/LinkedIn) · evidence users actually want it · UX someone would use twice. → dashboard + npm installs + the autonomous-agent demo; distribution = published packages + a DevRel-amplifiable demo (NOT one tweet).

## Success criteria
1. `npm i @cdr-kit/react` + `<VaultGate>` gates real CDR data in a fresh app in < 20 lines.
2. All **3 MVP** conditions (Subscription, TierGate, Composable) deployed on Aeneid with passing fork tests (Phase 2 conditions tracked separately).
3. Live agent demo: agent discovers → pays → pulls → uses data, no human.
4. Dashboard: create → subscribe (2nd wallet) → access on Aeneid, with revoke + audit log working.
5. Honest, defensible differentiation vs Lit/TACo (Story IP coupling) and vs cdr-demo (productization) — articulated in README + demo.
6. Distribution: published packages + a demo that Story DevRel can amplify (real traction, not one tweet).

## Quality bar (Abu's standards)
≤400 lines/file (ESLint enforced), CI green (lint/typecheck/test/build matrix), Foundry + Vitest coverage, performance-conscious, specs reviewed by fresh sub-agents before any contract is written.
