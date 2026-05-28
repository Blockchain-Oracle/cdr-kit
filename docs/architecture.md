# cdr-kit — Architecture

> Specs depend on `../context/` for ground truth (CDR interface, addresses, Story IP mechanics, build stack). This doc = *what we build and how the pieces fit*; options + tradeoffs are called out, with the chosen default and rationale.

## 1. System shape

```
                         ┌───────────────────────────────────────────────┐
   developer    ─────►   │  @cdr-kit/react  (<CdrProvider> <VaultGate> …)  │
   (consumer)            └───────────────┬───────────────────────────────┘
                                         │ uses
   AI agent     ─────►   ┌───────────────▼──────────┐     ┌──────────────────────┐
                         │  @cdr-kit/core (TS SDK)    │────►│ @cdr-kit/contracts    │
                         │  CDRClient wrap, encoders, │     │ (wagmi-cli bindings:  │
                         │  2-step flows, IPFS, wasm  │     │  ABIs+addrs+hooks)    │
                         └───────────────┬────────────┘     └──────────┬───────────┘
   @cdr-kit/agent ───────────────────────┘                            │ targets
   (own wallet:                                                       ▼
    discover→pay→access)                          ┌─────────────────────────────────────┐
                                                  │ Story Aeneid L1 (chain 1315)          │
   apps/dashboard (Next.js, flagship)  ──────────►│  CDR precompile 0xCCcc…0005           │
   + templates (marketplace, secrets)             │  CdrKitVault (our factory)            │
                                                   │  Condition standard library (ours)    │
                                                   │  Story IP: Registry/Licensing/Royalty │
                                                   └─────────────────────────────────────┘
```

## 2. Monorepo layout (decision D6: pnpm + Turborepo)

```
story-cdr/
├─ contracts/                       # Foundry. pragma 0.8.26
│  ├─ src/
│  │  ├─ interfaces/ICdrCondition.sol      # the 4-param read/write interface
│  │  ├─ base/ConditionBase.sol            # per-uuid creator registry + guards (shared)
│  │  ├─ conditions/
│  │  │  ├─ TimeLockCondition.sol
│  │  │  ├─ SubscriptionCondition.sol
│  │  │  ├─ RevocableCondition.sol
│  │  │  ├─ TierGateCondition.sol
│  │  │  ├─ MultiSigCondition.sol
│  │  │  └─ ComposableCondition.sol
│  │  └─ CdrKitVault.sol                   # generalized vault factory (optional but recommended)
│  ├─ test/{unit,fork,invariant}/
│  └─ script/Deploy.s.sol
├─ packages/
│  ├─ contracts/   @cdr-kit/contracts      # generated.ts (ABIs/addresses/hooks) — pure TS
│  ├─ core/        @cdr-kit/core           # SDK
│  ├─ react/       @cdr-kit/react          # provider/components/hooks
│  └─ agent/       @cdr-kit/agent          # autonomous client
├─ apps/dashboard/                         # Next.js + templates
├─ context/  docs/                         # knowledge base + specs
```
Each source file ≤ 400 lines (ESLint `max-lines`; Solidity files kept small by one-condition-per-file). Stack details + configs: `../context/best-practices/`.

## 3. Condition standard library (the core technical-track artifact)

Common interface (target the **4-param uuid-first** shape — `../context/research/cdr-protocol-truth.md`; re-verify on-chain via fork test before deploy):

```solidity
interface ICdrCondition {
    function checkReadCondition(uint32 uuid, bytes calldata accessAuxData, bytes calldata conditionData, address caller) external view returns (bool);
    function checkWriteCondition(uint32 uuid, bytes calldata accessAuxData, bytes calldata conditionData, address caller) external view returns (bool);
}
// D14: the ONLY factory-facing config entrypoint. Generic (uuid, creator, bytes) so CdrKitVault configures any condition uniformly.
interface ICdrConfigurable {
    function setConfigFromFactory(uint32 uuid, address creator, bytes calldata config) external; // onlyVault; each condition abi.decodes `config` into its typed params
}
```
Per-condition `config` layout (D14): Subscription `abi.encode(uint256 pricePerPeriod,uint256 period,address payee,uint8 mode,address licensorIpId)` · TierGate `abi.encode(address ipId,uint256[] allowedTermsIds)` · Composable `abi.encode(uint8 mode,address[] children)` (child configs are a SEPARATE `createVault` param applied to each child by the factory — NOT stored in the parent). **`creator` is always the explicit arg, never inside `config`:** each condition records `creator[uuid]=creator` and decodes the rest from `config`.
**Invariant 1 (D5): conditions are pure `view`.** All payment/state mutation lives in separate functions; the view only reads results. Per-vault state keyed by `uint32 uuid`.

