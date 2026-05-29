# cdr-kit — MVP / Goal Alignment Audit

**Date:** 2026-05-29 · **Auditor:** Claude (Opus 4.7) via two fresh-context sub-agents + memory recovery
**Purpose:** Honest, evidence-based assessment of whether cdr-kit is aligned with the goal and whether the MVP is *actually* achieved — written so an **independent agent can re-audit** and catch anything missed.

> This is an assessment only. No code was changed in the audit pass. Status tags: **DONE** (verified) · **PARTIAL** · **UNVERIFIED** (claimed but not provable from committed state) · **MISSING**.

---

## 0. Method (so it can be reproduced/extended)

1. **Goal recovery** — episodic-memory + claude-mem searches + the repo's own memory (`~/.claude/projects/.../memory/project_cdr-kit-direction.md`), `docs/PRD.md`, `docs/epics.md`, `context/decisions/decision-log.md` (D1–D19).
2. **Two parallel fresh-context sub-agents** (no inherited assumptions): one auditing the **agent kit** end-to-end; one scoring the **MVP vs PRD success criteria + epics**. Both read code and ran tests.
3. Verification commands used: `pnpm typecheck`, `pnpm test`, per-package `vitest`, `packages/mcp/scripts/verify.mjs` (real MCP client handshake), Foundry test-function counts, `npm view`, address check in `packages/contracts/src/addresses.ts`.

**For the independent re-auditor:** re-run those commands; pay special attention to §3 (agent-kit autonomy story) and §4 (the "live" claims) — those are where this audit found the gap between *claimed* and *committed/provable*.

---

## 1. Goal & alignment — ALIGNED

**Goal evolution (important context):**
- **Early (May 28–29):** "MCPVault" — an agent-to-agent encrypted-data *marketplace app* (starting from `jacob-tucker/cdr-ai-negotiate`). **Superseded.** (Stale `Blockchain-Oracle/mcpvault` repo + early claude-mem decisions reflect this; ignore them.)
- **Locked direction:** `cdr-kit` — the developer **toolkit/library** for Story CDR (decision-log D1 "toolkit, not an app"; D16 "agent kit = tool-distribution layer"): condition-contract standard library + typed SDK + React layer + **agent kit** + a flagship dashboard (marketplace as a *template*) + docs.

**Finding:** the repo genuinely builds that. No scope drift; engine quality is high. **Aligned in intent and in structure.** The overstatement is the word "live" (see §4).

---

## 2. PRD Success-Criteria scorecard (`docs/PRD.md`)

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | `npm i @cdr-kit/react` + `<VaultGate>` gates data in <20 lines | **DONE** | `packages/react/src/vault-gate.tsx` = 30 LOC; quickstart ≈ 8 lines (`apps/docs/content/docs/quickstart.mdx:18-26`) |
| 2 | 3 MVP conditions deployed on Aeneid w/ passing fork tests | **DONE (caveat)** | Subscription/TierGate/Composable + `CdrKitVault` in `contracts/src/`; 5 addresses in `packages/contracts/src/addresses.ts` (verified 2026-05-28); **30/30** Foundry tests pass. **Caveat:** tests are unit-vs-**Mock** contracts (`MockLicenseToken`/`MockRoyaltyModule` in `Conditions.t.sol`), **not** `vm.createSelectFork`. PRD's "fork-tested Aeneid round-trip + negative control" is met only by the standalone TS e2e script. |
| 3 | **Live agent demo: discover → pay → pull → use, no human** | **PARTIAL** | `packages/agent/scripts/agent-demo.ts` is real code and the pay→access leg **ran live** (memory: uuid 4067, real $IP, secret decrypted; this session also ran the file-path e2e live, uuid 4188). **But** the demo never calls `discover()` (uuid handed seller→buyer, `agent-demo.ts:43→53`), and there is **no "use-downstream" step** (ends at a string-equality check, `agent-demo.ts:60`). No committed run artifact/recording. |
| 4 | Dashboard create→subscribe(2nd wallet)→access on Aeneid + revoke + audit log | **UNVERIFIED / partial** | All screens exist (`apps/web/app/(app)/{marketplace,vault/[uuid],create,seller,buyer}`) and dogfood `@cdr-kit/react`; the `paying\|collecting-partials\|ready\|error` stepper is real (`components/app/access-stepper.tsx`). **But the app runs on `mockKit`/`seedVaults`** (`app/providers.tsx`, `marketplace/page.tsx`). A live provider + `useCdrWallet` were wired this session, but the marketplace still lists seed vaults; **2nd-wallet, revoke, and "on Aeneid" are not demonstrable in the dashboard.** |
| 5 | Honest differentiation vs Lit/TACo + cdr-demo | **DONE** | Articulated in root `README.md`. |
| 6 | Distribution: published packages + real traction | **MISSING** | All packages `v0.0.0`; `npm view @cdr-kit/react` → 404. No traction evidence. |

---

