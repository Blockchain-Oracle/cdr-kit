# cdr-kit — Epics

Build order is dependency-driven: verify the interface → contracts → bindings → SDK → react → agent → dashboard. E0 gates everything.

| Epic | Title | Package(s) | Depends on | Outcome |
|---|---|---|---|---|
| **E0** | Interface + scaffold verification | repo, `contracts` | — | Monorepo scaffolded (pnpm/turbo/tsdown/foundry/lint/CI). Interface (4-param) + addresses + `allocateFee=0` already verified on-chain. **Fork test must answer OQ6 (does `allocate()` preflight revert on a false/reverting condition?) + OQ7 (is there a `vaultOwner(uuid)` getter?) and prove a full allocate→write→read round-trip.** |
| **E1** | Condition standard library (MVP) | `contracts` | E0 | **3 MVP conditions** (Subscription, TierGate, Composable) implemented, unit + fork tested, deployed to Aeneid. `ConditionBase` (`onlyVault`, factory addr) + `ICdrCondition`. Phase 2 conditions (TimeLock, Revocable, MultiSig-EIP712) follow post-demo. |
| **E2** | CdrKitVault factory | `contracts` | E1 | One-tx vault creation (mint→register IP→allocate→**`setConfigFromFactory` atomically**→attach terms), pluggable read condition + fixed creator-only write condition (D15), tested, deployed. Negative tests: non-factory can't configure (`NotVault`); re-config reverts (`AlreadyConfigured`). |
| **E3** | Bindings | `@cdr-kit/contracts` | E1,E2 | wagmi-cli-generated ABIs + verified addresses + typed hooks; published. |
| **E4** | Core SDK | `@cdr-kit/core` | E3 | CDRClient wrap, initWasm, encoders w/ addresses, 2-step flows w/ progress, IPFS routing; Vitest; published. |
| **E5** | React layer | `@cdr-kit/react` | E4 | `<CdrProvider>`, `<VaultGate>`, hooks w/ latency status; peer-deps correct; "use client" preserved; published. |
| **E6** | Agent SDK | `@cdr-kit/agent` | E4 | discover→pay→access; example agent uses data downstream; published. |
| **E7** | Dashboard + templates | `apps/dashboard` | E5,E6 | Flagship UX (create/manage/grant-revoke/audit/access) + marketplace + secrets templates; deployed (Vercel). |
| **E8** | Demo + distribution | — | E7 | Recorded agent demo + dashboard walkthrough; README positioning; published packages; DevRel-amplifiable launch. |

Cross-cutting (every epic): ≤400 lines/file, CI matrix green, the 6 cross-cutting risks in `architecture.md §9` addressed by acceptance criteria.

## Story index (BDD acceptance criteria in `stories/`) — complete MVP set
- `story-e0-interface-verification.md` — the make-or-break gate (interface ✅ verified; OQ6/OQ7 fork tests).
- `story-e1-subscription-condition.md` — net-new condition (2-step, `paidUntil`, two payment modes, factory-config).
- `story-e1-tiergate-condition.md` — the Story-IP-coupling moat (license-tier gate in a `view`).
- `story-e1-composable-condition.md` — composability (depth-capped, `try/catch`).
- `story-e2-cdrkitvault.md` — the factory + the D8 front-running fix (security keystone).
- `story-e3-contracts-bindings.md` — `@cdr-kit/contracts`: typed bindings + address source of truth.
- `story-e4-two-step-access-flow.md` — SDK 2-step + 7-min latency UX.
- `story-e5-react-vaultgate.md` — `<CdrProvider>` + `<VaultGate>` + hooks (the DX product).
- `story-e6-agent-autonomous-access.md` — the demo money-shot.
- `story-e7-dashboard.md` — flagship app + data-marketplace template.

Phase-2 stories (TimeLock, Revocable, MultiSig-EIP712, secrets-vault, x402 bridge, CLI) written when those epics start.

---

## Expanded "full kit" plan (P0–P5) — supersedes E7/E8

E0–E6 are DONE + validated live on Aeneid (engine: contracts, factory, core flows, react, agent, OQ8 round-trip, autonomous agent demo). Research (4 reports) showed we built the **engine, not the kit**. Decisions D16–D18 capture the upgraded vision. New build order:

| Phase | Build | Key (decision) |
|---|---|---|
| **P0** | Capture vision in specs (this) | D16–D18 |
| **P1 — core done right** | `CdrError` taxonomy · discriminated-union status (`idle\|connecting\|paying\|collecting-partials\|ready\|error\|empty`) · Zod-typed condition encoders/decoders + Zod'd keeper responses · keeper retries+backoff+idempotency · **file/IPFS path (>1KB)** · **mock mode** (`mode:'mock'\|'testnet'`) · Vitest | D17 |
| **P2 — agent kit** | `@cdr-kit/tools` (declarative `{name,description,Zod,invoke}` + zod→json-schema) · `@cdr-kit/mcp` (server binary = OpenClaw/Claude/Cursor skill) · adapters `vercel-ai`/`langchain`/`openai`/`agentkit`/`goat` (+opt `eliza`) · examples `vercel-ai-chatbot`, `claude-mcp` | D16 |
| **P3 — react completeness** | `CdrProvider`(mode+theme) · full hook set on the RQ state contract · `<VaultGate>`+`<VaultLocked/Unlocked>`+skeleton/empty/error primitives · optimistic gate · `useVaultEvents` · `<CdrInspector>` devtool · `@cdr-kit/react/testing` · generated react hooks in `@cdr-kit/contracts` | D17 |
| **P4 — polish** | `create-cdr-kit-app` scaffolder · `examples/` · per-package READMEs + docs quickstart · versioning + SDK↔condition compat matrix · `publint`/`attw` in CI | D17 |
| **P5 — flagship** | Next.js dashboard + data-marketplace template (visual-loop verified; doubles as live playground) | — |

Clean refactors throughout — no backward-compat patching (D18). Skips (research-confirmed not real tool hosts): Hummingbot, Alexa, Olas.
