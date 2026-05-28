# Kit Form-Factor — agent-runtime coverage + big-kit features

Distilled from 4 research passes (agent-kit form factor, SDK DX, agent-runtime landscape, big-kit features). Actionable conclusions for the P1–P5 build. Decisions: [[../decisions/decision-log]] D16–D18.

## Agent-runtime coverage (what to build vs skip)

**MCP won interop (2026).** One `@cdr-kit/mcp` server (stdio) covers ALL of: Claude Desktop, Cursor, Cline, Goose, Windsurf, VS Code/Continue, **OpenClaw** (ClawHub skills are MCP), n8n / Zapier / Make, OpenAI Realtime (remote MCP). → the OpenClaw "plugin" = this server.

**Native adapters needed** (in-process code frameworks + crypto-native bespoke shapes) — the non-redundant set:
| Adapter | Target | Shape |
|---|---|---|
| `@cdr-kit/vercel-ai` | Vercel AI SDK (default TS runtime) | `tool({ description, inputSchema: zod, execute: invoke })` — near identity |
| `@cdr-kit/langchain` | LangChain/LangGraph (biggest base; bridges thirdweb-ai) | `StructuredTool` / `tool(invoke, {name, description, schema})` |
| `@cdr-kit/openai` | OpenAI Agents SDK + raw OpenAI/Anthropic tool use | JSON-Schema `tools[]` (via `zod-to-json-schema`) + `invoke(name,args)` router |
| `@cdr-kit/agentkit` | Coinbase AgentKit (our lane; also reaches Eliza) | `class extends ActionProvider` + `@createAction({name,description,schema})` |
| `@cdr-kit/goat` | GOAT (crypto agent trio) | `PluginBase` w/ `getTools()` |
| `@cdr-kit/eliza` (opt) | ElizaOS (Story-adjacent) | `{ actions: tools.map(toElizaAction) }` — `{name, validate, handler, examples}` |

**Reached transitively (build on demand only):** Mastra, LlamaIndex, CrewAI, Google ADK, Pydantic AI, AutoGen/AG2, smolagents, Letta, thirdweb Nebula.
**Skip — not real tool hosts:** Hummingbot (strategy framework), Alexa (intent/slot), Olas (heavyweight FSM, only on bounty).
**Primitive:** define each tool once as `{name, description, Zod, invoke}`; `zod→json-schema` feeds MCP/OpenAI/Anthropic. Descriptions are written FOR THE MODEL. Adapters are pure translation — zero logic.

## Big-kit features (Stripe-tier floor → nice → overkill)

**MUST-HAVE (the floor):**
1. End-to-end type safety + Zod-typed condition encoders (from D14 layouts) + Zod-validated keeper responses.
2. Discriminated-union status on every hook/flow: `idle|connecting|paying|collecting-partials|ready|error|empty` (the ~15s read is first-class; skeletons + determinate progress, not spinners). Ship a `matchCdrStatus()` helper.
3. Out-of-box loading/error/empty/**gate** UX (see checklist) — consumers never hand-roll.
4. Typed **`CdrError`** taxonomy: `WasmNotInitialized`, `ConditionNotMet`, `ReadTimeout`, `OutOfGas`, `PayloadTooLarge`, `KeeperUnavailable`, `WrongNetwork` — each `{ recoverable, suggestedAction }`.
5. **Sandbox/mock mode** (`mode:'mock'|'testnet'`): runs the full flow incl the simulated `collecting-partials` read, no chain/wallet → examples, CI, Storybook.
6. Mock/testing utils: `createMockCdrClient()`, MSW keeper handlers, `@cdr-kit/react/testing`.
7. Retries w/ backoff+jitter on **keeper REST + read polling** (NOT on-chain txs).
8. **Idempotency keys on the keeper REST only** (on-chain already idempotent via nonce + `AlreadyConfigured`).
9. Rate-limit handling (parse `Retry-After`/`ratelimit-*`, auto-backoff, expose budget to agents).
10. Multi-env config keyed by chain/keeper-URL; addresses from `@cdr-kit/contracts`; named presets (`aeneid`,`mock`).

**NICE (after the floor):** `useVaultEvents` (typed log subscription, powers the payment/subscription event log) · `<CdrInspector>` dev panel (in-flight reads, partials counter, keeper requests, decoded config, gas) · optimistic gate flip (`useOptimisticGate`) · pluggable structured logging via `onLog` + redaction (NEVER log plaintext/keys) · cursor pagination + caching for discovery (`useInfiniteVaults`) · versioning + SDK↔deployed-condition compat matrix · live playground.

**OVERKILL/skip:** confidential-compute audit (D11), mainnet multichain machinery, full webhook delivery infra (the chain log is the durable event store for v1), gRPC/GraphQL.

## Loading-state UX checklist (kit ships these so consumers don't)
- Discriminated-union status everywhere (no raw booleans).
- `<VaultGate>` locked→unlocked; CTA matched to WHY locked (wrong network vs not subscribed vs condition unmet).
- Skeletons (`<VaultSkeleton>`, `<VaultListSkeleton>`) not spinners; long read = determinate progress from the partials counter.
- Suspense + `<CdrErrorBoundary>` (with `reset()`→refetch).
- Explicit `<EmptyVaults>` (distinct from loading) + create CTA.
- One-click retry on every error fallback; transient errors auto-retry w/ backoff first.
- `onStatusChange` for consumer toasts ("Payment sent → Collecting access → Unlocked").
- Optimistic gate flip on subscribe (rollback on revert).
- Long-read honesty: never block a sync hot path; progressive, cancelable, visible timeout ceiling, "still working…" past ~10s.
- Mock-mode parity for every state (Storybook/tests render `collecting-partials`/`error`/`empty` on demand).
