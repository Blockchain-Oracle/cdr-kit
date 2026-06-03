<!-- Source-of-truth lives at packages/plugin/cdr-kit/skills/debug-cdr-precompile/SKILL.md — keep these synchronized when editing. -->
---
name: debug-cdr-precompile
description: Diagnose CDR precompile failures and reverts. Use this skill when (1) a CDR transaction reverts with OOG / ReentrancySentryOOG / AlreadyConfigured; (2) a read hangs or partial-collection times out; (3) the user hits "WASM not initialized" / LabelMismatch / ContentSizeExceeded; (4) checkReadCondition returns false on a uuid the user thinks should pass.
license: MIT
---

# Debug a CDR precompile failure

CDR's on-chain interface is a **precompiled contract** at `0xCCCcCC0000000000000000000000000000000005` with non-standard gas characteristics. Five failure modes account for ~95% of issues. This skill walks each, with the fix.

## When to use

- "My createVault tx reverted with OutOfGas / OOG"
- "I got `ReentrancySentryOOG`"
- "`AlreadyConfigured` error"
- "Read returns empty bytes / hangs forever / partial collection times out"
- "`WASM not initialized` runtime error"
- "Read condition view returns false but I think it should return true"

## Failure mode catalog

### 1. `OutOfGas` / `OOG` on createVault / allocate / read

**Symptom:** Tx reverts with `OutOfGas`, sometimes wrapped as `ReentrancySentryOOG`.

**Root cause:** `eth_estimateGas` does NOT correctly estimate the gas cost of the CDR precompile's nested calls. It returns a value 50-80% too low, and the actual run runs out.

**Fix:**
- If using `@cdr-kit/core`: `createVault` already sets `gas: 3M` (see `packages/core/src/flows.ts`). Don't override.
- If using raw cast/forge: set an explicit `--gas-limit 2000000` or higher. `@cdr-kit/contracts` exports `CDR_GAS_LIMIT = 2_000_000n` as the safe minimum.
- Never trust `eth_estimateGas` for CDR txs.

### 2. `AlreadyConfigured`

**Symptom:** Tx reverts with `AlreadyConfigured` when you call `setConfigFromFactory` or try to re-configure an existing vault.

**Root cause:** CDR vault configs are **factory-only + atomic** (decision-log D1–D5). Once a uuid has a read+write condition set, it cannot be re-set. This is intentional to close a front-run window — never add a permissionless re-register path.

**Fix:** Allocate a new vault (`createVault`). The kit's `CdrKitVault.createVault` allocates + configures in one tx — this is the only correct path.

### 3. Unconfigured uuid → condition view returns `false`

**Symptom:** `checkReadCondition` returns false for a uuid you just allocated, even though the caller satisfies the condition.

**Root cause:** Every condition `view` returns `false` (never reverts) when the uuid hasn't been configured yet. Configuration is part of `createVault`'s atomic tx.

**Fix:**
- Verify the uuid was created via `CdrKitVault.createVault`, not a raw `allocate()` against the precompile.
- `agent.getVaultInfo(uuid)` returns null for never-created uuids — use this as a precondition check.

### 4. `WASM not initialized` runtime error

**Symptom:** `Error: CDR crypto WASM is not initialized` thrown during encrypt or decrypt.

**Root cause:** `@piplabs/cdr-crypto` needs `initWasm()` called once before any TDH2 operation. Forgotten in custom code that reaches around `@cdr-kit/core`.

**Fix:**
- Stay in `@cdr-kit/core`'s flows — they call `ensureWasm()` for you.
- If you must use `@piplabs/cdr-sdk` directly: `import { initWasm } from "@piplabs/cdr-sdk"; await initWasm();` at app startup.
- In React: do this in a top-level effect or provider. `CdrProvider` from `@cdr-kit/react` already handles it.

### 5. `PartialCollectionTimeoutError` / read hangs

**Symptom:** Read promise never resolves; eventually `PartialCollectionTimeoutError` after the timeout.

**Root cause:** Validators didn't return enough partial decryptions before `timeoutMs`. Causes (in order of likelihood):
1. `apiUrl` wrong/unreachable — the SDK polls Story-API REST for partial decryptions
2. Read condition reverted — validators won't produce partials for an unauthorized read
3. Validator network slow / under-quorum
4. `timeoutMs` too low (rare with our 120_000 default)

**Fix:**
- Retry the read (`agent.access(uuid)` again) — first attempt failures are common.
- Verify `apiUrl` — `cdr config` prints the resolved value.
- Verify the condition: `agent.getEntitlement(uuid)` for subscription-gated; for license-gated check `LicenseToken.ownerOf(tokenId) === agent.address` via viem.
- If still failing, bump `timeoutMs`: `agent.access(uuid, accessAuxData)` doesn't expose timeoutMs — drop to the low-level `accessVault(client, { uuid, timeoutMs })` from `@cdr-kit/core`.

### 6. `ContentSizeExceededError`

**Symptom:** `agent.writeVaultData` throws `CONTENT_SIZE_EXCEEDED`.

**Root cause:** Inline payload exceeds the `maxEncryptedDataSize` (1024 bytes on Aeneid; TDH2 overhead reduces effective plaintext to ~960 bytes).

**Fix:** Use `agent.uploadFile({ content, addUrl, gatewayUrl })` — encrypts + IPFS-pins + writes only the CID+key reference (small) to the vault.

### 7. `LabelMismatchError`

**Symptom:** Decryption fails with `LABEL_MISMATCH`.

**Root cause:** Ciphertext was encrypted with a label that doesn't match the vault's uuid. Labels bind ciphertext to its vault.

**Fix:** Use `uuidToLabel(uuid)` from `@piplabs/cdr-sdk` when constructing labels — but `@cdr-kit/core`'s `writeVaultData` does this automatically. Don't roll your own.

## CLI alternatives

- `cdr fees` — verify `apiUrl` reachability (this call goes through Story-API REST)
- `cdr vault info <uuid>` — confirm a uuid is created and inspect its condition
- `cdr access <uuid> --json` — get the typed error structure on failure

## Where to look next

- `wire-allocate-pay-read` — the canonical 4-step flow that avoids most of these errors
- `references/error-catalog.md` — full taxonomy of `CdrErrorCode`s + the SDK error they map from
- `https://docs.story.foundation/developers/cdr-sdk/encrypt-and-decrypt` — the error class table in the docs
