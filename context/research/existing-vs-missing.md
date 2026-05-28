# Existing vs Missing — the honest landscape (defines the wedge)

The keystone research finding. Read before claiming novelty anywhere.

## What ALREADY exists in `piplabs/cdr-demo` (vendored at `../reference/vendored/cdr-demo-contracts/`)

These are real, working Solidity condition contracts the Story team shipped in their reference demo. Do NOT claim these patterns are unbuilt.

| Contract | What it does | Tests? | Notes |
|---|---|---|---|
| `TimeBasedCondition` | immutable `[startTime, endTime]` window; endTime 0 = open-ended | ❌ | trivial |
| `FixedFeeCondition` | **pay-ONCE** to access + creator `withdraw()`; `hasPaid[uuid][addr]` | ❌ | NOT recurring |
| `WhitelistCondition` | owner-managed allowlist; `add/removeFromWhitelist` | ✅ `.t.sol` | already revocable-ish |
| `DeadManSwitchCondition` | block-timer + `extend()` heartbeat + recipients unlock after expiry | ✅ `.t.sol` | inheritance/whistleblower pattern DONE |
| `MarketplaceWriteCondition` + `DataMarketplace` | listing-owner-gated writes; `setup/upload/purchase/getListing` | ❌ | a marketplace already exists |
| `VaultWriteCondition` | creator-gated writes (used by CDRVaultNFT) | ❌ | |
| `InferenceWriteCondition` + `ConfidentialInference` | TEE-attested inference: `registerModel(feePerQuery, teeImageHash)`, `submitQuery`, result w/ `attestation` | ❌ | "confidential inference" pattern DONE (external TEE + attestation, not in-CDR compute) |
| `DepinWriteCondition` + `DepinBackend` | bounty/DePIN request→response→eval→bounty | ❌ | |
| `CDRVaultNFT` | **atomic** mint ERC721 → register IP → `CDR.allocate` (license-gated read + creator write) → `attachLicenseTerms` → mint license tokens | ❌ | the core vault abstraction already exists |

Reality check: only **2 of ~9** condition contracts have any tests. ABIs are hand-written in one `src/config/contracts.ts`. Addresses are set via ad-hoc env vars. Nothing is an npm package. No React layer. No agent SDK. Most are `view`-gating logic copy-pasted per contract.

`CDRVaultNFT` is the closest thing to cdr-kit's "create a vault" — study it (vendored). It hardcodes: license-gated read, a default *non-commercial transferable* PIL term, and holds all NFTs itself to stay IP owner. cdr-kit generalizes: pluggable read condition, configurable PIL tiers, ownership options.

## What's GENUINELY MISSING (= the build list / the wedge)

### A. Net-new condition contracts (no equivalent exists)
1. **`SubscriptionCondition`** — recurring + auto-expiry. (`FixedFeeCondition` is pay-once; Story has no native per-token expiry → we keep `mapping(address => uint256) paidUntil`, renewable.)
2. **`TierGateCondition`** — gate by *which* license tier. Feasible: `LicenseToken.getLicenseTermsId(tokenId)` is a view (see `story-ip-royalty.md`). The Story-IP-coupling moat Lit/TACo can't replicate.
3. **`RevocableCondition`** — clean revoke. Feasible: `LicenseToken.isLicenseTokenRevoked(tokenId)` view + owner-controlled flag.
4. **`MultiSigCondition`** — k-of-n approval to unlock (verify sigs in `accessAuxData`).
5. **`ComposableCondition`** — boolean AND/OR over other condition contracts (composability = the Technical-track judging criterion by name).

### B. The DX layer (100% net-new — the actual product)
- `@cdr-kit/contracts` — Foundry contracts + generated typed bindings/ABIs/addresses (via `@wagmi/cli`).
- `@cdr-kit/core` — typed TS SDK wrapping CDRClient + condition encoders + the 2-step flows + IPFS helpers + `initWasm` handling.
- `@cdr-kit/react` — `<CdrProvider>`, `<VaultGate>`, `useVault`, `useSubscription`, etc. (peer-deps wagmi/viem/react).
- `@cdr-kit/agent` — autonomous read/write for agents (own wallet, discover→pay→pull).
- Dashboard app + templates (data-marketplace, secrets-vault).

## The risk to manage (state it in the pitch)
A lazy judge could call cdr-kit "a repackage of your demo." Mitigations, baked in:
1. Ship genuinely new conditions (A1–A5 above).
2. The React/agent/dashboard DX is entirely new.
3. Frame to DevRel: *"we did the productization so your ecosystem grows"* — what a protocol team actually wants. Make this framing explicit in PRD + README + the demo narrative.

## Adjacent ideas now KNOWN to be already-done (don't pitch as novel)
- Dead-man's vault → `DeadManSwitchCondition` exists.
- Pay-to-access marketplace → `DataMarketplace` exists.
- Confidential/TEE inference → `ConfidentialInference` exists (attestation-based).
- Time-locked reveal → `TimeBasedCondition` exists.
