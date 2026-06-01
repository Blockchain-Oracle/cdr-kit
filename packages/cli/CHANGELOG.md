# @cdr-kit/cli

## 0.4.1

### Patch Changes

- **0.4.1 — fix `cdr skill install` from npm installs**

  The 0.4.0 release shipped `cdr skill install` looking for the cdr-kit plugin at workspace-relative paths that don't exist in a published install. Two fixes:
  1. The plugin (`packages/plugin/cdr-kit/`) is now copied into `@cdr-kit/cli`'s `plugin/cdr-kit/` directory at build time (new `scripts/copy-plugin.mjs`) and shipped inside the published tarball.
  2. The runtime lookup in `cli.ts` now correctly resolves to `<pkg>/plugin/cdr-kit` (was `<workspace>/plugin/cdr-kit` — wrong path-math from `dist/index.mjs`).

  `@cdr-kit/mcp` gets a patch only to repin its `@cdr-kit/cli` dep to `^0.4.1`.

  No behavior change to any other tool or command.

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
  - @cdr-kit/core@0.4.0
  - @cdr-kit/contracts@0.4.0
  - @cdr-kit/agent@0.4.0
  - @cdr-kit/tools@0.4.0
