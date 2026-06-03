---
"@cdr-kit/forms": patch
---

`storeFormSubmission` no longer requires a storage adapter for small payloads.

The form-submit endpoint of the scaffolder template was unconditionally routing through `uploadFile` (IPFS) even for tiny ~250-byte JSON submissions, which forced consumers to set up Pinata/Supabase/etc. just to send 3 form fields. End-to-end testing surfaced this — Pinata DNS hiccups dropped the whole submission.

Now:
- Payloads ≤1KB write directly through the CDR precompile via `writeVaultData`. No `storage` parameter needed.
- Payloads >1KB still need a `CdrStorageProvider` adapter (passed via `storage`). An explicit error tells you to add one.
- Default read condition switched from OpenCondition to TimeWindowCondition(1, 0, false) — the same always-open gate the starter template uses (OpenCondition is deployed but currently can't be configured via the factory).
- `storeFormSubmission` returns `{ vaultId, cid: string | null, txHashes: { create, write } }`. `cid` is `null` for small-payload direct writes.
- `readFormSubmission` accepts an optional `storage` adapter — only needed if the original write used one.
