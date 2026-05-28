# cdr-kit — START HERE

> This `context/` folder is the **knowledge base** for building cdr-kit. Read it before writing any code.
> It is deliberately separate from `docs/` (the specs). Context = *why & how the ecosystem really works*. Specs = *what we're building*.

## What cdr-kit is (one paragraph)

cdr-kit is the **developer toolkit for Story Protocol's Confidential Data Rails (CDR)** — "the wagmi/Clerk/Stripe layer for CDR." Two halves:

1. **Open-source library** (`@cdr-kit/*` npm packages): an audited, typed, tested **standard library of CDR condition contracts** (Subscription, TimeLock, Revocable, TierGate, MultiSig, Composable) + a **React layer** (`<VaultGate>`, `useVault`) + an **agent SDK** (autonomous agents read/write vaults) + generated contract bindings.
2. **Vault-management dashboard** (flagship Next.js app, built ON the library — dogfooding): create/manage vaults, grant/revoke access, on-chain audit log. Plus thin **templates** (data-marketplace, secrets-vault) shipping with the library.

Agent flow is **core to the demo** (a live agent pays + pulls vaulted data autonomously).

## The honest wedge (read `research/existing-vs-missing.md` first)

NOT "nobody built CDR conditions" — the `piplabs/cdr-demo` repo already has ~9 working condition contracts. The wedge is: **those are scattered, app-internal, mostly-untested demo contracts with no npm package / types / React layer / agent SDK / dashboard, and they lack the advanced patterns (recurring subscription, tier-gate, multisig, composable).** cdr-kit productizes + extends. This is the wagmi story (wagmi didn't invent `eth_call`; it won on DX).

## How to use this folder

| Folder | What's in it | When to read |
|---|---|---|
| `research/` | How CDR + Story actually work, verified addresses, the resolved condition interface, limitations | Before designing contracts or SDK |
| `best-practices/` | The 2026 build stack (monorepo, bundler, CI, lint, solidity, react packaging) — already researched, don't re-google | When scaffolding / configuring |
| `decisions/` | ADR-style log: every non-obvious choice + why | Before changing a decision; append new ones |
| `reference/` | `repos.md` manifest + `vendored/` = the exact source files (real condition contracts, SDK, skill) | When you need to see how the real code looks |

## Hard truths to never forget (full detail in `research/`)

1. **CDR has NO confidential compute.** Threshold-decrypt only → after conditions pass, the buyer holds **plaintext**. No DRM, no leak control. (So don't pitch "theft-proof"; pitch "no billing infra + native royalty rails + on-chain revocation".)
2. **The real condition interface is 4-param, uuid-first** — the official docs are STALE (they show 3-param). Getting this wrong = every tx reverts. See `research/cdr-protocol-truth.md`.
3. **~7-minute read latency.** No synchronous hot-path use (e.g. fetching an API key per request). Provisioning/async only. UX must show progress.
4. **Inline payload cap ~1KB** → larger data uses `uploadFile` (AES body to IPFS, only the key under CDR).
5. **A `view` condition cannot take payment.** Every paid gate is 2-step: mutating pay tx → view reads resulting state. See `research/story-ip-royalty.md`.
6. **Addresses verified on-chain (2026-05-28):** live `LICENSE_READ_CONDITION` = `0xC064…f7a3` (cdr-demo's `0xD429…` is NOT deployed); `allocateFee` = 0; 4-param interface confirmed. Still re-read fees at runtime. See `research/cdr-protocol-truth.md`.
8. **`register()` must be factory-only + atomic** — permissionless `register(uuid,…)` is a vault-hijack (front-run a predictable uuid). Conditions take `setConfig` `onlyVault`; `CdrKitVault` allocates + configures in one tx; every `view` returns `false` (never reverts) on an unconfigured uuid. See `decisions/decision-log.md` D8.
7. **Testnet (Aeneid, chain 1315) only** — not production-grade confidentiality.

## Status / next steps

- [x] Deep research (CDR contracts, SDK, Story IP/royalty, 2026 build stack) — done, captured here.
- [x] context/ knowledge base — this folder.
- [ ] Specs in `docs/` (PRD, architecture, ux-spec, epics, stories).
- [ ] Sub-agent review of specs against best standards — BEFORE writing contracts.
- [ ] Implement.
