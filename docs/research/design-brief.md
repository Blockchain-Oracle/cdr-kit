# cdr-kit — Project Brief for the Design Agent

This is a hand-off document. It gives you everything you need to know about **what cdr-kit is**, **what it does**, **who it's for**, and **what surfaces need to exist** on a website that markets and documents it. It deliberately contains **no design direction** — no colors, no fonts, no layout, no aesthetic references, no component-library suggestions. All visual, typographic, motion, and structural design decisions are yours.

---

## The one-line pitch

**cdr-kit is the developer toolkit for Story Protocol's Confidential Data Rails** — the `wagmi`/`Stripe`-style layer that makes it possible to ship private, paid, license-gated data on Story without hand-writing Solidity, hand-rolling encryption flows, or wiring IP-licensing primitives by hand.

A developer should be able to install one npm package and gate encrypted data behind a real on-chain payment or license check in under a minute.

---

## Background: what is Story Protocol CDR?

**Story Protocol** is an L1 blockchain for intellectual-property ("Programmable IP"): assets that have on-chain license terms, royalty rails, and remixability built into the protocol. <https://story.foundation>

**Confidential Data Rails (CDR)** is Story's primitive for confidential data. It's a threshold-encryption system where:
1. A data owner encrypts a payload off-chain and uploads it to a network of "validator" nodes that each hold a key share.
2. An on-chain "vault" is allocated for that payload with a unique `uuid`. The vault's read and write access are each gated by a **condition contract** — a `view` function the validator network calls to decide whether to release/accept data for a given caller.
3. A buyer (or autonomous agent) satisfies the condition on-chain (typically by paying or holding a license), then issues a read request; the validators verify the condition and release enough key shares for the buyer to reconstruct the plaintext locally.
4. The result: programmable, monetizable, license-aware private data on a public chain.

CDR is currently deployed on **Aeneid**, Story's testnet (chain id 1315, RPC `https://aeneid.storyrpc.io`). Real-world read latency is ~15 seconds (threshold partial-collection); txs need an explicit gas limit because `eth_estimateGas` underestimates the precompile call (the SDK handles this).

CDR's encryption is commodity (Lit Protocol and TACo do similar things). What's distinctive about CDR is the **coupling to Story's IP layer**: a vault's read condition can require a license-tier token, a subscription, a royalty payment, or any composition of those — natively, on the same chain. That's the wedge cdr-kit builds on.

The platform's own SDK (`@piplabs/cdr-sdk`) ships the protocol primitives. cdr-kit is a higher-level toolkit *on top of* that SDK: a standard library of condition contracts, a typed TS SDK, a React layer, and an autonomous-agent SDK with framework adapters. We did the productization so the CDR ecosystem grows.

---

## Who cdr-kit is for

Three developer personas, in priority order:

1. **The web3 app builder** who wants to ship a paywalled data feed, a license-gated dataset, or a private file behind a subscription — and doesn't want to spend two weeks reading the CDR docs and writing Solidity. They install `@cdr-kit/react`, drop in a `<VaultGate>`, and ship.
2. **The autonomous-agent builder** (Claude / Cursor / OpenAI / LangChain / AgentKit / GOAT / Vercel AI users) who wants their agent to **buy data with its own wallet** — discover a CDR vault, satisfy the condition, decrypt, and use the payload, with no human in the loop. They install `@cdr-kit/agent` + their preferred framework adapter.
3. **The data-marketplace founder** who wants to bootstrap a Story-IP-aware private-data marketplace fast. They `npm create cdr-kit-app` and pick a template.

Personas 1 and 2 are the primary audience for the site. Persona 3 is served via the scaffolder.

---

## The wedge — how cdr-kit is honestly different

We are explicit about what we are and aren't:

