# @cdr-kit/langchain

## 0.5.0

### Minor Changes

- cdr-kit 0.5.0 — advanced conditions, Story IP creator surface, storage backends, dashboard expansion.

  **4 new condition contracts** deployed to Aeneid (bound to existing `CdrKitVault` factory `0xac592f…`, no factory redeploy):
  - `TimeWindowCondition` (`0x67911435…`) — read-allowed inside `[startTs, endTs]`; supports release-on-date, limited window, and block-based modes.
  - `DeadManSwitchCondition` (`0x37226f97…`) — auto-unlock to heir(s)/public if creator stops `poke()`-ing within `duration`. Optional `creatorCanReadWhileLocked` + `publicAfterUnlock`.
  - `ConditionalEscrowCondition` (`0x7fcDe02D…`) — buyer `pay()` → `confirmDelivery()` → seller paid + buyer reads. Optional arbiter + seller-side `claimAfterTimeout`. Refunds excess `msg.value` in-tx.
  - `MultiSigCondition` (`0x3A0Cf72f…`) — N-of-M with **two parallel approval paths**: off-chain EIP-712 sigs (gas-free; submitted as `accessAuxData`) OR on-chain `approve(uuid, expectedEpoch)` (Safe-style; signers pay gas; dashboards read `currentApprovalsCount`). Either path reaching threshold passes. `rotateSigners` bumps `epoch` — invalidates BOTH paths in one call. **First-of-kind dual-path in the CDR ecosystem.**

  **New `@cdr-kit/story` package** wrapping `@story-protocol/core-sdk` for the full IP-asset creator flow:
  - `registerIpAsset`, `mintAndRegisterIp`, `registerPilTerms(PILFlavors)`, `attachLicenseTerms`, `mintLicenseTokens`, `registerDerivative`, `wrapIp`, `approveWip`.
  - `CdrAgent.publish({ data, priceWei, flavor })` one-shot: register IP + attach commercial PIL terms + create license-gated CDR vault + write encrypted secret. The agent-as-publisher wedge.

  **3 ecosystem storage adapters** (lazy-load their SDKs via `new Function("s", "return import(s)")` indirection so Vite/Rollup don't try to statically resolve optional peer deps): `createPinataStorage`, `createSupabaseStorage`, `createS3CompatibleStorage` (R2/S3 compatible).

  **Dashboard expansion** (`@cdr-kit/react`):
  - 5 new components: `<HeartbeatTimer>`, `<TimeWindowBadge>`, `<MultiSigApprovalTracker>`, `<EscrowDeliveryConfirm>`, `<StorageBackendPicker>`.
  - 7 new hooks: `useDeadManTimer`, `useTimeWindowState`, `useMultiSigStatus`, `useEscrowState`, `useStorageBackend`, `useApproveMultiSig`, `useRotateMultiSigSigners` + Story IP hooks (`useStoryClient`, `useRegisterIp`, `useMintLicenseToken`, `useAttachLicenseTerms`, `usePublish`).
  - `<Vault>` compound + `<VaultGate>` extended with new states (`window-closed`, `awaiting-approvals`, `escrow-pending`).

  **Agent surface widened**: 13 → 34 MCP tools, 17 → 25 CLI commands, 5 → 11 Claude Code skills. All new surfaces ship with matching docs pages at cdr-kit.dev (`/docs/contracts/{time-window,dead-man-switch,conditional-escrow,multi-sig}`, `/docs/components/{heartbeat-timer,…}`, `/docs/hooks/{use-dead-man-timer,…}`, `/docs/story`, `/docs/storage`, updated `/docs/cli` + `/docs/agent-kit/mcp`).

  **Correctness + DX fixes**:
  - `timeoutMs` default 600_000 → 120_000 (matches Story CDR docs ceiling).
  - 5 typed SDK errors mapped: `LABEL_MISMATCH`, `CONTENT_SIZE_EXCEEDED`, `CID_INTEGRITY`, `INVALID_CONDITION_CONTRACT`, `WALLET_CLIENT_REQUIRED`.
  - 5 missing addresses added to `@cdr-kit/contracts`: `royaltyWorkflows`, `registrationWorkflows`, `merc20`, `royaltyPolicyLap`, `royaltyPolicyLrp`.
  - `INLINE_LIMIT_BYTES` now reads `CDR.maxEncryptedDataSize()` at runtime instead of hardcoding 1024.
  - `useDiscoverVaults` event-decode no longer crashes on partial decodes (`Number(undefined) === NaN` latent bug).
  - MultiSig on-chain `approve` requires `expectedEpoch` arg — guards against in-flight `rotateSigners` binding approval to a signer set the signer didn't see (reverts `EpochChanged(expected, current)`).

  **Architectural decisions** logged in `context/decisions/decision-log.md`: D22 (dual-path MultiSig), D23 (storage adapter lazy-load pattern), D24 (no factory redeploy when adding conditions).

  **Live on Aeneid (chain 1315)** — all 4 conditions verified end-to-end via forge tests (110/110), TS agent layer (`packages/agent/scripts/e2e_multisig_new.ts`), and live MCP tool calls (`cdr_create_time_window_vault` → uuid 4874, `cdr_create_dead_man_vault` → 4875, `cdr_create_escrow_vault` → 4876, MultiSig approve+EpochChanged → 4880).

  Breaking: `MultiSigCondition.approve(uint32)` → `approve(uint32, uint64 expectedEpoch)`. The TS helper `CdrAgent.approveMultiSig(uuid, expectedEpoch?)` defaults to reading current epoch from `getConfig` so callers don't have to change unless they want the explicit fail-fast bind.

### Patch Changes

- Updated dependencies
  - @cdr-kit/agent@0.5.0
  - @cdr-kit/tools@0.5.0

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
