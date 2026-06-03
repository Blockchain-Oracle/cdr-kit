# Decision Log (ADR-style)

Append new decisions; don't rewrite history. Each: context → decision → why → status.

## D1 — Product is a toolkit (cdr-kit), not an app
- **Decision:** Build `cdr-kit` = library (condition standard-lib + React + agent SDK) + a dashboard that dogfoods it. Marketplace/secrets are templates, not separate products.
- **Why:** CDR's SDK is raw and ~6 weeks old; no toolkit exists. Stripe/wagmi pattern — win on DX + ecosystem ownership. A standalone marketplace would duplicate `cdr-demo`'s `/marketplace`.
- **Status:** Locked (Abu, 2026-05-28).

## D2 — Wedge reframed: "productize + extend", NOT "first conditions ever"
- **Decision:** Position honestly — cdr-demo already ships ~9 conditions; cdr-kit packages/standardizes them AND adds net-new advanced ones (Subscription, TierGate, Revocable, MultiSig, Composable).
- **Why:** Research found the demo conditions; the "ship the missing 10" framing was partly false and a judge would catch it. Honest wedge is still strong. See `../research/existing-vs-missing.md`.
- **Status:** Locked. Must be reflected in PRD/README/demo narrative.

## D3 — Target the 4-param uuid-first condition interface
- **Decision:** All cdr-kit conditions implement `checkRead/WriteCondition(uint32 uuid, bytes accessAuxData, bytes conditionData, address caller) view`. Verify on-chain (fork test) before deploy.
- **Why:** Official docs/skill show a stale 3-param interface; every deployed demo contract uses the 4-param one. Wrong choice = all txs revert. See `../research/cdr-protocol-truth.md`.
- **Status:** Locked pending on-chain re-verification.

## D4 — Lean on Story IP coupling as the moat
- **Decision:** Advanced conditions integrate Story license tiers + royalty (TierGate reads `getLicenseTermsId`; Subscription routes payment via mint/RoyaltyModule). 
- **Why:** This is what Lit/TACo can't do; it's the only durable differentiator and aligns with Story's narrative. See `../research/competitive-landscape.md` + `story-ip-royalty.md`.
- **Status:** Locked.

## D5 — 2-step pattern for all paid/stateful conditions
- **Decision:** Conditions stay pure `view`; payment/subscribe/revoke/heartbeat are separate mutating fns; the view reads resulting state. Subscription tracks its own `paidUntil` (no native per-token expiry).
- **Why:** A `view` can't transfer or write. Forced by Story/EVM. See `story-ip-royalty.md`.
- **Status:** Locked.

## D6 — Build stack
- **Decision:** pnpm + Turborepo · tsdown (not tsup) · Foundry + @wagmi/cli (not typechain) · Vitest · ESLint flat config `max-lines:400` · lefthook · Changesets + npm OIDC · Node 24 · pragma 0.8.26.
- **Why:** 2026 best practices (researched); satisfies Abu's 400-line + CI/CD + perf requirements. See `../best-practices/`.
- **Status:** Locked (verify fast-moving tsdown flags + npm OIDC setup at scaffold).

## D7 — Research clones in /tmp; vendor key files into context
- **Decision:** Full repo clones stay in `/tmp/cdr-research` (ephemeral); only high-value source files vendored into `../reference/vendored/` to keep the project clean.
- **Why:** Abu wants a clean, self-contained folder; full clones (node_modules/.git) = clutter. See `../reference/repos.md` to re-clone.
- **Status:** Locked.

