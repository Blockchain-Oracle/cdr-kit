# CLAUDE.md — cdr-kit

Developer toolkit for Story Protocol Confidential Data Rails (CDR). 15 npm packages:
`@cdr-kit/{contracts,core,agent,tools,mcp,cli,react,react-ui,story}` + 5 framework adapters
(`vercel-ai, openai, langchain, agentkit, goat`) + `create-cdr-kit-app` scaffolder + a
multi-skill Claude Code plugin. Plus the `apps/site` Next.js dashboard at cdrkit.xyz.
pnpm + Turborepo + tsdown + Foundry. 0.5 ships live on Aeneid with 4 advanced conditions
(TimeWindow / DeadMan / Escrow / MultiSig dual-path) on top of the 0.4 surface.

## Commands
- `pnpm build | test | lint | typecheck` — turbo across packages (run before claiming done)
- `cd contracts && forge test` — Solidity tests (99 unit + 7 fork = 106 total); `forge fmt`
- `forge test --match-contract AeneidForkTest --fork-url $AENEID_RPC` — acceptance tests against deployed state
- `pnpm --filter @cdr-kit/core run e2e` / `--filter @cdr-kit/agent run demo` — live Aeneid flows (need `source contracts/.env`)
- `pnpm --filter @cdr-kit/agent exec tsx scripts/e2e-conditions.ts` — create 1 vault of each new 0.5 condition type
- Regenerate ABIs after contract changes: `pnpm --filter @cdr-kit/contracts run wagmi`

## Conventions (enforced)
- **≤400 lines/file** (ESLint `max-lines`, flat config). Codegen (`generated.ts`) + configs are exempt.
- **Use a logger (`consola`), never `console.log`** in TS scripts/apps. Library code uses callbacks/events, never logs. (Solidity `console.log` in `*.s.sol` is fine — it's Foundry's.)
- Dual ESM/CJS via tsdown; peer-dep `react`/`wagmi`/`viem`/`@tanstack/react-query` (never bundle them); `"use client"` banner on `@cdr-kit/react`.
- **One source of truth for addresses: `@cdr-kit/contracts`.** Never hardcode an address elsewhere.

## Architecture rules (from `context/decisions/decision-log.md` D1–D21)
- Conditions are pure `view` (`checkRead/WriteCondition(uint32 uuid, bytes accessAuxData, bytes conditionData, address caller)`). All payment/state lives in separate fns; the view only reads.
- **Config is factory-only + atomic** (`onlyVault setConfigFromFactory` + `AlreadyConfigured`). `CdrKitVault.createVault` allocates + configures in one tx — closes the front-run window. Never add a permissionless `register()`.
- Every condition `view` returns `false` (never reverts) on an unconfigured uuid.
- 2-step pattern everywhere: pay/subscribe (mutating tx) → then the `view` reads the result.
- **New conditions slot in without redeploying the factory.** When adding a 5th-Nth condition contract, deploy the new condition + `initialize(EXISTING_VAULT)` — don't redeploy `CdrKitVault`. The factory accepts any `ICdrConfigurable` as `readConditionAddr`. The 4 new 0.5 conditions all bind to the existing 0xac592f… factory.
- **MultiSig has TWO approval paths** (off-chain EIP-712 sigs OR on-chain `approve(uuid, expectedEpoch)`), both gated by the same `epoch`. `rotateSigners` bumps epoch — invalidates BOTH paths. `checkReadCondition` ORs the two; either reaching threshold passes the read. On-chain approve **requires** signer to pass the epoch they intend to bind to; mismatch reverts `EpochChanged(expected, current)`.
- **Storage adapters lazy-load their SDKs.** `createS3Storage`, `createStorachaStorage`, `createHeliaStorage` use `new Function("specifier", "return import(specifier)")` indirection so Vite/Rollup don't try to statically resolve the optional peer deps at build time. Pattern reused 3x; document in any new ecosystem adapter.