- **NOT first to build CDR conditions.** Story's reference `cdr-demo` already ships ~9 condition contracts. Their value is "demo what CDR can do." Ours is **productization + extension** — turn scattered, mostly-untested, app-internal demo contracts into a standard, installable, tested, typed library with React + agent + docs DX, and add the advanced conditions that don't exist anywhere else (recurring `Subscription`, `TierGate`, `Composable` AND/OR, planned `Revocable`, `MultiSig`).
- **NOT a payments protocol or an encryption protocol.** We're a *toolkit* over CDR. Encryption stays in CDR; payments stay in Story IP; we wire them ergonomically.
- **Not a marketplace, not a product, not a SaaS.** We're a library. The site sells the library, not a hosted service. (This is important — see "What this is NOT" below.)

---

## What ships in the kit (12 packages, all v0.1.0 on npm)

All packages live under the `@cdr-kit` npm org: <https://www.npmjs.com/org/cdr-kit>. The repo is at <https://github.com/Blockchain-Oracle/cdr-kit>. License: MIT.

### Solidity / on-chain

| Package | What it is | npm |
|---|---|---|
| **`@cdr-kit/contracts`** | TypeScript bindings + deployed-address registry for the on-chain condition library and the `CdrKitVault` factory. Single source of truth for addresses. | <https://www.npmjs.com/package/@cdr-kit/contracts> |

The condition standard library (Solidity, deployed on Aeneid):
- `OpenCondition` — anyone reads/writes (sanity / fallback).
- `OwnerWriteCondition` / `CreatorWriteCondition` — gate writes to the asset owner / vault creator.
- `SubscriptionCondition` — recurring paid access (price per period, period length, payee, native-IP or WIP-royalty mode).
- `TierGateCondition` — gate by held Story IP license token tier.
- `ComposableCondition` — boolean AND/OR over child conditions (up to 8 deep).
- `CdrKitVault` — a factory that atomically mints the vault NFT, registers it as a Story IP asset, allocates the CDR slot, configures the read condition, and (optionally) attaches PIL license terms — all in one tx.

Out of scope for v0.1: `RevocableCondition`, `MultiSigCondition`, `TimeBoundCondition` (in the public roadmap).

### TS / SDK / React

| Package | What it is | npm |
|---|---|---|
| **`@cdr-kit/core`** | Typed TS SDK: viem client factory, condition encoders, the 2-step pay→access helpers, the file-IPFS routing helper, the keeper retry layer, the WASM-init helper, and a mock-mode in-memory CDR for local dev. | <https://www.npmjs.com/package/@cdr-kit/core> |
| **`@cdr-kit/react`** | React hooks + components + provider. Hooks: `useAccessVault`, `useSubscribeAndAccess`, `useCreateVault`, `useDiscoverVaults`, `useVault`, `useVaultEvents`, `useCreatorVaults`, `useCdrWallet`. Components: `<CdrProvider>`, `<CdrConfigProvider>`, `<VaultGate>`, `<CdrInspector>`, `<Vault>` compound (Header / Condition / Access / Error / Ready). Dual-mode: same code runs against a real Aeneid wallet or an in-memory mock for local dev/demos. | <https://www.npmjs.com/package/@cdr-kit/react> |

### Agent kit

