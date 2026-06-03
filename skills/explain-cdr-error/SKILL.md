<!-- Source-of-truth lives at packages/plugin/cdr-kit/skills/explain-cdr-error/SKILL.md — keep these synchronized when editing. -->
---
name: explain-cdr-error
description: Translate a raw CDR error (SDK class name, error code, viem revert string, stack trace) into root cause + fix. Use this skill when (1) the user pastes any error blob involving cdr-kit / @piplabs/cdr-sdk / the CDR precompile (0xC...05) or DKG precompile (0xC...04); (2) a CDR call returned { error: { code, message } } over MCP; (3) a test or runtime failure mentions CdrError / WalletClientRequiredError / LabelMismatchError / ContentSizeExceededError / PartialCollectionTimeoutError; (4) the user wants the resolution playbook for a specific CdrErrorCode.
license: MIT
---

# Explain a CDR error

Paste any CDR error message, stack trace, viem revert string, or `@piplabs/cdr-sdk` class name and get back the root cause + the fix. Companion to `debug-cdr-precompile` (which covers the 7 most common failure modes in depth); this skill is the lookup table.

## When to use

- The user pastes a stack trace or `Error: X` message
- A CDR call returned `{ error: { code: "X", message: "..." } }` over MCP
- A test failure mentions a `CdrError`, `WalletClientRequiredError`, `LabelMismatchError`, etc.

## The taxonomy

`@cdr-kit/core` exports `CdrError` with a `code` field. Errors from `@piplabs/cdr-sdk` are mapped via `mapSdkError()`. Match the user's input against this table:

| Error / code | What it means | Fix |
|---|---|---|
| `WASM_NOT_INITIALIZED` | `initWasm()` was never called | `await ensureWasm()` (or use `<CdrProvider>`) before any encrypt/decrypt |
| `WALLET_REQUIRED` / `WALLET_CLIENT_REQUIRED` / `WalletClientRequiredError` | Trying to write/decrypt without a wallet client | Set `CDR_PRIVATE_KEY` env, or pass `privateKey` to `createCdrKitClient()` / `new CdrAgent()` |
| `WRONG_NETWORK` | Connected wallet is on a different chain than the SDK expects | Switch to Story Aeneid (chain 1315) in the wallet |
| `CONDITION_NOT_MET` | Read/write condition rejected the caller | Satisfy the condition first (subscribe, mint license, hold tier token); check `agent.getEntitlement(uuid)` to verify |
| `VAULT_NOT_FOUND` / `EMPTY_VAULT` / `EmptyVaultError` | Reading a uuid that was never written to | Confirm uuid via `agent.getVaultInfo(uuid)` (returns `null` for unknown uuids) |
| `PAYLOAD_TOO_LARGE` / `CONTENT_SIZE_EXCEEDED` / `ContentSizeExceededError` | Inline payload > 1024 bytes (effective ~960 plaintext after TDH2) | Use `agent.uploadFile({ content, addUrl, gatewayUrl })` for the file path |
| `OUT_OF_GAS` / `ReentrancySentryOOG` | CDR precompile call OOG under `eth_estimateGas` | Set explicit `gas: 3M` (the kit does this for `createVault`); for raw cast: `--gas-limit 2000000`+ |
| `READ_TIMEOUT` / `PARTIAL_COLLECTION_TIMEOUT` / `PartialCollectionTimeoutError` | Validators didn't return enough partial decryptions in time | Retry; verify `apiUrl` (`cdr config`); confirm condition passes (`agent.getEntitlement(uuid)`); bump `timeoutMs` via low-level `accessVault` |
| `KEEPER_UNAVAILABLE` | Story-API REST endpoint unreachable | Retry with backoff; verify `CDR_API_URL` env (default `http://172.192.41.96:1317`) |
| `RATE_LIMITED` | Hit the keeper's rate limit | Retry with backoff per the suggested `retryAfterMs` |
| `LABEL_MISMATCH` / `LabelMismatchError` | Ciphertext label doesn't bind to the vault uuid | Use `uuidToLabel(uuid)` (the kit does this automatically in `writeVaultData`); don't construct labels by hand |
| `CID_INTEGRITY` / `CidIntegrityError` | Downloaded file from IPFS doesn't match the on-chain CID | Try a different gateway (default `https://w3s.link`); the original gateway may have served stale/tampered data |
| `INVALID_CONDITION_CONTRACT` / `InvalidConditionContractError` | `readConditionAddr` doesn't implement `checkReadCondition` | Use a deployed condition from `@cdr-kit/contracts.aeneid`; for EOA conditions use `allocate()` low-level with `skipConditionValidation: true` |
| `AlreadyConfigured` (Solidity revert) | Tried to re-configure an already-configured uuid | Allocate a NEW vault; CDR configs are factory-only + atomic by design |
| `UNKNOWN` | Generic wrapped error | Look at `.cause` for the original SDK/viem error |

## Resolution playbook

```
Did the error happen…
├─ During encrypt/decrypt?         → likely WASM_NOT_INITIALIZED or LABEL_MISMATCH
├─ During allocate/createVault?    → likely OUT_OF_GAS or AlreadyConfigured
├─ During subscribe/pay?           → check value === maxPricePerPeriod * periods; viem revert wraps the on-chain reason
├─ During access/read?             → likely CONDITION_NOT_MET (check entitlement) or PARTIAL_COLLECTION_TIMEOUT
├─ During upload/download (file)?  → likely CID_INTEGRITY or storage HTTP error
└─ At import / construction?       → likely WALLET_CLIENT_REQUIRED or INVALID_CONDITION_CONTRACT
```

## Use the CLI to diagnose

- `cdr config` — prints resolved network, RPC, API URL, wallet path (rules out env mis-config)
- `cdr wallet` — prints address + balance (rules out unfunded-wallet)
- `cdr fees` — pings Story-API (rules out unreachable apiUrl)
- `cdr vault info <uuid>` — view-only check of vault state + your entitlement (rules out CONDITION_NOT_MET, VAULT_NOT_FOUND)

## Anti-patterns to flag

- Catching the error and continuing silently. Every code has a fix; never swallow.
- Retrying without checking the code. Only `READ_TIMEOUT`, `KEEPER_UNAVAILABLE`, `RATE_LIMITED` are retry-friendly (`recoverable: true` on the CdrError).
- Hand-encoding `accessAuxData` for license-gated reads. Use `agent.accessLicenseGated({ uuid, licenseTokenId })` — it encodes correctly.

## See also

- `debug-cdr-precompile` — deeper walks of the 7 most common failures
- `references/error-catalog.md` — every code with full `suggestedAction` text
- `wire-allocate-pay-read` — the canonical flow that avoids 80% of these
