# CDR error catalog

The full taxonomy of `CdrErrorCode`s exposed by `@cdr-kit/core`, plus the upstream SDK error classes they map from. Loaded on demand by `explain-cdr-error` + `debug-cdr-precompile`.

| `CdrErrorCode` | Maps from SDK | `recoverable` | `suggestedAction` |
|---|---|---|---|
| `WASM_NOT_INITIALIZED` | (kit-internal) | yes | `await ensureWasm()` (or use `<CdrProvider>`) before any encrypt/decrypt |
| `WALLET_REQUIRED` | `WalletClientRequiredError` | no | Connect a wallet / pass a privateKey |
| `WRONG_NETWORK` | (kit-internal) | yes | Switch to Story Aeneid (chain 1315) |
| `CONDITION_NOT_MET` | viem revert with condition reason | yes | Satisfy the condition (subscribe / mint license tier), then retry |
| `VAULT_NOT_FOUND` | `EmptyVaultError` | no | Verify the uuid; the seller may not have written data yet |
| `PAYLOAD_TOO_LARGE` | `ContentSizeExceededError` | yes | Use `agent.uploadFile()` — it stores the body off-chain |
| `OUT_OF_GAS` | viem revert / `ReentrancySentryOOG` | yes | Set an explicit gas limit (the SDK does this for `createVault`) |
| `READ_TIMEOUT` | `PartialCollectionTimeoutError` | yes | Retry the read; keeper/validators may be slow |
| `KEEPER_UNAVAILABLE` | network error against Story-API REST | yes | Retry with backoff; verify `CDR_API_URL` |
| `RATE_LIMITED` | HTTP 429 from keeper | yes | Retry after the suggested `retryAfterMs` |
| `LABEL_MISMATCH` | `LabelMismatchError` | no | Regenerate ciphertext with `uuidToLabel(uuid)`; the kit does this automatically in `writeVaultData` |
| `CID_INTEGRITY` | `CidIntegrityError` | no | The IPFS gateway served a tampered/stale blob — retry against a different gateway |
| `INVALID_CONDITION_CONTRACT` | `InvalidConditionContractError` | no | Verify the address points at a deployed condition contract; for owner-only use `allocate()` with `skipConditionValidation: true` |
| `UNKNOWN` | anything not matched | varies | Look at `.cause` for the original error |

## Diagnostic flow

```ts
import { CdrError, mapSdkError } from "@cdr-kit/core";

try {
  await agent.subscribeAndAccess({ uuid, periods: 1n, maxPricePerPeriod, value });
} catch (e) {
  const cdr = mapSdkError(e);
  if (CdrError.is(cdr, "CONDITION_NOT_MET")) {
    // Check entitlement; maybe already subscribed:
    const ent = await agent.getEntitlement(uuid);
    if (ent.isEntitled) return agent.access(uuid); // already paid; just read
  }
  if (cdr.recoverable) { /* retry with backoff */ }
  throw cdr;
}
```