**Invariant 2 (D8/D13/D14): configuration is factory-only + atomic + single-write, and every `view` is revert-safe on an unconfigured uuid.** No permissionless `register()` (front-running brick). Each condition exposes `setConfigFromFactory(uuid, creator, bytes config)` (`onlyVault`); `CdrKitVault` calls `allocate()` then `setConfigFromFactory()` in the SAME tx (the demo's `setCreator` pattern). **Three-layer anti-spoof (D13):** (1) `AlreadyConfigured` — reverts if `creator[uuid]!=0` (first-write-wins); (2) MVP = one immutable trusted factory per condition (source-level library, not on-chain multi-tenant); (3) if E0/OQ7 confirms a `CDR.vaultOwner(uuid)` getter, also assert `vaultOwner(uuid)==msg.sender` → safely multi-factory. Every `checkRead/WriteCondition` returns `false` for an unconfigured uuid — never reverts (so `allocate()`'s preflight staticcall can't be bricked and Composable/`OR` stays clean). `setConfigFromFactory` itself MAY revert on bad-length `config` (trusted-factory call).

| Contract | Mutating fns | `view` gate reads | New vs demo |
|---|---|---|---|
| `TimeLockCondition` | `register(uuid, start, end)` | `start ≤ now ≤ end` (end 0 = open) | packaged+tested version of demo's TimeBased |
| `SubscriptionCondition` | `register(uuid, pricePerPeriod, period, payee\|royalty)`, `subscribe(uuid, periods) payable`, `renew` | `paidUntil[uuid][caller] > now` | **NEW** (demo FixedFee is pay-once; no native per-token expiry → we track `paidUntil`) |
| `RevocableCondition` | `register(uuid, initial[])`, `grant`, `revoke` | `allowed[uuid][caller] && !revoked[uuid][caller]` (optionally `&& !LicenseToken.isLicenseTokenRevoked`) | **NEW** (explicit revoke + license-revoke awareness) |
| `TierGateCondition` | `register(uuid, ipId, allowedTermsIds[])` | from `accessAuxData` tokenId: `LicenseToken.ownerOf==caller && licensorIpId==ipId && template==PIL && getLicenseTermsId ∈ allowed && !revoked` | **NEW** — the Story-IP moat (D4) |
| `MultiSigCondition` *(Phase 2)* | `setConfig(uuid, signers[], threshold)` | EIP-712 sigs (domain `{name,version,chainId,address(this)}` + `Approval(uuid,caller,epoch,deadline)`) from `accessAuxData`; ascending-address dedupe; unique approvers ≥ threshold | **NEW** — epoch bumps on signer change → auto-invalidates old sigs (D9) |
| `ComposableCondition` | `setConfig(uuid, AND\|OR, address[] children, bytes[] childData)` | staticcall each child `checkReadCondition` (`try/catch` → failed child = `false`); AND/OR; per-child `accessAuxData` slices; **maxChildren ≤ 8 + maxDepth cap (reject Composable-of-Composable in v1)** | **NEW** — composability (Technical-track criterion verbatim) |

**Scope phasing (D10):** MVP/demo = **SubscriptionCondition + TierGateCondition + ComposableCondition** (net-new AND map to track criteria). Phase 2 = TimeLock, Revocable, MultiSig (TimeLock + Revocable-ish already exist in the demo → low novelty; MultiSig carries the replay complexity).

`ConditionBase` holds `mapping(uint32 => address) creator`, the immutable `factory` addr + `onlyVault` modifier, and `AlreadyConfigured`/`NotVault` errors so each condition stays small. Children must be pre-configured for the same uuid before Composable references them. Custom errors over require-strings. **Defensive decode:** `abi.decode` PANICS on bad input and can't be caught inline → decode `accessAuxData` via a `this.`-external `try/catch` helper so malformed input deterministically returns `false`, never an opaque precompile revert.

## 4. CdrKitVault — the vault factory (Option chosen: A)

Generalizes the demo's `CDRVaultNFT` (vendored): instead of hardcoding license-gated read + a default non-commercial PIL term, it takes a **pluggable read condition** from our standard library + a **fixed creator-only write condition** (D15; writes are not pluggable in MVP) + a **configurable PIL terms id**, then **atomically in one tx**: mint ERC721 → `IPAssetRegistry.register` → `CDR.allocate(false, writeCond, readCond, "", "")` → **for a Composable read condition, configure each child for `uuid` first**, then `readCondition.setConfigFromFactory(uuid, msg.sender, readConfig)` + `writeCondition.setConfigFromFactory(uuid, msg.sender, "")` (D14; closes the front-running window, D8/D13) → `attachLicenseTerms`. Stores `tokenId↔uuid↔ipId↔creator↔termsId`. The factory address is constructor-injected into each condition (`onlyVault`); all addresses (incl. `LicenseToken`) constructor-injected, never hardcoded. `setConfigFromFactory` enforces `AlreadyConfigured` (single-write) and, if OQ7 confirms it, `vaultOwner(uuid)==msg.sender`.

- **Option A (chosen): ship CdrKitVault factory.** One-tx vault creation, a headline contract, clean dashboard UX. Cost: more Solidity + tests.
- **Option B (rejected as default): no factory** — SDK orchestrates allocate + IP-register as separate txs. Less Solidity but loses atomicity + a strong artifact. Kept as the SDK's *advanced* path for power users who want a non-NFT vault.
- Rationale: A is a direct Technical-track artifact ("composable vault systems interacting with other contracts") and the best dashboard demo; B remains available via `core` for flexibility.

## 5. SDK (`@cdr-kit/core`)
Wraps `@piplabs/cdr-sdk`'s `CDRClient`. Responsibilities: `initWasm()` lifecycle; condition encoders (mirror SDK's `conditions.*` but add ours + bundle deployed addresses, unlike the SDK which omits addresses); the **2-step flows** as one call, e.g.:
```ts
await cdr.subscribeAndAccess(uuid, { periods: 1, onProgress })
// 1) write subscribe{value}() → wait receipt
// 2) consumer.accessCDR({ uuid, accessAuxData, timeoutMs: 420_000 }) with progress (≈7 min)
// 3) return plaintext
```
IPFS helper for >1KB payloads (`uploadFile`/`downloadFile`, key under CDR). All addresses from `@cdr-kit/contracts`. No edge runtime.