| Package | What it is | npm |
|---|---|---|
| **`@cdr-kit/agent`** | Autonomous-agent client. `CdrAgent` class with `discover()` (scans the factory for vaults), `subscribeAndAccess()` (pays from its own wallet, decrypts), `access()` (reads a vault the agent is already entitled to). | <https://www.npmjs.com/package/@cdr-kit/agent> |
| **`@cdr-kit/tools`** | Framework-agnostic tool definitions (`{name, description, Zod schema, invoke}`) that map to MCP and every agent framework. Three canonical tools: `cdr_discover_vaults`, `cdr_subscribe_and_access`, `cdr_access_vault`. | <https://www.npmjs.com/package/@cdr-kit/tools> |
| **`@cdr-kit/vercel-ai`** | Vercel AI SDK adapter — `getVercelAITools(agent)` returns a `ToolSet` for `generateText` / `streamText`. | <https://www.npmjs.com/package/@cdr-kit/vercel-ai> |
| **`@cdr-kit/openai`** | OpenAI / Anthropic tool-calling adapter — JSON-Schema `tools[]` + a dispatch router. | <https://www.npmjs.com/package/@cdr-kit/openai> |
| **`@cdr-kit/langchain`** | LangChain `StructuredToolInterface[]` adapter. | <https://www.npmjs.com/package/@cdr-kit/langchain> |
| **`@cdr-kit/agentkit`** | Coinbase AgentKit `ActionProvider` adapter. | <https://www.npmjs.com/package/@cdr-kit/agentkit> |
| **`@cdr-kit/goat`** | GOAT SDK `PluginBase` adapter. | <https://www.npmjs.com/package/@cdr-kit/goat> |
| **`@cdr-kit/mcp`** | MCP server binary (`cdr-kit-mcp`) — plugs into Claude Desktop, Cursor, Windsurf, OpenClaw, or any MCP host. Exposes the three CDR tools over stdio. | <https://www.npmjs.com/package/@cdr-kit/mcp> |

### Scaffolder

| Package | What it is | npm |
|---|---|---|
| **`create-cdr-kit-app`** | The `npm create cdr-kit-app` scaffolder. Currently minimal (single inline template). **Being redesigned** (see "Decided new direction" below) to be an interactive, multi-template, Next.js-style flow. | <https://www.npmjs.com/package/create-cdr-kit-app> |

---

## The agent-kit story (worth its own section because it's a centerpiece)

cdr-kit is one of the first toolkits where **an autonomous LLM agent can buy data with its own wallet, no human in the loop**. The headline demo:

> A seller stages a subscription-gated vault with a trading signal inside. An LLM agent — given the three CDR tools — autonomously calls `cdr_discover_vaults`, picks the right one, calls `cdr_subscribe_and_access` (paying real `$IP` from its own wallet), reads + decrypts the signal, and answers: *"BUY ETH/USD at this confidence."* The seller, the chain, the decryption, the agent decision — all real, all on Aeneid.

This is delivered through:
- `@cdr-kit/agent` (`CdrAgent` class)
- `@cdr-kit/tools` (the canonical tool definitions)
- Five framework adapters (`vercel-ai`, `openai`, `langchain`, `agentkit`, `goat`)
- `@cdr-kit/mcp` (the MCP server, so the same tools light up in Claude Desktop / Cursor with one JSON config block)

There's a runnable example at `examples/vercel-ai-chatbot/` in the repo that runs the full agentic loop against live Aeneid in <30 seconds.

---

## Currently live (proof of working, not a feature list)

- **All 12 packages published to npm** at v0.1.0 under `@cdr-kit` (org owner `blockchainoracle`).
- **Condition contracts deployed on Aeneid testnet** (verified 2026-05-28). Vault factory at `0xac592f165D8dD1f27A087bdB39c0b2f619FF6C8C`; subscription/tier-gate/composable condition addresses in `@cdr-kit/contracts`.
- **End-to-end on-chain round-trips verified live** — encrypted file uploaded to Aeneid, subscribed-to, decrypted by a buyer wallet (recovered uuid 4188); three seeded subscription vaults running live (uuids 4200/4201/4202).
- **CI green** on `main` (lint + typecheck + test + build + Foundry contracts), Release workflow wired via `changesets` action.
- **Docs site** built (Fumadocs) at `apps/docs/` — currently 7 static MDX pages.
- **30 Solidity tests** passing.
- **MCP handshake test** in CI confirms the server boots and exposes the 3 tools.

---

## Decided new direction (this is what the site / scaffolder will showcase)

After shipping v0.1.0, two things were decided in conversation and have NOT yet been designed or implemented — the design agent is being briefed to help with these:

