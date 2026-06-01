# @cdr-kit/goat

## 0.4.0

### Minor Changes

- **0.4.0 — drop-in agent kit (CLI + multi-skill plugin + auto-wallet + multi-network) + critical CDR gaps fixed.**

  ### New: `@cdr-kit/cli` (the `cdr` binary)

  `npm i -g @cdr-kit/cli` ships a `cdr` binary with 17 commands. One shared core powers all three surfaces:
  - **CLI**: `cdr wallet / vault / subscribe / access / access-license / fund / fees / discover / subscriptions / config / tools / skill install`
  - **MCP server**: `cdr mcp` (stdio JSON-RPC); same binary works for `claude mcp add cdr-kit npx @cdr-kit/mcp`
  - **Skill installer**: `cdr skill install` copies the multi-skill plugin to `~/.claude/skills/cdr-kit/`

  ### Auto-wallet on first run

  No more "bring your own private key". The CLI/MCP auto-generates a viem private key on first run, persists it at `~/.config/cdr-kit/wallet.json` (chmod 600, resolved cross-platform via `env-paths`), and prints address + faucet URL to stderr. Env override `CDR_PRIVATE_KEY` (the legacy `PRIVATE_KEY` is honored with a deprecation warning for 0.4; removed in 0.5).

  ### Multi-network config

  `CDR_NETWORK=aeneid|mainnet` env + `--network` CLI flag. `mainnet` is stubbed (addresses `null`, throws "not yet deployed" clearly); flipping to populated addresses is a one-line change when Story mainnet launches. `@cdr-kit/contracts` now exports `networks` + `resolveAddresses(network)`.

  ### MCP server: 3 tools → 13

  The MCP server (and every framework adapter — Vercel AI / OpenAI / LangChain / AgentKit / GOAT) now exposes 13 tools across discover+read, introspection (view-only), and author/publish groups. Agents now have agents-as-publishers + agents-as-budget-managers, not just agents-as-readers.

  ### New: `cdr-kit` Claude Code plugin (5 skills)

  `packages/plugin/cdr-kit/` ships as a marketplace-installable plugin. 5 SKILL.mds (design-condition, wire-allocate-pay-read, debug-cdr-precompile, audit-vault-config, explain-cdr-error), each ≤120 lines (well under Anthropic's 500-line cap), with depth in `references/`.

  ### `@cdr-kit/core` correctness fixes (audit-driven)

  5 new typed errors + `mapSdkError()` helper. **`timeoutMs` default 600_000 → 120_000** aligned to Story docs. `createCdrKitClient({ network })` — network-aware address resolution.

  ### `@cdr-kit/contracts` — 5 missing addresses + mainnet stub + networks helper

  `royaltyWorkflows`, `registrationWorkflows`, `merc20`, `royaltyPolicyLap`, `dkg`. Plus `mainnet` placeholder + `networks` map + `resolveAddresses()`.

  ### `@cdr-kit/mcp` — collapsed to ~20 LOC wrapper

  Thin re-export of `createMcpServer` + `loadOrCreateWallet` from `@cdr-kit/cli`. Single source of truth across both bins.

  ### Documentation drift fixed (audit-driven)
  - `CLAUDE.md` — corrected misleading "~15s read latency" claim
  - `context/research/cdr-protocol-truth.md` — new observer/fees section, minThresholdRatio note, 5 new addresses
  - `context/decisions/decision-log.md` — D20 (Story SDK opt-in peer) and D21 (timeoutMs aligned to docs)
  - `docs/ux-spec.md` — access stepper aligned to 120_000ms + retry guidance
  - apps/site: new `/docs/cli` + `/docs/skill`; `/docs/agent-kit/mcp` updated to list 13 tools

  Coupled-minor across all 13 packages + `create-cdr-kit-app` + new `@cdr-kit/cli`. No breaking changes.

### Patch Changes

- Updated dependencies
  - @cdr-kit/agent@0.4.0
  - @cdr-kit/tools@0.4.0

## 0.3.0

### Minor Changes

- **`@cdr-kit/react-ui`** — adopt `@radix-ui/react-popover` for the `<UnlockablePill>` floating card. Closes a11y gaps in the previous custom implementation: full focus trap inside the open card, focus returns to the pill on close, ARIA Dialog roles, robust outside-click + escape handling. Mobile bottom-sheet behavior preserved via CSS.

  New peer dependency: `@radix-ui/react-popover >=1.1.0`.

  The `UnlockablePill` API is unchanged; `useFloatingCard` is removed (was an internal hook, no documented consumers).

  **`create-cdr-kit-app`** — 7 new templates (now 9 total):
  - `blog` — Next.js 16 + UnlockablePill (the onscroll pattern). Three live pills out of the box.
  - `paywall` — Next.js single-page SubscribeButton gating a content block.
  - `mcp-server` — stdio MCP server for Claude Desktop / Cursor. Ships with `claude_desktop_config.json`.
  - `agent-vercel-ai` — Vercel AI SDK chatbot wired to CDR tools.
  - `agent-openai` — Raw OpenAI / Anthropic tool-calling loop.
  - `agent-langchain` — LangChain ReAct agent.
  - `agent-agentkit` — Coinbase AgentKit action provider.
  - `agent-goat` — GOAT SDK tool set.

  Invoke: `npm create cdr-kit my-app -- --template <name>`. Each template is mock-runnable out of the box (no wallet, no chain); README walks through going live on Aeneid.

  Coupled-minor bump across all 12 cdr-kit packages plus `create-cdr-kit-app` so consumers see a single 0.3.0 matrix.

### Patch Changes

- Updated dependencies
  - @cdr-kit/agent@0.3.0
  - @cdr-kit/tools@0.3.0

## 0.2.0

### Minor Changes

- Add `<UnlockablePill>` — an inline "free to read, pay to unlock" paywall component (the onscroll.app pattern), driven by Story CDR.

  **New exports**
  - `@cdr-kit/react` — `Unlockable`, `useUnlockable`, `UnlockableMode`, `UnlockableRenderState`, `UnlockableProps`, `UnlockableSubscribeParams`, `UseUnlockableProps`
  - `@cdr-kit/react-ui` — `UnlockablePill`, `UnlockableCard`, `unlockedAuto`, `useFloatingCard`, `FloatingPos`, `UnlockablePillProps`, `UnlockableCardProps`

  **What it does**
  - Wrap any inline anchor in a `<UnlockablePill uuid={...} priceLabel="5 $IP">…</UnlockablePill>`. Click opens a floating card that runs the full subscribe → threshold-read → decrypt flow against the named CDR vault.
  - The anchor text stays plaintext (it's a public teaser). The encrypted payload — image, file, hidden prose — only enters the DOM after a successful read. Default renderer auto-detects PNG/JPEG/WebP/GIF/UTF-8 and falls back to a download link.
  - Below 560px the popover collapses to a bottom-sheet automatically.
  - Headless mode: `useUnlockable({ uuid })` exposes the full state machine for fully-custom UI.

  No breaking changes. All existing components and hooks work unchanged. New peer dep on `react-dom >=18` for `react-ui` (already a transitive peer of `react`).

  Coupled-minor across all 12 cdr-kit packages plus `create-cdr-kit-app` to keep the matrix consistent with `0.2.0`.

### Patch Changes

- Updated dependencies
  - @cdr-kit/agent@0.2.0
  - @cdr-kit/tools@0.2.0

## 0.1.0

### Minor Changes

- Initial public release (0.1.0) of cdr-kit — the developer toolkit for Story Confidential Data Rails: deployed condition contracts, a typed core SDK (`@cdr-kit/core`), React hooks + components (`@cdr-kit/react`), an autonomous agent client (`@cdr-kit/agent`) with framework adapters (Vercel AI / OpenAI / LangChain / AgentKit / GOAT) and an MCP server, plus a project scaffolder (`create-cdr-kit-app`).

### Patch Changes

- Updated dependencies
  - @cdr-kit/agent@0.1.0
  - @cdr-kit/tools@0.1.0
