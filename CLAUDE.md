# CLAUDE.md — cdr-kit

Developer toolkit for Story Protocol Confidential Data Rails (CDR): condition contracts +
`@cdr-kit/{contracts,core,react,agent}` + (todo) a Next.js dashboard. pnpm + Turborepo +
tsdown + Foundry. Backend/SDK/agent are done and verified live on Aeneid; the dashboard is next.

## Commands
- `pnpm build | test | lint | typecheck` — turbo across packages (run before claiming done)
- `cd contracts && forge test` — 30 Solidity tests; `forge fmt`
- `pnpm --filter @cdr-kit/core run e2e` / `--filter @cdr-kit/agent run demo` — live Aeneid flows (need `source contracts/.env`)
- Regenerate ABIs after contract changes: `pnpm --filter @cdr-kit/contracts run wagmi`

## Conventions (enforced)
- **≤400 lines/file** (ESLint `max-lines`, flat config). Codegen (`generated.ts`) + configs are exempt.
- **Use a logger (`consola`), never `console.log`** in TS scripts/apps. Library code uses callbacks/events, never logs. (Solidity `console.log` in `*.s.sol` is fine — it's Foundry's.)
- Dual ESM/CJS via tsdown; peer-dep `react`/`wagmi`/`viem`/`@tanstack/react-query` (never bundle them); `"use client"` banner on `@cdr-kit/react`.
- **One source of truth for addresses: `@cdr-kit/contracts`.** Never hardcode an address elsewhere.

## Architecture rules (from `context/decisions/decision-log.md` D1–D15)
- Conditions are pure `view` (`checkRead/WriteCondition(uint32 uuid, bytes accessAuxData, bytes conditionData, address caller)`). All payment/state lives in separate fns; the view only reads.
- **Config is factory-only + atomic** (`onlyVault setConfigFromFactory` + `AlreadyConfigured`). `CdrKitVault.createVault` allocates + configures in one tx — closes the front-run window. Never add a permissionless `register()`.
- Every condition `view` returns `false` (never reverts) on an unconfigured uuid.
- 2-step pattern everywhere: pay/subscribe (mutating tx) → then the `view` reads the result.

## Gotchas (burned on these — see `context/research/cdr-protocol-truth.md`)
- **CDR precompile txs OOG under `eth_estimateGas`** (`ReentrancySentryOOG`) — set an explicit gas limit on raw cast/`forge` calls (2M ok). The SDK path is fine; `core.createVault` sets `gas: 3M`.
- **`initWasm()` is required** before any encrypt/decrypt — it's in `@piplabs/cdr-crypto` (NOT re-exported by cdr-sdk). `@cdr-kit/core` handles it via `ensureWasm()`.
- **`uuid` is a global counter** — read it from the `VaultCreated`/`VaultAllocated` event in your receipt; don't predict it (it moves between simulate and send).
- 4-param condition interface (docs say 3 — stale). `allocate` does NOT pre-check conditions (checks happen at write/read). Read latency ~15s typical. No confidential compute (buyer holds plaintext). Testnet only.

## Building the dashboard (E7)
- Spec: `docs/ux-spec.md` + `docs/stories/story-e7-dashboard.md`. Build on `@cdr-kit/react` (dogfood).
- MVP screens: browse, vault detail (with access stepper), create vault, seller + buyer dashboards. MVP template = data-marketplace.
- The access UX must surface `paying → collecting-partials → ready` (tens of seconds). The "audit log" is a **payment/subscription event log**, NOT who-decrypted (CDR can't provide that).
- Verify UI in a browser (Playwright/Chrome-DevTools MCP screenshots + a vision pass) — never claim UI done from `tsc` alone.

## Where things are
`context/` = ground-truth knowledge base (read `00-START-HERE.md` first) + decisions D1–D15 + vendored reference contracts. `docs/` = PRD/architecture/ux-spec/epics/stories. `contracts/` = Foundry. `packages/` = the 4 TS packages.