### 1. Replace the "marketplace dashboard" idea with a component showcase site

The repo currently includes a full marketplace-app dashboard (`apps/web/`). On reflection, that's the wrong artifact for a *library* — comparable libraries (shadcn/ui, RainbowKit, wagmi, Privy, Vercel AI SDK) don't ship a fake product as their showcase; they ship gallery + docs + examples. **The dashboard will be demoted to a scaffolder template.** The lead artifact becomes a **component showcase site** in the shadcn/RainbowKit-demo style: per-primitive pages with live, interactive, mock-by-default previews + copy-paste code + props table. Every component, every hook, the agent client, each framework adapter, and the MCP server should each have their own showcase surface.

### 2. Make `npm create cdr-kit` "slap"

The current scaffolder is one minimal inline template, no prompts. The decided direction is a **`create-next-app`-quality interactive flow**: multi-template (data-marketplace, paywall, MCP-server-quickstart, autonomous-agent at minimum), feature-flag prompts (TypeScript variants, framework choice, agent-adapter choice, "include the marketplace dashboard?"), package-manager-aware command rewriting, post-scaffold next-steps. The invocation URL should be canonical and short — `npm create cdr-kit`, `pnpm create cdr-kit`, `bun create cdr-kit` should all just work. (Source-level research on the `create-*` pattern is at `docs/research/scaffolder-cli-patterns.md`.)

---

## What this site needs to communicate (the visitor's takeaways)

By the time a visitor leaves the homepage, they should know:

1. **What CDR is**, in one sentence — programmable, payable, license-aware private data on Story.
2. **What cdr-kit gives them** — install one package, gate encrypted data behind a real on-chain check in <60s.
3. **The three pillars** — React/components, the autonomous-agent kit (with the MCP/Claude angle), and the Solidity condition standard library.
4. **It's real, not a slide deck** — live on Aeneid, 12 packages on npm, MIT-licensed, agent demo exists and runs.
5. **How to start in 30 seconds** — `npm create cdr-kit` (or `npm i @cdr-kit/react`), copy the quickstart snippet.

Drill-down surfaces let them go deeper into each piece.

---

## Pages the site likely needs (structural inventory — not a layout spec)

This is the kind of information surfaces a developer-library site of this scope needs. Group, name, and lay these out however makes sense.

- **Home / hero** — what cdr-kit is, who it's for, headline demo, "get started" CTAs, social proof (live on Aeneid, X packages on npm).
- **Quickstart** — `npm create cdr-kit`, plus the 8-line "gate encrypted data" snippet. Should be runnable mentally in 30 seconds.
- **Component showcase / gallery** — one page per primitive:
  - Components: `<CdrProvider>`, `<CdrConfigProvider>`, `<VaultGate>`, `<CdrInspector>`, `<Vault>` (compound, with sub-parts), per-condition badges.
  - Hooks: `useAccessVault`, `useSubscribeAndAccess`, `useCreateVault`, `useDiscoverVaults`, `useVault`, `useVaultEvents`, `useCreatorVaults`, `useCdrWallet`.
  - Each page wants: short description, when-to-use, **live interactive preview** (mock-mode by default), copy-paste code, props/options table, common variants.