## 6. React (`@cdr-kit/react`) & Dashboard
`<CdrProvider>` (wagmi + query + wasm + apiUrl). `<VaultGate>` renders gated children or a pay/subscribe/connect CTA. Hooks expose the multi-minute read as explicit status (`paying | collecting-partials | ready`). Dashboard (Next.js, Privy/RainbowKit, Tailwind): create vault, manage subscribers, grant/revoke, **payment/subscription event log** (NOT a "who-decrypted" log — CDR reads hit the precompile and our `view` emits nothing; D11). MVP template = data-marketplace (secrets-vault = Phase 2). Detail: `../context/best-practices/react-sdk-packaging.md`.

## 7. Agent (`@cdr-kit/agent`) — core to the demo
Own viem wallet. `discover()` (CdrKitVault `VaultCreated` events / registry) → `subscribe(uuid)` (2-step) → `access(uuid)` returns plaintext → uses it downstream. Mirrors x402 pay→retry ergonomics but on-chain native (OQ5 resolved: pure on-chain for v1; optional x402 HTTP bridge = stretch).

## 8. Resolved open questions (✅ verified on-chain 2026-05-28)
- OQ1 → `CDR.allocateFee()` = **0** on Aeneid (read at runtime regardless).
- OQ2 → live `LICENSE_READ_CONDITION` = **`0xC0640AD4CF2CaA9914C8e5C44234359a9102f7a3`**; the cdr-demo `0xD429…` address is NOT deployed.
- Interface → **4-param uuid-first confirmed** via bytecode dispatcher (`0x8db3eb17` present, 3-param absent).
- OQ3 → flagship = **vault-management dashboard** (marketplace = MVP template, secrets = Phase 2).
- OQ4 → **own `CdrKitVault`** (Option A); now also mandatory for safe atomic registration (D8). SDK keeps a factory-less path only as discouraged/advanced.
- OQ5 → agent transport **on-chain native** v1; x402 bridge = Phase 2.
- **Still open → E0 fork tests (safe default already taken):** OQ6 does `allocate()` preflight revert on a false/reverting condition? OQ7 does the CDR precompile expose `vaultOwner(uuid)`? Both de-risked by D8 (revert-safe + factory-atomic).

## 9. Cross-cutting risks (encoded in stories' acceptance criteria)
1. Condition interface mismatch → **fork-test a real `allocate→write→read` round-trip on Aeneid** before relying on any condition.
2. ~7-min read latency → every read path has progress UX + long timeouts; never a synchronous hot path.
3. ~1KB inline cap → SDK auto-routes large payloads to `uploadFile`.
4. `view` can't pay → 2-step enforced in SDK + contracts.
5. WASM init → provider handles it; failure surfaces a clear error.
6. Addresses in flux → single source of truth in `@cdr-kit/contracts`, verified on-chain.
