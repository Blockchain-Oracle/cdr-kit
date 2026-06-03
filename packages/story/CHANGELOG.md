# @cdr-kit/story

## 0.7.2

### Patch Changes

- chore: republish all packages with v2 banner.svg on npmjs.com

  The README banner at the top of every package was updated in 23b7a48 from the v1 wordmark `<picture>` element to the new v2 `banner.svg` hosted at https://raw.githubusercontent.com/Blockchain-Oracle/cdr-kit/main/assets/banner.svg. This patch republish ships the updated README into the npm tarballs so package detail pages on npmjs.com show the new branded banner.

  No source code or API surface changes — README/asset-only republish.

- Updated dependencies
  - @cdr-kit/contracts@0.7.4

## 0.6.0

### Minor Changes

- cdr-kit 0.5.2 — friendly contract-revert decoding, CLI auto-wait-for-receipt, real-SPG IP creation.

  **Decode gap fix** (closes `cli-error-decode-gap` from the 0.6.x backlog):
  - NEW `decodeContractRevert(err)` + `writeWithDecode(wc, params)` exported from `@cdr-kit/core`. Walks viem's error chain for `ContractFunctionRevertedError`, pulls `errorName + args` from the contract's ABI, formats a one-line message: `"EpochChanged(expected=0n, current=1n)"`.
  - All 7 `walletClient.writeContract` calls in `@cdr-kit/agent`'s advanced helpers (approve/poke/pay/confirm/claim-timeout/refund/rotate) + the 2 in `@cdr-kit/core`'s flows (createVault, subscribeAndAccess) now go through `writeWithDecode`. CLI's `friendlyError()` also calls `decodeContractRevert` on direct viem reverts so chain calls outside the agent helpers (e.g. `cdr subscribe` against a non-subscription vault) also decode.
  - Both CLI and MCP get the friendly message for free since both share the agent layer. Verified live: `cdr multi-sig approve 4908 --expected-epoch 0` now prints `error: EpochChanged(0n, 1n)` instead of viem's 20-line wall-of-text.

  **Race fix** (closes `cli-post-tx-read-race`):
  - NEW `okTx(agent, txHash, extra?)` helper in `@cdr-kit/cli` that `waitForTransactionReceipt({ confirmations: 1 })` before printing. Output now includes `{txHash, blockNumber, status, ...extra}`.
  - Every CLI action that returns a tx hash uses `okTx` instead of `ok({txHash})` (15 sites in cli-advanced.ts).
  - Eliminates the rotate→approve and pay→confirm races that bit users chaining commands. Verified: `cdr multi-sig rotate 4908` immediately followed by `cdr multi-sig approve 4908 --expected-epoch 2` now succeeds first try (rotate landed at block 19056000, approve at 19056005 — no manual sleep needed).
  - MCP stays non-blocking (LLM batching), but the decoded EpochChanged from the first fix tells the LLM exactly what to retry.

  **Real-SPG IP creation** (eliminates 0x0 zero-address dodges):
  - NEW `createSpgCollection` in `@cdr-kit/story` (wraps Story SDK's `nftClient.createNFTCollection`).
  - NEW `agent.createSpgCollection({...})` method on `CdrAgent`.
  - NEW `cdr ip create-collection` CLI subcommand.
  - Verified live: `cdr ip create-collection --name "..." --symbol "..."` deployed real SPG `0x694A8c3937…`; `cdr ip register --spg <real>` returned real ipId `0x3A4FDA09…`; `cdr ip attach-terms` succeeded against the real IP + terms 2536.

  **Workspace gate:** build (16/16), typecheck (23/23), lint (16/16), test (21/21) all green.

  Touched: 8 files across @cdr-kit/{core, agent, story, cli}. Live-verified all 3 fixes against the deployed Aeneid contracts.

## 0.5.1

### Patch Changes

- cdr-kit 0.5.2 — fix Story IP commands silently failing with `transport is null`.

  **Bug:** `createStoryClient` in `@cdr-kit/story` was passing `transport: undefined` to `StoryClient.newClientUseAccount`. Every Story IP CLI command (`cdr ip register|attach-terms|mint-license|register-derivative|wrap-ip|approve-wip`), every agent helper (`agent.publish`, `agent.registerIpAsset`, etc.), and every React hook (`useStoryClient`, `usePublish`, `useRegisterIp`, etc.) immediately failed with:

  ```
  error: transport is null, please pass in a valid RPC Provider URL as the transport.
  ```

  The SDK does NOT auto-derive a transport from `chainId` (as some viem clients do) — it requires an explicit `http()` transport.

  **Fix:**
  - `@cdr-kit/story` — `createStoryClient` now builds `http(opts.rpcUrl ?? STORY_AENEID_RPC_URL)` by default; new `STORY_AENEID_RPC_URL` constant exported.
  - `@cdr-kit/agent` — `loadStory` now passes `rpcUrl: addrs.rpcUrl` from the resolved network addresses.
  - `@cdr-kit/react` — `useStoryClient` now passes `rpcUrl: walletClient.chain?.rpcUrls.default.http[0]` from the connected wagmi chain.

  **Verified live:** After patching, `cdr ip wrap-ip` and `cdr ip approve-wip` landed real on-chain txs (`0x2fc86ff857…` and `0xcb185384a6…`); `cdr ip register|attach-terms|mint-license|register-derivative` all reach the chain and surface clean SDK-decoded protocol errors ("The IP with id 0x… is not registered.") instead of the client-side transport crash.

  Caught during the exhaustive 37-command CLI sweep (Abu's "run them all" pass on 2026-06-02).

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
  - @cdr-kit/contracts@0.5.0