- **Agent kit** — `CdrAgent` overview, the three tools (`cdr_discover_vaults`, `cdr_subscribe_and_access`, `cdr_access_vault`), the model-in-the-loop demo, and a sub-section per framework adapter (`vercel-ai`, `openai`, `langchain`, `agentkit`, `goat`).
- **MCP setup** — single-page guide with the Claude Desktop / Cursor / Windsurf JSON config blocks ready to copy. The hero shot of the MCP world.
- **Solidity / contracts** — the condition standard library, the `CdrKitVault` factory, deployed addresses, how to write your own condition (the 4-param `view` interface).
- **Templates** — what `npm create cdr-kit` gives you, one card per template (data-marketplace, paywall, MCP-quickstart, autonomous-agent, etc.).
- **Examples** — runnable, cloneable end-to-end demos (the `examples/` dir of the repo).
- **API reference** — per-package reference, auto-generated where possible.
- **Why cdr-kit?** — the wedge / comparison page (CDR vs Lit vs TACo; cdr-kit vs Story's reference `cdr-demo`).
- **Live on Aeneid** — a "status" / proof page: deployed contract addresses with explorer links, current published package versions, last CI status.
- **Blog / changelog** (optional) — per-release notes, fed by the existing per-package `CHANGELOG.md` files.

The existing Fumadocs site (`apps/docs/`) already hosts prose docs (Quickstart + per-package overviews); the redesigned showcase may live as routes inside that site, alongside it, or replace it — that's a structural decision for the design agent to make.

---

## What this is NOT (so the design doesn't go there)

- **Not a hosted product.** Don't pitch "sign up." There is no account, no SaaS, no dashboard a customer logs into. Visitors install npm packages.
- **Not a marketplace.** The marketplace-app concept is being demoted to a scaffolder template (one of several). Don't lead with marketplace imagery, "browse vaults," "trending sellers," etc.
- **Not a wallet, not a chain, not a protocol.** It's tooling *on top of* Story Protocol and CDR. Acknowledge the platform; don't position cdr-kit as the platform.
- **Not encryption.** The encryption is CDR's. cdr-kit ergonomizes it.
- **Not a one-feature product.** It's three intertwined pillars (React layer, agent kit, condition contracts) plus a scaffolder. The design needs to surface all three without flattening them.

---

## Voice and content notes (not visual)

- **Developer-first, technically honest.** No marketing fluff. If something is testnet-only, say so. If something is Phase-2, say so. If we did the productization on top of someone else's protocol, say so.
- **Concrete over abstract.** Show code, show CLI commands, show real package names, show real network endpoints. Don't write "blockchain-powered" or "trustless private data" — write `npm i @cdr-kit/react`.
- **Comparable in voice to wagmi.sh, Vercel AI SDK docs, shadcn/ui, RainbowKit docs** — those are the peer set in tone, not in visual treatment.
- **Names matter.** Use canonical names: `cdr-kit`, **C**onfidential **D**ata **R**ails (or CDR), Story Protocol, Aeneid (testnet). `@cdr-kit/<package>` for npm. `Blockchain-Oracle/cdr-kit` for GitHub.

---

## Canonical links

- **Repo:** <https://github.com/Blockchain-Oracle/cdr-kit>
- **npm org:** <https://www.npmjs.com/org/cdr-kit>
- **Story Protocol:** <https://story.foundation>
- **Story Aeneid testnet:** chain id 1315, RPC `https://aeneid.storyrpc.io`, faucet `https://aeneid.faucet.story.foundation`
- **Story CDR docs:** <https://docs.story.foundation/developers/cdr-sdk>
- **Story's own CDR SDK:** <https://github.com/piplabs/cdr-sdk>
- **Hackathon context:** Story Protocol Hackathon submission. Technical track (advanced conditions, composable vaults, programmable permissions) + application track (real traction via published packages + autonomous-agent demo).

---

## Out of scope for this design pass

- Designing the redesigned scaffolder CLI's *terminal* UX (that's CLI design, separate concern — research is at `docs/research/scaffolder-cli-patterns.md`).
- Designing the legacy `apps/web/` marketplace dashboard (being demoted; will become a `--template marketplace` scaffold). Its components (vault card, access stepper, condition badge) are reusable building blocks for the showcase, but the dashboard itself is not the artifact.

Everything else — hero, sitemap-as-laid-out, component-page anatomy, how the live previews are framed, how the agent-kit story is staged, how the MCP install snippet is presented, what the navigation is, what the "above the fold" beat looks like, all visual + typographic + motion + interaction choices — is the design agent's call.