## 3. Agent kit deep-dive (the centerpiece)

**Verdict: demo-REAL, not theatre — but the autonomy *narrative* is ~⅔ built, and there is zero LLM-in-the-loop proof.**

**Real:**
- `CdrAgent` (`packages/agent/src/agent.ts`) is a genuine implementation: `discover()` scans real `VaultCreated` logs (≈47-62); `subscribeAndAccess()`/`access()` delegate to real `@cdr-kit/core` flows (`flows.ts:65-98` = on-chain `subscribe` tx then the CDR partial-collection read).
- `createCdrTools` (`packages/tools/src/index.ts`) produces real `{name, description, inputSchema(Zod), invoke}` tools; `toJsonSchema` uses real `zod-to-json-schema` (openApi3).
- All **5 adapters** (`vercel-ai`, `openai`, `langchain`, `agentkit`, `goat`) are correct thin transforms to each runtime's shape. No stubs/TODOs.
- **MCP is genuinely verified:** `packages/mcp/scripts/verify.mjs` spawns the *built* server and runs a real `StdioClientTransport` client handshake — re-run confirmed: connected, listed 3 tools, valid draft-07 JSON Schema, exit 0.

**Gaps:**
- `discover()` is **never called** in the demo → the "discover" pillar of criterion #3 is narrative, not code.
- **No "use-downstream" step** anywhere → the "use it" pillar does not exist in code.
- **No LLM-in-the-loop** anywhere: adapter tests use a **stub agent** (e.g. `openai/test/adapter.test.ts:6-10`) — they verify routing + Zod validation at the tool boundary only; no `generateText`/`createReactAgent`/`chat.completions` call exists in the repo (only in doc-comments). Both `examples/` dirs are **README-only shells**.
- **Test coverage holes:** `@cdr-kit/agent` and `@cdr-kit/tools` have **ZERO tests**; `@cdr-kit/langchain` has **no test at all**; `@cdr-kit/mcp` has **no `test` script** (verify is manual). Passing: openai 8/8, agentkit 3/3, vercel-ai 2/2, goat 3/3.

---

## 4. The "live" gap (cross-cutting)

The kit is a **green localhost MVP, not a shipped/live one**:
- Contracts are **really deployed** + the crypto round-trip + file-path e2e **really ran on Aeneid** (this session: uuid 4188, ~15s) — but the proof lives in **run-it-yourself TS scripts** (`packages/core/scripts/e2e-*.ts`, `agent-demo.ts`), with **no committed run output and no CI fork tests**.
- The dashboard demo is **mock-only**.
- Nothing is **published**.

---

## 5. Left behind / incomplete (specific)

1. **No npm publish** — `v0.0.0` everywhere (biggest gap to the "kit" goal; PRD #6).
2. **Agent autonomy story** — `discover()` call + a real downstream-use/LLM-loop + ≥1 runnable example (examples/ are empty shells).
3. **Dashboard live path** — still mock-only; live-discovery marketplace + revoke + 2nd-wallet unfinished (tasks #23/#28 genuinely `in_progress`).
4. **No reproducible on-chain proof** — no committed recording/artifact; `forge test` has **no fork tests** (only unit-vs-mocks).
5. **Test holes** — `agent`, `tools` (zero), `langchain` (none), `mcp` (not in `pnpm test`).
6. **Minor:** `forge fmt --check` drift; dirty `contracts/foundry.lock`.

---

## 6. Areas for the INDEPENDENT re-auditor to scrutinize (where this audit is least certain)

- **Re-run the agent demo live** (`source contracts/.env && pnpm --filter @cdr-kit/agent run demo`) and confirm what it actually proves vs the discover/use claims.
- **Contracts:** confirm whether unit-vs-mock coverage is sufficient, or whether real fork tests are needed for credibility; re-verify the 5 deployed addresses on-chain.
- **Adapters:** independently judge whether boundary-only tests (stub agent) are acceptable, or whether a real model-loop test is required to call the agent kit "working."
- **Dashboard:** decide whether mock-first + a live e2e is an acceptable demo, or whether in-app live (wallet + discovery + revoke) is required for criterion #4.
- **Distribution:** is npm publish actually required for the hackathon, or is a public repo + recorded demo enough?
- Anything this audit marked DONE — re-verify independently; do not trust the tag.

---

## 7. Prioritized punch-list (input to planning)

- **P1 — agent kit (centerpiece):** demo calls `discover()`; add a real downstream step (decrypted data → one `vercel-ai` `generateText` tool-loop where a *model* chooses discover→subscribe→use); ship one runnable example; add tests for `agent`/`tools`/`langchain` + put `mcp` verify in `pnpm test`.
- **P2 — make "live" honest:** finish dashboard live-discovery + revoke (or commit a recorded e2e / CI fork test as proof).
- **P3 — ship:** changesets + publish to npm.
- **Minor:** `forge fmt`; commit/clean `foundry.lock`.
