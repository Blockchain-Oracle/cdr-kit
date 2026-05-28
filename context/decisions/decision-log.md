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