## D8 — Registration must be factory-only + atomic (fixes vault-hijack)
- **Decision:** Conditions expose `setConfig(uuid, …)` callable **only by the trusted `CdrKitVault` factory** (`onlyVault`, immutable factory addr). Factory does `allocate()` → receives uuid → configures the condition **in the same tx** (the demo's `CDRVaultNFT.createVault` → `WRITE_CONDITION.setCreator(uuid, msg.sender)` pattern, `CDRVaultNFT.sol:177-186`). Every condition `view` must be **revert-safe on an unregistered uuid** (early-return `false`, never revert). Factory-less path = trust-on-first-use, documented + discouraged.
- **Why:** Both reviewers (independently) found `register(uuid,…)` is first-caller-wins; uuids are predictable `uint32`s → an attacker front-runs registration, steals payee/owner, and bricks the victim's vault permanently. Confirmed against vendored `FixedFeeCondition.sol:24-28`.
- **Status:** Locked. E0 fork test must include a negative control ("non-factory cannot configure an allocated uuid").

## D9 — MultiSig uses EIP-712 domain + config epoch (fixes replay)
- **Decision:** Sign EIP-712 typed data with domain `{name, version, chainId, address(this)}` + `Approval(uint32 uuid, address caller, uint64 epoch, uint256 deadline)`. `epoch` bumps on any signer-set change → auto-invalidates old sigs (a `view` can't consume a nonce). Ascending-address dedupe; `ECDSA.tryRecover` (reject 0/malleable-s).
- **Why:** `keccak(uuid, caller)` replays across chains/deployments and forever; removed signers can't be un-signed.
- **Status:** Locked (MultiSig is Phase 2 per D10, but the scheme is fixed now).

## D10 — Scope phased: MVP = 3 net-new conditions
- **Decision:** MVP/demo ships **SubscriptionCondition + TierGateCondition + ComposableCondition** (the three that are net-new AND map to Technical-track criteria verbatim) + `CdrKitVault` + core/react/agent + dashboard + ONE template (data-marketplace). **Phase 2:** TimeLock, Revocable, MultiSig, secrets-vault template, x402 bridge, CLI.
- **Why:** Reviewer flagged 6-conditions+everything as month-scale, not sprint. TimeLock + Revocable-ish already exist in the demo (low novelty); MultiSig carries replay complexity. Deadline isn't a hard constraint (Abu) so Phase 2 is real roadmap, not abandoned — but the build/demo focuses on the 3 that win.
- **Status:** Locked.

## D11 — "Audit log" honestly scoped to payment/subscription events
- **Decision:** Dashboard shows a **payment/subscription event log** (emitted from `subscribe()`/`setConfig()`), NOT a "who-decrypted-what" log. `discover()` reads `CdrKitVault.VaultCreated` events with explicit pagination (bounded block ranges); add a light indexer if free-RPC `eth_getLogs` limits bite.
- **Why:** CDR reads hit the precompile; our `view` condition emits nothing → there is no on-chain "who accessed" signal. Claiming one would be false.
- **Status:** Locked.

## D12 — Subscription payment: two explicit modes
- **Decision:** `register` picks ONE mode: (a) **native-IP** (`subscribe` `payable`, pays `payee`) or (b) **WIP-royalty** (pull WIP via `safeTransferFrom` → `forceApprove(RoyaltyModule)` → route). Never both in one path. CEI + `nonReentrant`; `subscribe(uuid, periods, maxPricePerPeriod)` slippage guard; cap `periods`; check `isWhitelistedRoyaltyToken` at register.
- **Why:** native `msg.value` and WIP-ERC20 royalty are incompatible in one `payable` fn; refund + external royalty call = reentrancy surface.
- **Status:** Locked.

## D13 — Factory↔condition trust model (closes the `onlyVault` spoof)
- **Decision:** `onlyVault` alone is necessary but NOT sufficient — it doesn't prove the calling factory actually allocated the uuid. Three layers, all required:
  1. **`AlreadyConfigured` first-write-wins:** `setConfigFromFactory` reverts if `creator[uuid] != address(0)`. (Independently mandatory — stops re-config even by the legit factory.)
  2. **MVP default — paired deployment:** each condition takes ONE immutable trusted `factory` (its paired `CdrKitVault`). Conditions are a *source-level* standard library, NOT an on-chain multi-tenant service. The demo needs one factory.
  3. ~~Upgrade if OQ7 confirms a getter~~ — **RESOLVED: NOT available.** The CDR `Vault` struct has no owner/allocator field and there's no `vaultOwner` getter (see OQ7 below). So layer 3 is impossible on current CDR; safe registration = layers 1+2 only.
- **Why:** 2nd-round review: a rogue factory (or a registry of trusted factories) could `setConfigFromFactory(victimUuid, attacker, …)` on a uuid it didn't allocate. The "library serves any factory" ambition is unsafe without ownership proof — and CDR provides no such proof, so MVP is paired-single-factory (layer 2).
- **Status:** Locked. Conditions are deployed paired 1:1 with their `CdrKitVault` (immutable `factory`), + `AlreadyConfigured`.

## D14 — `ICdrConfigurable.setConfigFromFactory` is the canonical config entrypoint
- **Decision:** Define `interface ICdrConfigurable { function setConfigFromFactory(uint32 uuid, address creator, bytes calldata config) external; }`. This generic `(uuid, creator, bytes)` form is the ONLY factory-facing config call (so `CdrKitVault` can configure any condition through one interface). Each condition `abi.decode`s `config` into its own params (typed internal helper). Per-condition `config` layouts are fixed:
  - Subscription: `abi.encode(uint256 pricePerPeriod, uint256 period, address payee, uint8 mode, address licensorIpId)`
  - TierGate: `abi.encode(address ipId, uint256[] allowedTermsIds)`
  - Composable: parent config = `abi.encode(uint8 mode, address[] children)`. `childConfigs[]` are a SEPARATE `createVault` param — the factory configures each child for the uuid first (then the parent); the parent stores ONLY `mode + children` (no dead `childData`, R3 fix) and passes `""` as conditionData when staticcalling children.
  - **`creator` is always the explicit `setConfigFromFactory` arg, never inside `config`.** Each condition records `creator[uuid]=creator` and decodes the rest from `config` (so the read-condition `config` layouts above correctly omit creator).
- **Why:** 2nd-round review: E2 called a generic `setConfigFromFactory` while E1 defined typed `setConfig(...)` — they can't both be the factory-facing call; it wouldn't compile, and the `bytes` encoding was undefined (silent `abi.decode` panic risk).
- **Status:** Locked. Decode defensively; bad-length `config` reverts cleanly in `setConfigFromFactory` (it's a trusted-factory call, so revert is fine here — unlike the view path which must return false).

## D15 — MVP write-gating is a fixed creator-only write condition
- **Decision:** The 3 MVP conditions are READ gates. For writes, `CdrKitVault` deploys/uses a fixed **`CreatorWriteCondition`** (generalizes the demo's `VaultWriteCondition`/`setCreator`), configured atomically in `createVault` via `setConfigFromFactory(uuid, creator, "")`. It implements `ICdrConfigurable` and is **subject to the identical layer-1 rules: `onlyVault` + `AlreadyConfigured(creator[uuid]!=0)` + revert-safe `false` on unconfigured uuid** (the demo's `setCreator` overwrites freely — we do NOT copy that). Its `config == ""` (creator comes from the explicit arg). Pluggable/custom `writeConfig` = Phase 2.
- **Why:** 2nd-round review: writes were an unspecified hole on the keystone path; 3rd-round: the write gate must not be asymmetric (re-configurable) vs the read gate.
- **Status:** Locked.

## D16 — Agent kit = tool-distribution layer (not a class)
- **Decision:** The agent kit ships: `@cdr-kit/tools` (declarative `{name, description, Zod schema, invoke}` over `CdrAgent` — the single source of truth; the LLM reads the *description* to decide to call us) + `@cdr-kit/mcp` (one MCP server binary = the universal surface) + **5 native adapters** `vercel-ai` · `langchain` · `openai` (raw JSON-schema `tools[]` + invoke router, also serves Anthropic) · `agentkit` (Coinbase `ActionProvider`) · `goat` (`PluginBase`), + optional `eliza` (Story-adjacent). `zod→json-schema` is the shared primitive (feeds MCP/OpenAI/Anthropic). `CdrAgent` stays the engine.
- **The OpenClaw plugin IS the MCP server** — OpenClaw consumes capabilities as MCP skills (`openclaw mcp set …` / ClawHub). MCP won interop in 2026: one server covers Claude/Cursor/Cline/Goose/Windsurf + OpenClaw + n8n/Zapier/Make + OpenAI Realtime. So no bespoke OpenClaw plugin.
- **Skip (not real tool hosts):** Hummingbot (strategy framework), Alexa (intent/slot, no tool-calling), Olas (heavyweight FSM — only on bounty demand). Mastra/LlamaIndex/CrewAI/ADK/Pydantic-AI/etc. are reached transitively via MCP or the LangChain/OpenAI adapters — build dedicated ones only on demand.
- **Why:** research on Coinbase AgentKit + GOAT form factor + the runtime landscape. A class + script is the engine, not a kit. Ties back to the original CDR+MCP thesis.
- **Status:** Locked.

## D17 — Kit DX must-haves (Stripe-tier, not mediocre)
- **Decision:** Ship the "big-kit" floor: typed **`CdrError` taxonomy** (`WasmNotInitialized`, `ConditionNotMet`, `ReadTimeout`, `OutOfGas`, `PayloadTooLarge`, `KeeperUnavailable`, `WrongNetwork`; each `recoverable` + `suggestedAction`); **discriminated-union status** (`idle|connecting|paying|collecting-partials|ready|error|empty` — the ~15s read is first-class state, skeletons + determinate progress, never a spinner); **Zod-typed** condition encoders/decoders + Zod-validated keeper responses; **mock/sandbox mode** (`mode: 'mock'|'testnet'` runs the whole flow incl the simulated read with no chain/wallet → enables examples/CI/Storybook); **idempotency keys on the keeper REST only** (on-chain is already idempotent via nonce + `AlreadyConfigured`); **retries w/ backoff+jitter** on keeper + read polling (NOT on-chain txs); rate-limit handling; out-of-box loading/error/empty/**gate** UX primitives + optimistic gate. Nice-to-have: `<CdrInspector>` devtool, `useVaultEvents` (over logs), pluggable **redacted** logging (never log plaintext/keys), pagination/caching for discovery, a versioning + SDK↔deployed-condition **compat matrix**, a live playground.
- **Overkill/skip:** confidential-compute "who-decrypted" audit (D11 — CDR can't), mainnet multichain machinery (keep the seam), full webhook delivery infra, gRPC/GraphQL.
- **Why:** research on Stripe/Clerk/Supabase/Resend/Liveblocks/wagmi. CDR twist: the chain is already the idempotency+audit ledger; the slow path is a *read*, not a write.
- **Status:** Locked.

## D18 — Clean refactor, no backward-compat patching
- **Decision:** In active development, refactor/restructure cleanly — rename packages, change APIs, restructure `agent`→`tools`/`mcp`/adapters, introduce `CdrError` at all throw sites. No compat shims, no patch-on-top.
- **Why:** nothing published/locked; clean + professional > patchwork (Abu). Aligns with the system default (no backwards-compat hacks in dev). See [[build-big-no-patching]].
- **Status:** Locked.

## Closed open questions
- OQ1 → **allocateFee = 0** on Aeneid (verified on-chain; read at runtime anyway). Registration fee: still read on-chain in E0.
- OQ2 → **LICENSE_READ_CONDITION = `0xC0640AD4CF2CaA9914C8e5C44234359a9102f7a3`** (live). `0xD429…` (cdr-demo) is NOT deployed.
- OQ3 → flagship = vault-management dashboard (D-PRD).
- OQ4 → own `CdrKitVault` (D-arch Option A), now also mandatory for safe registration (D8).
- OQ5 → agent on-chain native v1; x402 bridge = Phase 2 (D10).

## Closed from the CDR ABI (E0, 2026-05-28 — read `packages/contracts/src/abis/cdr.ts`)
- **OQ6 → RESOLVED: `allocate` does NOT evaluate conditions.** Signature `allocate(bool updatable, address writeCond, address readCond, bytes writeData, bytes readData) payable returns (uint32)` just stores the `Vault` + returns a fresh uuid. Conditions are checked by the precompile only at `write`/`read`. No allocate-time preflight to brick (the demo `CDRVaultNFT` allocates before configuring — proof). The "revert-safe on unconfigured uuid" invariant still matters, but at **write/read** time (the write right after createVault must pass the write condition — `CreatorWriteCondition` gates `caller==creator`, set during createVault → creator writes succeed).
- **OQ7 → RESOLVED: NO vault-owner getter.** `vaults(uint32) view` returns `{updatable, writeConditionAddr, readConditionAddr, writeConditionData, readConditionData, encryptedData}` — **no owner/allocator field**, no `vaultOwner` fn. ⇒ **D13 layer-3 is NOT available on current CDR.** Safe registration = layer-1 `AlreadyConfigured` + layer-2 paired single-factory. Factory-less path = trust-on-first-use only (discouraged). D13 updated.
- Other useful CDR views: `maxEncryptedDataSize()` (inline cap, on-chain), `allocateFee/baseFee/writeFee/readFee`, `vaults(uuid)`, `uuid()` (counter). Events: `VaultAllocated`, `VaultWritten`, `VaultRead`.

## Open only via live testnet (deferred — needs a funded Aeneid wallet)
- OQ8: full encrypt → `write` → `read` → partial-collection → decrypt round-trip (E4 e2e). Needs funded wallet + keeper API + ~7-min read. Not blocking E0/E1 — condition logic is unit-testable locally. Run when a funded testnet key is available.

## D19 — Frontend: one product app (`/` = landing) + separate Fumadocs site; Privy wallet; mock-first
- **Decision:** Ship **two** front-end surfaces:
  1. **`apps/web`** — a single Next.js (App Router) product app. **`/` is the marketing landing page** (the home, non-negotiable — Abu). App routes live under a `(app)` route group: `/marketplace` (browse), `/vault/[uuid]` (detail + access stepper), `/create` (vault wizard), `/seller`, `/buyer`. Marketing chrome (`(marketing)`) vs app chrome (`(app)`) are split via route groups but share one design system + one deploy.
  2. **`apps/docs`** — a **Fumadocs** site (own landing + guides), drawing mem0's card-grid IA. Separate sub-project/brainstorm.
- **Wallet = Privy** (embedded wallets + email/social so a judge can try the demo without their own wallet). Degrades to a mock connect button when `NEXT_PUBLIC_PRIVY_APP_ID` is unset, so the UI is never blocked.
- **Mock-first, live-toggle:** the app runs on `createMockCdrKit` by default (renders the `paying → collecting-partials → ready` stepper in ~2s, fully screenshottable, no funded wallet) and flips to live Aeneid when `NEXT_PUBLIC_CDR_API_URL` + a connected wallet are present. This is what makes a ~7-min-latency protocol demoable + visually verifiable.
- **Headless/premium split (wagmi→RainbowKit):** `@cdr-kit/react` stays light + headless (CSS-vars, no heavy deps); the premium *visual* layer is built in `apps/web` on top of the headless primitives. Do NOT premium-ify the library package. Three light library improvements are in-scope, driven by real dashboard needs: (a) an opt-in default stylesheet `@cdr-kit/react/styles.css`; (b) a historical-discovery hook (paginated `getLogs`, since `useVaultEvents` is watch-only and Browse needs history per D11); (c) thread `onProgress` through `@cdr-kit/core`'s `accessVault` so the live access stepper is determinate, not just indeterminate.
- **Docs tooling = Fumadocs** (over Mintlify/Nextra): Next.js + Tailwind + MDX, in-repo, deploys to Vercel with everything; the premium-ui skill fully applies and live docs can dogfood real `@cdr-kit/react`. mem0's look is the *inspiration*, not the tool.
- **Quality bar:** premium-ui skill for components, layout research + a visual screenshot→anchor→vision-review loop wired day-0, browser-verified before any screen is called done (never from `tsc`). ≤400 lines/file holds in apps too (split screens/components).
- **Why:** Abu's correction (home = landing) + chosen stack (Fumadocs, Privy) + the "best of the best, deadline isn't a constraint" bar. Collapsing landing+app into one deployable app is the pragmatic Stripe-tier shape for the hackathon (marketing front door at `/`, app one click away). Supersedes the earlier "three separate apps (web/dashboard/docs)" sketch and the ux-spec's implicit "Browse = home".
- **Status:** Locked (Abu, 2026-05-28). Full design: `../../docs/superpowers/specs/2026-05-28-cdr-kit-frontend-design.md`.


## D20 — `@story-protocol/core-sdk` is an opt-in peer (via `@cdr-kit/{story,a2a}` in 0.5+)
- **Decision:** Story-IP wrappers (`registerIpAsset`, `mintLicenseTokens`, PILFlavors, derivative registration, WIP wrap/approve, royalty pay/claim) ship in a NEW `@cdr-kit/story` package (0.5) and the A2A helpers ship in `@cdr-kit/a2a` (0.6). Both peer-dep `@story-protocol/core-sdk`. `@cdr-kit/{core,react,react-ui,agent,tools,cli,mcp}` never import the Story SDK directly — keeps the consumer-side bundle small for apps that only consume CDR vaults.
- **Why:** Audit found 12 important gaps around the Story-IP flow (license-mint, royalties, derivatives). Wrapping them is high-value but the dep is heavy (multiple chain ABIs, viem-heavy). Splitting into a separate package lets consumers opt in.
- **Status:** Locked (Abu, 2026-06-01).

## D21 — `timeoutMs` default = 120_000 (was 600_000), aligned to Story CDR SDK docs
- **Decision:** `accessVault`, `downloadFile`, and every consumer of `consumer.accessCDR` default to `timeoutMs: 120_000` (the value the official docs use in every example). The server-side partial-collection cap is 200 blocks ≈ 7 minutes; the kit document this as the worst case but does not block on it by default.
- **Why:** Pre-0.4 default `600_000` was longer than Story expects you to wait; the docs explicitly use `120_000` everywhere and the UX expectation is "tens of seconds typical". Holding the read promise for 10 minutes by default produces a worse UI loop than failing fast + retrying.
- **Status:** Locked (Abu, 2026-06-01). Implemented in `packages/core/src/{flows.ts:40, files.ts:125}`.


## D22 — Add new condition contracts WITHOUT redeploying the CdrKitVault factory
- **Decision:** When shipping the 4 new 0.5 conditions (TimeWindow / DeadManSwitch / ConditionalEscrow / MultiSig), deploy ONLY the condition contracts and bind each via `initialize(EXISTING_VAULT)`. The CdrKitVault factory at `0xac592f165D8dD1f27A087bdB39c0b2f619FF6C8C` stays unchanged. Same pattern for any future condition additions.
- **Why:** The factory's `createVault(readConditionAddr, readConfig, childConditions[], childConfigs[], licenseTermsId)` already accepts any `ICdrConfigurable`. Redeploying the factory would orphan every existing vault (the 5 prior conditions are `initialize`d to this factory address). Architectural review (with no-existing-users constraint lifted, decided purely on merit) concluded no factory change was warranted. The pattern saves ~3M gas and zero existing-user disruption per added condition.
- **Status:** Locked (Abu, 2026-06-01). Implemented in `contracts/script/DeployNewConditions.s.sol` + `contracts/script/RedeployMultiSig.s.sol`.

## D23 — MultiSigCondition has TWO parallel approval paths (off-chain EIP-712 OR on-chain `approve()`)
- **Decision:** `MultiSigCondition.checkReadCondition` evaluates `onChainCount >= threshold || offChainSigsPass`. Off-chain path: signers produce EIP-712 sigs out-of-band, buyer submits `accessAuxData = abi.encode(deadline, sigs[])` at read time (zero per-signer gas). On-chain path: signers call `approve(uuid)` (~50k gas each), dashboard reads `currentApprovalsCount(uuid)`. Both paths share the same signer set + threshold + `epoch`. `rotateSigners` bumps `epoch` — invalidates BOTH (off-chain sigs replay-checked on epoch; on-chain approvals keyed at `hasApproved[uuid][epoch][signer]` so prior-epoch storage no longer counts).
- **Why:** Initial 0.5 ship was off-chain-only — gas-optimal, but breaks the dashboard-truth UX every other multisig product (Safe, Gnosis) sets the expectation for. Research found no CDR-specific reason for off-chain-only; piplabs's own demo conditions are statefully heavy (`WhitelistCondition`, `DataMarketplace` both store per-buyer state). Code review (2026-06-01) confirmed the additive on-chain path is safe, low-cost (≈30 LOC + redeploy). Keeping off-chain as a parallel path preserves the gas-free option for orgs that want it.
- **Status:** Locked (Abu, 2026-06-01). Redeployed MultiSigCondition to `0x61061CCb8BD4C9E0AfF67ed4d2226f0Fc140FB87`; prior `0xb22EBF…fB78` retired.

## D24 — Storage ecosystem adapters use Function-indirection dynamic import to hide optional peer-dep specifiers from bundlers
- **Decision:** `createS3Storage`, `createStorachaStorage`, `createHeliaStorage` lazy-load their respective SDKs (`@aws-sdk/client-s3`, `@storacha/client`, `helia` + `@helia/unixfs`) via `new Function("specifier", "return import(specifier)")` rather than a literal `await import("@aws-sdk/client-s3")`. The pattern is reused across all 3 adapters in `packages/core/src/storage-ecosystem.ts`. Adapters throw a tagged "install X" CdrError if the SDK isn't present at runtime; consumers list whichever SDKs they need in their own `pnpm add`.
- **Why:** Vite/Rollup statically analyze `await import("…")` and try to resolve the specifier at build time. With `peerDependenciesMeta` optional, the SDKs aren't installed in every consumer environment — the static resolution fails and breaks the whole package's build (we hit this in `@cdr-kit/react`'s vitest pipeline). Hiding the specifier inside `new Function` defeats the static analysis; runtime resolution still works against the consumer's `node_modules`. Cost: 1 LOC of indirection, no measurable runtime overhead, no functional change.
- **Status:** Locked (Abu, 2026-06-01). Implemented in `packages/core/src/storage-ecosystem.ts:13-16`; same pattern should be used in any future ecosystem adapter that lazy-loads an optional SDK.

## D25 — OpenCondition must inherit `ConditionBase` AND keep checkRead/Write unconditionally `true`
- **Decision:** `OpenCondition` inherits from `ConditionBase` (providing `setConfigFromFactory`) so the cdr-kit factory's `_configure` step succeeds, but `checkReadCondition` / `checkWriteCondition` return `true` regardless of `_configured(uuid)`. Both paths must work: factory-routed `CdrKitVault.createVault(openCondition, "0x", …)` (configured uuid) AND raw `CdrSDK.allocate(openCondition, "0x")` used by `uploadFile()`'s `cdr.uploader.uploadFile` (unconfigured uuid). Redeployed to `0x78528c2dd16fc450ff417189cc0436e8d2d82389` (2026-06-03); prior 0.7.1-rc deployments `0x36fB2e…` (no ConditionBase → factory revert) and `0x37f47bd…` (gated on `_configured` → uploadFile revert) retired.
- **Why:** First redeploy fixed the factory path but broke the SDK-direct path because the new `_configured(uuid)` gate fails for any vault allocated outside the factory. `uploadFile()` deliberately bypasses the factory (the SDK owns vault allocation for file uploads), so OpenCondition has to admit both paths. Making `checkRead/Write` `pure` + `return true` is the always-allow semantic the name implies — config storage just satisfies the factory's symbol probe.
- **Status:** Locked (Abu, 2026-06-03). See `contracts/src/conditions/OpenCondition.sol`. The Solidity contract is the source of truth; addresses.ts and SDK code consume it.

## D26 — `downloadFile` accepts `skipCidVerification` for non-IPFS storage handles
- **Decision:** `packages/core/src/files.ts:downloadFile` accepts `skipCidVerification?: boolean` and forwards it to the CDR SDK's `consumer.downloadFile`. Callers using Supabase paths, S3 keys, or any non-CIDv1 storage handle MUST pass `skipCidVerification: true` because the SDK's default integrity step calls `multiformats CID.parse(cid)` and throws "must provide multibase decoder" for arbitrary path strings. IPFS-shaped storages (memory, Pinata, Storacha, Helia, gateway) keep the default `false` and get the integrity check.
- **Why:** The SDK's `consumer.downloadFile` was designed assuming the "cid" field is a real IPFS CIDv1. The 0.5 storage abstraction allowed the `cid` slot to be any string (e.g., Supabase's bucket-relative path), but the integrity step still tried to parse it. The check is genuinely useful for IPFS so we keep it default-on; the opt-out is the minimal change that unblocks Supabase/S3 without weakening IPFS guarantees.
- **Status:** Locked (Abu, 2026-06-03). Verified live: Supabase (uuid 5666, 4136 bytes), S3-via-Supabase (uuid 5668, 2076 bytes), in-memory CIDv1 verify path (uuid 5669, 2080 bytes).