## Gotchas (burned on these — see `context/research/cdr-protocol-truth.md`)
- **CDR precompile txs OOG under `eth_estimateGas`** (`ReentrancySentryOOG`) — set an explicit gas limit on raw cast/`forge` calls (2M ok). The SDK path is fine; `core.createVault` sets `gas: 3M`.
- **forge auto-gas-estimation is 2.8 billion times too low on Aeneid** — first deploy hung in the mempool with `15 wei` gas price (actual chain price is ~42 gwei). Always pass `--legacy --with-gas-price 60000000000` to `forge script ... --broadcast`.
- **`initWasm()` is required** before any encrypt/decrypt — it's in `@piplabs/cdr-crypto` (NOT re-exported by cdr-sdk). `@cdr-kit/core` handles it via `ensureWasm()`.
- **`uuid` is a global counter** — read it from the `VaultCreated`/`VaultAllocated` event in your receipt; don't predict it (it moves between simulate and send).
- 4-param condition interface (docs say 3 — stale). `allocate` does NOT pre-check conditions (checks happen at write/read). 7-min server-side read ceiling; default `timeoutMs: 120_000`. No confidential compute (buyer holds plaintext after one read — applies to escrow especially). Testnet only.
- **MultiSig epoch invalidates BOTH paths on `rotateSigners`.** In-flight off-chain sigs from prior epoch are rejected (replay check binds `epoch`); on-chain approvals stay in storage but no longer count (read uses `approvalsCount[uuid][currentEpoch]`).
- **Escrow `pay()` refunds excess** in the same tx — never require an exact-match `msg.value` in your UI; the contract handles it.
- **DeadMan `poke()` is one-way / onlyCreator.** Cannot poke after `unlockAt` lapses (`AlreadyUnlocked` revert). Reviving would let a creator block heirs forever; the trapdoor is intentional.
- **TimeWindow `endTs == 0`** means open-ended (no upper bound). `startTs == 0` means "always-open from genesis" — almost certainly a bug; use `OpenCondition` instead.
- **Vite static-analysis chokes on dynamic optional-peer imports.** Pattern: route through `new Function("s", "return import(s)")` to hide the literal specifier from build-time resolution.

## Live Aeneid addresses (0.5 — see `packages/contracts/src/addresses.ts`)
- `CdrKitVault` factory: `0xac592f165D8dD1f27A087bdB39c0b2f619FF6C8C` (deployed 0.3, unchanged)
- `TimeWindowCondition`: `0x67911435F262e7e4EC4F7FEB4e868a67b9dd90b1`
- `DeadManSwitchCondition`: `0x37226f97e184843aB0b8d4f08A55969801B97766`
- `ConditionalEscrowCondition`: `0x7fcDe02DB7c14fD3587aB2fED064a1D8355b7584`
- `MultiSigCondition`: `0x3A0Cf72f167A2c1f5a7A5025eb36219f28C20FCd` (2026-06-01 r2 — `approve(uuid, expectedEpoch)` arg + defensive `threshold==0` guard in `evaluate()`; prior `0x61061CCb…`, `0xb22EBF…` retired)
- `OpenCondition`: `0x78528c2dd16fc450ff417189cc0436e8d2d82389` (2026-06-03 r3 — inherits ConditionBase so factory `_configure` works; checkRead/Write `pure return true` so SDK-direct `allocate` (uploadFile) works; prior `0x36fB2e…`, `0x37f47bd…` retired)

## Building the dashboard (E7)
- Spec: `docs/ux-spec.md` + `docs/stories/story-e7-dashboard.md`. Build on `@cdr-kit/react` (dogfood).
- MVP screens: browse, vault detail (with access stepper), create vault, seller + buyer dashboards. MVP template = data-marketplace.
- The access UX must surface `paying → collecting-partials → ready` (tens of seconds). The "audit log" is a **payment/subscription event log**, NOT who-decrypted (CDR can't provide that).
- Verify UI in a browser (Playwright/Chrome-DevTools MCP screenshots + a vision pass) — never claim UI done from `tsc` alone.

## Where things are
- `context/` — ground-truth knowledge base (read `00-START-HERE.md` first); decisions log D1–D21; vendored reference contracts.
- `docs/` — PRD/architecture/ux-spec/epics/stories. `docs/e2e-runbook.md` is the shippability gate.
- `contracts/` — Foundry. `src/conditions/` = 9 deployed conditions. `script/Deploy*.s.sol` = deploy/redeploy.
- `packages/` — 14 TS packages:
  - **Core**: `contracts` (addresses + ABI), `core` (SDK), `agent` (CdrAgent + advanced/story modules)
  - **Tools**: `tools` (CdrTool[] factory, 34 tools), `mcp` (stdio server), `cli` (`cdr` binary, 25 commands)
  - **UI**: `react` (hooks + headless components), `react-ui` (styled), `story` (Story IP wrappers)
  - **Adapters**: `vercel-ai`, `openai`, `langchain`, `agentkit`, `goat`
  - **Scaffolder**: `create-cdr-kit-app`
  - **Plugin**: `plugin/cdr-kit/` (multi-skill Claude Code plugin — 11 skills)
- `apps/site/` — Next.js dashboard / documentation site (cdrkit.xyz).
- `examples/vercel-ai-chatbot/` — runnable end-to-end agent demo.
